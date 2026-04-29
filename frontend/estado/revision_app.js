(function initRevisionUi(globalScope) {
  "use strict";

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
  var VISUAL_SETTINGS_STORAGE_KEY = "appv2_visual_settings_v1";
  var DEFAULT_VISUAL_SETTINGS = {
    profileKey: "EQUILIBRADO_WEBP",
    qualityPct: 80,
    resolutionMaxPx: 800
  };
  var MAX_PHOTO_VARIANT_CACHE_ITEMS = 24;

  function byId(id) {
    return document.getElementById(id);
  }

  function safeClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function printJson(target, value) {
    target.textContent = JSON.stringify(value, null, 2);
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

  function getOfficialAllergens() {
    var catalog = globalScope && globalScope.AppV2AlergenosOficiales;
    if (catalog && Array.isArray(catalog.NOMBRES_OFICIALES) && catalog.NOMBRES_OFICIALES.length === 14) {
      return catalog.NOMBRES_OFICIALES.slice();
    }
    return OFFICIAL_ALLERGENS_FALLBACK.slice();
  }

  function toDisplayLabel(token) {
    var catalog = globalScope && globalScope.AppV2AlergenosOficiales;
    if (catalog && typeof catalog.toDisplayLabel === "function") {
      return catalog.toDisplayLabel(token);
    }
    return String(token || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, function upper(x) { return x.toUpperCase(); });
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

  function toAllergenFlags(input) {
    var official = getOfficialAllergens();
    var names = toAllergenNameList(input);
    var map = Object.create(null);
    for (var i = 0; i < names.length; i += 1) {
      map[normalizeToken(names[i])] = true;
    }
    return official.map(function each(item) {
      return !!map[normalizeToken(item)];
    });
  }

  function toAllergenNamesFromFlags(flags) {
    var official = getOfficialAllergens();
    var safeFlags = Array.isArray(flags) ? flags : [];
    var names = [];
    for (var i = 0; i < official.length; i += 1) {
      if (safeFlags[i] === true) names.push(official[i]);
    }
    return names;
  }

  function parseCsv(value) {
    var catalog = globalScope && globalScope.AppV2AlergenosOficiales;
    if (catalog && typeof catalog.parseAllergenCsv === "function") {
      return catalog.parseAllergenCsv(value);
    }
    if (!value) return [];
    return String(value)
      .split(",")
      .map(function mapToken(x) { return normalizeToken(x); })
      .filter(Boolean);
  }

  function toPosInt(value, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    n = Math.floor(n);
    if (n <= 0) return fallback;
    return n;
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
    try {
      if (!globalScope.localStorage) return fallback;
      var raw = globalScope.localStorage.getItem(VISUAL_SETTINGS_STORAGE_KEY);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return fallback;
      return {
        profileKey: String(parsed.profileKey || fallback.profileKey).trim() || fallback.profileKey,
        qualityPct: toPosInt(parsed.qualityPct, fallback.qualityPct),
        resolutionMaxPx: toPosInt(parsed.resolutionMaxPx, fallback.resolutionMaxPx)
      };
    } catch (err) {
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

  function loadImageFromSrc(src) {
    return new Promise(function onLoad(resolve, reject) {
      var img = new Image();
      img.onload = function done() { resolve(img); };
      img.onerror = function fail() { reject(new Error("No se pudo cargar la foto.")); };
      img.src = src;
    });
  }

  function canvasToBlob(canvas, mimeType, qualityPct) {
    return new Promise(function onBlob(resolve) {
      var q = Math.max(0.1, Math.min(1, (toPosInt(qualityPct, 80)) / 100));
      if (canvas.toBlob) {
        canvas.toBlob(function done(blob) { resolve(blob || null); }, mimeType, q);
        return;
      }
      resolve(null);
    });
  }

  function blobToDataUrl(blob) {
    return new Promise(function toData(resolve, reject) {
      var reader = new FileReader();
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

    var canvas = document.createElement("canvas");
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

  function buildPhotoCacheKey(ref, src) {
    var rawRef = String(ref || "").trim();
    if (rawRef) return rawRef;
    return String(src || "").trim();
  }

  function markPhotoVariantUsed(state, key) {
    if (!state || !key) return;
    state.photoVariantUsedAt[key] = Date.now();
  }

  function prunePhotoVariantCache(state) {
    if (!state || !state.photoVariantCache) return;
    var allowed = Object.create(null);
    var rows = Array.isArray(state.pendingRows) ? state.pendingRows : [];
    var i;
    var j;

    for (i = 0; i < rows.length; i += 1) {
      var caso = rows[i] && rows[i].caso ? rows[i].caso : null;
      var refs = caso && Array.isArray(caso.photoRefs) ? caso.photoRefs : [];
      for (j = 0; j < refs.length; j += 1) {
        var key = buildPhotoCacheKey(refs[j], refs[j]);
        if (key) allowed[key] = true;
      }
    }

    if (state.currentCase && Array.isArray(state.currentCase.photoRefs)) {
      for (i = 0; i < state.currentCase.photoRefs.length; i += 1) {
        var currentKey = buildPhotoCacheKey(state.currentCase.photoRefs[i], state.currentCase.photoRefs[i]);
        if (currentKey) allowed[currentKey] = true;
      }
    }

    var keys = Object.keys(state.photoVariantCache);
    for (i = 0; i < keys.length; i += 1) {
      if (allowed[keys[i]]) continue;
      delete state.photoVariantCache[keys[i]];
      delete state.photoVariantUsedAt[keys[i]];
      delete state.photoVariantLoading[keys[i]];
    }

    keys = Object.keys(state.photoVariantCache);
    if (keys.length <= MAX_PHOTO_VARIANT_CACHE_ITEMS) return;

    keys.sort(function byRecent(a, b) {
      return Number(state.photoVariantUsedAt[b] || 0) - Number(state.photoVariantUsedAt[a] || 0);
    });
    for (i = MAX_PHOTO_VARIANT_CACHE_ITEMS; i < keys.length; i += 1) {
      if (allowed[keys[i]]) continue;
      delete state.photoVariantCache[keys[i]];
      delete state.photoVariantUsedAt[keys[i]];
      delete state.photoVariantLoading[keys[i]];
    }
  }

  async function ensurePhotoVariants(state, ref, src, imgNode, buttonNode) {
    var key = buildPhotoCacheKey(ref, src);
    if (!key || !src || !imgNode || !buttonNode) return;
    var existing = state.photoVariantCache[key];
    if (existing && existing.thumbSrc && existing.viewerSrc) {
      markPhotoVariantUsed(state, key);
      imgNode.src = existing.thumbSrc;
      buttonNode.setAttribute("data-viewer-src", existing.viewerSrc);
      return;
    }
    if (state.photoVariantLoading[key]) return;
    state.photoVariantLoading[key] = true;

    try {
      var settings = readVisualSettingsFromStorage();
      var image = await loadImageFromSrc(src);
      var thumbSrc = await encodeVariantFromImage(image, {
        mimeType: "image/webp",
        qualityPct: 40,
        maxSidePx: 200
      });
      var viewerSrc = await encodeVariantFromImage(image, {
        mimeType: profileToMime(settings.profileKey),
        qualityPct: settings.qualityPct,
        maxSidePx: settings.resolutionMaxPx
      });
      state.photoVariantCache[key] = {
        thumbSrc: thumbSrc || src,
        viewerSrc: viewerSrc || src
      };
      markPhotoVariantUsed(state, key);
      persistGeneratedPhotoVariant(state, ref, state.photoVariantCache[key]);
      if (!buttonNode.isConnected || !imgNode.isConnected) return;
      imgNode.src = state.photoVariantCache[key].thumbSrc;
      buttonNode.setAttribute("data-viewer-src", state.photoVariantCache[key].viewerSrc);
    } catch (err) {
      state.photoVariantCache[key] = {
        thumbSrc: src,
        viewerSrc: src
      };
      markPhotoVariantUsed(state, key);
      persistGeneratedPhotoVariant(state, ref, state.photoVariantCache[key]);
    } finally {
      delete state.photoVariantLoading[key];
    }
  }

  function mapDraftStateToCaseStatus(draftState) {
    var s = String(draftState || "").trim().toUpperCase();
    if (s === "PENDIENTE_REVISION") return "pendiente";
    if (s === "EN_REVISION") return "en_revision";
    if (s === "CONFIRMADO_GUARDADO") return "resuelto";
    if (s === "CANCELADO") return "descartado";
    return "pendiente";
  }

  function mapCaseStatusToDraftState(caseStatus) {
    var s = String(caseStatus || "").trim().toLowerCase();
    if (s === "pendiente") return "PENDIENTE_REVISION";
    if (s === "en_revision") return "EN_REVISION";
    if (s === "resuelto") return "CONFIRMADO_GUARDADO";
    if (s === "descartado") return "CANCELADO";
    return "PENDIENTE_REVISION";
  }

  function asEpochFromIso(value) {
    if (!value) return 0;
    var n = Date.parse(String(value));
    return Number.isFinite(n) ? n : 0;
  }

  function resolveStore(globalScope) {
    var sharedApi = globalScope.Fase3SharedBrowserStore;
    if (sharedApi && typeof sharedApi.createSharedProductStore === "function") {
      return sharedApi.createSharedProductStore();
    }
    return globalScope.Fase3DataStoreLocal.createMemoryProductStore();
  }

  function listAllDrafts(store) {
    if (!store) return [];
    if (typeof store.listRevisionDrafts === "function") {
      return store.listRevisionDrafts();
    }
    if (typeof store.listPendingRevisionDrafts === "function") {
      return store.listPendingRevisionDrafts();
    }
    return [];
  }

  function deriveCaseFromDraft(draft) {
    var safeDraft = draft || {};
    var rb = safeDraft.resultadoBoxer || {};
    var caseFromDraft = rb.casoRevision || {};
    var proposal = rb.propuestaFinal || {};
    var decision = rb.decision || {};
    var revision = rb.revision || {};
    var photoRefs = Array.isArray(caseFromDraft.photoRefs)
      ? caseFromDraft.photoRefs.slice(0, 2)
      : (safeDraft.evidencia && Array.isArray(safeDraft.evidencia.fotoRefs)
        ? safeDraft.evidencia.fotoRefs.slice(0, 2)
        : []);
    var visuales = safeDraft.evidencia && Array.isArray(safeDraft.evidencia.visuales)
      ? safeClone(safeDraft.evidencia.visuales).slice(0, 2)
      : (Array.isArray(caseFromDraft.visuales) ? safeClone(caseFromDraft.visuales).slice(0, 2) : []);
    var alergenFlags = Array.isArray(caseFromDraft.alergenos) && caseFromDraft.alergenos.length === 14
      ? caseFromDraft.alergenos.map(function each(flag) { return flag === true; })
      : toAllergenFlags(
        Array.isArray(proposal.alergenos) ? proposal.alergenos : (
          safeDraft.propuesta && Array.isArray(safeDraft.propuesta.alergenos) ? safeDraft.propuesta.alergenos : []
        )
      );
    var decisionFlow = String(caseFromDraft.decisionFlujo || decision.decisionFlujo || "").trim();
    var passport = String(caseFromDraft.pasaporte || decision.pasaporte || "").trim().toUpperCase();
    if (!passport) {
      if (decisionFlow === "guardar") passport = "VERDE";
      else if (decisionFlow === "revision") passport = "NARANJA";
      else passport = "ROJO";
    }
    var message = String(caseFromDraft.mensajePasaporteCorto || decision.mensajePasaporteCorto || "").trim();
    var now = Date.now();
    return {
      draftId: String(safeDraft.draftId || "").trim(),
      analysisId: String(caseFromDraft.analysisId || rb.analysisId || "").trim() || null,
      traceId: String(caseFromDraft.traceId || rb.traceId || "").trim() || null,
      batchId: String(caseFromDraft.batchId || rb.batchId || "").trim() || null,
      modoOrigen: String(caseFromDraft.modoOrigen || "normal").trim().toLowerCase() === "lote" ? "lote" : "normal",
      pasaporte: passport,
      mensajePasaporteCorto: message,
      nombre: String(caseFromDraft.nombre || proposal.nombre || (safeDraft.propuesta && safeDraft.propuesta.nombre) || "").trim(),
      formato: String(caseFromDraft.formato || proposal.formato || "").trim(),
      alergenos: alergenFlags,
      trazas: Array.isArray(caseFromDraft.trazas)
        ? toAllergenNameList(caseFromDraft.trazas)
        : toAllergenNameList(proposal.trazas || []),
      photoRefs: photoRefs,
      visuales: visuales,
      estadoRevision: String(caseFromDraft.estadoRevision || mapDraftStateToCaseStatus(safeDraft.estado)).trim().toLowerCase(),
      origen: "cerebro",
      timestampCreacion: Number(caseFromDraft.timestampCreacion || asEpochFromIso(safeDraft.metadatos && safeDraft.metadatos.createdAt) || now),
      timestampResolucion: caseFromDraft.timestampResolucion || null,
      decisionFlujo: decisionFlow || "revision",
      revision: safeClone(revision || {}),
      modulos: safeClone(rb.modulos || {}),
      duplicados: safeClone(rb.duplicados || {}),
      propuestaFinalBase: safeClone(proposal || {})
    };
  }

  function toPendingCaseRows(store) {
    return listAllDrafts(store)
      .map(function mapDraft(draft) {
        return {
          draft: draft,
          caso: deriveCaseFromDraft(draft)
        };
      })
      .filter(function isOpen(item) {
        return item.caso.estadoRevision === "pendiente" || item.caso.estadoRevision === "en_revision";
      })
      .sort(function byOrder(a, b) {
        var ta = Number(a.caso.timestampCreacion || 0);
        var tb = Number(b.caso.timestampCreacion || 0);
        if (ta < tb) return -1;
        if (ta > tb) return 1;
        if (a.caso.draftId < b.caso.draftId) return -1;
        if (a.caso.draftId > b.caso.draftId) return 1;
        return 0;
      });
  }

  function updateDraft(store, draftId, mutator) {
    if (!store || typeof store.replaceRevisionDrafts !== "function") return null;
    var all = listAllDrafts(store);
    var index = -1;
    for (var i = 0; i < all.length; i += 1) {
      if (String(all[i].draftId || "") === String(draftId || "")) {
        index = i;
        break;
      }
    }
    if (index < 0) return null;
    var current = safeClone(all[index]);
    var next = mutator ? mutator(current) : current;
    if (!next) return null;
    all[index] = next;
    var replaced = store.replaceRevisionDrafts(all);
    if (!replaced || replaced.ok !== true) return null;
    return next;
  }

  function persistCaseInDraft(store, caseData, resolution) {
    return updateDraft(store, caseData.draftId, function mutate(draft) {
      var safeDraft = draft || {};
      safeDraft.estado = mapCaseStatusToDraftState(caseData.estadoRevision);
      safeDraft.propuesta = safeDraft.propuesta || {};
      safeDraft.propuesta.nombre = caseData.nombre || "Producto por revisar";
      safeDraft.propuesta.alergenos = toAllergenNamesFromFlags(caseData.alergenos);
      safeDraft.evidencia = safeDraft.evidencia || {};
      safeDraft.evidencia.fotoRefs = Array.isArray(caseData.photoRefs) ? caseData.photoRefs.slice(0, 2) : [];
      safeDraft.evidencia.visuales = Array.isArray(caseData.visuales) ? safeClone(caseData.visuales).slice(0, 2) : [];
      safeDraft.metadatos = safeDraft.metadatos || {};
      safeDraft.metadatos.updatedAt = new Date().toISOString();
      if (!safeDraft.metadatos.createdAt) safeDraft.metadatos.createdAt = new Date().toISOString();
      safeDraft.resultadoBoxer = safeDraft.resultadoBoxer || {};
      safeDraft.resultadoBoxer.casoRevision = safeClone(caseData);
      safeDraft.resultadoBoxer.analysisId = caseData.analysisId;
      safeDraft.resultadoBoxer.traceId = caseData.traceId;
      safeDraft.resultadoBoxer.batchId = caseData.batchId;
      safeDraft.resultadoBoxer.propuestaFinal = Object.assign({}, safeDraft.resultadoBoxer.propuestaFinal || {}, {
        nombre: caseData.nombre || "",
        formato: caseData.formato || "",
        alergenos: toAllergenNamesFromFlags(caseData.alergenos),
        trazas: toAllergenNameList(caseData.trazas || []),
        requiereRevision: caseData.estadoRevision !== "resuelto"
      });
      if (resolution) {
        safeDraft.resolucion = resolution;
      }
      return safeDraft;
    });
  }

  function persistGeneratedPhotoVariant(state, ref, variant) {
    var current = state && state.currentCase;
    var safeRef = String(ref || "").trim();
    var safeVariant = variant || {};
    if (!current || !current.draftId || !safeRef) return;
    if (!safeVariant.thumbSrc && !safeVariant.viewerSrc) return;

    var photoRefs = Array.isArray(current.photoRefs) ? current.photoRefs.slice(0, 2) : [];
    var visuales = Array.isArray(current.visuales) ? safeClone(current.visuales).slice(0, 2) : [];
    var index = photoRefs.indexOf(safeRef);
    if (index < 0 || index > 1) return;

    var nextVisual = {
      ref: safeRef,
      thumbSrc: String(safeVariant.thumbSrc || "").trim() || toImageSrc(safeRef),
      viewerSrc: String(safeVariant.viewerSrc || "").trim() || toImageSrc(safeRef)
    };
    var currentVisual = visuales[index] || {};
    if (
      String(currentVisual.thumbSrc || "") === nextVisual.thumbSrc &&
      String(currentVisual.viewerSrc || "") === nextVisual.viewerSrc
    ) {
      return;
    }

    visuales[index] = nextVisual;
    current.visuales = visuales;
    persistCaseInDraft(state.store, current, null);
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

  function renderPendingList(state) {
    var rows = toPendingCaseRows(state.store);
    state.pendingRows = rows;
    prunePhotoVariantCache(state);
    state.el.pendingCount.textContent = "Pendientes abiertos: " + rows.length;

    if (!rows.length) {
      state.el.pendingTable.innerHTML = "<p class=\"empty\">No hay pendientes de revisión.</p>";
      return;
    }

    var html = rows.map(function toCard(item) {
      var caso = item.caso;
      var cover = Array.isArray(caso.visuales) && caso.visuales[0] && caso.visuales[0].thumbSrc
        ? caso.visuales[0].thumbSrc
        : toImageSrc(caso.photoRefs && caso.photoRefs[0]);
      var coverHtml = cover
        ? "<img class=\"pending-thumb\" src=\"" + String(cover).replace(/\"/g, "&quot;") + "\" alt=\"miniatura\">"
        : "<div class=\"pending-thumb pending-thumb-empty\">Sin foto</div>";
      return (
        "<div class=\"pending-card\">" +
          "<div class=\"pending-body\">" +
            coverHtml +
            "<div class=\"pending-main\">" +
              "<div class=\"pending-head\">" +
                "<div>" +
                  "<div class=\"pending-title\">" + (caso.nombre || "(sin nombre)") + "</div>" +
                  "<div class=\"pending-meta\">" +
                    "Draft: " + caso.draftId +
                    " · " + caso.modoOrigen +
                    " · " + caso.pasaporte +
                    (caso.formato ? " · " + caso.formato : "") +
                  "</div>" +
                "</div>" +
                "<button class=\"pending-open\" data-draft-id=\"" + caso.draftId + "\">Abrir</button>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>"
      );
    }).join("");

    state.el.pendingTable.innerHTML = html;
    Array.prototype.forEach.call(
      state.el.pendingTable.querySelectorAll(".pending-open"),
      function bind(btn) {
        btn.addEventListener("click", function onClick() {
          var id = String(btn.getAttribute("data-draft-id") || "").trim();
          if (!id) return;
          openCaseByDraftId(state, id);
        });
      }
    );
  }

  function ensureAllergenGrid(state) {
    var official = getOfficialAllergens();
    state.el.allergenGrid.innerHTML = "";
    state.uiAlergenInputs = [];
    for (var i = 0; i < official.length; i += 1) {
      var key = official[i];
      var id = "alg_" + i;
      var row = document.createElement("label");
      row.className = "alg-item";
      row.setAttribute("for", id);

      var check = document.createElement("input");
      check.type = "checkbox";
      check.id = id;
      check.setAttribute("data-idx", String(i));

      var text = document.createElement("span");
      text.textContent = toDisplayLabel(key);

      row.appendChild(check);
      row.appendChild(text);
      state.el.allergenGrid.appendChild(row);
      state.uiAlergenInputs.push(check);
    }
  }

  function setAllergenFlagsToUi(state, flags) {
    var safeFlags = Array.isArray(flags) ? flags : [];
    for (var i = 0; i < state.uiAlergenInputs.length; i += 1) {
      state.uiAlergenInputs[i].checked = safeFlags[i] === true;
    }
  }

  function readAllergenFlagsFromUi(state) {
    return state.uiAlergenInputs.map(function mapInput(input) { return input.checked === true; });
  }

  function renderPhotos(state, photoRefs, visuales) {
    var refs = Array.isArray(photoRefs) ? photoRefs.slice(0, 2) : [];
    var variantList = Array.isArray(visuales) ? visuales.slice(0, 2) : [];
    if (!refs.length) {
      state.el.photos.innerHTML = "<p class=\"empty\">Sin fotos en este caso.</p>";
      return;
    }

    var html = refs.map(function mapRef(ref, index) {
      var src = toImageSrc(ref);
      var variant = variantList[index] && typeof variantList[index] === "object" ? variantList[index] : null;
      var thumbSrc = variant && variant.thumbSrc ? String(variant.thumbSrc).trim() : src;
      var viewerSrc = variant && variant.viewerSrc ? String(variant.viewerSrc).trim() : src;
      var safeRef = String(ref || "").replace(/"/g, "&quot;");
      var safeSrc = String(src || "").replace(/"/g, "&quot;");
      var safeThumbSrc = String(thumbSrc || src || "").replace(/"/g, "&quot;");
      var safeViewerSrc = String(viewerSrc || src || "").replace(/"/g, "&quot;");
      return (
        "<button type=\"button\" class=\"photo-btn\" data-ref=\"" + safeRef + "\" data-src=\"" + safeSrc + "\" data-viewer-src=\"" + safeViewerSrc + "\" data-idx=\"" + (index + 1) + "\" data-has-persisted=\"" + (variant ? "1" : "0") + "\">" +
          "<img src=\"" + safeThumbSrc + "\" alt=\"foto " + (index + 1) + "\">" +
        "</button>"
      );
    }).join("");
    state.el.photos.innerHTML = html;

    Array.prototype.forEach.call(state.el.photos.querySelectorAll(".photo-btn"), function bind(btn) {
      var img = btn.querySelector("img");
      var srcBase = String(btn.getAttribute("data-src") || "").trim();
      var refBase = String(btn.getAttribute("data-ref") || "").trim();
      if (String(btn.getAttribute("data-has-persisted") || "") !== "1") {
        ensurePhotoVariants(state, refBase, srcBase, img, btn);
      }
      btn.addEventListener("click", function onOpenPhoto() {
        var src = String(btn.getAttribute("data-viewer-src") || btn.getAttribute("data-src") || "").trim();
        var ref = String(btn.getAttribute("data-ref") || "").trim();
        openViewer(state, src, ref);
      });
    });
  }

  function renderPassport(state, caseData) {
    var pass = String(caseData.pasaporte || "").trim().toUpperCase() || "ROJO";
    var message = String(caseData.mensajePasaporteCorto || "").trim();
    var css = "danger";
    if (pass === "VERDE") css = "ok";
    else if (pass === "NARANJA") css = "warn";

    state.el.passportBadge.className = "badge " + css;
    state.el.passportBadge.textContent = "Pasaporte " + pass;

    if (pass !== "VERDE" && !message) {
      message = "Revision requerida";
      try {
        console.warn("REV_MENSAJE_PASAPORTE_AUSENTE", {
          draftId: caseData.draftId || null,
          analysisId: caseData.analysisId || null,
          traceId: caseData.traceId || null
        });
      } catch (errWarn) {
        // No-op.
      }
    }
    if (pass === "VERDE" && !message) {
      state.el.passportMsg.textContent = "";
      return;
    }
    state.el.passportMsg.textContent = message;
  }

  function fillEditor(state, caseData) {
    state.el.draftId.value = caseData.draftId || "";
    state.el.nombre.value = caseData.nombre || "";
    state.el.formato.value = caseData.formato || "";
    state.el.trazas.value = toAllergenNameList(caseData.trazas || []).join(", ");
    setAllergenFlagsToUi(state, caseData.alergenos);
    renderPassport(state, caseData);
    renderPhotos(state, caseData.photoRefs, caseData.visuales);
  }

  function parseRequestedDraftId() {
    try {
      var url = new URL(globalScope.location.href);
      return String(url.searchParams.get("draftId") || "").trim();
    } catch (errUrl) {
      return "";
    }
  }

  function openCaseByDraftId(state, draftId) {
    var rows = state.pendingRows || toPendingCaseRows(state.store);
    var selected = null;
    for (var i = 0; i < rows.length; i += 1) {
      if (String(rows[i].caso.draftId || "") === String(draftId || "")) {
        selected = rows[i];
        break;
      }
    }
    if (!selected && rows.length) selected = rows[0];
    if (!selected) {
      state.currentCase = null;
      state.el.draftId.value = "";
      state.el.nombre.value = "";
      state.el.formato.value = "";
      state.el.trazas.value = "";
      setAllergenFlagsToUi(state, []);
      renderPhotos(state, [], []);
      renderPassport(state, {
        pasaporte: "VERDE",
        mensajePasaporteCorto: ""
      });
      prunePhotoVariantCache(state);
      return;
    }

    var caseData = safeClone(selected.caso);
    if (caseData.estadoRevision === "pendiente") {
      caseData.estadoRevision = "en_revision";
      persistCaseInDraft(state.store, caseData, null);
    }
    state.currentCase = caseData;
    prunePhotoVariantCache(state);
    fillEditor(state, caseData);
  }

  function buildGuardarPayload(caseData, edited) {
    var proposal = {
      nombre: edited.nombre,
      formato: edited.formato,
      alergenos: edited.alergenos,
      trazas: edited.trazas,
      tipoFormato: String(caseData.propuestaFinalBase && caseData.propuestaFinalBase.tipoFormato || "desconocido").trim() || "desconocido",
      requiereRevision: false
    };
    var decision = {
      pasaporte: caseData.pasaporte || "VERDE",
      decisionFlujo: "guardar",
      accionSugerida: "guardar_resultado_analizado",
      requiereRevisionGlobal: false,
      mensajePasaporteCorto: caseData.mensajePasaporteCorto || ""
    };
    var revision = Object.assign({}, caseData.revision || {}, {
      draftIdGenerado: caseData.draftId,
      estadoRevision: "resuelto",
      timestampResolucion: Date.now()
    });
    return {
      analysisId: caseData.analysisId,
      traceId: caseData.traceId,
      batchId: caseData.batchId,
      idempotencyKey: [
        "manual_guardar",
        caseData.analysisId || "sin_analysis",
        caseData.traceId || "sin_trace",
        caseData.batchId || "sin_batch",
        caseData.draftId || "sin_draft"
      ].join("|"),
      propuestaFinal: proposal,
      datos: {
        schemaVersion: "CEREBRO_JSON_MAESTRO_V1",
        analysisId: caseData.analysisId,
        traceId: caseData.traceId,
        elapsedMs: 0,
        decision: decision,
        propuestaFinal: proposal,
        revision: revision,
        duplicados: caseData.duplicados || {},
        ia: {},
        modulos: caseData.modulos || {}
      }
    };
  }

  function resolvePersistDeps() {
    var resolver = globalScope.CerebroProductosRepositoryResolver;
    var persist = globalScope.CerebroProductosPersistencia;
    if (!resolver || typeof resolver.resolveProductRepository !== "function") {
      return {
        ok: false,
        errorCode: "REV_REPOSITORIO_RESOLVER_NO_DISPONIBLE",
        message: "No está cargado el resolvedor del repositorio real."
      };
    }
    if (!persist || typeof persist.guardarResultadoAnalizado !== "function") {
      return {
        ok: false,
        errorCode: "REV_PERSISTENCIA_NO_DISPONIBLE",
        message: "No está cargada la persistencia real de productos."
      };
    }
    var resolved = resolver.resolveProductRepository({});
    if (!resolved || resolved.ok !== true || !resolved.repository) {
      return {
        ok: false,
        errorCode: resolved && resolved.errorCode ? resolved.errorCode : "REV_REPOSITORIO_NO_LISTO",
        message: resolved && resolved.message ? resolved.message : "No se pudo preparar Firebase para guardar."
      };
    }
    return {
      ok: true,
      persist: persist,
      deps: {
        productRepository: resolved.repository
      }
    };
  }

  function openNextCase(state) {
    renderPendingList(state);
    var rows = state.pendingRows || [];
    if (!rows.length) {
      state.currentCase = null;
      openCaseByDraftId(state, "");
      return;
    }
    var nextId = rows[0].caso.draftId;
    openCaseByDraftId(state, nextId);
  }

  function readEditedCaseFromUi(state) {
    if (!state.currentCase) return null;
    return Object.assign({}, state.currentCase, {
      nombre: String(state.el.nombre.value || "").trim(),
      formato: String(state.el.formato.value || "").trim(),
      alergenos: readAllergenFlagsFromUi(state),
      trazas: parseCsv(state.el.trazas.value || "")
    });
  }

  async function onGuardar(state) {
    if (!state.currentCase) {
      printJson(state.el.output, {
        ok: false,
        error: { code: "REV_CASO_NO_ENCONTRADO", message: "No hay caso abierto para guardar." }
      });
      return;
    }

    var edited = readEditedCaseFromUi(state);
    if (!edited || !edited.nombre) {
      printJson(state.el.output, {
        ok: false,
        error: { code: "REV_NOMBRE_VACIO", message: "El nombre es obligatorio para guardar." }
      });
      return;
    }

    var persistDeps = resolvePersistDeps();
    if (!persistDeps.ok) {
      printJson(state.el.output, {
        ok: false,
        error: { code: persistDeps.errorCode, message: persistDeps.message }
      });
      return;
    }

    var payload = buildGuardarPayload(edited, {
      nombre: edited.nombre,
      formato: edited.formato,
      alergenos: toAllergenNamesFromFlags(edited.alergenos),
      trazas: toAllergenNameList(edited.trazas || [])
    });
    var saved = await Promise.resolve(
      persistDeps.persist.guardarResultadoAnalizado(payload, persistDeps.deps)
    );

    if (!saved || saved.ok !== true) {
      printJson(state.el.output, {
        ok: false,
        error: {
          code: saved && saved.errorCode ? saved.errorCode : "REV_GUARDADO_REAL_FAILED",
          message: saved && saved.message ? saved.message : "No se pudo guardar en la base real."
        }
      });
      return;
    }

    edited.estadoRevision = "resuelto";
    edited.timestampResolucion = Date.now();
    persistCaseInDraft(state.store, edited, {
      tipo: "GUARDADO_REAL",
      productId: saved.productId || null,
      merged: !!saved.merged,
      timestamp: new Date().toISOString()
    });

    printJson(state.el.output, {
      ok: true,
      accion: "guardar_real",
      draftId: edited.draftId,
      productId: saved.productId || null,
      merged: !!saved.merged,
      deduped: !!saved.deduped
    });
    openNextCase(state);
  }

  function onCancelar(state) {
    if (!state.currentCase) {
      printJson(state.el.output, {
        ok: false,
        error: { code: "REV_CASO_NO_ENCONTRADO", message: "No hay caso abierto para cancelar." }
      });
      return;
    }
    var edited = readEditedCaseFromUi(state);
    edited.estadoRevision = "descartado";
    edited.timestampResolucion = Date.now();
    persistCaseInDraft(state.store, edited, {
      tipo: "CANCELADO",
      motivo: "cancelado_por_usuario",
      timestamp: new Date().toISOString()
    });
    printJson(state.el.output, {
      ok: true,
      accion: "cancelar_caso",
      draftId: edited.draftId
    });
    openNextCase(state);
  }

  function applyViewerTransform(state) {
    var v = state.viewer;
    var t = "translate(-50%, -50%) translate(" + v.offsetX.toFixed(1) + "px, " + v.offsetY.toFixed(1) + "px) scale(" + v.zoom.toFixed(2) + ")";
    state.el.viewerImage.style.transform = t;
  }

  function clampZoom(value) {
    var z = Number(value);
    if (!Number.isFinite(z)) return 1;
    if (z < 1) return 1;
    if (z > 4) return 4;
    return Math.round(z * 100) / 100;
  }

  function restoreViewerScroll(state) {
    var y = Number(state.viewer.scrollYBeforeOpen || 0);
    globalScope.requestAnimationFrame(function onFrame() {
      globalScope.scrollTo(0, y);
    });
  }

  function pushViewerHistoryState(state) {
    if (state.viewer.historyPushed) return;
    state.viewer.scrollYBeforeOpen = Number(globalScope.scrollY || globalScope.pageYOffset || 0);
    state.viewer.historyPushed = true;
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
    }
  }

  function openViewer(state, src, refText) {
    if (!src) return;
    if (!state.viewer.isOpen) {
      pushViewerHistoryState(state);
    }
    state.viewer.isOpen = true;
    state.viewer.zoom = 1;
    state.viewer.offsetX = 0;
    state.viewer.offsetY = 0;
    state.viewer.dragging = false;
    state.viewer.pointers = Object.create(null);
    state.viewer.pinchDistance = 0;
    state.viewer.pinchZoom = 1;
    state.viewer.pinchCenterX = 0;
    state.viewer.pinchCenterY = 0;
    state.el.viewerImage.src = src;
    state.el.viewerModal.classList.add("open");
    state.el.viewerModal.setAttribute("aria-hidden", "false");
    applyViewerTransform(state);
  }

  function closeViewer(state, options) {
    var safeOptions = options || {};
    if (!state.viewer.isOpen) return;
    state.viewer.isOpen = false;
    state.viewer.dragging = false;
    state.viewer.pointers = Object.create(null);
    state.el.viewerStage.classList.remove("dragging");
    state.el.viewerModal.classList.remove("open");
    state.el.viewerModal.setAttribute("aria-hidden", "true");
    if (state.viewer.historyPushed && !safeOptions.fromPopstate) {
      try {
        globalScope.history.back();
        return;
      } catch (errBack) {
        // Continua cierre local.
      }
    }
    state.viewer.historyPushed = false;
    state.viewer.historyMarker = null;
    restoreViewerScroll(state);
  }

  function getViewerPointers(state) {
    if (!state.viewer.pointers) state.viewer.pointers = Object.create(null);
    return state.viewer.pointers;
  }

  function getViewerPointerList(state) {
    var pointers = getViewerPointers(state);
    return Object.keys(pointers).map(function mapPointer(key) {
      return pointers[key];
    });
  }

  function getPointerDistance(a, b) {
    var dx = Number(a.clientX || 0) - Number(b.clientX || 0);
    var dy = Number(a.clientY || 0) - Number(b.clientY || 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getPointerCenter(a, b) {
    return {
      x: (Number(a.clientX || 0) + Number(b.clientX || 0)) / 2,
      y: (Number(a.clientY || 0) + Number(b.clientY || 0)) / 2
    };
  }

  function startViewerPinch(state, a, b) {
    state.viewer.dragging = false;
    state.el.viewerStage.classList.remove("dragging");
    state.viewer.pinchDistance = Math.max(1, getPointerDistance(a, b));
    state.viewer.pinchZoom = state.viewer.zoom;
    var center = getPointerCenter(a, b);
    state.viewer.pinchCenterX = center.x;
    state.viewer.pinchCenterY = center.y;
  }

  function updateViewerPointersAfterPointerUp(state) {
    var list = getViewerPointerList(state);
    if (list.length >= 2) {
      startViewerPinch(state, list[0], list[1]);
      return;
    }
    state.viewer.pinchDistance = 0;
    if (list.length === 1 && state.viewer.zoom > 1) {
      state.viewer.dragging = true;
      state.viewer.dragStartX = list[0].clientX;
      state.viewer.dragStartY = list[0].clientY;
      state.el.viewerStage.classList.add("dragging");
      return;
    }
    state.viewer.dragging = false;
    state.el.viewerStage.classList.remove("dragging");
  }

  function bindViewer(state) {
    state.el.viewerClose.addEventListener("click", function onClose() {
      closeViewer(state, { fromPopstate: false });
    });
    state.el.viewerStage.addEventListener("wheel", function onWheel(ev) {
      ev.preventDefault();
      state.viewer.zoom = clampZoom(state.viewer.zoom + (ev.deltaY < 0 ? 0.15 : -0.15));
      if (state.viewer.zoom <= 1) {
        state.viewer.offsetX = 0;
        state.viewer.offsetY = 0;
      }
      applyViewerTransform(state);
    }, { passive: false });

    state.el.viewerStage.addEventListener("pointerdown", function onPointerDown(ev) {
      ev.preventDefault();
      getViewerPointers(state)[ev.pointerId] = { clientX: ev.clientX, clientY: ev.clientY };
      if (state.el.viewerStage.setPointerCapture) {
        try { state.el.viewerStage.setPointerCapture(ev.pointerId); } catch (errCapture) {}
      }
      var list = getViewerPointerList(state);
      if (list.length >= 2) {
        startViewerPinch(state, list[0], list[1]);
        return;
      }
      if (state.viewer.zoom > 1) {
        state.viewer.dragging = true;
        state.viewer.dragStartX = ev.clientX;
        state.viewer.dragStartY = ev.clientY;
        state.el.viewerStage.classList.add("dragging");
      }
    });
    globalScope.addEventListener("pointermove", function onPointerMove(ev) {
      var pointers = getViewerPointers(state);
      if (pointers[ev.pointerId]) {
        pointers[ev.pointerId] = { clientX: ev.clientX, clientY: ev.clientY };
        var list = getViewerPointerList(state);
        if (list.length >= 2) {
          ev.preventDefault();
          var center = getPointerCenter(list[0], list[1]);
          var distance = Math.max(1, getPointerDistance(list[0], list[1]));
          state.viewer.zoom = clampZoom(state.viewer.pinchZoom * (distance / Math.max(1, state.viewer.pinchDistance)));
          state.viewer.offsetX += center.x - state.viewer.pinchCenterX;
          state.viewer.offsetY += center.y - state.viewer.pinchCenterY;
          state.viewer.pinchCenterX = center.x;
          state.viewer.pinchCenterY = center.y;
          if (state.viewer.zoom <= 1) {
            state.viewer.offsetX = 0;
            state.viewer.offsetY = 0;
          }
          applyViewerTransform(state);
          return;
        }
      }
      if (!state.viewer.dragging) return;
      var dx = ev.clientX - state.viewer.dragStartX;
      var dy = ev.clientY - state.viewer.dragStartY;
      state.viewer.dragStartX = ev.clientX;
      state.viewer.dragStartY = ev.clientY;
      state.viewer.offsetX += dx;
      state.viewer.offsetY += dy;
      applyViewerTransform(state);
    });
    globalScope.addEventListener("pointerup", function onPointerUp(ev) {
      var pointers = getViewerPointers(state);
      delete pointers[ev.pointerId];
      updateViewerPointersAfterPointerUp(state);
    });
    globalScope.addEventListener("pointercancel", function onPointerCancel(ev) {
      var pointers = getViewerPointers(state);
      delete pointers[ev.pointerId];
      updateViewerPointersAfterPointerUp(state);
    });
    globalScope.addEventListener("keydown", function onKeyDown(ev) {
      if (!state.viewer.isOpen) return;
      if (ev.key === "Escape") {
        ev.preventDefault();
        closeViewer(state, { fromPopstate: false });
      }
    });
    globalScope.addEventListener("popstate", function onPopState() {
      if (!state.viewer.isOpen) return;
      closeViewer(state, { fromPopstate: true });
    });
  }

  function init() {
    var storeApi = globalScope.Fase3DataStoreLocal;
    if (!storeApi) return;
    var store = resolveStore(globalScope);

    var state = {
      store: store,
      pendingRows: [],
      currentCase: null,
      uiAlergenInputs: [],
      photoVariantCache: Object.create(null),
      photoVariantUsedAt: Object.create(null),
      photoVariantLoading: Object.create(null),
      viewer: {
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        dragging: false,
        dragStartX: 0,
        dragStartY: 0,
        pointers: Object.create(null),
        pinchDistance: 0,
        pinchZoom: 1,
        pinchCenterX: 0,
        pinchCenterY: 0,
        isOpen: false,
        historyPushed: false,
        historyMarker: null,
        scrollYBeforeOpen: 0
      },
      el: {
        pendingCount: byId("pendientes-count"),
        pendingTable: byId("pendientes-table"),
        reload: byId("recargar-pendientes"),
        exit: byId("cancelar-global"),
        output: byId("salida-json"),
        draftId: byId("draft-id"),
        nombre: byId("nombre-final"),
        formato: byId("formato-final"),
        trazas: byId("trazas-finales"),
        allergenGrid: byId("alergenos-grid"),
        photos: byId("foto-miniaturas"),
        passportBadge: byId("pasaporte-badge"),
        passportMsg: byId("pasaporte-msg"),
        guardar: byId("confirmar"),
        cancelar: byId("cancelar"),
        viewerModal: byId("viewer-modal"),
        viewerStage: byId("viewer-stage"),
        viewerImage: byId("viewer-image"),
        viewerClose: byId("viewer-close")
      }
    };

    ensureAllergenGrid(state);
    bindViewer(state);
    renderPendingList(state);
    openCaseByDraftId(state, parseRequestedDraftId());

    state.el.reload.addEventListener("click", function onReload() {
      renderPendingList(state);
      openCaseByDraftId(state, state.currentCase ? state.currentCase.draftId : "");
    });

    state.el.exit.addEventListener("click", function onExit() {
      globalScope.location.href = "alta_foto.html";
    });

    state.el.guardar.addEventListener("click", function onSaveClick() {
      onGuardar(state).catch(function onErr(err) {
        printJson(state.el.output, {
          ok: false,
          error: {
            code: "REV_GUARDAR_EXCEPTION",
            message: err && err.message ? err.message : String(err)
          }
        });
      });
    });

    state.el.cancelar.addEventListener("click", function onCancelClick() {
      onCancelar(state);
    });
  }

  if (typeof document === "undefined") return;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function onReady() {
      try {
        init();
      } catch (err) {
        var out = byId("salida-json");
        if (out) {
          out.textContent = JSON.stringify({
            ok: false,
            error: {
              code: "REV_INIT_FAILED",
              message: err && err.message ? err.message : String(err)
            }
          }, null, 2);
        }
      }
    });
    return;
  }

  try {
    init();
  } catch (err) {
    var outDirect = byId("salida-json");
    if (outDirect) {
      outDirect.textContent = JSON.stringify({
        ok: false,
        error: {
          code: "REV_INIT_FAILED",
          message: err && err.message ? err.message : String(err)
        }
      }, null, 2);
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

