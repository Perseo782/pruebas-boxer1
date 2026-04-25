(function initOperativaRevisionModule(globalScope) {
  "use strict";

  var MODULE_NAME = "Operativa_Revision";

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
      typeof store.getRevisionDraftById === "function" &&
      typeof store.confirmRevisionDraft === "function" &&
      typeof store.cancelRevisionDraft === "function"
    );
  }

  function confirmarRevision(payload, deps) {
    var startedAt = Date.now();
    var safePayload = payload || {};
    var store = deps && deps.store;
    if (!validarStore(store)) {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_NO_CONFIGURADO",
        "Store de revision no configurado.",
        false,
        "bloquear_guardado"
      );
    }

    var draftId = String(safePayload.draftId || "").trim();
    if (!draftId) {
      return buildError(
        startedAt,
        "OPERATIVA_DRAFT_ID_REQUERIDO",
        "Falta draftId para confirmar revision.",
        false,
        "abrir_revision"
      );
    }

    var draft = store.getRevisionDraftById(draftId);
    if (!draft) {
      return buildError(
        startedAt,
        "OPERATIVA_DRAFT_NO_ENCONTRADO",
        "No existe el borrador indicado.",
        false,
        "abrir_revision"
      );
    }

    var confirmacion = store.confirmRevisionDraft({
      draftId: draftId,
      nombreFinal: safePayload.nombreFinal,
      alergenosFinales: safePayload.alergenosFinales
    });
    if (!confirmacion || confirmacion.ok !== true) {
      return buildError(
        startedAt,
        (confirmacion && confirmacion.errorCode) || "OPERATIVA_REVISION_CONFIRM_FAILED",
        (confirmacion && confirmacion.message) || "No se pudo confirmar la revision.",
        true,
        "reintentar_una_vez"
      );
    }

    return {
      ok: true,
      resultado: {
        estadoPasaporteModulo: "VERDE",
        modulo: MODULE_NAME,
        accionEjecutada: "confirmar_revision_y_guardar",
        elapsedMs: elapsedSince(startedAt),
        datos: {
          estadoRegistroOperativo: "GUARDADO_LOCAL",
          fusionExacta: !!confirmacion.merged,
          producto: confirmacion.record,
          borrador: confirmacion.draft
        }
      },
      error: null
    };
  }

  function cancelarRevision(payload, deps) {
    var startedAt = Date.now();
    var safePayload = payload || {};
    var store = deps && deps.store;
    if (!validarStore(store)) {
      return buildError(
        startedAt,
        "OPERATIVA_STORE_NO_CONFIGURADO",
        "Store de revision no configurado.",
        false,
        "bloquear_guardado"
      );
    }

    var draftId = String(safePayload.draftId || "").trim();
    if (!draftId) {
      return buildError(
        startedAt,
        "OPERATIVA_DRAFT_ID_REQUERIDO",
        "Falta draftId para cancelar revision.",
        false,
        "abrir_revision"
      );
    }

    var cancelacion = store.cancelRevisionDraft({
      draftId: draftId,
      motivo: safePayload.motivoCancelacion
    });
    if (!cancelacion || cancelacion.ok !== true) {
      return buildError(
        startedAt,
        (cancelacion && cancelacion.errorCode) || "OPERATIVA_REVISION_CANCEL_FAILED",
        (cancelacion && cancelacion.message) || "No se pudo cancelar la revision.",
        false,
        "abrir_revision"
      );
    }

    return {
      ok: true,
      resultado: {
        estadoPasaporteModulo: "VERDE",
        modulo: MODULE_NAME,
        accionEjecutada: "cancelar_revision",
        elapsedMs: elapsedSince(startedAt),
        datos: {
          estadoRegistroOperativo: "CANCELADO",
          borrador: cancelacion.draft
        }
      },
      error: null
    };
  }

  var api = {
    confirmarRevision: confirmarRevision,
    cancelarRevision: cancelarRevision
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase3OperativaRevision = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
