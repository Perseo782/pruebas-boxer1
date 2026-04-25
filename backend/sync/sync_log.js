(function initFase8SyncLogModule(globalScope) {
  "use strict";

  var COLLECTION_NAME = "sync_diagnostico";
  var MAX_GLOBAL_ITEMS = 200;

  function safeCode(err, fallback) {
    if (err && typeof err.code === "string" && err.code.trim()) return err.code.trim();
    if (err && typeof err.errorCode === "string" && err.errorCode.trim()) return err.errorCode.trim();
    return fallback;
  }

  function safeMessage(err, fallback) {
    if (err && typeof err.message === "string" && err.message.trim()) return err.message.trim();
    return fallback;
  }

  function sanitizeId(value) {
    return String(value || "")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 200);
  }

  function fnv1a(value) {
    var text = String(value || "");
    var hash = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
    return ("00000000" + hash.toString(16)).slice(-8);
  }

  function hashToken(token) {
    var safe = String(token || "").trim();
    if (!safe) return null;
    return "h_" + fnv1a(safe);
  }

  function createSyncLog(options) {
    var safeOptions = options || {};
    var firestoreModule = safeOptions.firestoreModule || null;
    var firebaseApp = safeOptions.firebaseApp || null;
    var collectionName = sanitizeId(safeOptions.collectionName || COLLECTION_NAME) || COLLECTION_NAME;

    if (!firestoreModule || typeof firestoreModule.getFirestore !== "function") {
      return {
        ok: false,
        errorCode: "SYNC_LOG_SDK_NO_CONFIGURADO",
        message: "Falta modulo de Firestore para diagnostico."
      };
    }

    var getFirestore = firestoreModule.getFirestore;
    var collectionFn = firestoreModule.collection;
    var queryFn = firestoreModule.query;
    var orderByFn = firestoreModule.orderBy;
    var limitFn = firestoreModule.limit;
    var getDocs = firestoreModule.getDocs;
    var docFn = firestoreModule.doc;
    var setDoc = firestoreModule.setDoc;
    var deleteDoc = firestoreModule.deleteDoc;
    var serverTimestamp = firestoreModule.serverTimestamp;

    if (
      typeof collectionFn !== "function" ||
      typeof queryFn !== "function" ||
      typeof orderByFn !== "function" ||
      typeof limitFn !== "function" ||
      typeof getDocs !== "function" ||
      typeof docFn !== "function" ||
      typeof setDoc !== "function" ||
      typeof deleteDoc !== "function"
    ) {
      return {
        ok: false,
        errorCode: "SYNC_LOG_SDK_INCOMPLETO",
        message: "El modulo de Firestore no expone lectura/escritura completa para diagnostico."
      };
    }

    var db = getFirestore(firebaseApp || undefined);

    async function trimIfNeeded() {
      try {
        var col = collectionFn(db, collectionName);
        var q = queryFn(col, orderByFn("createdAt", "desc"), limitFn(MAX_GLOBAL_ITEMS + 10));
        var snap = await getDocs(q);
        var docs = [];
        snap.forEach(function each(item) {
          docs.push(item);
        });
        if (docs.length <= MAX_GLOBAL_ITEMS) return;

        for (var i = MAX_GLOBAL_ITEMS; i < docs.length; i += 1) {
          await deleteDoc(docs[i].ref);
        }
      } catch (errTrim) {
        // No-op: diagnostico no debe romper sync.
      }
    }

    async function registrarEvento(syncId, sessionToken, tipo, datos) {
      var eventType = String(tipo || "SYNC_EVENT").trim() || "SYNC_EVENT";
      var safeSyncId = sanitizeId(syncId || ("sync_" + Date.now().toString(36))) || ("sync_" + Date.now().toString(36));
      var eventId = safeSyncId + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);

      var payload = {
        eventId: eventId,
        syncId: safeSyncId,
        type: eventType,
        sessionTokenHash: hashToken(sessionToken),
        datos: datos && typeof datos === "object" ? JSON.parse(JSON.stringify(datos)) : {},
        createdAt: typeof serverTimestamp === "function" ? serverTimestamp() : new Date().toISOString()
      };

      try {
        var ref = docFn(db, collectionName, eventId);
        await setDoc(ref, payload, { merge: false });
        await trimIfNeeded();
        return {
          ok: true,
          eventId: eventId
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "SYNC_LOG_WRITE_FAILED"),
          message: safeMessage(err, "No se pudo escribir diagnostico de sync.")
        };
      }
    }

    return {
      ok: true,
      provider: "firestore_sync_diagnostico",
      collectionName: collectionName,
      registrarEvento: registrarEvento
    };
  }

  var api = {
    COLLECTION_NAME: COLLECTION_NAME,
    MAX_GLOBAL_ITEMS: MAX_GLOBAL_ITEMS,
    createSyncLog: createSyncLog
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase8SyncLog = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
