(function initCerebroMetricasModule(globalScope) {
  "use strict";

  function nowMs() {
    return Date.now();
  }

  function elapsedSince(startMs) {
    return Math.max(0, nowMs() - Number(startMs || 0));
  }

  function dateStamp() {
    var date = new Date();
    var y = String(date.getFullYear());
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + m + d;
  }

  function makeAnalysisId() {
    return "A-" + dateStamp() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  function makeTraceId() {
    return "T-" + dateStamp() + "-" + Math.random().toString(36).slice(2, 10);
  }

  function startOperation(meta) {
    var safeMeta = meta || {};
    return {
      startedAt: nowMs(),
      analysisId: safeMeta.analysisId || makeAnalysisId(),
      traceId: safeMeta.traceId || makeTraceId(),
      eventos: [],
      tiempos: {
        total: 0,
        boxers: {}
      }
    };
  }

  function pushEvent(ctx, level, code, message, detail) {
    if (!ctx) return;
    ctx.eventos.push({
      ts: nowMs(),
      level: level || "info",
      code: code || "CER_EVENTO",
      message: message || "",
      detail: detail || null
    });
  }

  function recordBoxerTime(ctx, boxerName, elapsedMs) {
    if (!ctx || !ctx.tiempos || !ctx.tiempos.boxers) return;
    ctx.tiempos.boxers[boxerName] = Math.max(0, Number(elapsedMs) || 0);
  }

  function finalizeMetricas(ctx) {
    if (!ctx) return null;
    ctx.tiempos.total = elapsedSince(ctx.startedAt);
    return {
      analysisId: ctx.analysisId,
      traceId: ctx.traceId,
      elapsedMs: ctx.tiempos.total,
      tiempos: ctx.tiempos,
      eventos: ctx.eventos.slice()
    };
  }

  var api = {
    nowMs: nowMs,
    elapsedSince: elapsedSince,
    makeAnalysisId: makeAnalysisId,
    makeTraceId: makeTraceId,
    startOperation: startOperation,
    pushEvent: pushEvent,
    recordBoxerTime: recordBoxerTime,
    finalizeMetricas: finalizeMetricas
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroMetricas = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
