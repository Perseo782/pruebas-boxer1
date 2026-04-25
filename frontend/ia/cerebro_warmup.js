(function initCerebroWarmupModule(globalScope) {
  "use strict";

  var DEFAULT_MAX_PINGS = 10;
  var DEFAULT_INACTIVE_STOP_MINUTES = 30;
  var DEFAULT_BACKGROUND_GRACE_MINUTES = 30;
  var DEFAULT_LONG_PAUSE_MS = 5 * 60 * 1000;
  var LOCK_NAME = "fase5_cerebro_warmup_lock";

  function nowMs() {
    return Date.now();
  }

  function clampMs(value, fallback) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return fallback;
    return Math.floor(numeric);
  }

  function asText(value) {
    return String(value || "").trim();
  }

  function createDeferred() {
    var deferred = {};
    deferred.promise = new Promise(function buildPromise(resolve) {
      deferred.resolve = resolve;
    });
    return deferred;
  }

  function createLeaseId() {
    return "warm_" + nowMs().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function readAllowedResponse(response) {
    var payload = response && typeof response === "object" ? response : {};
    var result = payload.resultado && typeof payload.resultado === "object" ? payload.resultado : {};
    return {
      ok: payload.ok === true,
      warmupAllowed: result.warmup_allowed === true,
      reason: asText(result.reason || payload.reason),
      serverTs: clampMs(result.serverTs, nowMs()),
      serverPingCount: clampMs(result.serverPingCount, 0),
      nextMinIntervalMs: clampMs(result.nextMinIntervalMs, 0)
    };
  }

  function maintenanceIntervalMs(ageMs) {
    if (ageMs < 5 * 60 * 1000) return 3 * 60 * 1000;
    if (ageMs < 15 * 60 * 1000) return 6 * 60 * 1000;
    if (ageMs < 30 * 60 * 1000) return 12 * 60 * 1000;
    return null;
  }

  function createWarmupController(options) {
    var safeOptions = options || {};
    var scope = safeOptions.globalScope || globalScope || null;
    var runtimeApi = safeOptions.runtime || (
      scope && scope.Fase5VisibleRuntime && typeof scope.Fase5VisibleRuntime.getDefaultRuntime === "function"
        ? scope.Fase5VisibleRuntime.getDefaultRuntime()
        : null
    );
    if (!runtimeApi) {
      throw new Error("Fase5VisibleRuntime no esta disponible para warm-up.");
    }

    var lockManager = safeOptions.lockManager || (scope && scope.navigator ? scope.navigator.locks : null);
    var fetchImpl = safeOptions.fetch || (scope && typeof scope.fetch === "function" ? scope.fetch.bind(scope) : null);
    var documentRef = safeOptions.documentRef || (scope && scope.document ? scope.document : null);
    var setTimeoutFn = safeOptions.setTimeout || (scope && typeof scope.setTimeout === "function" ? scope.setTimeout.bind(scope) : setTimeout);
    var clearTimeoutFn = safeOptions.clearTimeout || (scope && typeof scope.clearTimeout === "function" ? scope.clearTimeout.bind(scope) : clearTimeout);
    var inactiveStopMs = clampMs(safeOptions.inactiveStopMs, DEFAULT_INACTIVE_STOP_MINUTES * 60 * 1000);
    var backgroundGraceMs = clampMs(safeOptions.backgroundGraceMs, DEFAULT_BACKGROUND_GRACE_MINUTES * 60 * 1000);
    var maxPings = clampMs(safeOptions.maxPings, DEFAULT_MAX_PINGS);
    var longPauseMs = clampMs(safeOptions.longPauseMs, DEFAULT_LONG_PAUSE_MS);
    var eventScope = safeOptions.eventScope || scope;
    var owner = {
      timerId: null,
      release: null,
      leaseId: null,
      lockPending: false,
      destroyed: false,
      listenersReady: false
    };

    function readState() {
      return runtimeApi.readWarmupState();
    }

    function clearTimer() {
      if (owner.timerId) {
        clearTimeoutFn(owner.timerId);
        owner.timerId = null;
      }
    }

    function hasValidCredentials() {
      return !!(runtimeApi.getSessionToken() && runtimeApi.getBackendUrl() && fetchImpl);
    }

    function hasLockSupport() {
      return !!(lockManager && typeof lockManager.request === "function");
    }

    function isForeground() {
      return runtimeApi.getAppState() === "foreground";
    }

    function getActivityAgeMs(now) {
      var lastActivityTs = clampMs(runtimeApi.getLastActivityTs(), 0);
      if (!lastActivityTs) return Number.POSITIVE_INFINITY;
      return Math.max(0, now - lastActivityTs);
    }

    function currentStopMs() {
      return Math.max(inactiveStopMs, backgroundGraceMs);
    }

    function schedule(delayMs, reason, forceImmediate) {
      clearTimer();
      owner.timerId = setTimeoutFn(function runScheduledTick() {
        owner.timerId = null;
        void tick(reason || "programado", forceImmediate === true);
      }, Math.max(0, clampMs(delayMs, 0)));
    }

    function releaseOwnership(reason) {
      clearTimer();
      owner.leaseId = null;
      var release = owner.release;
      owner.release = null;
      if (release && typeof release.resolve === "function") {
        release.resolve();
      }
      runtimeApi.noteWarmupStop(reason || "detenido");
    }

    function moveToIdle(reason) {
      clearTimer();
      runtimeApi.patchWarmupState({
        status: "IDLE",
        leaseId: null,
        stoppedReason: asText(reason) || null,
        backgroundPingDone: false
      });
    }

    function handleSupportMismatch() {
      if (!hasLockSupport()) {
        runtimeApi.noteWarmupStop("web_locks_no_disponible");
        return true;
      }
      if (!fetchImpl) {
        runtimeApi.noteWarmupStop("fetch_no_disponible");
        return true;
      }
      return false;
    }

    function shouldStopByClientRules() {
      var state = readState();
      if (state.pingCount >= maxPings) {
        releaseOwnership("cliente_presupuesto_agotado");
        return true;
      }
      if (state.consecutiveErrors >= 3) {
        releaseOwnership("cliente_tres_errores");
        return true;
      }
      if (!hasValidCredentials()) {
        releaseOwnership("credenciales_no_validas");
        return true;
      }
      return false;
    }

    function computePlan(forceImmediate) {
      var state = readState();
      var now = nowMs();
      var ageMs = getActivityAgeMs(now);
      if (ageMs >= currentStopMs()) {
        return { mode: "stop", reason: "cliente_inactivo_30m" };
      }

      if (forceImmediate === true) {
        return {
          mode: "ping",
          appState: isForeground() ? "foreground" : "background"
        };
      }

      var intervalMs = maintenanceIntervalMs(ageMs);
      if (intervalMs == null) {
        return { mode: "stop", reason: "cliente_inactivo_30m" };
      }

      var minIntervalMs = Math.max(intervalMs, clampMs(state.nextMinIntervalMs, 0));
      var lastWarmupAt = clampMs(state.lastWarmupAt, 0);
      if (!lastWarmupAt) {
        return {
          mode: "ping",
          appState: isForeground() ? "foreground" : "background"
        };
      }

      var dueInMs = Math.max(0, (lastWarmupAt + minIntervalMs) - now);
      if (!isForeground()) {
        var remainingGraceMs = Math.max(0, currentStopMs() - ageMs);
        if (state.backgroundPingDone === true) {
          return {
            mode: "wait",
            delayMs: remainingGraceMs,
            reason: "background_gracia"
          };
        }
        if (dueInMs <= 0) {
          return { mode: "ping", appState: "background" };
        }
        return {
          mode: "wait",
          delayMs: Math.min(remainingGraceMs, dueInMs),
          reason: "background_espera"
        };
      }

      if (dueInMs <= 0) {
        return { mode: "ping", appState: "foreground" };
      }

      return {
        mode: "wait",
        delayMs: dueInMs,
        reason: "foreground_espera"
      };
    }

    async function callWarmup(appState) {
      var payload = {
        moduloOrigen: "Cerebro_Warmup_Visible",
        moduloDestino: "TRASTIENDA",
        accion: "warmupCerebro",
        sessionToken: runtimeApi.getSessionToken(),
        payload: {
          lastActivityTs: clampMs(runtimeApi.getLastActivityTs(), 0),
          appState: appState || runtimeApi.getAppState(),
          leaseId: owner.leaseId,
          clientPingCount: clampMs(readState().pingCount, 0)
        }
      };

      var response = await fetchImpl(runtimeApi.getBackendUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      var body = await response.json();
      if (!response.ok) {
        throw new Error("Warm-up HTTP " + String(response.status || "desconocido"));
      }
      return body;
    }

    async function tick(reason, forceImmediate) {
      if (owner.destroyed || !owner.release) return;

      var state = readState();
      if (!owner.leaseId || (state.leaseId && state.leaseId !== owner.leaseId)) {
        return;
      }

      if (shouldStopByClientRules()) return;

      var plan = computePlan(forceImmediate === true);
      if (plan.mode === "stop") {
        releaseOwnership(plan.reason);
        return;
      }
      if (plan.mode === "wait") {
        schedule(plan.delayMs, plan.reason, false);
        return;
      }

      try {
        var rawResponse = await callWarmup(plan.appState);
        var normalized = readAllowedResponse(rawResponse);
        if (!normalized.ok) {
          throw new Error(asText(rawResponse && rawResponse.error && rawResponse.error.mensaje) || "Warm-up invalido");
        }
        if (!normalized.warmupAllowed) {
          releaseOwnership(normalized.reason || "warmup_denegado");
          return;
        }

        runtimeApi.noteWarmupSuccess({
          leaseId: owner.leaseId,
          pingCount: normalized.serverPingCount,
          lastWarmupAt: normalized.serverTs,
          lastServerPingCount: normalized.serverPingCount,
          nextMinIntervalMs: normalized.nextMinIntervalMs,
          backgroundPingDone: plan.appState === "background"
        });
        var refreshed = readState();
        var nextPlan = computePlan(false);
        if (nextPlan.mode === "stop") {
          releaseOwnership(nextPlan.reason);
          return;
        }
        if (nextPlan.mode === "wait") {
          schedule(nextPlan.delayMs, nextPlan.reason, false);
          return;
        }
        schedule(Math.max(0, clampMs(refreshed.nextMinIntervalMs, 0)), "warmup_min_interval", false);
      } catch (err) {
        var nextErrors = readState().consecutiveErrors + 1;
        runtimeApi.patchWarmupState({
          consecutiveErrors: nextErrors,
          stoppedReason: asText(err && err.message) || "warmup_error"
        });
        if (nextErrors >= 3) {
          releaseOwnership("cliente_tres_errores");
          return;
        }
        schedule(60 * 1000, reason || "retry_warmup", false);
      }
    }

    async function acquireOwnership(reason, forceImmediate) {
      if (owner.destroyed || owner.release || owner.lockPending) return;
      if (!hasValidCredentials()) {
        moveToIdle("credenciales_no_validas");
        return;
      }
      if (handleSupportMismatch()) return;

      owner.lockPending = true;
      try {
        await lockManager.request(LOCK_NAME, {
          ifAvailable: true,
          mode: "exclusive"
        }, async function withLock(lock) {
          owner.lockPending = false;
          if (!lock || owner.destroyed) {
            moveToIdle("warmup_en_otra_pestana");
            return;
          }

          owner.release = createDeferred();
          owner.leaseId = createLeaseId();
          runtimeApi.noteWarmupStarted({
            leaseId: owner.leaseId,
            reason: reason || "inicio"
          });
          runtimeApi.patchWarmupState({
            leaseId: owner.leaseId,
            backgroundPingDone: false
          });
          try {
            await tick(reason || "inicio", forceImmediate === true);
            await owner.release.promise;
          } finally {
            clearTimer();
            owner.release = null;
            owner.leaseId = null;
          }
        });
      } finally {
        owner.lockPending = false;
      }
    }

    function maybeStart(reason, forceImmediate) {
      if (owner.destroyed) return;
      if (!hasValidCredentials()) {
        moveToIdle("credenciales_no_validas");
        return;
      }
      if (!hasLockSupport()) {
        runtimeApi.noteWarmupStop("web_locks_no_disponible");
        return;
      }
      if (owner.release) {
        void tick(reason || "continuar", forceImmediate === true);
        return;
      }
      void acquireOwnership(reason || "inicio", forceImmediate === true);
    }

    function stop(reason) {
      if (owner.release) {
        releaseOwnership(reason || "stop_manual");
        return;
      }
      runtimeApi.noteWarmupStop(reason || "stop_manual");
    }

    function handleActivity(eventName) {
      var previousTs = clampMs(runtimeApi.getLastActivityTs(), 0);
      var now = runtimeApi.noteActivity(eventName || "actividad_visible", nowMs());
      if (runtimeApi.getAppState() !== "foreground") return;
      if (!previousTs || (now - previousTs) >= longPauseMs) {
        maybeStart("interaccion_tras_pausa", true);
      }
    }

    function onVisibilityChange() {
      var appState = runtimeApi.getAppState();
      if (appState === "foreground") {
        runtimeApi.noteActivity("foreground", nowMs());
        runtimeApi.patchWarmupState({ backgroundPingDone: false });
        maybeStart("foreground", true);
        return;
      }
      runtimeApi.patchWarmupState({
        stoppedReason: "background_gracia",
        backgroundPingDone: readState().backgroundPingDone === true
      });
      if (owner.release) {
        schedule(0, "background_revisar", false);
      }
    }

    function onStorageChange(ev) {
      if (!ev) return;
      var key = asText(ev.key);
      if (!key || (
        key !== runtimeApi.TOKEN_STORAGE_KEY &&
        key !== runtimeApi.BACKEND_STORAGE_KEY &&
        key !== runtimeApi.LAST_ACTIVITY_STORAGE_KEY &&
        key !== runtimeApi.WARMUP_STATE_STORAGE_KEY
      )) {
        return;
      }
      if (!hasValidCredentials()) {
        stop("credenciales_no_validas");
        return;
      }
      if (runtimeApi.getAppState() === "foreground") {
        maybeStart("storage_update", false);
      }
    }

    function onRuntimeUpdate(ev) {
      var detail = ev && ev.detail ? ev.detail : {};
      if (detail.type === "realTraffic") {
        runtimeApi.patchWarmupState({
          backgroundPingDone: false,
          nextMinIntervalMs: 0
        });
        if (owner.release) {
          schedule(maintenanceIntervalMs(getActivityAgeMs(nowMs())) || 0, "trafico_real", false);
        }
        return;
      }
      if (detail.type === "sessionToken" || detail.type === "backendUrl") {
        if (!hasValidCredentials()) {
          stop("credenciales_no_validas");
          return;
        }
        if (runtimeApi.getAppState() === "foreground") {
          maybeStart("credenciales_actualizadas", true);
        }
      }
    }

    function initBindings() {
      if (owner.listenersReady || owner.destroyed) return;
      owner.listenersReady = true;
      if (documentRef && typeof documentRef.addEventListener === "function") {
        ["pointerdown", "keydown", "change", "submit"].forEach(function eachEvent(eventName) {
          documentRef.addEventListener(eventName, function onAnyActivity() {
            handleActivity(eventName);
          }, true);
        });
        documentRef.addEventListener("visibilitychange", onVisibilityChange);
      }
      if (eventScope && typeof eventScope.addEventListener === "function") {
        eventScope.addEventListener("storage", onStorageChange);
        eventScope.addEventListener("pagehide", function onPageHide() {
          stop("pagehide");
        });
        eventScope.addEventListener("beforeunload", function onUnload() {
          stop("beforeunload");
        });
        eventScope.addEventListener("fase5-visible-runtime-update", onRuntimeUpdate);
      }
      runtimeApi.noteActivity("pagina_visible", nowMs());
      if (runtimeApi.getAppState() === "foreground" && hasValidCredentials()) {
        maybeStart("pagina_visible", true);
      } else if (!hasValidCredentials()) {
        moveToIdle("credenciales_no_validas");
      }
    }

    function destroy() {
      owner.destroyed = true;
      stop("destroy");
      clearTimer();
    }

    function getSnapshot() {
      return {
        state: readState(),
        ownerActive: !!owner.release,
        lockPending: owner.lockPending,
        hasLockSupport: hasLockSupport(),
        appState: runtimeApi.getAppState()
      };
    }

    if (safeOptions.autoInit !== false && documentRef) {
      if (documentRef.readyState === "loading") {
        documentRef.addEventListener("DOMContentLoaded", initBindings);
      } else {
        initBindings();
      }
    }

    return {
      init: initBindings,
      maybeStart: maybeStart,
      stop: stop,
      destroy: destroy,
      getSnapshot: getSnapshot,
      handleActivity: handleActivity,
      onVisibilityChange: onVisibilityChange
    };
  }

  var defaultController = null;
  function getDefaultController() {
    if (!defaultController) {
      defaultController = createWarmupController();
    }
    return defaultController;
  }

  var api = {
    LOCK_NAME: LOCK_NAME,
    createWarmupController: createWarmupController,
    getDefaultController: getDefaultController,
    maintenanceIntervalMs: maintenanceIntervalMs
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroWarmup = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
