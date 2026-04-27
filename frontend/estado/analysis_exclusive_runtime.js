(function initAnalysisExclusiveRuntime(globalScope) {
  "use strict";

  var STORAGE_KEY = "appv2_analysis_exclusive_runtime_v1";
  var TRACE_LIMIT = 240;
  var COMPLETED_LIMIT = 6;
  var DEFAULT_PRIORITY = 50;
  var currentSession = null;
  var completedSessions = [];
  var deferredTasks = [];
  var deferredTaskSeq = 0;
  var drainTimerId = null;
  var drainVersion = 0;
  var lateVisualTraceTarget = null;
  var emergencyDisabled = false;

  function cloneValue(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function nowMs() {
    return Date.now();
  }

  function makeId(prefix) {
    return String(prefix || "analysis") + "_" + nowMs().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  function readPersisted() {
    try {
      if (!globalScope || !globalScope.localStorage) return null;
      var raw = globalScope.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (errRead) {
      return null;
    }
  }

  function normalizeMeta(meta) {
    var safe = meta || {};
    return {
      source: String(safe.source || "").trim() || null,
      reason: String(safe.reason || "").trim() || null,
      analysisId: String(safe.analysisId || "").trim() || null,
      traceId: String(safe.traceId || "").trim() || null,
      draftId: String(safe.draftId || "").trim() || null,
      productId: String(safe.productId || "").trim() || null,
      batchId: String(safe.batchId || "").trim() || null,
      taskName: String(safe.taskName || "").trim() || null,
      taskKey: String(safe.taskKey || "").trim() || null,
      phase: String(safe.phase || "").trim() || null
    };
  }

  function createSession(meta) {
    var safeMeta = normalizeMeta(meta);
    return {
      sessionId: makeId("analysis_exclusive"),
      requestedAtMs: nowMs(),
      activeAtMs: null,
      resultVisibleAtMs: null,
      resumeStartedAtMs: null,
      resumeFinishedAtMs: null,
      phase: "requested",
      active: true,
      analysisId: safeMeta.analysisId,
      traceId: safeMeta.traceId,
      draftId: safeMeta.draftId,
      productId: safeMeta.productId,
      batchId: safeMeta.batchId,
      source: safeMeta.source,
      events: []
    };
  }

  function attachMetaToSession(session, meta) {
    if (!session) return null;
    var safeMeta = normalizeMeta(meta);
    if (safeMeta.analysisId) session.analysisId = safeMeta.analysisId;
    if (safeMeta.traceId) session.traceId = safeMeta.traceId;
    if (safeMeta.draftId) session.draftId = safeMeta.draftId;
    if (safeMeta.productId) session.productId = safeMeta.productId;
    if (safeMeta.batchId) session.batchId = safeMeta.batchId;
    if (safeMeta.source) session.source = safeMeta.source;
    return session;
  }

  function trimCompletedSessions() {
    if (completedSessions.length > COMPLETED_LIMIT) {
      completedSessions = completedSessions.slice(0, COMPLETED_LIMIT);
    }
  }

  function sameSessionIdentity(session, meta) {
    var safeMeta = normalizeMeta(meta);
    if (!session) return false;
    if (safeMeta.analysisId && session.analysisId && safeMeta.analysisId === session.analysisId) return true;
    if (safeMeta.traceId && session.traceId && safeMeta.traceId === session.traceId) return true;
    return false;
  }

  function findCompletedSessionByMeta(meta) {
    var safeMeta = normalizeMeta(meta);
    if (!safeMeta.analysisId && !safeMeta.traceId) return null;
    for (var index = 0; index < completedSessions.length; index += 1) {
      if (sameSessionIdentity(completedSessions[index], safeMeta)) {
        return completedSessions[index];
      }
    }
    return null;
  }

  function findAnonymousLateTraceSession() {
    for (var index = 0; index < completedSessions.length; index += 1) {
      var session = completedSessions[index];
      if (session && session.phase === "late_trace" && !session.analysisId && !session.traceId) {
        return session;
      }
    }
    return null;
  }

  function createLateTraceSession(meta) {
    var safeMeta = normalizeMeta(meta);
    if (!safeMeta.analysisId && !safeMeta.traceId) {
      var existingAnonymous = findAnonymousLateTraceSession();
      if (existingAnonymous) return existingAnonymous;
    }
    var session = createSession(meta);
    session.active = false;
    session.phase = "late_trace";
    session.resumeStartedAtMs = session.requestedAtMs;
    session.resumeFinishedAtMs = session.requestedAtMs;
    completedSessions.unshift(session);
    trimCompletedSessions();
    return session;
  }

  function isLateTraceName(name) {
    var safeName = String(name || "").trim();
    return safeName === "sync_deferred_start" ||
      safeName === "sync_deferred_done" ||
      safeName === "thumb_start" ||
      safeName === "thumb_done" ||
      safeName === "viewer_image_start" ||
      safeName === "viewer_image_done" ||
      safeName === "visual_queue_start" ||
      safeName === "visual_link_done" ||
      safeName === "visual_queue_cancelled" ||
      safeName === "visual_queue_error" ||
      safeName === "nonessential_task_deferred" ||
      safeName === "deferred_task_error";
  }

  function isDerivativeVisualTrace(name) {
    var safeName = String(name || "").trim();
    return safeName === "thumb_start" ||
      safeName === "thumb_done" ||
      safeName === "viewer_image_start" ||
      safeName === "viewer_image_done";
  }

  function getLateVisualTraceMeta(name) {
    if (!isDerivativeVisualTrace(name) || !lateVisualTraceTarget) return null;
    if (lateVisualTraceTarget.expiresAtMs && lateVisualTraceTarget.expiresAtMs < nowMs()) {
      lateVisualTraceTarget = null;
      return null;
    }
    return {
      analysisId: lateVisualTraceTarget.analysisId || null,
      traceId: lateVisualTraceTarget.traceId || null,
      phase: "visual_queue"
    };
  }

  function resolveTraceSession(name, meta) {
    var safeMeta = normalizeMeta(meta);
    var hasStableId = !!(safeMeta.analysisId || safeMeta.traceId);
    if (!hasStableId) {
      if (currentSession) return ensureCurrentSession(safeMeta);
      if (isLateTraceName(name)) return createLateTraceSession(safeMeta);
      return ensureCurrentSession(safeMeta);
    }
    if (currentSession && sameSessionIdentity(currentSession, safeMeta)) {
      return attachMetaToSession(currentSession, safeMeta);
    }
    if (currentSession && !currentSession.analysisId && !currentSession.traceId) {
      return attachMetaToSession(currentSession, safeMeta);
    }
    var completedSession = findCompletedSessionByMeta(safeMeta);
    if (completedSession) {
      return attachMetaToSession(completedSession, safeMeta);
    }
    if (currentSession && (currentSession.analysisId || currentSession.traceId)) {
      return createLateTraceSession(safeMeta);
    }
    return ensureCurrentSession(safeMeta);
  }

  function isFreshPhotoRequest(meta) {
    var safeMeta = normalizeMeta(meta);
    return safeMeta.reason === "photo_selected" ||
      safeMeta.reason === "camera_opened" ||
      safeMeta.reason === "gallery_requested";
  }

  function sessionHasPhotoLifecycle(session) {
    if (!session || !Array.isArray(session.events)) return false;
    return session.events.some(function hasPhotoEvent(event) {
      if (!event || !event.trace) return false;
      return event.trace === "photo_input_started" ||
        event.trace === "analysis_button_clicked" ||
        event.trace === "analysis_real_started" ||
        (event.trace === "analysis_exclusive_requested" && event.data && event.data.reason === "photo_selected");
    });
  }

  function shouldStartFreshSession(meta) {
    if (!currentSession || !isFreshPhotoRequest(meta)) return false;
    if ((currentSession.phase === "requested" || currentSession.phase === "analysis") && sessionHasPhotoLifecycle(currentSession)) return false;
    return true;
  }

  function finishCurrentSessionBeforeFreshStart() {
    if (!currentSession) return;
    drainVersion += 1;
    if (drainTimerId) {
      globalScope.clearTimeout(drainTimerId);
      drainTimerId = null;
    }
    currentSession.active = false;
    currentSession.phase = "idle";
    if (!currentSession.resumeFinishedAtMs) {
      currentSession.resumeFinishedAtMs = nowMs();
    }
    archiveCurrentSession();
    currentSession = null;
  }

  function ensureCurrentSession(meta) {
    if (!currentSession) {
      currentSession = createSession(meta);
      persistSnapshot();
      return currentSession;
    }
    return attachMetaToSession(currentSession, meta);
  }

  function cloneSession(session) {
    if (!session) return null;
    return {
      sessionId: session.sessionId,
      requestedAtMs: session.requestedAtMs,
      activeAtMs: session.activeAtMs,
      resultVisibleAtMs: session.resultVisibleAtMs,
      resumeStartedAtMs: session.resumeStartedAtMs,
      resumeFinishedAtMs: session.resumeFinishedAtMs,
      phase: session.phase,
      active: !!session.active,
      analysisId: session.analysisId || null,
      traceId: session.traceId || null,
      draftId: session.draftId || null,
      productId: session.productId || null,
      batchId: session.batchId || null,
      source: session.source || null,
      events: Array.isArray(session.events) ? cloneValue(session.events) : []
    };
  }

  function buildDeferredTaskSnapshot(task) {
    return {
      id: task.id,
      key: task.key,
      taskName: task.taskName,
      priority: task.priority,
      sessionId: task.sessionId || null,
      createdAtMs: task.createdAtMs
    };
  }

  function persistSnapshot() {
    try {
      if (!globalScope || !globalScope.localStorage) return;
      globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentSession: cloneSession(currentSession),
        completedSessions: cloneValue(completedSessions),
        deferredTasks: deferredTasks.map(buildDeferredTaskSnapshot),
        emergencyDisabled: emergencyDisabled
      }));
    } catch (errWrite) {
      // El diagnostico nunca debe bloquear la app.
    }
  }

  function recordTrace(name, data, meta) {
    var safeName = String(name || "").trim();
    if (!safeName) return null;
    var safeMeta = normalizeMeta(meta);
    if (!safeMeta.analysisId && !safeMeta.traceId) {
      safeMeta = normalizeMeta(getLateVisualTraceMeta(safeName) || safeMeta);
    }
    var session = resolveTraceSession(safeName, safeMeta);
    var currentNow = nowMs();
    var entry = {
      trace: safeName,
      atMs: currentNow,
      sinceRequestMs: session.requestedAtMs ? currentNow - session.requestedAtMs : null,
      analysisId: session.analysisId || null,
      traceId: session.traceId || null,
      draftId: session.draftId || null,
      productId: session.productId || null,
      source: session.source || null,
      data: cloneValue(data)
    };
    session.events.push(entry);
    if (session.events.length > TRACE_LIMIT) {
      session.events = session.events.slice(session.events.length - TRACE_LIMIT);
    }
    if (safeName === "visual_queue_start" && session.analysisId) {
      lateVisualTraceTarget = {
        analysisId: session.analysisId,
        traceId: session.traceId || null,
        expiresAtMs: currentNow + 15000
      };
    }
    if (safeName === "visual_link_done" && safeMeta.analysisId && lateVisualTraceTarget && lateVisualTraceTarget.analysisId === safeMeta.analysisId) {
      lateVisualTraceTarget = null;
    }
    persistSnapshot();
    return entry;
  }

  function archiveCurrentSession() {
    if (!currentSession) return;
    completedSessions.unshift(cloneSession(currentSession));
    trimCompletedSessions();
  }

  function requestExclusive(meta) {
    var safeMeta = normalizeMeta(meta);
    if (shouldStartFreshSession(safeMeta)) {
      finishCurrentSessionBeforeFreshStart();
    }
    var session = ensureCurrentSession(safeMeta);
    session.phase = "requested";
    session.active = true;
    recordTrace("analysis_exclusive_requested", safeMeta, safeMeta);
    return cloneSession(session);
  }

  function markAnalysisStarted(meta) {
    var session = ensureCurrentSession(meta);
    session.active = true;
    session.phase = "analysis";
    if (!session.activeAtMs) session.activeAtMs = nowMs();
    return cloneSession(session);
  }

  function markResultVisible(data, meta) {
    var session = ensureCurrentSession(meta);
    session.phase = "result_visible";
    if (!session.resultVisibleAtMs) session.resultVisibleAtMs = nowMs();
    recordTrace("ui_result_visible", data, meta);
    return cloneSession(session);
  }

  function isExclusiveBlocking() {
    if (emergencyDisabled) return false;
    return !!(
      currentSession &&
      currentSession.active === true &&
      (currentSession.phase === "requested" || currentSession.phase === "analysis")
    );
  }

  function normalizePriority(priority) {
    var numeric = Number(priority);
    if (!Number.isFinite(numeric)) return DEFAULT_PRIORITY;
    return Math.max(0, Math.floor(numeric));
  }

  function compareDeferredTasks(left, right) {
    var prioDiff = normalizePriority(left.priority) - normalizePriority(right.priority);
    if (prioDiff !== 0) return prioDiff;
    if (left.createdAtMs < right.createdAtMs) return -1;
    if (left.createdAtMs > right.createdAtMs) return 1;
    if (left.id < right.id) return -1;
    if (left.id > right.id) return 1;
    return 0;
  }

  function scheduleDeferredTask(taskName, options, run) {
    var safeName = String(taskName || "deferred_task").trim() || "deferred_task";
    var safeOptions = options || {};
    var key = String(safeOptions.key || safeName).trim() || safeName;
    var priority = normalizePriority(safeOptions.priority);
    var id = "deferred_" + (++deferredTaskSeq);
    var task = {
      id: id,
      key: key,
      taskName: safeName,
      priority: priority,
      createdAtMs: nowMs(),
      sessionId: currentSession ? currentSession.sessionId : null,
      run: typeof run === "function" ? run : function noop() { return null; }
    };
    for (var i = 0; i < deferredTasks.length; i += 1) {
      if (deferredTasks[i].key !== key) continue;
      deferredTasks[i] = task;
      persistSnapshot();
      return task;
    }
    deferredTasks.push(task);
    deferredTasks.sort(compareDeferredTasks);
    persistSnapshot();
    return task;
  }

  async function drainDeferredQueue(version) {
    while (deferredTasks.length) {
      if (version !== drainVersion) return;
      if (isExclusiveBlocking()) return;
      var task = deferredTasks.shift();
      persistSnapshot();
      if (!task || typeof task.run !== "function") continue;
      try {
        await Promise.resolve(task.run());
      } catch (errTask) {
        recordTrace("deferred_task_error", {
          taskName: task.taskName,
          key: task.key,
          message: errTask && errTask.message ? errTask.message : String(errTask || "")
        }, null);
      }
      if (version !== drainVersion) return;
      await new Promise(function waitNext(resolve) {
        drainTimerId = globalScope.setTimeout(function onNext() {
          drainTimerId = null;
          resolve();
        }, 60);
      });
    }
  }

  function runOrDefer(taskName, options, run) {
    if (!isExclusiveBlocking()) {
      return Promise.resolve(typeof run === "function" ? run() : null);
    }
    var safeOptions = options || {};
    recordTrace("nonessential_task_deferred", {
      taskName: String(taskName || "deferred_task"),
      key: String(safeOptions.key || taskName || "deferred_task"),
      priority: normalizePriority(safeOptions.priority)
    }, safeOptions);
    scheduleDeferredTask(taskName, safeOptions, run);
    return Promise.resolve({
      ok: true,
      deferred: true,
      taskName: String(taskName || "deferred_task")
    });
  }

  function resumeProgressively(meta) {
    if (drainTimerId) {
      globalScope.clearTimeout(drainTimerId);
      drainTimerId = null;
    }
    if (!currentSession) {
      drainVersion += 1;
      var emptyVersion = drainVersion;
      globalScope.setTimeout(function runPendingOnly() {
        drainDeferredQueue(emptyVersion);
      }, 0);
      return;
    }
    attachMetaToSession(currentSession, meta);
    var sessionId = currentSession.sessionId;
    currentSession.phase = "resuming";
    currentSession.resumeStartedAtMs = nowMs();
    currentSession.active = false;
    recordTrace("analysis_exclusive_resume_start", normalizeMeta(meta), meta);
    drainVersion += 1;
    var version = drainVersion;
    globalScope.setTimeout(async function runResume() {
      await drainDeferredQueue(version);
      if (version !== drainVersion) return;
      if (!currentSession || currentSession.sessionId !== sessionId) return;
      if (currentSession) {
        currentSession.phase = "idle";
        currentSession.resumeFinishedAtMs = nowMs();
        recordTrace("analysis_exclusive_resume_done", normalizeMeta(meta), meta);
        archiveCurrentSession();
        currentSession = null;
      }
      persistSnapshot();
    }, 0);
  }

  function cancelExclusive(meta) {
    if (!currentSession) return;
    attachMetaToSession(currentSession, meta);
    recordTrace("analysis_exclusive_cancelled", normalizeMeta(meta), meta);
    resumeProgressively(Object.assign({}, meta || {}, { reason: "cancelled" }));
  }

  function clearAll() {
    currentSession = null;
    completedSessions = [];
    deferredTasks = [];
    deferredTaskSeq = 0;
    lateVisualTraceTarget = null;
    drainVersion += 1;
    if (drainTimerId) {
      globalScope.clearTimeout(drainTimerId);
      drainTimerId = null;
    }
    persistSnapshot();
  }

  function snapshot() {
    return {
      currentSession: cloneSession(currentSession),
      completedSessions: cloneValue(completedSessions),
      deferredTasks: deferredTasks.map(buildDeferredTaskSnapshot),
      emergencyDisabled: emergencyDisabled
    };
  }

  var persisted = readPersisted();
  if (persisted && persisted.currentSession && typeof persisted.currentSession === "object") {
    currentSession = persisted.currentSession;
  }
  if (persisted && Array.isArray(persisted.completedSessions)) {
    completedSessions = persisted.completedSessions.slice(0, COMPLETED_LIMIT);
  }
  if (persisted && persisted.emergencyDisabled === true) {
    emergencyDisabled = true;
  }

  var api = {
    requestExclusive: requestExclusive,
    markAnalysisStarted: markAnalysisStarted,
    markResultVisible: markResultVisible,
    resumeProgressively: resumeProgressively,
    cancelExclusive: cancelExclusive,
    trace: recordTrace,
    runOrDefer: runOrDefer,
    isExclusiveBlocking: isExclusiveBlocking,
    attachMeta: function attachMeta(meta) {
      return cloneSession(attachMetaToSession(ensureCurrentSession(meta), meta));
    },
    setEmergencyDisabled: function setEmergencyDisabled(flag) {
      emergencyDisabled = !!flag;
      persistSnapshot();
    },
    isEmergencyDisabled: function isEmergencyDisabled() {
      return emergencyDisabled;
    },
    clearAll: clearAll,
    snapshot: snapshot
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.AnalysisExclusiveRuntime = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
