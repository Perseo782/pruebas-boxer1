(function initDiagnosticoCleanup(globalScope) {
  "use strict";

  var DEFAULT_MAX_EVENTS = 40;
  var DEFAULT_TTL_MS = 30 * 60 * 1000;

  function nowMs() {
    return Date.now();
  }

  function pruneEvents(events, options) {
    var safeOptions = options || {};
    var maxEvents = Math.max(1, Math.floor(Number(safeOptions.maxEvents || DEFAULT_MAX_EVENTS)));
    var ttlMs = Math.max(1000, Math.floor(Number(safeOptions.ttlMs || DEFAULT_TTL_MS)));
    var now = Number.isFinite(Number(safeOptions.nowMs)) ? Number(safeOptions.nowMs) : nowMs();
    var safeEvents = Array.isArray(events) ? events : [];
    var pruned = safeEvents.filter(function keep(event) {
      var createdAtMs = Number(event && event.createdAtMs || 0);
      return createdAtMs > 0 && now - createdAtMs <= ttlMs;
    });
    if (pruned.length > maxEvents) return pruned.slice(pruned.length - maxEvents);
    return pruned;
  }

  function createDisposerBag() {
    var disposers = [];
    return {
      add: function add(disposer) {
        if (typeof disposer === "function") disposers.push(disposer);
      },
      clear: function clear() {
        while (disposers.length) {
          var disposer = disposers.pop();
          try { disposer(); } catch (err) { /* No-op. */ }
        }
      },
      size: function size() {
        return disposers.length;
      }
    };
  }

  var api = {
    DEFAULT_MAX_EVENTS: DEFAULT_MAX_EVENTS,
    DEFAULT_TTL_MS: DEFAULT_TTL_MS,
    pruneEvents: pruneEvents,
    createDisposerBag: createDisposerBag
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (globalScope) globalScope.Fase11DiagnosticoCleanup = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
