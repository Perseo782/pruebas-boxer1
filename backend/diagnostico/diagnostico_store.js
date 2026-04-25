(function initDiagnosticoStore(globalScope) {
  "use strict";

  var formatter = typeof require === "function"
    ? require("./diagnostico_formatter.js")
    : (globalScope && globalScope.Fase11DiagnosticoFormatter);
  var cleanup = typeof require === "function"
    ? require("./diagnostico_cleanup.js")
    : (globalScope && globalScope.Fase11DiagnosticoCleanup);

  var DEFAULT_CASE_ID = "fase11_sin_caso";
  var STORAGE_KEY = "fase11_diagnostico_actual_v1";

  function makeId(prefix) {
    return String(prefix || "diag") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function createDiagnosticoStore(options) {
    var safeOptions = options || {};
    var maxEvents = Math.max(1, Math.floor(Number(safeOptions.maxEvents || cleanup.DEFAULT_MAX_EVENTS)));
    var ttlMs = Math.max(1000, Math.floor(Number(safeOptions.ttlMs || cleanup.DEFAULT_TTL_MS)));
    var persisted = readPersisted();
    var state = persisted ? {
      caseId: String(persisted.caseId || DEFAULT_CASE_ID),
      status: String(persisted.status || "idle"),
      openedAt: persisted.openedAt || null,
      closedAt: persisted.closedAt || null,
      events: Array.isArray(persisted.events) ? persisted.events : []
    } : {
      caseId: DEFAULT_CASE_ID,
      status: "idle",
      openedAt: null,
      closedAt: null,
      events: []
    };

    function readPersisted() {
      try {
        if (!globalScope || !globalScope.localStorage) return null;
        var raw = globalScope.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
      } catch (errRead) {
        return null;
      }
    }

    function writePersisted() {
      try {
        if (!globalScope || !globalScope.localStorage) return;
        globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
      } catch (errWrite) {
        // No-op.
      }
    }

    function removePersisted() {
      try {
        if (globalScope && globalScope.localStorage) globalScope.localStorage.removeItem(STORAGE_KEY);
      } catch (errRemove) {
        // No-op.
      }
    }

    function prune(nowMs) {
      state.events = cleanup.pruneEvents(state.events, {
        maxEvents: maxEvents,
        ttlMs: ttlMs,
        nowMs: nowMs
      });
    }

    function openCase(input) {
      var safe = input || {};
      state.caseId = String(safe.caseId || "").trim() || makeId("fase11_case");
      state.status = "open";
      state.openedAt = new Date().toISOString();
      state.closedAt = null;
      state.events = [];
      if (safe.message) {
        addEvent({
          level: "INFO",
          module: safe.module || "Fase 11",
          action: safe.action || "abrir caso",
          message: safe.message
        });
      }
      writePersisted();
      return snapshot();
    }

    function ensureOpen() {
      if (state.status === "open") return;
      openCase({ caseId: makeId("fase11_case"), message: "Caso tecnico iniciado." });
    }

    function addEvent(event) {
      ensureOpen();
      var safe = event || {};
      var now = Date.now();
      state.events.push({
        eventId: String(safe.eventId || "").trim() || makeId("evt"),
        createdAt: new Date(now).toISOString(),
        createdAtMs: now,
        level: formatter.normalizeText(safe.level, "INFO").toUpperCase(),
        module: formatter.normalizeText(safe.module, "Sistema"),
        action: formatter.normalizeText(safe.action, "evento"),
        message: formatter.normalizeText(safe.message, "Sin detalle."),
        rawDetail: formatter.truncateDiagnosticText ? formatter.truncateDiagnosticText(safe.rawDetail || "") : String(safe.rawDetail || ""),
        durationMs: Number.isFinite(Number(safe.durationMs)) ? Number(safe.durationMs) : null
      });
      prune(now);
      writePersisted();
      return snapshot();
    }

    function closeCase(input) {
      var safe = input || {};
      if (state.status !== "open") return snapshot();
      if (safe.message) {
        addEvent({
          level: safe.level || "INFO",
          module: safe.module || "Fase 11",
          action: safe.action || "cerrar caso",
          message: safe.message,
          durationMs: safe.durationMs
        });
      }
      state.status = "closed";
      state.closedAt = new Date().toISOString();
      prune(Date.now());
      writePersisted();
      return snapshot();
    }

    function clear() {
      state.caseId = DEFAULT_CASE_ID;
      state.status = "idle";
      state.openedAt = null;
      state.closedAt = null;
      state.events = [];
      removePersisted();
      return snapshot();
    }

    function snapshot() {
      prune(Date.now());
      return {
        caseId: state.caseId,
        status: state.status,
        openedAt: state.openedAt,
        closedAt: state.closedAt,
        events: state.events.slice()
      };
    }

    function buildCopyText() {
      return formatter.formatSnapshot(snapshot());
    }

    return {
      openCase: openCase,
      addEvent: addEvent,
      closeCase: closeCase,
      clear: clear,
      snapshot: snapshot,
      buildCopyText: buildCopyText
    };
  }

  var defaultStore = createDiagnosticoStore();
  var api = {
    createDiagnosticoStore: createDiagnosticoStore,
    getDefaultStore: function getDefaultStore() { return defaultStore; }
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (globalScope) globalScope.Fase11DiagnosticoStore = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
