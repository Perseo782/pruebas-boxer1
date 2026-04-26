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
        return String(runtime.getSessionToken() || "").trim();
      }
      if (globalScope && globalScope.localStorage) {
        return String(globalScope.localStorage.getItem("fase5_visible_session_token") || "").trim();
      }
    } catch (errToken) {
      return "";
    }
    return "";
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

  function attachAutoBackupBridge(store) {
    if (!store || store.__fase8AutoBackupBridge) return;
    if (!globalScope || !globalScope.Fase8SyncBackup || typeof globalScope.Fase8SyncBackup.createAutoBackupBridge !== "function") return;

    function resolveController() {
      var runtime = globalScope.Fase3FirebaseRuntime || null;
      if (!runtime || runtime.ok !== true || !runtime.storageModule) return null;
      var ownerKey = readBackupOwnerKey();
      if (store.__fase8BackupController && store.__fase8BackupControllerUserKey === ownerKey) {
        return store.__fase8BackupController;
      }
      store.__fase8BackupController = globalScope.Fase8SyncBackup.createSyncBackup({
        storageModule: runtime.storageModule,
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
      getSessionToken: readSessionToken
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

  function sanitizeProductVisualState(visual) {
    if (!visual || typeof visual !== "object") return null;
    var fotoRefs = Array.isArray(visual.fotoRefs)
      ? visual.fotoRefs.map(function mapRef(ref) { return String(ref || "").trim(); }).filter(Boolean).slice(0, 2)
      : [];
    var visuales = Array.isArray(visual.visuales)
      ? visual.visuales.map(function mapVisual(entry) {
          var safeEntry = entry || {};
          var ref = String(safeEntry.ref || "").trim();
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
      fotoRefs = visuales.map(function mapRef(item) { return String(item.ref || "").trim(); }).filter(Boolean).slice(0, 2);
    }
    if (!fotoRefs.length && !visuales.length) return null;
    return {
      fotoRefs: fotoRefs,
      visuales: visuales,
      updatedAt: String(visual.updatedAt || "").trim() || null
    };
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
      storage.setItem(storageKey, JSON.stringify(snapshot));
      return { ok: true };
    } catch (errWrite) {
      return {
        ok: false,
        errorCode: "BROWSER_STORAGE_WRITE_FAILED",
        message: errWrite && errWrite.message ? errWrite.message : "No se pudo guardar el borrador local."
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

  function persistStore(store, storage, storageKey) {
    return writeSnapshot(storage, storageKey, buildSnapshot(store));
  }

  function patchMutator(store, methodName, storage, storageKey) {
    var original = store[methodName];
    if (typeof original !== "function") return;

    store[methodName] = function wrappedMutator() {
      var result = original.apply(store, arguments);
      var shouldPersist = !result || typeof result !== "object" || result.ok !== false;
      if (shouldPersist) {
        persistStore(store, storage, storageKey);
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

    persistStore(store, storage, storageKey);
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
