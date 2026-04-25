(function initFase8SyncBackupModule(globalScope) {
  "use strict";

  var DEFAULT_PATH = "fase8_backups";
  var MAX_BACKUPS = 3;
  var SNAPSHOT_SCHEMA_VERSION = 2;
  var VISUAL_ASSET_SCHEMA_VERSION = 1;
  var VISUAL_ASSET_DIR = "_visuals";
  var AUTO_BACKUP_DEBOUNCE_MS = 3500;
  var AUTO_BACKUP_CHANGE_TYPES = {
    product_create_local: true,
    product_upsert_local: true,
    product_update_local: true,
    product_soft_delete_local: true,
    product_hard_delete_local: true,
    draft_confirm: true
  };

  function sanitizeSegment(value) {
    return String(value || "")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 120) || "item";
  }

  function safeCode(err, fallback) {
    if (err && typeof err.code === "string" && err.code.trim()) return err.code.trim();
    if (err && typeof err.errorCode === "string" && err.errorCode.trim()) return err.errorCode.trim();
    return fallback;
  }

  function safeMessage(err, fallback) {
    if (err && typeof err.message === "string" && err.message.trim()) return err.message.trim();
    return fallback;
  }

  function ensureValidToken(sessionToken) {
    return String(sessionToken || "").trim().length > 0;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function toPositiveInt(value, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.floor(n);
  }

  function hashString(value) {
    var input = String(value || "");
    var hash = 2166136261;
    for (var i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
  }

  function isInlineDataUrl(value) {
    return /^data:/i.test(String(value || "").trim());
  }

  function isInterestingAutoBackupChange(change) {
    var type = change && change.type ? String(change.type) : "";
    return !!AUTO_BACKUP_CHANGE_TYPES[type];
  }

  function readSyncState() {
    if (!globalScope || !globalScope.Fase8SyncEstado || typeof globalScope.Fase8SyncEstado.readState !== "function") {
      return null;
    }
    try {
      return globalScope.Fase8SyncEstado.readState();
    } catch (errState) {
      return null;
    }
  }

  function shouldDelayForSync() {
    var syncState = readSyncState();
    return !!(syncState && (syncState.inFlight === true || (syncState.mode && syncState.mode !== "normal")));
  }

  function normalizeVisualEntries(input, fotoRefs) {
    var refs = Array.isArray(fotoRefs)
      ? fotoRefs.map(function mapRef(ref) { return String(ref || "").trim(); }).filter(Boolean).slice(0, 2)
      : [];
    var items = Array.isArray(input) ? input : [];
    var i;

    for (i = 0; i < items.length && refs.length < 2; i += 1) {
      var itemRef = items[i] && typeof items[i] === "object"
        ? String(items[i].ref || "").trim()
        : "";
      if (!itemRef || refs.indexOf(itemRef) >= 0) continue;
      refs.push(itemRef);
    }

    return refs.map(function mapRef(ref, index) {
      var raw = items[index] && typeof items[index] === "object" ? items[index] : {};
      return {
        ref: String(raw.ref || ref).trim() || ref,
        thumbSrc: String(raw.thumbSrc || "").trim() || null,
        viewerSrc: String(raw.viewerSrc || "").trim() || null,
        profileKey: String(raw.profileKey || "").trim() || null,
        qualityPct: toPositiveInt(raw.qualityPct, null),
        resolutionMaxPx: toPositiveInt(raw.resolutionMaxPx, null),
        generatedAt: String(raw.generatedAt || "").trim() || null
      };
    }).filter(function onlyValid(item) {
      return !!String(item.ref || "").trim();
    }).slice(0, 2);
  }

  function getProductVisualState(product) {
    if (!product || !product.visual || typeof product.visual !== "object") return null;
    return {
      fotoRefs: Array.isArray(product.visual.fotoRefs) ? product.visual.fotoRefs.slice(0, 2) : [],
      visuales: normalizeVisualEntries(product.visual.visuales, product.visual.fotoRefs),
      updatedAt: String(product.visual.updatedAt || "").trim() || null
    };
  }

  function setProductVisualState(product, visualState) {
    if (!product || typeof product !== "object") return;
    if (!visualState) {
      delete product.visual;
      return;
    }
    product.visual = {
      fotoRefs: Array.isArray(visualState.fotoRefs) ? visualState.fotoRefs.slice(0, 2) : [],
      visuales: Array.isArray(visualState.visuales) ? clone(visualState.visuales).slice(0, 2) : [],
      updatedAt: String(visualState.updatedAt || "").trim() || nowIso()
    };
  }

  function getDraftVisualState(draft) {
    if (!draft || !draft.evidencia || typeof draft.evidencia !== "object") return null;
    return {
      fotoRefs: Array.isArray(draft.evidencia.fotoRefs) ? draft.evidencia.fotoRefs.slice(0, 2) : [],
      visuales: normalizeVisualEntries(draft.evidencia.visuales, draft.evidencia.fotoRefs),
      updatedAt: draft.metadatos && draft.metadatos.updatedAt ? String(draft.metadatos.updatedAt) : null
    };
  }

  function setDraftVisualState(draft, visualState) {
    if (!draft || typeof draft !== "object") return;
    if (!draft.evidencia || typeof draft.evidencia !== "object") draft.evidencia = {};
    if (!visualState) {
      draft.evidencia.fotoRefs = [];
      draft.evidencia.visuales = [];
      return;
    }
    draft.evidencia.fotoRefs = Array.isArray(visualState.fotoRefs) ? visualState.fotoRefs.slice(0, 2) : [];
    draft.evidencia.visuales = Array.isArray(visualState.visuales) ? clone(visualState.visuales).slice(0, 2) : [];
  }

  function buildVisualAssetKey(entry) {
    return sanitizeSegment("v_" + hashString(JSON.stringify({
      ref: String(entry && entry.ref || "").trim(),
      thumbSrc: String(entry && entry.thumbSrc || "").trim(),
      viewerSrc: String(entry && entry.viewerSrc || "").trim(),
      profileKey: String(entry && entry.profileKey || "").trim(),
      qualityPct: toPositiveInt(entry && entry.qualityPct, null),
      resolutionMaxPx: toPositiveInt(entry && entry.resolutionMaxPx, null)
    })));
  }

  function createSyncBackup(options) {
    var safeOptions = options || {};
    var storageModule = safeOptions.storageModule || null;
    var firebaseApp = safeOptions.firebaseApp || null;
    var rootPath = sanitizeSegment(safeOptions.rootPath || DEFAULT_PATH);
    var userId = sanitizeSegment(safeOptions.userId || "usuario_local");
    var modeApi = safeOptions.modeApi || null;

    if (!storageModule || typeof storageModule.getStorage !== "function") {
      return {
        ok: false,
        errorCode: "SYNC_BACKUP_STORAGE_NO_CONFIGURADO",
        message: "Falta modulo de Firebase Storage para backup."
      };
    }

    var getStorage = storageModule.getStorage;
    var refFn = storageModule.ref;
    var uploadString = storageModule.uploadString;
    var getDownloadURL = storageModule.getDownloadURL;
    var listAll = storageModule.listAll;
    var getMetadata = storageModule.getMetadata;
    var getBlob = storageModule.getBlob;
    var deleteObject = storageModule.deleteObject;

    if (
      typeof refFn !== "function" ||
      typeof uploadString !== "function" ||
      typeof getDownloadURL !== "function" ||
      typeof listAll !== "function" ||
      typeof getMetadata !== "function" ||
      typeof getBlob !== "function" ||
      typeof deleteObject !== "function"
    ) {
      return {
        ok: false,
        errorCode: "SYNC_BACKUP_STORAGE_SDK_INCOMPLETO",
        message: "El SDK de Storage no expone funciones suficientes para backup/restauracion."
      };
    }

    var storage = getStorage(firebaseApp || undefined);

    function buildRootRef() {
      return refFn(storage, rootPath + "/" + userId);
    }

    function buildVisualRootRef() {
      return refFn(storage, rootPath + "/" + userId + "/" + VISUAL_ASSET_DIR);
    }

    function buildVisualAssetRef(assetKey) {
      return refFn(storage, rootPath + "/" + userId + "/" + VISUAL_ASSET_DIR + "/" + sanitizeSegment(assetKey) + ".json");
    }

    function ensureMode(mode) {
      if (modeApi && typeof modeApi.setModoControlado === "function") {
        modeApi.setModoControlado(mode || null);
      }
    }

    async function listBackupItemsInternal() {
      var rootRef = buildRootRef();
      var listed = await listAll(rootRef);
      var items = [];
      for (var i = 0; i < listed.items.length; i += 1) {
        var itemRef = listed.items[i];
        if (itemRef.fullPath.indexOf("/" + VISUAL_ASSET_DIR + "/") >= 0) continue;
        var meta = await getMetadata(itemRef).catch(function onMetaErr() {
          return { updated: null, size: 0 };
        });
        items.push({
          fullPath: itemRef.fullPath,
          name: itemRef.name,
          updated: meta && meta.updated ? meta.updated : null,
          size: meta && Number.isFinite(Number(meta.size)) ? Number(meta.size) : 0
        });
      }
      items.sort(function byDate(a, b) {
        var am = Date.parse(String(a.updated || "")) || 0;
        var bm = Date.parse(String(b.updated || "")) || 0;
        return bm - am;
      });
      return items;
    }

    async function readJsonObject(fullPath) {
      var objectRef = refFn(storage, String(fullPath || "").trim());
      var blob = await getBlob(objectRef);
      var text = await blob.text();
      return JSON.parse(text);
    }

    async function writeVisualAsset(entry) {
      var assetKey = buildVisualAssetKey(entry);
      var objectRef = buildVisualAssetRef(assetKey);
      await uploadString(objectRef, JSON.stringify({
        schemaVersion: VISUAL_ASSET_SCHEMA_VERSION,
        assetKey: assetKey,
        exportedAt: nowIso(),
        visual: {
          ref: String(entry.ref || "").trim() || null,
          thumbSrc: String(entry.thumbSrc || "").trim() || null,
          viewerSrc: String(entry.viewerSrc || "").trim() || null,
          profileKey: String(entry.profileKey || "").trim() || null,
          qualityPct: toPositiveInt(entry.qualityPct, null),
          resolutionMaxPx: toPositiveInt(entry.resolutionMaxPx, null),
          generatedAt: String(entry.generatedAt || "").trim() || null
        }
      }), "raw", {
        contentType: "application/json"
      });
      return assetKey;
    }

    async function prepareVisualStateForSnapshot(visualState) {
      if (!visualState) return { state: null, manifest: [] };
      var fotoRefs = Array.isArray(visualState.fotoRefs)
        ? visualState.fotoRefs.map(function mapRef(ref) { return String(ref || "").trim(); }).filter(Boolean).slice(0, 2)
        : [];
      var visuales = normalizeVisualEntries(visualState.visuales, fotoRefs);
      var manifest = [];
      var sanitizedEntries = [];

      for (var i = 0; i < visuales.length; i += 1) {
        var entry = visuales[i] || {};
        var thumbSrc = String(entry.thumbSrc || "").trim();
        var viewerSrc = String(entry.viewerSrc || "").trim();
        var inline = isInlineDataUrl(thumbSrc) || isInlineDataUrl(viewerSrc);
        var assetKey = null;
        if (inline) {
          assetKey = await writeVisualAsset(entry);
          manifest.push({
            ref: String(entry.ref || "").trim() || null,
            assetKey: assetKey,
            profileKey: String(entry.profileKey || "").trim() || null,
            qualityPct: toPositiveInt(entry.qualityPct, null),
            resolutionMaxPx: toPositiveInt(entry.resolutionMaxPx, null),
            generatedAt: String(entry.generatedAt || "").trim() || null
          });
        }
        sanitizedEntries.push({
          ref: String(entry.ref || "").trim() || null,
          thumbSrc: inline ? null : (thumbSrc || null),
          viewerSrc: inline ? null : (viewerSrc || null),
          profileKey: String(entry.profileKey || "").trim() || null,
          qualityPct: toPositiveInt(entry.qualityPct, null),
          resolutionMaxPx: toPositiveInt(entry.resolutionMaxPx, null),
          generatedAt: String(entry.generatedAt || "").trim() || null
        });
      }

      return {
        state: {
          fotoRefs: fotoRefs,
          visuales: sanitizedEntries,
          updatedAt: String(visualState.updatedAt || "").trim() || nowIso()
        },
        manifest: manifest
      };
    }

    async function prepareSnapshotItems(items, ownerKind, getters) {
      var safeItems = Array.isArray(items) ? clone(items) : [];
      var manifest = {};
      for (var i = 0; i < safeItems.length; i += 1) {
        var item = safeItems[i] || {};
        var ownerId = String(getters.getId(item) || "").trim();
        if (!ownerId) continue;
        var prepared = await prepareVisualStateForSnapshot(getters.getVisual(item));
        if (prepared && prepared.state) {
          getters.setVisual(item, prepared.state);
          if (prepared.manifest.length) {
            manifest[ownerId] = prepared.manifest;
          }
        }
      }
      return {
        items: safeItems,
        manifest: manifest
      };
    }

    async function buildSnapshot(store) {
      var products = store && typeof store.list === "function" ? store.list() : [];
      var drafts = store && typeof store.listRevisionDrafts === "function" ? store.listRevisionDrafts() : [];
      var preparedProducts = await prepareSnapshotItems(products, "product", {
        getId: function getId(item) { return item && item.id; },
        getVisual: getProductVisualState,
        setVisual: setProductVisualState
      });
      var preparedDrafts = await prepareSnapshotItems(drafts, "draft", {
        getId: function getId(item) { return item && item.draftId; },
        getVisual: getDraftVisualState,
        setVisual: setDraftVisualState
      });
      return {
        schemaVersion: SNAPSHOT_SCHEMA_VERSION,
        exportedAt: nowIso(),
        userId: userId,
        products: preparedProducts.items,
        drafts: preparedDrafts.items,
        visualManifest: {
          products: preparedProducts.manifest,
          drafts: preparedDrafts.manifest
        }
      };
    }

    async function restoreVisualStateFromManifest(visualState, manifestEntries) {
      var safeState = visualState || { fotoRefs: [], visuales: [], updatedAt: null };
      var currentEntries = normalizeVisualEntries(safeState.visuales, safeState.fotoRefs);
      var byRef = Object.create(null);
      var i;

      for (i = 0; i < currentEntries.length; i += 1) {
        byRef[currentEntries[i].ref] = clone(currentEntries[i]);
      }

      var safeManifest = Array.isArray(manifestEntries) ? manifestEntries : [];
      for (i = 0; i < safeManifest.length; i += 1) {
        var manifest = safeManifest[i] || {};
        var ref = String(manifest.ref || "").trim();
        if (!ref) continue;
        var current = byRef[ref] || {
          ref: ref,
          thumbSrc: null,
          viewerSrc: null,
          profileKey: String(manifest.profileKey || "").trim() || null,
          qualityPct: toPositiveInt(manifest.qualityPct, null),
          resolutionMaxPx: toPositiveInt(manifest.resolutionMaxPx, null),
          generatedAt: String(manifest.generatedAt || "").trim() || null
        };
        var assetKey = String(manifest.assetKey || "").trim();
        if (assetKey) {
          try {
            var assetPayload = await readJsonObject(buildVisualAssetRef(assetKey).fullPath);
            var visual = assetPayload && assetPayload.visual ? assetPayload.visual : {};
            current.thumbSrc = String(visual.thumbSrc || current.thumbSrc || "").trim() || null;
            current.viewerSrc = String(visual.viewerSrc || current.viewerSrc || "").trim() || null;
            current.profileKey = String(visual.profileKey || current.profileKey || "").trim() || null;
            current.qualityPct = toPositiveInt(visual.qualityPct, current.qualityPct || null);
            current.resolutionMaxPx = toPositiveInt(visual.resolutionMaxPx, current.resolutionMaxPx || null);
            current.generatedAt = String(visual.generatedAt || current.generatedAt || "").trim() || null;
          } catch (errAsset) {
            // Mantener estado ligero si el binario visual ya no esta.
          }
        }
        byRef[ref] = current;
      }

      var refs = Array.isArray(safeState.fotoRefs) ? safeState.fotoRefs.slice(0, 2) : [];
      Object.keys(byRef).forEach(function each(ref) {
        if (refs.indexOf(ref) >= 0 || refs.length >= 2) return;
        refs.push(ref);
      });

      return {
        fotoRefs: refs,
        visuales: refs.map(function mapRef(ref) {
          return byRef[ref] || { ref: ref };
        }).slice(0, 2),
        updatedAt: String(safeState.updatedAt || "").trim() || nowIso()
      };
    }

    async function hydrateItemsFromManifest(items, manifestByOwner, getters) {
      var safeItems = Array.isArray(items) ? items : [];
      for (var i = 0; i < safeItems.length; i += 1) {
        var item = safeItems[i] || {};
        var ownerId = String(getters.getId(item) || "").trim();
        if (!ownerId) continue;
        var manifestEntries = manifestByOwner && manifestByOwner[ownerId];
        if (!manifestEntries || !manifestEntries.length) continue;
        var restoredVisual = await restoreVisualStateFromManifest(getters.getVisual(item), manifestEntries);
        getters.setVisual(item, restoredVisual);
      }
      return safeItems;
    }

    function collectAssetKeysFromVisualState(visualState, bag) {
      var safeVisual = visualState || null;
      if (!safeVisual || !Array.isArray(safeVisual.visuales)) return;
      for (var i = 0; i < safeVisual.visuales.length; i += 1) {
        var entry = safeVisual.visuales[i] || {};
        var thumbSrc = String(entry.thumbSrc || "").trim();
        var viewerSrc = String(entry.viewerSrc || "").trim();
        if (!isInlineDataUrl(thumbSrc) && !isInlineDataUrl(viewerSrc)) continue;
        bag[buildVisualAssetKey(entry)] = true;
      }
    }

    function collectLiveAssetKeys(store) {
      var bag = Object.create(null);
      var products = store && typeof store.list === "function" ? store.list() : [];
      var drafts = store && typeof store.listRevisionDrafts === "function" ? store.listRevisionDrafts() : [];
      for (var i = 0; i < products.length; i += 1) {
        collectAssetKeysFromVisualState(getProductVisualState(products[i]), bag);
      }
      for (i = 0; i < drafts.length; i += 1) {
        collectAssetKeysFromVisualState(getDraftVisualState(drafts[i]), bag);
      }
      return bag;
    }

    function collectAssetKeysFromSnapshot(snapshot, bag) {
      var safeSnapshot = snapshot || {};
      var visualManifest = safeSnapshot.visualManifest || {};
      ["products", "drafts"].forEach(function eachBucket(bucket) {
        var bucketMap = visualManifest && visualManifest[bucket] ? visualManifest[bucket] : {};
        Object.keys(bucketMap).forEach(function eachOwner(ownerId) {
          var entries = Array.isArray(bucketMap[ownerId]) ? bucketMap[ownerId] : [];
          entries.forEach(function eachEntry(entry) {
            var assetKey = String(entry && entry.assetKey || "").trim();
            if (assetKey) bag[assetKey] = true;
          });
        });
      });
      return bag;
    }

    async function cleanupVisualAssets(store, keptBackupItems) {
      try {
        var keepAssetKeys = collectLiveAssetKeys(store);
        var backups = Array.isArray(keptBackupItems) ? keptBackupItems : [];
        for (var i = 0; i < backups.length; i += 1) {
          try {
            var snapshot = await readJsonObject(backups[i].fullPath);
            collectAssetKeysFromSnapshot(snapshot, keepAssetKeys);
          } catch (errReadBackup) {
            // No-op.
          }
        }

        var visualRoot = buildVisualRootRef();
        var listed = await listAll(visualRoot).catch(function onListErr() {
          return { items: [] };
        });
        var items = listed && Array.isArray(listed.items) ? listed.items : [];
        for (var j = 0; j < items.length; j += 1) {
          var itemRef = items[j];
          var key = String(itemRef.name || "").replace(/\.json$/i, "");
          if (!key || keepAssetKeys[key]) continue;
          await deleteObject(itemRef).catch(function onDeleteErr() {
            return null;
          });
        }
      } catch (errCleanup) {
        // No-op.
      }
    }

    async function trimBackups(store) {
      try {
        var items = await listBackupItemsInternal();
        if (items.length > MAX_BACKUPS) {
          for (var i = MAX_BACKUPS; i < items.length; i += 1) {
            var refDelete = refFn(storage, items[i].fullPath);
            await deleteObject(refDelete);
          }
          items = await listBackupItemsInternal();
        }
        await cleanupVisualAssets(store, items.slice(0, MAX_BACKUPS));
      } catch (errTrim) {
        // No-op.
      }
    }

    async function exportarBackup(sessionToken, store) {
      if (!ensureValidToken(sessionToken)) {
        return {
          ok: false,
          errorCode: "SYNC_BACKUP_TOKEN_INVALIDO",
          message: "Falta sessionToken valido para backup."
        };
      }

      ensureMode("backup");
      try {
        var snapshot = await buildSnapshot(store);
        var ts = Date.now();
        var fileName = ts + ".json";
        var objectRef = refFn(storage, rootPath + "/" + userId + "/" + fileName);
        await uploadString(objectRef, JSON.stringify(snapshot), "raw", {
          contentType: "application/json"
        });
        var downloadURL = await getDownloadURL(objectRef);
        await trimBackups(store);
        return {
          ok: true,
          fileName: fileName,
          downloadURL: downloadURL,
          exportedAt: snapshot.exportedAt,
          countProducts: snapshot.products.length,
          countDrafts: snapshot.drafts.length,
          visualAssets: Object.keys((snapshot.visualManifest && snapshot.visualManifest.products) || {}).length +
            Object.keys((snapshot.visualManifest && snapshot.visualManifest.drafts) || {}).length
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "SYNC_BACKUP_EXPORT_FAILED"),
          message: safeMessage(err, "No se pudo exportar backup.")
        };
      } finally {
        ensureMode(null);
      }
    }

    async function listarBackups(sessionToken) {
      if (!ensureValidToken(sessionToken)) {
        return {
          ok: false,
          errorCode: "SYNC_BACKUP_TOKEN_INVALIDO",
          message: "Falta sessionToken valido para listar backups."
        };
      }

      try {
        return {
          ok: true,
          items: await listBackupItemsInternal()
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "SYNC_BACKUP_LIST_FAILED"),
          message: safeMessage(err, "No se pudo listar backups.")
        };
      }
    }

    async function restaurarBackup(sessionToken, fullPath, store) {
      if (!ensureValidToken(sessionToken)) {
        return {
          ok: false,
          errorCode: "SYNC_BACKUP_TOKEN_INVALIDO",
          message: "Falta sessionToken valido para restaurar backup."
        };
      }
      if (!store || typeof store.replaceAllProducts !== "function" || typeof store.replaceRevisionDrafts !== "function") {
        return {
          ok: false,
          errorCode: "SYNC_BACKUP_STORE_NO_CONFIGURADO",
          message: "Store no configurado para restauracion."
        };
      }

      var path = String(fullPath || "").trim();
      if (!path) {
        return {
          ok: false,
          errorCode: "SYNC_BACKUP_PATH_INVALIDO",
          message: "Falta ruta del backup a restaurar."
        };
      }

      ensureMode("restore");
      try {
        var parsed = await readJsonObject(path);
        var products = Array.isArray(parsed && parsed.products) ? clone(parsed.products) : [];
        var drafts = Array.isArray(parsed && parsed.drafts) ? clone(parsed.drafts) : [];
        var visualManifest = parsed && parsed.visualManifest && typeof parsed.visualManifest === "object"
          ? parsed.visualManifest
          : { products: {}, drafts: {} };

        await hydrateItemsFromManifest(products, visualManifest.products || {}, {
          getId: function getId(item) { return item && item.id; },
          getVisual: getProductVisualState,
          setVisual: setProductVisualState
        });
        await hydrateItemsFromManifest(drafts, visualManifest.drafts || {}, {
          getId: function getId(item) { return item && item.draftId; },
          getVisual: getDraftVisualState,
          setVisual: setDraftVisualState
        });

        var restoredProducts = store.replaceAllProducts(products);
        var restoredDrafts = store.replaceRevisionDrafts(drafts);

        return {
          ok: true,
          restoredProducts: restoredProducts && restoredProducts.loaded ? restoredProducts.loaded : 0,
          restoredDrafts: restoredDrafts && restoredDrafts.loaded ? restoredDrafts.loaded : 0
        };
      } catch (err) {
        return {
          ok: false,
          errorCode: safeCode(err, "SYNC_BACKUP_RESTORE_FAILED"),
          message: safeMessage(err, "No se pudo restaurar backup.")
        };
      } finally {
        ensureMode(null);
      }
    }

    return {
      ok: true,
      exportarBackup: exportarBackup,
      listarBackups: listarBackups,
      restaurarBackup: restaurarBackup
    };
  }

  function createAutoBackupBridge(options) {
    var safeOptions = options || {};
    var store = safeOptions.store || null;
    var getController = typeof safeOptions.getController === "function"
      ? safeOptions.getController
      : function defaultGetController() { return null; };
    var getSessionToken = typeof safeOptions.getSessionToken === "function"
      ? safeOptions.getSessionToken
      : function defaultGetSessionToken() { return ""; };
    var debounceMs = Math.max(500, toPositiveInt(safeOptions.debounceMs, AUTO_BACKUP_DEBOUNCE_MS));
    var onStatus = typeof safeOptions.onStatus === "function" ? safeOptions.onStatus : null;
    var timerId = null;
    var unsubscribeStore = null;
    var subscribedReady = false;
    var pendingReason = null;
    var running = false;
    var disposed = false;

    function notify(status, detail) {
      if (onStatus) {
        try {
          onStatus(status, detail || null);
        } catch (errStatus) {
          // No-op.
        }
      }
    }

    function clearTimer() {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    }

    async function flush(reason) {
      if (disposed) return { ok: false, errorCode: "SYNC_BACKUP_AUTO_DISPOSED" };
      if (running) {
        pendingReason = pendingReason || reason || "queued";
        return { ok: true, queued: true };
      }
      if (shouldDelayForSync()) {
        schedule(reason || "sync_busy");
        return { ok: true, delayed: true };
      }

      var token = String(getSessionToken() || "").trim();
      if (!token) {
        pendingReason = reason || pendingReason || "token_missing";
        notify("skipped", { reason: pendingReason });
        return { ok: false, errorCode: "SYNC_BACKUP_TOKEN_INVALIDO", message: "Sin token valido para copia automatica." };
      }

      var controller = getController();
      if (!controller || controller.ok !== true || typeof controller.exportarBackup !== "function") {
        pendingReason = reason || pendingReason || "controller_missing";
        notify("skipped", { reason: pendingReason });
        return { ok: false, errorCode: "SYNC_BACKUP_NO_DISPONIBLE", message: "Controlador de copia automatica no disponible." };
      }

      running = true;
      notify("running", { reason: reason || pendingReason || "auto" });
      try {
        var out = await controller.exportarBackup(token, store);
        if (out && out.ok === true) {
          pendingReason = null;
          notify("done", out);
          return out;
        }
        pendingReason = reason || pendingReason || "export_failed";
        notify("error", out);
        return out;
      } catch (err) {
        pendingReason = reason || pendingReason || "export_failed";
        var errorOut = {
          ok: false,
          errorCode: safeCode(err, "SYNC_BACKUP_EXPORT_FAILED"),
          message: safeMessage(err, "No se pudo crear la copia automatica.")
        };
        notify("error", errorOut);
        return errorOut;
      } finally {
        running = false;
        if (pendingReason && !disposed) {
          schedule(pendingReason);
        }
      }
    }

    function schedule(reason) {
      if (disposed) return;
      pendingReason = reason || pendingReason || "auto";
      clearTimer();
      timerId = setTimeout(function onTimer() {
        timerId = null;
        flush(pendingReason || "auto");
      }, debounceMs);
    }

    function connect() {
      if (!store || typeof store.subscribeChanges !== "function") {
        return {
          ok: false,
          errorCode: "SYNC_BACKUP_AUTO_STORE_INVALIDO",
          message: "Store no valido para copia automatica."
        };
      }
      if (!unsubscribeStore) {
        unsubscribeStore = store.subscribeChanges(function onChange(change) {
          if (!isInterestingAutoBackupChange(change)) return;
          schedule(change.type || "auto");
        });
      }
      if (!subscribedReady && globalScope && typeof globalScope.addEventListener === "function") {
        subscribedReady = true;
        globalScope.addEventListener("fase3-firebase-ready", function onFirebaseReady() {
          if (pendingReason) schedule("firebase_ready");
        });
        globalScope.addEventListener("online", function onOnline() {
          if (pendingReason) schedule("online");
        });
      }
      return { ok: true };
    }

    function dispose() {
      disposed = true;
      clearTimer();
      if (typeof unsubscribeStore === "function") {
        unsubscribeStore();
        unsubscribeStore = null;
      }
      pendingReason = null;
      return { ok: true };
    }

    return {
      ok: true,
      connect: connect,
      schedule: schedule,
      flush: flush,
      dispose: dispose
    };
  }

  var api = {
    DEFAULT_PATH: DEFAULT_PATH,
    MAX_BACKUPS: MAX_BACKUPS,
    createSyncBackup: createSyncBackup,
    createAutoBackupBridge: createAutoBackupBridge
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase8SyncBackup = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
