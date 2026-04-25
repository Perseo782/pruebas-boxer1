(function initFase8SyncTombstoneModule(globalScope) {
  "use strict";

  var STORAGE_KEY = "fase8_sync_tombstone_v1";

  function resolveStorage(explicitStorage) {
    if (explicitStorage) return explicitStorage;
    try {
      if (globalScope && globalScope.localStorage) return globalScope.localStorage;
    } catch (errStorage) {
      return null;
    }
    return null;
  }

  function canUseStorage(storage) {
    return !!(
      storage &&
      typeof storage.getItem === "function" &&
      typeof storage.setItem === "function"
    );
  }

  function nowMs() {
    return Date.now();
  }

  function sanitizeId(value) {
    return String(value || "").trim();
  }

  function readMap(options) {
    var storage = resolveStorage(options && options.storage);
    if (!canUseStorage(storage)) return Object.create(null);
    try {
      var raw = String(storage.getItem(STORAGE_KEY) || "").trim();
      if (!raw) return Object.create(null);
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : Object.create(null);
    } catch (err) {
      return Object.create(null);
    }
  }

  function writeMap(map, options) {
    var storage = resolveStorage(options && options.storage);
    if (!canUseStorage(storage)) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
    } catch (err) {
      // No-op.
    }
  }

  function markDeleted(productId, options) {
    var id = sanitizeId(productId);
    if (!id) return null;
    var map = readMap(options);
    map[id] = {
      productId: id,
      deletedAtMs: nowMs()
    };
    writeMap(map, options);
    return map[id];
  }

  function isDeleted(productId, options) {
    var id = sanitizeId(productId);
    if (!id) return false;
    var map = readMap(options);
    return !!map[id];
  }

  function clearDeleted(productId, options) {
    var id = sanitizeId(productId);
    if (!id) return false;
    var map = readMap(options);
    if (!map[id]) return false;
    delete map[id];
    writeMap(map, options);
    return true;
  }

  function cleanup(maxAgeMs, options) {
    var ttl = Math.max(1, Number(maxAgeMs) || (7 * 24 * 60 * 60 * 1000));
    var now = nowMs();
    var map = readMap(options);
    var keys = Object.keys(map);
    var removed = 0;

    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var item = map[key];
      var ts = item && Number(item.deletedAtMs);
      if (!Number.isFinite(ts) || (now - ts) > ttl) {
        delete map[key];
        removed += 1;
      }
    }

    writeMap(map, options);
    return {
      ok: true,
      removed: removed,
      total: Object.keys(map).length
    };
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    markDeleted: markDeleted,
    isDeleted: isDeleted,
    clearDeleted: clearDeleted,
    cleanup: cleanup,
    readMap: readMap
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase8SyncTombstone = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
