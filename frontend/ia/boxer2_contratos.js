(function initBoxer2ContratosModule(globalScope) {
  "use strict";

  var MODULE_NAME = "Boxer2_Identidad";
  var CONTRACT_VERSION = "BOXER_PLUG_V2";
  var LEGACY_CONTRACT_VERSION = "BOXER_PLUG_V1";
  var MODULES = Object.freeze({
    CEREBRO: "Cerebro_Orquestador",
    BOXER2: MODULE_NAME
  });
  var ACTIONS = Object.freeze({
    RESOLVER_IDENTIDAD: "resolver_identidad_producto"
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
  var TASK_DEFINITIONS = Object.freeze({
    IDENTIDAD: {
      TASK_ID: "b2_n01",
      TIPO_TAREA: "B2_IDENTIDAD_V1",
      SCHEMA_ID: "B2_IDENTIDAD_V1"
    }
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

  function normalizeConfidence(value) {
    var safe = String(value || "").trim().toLowerCase();
    if (safe === CONFIDENCE.ALTA || safe === CONFIDENCE.MEDIA || safe === CONFIDENCE.BAJA) return safe;
    return CONFIDENCE.MEDIA;
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

  function normalizeLineas(list) {
    if (!Array.isArray(list)) return [];
    return list.map(function each(item) {
      return normalizeText(item);
    }).filter(Boolean);
  }

  function normalizeBloques(list) {
    if (!Array.isArray(list)) return [];
    return list.map(function each(item, index) {
      var safe = asPlainObject(item) ? item : {};
      return {
        texto: normalizeText(safe.texto),
        orden: Number.isFinite(Number(safe.orden)) ? Number(safe.orden) : index,
        tipoBloqueSugerido: normalizeText(safe.tipoBloqueSugerido) || null,
        origenBloque: normalizeText(safe.origenBloque) || null
      };
    }).filter(function keep(item) {
      return !!item.texto;
    });
  }

  function normalizeMetadatos(raw) {
    var safe = asPlainObject(raw) ? raw : {};
    return {
      marcaDetectada: normalizeText(safe.marcaDetectada) || null,
      contenedor: normalizeText(safe.contenedor) || null,
      idiomaProbable: normalizeText(safe.idiomaProbable).toLowerCase() || null,
      origen: normalizeText(safe.origen) || null
    };
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
        batchId: rawMeta.batchId == null ? null : normalizeText(rawMeta.batchId),
        modoEjecucion: normalizeText(rawMeta.modoEjecucion).toLowerCase() || "fase5"
      },
      datos: {
        textoAuditado: String(rawData.textoAuditado || "").trim(),
        textoBaseVision: String(rawData.textoBaseVision || "").trim(),
        lineasOCR: normalizeLineas(rawData.lineasOCR),
        bloquesOCR: normalizeBloques(rawData.bloquesOCR),
        metadatosOpcionales: normalizeMetadatos(rawData.metadatosOpcionales),
        roiRefsRevision: Array.isArray(rawData.roiRefsRevision) ? rawData.roiRefsRevision : []
      }
    };
  }

  function validateIncomingRequest(request) {
    var normalized = normalizeIncomingRequest(request);

    if (normalized.moduloOrigen !== MODULES.CEREBRO) {
      return {
        ok: false,
        code: "B2_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloOrigen debe ser Cerebro_Orquestador.",
        detail: { moduloOrigen: normalized.moduloOrigen || null }
      };
    }
    if (normalized.moduloDestino !== MODULES.BOXER2) {
      return {
        ok: false,
        code: "B2_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloDestino debe ser Boxer2_Identidad.",
        detail: { moduloDestino: normalized.moduloDestino || null }
      };
    }
    if (normalized.accion !== ACTIONS.RESOLVER_IDENTIDAD) {
      return {
        ok: false,
        code: "B2_CONTRATO_ENTRADA_INVALIDO",
        message: "accion invalida para Boxer2.",
        detail: { accion: normalized.accion || null }
      };
    }
    if (!normalized.sessionToken) {
      return {
        ok: false,
        code: "B2_CONTRATO_ENTRADA_INVALIDO",
        message: "Falta sessionToken.",
        detail: {}
      };
    }
    if (
      normalized.meta.versionContrato !== CONTRACT_VERSION &&
      normalized.meta.versionContrato !== LEGACY_CONTRACT_VERSION
    ) {
      return {
        ok: false,
        code: "B2_CONTRATO_ENTRADA_INVALIDO",
        message: "versionContrato invalida.",
        detail: { versionContrato: normalized.meta.versionContrato || null }
      };
    }
    if (!normalized.meta.analysisId || !normalized.meta.traceId) {
      return {
        ok: false,
        code: "B2_CONTRATO_ENTRADA_INVALIDO",
        message: "analysisId y traceId son obligatorios en Boxer2.",
        detail: {
          analysisId: normalized.meta.analysisId || null,
          traceId: normalized.meta.traceId || null
        }
      };
    }
    if (!normalized.datos.textoAuditado && !normalized.datos.textoBaseVision && !normalized.datos.lineasOCR.length && !normalized.datos.bloquesOCR.length) {
      return {
        ok: false,
        code: "B2_IDENTIDAD_VACIA",
        message: "Falta texto para resolver identidad.",
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
    TASK_DEFINITIONS: TASK_DEFINITIONS,
    SUGGESTED_ACTIONS: SUGGESTED_ACTIONS,
    normalizeConfidence: normalizeConfidence,
    normalizeIaState: normalizeIaState,
    normalizeIncomingRequest: normalizeIncomingRequest,
    validateIncomingRequest: validateIncomingRequest,
    asPlainObject: asPlainObject,
    normalizeText: normalizeText
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer2Contratos = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
