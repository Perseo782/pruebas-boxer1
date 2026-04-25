(function initDiagnosticoPruebas(globalScope) {
  "use strict";

  var formatter = typeof require === "function"
    ? require("./diagnostico_formatter.js")
    : (globalScope && globalScope.Fase11DiagnosticoFormatter);
  var brokerIa = typeof require === "function"
    ? require("../../backend/ia/cerebro_broker_ia.js")
    : (globalScope && globalScope.CerebroBrokerIa);

  var DEFAULT_BACKEND_URL = "https://europe-west1-project-a6f6b968-a591-4b1f-823.cloudfunctions.net/api";
  var DEFAULT_TIMEOUT_MS = 8000;
  var TINY_JPEG_BASE64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z";

  function getFetch(deps) {
    var safeDeps = deps || {};
    if (typeof safeDeps.fetch === "function") return safeDeps.fetch;
    return typeof fetch === "function" ? fetch.bind(globalScope) : null;
  }

  function getBackendUrl(deps) {
    var safeDeps = deps || {};
    return String(
      safeDeps.backendUrl ||
      (globalScope && globalScope.CEREBRO_BROKER_IA_URL) ||
      DEFAULT_BACKEND_URL
    ).trim();
  }

  function getSessionToken(deps) {
    var safeDeps = deps || {};
    return String(safeDeps.sessionToken || "").trim();
  }

  function pickErrorCode(payload) {
    var safe = payload && typeof payload === "object" ? payload : {};
    var err = safe.error && typeof safe.error === "object" ? safe.error : {};
    return err.codigo || err.code || safe.errorCode || safe.code || null;
  }

  function pickErrorMessage(payload) {
    var safe = payload && typeof payload === "object" ? payload : {};
    var err = safe.error && typeof safe.error === "object" ? safe.error : {};
    return err.mensaje || err.message || safe.message || safe.error || null;
  }

  function withTimeout(promise, timeoutMs) {
    return new Promise(function executor(resolve, reject) {
      var done = false;
      var timer = setTimeout(function onTimeout() {
        if (done) return;
        done = true;
        reject(new Error("Tiempo agotado."));
      }, Math.max(1, Number(timeoutMs || DEFAULT_TIMEOUT_MS)));
      Promise.resolve(promise).then(function ok(value) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(value);
      }).catch(function fail(err) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  async function postControl(body, deps) {
    var fetchImpl = getFetch(deps);
    if (!fetchImpl) return { ok: false, errorCode: "FETCH_NO_DISPONIBLE", message: "fetch no disponible." };
    var startedAt = Date.now();
    var response = await withTimeout(fetchImpl(getBackendUrl(deps), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    }), deps && deps.timeoutMs);
    var durationMs = Date.now() - startedAt;
    var payload = null;
    try {
      payload = response && typeof response.json === "function" ? await response.json() : null;
    } catch (errJson) {
      payload = null;
    }
    return {
      ok: !!(response && response.ok && (!payload || payload.ok !== false)),
      status: response && response.status,
      errorCode: pickErrorCode(payload),
      durationMs: durationMs,
      payload: payload,
      message: payload && payload.error
        ? String(payload.error.mensaje || payload.error.message || payload.error.codigo || "respuesta con aviso")
        : (response && response.ok ? "respuesta valida" : "respuesta no valida")
    };
  }

  function writeResult(store, moduleName, action, out) {
    var ok = out && out.ok === true;
    var rawDetail = formatter.buildRawDiagnosticDetail ? formatter.buildRawDiagnosticDetail({
      httpStatus: out && out.status,
      code: out && out.errorCode,
      message: out && out.message,
      raw: out && out.payload
    }) : "";
    if (store && typeof store.addEvent === "function") {
      store.addEvent({
        level: ok ? "INFO" : "WARN",
        module: moduleName,
        action: action,
        message: ok ? "Prueba completada." : (out && out.message ? out.message : "Prueba con aviso."),
        rawDetail: ok ? "" : rawDetail,
        durationMs: out && out.durationMs
      });
    }
    return {
      ok: ok,
      status: ok ? formatter.STATUS.OPERATIVO : formatter.STATUS.ATENCION,
      detail: ok ? "prueba completada" : (out && out.message ? out.message : "prueba con aviso"),
      rawDetail: ok ? "" : rawDetail,
      duration: formatter.formatDurationMs(out && out.durationMs)
    };
  }

  async function probarBackend(deps) {
    var store = deps && deps.store;
    if (store && typeof store.openCase === "function") store.openCase({ module: "Backend", action: "probar backend", message: "Prueba de backend iniciada." });
    var token = getSessionToken(deps);
    if (!token) {
      return writeResult(store, "Backend", "probar backend", { ok: false, message: "falta token de sesion" });
    }
    try {
      return writeResult(store, "Backend", "probar backend", await postControl({
        moduloOrigen: "Web_Operativa",
        moduloDestino: "Seguridad",
        accion: "emitirTokenFirebase",
        payload: { sessionToken: token }
      }, deps));
    } catch (err) {
      return writeResult(store, "Backend", "probar backend", { ok: false, message: err && err.message ? err.message : "fallo de backend" });
    }
  }

  async function probarIa(deps) {
    var store = deps && deps.store;
    if (store && typeof store.openCase === "function") store.openCase({ module: "IA", action: "probar IA", message: "Prueba de IA iniciada." });
    var token = getSessionToken(deps);
    if (!token) {
      return writeResult(store, "IA", "probar IA", { ok: false, message: "falta token de sesion" });
    }
    if (!brokerIa || typeof brokerIa.enviarLoteIA !== "function") {
      return writeResult(store, "IA", "probar IA", { ok: false, message: "broker IA no cargado" });
    }
    var id = "fase11_" + Date.now().toString(36);
    var expectedTask = {
      taskId: "b2_fase11_diag_ia",
      analysisId: id,
      traceId: id + "_trace",
      moduloSolicitante: "Boxer2_Identidad",
      tipoTarea: "B2_IDENTIDAD_V1",
      schemaId: "B2_IDENTIDAD_V1",
      payload: {
        textoAuditado: "Mostaza antigua",
        shortlist: [{ id: "fase11_opcion_1", literal: "Mostaza antigua" }]
      }
    };
    try {
      var started = Date.now();
      var sent = await brokerIa.enviarLoteIA({
        analysisId: id,
        traceId: id + "_trace",
        sessionToken: token,
        tasks: [expectedTask],
        modelo: brokerIa.DEFAULT_MODEL || "gemini-3.1-flash-lite-preview",
        totalBoxersConvocados: 1,
        totalRespuestasContadas: 1
      }, {
        backendUrl: getBackendUrl(deps),
        fetch: getFetch(deps),
        timeoutMs: deps && deps.timeoutMs
      });
      var durationMs = Date.now() - started;
      var payloadError = sent && sent.data && sent.data.error ? sent.data.error : null;
      if (!sent || sent.ok !== true) {
        return writeResult(store, "IA", "probar IA", {
          ok: false,
          durationMs: durationMs,
          errorCode: sent && sent.code,
          payload: sent && sent.data,
          message: sent && sent.message ? sent.message : "fallo llamando IA"
        });
      }
      var validated = brokerIa.validarRespuestaLote(sent, {
        analysisId: id,
        traceId: id + "_trace",
        tasks: [expectedTask]
      });
      if (!validated || validated.ok !== true) {
        return writeResult(store, "IA", "probar IA", {
          ok: false,
          durationMs: durationMs,
          errorCode: validated && validated.code,
          payload: sent && sent.data,
          message: validated && validated.message ? validated.message : "respuesta IA no valida para la app"
        });
      }
      var separated = brokerIa.separarSubrespuestas(validated, [expectedTask]);
      return writeResult(store, "IA", "probar IA", {
        ok: !!(separated && separated.resueltas >= 1),
        durationMs: durationMs,
        errorCode: payloadError ? (payloadError.codigo || payloadError.code || null) : null,
        payload: sent && sent.data,
        message: separated && separated.resueltas >= 1
          ? "respuesta aceptada por el filtro de la app"
          : (payloadError
            ? String(payloadError.mensaje || payloadError.message || payloadError.codigo || "IA sin subrespuesta util")
            : "IA sin subrespuesta util para la app")
      });
    } catch (err) {
      return writeResult(store, "IA", "probar IA", { ok: false, message: err && err.message ? err.message : "fallo de IA" });
    }
  }

  async function probarVision(deps) {
    var store = deps && deps.store;
    if (store && typeof store.openCase === "function") store.openCase({ module: "Vision", action: "probar Vision", message: "Prueba de Vision iniciada." });
    var token = getSessionToken(deps);
    if (!token) {
      return writeResult(store, "Vision", "probar Vision", { ok: false, message: "falta token de sesion" });
    }
    try {
      return writeResult(store, "Vision", "probar Vision", await postControl({
        moduloDestino: "TRASTIENDA",
        accion: "procesarVision",
        sessionToken: token,
        payload: {
          imageBase64: TINY_JPEG_BASE64,
          mimeType: "image/jpeg",
          sessionToken: token,
          token: token,
          modo: "diagnostico_fase11"
        }
      }, deps));
    } catch (err) {
      return writeResult(store, "Vision", "probar Vision", { ok: false, message: err && err.message ? err.message : "fallo de Vision" });
    }
  }

  async function probarSync(deps) {
    var store = deps && deps.store;
    if (store && typeof store.openCase === "function") store.openCase({ module: "Sync", action: "probar sync", message: "Prueba de sync iniciada." });
    var syncManager = deps && deps.syncManager;
    var out = syncManager && typeof syncManager.getEstado === "function"
      ? { ok: true, message: "estado sync legible" }
      : { ok: false, message: "sync no disponible en esta vista" };
    return writeResult(store, "Sync", "probar sync", out);
  }

  var api = {
    probarBackend: probarBackend,
    probarIa: probarIa,
    probarVision: probarVision,
    probarSync: probarSync
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (globalScope) globalScope.Fase11DiagnosticoPruebas = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

