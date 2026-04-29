(function initAltaFotoUi(globalScope) {
  "use strict";

  var DEFAULT_BACKEND_URL = "https://europe-west1-project-a6f6b968-a591-4b1f-823.cloudfunctions.net/api";
  var TOKEN_STORAGE_KEY = "fase5_visible_session_token";
  var BACKEND_STORAGE_KEY = "fase5_visible_backend_url";
  var VISIBLE_ANALYSIS_TIMEOUT_MS = 25000;
  var MAX_AUTORETRY_ATTEMPTS = 1;
  var IDEMPOTENCY_TTL_MS = 120000;
  var VISUAL_SETTINGS_STORAGE_KEY = "appv2_visual_settings_v1";
  var DEFAULT_VISUAL_SETTINGS = {
    profileKey: "EQUILIBRADO_WEBP",
    qualityPct: 80,
    resolutionMaxPx: 800
  };
  var THUMBNAIL_MAX_SIDE_PX = 200;
  var THUMBNAIL_QUALITY_PCT = 40;
  var THUMBNAIL_MIME = "image/webp";
  var OFFICIAL_ALLERGENS_FALLBACK = [
    "altramuces",
    "apio",
    "cacahuetes",
    "crustaceos",
    "frutos_secos",
    "gluten",
    "huevos",
    "lacteos",
    "moluscos",
    "mostaza",
    "pescado",
    "sesamo",
    "soja",
    "sulfitos"
  ];
  var ANALYSIS_LOCK_NAME = "fase5_alta_foto_single_flight";
  var ANALYSIS_LOCK_STORAGE_KEY = "fase5_visible_analysis_lock_v1";
  var ANALYSIS_OPERATION_MEMO_KEY = "fase5_visible_analysis_operation_memo_v1";
  var REVIEW_ROUTE_LEDGER_KEY = "fase5_visible_review_route_ledger_v1";
  var ANALYSIS_LOCK_TTL_MS = VISIBLE_ANALYSIS_TIMEOUT_MS + 5000;
  var FASE11_DIAGNOSTICO_STORAGE_KEY = "fase11_diagnostico_actual_v1";

  function byId(id) {
    return document.getElementById(id);
  }

  function safeReadStorage(key) {
    try {
      return globalScope.localStorage ? String(globalScope.localStorage.getItem(key) || "") : "";
    } catch (errRead) {
      return "";
    }
  }

  function safeWriteStorage(key, value) {
    try {
      if (!globalScope.localStorage) return;
      if (value == null || value === "") {
        globalScope.localStorage.removeItem(key);
        return;
      }
      globalScope.localStorage.setItem(key, String(value));
    } catch (errWrite) {
      // No-op.
    }
  }

  function safeReadJsonStorage(key) {
    var raw = safeReadStorage(key);
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (errParse) {
      return null;
    }
  }

  function safeWriteJsonStorage(key, value) {
    try {
      if (!globalScope.localStorage) return;
      globalScope.localStorage.setItem(key, JSON.stringify(value || {}));
    } catch (errWriteJson) {
      // No-op.
    }
  }

  function getAnalysisRuntime() {
    return globalScope.AnalysisExclusiveRuntime || null;
  }

  function traceAnalysisEvent(name, data, meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.trace !== "function") return;
    runtime.trace(name, data || null, Object.assign({ source: "alta_foto" }, meta || {}));
  }

  function requestAnalysisExclusive(meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.requestExclusive !== "function") return;
    runtime.requestExclusive(Object.assign({ source: "alta_foto" }, meta || {}));
  }

  function markAnalysisStarted(meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.markAnalysisStarted !== "function") return;
    runtime.markAnalysisStarted(Object.assign({ source: "alta_foto" }, meta || {}));
  }

  function markResultVisible(data, meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.markResultVisible !== "function") return;
    runtime.markResultVisible(data || null, Object.assign({ source: "alta_foto" }, meta || {}));
  }

  function attachAnalysisMeta(meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.attachMeta !== "function") return;
    runtime.attachMeta(Object.assign({ source: "alta_foto" }, meta || {}));
  }

  function resumeAnalysisExclusive(meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.resumeProgressively !== "function") return;
    runtime.resumeProgressively(Object.assign({ source: "alta_foto" }, meta || {}));
  }

  function cancelAnalysisExclusive(meta) {
    var runtime = getAnalysisRuntime();
    if (!runtime || typeof runtime.cancelExclusive !== "function") return;
    runtime.cancelExclusive(Object.assign({ source: "alta_foto" }, meta || {}));
  }

  function writeFase11DiagnosticoFallback(snapshot) {
    try {
      if (!globalScope.localStorage) return;
      globalScope.localStorage.setItem(FASE11_DIAGNOSTICO_STORAGE_KEY, JSON.stringify(snapshot || {}));
    } catch (errDiagWrite) {
      // No-op.
    }
  }

  function readFase11DiagnosticoFallback() {
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

  function getFase11Store() {
    if (globalScope.Fase11DiagnosticoStore && typeof globalScope.Fase11DiagnosticoStore.getDefaultStore === "function") {
      return globalScope.Fase11DiagnosticoStore.getDefaultStore();
    }
    return null;
  }

  function makeFase11Event(level, moduleName, action, message, durationMs) {
    var now = Date.now();
    return {
      eventId: makeClientId("evt"),
      createdAt: new Date(now).toISOString(),
      createdAtMs: now,
      level: String(level || "INFO").toUpperCase(),
      module: String(moduleName || "Alta foto"),
      action: String(action || "analisis"),
      message: String(message || "Sin detalle."),
      durationMs: Number.isFinite(Number(durationMs)) ? Number(durationMs) : null
    };
  }

  function openFase11AnalysisCase(caseId, fotoRefs) {
    var store = getFase11Store();
    if (store && typeof store.openCase === "function") {
      store.openCase({
        caseId: caseId,
        module: "Alta foto",
        action: "analisis por foto",
        message: "Analisis por foto iniciado."
      });
      return;
    }
    writeFase11DiagnosticoFallback({
      caseId: caseId,
      status: "open",
      openedAt: new Date().toISOString(),
      closedAt: null,
      events: [
        makeFase11Event("INFO", "Alta foto", "analisis por foto", "Analisis por foto iniciado con " + (fotoRefs || []).length + " foto(s).", null)
      ]
    });
  }

  function closeFase11AnalysisCase(caseId, ok, message, durationMs) {
    var store = getFase11Store();
    if (store && typeof store.closeCase === "function") {
      store.closeCase({
        level: ok ? "INFO" : "ERROR",
        module: "Alta foto",
        action: "resultado analisis",
        message: message,
        durationMs: durationMs
      });
      return;
    }
    var current = readFase11DiagnosticoFallback() || {};
    var events = Array.isArray(current.events) ? current.events.slice(-39) : [];
    var event = makeFase11Event(ok ? "INFO" : "ERROR", "Alta foto", "resultado analisis", message, durationMs);
    events.push(event);
    writeFase11DiagnosticoFallback({
      caseId: caseId,
      status: "closed",
      openedAt: current.openedAt || new Date(Date.now() - Math.max(0, Number(durationMs || 0))).toISOString(),
      closedAt: new Date().toISOString(),
      events: events
    });
  }

  function makeClientId(prefix) {
    var safePrefix = String(prefix || "id").trim() || "id";
    return safePrefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function toPosInt(value, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    n = Math.floor(n);
    return n > 0 ? n : fallback;
  }

  function profileToMime(profileKey) {
    var safe = String(profileKey || "").trim().toUpperCase();
    return safe === "ALTA_CALIDAD_JPEG" ? "image/jpeg" : "image/webp";
  }

  function readVisualSettingsFromStorage() {
    var fallback = {
      profileKey: DEFAULT_VISUAL_SETTINGS.profileKey,
      qualityPct: DEFAULT_VISUAL_SETTINGS.qualityPct,
      resolutionMaxPx: DEFAULT_VISUAL_SETTINGS.resolutionMaxPx
    };
    var raw = safeReadStorage(VISUAL_SETTINGS_STORAGE_KEY);
    if (!raw) return fallback;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return fallback;
      return {
        profileKey: String(parsed.profileKey || fallback.profileKey).trim() || fallback.profileKey,
        qualityPct: toPosInt(parsed.qualityPct, fallback.qualityPct),
        resolutionMaxPx: toPosInt(parsed.resolutionMaxPx, fallback.resolutionMaxPx)
      };
    } catch (errSettings) {
      return fallback;
    }
  }

  function scaleDimensions(width, height, maxSidePx) {
    var safeW = Math.max(1, toPosInt(width, 1));
    var safeH = Math.max(1, toPosInt(height, 1));
    var safeMax = Math.max(1, toPosInt(maxSidePx, 800));
    var currentMax = Math.max(safeW, safeH);
    if (currentMax <= safeMax) {
      return { width: safeW, height: safeH };
    }
    var ratio = safeMax / currentMax;
    return {
      width: Math.max(1, Math.round(safeW * ratio)),
      height: Math.max(1, Math.round(safeH * ratio))
    };
  }

  function toImageSrc(ref) {
    var raw = String(ref || "").trim();
    if (!raw) return "";
    if (/^(data:|https?:|blob:|file:)/i.test(raw)) return raw;
    if (/^[a-zA-Z]:\\/.test(raw)) {
      return "file:///" + raw.replace(/\\/g, "/");
    }
    if (raw.charAt(0) === "/") return "file://" + raw;
    return raw;
  }

  function hasDraftVisualSupport() {
    return !!(
      globalScope &&
      globalScope.document &&
      typeof globalScope.document.createElement === "function" &&
      typeof globalScope.Image === "function" &&
      typeof globalScope.FileReader === "function"
    );
  }

  function loadImageFromSrc(src) {
    return new Promise(function onLoad(resolve, reject) {
      var img = new globalScope.Image();
      img.onload = function done() { resolve(img); };
      img.onerror = function fail() { reject(new Error("No se pudo cargar la foto.")); };
      img.src = src;
    });
  }

  function canvasToBlob(canvas, mimeType, qualityPct) {
    return new Promise(function onBlob(resolve) {
      var q = Math.max(0.1, Math.min(1, toPosInt(qualityPct, 80) / 100));
      if (canvas && typeof canvas.toBlob === "function") {
        canvas.toBlob(function done(blob) { resolve(blob || null); }, mimeType, q);
        return;
      }
      resolve(null);
    });
  }

  function blobToDataUrl(blob) {
    return new Promise(function toData(resolve, reject) {
      var reader = new globalScope.FileReader();
      reader.onload = function onLoad() { resolve(String(reader.result || "")); };
      reader.onerror = function onErr() { reject(new Error("No se pudo leer imagen comprimida.")); };
      reader.readAsDataURL(blob);
    });
  }

  async function encodeVariantFromImage(image, options) {
    var safe = options || {};
    var mimeType = String(safe.mimeType || "image/webp").trim().toLowerCase();
    var qualityPct = toPosInt(safe.qualityPct, 80);
    var maxSidePx = toPosInt(safe.maxSidePx, 800);
    var size = scaleDimensions(image.naturalWidth || image.width, image.naturalHeight || image.height, maxSidePx);
    var canvas = globalScope.document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    var ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible.");
    ctx.drawImage(image, 0, 0, size.width, size.height);

    var blob = await canvasToBlob(canvas, mimeType, qualityPct);
    if (blob) {
      var asData = await blobToDataUrl(blob);
      if (asData) return asData;
    }
    return canvas.toDataURL(mimeType, Math.max(0.1, Math.min(1, qualityPct / 100)));
  }

  async function buildDraftVisuales(fotoRefs) {
    var refs = Array.isArray(fotoRefs) ? fotoRefs.filter(Boolean).slice(0, 2) : [];
    if (!refs.length || !hasDraftVisualSupport()) return [];

    var settings = readVisualSettingsFromStorage();
    var output = [];
    for (var i = 0; i < refs.length; i += 1) {
      var ref = String(refs[i] || "").trim();
      var src = toImageSrc(ref);
      if (!ref || !src) continue;
      try {
        var image = await loadImageFromSrc(src);
        traceAnalysisEvent("thumb_start", {
          ref: ref
        }, { phase: "visuals" });
        var thumbSrc = await encodeVariantFromImage(image, {
          mimeType: THUMBNAIL_MIME,
          qualityPct: THUMBNAIL_QUALITY_PCT,
          maxSidePx: THUMBNAIL_MAX_SIDE_PX
        });
        traceAnalysisEvent("thumb_done", {
          ref: ref
        }, { phase: "visuals" });
        traceAnalysisEvent("viewer_image_start", {
          ref: ref
        }, { phase: "visuals" });
        var viewerSrc = await encodeVariantFromImage(image, {
          mimeType: profileToMime(settings.profileKey),
          qualityPct: settings.qualityPct,
          maxSidePx: settings.resolutionMaxPx
        });
        traceAnalysisEvent("viewer_image_done", {
          ref: ref
        }, { phase: "visuals" });
        output.push({
          ref: ref,
          thumbSrc: thumbSrc || src,
          viewerSrc: viewerSrc || src,
          profileKey: settings.profileKey,
          qualityPct: settings.qualityPct,
          resolutionMaxPx: settings.resolutionMaxPx,
          generatedAt: new Date().toISOString()
        });
      } catch (errPhoto) {
        output.push({
          ref: ref,
          thumbSrc: src,
          viewerSrc: src,
          profileKey: settings.profileKey,
          qualityPct: settings.qualityPct,
          resolutionMaxPx: settings.resolutionMaxPx,
          generatedAt: new Date().toISOString()
        });
      }
    }
    return output;
  }

  function buildOperationIds(input) {
    var safeInput = input || {};
    var batchId = String(safeInput.batchId || "").trim();
    var analysisId = String(safeInput.analysisId || "").trim();
    var traceId = String(safeInput.traceId || "").trim();
    return {
      batchId: batchId || makeClientId("B"),
      analysisId: analysisId || makeClientId("A"),
      traceId: traceId || makeClientId("T")
    };
  }

  function createTimeoutError(timeoutMs) {
    var err = new Error("Analisis visible supero el timeout local de " + String(timeoutMs) + " ms.");
    err.code = "ALTA_VISIBLE_TIMEOUT";
    err.timeoutMs = timeoutMs;
    return err;
  }

  function withTimeout(promise, timeoutMs) {
    return new Promise(function executor(resolve, reject) {
      var settled = false;
      var timerId = setTimeout(function onTimeout() {
        if (settled) return;
        settled = true;
        reject(createTimeoutError(timeoutMs));
      }, timeoutMs);

      Promise.resolve(promise).then(function onResolved(value) {
        if (settled) return;
        settled = true;
        clearTimeout(timerId);
        resolve(value);
      }).catch(function onRejected(err) {
        if (settled) return;
        settled = true;
        clearTimeout(timerId);
        reject(err);
      });
    });
  }

  function isTransientCode(code) {
    var safeCode = String(code || "").trim().toUpperCase();
    if (!safeCode) return false;
    return safeCode.indexOf("TIMEOUT") >= 0 ||
      safeCode.indexOf("NETWORK") >= 0 ||
      safeCode.indexOf("HTTP") >= 0 ||
      safeCode.indexOf("FETCH") >= 0;
  }

  function isTransientException(err) {
    if (!err) return false;
    if (isTransientCode(err.code)) return true;
    var message = String(err.message || err || "").toUpperCase();
    return message.indexOf("TIMEOUT") >= 0 ||
      message.indexOf("NETWORK") >= 0 ||
      message.indexOf("FETCH") >= 0 ||
      message.indexOf("FAILED TO FETCH") >= 0;
  }

  function isTransientFailureResponse(response) {
    var safeResponse = response || {};
    if (safeResponse.ok !== false) return false;
    var error = safeResponse.error || {};
    if (error.retryable === true) return true;
    return isTransientCode(error.code);
  }

  function buildRequestFingerprint(sessionToken, backendUrl, fotoRefs) {
    var refs = Array.isArray(fotoRefs) ? fotoRefs : [];
    var safeRefs = refs
      .map(function each(ref) { return String(ref || "").trim(); })
      .filter(Boolean)
      .slice(0, 2);
    return [
      String(sessionToken || "").trim(),
      String(backendUrl || "").trim(),
      safeRefs.join("||")
    ].join("::");
  }

  function readOperationMemoMap(nowMs) {
    var raw = safeReadJsonStorage(ANALYSIS_OPERATION_MEMO_KEY) || {};
    var out = Object.create(null);
    var keys = Object.keys(raw);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var entry = raw[key];
      if (!entry || typeof entry !== "object") continue;
      var expiresAt = Number(entry.expiresAt || 0);
      if (expiresAt > 0 && expiresAt <= nowMs) continue;
      out[key] = entry;
    }
    return out;
  }

  function writeOperationMemoMap(map) {
    safeWriteJsonStorage(ANALYSIS_OPERATION_MEMO_KEY, map || {});
  }

  function readReviewLedgerMap(nowMs) {
    var raw = safeReadJsonStorage(REVIEW_ROUTE_LEDGER_KEY) || {};
    var out = Object.create(null);
    var keys = Object.keys(raw);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var entry = raw[key];
      if (!entry || typeof entry !== "object") continue;
      var expiresAt = Number(entry.expiresAt || 0);
      if (expiresAt > 0 && expiresAt <= nowMs) continue;
      out[key] = entry;
    }
    return out;
  }

  function writeReviewLedgerMap(map) {
    safeWriteJsonStorage(REVIEW_ROUTE_LEDGER_KEY, map || {});
  }

  function resolveOperationIdsForRequest(sessionToken, backendUrl, fotoRefs, explicitIds) {
    var safeExplicit = explicitIds || {};
    if (safeExplicit.batchId || safeExplicit.analysisId || safeExplicit.traceId) {
      return buildOperationIds(safeExplicit);
    }
    var now = Date.now();
    var fingerprint = buildRequestFingerprint(sessionToken, backendUrl, fotoRefs);
    var memo = readOperationMemoMap(now);
    var cached = memo[fingerprint];
    if (
      cached &&
      cached.operationIds &&
      cached.status &&
      (cached.status === "pending" || cached.status === "timeout" || cached.status === "error_transient")
    ) {
      return buildOperationIds(cached.operationIds);
    }
    return buildOperationIds();
  }

  function markOperationMemo(sessionToken, backendUrl, fotoRefs, operationIds, status, extra) {
    var now = Date.now();
    var fingerprint = buildRequestFingerprint(sessionToken, backendUrl, fotoRefs);
    var memo = readOperationMemoMap(now);
    var safeExtra = extra && typeof extra === "object" ? extra : {};
    memo[fingerprint] = {
      operationIds: buildOperationIds(operationIds || {}),
      status: String(status || "pending"),
      lastErrorCode: safeExtra.lastErrorCode ? String(safeExtra.lastErrorCode) : null,
      updatedAt: now,
      expiresAt: now + IDEMPOTENCY_TTL_MS
    };
    writeOperationMemoMap(memo);
  }

  function clearOperationMemo(sessionToken, backendUrl, fotoRefs) {
    var now = Date.now();
    var fingerprint = buildRequestFingerprint(sessionToken, backendUrl, fotoRefs);
    var memo = readOperationMemoMap(now);
    if (memo[fingerprint]) {
      delete memo[fingerprint];
      writeOperationMemoMap(memo);
    }
  }

  function hasWebLocks() {
    return !!(
      globalScope &&
      globalScope.navigator &&
      globalScope.navigator.locks &&
      typeof globalScope.navigator.locks.request === "function"
    );
  }

  function claimStorageLock(runId) {
    var now = Date.now();
    var lock = safeReadJsonStorage(ANALYSIS_LOCK_STORAGE_KEY);
    if (lock && Number(lock.expiresAt || 0) > now && String(lock.runId || "").trim()) {
      return false;
    }
    var candidate = {
      runId: String(runId || "").trim() || makeClientId("LOCK"),
      claimedAt: now,
      expiresAt: now + ANALYSIS_LOCK_TTL_MS
    };
    safeWriteJsonStorage(ANALYSIS_LOCK_STORAGE_KEY, candidate);
    var confirm = safeReadJsonStorage(ANALYSIS_LOCK_STORAGE_KEY) || {};
    return String(confirm.runId || "") === candidate.runId;
  }

  function releaseStorageLock(runId) {
    var current = safeReadJsonStorage(ANALYSIS_LOCK_STORAGE_KEY);
    if (!current) return;
    if (String(current.runId || "") !== String(runId || "")) return;
    safeWriteStorage(ANALYSIS_LOCK_STORAGE_KEY, "");
  }

  async function runWithGlobalAnalyzeLock(runId, fn) {
    if (hasWebLocks()) {
      return globalScope.navigator.locks.request(ANALYSIS_LOCK_NAME, { mode: "exclusive", ifAvailable: true }, async function withLock(lock) {
        if (!lock) {
          return { ok: false, busy: true, lockSource: "web_locks" };
        }
        return { ok: true, value: await fn() };
      });
    }
    if (!claimStorageLock(runId)) {
      return { ok: false, busy: true, lockSource: "storage_lock" };
    }
    try {
      return { ok: true, value: await fn() };
    } finally {
      releaseStorageLock(runId);
    }
  }

  function resolveVisibleRuntime(explicitRuntime) {
    if (explicitRuntime) return explicitRuntime;
    if (
      globalScope &&
      globalScope.Fase5VisibleRuntime &&
      typeof globalScope.Fase5VisibleRuntime.getDefaultRuntime === "function"
    ) {
      return globalScope.Fase5VisibleRuntime.getDefaultRuntime();
    }
    return null;
  }

  function readSessionToken(runtime) {
    var visibleRuntime = resolveVisibleRuntime(runtime);
    if (visibleRuntime && typeof visibleRuntime.getSessionToken === "function") {
      return visibleRuntime.getSessionToken();
    }
    return safeReadStorage(TOKEN_STORAGE_KEY);
  }

  function writeSessionToken(runtime, value) {
    var visibleRuntime = resolveVisibleRuntime(runtime);
    if (visibleRuntime && typeof visibleRuntime.setSessionToken === "function") {
      return visibleRuntime.setSessionToken(value);
    }
    safeWriteStorage(TOKEN_STORAGE_KEY, value);
    return String(value || "").trim();
  }

  function readBackendUrl(runtime) {
    var visibleRuntime = resolveVisibleRuntime(runtime);
    if (visibleRuntime && typeof visibleRuntime.getBackendUrl === "function") {
      return visibleRuntime.getBackendUrl();
    }
    return safeReadStorage(BACKEND_STORAGE_KEY) || DEFAULT_BACKEND_URL;
  }

  function writeBackendUrl(runtime, value) {
    var visibleRuntime = resolveVisibleRuntime(runtime);
    if (visibleRuntime && typeof visibleRuntime.setBackendUrl === "function") {
      return visibleRuntime.setBackendUrl(value);
    }
    var safeValue = String(value || "").trim() || DEFAULT_BACKEND_URL;
    safeWriteStorage(BACKEND_STORAGE_KEY, safeValue);
    return safeValue;
  }

  function renderDrafts(store, target) {
    var drafts = store.listPendingRevisionDrafts();
    if (!drafts.length) {
      target.innerHTML = "<p class=\"empty\">No hay borradores pendientes.</p>";
      return;
    }

    var html = drafts.map(function toRow(draft) {
      var alergenos = (draft.propuesta.alergenos || []).length
        ? draft.propuesta.alergenos.join(", ")
        : "(sin propuesta)";
      var resultadoBoxer = draft.resultadoBoxer || {};
      return (
        "<tr>" +
          "<td>" + draft.draftId + "</td>" +
          "<td>" + draft.propuesta.nombre + "</td>" +
          "<td>" + alergenos + "</td>" +
          "<td>" + draft.estado + "</td>" +
          "<td>" + (resultadoBoxer.analysisId || "-") + "</td>" +
        "</tr>"
      );
    }).join("");

    target.innerHTML =
      "<table>" +
        "<thead><tr><th>DraftId</th><th>Nombre propuesto</th><th>Alergenos</th><th>Estado</th><th>AnalysisId</th></tr></thead>" +
        "<tbody>" + html + "</tbody>" +
      "</table>";
  }

  function normalizeToken(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function getOfficialAllergenNames() {
    var catalog = globalScope && globalScope.AppV2AlergenosOficiales;
    if (catalog && Array.isArray(catalog.NOMBRES_OFICIALES) && catalog.NOMBRES_OFICIALES.length === 14) {
      return catalog.NOMBRES_OFICIALES.slice();
    }
    return OFFICIAL_ALLERGENS_FALLBACK.slice();
  }

  function toAllergenNameList(input) {
    var catalog = globalScope && globalScope.AppV2AlergenosOficiales;
    if (catalog && typeof catalog.normalizeAllergenList === "function") {
      return catalog.normalizeAllergenList(input);
    }
    var safeInput = Array.isArray(input) ? input : [];
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < safeInput.length; i += 1) {
      var token = normalizeToken(safeInput[i]);
      if (!token || seen[token]) continue;
      seen[token] = true;
      out.push(token);
    }
    return out;
  }

  function toAllergenBooleanArray(input) {
    var official = getOfficialAllergenNames();
    var marked = toAllergenNameList(input);
    var markMap = Object.create(null);
    for (var i = 0; i < marked.length; i += 1) {
      markMap[normalizeToken(marked[i])] = true;
    }
    var out = [];
    for (var j = 0; j < official.length; j += 1) {
      out.push(!!markMap[normalizeToken(official[j])]);
    }
    return out;
  }

  function inferPassportFromDecisionFlow(flow) {
    var safeFlow = String(flow || "").trim().toLowerCase();
    if (safeFlow === "guardar") return "VERDE";
    if (safeFlow === "revision") return "NARANJA";
    return "ROJO";
  }

  function buildPassportShortMessage(pasaporte, finalData) {
    var safeData = finalData || {};
    var safeDecision = safeData.decision || {};
    var explicit = String(safeDecision.mensajePasaporteCorto || "").trim();
    if (explicit) return explicit;

    var upperPassport = String(pasaporte || "").trim().toUpperCase();
    if (upperPassport === "VERDE") return "";

    var revision = safeData.revision || {};
    var motivos = []
      .concat(Array.isArray(revision.conflictos) ? revision.conflictos : [])
      .concat(Array.isArray(revision.dudas) ? revision.dudas : []);
    var flat = normalizeToken(motivos.join(" "));
    if (flat.indexOf("nombre") >= 0) return "Revisa nombre";
    if (flat.indexOf("peso") >= 0 || flat.indexOf("formato") >= 0) return "Revisa formato";
    if (flat.indexOf("alerg") >= 0 || flat.indexOf("traza") >= 0) return "Revisa alergenos";
    return "Revision requerida";
  }

  function buildCaseRevisionV1(routePayload, fotoRefs, options) {
    var safePayload = routePayload || {};
    var safeOptions = options || {};
    var finalData = safePayload.datos || {};
    var decision = finalData.decision || {};
    var proposal = finalData.propuestaFinal || {};
    var modeOrigin = String(safeOptions.modeOrigin || "normal").trim().toLowerCase() === "lote" ? "lote" : "normal";
    var decisionFlow = String(decision.decisionFlujo || "").trim() || "revision";
    var pasaporte = String(decision.pasaporte || inferPassportFromDecisionFlow(decisionFlow)).trim().toUpperCase();
    var now = Date.now();
    var photoRefs = Array.isArray(fotoRefs) ? fotoRefs.slice(0, 2) : [];
    var alergenFlags = toAllergenBooleanArray(proposal.alergenos || []);

    return {
      analysisId: String(safePayload.analysisId || finalData.analysisId || "").trim() || null,
      traceId: String(safePayload.traceId || finalData.traceId || "").trim() || null,
      batchId: String(safePayload.batchId || "").trim() || null,
      modoOrigen: modeOrigin,
      pasaporte: pasaporte || "ROJO",
      mensajePasaporteCorto: buildPassportShortMessage(pasaporte, finalData),
      nombre: String(proposal.nombre || "").trim(),
      formato: String(proposal.formato || "").trim(),
      alergenos: alergenFlags,
      trazas: toAllergenNameList(proposal.trazas || []),
      photoRefs: photoRefs,
      estadoRevision: "pendiente",
      origen: "cerebro",
      timestampCreacion: now,
      timestampResolucion: null,
      decisionFlujo: decisionFlow
    };
  }

  function buildCerebroRequest(options) {
    var safeOptions = options || {};
    return {
      moduloOrigen: "Web_Operativa",
      moduloDestino: "Cerebro_Orquestador",
      accion: "solicitar_analisis_foto",
      sessionToken: String(safeOptions.sessionToken || "").trim(),
      meta: {
        versionContrato: "BOXER_PLUG_V1",
        analysisId: String(safeOptions.analysisId || "").trim() || null,
        traceId: String(safeOptions.traceId || "").trim() || null,
        batchId: String(safeOptions.batchId || "").trim() || null
      },
      datos: {
        imageRefs: Array.isArray(safeOptions.fotoRefs) ? safeOptions.fotoRefs.slice(0, 2) : [],
        sendMode: "base64",
        contextoAlta: String(safeOptions.contextoAlta || "normal").trim() || "normal",
        controlesUsuario: {
          agentEnabled: true,
          timeBudgetMs: 25000,
          sensitivityMode: null,
          expect: []
        }
      }
    };
  }

  function buildReviewDraftPayload(routePayload, fotoRefs, draftVisuales) {
    var safePayload = routePayload || {};
    var finalData = safePayload.datos || {};
    var propuesta = finalData.propuestaFinal || {};
    var caseRevision = buildCaseRevisionV1(safePayload, fotoRefs, {
      modeOrigin: safePayload.modeOrigin || "normal"
    });
    return {
      fotoRefs: Array.isArray(fotoRefs) ? fotoRefs.slice(0, 2) : [],
      visuales: Array.isArray(draftVisuales) ? draftVisuales.slice(0, 2) : [],
      nombrePropuesto: propuesta.nombre || "Producto por revisar",
      alergenosPropuestos: Array.isArray(propuesta.alergenos) ? propuesta.alergenos : [],
      resultadoBoxer: {
        casoRevision: caseRevision,
        analysisId: safePayload.analysisId || finalData.analysisId || null,
        traceId: safePayload.traceId || finalData.traceId || null,
        batchId: safePayload.batchId || null,
        propuestaFinal: propuesta,
        decision: finalData.decision || {},
        revision: finalData.revision || {},
        modulos: finalData.modulos || {},
        duplicados: finalData.duplicados || {}
      }
    };
  }

  function getFinalDataFromResponse(response) {
    return response && response.resultado && response.resultado.datos
      ? response.resultado.datos
      : null;
  }

  function buildRoutePayloadFromResponse(response, operationIds, modeOrigin) {
    var finalData = getFinalDataFromResponse(response);
    if (!finalData) return null;
    return {
      analysisId: finalData.analysisId || operationIds.analysisId || null,
      traceId: finalData.traceId || operationIds.traceId || null,
      batchId: operationIds.batchId || null,
      modeOrigin: modeOrigin || "normal",
      propuestaFinal: finalData.propuestaFinal || {},
      datos: finalData
    };
  }

  function classifyVisibleOutcome(response) {
    var safeResponse = response || {};
    var result = safeResponse.resultado || {};
    var finalData = result.datos || {};
    var decision = finalData.decision || {};
    var flow = String(decision.decisionFlujo || "").trim().toLowerCase();

    if (safeResponse.ok === true && flow === "guardar") {
      return "guardado";
    }
    if (safeResponse.ok === true && flow === "revision") {
      return "revision";
    }
    if (flow === "bloqueo") {
      return "bloqueado";
    }
    return "abortado";
  }

  function renderVisibleStatus(target, response) {
    var mode = classifyVisibleOutcome(response);
    var result = response && response.resultado ? response.resultado : {};
    var finalData = result.datos || {};
    var propuesta = finalData.propuestaFinal || {};
    var revision = finalData.revision || {};
    var hasDraft = !!String(revision.draftIdGenerado || "").trim();
    var label = "";

    if (hasDraft) {
      label = "Caso listo para edicion final.";
    } else if (mode === "guardado") {
      label = "Guardado real en productos.";
    } else if (mode === "revision") {
      label = "Enviado a revision.";
    } else if (mode === "bloqueado") {
      label = "Bloqueado para no guardar.";
    } else {
      label = "Analisis abortado o incompleto.";
    }

    target.textContent =
      label +
      (propuesta.nombre ? " Nombre: " + propuesta.nombre + "." : "") +
      (result.traceId ? " TraceId: " + result.traceId + "." : "");
  }

  function resolveStore(globalScope) {
    var sharedApi = globalScope.Fase3SharedBrowserStore;
    if (sharedApi && typeof sharedApi.createSharedProductStore === "function") {
      return sharedApi.createSharedProductStore();
    }
    return globalScope.Fase3DataStoreLocal.createMemoryProductStore();
  }

  function createReviewDestination(store, fotoRefs, options) {
    var safeOptions = options || {};
    var modeOrigin = String(safeOptions.modeOrigin || "normal").trim().toLowerCase() === "lote" ? "lote" : "normal";
    var routedByKey = Object.create(null);

    function cleanup(nowMs) {
      var keys = Object.keys(routedByKey);
      for (var i = 0; i < keys.length; i += 1) {
        var key = keys[i];
        var entry = routedByKey[key];
        if (!entry || Number(entry.expiresAt || 0) <= nowMs) {
          delete routedByKey[key];
        }
      }
    }

    return function openRevision(payload) {
      var now = Date.now();
      cleanup(now);
      var persistedLedger = readReviewLedgerMap(now);
      writeReviewLedgerMap(persistedLedger);
      var idempotencyKey = String(payload && payload.idempotencyKey || "").trim();
      if (idempotencyKey && routedByKey[idempotencyKey] && routedByKey[idempotencyKey].draftId) {
        return {
          ok: true,
          routed: true,
          deduped: true,
          draftId: routedByKey[idempotencyKey].draftId
        };
      }
      if (idempotencyKey && persistedLedger[idempotencyKey] && persistedLedger[idempotencyKey].draftId) {
        var ledgerEntry = persistedLedger[idempotencyKey];
        routedByKey[idempotencyKey] = {
          draftId: ledgerEntry.draftId,
          expiresAt: Number(ledgerEntry.expiresAt || (now + IDEMPOTENCY_TTL_MS))
        };
        return {
          ok: true,
          routed: true,
          deduped: true,
          draftId: ledgerEntry.draftId
        };
      }

      var routePayload = Object.assign({}, payload || {}, {
        modeOrigin: modeOrigin
      });
      var creation = store.createRevisionDraft(buildReviewDraftPayload(routePayload, fotoRefs, routePayload.draftVisuales));
      if (creation && creation.ok === true && payload && payload.datos && payload.datos.revision) {
        payload.datos.revision.draftIdGenerado = creation.draft.draftId;
        payload.datos.revision.estadoRevision = "pendiente";
      }
      if (creation && creation.ok === true) {
        if (idempotencyKey) {
          routedByKey[idempotencyKey] = {
            draftId: creation.draft.draftId,
            expiresAt: now + IDEMPOTENCY_TTL_MS
          };
          persistedLedger[idempotencyKey] = {
            draftId: creation.draft.draftId,
            expiresAt: now + IDEMPOTENCY_TTL_MS
          };
          writeReviewLedgerMap(persistedLedger);
        }
        return {
          ok: true,
          routed: true,
          draftId: creation.draft.draftId
        };
      }
      return {
        ok: false,
        errorCode: creation && creation.errorCode ? creation.errorCode : "REVISION_DRAFT_CREATION_FAILED",
        message: creation && creation.message ? creation.message : "No se pudo crear el borrador de revision."
      };
    };
  }

  function computeReviewPolicy(options) {
    var requested = String(options && options.reviewPolicy || "").trim().toLowerCase();
    if (requested === "always" || requested === "non_guardar" || requested === "disabled") return requested;
    var mode = String(options && options.contextoAlta || "normal").trim().toLowerCase();
    return mode === "lote" ? "non_guardar" : "always";
  }

  async function ensureReviewDraftByPolicy(response, params) {
    var safeParams = params || {};
    var policy = safeParams.reviewPolicy || "disabled";
    if (policy === "disabled") return response;
    var finalData = getFinalDataFromResponse(response);
    if (!finalData) return response;

    var revisionData = finalData.revision || {};
    var hasDraft = !!String(revisionData.draftIdGenerado || "").trim();
    if (hasDraft) return response;

    var flow = String(finalData.decision && finalData.decision.decisionFlujo || "").trim().toLowerCase();
    if (policy === "non_guardar" && flow === "guardar") return response;

    var destination = safeParams.reviewDestination;
    if (typeof destination !== "function") return response;
    var routePayload = buildRoutePayloadFromResponse(response, safeParams.operationIds || {}, safeParams.modeOrigin || "normal");
    if (!routePayload) return response;
    routePayload.draftVisuales = [];
    var idempotencyKey = [
      flow || "revision",
      routePayload.analysisId || "sin_analysis",
      routePayload.traceId || "sin_trace",
      routePayload.batchId || "sin_batch",
      routePayload.modeOrigin || "normal"
    ].join("|");
    routePayload.idempotencyKey = idempotencyKey;
    traceAnalysisEvent("review_draft_start", {
      policy: policy,
      decisionFlujo: flow || null
    }, {
      analysisId: routePayload.analysisId || null,
      traceId: routePayload.traceId || null,
      phase: "review"
    });
    await Promise.resolve(destination(routePayload));
    traceAnalysisEvent("review_draft_done", {
      policy: policy,
      decisionFlujo: flow || null
    }, {
      analysisId: routePayload.analysisId || null,
      traceId: routePayload.traceId || null,
      phase: "review"
    });
    return response;
  }

  function createBoxer1Handler(globalScope, backendUrl) {
    return async function boxer1Handler(request) {
      if (typeof globalScope.B1_analizar_desacoplado !== "function") {
        throw new Error("Boxer 1 no esta cargado en la pantalla visible.");
      }
      return globalScope.B1_analizar_desacoplado(request, {
        urlTrastienda: backendUrl || DEFAULT_BACKEND_URL
      }, {});
    };
  }

  function createBoxer1Closer(globalScope) {
    return function boxer1Closer(summary, subrespuesta) {
      if (typeof globalScope.B1_cerrarConSubrespuestaIA !== "function") {
        throw new Error("Falta el cierre IA de Boxer 1.");
      }
      return globalScope.B1_cerrarConSubrespuestaIA(summary.resultadoLocal || {}, subrespuesta);
    };
  }

  async function ejecutarAnalisisVisible(options, deps) {
    var safeOptions = options || {};
    var safeDeps = deps || {};
    var modeOrigin = String(safeOptions.contextoAlta || "normal").trim().toLowerCase() === "lote" ? "lote" : "normal";
    var reviewPolicy = computeReviewPolicy({
      reviewPolicy: safeOptions.reviewPolicy,
      contextoAlta: modeOrigin
    });
    var fotoRefs = Array.isArray(safeOptions.fotoRefs) ? safeOptions.fotoRefs.filter(Boolean).slice(0, 2) : [];
    var sessionToken = String(safeOptions.sessionToken || "").trim();
    var backendUrl = String(safeOptions.backendUrl || DEFAULT_BACKEND_URL).trim() || DEFAULT_BACKEND_URL;
    var timeoutMs = Number.isFinite(Number(safeOptions.timeoutMs))
      ? Math.max(1, Math.floor(Number(safeOptions.timeoutMs)))
      : VISIBLE_ANALYSIS_TIMEOUT_MS;
    var maxAutoRetryAttempts = Number.isFinite(Number(safeOptions.maxAutoRetryAttempts))
      ? Math.max(0, Math.min(MAX_AUTORETRY_ATTEMPTS, Math.floor(Number(safeOptions.maxAutoRetryAttempts))))
      : MAX_AUTORETRY_ATTEMPTS;
    var operationIds = resolveOperationIdsForRequest(
      sessionToken,
      backendUrl,
      fotoRefs,
      {
      batchId: safeOptions.batchId,
      analysisId: safeOptions.analysisId,
      traceId: safeOptions.traceId
      }
    );
    var cerebro = safeDeps.cerebro || (globalScope && globalScope.CerebroOrquestador);
    var store = safeDeps.store;
    var visibleRuntime = resolveVisibleRuntime(safeDeps.visibleRuntime);

    if (!fotoRefs.length) {
      throw new Error("Falta al menos una foto.");
    }
    if (!sessionToken) {
      throw new Error("Falta el token de sesion.");
    }
    if (!cerebro || typeof cerebro.procesarAccionContrato !== "function") {
      throw new Error("Cerebro no esta cargado en la pantalla.");
    }
    if (!store || typeof store.createRevisionDraft !== "function") {
      throw new Error("El store compartido no esta listo.");
    }

    globalScope.CEREBRO_BROKER_IA_URL = backendUrl;
    if (visibleRuntime && typeof visibleRuntime.noteActivity === "function") {
      visibleRuntime.noteActivity("alta_foto_ejecutar");
    }
    markOperationMemo(sessionToken, backendUrl, fotoRefs, operationIds, "pending", null);
    attachAnalysisMeta({
      analysisId: operationIds.analysisId,
      traceId: operationIds.traceId,
      batchId: operationIds.batchId,
      phase: "analysis_prepare"
    });
    traceAnalysisEvent("analysis_real_started", {
      totalFotos: fotoRefs.length
    }, {
      analysisId: operationIds.analysisId,
      traceId: operationIds.traceId,
      batchId: operationIds.batchId,
      phase: "analysis"
    });
    markAnalysisStarted({
      analysisId: operationIds.analysisId,
      traceId: operationIds.traceId,
      batchId: operationIds.batchId,
      phase: "analysis"
    });

    var request = buildCerebroRequest({
      fotoRefs: fotoRefs,
      sessionToken: sessionToken,
      batchId: operationIds.batchId,
      analysisId: operationIds.analysisId,
      traceId: operationIds.traceId,
      contextoAlta: modeOrigin
    });
    var reviewDestination = safeDeps.openRevisionDestination || createReviewDestination(store, fotoRefs, {
      modeOrigin: modeOrigin
    });
    var customDestinations = {
      abrirRevisionProducto: reviewDestination
    };
    if (reviewPolicy === "always") {
      customDestinations.guardarResultadoAnalizado = reviewDestination;
    } else if (typeof safeDeps.saveDestination === "function") {
      customDestinations.guardarResultadoAnalizado = safeDeps.saveDestination;
    }
    var executionDeps = {
      handlers: {
        Boxer1_Core: safeDeps.boxer1Handler || createBoxer1Handler(globalScope, backendUrl)
      },
      boxerClosers: {
        Boxer1_Core: safeDeps.boxer1Closer || createBoxer1Closer(globalScope)
      },
      destinations: customDestinations
    };

    var attempt = 0;
    while (attempt <= maxAutoRetryAttempts) {
      try {
        var response = await withTimeout(
          cerebro.procesarAccionContrato(request, executionDeps),
          timeoutMs
        );
        var transientResponse = response && response.ok === false && isTransientFailureResponse(response);
        if (transientResponse && attempt < maxAutoRetryAttempts) {
          markOperationMemo(sessionToken, backendUrl, fotoRefs, operationIds, "error_transient", {
            lastErrorCode: response && response.error ? response.error.code : null
          });
          attempt += 1;
          continue;
        }
        var finalResponse = await ensureReviewDraftByPolicy(response, {
          reviewPolicy: reviewPolicy,
          reviewDestination: reviewDestination,
          operationIds: operationIds,
          modeOrigin: modeOrigin,
          fotoRefs: fotoRefs
        });
        var finalData = getFinalDataFromResponse(finalResponse);
        attachAnalysisMeta({
          analysisId: finalData && finalData.analysisId ? finalData.analysisId : operationIds.analysisId,
          traceId: finalData && finalData.traceId ? finalData.traceId : operationIds.traceId,
          batchId: operationIds.batchId,
          phase: "analysis_response"
        });
        traceAnalysisEvent("ui_result_received", {
          ok: !!(finalResponse && finalResponse.ok),
          passport: finalResponse && finalResponse.resultado ? finalResponse.resultado.estadoPasaporteModulo : null,
          elapsedMs: finalResponse && finalResponse.resultado ? finalResponse.resultado.elapsedMs : null
        }, {
          analysisId: finalData && finalData.analysisId ? finalData.analysisId : operationIds.analysisId,
          traceId: finalData && finalData.traceId ? finalData.traceId : operationIds.traceId,
          batchId: operationIds.batchId,
          phase: "analysis_response"
        });
        if (finalResponse && finalResponse.ok === true) {
          clearOperationMemo(sessionToken, backendUrl, fotoRefs);
        } else {
          markOperationMemo(sessionToken, backendUrl, fotoRefs, operationIds, transientResponse ? "error_transient" : "error_final", {
            lastErrorCode: finalResponse && finalResponse.error ? finalResponse.error.code : null
          });
        }
        return finalResponse;
      } catch (err) {
        var isTimeout = err && err.code === "ALTA_VISIBLE_TIMEOUT";
        var transientException = isTransientException(err);
        if (attempt < maxAutoRetryAttempts && transientException) {
          markOperationMemo(sessionToken, backendUrl, fotoRefs, operationIds, "error_transient", {
            lastErrorCode: err && err.code ? err.code : null
          });
          attempt += 1;
          continue;
        }
        markOperationMemo(sessionToken, backendUrl, fotoRefs, operationIds, isTimeout ? "timeout" : (transientException ? "error_transient" : "error_final"), {
          lastErrorCode: err && err.code ? err.code : null
        });
        throw err;
      }
    }

    throw new Error("No se pudo completar el analisis visible.");
  }

  function init() {
    var storeApi = globalScope.Fase3DataStoreLocal;
    if (!storeApi || !globalScope.CerebroOrquestador) return;

    var store = resolveStore(globalScope);
    var form = byId("alta-foto-form");
    var out = byId("salida-json");
    var draftList = byId("drafts-list");
    var fotoRef1 = byId("foto-ref-1");
    var fotoRef2 = byId("foto-ref-2");
    var tokenInput = byId("session-token");
    var backendUrlInput = byId("backend-url");
    var statusBox = byId("estado-operativo");
    if (!form || !out || !draftList || !fotoRef1 || !fotoRef2 || !tokenInput || !backendUrlInput || !statusBox) {
      return;
    }
    var visibleRuntime = resolveVisibleRuntime();
    var analyzeButton = form.querySelector("button[type='submit']");
    var analyzeButtonLabel = analyzeButton ? analyzeButton.textContent : "Analizar";
    var runState = {
      inFlight: false,
      activeRunId: null
    };

    function setAnalyzeUiBusy(isBusy) {
      if (!analyzeButton) return;
      analyzeButton.disabled = !!isBusy;
      analyzeButton.textContent = isBusy ? "Analizando..." : analyzeButtonLabel;
    }

    tokenInput.value = readSessionToken(visibleRuntime);
    backendUrlInput.value = readBackendUrl(visibleRuntime);

    renderDrafts(store, draftList);

    function requestExclusiveFromStandalone(slotName, value) {
      var ref = String(value || "").trim();
      if (!ref) return;
      requestAnalysisExclusive({
        reason: "photo_selected",
        phase: "photo_input",
        taskName: String(slotName || "foto")
      });
      traceAnalysisEvent("photo_input_started", {
        slot: String(slotName || "foto"),
        refPreview: ref.slice(0, 96)
      }, { phase: "photo_input" });
    }

    function clearExclusiveIfNoRefs() {
      if (String(fotoRef1.value || "").trim()) return;
      if (String(fotoRef2.value || "").trim()) return;
      cancelAnalysisExclusive({ reason: "photo_input_cleared" });
    }

    fotoRef1.addEventListener("change", function onFoto1Changed() {
      requestExclusiveFromStandalone("foto_1", fotoRef1.value);
      clearExclusiveIfNoRefs();
    });

    fotoRef2.addEventListener("change", function onFoto2Changed() {
      requestExclusiveFromStandalone("foto_2", fotoRef2.value);
      clearExclusiveIfNoRefs();
    });

    form.addEventListener("submit", async function onSubmit(ev) {
      ev.preventDefault();
      if (runState.inFlight) {
        statusBox.textContent = "Hay un analisis en curso. Espera a que termine.";
        return;
      }

      var fotoRefs = [fotoRef1.value, fotoRef2.value].filter(Boolean);
      var sessionToken = tokenInput.value;
      var backendUrl = backendUrlInput.value;
      var runId = makeClientId("RUN");
      var fase11CaseId = "alta_foto_" + runId;
      var fase11StartedAt = Date.now();
      writeSessionToken(visibleRuntime, sessionToken);
      backendUrl = writeBackendUrl(visibleRuntime, backendUrl);
      if (visibleRuntime && typeof visibleRuntime.noteActivity === "function") {
        visibleRuntime.noteActivity("alta_foto_submit");
      }
      if (visibleRuntime && typeof visibleRuntime.noteFirstPhotoIntent === "function") {
        visibleRuntime.noteFirstPhotoIntent();
      }
      traceAnalysisEvent("analysis_button_clicked", {
        from: "alta_foto"
      }, { phase: "submit" });
      traceAnalysisEvent("nonessential_pause_requested", {
        from: "alta_foto"
      }, { phase: "pause" });
      requestAnalysisExclusive({
        reason: "analyze_clicked",
        phase: "submit"
      });
      traceAnalysisEvent("nonessential_pause_done", {
        totalFotos: fotoRefs.length
      }, { phase: "pause" });

      var lockExecution = await runWithGlobalAnalyzeLock(runId, async function executeLocked() {
        runState.inFlight = true;
        runState.activeRunId = runId;
        setAnalyzeUiBusy(true);
        openFase11AnalysisCase(fase11CaseId, fotoRefs);
        try {
          var respuesta = await ejecutarAnalisisVisible({
            fotoRefs: fotoRefs,
            sessionToken: sessionToken,
            backendUrl: backendUrl,
            contextoAlta: "normal",
            reviewPolicy: "always",
            timeoutMs: VISIBLE_ANALYSIS_TIMEOUT_MS,
            maxAutoRetryAttempts: MAX_AUTORETRY_ATTEMPTS
          }, {
            store: store,
            visibleRuntime: visibleRuntime
          });
          if (runState.activeRunId !== runId) return;
          out.textContent = JSON.stringify(respuesta, null, 2);
          renderVisibleStatus(statusBox, respuesta);
          var finalData = getFinalDataFromResponse(respuesta) || {};
          markResultVisible({
            outcome: classifyVisibleOutcome(respuesta),
            passport: respuesta && respuesta.resultado ? respuesta.resultado.estadoPasaporteModulo : null
          }, {
            analysisId: finalData.analysisId || null,
            traceId: finalData.traceId || null,
            batchId: finalData.batchId || null,
            phase: "result"
          });
          resumeAnalysisExclusive({
            analysisId: finalData.analysisId || null,
            traceId: finalData.traceId || null,
            batchId: finalData.batchId || null,
            reason: "result_visible"
          });
          var generatedDraftId = finalData &&
            finalData.revision &&
            String(finalData.revision.draftIdGenerado || "").trim();
          if (visibleRuntime && typeof visibleRuntime.noteRealTraffic === "function") {
            visibleRuntime.noteRealTraffic("analisis_visible_ok", {
              outcome: classifyVisibleOutcome(respuesta)
            });
          }
          closeFase11AnalysisCase(
            fase11CaseId,
            true,
            "Analisis terminado: " + classifyVisibleOutcome(respuesta) + ".",
            Date.now() - fase11StartedAt
          );
          if (generatedDraftId) {
            statusBox.textContent = "Analisis listo. Abriendo pantalla final de edicion...";
            globalScope.setTimeout(function openRevisionScreen() {
              globalScope.location.href = "revision.html?draftId=" + encodeURIComponent(generatedDraftId);
            }, 120);
          }
        } catch (err) {
          if (runState.activeRunId !== runId) return;
          out.textContent = JSON.stringify({
            ok: false,
            error: {
              code: err && err.code ? err.code : "ALTA_VISIBLE_FAILED",
              message: err && err.message ? err.message : String(err)
            }
          }, null, 2);
          statusBox.textContent = "No se pudo completar el analisis.";
          closeFase11AnalysisCase(
            fase11CaseId,
            false,
            err && err.message ? err.message : "No se pudo completar el analisis.",
            Date.now() - fase11StartedAt
          );
          if (visibleRuntime && typeof visibleRuntime.noteActivity === "function") {
            visibleRuntime.noteActivity("analisis_visible_error");
          }
          cancelAnalysisExclusive({ reason: "analysis_failed" });
        } finally {
          if (runState.activeRunId === runId) {
            runState.inFlight = false;
            runState.activeRunId = null;
            setAnalyzeUiBusy(false);
            renderDrafts(store, draftList);
          }
        }
      });

      if (lockExecution && lockExecution.ok === false && lockExecution.busy === true) {
        statusBox.textContent = "Hay otro analisis activo en otra pestaña. Espera a que termine.";
      }
    });

    byId("limpiar").addEventListener("click", function onClear() {
      fotoRef1.value = "";
      fotoRef2.value = "";
      out.textContent = "";
      statusBox.textContent = "";
      cancelAnalysisExclusive({ reason: "manual_clear" });
      if (visibleRuntime && typeof visibleRuntime.noteActivity === "function") {
        visibleRuntime.noteActivity("alta_foto_limpiar");
      }
    });
  }

  var api = {
    DEFAULT_BACKEND_URL: DEFAULT_BACKEND_URL,
    buildCerebroRequest: buildCerebroRequest,
    buildReviewDraftPayload: buildReviewDraftPayload,
    buildCaseRevisionV1: buildCaseRevisionV1,
    buildDraftVisuales: buildDraftVisuales,
    getFinalDataFromResponse: getFinalDataFromResponse,
    classifyVisibleOutcome: classifyVisibleOutcome,
    ejecutarAnalisisVisible: ejecutarAnalisisVisible
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase3AltaFotoVisibleApp = api;
  }

  if (typeof document === "undefined") return;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
    return;
  }
  init();
})(typeof globalThis !== "undefined" ? globalThis : this);
