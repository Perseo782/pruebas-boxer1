(function initBoxer4AlergenosModule(globalScope) {
  "use strict";

  var contratos = null;
  var errores = null;
  var motor = null;
  var allergenCatalog = null;

  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./boxer4_contratos.js");
      errores = require("./boxer4_errores.js");
      motor = require("../../../Boxer4_Motor.js");
      allergenCatalog = require("../../../../shared/alergenos_oficiales.js");
    } catch (errRequire) {
      contratos = null;
      errores = null;
      motor = null;
      allergenCatalog = null;
    }
  }

  if (!contratos && globalScope && globalScope.Boxer4Contratos) contratos = globalScope.Boxer4Contratos;
  if (!errores && globalScope && globalScope.Boxer4Errores) errores = globalScope.Boxer4Errores;
  if (!motor && globalScope && globalScope.Boxer4Motor) motor = globalScope.Boxer4Motor;
  if (!allergenCatalog && globalScope && globalScope.AppV2AlergenosOficiales) {
    allergenCatalog = globalScope.AppV2AlergenosOficiales;
  }

  var MODULE_NAME = contratos.MODULE_NAME;
  var PASSPORTS = contratos.PASSPORTS;
  var CONFIDENCE = contratos.CONFIDENCE;
  var IA_STATES = contratos.IA_STATES;
  var SUGGESTED_ACTIONS = contratos.SUGGESTED_ACTIONS;
  var ERROR_CODES = errores.ERROR_CODES;

  function nowMs() {
    return Date.now();
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function startOperation(meta) {
    var safeMeta = meta || {};
    return {
      analysisId: safeMeta.analysisId || "",
      traceId: safeMeta.traceId || "",
      startedAt: nowMs(),
      eventos: []
    };
  }

  function elapsedSince(startedAt) {
    return Math.max(0, nowMs() - Number(startedAt || nowMs()));
  }

  function pushEvent(metricCtx, level, code, message, detail) {
    if (!metricCtx) return;
    metricCtx.eventos.push({
      ts: new Date().toISOString(),
      modulo: MODULE_NAME,
      level: level,
      passport: detail && detail.passport ? detail.passport : null,
      code: code,
      message: message,
      tipoEvento: detail && detail.tipoEvento ? detail.tipoEvento : "diagnostico",
      traceId: metricCtx.traceId,
      elapsedMs: elapsedSince(metricCtx.startedAt)
    });
  }

  function finalizeMetricas(metricCtx, extra) {
    var safe = metricCtx || {};
    var addon = extra || {};
    return {
      traceId: safe.traceId || null,
      analysisId: safe.analysisId || null,
      elapsedMs: elapsedSince(safe.startedAt),
      totalEventos: Array.isArray(safe.eventos) ? safe.eventos.length : 0,
      totalAlergenos: addon.totalAlergenos || 0,
      modoResolucion: addon.modoResolucion || "local",
      iaUsada: false,
      eventos: Array.isArray(safe.eventos) ? safe.eventos : []
    };
  }

  function buildMetricasForEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    if (safeContext.metricCtx) {
      return finalizeMetricas(safeContext.metricCtx, {
        totalAlergenos: safeOptions.totalAlergenos || 0,
        modoResolucion: safeOptions.datos ? safeOptions.datos.modoResolucion : "local"
      });
    }
    return safeContext.metricas || null;
  }

  function buildEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    var elapsedMs = safeContext.metricCtx
      ? elapsedSince(safeContext.metricCtx.startedAt)
      : Math.max(0, Number(safeContext.elapsedMs) || 0);
    var metricas = buildMetricasForEnvelope(safeContext, safeOptions);
    return {
      modulo: MODULE_NAME,
      estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
      tareasIA: [],
      resultadoLocal: {
        analysisId: safeContext.analysisId || null,
        traceId: safeContext.traceId || null,
        modulo: MODULE_NAME,
        estadoPasaporteModulo: safeOptions.passport || PASSPORTS.VERDE,
        accionSugeridaParaCerebro: safeOptions.suggestedAction || SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO,
        confidence: safeOptions.confidence || CONFIDENCE.MEDIA,
        requiereRevision: !!safeOptions.requiresRevision,
        datos: safeOptions.datos || {},
        error: safeOptions.error || null,
        metricas: metricas
      },
      elapsedMs: elapsedMs,
      traceId: safeContext.traceId || null
    };
  }

  function activeAlergenosMapToList(map) {
    if (allergenCatalog && typeof allergenCatalog.activeFromProfile === "function") {
      return allergenCatalog.activeFromProfile(map);
    }
    var out = [];
    var safeMap = contratos.asPlainObject(map) ? map : {};
    Object.keys(safeMap).forEach(function each(key) {
      if (Number(safeMap[key]) === 1) out.push(key);
    });
    return out;
  }

  function flattenEvidenceMap(map) {
    var safeMap = contratos.asPlainObject(map) ? map : {};
    var seen = {};
    var out = [];
    Object.keys(safeMap).forEach(function each(key) {
      var list = Array.isArray(safeMap[key]) ? safeMap[key] : [];
      list.forEach(function add(item) {
        var normalized = normalizeText(item).toLowerCase();
        if (!normalized || seen[normalized]) return;
        seen[normalized] = true;
        out.push(normalizeText(item));
      });
    });
    return out;
  }

  function buildReasonData(rawLocal, passport, sourceCode) {
    var safeLocal = contratos.asPlainObject(rawLocal) ? rawLocal : {};
    var activeAlergenos = activeAlergenosMapToList(safeLocal.alergenos);
    var requiresRevision = !!safeLocal.requiereRevision || passport !== PASSPORTS.VERDE;
    var motivo = requiresRevision ? "perfil_alergenos_requiere_revision" : "";
    return {
      alergenos: activeAlergenos,
      trazas: [],
      evidencias: flattenEvidenceMap(safeLocal.evidencias),
      evidenciasPorAlergeno: safeLocal.evidencias || {},
      perfilAlergenos: allergenCatalog && typeof allergenCatalog.buildProfileMap === "function"
        ? allergenCatalog.buildProfileMap(activeAlergenos)
        : (safeLocal.alergenos || {}),
      requiereRevision: requiresRevision,
      confidence: safeLocal.confidence || (passport === PASSPORTS.VERDE ? CONFIDENCE.ALTA : CONFIDENCE.MEDIA),
      bloqueadosGlobales: allergenCatalog && typeof allergenCatalog.normalizeAllergenList === "function"
        ? allergenCatalog.normalizeAllergenList(safeLocal.bloqueadosGlobales)
        : (Array.isArray(safeLocal.bloqueadosGlobales) ? safeLocal.bloqueadosGlobales : []),
      bloqueosDetectados: safeLocal.bloqueosDetectados || {},
      zonasExcluidas: Array.isArray(safeLocal.zonasExcluidas) ? safeLocal.zonasExcluidas : [],
      modoResolucion: "local",
      motivo_duda: requiresRevision ? motivo : "",
      conflictoSanitario: false,
      alertaSanitaria: requiresRevision,
      dudas: requiresRevision ? [motivo] : [],
      alertas: requiresRevision ? [motivo] : [],
      origenMotor: sourceCode || null
    };
  }

  async function procesarAccionContrato(request) {
    var validation = contratos.validateIncomingRequest(request);
    var invalidMetricCtx;

    if (!validation.ok) {
      invalidMetricCtx = startOperation(contratos.normalizeIncomingRequest(request).meta);
      pushEvent(invalidMetricCtx, "error", validation.code, validation.message, validation.detail || null);
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: invalidMetricCtx.analysisId || null,
        traceId: invalidMetricCtx.traceId,
        elapsedMs: elapsedSince(invalidMetricCtx.startedAt),
        metricas: finalizeMetricas(invalidMetricCtx, {})
      }, {
        code: ERROR_CODES.CONTRATO_ENTRADA_INVALIDO,
        message: validation.message,
        passport: PASSPORTS.ROJO,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: {},
        tipoFallo: "irrecuperable_por_diseno",
        retryable: false
      });
    }

    var normalizedRequest = validation.normalized;
    var metricCtx = startOperation(normalizedRequest.meta);
    var context = {
      moduleName: MODULE_NAME,
      analysisId: metricCtx.analysisId,
      traceId: metricCtx.traceId,
      metricCtx: metricCtx
    };

    var textoAuditado = String(normalizedRequest.datos.textoAuditado == null ? "" : normalizedRequest.datos.textoAuditado);

    if (!textoAuditado.trim()) {
      pushEvent(metricCtx, "error", ERROR_CODES.SIN_TEXTO, "Boxer4 recibio texto vacio.", { passport: PASSPORTS.ROJO });
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: context.analysisId,
        traceId: context.traceId,
        elapsedMs: elapsedSince(metricCtx.startedAt),
        metricas: finalizeMetricas(metricCtx, {})
      }, {
        code: ERROR_CODES.SIN_TEXTO,
        message: "textoAuditado llego vacio o nulo.",
        passport: PASSPORTS.ROJO,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: {},
        tipoFallo: "irrecuperable_por_diseno",
        retryable: false
      });
    }

    try {
      pushEvent(metricCtx, "info", "B4_ANALISIS_LOCAL", "Analisis local Boxer4 iniciado.", { passport: PASSPORTS.VERDE });
      var raw = motor.Boxer4_Alergenos({
        textoAuditado: textoAuditado,
        analysisId: context.analysisId,
        traceId: context.traceId
      });

      if (!raw || typeof raw !== "object" || !raw.resultado || typeof raw.resultado !== "object") {
        pushEvent(metricCtx, "error", ERROR_CODES.SIN_BASE_ANALISIS, "Boxer4 devolvio estructura interna invalida.", { passport: PASSPORTS.ROJO });
        return errores.buildFailureEnvelope({
          moduleName: MODULE_NAME,
          analysisId: context.analysisId,
          traceId: context.traceId,
          elapsedMs: elapsedSince(metricCtx.startedAt),
          metricas: finalizeMetricas(metricCtx, {})
        }, {
          code: ERROR_CODES.SIN_BASE_ANALISIS,
          message: "La salida interna del motor Boxer4 no es util.",
          passport: PASSPORTS.ROJO,
          suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
          datos: {},
          tipoFallo: "desconocido",
          retryable: false
        });
      }

      if (raw.ok !== true) {
        var errorCode = raw.error && raw.error.code ? raw.error.code : ERROR_CODES.SIN_BASE_ANALISIS;
        var mappedCode = errorCode === "B4_SIN_TEXTO" ? ERROR_CODES.SIN_TEXTO : ERROR_CODES.SIN_BASE_ANALISIS;
        pushEvent(metricCtx, "error", mappedCode, raw.error && raw.error.message ? raw.error.message : "Fallo motor Boxer4.", {
          passport: PASSPORTS.ROJO
        });
        return errores.buildFailureEnvelope({
          moduleName: MODULE_NAME,
          analysisId: context.analysisId,
          traceId: context.traceId,
          elapsedMs: elapsedSince(metricCtx.startedAt),
          metricas: finalizeMetricas(metricCtx, {})
        }, {
          code: mappedCode,
          message: raw.error && raw.error.message ? raw.error.message : "El motor Boxer4 no pudo analizar.",
          passport: PASSPORTS.ROJO,
          suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
          datos: {},
          tipoFallo: raw.error && raw.error.tipoFallo ? raw.error.tipoFallo : "irrecuperable_por_diseno",
          retryable: !!(raw.error && raw.error.retryable)
        });
      }

      var legacyResult = raw.resultado || {};
      var inner = legacyResult.datos && legacyResult.datos.resultadoLocal ? legacyResult.datos.resultadoLocal : {};
      var passport = legacyResult.estadoPasaporteModulo || PASSPORTS.VERDE;
      var resultData = buildReasonData(inner, passport, "Boxer4_Motor");
      var totalAlergenos = resultData.alergenos.length;

      if (passport === PASSPORTS.NARANJA) {
        pushEvent(metricCtx, "warn", "B4_PERFIL_NARANJA", "Boxer4 devolvio perfil util con revision.", {
          passport: PASSPORTS.NARANJA
        });
      } else {
        pushEvent(metricCtx, "info", "B4_PERFIL_VERDE", "Boxer4 devolvio perfil sanitario util.", {
          passport: PASSPORTS.VERDE
        });
      }

      return buildEnvelope(context, {
        passport: passport,
        suggestedAction: passport === PASSPORTS.VERDE
          ? SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO
          : SUGGESTED_ACTIONS.CONTINUAR_Y_MARCAR_REVISION,
        confidence: resultData.confidence,
        requiresRevision: resultData.requiereRevision,
        totalAlergenos: totalAlergenos,
        datos: resultData
      });
    } catch (err) {
      pushEvent(metricCtx, "error", ERROR_CODES.SIN_BASE_ANALISIS, err && err.message ? err.message : "Excepcion no controlada en Boxer4.", {
        passport: PASSPORTS.ROJO
      });
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: context.analysisId,
        traceId: context.traceId,
        elapsedMs: elapsedSince(metricCtx.startedAt),
        metricas: finalizeMetricas(metricCtx, {})
      }, {
        code: ERROR_CODES.SIN_BASE_ANALISIS,
        message: err && err.message ? err.message : "Excepcion no controlada en Boxer4.",
        passport: PASSPORTS.ROJO,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: {},
        tipoFallo: "desconocido",
        retryable: true
      });
    }
  }

  var api = {
    procesarAccionContrato: procesarAccionContrato
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer4Alergenos = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
