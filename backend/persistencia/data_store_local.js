(function initDataStoreModule(globalScope) {
  "use strict";

  var PRODUCT_NAME_MAX_LENGTH = 63;

  var allergenCatalog = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      allergenCatalog = require("../../shared/alergenos_oficiales.js");
    } catch (errRequire) {
      allergenCatalog = null;
    }
  }
  if (!allergenCatalog && globalScope && globalScope.AppV2AlergenosOficiales) {
    allergenCatalog = globalScope.AppV2AlergenosOficiales;
  }

  function normalizeName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeFormat(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/,/g, ".")
      .replace(/\s+/g, " ")
      .trim();
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    var safePrefix = String(prefix || "id").trim() || "id";
    return safePrefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function cloneRecord(record) {
    return JSON.parse(JSON.stringify(record));
  }

  function toAllergenList(input) {
    if (allergenCatalog && typeof allergenCatalog.normalizeAllergenList === "function") {
      return allergenCatalog.normalizeAllergenList(input);
    }
    if (!Array.isArray(input)) return [];
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < input.length; i += 1) {
      var item = String(input[i] || "").trim().toLowerCase();
      if (!item || seen[item]) continue;
      seen[item] = true;
      out.push(item);
    }
    return out.sort();
  }

  function createMemoryProductStore() {
    var byId = new Map();
    var byName = new Map();
    var draftsById = new Map();
    var changeListeners = new Set();
    var MAX_CLOSED_DRAFTS = 12;

    function toPositiveInt(value, fallback) {
      var n = Number(value);
      if (!Number.isFinite(n) || n <= 0) return fallback;
      return Math.floor(n);
    }

    function isAllowedVisualSrc(value) {
      var safe = String(value || "").trim();
      return /^https?:\/\//i.test(safe);
    }

    function isInlineDataUrl(value) {
      return /^data:image\//i.test(String(value || "").trim());
    }

    function sanitizeVisualRef(value) {
      var safe = String(value || "").trim();
      return safe && !isInlineDataUrl(safe) ? safe : "";
    }

    function buildCommercialState(input) {
      var safeInput = input || {};
      var comercialIn = safeInput.comercial && typeof safeInput.comercial === "object"
        ? safeInput.comercial
        : safeInput;
      var formato = String(comercialIn.formato || safeInput.formato || "").trim();
      var formatoNormalizado = String(
        comercialIn.formatoNormalizado ||
        comercialIn.formato_normalizado ||
        safeInput.formatoNormalizado ||
        safeInput.formato_normalizado ||
        ""
      ).trim();
      if (!formatoNormalizado && formato) {
        formatoNormalizado = normalizeFormat(formato);
      }
      if (!formato && !formatoNormalizado) return null;
      return {
        formato: formato || formatoNormalizado,
        formatoNormalizado: formatoNormalizado || normalizeFormat(formato),
        tipoFormato: String(
          comercialIn.tipoFormato ||
          comercialIn.tipo ||
          safeInput.tipoFormato ||
          safeInput.tipo ||
          "desconocido"
        ).trim() || "desconocido"
      };
    }

    function buildHydratedProductRecord(input) {
      var safeInput = input || {};
      var nombre = String(
        safeInput.identidad && safeInput.identidad.nombre != null
          ? safeInput.identidad.nombre
          : safeInput.nombre
      ).trim();
      var nombreNormalizado = normalizeName(
        safeInput.identidad && safeInput.identidad.nombreNormalizado
          ? safeInput.identidad.nombreNormalizado
          : nombre
      );
      if (!nombre || !nombreNormalizado || nombreNormalizado.length < 3) return null;

      var now = nowIso();
      var sistemaIn = safeInput.sistema || {};
      var analisisIn = safeInput.analisis || {};
      var comercial = buildCommercialState(safeInput);
      var record = {
        schemaVersion: toPositiveInt(safeInput.schemaVersion, 1),
        id: String(safeInput.id || "").trim() || makeId("prd"),
        identidad: {
          nombre: nombre,
          nombreNormalizado: nombreNormalizado
        },
        alergenos: toAllergenList(safeInput.alergenos),
        analisis: {
          origenAlta: String(analisisIn.origenAlta || "manual"),
          estadoPasaporte: analisisIn.estadoPasaporte != null ? analisisIn.estadoPasaporte : null,
          requiereRevision: !!analisisIn.requiereRevision
        },
        sistema: {
          estadoRegistro: String(sistemaIn.estadoRegistro || "ACTIVO").trim() || "ACTIVO",
          syncState: String(sistemaIn.syncState || "LOCAL_ONLY").trim() || "LOCAL_ONLY",
          dirty: !!sistemaIn.dirty,
          rowVersion: toPositiveInt(sistemaIn.rowVersion, 1),
          lastSyncedAt: sistemaIn.lastSyncedAt != null ? String(sistemaIn.lastSyncedAt || "").trim() || null : null,
          createdAt: String(sistemaIn.createdAt || "").trim() || now,
          updatedAt: String(sistemaIn.updatedAt || "").trim() || now,
          deletedAt: sistemaIn.deletedAt != null ? String(sistemaIn.deletedAt || "").trim() || null : null
        }
      };

      if (comercial) {
        record.comercial = comercial;
      }
      if (analisisIn.legacy) {
        record.analisis.legacy = cloneRecord(analisisIn.legacy);
      }
      if (safeInput.legacy) {
        record.legacy = cloneRecord(safeInput.legacy);
      }
      var visual = buildProductVisualState(
        safeInput.visual && typeof safeInput.visual === "object"
          ? safeInput.visual
          : {
              fotoRefs: safeInput.fotoRefs,
              visuales: safeInput.visuales
            }
      );
      if (visual) {
        record.visual = visual;
      }

      return record;
    }

    function emitChange(eventType, payload) {
      var listeners = Array.from(changeListeners.values());
      for (var i = 0; i < listeners.length; i += 1) {
        var cb = listeners[i];
        if (typeof cb !== "function") continue;
        try {
          cb({
            type: String(eventType || "change"),
            payload: payload ? cloneRecord(payload) : null,
            at: nowIso()
          });
        } catch (errListener) {
          // No-op.
        }
      }
    }

    function buildHydratedDraftRecord(input) {
      var safeInput = input || {};
      var now = nowIso();
      var propuestaIn = safeInput.propuesta || {};
      var evidenciaIn = safeInput.evidencia || {};
      var metadatosIn = safeInput.metadatos || {};
      var draftId = String(safeInput.draftId || "").trim() || makeId("draft");
      var origenAlta = String(safeInput.origenAlta || "foto").trim() || "foto";
      var fotoRefs = Array.isArray(evidenciaIn.fotoRefs)
        ? evidenciaIn.fotoRefs
            .map(function mapRef(ref) { return String(ref || "").trim(); })
            .filter(Boolean)
            .slice(0, 2)
        : [];
      var visuales = toDraftVisualList(evidenciaIn.visuales, fotoRefs);
      if (!fotoRefs.length && origenAlta !== "excel") return null;

      return {
        draftId: draftId,
        estado: String(safeInput.estado || "PENDIENTE_REVISION").trim() || "PENDIENTE_REVISION",
        origenAlta: origenAlta,
        propuesta: {
          nombre: String(propuestaIn.nombre || "Producto por revisar").trim() || "Producto por revisar",
          alergenos: toAllergenList(propuestaIn.alergenos)
        },
        evidencia: {
          fotoRefs: fotoRefs,
          visuales: visuales
        },
        metadatos: {
          createdAt: String(metadatosIn.createdAt || "").trim() || now,
          updatedAt: String(metadatosIn.updatedAt || "").trim() || now
        },
        resultadoBoxer: safeInput.resultadoBoxer != null ? cloneRecord(safeInput.resultadoBoxer) : null,
        resolucion: safeInput.resolucion != null ? cloneRecord(safeInput.resolucion) : null
      };
    }

    function toDraftVisualList(input, fotoRefs) {
      var refs = Array.isArray(fotoRefs)
        ? fotoRefs.map(sanitizeVisualRef).filter(Boolean).slice(0, 2)
        : [];
      var items = Array.isArray(input) ? input : [];
      var out = [];
      for (var i = 0; i < refs.length; i += 1) {
        var ref = String(refs[i] || "").trim();
        if (!ref) continue;
        var raw = items[i] && typeof items[i] === "object" ? items[i] : {};
        var thumbSrc = String(raw.thumbSrc || "").trim();
        var viewerSrc = String(raw.viewerSrc || "").trim();
        if (!thumbSrc && !viewerSrc) continue;
        out.push({
          ref: String(raw.ref || ref).trim() || ref,
          thumbSrc: thumbSrc || viewerSrc || ref,
          viewerSrc: viewerSrc || thumbSrc || ref,
          profileKey: String(raw.profileKey || "").trim() || null,
          qualityPct: toPositiveInt(raw.qualityPct, null),
          resolutionMaxPx: toPositiveInt(raw.resolutionMaxPx, null),
          generatedAt: String(raw.generatedAt || "").trim() || null
        });
      }
      return out;
    }

    function toProductVisualList(input, fotoRefs) {
      var refs = Array.isArray(fotoRefs) ? fotoRefs.slice(0, 2) : [];
      var items = Array.isArray(input) ? input : [];
      var resolvedRefs = refs.slice(0);
      var out = [];
      var i;

      for (i = 0; i < items.length && resolvedRefs.length < 2; i += 1) {
        var itemRef = items[i] && typeof items[i] === "object"
          ? sanitizeVisualRef(items[i].ref)
          : "";
        if (!itemRef || resolvedRefs.indexOf(itemRef) >= 0) continue;
        resolvedRefs.push(itemRef);
      }

      for (i = 0; i < resolvedRefs.length && i < 2; i += 1) {
        var ref = sanitizeVisualRef(resolvedRefs[i]);
        var raw = items[i] && typeof items[i] === "object" ? items[i] : {};
        if (!ref && !raw.ref) continue;
        var thumbSrc = String(raw.thumbSrc || "").trim();
        var viewerSrc = String(raw.viewerSrc || "").trim();
        var visualRef = sanitizeVisualRef(raw.ref || ref);
        if (!visualRef) continue;
        out.push({
          ref: visualRef,
          thumbSrc: isAllowedVisualSrc(thumbSrc) ? thumbSrc : null,
          viewerSrc: isAllowedVisualSrc(viewerSrc) ? viewerSrc : null,
          profileKey: String(raw.profileKey || "").trim() || null,
          qualityPct: toPositiveInt(raw.qualityPct, null),
          resolutionMaxPx: toPositiveInt(raw.resolutionMaxPx, null),
          generatedAt: String(raw.generatedAt || "").trim() || null
        });
      }

      return out;
    }

    function buildProductVisualState(input) {
      var safeInput = input || {};
      var fotoRefs = Array.isArray(safeInput.fotoRefs)
        ? safeInput.fotoRefs
            .map(sanitizeVisualRef)
            .filter(Boolean)
            .slice(0, 2)
        : [];
      var visuales = toProductVisualList(safeInput.visuales, fotoRefs);

      if (!fotoRefs.length && visuales.length) {
        fotoRefs = visuales
          .map(function mapVisual(item) { return String(item && item.ref || "").trim(); })
          .filter(Boolean)
          .slice(0, 2);
      }

      if (!fotoRefs.length && !visuales.length) return null;

      return {
        fotoRefs: fotoRefs,
        visuales: visuales,
        updatedAt: String(safeInput.updatedAt || "").trim() || nowIso()
      };
    }

    function mergeProductVisualState(currentState, nextState) {
      if (!nextState) return currentState ? cloneRecord(currentState) : null;
      if (!currentState) return cloneRecord(nextState);

      var refs = [];
      var visualsByRef = Object.create(null);

      function pushRef(ref) {
        var safeRef = sanitizeVisualRef(ref);
        if (!safeRef || refs.indexOf(safeRef) >= 0 || refs.length >= 2) return;
        refs.push(safeRef);
      }

      function mergeVisual(raw) {
        if (!raw || typeof raw !== "object") return;
        var ref = sanitizeVisualRef(raw.ref);
        if (!ref) return;
        var current = visualsByRef[ref] || { ref: ref };
        var thumbSrc = String(raw.thumbSrc || "").trim();
        var viewerSrc = String(raw.viewerSrc || "").trim();
        current.thumbSrc = isAllowedVisualSrc(thumbSrc)
          ? thumbSrc
          : (String(current.thumbSrc || "").trim() || null);
        current.viewerSrc = isAllowedVisualSrc(viewerSrc)
          ? viewerSrc
          : (String(current.viewerSrc || "").trim() || null);
        current.profileKey = String(raw.profileKey || current.profileKey || "").trim() || null;
        current.qualityPct = toPositiveInt(raw.qualityPct, current.qualityPct || null);
        current.resolutionMaxPx = toPositiveInt(raw.resolutionMaxPx, current.resolutionMaxPx || null);
        current.generatedAt = String(raw.generatedAt || current.generatedAt || "").trim() || null;
        visualsByRef[ref] = current;
        pushRef(ref);
      }

      (Array.isArray(currentState.fotoRefs) ? currentState.fotoRefs : []).forEach(pushRef);
      (Array.isArray(nextState.fotoRefs) ? nextState.fotoRefs : []).forEach(pushRef);
      (Array.isArray(currentState.visuales) ? currentState.visuales : []).forEach(mergeVisual);
      (Array.isArray(nextState.visuales) ? nextState.visuales : []).forEach(mergeVisual);

      return {
        fotoRefs: refs,
        visuales: refs.map(function mapRef(ref) {
          var visual = visualsByRef[ref] || { ref: ref };
          return {
            ref: ref,
            thumbSrc: String(visual.thumbSrc || "").trim() || null,
            viewerSrc: String(visual.viewerSrc || "").trim() || null,
            profileKey: String(visual.profileKey || "").trim() || null,
            qualityPct: toPositiveInt(visual.qualityPct, null),
            resolutionMaxPx: toPositiveInt(visual.resolutionMaxPx, null),
            generatedAt: String(visual.generatedAt || "").trim() || null
          };
        }),
        updatedAt: String(nextState.updatedAt || currentState.updatedAt || "").trim() || nowIso()
      };
    }

    function hasVisualStateContent(visualState) {
      var safeVisual = visualState && typeof visualState === "object" ? visualState : null;
      if (!safeVisual) return false;
      var refs = Array.isArray(safeVisual.fotoRefs) ? safeVisual.fotoRefs : [];
      for (var i = 0; i < refs.length; i += 1) {
        if (String(refs[i] || "").trim()) return true;
      }
      var visuales = Array.isArray(safeVisual.visuales) ? safeVisual.visuales : [];
      for (var j = 0; j < visuales.length; j += 1) {
        var entry = visuales[j] && typeof visuales[j] === "object" ? visuales[j] : null;
        if (!entry) continue;
        if (String(entry.ref || "").trim()) return true;
        if (isAllowedVisualSrc(entry.thumbSrc) || isAllowedVisualSrc(entry.viewerSrc)) return true;
      }
      return false;
    }

    function hasExplicitVisualDeleteSignal(record) {
      var safeRecord = record && typeof record === "object" ? record : null;
      if (!safeRecord) return false;
      if (safeRecord.visualDeleted === true || safeRecord.assetDeleted === true) return true;
      var visual = safeRecord.visual && typeof safeRecord.visual === "object" ? safeRecord.visual : null;
      if (!visual) return false;
      if (visual.deleted === true) return true;
      if (String(visual.estado || "").trim().toUpperCase() === "DELETED") return true;
      var visualSistema = visual.sistema && typeof visual.sistema === "object" ? visual.sistema : null;
      if (visualSistema && String(visualSistema.estadoRegistro || "").trim().toUpperCase() === "BORRADO_SUAVE") {
        return true;
      }
      return false;
    }

    function compareRecords(a, b) {
      var nameA = a && a.identidad ? String(a.identidad.nombreNormalizado || "") : "";
      var nameB = b && b.identidad ? String(b.identidad.nombreNormalizado || "") : "";
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;

      var idA = a ? String(a.id || "") : "";
      var idB = b ? String(b.id || "") : "";
      if (idA < idB) return -1;
      if (idA > idB) return 1;
      return 0;
    }

    function matchesSearch(record, rawSearchText) {
      var searchText = normalizeName(rawSearchText);
      if (!searchText) return true;

      var nombre = record && record.identidad
        ? String(record.identidad.nombreNormalizado || record.identidad.nombre || "")
        : "";
      var alergenos = Array.isArray(record && record.alergenos) ? record.alergenos.join(" ") : "";
      var formato = record && record.comercial
        ? String(record.comercial.formatoNormalizado || record.comercial.formato || "")
        : "";
      var haystack = normalizeName(nombre + " " + formato + " " + alergenos);
      return haystack.indexOf(searchText) >= 0;
    }

    function countPendingUploadProducts(options) {
      var includeDeleted = !!(options && options.includeDeleted);
      var count = 0;
      byId.forEach(function eachRecord(record) {
        if (!(record && record.sistema && record.sistema.dirty === true)) return;
        if (!includeDeleted && record.sistema.estadoRegistro !== "ACTIVO") return;
        count += 1;
      });
      return count;
    }

    function countActiveProducts() {
      var count = 0;
      byId.forEach(function eachRecord(record) {
        if (record && record.sistema && record.sistema.estadoRegistro === "ACTIVO") {
          count += 1;
        }
      });
      return count;
    }

    function countPendingRevisionDrafts() {
      var count = 0;
      draftsById.forEach(function eachDraft(draft) {
        if (draft && draft.estado === "PENDIENTE_REVISION") count += 1;
      });
      return count;
    }

    function isClosedDraftState(value) {
      var state = String(value || "").trim().toUpperCase();
      return state === "CONFIRMADO_GUARDADO" || state === "CANCELADO";
    }

    function draftUpdatedAtMs(draft) {
      if (!draft || !draft.metadatos) return 0;
      return Date.parse(String(draft.metadatos.updatedAt || draft.metadatos.createdAt || "")) || 0;
    }

    function pruneClosedDrafts() {
      var openDrafts = [];
      var closedDrafts = [];
      draftsById.forEach(function eachDraft(draft) {
        if (!draft || !draft.draftId) return;
        if (isClosedDraftState(draft.estado)) {
          closedDrafts.push(draft);
          return;
        }
        openDrafts.push(draft);
      });

      if (closedDrafts.length <= MAX_CLOSED_DRAFTS) return 0;

      closedDrafts.sort(function byRecent(a, b) {
        var aMs = draftUpdatedAtMs(a);
        var bMs = draftUpdatedAtMs(b);
        if (aMs !== bMs) return bMs - aMs;
        return String(b.draftId || "").localeCompare(String(a.draftId || ""));
      });

      var removed = 0;
      for (var i = MAX_CLOSED_DRAFTS; i < closedDrafts.length; i += 1) {
        var draft = closedDrafts[i];
        if (!draft || !draft.draftId) continue;
        if (draftsById.delete(draft.draftId)) removed += 1;
      }
      return removed;
    }

    function createOrMergeByNormalizedName(input) {
      var rawName = String(input && input.nombre ? input.nombre : "").trim();
      var normalized = normalizeName(rawName);
      if (!normalized || normalized.length < 3) {
        return {
          ok: false,
          errorCode: "DATA_NOMBRE_INVALIDO",
          message: "Nombre obligatorio (minimo 3 caracteres utiles)."
        };
      }
      if (rawName.length > PRODUCT_NAME_MAX_LENGTH) {
        return {
          ok: false,
          errorCode: "DATA_NOMBRE_MAXIMO_EXCEDIDO",
          message: "Nombre demasiado largo (maximo 63 caracteres)."
        };
      }

      var allergens = toAllergenList(input && input.alergenos);
      var now = nowIso();
      var existingId = byName.get(normalized);
      var nextVisual = buildProductVisualState({
        fotoRefs: input && input.fotoRefs,
        visuales: input && input.visuales,
        updatedAt: now
      });
      var nextCommercial = buildCommercialState(input);

      if (existingId) {
        var existing = byId.get(existingId);
        var mergedAllergens = toAllergenList((existing.alergenos || []).concat(allergens));
        existing.alergenos = mergedAllergens;
        if (nextCommercial) {
          existing.comercial = nextCommercial;
        }
        if (nextVisual) {
          existing.visual = mergeProductVisualState(existing.visual || null, nextVisual);
        }
        existing.sistema.rowVersion += 1;
        existing.sistema.updatedAt = now;
        existing.sistema.dirty = true;
        existing.sistema.syncState = "LOCAL_ONLY";
        emitChange("product_upsert_local", existing);
        return { ok: true, merged: true, record: cloneRecord(existing) };
      }

      var record = {
        schemaVersion: 1,
        id: makeId("prd"),
        identidad: {
          nombre: rawName,
          nombreNormalizado: normalized
        },
        alergenos: allergens,
        analisis: {
          origenAlta: String(input && input.origenAlta ? input.origenAlta : "manual"),
          estadoPasaporte: null,
          requiereRevision: false
        },
        sistema: {
          estadoRegistro: "ACTIVO",
          syncState: "LOCAL_ONLY",
          dirty: true,
          rowVersion: 1,
          lastSyncedAt: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null
        }
      };
      if (nextVisual) {
        record.visual = nextVisual;
      }
      if (nextCommercial) {
        record.comercial = nextCommercial;
      }

      byId.set(record.id, record);
      byName.set(normalized, record.id);
      emitChange("product_create_local", record);
      return { ok: true, merged: false, record: cloneRecord(record) };
    }

    function createRevisionDraft(input) {
      var safeInput = input || {};
      var origenAlta = String(safeInput.origenAlta || "foto").trim() || "foto";
      var fotoRefsRaw = Array.isArray(safeInput.fotoRefs) ? safeInput.fotoRefs : [];
      var fotoRefs = fotoRefsRaw
        .map(function mapRef(ref) { return String(ref || "").trim(); })
        .filter(Boolean)
        .slice(0, 2);
      if (!fotoRefs.length && origenAlta !== "excel") {
        return {
          ok: false,
          errorCode: "DATA_DRAFT_SIN_FOTOS",
          message: "No se puede crear borrador sin foto."
        };
      }

      var nombrePropuesto = String(safeInput.nombrePropuesto || "").trim();
      var alergenosPropuestos = toAllergenList(safeInput.alergenosPropuestos);
      var now = nowIso();
      var visuales = toDraftVisualList(safeInput.visuales, fotoRefs);

      var draft = {
        draftId: makeId("draft"),
        estado: "PENDIENTE_REVISION",
        origenAlta: origenAlta,
        propuesta: {
          nombre: nombrePropuesto || "Producto por revisar",
          alergenos: alergenosPropuestos
        },
        evidencia: {
          fotoRefs: fotoRefs,
          visuales: visuales
        },
        metadatos: {
          createdAt: now,
          updatedAt: now
        },
        resultadoBoxer: safeInput.resultadoBoxer || null
      };

      draftsById.set(draft.draftId, draft);
      emitChange("draft_create", draft);
      return { ok: true, draft: cloneRecord(draft) };
    }

    function getProductById(productId) {
      var id = String(productId || "").trim();
      if (!id) return null;
      var found = byId.get(id);
      return found ? cloneRecord(found) : null;
    }

    function listActiveProducts() {
      return Array.from(byId.values())
        .filter(function isActive(record) {
          return record && record.sistema && record.sistema.estadoRegistro === "ACTIVO";
        })
        .map(cloneRecord);
    }

    function listPendingUploadProducts(options) {
      var includeDeleted = !!(options && options.includeDeleted);
      var items = [];
      byId.forEach(function eachRecord(record) {
        if (!(record && record.sistema && record.sistema.dirty === true)) return;
        if (!includeDeleted && record.sistema.estadoRegistro !== "ACTIVO") return;
        items.push(cloneRecord(record));
      });
      return items;
    }

    function queryProductsForUi(options) {
      var safeOptions = options || {};
      var onlyPending = !!safeOptions.onlyPending;
      var includeDeleted = !!safeOptions.includeDeleted;
      var searchText = String(safeOptions.searchText || "").trim();
      var offset = Math.max(0, Number(safeOptions.offset) || 0);
      var limit = Math.max(0, Number(safeOptions.limit) || 0);
      var matches = [];

      byId.forEach(function eachRecord(record) {
        if (!(record && record.sistema)) return;
        if (!includeDeleted && record.sistema.estadoRegistro !== "ACTIVO") return;
        if (onlyPending && record.sistema.dirty !== true) return;
        if (!matchesSearch(record, searchText)) return;
        matches.push(record);
      });

      matches.sort(compareRecords);

      var total = matches.length;
      var end = limit > 0 ? Math.min(total, offset + limit) : total;
      var visible = [];
      for (var i = offset; i < end; i += 1) {
        visible.push(cloneRecord(matches[i]));
      }

      return {
        ok: true,
        total: total,
        offset: offset,
        limit: limit,
        visible: visible.length,
        hasMore: end < total,
        items: visible
      };
    }

    function listProductsForUi(options) {
      return queryProductsForUi(options).items;
    }

    function replaceAllProducts(records, options) {
      var safeOptions = options || {};
      var items = Array.isArray(records) ? records : [];
      var hydrated = [];
      for (var i = 0; i < items.length; i += 1) {
        var record = buildHydratedProductRecord(items[i]);
        if (!record) continue;
        hydrated.push(record);
      }

      if (!hydrated.length && byId.size > 0 && safeOptions.allowEmptyReplace !== true) {
        return {
          ok: false,
          skipped: true,
          reason: "EMPTY_REPLACE_BLOCKED",
          loaded: byId.size,
          previous: byId.size
        };
      }

      byId.clear();
      byName.clear();

      var loaded = 0;
      for (var j = 0; j < hydrated.length; j += 1) {
        var record = hydrated[j];
        byId.set(record.id, record);
        byName.set(record.identidad.nombreNormalizado, record.id);
        loaded += 1;
      }
      emitChange("products_replace_all", { loaded: loaded });

      return {
        ok: true,
        loaded: loaded
      };
    }

    function replaceRevisionDrafts(records) {
      var items = Array.isArray(records) ? records : [];
      draftsById.clear();

      var loaded = 0;
      for (var i = 0; i < items.length; i += 1) {
        var draft = buildHydratedDraftRecord(items[i]);
        if (!draft) continue;
        draftsById.set(draft.draftId, draft);
        loaded += 1;
      }
      pruneClosedDrafts();
      emitChange("drafts_replace_all", { loaded: loaded });

      return {
        ok: true,
        loaded: loaded
      };
    }

    function maxIso(a, b) {
      var aMs = Date.parse(String(a || "")) || 0;
      var bMs = Date.parse(String(b || "")) || 0;
      return bMs > aMs ? b : a;
    }

    function fusionarRemotoCambios(records, options) {
      var safeOptions = options || {};
      var conflictosApi = safeOptions.conflictosApi || null;
      var tombstoneApi = safeOptions.tombstoneApi || null;
      var items = Array.isArray(records) ? records : [];
      var out = {
        ok: true,
        total: items.length,
        applied: 0,
        skippedPending: 0,
        zombieBlocked: 0,
        deletedApplied: 0,
        conflicts: [],
        maxUpdatedAt: null
      };

      for (var i = 0; i < items.length; i += 1) {
        var incoming = items[i] || {};
        var incomingId = String(incoming.id || "").trim();
        if (!incomingId) continue;
        var local = byId.get(incomingId) || null;
        var localPending = !!(local && local.sistema && local.sistema.dirty === true);
        var incomingDeleted = incoming.deleted === true ||
          (incoming.sistema && String(incoming.sistema.estadoRegistro || "").toUpperCase() !== "ACTIVO");
        var incomingUpdatedAt = incoming.sistema && incoming.sistema.updatedAt
          ? String(incoming.sistema.updatedAt)
          : (incoming.updatedAtServer ? String(incoming.updatedAtServer) : null);
        out.maxUpdatedAt = maxIso(out.maxUpdatedAt, incomingUpdatedAt);

        if (
          !incomingDeleted &&
          tombstoneApi &&
          typeof tombstoneApi.isDeleted === "function" &&
          tombstoneApi.isDeleted(incomingId)
        ) {
          out.zombieBlocked += 1;
          out.conflicts.push({
            productId: incomingId,
            kind: "ZOMBIE_BLOCKED",
            action: "IGNORE_REMOTE_ACTIVE"
          });
          continue;
        }

        if (incomingDeleted) {
          if (localPending) {
            var conflictDelete = {
              productId: incomingId,
              kind: "DELETE_VS_EDIT",
              action: "KEEP_LOCAL_PENDING"
            };
            out.conflicts.push(conflictDelete);
            continue;
          }
          if (local) {
            byId.delete(incomingId);
            if (local.identidad && local.identidad.nombreNormalizado) {
              byName.delete(local.identidad.nombreNormalizado);
            }
            out.deletedApplied += 1;
            out.applied += 1;
            emitChange("product_delete_remote_applied", { id: incomingId });
          }
          if (tombstoneApi && typeof tombstoneApi.markDeleted === "function") {
            tombstoneApi.markDeleted(incomingId);
          }
          continue;
        }

        if (localPending) {
          if (conflictosApi && typeof conflictosApi.decideConflict === "function") {
            var decision = conflictosApi.decideConflict({
              localRecord: cloneRecord(local),
              remoteRecord: cloneRecord(incoming),
              context: "remote_merge"
            });
            if (decision && decision.action === "APPLY_REMOTE") {
              // Sigue flujo de aplicacion remota.
            } else {
              out.skippedPending += 1;
              if (decision && decision.kind && decision.kind !== "NO_CONFLICT") {
                out.conflicts.push({
                  productId: incomingId,
                  kind: decision.kind,
                  action: decision.action || "KEEP_LOCAL_PENDING"
                });
              }
              continue;
            }
          } else {
            out.skippedPending += 1;
            continue;
          }
        }

        var hydrated = buildHydratedProductRecord(incoming);
        if (!hydrated) continue;
        if (
          local &&
          !hasExplicitVisualDeleteSignal(incoming) &&
          !hasVisualStateContent(hydrated.visual) &&
          hasVisualStateContent(local.visual)
        ) {
          hydrated.visual = cloneRecord(local.visual);
        }
        hydrated.sistema.dirty = false;
        hydrated.sistema.syncState = "SYNCED";
        hydrated.sistema.lastSyncedAt = incomingUpdatedAt || nowIso();
        byId.set(hydrated.id, hydrated);
        if (hydrated.identidad && hydrated.identidad.nombreNormalizado) {
          byName.set(hydrated.identidad.nombreNormalizado, hydrated.id);
        }
        out.applied += 1;
        emitChange("product_remote_applied", hydrated);
      }

      return out;
    }

    function subscribeChanges(callback) {
      if (typeof callback !== "function") {
        return function noop() {};
      }
      changeListeners.add(callback);
      return function unsubscribe() {
        changeListeners.delete(callback);
      };
    }

    function updateProductById(input) {
      var safeInput = input || {};
      var productId = String(safeInput.productId || "").trim();
      if (!productId) {
        return {
          ok: false,
          errorCode: "DATA_PRODUCT_ID_INVALIDO",
          message: "Falta productId para editar."
        };
      }

      var record = byId.get(productId);
      if (!record) {
        return {
          ok: false,
          errorCode: "DATA_PRODUCTO_NO_ENCONTRADO",
          message: "Producto no encontrado."
        };
      }
      if (!record.sistema || record.sistema.estadoRegistro !== "ACTIVO") {
        return {
          ok: false,
          errorCode: "DATA_PRODUCTO_NO_EDITABLE",
          message: "Solo se puede editar un producto activo."
        };
      }

      var targetName = String(
        safeInput.nombre != null ? safeInput.nombre : record.identidad.nombre
      ).trim();
      var normalized = normalizeName(targetName);
      if (!normalized || normalized.length < 3) {
        return {
          ok: false,
          errorCode: "DATA_NOMBRE_INVALIDO",
          message: "Nombre obligatorio (minimo 3 caracteres utiles)."
        };
      }
      if (targetName.length > PRODUCT_NAME_MAX_LENGTH) {
        return {
          ok: false,
          errorCode: "DATA_NOMBRE_MAXIMO_EXCEDIDO",
          message: "Nombre demasiado largo (maximo 63 caracteres)."
        };
      }

      var existingId = byName.get(normalized);
      if (existingId && existingId !== record.id) {
        return {
          ok: false,
          errorCode: "DATA_DUPLICADO_EXACTO_CON_OTRO_REGISTRO",
          message: "Nombre normalizado ya existe en otro producto activo."
        };
      }

      var targetAllergens = Array.isArray(safeInput.alergenos)
        ? toAllergenList(safeInput.alergenos)
        : toAllergenList(record.alergenos);
      var now = nowIso();
      var nextVisual = buildProductVisualState(
        safeInput.visual && typeof safeInput.visual === "object"
          ? Object.assign({}, safeInput.visual, { updatedAt: now })
          : {
              fotoRefs: safeInput.fotoRefs,
              visuales: safeInput.visuales,
              updatedAt: now
            }
      );
      var nextCommercial = buildCommercialState(safeInput);

      if (normalized !== record.identidad.nombreNormalizado) {
        byName.delete(record.identidad.nombreNormalizado);
        byName.set(normalized, record.id);
      }

      record.identidad.nombre = targetName;
      record.identidad.nombreNormalizado = normalized;
      record.alergenos = targetAllergens;
      if (nextCommercial) {
        record.comercial = nextCommercial;
      }
      if (nextVisual) {
        record.visual = mergeProductVisualState(record.visual || null, nextVisual);
      }
      record.sistema.rowVersion += 1;
      record.sistema.updatedAt = now;
      record.sistema.dirty = true;
      record.sistema.syncState = "LOCAL_ONLY";
      emitChange("product_update_local", record);

      return { ok: true, record: cloneRecord(record) };
    }

    function softDeleteProductById(input) {
      var safeInput = input || {};
      var productId = String(safeInput.productId || "").trim();
      if (!productId) {
        return {
          ok: false,
          errorCode: "DATA_PRODUCT_ID_INVALIDO",
          message: "Falta productId para borrado suave."
        };
      }

      var record = byId.get(productId);
      if (!record) {
        return {
          ok: false,
          errorCode: "DATA_PRODUCTO_NO_ENCONTRADO",
          message: "Producto no encontrado."
        };
      }
      if (record.sistema.estadoRegistro !== "ACTIVO") {
        return {
          ok: false,
          errorCode: "DATA_PRODUCTO_NO_BORRABLE",
          message: "El producto ya no esta activo."
        };
      }

      var now = nowIso();
      byName.delete(record.identidad.nombreNormalizado);
      record.sistema.estadoRegistro = "BORRADO_SUAVE";
      record.sistema.deletedAt = now;
      record.sistema.updatedAt = now;
      record.sistema.rowVersion += 1;
      record.sistema.dirty = true;
      record.sistema.syncState = "LOCAL_ONLY";
      emitChange("product_soft_delete_local", record);

      return { ok: true, record: cloneRecord(record) };
    }

    function hardDeleteProductById(input) {
      var safeInput = input || {};
      var productId = String(safeInput.productId || "").trim();
      if (!productId) {
        return {
          ok: false,
          errorCode: "DATA_PRODUCT_ID_INVALIDO",
          message: "Falta productId para borrado real."
        };
      }

      var record = byId.get(productId);
      if (!record) {
        return {
          ok: false,
          errorCode: "DATA_PRODUCTO_NO_ENCONTRADO",
          message: "Producto no encontrado."
        };
      }

      byId.delete(productId);
      byName.delete(record.identidad && record.identidad.nombreNormalizado ? record.identidad.nombreNormalizado : "");
      emitChange("product_hard_delete_local", { id: productId });
      return { ok: true, record: cloneRecord(record) };
    }

    function markProductAsSynced(input) {
      var safeInput = input || {};
      var productId = String(safeInput.productId || "").trim();
      if (!productId) {
        return {
          ok: false,
          errorCode: "DATA_PRODUCT_ID_INVALIDO",
          message: "Falta productId para marcar sincronizado."
        };
      }

      var record = byId.get(productId);
      if (!record) {
        return {
          ok: false,
          errorCode: "DATA_PRODUCTO_NO_ENCONTRADO",
          message: "Producto no encontrado."
        };
      }

      record.sistema.dirty = false;
      record.sistema.syncState = "SYNCED";
      record.sistema.updatedAt = nowIso();
      record.sistema.lastSyncedAt = String(safeInput.syncedAt || record.sistema.updatedAt || nowIso());
      emitChange("product_mark_synced", record);
      return { ok: true, record: cloneRecord(record) };
    }

    function getRevisionDraftById(draftId) {
      var id = String(draftId || "").trim();
      if (!id) return null;
      var found = draftsById.get(id);
      return found ? cloneRecord(found) : null;
    }

    function listPendingRevisionDrafts() {
      return Array.from(draftsById.values())
        .filter(function isPending(draft) { return draft.estado === "PENDIENTE_REVISION"; })
        .map(cloneRecord);
    }

    function confirmRevisionDraft(input) {
      var safeInput = input || {};
      var draftId = String(safeInput.draftId || "").trim();
      if (!draftId) {
        return {
          ok: false,
          errorCode: "DATA_DRAFT_ID_INVALIDO",
          message: "Falta draftId para confirmar revision."
        };
      }

      var draft = draftsById.get(draftId);
      if (!draft) {
        return {
          ok: false,
          errorCode: "DATA_DRAFT_NO_ENCONTRADO",
          message: "Borrador no encontrado."
        };
      }
      if (draft.estado !== "PENDIENTE_REVISION") {
        return {
          ok: false,
          errorCode: "DATA_DRAFT_NO_CONFIRMABLE",
          message: "El borrador ya no esta pendiente de revision."
        };
      }

      var nombreFinal = String(
        safeInput.nombreFinal || (draft.propuesta && draft.propuesta.nombre) || ""
      ).trim();
      var alergenosFinales = toAllergenList(
        Array.isArray(safeInput.alergenosFinales)
          ? safeInput.alergenosFinales
          : (draft.propuesta && draft.propuesta.alergenos)
      );

      var persist = createOrMergeByNormalizedName({
        nombre: nombreFinal,
        alergenos: alergenosFinales,
        origenAlta: "foto",
        fotoRefs: draft.evidencia && Array.isArray(draft.evidencia.fotoRefs) ? draft.evidencia.fotoRefs.slice(0, 2) : [],
        visuales: draft.evidencia && Array.isArray(draft.evidencia.visuales) ? cloneRecord(draft.evidencia.visuales).slice(0, 2) : []
      });
      if (!persist || persist.ok !== true) {
        return {
          ok: false,
          errorCode: (persist && persist.errorCode) || "DATA_DRAFT_CONFIRM_FAILED",
          message: (persist && persist.message) || "No se pudo guardar el borrador confirmado."
        };
      }

      var now = nowIso();
      draft.estado = "CONFIRMADO_GUARDADO";
      draft.metadatos.updatedAt = now;
      draft.resolucion = {
        tipo: "GUARDADO_LOCAL",
        fusionExacta: !!persist.merged,
        productoId: persist.record.id,
        nombreFinal: persist.record.identidad.nombre
      };

      draftsById.set(draftId, draft);
      pruneClosedDrafts();
      emitChange("draft_confirm", draft);
      return {
        ok: true,
        merged: !!persist.merged,
        record: cloneRecord(persist.record),
        draft: cloneRecord(draft)
      };
    }

    function cancelRevisionDraft(input) {
      var safeInput = input || {};
      var draftId = String(safeInput.draftId || "").trim();
      if (!draftId) {
        return {
          ok: false,
          errorCode: "DATA_DRAFT_ID_INVALIDO",
          message: "Falta draftId para cancelar revision."
        };
      }

      var draft = draftsById.get(draftId);
      if (!draft) {
        return {
          ok: false,
          errorCode: "DATA_DRAFT_NO_ENCONTRADO",
          message: "Borrador no encontrado."
        };
      }
      if (draft.estado !== "PENDIENTE_REVISION") {
        return {
          ok: false,
          errorCode: "DATA_DRAFT_NO_CANCELABLE",
          message: "El borrador ya no esta pendiente de revision."
        };
      }

      draft.estado = "CANCELADO";
      draft.metadatos.updatedAt = nowIso();
      draft.resolucion = {
        tipo: "CANCELADO",
        motivo: String(safeInput.motivo || "").trim() || "cancelado_por_usuario"
      };
      draftsById.set(draftId, draft);
      pruneClosedDrafts();
      emitChange("draft_cancel", draft);
      return { ok: true, draft: cloneRecord(draft) };
    }

    function listRevisionDrafts() {
      return Array.from(draftsById.values()).map(cloneRecord);
    }

    function list() {
      return Array.from(byId.values()).map(cloneRecord);
    }

    return {
      createOrMergeByNormalizedName: createOrMergeByNormalizedName,
      createRevisionDraft: createRevisionDraft,
      getProductById: getProductById,
      updateProductById: updateProductById,
      hardDeleteProductById: hardDeleteProductById,
      softDeleteProductById: softDeleteProductById,
      markProductAsSynced: markProductAsSynced,
      countActiveProducts: countActiveProducts,
      countPendingUploadProducts: countPendingUploadProducts,
      countPendingRevisionDrafts: countPendingRevisionDrafts,
      listActiveProducts: listActiveProducts,
      listPendingUploadProducts: listPendingUploadProducts,
      queryProductsForUi: queryProductsForUi,
      listProductsForUi: listProductsForUi,
      replaceAllProducts: replaceAllProducts,
      replaceRevisionDrafts: replaceRevisionDrafts,
      fusionarRemotoCambios: fusionarRemotoCambios,
      subscribeChanges: subscribeChanges,
      getRevisionDraftById: getRevisionDraftById,
      confirmRevisionDraft: confirmRevisionDraft,
      cancelRevisionDraft: cancelRevisionDraft,
      listRevisionDrafts: listRevisionDrafts,
      listPendingRevisionDrafts: listPendingRevisionDrafts,
      list: list
    };
  }

  var api = {
    normalizeName: normalizeName,
    createMemoryProductStore: createMemoryProductStore,
    ALERGENOS_OFICIALES: allergenCatalog && Array.isArray(allergenCatalog.NOMBRES_OFICIALES)
      ? allergenCatalog.NOMBRES_OFICIALES.slice()
      : []
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase3DataStoreLocal = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

