(function initDiagnosticoEstado(globalScope) {
  "use strict";

  var formatter = typeof require === "function"
    ? require("./diagnostico_formatter.js")
    : (globalScope && globalScope.Fase11DiagnosticoFormatter);

  var COMPONENTS = [
    "Backend",
    "IA",
    "Vision",
    "Sync",
    "Conectividad remota critica",
    "Pendientes de sync"
  ];

  function readSyncState(deps) {
    var safeDeps = deps || {};
    if (safeDeps.syncManager && typeof safeDeps.syncManager.getEstado === "function") {
      return safeDeps.syncManager.getEstado();
    }
    var scope = safeDeps.globalScope || globalScope;
    if (scope && scope.Fase8SyncEstado && typeof scope.Fase8SyncEstado.readState === "function") {
      return scope.Fase8SyncEstado.readState();
    }
    return null;
  }

  function checkBackend(deps) {
    var safeDeps = deps || {};
    if (safeDeps.backendReady === true) {
      return formatter.formatCheck({ component: "Backend", status: "OPERATIVO", detail: "ruta preparada" });
    }
    if (safeDeps.backendReady === false) {
      return formatter.formatCheck({ component: "Backend", status: "ATENCION", detail: "sin respuesta confirmada" });
    }
    return formatter.formatCheck({ component: "Backend", status: "NO_APLICA", detail: "pendiente de prueba controlada" });
  }

  function checkIa(deps) {
    var scope = (deps && deps.globalScope) || globalScope;
    var loaded = !!(scope && (scope.CerebroOrquestador || scope.CerebroBrokerIa || scope.Fase3AltaFotoVisibleApp));
    return formatter.formatCheck({
      component: "IA",
      status: loaded ? "OPERATIVO" : "ATENCION",
      detail: loaded ? "ruta tecnica cargada" : "ruta no confirmada en esta vista"
    });
  }

  function checkVision(deps) {
    var scope = (deps && deps.globalScope) || globalScope;
    var ready = !!(scope && (scope.Fase3AltaFotoVisibleApp || scope.CerebroOrquestador));
    return formatter.formatCheck({
      component: "Vision",
      status: ready ? "OPERATIVO" : "ATENCION",
      detail: ready ? "analisis por foto disponible" : "vision pendiente de prueba controlada"
    });
  }

  function checkSync(deps) {
    var sync = readSyncState(deps);
    if (!sync) return formatter.formatCheck({ component: "Sync", status: "NO_APLICA", detail: "sin estado local disponible" });
    return formatter.formatCheck({
      component: "Sync",
      status: sync.ok === false ? "ATENCION" : "OPERATIVO",
      detail: sync.ok === false ? String(sync.lastErrorCode || "sync con aviso") : "estado local legible"
    });
  }

  function checkRemote(deps) {
    var safeDeps = deps || {};
    var runtime = safeDeps.firebaseRuntime || ((safeDeps.globalScope || globalScope || {}).Fase3FirebaseRuntime);
    var online = typeof navigator === "undefined" || typeof navigator.onLine !== "boolean" ? true : navigator.onLine;
    if (runtime && runtime.ok === true && online) {
      return formatter.formatCheck({ component: "Conectividad remota critica", status: "OPERATIVO", detail: "Firebase listo y red disponible" });
    }
    return formatter.formatCheck({
      component: "Conectividad remota critica",
      status: online ? "ATENCION" : "CAIDO",
      detail: online ? "Firebase no confirmado" : "sin conexion"
    });
  }

  function checkPending(deps) {
    var sync = readSyncState(deps);
    var pending = sync ? Number(sync.pending || 0) : 0;
    return formatter.formatCheck({
      component: "Pendientes de sync",
      status: pending > 0 ? "ATENCION" : "OPERATIVO",
      detail: pending > 0 ? pending + " pendiente(s)" : "sin pendientes"
    });
  }

  function leerEstadoSistema(deps) {
    return [
      checkBackend(deps),
      checkIa(deps),
      checkVision(deps),
      checkSync(deps),
      checkRemote(deps),
      checkPending(deps)
    ];
  }

  var api = {
    COMPONENTS: COMPONENTS,
    leerEstadoSistema: leerEstadoSistema
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (globalScope) globalScope.Fase11DiagnosticoEstado = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
