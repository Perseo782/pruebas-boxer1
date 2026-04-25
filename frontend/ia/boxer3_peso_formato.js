(function initBoxer3PesoFormatoModule(globalScope) {
  "use strict";

  var contratos = null;
  var errores = null;
  var motor = null;

  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./boxer3_contratos.js");
      errores = require("./boxer3_errores.js");
      motor = require("../../../boxer3_motor.js");
    } catch (errRequire) {
      contratos = null;
      errores = null;
      motor = null;
    }
  }

  if (!contratos && globalScope && globalScope.Boxer3Contratos) contratos = globalScope.Boxer3Contratos;
  if (!errores && globalScope && globalScope.Boxer3Errores) errores = globalScope.Boxer3Errores;
  if (!motor && globalScope && globalScope.Boxer3Motor) motor = globalScope.Boxer3Motor;

  var MODULE_NAME = contratos.MODULE_NAME;
  var PASSPORTS = contratos.PASSPORTS;
  var CONFIDENCE = contratos.CONFIDENCE;
  var IA_STATES = contratos.IA_STATES;
  var TASK_DEFINITIONS = contratos.TASK_DEFINITIONS;
  var SUGGESTED_ACTIONS = contratos.SUGGESTED_ACTIONS;
  var ERROR_CODES = errores.ERROR_CODES;

  function nowMs() {
    return Date.now();
  }

  function collapseText(value) {
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
      totalCandidatos: addon.totalCandidatos || 0,
      modoResolucion: addon.modoResolucion || "ninguno_claro",
      iaUsada: !!addon.iaUsada,
      eventos: Array.isArray(safe.eventos) ? safe.eventos : []
    };
  }

  function buildMetricasForEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    if (safeContext.metricCtx) {
      return finalizeMetricas(safeContext.metricCtx, {
        totalCandidatos: safeOptions.totalCandidatos || 0,
        modoResolucion: safeOptions.datos ? safeOptions.datos.modoResolucion : "ninguno_claro",
        iaUsada: !!safeOptions.iaUsada
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
      estadoIA: contratos.normalizeIaState(safeOptions.estadoIA || IA_STATES.NO_NECESITA_LLAMADA),
      tareasIA: Array.isArray(safeOptions.tareasIA) ? safeOptions.tareasIA : [],
      resultadoLocal: {
        analysisId: safeContext.analysisId || null,
        traceId: safeContext.traceId || null,
        modulo: MODULE_NAME,
        elapsedMs: elapsedMs,
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

  function buildSuccessEnvelope(context, options) {
    return buildEnvelope(context, options || {});
  }

  function buildPendingIaEnvelope(context, options) {
    var safeOptions = options || {};
    return buildEnvelope(context, {
      estadoIA: IA_STATES.NECESITA_LLAMADA,
      tareasIA: safeOptions.tareasIA || [],
      passport: safeOptions.passport || PASSPORTS.NARANJA,
      suggestedAction: safeOptions.suggestedAction || SUGGESTED_ACTIONS.CONTINUAR_Y_MARCAR_REVISION,
      confidence: safeOptions.confidence || CONFIDENCE.MEDIA,
      requiresRevision: true,
      totalCandidatos: safeOptions.totalCandidatos || 0,
      datos: safeOptions.datos || {}
    });
  }

  function buildCloseContext(resultadoLocal) {
    var safeLocal = contratos.asPlainObject(resultadoLocal) ? resultadoLocal : {};
    return {
      moduleName: MODULE_NAME,
      analysisId: safeLocal.analysisId || null,
      traceId: safeLocal.traceId || null,
      elapsedMs: Math.max(0, Number(safeLocal.elapsedMs) || 0),
      metricas: safeLocal.metricas || null
    };
  }

  function inferTipo(formato) {
    var safe = collapseText(formato);
    if (!safe) return "desconocido";
    return /^\d+\s*x/i.test(safe) ? "multipack" : "simple";
  }

  function inferConfidenceForVia(via) {
    if (via === "clase_A1" || via === "clase_A1_multi" || via === "clase_A2" || via === "clase_A2_multi") {
      return CONFIDENCE.ALTA;
    }
    if (via === "inferencia_B_C" || via === "scoring_C") {
      return CONFIDENCE.MEDIA;
    }
    return CONFIDENCE.BAJA;
  }

  function buildAnalysisText(datos) {
    var text = datos.textoAuditado || "";
    if (text) return text;
    if (datos.lineasOCR && datos.lineasOCR.length) return datos.lineasOCR.join("\n");
    if (datos.bloquesOCR && datos.bloquesOCR.length) {
      return datos.bloquesOCR
        .slice()
        .sort(function(a, b) { return a.orden - b.orden; })
        .map(function(item) { return item.texto; })
        .join("\n");
    }
    return datos.textoBaseVision || "";
  }

  function summarizeCandidates(candidatos) {
    if (!Array.isArray(candidatos)) return [];
    return candidatos.map(function each(item) {
      return {
        literal: item.tokenOriginal,
        clase: item.clase,
        formato: motor.formatearSalida(item),
        tipo: item.esMultipack ? "multipack" : "simple",
        evidencia: item.evidencias || 1,
        lineaOrigen: item.lineaOrigen
      };
    });
  }

  function buildRawCandidateOption(candidate, index, scoreMap) {
    var format = motor.formatearSalida(candidate);
    var scoreKey = candidate.tokenOriginal + "|" + candidate.lineaOrigen;
    return {
      id: "c" + String(index + 1),
      formato: format,
      formato_normalizado: format,
      tipo: candidate.esMultipack ? "multipack" : "simple",
      clase: candidate.clase,
      literal: candidate.tokenOriginal,
      lineaOrigen: candidate.lineaOrigen,
      score: scoreMap[scoreKey] == null ? null : scoreMap[scoreKey],
      evidencias: candidate.evidencias || 1
    };
  }

  function buildScoreMap(scored) {
    var map = {};
    (Array.isArray(scored) ? scored : []).forEach(function each(item) {
      map[item.token + "|" + item.lineaOrigen] = item.score;
    });
    return map;
  }

  function buildClosedCandidates(analysis) {
    var safeAnalysis = analysis || {};
    var consolidados = Array.isArray(safeAnalysis.consolidados) ? safeAnalysis.consolidados : [];
    var scoreMap = buildScoreMap(safeAnalysis.scoringNeutros);
    var a1 = consolidados.filter(function(c) { return c.clase === "A1"; });
    var a2 = consolidados.filter(function(c) { return c.clase === "A2"; });
    var neutros = consolidados.filter(function(c) { return c.clase === "C"; });
    var selected = [];

    if (a1.length > 1) {
      selected = a1.slice();
    } else if (a2.length > 1) {
      selected = a2.slice();
    } else if (neutros.length > 1) {
      selected = neutros.slice().sort(function(a, b) {
        var aScore = scoreMap[a.tokenOriginal + "|" + a.lineaOrigen] || 0;
        var bScore = scoreMap[b.tokenOriginal + "|" + b.lineaOrigen] || 0;
        return bScore - aScore;
      });
    } else if (consolidados.length > 1) {
      selected = consolidados.slice();
    }

    var out = [];
    var seen = {};
    for (var i = 0; i < selected.length; i += 1) {
      var option = buildRawCandidateOption(selected[i], out.length, scoreMap);
      var key = option.formato_normalizado + "|" + option.tipo + "|" + option.clase;
      if (seen[key]) continue;
      seen[key] = true;
      out.push(option);
      if (out.length >= 3) break;
    }
    return out;
  }

  function buildIaTask(candidates, analysis, context) {
    var safeCandidates = Array.isArray(candidates) ? candidates : [];
    var safeAnalysis = analysis || {};
    return {
      analysisId: context.analysisId,
      traceId: context.traceId,
      taskId: TASK_DEFINITIONS.FORMATO.TASK_ID,
      moduloSolicitante: MODULE_NAME,
      tipoTarea: TASK_DEFINITIONS.FORMATO.TIPO_TAREA,
      schemaId: TASK_DEFINITIONS.FORMATO.SCHEMA_ID,
      payload: {
        textoBase: safeAnalysis.textoLimpio || safeAnalysis.textoEntrada || "",
        candidatos: safeCandidates.map(function each(item) {
          return {
            id: item.id,
            formato: item.formato,
            tipo: item.tipo,
            clase: item.clase,
            literal: item.literal,
            lineaOrigen: item.lineaOrigen
          };
        })
      },
      respuestaEsperada: {
        formato: "json",
        campos: ["decision", "confidence", "motivo_duda"],
        decisionesPermitidas: safeCandidates.map(function each(item) { return item.id; }).concat(["ninguno_claro"])
      }
    };
  }

  function isValidIaTask(task) {
    return !!task &&
      task.taskId === TASK_DEFINITIONS.FORMATO.TASK_ID &&
      task.moduloSolicitante === MODULE_NAME &&
      task.tipoTarea === TASK_DEFINITIONS.FORMATO.TIPO_TAREA &&
      task.schemaId === TASK_DEFINITIONS.FORMATO.SCHEMA_ID &&
      contratos.asPlainObject(task.payload) &&
      Array.isArray(task.payload.candidatos) &&
      task.payload.candidatos.length >= 2 &&
      typeof task.payload.textoBase === "string";
  }

  function normalizeIaResponse(raw) {
    var safeRaw = raw || {};
    var payload = safeRaw;
    if (payload && payload.data) payload = payload.data;
    if (payload && payload.resultado) payload = payload.resultado;
    if (payload && payload.data) payload = payload.data;
    if (payload && payload.respuesta) payload = payload.respuesta;
    if (!contratos.asPlainObject(payload)) {
      return { ok: false, code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA, message: "IA Boxer3 no devolvio JSON util." };
    }

    var decision = collapseText(payload.decision || "");
    if (!decision) {
      return { ok: false, code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA, message: "IA Boxer3 no devolvio decision." };
    }

    return {
      ok: true,
      taskId: collapseText(safeRaw.taskId || payload.taskId || ""),
      analysisId: collapseText(safeRaw.analysisId || payload.analysisId || ""),
      traceId: collapseText(safeRaw.traceId || payload.traceId || ""),
      tipoTarea: collapseText(safeRaw.tipoTarea || payload.tipoTarea || ""),
      schemaId: collapseText(safeRaw.schemaId || payload.schemaId || ""),
      decision: decision,
      confidence: contratos.normalizeConfidence(payload.confidence || CONFIDENCE.MEDIA),
      motivo: collapseText(payload.motivo_duda || payload.motivoDuda || "")
    };
  }

  function buildDirectResultData(analysis) {
    var decision = analysis.decision || {};
    var format = collapseText(decision.resultado || "");
    return {
      formato: format,
      formato_normalizado: format,
      tipo: inferTipo(format),
      confidence: inferConfidenceForVia(decision.via),
      modoResolucion: "local",
      motivo_duda: "",
      conflictoComercial: false,
      pesoBrutoDetectado: collapseText(decision.pesoBrutoDetectado || ""),
      candidatosEvaluados: summarizeCandidates(decision.candidatos),
      dudas: [],
      alertas: []
    };
  }

  function inferEmptyReason(analysis) {
    var decision = analysis.decision || {};
    if (decision.pesoBrutoDetectado) return "solo_bruto_sin_neto";
    if (decision.via === "sin_candidatos") return ERROR_CODES.FORMATO_VACIO;
    return collapseText(decision.motivo || "") || ERROR_CODES.FORMATO_VACIO;
  }

  function buildEmptyResultData(analysis, modo, contextoIA) {
    var decision = analysis.decision || {};
    var reason = inferEmptyReason(analysis);
    return {
      formato: "",
      formato_normalizado: "",
      tipo: "desconocido",
      confidence: CONFIDENCE.MEDIA,
      modoResolucion: modo || "ninguno_claro",
      motivo_duda: reason,
      conflictoComercial: true,
      pesoBrutoDetectado: collapseText(decision.pesoBrutoDetectado || ""),
      candidatosEvaluados: summarizeCandidates(decision.candidatos),
      dudas: [reason],
      alertas: [reason],
      contextoIA: contextoIA || null
    };
  }

  function B3_cerrarConSubrespuestaIA(subrespuesta, resultadoLocal) {
    var safeLocal = contratos.asPlainObject(resultadoLocal) ? resultadoLocal : {};
    var context = buildCloseContext(safeLocal);
    var datos = contratos.asPlainObject(safeLocal.datos) ? safeLocal.datos : {};
    var contextoIA = contratos.asPlainObject(datos.contextoIA) ? datos.contextoIA : {};
    var shortlist = Array.isArray(contextoIA.candidatos) ? contextoIA.candidatos : [];
    var normalized = normalizeIaResponse(subrespuesta);

    if (!normalized.ok) {
      return errores.buildFailureEnvelope(context, {
        code: normalized.code,
        message: normalized.message,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }

    if (normalized.taskId && normalized.taskId !== TASK_DEFINITIONS.FORMATO.TASK_ID) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA,
        message: "taskId invalido en cierre IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.analysisId && context.analysisId && normalized.analysisId !== context.analysisId) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA,
        message: "analysisId invalido en cierre IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.traceId && context.traceId && normalized.traceId !== context.traceId) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA,
        message: "traceId invalido en cierre IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.tipoTarea && normalized.tipoTarea !== TASK_DEFINITIONS.FORMATO.TIPO_TAREA) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA,
        message: "tipoTarea invalido en cierre IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.schemaId && normalized.schemaId !== TASK_DEFINITIONS.FORMATO.SCHEMA_ID) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA,
        message: "schemaId invalido en cierre IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (!shortlist.length) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE,
        message: "No hay candidatos cerrados para cerrar IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }

    if (normalized.decision === "ninguno_claro") {
      return buildSuccessEnvelope(context, {
        estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        confidence: normalized.confidence,
        requiresRevision: true,
        iaUsada: true,
        totalCandidatos: shortlist.length,
        datos: {
          formato: "",
          formato_normalizado: "",
          tipo: "desconocido",
          confidence: normalized.confidence,
          modoResolucion: "ninguno_claro",
          motivo_duda: normalized.motivo || ERROR_CODES.FORMATO_VACIO,
          conflictoComercial: true,
          pesoBrutoDetectado: datos.pesoBrutoDetectado || "",
          candidatosEvaluados: datos.candidatosEvaluados || [],
          dudas: [normalized.motivo || ERROR_CODES.FORMATO_VACIO],
          alertas: [normalized.motivo || ERROR_CODES.FORMATO_VACIO]
        }
      });
    }

    var candidate = shortlist.filter(function each(item) {
      return item.id === normalized.decision;
    })[0] || null;

    if (!candidate) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA,
        message: "decision invalida en cierre IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }

    if (datos.formato_normalizado && datos.formato_normalizado !== candidate.formato_normalizado) {
      return buildSuccessEnvelope(context, {
        estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        confidence: normalized.confidence,
        requiresRevision: true,
        iaUsada: true,
        totalCandidatos: shortlist.length,
        datos: {
          formato: candidate.formato,
          formato_normalizado: candidate.formato_normalizado,
          tipo: candidate.tipo,
          confidence: normalized.confidence,
          modoResolucion: "ia",
          motivo_duda: ERROR_CODES.CONFLICTO_OCR_IA,
          conflictoComercial: true,
          pesoBrutoDetectado: datos.pesoBrutoDetectado || "",
          candidatosEvaluados: datos.candidatosEvaluados || [],
          dudas: [ERROR_CODES.CONFLICTO_OCR_IA],
          alertas: [ERROR_CODES.CONFLICTO_OCR_IA]
        }
      });
    }

    var passport = normalized.confidence === CONFIDENCE.BAJA ? PASSPORTS.NARANJA : PASSPORTS.VERDE;
    return buildSuccessEnvelope(context, {
      estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
      passport: passport,
      suggestedAction: passport === PASSPORTS.VERDE ? SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO : SUGGESTED_ACTIONS.ABRIR_REVISION,
      confidence: normalized.confidence,
      requiresRevision: passport !== PASSPORTS.VERDE,
      iaUsada: true,
      totalCandidatos: shortlist.length,
      datos: {
        formato: candidate.formato,
        formato_normalizado: candidate.formato_normalizado,
        tipo: candidate.tipo,
        confidence: normalized.confidence,
        modoResolucion: "ia",
        motivo_duda: normalized.motivo || "",
        conflictoComercial: passport !== PASSPORTS.VERDE,
        pesoBrutoDetectado: datos.pesoBrutoDetectado || "",
        candidatosEvaluados: datos.candidatosEvaluados || [],
        dudas: normalized.motivo ? [normalized.motivo] : [],
        alertas: normalized.motivo ? [normalized.motivo] : []
      }
    });
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
        code: validation.code,
        message: validation.message,
        passport: validation.code === ERROR_CODES.FORMATO_VACIO ? PASSPORTS.NARANJA : PASSPORTS.ROJO,
        suggestedAction: validation.code === ERROR_CODES.FORMATO_VACIO ? SUGGESTED_ACTIONS.CONTINUAR_Y_MARCAR_REVISION : SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        datos: {
          formato: "",
          formato_normalizado: "",
          tipo: "desconocido",
          confidence: CONFIDENCE.BAJA,
          modoResolucion: "ninguno_claro",
          motivo_duda: validation.code,
          conflictoComercial: true,
          pesoBrutoDetectado: "",
          candidatosEvaluados: [],
          dudas: [validation.code],
          alertas: [validation.code]
        }
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

    try {
      var text = buildAnalysisText(normalizedRequest.datos);
      pushEvent(metricCtx, "info", "B3_ANALISIS_LOCAL", "Analisis local Boxer3 iniciado.", { passport: PASSPORTS.VERDE });
      var analysis = motor.analizarMotorBoxer3(text);
      var decision = analysis.decision || {};
      var totalCandidatos = Array.isArray(analysis.consolidados) ? analysis.consolidados.length : 0;

      if (normalizedRequest.datos.controlesUsuario.timeBudgetMs != null &&
          elapsedSince(metricCtx.startedAt) > normalizedRequest.datos.controlesUsuario.timeBudgetMs) {
        pushEvent(metricCtx, "error", ERROR_CODES.TIMEOUT_LOCAL, "Boxer3 supero el tiempo local.", {
          passport: PASSPORTS.NARANJA,
          tipoEvento: "timeout"
        });
        return errores.buildFailureEnvelope({
          moduleName: MODULE_NAME,
          analysisId: context.analysisId,
          traceId: context.traceId,
          elapsedMs: elapsedSince(metricCtx.startedAt),
          metricas: finalizeMetricas(metricCtx, {
            totalCandidatos: totalCandidatos,
            modoResolucion: "timeout_local"
          })
        }, {
          code: ERROR_CODES.TIMEOUT_LOCAL,
          message: "Boxer3 agoto su tiempo local.",
          passport: PASSPORTS.NARANJA,
          suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
          datos: buildEmptyResultData(analysis, "timeout_local"),
          tipoFallo: "reparacion_agotada",
          retryable: true
        });
      }

      if (decision.resultado) {
        pushEvent(metricCtx, "info", "B3_LOCAL_VERDE", "Boxer3 resolvio formato en local.", { passport: PASSPORTS.VERDE });
        return buildSuccessEnvelope(context, {
          estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
          passport: PASSPORTS.VERDE,
          suggestedAction: SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO,
          confidence: inferConfidenceForVia(decision.via),
          requiresRevision: false,
          totalCandidatos: totalCandidatos,
          datos: buildDirectResultData(analysis)
        });
      }

      var closedCandidates = buildClosedCandidates(analysis);
      if (normalizedRequest.datos.controlesUsuario.agentEnabled && closedCandidates.length >= 2) {
        var task = buildIaTask(closedCandidates, analysis, context);
        if (!isValidIaTask(task)) {
          pushEvent(metricCtx, "error", ERROR_CODES.TAREA_IA_INVALIDA, "Boxer3 no pudo construir tarea IA valida.", {
            passport: PASSPORTS.ROJO
          });
          return errores.buildFailureEnvelope({
            moduleName: MODULE_NAME,
            analysisId: context.analysisId,
            traceId: context.traceId,
            elapsedMs: elapsedSince(metricCtx.startedAt),
            metricas: finalizeMetricas(metricCtx, {
              totalCandidatos: totalCandidatos,
              modoResolucion: "tarea_ia_invalida"
            })
          }, {
            code: ERROR_CODES.TAREA_IA_INVALIDA,
            message: "La tarea IA de Boxer3 no cumple el contrato.",
            passport: PASSPORTS.ROJO,
            suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
            datos: buildEmptyResultData(analysis, "pendiente_ia"),
            tipoFallo: "irrecuperable_por_diseno"
          });
        }

        pushEvent(metricCtx, "warn", "B3_ESCALA_IA", "Boxer3 necesita desempate externo.", {
          passport: PASSPORTS.NARANJA
        });
        return buildPendingIaEnvelope(context, {
          passport: PASSPORTS.NARANJA,
          suggestedAction: SUGGESTED_ACTIONS.CONTINUAR_Y_MARCAR_REVISION,
          confidence: CONFIDENCE.MEDIA,
          totalCandidatos: totalCandidatos,
          tareasIA: [task],
          datos: buildEmptyResultData(analysis, "pendiente_ia", {
            candidatos: closedCandidates,
            analysisId: context.analysisId,
            traceId: context.traceId
          })
        });
      }

      pushEvent(metricCtx, "warn", ERROR_CODES.FORMATO_VACIO, "Boxer3 no cerro formato seguro.", {
        passport: PASSPORTS.NARANJA
      });
      return buildSuccessEnvelope(context, {
        estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        confidence: CONFIDENCE.MEDIA,
        requiresRevision: true,
        totalCandidatos: totalCandidatos,
        datos: buildEmptyResultData(analysis, "ninguno_claro")
      });
    } catch (err) {
      pushEvent(metricCtx, "error", ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE, err && err.message ? err.message : "Fallo interno Boxer3.", {
        passport: PASSPORTS.ROJO
      });
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: context.analysisId,
        traceId: context.traceId,
        elapsedMs: elapsedSince(metricCtx.startedAt),
        metricas: finalizeMetricas(metricCtx, {})
      }, {
        code: ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE,
        message: err && err.message ? err.message : "Excepcion no controlada en Boxer3.",
        passport: PASSPORTS.ROJO,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: {
          formato: "",
          formato_normalizado: "",
          tipo: "desconocido",
          confidence: CONFIDENCE.BAJA,
          modoResolucion: "error_interno",
          motivo_duda: ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE,
          conflictoComercial: true,
          pesoBrutoDetectado: "",
          candidatosEvaluados: [],
          dudas: [ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE],
          alertas: [ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE]
        },
        retryable: true
      });
    }
  }

  var api = {
    procesarAccionContrato: procesarAccionContrato,
    B3_cerrarConSubrespuestaIA: B3_cerrarConSubrespuestaIA
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer3PesoFormato = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
