(function initGestionRegistrosUi(globalScope) {
  "use strict";

  var SYNC_TRIGGER_COOLDOWN_MS = 1500;
  var ENTRY_CLOUD_RECOVERY_RETRY_MS = Object.freeze([800, 2500, 6000]);
  var ICON_BASE_PATH = "../../assets/icons/";
  var TIPOGRAFIA_OFICIAL_APP_MELIA = Object.freeze({
    family: "\"Graphik\", Arial, sans-serif",
    weights: Object.freeze({ regular: 400, medium: 500, bold: 700 }),
    sizes: Object.freeze({
      title: "24px",
      cardTitle: "18px",
      body: "16px",
      secondary: "14px",
      small: "12px"
    }),
    lineHeights: Object.freeze({
      title: "30px",
      cardTitle: "24px",
      body: "24px",
      secondary: "20px",
      small: "16px"
    })
  });
  var ESTADO_PANTALLA_FASE9 = Object.freeze({
    searchText: "",
    selectedAllergenIds: [],
    sinActivo: false,
    pendingOnly: false,
    visibleLimit: 60,
    pageSize: 60,
    lastSyncTriggerAt: 0
  });
  var SHARED_BROWSER_STORE_KEY = "fase3_shared_browser_store_v1";
  var SESSION_TOKEN_STORAGE_KEY = "fase5_visible_session_token";
  var ACCESS_SCREEN_PATH = "./acceso.html";
  var SESSION_REQUIRED_MESSAGE = "Sesion requerida. Inicia sesion.";
  var ALLERGEN_DISPLAY_SETTINGS_KEY = "appv2_allergen_card_display_v1";
  var LOCAL_PRODUCT_HISTORY_KEY = "appv2_product_history_local_v1";
  var FASE11_DIAGNOSTICO_STORAGE_KEY = "fase11_diagnostico_actual_v1";
  var FEEDBACK_DURATION_MS = 2200;
  var DYNAMIC_SCRIPT_PROMISES = Object.create(null);
  var PHOTO_RUNTIME_SCRIPT_PATHS = Object.freeze([
    "../../backend/boxer1/backend/operativa/B1_enums.js",
    "../../backend/boxer1/backend/operativa/B1_contratos_unificado_patch.js",
    "../../backend/boxer1/backend/operativa/B1_diagnostico_unificado_patch.js",
    "../../backend/boxer1/backend/operativa/B1_prechequeo_unificado_patch.js",
    "../../backend/boxer1/backend/operativa/B1_ocr_base_unificado_patch.js",
    "../../backend/boxer1/backend/operativa/B1_fiabilidad.js",
    "../../backend/boxer1/backend/operativa/B1_catalogos.js",
    "../../backend/boxer1/backend/operativa/B1_motor_coste_ocr.js",
    "../../backend/boxer1/backend/operativa/B1_slots_empaquetador.js",
    "../../backend/boxer1/backend/operativa/B1_rescate.js",
    "../../backend/boxer1/backend/operativa/B1_merge.js",
    "../../backend/boxer1/backend/adaptadores/B1_fase5_adapter.js",
    "../../backend/boxer1/backend/operativa/B1_core.js",
    "../ia/boxer3_motor.js",
    "../ia/Boxer4_Motor.js",
    "../ia/boxer2_contratos.js",
    "../ia/boxer2_errores.js",
    "../ia/boxer2_identidad.js",
    "../ia/boxer3_contratos.js",
    "../ia/boxer3_errores.js",
    "../ia/boxer3_peso_formato.js",
    "../ia/boxer4_contratos.js",
    "../ia/boxer4_errores.js",
    "../ia/boxer4_alergenos.js",
    "../../backend/ia/boxer_family_gateway.js",
    "../../backend/ia/cerebro_broker_ia.js",
    "../../backend/ia/cerebro_productos_repository_resolver.js",
    "../ia/cerebro_contratos.js",
    "../ia/cerebro_errores.js",
    "../ia/cerebro_metricas.js",
    "../ia/cerebro_arbitraje.js",
    "../ia/cerebro_orquestador.js"
  ]);

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var el = byId(id);
    if (!el) return;
    el.textContent = String(value || "");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cloneArray(items) {
    return Array.isArray(items) ? items.slice(0) : [];
  }

  function cloneVisuales(items) {
    return Array.isArray(items)
      ? items.map(function cloneVisual(item) {
        return Object.assign({}, item || {});
      })
      : [];
  }

  function cloneValue(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function normalizeTextKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function combineNameAndFormat(nombre, formato) {
    var safeName = String(nombre || "").trim();
    var safeFormat = String(formato || "").trim();
    if (!safeFormat) return safeName;
    if (normalizeTextKey(safeName).indexOf(normalizeTextKey(safeFormat)) >= 0) return safeName;
    return String(safeName + " " + safeFormat).trim();
  }

  function getAnalysisRuntime() {
    return globalScope.AnalysisExclusiveRuntime || null;
  }

  function getDeferredVisualQueue() {
    return globalScope.DeferredVisualQueue || null;
  }

  function traceAnalysisEvent(name, data, meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.trace !== "function") return;
    runtime.trace(name, data || null, Object.assign({ source: "gestion_registros" }, meta || {}));
  }

  function requestAnalysisExclusive(meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.requestExclusive !== "function") return;
    runtime.requestExclusive(Object.assign({ source: "gestion_registros" }, meta || {}));
  }

  function attachAnalysisMeta(meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.attachMeta !== "function") return;
    runtime.attachMeta(Object.assign({ source: "gestion_registros" }, meta || {}));
  }

  function markAnalysisStarted(meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.markAnalysisStarted !== "function") return;
    runtime.markAnalysisStarted(Object.assign({ source: "gestion_registros" }, meta || {}));
  }

  function markAnalysisResultVisible(data, meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.markResultVisible !== "function") return;
    runtime.markResultVisible(data || null, Object.assign({ source: "gestion_registros" }, meta || {}));
  }

  function resumeAnalysisExclusive(meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.resumeProgressively !== "function") return;
    runtime.resumeProgressively(Object.assign({ source: "gestion_registros" }, meta || {}));
  }

  function cancelAnalysisExclusive(meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.cancelExclusive !== "function") return;
    runtime.cancelExclusive(Object.assign({ source: "gestion_registros" }, meta || {}));
  }

  function runDeferredNonessential(taskName, options, run) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.runOrDefer !== "function") {
      return Promise.resolve(typeof run === "function" ? run() : null);
    }
    return runtime.runOrDefer(taskName, Object.assign({ source: "gestion_registros" }, options || {}), run);
  }

  function makeFase11Id(prefix) {
    return String(prefix || "fase11") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  function getFase11Store() {
    if (!globalScope.Fase11DiagnosticoStore || typeof globalScope.Fase11DiagnosticoStore.getDefaultStore !== "function") {
      return null;
    }
    return globalScope.Fase11DiagnosticoStore.getDefaultStore();
  }

  function stringifyDiagnostic(value) {
    if (value == null || value === "") return "";
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch (errJson) {
      return String(value);
    }
  }

  function readFase11FallbackSnapshot() {
    try {
      if (!globalScope.localStorage) return null;
      var raw = globalScope.localStorage.getItem(FASE11_DIAGNOSTICO_STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (errDiagRead) {
      return null;
    }
  }

  function writeFase11FallbackSnapshot(snapshot) {
    try {
      if (!globalScope.localStorage) return;
      globalScope.localStorage.setItem(FASE11_DIAGNOSTICO_STORAGE_KEY, JSON.stringify(snapshot || {}));
    } catch (errDiagWrite) {
      // El diagnostico nunca debe bloquear el alta.
    }
  }

  function makeFase11Event(level, moduleName, action, message, rawDetail, durationMs) {
    var now = Date.now();
    return {
      eventId: makeFase11Id("evt"),
      createdAt: new Date(now).toISOString(),
      createdAtMs: now,
      level: String(level || "INFO").toUpperCase(),
      module: String(moduleName || "Sistema"),
      action: String(action || "evento"),
      message: String(message || "Sin detalle."),
      rawDetail: stringifyDiagnostic(rawDetail).slice(0, 1200),
      durationMs: Number.isFinite(Number(durationMs)) ? Number(durationMs) : null
    };
  }

  function addFase11FallbackEvent(event) {
    var snapshot = readFase11FallbackSnapshot() || {
      caseId: makeFase11Id("fase11_case"),
      status: "open",
      openedAt: new Date().toISOString(),
      closedAt: null,
      events: []
    };
    var events = Array.isArray(snapshot.events) ? snapshot.events.slice(-39) : [];
    events.push(event);
    snapshot.status = "open";
    snapshot.closedAt = null;
    snapshot.events = events;
    writeFase11FallbackSnapshot(snapshot);
  }

  function openFase11PhotoCase(caseId, fotoRefs) {
    var safeCaseId = String(caseId || "").trim() || makeFase11Id("alta_foto_normal");
    var store = getFase11Store();
    if (store && typeof store.openCase === "function") {
      store.openCase({
        caseId: safeCaseId,
        module: "Alta foto",
        action: "analisis normal",
        message: "Analisis por foto iniciado con " + (fotoRefs || []).length + " foto(s)."
      });
      return;
    }
    writeFase11FallbackSnapshot({
      caseId: safeCaseId,
      status: "open",
      openedAt: new Date().toISOString(),
      closedAt: null,
      events: [
        makeFase11Event("INFO", "Alta foto", "analisis normal", "Analisis por foto iniciado con " + (fotoRefs || []).length + " foto(s).", null, null)
      ]
    });
  }

  function addFase11DiagnosticEvent(level, moduleName, action, message, rawDetail, durationMs) {
    var store = getFase11Store();
    if (store && typeof store.addEvent === "function") {
      store.addEvent({
        level: level || "INFO",
        module: moduleName || "Sistema",
        action: action || "evento",
        message: message || "Sin detalle.",
        rawDetail: stringifyDiagnostic(rawDetail),
        durationMs: durationMs
      });
      return;
    }
    addFase11FallbackEvent(makeFase11Event(level, moduleName, action, message, rawDetail, durationMs));
  }

  function closeFase11PhotoCase(ok, message, durationMs, rawDetail) {
    addFase11DiagnosticEvent(ok ? "INFO" : "ERROR", "Alta foto", "resultado analisis", message, rawDetail, durationMs);
    var store = getFase11Store();
    if (store && typeof store.closeCase === "function") {
      store.closeCase({
        level: ok ? "INFO" : "ERROR",
        module: "Alta foto",
        action: "fin analisis",
        message: ok ? "Caso tecnico cerrado." : "Caso tecnico cerrado con error.",
        durationMs: durationMs
      });
      return;
    }
    var snapshot = readFase11FallbackSnapshot();
    if (!snapshot) return;
    snapshot.status = "closed";
    snapshot.closedAt = new Date().toISOString();
    writeFase11FallbackSnapshot(snapshot);
  }

  function getAllergenDisplayMode() {
    try {
      if (!globalScope.localStorage) return "texto";
      var saved = String(globalScope.localStorage.getItem(ALLERGEN_DISPLAY_SETTINGS_KEY) || "").trim().toLowerCase();
      return saved === "iconos" ? "iconos" : "texto";
    } catch (errMode) {
      return "texto";
    }
  }

  function setElementText(element, value) {
    if (!element) return;
    element.textContent = String(value || "");
  }

  function loadScriptOnce(src) {
    var safeSrc = String(src || "").trim();
    if (!safeSrc) return Promise.resolve();
    if (DYNAMIC_SCRIPT_PROMISES[safeSrc]) {
      return DYNAMIC_SCRIPT_PROMISES[safeSrc];
    }
    DYNAMIC_SCRIPT_PROMISES[safeSrc] = new Promise(function executor(resolve, reject) {
      var script = document.createElement("script");
      script.src = safeSrc;
      script.async = false;
      script.onload = function onLoad() {
        resolve();
      };
      script.onerror = function onError() {
        reject(new Error("No se pudo cargar " + safeSrc));
      };
      document.head.appendChild(script);
    });
    return DYNAMIC_SCRIPT_PROMISES[safeSrc];
  }

  function resolveStore(globalScope) {
    var sharedApi = globalScope && globalScope.Fase3SharedBrowserStore;
    if (sharedApi && typeof sharedApi.createSharedProductStore === "function") {
      return sharedApi.createSharedProductStore();
    }
    return globalScope.Fase3DataStoreLocal.createMemoryProductStore();
  }

  function isOnline() {
    if (typeof navigator === "undefined" || typeof navigator.onLine !== "boolean") return true;
    return navigator.onLine;
  }

  function getFirebaseRuntime() {
    return globalScope.Fase3FirebaseRuntime || null;
  }

  function listPendingRevisionDraftsFromStore(store) {
    if (!store) return [];
    if (typeof store.listPendingRevisionDrafts === "function") {
      return store.listPendingRevisionDrafts();
    }
    if (typeof store.listRevisionDrafts === "function") {
      return store.listRevisionDrafts().filter(function onlyPending(draft) {
        return String(draft && draft.estado || "").trim().toUpperCase() === "PENDIENTE_REVISION";
      });
    }
    return [];
  }

  function countPendingRevisionDraftsFromStore(store) {
    if (!store) return 0;
    if (typeof store.countPendingRevisionDrafts === "function") {
      return Number(store.countPendingRevisionDrafts()) || 0;
    }
    return listPendingRevisionDraftsFromStore(store).length;
  }

  function buildRevisionUrl(draftId) {
    var safeDraftId = String(draftId || "").trim();
    if (!safeDraftId) return "./revision.html";
    return "./revision.html?draftId=" + encodeURIComponent(safeDraftId);
  }

  function buildRevisionPendingButtonState(store) {
    var drafts = listPendingRevisionDraftsFromStore(store);
    var count = drafts.length;
    var firstDraft = count ? drafts[0] : null;
    return {
      visible: count > 0,
      count: count,
      firstDraftId: firstDraft ? String(firstDraft.draftId || "").trim() : "",
      text: count === 1 ? "1 Pendiente de revisión" : count + " Pendientes de revisión",
      url: buildRevisionUrl(firstDraft ? firstDraft.draftId : "")
    };
  }

  function readSessionToken(state) {
    if (state && state.runtime && typeof state.runtime.getSessionToken === "function") {
      return String(state.runtime.getSessionToken() || "").trim();
    }
    var runtime = getFirebaseRuntime();
    if (runtime && typeof runtime.getSessionToken === "function") {
      return String(runtime.getSessionToken() || "").trim();
    }
    try {
      return globalScope.localStorage ? String(globalScope.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY) || "").trim() : "";
    } catch (errToken) {
      return "";
    }
  }

  function markSessionRequiredState(state, enabled) {
    if (!state) return;
    state.sessionRequired = !!enabled;
    if (enabled) {
      state.lastCloudCount = null;
      state.lastCloudLoadedAt = null;
    }
  }

  function buildAccessUrl() {
    return ACCESS_SCREEN_PATH;
  }

  function redirectToAccess(state) {
    if (!globalScope || !globalScope.location) return false;
    if (state && state.sessionRedirecting) return false;
    if (state) state.sessionRedirecting = true;
    globalScope.location.href = buildAccessUrl();
    return false;
  }

  function ensureSessionTokenOrRedirect(state, options) {
    var safeOptions = options || {};
    var token = readSessionToken(state);
    if (token) {
      markSessionRequiredState(state, false);
      return token;
    }
    markSessionRequiredState(state, true);
    renderSyncStatus(state, SESSION_REQUIRED_MESSAGE);
    renderCloudChip(state);
    if (safeOptions.redirect !== false) {
      redirectToAccess(state);
    }
    return "";
  }

  function normalizeHistoryName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function readLocalProductHistory() {
    try {
      if (!globalScope.localStorage) return [];
      var raw = globalScope.localStorage.getItem(LOCAL_PRODUCT_HISTORY_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (errHistoryRead) {
      return [];
    }
  }

  function writeLocalProductHistory(items) {
    try {
      if (!globalScope.localStorage) return;
      globalScope.localStorage.setItem(
        LOCAL_PRODUCT_HISTORY_KEY,
        JSON.stringify(Array.isArray(items) ? items.slice(0, 30) : [])
      );
    } catch (errHistoryWrite) {
      // El historial visible no debe bloquear la operativa normal.
    }
  }

  function compareHistoryDesc(a, b) {
    var aMs = Date.parse(String(a && a.occurredAt || "")) || 0;
    var bMs = Date.parse(String(b && b.occurredAt || "")) || 0;
    if (aMs !== bMs) return bMs - aMs;
    return String(b && b.eventId || "").localeCompare(String(a && a.eventId || ""));
  }

  function appendLocalProductHistory(record) {
    if (!record || !record.eventType) return;
    var next = [cloneValue(record)];
    var eventId = String(record.eventId || "").trim();
    readLocalProductHistory().forEach(function each(item) {
      if (!item || !item.eventType) return;
      if (eventId && String(item.eventId || "").trim() === eventId) return;
      next.push(item);
    });
    next.sort(compareHistoryDesc);
    writeLocalProductHistory(next);
  }

  function resolveVisibleHistoryApis() {
    return {
      core: globalScope.Fase7HistorialCore || null,
      fields: globalScope.Fase7HistorialCampos || null
    };
  }

  function buildVisibleHistoryActorId(state) {
    var token = readSessionToken(state);
    return token ? "sesion_" + token.slice(0, 8) : "usuario_local";
  }

  function findExistingActiveProductByName(store, rawName) {
    if (!store || typeof store.listProductsForUi !== "function") return null;
    var target = normalizeHistoryName(rawName);
    if (!target) return null;
    var items = store.listProductsForUi({ onlyPending: false, includeDeleted: false });
    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      var itemName = item && item.identidad
        ? String(item.identidad.nombreNormalizado || item.identidad.nombre || "")
        : "";
      if (normalizeHistoryName(itemName) === target) {
        return cloneValue(item);
      }
    }
    return null;
  }

  function buildVisibleHistoryRecord(state, eventType, beforeRecord, afterRecord, forcedEventId) {
    var apis = resolveVisibleHistoryApis();
    if (!apis.core || !apis.fields) return null;
    var actorId = buildVisibleHistoryActorId(state);
    var options = {
      occurredAt: new Date().toISOString()
    };
    if (String(forcedEventId || "").trim()) {
      options.eventId = String(forcedEventId).trim();
    }

    if (eventType === apis.fields.EVENT_TYPES.PRODUCT_CREATED && afterRecord && afterRecord.id) {
      return apis.core.construirRegistro(
        apis.fields.EVENT_TYPES.PRODUCT_CREATED,
        afterRecord.id,
        afterRecord.identidad && afterRecord.identidad.nombre ? afterRecord.identidad.nombre : afterRecord.id,
        actorId,
        null,
        null,
        options
      );
    }

    if (eventType === apis.fields.EVENT_TYPES.PRODUCT_UPDATED && beforeRecord && afterRecord && afterRecord.id) {
      var diff = apis.core.construirDiff(beforeRecord, afterRecord);
      if (!Array.isArray(diff.changedFields) || !diff.changedFields.length) return null;
      return apis.core.construirRegistro(
        apis.fields.EVENT_TYPES.PRODUCT_UPDATED,
        afterRecord.id,
        afterRecord.identidad && afterRecord.identidad.nombre ? afterRecord.identidad.nombre : afterRecord.id,
        actorId,
        diff.changedFields,
        diff.changeDetail,
        options
      );
    }

    if (eventType === apis.fields.EVENT_TYPES.PRODUCT_DELETED && beforeRecord && beforeRecord.id) {
      return apis.core.construirRegistro(
        apis.fields.EVENT_TYPES.PRODUCT_DELETED,
        beforeRecord.id,
        beforeRecord.identidad && beforeRecord.identidad.nombre ? beforeRecord.identidad.nombre : beforeRecord.id,
        actorId,
        null,
        null,
        options
      );
    }

    return null;
  }

  function recordVisibleHistory(state, eventType, beforeRecord, afterRecord, forcedEventId) {
    try {
      var record = buildVisibleHistoryRecord(state, eventType, beforeRecord, afterRecord, forcedEventId);
      if (!record) return;
      appendLocalProductHistory(record);
    } catch (errVisibleHistory) {
      // El historial visible no debe bloquear guardados ni borrados.
    }
  }

  function resolveRemoteIndex(state) {
    var runtime = getFirebaseRuntime();
    if (!runtime || runtime.ok !== true) {
      return {
        ok: false,
        errorCode: runtime && runtime.errorCode ? runtime.errorCode : "FIREBASE_RUNTIME_NO_LISTO",
        message: runtime && runtime.message ? runtime.message : "Firebase aun no esta listo."
      };
    }
    if (!globalScope.Fase3FirestoreProductosRemote) {
      return {
        ok: false,
        errorCode: "FIREBASE_ADAPTADOR_NO_CARGADO",
        message: "Falta el adaptador Firestore de productos."
      };
    }

    var remote = globalScope.Fase3FirestoreProductosRemote.createFirestoreProductosRemote({
      firebaseApp: runtime.app,
      firestoreModule: runtime.firestoreModule,
      collectionName: "fase3_productos",
      waitForAuth: typeof runtime.waitForAuth === "function" ? runtime.waitForAuth : null,
      tokenValidator: function tokenValidator(token) {
        return String(token || "").trim().length > 0;
      }
    });
    if (!remote || remote.ok !== true) {
      return {
        ok: false,
        errorCode: remote && remote.errorCode ? remote.errorCode : "FIREBASE_PRODUCTOS_NO_LISTO",
        message: remote && remote.message ? remote.message : "No se pudo preparar productos."
      };
    }

    state.remoteIndex = remote;
    return { ok: true, remoteIndex: remote };
  }

  function resolveRemoteAssetIndex(state) {
    var runtime = getFirebaseRuntime();
    if (!runtime || runtime.ok !== true) {
      return {
        ok: false,
        errorCode: runtime && runtime.errorCode ? runtime.errorCode : "FIREBASE_RUNTIME_NO_LISTO",
        message: runtime && runtime.message ? runtime.message : "Firebase aun no esta listo."
      };
    }
    if (!globalScope.Fase4FirestoreActivosIndexRemote) {
      return {
        ok: false,
        errorCode: "FIREBASE_ACTIVOS_ADAPTADOR_NO_CARGADO",
        message: "Falta el adaptador de miniaturas ligeras."
      };
    }

    var remote = globalScope.Fase4FirestoreActivosIndexRemote.createFirestoreActivosIndexRemote({
      firebaseApp: runtime.app,
      firestoreModule: runtime.firestoreModule,
      collectionName: "fase4_activos",
      waitForAuth: typeof runtime.waitForAuth === "function" ? runtime.waitForAuth : null,
      tokenValidator: function tokenValidator(token) {
        return String(token || "").trim().length > 0;
      }
    });
    if (!remote || remote.ok !== true) {
      return {
        ok: false,
        errorCode: remote && remote.errorCode ? remote.errorCode : "FIREBASE_ACTIVOS_NO_LISTO",
        message: remote && remote.message ? remote.message : "No se pudo preparar miniaturas."
      };
    }

    state.assetIndexRemote = remote;
    return { ok: true, remoteIndex: remote };
  }

  function buildIdempotencyKey(productId) {
    return "fase7_delete_" + String(productId || "").trim() + "_" + Date.now();
  }

  function getActorId(runtime) {
    if (runtime && typeof runtime.getSessionToken === "function") {
      var token = String(runtime.getSessionToken() || "").trim();
      if (token) return "sesion_" + token.slice(0, 8);
    }
    return "usuario_local";
  }

  function applyTypographyTokens() {
    var root = document.documentElement;
    if (!root) return;
    root.style.setProperty("--font-family-operativa", TIPOGRAFIA_OFICIAL_APP_MELIA.family);
    root.style.setProperty("--font-size-title", TIPOGRAFIA_OFICIAL_APP_MELIA.sizes.title);
    root.style.setProperty("--line-height-title", TIPOGRAFIA_OFICIAL_APP_MELIA.lineHeights.title);
    root.style.setProperty("--font-size-card-title", TIPOGRAFIA_OFICIAL_APP_MELIA.sizes.cardTitle);
    root.style.setProperty("--line-height-card-title", TIPOGRAFIA_OFICIAL_APP_MELIA.lineHeights.cardTitle);
    root.style.setProperty("--font-size-body", TIPOGRAFIA_OFICIAL_APP_MELIA.sizes.body);
    root.style.setProperty("--line-height-body", TIPOGRAFIA_OFICIAL_APP_MELIA.lineHeights.body);
    root.style.setProperty("--font-size-secondary", TIPOGRAFIA_OFICIAL_APP_MELIA.sizes.secondary);
    root.style.setProperty("--line-height-secondary", TIPOGRAFIA_OFICIAL_APP_MELIA.lineHeights.secondary);
    root.style.setProperty("--font-size-small", TIPOGRAFIA_OFICIAL_APP_MELIA.sizes.small);
    root.style.setProperty("--line-height-small", TIPOGRAFIA_OFICIAL_APP_MELIA.lineHeights.small);
    root.style.setProperty("--weight-regular", String(TIPOGRAFIA_OFICIAL_APP_MELIA.weights.regular));
    root.style.setProperty("--weight-medium", String(TIPOGRAFIA_OFICIAL_APP_MELIA.weights.medium));
    root.style.setProperty("--weight-bold", String(TIPOGRAFIA_OFICIAL_APP_MELIA.weights.bold));
  }

  function getAllergenCatalog() {
    var catalog = globalScope.AppV2AlergenosOficiales || null;
    if (!catalog || !Array.isArray(catalog.NOMBRES_OFICIALES)) {
      return [];
    }
    return catalog.NOMBRES_OFICIALES.slice(0);
  }

  function normalizeAllergenList(input) {
    var catalog = globalScope.AppV2AlergenosOficiales || null;
    if (catalog && typeof catalog.normalizeAllergenList === "function") {
      return catalog.normalizeAllergenList(input);
    }
    var safeInput = Array.isArray(input) ? input : [];
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < safeInput.length; i += 1) {
      var item = String(safeInput[i] || "").trim().toLowerCase();
      if (!item || seen[item]) continue;
      seen[item] = true;
      out.push(item);
    }
    return out.sort();
  }

  function toHumanAllergenLabel(allergenId) {
    var safe = String(allergenId || "").trim().replace(/_/g, " ");
    if (!safe) return "";
    return safe.charAt(0).toUpperCase() + safe.slice(1);
  }

  function buildFeedbackMessage(kind, payload) {
    var safeKind = String(kind || "").trim();
    var details = payload || {};
    if (safeKind === "manual_add") return "Producto anadido.";
    if (safeKind === "manual_merge") return "Producto actualizado con el mismo nombre.";
    if (safeKind === "edit_saved") return "Cambios guardados.";
    if (safeKind === "photo_saved") return "Producto guardado desde foto.";
    if (safeKind === "photo_review") return "Foto enviada a revision.";
    if (safeKind === "photo_blocked") return "La foto necesita revision manual.";
    if (safeKind === "photo_ready") return "Resultado listo. Revisa y guarda si es correcto.";
    if (safeKind === "error") return String(details.message || "No se pudo completar la accion.");
    return String(details.message || "Accion completada.");
  }

  function buildEditorDraftState(product) {
    var safeProduct = product || {};
    return {
      productId: String(safeProduct.id || "").trim(),
      nombre: safeProduct.identidad && safeProduct.identidad.nombre
        ? String(safeProduct.identidad.nombre).trim()
        : "",
      selectedAllergenIds: normalizeAllergenList(safeProduct.alergenos)
    };
  }

  function buildCardSummary(model) {
    var count = Math.max(0, Number(model && model.alergenosCount || 0));
    if (count <= 0) return "\u2713 Sin al\u00e9rgenos";
    if (count === 1) return "1 alergeno";
    return count + " alergenos";
  }

  function buildCardAllergenIconsHtml(model) {
    var ids = normalizeAllergenList(model && model.alergenosIds);
    if (!ids.length) return "<p class=\"card-allergens card-allergens-empty\"><span class=\"card-allergens-text\">Sin alérgenos</span></p>";
    return (
      "<div class=\"card-allergen-icons\" aria-label=\"" + escapeHtml(model.alergenosTexto || "") + "\">" +
        ids.map(function mapIcon(allergenId) {
          var safeId = String(allergenId || "").trim();
          return (
            "<span class=\"card-allergen-icon\" title=\"" + escapeHtml(toHumanAllergenLabel(safeId)) + "\" aria-label=\"" + escapeHtml(toHumanAllergenLabel(safeId)) + "\">" +
              "<img src=\"" + escapeHtml(ICON_BASE_PATH + safeId + ".svg") + "\" alt=\"\">" +
            "</span>"
          );
        }).join("") +
      "</div>"
    );
  }

  function toggleSelectedAllergen(currentIds, allergenId) {
    var selected = normalizeAllergenList(currentIds);
    var safeId = String(allergenId || "").trim();
    if (!safeId) return selected;
    var index = selected.indexOf(safeId);
    if (index >= 0) {
      selected.splice(index, 1);
      return selected;
    }
    selected.push(safeId);
    return normalizeAllergenList(selected);
  }

  function formatTimeLabel(rawDate) {
    var value = rawDate instanceof Date ? rawDate : new Date(rawDate || "");
    if (!value || Number.isNaN(value.getTime())) return "Sin hora";
    var hours = String(value.getHours()).padStart(2, "0");
    var minutes = String(value.getMinutes()).padStart(2, "0");
    return hours + ":" + minutes + "h";
  }

  function buildVisualMap(items) {
    var map = Object.create(null);
    var safeItems = Array.isArray(items) ? items : [];
    for (var i = 0; i < safeItems.length; i += 1) {
      var item = safeItems[i] || {};
      var productId = String(item.productId || "").trim();
      if (!productId || map[productId]) continue;
      var mini = item.derivados && item.derivados.miniaturaTarjeta ? item.derivados.miniaturaTarjeta : null;
      var visor = item.derivados && item.derivados.imagenVisor ? item.derivados.imagenVisor : null;
      var thumbUrl = mini && mini.downloadURL ? String(mini.downloadURL).trim() : "";
      var viewerUrl = visor && visor.downloadURL ? String(visor.downloadURL).trim() : "";
      if (!thumbUrl && !viewerUrl) continue;
      map[productId] = {
        thumbUrl: thumbUrl || viewerUrl || "",
        viewerUrl: viewerUrl || thumbUrl || ""
      };
    }
    return map;
  }

  function buildVisualAsset(thumbUrl, viewerUrl) {
    var safeThumb = String(thumbUrl || "").trim();
    var safeViewer = String(viewerUrl || "").trim();
    if (!safeThumb && !safeViewer) return null;
    return {
      thumbUrl: safeThumb || safeViewer || "",
      viewerUrl: safeViewer || safeThumb || ""
    };
  }

  function seedProductVisualAsset(state, productId, visuales) {
    var safeId = String(productId || "").trim();
    var visual = Array.isArray(visuales) && visuales[0] ? visuales[0] : null;
    if (!safeId || !visual) return;
    var asset = buildVisualAsset(visual.thumbSrc, visual.viewerSrc || visual.thumbSrc);
    if (!asset) return;
    if (!state.assetVisualsByProductId) {
      state.assetVisualsByProductId = Object.create(null);
    }
    state.assetVisualsByProductId[safeId] = asset;
  }

  function sameStringArray(left, right) {
    var a = Array.isArray(left) ? left : [];
    var b = Array.isArray(right) ? right : [];
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i += 1) {
      if (String(a[i] || "") !== String(b[i] || "")) return false;
    }
    return true;
  }

  function pickVisualAssetForProduct(state, productId) {
    var safeId = String(productId || "").trim();
    if (!safeId || !state || !state.assetVisualsByProductId) return null;
    return state.assetVisualsByProductId[safeId] || null;
  }

  function resolveCardModel(state, item) {
    if (!state.gestion || typeof state.gestion.crearModeloTarjetaProductoFase9 !== "function") return null;
    var model = state.gestion.crearModeloTarjetaProductoFase9({
      producto: item,
      visual: pickVisualAssetForProduct(state, item && item.id)
    });
    if (!model) return null;
    return model;
  }

  function renderCard(model) {
    if (!model) return "";
    var visibleName = String(model.nombreVisible || model.nombre || "").trim();
    var displayMode = getAllergenDisplayMode();
    var noAllergens = Number(model && model.alergenosCount || 0) === 0;
    var allergenBlock = displayMode === "iconos"
      ? buildCardAllergenIconsHtml(model)
      : ("<p class=\"card-allergens" + (noAllergens ? " card-allergens-empty" : "") + "\"><span class=\"card-allergens-text\">" + escapeHtml(model.alergenosTexto) + "</span></p>");
    var thumbHtml = model.tieneImagen
      ? (
          "<button type=\"button\" class=\"thumb-button js-open-photo\" data-id=\"" + escapeHtml(model.id) + "\" data-name=\"" + escapeHtml(visibleName) + "\" data-viewer-src=\"" + escapeHtml(model.viewerUrl || model.thumbUrl) + "\">" +
            "<img src=\"" + escapeHtml(model.thumbUrl) + "\" alt=\"" + escapeHtml(visibleName) + "\">" +
          "</button>"
        )
      : ("<div class=\"thumb-fallback\" aria-hidden=\"true\">Sin foto</div>");

    return (
      "<article class=\"card js-edit-card " + (displayMode === "iconos" ? "card--icon-mode" : "card--text-mode") + (noAllergens ? " card--empty-allergens" : "") + "\" data-product-id=\"" + escapeHtml(model.id) + "\">" +
        "<div class=\"card-head\">" +
          "<div class=\"card-copy\">" +
            "<h3>" + escapeHtml(visibleName || model.nombre) + "</h3>" +
            allergenBlock +
          "</div>" +
          "<div class=\"thumb-shell\">" + thumbHtml + "</div>" +
        "</div>" +
        "<p class=\"card-updated\">" + escapeHtml(model.actualizadoTexto) + "</p>" +
      "</article>"
    );
  }

  function renderRows(items, target, state) {
    var safeItems = Array.isArray(items) ? items : [];
    if (!target) return;
    if (!safeItems.length) {
      target.innerHTML = "";
      return;
    }
    target.innerHTML = safeItems.map(function mapCard(item) {
      return renderCard(resolveCardModel(state, item));
    }).join("");
  }

  function renderLoadMore(button, datos) {
    if (!button) return;
    if (!datos || !datos.hasMore) {
      button.style.display = "none";
      return;
    }
    button.style.display = "inline-flex";
    button.textContent = "Cargar mas (" + datos.visible + " de " + datos.total + ")";
  }

  function renderPendingToggle(state, datos) {
    var button = byId("pending-toggle");
    var caption = byId("pending-caption");
    if (!button || !caption) return;
    var pendientesCount = datos ? Number(datos.pendientesCount || 0) : 0;
    if (pendientesCount <= 0 && !state.pendingOnly) {
      button.hidden = true;
      caption.textContent = "";
      return;
    }
    button.hidden = false;
    button.textContent = pendientesCount + " Pendientes de subida";
    button.classList.toggle("is-active", !!state.pendingOnly);
    button.setAttribute("aria-pressed", state.pendingOnly ? "true" : "false");
    caption.textContent = "";
  }

  function renderListStats(state, datos) {
    setText("listado-stats", "");
  }

  function renderCloudChip(state) {
    if (state && state.sessionRequired === true) {
      setText("cloud-count", "-");
      setText("cloud-count-label", "Sesion requerida");
      setText("cloud-time", "Inicia sesion");
      return;
    }
    setText("cloud-count", String(Number(state.lastCloudCount || 0)));
    setText("cloud-count-label", "En la nube");
    setText("cloud-time", state.lastCloudLoadedAt ? formatTimeLabel(state.lastCloudLoadedAt) : "Sin hora");
  }

  function renderRevisionPendingButton(state) {
    var slot = byId("revision-slot");
    var button = byId("revision-pending-button");
    var placeholder = byId("revision-slot-placeholder");
    if (!slot || !button || !placeholder) return;
    var revisionState = buildRevisionPendingButtonState(state.store);
    state.pendingRevisionState = revisionState;
    if (!revisionState.visible) {
      slot.hidden = true;
      button.hidden = true;
      button.textContent = "";
      button.removeAttribute("data-draft-id");
      button.removeAttribute("data-href");
      placeholder.hidden = false;
      return;
    }
    slot.hidden = false;
    button.hidden = false;
    button.textContent = revisionState.text;
    button.setAttribute("data-draft-id", revisionState.firstDraftId || "");
    button.setAttribute("data-href", revisionState.url);
    placeholder.hidden = true;
  }

  function renderSyncStatus(state, prefixMessage) {
    setText("cloud-status", String(prefixMessage || ""));
  }

  function deriveVisibleRows(state) {
    return state.gestion.derivarVistaListadoFase9(
      {
        soloPendientes: state.pendingOnly,
        searchText: state.searchText,
        selectedAllergenIds: cloneArray(state.selectedAllergenIds),
        sinActivo: state.sinActivo,
        offset: 0,
        limit: state.visibleLimit
      },
      { store: state.store }
    );
  }

  function refreshVisibleList(state, options) {
    var safeOptions = options || {};
    if (!safeOptions.allowDuringExclusive && getAnalysisRuntime() && getAnalysisRuntime().isExclusiveBlocking && getAnalysisRuntime().isExclusiveBlocking()) {
      runDeferredNonessential("refresh_visible_list", {
        key: "refresh_visible_list",
        priority: 80,
        phase: "list"
      }, function rerunVisibleList() {
        refreshVisibleList(state, { skipAssetReload: !!safeOptions.skipAssetReload, allowDuringExclusive: true });
      });
      return;
    }
    var respuesta = deriveVisibleRows(state);
    var datos = respuesta && respuesta.resultado ? respuesta.resultado.datos : null;
    if (!datos) {
      byId("productos-list").innerHTML = "";
      setText("listado-stats", "Fallo al pintar listado.");
      return;
    }
    state.lastDerivedData = datos;
    renderRows(datos.productos || [], byId("productos-list"), state);
    renderListStats(state, datos);
    renderPendingToggle(state, datos);
    renderLoadMore(byId("cargar-mas"), datos);
    renderFilterStates(state);
    renderCloudChip(state);
    renderRevisionPendingButton(state);
    if (!safeOptions.skipAssetReload) {
      loadVisibleAssetVisuals(state, datos.productos || []);
    }
  }

  function syncDraftsFromSharedSnapshot(state) {
    var sharedApi = globalScope.Fase3SharedBrowserStore;
    if (!sharedApi || typeof sharedApi.readSharedSnapshot !== "function") {
      return false;
    }
    var snapshot = sharedApi.readSharedSnapshot({ storageKey: SHARED_BROWSER_STORE_KEY });
    var drafts = snapshot && Array.isArray(snapshot.drafts) ? snapshot.drafts : [];
    var signature = drafts.map(function mapDraft(item) {
      return [
        String(item && item.draftId || "").trim(),
        String(item && item.estado || "").trim(),
        String(item && item.metadatos && item.metadatos.updatedAt || "").trim()
      ].join("|");
    }).join("||");
    if (signature === String(state.lastDraftSignature || "")) {
      return false;
    }
    state.lastDraftSignature = signature;
    if (typeof state.store.replaceRevisionDrafts === "function") {
      state.store.replaceRevisionDrafts(drafts);
      return true;
    }
    return false;
  }

  async function loadVisibleAssetVisuals(state, products) {
    if (getAnalysisRuntime() && getAnalysisRuntime().isExclusiveBlocking && getAnalysisRuntime().isExclusiveBlocking()) {
      return runDeferredNonessential("asset_visual_load", {
        key: "asset_visual_load",
        priority: 85,
        phase: "assets"
      }, function rerunAssetLoad() {
        return loadVisibleAssetVisuals(state, products);
      });
    }
    var safeProducts = Array.isArray(products) ? products : [];
    var productIds = safeProducts
      .map(function mapId(item) { return String(item && item.id || "").trim(); })
      .filter(Boolean);
    if (sameStringArray(state.lastVisibleProductIds, productIds) && state.assetVisualsLoaded === true) {
      return;
    }
    state.lastVisibleProductIds = productIds.slice(0);
    if (!productIds.length) {
      state.assetVisualsByProductId = Object.create(null);
      state.assetVisualsLoaded = true;
      return;
    }

    var resolved = resolveRemoteAssetIndex(state);
    if (!resolved.ok) return;

    var requestId = (state.assetVisualRequestId || 0) + 1;
    state.assetVisualRequestId = requestId;
    var token = readSessionToken(state);
    var out = await resolved.remoteIndex.listAssetRecords({
      onlyActive: true,
      productIds: productIds,
      sessionToken: token || null
    });
    if (state.assetVisualRequestId !== requestId) return;
    if (!out || out.ok !== true) return;
    state.assetVisualsByProductId = buildVisualMap(out.items || []);
    state.assetVisualsLoaded = true;
    refreshVisibleList(state, { skipAssetReload: true });
  }

  function countActiveLocalProducts(state) {
    if (!state || !state.store) return 0;
    if (typeof state.store.countActiveProducts === "function") {
      return state.store.countActiveProducts();
    }
    if (typeof state.store.listProductsForUi === "function") {
      return state.store.listProductsForUi({ includeDeleted: false }).length;
    }
    return 0;
  }

  function countPendingLocalUploads(state) {
    if (!state || !state.store || typeof state.store.countPendingUploadProducts !== "function") return 0;
    return state.store.countPendingUploadProducts({ includeDeleted: true });
  }

  function shouldRecoverCloudWhenEmpty(state) {
    return countActiveLocalProducts(state) === 0 && countPendingLocalUploads(state) === 0;
  }

  function syncStoreFromRemote(state, items) {
    var safeItems = Array.isArray(items) ? items : [];
    var filteredItems = safeItems.filter(function keepRemoteItem(item) {
      var productId = String(item && item.id || "").trim();
      var isActive = String(item && item.sistema && item.sistema.estadoRegistro || "").trim().toUpperCase() === "ACTIVO";
      if (!productId || !isActive) return true;
      return !(
        globalScope.Fase8SyncTombstone &&
        typeof globalScope.Fase8SyncTombstone.isDeleted === "function" &&
        globalScope.Fase8SyncTombstone.isDeleted(productId)
      );
    });
    var pendingCount = state.store && typeof state.store.countPendingUploadProducts === "function"
      ? state.store.countPendingUploadProducts({ includeDeleted: false })
      : 0;
    if (pendingCount > 0 && state.store && typeof state.store.fusionarRemotoCambios === "function") {
      state.store.fusionarRemotoCambios(filteredItems, {
        tombstoneApi: globalScope.Fase8SyncTombstone || null
      });
      refreshVisibleList(state);
      return { ok: true, merged: true, remoteCount: filteredItems.length };
    }
    var localActiveCount = countActiveLocalProducts(state);
    if (!filteredItems.length && localActiveCount > 0) {
      renderSyncStatus(state, "Nube vacía; se conserva lista local");
      refreshVisibleList(state);
      return {
        ok: true,
        skipped: true,
        reason: "REMOTE_EMPTY_PROTECTED",
        localCount: localActiveCount,
        remoteCount: 0
      };
    }
    state.store.replaceAllProducts(filteredItems);
    refreshVisibleList(state);
    return { ok: true, replaced: true, remoteCount: filteredItems.length };
  }

  async function loadProducts(state, options) {
    var safeOptions = options || {};
    if (state.loadProductsPromise) {
      return state.loadProductsPromise;
    }
    if (!safeOptions.allowDuringExclusive && getAnalysisRuntime() && getAnalysisRuntime().isExclusiveBlocking && getAnalysisRuntime().isExclusiveBlocking()) {
      return runDeferredNonessential("cloud_load", {
        key: "cloud_load",
        priority: 78,
        phase: "cloud_load"
      }, function rerunCloudLoad() {
        return loadProducts(state, Object.assign({}, safeOptions, { allowDuringExclusive: true }));
      });
    }
    if (!safeOptions.force && state.hasLoadedProducts === true) {
      return { ok: true, skipped: true };
    }

    state.loadProductsPromise = (async function runLoadProducts() {
      var token = ensureSessionTokenOrRedirect(state, {
        redirect: safeOptions.redirectOnMissingSession !== false
      });
      if (!token) {
        return {
          ok: false,
          errorCode: "SESSION_REQUIRED",
          message: SESSION_REQUIRED_MESSAGE
        };
      }

      var resolved = resolveRemoteIndex(state);
      if (!resolved.ok) {
        renderSyncStatus(state, resolved.message);
        return resolved;
      }

      renderSyncStatus(state, "Cargando nube");
      var out = await resolved.remoteIndex.listProductRecords({ maxItems: 5000, sessionToken: token });
      if (!out || out.ok !== true) {
        renderSyncStatus(state, out && out.message ? out.message : "No se pudo leer la nube.");
        return out || { ok: false };
      }

      var syncOut = syncStoreFromRemote(state, out.items || []);
      state.lastCloudCount = Array.isArray(out.items) ? out.items.length : 0;
      state.lastCloudLoadedAt = new Date();
      if (syncOut && syncOut.skipped === true) {
        renderCloudChip(state);
        return Object.assign({}, out, syncOut);
      }
      state.hasLoadedProducts = true;
      renderCloudChip(state);
      renderSyncStatus(state, "Nube lista | red " + (isOnline() ? "online" : "offline"));
      return out;
    })();

    try {
      return await state.loadProductsPromise;
    } finally {
      state.loadProductsPromise = null;
    }
  }

  function resolveSyncManager(state) {
    if (state.syncManager) return state.syncManager;
    if (!globalScope.Fase8SyncManager || typeof globalScope.Fase8SyncManager.createSyncManager !== "function") {
      return null;
    }

    state.syncManager = globalScope.Fase8SyncManager.createSyncManager({
      store: state.store,
      getRemoteIndex: function getRemote() {
        return resolveRemoteIndex(state);
      },
      tokenValidator: function tokenValidator(token) {
        return String(token || "").trim().length > 0;
      },
      onRemoteApplied: function onRemoteApplied() {
        refreshVisibleList(state);
        renderSyncStatus(state, "Cambio remoto aplicado");
      }
    });
    return state.syncManager;
  }

  async function triggerSync(state, triggerLabel) {
    var now = Date.now();
    var safeLabel = String(triggerLabel || "sync");
    var bypassCooldown = safeLabel === "manual" || safeLabel === "manual_save" || safeLabel === "post_delete" || safeLabel === "init" || safeLabel === "firebase_ready";
    if (!bypassCooldown && (now - Number(state.lastSyncTriggerAt || 0)) < SYNC_TRIGGER_COOLDOWN_MS) {
      return { ok: true, skipped: true, reason: "SYNC_TRIGGER_COOLDOWN" };
    }
    state.lastSyncTriggerAt = now;

    if (getAnalysisRuntime() && getAnalysisRuntime().isExclusiveBlocking && getAnalysisRuntime().isExclusiveBlocking()) {
      return runDeferredNonessential("sync_deferred", {
        key: "sync_" + safeLabel,
        priority: 70,
        phase: "sync"
      }, function rerunSyncLater() {
        traceAnalysisEvent("sync_deferred_start", { trigger: safeLabel }, { phase: "sync" });
        return triggerSync(state, safeLabel).then(function afterDeferredSync(out) {
          traceAnalysisEvent("sync_deferred_done", {
            trigger: safeLabel,
            ok: !!(out && out.ok === true),
            skipped: !!(out && out.skipped === true)
          }, { phase: "sync" });
          return out;
        });
      });
    }

    var manager = resolveSyncManager(state);
    if (!manager) {
      renderSyncStatus(state, "Sync no disponible");
      return;
    }

    var token = ensureSessionTokenOrRedirect(state, { redirect: true });
    if (!token) {
      return {
        ok: false,
        errorCode: "SESSION_REQUIRED",
        message: SESSION_REQUIRED_MESSAGE
      };
    }

    traceAnalysisEvent("sync_deferred_start", { trigger: safeLabel }, { phase: "sync" });
    var out = await manager.iniciarSync(token);
    if (!out || out.ok !== true) {
      renderSyncStatus(state, "Sync fallido");
      traceAnalysisEvent("sync_deferred_done", {
        trigger: safeLabel,
        ok: false
      }, { phase: "sync" });
      return out || { ok: false };
    }

    if (typeof manager.ensureListener === "function") {
      manager.ensureListener(token);
    }

    refreshVisibleList(state);
    renderSyncStatus(state, "Sync OK");
    traceAnalysisEvent("sync_deferred_done", {
      trigger: safeLabel,
      ok: true
    }, { phase: "sync" });
    return out;
  }

  async function recoverCloudProductsWhenEmpty(state) {
    if (!shouldRecoverCloudWhenEmpty(state)) {
      return { ok: true, skipped: true, reason: "LOCAL_NOT_EMPTY_OR_PENDING" };
    }
    renderSyncStatus(state, "Recuperando nube");
    var loadOut = await loadProducts(state, { force: true });
    var localActiveCount = countActiveLocalProducts(state);
    if (!loadOut || loadOut.ok !== true) {
      renderSyncStatus(state, loadOut && loadOut.message ? loadOut.message : "No se pudo recuperar la nube");
      return loadOut || { ok: false };
    }
    if (localActiveCount === 0) {
      renderSyncStatus(state, "No se encontraron productos en la nube");
      return Object.assign({}, loadOut, {
        recovered: false,
        localCount: 0
      });
    }
    renderSyncStatus(state, "Nube recuperada");
    return Object.assign({}, loadOut, {
      recovered: true,
      localCount: localActiveCount
    });
  }

  async function manualSync(state) {
    if (shouldRecoverCloudWhenEmpty(state)) {
      var recovered = await recoverCloudProductsWhenEmpty(state);
      if (!recovered || recovered.ok !== true || recovered.recovered === false) {
        return recovered || { ok: false };
      }
    }
    return triggerSync(state, "manual");
  }

  async function initialProductsLoad(state, triggerLabel) {
    var sessionToken = ensureSessionTokenOrRedirect(state, { redirect: true });
    if (!sessionToken) {
      return {
        ok: false,
        errorCode: "SESSION_REQUIRED",
        message: SESSION_REQUIRED_MESSAGE
      };
    }
    if (state.initialProductsLoadPromise) {
      return state.initialProductsLoadPromise;
    }
    state.initialProductsLoadPromise = (async function runInitialProductsLoad() {
      var out = shouldRecoverCloudWhenEmpty(state)
        ? await recoverCloudProductsWhenEmpty(state)
        : await loadProducts(state);
      if (countActiveLocalProducts(state) > 0) {
        state.initialProductsLoaded = true;
      }
      if (out && out.ok === false && shouldRecoverCloudWhenEmpty(state)) {
        return out;
      }
      return triggerSync(state, triggerLabel || "init");
    })();
    try {
      return await state.initialProductsLoadPromise;
    } finally {
      state.initialProductsLoadPromise = null;
    }
  }

  function scheduleEntryCloudRecovery(state) {
    if (!globalScope.setTimeout) return;
    ENTRY_CLOUD_RECOVERY_RETRY_MS.forEach(function eachDelay(delayMs, index) {
      globalScope.setTimeout(function retryEntryCloudRecovery() {
        if (state.initialProductsLoaded === true) return;
        if (!shouldRecoverCloudWhenEmpty(state)) return;
        initialProductsLoad(state, "init_retry_" + String(index + 1));
      }, delayMs);
    });
  }

  async function deleteProduct(state, productId, productName) {
    if (!productId) {
      return {
        ok: false,
        message: "No se encontro el producto."
      };
    }
    var question = "Se eliminara de verdad";
    if (!globalScope.confirm(question + ": " + String(productName || productId) + ". Continuar?")) {
      return {
        ok: false,
        cancelled: true,
        message: ""
      };
    }

    var localRecord = state && state.store && typeof state.store.getProductById === "function"
      ? state.store.getProductById(productId)
      : null;
    var localSystem = localRecord && localRecord.sistema ? localRecord.sistema : {};
    var localOnlyPending = !!(
      localRecord &&
      localSystem.dirty === true &&
      String(localSystem.syncState || "").trim().toUpperCase() === "LOCAL_ONLY" &&
      !localSystem.lastSyncedAt
    );
    var resolved = localOnlyPending ? { ok: true, remoteIndex: null } : resolveRemoteIndex(state);
    if (!resolved.ok) {
      var blockedMessage = resolved && resolved.message ? resolved.message : "No se pudo preparar el borrado.";
      renderSyncStatus(state, blockedMessage);
      return {
        ok: false,
        message: blockedMessage
      };
    }

    renderSyncStatus(state, "Eliminando");
    var sessionToken = readSessionToken(state);

    var out = await state.gestion.borrarProductoReal(
      {
        productId: productId,
        actorId: getActorId(state.runtime),
        sessionToken: sessionToken,
        idempotencyKey: buildIdempotencyKey(productId)
      },
      {
        store: state.store,
        persistencia: state.persistencia,
        productRepository: resolved.remoteIndex
      }
    );

    if (!out || out.ok !== true) {
      var failedMessage = out && out.error && out.error.message ? out.error.message : "No se pudo eliminar.";
      renderSyncStatus(state, failedMessage);
      return {
        ok: false,
        message: failedMessage
      };
    }

    recordVisibleHistory(
      state,
      "PRODUCT_DELETED",
      localRecord,
      null,
      out && out.resultado && out.resultado.datos ? out.resultado.datos.historyEventId : null
    );

    if (globalScope.Fase8SyncTombstone && typeof globalScope.Fase8SyncTombstone.markDeleted === "function") {
      globalScope.Fase8SyncTombstone.markDeleted(productId);
    }

    if (out && out.resultado && out.resultado.datos && out.resultado.datos.localOnly === true) {
      refreshVisibleList(state, { skipAssetReload: true });
      renderSyncStatus(state, "Producto eliminado");
      return {
        ok: true,
        message: "Producto eliminado."
      };
    }

    var reloadOut = await loadProducts(state, { force: true });
    if (!reloadOut || reloadOut.ok !== true) {
      refreshVisibleList(state, { skipAssetReload: true });
      renderSyncStatus(state, "Producto eliminado");
      return {
        ok: true,
        message: "Producto eliminado."
      };
    }

    await triggerSync(state, "post_delete");
    renderSyncStatus(state, "Producto eliminado");
    return {
      ok: true,
      message: "Producto eliminado."
    };
  }

  function openAjustes() {
    var returnTo = "./gestion_registros.html";
    globalScope.location.href =
      "./ajustes.html?returnTo=" +
      encodeURIComponent(returnTo);
  }

  function openLote() {
    globalScope.location.href = "./lote.html";
  }

  function openHistorial() {
    var returnTo = "./gestion_registros.html";
    globalScope.location.href =
      "./ajustes.html?returnTo=" +
      encodeURIComponent(returnTo) +
      "#historial-eventos";
  }

  function openRevisionPending(state) {
    var revisionState = state.pendingRevisionState || buildRevisionPendingButtonState(state.store);
    globalScope.location.href = revisionState.url || "./revision.html";
  }

  function buildFilterSummary(state) {
    return "";
  }

  function renderFilterStates(state) {
    var sinButton = byId("sin-toggle");
    if (sinButton) {
      sinButton.classList.toggle("is-active", !!state.sinActivo);
      sinButton.setAttribute("aria-pressed", state.sinActivo ? "true" : "false");
    }

    Array.prototype.forEach.call(
      document.querySelectorAll(".js-allergen-filter"),
      function each(button) {
        var allergenId = String(button.getAttribute("data-allergen-id") || "").trim();
        var active = state.selectedAllergenIds.indexOf(allergenId) >= 0;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      }
    );

    var caption = byId("pending-caption");
    if (caption) {
      caption.textContent = buildFilterSummary(state);
    }
  }

  function setSheetVisibility(element, visible) {
    if (!element) return;
    element.hidden = !visible;
    element.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  function clearFeedbackTimer(state) {
    if (!state.ui || !state.ui.feedbackTimerId) return;
    globalScope.clearTimeout(state.ui.feedbackTimerId);
    state.ui.feedbackTimerId = null;
  }

  function hideFeedback(state) {
    if (!state.el.feedbackToast) return;
    clearFeedbackTimer(state);
    state.el.feedbackToast.hidden = true;
    state.el.feedbackToast.classList.remove("is-error");
    state.el.feedbackToast.textContent = "";
  }

  function showFeedback(state, kind, payload) {
    if (!state.el.feedbackToast) return;
    clearFeedbackTimer(state);
    state.el.feedbackToast.hidden = false;
    state.el.feedbackToast.textContent = buildFeedbackMessage(kind, payload);
    state.el.feedbackToast.classList.toggle("is-error", String(kind || "") === "error");
    state.ui.feedbackTimerId = globalScope.setTimeout(function onFeedbackTimeout() {
      state.ui.feedbackTimerId = null;
      hideFeedback(state);
    }, FEEDBACK_DURATION_MS);
  }

  function resetAddModalState(state) {
    if (state && state.ui && state.ui.add) {
      if (state.ui.add.photoPickerFocusHandler) {
        globalScope.removeEventListener("focus", state.ui.add.photoPickerFocusHandler, true);
      }
      if (state.ui.add.photoPickerCancelTimerId) {
        globalScope.clearTimeout(state.ui.add.photoPickerCancelTimerId);
      }
    }
    state.ui.add = {
      open: false,
      busy: false,
      nombre: "",
      formato: "",
      formatoNormalizado: "",
      tipoFormato: "desconocido",
      selectedAllergenIds: [],
      photoResultReady: false,
      visualPending: false,
      photoRefs: [],
      photoVisuales: [],
      photoStatus: "",
      photoStatusKind: "",
      photoSummary: "Todavía no has elegido fotos.",
      photoTarget: "envase",
      analysisId: "",
      traceId: "",
      batchId: "",
      photoPickerFocusHandler: null,
      photoPickerCancelTimerId: null,
      envasePreviewUrl: "",
      etiquetaPreviewUrl: ""
    };
    if (state.el.addPhotoFile1) state.el.addPhotoFile1.value = "";
    if (state.el.addPhotoFile2) state.el.addPhotoFile2.value = "";
  }

  function resetEditModalState(state) {
    state.ui.edit = {
      open: false,
      busy: false,
      productId: "",
      nombre: "",
      selectedAllergenIds: []
    };
  }

  function renderPickerButtons(target, selectedIds, scope) {
    if (!target) return;
    var selected = normalizeAllergenList(selectedIds);
    target.innerHTML = getAllergenCatalog().map(function mapAllergen(allergenId) {
      var safeId = String(allergenId || "").trim();
      var active = selected.indexOf(safeId) >= 0;
      return (
        "<button type=\"button\" class=\"picker-button js-modal-allergen" + (active ? " is-active" : "") + "\" data-scope=\"" + escapeHtml(scope) + "\" data-allergen-id=\"" + escapeHtml(safeId) + "\" aria-pressed=\"" + (active ? "true" : "false") + "\" aria-label=\"" + escapeHtml(toHumanAllergenLabel(safeId)) + "\">" +
          "<img src=\"" + escapeHtml(ICON_BASE_PATH + safeId + ".svg") + "\" alt=\"\">" +
        "</button>"
      );
    }).join("");
  }

  function renderAddModal(state) {
    var ui = state.ui.add;
    setSheetVisibility(state.el.addModal, !!ui.open);
    if (!ui.open) return;
    setElementText(state.el.addModalTitle, ui.photoResultReady ? "Confirmar producto analizado" : "Añadir producto");
    setElementText(
      state.el.addModalHelp,
      ui.photoResultReady
        ? "Estos datos los ha rellenado la app al analizar la foto. Revisa y guarda si son correctos."
        : "Trabajas dentro de la pantalla principal. Puedes guardar manual o arrancar por foto."
    );
    setElementText(state.el.addManualTitle, ui.photoResultReady ? "Resultado del análisis de foto" : "Agregado manual");
    if (state.el.addManualPane) {
      state.el.addManualPane.classList.toggle("is-photo-result", !!ui.photoResultReady);
    }
    if (state.el.addPhotoPane) {
      state.el.addPhotoPane.hidden = !!ui.photoResultReady;
    }
    state.el.addProductName.value = ui.nombre;
    renderPickerButtons(state.el.addAllergenGrid, ui.selectedAllergenIds, "add");
    setElementText(state.el.addPhotoSummary, ui.photoSummary || "Todavía no has elegido fotos.");
    setElementText(state.el.addPhotoStatus, ui.photoStatus || "");
    state.el.addPhotoStatus.hidden = !ui.photoStatus;
    state.el.addPhotoStatus.classList.toggle("is-error", ui.photoStatusKind === "error");
    state.el.addPhotoStatus.classList.toggle("is-ok", ui.photoStatusKind === "ok");
    state.el.addPhotoStatus.classList.toggle("is-passport-green", ui.photoStatusKind === "passport-green");
    state.el.addPhotoStatus.classList.toggle("is-passport-orange", ui.photoStatusKind === "passport-orange");
    state.el.addPhotoStatus.classList.toggle("is-passport-red", ui.photoStatusKind === "passport-red");
    state.el.photoOriginCopy.textContent = ui.photoTarget === "etiqueta"
      ? "Etiquetado: elige Cámara o Galería"
      : "Envase: elige Cámara o Galería";
    state.el.photoSlotEnvase.innerHTML = ui.envasePreviewUrl
      ? "<img src=\"" + escapeHtml(ui.envasePreviewUrl) + "\" alt=\"Envase\">"
      : "<span><strong>ENVASE</strong><small>Toca para elegir</small></span>";
    state.el.photoSlotEtiqueta.innerHTML = ui.etiquetaPreviewUrl
      ? "<img src=\"" + escapeHtml(ui.etiquetaPreviewUrl) + "\" alt=\"Etiquetado\">"
      : "<span><strong>ETIQUETADO</strong><small>Toca para elegir</small></span>";
    state.el.saveAddProduct.disabled = !!ui.busy;
    state.el.cancelAddProduct.disabled = !!ui.busy;
    state.el.analyzePhotoProduct.disabled = !!ui.busy;
    state.el.openPhotoOrigin.disabled = !!ui.busy;
    state.el.photoSlotEnvase.disabled = !!ui.busy;
    state.el.photoSlotEtiqueta.disabled = !!ui.busy;
  }

  function renderEditModal(state) {
    var ui = state.ui.edit;
    setSheetVisibility(state.el.editModal, !!ui.open);
    if (!ui.open) return;
    state.el.editProductName.value = ui.nombre;
    state.el.saveEditProduct.disabled = !!ui.busy;
    state.el.cancelEditProduct.disabled = !!ui.busy;
    state.el.deleteEditProduct.disabled = !!ui.busy;
    state.el.closeEditProduct.disabled = !!ui.busy;
    renderPickerButtons(state.el.editAllergenGrid, ui.selectedAllergenIds, "edit");
  }

  function openAddModal(state) {
    resetAddModalState(state);
    state.ui.overlayScrollY = Number(globalScope.scrollY || globalScope.pageYOffset || 0);
    state.ui.add.open = true;
    renderAddModal(state);
  }

  function closeAddModal(state) {
    var safeOptions = arguments.length > 1 && arguments[1] ? arguments[1] : {};
    var analysisId = state && state.ui && state.ui.add ? String(state.ui.add.analysisId || "").trim() : "";
    closePhotoOriginModal(state);
    if (!safeOptions.preserveVisualJob && analysisId) {
      var queue = getDeferredVisualQueue();
      if (queue && typeof queue.cancel === "function") {
        queue.cancel(analysisId, safeOptions.reason || "add_modal_closed");
      }
    }
    cancelAnalysisExclusive({ reason: safeOptions.reason || "add_modal_closed" });
    resetAddModalState(state);
    renderAddModal(state);
    globalScope.requestAnimationFrame(function restoreListFocus() {
      globalScope.scrollTo(0, Number(state.ui.overlayScrollY || 0));
    });
  }

  function openEditModal(state, productId) {
    var product = state.store && typeof state.store.getProductById === "function"
      ? state.store.getProductById(productId)
      : null;
    if (!product) {
      showFeedback(state, "error", { message: "No se encontro el producto." });
      return;
    }
    state.ui.overlayScrollY = Number(globalScope.scrollY || globalScope.pageYOffset || 0);
    state.ui.edit = Object.assign({ open: true, busy: false }, buildEditorDraftState(product));
    renderEditModal(state);
  }

  function closeEditModal(state) {
    resetEditModalState(state);
    renderEditModal(state);
    globalScope.requestAnimationFrame(function restoreListFocus() {
      globalScope.scrollTo(0, Number(state.ui.overlayScrollY || 0));
    });
  }

  function updatePhotoSummary(state) {
    var names = [];
    if (state.el.addPhotoFile1 && state.el.addPhotoFile1.files && state.el.addPhotoFile1.files[0]) {
      names.push(state.el.addPhotoFile1.files[0].name || "Foto 1");
    }
    if (state.el.addPhotoFile2 && state.el.addPhotoFile2.files && state.el.addPhotoFile2.files[0]) {
      names.push(state.el.addPhotoFile2.files[0].name || "Foto 2");
    }
    state.ui.add.photoSummary = names.length
      ? names.length + " foto(s): " + names.join(" | ")
      : "Todavía no has elegido fotos.";
    renderAddModal(state);
  }

  function openPhotoOriginModal(state, target) {
    if (state.ui.add.busy) return;
    if (!state.el.photoOriginModal) return;
    state.ui.add.photoTarget = String(target || "envase") === "etiqueta" ? "etiqueta" : "envase";
    state.el.photoOriginCopy.textContent = state.ui.add.photoTarget === "etiqueta"
      ? "Etiquetado: elige Cámara o Galería"
      : "Envase: elige Cámara o Galería";
    state.el.photoOriginModal.hidden = false;
    state.el.photoOriginModal.setAttribute("aria-hidden", "false");
  }

  function schedulePhotoPickerCancelCheck(state) {
    if (!state || !state.ui || !state.ui.add) return;
    if (state.ui.add.photoPickerFocusHandler) {
      globalScope.removeEventListener("focus", state.ui.add.photoPickerFocusHandler, true);
      state.ui.add.photoPickerFocusHandler = null;
    }
    if (state.ui.add.photoPickerCancelTimerId) {
      globalScope.clearTimeout(state.ui.add.photoPickerCancelTimerId);
      state.ui.add.photoPickerCancelTimerId = null;
    }
    state.ui.add.photoPickerFocusHandler = function onPickerFocusBack() {
      globalScope.removeEventListener("focus", state.ui.add.photoPickerFocusHandler, true);
      state.ui.add.photoPickerFocusHandler = null;
      state.ui.add.photoPickerCancelTimerId = globalScope.setTimeout(function verifyPickerResult() {
        state.ui.add.photoPickerCancelTimerId = null;
        var hasEnvase = !!(state.el.addPhotoFile1 && state.el.addPhotoFile1.files && state.el.addPhotoFile1.files[0]);
        var hasEtiqueta = !!(state.el.addPhotoFile2 && state.el.addPhotoFile2.files && state.el.addPhotoFile2.files[0]);
        if (hasEnvase || hasEtiqueta) return;
        if (state.ui.add.photoResultReady || state.ui.add.busy) return;
        cancelAnalysisExclusive({ reason: "photo_picker_cancelled" });
      }, 260);
    };
    globalScope.addEventListener("focus", state.ui.add.photoPickerFocusHandler, true);
  }

  function closePhotoOriginModal(state) {
    if (!state.el.photoOriginModal) return;
    state.el.photoOriginModal.hidden = true;
    state.el.photoOriginModal.setAttribute("aria-hidden", "true");
  }

  function pickPhotoFromOrigin(state, origin) {
    var isCamera = String(origin || "") === "camera";
    var targetInput = state.ui.add.photoTarget === "etiqueta"
      ? state.el.addPhotoFile2
      : state.el.addPhotoFile1;
    if (!targetInput) return;
    requestAnalysisExclusive({
      reason: isCamera ? "camera_opened" : "gallery_requested",
      phase: "photo_origin",
      taskName: state.ui.add.photoTarget
    });
    if (isCamera) {
      targetInput.setAttribute("capture", "environment");
    } else {
      targetInput.removeAttribute("capture");
    }
    schedulePhotoPickerCancelCheck(state);
    closePhotoOriginModal(state);
    targetInput.click();
  }

  function updatePhotoPreview(state, slotKey, file) {
    var safeSlot = slotKey === "etiqueta" ? "etiqueta" : "envase";
    var prop = safeSlot === "etiqueta" ? "etiquetaPreviewUrl" : "envasePreviewUrl";
    state.ui.add[prop] = file && globalScope.URL && typeof globalScope.URL.createObjectURL === "function"
      ? globalScope.URL.createObjectURL(file)
      : "";
    if (file) {
      requestAnalysisExclusive({
        reason: "photo_selected",
        phase: "photo_input",
        taskName: safeSlot
      });
      traceAnalysisEvent("photo_input_started", {
        slot: safeSlot,
        fileName: String(file.name || "").trim() || null,
        sizeBytes: Number(file.size || 0) || null
      }, { phase: "photo_input" });
      return;
    }
    var hasEnvase = !!(state.el.addPhotoFile1 && state.el.addPhotoFile1.files && state.el.addPhotoFile1.files[0]);
    var hasEtiqueta = !!(state.el.addPhotoFile2 && state.el.addPhotoFile2.files && state.el.addPhotoFile2.files[0]);
    if (!hasEnvase && !hasEtiqueta && !state.ui.add.photoResultReady && !state.ui.add.busy) {
      cancelAnalysisExclusive({ reason: "photo_removed" });
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise(function executor(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function onLoad() {
        resolve(String(reader.result || ""));
      };
      reader.onerror = function onError() {
        reject(new Error("No se pudo leer la foto."));
      };
      reader.readAsDataURL(file);
    });
  }

  async function readPhotoRefsFromInputs(state) {
    var files = [];
    if (state.el.addPhotoFile1 && state.el.addPhotoFile1.files && state.el.addPhotoFile1.files[0]) {
      files.push(state.el.addPhotoFile1.files[0]);
    }
    if (state.el.addPhotoFile2 && state.el.addPhotoFile2.files && state.el.addPhotoFile2.files[0]) {
      files.push(state.el.addPhotoFile2.files[0]);
    }
    if (!files.length) {
      throw new Error("Elige al menos una foto.");
    }
    var refs = [];
    for (var i = 0; i < files.length && i < 2; i += 1) {
      refs.push(await readFileAsDataUrl(files[i]));
    }
    return refs;
  }

  function buildProductPhotoVisuales(fotoRefs, visuales) {
    var refs = Array.isArray(fotoRefs) ? fotoRefs.filter(Boolean).slice(0, 2) : [];
    var rawVisuales = Array.isArray(visuales) ? visuales : [];
    var out = [];
    for (var i = 0; i < refs.length && i < 2; i += 1) {
      var raw = rawVisuales[i] && typeof rawVisuales[i] === "object" ? rawVisuales[i] : {};
      var src = String(refs[i] || "").trim();
      var visualRef = String(raw.ref || src || "").trim();
      var thumbSrc = String(raw.thumbSrc || raw.viewerSrc || src || "").trim();
      var viewerSrc = String(raw.viewerSrc || raw.thumbSrc || src || "").trim();
      if (!visualRef || (!thumbSrc && !viewerSrc)) continue;
      out.push({
        ref: visualRef,
        thumbSrc: thumbSrc || viewerSrc,
        viewerSrc: viewerSrc || thumbSrc,
        profileKey: String(raw.profileKey || "").trim() || null,
        qualityPct: Number(raw.qualityPct) || null,
        resolutionMaxPx: Number(raw.resolutionMaxPx) || null,
        generatedAt: String(raw.generatedAt || "").trim() || new Date().toISOString()
      });
    }
    return out;
  }

  async function buildPhotoVisualesForAdd(fotoRefs) {
    var refs = Array.isArray(fotoRefs) ? fotoRefs.filter(Boolean).slice(0, 2) : [];
    if (!refs.length) return [];
    var visuales = [];
    try {
      if (globalScope.Fase3AltaFotoVisibleApp && typeof globalScope.Fase3AltaFotoVisibleApp.buildDraftVisuales === "function") {
        visuales = await globalScope.Fase3AltaFotoVisibleApp.buildDraftVisuales(refs);
      }
    } catch (errVisual) {
      visuales = [];
    }
    return buildProductPhotoVisuales(refs, visuales);
  }

  function refreshSingleVisibleCard(state, productId) {
    var safeId = String(productId || "").trim();
    if (!safeId) return;
    var list = byId("productos-list");
    if (!list || !state.store || typeof state.store.getProductById !== "function") {
      refreshVisibleList(state, { skipAssetReload: true });
      return;
    }
    var currentCard = list.querySelector('[data-product-id="' + safeId.replace(/"/g, '\\"') + '"]');
    if (!currentCard) {
      refreshVisibleList(state, { skipAssetReload: true });
      return;
    }
    var product = state.store.getProductById(safeId);
    if (!product) {
      refreshVisibleList(state, { skipAssetReload: true });
      return;
    }
    var html = renderCard(resolveCardModel(state, product));
    if (!html) return;
    var holder = document.createElement("div");
    holder.innerHTML = html;
    if (holder.firstElementChild) {
      currentCard.replaceWith(holder.firstElementChild);
    }
  }

  function scheduleDeferredAddVisuals(state, response, fotoRefs) {
    var finalData = getPhotoAnalysisFinalData(response);
    var analysisId = finalData && finalData.analysisId ? String(finalData.analysisId).trim() : "";
    var traceId = finalData && finalData.traceId ? String(finalData.traceId).trim() : "";
    var refs = cloneArray(fotoRefs);
    var queue = getDeferredVisualQueue();
    if (!analysisId || !refs.length || !queue || typeof queue.enqueueAnalysisJob !== "function") return;

    queue.enqueueAnalysisJob({
      analysisId: analysisId,
      traceId: traceId,
      fotoRefs: refs,
      buildVisuals: buildPhotoVisualesForAdd
    });

    if (typeof queue.attachModalTarget === "function") {
      queue.attachModalTarget(analysisId, {
        isStillValid: function isStillValid() {
          return !!(
            state &&
            state.ui &&
            state.ui.add &&
            state.ui.add.open === true &&
            state.ui.add.photoResultReady === true &&
            String(state.ui.add.analysisId || "").trim() === analysisId
          );
        },
        apply: function applyToModal(visuales, rawRefs) {
          state.ui.add.photoVisuales = cloneVisuales(visuales);
          state.ui.add.photoRefs = cloneArray(rawRefs);
          state.ui.add.visualPending = false;
          renderAddModal(state);
        }
      });
    }
  }

  async function ensurePhotoRuntimeReady(state) {
    if (globalScope.CerebroOrquestador && globalScope.Fase3AltaFotoVisibleApp) {
      return;
    }
    if (state.ui.photoRuntimePromise) {
      return state.ui.photoRuntimePromise;
    }
    state.ui.photoRuntimePromise = PHOTO_RUNTIME_SCRIPT_PATHS.reduce(function chain(promise, src) {
      return promise.then(function loadNext() {
        return loadScriptOnce(src);
      });
    }, Promise.resolve()).then(function onLoaded() {
      if (!globalScope.CerebroOrquestador || !globalScope.Fase3AltaFotoVisibleApp) {
        throw new Error("La analitica por foto no quedo lista.");
      }
    }).catch(function onLoadError(err) {
      state.ui.photoRuntimePromise = null;
      throw err;
    });
    return state.ui.photoRuntimePromise;
  }

  function getPhotoAnalysisFinalData(response) {
    return response && response.resultado && response.resultado.datos
      ? response.resultado.datos
      : {};
  }

  function hasPhotoAnalysisResult(response) {
    var finalData = getPhotoAnalysisFinalData(response);
    return !!(finalData.propuestaFinal || finalData.decision);
  }

  function resolvePhotoPassport(finalData, outcome) {
    var decision = finalData && finalData.decision ? finalData.decision : {};
    var passport = String(decision.pasaporte || "").trim().toUpperCase();
    if (passport) return passport;
    if (outcome === "guardado") return "VERDE";
    if (outcome === "bloqueado") return "ROJO";
    return "NARANJA";
  }

  function getPhotoPassportStatusKind(passport) {
    if (passport === "VERDE") return "passport-green";
    if (passport === "NARANJA") return "passport-orange";
    return "passport-red";
  }

  function buildPhotoAnalysisStatus(response, outcome) {
    var finalData = getPhotoAnalysisFinalData(response);
    var passport = resolvePhotoPassport(finalData, outcome);
    var propuesta = finalData.propuestaFinal || {};
    var nombre = String(propuesta.nombre || "").trim();
    var formato = String(propuesta.formato || propuesta.formatoNormalizado || "").trim();
    var visibleName = combineNameAndFormat(nombre, formato);
    var label = passport === "VERDE"
      ? "Pasaporte VERDE"
      : passport === "NARANJA"
        ? "Pasaporte NARANJA"
        : "Pasaporte ROJO";
    return label + ". Revisa y confirma antes de guardar" + (visibleName ? ": " + visibleName : ".");
  }

  function moduleLabel(moduleKey, moduleData) {
    var safe = moduleData || {};
    return String(safe.modulo || moduleKey || "Motor");
  }

  function addBoxerInternalDiagnostic(moduleKey, moduleData) {
    var local = moduleData && moduleData.resultadoLocal ? moduleData.resultadoLocal : null;
    var data = local && local.datos ? local.datos : {};
    var diag = data && data.diagnostico ? data.diagnostico : (local && local.diagnostico ? local.diagnostico : null);
    var events = diag && Array.isArray(diag.eventos) ? diag.eventos : [];
    events.slice(-12).forEach(function eachDiagEvent(event) {
      var level = event && event.tipoEvento === "error" ? "ERROR" : (event && event.passport === "ROJO" ? "WARN" : "INFO");
      addFase11DiagnosticEvent(
        level,
        moduleLabel(moduleKey, moduleData),
        event && event.code ? event.code : "diagnostico interno",
        event && event.mensaje ? event.mensaje : "Evento tecnico interno.",
        event && event.detalle ? event.detalle : event,
        event && event.elapsedMs
      );
    });
  }

  function addResponseMetricDiagnostics(response) {
    var metricas = response && response.metricas ? response.metricas : null;
    var events = metricas && Array.isArray(metricas.eventos) ? metricas.eventos : [];
    events.slice(-12).forEach(function eachMetric(event) {
      addFase11DiagnosticEvent(
        event && event.level === "error" ? "ERROR" : (event && event.level === "warn" ? "WARN" : "INFO"),
        "Cerebro",
        event && event.code ? event.code : "evento",
        event && event.message ? event.message : "Evento de orquestacion.",
        event && event.detail ? event.detail : event,
        null
      );
    });
  }

  function addModuleDiagnostics(response) {
    var finalData = getPhotoAnalysisFinalData(response);
    var modules = finalData && finalData.modulos && typeof finalData.modulos === "object" ? finalData.modulos : {};
    ["boxer1", "boxer2", "boxer3", "boxer4"].forEach(function eachModule(moduleKey) {
      var item = modules[moduleKey];
      if (!item) return;
      addFase11DiagnosticEvent(
        item.estadoPasaporteModulo === "ROJO" ? "WARN" : "INFO",
        moduleLabel(moduleKey, item),
        "resultado motor",
        "Pasaporte " + String(item.estadoPasaporteModulo || "-") + ". IA: " + String(item.estadoIA || "-") + ".",
        item,
        item.elapsedMs
      );
      addBoxerInternalDiagnostic(moduleKey, item);
    });
  }

  function addFinalDecisionDiagnostic(response, outcome) {
    var finalData = getPhotoAnalysisFinalData(response);
    if (!finalData || (!finalData.decision && !finalData.propuestaFinal)) return;
    var decision = finalData && finalData.decision ? finalData.decision : {};
    var propuesta = finalData && finalData.propuestaFinal ? finalData.propuestaFinal : {};
    addFase11DiagnosticEvent(
      outcome === "bloqueado" ? "WARN" : "INFO",
      "Cerebro",
      "decision final",
      "Pasaporte " + String(decision.pasaporte || "-") + ". Flujo " + String(decision.decisionFlujo || "-") + ".",
      {
        analysisId: finalData && finalData.analysisId,
        traceId: finalData && finalData.traceId,
        propuestaFinal: propuesta,
        decision: decision,
        revision: finalData && finalData.revision,
        ia: finalData && finalData.ia
      },
      finalData && finalData.elapsedMs
    );
  }

  function recordPhotoAnalysisDiagnostics(response, outcome) {
    if (!response) return;
    addResponseMetricDiagnostics(response);
    addModuleDiagnostics(response);
    addFinalDecisionDiagnostic(response, outcome);
  }

  function applyPhotoAnalysisToAddModal(state, response, outcome, photoPayload) {
    var finalData = getPhotoAnalysisFinalData(response);
    var propuesta = finalData.propuestaFinal || {};
    var passport = resolvePhotoPassport(finalData, outcome);
    var safePayload = photoPayload || {};
    var safeFotoRefs = cloneArray(safePayload.fotoRefs);
    var photoVisuales = cloneVisuales(safePayload.visuales);
    state.ui.add.nombre = String(propuesta.nombre || "").trim();
    state.ui.add.formato = String(propuesta.formato || "").trim();
    state.ui.add.formatoNormalizado = String(propuesta.formatoNormalizado || propuesta.formato || "").trim();
    state.ui.add.tipoFormato = String(propuesta.tipoFormato || "desconocido").trim() || "desconocido";
    state.ui.add.selectedAllergenIds = normalizeAllergenList(propuesta.alergenos || []);
    state.ui.add.photoResultReady = true;
    state.ui.add.visualPending = !!safePayload.visualPending;
    state.ui.add.photoVisuales = photoVisuales;
    state.ui.add.photoRefs = safeFotoRefs.length
      ? safeFotoRefs
      : photoVisuales.map(function mapRef(item) {
        return String(item && item.ref || "").trim();
      }).filter(Boolean).slice(0, 2);
    state.ui.add.analysisId = String(finalData.analysisId || safePayload.analysisId || "").trim();
    state.ui.add.traceId = String(finalData.traceId || safePayload.traceId || "").trim();
    state.ui.add.batchId = String(safePayload.batchId || "").trim();
    state.ui.add.photoStatus = buildPhotoAnalysisStatus(response, outcome);
    state.ui.add.photoStatusKind = getPhotoPassportStatusKind(passport);
    if (photoVisuales.length) {
      traceAnalysisEvent("visual_link_done", {
        target: "modal",
        totalVisuales: photoVisuales.length
      }, {
        analysisId: state.ui.add.analysisId,
        traceId: state.ui.add.traceId,
        phase: "modal"
      });
    }
  }

  function isDataImageUrl(value) {
    return /^data:image\//i.test(String(value || "").trim());
  }

  function isRemoteImageUrl(value) {
    return /^https?:\/\//i.test(String(value || "").trim());
  }

  function buildLightPhotoRefs(fotoRefs, analysisId, traceId) {
    var refs = Array.isArray(fotoRefs) ? fotoRefs.filter(Boolean).slice(0, 2) : [];
    if (!refs.length) return [];
    var base = sanitizeAssetPart(analysisId || traceId || ("photo_" + Date.now().toString(36)));
    return refs.map(function mapRef(_ref, index) {
      return "photo_asset:" + base + ":" + String(index + 1);
    });
  }

  function buildLightProductVisuales(rawVisuales, lightRefs) {
    var refs = Array.isArray(lightRefs) ? lightRefs.filter(Boolean).slice(0, 2) : [];
    var visuales = Array.isArray(rawVisuales) ? rawVisuales : [];
    var out = [];
    for (var i = 0; i < refs.length; i += 1) {
      var raw = visuales[i] && typeof visuales[i] === "object" ? visuales[i] : {};
      var thumbSrc = String(raw.thumbSrc || "").trim();
      var viewerSrc = String(raw.viewerSrc || "").trim();
      out.push({
        ref: refs[i],
        thumbSrc: isRemoteImageUrl(thumbSrc) ? thumbSrc : null,
        viewerSrc: isRemoteImageUrl(viewerSrc) ? viewerSrc : null,
        profileKey: String(raw.profileKey || "").trim() || null,
        qualityPct: Number(raw.qualityPct) || null,
        resolutionMaxPx: Number(raw.resolutionMaxPx) || null,
        generatedAt: String(raw.generatedAt || "").trim() || new Date().toISOString()
      });
    }
    return out;
  }

  function dataUrlMime(value) {
    var match = String(value || "").match(/^data:([^;,]+)[;,]/i);
    return match && match[1] ? match[1].toLowerCase() : "image/webp";
  }

  function dataUrlBytes(value) {
    var raw = String(value || "");
    var comma = raw.indexOf(",");
    if (comma < 0) return null;
    var payload = raw.slice(comma + 1);
    return Math.floor((payload.length * 3) / 4);
  }

  function sanitizeAssetPart(value) {
    return String(value || "")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 120);
  }

  async function uploadDataImage(runtime, path, dataUrl) {
    if (!runtime || !runtime.storageModule || !isDataImageUrl(dataUrl)) return null;
    var storageModule = runtime.storageModule;
    if (
      typeof storageModule.getStorage !== "function" ||
      typeof storageModule.ref !== "function" ||
      typeof storageModule.uploadString !== "function" ||
      typeof storageModule.getDownloadURL !== "function"
    ) {
      return null;
    }
    var storage = storageModule.getStorage(runtime.app || undefined);
    var objectRef = storageModule.ref(storage, path);
    await storageModule.uploadString(objectRef, dataUrl, "data_url", { contentType: dataUrlMime(dataUrl) });
    return {
      path: path,
      downloadURL: await storageModule.getDownloadURL(objectRef),
      mimeType: dataUrlMime(dataUrl),
      bytes: dataUrlBytes(dataUrl)
    };
  }

  async function persistPhotoAssetForProduct(state, product, visuales) {
    var safeProduct = product || {};
    var productId = String(safeProduct.id || "").trim();
    var visual = Array.isArray(visuales) && visuales[0] ? visuales[0] : null;
    if (!productId || !visual) return;
    var thumbSrc = String(visual.thumbSrc || "").trim();
    var viewerSrc = String(visual.viewerSrc || visual.thumbSrc || "").trim();
    if (!thumbSrc && !viewerSrc) return;

    seedProductVisualAsset(state, productId, visuales);
    refreshVisibleList(state, { skipAssetReload: true });

    if (!isDataImageUrl(thumbSrc) && !isDataImageUrl(viewerSrc)) return;

    var runtime = getFirebaseRuntime();
    if (!runtime || runtime.ok !== true || !runtime.storageModule) return;
    var token = readSessionToken(state);
    if (runtime && typeof runtime.waitForAuth === "function") {
      await runtime.waitForAuth(token || null);
    }

    var assetId = sanitizeAssetPart("asset_" + productId + "_" + Date.now().toString(36));
    var root = "fase4_activos/" + sanitizeAssetPart(productId) + "/" + assetId;
    var thumbUpload = await uploadDataImage(runtime, root + "_thumb.webp", thumbSrc || viewerSrc);
    var viewerUpload = await uploadDataImage(runtime, root + "_viewer.webp", viewerSrc || thumbSrc);
    if (!thumbUpload && !viewerUpload) return;

    var resolved = resolveRemoteAssetIndex(state);
    if (!resolved.ok || !resolved.remoteIndex || typeof resolved.remoteIndex.upsertAssetRecord !== "function") return;
    var now = new Date().toISOString();
    var asset = {
      assetId: assetId,
      schemaVersion: 1,
      productId: productId,
      origen: "alta_foto_normal",
      contenedor: "firebase_storage",
      archivo: {
        fileName: assetId + ".webp",
        mimeType: viewerUpload ? viewerUpload.mimeType : (thumbUpload ? thumbUpload.mimeType : "image/webp"),
        bytes: viewerUpload ? viewerUpload.bytes : (thumbUpload ? thumbUpload.bytes : null)
      },
      derivados: {
        thumbnailPath: thumbUpload ? thumbUpload.path : null,
        compressedPath: viewerUpload ? viewerUpload.path : null,
        miniaturaTarjeta: thumbUpload ? {
          mimeType: thumbUpload.mimeType,
          bytes: thumbUpload.bytes,
          qualityPct: Number(visual.qualityPct) || null,
          maxSidePx: 200,
          downloadURL: thumbUpload.downloadURL
        } : null,
        imagenVisor: viewerUpload ? {
          mimeType: viewerUpload.mimeType,
          bytes: viewerUpload.bytes,
          qualityPct: Number(visual.qualityPct) || null,
          maxSidePx: Number(visual.resolutionMaxPx) || null,
          compressionProfile: String(visual.profileKey || "").trim() || null,
          downloadURL: viewerUpload.downloadURL
        } : null
      },
      sistema: {
        estadoRegistro: "ACTIVO",
        syncState: "SYNCED",
        rowVersion: 1,
        dirty: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null
      }
    };
    var saved = await resolved.remoteIndex.upsertAssetRecord({ asset: asset, sessionToken: token || null });
    if (!saved || saved.ok !== true) return;
    state.assetVisualsByProductId[productId] = {
      thumbUrl: thumbUpload && thumbUpload.downloadURL ? thumbUpload.downloadURL : (viewerUpload ? viewerUpload.downloadURL : ""),
      viewerUrl: viewerUpload && viewerUpload.downloadURL ? viewerUpload.downloadURL : (thumbUpload ? thumbUpload.downloadURL : "")
    };
    state.assetVisualsLoaded = true;
    refreshVisibleList(state, { skipAssetReload: true });
  }

  function createManualConfirmationDestination() {
    return function manualConfirmationDestination() {
      return { ok: true, routed: false, manualConfirmation: true };
    };
  }

  async function submitManualAdd(state) {
    if (!globalScope.Fase3OperativaAltaManual || typeof globalScope.Fase3OperativaAltaManual.ejecutarAltaManual !== "function") {
      showFeedback(state, "error", { message: "Alta manual no disponible." });
      return;
    }
    state.ui.add.busy = true;
    renderAddModal(state);
    var previousExactProduct = findExistingActiveProductByName(state.store, state.ui.add.nombre);
    var photoResultReady = !!state.ui.add.photoResultReady;
    var photoRefs = cloneArray(state.ui.add.photoRefs);
    var photoVisuales = cloneVisuales(state.ui.add.photoVisuales);
    var analysisId = String(state.ui.add.analysisId || "").trim();
    var traceId = String(state.ui.add.traceId || "").trim();
    var lightPhotoRefs = photoResultReady ? buildLightPhotoRefs(photoRefs, analysisId, traceId) : [];
    var productVisuales = photoResultReady ? buildLightProductVisuales(photoVisuales, lightPhotoRefs) : [];
    var out = globalScope.Fase3OperativaAltaManual.ejecutarAltaManual(
      {
        nombre: state.ui.add.nombre,
        formato: state.ui.add.formato,
        formatoNormalizado: state.ui.add.formatoNormalizado,
        tipoFormato: state.ui.add.tipoFormato,
        alergenos: cloneArray(state.ui.add.selectedAllergenIds),
        origenAlta: photoResultReady ? "foto" : "manual",
        fotoRefs: lightPhotoRefs,
        visuales: productVisuales
      },
      { store: state.store }
    );
    state.ui.add.busy = false;
    renderAddModal(state);
    if (!out || out.ok !== true) {
      showFeedback(state, "error", {
        message: out && out.error && out.error.message ? out.error.message : "No se pudo guardar el producto."
      });
      return;
    }
    var isMerge = !!(out.resultado && out.resultado.datos && out.resultado.datos.fusionExacta);
    var savedProduct = out.resultado && out.resultado.datos ? out.resultado.datos.producto : null;
    if (savedProduct) {
      var visibleHistoryType = isMerge && previousExactProduct ? "PRODUCT_UPDATED" : "PRODUCT_CREATED";
      recordVisibleHistory(
        state,
        visibleHistoryType,
        visibleHistoryType === "PRODUCT_UPDATED" ? previousExactProduct : null,
        savedProduct,
        out && out.resultado && out.resultado.datos ? out.resultado.datos.historyEventId : null
      );
    }
    if (photoResultReady && savedProduct && photoRefs.length && analysisId && !photoVisuales.length) {
      var queue = getDeferredVisualQueue();
      if (queue && typeof queue.attachProductTarget === "function") {
        queue.attachProductTarget(analysisId, {
          productId: savedProduct.id,
          isStillValid: function isStillValid() {
            return !!(
              state &&
              state.store &&
              typeof state.store.getProductById === "function" &&
              state.store.getProductById(savedProduct.id)
            );
          },
          apply: function applyProductVisuals(visuales, rawRefs) {
            var finalVisuales = buildProductPhotoVisuales(rawRefs, visuales);
            var finalLightRefs = buildLightPhotoRefs(rawRefs, analysisId, traceId);
            var finalProductVisuales = buildLightProductVisuales(finalVisuales, finalLightRefs);
            if (!finalVisuales.length) return;
            if (state.store && typeof state.store.updateProductById === "function") {
              state.store.updateProductById({
                productId: savedProduct.id,
                fotoRefs: finalLightRefs,
                visuales: finalProductVisuales
              });
            }
            seedProductVisualAsset(state, savedProduct.id, finalVisuales);
            refreshSingleVisibleCard(state, savedProduct.id);
            persistPhotoAssetForProduct(state, savedProduct, finalVisuales).catch(function onAssetDeferredError() {
              // La subida remota va despues del resultado visible.
            });
          }
        });
      }
    }
    closeAddModal(state, { preserveVisualJob: true, reason: "manual_save" });
    if (photoResultReady && savedProduct && photoVisuales.length) {
      seedProductVisualAsset(state, savedProduct.id, photoVisuales);
    }
    refreshVisibleList(state, { skipAssetReload: true });
    showFeedback(state, isMerge ? "manual_merge" : "manual_add");
    if (photoResultReady && savedProduct && photoVisuales.length) {
      persistPhotoAssetForProduct(state, savedProduct, photoVisuales).catch(function onAssetError() {
        // La miniatura local ya esta disponible; la subida remota no debe bloquear el alta.
      });
    }
    triggerSync(state, "manual_save");
  }

  async function submitPhotoAdd(state) {
    if (!globalScope.Fase3AltaFotoVisibleApp || typeof globalScope.Fase3AltaFotoVisibleApp.ejecutarAnalisisVisible !== "function") {
      showFeedback(state, "error", { message: "Alta por foto no disponible." });
      return;
    }
    try {
      var photoStartedAt = Date.now();
      var fase11CaseId = "alta_foto_normal_" + photoStartedAt.toString(36);
      var fase11CaseOpened = false;
      state.ui.add.busy = true;
      state.ui.add.photoResultReady = false;
      state.ui.add.visualPending = false;
      state.ui.add.formato = "";
      state.ui.add.formatoNormalizado = "";
      state.ui.add.tipoFormato = "desconocido";
      state.ui.add.photoStatus = "Preparando analisis...";
      state.ui.add.photoStatusKind = "";
      traceAnalysisEvent("analysis_button_clicked", {
        from: "gestion_registros"
      }, { phase: "submit" });
      traceAnalysisEvent("nonessential_pause_requested", {
        from: "gestion_registros"
      }, { phase: "pause" });
      requestAnalysisExclusive({
        reason: "analyze_clicked",
        phase: "submit"
      });
      renderAddModal(state);
      var fotoRefs = await readPhotoRefsFromInputs(state);
      openFase11PhotoCase(fase11CaseId, fotoRefs);
      fase11CaseOpened = true;
      addFase11DiagnosticEvent("INFO", "Alta foto", "foto leida", "Foto leida: " + fotoRefs.length + " foto(s).", { totalFotos: fotoRefs.length }, null);
      await ensurePhotoRuntimeReady(state);
      traceAnalysisEvent("nonessential_pause_done", {
        totalFotos: fotoRefs.length
      }, { phase: "pause" });
      state.ui.add.photoStatus = "Analizando foto...";
      addFase11DiagnosticEvent("INFO", "Alta foto", "motores", "Analisis enviado a motores de la app.", null, null);
      renderAddModal(state);
      var backendUrl = globalScope.Fase3AltaFotoVisibleApp.DEFAULT_BACKEND_URL;
      if (state.runtime && typeof state.runtime.getBackendUrl === "function") {
        backendUrl = String(state.runtime.getBackendUrl() || backendUrl).trim() || backendUrl;
      }
      markAnalysisStarted({ phase: "analysis" });
      var response = await globalScope.Fase3AltaFotoVisibleApp.ejecutarAnalisisVisible(
        {
          fotoRefs: fotoRefs,
          sessionToken: readSessionToken(state),
          backendUrl: backendUrl,
          contextoAlta: "normal",
          reviewPolicy: "disabled"
        },
        {
          store: state.store,
          visibleRuntime: state.runtime,
          openRevisionDestination: createManualConfirmationDestination()
        }
      );
      var outcome = typeof globalScope.Fase3AltaFotoVisibleApp.classifyVisibleOutcome === "function"
        ? globalScope.Fase3AltaFotoVisibleApp.classifyVisibleOutcome(response)
        : "revision";
      var finalData = hasPhotoAnalysisResult(response) ? getPhotoAnalysisFinalData(response) : null;
      var analysisId = finalData && finalData.analysisId ? String(finalData.analysisId).trim() : "";
      var traceId = finalData && finalData.traceId ? String(finalData.traceId).trim() : "";
      if (analysisId || traceId) {
        attachAnalysisMeta({
          analysisId: analysisId,
          traceId: traceId,
          phase: "analysis_response"
        });
      }
      var passport = hasPhotoAnalysisResult(response)
        ? resolvePhotoPassport(finalData, outcome)
        : "";
      recordPhotoAnalysisDiagnostics(response, outcome);
      state.ui.add.busy = false;
      if (!response || response.ok !== true) {
        if (hasPhotoAnalysisResult(response)) {
          applyPhotoAnalysisToAddModal(state, response, outcome, {
            fotoRefs: fotoRefs,
            visuales: [],
            visualPending: true,
            analysisId: analysisId,
            traceId: traceId
          });
          closeFase11PhotoCase(true, "Analisis recibido con datos aprovechables. Pasaporte " + passport + ".", Date.now() - photoStartedAt, response);
          renderAddModal(state);
          showFeedback(state, "photo_ready");
          markAnalysisResultVisible({
            outcome: outcome,
            passport: passport
          }, {
            analysisId: analysisId,
            traceId: traceId,
            phase: "result"
          });
          scheduleDeferredAddVisuals(state, response, fotoRefs);
          resumeAnalysisExclusive({
            analysisId: analysisId,
            traceId: traceId,
            reason: "result_visible"
          });
          return;
        }
        state.ui.add.photoStatus = response && response.error && response.error.message
          ? response.error.message
          : "No se pudo completar el analisis.";
        state.ui.add.photoResultReady = false;
        state.ui.add.photoStatusKind = "error";
        closeFase11PhotoCase(false, state.ui.add.photoStatus, Date.now() - photoStartedAt, response);
        renderAddModal(state);
        showFeedback(state, "error", { message: state.ui.add.photoStatus });
        cancelAnalysisExclusive({ reason: "analysis_failed" });
        return;
      }
      applyPhotoAnalysisToAddModal(state, response, outcome, {
        fotoRefs: fotoRefs,
        visuales: [],
        visualPending: true,
        analysisId: analysisId,
        traceId: traceId
      });
      closeFase11PhotoCase(true, "Analisis completado. Pasaporte " + passport + ".", Date.now() - photoStartedAt, response);
      renderAddModal(state);
      showFeedback(state, "photo_ready");
      markAnalysisResultVisible({
        outcome: outcome,
        passport: passport
      }, {
        analysisId: analysisId,
        traceId: traceId,
        phase: "result"
      });
      scheduleDeferredAddVisuals(state, response, fotoRefs);
      resumeAnalysisExclusive({
        analysisId: analysisId,
        traceId: traceId,
        reason: "result_visible"
      });
    } catch (errPhoto) {
      state.ui.add.busy = false;
      state.ui.add.photoResultReady = false;
      state.ui.add.photoStatus = errPhoto && errPhoto.message ? errPhoto.message : "No se pudo leer la foto.";
      state.ui.add.photoStatusKind = "error";
      if (!fase11CaseOpened) openFase11PhotoCase(fase11CaseId || "alta_foto_error_" + Date.now().toString(36), []);
      closeFase11PhotoCase(false, state.ui.add.photoStatus, Date.now() - photoStartedAt, {
        message: state.ui.add.photoStatus,
        raw: errPhoto && errPhoto.stack ? errPhoto.stack : String(errPhoto || "")
      });
      renderAddModal(state);
      showFeedback(state, "error", { message: state.ui.add.photoStatus });
      cancelAnalysisExclusive({ reason: "analysis_exception" });
    }
  }

  async function submitEdit(state) {
    if (!state.ui.edit.productId) {
      showFeedback(state, "error", { message: "No hay producto para editar." });
      return;
    }
    var previousRecord = state.store && typeof state.store.getProductById === "function"
      ? state.store.getProductById(state.ui.edit.productId)
      : null;
    state.ui.edit.busy = true;
    renderEditModal(state);
    var out = state.gestion.editarProducto(
      {
        productId: state.ui.edit.productId,
        nombre: state.ui.edit.nombre,
        alergenos: cloneArray(state.ui.edit.selectedAllergenIds)
      },
      { store: state.store }
    );
    state.ui.edit.busy = false;
    renderEditModal(state);
    if (!out || out.ok !== true) {
      showFeedback(state, "error", {
        message: out && out.error && out.error.message ? out.error.message : "No se pudo editar el producto."
      });
      return;
    }
    var updatedProduct = out && out.resultado && out.resultado.datos ? out.resultado.datos.producto : null;
    if (updatedProduct) {
      recordVisibleHistory(
        state,
        "PRODUCT_UPDATED",
        previousRecord,
        updatedProduct,
        out && out.resultado && out.resultado.datos ? out.resultado.datos.historyEventId : null
      );
    }
    closeEditModal(state);
    refreshVisibleList(state, { skipAssetReload: true });
    showFeedback(state, "edit_saved");
  }

  async function submitDeleteFromEdit(state) {
    if (!state.ui.edit.productId) return;
    state.ui.edit.busy = true;
    renderEditModal(state);
    var productId = state.ui.edit.productId;
    var productName = state.ui.edit.nombre;
    var deleteOut = await deleteProduct(state, productId, productName);
    state.ui.edit.busy = false;
    if (deleteOut && deleteOut.ok === true) {
      closeEditModal(state);
      showFeedback(state, "", { message: deleteOut.message || "Producto eliminado." });
      return;
    }
    if (!(deleteOut && deleteOut.cancelled === true)) {
      showFeedback(state, "error", {
        message: deleteOut && deleteOut.message ? deleteOut.message : "No se pudo eliminar el producto."
      });
    }
    renderEditModal(state);
  }

  function buildFilterButtons() {
    var target = byId("allergen-filter-bar");
    if (!target) return;
    var allergenIds = getAllergenCatalog();
    target.innerHTML = allergenIds.map(function mapFilter(allergenId) {
      var label = allergenId.replace(/_/g, " ");
      return (
        "<button type=\"button\" class=\"filter-button js-allergen-filter\" data-allergen-id=\"" + escapeHtml(allergenId) + "\" aria-pressed=\"false\" aria-label=\"" + escapeHtml(label) + "\" title=\"" + escapeHtml(label) + "\">" +
          "<img src=\"" + escapeHtml(ICON_BASE_PATH + allergenId + ".svg") + "\" alt=\"\">" +
        "</button>"
      );
    }).join("");
  }

  function applyViewerTransform(state) {
    var viewer = state.viewer;
    var transform = "translate(" + viewer.offsetX.toFixed(1) + "px, " + viewer.offsetY.toFixed(1) + "px) scale(" + viewer.zoom.toFixed(2) + ")";
    state.el.viewerImage.style.transform = transform;
    state.el.viewerMeta.textContent = "Zoom x" + viewer.zoom.toFixed(2);
  }

  function clampZoom(value) {
    var zoom = Number(value);
    if (!Number.isFinite(zoom)) return 1;
    if (zoom < 1) return 1;
    if (zoom > 4) return 4;
    return Math.round(zoom * 100) / 100;
  }

  function restoreViewerScroll(state) {
    var y = Number(state.viewer.scrollYBeforeOpen || 0);
    function applyScroll() {
      globalScope.scrollTo(0, y);
    }
    globalScope.requestAnimationFrame(function onFrame() {
      applyScroll();
      globalScope.requestAnimationFrame(function onSecondFrame() {
        applyScroll();
      });
    });
    globalScope.setTimeout(function onLateRestore() {
      applyScroll();
      setViewerScrollRestoration(state, "restore");
    }, 120);
  }

  function setViewerScrollRestoration(state, mode) {
    try {
      if (!globalScope.history || !("scrollRestoration" in globalScope.history)) return;
      if (mode === "manual") {
        state.viewer.scrollRestorationBeforeOpen = globalScope.history.scrollRestoration || "auto";
        globalScope.history.scrollRestoration = "manual";
        return;
      }
      globalScope.history.scrollRestoration = state.viewer.scrollRestorationBeforeOpen || "auto";
      state.viewer.scrollRestorationBeforeOpen = null;
    } catch (errScrollRestoration) {
      state.viewer.scrollRestorationBeforeOpen = null;
    }
  }

  function pushViewerHistoryState(state) {
    if (state.viewer.historyPushed) return;
    state.viewer.scrollYBeforeOpen = Number(globalScope.scrollY || globalScope.pageYOffset || 0);
    state.viewer.historyPushed = true;
    setViewerScrollRestoration(state, "manual");
    try {
      var currentState = globalScope.history && globalScope.history.state && typeof globalScope.history.state === "object"
        ? globalScope.history.state
        : {};
      var marker = "viewer_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
      state.viewer.historyMarker = marker;
      globalScope.history.pushState(
        Object.assign({}, currentState, { appv2ViewerMarker: marker }),
        ""
      );
    } catch (errPush) {
      state.viewer.historyPushed = false;
      state.viewer.historyMarker = null;
      setViewerScrollRestoration(state, "restore");
    }
  }

  function openViewer(state, src, title) {
    if (!src) return;
    if (!state.viewer.isOpen) {
      pushViewerHistoryState(state);
    }
    state.viewer.awaitingPopstateClose = false;
    state.viewer.isOpen = true;
    state.viewer.zoom = 1;
    state.viewer.offsetX = 0;
    state.viewer.offsetY = 0;
    state.viewer.dragging = false;
    state.el.viewerStage.classList.remove("dragging");
    state.el.viewerImage.src = String(src || "").trim();
    state.el.viewerTitle.textContent = title ? String(title) : "Foto ampliada";
    state.el.viewerModal.hidden = false;
    state.el.viewerModal.setAttribute("aria-hidden", "false");
    applyViewerTransform(state);
  }

  function closeViewer(state, options) {
    var safeOptions = options || {};
    if (!state.viewer.isOpen) return;
    if (state.viewer.historyPushed && !safeOptions.fromPopstate) {
      state.viewer.awaitingPopstateClose = true;
      state.viewer.isOpen = false;
      state.viewer.dragging = false;
      state.el.viewerStage.classList.remove("dragging");
      state.el.viewerModal.hidden = true;
      state.el.viewerModal.setAttribute("aria-hidden", "true");
      try {
        globalScope.history.back();
        globalScope.setTimeout(function onHistoryBackFallback() {
          if (!state.viewer.awaitingPopstateClose) return;
          state.viewer.awaitingPopstateClose = false;
          state.viewer.historyPushed = false;
          state.viewer.historyMarker = null;
          restoreViewerScroll(state);
        }, 180);
        return;
      } catch (errBack) {
        // Sigue cierre local.
      }
    }
    state.viewer.awaitingPopstateClose = false;
    state.viewer.isOpen = false;
    state.viewer.dragging = false;
    state.el.viewerStage.classList.remove("dragging");
    state.el.viewerModal.hidden = true;
    state.el.viewerModal.setAttribute("aria-hidden", "true");
    if (safeOptions.fromPopstate) {
      state.viewer.historyPushed = false;
      state.viewer.historyMarker = null;
      restoreViewerScroll(state);
      return;
    }
    state.viewer.historyPushed = false;
    state.viewer.historyMarker = null;
    restoreViewerScroll(state);
  }

  function bindViewer(state) {
    state.el.viewerClose.addEventListener("click", function onClose() {
      closeViewer(state, { fromPopstate: false });
    });
    state.el.viewerZoomIn.addEventListener("click", function onZoomIn() {
      state.viewer.zoom = clampZoom(state.viewer.zoom + 0.25);
      applyViewerTransform(state);
    });
    state.el.viewerZoomOut.addEventListener("click", function onZoomOut() {
      state.viewer.zoom = clampZoom(state.viewer.zoom - 0.25);
      applyViewerTransform(state);
    });
    state.el.viewerZoomReset.addEventListener("click", function onZoomReset() {
      state.viewer.zoom = 1;
      state.viewer.offsetX = 0;
      state.viewer.offsetY = 0;
      applyViewerTransform(state);
    });
    state.el.viewerStage.addEventListener("wheel", function onWheel(ev) {
      ev.preventDefault();
      state.viewer.zoom = clampZoom(state.viewer.zoom + (ev.deltaY < 0 ? 0.15 : -0.15));
      applyViewerTransform(state);
    }, { passive: false });
    state.el.viewerStage.addEventListener("pointerdown", function onPointerDown(ev) {
      state.viewer.dragging = true;
      state.viewer.dragStartX = ev.clientX;
      state.viewer.dragStartY = ev.clientY;
      state.el.viewerStage.classList.add("dragging");
    });
    globalScope.addEventListener("pointermove", function onPointerMove(ev) {
      if (!state.viewer.dragging) return;
      var dx = ev.clientX - state.viewer.dragStartX;
      var dy = ev.clientY - state.viewer.dragStartY;
      state.viewer.dragStartX = ev.clientX;
      state.viewer.dragStartY = ev.clientY;
      state.viewer.offsetX += dx;
      state.viewer.offsetY += dy;
      applyViewerTransform(state);
    });
    globalScope.addEventListener("pointerup", function onPointerUp() {
      if (!state.viewer.dragging) return;
      state.viewer.dragging = false;
      state.el.viewerStage.classList.remove("dragging");
    });
    globalScope.addEventListener("keydown", function onKeyDown(ev) {
      if (!state.viewer.isOpen) return;
      if (ev.key === "Escape") {
        ev.preventDefault();
        closeViewer(state, { fromPopstate: false });
      }
    });
    globalScope.addEventListener("popstate", function onPopState() {
      if (!state.viewer.isOpen && !state.viewer.awaitingPopstateClose) return;
      closeViewer(state, { fromPopstate: true });
    });
  }

  function bindListActions(state) {
    var target = byId("productos-list");
    if (!target) return;
    target.addEventListener("click", function onListClick(event) {
      var photoButton = event.target.closest(".js-open-photo");
      if (photoButton) {
        openViewer(
          state,
          photoButton.getAttribute("data-viewer-src"),
          photoButton.getAttribute("data-name") || "Foto ampliada"
        );
        return;
      }
      var card = event.target.closest(".js-edit-card");
      if (card) {
        openEditModal(state, card.getAttribute("data-product-id"));
      }
    });
  }

  function updateVisibleLimit(state) {
    state.visibleLimit = state.pageSize;
  }

  function wireEvents(state) {
    byId("open-add-product").addEventListener("click", function onOpenAdd() {
      openAddModal(state);
    });

    byId("close-add-product").addEventListener("click", function onCloseAdd() {
      closeAddModal(state);
    });

    byId("cancel-add-product").addEventListener("click", function onCancelAdd() {
      closeAddModal(state);
    });

    byId("add-allergen-grid").addEventListener("click", function onAddAllergen(event) {
      var button = event.target.closest(".js-modal-allergen");
      if (!button || state.ui.add.busy) return;
      state.ui.add.selectedAllergenIds = toggleSelectedAllergen(
        state.ui.add.selectedAllergenIds,
        button.getAttribute("data-allergen-id")
      );
      renderAddModal(state);
    });

    byId("save-add-product").addEventListener("click", function onSaveAdd() {
      state.ui.add.nombre = byId("add-product-name").value;
      submitManualAdd(state);
    });

    byId("add-product-name").addEventListener("input", function onAddNameInput() {
      state.ui.add.nombre = byId("add-product-name").value;
    });

    byId("add-photo-file-1").addEventListener("change", function onPhotoChange() {
      updatePhotoPreview(state, "envase", state.el.addPhotoFile1.files && state.el.addPhotoFile1.files[0]);
      updatePhotoSummary(state);
    });

    byId("add-photo-file-2").addEventListener("change", function onPhotoChange() {
      updatePhotoPreview(state, "etiqueta", state.el.addPhotoFile2.files && state.el.addPhotoFile2.files[0]);
      updatePhotoSummary(state);
    });

    byId("open-photo-origin").addEventListener("click", function onOpenOrigin() {
      openPhotoOriginModal(state, "envase");
    });

    byId("photo-slot-envase").addEventListener("click", function onOpenEnvase() {
      openPhotoOriginModal(state, "envase");
    });

    byId("photo-slot-etiqueta").addEventListener("click", function onOpenEtiqueta() {
      openPhotoOriginModal(state, "etiqueta");
    });

    byId("origin-cancel").addEventListener("click", function onCancelOrigin() {
      closePhotoOriginModal(state);
    });

    byId("origin-camera").addEventListener("click", function onOriginCamera() {
      pickPhotoFromOrigin(state, "camera");
    });

    byId("origin-gallery").addEventListener("click", function onOriginGallery() {
      pickPhotoFromOrigin(state, "gallery");
    });

    byId("analyze-photo-product").addEventListener("click", function onAnalyzePhoto() {
      submitPhotoAdd(state);
    });

    byId("close-edit-product").addEventListener("click", function onCloseEdit() {
      closeEditModal(state);
    });

    byId("cancel-edit-product").addEventListener("click", function onCancelEdit() {
      closeEditModal(state);
    });

    byId("edit-allergen-grid").addEventListener("click", function onEditAllergen(event) {
      var button = event.target.closest(".js-modal-allergen");
      if (!button || state.ui.edit.busy) return;
      state.ui.edit.selectedAllergenIds = toggleSelectedAllergen(
        state.ui.edit.selectedAllergenIds,
        button.getAttribute("data-allergen-id")
      );
      renderEditModal(state);
    });

    byId("edit-product-name").addEventListener("input", function onEditNameInput() {
      state.ui.edit.nombre = byId("edit-product-name").value;
    });

    byId("save-edit-product").addEventListener("click", function onSaveEdit() {
      state.ui.edit.nombre = byId("edit-product-name").value;
      submitEdit(state);
    });

    byId("delete-edit-product").addEventListener("click", function onDeleteEdit() {
      submitDeleteFromEdit(state);
    });

    byId("abrir-ajustes").addEventListener("click", function onAjustes() {
      openAjustes();
    });

    var loteButton = byId("abrir-lote");
    if (loteButton) {
      loteButton.addEventListener("click", function onLote() {
        openLote();
      });
    }

    var historialButton = byId("abrir-historial");
    if (historialButton) {
      historialButton.addEventListener("click", function onHistorial() {
        openHistorial();
      });
    }

    byId("recargar").addEventListener("click", function onReload() {
      manualSync(state);
    });

    byId("revision-pending-button").addEventListener("click", function onRevision() {
      openRevisionPending(state);
    });

    byId("pending-toggle").addEventListener("click", function onTogglePending() {
      state.pendingOnly = !state.pendingOnly;
      updateVisibleLimit(state);
      refreshVisibleList(state);
    });

    byId("sin-toggle").addEventListener("click", function onToggleSin() {
      state.sinActivo = !state.sinActivo;
      updateVisibleLimit(state);
      refreshVisibleList(state);
    });

    byId("allergen-filter-bar").addEventListener("click", function onFilterBar(event) {
      var button = event.target.closest(".js-allergen-filter");
      if (!button) return;
      state.selectedAllergenIds = toggleSelectedAllergen(
        state.selectedAllergenIds,
        button.getAttribute("data-allergen-id")
      );
      updateVisibleLimit(state);
      refreshVisibleList(state);
    });

    byId("buscar").addEventListener("input", function onSearch() {
      if (state.searchTimerId) {
        globalScope.clearTimeout(state.searchTimerId);
        state.searchTimerId = null;
      }
      state.searchTimerId = globalScope.setTimeout(function applySearch() {
        state.searchTimerId = null;
        state.searchText = byId("buscar").value;
        updateVisibleLimit(state);
        refreshVisibleList(state);
      }, 120);
    });

    byId("cargar-mas").addEventListener("click", function onLoadMore() {
      state.visibleLimit += state.pageSize;
      refreshVisibleList(state);
    });

    globalScope.addEventListener("fase3-firebase-ready", function onFirebaseReady() {
      initialProductsLoad(state, "firebase_ready");
    });

    globalScope.addEventListener("online", function onOnline() {
      triggerSync(state, "online");
    });

    globalScope.addEventListener("focus", function onFocus() {
      syncDraftsFromSharedSnapshot(state);
      renderRevisionPendingButton(state);
      triggerSync(state, "focus");
    });

    globalScope.addEventListener("storage", function onStorage(event) {
      if (event && event.key && event.key !== SHARED_BROWSER_STORE_KEY) return;
      syncDraftsFromSharedSnapshot(state);
      renderRevisionPendingButton(state);
      refreshVisibleList(state, { skipAssetReload: true });
    });

    globalScope.addEventListener("fase3-local-persist-error", function onLocalPersistError() {
      renderSyncStatus(state, "Copia local no guardada");
    });

    if (document && typeof document.addEventListener === "function") {
      document.addEventListener("visibilitychange", function onVisibility() {
        var manager = resolveSyncManager(state);
        if (!manager) return;
        if (document.visibilityState === "hidden") {
          if (typeof manager.stopListener === "function") manager.stopListener();
          return;
        }
        triggerSync(state, "visible");
      });
    }

    globalScope.addEventListener("beforeunload", function onUnload() {
      if (state.syncManager && typeof state.syncManager.destruir === "function") {
        state.syncManager.destruir();
      }
    });

    globalScope.addEventListener("keydown", function onGlobalEscape(ev) {
      if (ev.key !== "Escape") return;
      if (state.viewer && state.viewer.isOpen) return;
      if (state.ui.add.open) {
        ev.preventDefault();
        if (!state.el.photoOriginModal.hidden) {
          closePhotoOriginModal(state);
          return;
        }
        closeAddModal(state);
        return;
      }
      if (state.ui.edit.open) {
        ev.preventDefault();
        closeEditModal(state);
      }
    });
  }

  function init() {
    if (
      !globalScope.Fase3DataStoreLocal ||
      !globalScope.Fase3OperativaGestionRegistros ||
      !globalScope.CerebroProductosPersistencia
    ) {
      return;
    }

    applyTypographyTokens();
    buildFilterButtons();

    var state = {
      store: resolveStore(globalScope),
      gestion: globalScope.Fase3OperativaGestionRegistros,
      persistencia: globalScope.CerebroProductosPersistencia,
      runtime: globalScope.Fase5VisibleRuntime && typeof globalScope.Fase5VisibleRuntime.getDefaultRuntime === "function"
        ? globalScope.Fase5VisibleRuntime.getDefaultRuntime()
        : null,
      remoteIndex: null,
      syncManager: null,
      assetIndexRemote: null,
      assetVisualsByProductId: Object.create(null),
      assetVisualsLoaded: false,
      assetVisualRequestId: 0,
      lastVisibleProductIds: [],
      lastDerivedData: null,
      hasLoadedProducts: false,
      loadProductsPromise: null,
      lastCloudCount: 0,
      lastCloudLoadedAt: null,
      sessionRequired: false,
      sessionRedirecting: false,
      initialProductsLoaded: false,
      initialProductsLoadPromise: null,
      searchTimerId: null,
      unsubscribeStore: null,
      lastDraftSignature: "",
      pendingRevisionState: null,
      ui: {
        feedbackTimerId: null,
        overlayScrollY: 0,
        photoRuntimePromise: null,
        add: null,
        edit: null
      },
      viewer: {
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        dragging: false,
        dragStartX: 0,
        dragStartY: 0,
        isOpen: false,
        awaitingPopstateClose: false,
        historyPushed: false,
        historyMarker: null,
        scrollYBeforeOpen: 0,
        scrollRestorationBeforeOpen: null
      },
      el: {
        viewerModal: byId("viewer-modal"),
        viewerTitle: byId("viewer-title"),
        viewerMeta: byId("viewer-meta"),
        viewerStage: byId("viewer-stage"),
        viewerImage: byId("viewer-image"),
        viewerClose: byId("viewer-close"),
        viewerZoomIn: byId("viewer-zoom-in"),
        viewerZoomOut: byId("viewer-zoom-out"),
        viewerZoomReset: byId("viewer-zoom-reset"),
        feedbackToast: byId("feedback-toast"),
        addModal: byId("add-product-modal"),
        addModalTitle: byId("add-modal-title"),
        addModalHelp: byId("add-modal-help"),
        addManualPane: byId("add-manual-pane"),
        addManualTitle: byId("add-manual-title"),
        addPhotoPane: byId("add-photo-pane"),
        addProductName: byId("add-product-name"),
        addAllergenGrid: byId("add-allergen-grid"),
        saveAddProduct: byId("save-add-product"),
        cancelAddProduct: byId("cancel-add-product"),
        addPhotoFile1: byId("add-photo-file-1"),
        addPhotoFile2: byId("add-photo-file-2"),
        addPhotoSummary: byId("add-photo-summary"),
        addPhotoStatus: byId("add-photo-status"),
        analyzePhotoProduct: byId("analyze-photo-product"),
        openPhotoOrigin: byId("open-photo-origin"),
        photoSlotEnvase: byId("photo-slot-envase"),
        photoSlotEtiqueta: byId("photo-slot-etiqueta"),
        photoOriginModal: byId("photo-origin-modal"),
        photoOriginCopy: byId("photo-origin-copy"),
        editModal: byId("edit-product-modal"),
        editProductName: byId("edit-product-name"),
        editAllergenGrid: byId("edit-allergen-grid"),
        saveEditProduct: byId("save-edit-product"),
        cancelEditProduct: byId("cancel-edit-product"),
        deleteEditProduct: byId("delete-edit-product"),
        closeEditProduct: byId("close-edit-product")
      }
    };

    state.searchText = ESTADO_PANTALLA_FASE9.searchText;
    state.selectedAllergenIds = cloneArray(ESTADO_PANTALLA_FASE9.selectedAllergenIds);
    state.sinActivo = ESTADO_PANTALLA_FASE9.sinActivo;
    state.pendingOnly = ESTADO_PANTALLA_FASE9.pendingOnly;
    state.visibleLimit = ESTADO_PANTALLA_FASE9.visibleLimit;
    state.pageSize = ESTADO_PANTALLA_FASE9.pageSize;
    state.lastSyncTriggerAt = ESTADO_PANTALLA_FASE9.lastSyncTriggerAt;
    resetAddModalState(state);
    resetEditModalState(state);
    syncDraftsFromSharedSnapshot(state);

    if (state.store && typeof state.store.subscribeChanges === "function") {
      state.unsubscribeStore = state.store.subscribeChanges(function onStoreChange(event) {
        var type = String(event && event.type || "");
        refreshVisibleList(state);
        if (type.indexOf("remote") >= 0 || type.indexOf("replace") >= 0) {
          renderSyncStatus(state, "Actualizado");
        }
      });
    }

    bindViewer(state);
    bindListActions(state);
    wireEvents(state);
    if (!ensureSessionTokenOrRedirect(state, { redirect: true })) {
      return;
    }
    refreshVisibleList(state);
    initialProductsLoad(state, "init");
    scheduleEntryCloudRecovery(state);
  }

  var testApi = {
    buildEditorDraftState: buildEditorDraftState,
    buildFeedbackMessage: buildFeedbackMessage,
    buildRevisionPendingButtonState: buildRevisionPendingButtonState,
    buildRevisionUrl: buildRevisionUrl,
    countPendingRevisionDraftsFromStore: countPendingRevisionDraftsFromStore,
    countActiveLocalProducts: countActiveLocalProducts,
    initialProductsLoad: initialProductsLoad,
    buildLightPhotoRefs: buildLightPhotoRefs,
    buildLightProductVisuales: buildLightProductVisuales,
    loadProducts: loadProducts,
    listPendingRevisionDraftsFromStore: listPendingRevisionDraftsFromStore,
    manualSync: manualSync,
    recoverCloudProductsWhenEmpty: recoverCloudProductsWhenEmpty,
    renderCard: renderCard,
    syncStoreFromRemote: syncStoreFromRemote
  };

  if (typeof document === "undefined") {
    if (typeof module !== "undefined" && module.exports) {
      module.exports = testApi;
    }
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
    return;
  }
  init();
})(typeof globalThis !== "undefined" ? globalThis : this);





