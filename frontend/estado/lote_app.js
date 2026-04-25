(function initLoteUi(globalScope) {
  "use strict";

  var DEFAULT_BACKEND_URL = "https://europe-west1-project-a6f6b968-a591-4b1f-823.cloudfunctions.net/api";
  var TOKEN_STORAGE_KEY = "fase5_visible_session_token";
  var BACKEND_STORAGE_KEY = "fase5_visible_backend_url";

  function byId(id) {
    return document.getElementById(id);
  }

  function safeReadStorage(key) {
    try {
      return globalScope.localStorage ? String(globalScope.localStorage.getItem(key) || "") : "";
    } catch (err) {
      return "";
    }
  }

  function safeWriteStorage(key, value) {
    try {
      if (!globalScope.localStorage) return;
      globalScope.localStorage.setItem(key, String(value || ""));
    } catch (err) {
      // No-op.
    }
  }

  function parseLoteInput(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map(function mapLine(line) { return line.trim(); })
      .filter(Boolean)
      .map(function mapItem(line, index) {
        var refs = line
          .split("|")
          .map(function mapRef(ref) { return ref.trim(); })
          .filter(Boolean)
          .slice(0, 2);
        return {
          index: index + 1,
          fotoRefs: refs
        };
      })
      .filter(function hasRefs(item) {
        return Array.isArray(item.fotoRefs) && item.fotoRefs.length > 0;
      })
      .slice(0, 10);
  }

  function classifyItemOutcome(response) {
    var finalData = response && response.resultado && response.resultado.datos
      ? response.resultado.datos
      : {};
    var decision = finalData.decision || {};
    var flow = String(decision.decisionFlujo || "").trim().toLowerCase();
    var passport = String(decision.pasaporte || "").trim().toUpperCase();
    var draftId = finalData.revision && finalData.revision.draftIdGenerado
      ? String(finalData.revision.draftIdGenerado).trim()
      : "";

    if (response && response.ok === true && flow === "guardar") {
      return {
        estado: "GUARDADO_VERDE",
        draftId: null,
        flow: flow,
        passport: passport || "VERDE"
      };
    }

    return {
      estado: "PENDIENTE_REVISION",
      draftId: draftId || null,
      flow: flow || "revision",
      passport: passport || "NARANJA"
    };
  }

  function renderBadges(summary, target, pendingLoteCount) {
    if (!summary) {
      target.innerHTML = "";
      return;
    }
    target.innerHTML =
      "<span class=\"badge\">Procesadas: " + (summary.totalProcesadas || 0) + "</span>" +
      "<span class=\"badge\">Guardadas verdes: " + (summary.guardadasVerdes || 0) + "</span>" +
      "<span class=\"badge\">Pendientes revisión: " + (summary.pendientesRevision || 0) + "</span>" +
      "<span class=\"badge\">Errores: " + (summary.errores || 0) + "</span>" +
      "<span class=\"badge\">Pendientes lote abiertos: " + (pendingLoteCount || 0) + "</span>";
  }

  function renderDetail(items, target) {
    if (!Array.isArray(items) || !items.length) {
      target.innerHTML = "<p class=\"empty\">Sin detalle de items.</p>";
      return;
    }
    var html = items.map(function toRow(item) {
      var refs = Array.isArray(item.fotoRefs) ? item.fotoRefs.join(" | ") : "";
      return (
        "<tr>" +
          "<td>" + item.index + "</td>" +
          "<td>" + refs + "</td>" +
          "<td>" + (item.estado || "-") + "</td>" +
          "<td>" + (item.passport || "-") + "</td>" +
          "<td>" + (item.draftId || "-") + "</td>" +
          "<td>" + (item.errorCode || "-") + "</td>" +
        "</tr>"
      );
    }).join("");

    target.innerHTML =
      "<table>" +
        "<thead><tr><th>#</th><th>Fotos</th><th>Estado</th><th>Pasaporte</th><th>DraftId</th><th>Error</th></tr></thead>" +
        "<tbody>" + html + "</tbody>" +
      "</table>";
  }

  function fillDemoInput(target) {
    target.value = [
      "C:\\fotos\\mostaza_antigua.jpg",
      "C:\\fotos\\espaguetis.jpg",
      "C:\\fotos\\lentejas_frontal.jpg|C:\\fotos\\lentejas_trasera.jpg"
    ].join("\n");
  }

  function resolveVisibleRuntime() {
    if (
      globalScope &&
      globalScope.Fase5VisibleRuntime &&
      typeof globalScope.Fase5VisibleRuntime.getDefaultRuntime === "function"
    ) {
      return globalScope.Fase5VisibleRuntime.getDefaultRuntime();
    }
    return null;
  }

  function readSessionToken(runtime) {
    if (runtime && typeof runtime.getSessionToken === "function") {
      return runtime.getSessionToken();
    }
    return safeReadStorage(TOKEN_STORAGE_KEY);
  }

  function writeSessionToken(runtime, value) {
    if (runtime && typeof runtime.setSessionToken === "function") {
      return runtime.setSessionToken(value);
    }
    safeWriteStorage(TOKEN_STORAGE_KEY, value);
    return String(value || "").trim();
  }

  function readBackendUrl(runtime) {
    if (runtime && typeof runtime.getBackendUrl === "function") {
      return runtime.getBackendUrl();
    }
    return safeReadStorage(BACKEND_STORAGE_KEY) || DEFAULT_BACKEND_URL;
  }

  function writeBackendUrl(runtime, value) {
    var safeValue = String(value || "").trim() || DEFAULT_BACKEND_URL;
    if (runtime && typeof runtime.setBackendUrl === "function") {
      return runtime.setBackendUrl(safeValue);
    }
    safeWriteStorage(BACKEND_STORAGE_KEY, safeValue);
    return safeValue;
  }

  function resolveStore(globalScope) {
    var sharedApi = globalScope.Fase3SharedBrowserStore;
    if (sharedApi && typeof sharedApi.createSharedProductStore === "function") {
      return sharedApi.createSharedProductStore();
    }
    return globalScope.Fase3DataStoreLocal.createMemoryProductStore();
  }

  function countOpenLoteDrafts(store) {
    if (!store || typeof store.listRevisionDrafts !== "function") return 0;
    var drafts = store.listRevisionDrafts();
    var count = 0;
    for (var i = 0; i < drafts.length; i += 1) {
      var draft = drafts[i] || {};
      var rb = draft.resultadoBoxer || {};
      var caso = rb.casoRevision || {};
      var status = String(caso.estadoRevision || "").trim().toLowerCase();
      var modo = String(caso.modoOrigen || "").trim().toLowerCase();
      if (modo !== "lote") continue;
      if (status === "pendiente" || status === "en_revision") {
        count += 1;
      }
    }
    return count;
  }

  function updatePendingLoteButton(button, count) {
    if (!button) return;
    if (count > 0) {
      button.style.display = "inline-block";
      button.textContent = "Pendientes de revisión " + count;
    } else {
      button.style.display = "none";
      button.textContent = "Pendientes de revisión 0";
    }
  }

  async function processLote(items, deps) {
    var outItems = [];
    var summary = {
      totalSolicitadas: items.length,
      totalProcesadas: 0,
      guardadasVerdes: 0,
      pendientesRevision: 0,
      errores: 0
    };

    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      try {
        var response = await deps.altaVisible.ejecutarAnalisisVisible({
          fotoRefs: item.fotoRefs,
          sessionToken: deps.sessionToken,
          backendUrl: deps.backendUrl,
          contextoAlta: "lote",
          reviewPolicy: "non_guardar",
          timeoutMs: 25000,
          maxAutoRetryAttempts: 1
        }, {
          store: deps.store,
          visibleRuntime: deps.visibleRuntime
        });

        var outcome = classifyItemOutcome(response);
        summary.totalProcesadas += 1;
        if (outcome.estado === "GUARDADO_VERDE") summary.guardadasVerdes += 1;
        else summary.pendientesRevision += 1;
        outItems.push({
          index: item.index,
          fotoRefs: item.fotoRefs,
          estado: outcome.estado,
          passport: outcome.passport,
          decisionFlujo: outcome.flow,
          draftId: outcome.draftId || null,
          errorCode: null
        });
      } catch (err) {
        summary.totalProcesadas += 1;
        summary.errores += 1;
        outItems.push({
          index: item.index,
          fotoRefs: item.fotoRefs,
          estado: "ERROR",
          passport: "ROJO",
          draftId: null,
          errorCode: err && err.code ? err.code : "LOTE_ANALISIS_FAILED",
          message: err && err.message ? err.message : String(err)
        });
      }
    }

    return {
      resumen: summary,
      items: outItems
    };
  }

  function init() {
    var storeApi = globalScope.Fase3DataStoreLocal;
    var altaVisible = globalScope.Fase3AltaFotoVisibleApp;
    if (!storeApi || !altaVisible || typeof altaVisible.ejecutarAnalisisVisible !== "function") return;

    var visibleRuntime = resolveVisibleRuntime();
    var store = resolveStore(globalScope);
    var input = byId("lote-input");
    var tokenInput = byId("lote-session-token");
    var backendInput = byId("lote-backend-url");
    var processBtn = byId("procesar");
    var demoBtn = byId("demo");
    var clearBtn = byId("limpiar");
    var out = byId("salida-json");
    var badges = byId("resumen-badges");
    var detail = byId("detalle-lote");
    var pendingBtn = byId("abrir-pendientes-lote");

    tokenInput.value = readSessionToken(visibleRuntime);
    backendInput.value = readBackendUrl(visibleRuntime);
    updatePendingLoteButton(pendingBtn, countOpenLoteDrafts(store));

    processBtn.addEventListener("click", async function onProcess() {
      var items = parseLoteInput(input.value);
      var sessionToken = writeSessionToken(visibleRuntime, tokenInput.value);
      var backendUrl = writeBackendUrl(visibleRuntime, backendInput.value);
      if (!sessionToken) {
        out.textContent = JSON.stringify({
          ok: false,
          error: {
            code: "LOTE_TOKEN_REQUERIDO",
            message: "Necesitas token válido para ejecutar lote."
          }
        }, null, 2);
        return;
      }
      if (!items.length) {
        out.textContent = JSON.stringify({
          ok: false,
          error: {
            code: "LOTE_SIN_ITEMS",
            message: "Añade al menos una línea con foto."
          }
        }, null, 2);
        return;
      }

      processBtn.disabled = true;
      processBtn.textContent = "Procesando...";
      try {
        var result = await processLote(items, {
          altaVisible: altaVisible,
          store: store,
          sessionToken: sessionToken,
          backendUrl: backendUrl,
          visibleRuntime: visibleRuntime
        });
        var pendingCount = countOpenLoteDrafts(store);
        updatePendingLoteButton(pendingBtn, pendingCount);
        renderBadges(result.resumen, badges, pendingCount);
        renderDetail(result.items, detail);
        out.textContent = JSON.stringify({
          ok: true,
          resumen: result.resumen,
          items: result.items
        }, null, 2);
      } catch (err) {
        out.textContent = JSON.stringify({
          ok: false,
          error: {
            code: err && err.code ? err.code : "LOTE_EXECUTION_FAILED",
            message: err && err.message ? err.message : String(err)
          }
        }, null, 2);
      } finally {
        processBtn.disabled = false;
        processBtn.textContent = "Procesar lote";
      }
    });

    demoBtn.addEventListener("click", function onDemo() {
      fillDemoInput(input);
    });

    clearBtn.addEventListener("click", function onClear() {
      input.value = "";
      out.textContent = "";
      renderBadges(null, badges, countOpenLoteDrafts(store));
      renderDetail([], detail);
      updatePendingLoteButton(pendingBtn, countOpenLoteDrafts(store));
    });

    pendingBtn.addEventListener("click", function onOpenPending() {
      globalScope.location.href = "revision.html?modo=lote";
    });
  }

  if (typeof document === "undefined") return;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
    return;
  }
  init();
})(typeof globalThis !== "undefined" ? globalThis : this);
