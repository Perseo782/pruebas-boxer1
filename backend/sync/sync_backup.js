(function initFase8SyncBackupModule(globalScope) {
  "use strict";

  var DEFAULT_PATH = "fase8_backups";
  var MAX_BACKUPS = 3;
  var SNAPSHOT_SCHEMA_VERSION = 2;
  var VISUAL_ASSET_SCHEMA_VERSION = 1;
  var VISUAL_ASSET_DIR = "_visuals";
  var AUTO_BACKUP_DEBOUNCE_MS = 3500;
  var FIRESTORE_FALLBACK_COLLECTION = "historial_eventos";
  var FIRESTORE_BACKUP_KIND = "sync_snapshot";
  var FIRESTORE_BACKUP_CHUNK_KIND = "sync_snapshot_chunk";
  var FIRESTORE_USER_COLLECTION_SUFFIX = "_users";
  var FIRESTORE_ITEMS_SUBCOLLECTION = "items";
  var FIRESTORE_CHUNKS_SUBCOLLECTION = "chunks";
  var FIRESTORE_CHUNK_SIZE = 180000;
  var STORAGE_PROVIDER_TIMEOUT_MS = 4500;
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

  function splitTextChunks(text, chunkSize) {
    var raw = String(text || "");
    var size = Math.max(1000, toPositiveInt(chunkSize, FIRESTORE_CHUNK_SIZE));
    var parts = [];
    for (var start = 0; start < raw.length; start += size) {
      parts.push(raw.slice(start, start + size));
    }
    return parts.length ? parts : [""];
  }

  function joinTextChunks(items) {
    return (Array.isArray(items) ? items : []).join("");
  }

  function encodeBackupPath(kind, path) {
    return String(kind || "storage") + ":" + String(path || "").trim();
  }

  function decodeBackupPath(fullPath) {
    var raw = String(fullPath || "").trim();
    var idx = raw.indexOf(":");
    if (idx > 0) {
      var kind = raw.slice(0, idx).trim().toLowerCase();
      var path = raw.slice(idx + 1).trim();
      if ((kind === "storage" || kind === "firestore") && path) {
        return { kind: kind, path: path };
      }
    }
    return {
      kind: "storage",
      path: raw
    };
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
    var firestoreModule = safeOptions.firestoreModule || null;
    var firebaseApp = safeOptions.firebaseApp || null;
    var rootPath = sanitizeSegment(safeOptions.rootPath || DEFAULT_PATH);
    var userId = sanitizeSegment(safeOptions.userId || "usuario_local");
    var modeApi = safeOptions.modeApi || null;
    var ensureAuth = typeof safeOptions.ensureAuth === "function" ? safeOptions.ensureAuth : null;
    var getStorage = storageModule && typeof storageModule.getStorage === "function"
      ? storageModule.getStorage
      : null;
    var refFn = storageModule ? storageModule.ref : null;
    var uploadString = storageModule ? storageModule.uploadString : null;
    var listAll = storageModule ? storageModule.listAll : null;
    var getBlob = storageModule ? storageModule.getBlob : null;
    var deleteObject = storageModule ? storageModule.deleteObject : null;
    var hasStorageProvider = !!(
      getStorage &&
      typeof refFn === "function" &&
      typeof uploadString === "function" &&
      typeof listAll === "function" &&
      typeof getBlob === "function" &&
      typeof deleteObject === "function"
    );

    var getFirestore = firestoreModule && typeof firestoreModule.getFirestore === "function"
      ? firestoreModule.getFirestore
      : null;
    var collectionFn = firestoreModule ? firestoreModule.collection : null;
    var deleteDocFn = firestoreModule ? firestoreModule.deleteDoc : null;
    var docFn = firestoreModule ? firestoreModule.doc : null;
    var getDocFn = firestoreModule ? firestoreModule.getDoc : null;
    var getDocsFn = firestoreModule ? firestoreModule.getDocs : null;
    var limitFn = firestoreModule ? firestoreModule.limit : null;
    var orderByFn = firestoreModule ? firestoreModule.orderBy : null;
    var queryFn = firestoreModule ? firestoreModule.query : null;
    var setDocFn = firestoreModule ? firestoreModule.setDoc : null;
    var writeBatchFn = firestoreModule ? firestoreModule.writeBatch : null;
    var hasFirestoreProvider = !!(
      getFirestore &&
      typeof collectionFn === "function" &&
      typeof deleteDocFn === "function" &&
      typeof docFn === "function" &&
      typeof getDocFn === "function" &&
      typeof getDocsFn === "function" &&
      typeof limitFn === "function" &&
      typeof orderByFn === "function" &&
      typeof queryFn === "function" &&
      typeof setDocFn === "function" &&
      typeof writeBatchFn === "function"
    );

    if (!hasStorageProvider && !hasFirestoreProvider) {
      return {
        ok: false,
        errorCode: "SYNC_BACKUP_NO_PROVIDER",
        message: "No hay servicio de nube disponible para las copias."
      };
    }

    var storage = hasStorageProvider ? getStorage(firebaseApp || undefined) : null;
    var firestore = hasFirestoreProvider ? getFirestore(firebaseApp || undefined) : null;

    function buildRootRef() {
      return refFn(storage, rootPath + "/" + userId);
    }

    function buildVisualRootRef() {
      return refFn(storage, rootPath + "/" + userId + "/" + VISUAL_ASSET_DIR);
    }

    function buildVisualAssetRef(assetKey) {
      return refFn(storage, rootPath + "/" + userId + "/" + VISUAL_ASSET_DIR + "/" + sanitizeSegment(assetKey) + ".json");
    }

    function buildFirestoreFallbackCollection() {
      return collectionFn(firestore, FIRESTORE_FALLBACK_COLLECTION);
    }

    function buildFirestoreBackupDoc(backupId) {
      return docFn(buildFirestoreFallbackCollection(), sanitizeSegment(backupId || "backup"));
    }

    function buildFirestoreChunkDoc(backupId, index) {
      return docFn(
        buildFirestoreFallbackCollection(),
        sanitizeSegment(String(backupId || "backup") + "_chunk_" + String(index).padStart(4, "0"))
      );
    }

    function ensureMode(mode) {
      if (modeApi && typeof modeApi.setModoControlado === "function") {
        modeApi.setModoControlado(mode || null);
      }
    }

    async function ensureStorageAuth(sessionToken) {
      if (!ensureAuth) return { ok: true };
      try {
        var out = await ensureAuth(sessionToken);
        if (!out || out.ok !== true) {
          return out || {
            ok: false,
            errorCode: "SYNC_BACKUP_AUTH_FAILED",
            message: "No se pudo preparar acceso a la nube para las copias."
          };
        }
        return out;
      } catch (errAuth) {
        return {
          ok: false,
          errorCode: safeCode(errAuth, "SYNC_BACKUP_AUTH_FAILED"),
          message: safeMessage(errAuth, "No se pudo preparar acceso a la nube para las copias.")
        };
      }
    }

    function parseBackupUpdated(fileName) {
      var match = String(fileName || "").trim().match(/^(\d{10,17})\.json$/i);
      if (!match) return null;
      var ms = Number(match[1]);
      if (!Number.isFinite(ms) || ms <= 0) return null;
      try {
        return new Date(ms).toISOString();
      } catch (errDate) {
        return null;
      }
    }

    function getBackupSortMs(item) {
      var explicitMs = Number(item && item.updatedMs || 0);
      if (Number.isFinite(explicitMs) && explicitMs > 0) return explicitMs;
      var parsed = Date.parse(String(item && item.updated || ""));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
      return 0;
    }

    function sortBackupItemsDesc(a, b) {
      var delta = getBackupSortMs(b) - getBackupSortMs(a);
      if (delta !== 0) return delta;
      return String(b && b.name || "").localeCompare(String(a && a.name || ""));
    }

    async function listStorageBackupItems() {
      if (!hasStorageProvider) {
        return {
          ok: false,
          errorCode: "SYNC_BACKUP_STORAGE_NO_DISPONIBLE",
          message: "La nube de copias no esta disponible."
        };
      }
      var rootRef = buildRootRef();
      var listed = await withStorageTimeout(listAll(rootRef), "listar copias");
      var items = [];
      for (var i = 0; i < listed.items.length; i += 1) {
        var itemRef = listed.items[i];
        if (itemRef.fullPath.indexOf("/" + VISUAL_ASSET_DIR + "/") >= 0) continue;
        var updated = parseBackupUpdated(itemRef.name);
        items.push({
          providerKind: "storage",
          providerPath: itemRef.fullPath,
          fullPath: encodeBackupPath("storage", itemRef.fullPath),
          name: itemRef.name,
          updated: updated,
          updatedMs: Date.parse(String(updated || "")) || 0,
          size: 0,
          snapshotHash: null
        });
      }
      items.sort(sortBackupItemsDesc);
      return {
        ok: true,
        items: items
      };
    }

    async function readStorageJsonObject(fullPath) {
      var objectRef = refFn(storage, String(fullPath || "").trim());
      var blob = await withStorageTimeout(getBlob(objectRef), "leer copia");
      var text = await blob.text();
      return JSON.parse(text);
    }

    async function writeVisualAsset(entry) {
      var assetKey = buildVisualAssetKey(entry);
      var objectRef = buildVisualAssetRef(assetKey);
      await withStorageTimeout(uploadString(objectRef, JSON.stringify({
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
      }), "guardar foto ligera");
      return assetKey;
    }

    async function prepareVisualStateForSnapshot(visualState, options) {
      var safeOptions = options || {};
      var persistInlineAssets = safeOptions.persistInlineAssets === true && hasStorageProvider;
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
        if (inline && persistInlineAssets) {
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

    async function prepareSnapshotItems(items, getters, options) {
      var safeItems = Array.isArray(items) ? clone(items) : [];
      var manifest = {};
      for (var i = 0; i < safeItems.length; i += 1) {
        var item = safeItems[i] || {};
        var ownerId = String(getters.getId(item) || "").trim();
        if (!ownerId) continue;
        var prepared = await prepareVisualStateForSnapshot(getters.getVisual(item), options);
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

    async function buildSnapshot(store, options) {
      var products = store && typeof store.list === "function" ? store.list() : [];
      var drafts = store && typeof store.listRevisionDrafts === "function" ? store.listRevisionDrafts() : [];
      var preparedProducts = await prepareSnapshotItems(products, {
        getId: function getId(item) { return item && item.id; },
        getVisual: getProductVisualState,
        setVisual: setProductVisualState
      }, options);
      var preparedDrafts = await prepareSnapshotItems(drafts, {
        getId: function getId(item) { return item && item.draftId; },
        getVisual: getDraftVisualState,
        setVisual: setDraftVisualState
      }, options);
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
            var assetPayload = await readStorageJsonObject(buildVisualAssetRef(assetKey).fullPath);
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
      if (!hasStorageProvider) return;
      try {
        var keepAssetKeys = collectLiveAssetKeys(store);
        var backups = Array.isArray(keptBackupItems)
          ? keptBackupItems.filter(function onlyStorage(item) {
              return item && item.providerKind === "storage" && item.providerPath;
            })
          : [];
        for (var i = 0; i < backups.length; i += 1) {
          try {
            var snapshot = await readStorageJsonObject(backups[i].providerPath);
            collectAssetKeysFromSnapshot(snapshot, keepAssetKeys);
          } catch (errReadBackup) {
            // No-op.
          }
        }

        var visualRoot = buildVisualRootRef();
        var listed = await withStorageTimeout(listAll(visualRoot), "limpiar fotos").catch(function onListErr() {
          return { items: [] };
        });
        var items = listed && Array.isArray(listed.items) ? listed.items : [];
        for (var j = 0; j < items.length; j += 1) {
          var itemRef = items[j];
          var key = String(itemRef.name || "").replace(/\.json$/i, "");
          if (!key || keepAssetKeys[key]) continue;
          await withStorageTimeout(deleteObject(itemRef), "borrar foto antigua").catch(function onDeleteErr() {
            return null;
          });
        }
      } catch (errCleanup) {
        // No-op.
      }
    }

    function countVisualAssets(snapshot) {
      var total = 0;
      var visualManifest = snapshot && snapshot.visualManifest ? snapshot.visualManifest : {};
      ["products", "drafts"].forEach(function eachBucket(bucket) {
        var bucketMap = visualManifest && visualManifest[bucket] ? visualManifest[bucket] : {};
        Object.keys(bucketMap).forEach(function eachOwner(ownerId) {
          var items = Array.isArray(bucketMap[ownerId]) ? bucketMap[ownerId] : [];
          total += items.length;
        });
      });
      return total;
    }

    function buildSnapshotHash(snapshot) {
      var safeSnapshot = snapshot ? clone(snapshot) : {};
      delete safeSnapshot.exportedAt;
      delete safeSnapshot.snapshotHash;
      return hashString(JSON.stringify(safeSnapshot));
    }

    function createProviderError(code, message) {
      var err = new Error(String(message || "Error"));
      err.code = String(code || "SYNC_BACKUP_ERROR");
      return err;
    }

    function withStorageTimeout(promise, actionLabel) {
      return Promise.race([
        promise,
        new Promise(function onTimeout(_, reject) {
          setTimeout(function fireTimeout() {
            reject(createProviderError(
              "SYNC_BACKUP_STORAGE_TIMEOUT",
              "La ruta antigua de copias tardo demasiado en responder durante " + String(actionLabel || "la operacion") + "."
            ));
          }, STORAGE_PROVIDER_TIMEOUT_MS);
        })
      ]);
    }

    async function listFirestoreBackupItems() {
      if (!hasFirestoreProvider) {
        return {
          ok: false,
          errorCode: "SYNC_BACKUP_FIRESTORE_NO_DISPONIBLE",
          message: "La nube compartida no esta disponible."
        };
      }
      var listed = await getDocsFn(buildFirestoreFallbackCollection());
      var items = [];
      listed.forEach(function each(docSnap) {
        if (!docSnap || typeof docSnap.data !== "function") return;
        var data = docSnap.data() || {};
        if (String(data.backupKind || "").trim() !== FIRESTORE_BACKUP_KIND) return;
        if (String(data.backupOwnerKey || "").trim() !== userId) return;
        var backupId = String(docSnap.id || "").trim();
        if (!backupId) return;
        var fileName = String(data.name || (backupId + ".json")).trim();
        var updated = String(data.backupUpdatedAt || data.updated || "").trim() || parseBackupUpdated(fileName) || null;
        items.push({
          providerKind: "firestore",
          providerPath: backupId,
          fullPath: encodeBackupPath("firestore", backupId),
          name: fileName,
          updated: updated,
          updatedMs: Number(data.updatedMs || 0) || (Date.parse(String(updated || "")) || 0),
          size: Number(data.size || 0) || 0,
          snapshotHash: String(data.snapshotHash || "").trim() || null
        });
      });
      items.sort(sortBackupItemsDesc);
      return {
        ok: true,
        items: items
      };
    }

    async function listAllBackupItems() {
      var results = [];
      if (hasStorageProvider) {
        try {
          results.push(await listStorageBackupItems());
        } catch (errStorageList) {
          results.push({
            ok: false,
            providerKind: "storage",
            errorCode: safeCode(errStorageList, "SYNC_BACKUP_LIST_FAILED"),
            message: safeMessage(errStorageList, "No se pudieron consultar las copias.")
          });
        }
      }
      if (hasFirestoreProvider) {
        try {
          results.push(await listFirestoreBackupItems());
        } catch (errFirestoreList) {
          results.push({
            ok: false,
            providerKind: "firestore",
            errorCode: safeCode(errFirestoreList, "SYNC_BACKUP_LIST_FAILED"),
            message: safeMessage(errFirestoreList, "No se pudieron consultar las copias.")
          });
        }
      }

      var items = [];
      var okProviders = 0;
      for (var i = 0; i < results.length; i += 1) {
        if (!results[i] || results[i].ok !== true) continue;
        okProviders += 1;
        items = items.concat(Array.isArray(results[i].items) ? results[i].items : []);
      }
      items.sort(sortBackupItemsDesc);
      return {
        ok: okProviders > 0,
        items: items,
        providerResults: results
      };
    }

    async function writeFirestoreBackupSnapshot(snapshot, snapshotHash) {
      if (!hasFirestoreProvider) {
        throw createProviderError("SYNC_BACKUP_FIRESTORE_NO_DISPONIBLE", "La nube compartida no esta disponible.");
      }
      var fileName = Date.now() + ".json";
      var backupId = sanitizeSegment("backup_" + userId + "_" + String(fileName).replace(/\.json$/i, ""));
      var backupDoc = buildFirestoreBackupDoc(backupId);
      var snapshotText = JSON.stringify(snapshot || {});
      var chunks = splitTextChunks(snapshotText, FIRESTORE_CHUNK_SIZE);
      var updated = String(snapshot && snapshot.exportedAt || "").trim() || nowIso();
      await setDocFn(backupDoc, {
        backupKind: FIRESTORE_BACKUP_KIND,
        backupOwnerKey: userId,
        backupId: backupId,
        name: fileName,
        backupUpdatedAt: updated,
        updatedMs: Date.parse(updated) || Date.now(),
        size: snapshotText.length,
        snapshotHash: String(snapshotHash || "").trim() || null,
        chunkCount: chunks.length,
        countProducts: Array.isArray(snapshot && snapshot.products) ? snapshot.products.length : 0,
        countDrafts: Array.isArray(snapshot && snapshot.drafts) ? snapshot.drafts.length : 0,
        schemaVersion: snapshot && snapshot.schemaVersion ? snapshot.schemaVersion : SNAPSHOT_SCHEMA_VERSION
      });
      var batch = writeBatchFn(firestore);
      for (var i = 0; i < chunks.length; i += 1) {
        batch.set(buildFirestoreChunkDoc(backupId, i), {
          backupKind: FIRESTORE_BACKUP_CHUNK_KIND,
          backupOwnerKey: userId,
          backupRefId: backupId,
          chunkIndex: i,
          chunkData: chunks[i]
        });
      }
      await batch.commit();
      return {
        ok: true,
        providerKind: "firestore",
        fileName: fileName,
        exportedAt: updated,
        countProducts: Array.isArray(snapshot && snapshot.products) ? snapshot.products.length : 0,
        countDrafts: Array.isArray(snapshot && snapshot.drafts) ? snapshot.drafts.length : 0,
        visualAssets: countVisualAssets(snapshot)
      };
    }

    async function readFirestoreSnapshot(backupId) {
      if (!hasFirestoreProvider) {
        throw createProviderError("SYNC_BACKUP_FIRESTORE_NO_DISPONIBLE", "La nube compartida no esta disponible.");
      }
      var safeBackupId = sanitizeSegment(backupId || "");
      if (!safeBackupId) {
        throw createProviderError("SYNC_BACKUP_PATH_INVALIDO", "Falta la copia a restaurar.");
      }
      var backupDoc = buildFirestoreBackupDoc(safeBackupId);
      var header = await getDocFn(backupDoc);
      if (!header || (typeof header.exists === "function" && header.exists() !== true)) {
        throw createProviderError("SYNC_BACKUP_NOT_FOUND", "La copia ya no existe.");
      }
      var chunksSnap = await getDocsFn(buildFirestoreFallbackCollection());
      var orderedChunks = [];
      chunksSnap.forEach(function each(docSnap) {
        if (!docSnap || typeof docSnap.data !== "function") return;
        var data = docSnap.data() || {};
        if (String(data.backupKind || "").trim() !== FIRESTORE_BACKUP_CHUNK_KIND) return;
        if (String(data.backupRefId || "").trim() !== safeBackupId) return;
        orderedChunks.push({
          index: Number(data.chunkIndex || 0) || 0,
          data: String(data.chunkData || "")
        });
      });
      orderedChunks.sort(function byIndex(a, b) {
        return a.index - b.index;
      });
      return JSON.parse(joinTextChunks(orderedChunks.map(function mapChunk(item) {
        return item.data;
      })) || "{}");
    }

    async function readSnapshotHashFromItem(item) {
      var safeItem = item || null;
      if (!safeItem) return null;
      var inlineHash = String(safeItem.snapshotHash || "").trim();
      if (inlineHash) return inlineHash;
      if (safeItem.providerKind === "storage" && safeItem.providerPath) {
        var storageSnapshot = await readStorageJsonObject(safeItem.providerPath);
        return String(storageSnapshot && storageSnapshot.snapshotHash || "").trim() || buildSnapshotHash(storageSnapshot);
      }
      if (safeItem.providerKind === "firestore" && safeItem.providerPath) {
        var firestoreSnapshot = await readFirestoreSnapshot(safeItem.providerPath);
        return String(firestoreSnapshot && firestoreSnapshot.snapshotHash || "").trim() || buildSnapshotHash(firestoreSnapshot);
      }
      return null;
    }

    async function buildDistinctBackupItems(items) {
      var safeItems = Array.isArray(items) ? items.slice(0) : [];
      var kept = [];
      var duplicates = [];
      var seenHashes = Object.create(null);
      for (var i = 0; i < safeItems.length; i += 1) {
        var item = safeItems[i];
        var resolvedHash = await readSnapshotHashFromItem(item).catch(function onReadHashError() {
          return null;
        });
        if (resolvedHash) {
          item.snapshotHash = resolvedHash;
        }
        var key = resolvedHash
          ? ("hash:" + resolvedHash)
          : ("path:" + String(item && item.fullPath || "").trim());
        if (seenHashes[key]) {
          duplicates.push(item);
          continue;
        }
        seenHashes[key] = true;
        kept.push(item);
      }
      return {
        kept: kept,
        duplicates: duplicates
      };
    }

    async function buildVisibleBackupItems(items) {
      var distinct = await buildDistinctBackupItems(items);
      return Array.isArray(distinct && distinct.kept) ? distinct.kept : [];
    }

    async function deleteStorageBackupItem(item) {
      if (!item || !item.providerPath) return;
      await withStorageTimeout(deleteObject(refFn(storage, item.providerPath)), "borrar copia antigua");
    }

    async function deleteFirestoreBackupItem(item) {
      if (!item || !item.providerPath || !hasFirestoreProvider) return;
      var backupId = sanitizeSegment(item.providerPath);
      var chunksSnap = await getDocsFn(buildFirestoreFallbackCollection());
      var batch = writeBatchFn(firestore);
      chunksSnap.forEach(function each(docSnap) {
        if (!docSnap || !docSnap.ref || typeof docSnap.data !== "function") return;
        var data = docSnap.data() || {};
        if (String(data.backupKind || "").trim() !== FIRESTORE_BACKUP_CHUNK_KIND) return;
        if (String(data.backupRefId || "").trim() !== backupId) return;
        batch.delete(docSnap.ref);
      });
      batch.delete(buildFirestoreBackupDoc(backupId));
      await batch.commit();
    }

    async function deleteBackupItem(item) {
      if (!item || !item.providerKind) return;
      if (item.providerKind === "firestore") {
        await deleteFirestoreBackupItem(item);
        return;
      }
      await deleteStorageBackupItem(item);
    }

    async function trimBackups(store, listedItems) {
      try {
        var items = Array.isArray(listedItems) ? listedItems.slice(0) : [];
        if (!items.length) {
          var listed = await listAllBackupItems();
          if (!listed || listed.ok !== true) return { ok: false, items: [] };
          items = Array.isArray(listed.items) ? listed.items.slice(0) : [];
        }

        var distinct = await buildDistinctBackupItems(items);
        var kept = Array.isArray(distinct && distinct.kept) ? distinct.kept.slice(0) : [];
        var duplicates = Array.isArray(distinct && distinct.duplicates) ? distinct.duplicates.slice(0) : [];
        var toDelete = duplicates.concat(kept.slice(MAX_BACKUPS));
        var deleteMap = Object.create(null);

        for (var i = 0; i < toDelete.length; i += 1) {
          var deleteKey = String(toDelete[i] && toDelete[i].fullPath || "").trim();
          if (!deleteKey || deleteMap[deleteKey]) continue;
          deleteMap[deleteKey] = true;
          await deleteBackupItem(toDelete[i]).catch(function onDeleteError() {
            return null;
          });
        }

        var visibleItems = kept.slice(0, MAX_BACKUPS);
        if (store) {
          await cleanupVisualAssets(store, visibleItems);
        }
        return {
          ok: true,
          items: visibleItems
        };
      } catch (errTrim) {
        return {
          ok: false,
          items: []
        };
      }
    }

    async function exportStorageBackup(snapshot) {
      var ts = Date.now();
      var fileName = ts + ".json";
      var objectRef = refFn(storage, rootPath + "/" + userId + "/" + fileName);
      await withStorageTimeout(uploadString(objectRef, JSON.stringify(snapshot), "raw", {
        contentType: "application/json"
      }), "guardar copia");
      return {
        ok: true,
        providerKind: "storage",
        fileName: fileName,
        exportedAt: snapshot.exportedAt,
        countProducts: snapshot.products.length,
        countDrafts: snapshot.drafts.length,
        visualAssets: countVisualAssets(snapshot)
      };
    }

    async function exportFirestoreBackup(snapshot, snapshotHash) {
      return writeFirestoreBackupSnapshot(snapshot, snapshotHash);
    }

    function chooseBackupError(errors) {
      if (!Array.isArray(errors) || !errors.length) {
        return {
          ok: false,
          errorCode: "SYNC_BACKUP_EXPORT_FAILED",
          message: "No se pudo crear la copia."
        };
      }
      var picked = errors[0];
      for (var i = 0; i < errors.length; i += 1) {
        if (errors[i] && errors[i].providerKind === "firestore") {
          picked = errors[i];
          break;
        }
      }
      return {
        ok: false,
        errorCode: safeCode(picked && picked.error, "SYNC_BACKUP_EXPORT_FAILED"),
        message: safeMessage(picked && picked.error, "No se pudo crear la copia.")
      };
    }

    async function exportarBackup(sessionToken, store) {
      if (!ensureValidToken(sessionToken)) {
        return {
          ok: false,
          errorCode: "SYNC_BACKUP_TOKEN_INVALIDO",
          message: "Falta sessionToken valido para backup."
        };
      }
      var authReady = await ensureStorageAuth(sessionToken);
      if (!authReady || authReady.ok !== true) return authReady;

      ensureMode("backup");
      try {
        var snapshot = await buildSnapshot(store, { persistInlineAssets: false });
        if (!Array.isArray(snapshot.products) || snapshot.products.length <= 0) {
          return {
            ok: false,
            skipped: true,
            errorCode: "SYNC_BACKUP_EMPTY_BLOCKED",
            message: "Copia vacía bloqueada para no sustituir una copia válida."
          };
        }
        var snapshotHash = buildSnapshotHash(snapshot);
        snapshot.snapshotHash = snapshotHash;
        var latestListed = await listAllBackupItems();
        var latestItem = latestListed && latestListed.ok === true && Array.isArray(latestListed.items) && latestListed.items.length
          ? latestListed.items[0]
          : null;
        if (latestItem) {
          var latestHash = await readSnapshotHashFromItem(latestItem);
          if (latestHash && latestHash === snapshotHash) {
            await trimBackups(store, latestListed && latestListed.items ? latestListed.items : []);
            return {
              ok: true,
              skipped: true,
              providerKind: latestItem.providerKind,
              fileName: latestItem.name,
              exportedAt: latestItem.updated || null,
              countProducts: snapshot.products.length,
              countDrafts: snapshot.drafts.length,
              visualAssets: countVisualAssets(snapshot)
            };
          }
        }

        var errors = [];
        var exported = null;

        if (hasStorageProvider) {
          try {
            exported = await exportStorageBackup(snapshot);
          } catch (errStorageExport) {
            errors.push({ providerKind: "storage", error: errStorageExport });
          }
        }
        if ((!exported || exported.ok !== true) && hasFirestoreProvider) {
          try {
            exported = await exportFirestoreBackup(snapshot, snapshotHash);
          } catch (errFirestoreExport) {
            errors.push({ providerKind: "firestore", error: errFirestoreExport });
          }
        }
        if (!exported || exported.ok !== true) {
          return chooseBackupError(errors);
        }
        await trimBackups(store);
        return exported;
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

    async function listarBackups(sessionToken, store) {
      if (!ensureValidToken(sessionToken)) {
        return {
          ok: false,
          errorCode: "SYNC_BACKUP_TOKEN_INVALIDO",
          message: "Falta sessionToken valido para listar backups."
        };
      }
      var authReady = await ensureStorageAuth(sessionToken);
      if (!authReady || authReady.ok !== true) return authReady;

      try {
        var listed = await listAllBackupItems();
        if (listed && listed.ok === true) {
          var compacted = await trimBackups(store, listed.items || []);
          var visibleItems = compacted && compacted.ok === true
            ? (Array.isArray(compacted.items) ? compacted.items : [])
            : await buildVisibleBackupItems(listed.items || []);
          return {
            ok: true,
            items: visibleItems.slice(0, MAX_BACKUPS)
          };
        }
        var providerResults = listed && Array.isArray(listed.providerResults) ? listed.providerResults : [];
        var firstFailure = providerResults.find(function findFailure(item) {
          return item && item.ok !== true;
        });
        return {
          ok: false,
          errorCode: safeCode(firstFailure, "SYNC_BACKUP_LIST_FAILED"),
          message: safeMessage(firstFailure, "No se pudo listar backups.")
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
      var authReady = await ensureStorageAuth(sessionToken);
      if (!authReady || authReady.ok !== true) return authReady;
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
        var parsedPath = decodeBackupPath(path);
        var parsed = parsedPath.kind === "firestore"
          ? await readFirestoreSnapshot(parsedPath.path)
          : await readStorageJsonObject(parsedPath.path);
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

        var restoredProducts = store.replaceAllProducts(products, {
          allowEmptyReplace: true,
          reason: "backup_restore"
        });
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
    var shouldPause = typeof safeOptions.shouldPause === "function"
      ? safeOptions.shouldPause
      : function defaultShouldPause() { return false; };
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
      if (shouldPause()) {
        schedule(reason || "analysis_busy");
        notify("delayed", { reason: reason || "analysis_busy" });
        return { ok: true, delayed: true };
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
