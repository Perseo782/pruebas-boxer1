(function initDeferredVisualQueue(globalScope) {
  "use strict";

  var jobsByAnalysisId = Object.create(null);
  var pendingAnalysisIds = [];
  var runningAnalysisId = null;

  function cloneValue(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function safeTrace(name, data, meta) {
    if (!globalScope.AnalysisExclusiveRuntime || typeof globalScope.AnalysisExclusiveRuntime.trace !== "function") return;
    globalScope.AnalysisExclusiveRuntime.trace(name, data || null, meta || null);
  }

  function makeJob(options) {
    var safe = options || {};
    return {
      analysisId: String(safe.analysisId || "").trim() || ("analysis_" + Date.now().toString(36)),
      traceId: String(safe.traceId || "").trim() || null,
      fotoRefs: Array.isArray(safe.fotoRefs) ? safe.fotoRefs.filter(Boolean).slice(0, 2) : [],
      buildVisuals: typeof safe.buildVisuals === "function" ? safe.buildVisuals : function noBuild() { return []; },
      status: "pending",
      createdAtMs: Date.now(),
      attempts: 0,
      maxAttempts: 2,
      result: null,
      lastError: null,
      modalTarget: null,
      productTarget: null
    };
  }

  function getJob(analysisId) {
    var safeId = String(analysisId || "").trim();
    if (!safeId) return null;
    return jobsByAnalysisId[safeId] || null;
  }

  function rememberPendingAnalysisId(analysisId) {
    var safeId = String(analysisId || "").trim();
    if (!safeId) return;
    if (pendingAnalysisIds.indexOf(safeId) >= 0) return;
    pendingAnalysisIds.push(safeId);
  }

  function forgetPendingAnalysisId(analysisId) {
    var safeId = String(analysisId || "").trim();
    if (!safeId) return;
    pendingAnalysisIds = pendingAnalysisIds.filter(function keep(item) {
      return item !== safeId;
    });
  }

  function applyJobToModal(job) {
    var target = job && job.modalTarget;
    if (!target || typeof target.isStillValid !== "function" || typeof target.apply !== "function") return;
    if (!target.isStillValid()) return;
    target.apply(cloneValue(job.result || []), cloneValue(job.fotoRefs || []), job);
    safeTrace("visual_link_done", {
      target: "modal",
      analysisId: job.analysisId,
      totalVisuales: Array.isArray(job.result) ? job.result.length : 0
    }, {
      analysisId: job.analysisId,
      traceId: job.traceId,
      phase: "modal"
    });
  }

  function applyJobToProduct(job) {
    var target = job && job.productTarget;
    if (!target || typeof target.isStillValid !== "function" || typeof target.apply !== "function") return;
    if (!target.isStillValid()) return;
    target.apply(cloneValue(job.result || []), cloneValue(job.fotoRefs || []), job);
    safeTrace("visual_link_done", {
      target: "product",
      analysisId: job.analysisId,
      productId: target.productId || null,
      totalVisuales: Array.isArray(job.result) ? job.result.length : 0
    }, {
      analysisId: job.analysisId,
      traceId: job.traceId,
      productId: target.productId || null,
      phase: "product"
    });
  }

  function applyCompletedJob(job) {
    if (!job || job.status !== "done" || !Array.isArray(job.result)) return;
    applyJobToModal(job);
    applyJobToProduct(job);
  }

  async function drainQueue() {
    if (runningAnalysisId) return;
    if (!pendingAnalysisIds.length) return;
    var analysisId = pendingAnalysisIds.shift();
    var job = getJob(analysisId);
    if (!job || job.status === "cancelled") {
      runningAnalysisId = null;
      forgetPendingAnalysisId(analysisId);
      globalScope.setTimeout(drainQueue, 0);
      return;
    }
    runningAnalysisId = analysisId;
    job.status = "running";
    job.attempts += 1;
    safeTrace("visual_queue_start", {
      analysisId: job.analysisId,
      totalFotos: job.fotoRefs.length,
      attempt: job.attempts
    }, {
      analysisId: job.analysisId,
      traceId: job.traceId,
      phase: "visual_queue"
    });
    try {
      var result = await Promise.resolve(job.buildVisuals(job.fotoRefs.slice(0)));
      if (job.status === "cancelled") {
        runningAnalysisId = null;
        globalScope.setTimeout(drainQueue, 0);
        return;
      }
      job.result = Array.isArray(result) ? result.slice(0, 2) : [];
      job.status = "done";
      applyCompletedJob(job);
    } catch (errJob) {
      job.lastError = errJob && errJob.message ? errJob.message : String(errJob || "");
      if (job.attempts < job.maxAttempts) {
        job.status = "pending";
        rememberPendingAnalysisId(job.analysisId);
      } else {
        job.status = "error";
        safeTrace("visual_queue_error", {
          analysisId: job.analysisId,
          message: job.lastError
        }, {
          analysisId: job.analysisId,
          traceId: job.traceId,
          phase: "visual_queue"
        });
      }
    } finally {
      runningAnalysisId = null;
      globalScope.setTimeout(drainQueue, 0);
    }
  }

  function enqueueAnalysisJob(options) {
    var job = makeJob(options);
    var existing = jobsByAnalysisId[job.analysisId];
    if (existing) {
      existing.fotoRefs = job.fotoRefs;
      existing.buildVisuals = job.buildVisuals;
      if (existing.status === "done") {
        applyCompletedJob(existing);
        return cloneValue(existing);
      }
      rememberPendingAnalysisId(existing.analysisId);
      globalScope.setTimeout(drainQueue, 0);
      return cloneValue(existing);
    }
    jobsByAnalysisId[job.analysisId] = job;
    rememberPendingAnalysisId(job.analysisId);
    globalScope.setTimeout(drainQueue, 0);
    return cloneValue(job);
  }

  function attachModalTarget(analysisId, target) {
    var job = getJob(analysisId);
    if (!job) return null;
    job.modalTarget = target || null;
    if (job.status === "done") applyCompletedJob(job);
    return cloneValue(job);
  }

  function attachProductTarget(analysisId, target) {
    var job = getJob(analysisId);
    if (!job) return null;
    job.productTarget = target || null;
    if (job.status === "done") applyCompletedJob(job);
    return cloneValue(job);
  }

  function cancel(analysisId, reason) {
    var job = getJob(analysisId);
    if (!job) return null;
    job.status = "cancelled";
    job.lastError = String(reason || "cancelled");
    job.modalTarget = null;
    job.productTarget = null;
    forgetPendingAnalysisId(analysisId);
    safeTrace("visual_queue_cancelled", {
      analysisId: analysisId,
      reason: job.lastError
    }, {
      analysisId: analysisId,
      traceId: job.traceId,
      phase: "visual_queue"
    });
    return cloneValue(job);
  }

  function snapshot() {
    var out = {};
    var keys = Object.keys(jobsByAnalysisId);
    for (var i = 0; i < keys.length; i += 1) {
      out[keys[i]] = cloneValue(jobsByAnalysisId[keys[i]]);
    }
    return {
      runningAnalysisId: runningAnalysisId,
      pendingAnalysisIds: pendingAnalysisIds.slice(0),
      jobsByAnalysisId: out
    };
  }

  var api = {
    enqueueAnalysisJob: enqueueAnalysisJob,
    attachModalTarget: attachModalTarget,
    attachProductTarget: attachProductTarget,
    cancel: cancel,
    snapshot: snapshot
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.DeferredVisualQueue = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
