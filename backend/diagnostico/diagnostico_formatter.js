(function initDiagnosticoFormatter(globalScope) {
  "use strict";

  var STATUS = {
    OPERATIVO: "OPERATIVO",
    ATENCION: "ATENCION",
    CAIDO: "CAIDO",
    NO_APLICA: "NO_APLICA"
  };
  var MAX_RAW_DETAIL_CHARS = 3200;

  function normalizeText(value, fallback) {
    var text = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    return text || String(fallback || "").trim();
  }

  function formatDurationMs(value) {
    var ms = Number(value);
    if (!Number.isFinite(ms) || ms < 0) return "";
    var seconds = ms / 1000;
    return seconds.toFixed(1).replace(".", ",") + " s";
  }

  function normalizeStatus(value) {
    var safe = String(value || "").trim().toUpperCase();
    return STATUS[safe] ? safe : STATUS.ATENCION;
  }

  function stringifyDiagnosticValue(value) {
    if (value == null || value === "") return "";
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch (errJson) {
      return String(value);
    }
  }

  function hashText(text) {
    var safe = String(text || "");
    var hash = 0;
    for (var i = 0; i < safe.length; i += 1) {
      hash = ((hash << 5) - hash + safe.charCodeAt(i)) | 0;
    }
    return "h" + (hash >>> 0).toString(16).padStart(8, "0");
  }

  function truncateDiagnosticText(value) {
    var text = String(value == null ? "" : value).trim();
    if (text.length <= MAX_RAW_DETAIL_CHARS) return text;
    if (/^data:image\//i.test(text) || /^blob:/i.test(text)) {
      return "[RESUMEN_VISUAL lenOriginal=" + text.length + " hash=" + hashText(text) + "] contenido visual omitido para no saturar el diagnostico.";
    }
    var copied = text.slice(0, MAX_RAW_DETAIL_CHARS);
    return "[RESUMEN lenOriginal=" + text.length + " lenCopiada=" + copied.length + " hash=" + hashText(text) + "] " + copied + "... [RESUMIDO]";
  }

  function buildRawDiagnosticDetail(input) {
    var safe = input || {};
    var parts = [];
    if (safe.httpStatus != null) parts.push("HTTP=" + String(safe.httpStatus));
    if (safe.code) parts.push("CODE=" + String(safe.code));
    if (safe.message) parts.push("MESSAGE=" + String(safe.message));
    if (safe.raw != null) parts.push("RAW=" + stringifyDiagnosticValue(safe.raw));
    return truncateDiagnosticText(parts.join(" | "));
  }

  function formatCheck(row) {
    var safe = row || {};
    var duration = formatDurationMs(safe.durationMs);
    var detail = normalizeText(safe.detail, "Sin detalle.");
    if (duration && detail.indexOf(duration) < 0) detail += " en " + duration;
    return {
      component: normalizeText(safe.component, "Sistema"),
      status: normalizeStatus(safe.status),
      detail: detail
    };
  }

  function formatEvent(event) {
    var safe = event || {};
    var duration = formatDurationMs(safe.durationMs);
    var parts = [
      normalizeText(safe.level, "INFO").toUpperCase(),
      normalizeText(safe.module, "Sistema"),
      normalizeText(safe.action, "evento")
    ];
    var message = normalizeText(safe.message, "");
    if (message) parts.push(message);
    if (safe.rawDetail) parts.push(truncateDiagnosticText(safe.rawDetail));
    if (duration) parts.push(duration);
    return parts.join(" - ");
  }

  function formatSnapshot(snapshot) {
    var safe = snapshot || {};
    var events = Array.isArray(safe.events) ? safe.events : [];
    var lines = [
      "Diagnostico tecnico Fase 11",
      "Caso: " + normalizeText(safe.caseId, "sin caso"),
      "Estado: " + normalizeText(safe.status, "sin estado"),
      "Eventos: " + events.length
    ];
    events.forEach(function each(event) {
      lines.push(formatEvent(event));
    });
    return lines.join("\n");
  }

  var api = {
    STATUS: STATUS,
    normalizeText: normalizeText,
    formatDurationMs: formatDurationMs,
    buildRawDiagnosticDetail: buildRawDiagnosticDetail,
    truncateDiagnosticText: truncateDiagnosticText,
    normalizeStatus: normalizeStatus,
    formatCheck: formatCheck,
    formatEvent: formatEvent,
    formatSnapshot: formatSnapshot
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (globalScope) globalScope.Fase11DiagnosticoFormatter = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
