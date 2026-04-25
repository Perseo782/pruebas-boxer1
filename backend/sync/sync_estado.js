(function initFase8SyncEstadoModule(globalScope) {
  "use strict";

  var STORAGE_KEY = "fase8_sync_estado_v1";

  function canUseStorage(storage) {
    return !!(
      storage &&
      typeof storage.getItem === "function" &&
      typeof storage.setItem === "function"
    );
  }

  function resolveStorage(explicitStorage) {
    if (explicitStorage) return explicitStorage;
    try {
      if (globalScope && globalScope.localStorage) return globalScope.localStorage;
    } catch (errStorage) {
      return null;
    }
    return null;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function defaultState() {
    return {
      ok: true,
      mode: "normal",
      inFlight: false,
      pending: 0,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      lastSyncAt: null,
      lastCursor: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      updatedAt: nowIso()
    };
  }

  function readState(options) {
    var safeOptions = options || {};
    var storage = resolveStorage(safeOptions.storage);
    if (!canUseStorage(storage)) return defaultState();

    try {
      var raw = String(storage.getItem(STORAGE_KEY) || "").trim();
      if (!raw) return defaultState();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return defaultState();
      return Object.assign(defaultState(), parsed, { updatedAt: nowIso() });
    } catch (err) {
      return defaultState();
    }
  }

  function writeState(patch, options) {
    var safeOptions = options || {};
    var storage = resolveStorage(safeOptions.storage);
    var current = readState({ storage: storage });
    var next = Object.assign({}, current, patch || {}, { updatedAt: nowIso() });

    if (canUseStorage(storage)) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (errWrite) {
        // No-op.
      }
    }

    return next;
  }

  function resetState(options) {
    var storage = resolveStorage(options && options.storage);
    var next = defaultState();
    if (canUseStorage(storage)) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (errReset) {
        // No-op.
      }
    }
    return next;
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    defaultState: defaultState,
    readState: readState,
    writeState: writeState,
    resetState: resetState
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase8SyncEstado = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
