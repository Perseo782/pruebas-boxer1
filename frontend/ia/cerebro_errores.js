(function initCerebroErroresModule(globalScope) {
  "use strict";

  var contratos = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./cerebro_contratos.js");
    } catch (errRequire) {
      contratos = null;
    }
  }
  if (!contratos && globalScope && globalScope.CerebroContratos) {
    contratos = globalScope.CerebroContratos;
  }

  var FAIL_TYPES = contratos ? contratos.FAIL_TYPES : {
    DESCONOCIDO: "desconocido",
    REPARACION_AGOTADA: "reparacion_agotada",
    IRRECUPERABLE_POR_DISENO: "irrecuperable_por_diseno"
  };

  var ERROR_CODES = Object.freeze({
    CONFLICTO_MOTORES: "CER_CONFLICTO_MOTORES",
    DUPLICADO_DUDOSO: "CER_DUPLICADO_DUDOSO",
    ARBITRAJE_IMPOSIBLE: "CER_ARBITRAJE_IMPOSIBLE",
    SALIDA_BOXER_INCOMPATIBLE: "CER_SALIDA_BOXER_INCOMPATIBLE",
    CONTRATO_ENTRADA_INVALIDO: "CER_CONTRATO_ENTRADA_INVALIDO",
    DESTINO_INTERNO_FALLIDO: "CER_DESTINO_INTERNO_FALLIDO",
    REPOSITORIO_PRODUCTOS_NO_DISPONIBLE: "CER_REPOSITORIO_PRODUCTOS_NO_DISPONIBLE",
    TIMEOUT_OPERACION: "CER_TIMEOUT_OPERACION"
  });

  function buildFailureEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    var passport = String(safeOptions.passport || "ROJO").trim().toUpperCase() || "ROJO";

    return {
      ok: false,
      resultado: {
        estadoPasaporteModulo: passport,
        modulo: safeContext.moduleName || "Cerebro_Orquestador",
        accionSugeridaParaCerebro: safeOptions.suggestedAction || "abortar_flujo",
        elapsedMs: Math.max(0, Number(safeContext.elapsedMs) || 0),
        traceId: safeContext.traceId || null,
        datos: safeOptions.datos || {}
      },
      error: {
        code: safeOptions.code || ERROR_CODES.ARBITRAJE_IMPOSIBLE,
        origin: safeContext.moduleName || "Cerebro_Orquestador",
        passport: passport,
        message: safeOptions.message || "Fallo en Cerebro.",
        tipoFallo: safeOptions.tipoFallo || FAIL_TYPES.DESCONOCIDO,
        retryable: !!safeOptions.retryable
      },
      metricas: safeContext.metricas || null
    };
  }

  var api = {
    ERROR_CODES: ERROR_CODES,
    FAIL_TYPES: FAIL_TYPES,
    buildFailureEnvelope: buildFailureEnvelope
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroErrores = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
