(function initAltaManualUi(globalScope) {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function parseAlergenosCsv(value) {
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

  function renderProductos(store, target) {
    var list = store.list();
    if (!list.length) {
      target.innerHTML = "<p class=\"empty\">No hay productos guardados aun.</p>";
      return;
    }

    var html = list.map(function toRow(item) {
      var alerg = Array.isArray(item.alergenos) && item.alergenos.length
        ? item.alergenos.join(", ")
        : "(sin marcar)";
      return (
        "<tr>" +
          "<td>" + item.identidad.nombre + "</td>" +
          "<td>" + item.identidad.nombreNormalizado + "</td>" +
          "<td>" + alerg + "</td>" +
          "<td>" + item.sistema.rowVersion + "</td>" +
        "</tr>"
      );
    }).join("");

    target.innerHTML =
      "<table>" +
        "<thead><tr><th>Nombre</th><th>Normalizado</th><th>Alergenos</th><th>Version</th></tr></thead>" +
        "<tbody>" + html + "</tbody>" +
      "</table>";
  }

  function init() {
    var storeApi = globalScope.Fase3DataStoreLocal;
    var operativaApi = globalScope.Fase3OperativaAltaManual;
    if (!storeApi || !operativaApi) return;

    var store = storeApi.createMemoryProductStore();
    var form = byId("alta-manual-form");
    var out = byId("salida-json");
    var productos = byId("productos-guardados");
    var nombreInput = byId("nombre");
    var alergInput = byId("alergenos");

    renderProductos(store, productos);

    form.addEventListener("submit", function onSubmit(ev) {
      ev.preventDefault();

      var payload = {
        nombre: nombreInput.value,
        alergenos: parseAlergenosCsv(alergInput.value)
      };

      var respuesta = operativaApi.ejecutarAltaManual(payload, { store: store });
      out.textContent = JSON.stringify(respuesta, null, 2);
      renderProductos(store, productos);
    });

    byId("limpiar").addEventListener("click", function onClear() {
      nombreInput.value = "";
      alergInput.value = "";
      out.textContent = "";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
    return;
  }
  init();
})(typeof globalThis !== "undefined" ? globalThis : this);
