(function initHistorialCamposModule(globalScope) {
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

  var COLLECTION_NAME = "historial_eventos";
  var MAX_ITEMS = 30;
  var ERROR_PREFIX = "HIST_";

  var EVENT_TYPES = {
    PRODUCT_CREATED: "PRODUCT_CREATED",
    PRODUCT_UPDATED: "PRODUCT_UPDATED",
    PRODUCT_DELETED: "PRODUCT_DELETED",
    IMPORTACION_EXCEL: "IMPORTACION_EXCEL",
    IMPORTACION_EXCEL_REVISION: "IMPORTACION_EXCEL_REVISION",
    IMPORTACION_EXCEL_RECHAZO: "IMPORTACION_EXCEL_RECHAZO"
  };

  var SUMMARY_BY_TYPE = {
    PRODUCT_CREATED: "Producto añadido",
    PRODUCT_UPDATED: "Producto modificado",
    PRODUCT_DELETED: "Producto eliminado",
    IMPORTACION_EXCEL: "Importacion Excel",
    IMPORTACION_EXCEL_REVISION: "Importacion Excel en revision",
    IMPORTACION_EXCEL_RECHAZO: "Importacion Excel rechazada"
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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

  function toAllergenList(input) {
    if (allergenCatalog && typeof allergenCatalog.normalizeAllergenList === "function") {
      return allergenCatalog.normalizeAllergenList(input);
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
    return out.sort();
  }

  function toDisplayLabel(token) {
    if (allergenCatalog && typeof allergenCatalog.toDisplayLabel === "function") {
      return allergenCatalog.toDisplayLabel(token);
    }
    return String(token || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, function each(chr) { return chr.toUpperCase(); });
  }

  function buildError(code, message) {
    var err = new Error(message);
    err.code = code;
    return err;
  }

  function assertNonEmptyText(value, fieldName) {
    if (String(value || "").trim()) return;
    throw buildError(
      ERROR_PREFIX + "REGISTRO_INVALIDO",
      "Falta el campo obligatorio `" + fieldName + "`."
    );
  }

  function isEventTypeAllowed(eventType) {
    return eventType === EVENT_TYPES.PRODUCT_CREATED ||
      eventType === EVENT_TYPES.PRODUCT_UPDATED ||
      eventType === EVENT_TYPES.PRODUCT_DELETED ||
      eventType === EVENT_TYPES.IMPORTACION_EXCEL ||
      eventType === EVENT_TYPES.IMPORTACION_EXCEL_REVISION ||
      eventType === EVENT_TYPES.IMPORTACION_EXCEL_RECHAZO;
  }

  function toChangedFields(input) {
    var safeInput = Array.isArray(input) ? input : [];
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < safeInput.length; i += 1) {
      var item = String(safeInput[i] || "").trim();
      if (!item || seen[item]) continue;
      seen[item] = true;
      out.push(item);
    }
    return out;
  }

  function validarRegistro(registro) {
    var safe = registro && typeof registro === "object" ? clone(registro) : null;
    if (!safe) {
      throw buildError(ERROR_PREFIX + "REGISTRO_INVALIDO", "El registro de historial es obligatorio.");
    }

    assertNonEmptyText(safe.eventId, "eventId");
    assertNonEmptyText(safe.eventType, "eventType");
    assertNonEmptyText(safe.productId, "productId");
    assertNonEmptyText(safe.productLabel, "productLabel");
    assertNonEmptyText(safe.actorId, "actorId");
    assertNonEmptyText(safe.occurredAt, "occurredAt");
    assertNonEmptyText(safe.summary, "summary");

    if (!isEventTypeAllowed(safe.eventType)) {
      throw buildError(
        ERROR_PREFIX + "REGISTRO_INVALIDO",
        "eventType no pertenece al catalogo oficial."
      );
    }

    if (safe.eventType === EVENT_TYPES.PRODUCT_UPDATED) {
      safe.changedFields = toChangedFields(safe.changedFields);
      if (!safe.changedFields.length) {
        throw buildError(
          ERROR_PREFIX + "REGISTRO_INVALIDO",
          "PRODUCT_UPDATED requiere changedFields no vacio."
        );
      }
      if (!safe.changeDetail || typeof safe.changeDetail !== "object" || Array.isArray(safe.changeDetail)) {
        throw buildError(
          ERROR_PREFIX + "REGISTRO_INVALIDO",
          "PRODUCT_UPDATED requiere changeDetail valido."
        );
      }
      if (!Object.keys(safe.changeDetail).length) {
        throw buildError(
          ERROR_PREFIX + "REGISTRO_INVALIDO",
          "PRODUCT_UPDATED requiere changeDetail no vacio."
        );
      }
    } else {
      delete safe.changedFields;
      delete safe.changeDetail;
    }

    if (
      safe.eventType === EVENT_TYPES.IMPORTACION_EXCEL ||
      safe.eventType === EVENT_TYPES.IMPORTACION_EXCEL_REVISION ||
      safe.eventType === EVENT_TYPES.IMPORTACION_EXCEL_RECHAZO
    ) {
      if (!safe.importDetail || typeof safe.importDetail !== "object" || Array.isArray(safe.importDetail)) {
        throw buildError(
          ERROR_PREFIX + "REGISTRO_INVALIDO",
          safe.eventType + " requiere importDetail valido."
        );
      }
      if (!Object.keys(safe.importDetail).length) {
        throw buildError(
          ERROR_PREFIX + "REGISTRO_INVALIDO",
          safe.eventType + " requiere importDetail no vacio."
        );
      }
    } else {
      delete safe.importDetail;
    }

    return safe;
  }

  var api = {
    COLLECTION_NAME: COLLECTION_NAME,
    MAX_ITEMS: MAX_ITEMS,
    ERROR_PREFIX: ERROR_PREFIX,
    EVENT_TYPES: EVENT_TYPES,
    SUMMARY_BY_TYPE: SUMMARY_BY_TYPE,
    toAllergenList: toAllergenList,
    toDisplayLabel: toDisplayLabel,
    validarRegistro: validarRegistro
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase7HistorialCampos = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

