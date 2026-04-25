import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAfter,
  serverTimestamp,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  listAll,
  getMetadata,
  getBlob,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";
import {
  getAuth,
  signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

(function initFirebaseBootstrapFase3(globalScope) {
  "use strict";

  var TOKEN_STORAGE_KEY = "fase5_visible_session_token";
  var BACKEND_STORAGE_KEY = "fase5_visible_backend_url";
  var DEFAULT_BACKEND_URL = "https://europe-west1-project-a6f6b968-a591-4b1f-823.cloudfunctions.net/api";

  function emitReady() {
    try {
      globalScope.dispatchEvent(new CustomEvent("fase3-firebase-ready"));
    } catch (err) {
      // No-op para entornos sin CustomEvent.
    }
  }

  try {
    var cfg = globalScope.Fase3FirebaseConfig || null;
    if (!cfg || !cfg.projectId || !cfg.appId) {
      globalScope.Fase3FirebaseRuntime = {
        ok: false,
        errorCode: "FIREBASE_CONFIG_FALTANTE",
        message: "No se encontro Fase3FirebaseConfig."
      };
      emitReady();
      return;
    }

    var app = getApps().length > 0 ? getApp() : initializeApp(cfg);
    var auth = getAuth(app);
    var authState = {
      ready: false,
      ok: false,
      uid: null,
      sessionToken: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      lastSignInAt: null
    };

    function readStorageValue(key) {
      try {
        if (globalScope.localStorage) {
          var localValue = String(globalScope.localStorage.getItem(key) || "");
          if (localValue) return localValue;
        }
        if (key === TOKEN_STORAGE_KEY && globalScope.sessionStorage) {
          return String(globalScope.sessionStorage.getItem("alergenos_session_token") || "");
        }
        return "";
      } catch (errStorage) {
        return "";
      }
    }

    function readSessionToken() {
      return readStorageValue(TOKEN_STORAGE_KEY).trim();
    }

    function readBackendUrl() {
      return readStorageValue(BACKEND_STORAGE_KEY).trim() || DEFAULT_BACKEND_URL;
    }

    function failAuth(errorCode, message) {
      authState.ready = true;
      authState.ok = false;
      authState.uid = null;
      authState.sessionToken = readSessionToken() || null;
      authState.lastErrorCode = String(errorCode || "FIREBASE_AUTH_FAILED");
      authState.lastErrorMessage = String(message || "No se pudo autenticar Firebase.");
      return {
        ok: false,
        errorCode: authState.lastErrorCode,
        message: authState.lastErrorMessage
      };
    }

    function normalizeBackendPayload(raw) {
      var safe = raw && typeof raw === "object" ? raw : {};
      if (safe.resultado && typeof safe.resultado === "object") {
        return Object.assign({}, safe.resultado, {
          ok: safe.ok === true && safe.resultado.ok !== false
        });
      }
      return safe;
    }

    async function requestFirebaseCustomToken(sessionToken) {
      var backendUrl = readBackendUrl();
      if (!backendUrl) {
        return failAuth("FIREBASE_BACKEND_URL_FALTANTE", "Falta URL backend para autenticar Firebase.");
      }

      if (typeof fetch !== "function") {
        return failAuth("FIREBASE_FETCH_NO_DISPONIBLE", "Este navegador no soporta fetch.");
      }

      try {
        var response = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduloOrigen: "Web_Operativa",
            moduloDestino: "Seguridad",
            accion: "emitirTokenFirebase",
            payload: { sessionToken: sessionToken }
          })
        });
        var payloadRaw = await response.json().catch(function onJsonErr() { return {}; });
        var payload = normalizeBackendPayload(payloadRaw);
        if (!response.ok || !payload || payload.ok !== true) {
          return failAuth(
            (payload && payload.errorCode) || "FIREBASE_BACKEND_TOKEN_FAILED",
            (payload && (payload.error || payload.message)) || "No se pudo pedir token Firebase al backend."
          );
        }
        if (!payload.firebaseCustomToken) {
          return failAuth("FIREBASE_CUSTOM_TOKEN_FALTANTE", "Backend no devolvio token Firebase.");
        }
        return {
          ok: true,
          firebaseCustomToken: String(payload.firebaseCustomToken || ""),
          firebaseUid: String(payload.firebaseUid || "")
        };
      } catch (errRequest) {
        return failAuth(
          "FIREBASE_BACKEND_TOKEN_REQUEST_FAILED",
          errRequest && errRequest.message ? errRequest.message : "No se pudo pedir token Firebase."
        );
      }
    }

    async function ensureFirebaseAuth(options) {
      var safeOptions = options || {};
      var sessionToken = String(safeOptions.sessionToken || readSessionToken()).trim();
      if (!sessionToken) {
        return failAuth("FIREBASE_SESSION_TOKEN_FALTANTE", "No hay token de sesion para autenticar Firebase.");
      }

      var force = safeOptions.force === true;
      if (!force && auth.currentUser && authState.sessionToken === sessionToken && authState.ok === true) {
        return {
          ok: true,
          uid: String(auth.currentUser.uid || authState.uid || "")
        };
      }

      var requested = await requestFirebaseCustomToken(sessionToken);
      if (!requested || requested.ok !== true) return requested;

      try {
        var signed = await signInWithCustomToken(auth, requested.firebaseCustomToken);
        var uid = signed && signed.user && signed.user.uid ? String(signed.user.uid) : String(requested.firebaseUid || "");
        authState.ready = true;
        authState.ok = true;
        authState.uid = uid || null;
        authState.sessionToken = sessionToken;
        authState.lastErrorCode = null;
        authState.lastErrorMessage = null;
        authState.lastSignInAt = new Date().toISOString();
        return { ok: true, uid: authState.uid };
      } catch (errSignIn) {
        return failAuth(
          "FIREBASE_AUTH_SIGNIN_FAILED",
          errSignIn && errSignIn.message ? errSignIn.message : "No se pudo iniciar sesion Firebase."
        );
      }
    }

    function waitForAuth(sessionToken) {
      return ensureFirebaseAuth({
        sessionToken: String(sessionToken || "").trim() || readSessionToken()
      });
    }

    var authReadyPromise = ensureFirebaseAuth().catch(function onAuthInitErr(err) {
      return failAuth("FIREBASE_AUTH_INIT_FAILED", err && err.message ? err.message : "No se pudo iniciar Firebase Auth.");
    });

    globalScope.Fase3FirebaseRuntime = {
      ok: true,
      app: app,
      auth: auth,
      authState: authState,
      getSessionToken: readSessionToken,
      getBackendUrl: readBackendUrl,
      waitForAuth: waitForAuth,
      authReadyPromise: authReadyPromise,
      firestoreModule: {
        getFirestore: getFirestore,
        collection: collection,
        deleteDoc: deleteDoc,
        doc: doc,
        getDoc: getDoc,
        getDocs: getDocs,
        limit: limit,
        onSnapshot: onSnapshot,
        orderBy: orderBy,
        query: query,
        setDoc: setDoc,
        startAfter: startAfter,
        serverTimestamp: serverTimestamp,
        where: where,
        writeBatch: writeBatch
      },
      storageModule: {
        getStorage: getStorage,
        ref: ref,
        uploadString: uploadString,
        getDownloadURL: getDownloadURL,
        listAll: listAll,
        getMetadata: getMetadata,
        getBlob: getBlob,
        deleteObject: deleteObject
      }
    };
  } catch (err) {
    globalScope.Fase3FirebaseRuntime = {
      ok: false,
      errorCode: "FIREBASE_BOOTSTRAP_FAILED",
          message: err && err.message ? err.message : "Fallo inicializando Firebase."
    };
  }

  emitReady();
})(typeof globalThis !== "undefined" ? globalThis : window);
