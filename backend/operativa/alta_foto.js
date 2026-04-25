(function initOperativaAltaFotoModule(globalScope) {
  "use strict";

  var MODULE_NAME = "Operativa_Alta_Foto";

  function elapsedSince(startMs) {
    return Math.max(0, Date.now() - startMs);
  }

  function asFotoRefs(payload) {
    var refs = Array.isArray(payload && payload.fotoRefs) ? payload.fotoRefs : [];
    return refs
      .map(function mapRef(ref) { return String(ref || "").trim(); })
      .filter(Boolean)
      .slice(0, 2);
  }

  function buildError(startMs, code, message, retryable, action) {
    return {
      ok: false,
      resultado: {
        estadoPasaporteModulo: "ROJO",
        modulo: MODULE_NAME,
        accionSugeridaParaCerebro: action || "reintentar_una_vez",
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

  async function ejecutarAltaFoto(payload, deps) {
    var startedAt = Date.now();
    var safePayload = payload || {};
    var safeDeps = deps || {};
    var store = safeDeps.store;
    var boxerAdapter = safeDeps.boxerAdapter;

    if (!store || typeof store.createRevisionDraft !== "function") {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_NO_CONFIGURADO",
        "Store de persistencia no configurado para alta foto.",
        false,
        "bloquear_guardado"
      );
    }

    if (!boxerAdapter || typeof boxerAdapter.analizarFotosParaBorrador !== "function") {
      return buildError(
        startedAt,
        "OPERATIVA_BOXER_ADAPTER_NO_CONFIGURADO",
        "Adaptador de Boxer 1 no configurado para alta foto.",
        false,
        "bloquear_guardado"
      );
    }

    var fotoRefs = asFotoRefs(safePayload);
    if (!fotoRefs.length) {
      return buildError(
        startedAt,
        "OPERATIVA_FOTO_REQUERIDA",
        "Alta por foto requiere al menos una foto.",
        false,
        "pedir_dato_al_usuario"
      );
    }

    try {
      var analisis = await boxerAdapter.analizarFotosParaBorrador(
        { fotoRefs: fotoRefs },
        safeDeps
      );
      if (!analisis || analisis.ok !== true || !analisis.resultado) {
        return buildError(
          startedAt,
          (analisis && analisis.errorCode) || "BOXER_ANALISIS_FAILED",
          (analisis && analisis.message) || "No se pudo analizar la foto.",
          true,
          "reintentar_una_vez"
        );
      }

      var resultado = analisis.resultado;
      var draftCreate = store.createRevisionDraft({
        fotoRefs: fotoRefs,
        nombrePropuesto: resultado.nombrePropuesto,
        alergenosPropuestos: resultado.alergenosPropuestos,
        resultadoBoxer: resultado
      });

      if (!draftCreate || draftCreate.ok !== true || !draftCreate.draft) {
        return buildError(
          startedAt,
          (draftCreate && draftCreate.errorCode) || "DATA_DRAFT_CREATE_FAILED",
          (draftCreate && draftCreate.message) || "No se pudo crear borrador de revision.",
          true,
          "reintentar_una_vez"
        );
      }

      return {
        ok: true,
        resultado: {
          estadoPasaporteModulo: "NARANJA",
          modulo: MODULE_NAME,
          accionSugeridaParaCerebro: "abrir_revision",
          accionEjecutada: "crear_borrador_revision_foto",
          elapsedMs: elapsedSince(startedAt),
          datos: {
            estadoRegistroOperativo: "PENDIENTE_REVISION",
            borrador: draftCreate.draft
          }
        },
        error: null
      };
    } catch (err) {
      return buildError(
        startedAt,
        "OPERATIVA_ERROR_INTERNO",
        err && err.message ? err.message : "Error interno en alta por foto.",
        true,
        "reintentar_una_vez"
      );
    }
  }

  var api = {
    ejecutarAltaFoto: ejecutarAltaFoto
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase3OperativaAltaFoto = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
