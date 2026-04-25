(function initOperativaLoteFotoModule(globalScope) {
  "use strict";

  var MODULE_NAME = "Operativa_Lote_Foto";
  var MAX_ITEMS = 10;

  function elapsedSince(startMs) {
    return Math.max(0, Date.now() - startMs);
  }

  function buildError(startMs, code, message, retryable, action, datos) {
    return {
      ok: false,
      resultado: {
        estadoPasaporteModulo: "ROJO",
        modulo: MODULE_NAME,
        accionSugeridaParaCerebro: action || "reintentar_una_vez",
        elapsedMs: elapsedSince(startMs),
        datos: datos || {}
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

  function normalizeRefs(rawRefs) {
    var refs = Array.isArray(rawRefs) ? rawRefs : [rawRefs];
    return refs
      .map(function mapRef(ref) { return String(ref || "").trim(); })
      .filter(Boolean)
      .slice(0, 2);
  }

  function asLoteItems(payload) {
    var safePayload = payload || {};
    var sourceItems = [];

    if (Array.isArray(safePayload.items)) sourceItems = safePayload.items;
    else if (Array.isArray(safePayload.imagenes)) sourceItems = safePayload.imagenes;
    else if (Array.isArray(safePayload.fotoRefs)) sourceItems = safePayload.fotoRefs;

    return sourceItems
      .map(function mapItem(rawItem, index) {
        var refs;
        if (typeof rawItem === "string") refs = normalizeRefs([rawItem]);
        else if (Array.isArray(rawItem)) refs = normalizeRefs(rawItem);
        else refs = normalizeRefs(rawItem && (rawItem.fotoRefs || rawItem.fotoRef));

        return {
          index: index + 1,
          fotoRefs: refs
        };
      })
      .filter(function hasRefs(item) { return item.fotoRefs.length > 0; });
  }

  function buildOkResponse(startMs, summary, action) {
    var hasErrors = summary.resumen.errores > 0;
    var passport = hasErrors ? "NARANJA" : "VERDE";
    return {
      ok: true,
      resultado: {
        estadoPasaporteModulo: passport,
        modulo: MODULE_NAME,
        accionSugeridaParaCerebro: action || "abrir_revision",
        accionEjecutada: "procesar_lote_foto",
        elapsedMs: elapsedSince(startMs),
        datos: summary
      },
      error: null
    };
  }

  async function ejecutarLoteFoto(payload, deps) {
    var startedAt = Date.now();
    var safeDeps = deps || {};
    var store = safeDeps.store;
    var boxerAdapter = safeDeps.boxerAdapter;
    var altaFotoOperativa =
      safeDeps.altaFotoOperativa ||
      (globalScope && globalScope.Fase3OperativaAltaFoto) ||
      null;

    if (!store || typeof store.createRevisionDraft !== "function") {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_NO_CONFIGURADO",
        "Store de persistencia no configurado para lote foto.",
        false,
        "bloquear_guardado"
      );
    }
    if (!boxerAdapter || typeof boxerAdapter.analizarFotosParaBorrador !== "function") {
      return buildError(
        startedAt,
        "OPERATIVA_BOXER_ADAPTER_NO_CONFIGURADO",
        "Adaptador de Boxer 1 no configurado para lote foto.",
        false,
        "bloquear_guardado"
      );
    }
    if (!altaFotoOperativa || typeof altaFotoOperativa.ejecutarAltaFoto !== "function") {
      return buildError(
        startedAt,
        "OPERATIVA_ALTA_FOTO_NO_CONFIGURADA",
        "Operativa alta foto no disponible para proceso por lote.",
        false,
        "bloquear_guardado"
      );
    }

    var normalizedItems = asLoteItems(payload);
    if (!normalizedItems.length) {
      return buildError(
        startedAt,
        "OPERATIVA_LOTE_SIN_IMAGENES",
        "No se recibieron imagenes validas para el lote.",
        false,
        "pedir_dato_al_usuario"
      );
    }

    var processItems = normalizedItems.slice(0, MAX_ITEMS);
    var summary = {
      totalSolicitadas: normalizedItems.length,
      totalProcesadas: processItems.length,
      truncadoMaximo10: normalizedItems.length > MAX_ITEMS,
      resumen: {
        correctos: 0,
        revision: 0,
        errores: 0
      },
      items: []
    };

    for (var i = 0; i < processItems.length; i += 1) {
      var item = processItems[i];
      try {
        var perItemDeps = Object.assign({}, safeDeps, {
          store: store,
          boxerAdapter: boxerAdapter
        });
        delete perItemDeps.altaFotoOperativa;

        var output = await altaFotoOperativa.ejecutarAltaFoto(
          { fotoRefs: item.fotoRefs },
          perItemDeps
        );

        if (!output || output.ok !== true) {
          summary.resumen.errores += 1;
          summary.items.push({
            index: item.index,
            fotoRefs: item.fotoRefs,
            ok: false,
            estado: "ERROR",
            errorCode: output && output.error ? output.error.code : "LOTE_ITEM_FAILED",
            message: output && output.error ? output.error.message : "Error desconocido en item.",
            retryable: !!(output && output.error && output.error.retryable)
          });
          continue;
        }

        var estadoOperativo =
          output.resultado &&
          output.resultado.datos &&
          output.resultado.datos.estadoRegistroOperativo;
        var isRevision = estadoOperativo === "PENDIENTE_REVISION";
        if (isRevision) summary.resumen.revision += 1;
        else summary.resumen.correctos += 1;

        var draftId =
          output.resultado &&
          output.resultado.datos &&
          output.resultado.datos.borrador &&
          output.resultado.datos.borrador.draftId;

        summary.items.push({
          index: item.index,
          fotoRefs: item.fotoRefs,
          ok: true,
          estado: isRevision ? "PENDIENTE_REVISION" : "CORRECTO",
          draftId: draftId || null
        });
      } catch (err) {
        summary.resumen.errores += 1;
        summary.items.push({
          index: item.index,
          fotoRefs: item.fotoRefs,
          ok: false,
          estado: "ERROR",
          errorCode: "OPERATIVA_LOTE_ITEM_THROW",
          message: err && err.message ? err.message : "Excepcion en item de lote.",
          retryable: true
        });
      }
    }

    var anySuccess = summary.resumen.correctos + summary.resumen.revision > 0;
    if (!anySuccess) {
      return buildError(
        startedAt,
        "OPERATIVA_LOTE_SIN_EXITOS",
        "Ningun item del lote se pudo procesar correctamente.",
        true,
        "reintentar_lote",
        summary
      );
    }

    return buildOkResponse(startedAt, summary, "abrir_revision");
  }

  var api = {
    ejecutarLoteFoto: ejecutarLoteFoto,
    MAX_ITEMS: MAX_ITEMS
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase3OperativaLoteFoto = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
