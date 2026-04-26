(function initAjustesFase7App(globalScope) {
  "use strict";

  var VISUAL_SETTINGS_STORAGE_KEY = "appv2_visual_settings_v1";
  var ALLERGEN_DISPLAY_SETTINGS_KEY = "appv2_allergen_card_display_v1";
  var LOCAL_IMPORT_HISTORY_KEY = "fase10_import_history_local_v1";
  var LOCAL_PRODUCT_HISTORY_KEY = "appv2_product_history_local_v1";
  var BACKUP_OWNER_KEY = "alergenos_backup_owner_key";
  var BACKUP_LIST_TIMEOUT_MS = 12000;
  var DETAIL_AUTO_HIDE_MS = 4000;
  var DEFAULT_VISUAL_SETTINGS = {
    profileKey: "EQUILIBRADO_WEBP",
    qualityPct: 40,
    resolutionMaxPx: 600
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cloneValue(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function formatDate(value) {
    var date = value ? new Date(value) : null;
    if (!date || !Number.isFinite(date.getTime())) return "-";
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function formatDateTime(value) {
    var date = value ? new Date(value) : null;
    if (!date || !Number.isFinite(date.getTime())) return "-";
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function createUiError(message, code) {
    var err = new Error(String(message || "Error"));
    err.code = String(code || "UI_ERROR");
    return err;
  }

  function runWithTimeout(promise, timeoutMs, timeoutMessage) {
    var safePromise = promise && typeof promise.then === "function"
      ? promise
      : Promise.resolve(promise);
    var safeTimeoutMs = Math.max(1000, Number(timeoutMs || 0) || BACKUP_LIST_TIMEOUT_MS);
    return Promise.race([
      safePromise,
      new Promise(function onTimeout(_, reject) {
        setTimeout(function fireTimeout() {
          reject(createUiError(timeoutMessage || "La operacion tardo demasiado.", "UI_TIMEOUT"));
        }, safeTimeoutMs);
      })
    ]);
  }

  function toUserBackupMessage(message, fallback) {
    var safeMessage = String(message || "").trim();
    var lower = safeMessage.toLowerCase();
    if (!safeMessage) return String(fallback || "No se pudo completar ahora.");
    if (lower.indexOf("retry-limit-exceeded") >= 0 || lower.indexOf("max retry time") >= 0) {
      return "La nube no respondio a tiempo. Prueba otra vez.";
    }
    if (lower.indexOf("sessiontoken") >= 0 || lower.indexOf("token") >= 0 || lower.indexOf("sesion") >= 0) {
      return "Hace falta iniciar sesion otra vez para consultar las copias.";
    }
    if (lower.indexOf("storage") >= 0 || lower.indexOf("backup") >= 0 || lower.indexOf("copias") >= 0) {
      return "No se pudieron consultar las copias ahora.";
    }
    if (lower.indexOf("timeout") >= 0 || lower.indexOf("tardo demasiado") >= 0) {
      return "La consulta de copias tardo demasiado. Prueba otra vez.";
    }
    return String(fallback || "No se pudo completar ahora.");
  }

  function buildSyncSummary(syncData) {
    if (!syncData) return "La app guarda tus cambios automaticamente.";
    if (Number(syncData.conflicts || 0) > 0) return "Hay cambios pendientes de revisar.";
    if (Number(syncData.pending || 0) > 0) return "Hay cambios pendientes de guardar.";
    if (syncData.ok === false) return "La conexion con la nube necesita revision.";
    if (syncData.lastSyncAt) return "Cambios guardados. Ultima actualizacion: " + formatDateTime(syncData.lastSyncAt);
    return "Sin cambios pendientes.";
  }

  function isOnline() {
    if (typeof navigator === "undefined" || typeof navigator.onLine !== "boolean") return true;
    return navigator.onLine;
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
      if (globalScope.localStorage) {
        var storedOwner = String(globalScope.localStorage.getItem(BACKUP_OWNER_KEY) || "").trim();
        if (storedOwner) return storedOwner;
      }
      if (globalScope.sessionStorage) {
        var sessionUser = String(globalScope.sessionStorage.getItem("alergenos_access_user") || "").trim();
        if (sessionUser) return "usuario_" + normalizeBackupOwner(sessionUser);
      }
    } catch (errOwner) {
      // No-op.
    }
    return "sesion_" + (readSessionToken().slice(0, 8) || "local");
  }

  function getStoredVisualSettings() {
    try {
      if (!globalScope.localStorage) return null;
      var raw = globalScope.localStorage.getItem(VISUAL_SETTINGS_STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (err) {
      return null;
    }
  }

  function saveStoredVisualSettings(settings) {
    try {
      if (!globalScope.localStorage) return;
      globalScope.localStorage.setItem(VISUAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings || {}));
    } catch (err) {
      // No-op.
    }
  }

  function getVisualSettings() {
    var saved = getStoredVisualSettings() || {};
    return {
      profileKey: String(saved.profileKey || DEFAULT_VISUAL_SETTINGS.profileKey),
      qualityPct: Number(saved.qualityPct || DEFAULT_VISUAL_SETTINGS.qualityPct),
      resolutionMaxPx: Number(saved.resolutionMaxPx || DEFAULT_VISUAL_SETTINGS.resolutionMaxPx),
      updatedAt: saved.updatedAt || null,
      recompressAllAt: saved.recompressAllAt || null
    };
  }

  function getAllergenDisplayMode() {
    try {
      if (!globalScope.localStorage) return "texto";
      var raw = String(globalScope.localStorage.getItem(ALLERGEN_DISPLAY_SETTINGS_KEY) || "").trim().toLowerCase();
      return raw === "iconos" ? "iconos" : "texto";
    } catch (errMode) {
      return "texto";
    }
  }

  function saveAllergenDisplayMode(mode) {
    try {
      if (!globalScope.localStorage) return;
      globalScope.localStorage.setItem(ALLERGEN_DISPLAY_SETTINGS_KEY, mode === "iconos" ? "iconos" : "texto");
    } catch (errSaveMode) {
      // No-op.
    }
  }

  function renderAllergenDisplaySettings(state, message) {
    var mode = getAllergenDisplayMode();
    if (state.el.allergenDisplayToggle) {
      state.el.allergenDisplayToggle.checked = mode === "iconos";
    }
    if (state.el.allergenDisplayStatus) {
      state.el.allergenDisplayStatus.textContent = message || ("Modo actual: " + (mode === "iconos" ? "pictogramas." : "texto."));
    }
  }

  function readLocalImportHistory() {
    try {
      if (!globalScope.localStorage) return [];
      var raw = globalScope.localStorage.getItem(LOCAL_IMPORT_HISTORY_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function readLocalProductHistory() {
    try {
      if (!globalScope.localStorage) return [];
      var raw = globalScope.localStorage.getItem(LOCAL_PRODUCT_HISTORY_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (errLocalHistory) {
      return [];
    }
  }

  function readImportEventFromUrl() {
    try {
      var params = new URLSearchParams(globalScope.location && globalScope.location.search || "");
      var raw = String(params.get("fase10ImportEvent") || "").trim();
      if (!raw) return null;
      return JSON.parse(decodeURIComponent(raw));
    } catch (err) {
      return null;
    }
  }

  function mergeInjectedImportEvent(items) {
    var safeItems = Array.isArray(items) ? items.slice(0) : [];
    var injected = readImportEventFromUrl();
    if (!injected || !injected.eventId) return safeItems;
    var exists = safeItems.some(function each(item) {
      if (!item) return false;
      if (item.eventId === injected.eventId) return true;
      if (item.eventType !== "IMPORTACION_EXCEL" || injected.eventType !== "IMPORTACION_EXCEL") return false;
      var current = item.importDetail && typeof item.importDetail === "object" ? item.importDetail : {};
      var next = injected.importDetail && typeof injected.importDetail === "object" ? injected.importDetail : {};
      return String(current.fileName || "") === String(next.fileName || "") &&
        String(current.sheetName || "") === String(next.sheetName || "") &&
        Number(current.imported || 0) === Number(next.imported || 0) &&
        Number(current.merged || 0) === Number(next.merged || 0) &&
        Number(current.review || 0) === Number(next.review || 0) &&
        Number(current.rejected || 0) === Number(next.rejected || 0);
    });
    if (!exists) safeItems.unshift(injected);
    return safeItems.slice(0, 30);
  }

  function compareHistoryDesc(a, b) {
    var aMs = Date.parse(String(a && a.occurredAt || "")) || 0;
    var bMs = Date.parse(String(b && b.occurredAt || "")) || 0;
    if (aMs !== bMs) return bMs - aMs;
    return String(b && b.eventId || "").localeCompare(String(a && a.eventId || ""));
  }

  function buildHistorySignature(item) {
    if (!item || !item.eventType) return "";
    var safe = item || {};
    var parts = [
      String(safe.eventType || "").trim(),
      String(safe.productId || "").trim(),
      String(safe.productLabel || "").trim().toLowerCase()
    ];

    if (safe.eventType === "PRODUCT_UPDATED") {
      var changedFields = Array.isArray(safe.changedFields) ? safe.changedFields.slice(0).sort().join(",") : "";
      var detail = safe.changeDetail && typeof safe.changeDetail === "object"
        ? Object.keys(safe.changeDetail).sort().map(function each(key) {
          return key + ":" + String(safe.changeDetail[key] || "").trim();
        }).join("|")
        : "";
      parts.push(changedFields, detail);
    }

    if (
      safe.eventType === "IMPORTACION_EXCEL" ||
      safe.eventType === "IMPORTACION_EXCEL_REVISION" ||
      safe.eventType === "IMPORTACION_EXCEL_RECHAZO"
    ) {
      var importDetail = safe.importDetail && typeof safe.importDetail === "object" ? safe.importDetail : {};
      parts.push(
        String(importDetail.fileName || "").trim(),
        String(importDetail.sheetName || "").trim(),
        String(importDetail.rowNumber || "").trim(),
        String(importDetail.reason || "").trim(),
        String(importDetail.imported || "").trim(),
        String(importDetail.merged || "").trim(),
        String(importDetail.review || "").trim(),
        String(importDetail.rejected || "").trim()
      );
    }

    return parts.join("||");
  }

  function mergeHistorySources(remoteItems, localProductItems, localImportItems) {
    var out = [];
    var seenEventIds = Object.create(null);
    var seenSignatures = Object.create(null);

    function push(item) {
      if (!item || !item.eventType) return;
      var cloned = cloneValue(item);
      var eventId = String(cloned.eventId || "").trim();
      var signature = buildHistorySignature(cloned);
      if (eventId && seenEventIds[eventId]) return;
      if (signature && seenSignatures[signature]) return;
      if (eventId) seenEventIds[eventId] = true;
      if (signature) seenSignatures[signature] = true;
      out.push(cloned);
    }

    (Array.isArray(remoteItems) ? remoteItems : []).forEach(push);
    (Array.isArray(localProductItems) ? localProductItems : []).forEach(push);
    (Array.isArray(localImportItems) ? localImportItems : []).forEach(push);

    out = mergeInjectedImportEvent(out);
    out.sort(compareHistoryDesc);
    return out.slice(0, 30);
  }

  function buildHistorySeenMaps(items) {
    var seenEventIds = Object.create(null);
    var seenSignatures = Object.create(null);
    (Array.isArray(items) ? items : []).forEach(function each(item) {
      if (!item || !item.eventType) return;
      var eventId = String(item.eventId || "").trim();
      var signature = buildHistorySignature(item);
      if (eventId) seenEventIds[eventId] = true;
      if (signature) seenSignatures[signature] = true;
    });
    return {
      seenEventIds: seenEventIds,
      seenSignatures: seenSignatures
    };
  }

  function findHistoryBackfillCandidates(remoteItems, localItems) {
    var maps = buildHistorySeenMaps(remoteItems);
    var candidates = [];
    (Array.isArray(localItems) ? localItems : []).forEach(function each(item) {
      if (!item || !item.eventType) return;
      var eventId = String(item.eventId || "").trim();
      var signature = buildHistorySignature(item);
      if (eventId && maps.seenEventIds[eventId]) return;
      if (signature && maps.seenSignatures[signature]) return;
      if (eventId) maps.seenEventIds[eventId] = true;
      if (signature) maps.seenSignatures[signature] = true;
      candidates.push(cloneValue(item));
    });
    candidates.sort(function sortAsc(a, b) {
      return compareHistoryDesc(b, a);
    });
    return candidates;
  }

  async function repairRemoteHistory(state, remoteIndex, remoteItems, localItems) {
    if (
      !state ||
      state.historyRepairBusy === true ||
      !remoteIndex ||
      typeof remoteIndex.appendHistoryEvent !== "function"
    ) {
      return { ok: false, repaired: 0 };
    }

    var pending = findHistoryBackfillCandidates(remoteItems, localItems);
    if (!pending.length) return { ok: true, repaired: 0 };

    state.historyRepairBusy = true;
    try {
      var repaired = 0;
      for (var i = 0; i < pending.length; i += 1) {
        var out = await remoteIndex.appendHistoryEvent({
          historyEvent: pending[i],
          sessionToken: readSessionToken() || null
        });
        if (out && out.ok === true) repaired += 1;
      }
      return {
        ok: repaired === pending.length,
        repaired: repaired
      };
    } finally {
      state.historyRepairBusy = false;
    }
  }

  function profileToLabel(key) {
    if (key === "MAXIMA_COMPRESION_WEBP") return "Maxima compresion (WebP)";
    if (key === "ALTA_CALIDAD_JPEG") return "Alta calidad (JPEG)";
    return "Equilibrado (WebP)";
  }

  function resolveRemoteIndex() {
    var runtime = getFirebaseRuntime();
    if (!runtime || runtime.ok !== true) {
      return {
        ok: false,
        errorCode: runtime && runtime.errorCode ? runtime.errorCode : "FIREBASE_RUNTIME_NO_LISTO",
        message: runtime && runtime.message ? runtime.message : "Firebase aun no esta listo."
      };
    }
    if (!globalScope.Fase3FirestoreProductosRemote) {
      return {
        ok: false,
        errorCode: "FIREBASE_ADAPTADOR_NO_CARGADO",
        message: "Falta el adaptador Firestore de productos."
      };
    }

    var remote = globalScope.Fase3FirestoreProductosRemote.createFirestoreProductosRemote({
      firebaseApp: runtime.app,
      firestoreModule: runtime.firestoreModule,
      collectionName: "fase3_productos",
      waitForAuth: typeof runtime.waitForAuth === "function" ? runtime.waitForAuth : null,
      tokenValidator: function tokenValidator(token) {
        return String(token || "").trim().length > 0;
      }
    });
    if (!remote || remote.ok !== true) {
      return {
        ok: false,
        errorCode: remote && remote.errorCode ? remote.errorCode : "FIREBASE_PRODUCTOS_NO_LISTO",
        message: remote && remote.message ? remote.message : "No se pudo preparar productos."
      };
    }
    return { ok: true, remoteIndex: remote };
  }

  function buildDetailLines(item) {
    if (!item || !item.eventType) return ["Sin detalle."];
    if (item.eventType === "PRODUCT_CREATED") return ["El producto fue anadido."];
    if (item.eventType === "PRODUCT_DELETED") return ["El producto fue eliminado."];
    if (
      item.eventType === "IMPORTACION_EXCEL" ||
      item.eventType === "IMPORTACION_EXCEL_REVISION" ||
      item.eventType === "IMPORTACION_EXCEL_RECHAZO"
    ) {
      var importDetail = item.importDetail && typeof item.importDetail === "object" ? item.importDetail : {};
      var lines = [
        "Archivo: " + String(importDetail.fileName || "-"),
        "Hoja usada: " + String(importDetail.sheetName || "-")
      ];
      if (item.eventType === "IMPORTACION_EXCEL") {
        lines.push("Importados: " + Number(importDetail.imported || 0));
        lines.push("Fusionados: " + Number(importDetail.merged || 0));
        lines.push("En revision: " + Number(importDetail.review || 0));
        lines.push("Rechazados: " + Number(importDetail.rejected || 0));
        return lines;
      }
      lines.push("Fila: " + Number(importDetail.rowNumber || 0));
      lines.push("Motivo: " + String(importDetail.reason || "Sin detalle"));
      return lines;
    }

    var detail = item.changeDetail && typeof item.changeDetail === "object" ? item.changeDetail : {};
    var out = [];
    Object.keys(detail).forEach(function each(key) {
      if (String(detail[key] || "").trim()) out.push(String(detail[key]).trim());
    });
    return out.length ? out : ["Cambio registrado sin detalle legible."];
  }

  function updateHistoryCardSelection(state) {
    Array.prototype.forEach.call(state.el.list.querySelectorAll(".event-card"), function each(btn) {
      var idx = Number(btn.getAttribute("data-idx"));
      var active = Number.isFinite(idx) && idx === state.selectedIndex;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function clearDetailAutoHide(state) {
    if (!state.detailHideTimer) return;
    globalScope.clearTimeout(state.detailHideTimer);
    state.detailHideTimer = 0;
  }

  function hideDetailPopover(state) {
    clearDetailAutoHide(state);
    state.selectedIndex = -1;
    if (state.el.detailPopover) {
      state.el.detailPopover.classList.add("is-hidden");
      state.el.detailPopover.innerHTML = "";
    }
    updateHistoryCardSelection(state);
  }

  function scheduleDetailAutoHide(state) {
    clearDetailAutoHide(state);
    state.detailHideTimer = globalScope.setTimeout(function onHideTimer() {
      hideDetailPopover(state);
    }, DETAIL_AUTO_HIDE_MS);
  }

  function renderDetailPopover(state, item) {
    if (!item || !state.el.detailPopover) {
      hideDetailPopover(state);
      return;
    }
    var lines = buildDetailLines(item);
    state.el.detailPopover.innerHTML =
      "<h3>" + escapeHtml(item.productLabel || "(sin nombre)") + "</h3>" +
      "<p class=\"meta\">" + escapeHtml(formatDateTime(item.occurredAt)) + "</p>" +
      "<ul>" + lines.map(function toRow(line) {
        return "<li>" + escapeHtml(line) + "</li>";
      }).join("") + "</ul>";
    state.el.detailPopover.classList.remove("is-hidden");
    scheduleDetailAutoHide(state);
  }

  function toVisibleType(eventType) {
    if (eventType === "PRODUCT_CREATED") return "Anadido";
    if (eventType === "PRODUCT_UPDATED") return "Modificado";
    if (eventType === "PRODUCT_DELETED") return "Eliminado";
    if (eventType === "IMPORTACION_EXCEL") return "Importacion Excel";
    if (eventType === "IMPORTACION_EXCEL_REVISION") return "En revision";
    if (eventType === "IMPORTACION_EXCEL_RECHAZO") return "Rechazado";
    return "Movimiento";
  }

  function renderHistoryList(state) {
    var items = Array.isArray(state.items) ? state.items : [];
    if (!Number.isFinite(state.selectedIndex) || state.selectedIndex < 0) state.selectedIndex = -1;
    if (state.selectedIndex >= items.length) state.selectedIndex = -1;
    state.el.count.textContent = "Registros: " + items.length + " / 30";

    if (!items.length) {
      state.el.list.innerHTML = "<p class=\"empty\">Sin movimientos todavia.</p>";
      hideDetailPopover(state);
      return;
    }

    state.el.list.innerHTML = items.map(function toCard(item, index) {
      var isActive = index === state.selectedIndex;
      return (
        "<button type=\"button\" class=\"event-card" + (isActive ? " is-active" : "") + "\" data-idx=\"" + index + "\" aria-pressed=\"" + (isActive ? "true" : "false") + "\" title=\"" + escapeHtml(item.productLabel || "(sin nombre)") + "\">" +
          "<span class=\"event-type\">" + toVisibleType(item.eventType) + "</span>" +
          "<span class=\"event-name\">" + escapeHtml(item.productLabel || "(sin nombre)") + "</span>" +
          "<span class=\"event-date\">" + formatDateTime(item.occurredAt) + "</span>" +
        "</button>"
      );
    }).join("");

    Array.prototype.forEach.call(state.el.list.querySelectorAll(".event-card"), function bind(btn) {
      btn.addEventListener("click", function onClick() {
        var idx = Number(btn.getAttribute("data-idx"));
        state.selectedIndex = Number.isFinite(idx) ? idx : -1;
        updateHistoryCardSelection(state);
        renderDetailPopover(state, state.items[state.selectedIndex] || null);
      });
    });
    updateHistoryCardSelection(state);
  }

  function renderPhotoSettings(state, message) {
    var cfg = getVisualSettings();
    state.el.profile.value = cfg.profileKey;
    state.el.quality.value = String(cfg.qualityPct);
    state.el.resolution.value = String(cfg.resolutionMaxPx);
    state.el.photoCurrent.textContent =
      "Actual: " + profileToLabel(cfg.profileKey) +
      " | Calidad " + cfg.qualityPct + "%" +
      " | Resolucion " + cfg.resolutionMaxPx + " px";

    var lines = [];
    if (cfg.updatedAt) lines.push("Guardado: " + formatDate(cfg.updatedAt));
    if (cfg.recompressAllAt) lines.push("Recompresion pedida: " + formatDate(cfg.recompressAllAt));
    state.el.photoMeta.textContent = lines.join(" | ") || "Sin cambios recientes.";
    if (message) state.el.photoStatus.textContent = message;
  }

  function renderDatabaseSummary(state, payload) {
    var total = payload && Number.isFinite(payload.total) ? payload.total : 0;
    var cloud = payload && payload.cloudReady ? "lista" : "pendiente";
    var network = isOnline() ? "online" : "offline";
    state.el.dbCount.textContent = "Productos en nube: " + total;
    state.el.dbStatus.textContent = "Nube: " + cloud + " | red: " + network;
  }

  function renderSyncResumen(state, message) {
    var syncData = null;
    if (state.syncManager && typeof state.syncManager.getEstado === "function") {
      syncData = state.syncManager.getEstado();
    } else if (globalScope.Fase8SyncEstado && typeof globalScope.Fase8SyncEstado.readState === "function") {
      syncData = globalScope.Fase8SyncEstado.readState();
    }

    if (!syncData) {
      state.el.syncResumen.textContent = buildSyncSummary(null);
      if (message) state.el.syncStatus.textContent = message;
      return;
    }

    state.el.syncResumen.textContent = buildSyncSummary(syncData);
    if (message) state.el.syncStatus.textContent = message;
  }

  function renderBackupList(state, items) {
    var safeItems = Array.isArray(items) ? items : [];
    if (!safeItems.length) {
      state.el.backupList.innerHTML = "<p class=\"empty\">No hay copias guardadas.</p>";
      return;
    }

    state.el.backupList.innerHTML = safeItems.map(function each(item, index) {
      var updatedRaw = String(item && item.updated || "").trim();
      var updatedLabel = updatedRaw ? formatDateTime(updatedRaw) : "Fecha sin leer";
      return (
        "<div class=\"event-card backup-card\">" +
          "<div class=\"backup-copy\">" +
            "<span class=\"event-type\">Copia " + (index + 1) + "</span>" +
            "<strong class=\"event-name\">" + escapeHtml(updatedLabel) + "</strong>" +
            "<span class=\"event-date\">Vuelve a ese momento.</span>" +
          "</div>" +
          "<div class=\"toolbar\"><button type=\"button\" class=\"ok js-restore-backup\" data-path=\"" + escapeHtml(String(item.fullPath || "")) + "\" data-updated=\"" + escapeHtml(updatedRaw) + "\">Restaurar</button></div>" +
        "</div>"
      );
    }).join("");

    Array.prototype.forEach.call(state.el.backupList.querySelectorAll(".js-restore-backup"), function bind(btn) {
      btn.addEventListener("click", function onClick() {
        restoreBackup(state, btn.getAttribute("data-path"), btn.getAttribute("data-updated"));
      });
    });
  }

  function renderBackupEmpty(state, message) {
    state.el.backupList.innerHTML = "<p class=\"empty\">" + escapeHtml(message || "No hay copias guardadas.") + "</p>";
  }

  function getFase11Store() {
    if (!globalScope.Fase11DiagnosticoStore || typeof globalScope.Fase11DiagnosticoStore.getDefaultStore !== "function") {
      return null;
    }
    return globalScope.Fase11DiagnosticoStore.getDefaultStore();
  }

  function renderFase11Estado(state, rows) {
    if (!state.el.fase11EstadoSistema) return;
    var safeRows = Array.isArray(rows) ? rows : [];
    if (!safeRows.length) {
      state.el.fase11EstadoSistema.innerHTML = "<tr><td colspan=\"3\" class=\"empty\">Sin estado disponible.</td></tr>";
      return;
    }
    state.el.fase11EstadoSistema.innerHTML = safeRows.map(function row(item) {
      return (
        "<tr>" +
          "<td>" + escapeHtml(item.component) + "</td>" +
          "<td><span class=\"fase11-status\">" + escapeHtml(item.status) + "</span></td>" +
          "<td>" + escapeHtml(item.detail) + "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderFase11Diagnostico(state) {
    if (!state.el.fase11Eventos) return;
    var store = getFase11Store();
    var snapshot = store && typeof store.snapshot === "function" ? store.snapshot() : null;
    var events = snapshot && Array.isArray(snapshot.events) ? snapshot.events : [];
    if (!events.length) {
      state.el.fase11Eventos.innerHTML = "<p class=\"empty\">Sin eventos del caso actual.</p>";
      return;
    }
    var formatter = globalScope.Fase11DiagnosticoFormatter;
    state.el.fase11Eventos.innerHTML = events.map(function each(event) {
      var text = formatter && typeof formatter.formatEvent === "function"
        ? formatter.formatEvent(event)
        : String(event.message || "Evento tecnico");
      return "<p class=\"fase11-event\">" + escapeHtml(text) + "</p>";
    }).join("");
  }

  function buildFase11Deps(state) {
    return {
      globalScope: globalScope,
      firebaseRuntime: getFirebaseRuntime(),
      syncManager: state.syncManager,
      store: getFase11Store(),
      sessionToken: readSessionToken()
    };
  }

  function refreshFase11Estado(state, message) {
    if (!globalScope.Fase11DiagnosticoEstado || typeof globalScope.Fase11DiagnosticoEstado.leerEstadoSistema !== "function") {
      if (state.el.fase11EstadoStatus) state.el.fase11EstadoStatus.textContent = "Diagnostico no cargado.";
      return;
    }
    renderFase11Estado(state, globalScope.Fase11DiagnosticoEstado.leerEstadoSistema(buildFase11Deps(state)));
    renderFase11Diagnostico(state);
    if (state.el.fase11EstadoStatus) state.el.fase11EstadoStatus.textContent = message || "Estado actualizado.";
  }

  async function runFase11Test(state, type) {
    if (!globalScope.Fase11DiagnosticoPruebas) {
      state.el.fase11TestStatus.textContent = "Pruebas no cargadas.";
      return;
    }
    var api = globalScope.Fase11DiagnosticoPruebas;
    var fn = type === "ia" ? api.probarIa :
      type === "vision" ? api.probarVision :
      type === "sync" ? api.probarSync :
      api.probarBackend;
    if (typeof fn !== "function") return;
    if (type === "sync" && !state.syncManager) getSyncManager(state);
    state.el.fase11TestStatus.textContent = "Probando...";
    var out = await fn(buildFase11Deps(state));
    renderFase11Diagnostico(state);
    refreshFase11Estado(state, "Estado actualizado tras prueba.");
    state.el.fase11TestStatus.textContent =
      (out && out.ok ? "Prueba completada." : "Prueba con aviso.") +
      (out && out.duration ? " Tiempo: " + out.duration + "." : "");
  }

  async function copyFase11Diagnostico(state) {
    var store = getFase11Store();
    if (!store || typeof store.buildCopyText !== "function") {
      state.el.fase11CopyStatus.textContent = "No hay diagnostico disponible.";
      return;
    }
    var text = store.buildCopyText();
    try {
      if (globalScope.navigator && globalScope.navigator.clipboard && typeof globalScope.navigator.clipboard.writeText === "function") {
        await globalScope.navigator.clipboard.writeText(text);
        state.el.fase11CopyStatus.textContent = "Diagnostico copiado.";
        return;
      }
    } catch (errClipboard) {
      // No-op.
    }
    state.el.fase11CopyStatus.textContent = "Diagnostico preparado para copiar.";
  }

  function clearFase11Diagnostico(state) {
    var store = getFase11Store();
    if (store && typeof store.clear === "function") store.clear();
    renderFase11Diagnostico(state);
    if (state.el.fase11CopyStatus) state.el.fase11CopyStatus.textContent = "Registro limpio.";
  }

  async function loadDatabaseSummary(state) {
    var resolved = resolveRemoteIndex();
    if (!resolved.ok) {
      renderDatabaseSummary(state, { total: 0, cloudReady: false });
      state.el.dbStatus.textContent = resolved.message;
      return;
    }

    state.el.dbStatus.textContent = "Cargando base...";
    var out = await resolved.remoteIndex.listProductRecords({ maxItems: 5000, sessionToken: readSessionToken() || null });
    if (!out || out.ok !== true) {
      renderDatabaseSummary(state, { total: 0, cloudReady: true });
      state.el.dbStatus.textContent = out && out.message ? out.message : "No se pudo leer la base.";
      return;
    }

    renderDatabaseSummary(state, {
      total: Array.isArray(out.items) ? out.items.length : 0,
      cloudReady: true
    });
  }

  async function loadHistory(state) {
    var localProductItems = readLocalProductHistory();
    var localImportItems = readLocalImportHistory();
    var localItems = mergeHistorySources([], localProductItems, localImportItems);
    var resolved = resolveRemoteIndex();
    if (!resolved.ok) {
      state.el.historyStatus.textContent = localItems.length ? "Historial local cargado." : resolved.message;
      state.items = localItems;
      renderHistoryList(state);
      return;
    }

    state.el.historyStatus.textContent = "Cargando historial...";
    var out = await resolved.remoteIndex.listHistoryEvents({ sessionToken: readSessionToken() || null });
    if (!out || out.ok !== true) {
      var fallbackItems = mergeHistorySources([], localProductItems, localImportItems);
      state.el.historyStatus.textContent = fallbackItems.length
        ? "Historial local cargado."
        : (out && out.message ? out.message : "No se pudo cargar el historial.");
      state.items = fallbackItems;
      renderHistoryList(state);
      return;
    }

    var remoteItems = Array.isArray(out.items) ? out.items : [];
    state.items = mergeHistorySources(remoteItems, localProductItems, localImportItems);
    renderHistoryList(state);
    var repairOut = await repairRemoteHistory(state, resolved.remoteIndex, remoteItems, localItems);
    if (repairOut && repairOut.repaired > 0) {
      var refreshed = await resolved.remoteIndex.listHistoryEvents({ sessionToken: readSessionToken() || null });
      if (refreshed && refreshed.ok === true) {
        state.items = mergeHistorySources(Array.isArray(refreshed.items) ? refreshed.items : [], localProductItems, localImportItems);
        renderHistoryList(state);
      }
      state.el.historyStatus.textContent = "Historial compartido actualizado.";
      return;
    }

    state.el.historyStatus.textContent = "Historial cargado.";
  }

  function emitVisualSettingsChanged(detail) {
    try {
      globalScope.dispatchEvent(new CustomEvent("appv2-visual-settings-updated", { detail: detail || {} }));
    } catch (err) {
      // No-op.
    }
  }

  function collectVisualSettingsFromForm(state) {
    return {
      profileKey: String(state.el.profile.value || DEFAULT_VISUAL_SETTINGS.profileKey),
      qualityPct: Number(state.el.quality.value || DEFAULT_VISUAL_SETTINGS.qualityPct),
      resolutionMaxPx: Number(state.el.resolution.value || DEFAULT_VISUAL_SETTINGS.resolutionMaxPx)
    };
  }

  function savePhotoSettings(state, recompressAll) {
    var current = getVisualSettings();
    var next = collectVisualSettingsFromForm(state);
    next.updatedAt = new Date().toISOString();
    next.recompressAllAt = recompressAll ? next.updatedAt : current.recompressAllAt || null;
    saveStoredVisualSettings(next);
    emitVisualSettingsChanged(next);
    renderPhotoSettings(
      state,
      recompressAll
        ? "Ajustes guardados. La recompresion queda marcada para toda la app."
        : "Ajustes guardados."
    );
  }

  function goBack() {
    try {
      var params = new URLSearchParams(globalScope.location && globalScope.location.search || "");
      var returnTo = String(params.get("returnTo") || "").trim();
      if (returnTo) {
        globalScope.location.href = returnTo;
        return;
      }
    } catch (errParams) {
      // No-op.
    }
    if (globalScope.history && globalScope.history.length > 1) {
      globalScope.history.back();
      return;
    }
    globalScope.location.href = "./gestion_registros.html";
  }

  function openExportExcel() {
    globalScope.location.href = "./exportar_excel.html";
  }

  function openImportExcel() {
    globalScope.location.href = "./importar_excel.html";
  }

  function getOrCreateStore(state) {
    if (state.store) return state.store;
    if (globalScope.Fase3SharedBrowserStore && typeof globalScope.Fase3SharedBrowserStore.createSharedProductStore === "function") {
      state.store = globalScope.Fase3SharedBrowserStore.createSharedProductStore();
      return state.store;
    }
    if (!globalScope.Fase3DataStoreLocal || typeof globalScope.Fase3DataStoreLocal.createMemoryProductStore !== "function") {
      return null;
    }
    state.store = globalScope.Fase3DataStoreLocal.createMemoryProductStore();
    return state.store;
  }

  async function loadProductsIntoStore(state) {
    var store = getOrCreateStore(state);
    if (!store) {
      return {
        ok: false,
        errorCode: "SYNC_STORE_NO_CARGADO",
        message: "No se pudo preparar store local para backup."
      };
    }

    var resolved = resolveRemoteIndex();
    if (!resolved.ok) return resolved;

    var out = await resolved.remoteIndex.listProductRecords({
      maxItems: 5000,
      sessionToken: readSessionToken() || null
    });
    if (!out || out.ok !== true) {
      return {
        ok: false,
        errorCode: out && out.errorCode ? out.errorCode : "SYNC_CARGA_BASE_FAILED",
        message: out && out.message ? out.message : "No se pudo cargar productos para backup."
      };
    }
    store.replaceAllProducts(Array.isArray(out.items) ? out.items : []);
    if (typeof store.replaceRevisionDrafts === "function") {
      store.replaceRevisionDrafts([]);
    }
    return { ok: true };
  }

  function getSyncManager(state) {
    if (state.syncManager) return state.syncManager;
    if (!globalScope.Fase8SyncManager || typeof globalScope.Fase8SyncManager.createSyncManager !== "function") {
      return null;
    }

    var store = getOrCreateStore(state);
    if (!store) return null;

    state.syncManager = globalScope.Fase8SyncManager.createSyncManager({
      store: store,
      getRemoteIndex: resolveRemoteIndex,
      tokenValidator: function tokenValidator(token) {
        return String(token || "").trim().length > 0;
      },
      onRemoteApplied: function onRemoteApplied() {
        renderSyncResumen(state, "Cambios remotos aplicados.");
      }
    });
    return state.syncManager;
  }

  function getBackupController(state) {
    var ownerKey = readBackupOwnerKey();
    if (state.backupController && state.backupControllerOwnerKey === ownerKey) return state.backupController;
    if (!globalScope.Fase8SyncBackup || typeof globalScope.Fase8SyncBackup.createSyncBackup !== "function") return null;
    var runtime = getFirebaseRuntime();
    if (!runtime || runtime.ok !== true || (!runtime.storageModule && !runtime.firestoreModule)) return null;
    var syncManager = getSyncManager(state);
    state.backupController = globalScope.Fase8SyncBackup.createSyncBackup({
      storageModule: runtime.storageModule,
      firestoreModule: runtime.firestoreModule,
      firebaseApp: runtime.app,
      rootPath: "fase8_backups",
      userId: ownerKey,
      modeApi: syncManager,
      ensureAuth: typeof runtime.waitForAuth === "function"
        ? function ensureAuth(token) { return runtime.waitForAuth(token || null); }
        : null
    });
    state.backupControllerOwnerKey = ownerKey;
    return state.backupController;
  }

  async function replaceCloudProductsWithStore(state, records, token) {
    var resolved = resolveRemoteIndex();
    if (!resolved.ok) return resolved;
    var remoteIndex = resolved.remoteIndex || null;
    if (!remoteIndex || typeof remoteIndex.upsertProductRecordsBatch !== "function" || typeof remoteIndex.listProductRecords !== "function") {
      return {
        ok: false,
        errorCode: "SYNC_RESTORE_REMOTE_NO_DISPONIBLE",
        message: "La nube no esta disponible ahora."
      };
    }

    var remoteListed = await remoteIndex.listProductRecords({
      maxItems: 5000,
      sessionToken: token
    });
    if (!remoteListed || remoteListed.ok !== true) {
      return {
        ok: false,
        errorCode: (remoteListed && remoteListed.errorCode) || "SYNC_RESTORE_REMOTE_LIST_FAILED",
        message: "No se pudo leer la base actual antes de restaurar."
      };
    }

    var pushed = await remoteIndex.upsertProductRecordsBatch({
      products: records,
      chunkSize: 300,
      sessionToken: token
    });
    if (!pushed || pushed.ok !== true) {
      return {
        ok: false,
        errorCode: (pushed && pushed.errorCode) || "SYNC_RESTORE_REMOTE_UPSERT_FAILED",
        message: "No se pudo actualizar la nube con la copia elegida."
      };
    }

    if (typeof remoteIndex.deleteProductRecord !== "function") {
      return {
        ok: false,
        errorCode: "SYNC_RESTORE_REMOTE_DELETE_NO_DISPONIBLE",
        message: "La nube no permite limpiar los productos sobrantes."
      };
    }

    var keepMap = Object.create(null);
    records.forEach(function each(record) {
      var id = String(record && record.id || "").trim();
      if (id) keepMap[id] = true;
    });
    var remoteItems = Array.isArray(remoteListed.items) ? remoteListed.items : [];
    var staleIds = remoteItems
      .map(function mapId(item) { return String(item && item.id || "").trim(); })
      .filter(function filterId(id) { return !!id && !keepMap[id]; });

    for (var start = 0; start < staleIds.length; start += 25) {
      var chunk = staleIds.slice(start, start + 25);
      for (var i = 0; i < chunk.length; i += 1) {
        var deleted = await remoteIndex.deleteProductRecord({
          productId: chunk[i],
          sessionToken: token
        });
        if (!deleted || deleted.ok !== true) {
          return {
            ok: false,
            errorCode: (deleted && deleted.errorCode) || "SYNC_RESTORE_REMOTE_DELETE_FAILED",
            message: "La copia subio, pero no se pudo limpiar la base actual completa."
          };
        }
      }
    }

    return {
      ok: true,
      removed: staleIds.length
    };
  }

  async function runSyncNow(state) {
    var manager = getSyncManager(state);
    if (!manager) {
      renderSyncResumen(state, "La sincronizacion no esta disponible ahora.");
      return;
    }
    var token = readSessionToken();
    if (!token) {
      renderSyncResumen(state, "Hace falta iniciar sesion otra vez.");
      return;
    }

    state.el.syncStatus.textContent = "Guardando cambios...";
    var out = await manager.iniciarSync(token);
    if (!out || out.ok !== true) {
      renderSyncResumen(state, "No se pudieron guardar los cambios ahora.");
      return;
    }
    renderSyncResumen(state, "Cambios guardados.");
    loadDatabaseSummary(state);
    loadHistory(state);
  }

  async function loadBackups(state) {
    var controller = getBackupController(state);
    if (!controller || controller.ok !== true) {
      state.el.syncStatus.textContent = "Las copias no estan disponibles ahora.";
      renderBackupEmpty(state, "Las copias no estan disponibles ahora.");
      return;
    }
    var token = readSessionToken();
    if (!token) {
      state.el.syncStatus.textContent = "Hace falta iniciar sesion para ver las copias.";
      renderBackupEmpty(state, "Hace falta iniciar sesion para consultar las copias.");
      return;
    }
    state.el.syncStatus.textContent = "Buscando copias...";
    var listed = null;
    try {
      listed = await runWithTimeout(
        controller.listarBackups(token, getOrCreateStore(state)),
        BACKUP_LIST_TIMEOUT_MS,
        "La consulta de copias tardo demasiado."
      );
    } catch (errBackups) {
      listed = {
        ok: false,
        message: toUserBackupMessage(errBackups && errBackups.message, "No se pudieron consultar las copias ahora.")
      };
    }
    if (!listed || listed.ok !== true) {
      var failedMessage = toUserBackupMessage(
        listed && listed.message,
        "No se pudieron consultar las copias ahora."
      );
      state.el.syncStatus.textContent = failedMessage;
      renderBackupEmpty(state, failedMessage);
      return;
    }
    renderBackupList(state, listed.items || []);
    state.el.syncStatus.textContent = (listed.items || []).length
      ? "Elige una copia."
      : "No hay copias guardadas.";
  }

  async function restoreBackup(state, path, updatedAt) {
    var fullPath = String(path || "").trim();
    if (!fullPath) return;
    var restoreDate = updatedAt ? formatDate(updatedAt) : "fecha desconocida";
    if (!globalScope.confirm("Se va a eliminar la base de datos actual y recuperar una anterior con fecha " + restoreDate + ". Continuar?")) return;

    var controller = getBackupController(state);
    if (!controller || controller.ok !== true) {
      state.el.syncStatus.textContent = "Las copias no estan disponibles ahora.";
      return;
    }
    var token = readSessionToken();
    if (!token) {
      state.el.syncStatus.textContent = "Hace falta iniciar sesion para restaurar.";
      return;
    }

    var store = getOrCreateStore(state);
    if (!store) {
      state.el.syncStatus.textContent = "No se pudo preparar la restauracion.";
      return;
    }

    state.el.syncStatus.textContent = "Restaurando copia...";
    var restored = await controller.restaurarBackup(token, fullPath, store);
    if (!restored || restored.ok !== true) {
      state.el.syncStatus.textContent = toUserBackupMessage(
        restored && restored.message,
        "No se pudo restaurar la copia."
      );
      return;
    }

    var records = typeof store.list === "function" ? store.list() : [];
    var replaced = await replaceCloudProductsWithStore(state, records, token);
    if (!replaced || replaced.ok !== true) {
      state.el.syncStatus.textContent = "Copia restaurada. Falta terminar de guardarla en la nube.";
      renderSyncResumen(state, "Queda un paso pendiente.");
      return;
    }

    state.el.syncStatus.textContent = "Restauracion completada.";
    await runSyncNow(state);
  }

  function wireEvents(state) {
    state.el.back.addEventListener("click", function onBack() {
      hideDetailPopover(state);
      goBack();
    });

    state.el.reloadHistory.addEventListener("click", function onReloadHistory() {
      hideDetailPopover(state);
      loadHistory(state);
    });

    state.el.reloadDatabase.addEventListener("click", function onReloadDatabase() {
      loadDatabaseSummary(state);
    });

    state.el.exportDatabase.addEventListener("click", function onExportDatabase() {
      openExportExcel();
    });

    state.el.importDatabase.addEventListener("click", function onImportDatabase() {
      openImportExcel();
    });

    state.el.savePhoto.addEventListener("click", function onSavePhoto() {
      savePhotoSettings(state, false);
    });

    state.el.recompressAll.addEventListener("click", function onRecompress() {
      savePhotoSettings(state, true);
    });

    if (state.el.allergenDisplayToggle) {
      state.el.allergenDisplayToggle.addEventListener("change", function onToggleAllergenDisplay() {
        saveAllergenDisplayMode(state.el.allergenDisplayToggle.checked ? "iconos" : "texto");
        renderAllergenDisplaySettings(state, "Guardado.");
      });
    }

    state.el.backupReload.addEventListener("click", function onBackupReload() {
      loadBackups(state);
    });

    if (state.el.fase11Refresh) {
      state.el.fase11Refresh.addEventListener("click", function onFase11Refresh() {
        refreshFase11Estado(state, "Estado refrescado.");
      });
    }
    if (state.el.fase11Copy) {
      state.el.fase11Copy.addEventListener("click", function onFase11Copy() {
        copyFase11Diagnostico(state);
      });
    }
    if (state.el.fase11Clear) {
      state.el.fase11Clear.addEventListener("click", function onFase11Clear() {
        clearFase11Diagnostico(state);
      });
    }
    if (state.el.fase11TestBackend) {
      state.el.fase11TestBackend.addEventListener("click", function onFase11Backend() {
        runFase11Test(state, "backend");
      });
      state.el.fase11TestIa.addEventListener("click", function onFase11Ia() {
        runFase11Test(state, "ia");
      });
      state.el.fase11TestVision.addEventListener("click", function onFase11Vision() {
        runFase11Test(state, "vision");
      });
      state.el.fase11TestSync.addEventListener("click", function onFase11Sync() {
        runFase11Test(state, "sync");
      });
    }

    globalScope.addEventListener("fase3-firebase-ready", function onReady() {
      loadDatabaseSummary(state);
      loadHistory(state);
      renderSyncResumen(state, "Consulta tus copias.");
      refreshFase11Estado(state, "Firebase listo.");
    });
    globalScope.addEventListener("pageshow", function onPageShow() {
      loadDatabaseSummary(state);
      loadHistory(state);
      renderSyncResumen(state, "Consulta tus copias.");
      refreshFase11Estado(state, "Vista actualizada.");
    });

    globalScope.addEventListener("online", function onOnline() {
      loadDatabaseSummary(state);
      renderSyncResumen(state, "Conexion recuperada.");
      refreshFase11Estado(state, "Conexion recuperada.");
    });

    globalScope.document.addEventListener("click", function onDocumentClick(event) {
      if (!state.el.detailPopover || state.el.detailPopover.classList.contains("is-hidden")) return;
      var target = event && event.target ? event.target : null;
      if (target && target.closest) {
        if (target.closest("#historial-list .event-card")) return;
        if (target.closest("#historial-detail-popover")) return;
      }
      hideDetailPopover(state);
    });
  }

  function init() {
    var state = {
      items: [],
      selectedIndex: -1,
      detailHideTimer: 0,
      historyRepairBusy: false,
      store: null,
      syncManager: null,
      backupController: null,
      el: {
        back: byId("ajustes-back"),
        dbCount: byId("db-count"),
        dbStatus: byId("db-status"),
        reloadDatabase: byId("db-reload"),
        exportDatabase: byId("db-export"),
        importDatabase: byId("db-import"),
        profile: byId("photo-profile"),
        quality: byId("photo-quality"),
        resolution: byId("photo-resolution"),
        savePhoto: byId("photo-save"),
        recompressAll: byId("photo-recompress-all"),
        photoCurrent: byId("photo-current"),
        photoMeta: byId("photo-meta"),
        photoStatus: byId("photo-status"),
        allergenDisplayToggle: byId("allergen-display-toggle"),
        allergenDisplayStatus: byId("allergen-display-status"),
        count: byId("historial-count"),
        historyStatus: byId("historial-status"),
        list: byId("historial-list"),
        detailPopover: byId("historial-detail-popover"),
        reloadHistory: byId("historial-reload"),
        syncResumen: byId("sync-resumen"),
        syncStatus: byId("sync-status"),
        backupReload: byId("backup-reload"),
        backupList: byId("backup-list"),
        fase11EstadoSistema: byId("fase11-estado-sistema"),
        fase11EstadoStatus: byId("fase11-estado-status"),
        fase11Refresh: byId("fase11-refresh"),
        fase11Eventos: byId("fase11-diagnostico-eventos"),
        fase11Copy: byId("fase11-copy"),
        fase11Clear: byId("fase11-clear"),
        fase11CopyStatus: byId("fase11-copy-status"),
        fase11TestBackend: byId("fase11-test-backend"),
        fase11TestIa: byId("fase11-test-ia"),
        fase11TestVision: byId("fase11-test-vision"),
        fase11TestSync: byId("fase11-test-sync"),
        fase11TestStatus: byId("fase11-test-status")
      }
    };

    wireEvents(state);
    renderDatabaseSummary(state, { total: 0, cloudReady: false });
    renderPhotoSettings(state, null);
    renderAllergenDisplaySettings(state, null);
    renderHistoryList(state);
    renderSyncResumen(state, "Consulta tus copias.");
    renderBackupList(state, []);
    refreshFase11Estado(state, "Listo.");
    loadDatabaseSummary(state);
    loadHistory(state);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
    return;
  }
  init();
})(typeof globalThis !== "undefined" ? globalThis : this);

