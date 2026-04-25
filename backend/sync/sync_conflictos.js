(function initFase8SyncConflictosModule(globalScope) {
  "use strict";

  function asIso(value) {
    var safe = String(value || "").trim();
    return safe || null;
  }

  function toMs(iso) {
    var value = Date.parse(String(iso || ""));
    return Number.isFinite(value) ? value : 0;
  }

  function decideConflict(input) {
    var safeInput = input || {};
    var localRecord = safeInput.localRecord || null;
    var remoteRecord = safeInput.remoteRecord || null;
    var context = String(safeInput.context || "").trim() || "unknown";

    if (!localRecord || !remoteRecord) {
      return {
        ok: true,
        kind: "NO_CONFLICT",
        action: "APPLY_REMOTE",
        reason: "Datos incompletos: se aplica remoto."
      };
    }

    var localPending = !!(localRecord.sistema && localRecord.sistema.dirty === true);
    var remoteDeleted = remoteRecord.deleted === true ||
      (remoteRecord.sistema && String(remoteRecord.sistema.estadoRegistro || "").toUpperCase() !== "ACTIVO");

    var localUpdatedAt = asIso(localRecord.sistema && localRecord.sistema.updatedAt);
    var localLastSyncedAt = asIso(localRecord.sistema && localRecord.sistema.lastSyncedAt);
    var remoteUpdatedAt = asIso(
      remoteRecord.sistema && remoteRecord.sistema.updatedAt
        ? remoteRecord.sistema.updatedAt
        : remoteRecord.updatedAtServer
    );

    var localMs = toMs(localUpdatedAt);
    var remoteMs = toMs(remoteUpdatedAt);
    var baseMs = toMs(localLastSyncedAt);

    if (!localPending) {
      return {
        ok: true,
        kind: "NO_CONFLICT",
        action: "APPLY_REMOTE",
        reason: "Local no pendiente."
      };
    }

    if (remoteDeleted) {
      return {
        ok: true,
        kind: "DELETE_VS_EDIT",
        action: "KEEP_LOCAL_PENDING",
        reason: "Borrado remoto contra edicion local pendiente.",
        context: context
      };
    }

    if (remoteMs > baseMs && localMs > baseMs) {
      return {
        ok: true,
        kind: "EDIT_VS_EDIT",
        action: "KEEP_LOCAL_PENDING",
        reason: "Edicion local y remota desde base comun.",
        context: context
      };
    }

    if (remoteMs > localMs) {
      return {
        ok: true,
        kind: "REMOTE_NEWER",
        action: "APPLY_REMOTE",
        reason: "Remoto mas nuevo que local."
      };
    }

    return {
      ok: true,
      kind: "LOCAL_NEWER",
      action: "KEEP_LOCAL_PENDING",
      reason: "Local pendiente mas nuevo o igual."
    };
  }

  var api = {
    decideConflict: decideConflict
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase8SyncConflictos = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
