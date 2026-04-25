(function initFase8SyncManagerModule(globalScope) {
  "use strict";

  var DEFAULTS = {
    maxUploadItems: 150,
    maxDownloadItems: 500,
    retryBaseMs: 150,
    retryMax: 2,
    listenerEnabled: true,
    heartbeatMs: 12000
  };

  var historialCore = null;
  var historialCampos = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      historialCore = require("../historial/historial_core.js");
    } catch (errHistoryCore) {
      historialCore = null;
    }
    try {
      historialCampos = require("../historial/historial_campos.js");
    } catch (errHistoryFields) {
      historialCampos = null;
    }
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

  function asPositiveInt(value, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.floor(n);
  }

  function asText(value) {
    return String(value || "").trim();
  }

  function wait(ms) {
    var waitMs = Math.max(0, Number(ms) || 0);
    return new Promise(function executor(resolve) {
      setTimeout(resolve, waitMs);
    });
  }

  function buildSyncId() {
    return "sync_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  function buildActorId(sessionToken) {
    var token = asText(sessionToken);
    return token ? "sesion_" + token.slice(0, 8) : "usuario_local";
  }

  function buildHistoryEventForPendingUpload(product, existingRecord, sessionToken) {
    if (!historialCore || !historialCampos || !product || !product.id) return null;
    var actorId = buildActorId(sessionToken);
    if (existingRecord) {
      var diff = historialCore.construirDiff(existingRecord, product);
      if (!Array.isArray(diff.changedFields) || !diff.changedFields.length) return null;
      return historialCore.construirRegistro(
        historialCampos.EVENT_TYPES.PRODUCT_UPDATED,
        product.id,
        product.identidad && product.identidad.nombre ? product.identidad.nombre : product.id,
        actorId,
        diff.changedFields,
        diff.changeDetail
      );
    }
    return historialCore.construirRegistro(
      historialCampos.EVENT_TYPES.PRODUCT_CREATED,
      product.id,
      product.identidad && product.identidad.nombre ? product.identidad.nombre : product.id,
      actorId,
      null,
      null
    );
  }

  function getEstadoApi() {
    if (typeof module !== "undefined" && module.exports) {
      try {
        return require("./sync_estado.js");
      } catch (errRequire) {
        return globalScope && globalScope.Fase8SyncEstado ? globalScope.Fase8SyncEstado : null;
      }
    }
    return globalScope && globalScope.Fase8SyncEstado ? globalScope.Fase8SyncEstado : null;
  }

  function getConflictosApi() {
    if (typeof module !== "undefined" && module.exports) {
      try {
        return require("./sync_conflictos.js");
      } catch (errRequire) {
        return globalScope && globalScope.Fase8SyncConflictos ? globalScope.Fase8SyncConflictos : null;
      }
    }
    return globalScope && globalScope.Fase8SyncConflictos ? globalScope.Fase8SyncConflictos : null;
  }

  function getLogApi() {
    if (typeof module !== "undefined" && module.exports) {
      try {
        return require("./sync_log.js");
      } catch (errRequire) {
        return globalScope && globalScope.Fase8SyncLog ? globalScope.Fase8SyncLog : null;
      }
    }
    return globalScope && globalScope.Fase8SyncLog ? globalScope.Fase8SyncLog : null;
  }

  function getTombstoneApi() {
    if (typeof module !== "undefined" && module.exports) {
      try {
        return require("./sync_tombstone.js");
      } catch (errRequire) {
        return globalScope && globalScope.Fase8SyncTombstone ? globalScope.Fase8SyncTombstone : null;
      }
    }
    return globalScope && globalScope.Fase8SyncTombstone ? globalScope.Fase8SyncTombstone : null;
  }

  function createSyncManager(options) {
    var safeOptions = options || {};
    var store = safeOptions.store || null;
    var getRemoteIndex = typeof safeOptions.getRemoteIndex === "function"
      ? safeOptions.getRemoteIndex
      : function noopRemote() { return null; };
    var tokenValidator = typeof safeOptions.tokenValidator === "function"
      ? safeOptions.tokenValidator
      : function defaultTokenValidator(token) {
          return asText(token).length > 0;
        };

    var estadoApi = safeOptions.estadoApi || getEstadoApi();
    var conflictosApi = safeOptions.conflictosApi || getConflictosApi();
    var logApi = safeOptions.logApi || getLogApi();
    var tombstoneApi = safeOptions.tombstoneApi || getTombstoneApi();

    var runtime = {
      mode: null,
      inFlight: false,
      listenerActive: false,
      listenerSessionToken: "",
      listenerCursor: null,
      listenerHeartbeatId: null,
      syncIdActive: null,
      lastResult: null
    };

    var config = {
      maxUploadItems: asPositiveInt(safeOptions.maxUploadItems, DEFAULTS.maxUploadItems),
      maxDownloadItems: asPositiveInt(safeOptions.maxDownloadItems, DEFAULTS.maxDownloadItems),
      retryBaseMs: asPositiveInt(safeOptions.retryBaseMs, DEFAULTS.retryBaseMs),
      retryMax: asPositiveInt(safeOptions.retryMax, DEFAULTS.retryMax),
      listenerEnabled: safeOptions.listenerEnabled !== false,
      heartbeatMs: asPositiveInt(safeOptions.heartbeatMs, DEFAULTS.heartbeatMs)
    };

    function readState() {
      if (!estadoApi || typeof estadoApi.readState !== "function") {
        return {
          ok: true,
          mode: runtime.mode || "normal",
          inFlight: runtime.inFlight,
          pending: 0,
          uploaded: 0,
          downloaded: 0,
          conflicts: 0,
          lastSyncAt: null,
          lastCursor: null,
          lastErrorCode: null,
          lastErrorMessage: null
        };
      }
      return estadoApi.readState();
    }

    function writeState(patch) {
      var safePatch = patch && typeof patch === "object" ? patch : {};
      if (!estadoApi || typeof estadoApi.writeState !== "function") {
        return Object.assign(readState(), safePatch);
      }
      return estadoApi.writeState(safePatch);
    }

    function buildError(code, message, details) {
      var safeCode = asText(code) || "SYNC_FAILED";
      var safeMessage = asText(message) || "Fallo de sincronizacion.";
      writeState({
        ok: false,
        inFlight: false,
        lastErrorCode: safeCode,
        lastErrorMessage: safeMessage
      });
      return {
        ok: false,
        errorCode: safeCode,
        message: safeMessage,
        details: details || null
      };
    }

    async function logEvent(syncId, sessionToken, type, data) {
      if (!runtime.logger || typeof runtime.logger.registrarEvento !== "function") return;
      await runtime.logger.registrarEvento(syncId, sessionToken, type, data || {});
    }

    function ensureLogger(remoteIndexLike) {
      if (runtime.logger || !logApi || typeof logApi.createSyncLog !== "function") return;
      var remoteRef = remoteIndexLike || null;
      var firestoreModule = remoteRef && remoteRef._firestoreModule
        ? remoteRef._firestoreModule
        : safeOptions.firestoreModule;
      var firebaseApp = remoteRef && remoteRef._firebaseApp
        ? remoteRef._firebaseApp
        : safeOptions.firebaseApp;
      if (!firestoreModule) return;
      var logger = logApi.createSyncLog({ firestoreModule: firestoreModule, firebaseApp: firebaseApp });
      if (logger && logger.ok === true) {
        runtime.logger = logger;
      }
    }

    function resolvePendingList() {
      if (!store || typeof store.listPendingUploadProducts !== "function") return [];
      return store.listPendingUploadProducts({ includeDeleted: false }).slice(0, config.maxUploadItems);
    }

    function consolidatePending(items) {
      var outById = Object.create(null);
      var safeItems = Array.isArray(items) ? items : [];
      for (var i = 0; i < safeItems.length; i += 1) {
        var item = safeItems[i];
        if (!item || !item.id) continue;
        outById[String(item.id)] = item;
      }
      return Object.keys(outById).map(function each(id) {
        return outById[id];
      });
    }

    async function uploadPending(syncId, sessionToken, remoteIndex) {
      var source = resolvePendingList();
      var consolidated = consolidatePending(source);
      var uploaded = 0;
      var errors = [];

      for (var i = 0; i < consolidated.length; i += 1) {
        var product = consolidated[i];
        var ok = false;
        var lastErr = null;

        for (var attempt = 1; attempt <= config.retryMax; attempt += 1) {
          var existingRecord = null;
          var needsHistoryRead = Number(product && product.sistema && product.sistema.rowVersion || 0) > 1;
          if (needsHistoryRead && remoteIndex && typeof remoteIndex.getProductRecordById === "function") {
            var existingOut = await remoteIndex.getProductRecordById({
              productId: product.id,
              sessionToken: sessionToken
            });
            if (existingOut && existingOut.ok === true) {
              existingRecord = existingOut.item || null;
            }
          }
          var historyEvent = buildHistoryEventForPendingUpload(product, existingRecord, sessionToken);
          var out = await remoteIndex.upsertProductRecord({
            product: product,
            sessionToken: sessionToken,
            historyEvent: historyEvent
          });
          if (out && out.ok === true) {
            ok = true;
            break;
          }
          lastErr = out || { errorCode: "SYNC_UPLOAD_FAILED", message: "Fallo subiendo pendiente." };
          if (attempt < config.retryMax) {
            await wait(config.retryBaseMs * attempt);
          }
        }

        if (ok) {
          if (store && typeof store.markProductAsSynced === "function") {
            store.markProductAsSynced({ productId: product.id, syncedAt: nowIso() });
          }
          if (tombstoneApi && typeof tombstoneApi.clearDeleted === "function") {
            tombstoneApi.clearDeleted(product.id);
          }
          uploaded += 1;
        } else {
          errors.push({
            productId: product.id,
            errorCode: asText(lastErr && lastErr.errorCode) || "SYNC_UPLOAD_FAILED",
            message: asText(lastErr && lastErr.message) || "No se pudo subir pendiente."
          });
        }
      }

      await logEvent(syncId, sessionToken, "SYNC_UPLOAD", {
        total: consolidated.length,
        uploaded: uploaded,
        errors: errors.length
      });

      return {
        total: consolidated.length,
        uploaded: uploaded,
        errors: errors
      };
    }

    function computeMaxCursor(currentCursor, incomingCursor) {
      var currentMs = Date.parse(String(currentCursor || "")) || 0;
      var incomingMs = Date.parse(String(incomingCursor || "")) || 0;
      return incomingMs > currentMs ? incomingCursor : currentCursor;
    }

    async function applyRemoteChanges(syncId, sessionToken, remoteIndex, cursor) {
      if (!remoteIndex || typeof remoteIndex.leerCambiosDesde !== "function") {
        return {
          downloaded: 0,
          conflicts: [],
          nextCursor: cursor || null
        };
      }

      var read = await remoteIndex.leerCambiosDesde(cursor || null, {
        maxItems: config.maxDownloadItems,
        sessionToken: sessionToken
      });
      if (!read || read.ok !== true) {
        return {
          error: {
            errorCode: asText(read && read.errorCode) || "SYNC_DOWNLOAD_FAILED",
            message: asText(read && read.message) || "No se pudo bajar cambios remotos."
          }
        };
      }

      var changes = Array.isArray(read.items) ? read.items : [];
      if (!changes.length) {
        return {
          downloaded: 0,
          conflicts: [],
          nextCursor: cursor || null
        };
      }

      var applied = 0;
      var conflicts = [];
      var nextCursor = cursor || null;

      if (store && typeof store.fusionarRemotoCambios === "function") {
        var merge = store.fusionarRemotoCambios(changes, {
          conflictosApi: conflictosApi,
          tombstoneApi: tombstoneApi
        });
        applied = Number(merge && merge.applied) || 0;
        conflicts = Array.isArray(merge && merge.conflicts) ? merge.conflicts : [];
        nextCursor = computeMaxCursor(nextCursor, merge && merge.maxUpdatedAt);
      } else {
        nextCursor = computeMaxCursor(nextCursor, read.maxUpdatedAt);
      }

      await logEvent(syncId, sessionToken, "SYNC_DOWNLOAD", {
        downloaded: applied,
        conflicts: conflicts.length
      });

      return {
        downloaded: applied,
        conflicts: conflicts,
        nextCursor: nextCursor
      };
    }

    async function runCycle(sessionToken) {
      if (runtime.mode) {
        return {
          ok: true,
          skipped: true,
          reason: "MODO_CONTROLADO_ACTIVO",
          mode: runtime.mode
        };
      }

      if (!tokenValidator(sessionToken)) {
        return buildError("SYNC_TOKEN_INVALIDO", "Token invalido para iniciar sync.");
      }

      if (runtime.inFlight) {
        return {
          ok: true,
          skipped: true,
          reason: "SYNC_EN_CURSO"
        };
      }

      var remoteIndex = getRemoteIndex();
      if (!remoteIndex || remoteIndex.ok === false) {
        return buildError(
          asText(remoteIndex && remoteIndex.errorCode) || "SYNC_REMOTO_NO_LISTO",
          asText(remoteIndex && remoteIndex.message) || "Adaptador remoto no listo para sync."
        );
      }
      if (remoteIndex && remoteIndex.remoteIndex) remoteIndex = remoteIndex.remoteIndex;

      if (!remoteIndex || typeof remoteIndex.upsertProductRecord !== "function") {
        return buildError("SYNC_REMOTO_INVALIDO", "El adaptador remoto no expone operaciones de sync.");
      }

      ensureLogger(remoteIndex);

      runtime.inFlight = true;
      var syncId = buildSyncId();
      runtime.syncIdActive = syncId;
      writeState({ inFlight: true, ok: true, mode: runtime.mode || "normal", lastErrorCode: null, lastErrorMessage: null });
      await logEvent(syncId, sessionToken, "SYNC_START", { mode: runtime.mode || "normal" });

      try {
        var state = readState();
        var cursor = asText(state.lastCursor) || null;
        var upload = await uploadPending(syncId, sessionToken, remoteIndex);
        var down = await applyRemoteChanges(syncId, sessionToken, remoteIndex, cursor);
        if (down.error) {
          throw down.error;
        }

        var conflictCount = Array.isArray(down.conflicts) ? down.conflicts.length : 0;
        var pendingAfter = store && typeof store.countPendingUploadProducts === "function"
          ? store.countPendingUploadProducts({ includeDeleted: false })
          : 0;

        var out = {
          ok: true,
          syncId: syncId,
          subidos: upload.uploaded,
          bajados: down.downloaded,
          conflictos: conflictCount,
          erroresPermanentes: Array.isArray(upload.errors) ? upload.errors.length : 0,
          pending: pendingAfter,
          cursor: down.nextCursor || cursor || null,
          lastSyncAt: nowIso()
        };

        writeState({
          ok: true,
          inFlight: false,
          pending: out.pending,
          uploaded: out.subidos,
          downloaded: out.bajados,
          conflicts: out.conflictos,
          lastSyncAt: out.lastSyncAt,
          lastCursor: out.cursor,
          mode: runtime.mode || "normal",
          lastErrorCode: null,
          lastErrorMessage: null
        });

        await logEvent(syncId, sessionToken, "SYNC_FINISH", out);
        runtime.lastResult = out;
        return out;
      } catch (err) {
        var code = asText(err && err.errorCode) || asText(err && err.code) || "SYNC_CYCLE_FAILED";
        var message = asText(err && err.message) || "Fallo en ciclo de sync.";

        await logEvent(syncId, sessionToken, "SYNC_ERROR", { errorCode: code, message: message });
        writeState({
          ok: false,
          inFlight: false,
          mode: runtime.mode || "normal",
          lastErrorCode: code,
          lastErrorMessage: message
        });
        return {
          ok: false,
          syncId: syncId,
          errorCode: code,
          message: message
        };
      } finally {
        runtime.inFlight = false;
        runtime.syncIdActive = null;
      }
    }

    async function ensureListener(sessionToken) {
      if (!config.listenerEnabled) return { ok: true, skipped: true };
      if (!tokenValidator(sessionToken)) {
        stopListener();
        return { ok: false, errorCode: "SYNC_TOKEN_INVALIDO", message: "Token invalido para listener." };
      }

      var remoteIndex = getRemoteIndex();
      if (!remoteIndex || remoteIndex.ok === false) {
        return {
          ok: false,
          errorCode: asText(remoteIndex && remoteIndex.errorCode) || "SYNC_REMOTO_NO_LISTO",
          message: asText(remoteIndex && remoteIndex.message) || "Remoto no listo para listener."
        };
      }
      if (remoteIndex && remoteIndex.remoteIndex) remoteIndex = remoteIndex.remoteIndex;

      if (!remoteIndex || typeof remoteIndex.iniciarListenerCambios !== "function") {
        return { ok: true, skipped: true };
      }

      if (runtime.listenerActive && runtime.listenerSessionToken === sessionToken) {
        return { ok: true, skipped: true };
      }

      stopListener();

      var state = readState();
      var cursor = asText(state.lastCursor) || null;
      var opened = remoteIndex.iniciarListenerCambios(cursor, {
        sessionToken: sessionToken,
        onRemoteChange: function onRemoteChange(payload) {
          var changes = payload && Array.isArray(payload.items) ? payload.items : [];
          if (!changes.length) return;
          if (store && typeof store.fusionarRemotoCambios === "function") {
            var merged = store.fusionarRemotoCambios(changes, {
              conflictosApi: conflictosApi,
              tombstoneApi: tombstoneApi
            });
            var nextCursor = computeMaxCursor(readState().lastCursor, merged && merged.maxUpdatedAt);
            writeState({
              lastCursor: nextCursor,
              downloaded: Number(merged && merged.applied) || 0,
              conflicts: Array.isArray(merged && merged.conflicts) ? merged.conflicts.length : 0,
              ok: true,
              lastErrorCode: null,
              lastErrorMessage: null
            });
          }
          if (typeof safeOptions.onRemoteApplied === "function") {
            safeOptions.onRemoteApplied(payload || {});
          }
        }
      });

      runtime.listenerActive = opened && opened.ok === true;
      runtime.listenerSessionToken = sessionToken;

      if (runtime.listenerActive && !runtime.listenerHeartbeatId && typeof globalScope.setInterval === "function") {
        runtime.listenerHeartbeatId = globalScope.setInterval(function onBeat() {
          runCycle(runtime.listenerSessionToken).catch(function noop() {
            // No-op.
          });
        }, config.heartbeatMs);
      }

      return opened && opened.ok === true
        ? { ok: true }
        : {
            ok: false,
            errorCode: asText(opened && opened.errorCode) || "SYNC_LISTENER_FAILED",
            message: asText(opened && opened.message) || "No se pudo iniciar listener de sync."
          };
    }

    function stopListener() {
      var remoteIndex = getRemoteIndex();
      if (remoteIndex && remoteIndex.remoteIndex) remoteIndex = remoteIndex.remoteIndex;
      if (remoteIndex && typeof remoteIndex.detenerListenerCambios === "function") {
        remoteIndex.detenerListenerCambios();
      }
      runtime.listenerActive = false;
      runtime.listenerSessionToken = "";
      if (runtime.listenerHeartbeatId && typeof globalScope.clearInterval === "function") {
        globalScope.clearInterval(runtime.listenerHeartbeatId);
      }
      runtime.listenerHeartbeatId = null;
    }

    function setModoControlado(mode) {
      runtime.mode = mode ? asText(mode) : null;
      writeState({ mode: runtime.mode || "normal" });
      if (runtime.mode) {
        stopListener();
      }
      return { ok: true, mode: runtime.mode || null };
    }

    function getEstado() {
      return readState();
    }

    async function iniciarSync(sessionToken) {
      var safeToken = asText(sessionToken);
      var out = await runCycle(safeToken);
      if (out && out.ok === true && config.listenerEnabled && !runtime.mode) {
        await ensureListener(safeToken);
      }
      return out;
    }

    function destruir() {
      stopListener();
      runtime.inFlight = false;
      runtime.mode = null;
      return { ok: true };
    }

    runtime.logger = null;
    var runtimeRemote = getRemoteIndex();
    var runtimeRemoteResolved = runtimeRemote && runtimeRemote.remoteIndex ? runtimeRemote.remoteIndex : runtimeRemote;
    ensureLogger(runtimeRemoteResolved);

    return {
      iniciarSync: iniciarSync,
      setModoControlado: setModoControlado,
      getEstado: getEstado,
      ensureListener: ensureListener,
      stopListener: stopListener,
      destruir: destruir
    };
  }

  var api = {
    createSyncManager: createSyncManager
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase8SyncManager = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
