(function initCerebroContratosModule(globalScope) {
  "use strict";

  var MODULE_NAME = "Cerebro_Orquestador";
  var CONTRACT_VERSION = "BOXER_PLUG_V1";

  var MODULES = Object.freeze({
    WEB_OPERATIVA: "Web_Operativa",
    CEREBRO: MODULE_NAME,
    BOXER1: "Boxer1_Core",
    BOXER2: "Boxer2_Identidad",
    BOXER3: "Boxer3_PesoFormato",
    BOXER4: "Boxer4_Alergenos",
    DATOS: "Datos_Persistencia",
    REVISION: "Revision_Incidencias"
  });

  var ACTIONS = Object.freeze({
    SOLICITAR_ANALISIS_FOTO: "solicitar_analisis_foto",
    ANALIZAR_TEXTO_ETIQUETA: "analizar_texto_etiqueta",
    RESOLVER_IDENTIDAD: "resolver_identidad_producto",
    RESOLVER_FORMATO: "resolver_formato_comercial",
    CLASIFICAR_ALERGENOS: "clasificar_alergenos",
    GUARDAR_RESULTADO: "guardar_resultado_analizado",
    ABRIR_REVISION: "abrir_revision_producto"
  });

  var PASSPORTS = Object.freeze({
    VERDE: "VERDE",
    NARANJA: "NARANJA",
    ROJO: "ROJO"
  });

  var IA_STATES = Object.freeze({
    NECESITA_LLAMADA: "NECESITA_LLAMADA",
    NO_NECESITA_LLAMADA: "NO_NECESITA_LLAMADA",
    NO_APLICA: "NO_APLICA",
    PENDIENTE_LOCAL: "PENDIENTE_LOCAL"
  });

  var CONFIDENCE = Object.freeze({
    ALTA: "alta",
    MEDIA: "media",
    BAJA: "baja"
  });

  var DECISION_FLOW = Object.freeze({
    GUARDAR: "guardar",
    REVISION: "revision",
    BLOQUEO: "bloqueo",
    ABORTADO: "abortado"
  });

  var SUGGESTED_ACTIONS = Object.freeze({
    GUARDAR_RESULTADO_ANALIZADO: "guardar_resultado_analizado",
    CONTINUAR_Y_MARCAR_REVISION: "continuar_y_marcar_revision",
    ABRIR_REVISION: "abrir_revision",
    BLOQUEAR_GUARDADO: "bloquear_guardado",
    ABORTAR_FLUJO: "abortar_flujo"
  });

  var FAIL_TYPES = Object.freeze({
    DESCONOCIDO: "desconocido",
    REPARACION_AGOTADA: "reparacion_agotada",
    IRRECUPERABLE_POR_DISENO: "irrecuperable_por_diseno"
  });

  function asPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizePassport(value) {
    var safe = String(value || "").trim().toUpperCase();
    if (safe === PASSPORTS.VERDE || safe === PASSPORTS.NARANJA || safe === PASSPORTS.ROJO) return safe;
    return null;
  }

  function normalizeConfidence(value) {
    var safe = String(value || "").trim().toLowerCase();
    if (safe === CONFIDENCE.ALTA || safe === CONFIDENCE.MEDIA || safe === CONFIDENCE.BAJA) return safe;
    return CONFIDENCE.MEDIA;
  }

  function normalizeIaState(value) {
    var safe = String(value || "").trim().toUpperCase();
    if (safe === IA_STATES.NECESITA_LLAMADA ||
        safe === IA_STATES.NO_NECESITA_LLAMADA ||
        safe === IA_STATES.NO_APLICA ||
        safe === IA_STATES.PENDIENTE_LOCAL) {
      return safe;
    }
    return IA_STATES.NO_NECESITA_LLAMADA;
  }

  function normalizeSendMode(value) {
    var safe = String(value || "").trim().toLowerCase();
    if (safe === "normal") return "normal";
    return "base64";
  }

  function normalizeContextoAlta(value) {
    var safe = String(value || "").trim().toLowerCase();
    if (safe === "lote") return "lote";
    return "individual";
  }

  function normalizeSensitivity(value) {
    var safe = String(value || "").trim().toLowerCase();
    if (safe === "baja" || safe === "media" || safe === "alta") return safe;
    return null;
  }

  function normalizeExpect(value) {
    if (!Array.isArray(value)) return [];
    return value.map(function each(item) {
      return String(item || "").trim();
    }).filter(Boolean);
  }

  function normalizeImageRefs(data) {
    var refs = [];
    if (Array.isArray(data.imageRefs)) {
      refs = data.imageRefs.map(function each(item) {
        return String(item || "").trim();
      }).filter(Boolean);
    }
    if (!refs.length && data.imageRef) {
      refs.push(String(data.imageRef).trim());
    }
    return refs;
  }

  function splitBoxer1Lines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map(function each(line) {
        return String(line || "").trim();
      })
      .filter(Boolean);
  }

  function buildBoxer1Blocks(rawLocal) {
    var palabras = Array.isArray(rawLocal && rawLocal.palabrasOCR) ? rawLocal.palabrasOCR : [];
    var grouped = Object.create(null);
    var order = [];
    var i = 0;

    for (i = 0; i < palabras.length; i += 1) {
      var item = asPlainObject(palabras[i]) ? palabras[i] : null;
      if (!item) continue;
      var key = String(Number(item.pageIndex) || 0) + ":" + String(Number(item.blockIndex) || 0);
      if (!grouped[key]) {
        grouped[key] = {
          pageIndex: Number(item.pageIndex) || 0,
          blockIndex: Number(item.blockIndex) || 0,
          palabras: []
        };
        order.push(key);
      }
      grouped[key].palabras.push({
        texto: String(item.texto || "").trim(),
        pageIndex: Number(item.pageIndex) || 0,
        blockIndex: Number(item.blockIndex) || 0,
        wordIndex: Number(item.wordIndex) || 0
      });
    }

    if (order.length) {
      return order.map(function each(key) {
        var block = grouped[key];
        return {
          pageIndex: block.pageIndex,
          blockIndex: block.blockIndex,
          texto: block.palabras.map(function eachWord(word) {
            return word.texto;
          }).filter(Boolean).join(" "),
          palabras: block.palabras
        };
      });
    }

    return splitBoxer1Lines(rawLocal && rawLocal.textoBase).map(function eachLine(line, index) {
      return {
        pageIndex: 0,
        blockIndex: index,
        texto: line,
        palabras: []
      };
    });
  }

  function buildBoxer1RoiRefs(rawLocal) {
    var slots = rawLocal && rawLocal.loteRescate && Array.isArray(rawLocal.loteRescate.slots)
      ? rawLocal.loteRescate.slots
      : [];

    return slots.map(function each(slot, index) {
      var safeSlot = asPlainObject(slot) ? slot : {};
      return {
        slotId: String(safeSlot.slotId || ("R" + (index + 1))).trim(),
        textoOriginal: String(safeSlot.textoOriginal || "").trim(),
        contextoAntes: String(safeSlot.contextBefore || "").trim(),
        contextoDespues: String(safeSlot.contextAfter || "").trim()
      };
    }).filter(function keep(item) {
      return !!item.slotId;
    });
  }

  function buildBoxer1PendingDatos(rawLocal) {
    var textoBase = String(rawLocal && rawLocal.textoBase || "").trim();
    var roiRefsRevision = buildBoxer1RoiRefs(rawLocal);
    var noResueltas = roiRefsRevision.map(function each(item) {
      return item.slotId;
    });

    return {
      textoAuditado: textoBase,
      textoBaseVision: textoBase,
      lineasOCR: splitBoxer1Lines(textoBase),
      bloquesOCR: buildBoxer1Blocks(rawLocal),
      roiRefsRevision: roiRefsRevision,
      correcciones: [],
      noResueltas: noResueltas,
      detalleSlots: roiRefsRevision.slice(),
      dudas: roiRefsRevision.length ? ["ocr_con_duda_localizada"] : [],
      metricas: rawLocal && rawLocal.tiempos ? rawLocal.tiempos : null
    };
  }

  function isBoxer1RawPendingResult(result, iaState) {
    if (!asPlainObject(result)) return false;
    if (normalizePassport(result.estadoPasaporteModulo)) return false;
    if (result.finalizada === true && asPlainObject(result.respuestaFinal)) return false;
    if (iaState === IA_STATES.NECESITA_LLAMADA) return true;
    return !!(
      String(result.textoBase || "").trim() ||
      (result.loteRescate && Array.isArray(result.loteRescate.slots) && result.loteRescate.slots.length)
    );
  }

  function tryNormalizeBoxer1RawOutput(boxerName, response, result, expectedTraceId) {
    if (boxerName !== MODULES.BOXER1) return null;

    if (!Number.isFinite(Number(response.elapsedMs)) || Number(response.elapsedMs) < 0) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "elapsedMs invalido en salida Boxer.",
        detail: { boxer: boxerName }
      };
    }

    if (String(response.traceId || "").trim() !== String(expectedTraceId || "").trim()) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "traceId inconsistente en salida Boxer.",
        detail: { boxer: boxerName, traceId: response.traceId || null }
      };
    }

    if (result.finalizada === true && asPlainObject(result.respuestaFinal)) {
      var closed = validateBoxerOutput(boxerName, result.respuestaFinal, expectedTraceId);
      if (!closed.ok) return closed;
      closed.normalized.estadoIA = normalizeIaState(response.estadoIA);
      closed.normalized.tareasIA = Array.isArray(response.tareasIA) ? response.tareasIA : [];
      closed.normalized.resultadoLocal = result;
      return closed;
    }

    var iaState = normalizeIaState(response.estadoIA);
    if (!isBoxer1RawPendingResult(result, iaState)) return null;

    return {
      ok: true,
      normalized: {
        ok: true,
        resultado: {
          modulo: boxerName,
          estadoPasaporteModulo: PASSPORTS.NARANJA,
          elapsedMs: Math.max(0, Number(response.elapsedMs) || 0),
          traceId: String(response.traceId || "").trim(),
          datos: buildBoxer1PendingDatos(result),
          confidence: CONFIDENCE.MEDIA,
          requiereRevision: true
        },
        error: null,
        metricas: result.metricas || response.metricas || null,
        estadoIA: iaState,
        tareasIA: Array.isArray(response.tareasIA) ? response.tareasIA : [],
        resultadoLocal: result
      }
    };
  }

  function normalizeIncomingRequest(request) {
    var safeRequest = asPlainObject(request) ? request : {};
    var rawMeta = asPlainObject(safeRequest.meta) ? safeRequest.meta : {};
    var rawData = asPlainObject(safeRequest.datos) ? safeRequest.datos : {};
    var rawControls = asPlainObject(rawData.controlesUsuario) ? rawData.controlesUsuario : {};
    var imageRefs = normalizeImageRefs(rawData);

    return {
      moduloOrigen: String(safeRequest.moduloOrigen || "").trim(),
      moduloDestino: String(safeRequest.moduloDestino || "").trim(),
      accion: String(safeRequest.accion || "").trim(),
      sessionToken: String(safeRequest.sessionToken || "").trim(),
      meta: {
        versionContrato: String(rawMeta.versionContrato || CONTRACT_VERSION).trim() || CONTRACT_VERSION,
        analysisId: String(rawMeta.analysisId || "").trim(),
        traceId: String(rawMeta.traceId || "").trim(),
        batchId: rawMeta.batchId == null ? null : String(rawMeta.batchId).trim()
      },
      datos: {
        imageRefs: imageRefs,
        imageRef: imageRefs[0] || null,
        sendMode: normalizeSendMode(rawData.sendMode),
        contextoAlta: normalizeContextoAlta(rawData.contextoAlta),
        controlesUsuario: {
          timeBudgetMs: Number.isFinite(Number(rawControls.timeBudgetMs)) ? Math.max(0, Number(rawControls.timeBudgetMs)) : null,
          expect: normalizeExpect(rawControls.expect),
          agentEnabled: typeof rawControls.agentEnabled === "boolean" ? rawControls.agentEnabled : true,
          sensitivityMode: normalizeSensitivity(rawControls.sensitivityMode)
        },
        posiblesDuplicados: Array.isArray(rawData.posiblesDuplicados) ? rawData.posiblesDuplicados : [],
        senalesEnvase: rawData.senalesEnvase || null,
        contextoExtra: rawData.contextoExtra || null
      }
    };
  }

  function validateIncomingRequest(request) {
    var normalized = normalizeIncomingRequest(request);

    if (normalized.moduloOrigen !== MODULES.WEB_OPERATIVA) {
      return {
        ok: false,
        code: "CER_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloOrigen debe ser Web_Operativa.",
        detail: { moduloOrigen: normalized.moduloOrigen || null }
      };
    }
    if (normalized.moduloDestino !== MODULES.CEREBRO) {
      return {
        ok: false,
        code: "CER_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloDestino debe ser Cerebro_Orquestador.",
        detail: { moduloDestino: normalized.moduloDestino || null }
      };
    }
    if (normalized.accion !== ACTIONS.SOLICITAR_ANALISIS_FOTO) {
      return {
        ok: false,
        code: "CER_CONTRATO_ENTRADA_INVALIDO",
        message: "accion invalida para Cerebro.",
        detail: { accion: normalized.accion || null }
      };
    }
    if (!normalized.sessionToken) {
      return {
        ok: false,
        code: "CER_CONTRATO_ENTRADA_INVALIDO",
        message: "Falta sessionToken.",
        detail: {}
      };
    }
    if (normalized.meta.versionContrato !== CONTRACT_VERSION) {
      return {
        ok: false,
        code: "CER_CONTRATO_ENTRADA_INVALIDO",
        message: "versionContrato invalida.",
        detail: { versionContrato: normalized.meta.versionContrato }
      };
    }
    if (!normalized.datos.imageRefs.length) {
      return {
        ok: false,
        code: "CER_CONTRATO_ENTRADA_INVALIDO",
        message: "Falta al menos una referencia de imagen.",
        detail: {}
      };
    }

    return {
      ok: true,
      normalized: normalized
    };
  }

  function validateBoxerOutput(boxerName, response, expectedTraceId) {
    if (!asPlainObject(response)) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "El Boxer devolvio una estructura invalida.",
        detail: { boxer: boxerName }
      };
    }

    if (typeof response.ok === "boolean") {
      var legacyResult = asPlainObject(response.resultado) ? response.resultado : null;
      if (!legacyResult) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "El Boxer no devolvio bloque resultado.",
          detail: { boxer: boxerName }
        };
      }

      if (String(legacyResult.modulo || "").trim() !== boxerName) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "El Boxer devolvio modulo incorrecto.",
          detail: { boxer: boxerName, modulo: legacyResult.modulo || null }
        };
      }

      var legacyPassport = normalizePassport(legacyResult.estadoPasaporteModulo);
      if (!legacyPassport) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "Falta estadoPasaporteModulo valido.",
          detail: { boxer: boxerName }
        };
      }

      if (!Number.isFinite(Number(legacyResult.elapsedMs)) || Number(legacyResult.elapsedMs) < 0) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "elapsedMs invalido en salida Boxer.",
          detail: { boxer: boxerName }
        };
      }

      if (String(legacyResult.traceId || "").trim() !== String(expectedTraceId || "").trim()) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "traceId inconsistente en salida Boxer.",
          detail: { boxer: boxerName, traceId: legacyResult.traceId || null }
        };
      }

      if (!asPlainObject(legacyResult.datos)) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "Falta bloque datos en salida Boxer.",
          detail: { boxer: boxerName }
        };
      }

      if (response.ok !== true && !asPlainObject(response.error)) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "El Boxer fallo pero no devolvio error estructurado.",
          detail: { boxer: boxerName }
        };
      }

      return {
        ok: true,
        normalized: {
          ok: response.ok === true,
          resultado: {
            modulo: boxerName,
            estadoPasaporteModulo: legacyPassport,
            elapsedMs: Math.max(0, Number(legacyResult.elapsedMs) || 0),
            traceId: String(legacyResult.traceId || "").trim(),
            datos: legacyResult.datos,
            confidence: normalizeConfidence(legacyResult.confidence),
            requiereRevision: typeof legacyResult.requiereRevision === "boolean"
              ? legacyResult.requiereRevision
              : legacyPassport !== PASSPORTS.VERDE
          },
          error: response.error || null,
          metricas: response.metricas || null,
          estadoIA: normalizeIaState(IA_STATES.NO_NECESITA_LLAMADA),
          tareasIA: [],
          resultadoLocal: null
        }
      };
    }

    var result = asPlainObject(response.resultadoLocal) ? response.resultadoLocal : null;
    if (!result) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "El Boxer no devolvio bloque resultadoLocal.",
        detail: { boxer: boxerName }
      };
    }

    if (String(response.modulo || "").trim() !== boxerName) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "El Boxer devolvio modulo incorrecto.",
        detail: { boxer: boxerName, modulo: response.modulo || null }
      };
    }

    var boxer1Raw = tryNormalizeBoxer1RawOutput(boxerName, response, result, expectedTraceId);
    if (boxer1Raw) {
      return boxer1Raw;
    }

    var passport = normalizePassport(result.estadoPasaporteModulo);
    if (!passport) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "Falta estadoPasaporteModulo valido.",
        detail: { boxer: boxerName }
      };
    }

    if (!Number.isFinite(Number(response.elapsedMs)) || Number(response.elapsedMs) < 0) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "elapsedMs invalido en salida Boxer.",
        detail: { boxer: boxerName }
      };
    }

    if (String(response.traceId || "").trim() !== String(expectedTraceId || "").trim()) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "traceId inconsistente en salida Boxer.",
        detail: { boxer: boxerName, traceId: response.traceId || null }
      };
    }

    if (!asPlainObject(result.datos)) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "Falta bloque datos en salida Boxer.",
        detail: { boxer: boxerName }
      };
    }

    var localError = asPlainObject(result.error) ? result.error : null;

    return {
      ok: true,
      normalized: {
        ok: !localError && passport !== PASSPORTS.ROJO,
        resultado: {
          modulo: boxerName,
          estadoPasaporteModulo: passport,
          elapsedMs: Math.max(0, Number(response.elapsedMs) || 0),
          traceId: String(response.traceId || "").trim(),
          datos: result.datos,
          confidence: normalizeConfidence(result.confidence),
          requiereRevision: typeof result.requiereRevision === "boolean"
            ? result.requiereRevision
            : passport !== PASSPORTS.VERDE || String(response.estadoIA || "").trim().toUpperCase() === "NECESITA_LLAMADA"
        },
        error: localError,
        metricas: result.metricas || response.metricas || null,
        estadoIA: normalizeIaState(response.estadoIA),
        tareasIA: Array.isArray(response.tareasIA) ? response.tareasIA : [],
        resultadoLocal: result
      }
    };
  }

  var api = {
    MODULE_NAME: MODULE_NAME,
    CONTRACT_VERSION: CONTRACT_VERSION,
    MODULES: MODULES,
    ACTIONS: ACTIONS,
    PASSPORTS: PASSPORTS,
    IA_STATES: IA_STATES,
    CONFIDENCE: CONFIDENCE,
    DECISION_FLOW: DECISION_FLOW,
    SUGGESTED_ACTIONS: SUGGESTED_ACTIONS,
    FAIL_TYPES: FAIL_TYPES,
    normalizePassport: normalizePassport,
    normalizeConfidence: normalizeConfidence,
    normalizeIaState: normalizeIaState,
    normalizeIncomingRequest: normalizeIncomingRequest,
    validateIncomingRequest: validateIncomingRequest,
    validateBoxerOutput: validateBoxerOutput
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroContratos = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
