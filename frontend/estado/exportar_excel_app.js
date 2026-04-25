(function initExportarExcelApp(globalScope) {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function getStore() {
    if (globalScope.Fase3SharedBrowserStore && typeof globalScope.Fase3SharedBrowserStore.createSharedProductStore === "function") {
      return globalScope.Fase3SharedBrowserStore.createSharedProductStore();
    }
    if (globalScope.Fase3DataStoreLocal && typeof globalScope.Fase3DataStoreLocal.createMemoryProductStore === "function") {
      return globalScope.Fase3DataStoreLocal.createMemoryProductStore();
    }
    return null;
  }

  function getFirebaseRuntime() {
    return globalScope.Fase3FirebaseRuntime || null;
  }

  function readSessionToken() {
    var runtime = getFirebaseRuntime();
    if (runtime && typeof runtime.getSessionToken === "function") {
      return String(runtime.getSessionToken() || "").trim();
    }
    try {
      return globalScope.localStorage ? String(globalScope.localStorage.getItem("fase5_visible_session_token") || "").trim() : "";
    } catch (errToken) {
      return "";
    }
  }

  function resolveRemoteIndex() {
    var runtime = getFirebaseRuntime();
    if (!runtime || runtime.ok !== true || !globalScope.Fase3FirestoreProductosRemote) return null;
    return globalScope.Fase3FirestoreProductosRemote.createFirestoreProductosRemote({
      firebaseApp: runtime.app,
      firestoreModule: runtime.firestoreModule,
      collectionName: "fase3_productos",
      waitForAuth: typeof runtime.waitForAuth === "function" ? runtime.waitForAuth : null,
      tokenValidator: function tokenValidator(token) {
        return String(token || "").trim().length > 0;
      }
    });
  }

  function getActiveProductsFromStore(store) {
    if (!store || typeof store.listProductsForUi !== "function") return [];
    return store.listProductsForUi({ onlyPending: false, includeDeleted: false });
  }

  function sortProducts(products) {
    var safeProducts = Array.isArray(products) ? products.slice(0) : [];
    safeProducts.sort(function byName(a, b) {
      var nameA = a && a.identidad ? String(a.identidad.nombre || "") : "";
      var nameB = b && b.identidad ? String(b.identidad.nombre || "") : "";
      return nameA.localeCompare(nameB, "es");
    });
    return safeProducts;
  }

  function renderList(state) {
    var list = byId("export-list");
    var count = byId("export-count");
    var status = byId("export-status");
    var safeProducts = sortProducts(state.products);
    count.textContent = "Productos: " + safeProducts.length + " | Seleccionados: " + state.selectedIds.size;

    if (!safeProducts.length) {
      list.innerHTML = "<div class=\"empty\">No hay productos activos para exportar.</div>";
      status.textContent = state.statusText || "Sin productos.";
      byId("export-run").disabled = true;
      return;
    }

    list.innerHTML = safeProducts.map(function each(product) {
      var id = String(product.id || "").trim();
      var checked = state.selectedIds.has(id) ? " checked" : "";
      var nombre = product.identidad && product.identidad.nombre ? String(product.identidad.nombre) : "(sin nombre)";
      return (
        "<label class=\"item\">" +
          "<input type=\"checkbox\" class=\"js-export-check\" data-id=\"" + id + "\"" + checked + ">" +
          "<div>" +
            "<strong>" + nombre + "</strong>" +
            "<span>Producto listo para exportar</span>" +
          "</div>" +
        "</label>"
      );
    }).join("");

    Array.prototype.forEach.call(list.querySelectorAll(".js-export-check"), function bind(input) {
      input.addEventListener("change", function onChange() {
        var id = String(input.getAttribute("data-id") || "").trim();
        if (!id) return;
        if (input.checked) {
          state.selectedIds.add(id);
        } else {
          state.selectedIds.delete(id);
        }
        renderList(state);
      });
    });

    status.textContent = state.statusText || "Lista lista para exportar.";
    byId("export-run").disabled = state.selectedIds.size <= 0 || state.busy;
  }

  async function loadProducts(state) {
    state.statusText = "Cargando productos...";
    renderList(state);

    var store = getStore();
    var remote = resolveRemoteIndex();
    if (remote && remote.ok === true) {
      var remoteOut = await remote.listProductRecords({ maxItems: 5000, sessionToken: readSessionToken() || null });
      if (remoteOut && remoteOut.ok === true && Array.isArray(remoteOut.items)) {
        state.products = remoteOut.items.filter(function onlyActive(item) {
          return item && item.sistema && String(item.sistema.estadoRegistro || "").toUpperCase() === "ACTIVO";
        });
        state.selectedIds = new Set(state.products.map(function toId(item) { return String(item.id || "").trim(); }).filter(Boolean));
        state.statusText = "Base cargada desde nube.";
        renderList(state);
        return;
      }
    }

    state.products = getActiveProductsFromStore(store);
    state.selectedIds = new Set(state.products.map(function toId(item) { return String(item.id || "").trim(); }).filter(Boolean));
    state.statusText = "Base cargada desde este dispositivo.";
    renderList(state);
  }

  function goBack() {
    if (globalScope.history && globalScope.history.length > 1) {
      globalScope.history.back();
      return;
    }
    globalScope.location.href = "./ajustes.html";
  }

  function runExport(state) {
    if (!globalScope.Fase10ExportacionExcel) return;
    var selected = state.products.filter(function each(item) {
      return state.selectedIds.has(String(item.id || "").trim());
    });
    if (!selected.length) {
      state.statusText = "Selecciona al menos un producto.";
      renderList(state);
      return;
    }

    state.busy = true;
    state.statusText = "Preparando Excel...";
    renderList(state);
    try {
      var filename = globalScope.Fase10ExportacionExcel.createExportFilename(new Date());
      var bytes = globalScope.Fase10ExportacionExcel.buildWorkbookBytes({ products: selected, createdAt: new Date() });
      var out = globalScope.Fase10ExportacionExcel.triggerDownload(filename, bytes);
      state.statusText = out && out.ok === true
        ? "Excel generado."
        : "No se pudo lanzar la descarga.";
    } catch (err) {
      state.statusText = err && err.message ? err.message : "No se pudo exportar.";
    }
    state.busy = false;
    renderList(state);
  }

  function init() {
    var state = {
      products: [],
      selectedIds: new Set(),
      statusText: "Preparando...",
      busy: false
    };

    byId("export-cancel").addEventListener("click", function onCancel() {
      goBack();
    });
    byId("export-run").addEventListener("click", function onExport() {
      runExport(state);
    });
    globalScope.addEventListener("fase3-firebase-ready", function onFirebaseReady() {
      loadProducts(state);
    });

    renderList(state);
    loadProducts(state);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
    return;
  }
  init();
})(typeof globalThis !== "undefined" ? globalThis : this);

