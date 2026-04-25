(function initCerebroVisibleRuntimeModule(globalScope) {
  "use strict";

  var DEFAULT_BACKEND_URL = "https://europe-west1-project-a6f6b968-a591-4b1f-823.cloudfunctions.net/api";
  var TOKEN_STORAGE_KEY = "fase5_visible_session_token";
  var BACKEND_STORAGE_KEY = "fase5_visible_backend_url";
  var LAST_ACTIVITY_STORAGE_KEY = "fase5_visible_last_activity_ts";
  var WARMUP_STATE_STORAGE_KEY = "fase5_visible_warmup_state_v1";
  var WARMUP_SCHEMA_VERSION = "FASE5_VISIBLE_WARMUP_V1";
  var ACTIVITY_WRITE_THROTTLE_MS = 1000;

  function nowMs() {
    return Date.now();
  }

  function safeClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function asPositiveInt(value, fallback) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return fallback;
    return Math.floor(numeric);
  }

  function asNullableText(value) {
    var safe = String(value || "").trim();
    return safe || null;
  }

  function resolveStorage(explicitStorage, scope) {
    if (explicitStorage) return explicitStorage;
    try {
      if (scope && scope.localStorage) return scope.localStorage;
    } catch (errStorage) {
      return null;
    }
    return null;
  }

  function canUseStorage(storage) {
    return !!(
      storage &&
      typeof storage.getItem === "function" &&
      typeof storage.setItem === "function" &&
      typeof storage.removeItem === "function"
    );
  }

  function safeRead(storage, key) {
    if (!canUseStorage(storage)) return "";
    try {
      return String(storage.getItem(key) || "");
    } catch (errRead) {
      return "";
    }
  }

  function safeWrite(storage, key, value) {
    if (!canUseStorage(storage)) return;
    try {
      if (value == null || value === "") {
        storage.removeItem(key);
        return;
      }
      storage.setItem(key, String(value));
    } catch (errWrite) {
      // No-op.
    }
  }

  function safeReadJson(storage, key) {
    var raw = safeRead(storage, key);
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (errParse) {
      return null;
    }
  }

  function safeWriteJson(storage, key, value) {
    if (!canUseStorage(storage)) return;
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (errWrite) {
      // No-op.
    }
  }

  function defaultWarmupState() {
    return {
      schemaVersion: WARMUP_SCHEMA_VERSION,
      status: "IDLE",
      leaseId: null,
      pingCount: 0,
      consecutiveErrors: 0,
      lastWarmupAt: 0,
      lastWarmupStartedAt: 0,
      lastActivityTs: 0,
      lastRealTrafficTs: 0,
      lastServerPingCount: 0,
      nextMinIntervalMs: 0,
      stoppedReason: null,
      backgroundPingDone: false,
      metrics: {
        warmup_started: 0,
        warmup_ping_count: 0,
        warmup_stopped_reason: null,
        time_to_first_photo_ms: null
      },
      updatedAt: new Date().toISOString()
    };
  }

  function normalizeWarmupState(rawState) {
    var base = defaultWarmupState();
    var safe = rawState && typeof rawState === "object" ? rawState : {};
    var metrics = safe.metrics && typeof safe.metrics === "object" ? safe.metrics : {};
    base.status = String(safe.status || base.status).trim() || base.status;
    base.leaseId = asNullableText(safe.leaseId);
    base.pingCount = asPositiveInt(safe.pingCount, base.pingCount);
    base.consecutiveErrors = asPositiveInt(safe.consecutiveErrors, base.consecutiveErrors);
    base.lastWarmupAt = asPositiveInt(safe.lastWarmupAt, base.lastWarmupAt);
    base.lastWarmupStartedAt = asPositiveInt(safe.lastWarmupStartedAt, base.lastWarmupStartedAt);
    base.lastActivityTs = asPositiveInt(safe.lastActivityTs, base.lastActivityTs);
    base.lastRealTrafficTs = asPositiveInt(safe.lastRealTrafficTs, base.lastRealTrafficTs);
    base.lastServerPingCount = asPositiveInt(safe.lastServerPingCount, base.lastServerPingCount);
    base.nextMinIntervalMs = asPositiveInt(safe.nextMinIntervalMs, base.nextMinIntervalMs);
    base.stoppedReason = asNullableText(safe.stoppedReason);
    base.backgroundPingDone = safe.backgroundPingDone === true;
    base.metrics = {
      warmup_started: asPositiveInt(metrics.warmup_started, 0),
      warmup_ping_count: asPositiveInt(metrics.warmup_ping_count, 0),
      warmup_stopped_reason: asNullableText(metrics.warmup_stopped_reason),
      time_to_first_photo_ms: metrics.time_to_first_photo_ms == null ? null : asPositiveInt(metrics.time_to_first_photo_ms, null)
    };
    base.updatedAt = new Date().toISOString();
    return base;
  }

  function mergeWarmupState(currentState, patch) {
    var next = normalizeWarmupState(currentState);
    var safePatch = patch && typeof patch === "object" ? patch : {};
    if (Object.prototype.hasOwnProperty.call(safePatch, "status")) next.status = String(safePatch.status || next.status).trim() || next.status;
    if (Object.prototype.hasOwnProperty.call(safePatch, "leaseId")) next.leaseId = asNullableText(safePatch.leaseId);
    if (Object.prototype.hasOwnProperty.call(safePatch, "pingCount")) next.pingCount = asPositiveInt(safePatch.pingCount, next.pingCount);
    if (Object.prototype.hasOwnProperty.call(safePatch, "consecutiveErrors")) next.consecutiveErrors = asPositiveInt(safePatch.consecutiveErrors, next.consecutiveErrors);
    if (Object.prototype.hasOwnProperty.call(safePatch, "lastWarmupAt")) next.lastWarmupAt = asPositiveInt(safePatch.lastWarmupAt, next.lastWarmupAt);
    if (Object.prototype.hasOwnProperty.call(safePatch, "lastWarmupStartedAt")) next.lastWarmupStartedAt = asPositiveInt(safePatch.lastWarmupStartedAt, next.lastWarmupStartedAt);
    if (Object.prototype.hasOwnProperty.call(safePatch, "lastActivityTs")) next.lastActivityTs = asPositiveInt(safePatch.lastActivityTs, next.lastActivityTs);
    if (Object.prototype.hasOwnProperty.call(safePatch, "lastRealTrafficTs")) next.lastRealTrafficTs = asPositiveInt(safePatch.lastRealTrafficTs, next.lastRealTrafficTs);
    if (Object.prototype.hasOwnProperty.call(safePatch, "lastServerPingCount")) next.lastServerPingCount = asPositiveInt(safePatch.lastServerPingCount, next.lastServerPingCount);
    if (Object.prototype.hasOwnProperty.call(safePatch, "nextMinIntervalMs")) next.nextMinIntervalMs = asPositiveInt(safePatch.nextMinIntervalMs, next.nextMinIntervalMs);
    if (Object.prototype.hasOwnProperty.call(safePatch, "stoppedReason")) next.stoppedReason = asNullableText(safePatch.stoppedReason);
    if (Object.prototype.hasOwnProperty.call(safePatch, "backgroundPingDone")) next.backgroundPingDone = safePatch.backgroundPingDone === true;
    if (safePatch.metrics && typeof safePatch.metrics === "object") {
      next.metrics = {
        warmup_started: Object.prototype.hasOwnProperty.call(safePatch.metrics, "warmup_started") ?
          asPositiveInt(safePatch.metrics.warmup_started, next.metrics.warmup_started) :
          next.metrics.warmup_started,
        warmup_ping_count: Object.prototype.hasOwnProperty.call(safePatch.metrics, "warmup_ping_count") ?
          asPositiveInt(safePatch.metrics.warmup_ping_count, next.metrics.warmup_ping_count) :
          next.metrics.warmup_ping_count,
        warmup_stopped_reason: Object.prototype.hasOwnProperty.call(safePatch.metrics, "warmup_stopped_reason") ?
          asNullableText(safePatch.metrics.warmup_stopped_reason) :
          next.metrics.warmup_stopped_reason,
        time_to_first_photo_ms: Object.prototype.hasOwnProperty.call(safePatch.metrics, "time_to_first_photo_ms") ?
          (safePatch.metrics.time_to_first_photo_ms == null ? null : asPositiveInt(safePatch.metrics.time_to_first_photo_ms, next.metrics.time_to_first_photo_ms)) :
          next.metrics.time_to_first_photo_ms
      };
    }
    next.updatedAt = new Date().toISOString();
    return next;
  }

  function dispatch(scope, detail) {
    if (!scope || typeof scope.dispatchEvent !== "function") return;
    try {
      if (typeof CustomEvent === "function") {
        scope.dispatchEvent(new CustomEvent("fase5-visible-runtime-update", { detail: detail }));
        return;
      }
    } catch (errEvent) {
      // No-op.
    }
  }

  function createVisibleRuntime(options) {
    var safeOptions = options || {};
    var scope = safeOptions.globalScope || globalScope || null;
    var storage = resolveStorage(safeOptions.storage, scope);
    var lastActivityWriteMs = 0;

    function getSessionToken() {
      return safeRead(storage, TOKEN_STORAGE_KEY).trim();
    }

    function setSessionToken(token) {
      var safeToken = String(token || "").trim();
      safeWrite(storage, TOKEN_STORAGE_KEY, safeToken);
      dispatch(scope, { type: "sessionToken", sessionToken: safeToken || null });
      return safeToken;
    }

    function clearSessionToken() {
      safeWrite(storage, TOKEN_STORAGE_KEY, "");
      patchWarmupState({
        status: "STOPPED",
        leaseId: null,
        stoppedReason: "token_limpiado"
      });
      dispatch(scope, { type: "sessionToken", sessionToken: null });
    }

    function getBackendUrl() {
      return safeRead(storage, BACKEND_STORAGE_KEY).trim() || DEFAULT_BACKEND_URL;
    }

    function setBackendUrl(url) {
      var safeUrl = String(url || "").trim() || DEFAULT_BACKEND_URL;
      safeWrite(storage, BACKEND_STORAGE_KEY, safeUrl);
      dispatch(scope, { type: "backendUrl", backendUrl: safeUrl });
      return safeUrl;
    }

    function getAppState() {
      if (!scope || !scope.document) return "foreground";
      return scope.document.hidden ? "background" : "foreground";
    }

    function getLastActivityTs() {
      return asPositiveInt(safeRead(storage, LAST_ACTIVITY_STORAGE_KEY), 0);
    }

    function readWarmupState() {
      return normalizeWarmupState(safeReadJson(storage, WARMUP_STATE_STORAGE_KEY));
    }

    function writeWarmupState(state) {
      var normalized = normalizeWarmupState(state);
      safeWriteJson(storage, WARMUP_STATE_STORAGE_KEY, normalized);
      dispatch(scope, { type: "warmupState", state: safeClone(normalized) });
      return normalized;
    }

    function patchWarmupState(patch) {
      return writeWarmupState(mergeWarmupState(readWarmupState(), patch));
    }

    function resetWarmupState() {
      return writeWarmupState(defaultWarmupState());
    }

    function noteActivity(source, explicitTs) {
      var ts = asPositiveInt(explicitTs, nowMs());
      var current = getLastActivityTs();
      if (!current || ts >= current) {
        if (!lastActivityWriteMs || (ts - lastActivityWriteMs) >= ACTIVITY_WRITE_THROTTLE_MS) {
          safeWrite(storage, LAST_ACTIVITY_STORAGE_KEY, ts);
          lastActivityWriteMs = ts;
        }
        patchWarmupState({
          lastActivityTs: ts,
          stoppedReason: null
        });
      }
      dispatch(scope, {
        type: "activity",
        source: asNullableText(source) || "actividad",
        ts: ts
      });
      return ts;
    }

    function noteWarmupStarted(detail) {
      var state = readWarmupState();
      var safeDetail = detail && typeof detail === "object" ? detail : {};
      return patchWarmupState({
        status: "WARMING",
        leaseId: safeDetail.leaseId || state.leaseId,
        lastWarmupStartedAt: nowMs(),
        stoppedReason: null,
        metrics: {
          warmup_started: state.metrics.warmup_started + 1
        }
      });
    }

    function noteWarmupSuccess(detail) {
      var state = readWarmupState();
      var safeDetail = detail && typeof detail === "object" ? detail : {};
      return patchWarmupState({
        status: "WARMING",
        leaseId: safeDetail.leaseId || state.leaseId,
        pingCount: Object.prototype.hasOwnProperty.call(safeDetail, "pingCount") ?
          asPositiveInt(safeDetail.pingCount, state.pingCount + 1) :
          state.pingCount + 1,
        consecutiveErrors: 0,
        lastWarmupAt: asPositiveInt(safeDetail.lastWarmupAt, nowMs()),
        lastServerPingCount: asPositiveInt(safeDetail.lastServerPingCount, state.lastServerPingCount),
        nextMinIntervalMs: asPositiveInt(safeDetail.nextMinIntervalMs, state.nextMinIntervalMs),
        backgroundPingDone: safeDetail.backgroundPingDone === true,
        stoppedReason: null,
        metrics: {
          warmup_ping_count: state.metrics.warmup_ping_count + 1
        }
      });
    }

    function noteWarmupStop(reason) {
      var safeReason = asNullableText(reason) || "detenido";
      return patchWarmupState({
        status: "STOPPED",
        leaseId: null,
        backgroundPingDone: false,
        stoppedReason: safeReason,
        metrics: {
          warmup_stopped_reason: safeReason
        }
      });
    }

    function noteFirstPhotoIntent() {
      var state = readWarmupState();
      if (state.metrics.time_to_first_photo_ms != null) return state;
      if (!state.lastWarmupStartedAt) return state;
      return patchWarmupState({
        metrics: {
          time_to_first_photo_ms: Math.max(0, nowMs() - state.lastWarmupStartedAt)
        }
      });
    }

    function noteRealTraffic(source, detail) {
      var ts = noteActivity(source || "trafico_real", nowMs());
      var state = readWarmupState();
      var nextPatch = {
        lastRealTrafficTs: ts,
        consecutiveErrors: 0
      };
      if (state.metrics.time_to_first_photo_ms == null && state.lastWarmupStartedAt) {
        nextPatch.metrics = {
          time_to_first_photo_ms: Math.max(0, ts - state.lastWarmupStartedAt)
        };
      }
      var result = patchWarmupState(nextPatch);
      dispatch(scope, {
        type: "realTraffic",
        source: asNullableText(source) || "trafico_real",
        detail: detail || null,
        ts: ts
      });
      return result;
    }

    return {
      DEFAULT_BACKEND_URL: DEFAULT_BACKEND_URL,
      TOKEN_STORAGE_KEY: TOKEN_STORAGE_KEY,
      BACKEND_STORAGE_KEY: BACKEND_STORAGE_KEY,
      LAST_ACTIVITY_STORAGE_KEY: LAST_ACTIVITY_STORAGE_KEY,
      WARMUP_STATE_STORAGE_KEY: WARMUP_STATE_STORAGE_KEY,
      getSessionToken: getSessionToken,
      setSessionToken: setSessionToken,
      clearSessionToken: clearSessionToken,
      getBackendUrl: getBackendUrl,
      setBackendUrl: setBackendUrl,
      getAppState: getAppState,
      getLastActivityTs: getLastActivityTs,
      readWarmupState: readWarmupState,
      writeWarmupState: writeWarmupState,
      patchWarmupState: patchWarmupState,
      resetWarmupState: resetWarmupState,
      noteActivity: noteActivity,
      noteWarmupStarted: noteWarmupStarted,
      noteWarmupSuccess: noteWarmupSuccess,
      noteWarmupStop: noteWarmupStop,
      noteFirstPhotoIntent: noteFirstPhotoIntent,
      noteRealTraffic: noteRealTraffic
    };
  }

  var defaultRuntime = null;
  function getDefaultRuntime() {
    if (!defaultRuntime) {
      defaultRuntime = createVisibleRuntime();
    }
    return defaultRuntime;
  }

  var api = {
    DEFAULT_BACKEND_URL: DEFAULT_BACKEND_URL,
    TOKEN_STORAGE_KEY: TOKEN_STORAGE_KEY,
    BACKEND_STORAGE_KEY: BACKEND_STORAGE_KEY,
    LAST_ACTIVITY_STORAGE_KEY: LAST_ACTIVITY_STORAGE_KEY,
    WARMUP_STATE_STORAGE_KEY: WARMUP_STATE_STORAGE_KEY,
    createVisibleRuntime: createVisibleRuntime,
    getDefaultRuntime: getDefaultRuntime
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase5VisibleRuntime = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
