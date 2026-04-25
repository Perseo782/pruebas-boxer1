(function initLegacyProductosV1MapperModule(globalScope) {
  "use strict";

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

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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

  function nowIso() {
    return new Date().toISOString();
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

  function stableHash(input) {
    var str = String(input || "");
    var hash = 2166136261;
    for (var i = 0; i < str.length; i += 1) {
      hash ^= str.charCodeAt(i);
      hash +=
        (hash << 1) +
        (hash << 4) +
        (hash << 7) +
        (hash << 8) +
        (hash << 24);
    }
    return (hash >>> 0).toString(36);
  }

  function stableProductId(normalizedName) {
    return "prd_legacy_" + stableHash(normalizedName || "");
  }

  function extractThumbMeta(rawThumb) {
    var dataUrl = String(rawThumb || "").trim();
    if (!/^data:image\//i.test(dataUrl)) return null;
    var mimeMatch = dataUrl.match(/^data:([^;]+);/i);
    return {
      mimeType: mimeMatch ? String(mimeMatch[1] || "").toLowerCase() : "image/webp",
      chars: dataUrl.length
    };
  }

  function mapLegacyProduct(item, index) {
    var safeItem = item || {};
    var rawName = String(safeItem.n || "").trim();
    var normalizedName = normalizeName(rawName);
    if (!normalizedName || normalizedName.length < 3) return null;

    var allergens = toAllergenList(safeItem.a);
    var thumbMeta = extractThumbMeta(safeItem._thumb);
    var updatedAt =
      String(safeItem._updated_at || "").trim() ||
      String(safeItem.last_analysis_timestamp || "").trim() ||
      nowIso();

    return {
      schemaVersion: 1,
      id: stableProductId(normalizedName),
      identidad: {
        nombre: rawName,
        nombreNormalizado: normalizedName
      },
      alergenos: allergens,
      analisis: {
        origenAlta: "legacy_v1_import",
        estadoPasaporte: null,
        requiereRevision: false,
        legacy: {
          lastAnalysisId: String(safeItem.last_analysis_id || "").trim() || null,
          lastAnalysisTimestamp: String(safeItem.last_analysis_timestamp || "").trim() || null
        }
      },
      legacy: {
        source: String(safeItem._src || "").trim() || "legacy_v1_json",
        updatedAtLegacy: String(safeItem._updated_at || "").trim() || null,
        hasThumb: !!thumbMeta,
        thumbMimeType: thumbMeta ? thumbMeta.mimeType : null,
        thumbChars: thumbMeta ? thumbMeta.chars : null,
        importIndex: Number.isFinite(index) ? index : null
      },
      sistema: {
        estadoRegistro: "ACTIVO",
        syncState: "SYNCED",
        dirty: false,
        rowVersion: 1,
        createdAt: updatedAt,
        updatedAt: updatedAt,
        deletedAt: null
      }
    };
  }

  function analyzeLegacyPayload(payload) {
    var products = Array.isArray(payload && payload.products) ? payload.products : [];
    var records = [];
    var totalWithThumb = 0;
    var totalWithAnalysis = 0;
    var totalEmptyAllergens = 0;
    var invalidItems = 0;

    for (var i = 0; i < products.length; i += 1) {
      var item = products[i] || {};
      if (Array.isArray(item.a) && item.a.length === 0) totalEmptyAllergens += 1;
      if (item.last_analysis_id || item.last_analysis_timestamp) totalWithAnalysis += 1;
      if (item._thumb) totalWithThumb += 1;

      var mapped = mapLegacyProduct(item, i);
      if (!mapped) {
        invalidItems += 1;
        continue;
      }
      records.push(mapped);
    }

    return {
      ok: true,
      stats: {
        totalInput: products.length,
        totalValid: records.length,
        totalInvalid: invalidItems,
        totalWithThumb: totalWithThumb,
        totalWithAnalysis: totalWithAnalysis,
        totalEmptyAllergens: totalEmptyAllergens
      },
      records: records
    };
  }

  var api = {
    analyzeLegacyPayload: analyzeLegacyPayload,
    mapLegacyProduct: mapLegacyProduct,
    stableProductId: stableProductId,
    normalizeName: normalizeName,
    clone: clone
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase3LegacyProductosV1Mapper = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

