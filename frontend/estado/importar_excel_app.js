(function initImportarExcelApp(globalScope) {
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

  function getHistorialCore() {
    return globalScope.Fase7HistorialCore || null;
  }

  var LOCAL_IMPORT_HISTORY_KEY = "fase10_import_history_local_v1";

  function saveLocalImportHistoryEvents(events) {
    try {
      if (!globalScope.localStorage) return;
      var current = JSON.parse(globalScope.localStorage.getItem(LOCAL_IMPORT_HISTORY_KEY) || "[]");
      var items = Array.isArray(current) ? current : [];
      var incoming = Array.isArray(events) ? events.filter(function each(item) {
        return item && typeof item === "object";
      }) : [];
      globalScope.localStorage.setItem(LOCAL_IMPORT_HISTORY_KEY, JSON.stringify(incoming.concat(items).slice(0, 30)));
    } catch (err) {
      // No-op.
    }
  }

  function buildAjustesUrlWithImportEvent(detail) {
    var baseUrl = "./ajustes.html";
    try {
      var encoded = encodeURIComponent(JSON.stringify({
        eventId: "hist_nav_" + Date.now().toString(36),
        eventType: "IMPORTACION_EXCEL",
        productId: "importacion_excel",
        productLabel: "Importacion Excel",
        actorId: "importacion_excel",
        occurredAt: new Date().toISOString(),
        summary: "Importacion Excel",
        importDetail: detail || {}
      }));
      return baseUrl + "?fase10ImportEvent=" + encoded;
    } catch (err) {
      return baseUrl;
    }
  }

  function buildImportHistoryRecords(input) {
    var safeInput = input || {};
    var core = getHistorialCore();
    if (!core || typeof core.construirRegistro !== "function") return [];
    var occurredAt = new Date().toISOString();
    var fileName = String(safeInput.fileName || "").trim();
    var sheetName = String(safeInput.sheetName || "").trim();
    var imported = Number(safeInput.imported || 0);
    var merged = Number(safeInput.merged || 0);
    var review = Number(safeInput.review || 0);
    var rejected = Number(safeInput.rejected || 0);
    var reviewRows = Array.isArray(safeInput.reviewRows) ? safeInput.reviewRows : [];
    var rejectedRows = Array.isArray(safeInput.rejectedRows) ? safeInput.rejectedRows : [];
    var events = [];

    events.push(core.construirRegistro(
      "IMPORTACION_EXCEL",
      "importacion_excel",
      "Importacion Excel",
      "importacion_excel",
      null,
      null,
      {
        occurredAt: occurredAt,
        importDetail: {
          fileName: fileName,
          sheetName: sheetName,
          imported: imported,
          merged: merged,
          review: review,
          rejected: rejected
        }
      }
    ));

    for (var i = 0; i < reviewRows.length; i += 1) {
      var reviewItem = reviewRows[i] || {};
      events.push(core.construirRegistro(
        "IMPORTACION_EXCEL_REVISION",
        String(reviewItem.draftId || ("excel_revision_" + String(reviewItem.rowNumber || i + 1))),
        String(reviewItem.nombre || "Fila en revision"),
        "importacion_excel",
        null,
        null,
        {
          occurredAt: occurredAt,
          importDetail: {
            fileName: fileName,
            sheetName: sheetName,
            rowNumber: Number(reviewItem.rowNumber || 0),
            reason: String(reviewItem.motivo || "Revision manual requerida.")
          }
        }
      ));
    }

    for (var j = 0; j < rejectedRows.length; j += 1) {
      var rejectedItem = rejectedRows[j] || {};
      events.push(core.construirRegistro(
        "IMPORTACION_EXCEL_RECHAZO",
        "excel_rechazo_" + String(rejectedItem.rowNumber || j + 1),
        String(rejectedItem.nombre || "Fila rechazada"),
        "importacion_excel",
        null,
        null,
        {
          occurredAt: occurredAt,
          importDetail: {
            fileName: fileName,
            sheetName: sheetName,
            rowNumber: Number(rejectedItem.rowNumber || 0),
            reason: String(rejectedItem.motivo || "La fila no se pudo guardar.")
          }
        }
      ));
    }

    return events;
  }

  async function writeImportHistoryEvents(events) {
    var runtime = getFirebaseRuntime();
    var core = getHistorialCore();
    var safeEvents = Array.isArray(events) ? events.filter(function each(item) { return !!item; }) : [];
    if (!safeEvents.length) return { ok: false };
    if (!runtime || runtime.ok !== true || !runtime.app || !runtime.firestoreModule || !core || typeof core.escribirEvento !== "function") {
      return { ok: false };
    }
    var firestoreModule = runtime.firestoreModule;
    if (typeof firestoreModule.getFirestore !== "function" || typeof firestoreModule.writeBatch !== "function") {
      return { ok: false };
    }
    try {
      var db = firestoreModule.getFirestore(runtime.app);
      var batch = firestoreModule.writeBatch(db);
      for (var i = 0; i < safeEvents.length; i += 1) {
        await core.escribirEvento(batch, safeEvents[i], {
          db: db,
          firestoreModule: firestoreModule
        });
      }
      await batch.commit();
      return { ok: true };
    } catch (err) {
      return { ok: false };
    }
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

  function buildImportMergeHistoryEvent(product) {
    var core = getHistorialCore();
    if (!core || typeof core.construirRegistro !== "function") return null;
    if (!product || !product.id) return null;
    try {
      return core.construirRegistro(
        "PRODUCT_UPDATED",
        product.id,
        product.identidad && product.identidad.nombre ? product.identidad.nombre : product.id,
        "importacion_excel",
        ["alergenos"],
        { alergenos: "Fusionado desde importacion Excel." },
        {}
      );
    } catch (errBuild) {
      return null;
    }
  }

  function setOverlay(title, text, percent, countText, visible) {
    byId("overlay-title").textContent = title || "";
    byId("overlay-text").textContent = text || "";
    byId("overlay-bar").style.width = Math.max(0, Math.min(100, Number(percent) || 0)) + "%";
    byId("overlay-count").textContent = countText || "";
    byId("import-overlay").hidden = !visible;
    byId("overlay-actions").hidden = true;
  }

  function showOverlayResult(title, text, countText, allowRetry) {
    byId("overlay-title").textContent = title || "";
    byId("overlay-text").textContent = text || "";
    byId("overlay-bar").style.width = "100%";
    byId("overlay-count").textContent = countText || "";
    byId("overlay-actions").hidden = !allowRetry;
    byId("import-overlay").hidden = false;
  }

  function renderSummary(state) {
    var target = byId("import-summary");
    if (!state.summary) {
      target.innerHTML = "";
      byId("import-summary-actions").hidden = true;
      return;
    }
    var ignoredColumns = Array.isArray(state.summary.ignoredColumns) ? state.summary.ignoredColumns : [];
    var reviewRows = Array.isArray(state.summary.reviewRows) ? state.summary.reviewRows : [];
    var rejectedRows = Array.isArray(state.summary.rejectedRows) ? state.summary.rejectedRows : [];
    target.innerHTML = [
      "<div class=\"box\"><strong>Hoja usada</strong><div class=\"meta\">" + String(state.summary.sheetName || "-") + "</div></div>",
      "<div class=\"box\"><strong>Cabecera detectada</strong><div class=\"meta\">Fila " + String(state.summary.headerRowNumber || "-") + "</div></div>",
      "<div class=\"box\"><strong>Modo de importacion</strong><div class=\"meta\">Sumar y fusionar con la base actual</div></div>",
      "<div class=\"box\"><strong>Resultado</strong><div class=\"meta\">" +
        "Importados: " + Number(state.summary.imported || 0) +
        " | Fusionados: " + Number(state.summary.merged || 0) +
        " | En revision: " + Number(state.summary.review || 0) +
        " | Rechazados: " + Number(state.summary.rejected || 0) +
        " | Pendientes de subida: " + Number(state.summary.pendingSync || 0) +
      "</div></div>",
      "<div class=\"box\"><strong>Historial</strong><div class=\"meta\">" + (
        Number(state.summary.historyMerged || 0) > 0
          ? "Se han dejado " + Number(state.summary.historyMerged || 0) + " fusion(es) visibles en Historial."
          : "No hubo fusiones que dejaran rastro en Historial."
      ) + "</div></div>",
      "<div class=\"box\"><strong>Columnas ignoradas</strong><div class=\"meta\">" + (
        ignoredColumns.length
          ? ignoredColumns.map(function each(item) { return String(item.header || "-"); }).join(", ")
          : "No habia columnas sobrantes."
      ) + "</div></div>",
      "<div class=\"box\"><strong>Filas enviadas a revision</strong>" + (
        reviewRows.length
          ? "<ul>" + reviewRows.map(function each(item) {
              return "<li>Fila " + Number(item.rowNumber || 0) + ": " + String(item.nombre || "(sin nombre)") + " | " + String(item.motivo || "Sin detalle") + "</li>";
            }).join("") + "</ul>"
          : "<div class=\"meta\">No hubo filas en revision.</div>"
      ) + "</div>",
      "<div class=\"box\"><strong>Filas rechazadas</strong>" + (
        rejectedRows.length
          ? "<ul>" + rejectedRows.map(function each(item) {
              return "<li>Fila " + Number(item.rowNumber || 0) + ": " + String(item.nombre || "(sin nombre)") + " | " + String(item.motivo || "Sin detalle") + "</li>";
            }).join("") + "</ul>"
          : "<div class=\"meta\">No hubo filas rechazadas.</div>"
      ) + "</div>"
    ].join("");
    byId("import-summary-actions").hidden = false;
  }

  function goBack() {
    if (globalScope.history && globalScope.history.length > 1) {
      globalScope.history.back();
      return;
    }
    globalScope.location.href = "./ajustes.html";
  }

  async function readFileAsUint8Array(file) {
    var buffer = await file.arrayBuffer();
    return new Uint8Array(buffer);
  }

  function updateRunButton(state) {
    byId("import-run").disabled = !state.file || state.busy;
  }

  function createReviewDrafts(input) {
    var safeInput = input || {};
    var store = safeInput.store;
    var sheetName = String(safeInput.sheetName || "").trim() || null;
    var traceId = String(safeInput.traceId || "").trim() || null;
    var reviewRows = Array.isArray(safeInput.reviewRows) ? safeInput.reviewRows : [];
    if (!store || typeof store.createRevisionDraft !== "function") {
      return {
        created: [],
        failed: reviewRows.map(function each(item) {
          return {
            rowNumber: item && item.rowNumber,
            nombre: item && item.nombre,
            motivo: "No se pudo abrir la revision en esta app."
          };
        })
      };
    }

    var created = [];
    var failed = [];
    for (var i = 0; i < reviewRows.length; i += 1) {
      var item = reviewRows[i] || {};
      var out = store.createRevisionDraft({
        origenAlta: "excel",
        nombrePropuesto: item.nombre || "Producto por revisar",
        alergenosPropuestos: Array.isArray(item.alergenos) ? item.alergenos : [],
        resultadoBoxer: {
          casoRevision: {
            origen: "excel",
            motivo: item.motivo || "Revision manual requerida.",
            filaOrigen: Number(item.rowNumber || 0) || null,
            hojaOrigen: sheetName,
            traceId: traceId
          },
          propuestaFinal: {
            nombre: item.nombre || "Producto por revisar",
            alergenos: Array.isArray(item.alergenos) ? item.alergenos : []
          },
          revision: {
            fuente: "importacion_excel",
            motivo: item.motivo || "Revision manual requerida.",
            filaOrigen: Number(item.rowNumber || 0) || null,
            hojaOrigen: sheetName,
            traceId: traceId
          }
        }
      });
      if (out && out.ok === true && out.draft) {
        created.push({
          rowNumber: item.rowNumber,
          nombre: item.nombre,
          motivo: item.motivo,
          draftId: out.draft.draftId
        });
        continue;
      }
      failed.push({
        rowNumber: item.rowNumber,
        nombre: item.nombre,
        motivo: out && out.message ? out.message : "No se pudo abrir la revision en esta app."
      });
    }

    return {
      created: created,
      failed: failed
    };
  }

  async function syncImportedItems(input) {
    var safeInput = input || {};
    var remote = safeInput.remote;
    var token = String(safeInput.token || "").trim();
    var store = safeInput.store;
    var importedItems = Array.isArray(safeInput.items) ? safeInput.items : [];
    if (!remote || remote.ok !== true || !token || !store || typeof store.getProductById !== "function") {
      return {
        pendingSync: importedItems.length,
        historyMerged: 0
      };
    }

    var mergedWithHistory = [];
    var plainBatch = [];
    for (var i = 0; i < importedItems.length; i += 1) {
      var item = importedItems[i];
      if (!item || !item.productId) continue;
      var product = store.getProductById(item.productId);
      if (!product) continue;
      if (item.merged) {
        mergedWithHistory.push({
          product: product,
          historyEvent: buildImportMergeHistoryEvent(product)
        });
        continue;
      }
      plainBatch.push(product);
    }

    var uploaded = 0;
    var historyMerged = 0;

    if (plainBatch.length) {
      var batchOut = await remote.upsertProductRecordsBatch({
        products: plainBatch,
        chunkSize: 25,
        sessionToken: token
      });
      if (batchOut && batchOut.ok === true) {
        uploaded += plainBatch.length;
        for (var j = 0; j < plainBatch.length; j += 1) {
          if (typeof store.markProductAsSynced === "function") {
            store.markProductAsSynced({ productId: plainBatch[j].id });
          }
        }
      }
    }

    for (var k = 0; k < mergedWithHistory.length; k += 1) {
      var current = mergedWithHistory[k];
      var out = await remote.upsertProductRecord({
        product: current.product,
        historyEvent: current.historyEvent,
        sessionToken: token
      });
      if (!out || out.ok !== true) {
        continue;
      }
      uploaded += 1;
      historyMerged += current.historyEvent ? 1 : 0;
      if (typeof store.markProductAsSynced === "function") {
        store.markProductAsSynced({ productId: current.product.id });
      }
    }

    return {
      pendingSync: Math.max(0, importedItems.length - uploaded),
      historyMerged: historyMerged
    };
  }

  async function runImport(state) {
    if (!state.file || !globalScope.Fase10ImportacionExcel) return;
    state.busy = true;
    updateRunButton(state);
    state.summary = null;
    renderSummary(state);

    setOverlay("Archivo recibido", "Comprobando archivo...", 5, "0 de 0", true);
    byId("import-status").textContent = "Archivo recibido. Revisando...";

    var bytes = await readFileAsUint8Array(state.file);
    setOverlay("Validando archivo", "Verificando que el Excel sea correcto y seguro...", 20, "0 de 0", true);

    var parsed = await globalScope.Fase10ImportacionExcel.validateAndParseExcel({
      file: state.file,
      bytes: bytes,
      traceId: "imp_" + Date.now().toString(36)
    });

    if (!parsed || parsed.ok !== true) {
      state.busy = false;
      updateRunButton(state);
      showOverlayResult(
        "Archivo rechazado",
        parsed && parsed.error ? parsed.error.message : "No se pudo validar el archivo.",
        "0 de 0",
        true
      );
      byId("import-status").textContent = parsed && parsed.error ? parsed.error.message : "Archivo rechazado.";
      return;
    }

    var store = getStore();
    var rows = parsed.resultado.datos.rows || [];
    var parseReview = parsed.resultado.datos.review || [];
    setOverlay("Archivo aprobado", "Preparando importacion...", 35, "0 de " + rows.length, true);

    var importOut = await globalScope.Fase10ImportacionExcel.importarFilasEnBloques({
      rows: rows,
      deps: { store: store },
      traceId: parsed.resultado.traceId || null,
      onProgress: function onProgress(progress) {
        var total = Number(progress.total || 0);
        var done = Number(progress.done || 0);
        var percent = total > 0 ? 35 + ((done / total) * 55) : 90;
        setOverlay(
          "Importando productos",
          "Guardando en la app...",
          percent,
          done + " de " + total,
          true
        );
      }
    });

    state.busy = false;
    updateRunButton(state);

    if (!importOut || importOut.ok !== true) {
      showOverlayResult(
        "Importacion cancelada",
        importOut && importOut.error ? importOut.error.message : "No se pudo importar.",
        "0 de 0",
        true
      );
      byId("import-status").textContent = importOut && importOut.error ? importOut.error.message : "Importacion cancelada.";
      return;
    }

    var reviewCreated = [];
    var reviewFailed = [];
    if (parseReview.length) {
      setOverlay("Enviando a revision", "Guardando filas dudosas para revisar...", 92, parseReview.length + " de " + parseReview.length, true);
      var draftOut = createReviewDrafts({
        store: store,
        reviewRows: parseReview,
        sheetName: parsed.resultado.datos.sheetName,
        traceId: parsed.resultado.traceId || null
      });
      reviewCreated = draftOut.created;
      reviewFailed = draftOut.failed;
    }

    var importedItems = Array.isArray(importOut.resultado.datos.summary.items)
      ? importOut.resultado.datos.summary.items.filter(function onlyOk(item) {
          return item && item.ok === true && item.productId;
        })
      : [];
    var pendingSync = importedItems.length;
    var historyMerged = 0;
    var remote = resolveRemoteIndex();
    var token = readSessionToken();
    if (remote && remote.ok === true && token) {
      setOverlay("Preparando sincronizacion", "Subiendo cambios poco a poco...", 92, importedItems.length + " de " + importedItems.length, true);
      var syncResult = await syncImportedItems({
        remote: remote,
        token: token,
        store: store,
        items: importedItems
      });
      pendingSync = Number(syncResult.pendingSync || 0);
      historyMerged = Number(syncResult.historyMerged || 0);
    }

    var rejectedRows = reviewFailed.concat((importOut.resultado.datos.summary.items || []).filter(function onlyRejected(item) {
      return item && item.ok === false;
    }).map(function toRejected(item) {
      return {
        rowNumber: item.rowNumber,
        nombre: item.nombre || "",
        motivo: item.message || "No se pudo guardar la fila."
      };
    }));

    var historyEvents = buildImportHistoryRecords({
      fileName: state.file ? String(state.file.name || "") : "",
      sheetName: parsed.resultado.datos.sheetName,
      imported: importOut.resultado.datos.summary.imported,
      merged: importOut.resultado.datos.summary.merged,
      review: reviewCreated.length,
      rejected: Number(importOut.resultado.datos.summary.rejected || 0) + reviewFailed.length,
      reviewRows: reviewCreated,
      rejectedRows: rejectedRows
    });
    await writeImportHistoryEvents(historyEvents);

    state.summary = {
      sheetName: parsed.resultado.datos.sheetName,
      headerRowNumber: parsed.resultado.datos.headerRowNumber,
      imported: importOut.resultado.datos.summary.imported,
      merged: importOut.resultado.datos.summary.merged,
      review: reviewCreated.length,
      rejected: Number(importOut.resultado.datos.summary.rejected || 0) + reviewFailed.length,
      pendingSync: pendingSync,
      historyMerged: historyMerged,
      ignoredColumns: parsed.resultado.datos.ignoredColumns || [],
      reviewRows: reviewCreated,
      rejectedRows: rejectedRows
    };
    state.lastImportEvent = {
      fileName: state.file ? String(state.file.name || "") : "",
      sheetName: state.summary.sheetName,
      imported: state.summary.imported,
      merged: state.summary.merged,
      review: state.summary.review,
      rejected: state.summary.rejected
    };
    saveLocalImportHistoryEvents(historyEvents);
    renderSummary(state);
    setOverlay("Importacion completada", "La carga ya ha terminado.", 100, rows.length + " de " + rows.length, false);
    byId("import-status").textContent =
      "Importados: " + state.summary.imported +
      " | Fusionados: " + state.summary.merged +
      " | En revision: " + state.summary.review +
      " | Rechazados: " + state.summary.rejected +
      " | Pendientes de subida: " + state.summary.pendingSync;
  }

  function init() {
    var state = {
      file: null,
      busy: false,
      summary: null,
      lastImportEvent: null
    };

    byId("import-cancel").addEventListener("click", function onCancel() {
      goBack();
    });
    byId("overlay-close").addEventListener("click", function onCloseOverlay() {
      byId("import-overlay").hidden = true;
      byId("overlay-actions").hidden = true;
    });
    byId("overlay-pick-other").addEventListener("click", function onPickOther() {
      byId("import-overlay").hidden = true;
      byId("overlay-actions").hidden = true;
      byId("import-file").value = "";
      state.file = null;
      byId("import-status").textContent = "Esperando archivo...";
      updateRunButton(state);
      try {
        byId("import-file").click();
      } catch (errPick) {
        // No-op.
      }
    });
    byId("import-file").addEventListener("change", function onChange() {
      state.file = byId("import-file").files && byId("import-file").files[0] ? byId("import-file").files[0] : null;
      byId("import-status").textContent = state.file ? "Archivo listo para revisar." : "Esperando archivo...";
      updateRunButton(state);
    });
    byId("import-run").addEventListener("click", function onRun() {
      runImport(state);
    });
    byId("import-summary-cancel").addEventListener("click", function onSummaryCancel() {
      goBack();
    });
    byId("import-accept").addEventListener("click", function onAccept() {
      globalScope.location.href = buildAjustesUrlWithImportEvent(state.lastImportEvent || {});
    });

    updateRunButton(state);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
    return;
  }
  init();
})(typeof globalThis !== "undefined" ? globalThis : this);

