(function initAppStateGuard(globalScope) {
  "use strict";

  var DEFAULT_ACCESS_PATH = "./acceso.html";
  var APP_STATE_KEY = "fase3_app_state_guard_v1";
  var LAST_KNOWN_GOOD_KEY = "fase3_last_known_good_snapshot_v1";

  var STATES = Object.freeze({
    AUTH_REQUIRED: "AUTH_REQUIRED",
    SESSION_EXPIRED: "SESSION_EXPIRED",
    CLOUD_READ_FAILED: "CLOUD_READ_FAILED",
    REMOTE_EMPTY_CONFIRMED: "REMOTE_EMPTY_CONFIRMED",
    LOCAL_ONLY: "LOCAL_ONLY",
    SYNC_OK: "SYNC_OK",
    SYNC_FAILED: "SYNC_FAILED",
    SYNC_AUTH_REQUIRED: "SYNC_AUTH_REQUIRED"
  });

  function asText(value) {
    return String(value || "").trim();
  }

  function toUpper(value) {
    return asText(value).toUpperCase();
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function getStorage(explicitStorage) {
    if (explicitStorage) return explicitStorage;
    try {
      if (globalScope && globalScope.localStorage) return globalScope.localStorage;
    } catch (errStorage) {
      return null;
    }
    return null;
  }

  function readJson(storage, key) {
    if (!storage || typeof storage.getItem !== "function") return null;
    try {
      var raw = storage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (errRead) {
      return null;
    }
  }

  function writeJson(storage, key, value) {
    if (!storage || typeof storage.setItem !== "function") {
      return { ok: false, errorCode: "STORAGE_NO_DISPONIBLE", message: "Storage no disponible." };
    }
    try {
      storage.setItem(key, JSON.stringify(value || {}));
      return { ok: true };
    } catch (errWrite) {
      return {
        ok: false,
        errorCode: "STORAGE_WRITE_FAILED",
        message: errWrite && errWrite.message ? errWrite.message : "No se pudo guardar estado local."
      };
    }
  }

  function isAuthRequiredError(input) {
    var code = toUpper(input && input.errorCode);
    var message = toUpper(input && input.message);
    if (!code && !message) return false;
    if (code.indexOf("SESSION_TOKEN_FALTANTE") >= 0) return true;
    if (code.indexOf("TOKEN_INVALIDO") >= 0) return true;
    if (code.indexOf("PERMISSION_DENIED") >= 0) return true;
    if (code.indexOf("UNAUTHENTICATED") >= 0) return true;
    if (code.indexOf("AUTH_REQUIRED") >= 0) return true;
    if (message.indexOf("NO HAY TOKEN DE SESION") >= 0) return true;
    if (message.indexOf("SESSIONTOKEN INVALIDO") >= 0) return true;
    if (message.indexOf("SESION NO ENCONTRADA") >= 0) return true;
    if (message.indexOf("SESION REQUERIDA") >= 0) return true;
    return false;
  }

  function isSessionExpiredError(input) {
    var code = toUpper(input && input.errorCode);
    var message = toUpper(input && input.message);
    if (!code && !message) return false;
    if (code.indexOf("EXPIRED") >= 0) return true;
    if (code.indexOf("AUTH_SIGNIN_FAILED") >= 0) return true;
    if (message.indexOf("CADUCAD") >= 0) return true;
    if (message.indexOf("EXPIRED") >= 0) return true;
    if (message.indexOf("SESION NO ENCONTRADA") >= 0) return true;
    if (message.indexOf("SIGN IN") >= 0 && message.indexOf("FIREBASE") >= 0) return true;
    return false;
  }

  function classifyCloudReadFailure(input) {
    if (isSessionExpiredError(input)) return STATES.SESSION_EXPIRED;
    if (isAuthRequiredError(input)) return STATES.AUTH_REQUIRED;
    return STATES.CLOUD_READ_FAILED;
  }

  var currentState = {
    name: STATES.LOCAL_ONLY,
    updatedAt: nowIso(),
    detail: null
  };

  function markState(name, detail, options) {
    var safeName = asText(name) || STATES.LOCAL_ONLY;
    currentState = {
      name: safeName,
      updatedAt: nowIso(),
      detail: detail && typeof detail === "object" ? detail : null
    };
    var storage = getStorage(options && options.storage);
    writeJson(storage, APP_STATE_KEY, currentState);
    return currentState;
  }

  function getCurrentState(options) {
    var storage = getStorage(options && options.storage);
    var persisted = readJson(storage, APP_STATE_KEY);
    if (persisted && persisted.name) {
      currentState = {
        name: asText(persisted.name) || STATES.LOCAL_ONLY,
        updatedAt: asText(persisted.updatedAt) || nowIso(),
        detail: persisted.detail && typeof persisted.detail === "object" ? persisted.detail : null
      };
    }
    return Object.assign({}, currentState);
  }

  function sanitizeReturnUrl(rawReturnUrl) {
    var text = asText(rawReturnUrl);
    if (!text) return "./gestion_registros.html";
    if (text.indexOf("javascript:") === 0) return "./gestion_registros.html";
    if (text.indexOf("data:") === 0) return "./gestion_registros.html";
    try {
      if (globalScope && globalScope.location) {
        var resolved = new URL(text, globalScope.location.href);
        if (resolved.origin !== globalScope.location.origin) return "./gestion_registros.html";
        return resolved.pathname + resolved.search + resolved.hash;
      }
    } catch (errUrl) {
      // No-op.
    }
    if (/^https?:\/\//i.test(text)) return "./gestion_registros.html";
    return text;
  }

  function buildAccessUrl(options) {
    var safeOptions = options || {};
    var accessPath = asText(safeOptions.accessPath) || DEFAULT_ACCESS_PATH;
    var returnUrl = sanitizeReturnUrl(safeOptions.returnUrl);
    var separator = accessPath.indexOf("?") >= 0 ? "&" : "?";
    return accessPath + separator + "returnUrl=" + encodeURIComponent(returnUrl);
  }

  function redirectToAccess(options) {
    var safeOptions = options || {};
    var scope = safeOptions.scope || globalScope;
    if (!scope || !scope.location) return { ok: false, redirected: false };
    var target = buildAccessUrl(safeOptions);
    scope.location.href = target;
    return { ok: true, redirected: true, url: target };
  }

  function requireSessionOrRedirect(options) {
    var safeOptions = options || {};
    var token = asText(safeOptions.sessionToken);
    if (token) {
      markState(STATES.LOCAL_ONLY, { reason: "SESSION_OK" }, safeOptions);
      return { ok: true, status: STATES.LOCAL_ONLY, token: token };
    }
    markState(STATES.AUTH_REQUIRED, { reason: "TOKEN_MISSING" }, safeOptions);
    if (safeOptions.redirect !== false) {
      redirectToAccess(safeOptions);
    }
    return {
      ok: false,
      status: STATES.AUTH_REQUIRED,
      errorCode: STATES.AUTH_REQUIRED,
      message: "Sesion requerida. Inicia sesion."
    };
  }

  function canShowCloudZero(context) {
    var safeContext = context || {};
    if (safeContext.hasSession !== true) return false;
    if (safeContext.remoteReadExecuted !== true) return false;
    if (safeContext.remoteReadOk !== true) return false;
    return Number(safeContext.remoteCount) === 0;
  }

  function canPersistSnapshot(context) {
    var safeContext = context || {};
    var snapshot = safeContext.snapshot && typeof safeContext.snapshot === "object" ? safeContext.snapshot : null;
    if (!snapshot) {
      return { ok: false, allowed: false, errorCode: "SNAPSHOT_INVALIDO" };
    }
    var products = Array.isArray(snapshot.products) ? snapshot.products : [];
    var drafts = Array.isArray(snapshot.drafts) ? snapshot.drafts : [];
    if (products.length > 0 || drafts.length > 0) {
      return { ok: true, allowed: true };
    }
    if (safeContext.forceAllowEmpty === true) {
      return { ok: true, allowed: true, reason: "FORCE_ALLOW_EMPTY" };
    }
    var stateName = asText(safeContext.stateName);
    var hasSession = safeContext.hasSession === true;
    if (hasSession && stateName === STATES.REMOTE_EMPTY_CONFIRMED) {
      return { ok: true, allowed: true, reason: "REMOTE_EMPTY_CONFIRMED" };
    }
    return {
      ok: true,
      allowed: false,
      reason: "EMPTY_BLOCKED",
      stateName: stateName || null
    };
  }

  function noteLastKnownGoodSnapshot(context) {
    var safeContext = context || {};
    var storage = getStorage(safeContext.storage);
    var snapshot = safeContext.snapshot && typeof safeContext.snapshot === "object" ? safeContext.snapshot : null;
    if (!snapshot) return { ok: false, skipped: true, reason: "SNAPSHOT_INVALIDO" };
    var products = Array.isArray(snapshot.products) ? snapshot.products : [];
    var drafts = Array.isArray(snapshot.drafts) ? snapshot.drafts : [];
    if (products.length <= 0 && drafts.length <= 0) {
      return { ok: false, skipped: true, reason: "SNAPSHOT_EMPTY" };
    }
    var payload = {
      confirmed: true,
      updatedAt: nowIso(),
      productCount: products.length,
      draftCount: drafts.length,
      origin: asText(safeContext.origin) || "local",
      remoteConfirmed: safeContext.remoteConfirmed === true,
      snapshotUpdatedAt: asText(snapshot.updatedAt) || null
    };
    return writeJson(storage, LAST_KNOWN_GOOD_KEY, payload);
  }

  function readLastKnownGoodSnapshot(options) {
    return readJson(getStorage(options && options.storage), LAST_KNOWN_GOOD_KEY);
  }

  function markCloudReadFailed(errorLike, options) {
    var status = classifyCloudReadFailure(errorLike || {});
    var message = asText(errorLike && errorLike.message);
    var detail = {
      errorCode: asText(errorLike && errorLike.errorCode) || null,
      message: message || null
    };
    return markState(status, detail, options);
  }

  function markCloudReadSuccess(remoteCount, options) {
    var count = Number(remoteCount);
    if (Number.isFinite(count) && count === 0) {
      return markState(STATES.REMOTE_EMPTY_CONFIRMED, { remoteCount: 0 }, options);
    }
    return markState(STATES.SYNC_OK, { remoteCount: Number.isFinite(count) ? count : null }, options);
  }

  function markSyncAuthRequired(options) {
    return markState(STATES.SYNC_AUTH_REQUIRED, { reason: "SYNC_WITHOUT_SESSION" }, options);
  }

  function markSyncFailed(errorLike, options) {
    var detail = {
      errorCode: asText(errorLike && errorLike.errorCode) || null,
      message: asText(errorLike && errorLike.message) || null
    };
    if (isAuthRequiredError(errorLike)) return markSyncAuthRequired(options);
    if (isSessionExpiredError(errorLike)) return markState(STATES.SESSION_EXPIRED, detail, options);
    return markState(STATES.SYNC_FAILED, detail, options);
  }

  var api = {
    STATES: STATES,
    buildAccessUrl: buildAccessUrl,
    redirectToAccess: redirectToAccess,
    requireSessionOrRedirect: requireSessionOrRedirect,
    classifyCloudReadFailure: classifyCloudReadFailure,
    canShowCloudZero: canShowCloudZero,
    canPersistSnapshot: canPersistSnapshot,
    markState: markState,
    getCurrentState: getCurrentState,
    markCloudReadFailed: markCloudReadFailed,
    markCloudReadSuccess: markCloudReadSuccess,
    markSyncAuthRequired: markSyncAuthRequired,
    markSyncFailed: markSyncFailed,
    noteLastKnownGoodSnapshot: noteLastKnownGoodSnapshot,
    readLastKnownGoodSnapshot: readLastKnownGoodSnapshot,
    sanitizeReturnUrl: sanitizeReturnUrl
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.AppStateGuard = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
