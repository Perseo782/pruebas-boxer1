(function initCerebroOrquestadorModule(globalScope) {
  "use strict";

  var contratos = null;
  var errores = null;
  var metricas = null;
  var arbitraje = null;
  var defaultGateway = null;
  var defaultBrokerIA = null;
  var defaultProductosPersistencia = null;
  var defaultProductRepositoryResolver = null;
  var defaultBoxer2Module = null;
  var defaultBoxer3Module = null;
  var defaultBoxer1Module = null;

  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./cerebro_contratos.js");
      errores = require("./cerebro_errores.js");
      metricas = require("./cerebro_metricas.js");
      arbitraje = require("./cerebro_arbitraje.js");
      defaultGateway = require("../../backend/adaptadores/boxer_family_gateway.js");
      defaultBrokerIA = require("../../backend/adaptadores/cerebro_broker_ia.js");
      defaultProductosPersistencia = require("../../backend/adaptadores/cerebro_productos_persistencia.js");
      defaultProductRepositoryResolver = require("../../backend/adaptadores/cerebro_productos_repository_resolver.js");
      defaultBoxer2Module = require("../boxer2/boxer2_identidad.js");
      defaultBoxer3Module = require("../boxer3/boxer3_peso_formato.js");
      defaultBoxer1Module = require("../../backend/boxer1/backend/operativa/B1_core.js");
    } catch (errRequire) {
      contratos = null;
      errores = null;
      metricas = null;
      arbitraje = null;
      defaultGateway = null;
      defaultBrokerIA = null;
      defaultProductosPersistencia = null;
      defaultProductRepositoryResolver = null;
      defaultBoxer2Module = null;
      defaultBoxer3Module = null;
      defaultBoxer1Module = null;
    }
  }

  if (!contratos && globalScope && globalScope.CerebroContratos) contratos = globalScope.CerebroContratos;
  if (!errores && globalScope && globalScope.CerebroErrores) errores = globalScope.CerebroErrores;
  if (!metricas && globalScope && globalScope.CerebroMetricas) metricas = globalScope.CerebroMetricas;
  if (!arbitraje && globalScope && globalScope.CerebroArbitraje) arbitraje = globalScope.CerebroArbitraje;
  if (!defaultGateway && globalScope && globalScope.CerebroBoxerFamilyGateway) defaultGateway = globalScope.CerebroBoxerFamilyGateway;
  if (!defaultBrokerIA && globalScope && globalScope.CerebroBrokerIa) defaultBrokerIA = globalScope.CerebroBrokerIa;
  if (!defaultProductosPersistencia && globalScope && globalScope.CerebroProductosPersistencia) defaultProductosPersistencia = globalScope.CerebroProductosPersistencia;
  if (!defaultProductRepositoryResolver && globalScope && globalScope.CerebroProductosRepositoryResolver) defaultProductRepositoryResolver = globalScope.CerebroProductosRepositoryResolver;
  if (!defaultBoxer2Module && globalScope && globalScope.Boxer2Identidad) defaultBoxer2Module = globalScope.Boxer2Identidad;
  if (!defaultBoxer3Module && globalScope && globalScope.Boxer3PesoFormato) defaultBoxer3Module = globalScope.Boxer3PesoFormato;
  if (!defaultBoxer1Module && globalScope && typeof globalScope.B1_cerrarConSubrespuestaIA === "function") {
    defaultBoxer1Module = {
      B1_cerrarConSubrespuestaIA: globalScope.B1_cerrarConSubrespuestaIA
    };
  }

  var MODULE_NAME = contratos.MODULE_NAME;
  var MODULES = contratos.MODULES;
  var ACTIONS = contratos.ACTIONS;
  var PASSPORTS = contratos.PASSPORTS;
  var IA_STATES = contratos.IA_STATES;
  var SUGGESTED_ACTIONS = contratos.SUGGESTED_ACTIONS;
  var FAIL_TYPES = contratos.FAIL_TYPES;
  var ERROR_CODES = errores.ERROR_CODES;
  var ROUTE_IDEMPOTENCY_TTL_MS = 120000;
  var ROUTE_IDEMPOTENCY_STORAGE_KEY = "fase5_cerebro_route_idempotency_v1";
  var routeIdempotencyCache = Object.create(null);

  function safeClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (errClone) {
      return value;
    }
  }

  function cleanupRouteIdempotencyCache(nowMs) {
    var keys = Object.keys(routeIdempotencyCache);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var entry = routeIdempotencyCache[key];
      if (!entry || Number(entry.expiresAt || 0) <= nowMs) {
        delete routeIdempotencyCache[key];
      }
    }
  }

  function canUseStorage() {
    try {
      return !!(
        globalScope &&
        globalScope.localStorage &&
        typeof globalScope.localStorage.getItem === "function" &&
        typeof globalScope.localStorage.setItem === "function"
      );
    } catch (errStorage) {
      return false;
    }
  }

  function readRouteIdempotencyStorage(nowMs) {
    if (!canUseStorage()) return Object.create(null);
    var raw = null;
    try {
      raw = globalScope.localStorage.getItem(ROUTE_IDEMPOTENCY_STORAGE_KEY);
    } catch (errRead) {
      raw = null;
    }
    if (!raw) return Object.create(null);
    var parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (errParse) {
      parsed = null;
    }
    var safeParsed = parsed && typeof parsed === "object" ? parsed : {};
    var out = Object.create(null);
    var keys = Object.keys(safeParsed);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var entry = safeParsed[key];
      if (!entry || typeof entry !== "object") continue;
      if (Number(entry.expiresAt || 0) <= nowMs) continue;
      out[key] = entry;
    }
    return out;
  }

  function writeRouteIdempotencyStorage(map) {
    if (!canUseStorage()) return;
    try {
      globalScope.localStorage.setItem(ROUTE_IDEMPOTENCY_STORAGE_KEY, JSON.stringify(map || {}));
    } catch (errWrite) {
      // No-op.
    }
  }

  function buildDecisionIdempotencyKey(decision, meta) {
    var flow = String(decision && decision.decisionFlow || "").trim();
    var analysisId = String(meta && meta.analysisId || "").trim();
    var traceId = String(meta && meta.traceId || "").trim();
    var batchId = String(meta && meta.batchId || "").trim();
    if (!flow || !analysisId || !traceId) return "";
    return flow + "|" + analysisId + "|" + traceId + "|" + (batchId || "sin_batch");
  }

  function readRouteIdempotency(key, nowMs) {
    cleanupRouteIdempotencyCache(nowMs);
    var entry = routeIdempotencyCache[key];
    if (!entry || !entry.value) {
      var persisted = readRouteIdempotencyStorage(nowMs);
      var persistedEntry = persisted[key];
      if (!persistedEntry || !persistedEntry.value) return null;
      routeIdempotencyCache[key] = persistedEntry;
      entry = persistedEntry;
    }
    var cloned = safeClone(entry && entry.value ? entry.value : null);
    if (cloned && typeof cloned === "object") {
      cloned.deduped = true;
      cloned.idempotencyKey = key;
    }
    return cloned;
  }

  function storeRouteIdempotency(key, value, nowMs) {
    var entry = {
      value: safeClone(value),
      expiresAt: nowMs + ROUTE_IDEMPOTENCY_TTL_MS
    };
    routeIdempotencyCache[key] = entry;
    var persisted = readRouteIdempotencyStorage(nowMs);
    persisted[key] = entry;
    writeRouteIdempotencyStorage(persisted);
  }

  function isTimeBudgetExpired(meta, normalizedRequest) {
    var budgetMs = Number(
      normalizedRequest &&
      normalizedRequest.datos &&
      normalizedRequest.datos.controlesUsuario &&
      normalizedRequest.datos.controlesUsuario.timeBudgetMs
    );
    if (!Number.isFinite(budgetMs) || budgetMs <= 0) return false;
    return metricas.elapsedSince(meta.startedAt) >= Math.floor(budgetMs);
  }

  function buildTimeoutEnvelope(meta, summaries) {
    return errores.buildFailureEnvelope(buildContext(meta), {
      code: ERROR_CODES.TIMEOUT_OPERACION || "CER_TIMEOUT_OPERACION",
      message: "Cerebro supero el tiempo maximo de la operacion.",
      suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
      tipoFallo: FAIL_TYPES.REPARACION_AGOTADA,
      retryable: true,
      datos: buildFailureData(meta, {
        passport: PASSPORTS.ROJO,
        decisionFlow: contratos.DECISION_FLOW.ABORTADO,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        conflicts: ["timeout_operacion"],
        summaries: summaries || null
      })
    });
  }

  function buildMeta(normalizedRequest) {
    var ctx = metricas.startOperation(normalizedRequest.meta);
    return {
      analysisId: ctx.analysisId,
      traceId: ctx.traceId,
      startedAt: ctx.startedAt,
      metricCtx: ctx,
      versionContrato: contratos.CONTRACT_VERSION,
      batchId: normalizedRequest.meta.batchId || null
    };
  }

  function buildContext(meta) {
    return {
      moduleName: MODULE_NAME,
      traceId: meta.traceId,
      analysisId: meta.analysisId,
      elapsedMs: metricas.elapsedSince(meta.startedAt),
      metricas: metricas.finalizeMetricas(meta.metricCtx)
    };
  }

  function buildFailureData(meta, options) {
    var safeMeta = meta || {};
    var safeOptions = options || {};
    var safeSummaries = safeOptions.summaries || {};
    return arbitraje.buildFailureFinalData({
      analysisId: safeMeta.analysisId || null,
      traceId: safeMeta.traceId || null,
      elapsedMs: metricas.elapsedSince(safeMeta.startedAt)
    }, {
      passport: safeOptions.passport || PASSPORTS.ROJO,
      decisionFlow: safeOptions.decisionFlow || contratos.DECISION_FLOW.ABORTADO,
      suggestedAction: safeOptions.suggestedAction || SUGGESTED_ACTIONS.ABORTAR_FLUJO,
      propuestaFinal: safeOptions.propuestaFinal || null,
      dudas: safeOptions.dudas || [],
      conflicts: safeOptions.conflicts || [],
      roiRefsRevision: safeOptions.roiRefsRevision || [],
      posibleDuplicado: !!safeOptions.posibleDuplicado,
      duplicadoFusionable: !!safeOptions.duplicadoFusionable,
      coincidencias: safeOptions.coincidencias || [],
      modulos: {
        boxer1: safeSummaries.boxer1 && typeof arbitraje.buildModuleSnapshot === "function" ? arbitraje.buildModuleSnapshot(safeSummaries.boxer1) : null,
        boxer2: safeSummaries.boxer2 && typeof arbitraje.buildModuleSnapshot === "function" ? arbitraje.buildModuleSnapshot(safeSummaries.boxer2) : null,
        boxer3: safeSummaries.boxer3 && typeof arbitraje.buildModuleSnapshot === "function" ? arbitraje.buildModuleSnapshot(safeSummaries.boxer3) : null,
        boxer4: safeSummaries.boxer4 && typeof arbitraje.buildModuleSnapshot === "function" ? arbitraje.buildModuleSnapshot(safeSummaries.boxer4) : null
      }
    });
  }

  function buildBoxerRequest(boxerName, action, meta, normalizedRequest, extraData) {
    return {
      boxer: boxerName,
      action: action,
      moduloOrigen: MODULE_NAME,
      sessionToken: normalizedRequest.sessionToken,
      meta: {
        versionContrato: contratos.CONTRACT_VERSION,
        analysisId: meta.analysisId,
        traceId: meta.traceId,
        batchId: meta.batchId
      },
      datos: extraData || {},
      handlers: null,
      deps: null
    };
  }

  function buildDownstreamData(boxer1Summary, normalizedRequest) {
    return {
      textoAuditado: boxer1Summary.datos.textoAuditado || "",
      textoBaseVision: boxer1Summary.datos.textoBaseVision || "",
      lineasOCR: Array.isArray(boxer1Summary.datos.lineasOCR) ? boxer1Summary.datos.lineasOCR : [],
      bloquesOCR: Array.isArray(boxer1Summary.datos.bloquesOCR) ? boxer1Summary.datos.bloquesOCR : [],
      metadatosOpcionales: {
        marcaDetectada: boxer1Summary.datos.marcaDetectada || null,
        contenedor: normalizedRequest.datos.senalesEnvase && normalizedRequest.datos.senalesEnvase.contenedor
          ? normalizedRequest.datos.senalesEnvase.contenedor
          : null,
        idiomaProbable: normalizedRequest.datos.contextoExtra && normalizedRequest.datos.contextoExtra.idiomaProbable
          ? normalizedRequest.datos.contextoExtra.idiomaProbable
          : null,
        origen: normalizedRequest.datos.contextoAlta || null
      },
      roiRefsRevision: Array.isArray(boxer1Summary.datos.roiRefsRevision) ? boxer1Summary.datos.roiRefsRevision : [],
      contextoAlta: normalizedRequest.datos.contextoAlta,
      senalesEnvase: normalizedRequest.datos.senalesEnvase,
      controlesUsuario: normalizedRequest.datos.controlesUsuario
    };
  }

  function shouldRefreshDownstreamFromBoxer1(originalBoxer1Summary, refreshedBoxer1Summary) {
    if (!originalBoxer1Summary || !refreshedBoxer1Summary) return false;
    if (originalBoxer1Summary.estadoIA !== IA_STATES.NECESITA_LLAMADA) return false;
    if (!arbitraje.boxer1Usable(refreshedBoxer1Summary)) return false;

    var beforeText = String(
      originalBoxer1Summary.datos.textoAuditado ||
      originalBoxer1Summary.datos.textoBaseVision ||
      ""
    ).trim();
    var afterText = String(
      refreshedBoxer1Summary.datos.textoAuditado ||
      refreshedBoxer1Summary.datos.textoBaseVision ||
      ""
    ).trim();

    return !!afterText && afterText !== beforeText;
  }

  async function rerunDownstreamWithCorrectedBoxer1(boxer1Summary, normalizedRequest, meta, deps) {
    var downstreamData = buildDownstreamData(boxer1Summary, normalizedRequest);
    downstreamData.controlesUsuario = Object.assign({}, downstreamData.controlesUsuario || {}, {
      agentEnabled: false
    });

    var fanoutDeps = {
      gateway: deps.gateway,
      handlers: deps.handlers || {},
      destinations: deps.destinations || {},
      duplicateDetector: deps.duplicateDetector || null,
      productRepository: deps.productRepository
    };

    var fanout = await Promise.all([
      invokeAndValidate(MODULES.BOXER2, ACTIONS.RESOLVER_IDENTIDAD, downstreamData, normalizedRequest, meta, fanoutDeps),
      invokeAndValidate(MODULES.BOXER3, ACTIONS.RESOLVER_FORMATO, downstreamData, normalizedRequest, meta, fanoutDeps),
      invokeAndValidate(MODULES.BOXER4, ACTIONS.CLASIFICAR_ALERGENOS, downstreamData, normalizedRequest, meta, fanoutDeps)
    ]);

    var invalidFanout = fanout.find(function each(item) { return !item.ok; });
    if (invalidFanout) {
      return {
        ok: false,
        code: invalidFanout.code,
        message: invalidFanout.message,
        detail: invalidFanout.detail || null
      };
    }

    return {
      ok: true,
      summaries: {
        boxer1: boxer1Summary,
        boxer2: arbitraje.buildModuleSummary(MODULES.BOXER2, fanout[0].normalized),
        boxer3: arbitraje.buildModuleSummary(MODULES.BOXER3, fanout[1].normalized),
        boxer4: arbitraje.buildModuleSummary(MODULES.BOXER4, fanout[2].normalized)
      }
    };
  }

  async function invokeAndValidate(boxerName, action, data, normalizedRequest, meta, deps) {
    var request = buildBoxerRequest(boxerName, action, meta, normalizedRequest, data);
    request.handlers = deps && deps.handlers ? deps.handlers : {};
    request.deps = deps || {};

    var raw = await (deps && deps.gateway ? deps.gateway : defaultGateway).invokeBoxer(request);
    var validated = contratos.validateBoxerOutput(boxerName, raw, meta.traceId);
    if (!validated.ok) {
      metricas.pushEvent(meta.metricCtx, "error", validated.code, validated.message, validated.detail || null);
      return {
        ok: false,
        code: validated.code,
        message: validated.message,
        detail: validated.detail || null,
        raw: raw
      };
    }

    metricas.recordBoxerTime(meta.metricCtx, boxerName, validated.normalized.resultado.elapsedMs);
    metricas.pushEvent(meta.metricCtx, validated.normalized.ok ? "info" : "warn", boxerName + "_RESPUESTA", "Respuesta validada de " + boxerName + ".", {
      ok: validated.normalized.ok,
      passport: validated.normalized.resultado.estadoPasaporteModulo
    });

    return {
      ok: true,
      normalized: validated.normalized
    };
  }

  function asPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function cloneArray(list) {
    return Array.isArray(list) ? list.slice() : [];
  }

  function uniqueStrings(list) {
    var out = [];
    var seen = Object.create(null);
    var safeList = Array.isArray(list) ? list : [];
    for (var i = 0; i < safeList.length; i += 1) {
      var item = String(safeList[i] || "").trim();
      if (!item || seen[item]) continue;
      seen[item] = true;
      out.push(item);
    }
    return out;
  }

  function resolveBrokerApi(deps) {
    if (deps && deps.brokerIA) return deps.brokerIA;
    return defaultBrokerIA;
  }

  function resolveProductosPersistencia(deps) {
    if (deps && deps.productPersistence) return deps.productPersistence;
    return defaultProductosPersistencia;
  }

  function resolveProductRepositoryResolver(deps) {
    if (deps && deps.productRepositoryResolver) return deps.productRepositoryResolver;
    return defaultProductRepositoryResolver;
  }

  function hasProductRepository(deps) {
    return !!(deps && (deps.productRepository || deps.productRemoteIndex || deps.remoteIndex || deps.repository));
  }

  function ensureResolvedProductRepository(deps) {
    var safeDeps = deps || {};
    if (hasProductRepository(safeDeps)) {
      return {
        ok: true,
        deps: safeDeps
      };
    }

    var resolver = resolveProductRepositoryResolver(safeDeps);
    if (!resolver || typeof resolver.resolveProductRepository !== "function") {
      return {
        ok: false,
        code: ERROR_CODES.REPOSITORIO_PRODUCTOS_NO_DISPONIBLE,
        message: "Cerebro no pudo preparar el acceso real a productos.",
        detail: {
          reason: "resolver_no_configurado"
        }
      };
    }

    var resolved = resolver.resolveProductRepository(safeDeps);
    if (!resolved || resolved.ok !== true || !resolved.repository) {
      return {
        ok: false,
        code: ERROR_CODES.REPOSITORIO_PRODUCTOS_NO_DISPONIBLE,
        message: resolved && resolved.message
          ? resolved.message
          : "Cerebro no pudo preparar el acceso real a productos.",
        detail: {
          errorCode: resolved && resolved.errorCode ? resolved.errorCode : "CEREBRO_PRODUCT_REPOSITORY_RESOLVE_FAILED",
          source: resolved && resolved.source ? resolved.source : null,
          collectionName: resolved && resolved.collectionName ? resolved.collectionName : null
        }
      };
    }

    var nextDeps = Object.assign({}, safeDeps, {
      productRepository: resolved.repository,
      productRepositorySource: resolved.source || "runtime",
      productCollectionName: resolved.collectionName || null,
      productRepositoryAppId: resolved.appId || null
    });

    return {
      ok: true,
      deps: nextDeps
    };
  }

  async function resolveDuplicateInfo(normalizedRequest, proposal, deps) {
    var detector = deps && typeof deps.duplicateDetector === "function"
      ? deps.duplicateDetector
      : null;
    var persistencia = resolveProductosPersistencia(deps);
    var raw = null;

    if (detector) {
      raw = await detector({
        inputData: normalizedRequest.datos,
        proposal: proposal
      });
      return {
        ok: true,
        posibleDuplicado: !!(raw && raw.posibleDuplicado),
        fusionable: !!(raw && raw.fusionable),
        coincidencias: raw && Array.isArray(raw.coincidencias) ? raw.coincidencias : []
      };
    }

    if (persistencia && typeof persistencia.detectarDuplicadoReal === "function" && hasProductRepository(deps)) {
      raw = await persistencia.detectarDuplicadoReal({
        inputData: normalizedRequest.datos,
        proposal: proposal
      }, deps || {});
      if (raw && raw.ok === true) {
        return {
          ok: true,
          posibleDuplicado: !!raw.posibleDuplicado,
          fusionable: !!raw.fusionable,
          coincidencias: Array.isArray(raw.coincidencias) ? raw.coincidencias : []
        };
      }
      return {
        ok: false,
        errorCode: raw && raw.errorCode ? raw.errorCode : ERROR_CODES.REPOSITORIO_PRODUCTOS_NO_DISPONIBLE,
        message: raw && raw.message ? raw.message : "No se pudo consultar productos reales."
      };
    }

    raw = arbitraje.detectPossibleDuplicate(normalizedRequest.datos, proposal, deps || {});
    return {
      ok: true,
      posibleDuplicado: !!(raw && raw.posibleDuplicado),
      fusionable: !!(raw && raw.fusionable),
      coincidencias: raw && Array.isArray(raw.coincidencias) ? raw.coincidencias : []
    };
  }

  function resolveBoxerClosers(deps) {
    var injected = deps && deps.boxerClosers ? deps.boxerClosers : {};
    return {
      Boxer1_Core: injected.Boxer1_Core || injected[MODULES.BOXER1] || (
        defaultBoxer1Module && typeof defaultBoxer1Module.B1_cerrarConSubrespuestaIA === "function"
          ? function closeBoxer1(summary, subrespuesta) {
            return defaultBoxer1Module.B1_cerrarConSubrespuestaIA(summary.resultadoLocal || {}, subrespuesta);
          }
          : null
      ),
      Boxer2_Identidad: injected.Boxer2_Identidad || injected[MODULES.BOXER2] || (
        defaultBoxer2Module && typeof defaultBoxer2Module.B2_cerrarConSubrespuestaIA === "function"
          ? function closeBoxer2(summary, subrespuesta) {
            return defaultBoxer2Module.B2_cerrarConSubrespuestaIA(subrespuesta, summary.resultadoLocal || {});
          }
          : null
      ),
      Boxer3_PesoFormato: injected.Boxer3_PesoFormato || injected[MODULES.BOXER3] || (
        defaultBoxer3Module && typeof defaultBoxer3Module.B3_cerrarConSubrespuestaIA === "function"
          ? function closeBoxer3(summary, subrespuesta) {
            return defaultBoxer3Module.B3_cerrarConSubrespuestaIA(subrespuesta, summary.resultadoLocal || {});
          }
          : null
      )
    };
  }

  function collectIaBatchState(summaries) {
    var modules = [summaries.boxer1, summaries.boxer2, summaries.boxer3, summaries.boxer4].filter(Boolean);
    var tasks = [];
    var pending = [];
    var counted = 0;

    for (var i = 0; i < modules.length; i += 1) {
      var summary = modules[i];
      var state = summary.estadoIA || IA_STATES.NO_NECESITA_LLAMADA;
      if (state === IA_STATES.PENDIENTE_LOCAL) {
        pending.push(summary.modulo);
        continue;
      }
      counted += 1;
      if (state === IA_STATES.NECESITA_LLAMADA && Array.isArray(summary.tareasIA) && summary.tareasIA.length) {
        tasks = tasks.concat(summary.tareasIA);
      }
    }

    return {
      totalBoxersConvocados: modules.length,
      totalRespuestasContadas: counted,
      tareasSolicitadas: tasks.length,
      pendientes: pending,
      tasks: tasks
    };
  }

  function buildIaReviewSummary(summary, reasonCode, message) {
    var safeSummary = summary || {};
    var safeDatos = asPlainObject(safeSummary.datos) ? Object.assign({}, safeSummary.datos) : {};
    var dudas = cloneArray(safeDatos.dudas);
    var alertas = cloneArray(safeDatos.alertas);
    if (reasonCode) {
      dudas = uniqueStrings(dudas.concat([reasonCode]));
      alertas = uniqueStrings(alertas.concat([reasonCode]));
    }

    if (!safeDatos.motivo_duda && !safeDatos.motivoDuda && reasonCode) {
      safeDatos.motivo_duda = reasonCode;
    }
    safeDatos.dudas = dudas;
    safeDatos.alertas = alertas;
    if (safeSummary.modulo === MODULES.BOXER2) {
      safeDatos.conflictoIdentidad = true;
    }
    if (safeSummary.modulo === MODULES.BOXER3) {
      safeDatos.conflictoComercial = true;
    }

    return {
      modulo: safeSummary.modulo || "",
      ok: true,
      passport: PASSPORTS.NARANJA,
      confidence: safeSummary.confidence || "media",
      requiereRevision: true,
      estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
      tareasIA: [],
      huboTareaIA: !!safeSummary.huboTareaIA,
      taskIds: cloneArray(safeSummary.taskIds),
      resultadoLocal: safeSummary.resultadoLocal || null,
      datos: safeDatos,
      error: {
        code: reasonCode || "CER_IA_CIERRE_PENDIENTE",
        origin: MODULE_NAME,
        message: message || "La subtarea IA no pudo cerrarse con seguridad."
      },
      elapsedMs: Math.max(0, Number(safeSummary.elapsedMs) || 0)
    };
  }

  async function closeIaSummary(summary, subresponse, normalizedRequest, meta, deps) {
    var closers = resolveBoxerClosers(deps);
    var closer = closers[summary.modulo];

    if (typeof closer !== "function") {
      return buildIaReviewSummary(summary, "ia_cierre_no_configurado", "No existe cierre IA configurado para " + summary.modulo + ".");
    }

    try {
      var rawClosed = await closer(summary, subresponse, {
        meta: meta,
        request: normalizedRequest,
        deps: deps || {}
      });
      var validated = contratos.validateBoxerOutput(summary.modulo, rawClosed, meta.traceId);
      if (!validated.ok) {
        return buildIaReviewSummary(summary, "ia_cierre_invalido", validated.message);
      }
      return arbitraje.buildModuleSummary(summary.modulo, validated.normalized);
    } catch (err) {
      return buildIaReviewSummary(summary, "ia_cierre_excepcion", err && err.message ? err.message : "Excepcion en cierre IA.");
    }
  }

  async function resolveIaBatch(summaries, normalizedRequest, meta, deps) {
    var batchState = collectIaBatchState(summaries);
    var iaInfo = {
      huboLlamada: false,
      geminiBatchId: null,
      totalBoxersConvocados: batchState.totalBoxersConvocados,
      totalRespuestasContadas: batchState.totalRespuestasContadas,
      tareasSolicitadas: batchState.tareasSolicitadas,
      tareasResueltas: 0,
      tareasContaminadas: 0,
      tareasDescartadas: 0
    };

    if (!batchState.tasks.length) {
      return {
        summaries: summaries,
        iaInfo: iaInfo
      };
    }

    if (batchState.pendientes.length) {
      metricas.pushEvent(meta.metricCtx, "warn", "CER_IA_PENDIENTE_LOCAL", "Hay modulos aun en pendiente local; no se lanza lote IA.", {
        pendientes: batchState.pendientes
      });
      return {
        summaries: summaries,
        iaInfo: iaInfo
      };
    }

    var broker = resolveBrokerApi(deps);
    if (!broker || typeof broker.enviarLoteIA !== "function" || typeof broker.validarRespuestaLote !== "function" || typeof broker.separarSubrespuestas !== "function") {
      metricas.pushEvent(meta.metricCtx, "warn", "CER_BROKER_NO_CONFIGURADO", "Broker IA no configurado. Se deriva a revision lo pendiente.", null);
      return {
        summaries: {
          boxer1: summaries.boxer1 && summaries.boxer1.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer1, "ia_broker_no_configurado", "Broker IA no configurado.") : summaries.boxer1,
          boxer2: summaries.boxer2 && summaries.boxer2.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer2, "ia_broker_no_configurado", "Broker IA no configurado.") : summaries.boxer2,
          boxer3: summaries.boxer3 && summaries.boxer3.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer3, "ia_broker_no_configurado", "Broker IA no configurado.") : summaries.boxer3,
          boxer4: summaries.boxer4
        },
        iaInfo: iaInfo
      };
    }

    metricas.pushEvent(meta.metricCtx, "info", "CER_IA_LOTE_ENVIO", "Cerebro envia un lote unico IA.", {
      tareas: batchState.tasks.length
    });

    var sent = await broker.enviarLoteIA({
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      sessionToken: normalizedRequest.sessionToken,
      tasks: batchState.tasks,
      modelo: broker.DEFAULT_MODEL || "gemini-3.1-flash-lite-preview",
      totalBoxersConvocados: batchState.totalBoxersConvocados,
      totalRespuestasContadas: batchState.totalRespuestasContadas
    }, deps || {});

    iaInfo.huboLlamada = true;

    if (!sent || sent.ok !== true) {
      metricas.pushEvent(meta.metricCtx, "warn", sent && sent.code ? sent.code : "CER_BROKER_ENVIO_FALLIDO", sent && sent.message ? sent.message : "Fallo enviando lote IA.", sent && sent.detail ? sent.detail : null);
      return {
        summaries: {
          boxer1: summaries.boxer1 && summaries.boxer1.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer1, "ia_lote_fallido", sent && sent.message ? sent.message : "Fallo lote IA.") : summaries.boxer1,
          boxer2: summaries.boxer2 && summaries.boxer2.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer2, "ia_lote_fallido", sent && sent.message ? sent.message : "Fallo lote IA.") : summaries.boxer2,
          boxer3: summaries.boxer3 && summaries.boxer3.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer3, "ia_lote_fallido", sent && sent.message ? sent.message : "Fallo lote IA.") : summaries.boxer3,
          boxer4: summaries.boxer4
        },
        iaInfo: iaInfo
      };
    }

    var validatedBatch = broker.validarRespuestaLote(sent, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      tasks: batchState.tasks
    });
    if (!validatedBatch.ok) {
      metricas.pushEvent(meta.metricCtx, "warn", validatedBatch.code, validatedBatch.message, validatedBatch.detail || null);
      return {
        summaries: {
          boxer1: summaries.boxer1 && summaries.boxer1.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer1, "ia_respuesta_global_invalida", validatedBatch.message) : summaries.boxer1,
          boxer2: summaries.boxer2 && summaries.boxer2.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer2, "ia_respuesta_global_invalida", validatedBatch.message) : summaries.boxer2,
          boxer3: summaries.boxer3 && summaries.boxer3.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer3, "ia_respuesta_global_invalida", validatedBatch.message) : summaries.boxer3,
          boxer4: summaries.boxer4
        },
        iaInfo: iaInfo
      };
    }

    var separated = broker.separarSubrespuestas(validatedBatch, batchState.tasks);
    iaInfo.geminiBatchId = separated.geminiBatchId || (validatedBatch.normalized && validatedBatch.normalized.geminiBatchId) || null;
    iaInfo.tareasResueltas = separated.resueltas;
    iaInfo.tareasContaminadas = separated.contaminadas;
    iaInfo.tareasDescartadas = separated.descartadas;

    var nextSummaries = {
      boxer1: summaries.boxer1,
      boxer2: summaries.boxer2,
      boxer3: summaries.boxer3,
      boxer4: summaries.boxer4
    };

    var summaryList = [summaries.boxer1, summaries.boxer2, summaries.boxer3, summaries.boxer4].filter(Boolean);
    for (var i = 0; i < summaryList.length; i += 1) {
      var summary = summaryList[i];
      if (summary.estadoIA !== IA_STATES.NECESITA_LLAMADA || !Array.isArray(summary.taskIds) || !summary.taskIds.length) {
        continue;
      }

      var subresponse = null;
      for (var j = 0; j < summary.taskIds.length; j += 1) {
        var taskId = summary.taskIds[j];
        if (separated.byTaskId[taskId]) {
          subresponse = separated.byTaskId[taskId];
          break;
        }
      }

      if (!subresponse) {
        nextSummaries[summary.modulo === MODULES.BOXER1 ? "boxer1" : (summary.modulo === MODULES.BOXER2 ? "boxer2" : "boxer3")] =
          buildIaReviewSummary(summary, "ia_subrespuesta_no_resuelta", "No llego subrespuesta valida para " + summary.modulo + ".");
        continue;
      }

      var closedSummary = await closeIaSummary(summary, subresponse, normalizedRequest, meta, deps || {});
      if (summary.modulo === MODULES.BOXER1) nextSummaries.boxer1 = closedSummary;
      if (summary.modulo === MODULES.BOXER2) nextSummaries.boxer2 = closedSummary;
      if (summary.modulo === MODULES.BOXER3) nextSummaries.boxer3 = closedSummary;
    }

    metricas.pushEvent(meta.metricCtx, "info", "CER_IA_LOTE_CIERRE", "Cerebro cierra subtareas del lote IA.", {
      geminiBatchId: iaInfo.geminiBatchId,
      resueltas: iaInfo.tareasResueltas,
      contaminadas: iaInfo.tareasContaminadas,
      descartadas: iaInfo.tareasDescartadas
    });

    return {
      summaries: nextSummaries,
      iaInfo: iaInfo
    };
  }

  async function routeDecision(decision, finalData, meta, deps) {
    var customDestinations = deps && deps.destinations ? deps.destinations : {};
    var persistencia = resolveProductosPersistencia(deps);
    var now = Date.now();
    var idempotencyKey = buildDecisionIdempotencyKey(decision, meta);
    var dedupeEnabled = (
      decision &&
      (decision.decisionFlow === contratos.DECISION_FLOW.GUARDAR ||
       decision.decisionFlow === contratos.DECISION_FLOW.REVISION) &&
      !!idempotencyKey
    );
    if (dedupeEnabled) {
      var cached = readRouteIdempotency(idempotencyKey, now);
      if (cached) return cached;
    }

    var destinations = {
      guardarResultadoAnalizado: customDestinations.guardarResultadoAnalizado || (
        persistencia && typeof persistencia.guardarResultadoAnalizado === "function" && hasProductRepository(deps)
          ? function guardarResultado(payload) {
            return persistencia.guardarResultadoAnalizado(payload, deps || {});
          }
          : null
      ),
      abrirRevisionProducto: customDestinations.abrirRevisionProducto || null
    };

    if (decision.decisionFlow === contratos.DECISION_FLOW.GUARDAR && typeof destinations.guardarResultadoAnalizado === "function") {
      var saveResult = await destinations.guardarResultadoAnalizado({
        analysisId: meta.analysisId,
        traceId: meta.traceId,
        batchId: meta.batchId || null,
        idempotencyKey: idempotencyKey || null,
        propuestaFinal: finalData.propuestaFinal,
        datos: finalData
      });
      if (dedupeEnabled && saveResult && saveResult.ok === true) {
        storeRouteIdempotency(idempotencyKey, saveResult, now);
      }
      return saveResult;
    }

    if (decision.decisionFlow === contratos.DECISION_FLOW.REVISION && typeof destinations.abrirRevisionProducto === "function") {
      var reviewResult = await destinations.abrirRevisionProducto({
        analysisId: meta.analysisId,
        traceId: meta.traceId,
        batchId: meta.batchId || null,
        idempotencyKey: idempotencyKey || null,
        propuestaFinal: finalData.propuestaFinal,
        datos: finalData
      });
      if (dedupeEnabled && reviewResult && reviewResult.ok === true) {
        storeRouteIdempotency(idempotencyKey, reviewResult, now);
      }
      return reviewResult;
    }

    return {
      ok: true,
      routed: false
    };
  }

  async function solicitarAnalisisFoto(request, deps) {
    var validation = contratos.validateIncomingRequest(request);
    if (!validation.ok) {
      var invalidMeta = metricas.startOperation({});
      metricas.pushEvent(invalidMeta, "error", validation.code, validation.message, validation.detail || null);
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        traceId: invalidMeta.traceId,
        elapsedMs: metricas.elapsedSince(invalidMeta.startedAt),
        metricas: metricas.finalizeMetricas(invalidMeta)
      }, {
        code: ERROR_CODES.CONTRATO_ENTRADA_INVALIDO,
        message: validation.message,
        suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        tipoFallo: FAIL_TYPES.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        datos: buildFailureData(invalidMeta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.BLOQUEO,
          suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
          conflicts: [validation.code]
        })
      });
    }

    var normalizedRequest = validation.normalized;
    var meta = buildMeta(normalizedRequest);
    var gateway = deps && deps.gateway ? deps.gateway : defaultGateway;
    var repositoryResolution = ensureResolvedProductRepository(deps || {});
    if (!gateway || typeof gateway.invokeBoxer !== "function") {
      metricas.pushEvent(meta.metricCtx, "error", ERROR_CODES.ARBITRAJE_IMPOSIBLE, "Gateway Boxer no configurado.", null);
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: ERROR_CODES.ARBITRAJE_IMPOSIBLE,
        message: "Cerebro no tiene gateway Boxer configurado.",
        suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        tipoFallo: FAIL_TYPES.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        datos: buildFailureData(meta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.BLOQUEO,
          suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
          conflicts: ["gateway_boxer_no_configurado"]
        })
      });
    }
    if (!repositoryResolution.ok) {
      metricas.pushEvent(meta.metricCtx, "error", repositoryResolution.code, repositoryResolution.message, repositoryResolution.detail || null);
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: repositoryResolution.code,
        message: repositoryResolution.message,
        suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        tipoFallo: FAIL_TYPES.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        datos: buildFailureData(meta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.BLOQUEO,
          suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
          conflicts: ["repositorio_productos_no_disponible"]
        })
      });
    }
    var effectiveDeps = repositoryResolution.deps;

    metricas.pushEvent(meta.metricCtx, "info", "CER_ANALISIS_INICIO", "Cerebro abre operacion de analisis.", {
      contextoAlta: normalizedRequest.datos.contextoAlta,
      productCollectionName: effectiveDeps.productCollectionName || null,
      productRepositorySource: effectiveDeps.productRepositorySource || null
    });

    var boxer1Data = {
      imageRef: normalizedRequest.datos.imageRef,
      imageRefs: normalizedRequest.datos.imageRefs,
      sendMode: normalizedRequest.datos.sendMode,
      contextoAlta: normalizedRequest.datos.contextoAlta,
      controlesUsuario: normalizedRequest.datos.controlesUsuario,
      agentEnabled: normalizedRequest.datos.controlesUsuario.agentEnabled,
      sensitivityMode: normalizedRequest.datos.controlesUsuario.sensitivityMode,
      timeBudgetMs: normalizedRequest.datos.controlesUsuario.timeBudgetMs,
      expect: normalizedRequest.datos.controlesUsuario.expect
    };

    var boxer1 = await invokeAndValidate(MODULES.BOXER1, ACTIONS.ANALIZAR_TEXTO_ETIQUETA, boxer1Data, normalizedRequest, meta, {
      gateway: gateway,
      handlers: effectiveDeps && effectiveDeps.handlers ? effectiveDeps.handlers : {},
      destinations: effectiveDeps && effectiveDeps.destinations ? effectiveDeps.destinations : {},
      duplicateDetector: effectiveDeps && effectiveDeps.duplicateDetector ? effectiveDeps.duplicateDetector : null
    });

    if (!boxer1.ok) {
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: ERROR_CODES.SALIDA_BOXER_INCOMPATIBLE,
        message: boxer1.message,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        tipoFallo: FAIL_TYPES.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        datos: buildFailureData(meta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.ABORTADO,
          suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
          conflicts: ["salida_boxer1_incompatible"]
        })
      });
    }

    var boxer1Summary = arbitraje.buildModuleSummary(MODULES.BOXER1, boxer1.normalized);
    if (!arbitraje.boxer1Usable(boxer1Summary)) {
      metricas.pushEvent(meta.metricCtx, "error", ERROR_CODES.ARBITRAJE_IMPOSIBLE, "Boxer1 no entrego salida utilizable.", null);
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: ERROR_CODES.ARBITRAJE_IMPOSIBLE,
        message: boxer1.normalized.error && boxer1.normalized.error.message
          ? boxer1.normalized.error.message
          : "Boxer1 no entrego salida utilizable.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        tipoFallo: FAIL_TYPES.REPARACION_AGOTADA,
        retryable: true,
        datos: buildFailureData(meta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.ABORTADO,
          suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
          conflicts: ["boxer1_no_utilizable"],
          roiRefsRevision: Array.isArray(boxer1Summary.datos.roiRefsRevision) ? boxer1Summary.datos.roiRefsRevision : [],
          summaries: { boxer1: boxer1Summary }
        })
      });
    }

    var downstreamData = buildDownstreamData(boxer1Summary, normalizedRequest);

    var fanoutDeps = {
      gateway: gateway,
      handlers: effectiveDeps && effectiveDeps.handlers ? effectiveDeps.handlers : {},
      destinations: effectiveDeps && effectiveDeps.destinations ? effectiveDeps.destinations : {},
      duplicateDetector: effectiveDeps && effectiveDeps.duplicateDetector ? effectiveDeps.duplicateDetector : null,
      productRepository: effectiveDeps.productRepository
    };

    var fanout = await Promise.all([
      invokeAndValidate(MODULES.BOXER2, ACTIONS.RESOLVER_IDENTIDAD, downstreamData, normalizedRequest, meta, fanoutDeps),
      invokeAndValidate(MODULES.BOXER3, ACTIONS.RESOLVER_FORMATO, downstreamData, normalizedRequest, meta, fanoutDeps),
      invokeAndValidate(MODULES.BOXER4, ACTIONS.CLASIFICAR_ALERGENOS, downstreamData, normalizedRequest, meta, fanoutDeps)
    ]);

    var invalidFanout = fanout.find(function each(item) { return !item.ok; });
    if (invalidFanout) {
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: ERROR_CODES.SALIDA_BOXER_INCOMPATIBLE,
        message: invalidFanout.message,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        tipoFallo: FAIL_TYPES.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        datos: buildFailureData(meta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.ABORTADO,
          suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
          conflicts: ["salida_boxer_incompatible"],
          roiRefsRevision: Array.isArray(boxer1Summary.datos.roiRefsRevision) ? boxer1Summary.datos.roiRefsRevision : [],
          summaries: { boxer1: boxer1Summary }
        })
      });
    }

    var boxer2Summary = arbitraje.buildModuleSummary(MODULES.BOXER2, fanout[0].normalized);
    var boxer3Summary = arbitraje.buildModuleSummary(MODULES.BOXER3, fanout[1].normalized);
    var boxer4Summary = arbitraje.buildModuleSummary(MODULES.BOXER4, fanout[2].normalized);

    var summaries = {
      boxer1: boxer1Summary,
      boxer2: boxer2Summary,
      boxer3: boxer3Summary,
      boxer4: boxer4Summary
    };

    var iaResolution = await resolveIaBatch(summaries, normalizedRequest, meta, effectiveDeps || {});
    summaries = iaResolution.summaries;
    var iaInfo = iaResolution.iaInfo;

    if (shouldRefreshDownstreamFromBoxer1(boxer1Summary, summaries.boxer1)) {
      metricas.pushEvent(meta.metricCtx, "info", "CER_BOXER1_CORREGIDO", "Cerebro relanza Boxer2/3/4 con el texto corregido de Boxer1.", null);
      var refresh = await rerunDownstreamWithCorrectedBoxer1(summaries.boxer1, normalizedRequest, meta, effectiveDeps || {});
      if (!refresh.ok) {
        return errores.buildFailureEnvelope(buildContext(meta), {
          code: ERROR_CODES.SALIDA_BOXER_INCOMPATIBLE,
          message: refresh.message || "No se pudo refrescar Boxer2/3/4 tras corregir Boxer1.",
          suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
          tipoFallo: FAIL_TYPES.IRRECUPERABLE_POR_DISENO,
          retryable: false,
          datos: buildFailureData(meta, {
            passport: PASSPORTS.ROJO,
            decisionFlow: contratos.DECISION_FLOW.ABORTADO,
            suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
            conflicts: ["refresh_downstream_boxer1_fallido"],
            roiRefsRevision: Array.isArray(summaries.boxer1 && summaries.boxer1.datos && summaries.boxer1.datos.roiRefsRevision)
              ? summaries.boxer1.datos.roiRefsRevision
              : [],
            summaries: summaries
          })
        });
      }
      summaries = refresh.summaries;
    }

    if (isTimeBudgetExpired(meta, normalizedRequest)) {
      metricas.pushEvent(meta.metricCtx, "error", ERROR_CODES.TIMEOUT_OPERACION || "CER_TIMEOUT_OPERACION", "Cerebro detiene el flujo por timeout global.", null);
      return buildTimeoutEnvelope(meta, summaries);
    }

    var proposal = arbitraje.getProposal(summaries);
    var dudas = arbitraje.collectDudas(summaries);
    var conflicts = arbitraje.collectConflicts(summaries, proposal);
    var duplicateInfo = await resolveDuplicateInfo(normalizedRequest, proposal, effectiveDeps || {});
    if (!duplicateInfo.ok) {
      metricas.pushEvent(meta.metricCtx, "error", duplicateInfo.errorCode || ERROR_CODES.REPOSITORIO_PRODUCTOS_NO_DISPONIBLE, duplicateInfo.message || "No se pudo consultar productos reales.", null);
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: duplicateInfo.errorCode || ERROR_CODES.REPOSITORIO_PRODUCTOS_NO_DISPONIBLE,
        message: duplicateInfo.message || "No se pudo consultar productos reales.",
        suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        tipoFallo: FAIL_TYPES.DESCONOCIDO,
        retryable: true,
        datos: buildFailureData(meta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.BLOQUEO,
          suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
          conflicts: ["duplicados_reales_no_disponibles"],
          roiRefsRevision: Array.isArray(boxer1Summary.datos.roiRefsRevision) ? boxer1Summary.datos.roiRefsRevision : [],
          summaries: summaries
        })
      });
    }
    var decision = arbitraje.classifyDecision({
      boxer1: summaries.boxer1,
      boxer2: summaries.boxer2,
      boxer3: summaries.boxer3,
      boxer4: summaries.boxer4,
      proposal: proposal,
      dudas: dudas,
      conflicts: conflicts,
      possibleDuplicate: duplicateInfo.posibleDuplicado,
      mergeableDuplicate: duplicateInfo.fusionable
    });
    var finalData = arbitraje.buildFinalData({
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      elapsedMs: metricas.elapsedSince(meta.startedAt)
    }, summaries, decision, duplicateInfo, iaInfo);

    metricas.pushEvent(meta.metricCtx, decision.passport === PASSPORTS.VERDE ? "info" : "warn", "CER_DECISION_FINAL", "Cerebro decide el destino del caso.", {
      passport: decision.passport,
      decisionFlujo: decision.decisionFlow,
      posibleDuplicado: finalData.duplicados.posibleDuplicado
    });

    if (isTimeBudgetExpired(meta, normalizedRequest)) {
      metricas.pushEvent(meta.metricCtx, "error", ERROR_CODES.TIMEOUT_OPERACION || "CER_TIMEOUT_OPERACION", "Cerebro evita efectos laterales por timeout global.", null);
      return buildTimeoutEnvelope(meta, summaries);
    }

    var routeResult = await routeDecision(decision, finalData, meta, effectiveDeps || {});
    if (routeResult && routeResult.ok === false) {
      metricas.pushEvent(meta.metricCtx, "error", ERROR_CODES.DESTINO_INTERNO_FALLIDO, "Fallo el destino interno de Cerebro.", routeResult);
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: ERROR_CODES.DESTINO_INTERNO_FALLIDO,
        message: routeResult.message || "Fallo al entregar la salida de Cerebro.",
        suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        tipoFallo: FAIL_TYPES.DESCONOCIDO,
        retryable: true,
        datos: finalData
      });
    }

    if (decision.passport === PASSPORTS.ROJO) {
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: decision.errorCode || ERROR_CODES.ARBITRAJE_IMPOSIBLE,
        message: "Cerebro no pudo gobernar el caso con seguridad.",
        suggestedAction: decision.suggestedAction,
        tipoFallo: decision.failType || FAIL_TYPES.DESCONOCIDO,
        retryable: decision.suggestedAction !== SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        datos: finalData
      });
    }

    return {
      ok: true,
      resultado: {
        estadoPasaporteModulo: decision.passport,
        modulo: MODULE_NAME,
        accionSugeridaParaCerebro: decision.suggestedAction,
        elapsedMs: metricas.elapsedSince(meta.startedAt),
        traceId: meta.traceId,
        datos: finalData
      },
      error: null,
      metricas: metricas.finalizeMetricas(meta.metricCtx)
    };
  }

  async function procesarAccionContrato(request, deps) {
    return solicitarAnalisisFoto(request, deps);
  }

  var api = {
    MODULE_NAME: MODULE_NAME,
    CONTRACT_VERSION: contratos.CONTRACT_VERSION,
    ACTION_SOLICITAR_ANALISIS_FOTO: ACTIONS.SOLICITAR_ANALISIS_FOTO,
    solicitarAnalisisFoto: solicitarAnalisisFoto,
    procesarAccionContrato: procesarAccionContrato
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroOrquestador = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);



