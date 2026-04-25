(function initBoxer3ErroresModule(globalScope) {
  "use strict";

  var contratos = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./boxer3_contratos.js");
    } catch (errRequire) {
      contratos = null;
    }
  }
  if (!contratos && globalScope && globalScope.Boxer3Contratos) {
    contratos = globalScope.Boxer3Contratos;
  }

  var MODULE_NAME = contratos ? contratos.MODULE_NAME : "Boxer3_PesoFormato";
  var PASSPORTS = contratos ? contratos.PASSPORTS : { VERDE: "VERDE", NARANJA: "NARANJA", ROJO: "ROJO" };
  var CONFIDENCE = contratos ? contratos.CONFIDENCE : { ALTA: "alta", MEDIA: "media", BAJA: "baja" };
  var IA_STATES = contratos ? contratos.IA_STATES : {
    NECESITA_LLAMADA: "NECESITA_LLAMADA",
    NO_NECESITA_LLAMADA: "NO_NECESITA_LLAMADA",
    NO_APLICA: "NO_APLICA",
    PENDIENTE_LOCAL: "PENDIENTE_LOCAL"
  };
  var SUGGESTED_ACTIONS = contratos ? contratos.SUGGESTED_ACTIONS : {
    CONTINUAR_Y_MARCAR_REVISION: "continuar_y_marcar_revision",
    ABRIR_REVISION: "abrir_revision",
    BLOQUEAR_GUARDADO: "bloquear_guardado",
    ABORTAR_FLUJO: "abortar_flujo"
  };

  var ERROR_CODES = Object.freeze({
    FORMATO_VACIO: "B3_FORMATO_VACIO",
    UNIDAD_INVALIDA: "B3_UNIDAD_INVALIDA",
    CONFLICTO_OCR_IA: "B3_CONFLICTO_OCR_IA",
    CONTRATO_ENTRADA_INVALIDO: "B3_CONTRATO_ENTRADA_INVALIDO",
    SUBRESPUESTA_CONTAMINADA: "B3_SUBRESPUESTA_CONTAMINADA",
    TAREA_IA_INVALIDA: "B3_TAREA_IA_INVALIDA",
    TIMEOUT_LOCAL: "B3_TIMEOUT_LOCAL",
    RESULTADO_LOCAL_INCONSISTENTE: "B3_RESULTADO_LOCAL_INCONSISTENTE"
  });

  function buildFailureEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    var passport = String(safeOptions.passport || PASSPORTS.ROJO).trim().toUpperCase() || PASSPORTS.ROJO;
    return {
      modulo: safeContext.moduleName || MODULE_NAME,
      estadoIA: safeOptions.estadoIA || IA_STATES.NO_NECESITA_LLAMADA,
      tareasIA: Array.isArray(safeOptions.tareasIA) ? safeOptions.tareasIA : [],
      resultadoLocal: {
        analysisId: safeContext.analysisId || null,
        traceId: safeContext.traceId || null,
        modulo: safeContext.moduleName || MODULE_NAME,
        estadoPasaporteModulo: passport,
        accionSugeridaParaCerebro: safeOptions.suggestedAction || SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        confidence: safeOptions.confidence || CONFIDENCE.BAJA,
        requiereRevision: true,
        datos: safeOptions.datos || {},
        error: {
          code: safeOptions.code || ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE,
          origin: safeContext.moduleName || MODULE_NAME,
          passport: passport,
          message: safeOptions.message || "Fallo Boxer3.",
          tipoFallo: safeOptions.tipoFallo || "desconocido",
          retryable: !!safeOptions.retryable
        },
        metricas: safeContext.metricas || null
      },
      elapsedMs: Math.max(0, Number(safeContext.elapsedMs) || 0),
      traceId: safeContext.traceId || null
    };
  }

  var api = {
    ERROR_CODES: ERROR_CODES,
    buildFailureEnvelope: buildFailureEnvelope
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer3Errores = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
