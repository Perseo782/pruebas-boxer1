(function initSharedBrowserStoreModule(globalScope) {
  "use strict";

  var DEFAULT_STORAGE_KEY = "fase3_shared_browser_store_v1";
  var BACKUP_OWNER_KEY = "alergenos_backup_owner_key";
  var singletonCache = Object.create(null);

  function safeClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getStorageCandidate(explicitStorage) {
    if (explicitStorage) return explicitStorage;
    try {
      if (globalScope && globalScope.localStorage) return globalScope.localStorage;
    } catch (errLocal) {
      return null;
    }
    return null;
  }

  function readSessionToken() {
    try {
      var runtime = globalScope && globalScope.Fase3FirebaseRuntime;
      if (runtime && typeof runtime.getSessionToken === "function") {
        var runtimeToken = String(runtime.getSessionToken() || "").trim();
        if (runtimeToken) return runtimeToken;
      }
      if (globalScope && globalScope.localStorage) {
        var localToken = String(globalScope.localStorage.getItem("fase5_visible_session_token") || "").trim();
        if (localToken) return localToken;
      }
      if (globalScope && globalScope.sessionStorage) {
        return String(globalScope.sessionStorage.getItem("alergenos_session_token") || "").trim();
      }
    } catch (errToken) {
      return "";
    }
    return "";
  }

  function getAppStateGuard() {
    return globalScope && globalScope.AppStateGuard ? globalScope.AppStateGuard : null;
  }

  function normalizeBackupOwner(user) {
    return String(user || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^[-_]+|[-_]+$/g, "") || "local";
  }

  function readBackupOwnerKey() {
    try {
      if (globalScope && globalScope.localStorage) {
        var storedOwner = String(globalScope.localStorage.getItem(BACKUP_OWNER_KEY) || "").trim();
        if (storedOwner) return storedOwner;
      }
      if (globalScope && globalScope.sessionStorage) {
        var sessionUser = String(globalScope.sessionStorage.getItem("alergenos_access_user") || "").trim();
        if (sessionUser) return "usuario_" + normalizeBackupOwner(sessionUser);
      }
    } catch (errOwner) {
      // No-op.
    }
    var token = readSessionToken();
    return "sesion_" + (token.slice(0, 8) || "local");
  }

  function buildModeApi() {
    return {
      setModoControlado: function setModoControlado(mode) {
        if (!globalScope || !globalScope.Fase8SyncEstado || typeof globalScope.Fase8SyncEstado.writeState !== "function") return;
        globalScope.Fase8SyncEstado.writeState({ mode: mode || "normal" });
      }
    };
  }

  function isAnalysisExclusiveBlocking() {
    return !!(
      globalScope &&
      globalScope.AnalysisExclusiveRuntime &&
      typeof globalScope.AnalysisExclusiveRuntime.isExclusiveBlocking === "function" &&
      globalScope.AnalysisExclusiveRuntime.isExclusiveBlocking()
    );
  }

  function attachAutoBackupBridge(store) {
    if (!store || store.__fase8AutoBackupBridge) return;
    if (!globalScope || !globalScope.Fase8SyncBackup || typeof globalScope.Fase8SyncBackup.createAutoBackupBridge !== "function") return;

    function resolveController() {
      var runtime = globalScope.Fase3FirebaseRuntime || null;
      if (!runtime || runtime.ok !== true || (!runtime.storageModule && !runtime.firestoreModule)) return null;
      var ownerKey = readBackupOwnerKey();
      if (store.__fase8BackupController && store.__fase8BackupControllerUserKey === ownerKey) {
        return store.__fase8BackupController;
      }
      store.__fase8BackupController = globalScope.Fase8SyncBackup.createSyncBackup({
        storageModule: runtime.storageModule,
        firestoreModule: runtime.firestoreModule,
        firebaseApp: runtime.app,
        rootPath: "fase8_backups",
        userId: ownerKey,
        modeApi: buildModeApi(),
        ensureAuth: typeof runtime.waitForAuth === "function"
          ? function ensureAuth(token) { return runtime.waitForAuth(token || null); }
          : null
      });
      store.__fase8BackupControllerUserKey = ownerKey;
      return store.__fase8BackupController;
    }

    var bridge = globalScope.Fase8SyncBackup.createAutoBackupBridge({
      store: store,
      getController: resolveController,
      getSessionToken: readSessionToken,
      shouldPause: isAnalysisExclusiveBlocking
    });
    if (!bridge || bridge.ok !== true || typeof bridge.connect !== "function") return;
    bridge.connect();
    store.__fase8AutoBackupBridge = bridge;
  }

  function isStorageReady(storage) {
    return !!(
      storage &&
      typeof storage.getItem === "function" &&
      typeof storage.setItem === "function" &&
      typeof storage.removeItem === "function"
    );
  }

  function readSnapshot(storage, storageKey) {
    if (!isStorageReady(storage)) return null;
    try {
      var raw = storage.getItem(storageKey);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (errRead) {
      return null;
    }
  }

  function isRemoteUrl(value) {
    return /^https?:\/\//i.test(String(value || "").trim());
  }

  function isInlineDataUrl(value) {
    return /^data:image\//i.test(String(value || "").trim());
  }

  function sanitizeVisualRef(value) {
    var safe = String(value || "").trim();
    return safe && !isInlineDataUrl(safe) ? safe : "";
  }

  function sanitizeVisualPath(value) {
    var safe = String(value || "").trim();
    if (!safe) return null;
    if (isInlineDataUrl(safe) || /^blob:/i.test(safe)) return null;
    return safe.slice(0, 420) || null;
  }

  function sanitizeVisualStateName(value, fallback) {
    var safe = String(value || "").trim().toLowerCase();
    if (!safe) return fallback || null;
    if (safe === "pending" || safe === "uploading" || safe === "failed" || safe === "synced" || safe === "ok") {
      return safe;
    }
    if (safe === "permission_denied" || safe === "not_found") return safe;
    return fallback || null;
  }

  function sanitizeProductVisualState(visual) {
    if (!visual || typeof visual !== "object") return null;
    var fotoRefs = Array.isArray(visual.fotoRefs)
      ? visual.fotoRefs.map(sanitizeVisualRef).filter(Boolean).slice(0, 2)
      : [];
    var visuales = Array.isArray(visual.visuales)
      ? visual.visuales.map(function mapVisual(entry) {
          var safeEntry = entry || {};
          var ref = sanitizeVisualRef(safeEntry.ref);
          if (!ref) return null;
          var thumbSrc = String(safeEntry.thumbSrc || "").trim();
          var viewerSrc = String(safeEntry.viewerSrc || "").trim();
          return {
            ref: ref,
            thumbSrc: isRemoteUrl(thumbSrc) ? thumbSrc : null,
            viewerSrc: isRemoteUrl(viewerSrc) ? viewerSrc : null,
            profileKey: String(safeEntry.profileKey || "").trim() || null,
            qualityPct: Number.isFinite(Number(safeEntry.qualityPct)) ? Number(safeEntry.qualityPct) : null,
            resolutionMaxPx: Number.isFinite(Number(safeEntry.resolutionMaxPx)) ? Number(safeEntry.resolutionMaxPx) : null,
            generatedAt: String(safeEntry.generatedAt || "").trim() || null
          };
        }).filter(Boolean).slice(0, 2)
      : [];
    if (!fotoRefs.length && visuales.length) {
      fotoRefs = visuales.map(function mapRef(item) { return sanitizeVisualRef(item && item.ref); }).filter(Boolean).slice(0, 2);
    }
    var photoAssetId = sanitizeVisualRef(visual.photoAssetId);
    var thumbPath = sanitizeVisualPath(visual.thumbPath);
    var viewerPath = sanitizeVisualPath(visual.viewerPath);
    var visualUploadState = sanitizeVisualStateName(visual.visualUploadState, null);
    var visualReadState = sanitizeVisualStateName(visual.visualReadState, null);
    var lastVisualError = String(visual.lastVisualError || "").trim().slice(0, 300) || null;
    if (!fotoRefs.length && !visuales.length && !photoAssetId && !thumbPath && !viewerPath && !visualUploadState && !visualReadState && !lastVisualError) return null;
    var out = {
      fotoRefs: fotoRefs,
      visuales: visuales,
      updatedAt: String(visual.updatedAt || "").trim() || null
    };
    if (photoAssetId) out.photoAssetId = photoAssetId;
    if (thumbPath) out.thumbPath = thumbPath;
    if (viewerPath) out.viewerPath = viewerPath;
    if (visualUploadState) out.visualUploadState = visualUploadState;
    if (visualReadState) out.visualReadState = visualReadState;
    if (lastVisualError) out.lastVisualError = lastVisualError;
    return out;
  }

  function sanitizeProductsForSnapshot(items) {
    var safeItems = Array.isArray(items) ? safeClone(items) : [];
    for (var i = 0; i < safeItems.length; i += 1) {
      if (!safeItems[i] || typeof safeItems[i] !== "object") continue;
      if (safeItems[i].visual) {
        safeItems[i].visual = sanitizeProductVisualState(safeItems[i].visual);
        if (!safeItems[i].visual) {
          delete safeItems[i].visual;
        }
      }
    }
    return safeItems;
  }

  function buildSnapshot(store) {
    return {
      schemaVersion: "FASE3_SHARED_BROWSER_STORE_V1",
      updatedAt: new Date().toISOString(),
      products: sanitizeProductsForSnapshot(typeof store.list === "function" ? store.list() : []),
      drafts: typeof store.listRevisionDrafts === "function" ? store.listRevisionDrafts() : []
    };
  }

  function writeSnapshot(storage, storageKey, snapshot) {
    if (!isStorageReady(storage)) {
      return {
        ok: false,
        errorCode: "BROWSER_STORAGE_NO_DISPONIBLE",
        message: "No hay almacenamiento del navegador disponible."
      };
    }
    try {
      var serialized = JSON.stringify(snapshot);
      storage.setItem(storageKey, serialized);
      return { ok: true, bytesApprox: serialized.length };
    } catch (errWrite) {
      return {
        ok: false,
        errorCode: "BROWSER_STORAGE_WRITE_FAILED",
        message: errWrite && errWrite.message ? errWrite.message : "No se pudo guardar el borrador local.",
        bytesApprox: JSON.stringify(snapshot || {}).length
      };
    }
  }

  function hydrateStore(store, snapshot) {
    var safeSnapshot = snapshot || {};
    if (typeof store.replaceAllProducts === "function") {
      store.replaceAllProducts(Array.isArray(safeSnapshot.products) ? safeSnapshot.products : []);
    }
    if (typeof store.replaceRevisionDrafts === "function") {
      store.replaceRevisionDrafts(Array.isArray(safeSnapshot.drafts) ? safeSnapshot.drafts : []);
    }
    return store;
  }

  function resolveGuardStateName(storage) {
    var guard = getAppStateGuard();
    if (!guard || typeof guard.getCurrentState !== "function") return "";
    var state = guard.getCurrentState({ storage: storage });
    return String(state && state.name || "").trim();
  }

  function resolveSnapshotCounts(snapshot) {
    var safeSnapshot = snapshot && typeof snapshot === "object" ? snapshot : {};
    var products = Array.isArray(safeSnapshot.products) ? safeSnapshot.products : [];
    var drafts = Array.isArray(safeSnapshot.drafts) ? safeSnapshot.drafts : [];
    return {
      products: products.length,
      drafts: drafts.length
    };
  }

  function resolvePersistOrigin(storage, explicitOrigin) {
    var preferred = String(explicitOrigin || "").trim();
    if (preferred) return preferred;
    var stateName = resolveGuardStateName(storage).toUpperCase();
    if (stateName === "SYNC_OK" || stateName === "REMOTE_EMPTY_CONFIRMED") return "nube";
    return "local";
  }

  function persistStore(store, storage, storageKey, options) {
    var safeOptions = options || {};
    var snapshot = buildSnapshot(store);
    var guard = getAppStateGuard();
    var hasSession = readSessionToken().length > 0;
    var stateName = resolveGuardStateName(storage);
    if (guard && typeof guard.canPersistSnapshot === "function") {
      var canPersist = guard.canPersistSnapshot({
        snapshot: snapshot,
        hasSession: hasSession,
        stateName: stateName,
        forceAllowEmpty: safeOptions.forceAllowEmpty === true
      });
      if (canPersist && canPersist.ok === true && canPersist.allowed === false) {
        return {
          ok: true,
          skipped: true,
          blocked: true,
          reason: canPersist.reason || "EMPTY_SNAPSHOT_BLOCKED"
        };
      }
    }

    var out = writeSnapshot(storage, storageKey, snapshot);
    if (out && out.ok === true && guard && typeof guard.noteLastKnownGoodSnapshot === "function") {
      var counts = resolveSnapshotCounts(snapshot);
      if (counts.products > 0 || counts.drafts > 0) {
        guard.noteLastKnownGoodSnapshot({
          storage: storage,
          snapshot: snapshot,
          origin: resolvePersistOrigin(storage, safeOptions.origin),
          remoteConfirmed: safeOptions.remoteConfirmed === true
        });
      }
    }
    return out;
  }

  function hasPersistableLocalData(store) {
    var products = typeof store.list === "function" ? store.list() : [];
    if (Array.isArray(products) && products.length > 0) return true;
    var drafts = typeof store.listRevisionDrafts === "function" ? store.listRevisionDrafts() : [];
    return Array.isArray(drafts) && drafts.length > 0;
  }

  function shouldPersistInitialSnapshot(store, hadSnapshot) {
    if (hadSnapshot) return true;
    if (hasPersistableLocalData(store)) return true;
    return readSessionToken().length > 0;
  }

  function patchMutator(store, methodName, storage, storageKey) {
    var original = store[methodName];
    if (typeof original !== "function") return;

    store[methodName] = function wrappedMutator() {
      var result = original.apply(store, arguments);
      var shouldPersist = !result || typeof result !== "object" || result.ok !== false;
      if (shouldPersist) {
        var persistOut = persistStore(store, storage, storageKey, {
          origin: "local",
          remoteConfirmed: false
        });
        store.__lastPersistResult = persistOut;
        if (!persistOut || persistOut.ok !== true) {
          store.__lastPersistError = persistOut || { ok: false, errorCode: "BROWSER_STORAGE_WRITE_FAILED" };
          if (result && typeof result === "object") {
            result.localPersist = store.__lastPersistError;
          }
          if (globalScope && globalScope.console && typeof globalScope.console.warn === "function") {
            globalScope.console.warn("[APP_ALERGENOS] No se pudo guardar la copia local.", store.__lastPersistError);
          }
          if (globalScope && typeof globalScope.dispatchEvent === "function" && typeof globalScope.CustomEvent === "function") {
            globalScope.dispatchEvent(new globalScope.CustomEvent("fase3-local-persist-error", {
              detail: Object.assign({ methodName: methodName }, store.__lastPersistError)
            }));
          }
        } else if (store.__lastPersistError) {
          store.__lastPersistError = null;
        }
      }
      return result;
    };
  }

  function createSharedProductStore(options) {
    var safeOptions = options || {};
    var storeApi = safeOptions.storeApi || (globalScope && globalScope.Fase3DataStoreLocal);
    if (!storeApi || typeof storeApi.createMemoryProductStore !== "function") {
      throw new Error("Fase3DataStoreLocal no esta disponible.");
    }

    var storageKey = String(safeOptions.storageKey || DEFAULT_STORAGE_KEY).trim() || DEFAULT_STORAGE_KEY;
    if (!safeOptions.forceNew && singletonCache[storageKey]) {
      return singletonCache[storageKey];
    }

    var storage = getStorageCandidate(safeOptions.storage);
    var store = safeOptions.store || storeApi.createMemoryProductStore();
    var snapshot = readSnapshot(storage, storageKey);
    var hadSnapshot = !!snapshot;
    if (snapshot) {
      hydrateStore(store, snapshot);
    }

    [
      "createOrMergeByNormalizedName",
      "createRevisionDraft",
      "confirmRevisionDraft",
      "cancelRevisionDraft",
      "updateProductById",
      "softDeleteProductById",
      "markProductAsSynced",
      "replaceAllProducts",
      "replaceRevisionDrafts"
    ].forEach(function eachMutator(methodName) {
      patchMutator(store, methodName, storage, storageKey);
    });

    if (shouldPersistInitialSnapshot(store, hadSnapshot)) {
      persistStore(store, storage, storageKey, {
        origin: "local",
        remoteConfirmed: false
      });
    }
    attachAutoBackupBridge(store);
    singletonCache[storageKey] = store;
    return store;
  }

  function clearSharedProductStore(options) {
    var safeOptions = options || {};
    var storageKey = String(safeOptions.storageKey || DEFAULT_STORAGE_KEY).trim() || DEFAULT_STORAGE_KEY;
    var storage = getStorageCandidate(safeOptions.storage);
    if (isStorageReady(storage)) {
      try {
        storage.removeItem(storageKey);
      } catch (errRemove) {
        // No-op.
      }
    }
    delete singletonCache[storageKey];
    return { ok: true };
  }

  function readSharedSnapshot(options) {
    var safeOptions = options || {};
    var storageKey = String(safeOptions.storageKey || DEFAULT_STORAGE_KEY).trim() || DEFAULT_STORAGE_KEY;
    var storage = getStorageCandidate(safeOptions.storage);
    var snapshot = readSnapshot(storage, storageKey);
    return snapshot ? safeClone(snapshot) : null;
  }

  var api = {
    DEFAULT_STORAGE_KEY: DEFAULT_STORAGE_KEY,
    createSharedProductStore: createSharedProductStore,
    clearSharedProductStore: clearSharedProductStore,
    readSharedSnapshot: readSharedSnapshot
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase3SharedBrowserStore = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
