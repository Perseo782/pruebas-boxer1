(function initCerebroProductosRepositoryResolverModule(globalScope) {
  "use strict";

  var firestoreIndexFactory = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      firestoreIndexFactory = require("../../backend/adaptadores/firestore_productos_remote.js");
    } catch (errRequire) {
      firestoreIndexFactory = null;
    }
  }
  if (!firestoreIndexFactory && globalScope && globalScope.Fase3FirestoreProductosRemote) {
    firestoreIndexFactory = globalScope.Fase3FirestoreProductosRemote;
  }

  var DEFAULT_COLLECTION = "fase3_productos";
  var cache = {
    appId: null,
    collectionName: null,
    repository: null
  };

  function buildError(errorCode, message, detail) {
    return {
      ok: false,
      errorCode: errorCode,
      message: message,
      detail: detail || null
    };
  }

  function resolveRuntime(deps) {
    var safeDeps = deps || {};
    return safeDeps.firebaseRuntime ||
      safeDeps.fase3FirebaseRuntime ||
      (globalScope && globalScope.Fase3FirebaseRuntime) ||
      null;
  }

  function resolveFactory(deps) {
    var safeDeps = deps || {};
    return safeDeps.productRepositoryFactory ||
      safeDeps.firestoreProductIndexFactory ||
      firestoreIndexFactory;
  }

  function resolveCollectionName(deps) {
    var safeDeps = deps || {};
    return String(safeDeps.productCollectionName || DEFAULT_COLLECTION).trim() || DEFAULT_COLLECTION;
  }

  function getAppId(runtime) {
    return runtime && runtime.app && runtime.app.options && runtime.app.options.appId
      ? String(runtime.app.options.appId).trim()
      : "unknown";
  }

  function buildRepository(factory, runtime, collectionName) {
    if (factory && typeof factory.createFirestoreProductosRemote === "function") {
      return factory.createFirestoreProductosRemote({
        firebaseApp: runtime.app,
        firestoreModule: runtime.firestoreModule,
        collectionName: collectionName,
        waitForAuth: typeof runtime.waitForAuth === "function" ? runtime.waitForAuth : null
      });
    }
    if (typeof factory === "function") {
      return factory({
        firebaseApp: runtime.app,
        firestoreModule: runtime.firestoreModule,
        collectionName: collectionName
      });
    }
    return buildError("CEREBRO_PRODUCT_REPOSITORY_FACTORY_INVALIDA", "No existe una fabrica valida para productos Firestore.");
  }

  function resolveProductRepository(deps) {
    var runtime = resolveRuntime(deps);
    if (!runtime || runtime.ok !== true || !runtime.app || !runtime.firestoreModule) {
      return buildError("CEREBRO_FIREBASE_RUNTIME_NO_LISTO", "Firebase de productos no esta listo para Fase 5.");
    }

    var factory = resolveFactory(deps);
    if (!factory) {
      return buildError("CEREBRO_PRODUCT_REPOSITORY_FACTORY_FALTANTE", "Falta la fabrica del repositorio real de productos.");
    }

    var collectionName = resolveCollectionName(deps);
    var appId = getAppId(runtime);
    if (cache.repository && cache.appId === appId && cache.collectionName === collectionName) {
      return {
        ok: true,
        repository: cache.repository,
        source: "cache",
        appId: appId,
        collectionName: collectionName
      };
    }

    var repository = buildRepository(factory, runtime, collectionName);
    if (!repository || repository.ok !== true) {
      return buildError(
        repository && repository.errorCode ? repository.errorCode : "CEREBRO_PRODUCT_REPOSITORY_BUILD_FAILED",
        repository && repository.message ? repository.message : "No se pudo preparar el repositorio real de productos.",
        repository && repository.detail ? repository.detail : null
      );
    }

    cache.appId = appId;
    cache.collectionName = collectionName;
    cache.repository = repository;

    return {
      ok: true,
      repository: repository,
      source: "runtime",
      appId: appId,
      collectionName: collectionName
    };
  }

  function resetCache() {
    cache.appId = null;
    cache.collectionName = null;
    cache.repository = null;
  }

  var api = {
    DEFAULT_COLLECTION: DEFAULT_COLLECTION,
    resolveProductRepository: resolveProductRepository,
    resetCache: resetCache
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroProductosRepositoryResolver = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

