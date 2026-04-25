(function initHistorialCoreModule(globalScope) {
  "use strict";

  var campos = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      campos = require("./historial_campos.js");
    } catch (errRequire) {
      campos = null;
    }
  }
  if (!campos && globalScope && globalScope.Fase7HistorialCampos) {
    campos = globalScope.Fase7HistorialCampos;
  }
  if (!campos) {
    throw new Error("Fase7HistorialCampos no esta disponible.");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeEventId() {
    return "hist_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function toPlainName(value) {
    return String(value || "").trim();
  }

  function getNombre(input) {
    var safe = input || {};
    if (safe.identidad && safe.identidad.nombre != null) return toPlainName(safe.identidad.nombre);
    return toPlainName(safe.nombre);
  }

  function getFormato(input) {
    var safe = input || {};
    if (safe.comercial && safe.comercial.formato != null) return toPlainName(safe.comercial.formato);
    return toPlainName(safe.formato);
  }

  function getAlergenos(input) {
    var safe = input || {};
    var list = Array.isArray(safe.alergenos) ? safe.alergenos : [];
    return campos.toAllergenList(list);
  }

  function buildHistorialError(code, message, cause) {
    var err = new Error(message);
    err.code = code;
    if (cause) err.cause = cause;
    return err;
  }

  function buildAlergenosDetail(beforeList, afterList) {
    var beforeMap = Object.create(null);
    var afterMap = Object.create(null);
    var added = [];
    var removed = [];
    var i = 0;

    for (i = 0; i < beforeList.length; i += 1) beforeMap[beforeList[i]] = true;
    for (i = 0; i < afterList.length; i += 1) afterMap[afterList[i]] = true;

    for (i = 0; i < afterList.length; i += 1) {
      if (!beforeMap[afterList[i]]) added.push(campos.toDisplayLabel(afterList[i]));
    }
    for (i = 0; i < beforeList.length; i += 1) {
      if (!afterMap[beforeList[i]]) removed.push(campos.toDisplayLabel(beforeList[i]));
    }

    var parts = [];
    if (added.length) parts.push("Añadido: " + added.join(", ") + ".");
    if (removed.length) parts.push("Quitado: " + removed.join(", ") + ".");
    return parts.join(" ").trim();
  }

  function construirDiff(antes, despues) {
    var beforeName = getNombre(antes);
    var afterName = getNombre(despues);
    var beforeFormat = getFormato(antes);
    var afterFormat = getFormato(despues);
    var beforeAllergens = getAlergenos(antes);
    var afterAllergens = getAlergenos(despues);

    var changedFields = [];
    var changeDetail = {};

    if (beforeName !== afterName) {
      changedFields.push("nombre");
      changeDetail.nombre = "Nuevo nombre: " + afterName;
    }

    if (beforeFormat !== afterFormat) {
      changedFields.push("formato");
      changeDetail.formato = "Nuevo formato: " + afterFormat;
    }

    if (JSON.stringify(beforeAllergens) !== JSON.stringify(afterAllergens)) {
      changedFields.push("alergenos");
      changeDetail.alergenos = buildAlergenosDetail(beforeAllergens, afterAllergens);
    }

    return {
      changedFields: changedFields,
      changeDetail: changeDetail
    };
  }

  function construirRegistro(eventType, productId, productLabel, actorId, changedFields, changeDetail, options) {
    var safeOptions = options || {};
    var registro = {
      eventId: String(safeOptions.eventId || "").trim() || makeEventId(),
      eventType: String(eventType || "").trim(),
      productId: String(productId || "").trim(),
      productLabel: String(productLabel || "").trim(),
      actorId: String(actorId || "").trim(),
      occurredAt: String(safeOptions.occurredAt || "").trim() || nowIso(),
      summary: campos.SUMMARY_BY_TYPE[String(eventType || "").trim()] || ""
    };

    if (registro.eventType === campos.EVENT_TYPES.PRODUCT_UPDATED) {
      registro.changedFields = Array.isArray(changedFields) ? changedFields.slice(0) : [];
      registro.changeDetail = changeDetail && typeof changeDetail === "object" ? clone(changeDetail) : {};
    }
    if (
      registro.eventType === campos.EVENT_TYPES.IMPORTACION_EXCEL ||
      registro.eventType === campos.EVENT_TYPES.IMPORTACION_EXCEL_REVISION ||
      registro.eventType === campos.EVENT_TYPES.IMPORTACION_EXCEL_RECHAZO
    ) {
      registro.importDetail = safeOptions.importDetail && typeof safeOptions.importDetail === "object"
        ? clone(safeOptions.importDetail)
        : {};
    }

    return campos.validarRegistro(registro);
  }

  async function escribirEvento(batch, registro, options) {
    var safeOptions = options || {};
    var safeBatch = batch || null;
    var db = safeOptions.db || null;
    var firestoreModule = safeOptions.firestoreModule || null;

    if (!safeBatch || typeof safeBatch.set !== "function") {
      throw buildHistorialError("HIST_BATCH_INVALIDO", "Falta batch valido para escribir historial.");
    }
    if (!db || !firestoreModule) {
      throw buildHistorialError("HIST_DB_INVALIDO", "Falta contexto Firestore para historial.");
    }

    var collectionFn = firestoreModule.collection;
    var docFn = firestoreModule.doc;
    var queryFn = firestoreModule.query;
    var orderByFn = firestoreModule.orderBy;
    var limitFn = firestoreModule.limit;
    var getDocs = firestoreModule.getDocs;
    var deleteField = null;

    var normalized = campos.validarRegistro(registro);

    if (
      typeof collectionFn !== "function" ||
      typeof docFn !== "function" ||
      typeof queryFn !== "function" ||
      typeof orderByFn !== "function" ||
      typeof limitFn !== "function" ||
      typeof getDocs !== "function" ||
      typeof safeBatch.delete !== "function"
    ) {
      throw buildHistorialError("HIST_DB_INVALIDO", "Firestore no expone lo necesario para historial.");
    }

    try {
      var historyCollection = collectionFn(db, campos.COLLECTION_NAME);
      var oldestQuery = queryFn(historyCollection, orderByFn("occurredAt", "asc"), orderByFn("eventId", "asc"), limitFn(1));
      var countQuery = queryFn(historyCollection, orderByFn("occurredAt", "desc"), limitFn(campos.MAX_ITEMS));
      var results = await Promise.all([getDocs(oldestQuery), getDocs(countQuery)]);
      var oldestSnapshot = results[0];
      var countSnapshot = results[1];
      var currentCount = countSnapshot && typeof countSnapshot.size === "number"
        ? countSnapshot.size
        : 0;

      if (currentCount >= campos.MAX_ITEMS && oldestSnapshot && !oldestSnapshot.empty) {
        oldestSnapshot.forEach(function each(docSnap) {
          safeBatch.delete(docFn(db, campos.COLLECTION_NAME, docSnap.id));
        });
      }

      safeBatch.set(
        docFn(db, campos.COLLECTION_NAME, normalized.eventId),
        normalized,
        { merge: false }
      );

      return {
        ok: true,
        registro: normalized,
        removedOldest: currentCount >= campos.MAX_ITEMS
      };
    } catch (err) {
      throw buildHistorialError(
        "HIST_LIMITE_COMPROBACION_FALLIDA",
        "No se pudo preparar el historial en Firestore.",
        err
      );
    }
  }

  async function leerUltimos30(options) {
    var safeOptions = options || {};
    var db = safeOptions.db || null;
    var firestoreModule = safeOptions.firestoreModule || null;
    if (!db || !firestoreModule) {
      throw buildHistorialError("HIST_LECTURA_FALLIDA", "Falta contexto Firestore para leer historial.");
    }

    var collectionFn = firestoreModule.collection;
    var queryFn = firestoreModule.query;
    var orderByFn = firestoreModule.orderBy;
    var limitFn = firestoreModule.limit;
    var getDocs = firestoreModule.getDocs;
    if (
      typeof collectionFn !== "function" ||
      typeof queryFn !== "function" ||
      typeof orderByFn !== "function" ||
      typeof limitFn !== "function" ||
      typeof getDocs !== "function"
    ) {
      throw buildHistorialError("HIST_LECTURA_FALLIDA", "Firestore no expone lectura de historial.");
    }

    try {
      var historyCollection = collectionFn(db, campos.COLLECTION_NAME);
      var q = queryFn(historyCollection, orderByFn("occurredAt", "desc"), limitFn(campos.MAX_ITEMS));
      var snapshot = await getDocs(q);
      var items = [];
      snapshot.forEach(function each(docSnap) {
        var data = docSnap.data ? docSnap.data() : null;
        if (!data) return;
        items.push(data);
      });
      return items;
    } catch (err) {
      throw buildHistorialError("HIST_LECTURA_FALLIDA", "No se pudo leer el historial.", err);
    }
  }

  var api = {
    construirRegistro: construirRegistro,
    construirDiff: construirDiff,
    escribirEvento: escribirEvento,
    leerUltimos30: leerUltimos30
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase7HistorialCore = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
