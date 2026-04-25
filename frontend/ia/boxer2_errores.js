(function initBoxer2ErroresModule(globalScope) {
  "use strict";

  var contratos = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./boxer2_contratos.js");
    } catch (errRequire) {
      contratos = null;
    }
  }
  if (!contratos && globalScope && globalScope.Boxer2Contratos) {
    contratos = globalScope.Boxer2Contratos;
  }

  var MODULE_NAME = contratos ? contratos.MODULE_NAME : "Boxer2_Identidad";
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
    NOMBRE_NO_DETECTADO: "B2_NOMBRE_NO_DETECTADO",
    IDENTIDAD_VACIA: "B2_IDENTIDAD_VACIA",
    NO_SEGURO: "B2_NO_SEGURO",
    SALIDA_IA_INVALIDA: "B2_SALIDA_IA_INVALIDA",
    SHORTLIST_VACIA: "B2_SHORTLIST_VACIA",
    IDIOMA_NO_RESUELTO: "B2_IDIOMA_NO_RESUELTO",
    CONTRATO_ENTRADA_INVALIDO: "B2_CONTRATO_ENTRADA_INVALIDO"
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
        estadoPasaporteModulo: passport,
        accionSugeridaParaCerebro: safeOptions.suggestedAction || SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        confidence: safeOptions.confidence || CONFIDENCE.BAJA,
        requiereRevision: true,
        datos: safeOptions.datos || {},
        error: {
          code: safeOptions.code || ERROR_CODES.NO_SEGURO,
          origin: safeContext.moduleName || MODULE_NAME,
          passport: passport,
          message: safeOptions.message || "Fallo Boxer2.",
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
    globalScope.Boxer2Errores = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
