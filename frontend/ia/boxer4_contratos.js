(function initBoxer4ContratosModule(globalScope) {
  "use strict";

  var MODULE_NAME = "Boxer4_Alergenos";
  var CONTRACT_VERSION = "BOXER_PLUG_V1";
  var MODULES = Object.freeze({
    CEREBRO: "Cerebro_Orquestador",
    BOXER4: MODULE_NAME
  });
  var ACTIONS = Object.freeze({
    CLASIFICAR_ALERGENOS: "clasificar_alergenos"
  });
  var PASSPORTS = Object.freeze({
    VERDE: "VERDE",
    NARANJA: "NARANJA",
    ROJO: "ROJO"
  });
  var CONFIDENCE = Object.freeze({
    ALTA: "alta",
    MEDIA: "media",
    BAJA: "baja"
  });
  var IA_STATES = Object.freeze({
    NECESITA_LLAMADA: "NECESITA_LLAMADA",
    NO_NECESITA_LLAMADA: "NO_NECESITA_LLAMADA",
    NO_APLICA: "NO_APLICA",
    PENDIENTE_LOCAL: "PENDIENTE_LOCAL"
  });
  var SUGGESTED_ACTIONS = Object.freeze({
    GUARDAR_RESULTADO_ANALIZADO: "guardar_resultado_analizado",
    CONTINUAR_Y_MARCAR_REVISION: "continuar_y_marcar_revision",
    ABRIR_REVISION: "abrir_revision",
    BLOQUEAR_GUARDADO: "bloquear_guardado",
    ABORTAR_FLUJO: "abortar_flujo"
  });

  function asPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeIaState(value) {
    var safe = String(value || "").trim().toUpperCase();
    if (
      safe === IA_STATES.NECESITA_LLAMADA ||
      safe === IA_STATES.NO_NECESITA_LLAMADA ||
      safe === IA_STATES.NO_APLICA ||
      safe === IA_STATES.PENDIENTE_LOCAL
    ) {
      return safe;
    }
    return IA_STATES.NO_NECESITA_LLAMADA;
  }

  function normalizeIncomingRequest(request) {
    var safeRequest = asPlainObject(request) ? request : {};
    var rawMeta = asPlainObject(safeRequest.meta) ? safeRequest.meta : {};
    var rawData = asPlainObject(safeRequest.datos) ? safeRequest.datos : {};

    return {
      moduloOrigen: normalizeText(safeRequest.moduloOrigen),
      moduloDestino: normalizeText(safeRequest.moduloDestino),
      accion: normalizeText(safeRequest.accion),
      sessionToken: normalizeText(safeRequest.sessionToken),
      meta: {
        versionContrato: normalizeText(rawMeta.versionContrato || CONTRACT_VERSION) || CONTRACT_VERSION,
        analysisId: normalizeText(rawMeta.analysisId),
        traceId: normalizeText(rawMeta.traceId),
        batchId: rawMeta.batchId == null ? null : normalizeText(rawMeta.batchId)
      },
      datos: {
        textoAuditado: Object.prototype.hasOwnProperty.call(rawData, "textoAuditado")
          ? String(rawData.textoAuditado || "")
          : undefined,
        textoBaseVision: String(rawData.textoBaseVision || "").trim(),
        lineasOCR: Array.isArray(rawData.lineasOCR) ? rawData.lineasOCR : [],
        bloquesOCR: Array.isArray(rawData.bloquesOCR) ? rawData.bloquesOCR : [],
        metadatosOpcionales: asPlainObject(rawData.metadatosOpcionales) ? rawData.metadatosOpcionales : {},
        roiRefsRevision: Array.isArray(rawData.roiRefsRevision) ? rawData.roiRefsRevision : []
      }
    };
  }

  function validateIncomingRequest(request) {
    var normalized = normalizeIncomingRequest(request);

    if (normalized.moduloOrigen !== MODULES.CEREBRO) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloOrigen debe ser Cerebro_Orquestador.",
        detail: { moduloOrigen: normalized.moduloOrigen || null }
      };
    }
    if (normalized.moduloDestino !== MODULES.BOXER4) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloDestino debe ser Boxer4_Alergenos.",
        detail: { moduloDestino: normalized.moduloDestino || null }
      };
    }
    if (normalized.accion !== ACTIONS.CLASIFICAR_ALERGENOS) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "accion invalida para Boxer4.",
        detail: { accion: normalized.accion || null }
      };
    }
    if (!normalized.sessionToken) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "Falta sessionToken.",
        detail: {}
      };
    }
    if (normalized.meta.versionContrato !== CONTRACT_VERSION) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "versionContrato invalida.",
        detail: { versionContrato: normalized.meta.versionContrato || null }
      };
    }
    if (!normalized.meta.analysisId || !normalized.meta.traceId) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "analysisId y traceId son obligatorios en Boxer4.",
        detail: {
          analysisId: normalized.meta.analysisId || null,
          traceId: normalized.meta.traceId || null
        }
      };
    }
    if (normalized.datos.textoAuditado === undefined) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "Falta datos.textoAuditado.",
        detail: {}
      };
    }

    return {
      ok: true,
      normalized: normalized
    };
  }

  var api = {
    MODULE_NAME: MODULE_NAME,
    CONTRACT_VERSION: CONTRACT_VERSION,
    MODULES: MODULES,
    ACTIONS: ACTIONS,
    PASSPORTS: PASSPORTS,
    CONFIDENCE: CONFIDENCE,
    IA_STATES: IA_STATES,
    SUGGESTED_ACTIONS: SUGGESTED_ACTIONS,
    normalizeIaState: normalizeIaState,
    normalizeIncomingRequest: normalizeIncomingRequest,
    validateIncomingRequest: validateIncomingRequest,
    normalizeText: normalizeText,
    asPlainObject: asPlainObject
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer4Contratos = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
