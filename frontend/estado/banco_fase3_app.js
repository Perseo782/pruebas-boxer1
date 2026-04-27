(function initBancoFase3Ui(globalScope) {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function csvToList(value) {
    var catalog = globalScope && globalScope.AppV2AlergenosOficiales;
    if (catalog && typeof catalog.parseAllergenCsv === "function") {
      return catalog.parseAllergenCsv(value);
    }
    if (!value) return [];
    return String(value)
      .split(",")
      .map(function mapToken(token) { return token.trim(); })
      .filter(Boolean);
  }

  function parseLoteLines(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map(function mapLine(line) { return line.trim(); })
      .filter(Boolean)
      .map(function mapItem(line) {
        return {
          fotoRefs: line
            .split("|")
            .map(function mapRef(ref) { return ref.trim(); })
            .filter(Boolean)
            .slice(0, 2)
        };
      });
  }

  function printJson(target, value) {
    target.textContent = JSON.stringify(value, null, 2);
  }

  function setText(target, value) {
    if (!target) return;
    target.textContent = String(value || "");
  }

  function buildDeleteIdempotencyKey(productId) {
    return "del_" + String(productId || "").trim() + "_" + Date.now().toString(36);
  }

  function openAjustesVisible() {
    globalScope.location.href = "./ajustes.html";
  }

  function getFirebaseRuntime() {
    return globalScope.Fase3FirebaseRuntime || null;
  }

  function isNavigatorOnline() {
    if (typeof navigator === "undefined" || typeof navigator.onLine !== "boolean") return true;
    return navigator.onLine;
  }

  function resolveRemoteSyncDeps(state) {
    var runtime = getFirebaseRuntime();
    if (!runtime || runtime.ok !== true) {
      return {
        ok: false,
        errorCode: runtime && runtime.errorCode ? runtime.errorCode : "FIREBASE_RUNTIME_NO_LISTO",
        message: runtime && runtime.message ? runtime.message : "Firebase aun no esta listo."
      };
    }

    var indexFactory = globalScope.Fase3FirestoreProductosRemote;
    if (!indexFactory) {
      return {
        ok: false,
        errorCode: "FIREBASE_ADAPTADOR_NO_CARGADO",
        message: "Falta adaptador remoto de productos."
      };
    }

    var appId = runtime.app && runtime.app.options ? runtime.app.options.appId : "unknown";
    if (state.remoteDeps && state.remoteDeps.appId === appId) {
      return { ok: true, deps: state.remoteDeps };
    }

    var remoteIndex = indexFactory.createFirestoreProductosRemote({
      firebaseApp: runtime.app,
      firestoreModule: runtime.firestoreModule,
      collectionName: "fase3_productos",
      waitForAuth: typeof runtime.waitForAuth === "function" ? runtime.waitForAuth : null
    });
    if (!remoteIndex || remoteIndex.ok !== true) {
      return {
        ok: false,
        errorCode: remoteIndex && remoteIndex.errorCode ? remoteIndex.errorCode : "FIREBASE_INDEX_ADAPTER_FAILED",
        message: remoteIndex && remoteIndex.message ? remoteIndex.message : "No se pudo preparar Firestore."
      };
    }

    state.remoteDeps = {
      appId: appId,
      remoteIndex: remoteIndex
    };
    return { ok: true, deps: state.remoteDeps };
  }

  function readTextFile(file) {
    return new Promise(function executor(resolve, reject) {
      if (!file) {
        reject(new Error("Selecciona un archivo primero."));
        return;
      }
      var reader = new FileReader();
      reader.onload = function onLoad() {
        resolve(String(reader.result || ""));
      };
      reader.onerror = function onError() {
        reject(reader.error || new Error("No se pudo leer el archivo."));
      };
      reader.readAsText(file, "utf-8");
    });
  }

  function setLegacyStatus(state, message) {
    if (!state.el.legacyStatus) return;
    state.el.legacyStatus.textContent = String(message || "").trim() || "V1: sin cambios.";
  }

  function pickDraftId(state, providedDraftId) {
    var raw = String(providedDraftId || "").trim();
    if (raw) return raw;
    var first = state.store.listPendingRevisionDrafts()[0];
    return first ? first.draftId : "";
  }

  function pickProductId(state, providedProductId) {
    var raw = String(providedProductId || "").trim();
    if (raw) return raw;
    var first = state.store.listActiveProducts()[0];
    return first ? first.id : "";
  }

  function renderSummary(state, target) {
    var active = typeof state.store.countActiveProducts === "function"
      ? state.store.countActiveProducts()
      : state.store.listActiveProducts().length;
    var pendingDrafts = typeof state.store.countPendingRevisionDrafts === "function"
      ? state.store.countPendingRevisionDrafts()
      : state.store.listPendingRevisionDrafts().length;
    var pendingSync = typeof state.store.countPendingUploadProducts === "function"
      ? state.store.countPendingUploadProducts({ includeDeleted: false })
      : state.store.listPendingUploadProducts({ includeDeleted: false }).length;
    var toggle = state.onlyPendingProducts ? "ON" : "OFF";

    target.innerHTML =
      "<span class=\"badge\">Activos: " + active + "</span>" +
      "<span class=\"badge\">Drafts pendientes: " + pendingDrafts + "</span>" +
      "<span class=\"badge\">Pendientes sync: " + pendingSync + "</span>" +
      "<span class=\"badge\">Filtro pendientes: " + toggle + "</span>";
  }

  function renderProducts(state, target) {
    var output = state.gestion.listarProductos(
      {
        soloPendientes: state.onlyPendingProducts,
        searchText: state.productSearchText,
        offset: 0,
        limit: state.productVisibleLimit
      },
      { store: state.store }
    );
    var datos = output && output.ok && output.resultado && output.resultado.datos
      ? output.resultado.datos
      : null;
    var list = datos
      ? datos.productos
      : [];

    if (!list.length) {
      setText(state.el.productsStats, "Sin productos para mostrar.");
      if (state.el.productsLoadMore) state.el.productsLoadMore.style.display = "none";
      target.innerHTML = "<p class=\"empty\">Sin productos para mostrar.</p>";
      return;
    }

    var html = list.map(function toRow(item) {
      var alerg = Array.isArray(item.alergenos) && item.alergenos.length
        ? item.alergenos.join(", ")
        : "(sin marcar)";
      var dirty = item.sistema && item.sistema.dirty ? "SI" : "NO";
      return (
        "<tr>" +
          "<td>" + item.id + "</td>" +
          "<td>" + item.identidad.nombre + "</td>" +
          "<td>" + alerg + "</td>" +
          "<td>" + dirty + "</td>" +
        "</tr>"
      );
    }).join("");

    target.innerHTML =
      "<table>" +
        "<thead><tr><th>Id</th><th>Nombre</th><th>Alergenos</th><th>Pendiente</th></tr></thead>" +
        "<tbody>" + html + "</tbody>" +
      "</table>";

    setText(
      state.el.productsStats,
      "Mostrando " + datos.visible + " de " + datos.total +
      " | activos: " + datos.totalActivos +
      " | pendientes: " + datos.pendientesCount +
      (datos.searchText ? " | busqueda: " + datos.searchText : "")
    );
    if (state.el.productsLoadMore) {
      if (datos.hasMore) {
        state.el.productsLoadMore.style.display = "inline-block";
        state.el.productsLoadMore.textContent =
          "Cargar mas (" + datos.visible + " de " + datos.total + ")";
      } else {
        state.el.productsLoadMore.style.display = "none";
      }
    }
  }

  function renderDrafts(state, target) {
    var drafts = state.store.listPendingRevisionDrafts();
    if (!drafts.length) {
      target.innerHTML = "<p class=\"empty\">Sin drafts pendientes.</p>";
      return;
    }

    var html = drafts.map(function toRow(item) {
      var alerg = Array.isArray(item.propuesta && item.propuesta.alergenos) && item.propuesta.alergenos.length
        ? item.propuesta.alergenos.join(", ")
        : "(sin propuesta)";
      return (
        "<tr>" +
          "<td>" + item.draftId + "</td>" +
          "<td>" + (item.propuesta ? item.propuesta.nombre : "-") + "</td>" +
          "<td>" + alerg + "</td>" +
        "</tr>"
      );
    }).join("");

    target.innerHTML =
      "<table>" +
        "<thead><tr><th>DraftId</th><th>Nombre</th><th>Alergenos</th></tr></thead>" +
        "<tbody>" + html + "</tbody>" +
      "</table>";
  }

  function renderLote(state, target) {
    var items = state.lastLoteItems;
    if (!Array.isArray(items) || !items.length) {
      target.innerHTML = "<p class=\"empty\">Sin ejecucion de lote aun.</p>";
      return;
    }

    var html = items.map(function toRow(item) {
      var refs = Array.isArray(item.fotoRefs) ? item.fotoRefs.join(" | ") : "";
      return (
        "<tr>" +
          "<td>" + item.index + "</td>" +
          "<td>" + refs + "</td>" +
          "<td>" + (item.estado || "-") + "</td>" +
        "</tr>"
      );
    }).join("");

    target.innerHTML =
      "<table>" +
        "<thead><tr><th>#</th><th>Fotos</th><th>Estado</th></tr></thead>" +
        "<tbody>" + html + "</tbody>" +
      "</table>";
  }

  function renderFirebaseStatus(state) {
    if (!state.el.firebaseStatus || !state.el.syncRemotoBtn) return;

    var pending = typeof state.store.countPendingUploadProducts === "function"
      ? state.store.countPendingUploadProducts({ includeDeleted: false })
      : state.store.listPendingUploadProducts({ includeDeleted: false }).length;
    var online = isNavigatorOnline();
    var autoState = "espera";
    if (state.sync && state.sync.inFlight) autoState = "subiendo";
    else if (!online) autoState = "sin_red";
    if (state.sync && state.sync.lastErrorCode) {
      autoState += " (" + state.sync.lastErrorCode + ")";
    }

    var resolved = resolveRemoteSyncDeps(state);
    if (!resolved.ok) {
      state.el.firebaseStatus.textContent =
        "Firebase: no listo (" + resolved.errorCode + ")" +
        " | red: " + (online ? "online" : "offline") +
        " | auto: " + autoState;
      state.el.syncRemotoBtn.disabled = true;
      return;
    }

    state.el.firebaseStatus.textContent =
      "Firebase: conectado | red: " + (online ? "online" : "offline") +
      " | pendientes: " + pending +
      " | auto: " + autoState +
      " | coleccion: " + resolved.deps.remoteIndex.collectionName;
    state.el.syncRemotoBtn.disabled = pending <= 0 || !online || (state.sync && state.sync.inFlight);
  }

  function canAutoSyncNow(state) {
    if (!state || !state.sync || !state.sync.enabled) return false;
    if (state.sync.inFlight) return false;
    if (!isNavigatorOnline()) return false;

    var runtime = getFirebaseRuntime();
    if (!runtime || runtime.ok !== true) return false;
    if (!globalScope.Fase3FirestoreProductosRemote) return false;

    var pending = typeof state.store.countPendingUploadProducts === "function"
      ? state.store.countPendingUploadProducts({ includeDeleted: false })
      : state.store.listPendingUploadProducts({ includeDeleted: false }).length;
    if (pending <= 0) return false;

    var now = Date.now();
    if (state.sync.lastAttemptTs > 0 && (now - state.sync.lastAttemptTs) < state.sync.minGapMs) return false;
    return true;
  }

  function requestAutoSync(state, trigger) {
    if (!state || !state.sync || !state.sync.enabled) return;
    if (state.sync.timerId) {
      globalScope.clearTimeout(state.sync.timerId);
      state.sync.timerId = null;
    }

    state.sync.timerId = globalScope.setTimeout(function runAutoSync() {
      state.sync.timerId = null;
      if (!canAutoSyncNow(state)) return;

      syncPendingToFirebase(state, {
        trigger: trigger || "auto",
        silentNoPending: true,
        silentReadyError: true,
        silentOffline: true,
        silentSuccess: true,
        silentException: true
      }).catch(function onErr() {
        if (state.sync) state.sync.lastErrorCode = "SYNC_AUTO_EXCEPTION";
        refreshAll(state);
      });
    }, state.sync.debounceMs);
  }

  function installAutoSyncWatchers(state) {
    if (!state || !state.sync || state.sync.watchersInstalled) return;
    state.sync.watchersInstalled = true;

    globalScope.addEventListener("online", function onOnline() {
      requestAutoSync(state, "online");
      refreshAll(state);
    });

    globalScope.addEventListener("focus", function onFocus() {
      requestAutoSync(state, "focus");
    });

    if (document && typeof document.addEventListener === "function") {
      document.addEventListener("visibilitychange", function onVisibility() {
        if (document.visibilityState === "visible") {
          requestAutoSync(state, "visible");
        }
      });
    }

    if (typeof globalScope.setInterval === "function") {
      state.sync.intervalId = globalScope.setInterval(function onBeat() {
        requestAutoSync(state, "heartbeat");
      }, state.sync.intervalMs);
    }

    globalScope.addEventListener("beforeunload", function onUnload() {
      if (state.sync && state.sync.timerId) {
        globalScope.clearTimeout(state.sync.timerId);
        state.sync.timerId = null;
      }
      if (state.sync && state.sync.intervalId) {
        globalScope.clearInterval(state.sync.intervalId);
        state.sync.intervalId = null;
      }
    });
  }

  function refreshAll(state) {
    renderSummary(state, state.el.summary);
    renderProducts(state, state.el.productsTable);
    renderDrafts(state, state.el.draftsTable);
    renderLote(state, state.el.loteTable);
    renderFirebaseStatus(state);
    state.el.togglePending.textContent =
      "Ver solo pendientes: " + (state.onlyPendingProducts ? "ON" : "OFF");
    requestAutoSync(state, "refresh");
  }

  function resetStore(state) {
    state.store = state.storeApi.createMemoryProductStore();
    state.lastLoteItems = [];
    state.onlyPendingProducts = false;
    state.productSearchText = "";
    state.productVisibleLimit = state.productPageSize;
    if (state.el.productsSearch) {
      state.el.productsSearch.value = "";
    }
    if (state.sync) {
      state.sync.lastErrorCode = null;
      state.sync.lastAttemptTs = 0;
    }
    printJson(state.el.output, { ok: true, mensaje: "Banco reiniciado." });
    refreshAll(state);
  }

  function seedDemoInputs(state) {
    byId("am-nombre").value = "Mostaza Antigua";
    byId("am-alergenos").value = "mostaza, sulfitos";
    byId("af-foto1").value = "C:\\fotos\\mostaza_antigua.jpg";
    byId("af-foto2").value = "";
    byId("rv-nombre").value = "Mostaza Antigua";
    byId("rv-alergenos").value = "mostaza, sulfitos";
    byId("gs-nombre").value = "Mostaza Clasica";
    byId("gs-alergenos").value = "mostaza, sulfitos";
    byId("lt-input").value = [
      "C:\\fotos\\lote_01.jpg",
      "C:\\fotos\\lote_02.jpg",
      "C:\\fotos\\lote_03_frontal.jpg|C:\\fotos\\lote_03_trasera.jpg"
    ].join("\n");
  }

  async function runDemoFlow(state) {
    var r1 = state.altaManual.ejecutarAltaManual(
      { nombre: "Mostaza Demo", alergenos: ["mostaza"] },
      { store: state.store }
    );

    var r2 = await state.altaFoto.ejecutarAltaFoto(
      { fotoRefs: ["C:\\fotos\\demo_foto.jpg"] },
      { store: state.store, boxerAdapter: state.boxerAdapter }
    );

    var draftId = pickDraftId(state, "");
    var r3 = draftId
      ? state.revision.confirmarRevision(
          { draftId: draftId, nombreFinal: "Mostaza Demo Foto", alergenosFinales: ["mostaza"] },
          { store: state.store }
        )
      : { ok: false, error: { code: "SIN_DRAFT", message: "No hay draft para demo." } };

    var r4 = await state.lote.ejecutarLoteFoto(
      { fotoRefs: ["C:\\fotos\\lote_demo_1.jpg", "C:\\fotos\\lote_demo_2.jpg"] },
      {
        store: state.store,
        boxerAdapter: state.boxerAdapter,
        altaFotoOperativa: state.altaFoto
      }
    );
    state.lastLoteItems = r4 && r4.resultado && r4.resultado.datos ? r4.resultado.datos.items || [] : [];

    var finalOut = {
      ok: true,
      demo: {
        altaManual: r1,
        altaFoto: r2,
        revisionConfirmar: r3,
        lote: r4
      }
    };
    printJson(state.el.output, finalOut);
    refreshAll(state);
  }

  async function syncPendingToFirebase(state, options) {
    var safe = options || {};
    var silentNoPending = !!safe.silentNoPending;
    var silentReadyError = !!safe.silentReadyError;
    var silentOffline = !!safe.silentOffline;
    var silentSuccess = !!safe.silentSuccess;
    var silentException = !!safe.silentException;
    var trigger = String(safe.trigger || "manual");

    if (state.sync && state.sync.inFlight) {
      return { ok: false, skipped: true, reason: "SYNC_EN_CURSO" };
    }
    if (state.sync) {
      state.sync.inFlight = true;
      state.sync.lastTrigger = trigger;
    }

    if (!isNavigatorOnline()) {
      if (state.sync) state.sync.lastErrorCode = "OFFLINE";
      if (!silentOffline) {
        printJson(state.el.output, {
          ok: false,
          error: {
            code: "OFFLINE",
            message: "No hay internet. Se mantiene en pendientes."
          }
        });
      }
      if (state.sync) {
        state.sync.inFlight = false;
        state.sync.lastAttemptTs = Date.now();
      }
      refreshAll(state);
      return { ok: false, error: { code: "OFFLINE", message: "No hay internet." } };
    }

    var resolved = resolveRemoteSyncDeps(state);
    if (!resolved.ok) {
      if (state.sync) state.sync.lastErrorCode = resolved.errorCode;
      if (!silentReadyError) {
        printJson(state.el.output, {
          ok: false,
          error: {
            code: resolved.errorCode,
            message: resolved.message
          }
        });
      }
      if (state.sync) {
        state.sync.inFlight = false;
        state.sync.lastAttemptTs = Date.now();
      }
      refreshAll(state);
      return { ok: false, error: { code: resolved.errorCode, message: resolved.message } };
    }

    var pending = state.store.listPendingUploadProducts({ includeDeleted: false }).length;
    if (pending <= 0) {
      if (state.sync) state.sync.lastErrorCode = null;
      if (!silentNoPending) {
        printJson(state.el.output, {
          ok: true,
          mensaje: "No hay pendientes para subir a Firebase."
        });
      }
      if (state.sync) {
        state.sync.inFlight = false;
        state.sync.lastAttemptTs = Date.now();
      }
      refreshAll(state);
      return { ok: true };
    }

    try {
      var out = await state.gestion.sincronizarPendientesRemoto(
        {
          maxItems: 100,
          maxIntentos: 3,
          retryBaseMs: 120,
          retryJitterMs: 80
        },
        {
          store: state.store,
          remoteIndex: resolved.deps.remoteIndex
        }
      );

      if (out && out.ok) {
        if (state.sync) state.sync.lastErrorCode = null;
      } else if (state.sync) {
        state.sync.lastErrorCode = out && out.error && out.error.code ? out.error.code : "SYNC_REMOTO_FALLA";
      }

      var shouldPrint = !silentSuccess;
      if (!shouldPrint && out && out.resultado && out.resultado.datos && out.resultado.datos.resumen) {
        shouldPrint = Number(out.resultado.datos.resumen.errores) > 0;
      }
      if (shouldPrint) {
        printJson(state.el.output, out);
      }

      if (state.sync) {
        state.sync.inFlight = false;
        state.sync.lastAttemptTs = Date.now();
      }
      refreshAll(state);
      return out;
    } catch (err) {
      if (state.sync) state.sync.lastErrorCode = "SYNC_REMOTO_EXCEPTION";
      var failure = {
        ok: false,
        error: {
          code: "SYNC_REMOTO_EXCEPTION",
          message: err && err.message ? err.message : String(err)
        }
      };
      if (!silentException) {
        printJson(state.el.output, failure);
      }
      if (state.sync) {
        state.sync.inFlight = false;
        state.sync.lastAttemptTs = Date.now();
      }
      refreshAll(state);
      return failure;
    }
  }

  async function loadProductsFromFirebase(state, options) {
    var safe = options || {};
    var silent = !!safe.silent;
    var onlyIfEmpty = !!safe.onlyIfEmpty;
    var trigger = String(safe.trigger || "manual");

    if (state.remoteLoad && state.remoteLoad.inFlight) {
      return { ok: false, skipped: true, reason: "LOAD_EN_CURSO" };
    }

    if (onlyIfEmpty && state.store.listActiveProducts().length > 0) {
      return { ok: true, skipped: true, reason: "STORE_YA_CARGADO" };
    }

    var resolved = resolveRemoteSyncDeps(state);
    if (!resolved.ok) {
      if (!silent) {
        printJson(state.el.output, {
          ok: false,
          error: {
            code: resolved.errorCode,
            message: resolved.message
          }
        });
      }
      return { ok: false, error: { code: resolved.errorCode, message: resolved.message } };
    }

    if (!resolved.deps.remoteIndex || typeof resolved.deps.remoteIndex.listProductRecords !== "function") {
      var readError = {
        code: "REMOTE_READ_NO_DISPONIBLE",
        message: "El adaptador remoto no puede leer productos."
      };
      if (!silent) {
        printJson(state.el.output, { ok: false, error: readError });
      }
      return { ok: false, error: readError };
    }

    if (!state.store || typeof state.store.replaceAllProducts !== "function") {
      var storeError = {
        code: "STORE_REPLACE_NO_DISPONIBLE",
        message: "El store local no soporta carga inicial."
      };
      if (!silent) {
        printJson(state.el.output, { ok: false, error: storeError });
      }
      return { ok: false, error: storeError };
    }

    state.remoteLoad.inFlight = true;
    state.remoteLoad.lastTrigger = trigger;
    try {
      var out = await resolved.deps.remoteIndex.listProductRecords({ maxItems: 5000 });
      if (!out || out.ok !== true) {
        state.remoteLoad.inFlight = false;
        if (!silent) {
          printJson(state.el.output, {
            ok: false,
            error: {
              code: (out && out.errorCode) || "REMOTE_READ_FAILED",
              message: (out && out.message) || "No se pudo leer desde Firebase."
            }
          });
        }
        return {
          ok: false,
          error: {
            code: (out && out.errorCode) || "REMOTE_READ_FAILED",
            message: (out && out.message) || "No se pudo leer desde Firebase."
          }
        };
      }

      var replaced = state.store.replaceAllProducts(out.items || []);
      if (replaced && replaced.skipped === true) {
        state.remoteLoad.hydratedOnce = false;
        state.remoteLoad.inFlight = false;
        setLegacyStatus(state, "V1/Firebase: carga vacía bloqueada; se conserva la lista local.");
        return {
          ok: false,
          error: {
            code: "REMOTE_EMPTY_REPLACE_BLOCKED",
            message: "La lectura remota vino vacía y se conservó la lista local."
          }
        };
      }
      state.remoteLoad.hydratedOnce = true;
      state.remoteLoad.inFlight = false;
      setLegacyStatus(
        state,
        "V1/Firebase: cargados " + replaced.loaded + " productos remotos en memoria."
      );
      if (!silent) {
        printJson(state.el.output, {
          ok: true,
          accion: "cargar_productos_desde_firebase",
          datos: {
            totalRemotos: Array.isArray(out.items) ? out.items.length : 0,
            totalCargados: replaced.loaded
          }
        });
      }
      refreshAll(state);
      return {
        ok: true,
        datos: {
          totalRemotos: Array.isArray(out.items) ? out.items.length : 0,
          totalCargados: replaced.loaded
        }
      };
    } catch (err) {
      state.remoteLoad.inFlight = false;
      var failure = {
        ok: false,
        error: {
          code: "REMOTE_LOAD_EXCEPTION",
          message: err && err.message ? err.message : String(err)
        }
      };
      if (!silent) {
        printJson(state.el.output, failure);
      }
      return failure;
    }
  }

  async function analyzeLegacyJsonFile(state) {
    var mapper = globalScope.Fase3LegacyProductosV1Mapper;
    if (!mapper || typeof mapper.analyzeLegacyPayload !== "function") {
      printJson(state.el.output, {
        ok: false,
        error: {
          code: "LEGACY_MAPPER_NO_DISPONIBLE",
          message: "Falta el conversor de la base V1."
        }
      });
      return;
    }

    var fileInput = byId("v1-file");
    var file = fileInput && fileInput.files && fileInput.files[0];
    if (!file) {
      printJson(state.el.output, {
        ok: false,
        error: {
          code: "LEGACY_FILE_REQUERIDO",
          message: "Selecciona primero el archivo productos.json."
        }
      });
      return;
    }

    var text = await readTextFile(file);
    var payload = JSON.parse(text);
    var plan = mapper.analyzeLegacyPayload(payload);
    state.legacyImport.plan = plan;
    state.legacyImport.fileName = file.name || "productos.json";
    setLegacyStatus(
      state,
      "V1 analizado: " + plan.stats.totalValid +
      " productos validos, " + plan.stats.totalWithThumb +
      " con miniatura legacy y " + plan.stats.totalWithAnalysis + " con historial."
    );
    printJson(state.el.output, {
      ok: true,
      accion: "analizar_legacy_v1",
      archivo: state.legacyImport.fileName,
      stats: plan.stats
    });
  }

  async function importLegacyProductsToFirebase(state) {
    var resolved = resolveRemoteSyncDeps(state);
    if (!resolved.ok) {
      printJson(state.el.output, {
        ok: false,
        error: {
          code: resolved.errorCode,
          message: resolved.message
        }
      });
      return;
    }

    if (
      !resolved.deps.remoteIndex ||
      typeof resolved.deps.remoteIndex.upsertProductRecordsBatch !== "function"
    ) {
      printJson(state.el.output, {
        ok: false,
        error: {
          code: "LEGACY_IMPORT_REMOTE_NO_DISPONIBLE",
          message: "Firebase no soporta importacion por lotes en este banco."
        }
      });
      return;
    }

    if (!state.legacyImport.plan || !Array.isArray(state.legacyImport.plan.records)) {
      await analyzeLegacyJsonFile(state);
      if (!state.legacyImport.plan || !Array.isArray(state.legacyImport.plan.records)) {
        return;
      }
    }

    var batchOut = await resolved.deps.remoteIndex.upsertProductRecordsBatch({
      products: state.legacyImport.plan.records,
      chunkSize: 400
    });
    if (!batchOut || batchOut.ok !== true) {
      printJson(state.el.output, {
        ok: false,
        error: {
          code: (batchOut && batchOut.errorCode) || "LEGACY_IMPORT_FAILED",
          message: (batchOut && batchOut.message) || "No se pudo importar la base V1."
        }
      });
      return;
    }

    state.legacyImport.lastImportedAt = new Date().toISOString();
    setLegacyStatus(
      state,
      "V1 importado a Firebase: " + batchOut.totalWritten + " productos en " + batchOut.totalChunks + " bloques."
    );
    printJson(state.el.output, {
      ok: true,
      accion: "importar_legacy_v1_a_firebase",
      archivo: state.legacyImport.fileName || "productos.json",
      datos: {
        totalWritten: batchOut.totalWritten,
        totalChunks: batchOut.totalChunks,
        stats: state.legacyImport.plan.stats
      }
    });

    await loadProductsFromFirebase(state, {
      trigger: "post_import",
      silent: true,
      onlyIfEmpty: false
    });
  }

  function wireEvents(state) {
    byId("reiniciar-banco").addEventListener("click", function onReset() {
      resetStore(state);
    });

    byId("open-ajustes").addEventListener("click", function onAjustes() {
      openAjustesVisible();
    });

    byId("v1-analizar").addEventListener("click", function onAnalyzeLegacy() {
      analyzeLegacyJsonFile(state).catch(function onErr(err) {
        printJson(state.el.output, {
          ok: false,
          error: {
            code: "LEGACY_ANALYZE_EXCEPTION",
            message: err && err.message ? err.message : String(err)
          }
        });
      });
    });

    byId("v1-importar").addEventListener("click", function onImportLegacy() {
      importLegacyProductsToFirebase(state).catch(function onErr(err) {
        printJson(state.el.output, {
          ok: false,
          error: {
            code: "LEGACY_IMPORT_EXCEPTION",
            message: err && err.message ? err.message : String(err)
          }
        });
      });
    });

    byId("v1-cargar-remoto").addEventListener("click", function onLoadRemote() {
      loadProductsFromFirebase(state, {
        trigger: "manual_load",
        silent: false,
        onlyIfEmpty: false
      }).catch(function onErr(err) {
        printJson(state.el.output, {
          ok: false,
          error: {
            code: "REMOTE_LOAD_EXCEPTION",
            message: err && err.message ? err.message : String(err)
          }
        });
      });
    });

    byId("cargar-demo").addEventListener("click", function onDemo() {
      seedDemoInputs(state);
      runDemoFlow(state).catch(function onErr(err) {
        printJson(state.el.output, {
          ok: false,
          error: err && err.message ? err.message : String(err)
        });
      });
    });

    byId("refrescar-todo").addEventListener("click", function onRefresh() {
      refreshAll(state);
    });

    byId("am-ejecutar").addEventListener("click", function onAltaManual() {
      var out = state.altaManual.ejecutarAltaManual(
        {
          nombre: byId("am-nombre").value,
          alergenos: csvToList(byId("am-alergenos").value)
        },
        { store: state.store }
      );
      printJson(state.el.output, out);
      refreshAll(state);
    });

    byId("af-ejecutar").addEventListener("click", function onAltaFoto() {
      var refs = [byId("af-foto1").value, byId("af-foto2").value].filter(Boolean);
      state.altaFoto.ejecutarAltaFoto(
        { fotoRefs: refs },
        { store: state.store, boxerAdapter: state.boxerAdapter }
      ).then(function onOk(out) {
        printJson(state.el.output, out);
        refreshAll(state);
      }).catch(function onErr(err) {
        printJson(state.el.output, { ok: false, error: err && err.message ? err.message : String(err) });
      });
    });

    byId("rv-confirmar").addEventListener("click", function onConfirm() {
      var draftId = pickDraftId(state, byId("rv-draft-id").value);
      var out = state.revision.confirmarRevision(
        {
          draftId: draftId,
          nombreFinal: byId("rv-nombre").value,
          alergenosFinales: csvToList(byId("rv-alergenos").value)
        },
        { store: state.store }
      );
      printJson(state.el.output, out);
      refreshAll(state);
    });

    byId("rv-cancelar").addEventListener("click", function onCancel() {
      var draftId = pickDraftId(state, byId("rv-draft-id").value);
      var out = state.revision.cancelarRevision(
        { draftId: draftId, motivoCancelacion: "cancelado_desde_banco" },
        { store: state.store }
      );
      printJson(state.el.output, out);
      refreshAll(state);
    });

    byId("gs-editar").addEventListener("click", function onEdit() {
      var productId = pickProductId(state, byId("gs-product-id").value);
      var out = state.gestion.editarProducto(
        {
          productId: productId,
          nombre: byId("gs-nombre").value,
          alergenos: csvToList(byId("gs-alergenos").value)
        },
        { store: state.store }
      );
      printJson(state.el.output, out);
      refreshAll(state);
    });

    byId("gs-borrar").addEventListener("click", function onDelete() {
      var productId = pickProductId(state, byId("gs-product-id").value);
      var resolved = resolveRemoteSyncDeps(state);
      if (!resolved.ok || !state.persistencia || typeof state.gestion.borrarProductoReal !== "function") {
        printJson(state.el.output, {
          ok: false,
          error: {
            code: resolved.ok ? "BORRADO_REAL_NO_DISPONIBLE" : resolved.errorCode,
            message: resolved.ok
              ? "Falta la via oficial para borrar de verdad."
              : resolved.message
          }
        });
        refreshAll(state);
        return;
      }
      Promise.resolve(
        state.gestion.borrarProductoReal(
          {
            productId: productId,
            idempotencyKey: buildDeleteIdempotencyKey(productId)
          },
          {
            store: state.store,
            persistencia: state.persistencia,
            remoteIndex: resolved.deps.remoteIndex
          }
        )
      ).then(function onDeleteOk(out) {
        printJson(state.el.output, out);
        refreshAll(state);
      }).catch(function onDeleteErr(err) {
        printJson(state.el.output, {
          ok: false,
          error: {
            code: "BORRADO_REAL_EXCEPTION",
            message: err && err.message ? err.message : String(err)
          }
        });
        refreshAll(state);
      });
    });

    byId("gs-sync").addEventListener("click", function onSync() {
      var productId = pickProductId(state, byId("gs-product-id").value);
      var out = state.gestion.marcarSincronizado(
        { productId: productId },
        { store: state.store }
      );
      printJson(state.el.output, out);
      refreshAll(state);
    });

    byId("gs-sync-remoto").addEventListener("click", function onRemoteSync() {
      syncPendingToFirebase(state, { trigger: "manual" }).catch(function onErr(err) {
        printJson(state.el.output, {
          ok: false,
          error: { code: "SYNC_REMOTO_EXCEPTION", message: err && err.message ? err.message : String(err) }
        });
        refreshAll(state);
      });
    });

    state.el.togglePending.addEventListener("click", function onTogglePending() {
      state.onlyPendingProducts = !state.onlyPendingProducts;
      state.productVisibleLimit = state.productPageSize;
      refreshAll(state);
    });

    if (state.el.productsSearch) {
      state.el.productsSearch.addEventListener("input", function onProductsSearch() {
        if (state.productSearchTimerId) {
          globalScope.clearTimeout(state.productSearchTimerId);
          state.productSearchTimerId = null;
        }
        state.productSearchTimerId = globalScope.setTimeout(function applyProductsSearch() {
          state.productSearchTimerId = null;
          state.productSearchText = state.el.productsSearch.value;
          state.productVisibleLimit = state.productPageSize;
          refreshAll(state);
        }, 120);
      });
    }

    if (state.el.productsLoadMore) {
      state.el.productsLoadMore.addEventListener("click", function onProductsLoadMore() {
        state.productVisibleLimit += state.productPageSize;
        refreshAll(state);
      });
    }

    byId("lt-demo").addEventListener("click", function onLoteDemo() {
      byId("lt-input").value = [
        "C:\\fotos\\lote_01.jpg",
        "C:\\fotos\\lote_02.jpg",
        "C:\\fotos\\lote_03.jpg",
        "C:\\fotos\\lote_04_frontal.jpg|C:\\fotos\\lote_04_trasera.jpg"
      ].join("\n");
    });

    byId("lt-ejecutar").addEventListener("click", function onLoteRun() {
      var items = parseLoteLines(byId("lt-input").value);
      state.lote.ejecutarLoteFoto(
        { items: items },
        {
          store: state.store,
          boxerAdapter: state.boxerAdapter,
          altaFotoOperativa: state.altaFoto
        }
      ).then(function onOk(out) {
        state.lastLoteItems =
          out && out.resultado && out.resultado.datos ? out.resultado.datos.items || [] : [];
        printJson(state.el.output, out);
        refreshAll(state);
      }).catch(function onErr(err) {
        printJson(state.el.output, { ok: false, error: err && err.message ? err.message : String(err) });
      });
    });
  }

  function init() {
    var storeApi = globalScope.Fase3DataStoreLocal;
    var boxerAdapter = globalScope.Fase3Boxer1Adapter;
    var altaManual = globalScope.Fase3OperativaAltaManual;
    var altaFoto = globalScope.Fase3OperativaAltaFoto;
    var revision = globalScope.Fase3OperativaRevision;
    var gestion = globalScope.Fase3OperativaGestionRegistros;
    var lote = globalScope.Fase3OperativaLoteFoto;

    if (!storeApi || !boxerAdapter || !altaManual || !altaFoto || !revision || !gestion || !lote) return;

    var state = {
      storeApi: storeApi,
      store: storeApi.createMemoryProductStore(),
      remoteDeps: null,
      remoteLoad: {
        inFlight: false,
        hydratedOnce: false,
        lastTrigger: null
      },
      legacyImport: {
        plan: null,
        fileName: null,
        lastImportedAt: null
      },
      boxerAdapter: boxerAdapter,
      altaManual: altaManual,
      altaFoto: altaFoto,
      revision: revision,
      gestion: gestion,
      lote: lote,
      persistencia: globalScope.CerebroProductosPersistencia || null,
      sync: {
        enabled: true,
        inFlight: false,
        timerId: null,
        intervalId: null,
        debounceMs: 350,
        intervalMs: 12000,
        minGapMs: 2500,
        lastAttemptTs: 0,
        lastTrigger: null,
        lastErrorCode: null,
        watchersInstalled: false
      },
      onlyPendingProducts: false,
      productSearchText: "",
      productPageSize: 60,
      productVisibleLimit: 60,
      productSearchTimerId: null,
      lastLoteItems: [],
      el: {
        output: byId("salida-json"),
        summary: byId("resumen-global"),
        productsTable: byId("tabla-productos"),
        productsStats: byId("productos-stats"),
        productsLoadMore: byId("productos-cargar-mas"),
        draftsTable: byId("tabla-drafts"),
        loteTable: byId("tabla-lote"),
        togglePending: byId("gs-toggle"),
        productsSearch: byId("productos-buscar"),
        firebaseStatus: byId("firebase-status"),
        syncRemotoBtn: byId("gs-sync-remoto"),
        legacyStatus: byId("v1-status")
      }
    };

    globalScope.addEventListener("fase3-firebase-ready", function onFirebaseReady() {
      refreshAll(state);
      loadProductsFromFirebase(state, {
        trigger: "firebase_ready",
        silent: true,
        onlyIfEmpty: true
      }).catch(function onErr() {
        // No-op silencioso en arranque.
      });
    });

    installAutoSyncWatchers(state);
    wireEvents(state);
    seedDemoInputs(state);
    printJson(state.el.output, {
      ok: true,
      mensaje: "Banco listo para pruebas.",
      firebase: getFirebaseRuntime() && getFirebaseRuntime().ok === true ? "conectado" : "pendiente",
      autoSync: state.sync.enabled ? "activo" : "apagado"
    });
    setLegacyStatus(state, "V1: listo para analizar o importar.");
    refreshAll(state);
    loadProductsFromFirebase(state, {
      trigger: "init",
      silent: true,
      onlyIfEmpty: true
    }).catch(function onErr() {
      // No-op silencioso en arranque.
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
    return;
  }
  init();
})(typeof globalThis !== "undefined" ? globalThis : this);

