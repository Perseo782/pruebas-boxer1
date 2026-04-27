(function initOperativaAltaManualModule(globalScope) {
  "use strict";

  var MODULE_NAME = "Operativa_Alta_Manual";

  function elapsedSince(startMs) {
    return Math.max(0, Date.now() - startMs);
  }

  function buildError(startMs, code, message, retryable, action) {
    return {
      ok: false,
      resultado: {
        estadoPasaporteModulo: "ROJO",
        modulo: MODULE_NAME,
        accionSugeridaParaCerebro: action || "bloquear_guardado",
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

  function ejecutarAltaManual(payload, deps) {
    var startedAt = Date.now();
    var safePayload = payload || {};
    var safeDeps = deps || {};
    var store = safeDeps.store;

    if (!store || typeof store.createOrMergeByNormalizedName !== "function") {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_NO_CONFIGURADO",
        "Store de persistencia no configurado para alta manual.",
        false,
        "bloquear_guardado"
      );
    }

    var nombre = String(safePayload.nombre || "").trim();
    if (nombre.length < 3) {
      return buildError(
        startedAt,
        "OPERATIVA_NOMBRE_INVALIDO",
        "Nombre obligatorio (minimo 3 caracteres utiles).",
        false,
        "bloquear_guardado"
      );
    }

    try {
      var persist = store.createOrMergeByNormalizedName({
        nombre: nombre,
        comercial: {
          formato: String(safePayload.formato || "").trim(),
          formatoNormalizado: String(safePayload.formatoNormalizado || "").trim(),
          tipoFormato: String(safePayload.tipoFormato || "desconocido").trim() || "desconocido"
        },
        alergenos: Array.isArray(safePayload.alergenos) ? safePayload.alergenos : [],
        origenAlta: String(safePayload.origenAlta || "manual"),
        fotoRefs: Array.isArray(safePayload.fotoRefs) ? safePayload.fotoRefs : [],
        visuales: Array.isArray(safePayload.visuales) ? safePayload.visuales : []
      });

      if (!persist || persist.ok !== true) {
        return buildError(
          startedAt,
          (persist && persist.errorCode) || "DATA_WRITE_FAILED",
          (persist && persist.message) || "No se pudo guardar en persistencia local.",
          true,
          "reintentar_una_vez"
        );
      }

      return {
        ok: true,
        resultado: {
          estadoPasaporteModulo: "VERDE",
          modulo: MODULE_NAME,
          accionEjecutada: "crear_o_fusionar_por_nombre_normalizado",
          elapsedMs: elapsedSince(startedAt),
          datos: {
            fusionExacta: !!persist.merged,
            producto: persist.record
          }
        },
        error: null
      };
    } catch (err) {
      return buildError(
        startedAt,
        "OPERATIVA_ERROR_INTERNO",
        err && err.message ? err.message : "Error interno en alta manual.",
        true,
        "reintentar_una_vez"
      );
    }
  }

  var api = {
    ejecutarAltaManual: ejecutarAltaManual
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase3OperativaAltaManual = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
