(function initCerebroProductosPersistenciaModule(globalScope) {
  "use strict";
  var IDEMPOTENCY_TTL_MS = 120000;
  var IDEMPOTENCY_STORAGE_KEY = "fase5_cerebro_persist_idempotency_v1";
  var idempotencyCache = Object.create(null);
  var allergenCatalog = null;
  var historialCore = null;
  var historialCampos = null;

  if (typeof module !== "undefined" && module.exports) {
    try {
      allergenCatalog = require("../../shared/alergenos_oficiales.js");
    } catch (errRequire) {
      allergenCatalog = null;
    }
    try {
      historialCore = require("../../backend/historial/historial_core.js");
    } catch (errHistoryCore) {
      historialCore = null;
    }
    try {
      historialCampos = require("../../backend/historial/historial_campos.js");
    } catch (errHistoryFields) {
      historialCampos = null;
    }
  }
  if (!allergenCatalog && globalScope && globalScope.AppV2AlergenosOficiales) {
    allergenCatalog = globalScope.AppV2AlergenosOficiales;
  }
  if (!historialCore && globalScope && globalScope.Fase7HistorialCore) {
    historialCore = globalScope.Fase7HistorialCore;
  }
  if (!historialCampos && globalScope && globalScope.Fase7HistorialCampos) {
    historialCampos = globalScope.Fase7HistorialCampos;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    var safePrefix = String(prefix || "prd").trim() || "prd";
    return safePrefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function cleanupIdempotencyCache(nowMs) {
    var keys = Object.keys(idempotencyCache);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var entry = idempotencyCache[key];
      if (!entry || Number(entry.expiresAt || 0) <= nowMs) {
        delete idempotencyCache[key];
      }
    }
  }

  function readIdempotencyResult(key, nowMs) {
    cleanupIdempotencyCache(nowMs);
    var entry = idempotencyCache[key];
    if (!entry || !entry.result) {
      var persisted = readPersistedIdempotencyMap(nowMs);
      var persistedEntry = persisted[key];
      if (!persistedEntry || !persistedEntry.result) return null;
      idempotencyCache[key] = persistedEntry;
      entry = persistedEntry;
    }
    var out = clone(entry.result);
    out.ok = true;
    out.deduped = true;
    return out;
  }

  function storeIdempotencyResult(key, result, nowMs) {
    var entry = {
      result: clone(result),
      expiresAt: nowMs + IDEMPOTENCY_TTL_MS
    };
    idempotencyCache[key] = entry;
    var persisted = readPersistedIdempotencyMap(nowMs);
    persisted[key] = entry;
    writePersistedIdempotencyMap(persisted);
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

  function readPersistedIdempotencyMap(nowMs) {
    if (!canUseStorage()) return Object.create(null);
    var raw = null;
    try {
      raw = globalScope.localStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
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

  function writePersistedIdempotencyMap(map) {
    if (!canUseStorage()) return;
    try {
      globalScope.localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(map || {}));
    } catch (errWrite) {
      // No-op.
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeFormat(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  function uniqueList(input) {
    if (allergenCatalog && typeof allergenCatalog.normalizeAllergenList === "function") {
      return allergenCatalog.normalizeAllergenList(input);
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

  function asPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function resolveActorId(payload, deps) {
    var safePayload = payload || {};
    var safeDeps = deps || {};
    if (String(safePayload.actorId || "").trim()) return String(safePayload.actorId).trim();
    if (String(safeDeps.actorId || "").trim()) return String(safeDeps.actorId).trim();
    if (safeDeps.usuario && String(safeDeps.usuario.id || "").trim()) return String(safeDeps.usuario.id).trim();
    if (safeDeps.user && String(safeDeps.user.id || "").trim()) return String(safeDeps.user.id).trim();
    if (String(safePayload.sessionToken || "").trim()) return "sesion_" + String(safePayload.sessionToken).trim().slice(0, 8);
    return "usuario_local";
  }

  function resolveRepository(deps) {
    var safeDeps = deps || {};
    return safeDeps.productRepository || safeDeps.productRemoteIndex || safeDeps.remoteIndex || safeDeps.repository || null;
  }

  function isActiveRecord(record) {
    return !!(
      record &&
      record.sistema &&
      String(record.sistema.estadoRegistro || "ACTIVO").trim() === "ACTIVO"
    );
  }

  async function listCandidateRecords(normalizedName, normalizedFormat, deps) {
    var repository = resolveRepository(deps);
    if (!repository) {
      return {
        ok: true,
        items: []
      };
    }

    if (typeof repository.findProductRecordsByIdentity === "function") {
      return repository.findProductRecordsByIdentity({
        normalizedName: normalizedName,
        normalizedFormat: normalizedFormat,
        maxItems: 20
      });
    }

    if (typeof repository.listProductRecords === "function") {
      var listed = await repository.listProductRecords({ maxItems: 2000 });
      if (!listed || listed.ok !== true) return listed;
      return {
        ok: true,
        items: (Array.isArray(listed.items) ? listed.items : []).filter(function each(item) {
          if (!isActiveRecord(item) || !item.identidad) return false;
          var itemName = normalizeText(item.identidad.nombreNormalizado || item.identidad.nombre || "");
          var itemFormat = normalizeFormat(item.comercial && (item.comercial.formatoNormalizado || item.comercial.formato) || "");
          if (itemName !== normalizedName) return false;
          if (normalizedFormat && itemFormat !== normalizedFormat) return false;
          return true;
        })
      };
    }

    return {
      ok: true,
      items: []
    };
  }

  function toCoincidencia(record) {
    return {
      id: record && record.id ? String(record.id) : null,
      nombre: record && record.identidad ? String(record.identidad.nombre || "") : "",
      formato: record && record.comercial ? String(record.comercial.formato || "") : "",
      record: record ? clone(record) : null
    };
  }

  async function detectarDuplicadoReal(input, deps) {
    var safeInput = input || {};
    var proposal = safeInput.proposal || {};
    var normalizedName = normalizeText(proposal.nombre || "");
    var normalizedFormat = normalizeFormat(proposal.formato || "");

    if (!normalizedName || !normalizedFormat) {
      return {
        ok: true,
        posibleDuplicado: false,
        fusionable: false,
        coincidencias: []
      };
    }

    var listed = await listCandidateRecords(normalizedName, normalizedFormat, deps);
    if (!listed || listed.ok !== true) {
      return {
        ok: false,
        posibleDuplicado: false,
        fusionable: false,
        coincidencias: [],
        errorCode: listed && listed.errorCode ? listed.errorCode : "CEREBRO_DUPLICADOS_READ_FAILED",
        message: listed && listed.message ? listed.message : "No se pudo consultar duplicados reales."
      };
    }

    var matches = (Array.isArray(listed.items) ? listed.items : [])
      .filter(isActiveRecord)
      .map(toCoincidencia);

    return {
      ok: true,
      posibleDuplicado: matches.length > 0,
      fusionable: matches.length > 0,
      coincidencias: matches
    };
  }

  function buildMergedRecord(payload, existingRecord) {
    var safePayload = payload || {};
    var proposal = safePayload.propuestaFinal || (safePayload.datos && safePayload.datos.propuestaFinal) || {};
    var safeDatos = safePayload.datos || {};
    var safeDecision = safePayload.decision || (safeDatos && safeDatos.decision) || {};
    var safeDuplicados = safePayload.duplicados || (safeDatos && safeDatos.duplicados) || {};
    var current = existingRecord && asPlainObject(existingRecord) ? clone(existingRecord) : null;
    var nombre = String(proposal.nombre || "").trim();
    var formato = String(proposal.formato || "").trim();
    var tipoFormato = String(proposal.tipoFormato || "desconocido").trim() || "desconocido";
    var alergenos = uniqueList((current && current.alergenos || []).concat(proposal.alergenos || []));
    var trazas = uniqueList((current && current.trazas || []).concat(proposal.trazas || []));
    var now = nowIso();

    return {
      schemaVersion: current && current.schemaVersion ? current.schemaVersion : 2,
      id: current && current.id ? current.id : makeId("prd5"),
      identidad: {
        nombre: nombre,
        nombreNormalizado: normalizeText(nombre)
      },
      comercial: {
        formato: formato,
        formatoNormalizado: normalizeFormat(formato),
        tipoFormato: tipoFormato
      },
      alergenos: alergenos,
      trazas: trazas,
      analisis: Object.assign({}, current && current.analisis || {}, {
        origenAlta: "cerebro_fase5",
        requiereRevision: !!proposal.requiereRevision,
        ultimoAnalysisId: safePayload.analysisId || null,
        ultimoTraceId: safePayload.traceId || null,
        ultimaDecisionFlujo: safeDecision.decisionFlujo || safeDatos.decisionFlujo || null,
        ultimaFusionDuplicado: !!current || !!safeDuplicados.fusionable
      }),
      sistema: {
        estadoRegistro: "ACTIVO",
        syncState: "SYNCED_REMOTE",
        dirty: false,
        rowVersion: current && current.sistema && current.sistema.rowVersion
          ? Number(current.sistema.rowVersion) + 1
          : 1,
        createdAt: current && current.sistema && current.sistema.createdAt
          ? current.sistema.createdAt
          : now,
        updatedAt: now,
        deletedAt: null
      }
    };
  }

  function buildHistoryEvent(payload, existingRecord, mergedRecord, deps) {
    if (!historialCore || !historialCampos) return null;
    var actorId = resolveActorId(payload, deps);
    if (existingRecord) {
      var diff = historialCore.construirDiff(existingRecord, mergedRecord);
      if (!Array.isArray(diff.changedFields) || !diff.changedFields.length) return null;
      return historialCore.construirRegistro(
        historialCampos.EVENT_TYPES.PRODUCT_UPDATED,
        mergedRecord.id,
        mergedRecord.identidad ? mergedRecord.identidad.nombre : "",
        actorId,
        diff.changedFields,
        diff.changeDetail
      );
    }
    return historialCore.construirRegistro(
      historialCampos.EVENT_TYPES.PRODUCT_CREATED,
      mergedRecord.id,
      mergedRecord.identidad ? mergedRecord.identidad.nombre : "",
      actorId,
      null,
      null
    );
  }

  async function findProductById(productId, deps) {
    var repository = resolveRepository(deps);
    var safeId = String(productId || "").trim();
    if (!repository || !safeId) return null;

    if (typeof repository.getProductRecordById === "function") {
      var byId = await repository.getProductRecordById(safeId);
      if (byId && byId.ok === true) return byId.item || null;
    }

    if (typeof repository.listProductRecords === "function") {
      var listed = await repository.listProductRecords({ maxItems: 5000 });
      if (!listed || listed.ok !== true) return null;
      return (Array.isArray(listed.items) ? listed.items : []).find(function each(item) {
        return String(item && item.id || "").trim() === safeId;
      }) || null;
    }

    return null;
  }

  async function guardarResultadoAnalizado(payload, deps) {
    var repository = resolveRepository(deps);
    if (!repository || typeof repository.upsertProductRecord !== "function") {
      return {
        ok: false,
        errorCode: "CEREBRO_PERSISTENCIA_NO_CONFIGURADA",
        message: "No hay repositorio de productos configurado para guardar."
      };
    }

    var safePayload = payload || {};
    var now = Date.now();
    var idempotencyKey = String(safePayload.idempotencyKey || "").trim();
    if (idempotencyKey) {
      var cached = readIdempotencyResult(idempotencyKey, now);
      if (cached) return cached;
    }

    var safeDatos = safePayload.datos || {};
    var duplicate = await detectarDuplicadoReal({
      proposal: safePayload.propuestaFinal || safeDatos.propuestaFinal || null,
      inputData: safeDatos
    }, deps);

    if (duplicate && duplicate.ok === false) {
      return duplicate;
    }

    var existingRecord = duplicate && duplicate.fusionable && Array.isArray(duplicate.coincidencias) && duplicate.coincidencias[0]
      ? duplicate.coincidencias[0].record
      : null;

    var record = buildMergedRecord(payload, existingRecord);
    var historyEvent = buildHistoryEvent(payload, existingRecord, record, deps);
    var written = await repository.upsertProductRecord({
      product: record,
      historyEvent: historyEvent
    });
    if (!written || written.ok !== true) {
      return {
        ok: false,
        errorCode: written && written.errorCode ? written.errorCode : "CEREBRO_GUARDADO_FAILED",
        message: written && written.message ? written.message : "No se pudo guardar el producto analizado."
      };
    }

    var savedResult = {
      ok: true,
      merged: !!existingRecord,
      created: !existingRecord,
      deduped: false,
      productId: record.id,
      historyEventId: written.historyEventId || (historyEvent && historyEvent.eventId) || null,
      record: clone(record),
      coincidencias: duplicate && Array.isArray(duplicate.coincidencias) ? duplicate.coincidencias.map(function each(item) {
        return {
          id: item.id,
          nombre: item.nombre,
          formato: item.formato
        };
      }) : []
    };
    if (idempotencyKey) {
      storeIdempotencyResult(idempotencyKey, savedResult, now);
    }
    return savedResult;
  }

  async function eliminarProducto(payload, deps) {
    var repository = resolveRepository(deps);
    if (!repository || typeof repository.deleteProductRecord !== "function") {
      return {
        ok: false,
        errorCode: "CEREBRO_PERSISTENCIA_NO_CONFIGURADA",
        message: "No hay repositorio de productos configurado para borrar."
      };
    }

    if (!historialCore || !historialCampos) {
      return {
        ok: false,
        errorCode: "CEREBRO_HISTORIAL_NO_CONFIGURADO",
        message: "Falta historial para registrar el borrado."
      };
    }

    var safePayload = payload || {};
    var now = Date.now();
    var productId = String(safePayload.productId || "").trim();
    if (!productId) {
      return {
        ok: false,
        errorCode: "CEREBRO_PRODUCT_ID_INVALIDO",
        message: "Falta productId para borrar."
      };
    }

    var idempotencyKey = String(safePayload.idempotencyKey || "").trim();
    if (idempotencyKey) {
      var cached = readIdempotencyResult(idempotencyKey, now);
      if (cached) return cached;
    }

    var existingRecord = deps && deps.existingRecord ? clone(deps.existingRecord) : null;
    if (!existingRecord) {
      existingRecord = await findProductById(productId, deps);
    }
    if (!existingRecord) {
      return {
        ok: false,
        errorCode: "CEREBRO_PRODUCTO_NO_ENCONTRADO",
        message: "No se encontro el producto a borrar."
      };
    }

    var actorId = resolveActorId(safePayload, deps);
    var historyEvent = historialCore.construirRegistro(
      historialCampos.EVENT_TYPES.PRODUCT_DELETED,
      productId,
      existingRecord.identidad ? existingRecord.identidad.nombre : "",
      actorId,
      null,
      null
    );

    var deleted = await repository.deleteProductRecord({
      productId: productId,
      historyEvent: historyEvent
    });
    if (!deleted || deleted.ok !== true) {
      return {
        ok: false,
        errorCode: deleted && deleted.errorCode ? deleted.errorCode : "CEREBRO_BORRADO_FAILED",
        message: deleted && deleted.message ? deleted.message : "No se pudo borrar el producto."
      };
    }

    var result = {
      ok: true,
      deleted: true,
      deduped: false,
      productId: productId,
      historyEventId: deleted.historyEventId || historyEvent.eventId || null,
      record: clone(existingRecord)
    };
    if (idempotencyKey) {
      storeIdempotencyResult(idempotencyKey, result, now);
    }
    return result;
  }

  var api = {
    detectarDuplicadoReal: detectarDuplicadoReal,
    guardarResultadoAnalizado: guardarResultadoAnalizado,
    eliminarProducto: eliminarProducto,
    normalizeName: normalizeText,
    normalizeFormat: normalizeFormat
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroProductosPersistencia = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

