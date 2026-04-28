(function initOperativaGestionRegistrosModule(globalScope) {
  "use strict";

  var MODULE_NAME = "Operativa_Gestion_Registros";
  var allergenCatalog = null;

  if (typeof module !== "undefined" && module.exports) {
    try {
      allergenCatalog = require("../../shared/alergenos_oficiales.js");
    } catch (errRequire) {
      allergenCatalog = null;
    }
  }
  if (!allergenCatalog && globalScope && globalScope.AppV2AlergenosOficiales) {
    allergenCatalog = globalScope.AppV2AlergenosOficiales;
  }

  function elapsedSince(startMs) {
    return Math.max(0, Date.now() - startMs);
  }

  function buildError(startMs, code, message, retryable, action) {
    return {
      ok: false,
      resultado: {
        estadoPasaporteModulo: "ROJO",
        modulo: MODULE_NAME,
        accionSugeridaParaCerebro: action || "abrir_revision",
        elapsedMs: elapsedSince(startMs),
        datos: {}
      },
      error: {
        code: code,
        origin: MODULE_NAME,
        passport: "ROJO",
        message: message,
        retryable: !!retryable
      }
    };
  }

  function validarStore(store) {
    return !!(
      store &&
      typeof store.updateProductById === "function" &&
      typeof store.hardDeleteProductById === "function" &&
      typeof store.softDeleteProductById === "function" &&
      typeof store.listProductsForUi === "function" &&
      typeof store.listPendingUploadProducts === "function"
    );
  }

  function isLocalOnlyPendingRecord(record) {
    var sistema = record && record.sistema ? record.sistema : {};
    var syncState = String(sistema.syncState || "").trim().toUpperCase();
    return !!(
      record &&
      sistema.dirty === true &&
      syncState === "LOCAL_ONLY" &&
      !sistema.lastSyncedAt
    );
  }

  function normalizeName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeFormat(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/,/g, ".")
      .replace(/\s+/g, " ")
      .trim();
  }

  function combineNameAndFormat(nombre, formato) {
    var safeName = String(nombre || "").trim();
    var safeFormat = String(formato || "").trim();
    if (!safeFormat) return safeName;
    if (normalizeName(safeName).indexOf(normalizeName(safeFormat)) >= 0) return safeName;
    return String(safeName + " " + safeFormat).trim();
  }

  function normalizeAllergenList(input) {
    if (allergenCatalog && typeof allergenCatalog.normalizeAllergenList === "function") {
      return allergenCatalog.normalizeAllergenList(input);
    }
    var safeInput = Array.isArray(input) ? input : [];
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < safeInput.length; i += 1) {
      var allergen = String(safeInput[i] || "").trim().toLowerCase();
      if (!allergen || seen[allergen]) continue;
      seen[allergen] = true;
      out.push(allergen);
    }
    return out.sort();
  }

  function compareProductsByName(left, right) {
    var nameA = left && left.identidad ? String(left.identidad.nombreNormalizado || left.identidad.nombre || "") : "";
    var nameB = right && right.identidad ? String(right.identidad.nombreNormalizado || right.identidad.nombre || "") : "";
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    var idA = left ? String(left.id || "") : "";
    var idB = right ? String(right.id || "") : "";
    if (idA < idB) return -1;
    if (idA > idB) return 1;
    return 0;
  }

  function matchesSearch(record, rawSearchText) {
    var searchText = normalizeName(rawSearchText);
    if (!searchText) return true;
    var nombre = record && record.identidad
      ? String(record.identidad.nombreNormalizado || record.identidad.nombre || "")
      : "";
    var formato = record && record.comercial
      ? String(record.comercial.formatoNormalizado || record.comercial.formato || "")
      : "";
    return normalizeName(nombre + " " + formato).indexOf(searchText) >= 0;
  }

  function toHumanAllergenName(allergenId) {
    var safe = String(allergenId || "").trim().toLowerCase();
    if (!safe) return "";
    var labels = {
      altramuces: "Altramuces",
      apio: "Apio",
      cacahuetes: "Cacahuetes",
      crustaceos: "Crustáceos",
      frutos_secos: "Frutos secos",
      gluten: "Gluten",
      huevos: "Huevos",
      lacteos: "Lácteos",
      moluscos: "Moluscos",
      mostaza: "Mostaza",
      pescado: "Pescado",
      sesamo: "Sésamo",
      soja: "Soja",
      sulfitos: "Sulfitos"
    };
    if (labels[safe]) return labels[safe];
    var fallback = safe.replace(/_/g, " ");
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }

  function formatUiDate(rawIso) {
    var safe = String(rawIso || "").trim();
    var parsed = safe ? new Date(safe) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return "Actualizado --/--/----";
    var day = String(parsed.getDate()).padStart(2, "0");
    var month = String(parsed.getMonth() + 1).padStart(2, "0");
    var year = String(parsed.getFullYear());
    return "Actualizado " + day + "/" + month + "/" + year;
  }

  function formatStatusBadge(record) {
    var status = record && record.sistema
      ? String(record.sistema.estadoRegistro || "ACTIVO").trim().toUpperCase()
      : "ACTIVO";
    if (status === "ACTIVO") return "Activo";
    if (status === "BORRADO_SUAVE") return "Borrado";
    return status.replace(/_/g, " ");
  }

  function formatSyncText(record) {
    var sistema = record && record.sistema ? record.sistema : {};
    var syncState = String(sistema.syncState || "").trim().toUpperCase();
    if (sistema.dirty === true) return "Pendiente de subida";
    if (syncState === "SYNCED" || sistema.lastSyncedAt) return "Sincronizado";
    if (syncState === "CONFLICT") return "Conflicto pendiente";
    if (syncState === "REMOTE_ONLY") return "Disponible en nube";
    return "Guardado en este dispositivo";
  }

  function buildAllergenSummary(record) {
    var alergenos = normalizeAllergenList(record && record.alergenos);
    if (!alergenos.length) return "Sin alérgenos";
    return alergenos.map(toHumanAllergenName).join(", ");
  }

  function isUsableVisualUrl(value) {
    var safe = String(value || "").trim();
    return /^https?:\/\//i.test(safe) || /^data:image\//i.test(safe);
  }

  function resolveVisualUrls(record, visualOverride) {
    var candidate = visualOverride;
    if (!candidate && record && record.visual && Array.isArray(record.visual.visuales) && record.visual.visuales.length) {
      candidate = {
        thumbUrl: record.visual.visuales[0].thumbSrc || record.visual.visuales[0].viewerSrc || "",
        viewerUrl: record.visual.visuales[0].viewerSrc || record.visual.visuales[0].thumbSrc || ""
      };
    }
    if (!candidate && record && record.visual && Array.isArray(record.visual.fotoRefs) && record.visual.fotoRefs.length) {
      var firstRef = String(record.visual.fotoRefs[0] || "").trim();
      if (isUsableVisualUrl(firstRef)) {
        candidate = {
          thumbUrl: firstRef,
          viewerUrl: firstRef
        };
      }
    }
    return {
      thumbUrl: candidate && candidate.thumbUrl ? String(candidate.thumbUrl).trim() : "",
      viewerUrl: candidate && candidate.viewerUrl ? String(candidate.viewerUrl).trim() : ""
    };
  }

  function createListEnvelope(startedAt, actionName, payload, products, totals) {
    var safePayload = payload || {};
    var safeProducts = Array.isArray(products) ? products : [];
    var safeTotals = totals || {};
    var total = Number(safeTotals.total) || safeProducts.length;
    var offset = Math.max(0, Number(safePayload.offset) || 0);
    var limit = Math.max(1, Math.min(500, Number(safePayload.limit) || 60));
    return {
      ok: true,
      resultado: {
        estadoPasaporteModulo: "VERDE",
        modulo: MODULE_NAME,
        accionEjecutada: actionName,
        elapsedMs: elapsedSince(startedAt),
        datos: {
          soloPendientes: !!safePayload.soloPendientes,
          sinActivo: !!safePayload.sinActivo,
          selectedAllergenIds: normalizeAllergenList(safePayload.selectedAllergenIds),
          total: total,
          totalActivos: Number(safeTotals.totalActivos) || 0,
          visible: safeProducts.length,
          hasMore: offset + safeProducts.length < total,
          offset: offset,
          limit: limit,
          searchText: String(safePayload.searchText || "").trim(),
          pendientesCount: Number(safeTotals.pendientesCount) || 0,
          productos: safeProducts
        }
      },
      error: null
    };
  }

  function getBaseProducts(store) {
    if (store && typeof store.listProductsForUi === "function") {
      return store.listProductsForUi({ onlyPending: false, includeDeleted: false });
    }
    if (store && typeof store.queryProductsForUi === "function") {
      return store.queryProductsForUi({
        onlyPending: false,
        includeDeleted: false,
        searchText: "",
        offset: 0,
        limit: 5000
      }).items || [];
    }
    return [];
  }

  function matchesAllergenFilters(record, selectedAllergenIds, sinActivo) {
    var selected = normalizeAllergenList(selectedAllergenIds);
    var current = normalizeAllergenList(record && record.alergenos);
    if (!selected.length) {
      return true;
    }
    if (sinActivo) {
      for (var i = 0; i < selected.length; i += 1) {
        if (current.indexOf(selected[i]) >= 0) return false;
      }
      return true;
    }
    for (var j = 0; j < selected.length; j += 1) {
      if (current.indexOf(selected[j]) >= 0) return true;
    }
    return false;
  }

  function derivarVistaListadoFase9(payload, deps) {
    var startedAt = Date.now();
    var safePayload = payload || {};
    var store = deps && deps.store;
    if (!validarStore(store)) {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_NO_CONFIGURADO",
        "Store de gestion no configurado.",
        false,
        "bloquear_guardado"
      );
    }

    var sourceProducts = Array.isArray(safePayload.productos)
      ? safePayload.productos.slice(0)
      : getBaseProducts(store);
    var selectedAllergenIds = normalizeAllergenList(safePayload.selectedAllergenIds);
    var filtered = [];
    var soloPendientes = !!safePayload.soloPendientes;
    var sinActivo = !!safePayload.sinActivo;
    var offset = Math.max(0, Number(safePayload.offset) || 0);
    var limit = Math.max(1, Math.min(500, Number(safePayload.limit) || 60));

    for (var i = 0; i < sourceProducts.length; i += 1) {
      var record = sourceProducts[i];
      if (!(record && record.sistema)) continue;
      if (String(record.sistema.estadoRegistro || "").toUpperCase() !== "ACTIVO") continue;
      if (soloPendientes && record.sistema.dirty !== true) continue;
      if (!matchesSearch(record, safePayload.searchText)) continue;
      if (!matchesAllergenFilters(record, selectedAllergenIds, sinActivo)) continue;
      filtered.push(record);
    }

    filtered.sort(compareProductsByName);

    var visible = filtered.slice(offset, offset + limit);
    var pendientesCount = typeof store.countPendingUploadProducts === "function"
      ? store.countPendingUploadProducts({ includeDeleted: false })
      : store.listPendingUploadProducts({ includeDeleted: false }).length;
    var totalActivos = typeof store.countActiveProducts === "function"
      ? store.countActiveProducts()
      : getBaseProducts(store).length;

    return createListEnvelope(
      startedAt,
      "derivar_vista_fase9",
      {
        soloPendientes: soloPendientes,
        sinActivo: sinActivo,
        selectedAllergenIds: selectedAllergenIds,
        searchText: safePayload.searchText,
        offset: offset,
        limit: limit
      },
      visible,
      {
        total: filtered.length,
        totalActivos: totalActivos,
        pendientesCount: pendientesCount
      }
    );
  }

  function crearModeloTarjetaProductoFase9(payload) {
    var safePayload = payload || {};
    var product = safePayload.producto || safePayload.product || null;
    if (!product || !product.identidad || !product.sistema) return null;
    var visual = resolveVisualUrls(product, safePayload.visual || null);
    var nombre = String(product.identidad.nombre || "(sin nombre)").trim() || "(sin nombre)";
    var formato = product.comercial ? String(product.comercial.formato || "").trim() : "";
    var formatoNormalizado = product.comercial
      ? String(product.comercial.formatoNormalizado || normalizeFormat(formato)).trim()
      : "";
    var alergenosIds = normalizeAllergenList(product.alergenos);
    return {
      id: String(product.id || "").trim(),
      nombre: nombre,
      nombreVisible: combineNameAndFormat(nombre, formato),
      formato: formato,
      formatoNormalizado: formatoNormalizado,
      tipoFormato: product.comercial ? String(product.comercial.tipoFormato || "desconocido").trim() || "desconocido" : "desconocido",
      estado: formatStatusBadge(product),
      syncText: formatSyncText(product),
      alergenosIds: alergenosIds,
      alergenosCount: alergenosIds.length,
      alergenosTexto: buildAllergenSummary(product),
      actualizadoTexto: formatUiDate(product.sistema.updatedAt || product.sistema.createdAt || ""),
      tieneImagen: !!(visual.thumbUrl || visual.viewerUrl),
      thumbUrl: visual.thumbUrl || "",
      viewerUrl: visual.viewerUrl || visual.thumbUrl || "",
      placeholderTexto: combineNameAndFormat(nombre, formato)
    };
  }

  function delay(ms) {
    var waitMs = Math.max(0, Number(ms) || 0);
    return new Promise(function executor(resolve) {
      setTimeout(resolve, waitMs);
    });
  }

  function editarProducto(payload, deps) {
    var startedAt = Date.now();
    var safePayload = payload || {};
    var store = deps && deps.store;
    if (!validarStore(store)) {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_NO_CONFIGURADO",
        "Store de gestion no configurado.",
        false,
        "bloquear_guardado"
      );
    }

    var output = store.updateProductById({
      productId: safePayload.productId,
      nombre: safePayload.nombre,
      alergenos: safePayload.alergenos
    });
    if (!output || output.ok !== true) {
      return buildError(
        startedAt,
        (output && output.errorCode) || "OPERATIVA_EDICION_FAILED",
        (output && output.message) || "No se pudo editar el producto.",
        false,
        "abrir_revision"
      );
    }

    return {
      ok: true,
      resultado: {
        estadoPasaporteModulo: "VERDE",
        modulo: MODULE_NAME,
        accionEjecutada: "editar_producto",
        elapsedMs: elapsedSince(startedAt),
        datos: {
          producto: output.record
        }
      },
      error: null
    };
  }

  function borrarSuaveProducto(payload, deps) {
    var startedAt = Date.now();
    var safePayload = payload || {};
    var store = deps && deps.store;
    if (!validarStore(store)) {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_NO_CONFIGURADO",
        "Store de gestion no configurado.",
        false,
        "bloquear_guardado"
      );
    }

    var output = store.softDeleteProductById({
      productId: safePayload.productId
    });
    if (!output || output.ok !== true) {
      return buildError(
        startedAt,
        (output && output.errorCode) || "OPERATIVA_BORRADO_SUAVE_FAILED",
        (output && output.message) || "No se pudo borrar suavemente el producto.",
        false,
        "abrir_revision"
      );
    }

    return {
      ok: true,
      resultado: {
        estadoPasaporteModulo: "VERDE",
        modulo: MODULE_NAME,
        accionEjecutada: "borrado_suave_producto",
        elapsedMs: elapsedSince(startedAt),
        datos: {
          producto: output.record
        }
      },
      error: null
    };
  }

  async function borrarProductoReal(payload, deps) {
    var startedAt = Date.now();
    var safePayload = payload || {};
    var store = deps && deps.store;
    var persistencia = deps && deps.persistencia;
    var repository = deps && (deps.productRepository || deps.remoteIndex || deps.repository);

    if (!validarStore(store)) {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_NO_CONFIGURADO",
        "Store de gestion no configurado.",
        false,
        "bloquear_guardado"
      );
    }

    var existing = typeof store.getProductById === "function"
      ? store.getProductById(safePayload.productId)
      : null;

    if (isLocalOnlyPendingRecord(existing)) {
      var localOnlyOut = store.hardDeleteProductById({ productId: safePayload.productId });
      if (!localOnlyOut || localOnlyOut.ok !== true) {
        return buildError(
          startedAt,
          (localOnlyOut && localOnlyOut.errorCode) || "OPERATIVA_BORRADO_LOCAL_FAILED",
          (localOnlyOut && localOnlyOut.message) || "No se pudo quitar el producto de la vista local.",
          false,
          "bloquear_guardado"
        );
      }

      return {
        ok: true,
        resultado: {
          estadoPasaporteModulo: "VERDE",
          modulo: MODULE_NAME,
          accionEjecutada: "borrado_local_producto_pendiente",
          elapsedMs: elapsedSince(startedAt),
          datos: {
            producto: localOnlyOut.record,
            historyEventId: null,
            productId: safePayload.productId,
            localOnly: true
          }
        },
        error: null
      };
    }

    if (!persistencia || typeof persistencia.eliminarProducto !== "function") {
      return buildError(
        startedAt,
        "OPERATIVA_PERSISTENCIA_NO_CONFIGURADA",
        "Falta persistencia oficial para borrar de verdad.",
        false,
        "bloquear_guardado"
      );
    }

    if (!repository || typeof repository.deleteProductRecord !== "function") {
      return buildError(
        startedAt,
        "OPERATIVA_REPOSITORIO_REMOTO_NO_CONFIGURADO",
        "Falta repositorio remoto para borrar de verdad.",
        false,
        "bloquear_guardado"
      );
    }

    var deleted = await persistencia.eliminarProducto(
      {
        productId: safePayload.productId,
        actorId: safePayload.actorId,
        sessionToken: safePayload.sessionToken,
        idempotencyKey: safePayload.idempotencyKey
      },
      {
        productRepository: repository,
        actorId: safePayload.actorId,
        existingRecord: existing
      }
    );

    if (!deleted || deleted.ok !== true) {
      return buildError(
        startedAt,
        (deleted && deleted.errorCode) || "OPERATIVA_BORRADO_REAL_FAILED",
        (deleted && deleted.message) || "No se pudo borrar de verdad el producto.",
        false,
        "bloquear_guardado"
      );
    }

    var localOut = store.hardDeleteProductById({ productId: safePayload.productId });
    if (!localOut || localOut.ok !== true) {
      return buildError(
        startedAt,
        (localOut && localOut.errorCode) || "OPERATIVA_BORRADO_LOCAL_FAILED",
        (localOut && localOut.message) || "No se pudo quitar el producto de la vista local.",
        false,
        "bloquear_guardado"
      );
    }

    return {
      ok: true,
      resultado: {
        estadoPasaporteModulo: "VERDE",
        modulo: MODULE_NAME,
        accionEjecutada: "borrado_real_producto",
        elapsedMs: elapsedSince(startedAt),
        datos: {
          producto: localOut.record,
          historyEventId: deleted.historyEventId || null,
          productId: deleted.productId || safePayload.productId
        }
      },
      error: null
    };
  }

  function listarProductos(payload, deps) {
    var startedAt = Date.now();
    var safePayload = payload || {};
    var store = deps && deps.store;
    if (!validarStore(store)) {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_NO_CONFIGURADO",
        "Store de gestion no configurado.",
        false,
        "bloquear_guardado"
      );
    }

    var derived = derivarVistaListadoFase9(
      {
        soloPendientes: !!safePayload.soloPendientes,
        searchText: safePayload.searchText,
        selectedAllergenIds: [],
        sinActivo: false,
        offset: Math.max(0, Number(safePayload.offset) || 0),
        limit: Math.max(1, Math.min(500, Number(safePayload.limit) || 60))
      },
      { store: store }
    );
    if (!derived || derived.ok !== true) {
      return derived;
    }
    derived.resultado.accionEjecutada = !!safePayload.soloPendientes ? "listar_pendientes" : "listar_todos";
    derived.resultado.elapsedMs = elapsedSince(startedAt);
    return derived;
  }

  function marcarSincronizado(payload, deps) {
    var startedAt = Date.now();
    var safePayload = payload || {};
    var store = deps && deps.store;
    if (!store || typeof store.markProductAsSynced !== "function") {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_NO_CONFIGURADO",
        "Store de gestion no configurado.",
        false,
        "bloquear_guardado"
      );
    }

    var output = store.markProductAsSynced({
      productId: safePayload.productId
    });
    if (!output || output.ok !== true) {
      return buildError(
        startedAt,
        (output && output.errorCode) || "OPERATIVA_MARCAR_SYNC_FAILED",
        (output && output.message) || "No se pudo marcar sincronizado.",
        false,
        "abrir_revision"
      );
    }

    return {
      ok: true,
      resultado: {
        estadoPasaporteModulo: "VERDE",
        modulo: MODULE_NAME,
        accionEjecutada: "marcar_sincronizado",
        elapsedMs: elapsedSince(startedAt),
        datos: {
          producto: output.record
        }
      },
      error: null
    };
  }

  async function sincronizarPendientesRemoto(payload, deps) {
    var startedAt = Date.now();
    var safePayload = payload || {};
    var store = deps && deps.store;
    var remoteIndex = deps && deps.remoteIndex;
    if (!validarStore(store)) {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_NO_CONFIGURADO",
        "Store de gestion no configurado.",
        false,
        "bloquear_guardado"
      );
    }
    if (!remoteIndex || typeof remoteIndex.upsertProductRecord !== "function") {
      return buildError(
        startedAt,
        "OPERATIVA_SYNC_REMOTO_NO_CONFIGURADO",
        "Falta adaptador remoto de productos.",
        false,
        "revisar_pendientes_sync"
      );
    }
    if (typeof store.markProductAsSynced !== "function") {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_SYNC_INCOMPLETO",
        "Store sin soporte de marcado sincronizado.",
        false,
        "bloquear_guardado"
      );
    }

    var limit = Math.max(1, Math.min(200, Number(safePayload.maxItems) || 100));
    var maxIntentos = Math.max(1, Math.min(5, Number(safePayload.maxIntentos) || 3));
    var retryBaseMs = Math.max(0, Number(safePayload.retryBaseMs) || 100);
    var retryJitterMs = Math.max(0, Number(safePayload.retryJitterMs) || 60);
    var pendientes = store.listPendingUploadProducts({ includeDeleted: false }).slice(0, limit);

    var resumen = {
      totalPendientes: pendientes.length,
      sincronizados: 0,
      errores: 0,
      items: []
    };

    for (var i = 0; i < pendientes.length; i += 1) {
      var item = pendientes[i];
      var lastError = null;
      var synced = false;

      for (var attempt = 1; attempt <= maxIntentos; attempt += 1) {
        var upsert = await remoteIndex.upsertProductRecord({
          product: item
        });
        if (upsert && upsert.ok === true) {
          var mark = store.markProductAsSynced({ productId: item.id });
          if (mark && mark.ok === true) {
            synced = true;
            resumen.sincronizados += 1;
            resumen.items.push({
              productId: item.id,
              ok: true,
              intentos: attempt,
              docPath: upsert.docPath || null
            });
          } else {
            lastError = {
              code: (mark && mark.errorCode) || "DATA_MARK_SYNC_FAILED",
              message: (mark && mark.message) || "No se pudo marcar sincronizado."
            };
          }
          break;
        }

        lastError = {
          code: (upsert && upsert.errorCode) || "SYNC_REMOTO_WRITE_FAILED",
          message: (upsert && upsert.message) || "No se pudo guardar producto en remoto."
        };
        if (attempt < maxIntentos) {
          var jitter = retryJitterMs > 0 ? Math.floor(Math.random() * (retryJitterMs + 1)) : 0;
          await delay(retryBaseMs * attempt + jitter);
        }
      }

      if (!synced) {
        resumen.errores += 1;
        resumen.items.push({
          productId: item.id,
          ok: false,
          error: lastError || {
            code: "SYNC_REMOTO_UNKNOWN",
            message: "Fallo de sincronizacion no identificado."
          }
        });
      }
    }

    var passport = "VERDE";
    if (resumen.errores > 0 && resumen.sincronizados > 0) passport = "NARANJA";
    if (resumen.errores > 0 && resumen.sincronizados === 0 && resumen.totalPendientes > 0) passport = "ROJO";

    var out = {
      ok: passport !== "ROJO",
      resultado: {
        estadoPasaporteModulo: passport,
        modulo: MODULE_NAME,
        accionEjecutada: "sincronizar_pendientes_remoto",
        accionSugeridaParaCerebro: passport === "VERDE" ? null : "revisar_pendientes_sync",
        elapsedMs: elapsedSince(startedAt),
        datos: {
          resumen: resumen
        }
      },
      error: null
    };

    if (passport === "ROJO") {
      out.error = {
        code: "OPERATIVA_SYNC_REMOTO_FAILED",
        origin: MODULE_NAME,
        passport: "ROJO",
        message: "No se pudo sincronizar ningun producto pendiente.",
        retryable: true
      };
    }
    return out;
  }

  var api = {
    editarProducto: editarProducto,
    borrarSuaveProducto: borrarSuaveProducto,
    listarProductos: listarProductos,
    marcarSincronizado: marcarSincronizado,
    borrarProductoReal: borrarProductoReal,
    sincronizarPendientesRemoto: sincronizarPendientesRemoto,
    derivarVistaListadoFase9: derivarVistaListadoFase9,
    crearModeloTarjetaProductoFase9: crearModeloTarjetaProductoFase9
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase3OperativaGestionRegistros = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

