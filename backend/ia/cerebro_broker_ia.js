(function initCerebroBrokerIaModule(globalScope) {
  "use strict";

  var DEFAULT_MODEL = "gemini-3.1-flash-lite-preview";
  var DEFAULT_BACKEND_URL = "https://europe-west1-project-a6f6b968-a591-4b1f-823.cloudfunctions.net/api";

  function asPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeTaskList(tasks) {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter(function each(task) {
      return asPlainObject(task) && String(task.taskId || "").trim();
    });
  }

  function buildError(code, message, detail) {
    return {
      ok: false,
      code: code,
      message: message,
      detail: detail || null
    };
  }

  function buildFirebaseBody(payload) {
    var safePayload = asPlainObject(payload) ? payload : {};
    var sessionToken = String(safePayload.sessionToken || "").trim();

    return {
      moduloDestino: "TRASTIENDA",
      accion: "procesarGeminiLoteCerebro",
      sessionToken: sessionToken,
      payload: {
        analysisId: String(safePayload.analysisId || "").trim(),
        traceId: String(safePayload.traceId || "").trim(),
        modelo: String(safePayload.modelo || DEFAULT_MODEL).trim() || DEFAULT_MODEL,
        totalBoxersConvocados: Number(safePayload.totalBoxersConvocados) || 0,
        totalRespuestasContadas: Number(safePayload.totalRespuestasContadas) || 0,
        tasks: normalizeTaskList(safePayload.tasks),
        sessionToken: sessionToken,
        token: sessionToken
      }
    };
  }

  function unwrapBackendPayload(rawResponse) {
    var payload = asPlainObject(rawResponse && rawResponse.data) ? rawResponse.data : rawResponse;

    if (asPlainObject(payload && payload.resultado)) payload = payload.resultado;
    if (asPlainObject(payload && payload.data)) payload = payload.data;
    if (asPlainObject(payload && payload.respuesta)) payload = payload.respuesta;

    return payload;
  }

  function unwrapSubresponse(raw) {
    var payload = asPlainObject(raw) ? raw : null;

    if (payload && String(payload.taskId || "").trim()) return payload;
    if (payload && asPlainObject(payload.resultado) && String(payload.resultado.taskId || "").trim()) {
      return payload.resultado;
    }
    if (payload && asPlainObject(payload.respuesta) && String(payload.respuesta.taskId || "").trim()) {
      return payload.respuesta;
    }
    if (payload && asPlainObject(payload.data) && String(payload.data.taskId || "").trim()) {
      return payload.data;
    }

    if (!payload && asPlainObject(raw && raw.data)) payload = raw.data;
    if (asPlainObject(payload && payload.resultado)) payload = payload.resultado;
    if (asPlainObject(payload && payload.data) && !String(payload.taskId || "").trim()) payload = payload.data;
    return payload;
  }

  async function enviarLoteIA(payload, deps) {
    var safeDeps = deps || {};

    if (typeof safeDeps.brokerResolver === "function") {
      return safeDeps.brokerResolver(payload);
    }
    if (typeof safeDeps.iaResolver === "function") {
      return safeDeps.iaResolver(payload);
    }
    if (typeof safeDeps.backendResolver === "function") {
      return safeDeps.backendResolver(payload);
    }

    var hasExplicitBackendUrl = Object.prototype.hasOwnProperty.call(safeDeps, "backendUrl") &&
      safeDeps.backendUrl !== undefined;
    var hasExplicitFetch = Object.prototype.hasOwnProperty.call(safeDeps, "fetch") &&
      safeDeps.fetch !== undefined;
    var backendUrl = hasExplicitBackendUrl
      ? safeDeps.backendUrl
      : (safeDeps.cerebroBrokerBackendUrl ||
        (safeDeps.config && safeDeps.config.cerebroBrokerBackendUrl) ||
        (globalScope && globalScope.CEREBRO_BROKER_IA_URL) ||
        DEFAULT_BACKEND_URL);
    var fetchImpl = hasExplicitFetch
      ? safeDeps.fetch
      : (typeof fetch === "function" ? fetch.bind(globalScope) : null);

    if (!backendUrl || !fetchImpl) {
      return buildError("CER_BROKER_NO_CONFIGURADO", "Broker IA de Cerebro no configurado.");
    }

    try {
      var response = await fetchImpl(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildFirebaseBody(payload))
      });

      if (!response || response.ok !== true) {
        return buildError("CER_BROKER_HTTP_ERROR", "Broker IA devolvio HTTP no valido.", {
          status: response ? response.status : null
        });
      }

      return {
        ok: true,
        data: await response.json()
      };
    } catch (err) {
      return buildError("CER_BROKER_HTTP_ERROR", err && err.message ? err.message : "Fallo llamando Broker IA.");
    }
  }

  function validarRespuestaLote(rawResponse, expected) {
    var expectedMeta = expected || {};
    var payload = unwrapBackendPayload(rawResponse);
    if (!asPlainObject(payload)) {
      return buildError("CER_BROKER_RESPUESTA_INVALIDA", "La respuesta global del Broker no es un objeto valido.");
    }

    var analysisId = String(payload.analysisId || "").trim();
    var traceId = String(payload.traceId || "").trim();
    var geminiBatchId = String(payload.geminiBatchId || "").trim();
    var respuestas = Array.isArray(payload.respuestas)
      ? payload.respuestas
      : (Array.isArray(payload.subrespuestas)
        ? payload.subrespuestas
        : (Array.isArray(payload.tasks)
          ? payload.tasks
          : []));

    if (expectedMeta.analysisId && analysisId && analysisId !== expectedMeta.analysisId) {
      return buildError("CER_BROKER_RESPUESTA_INVALIDA", "analysisId invalido en respuesta de Broker.", {
        analysisId: analysisId
      });
    }
    if (expectedMeta.traceId && traceId && traceId !== expectedMeta.traceId) {
      return buildError("CER_BROKER_RESPUESTA_INVALIDA", "traceId invalido en respuesta de Broker.", {
        traceId: traceId
      });
    }
    if (!Array.isArray(respuestas)) {
      return buildError("CER_BROKER_RESPUESTA_INVALIDA", "La respuesta del Broker no trae subtareas.");
    }

    return {
      ok: true,
      normalized: {
        analysisId: analysisId || expectedMeta.analysisId || null,
        traceId: traceId || expectedMeta.traceId || null,
        geminiBatchId: geminiBatchId || null,
        respuestas: respuestas
      }
    };
  }

  function separarSubrespuestas(validatedResponse, expectedTasks) {
    var safeValidated = validatedResponse && validatedResponse.normalized
      ? validatedResponse.normalized
      : { respuestas: [] };
    var requestedTasks = normalizeTaskList(expectedTasks);
    var expectedByTaskId = Object.create(null);
    var byTaskId = Object.create(null);
    var rejected = [];
    var contaminadas = 0;
    var duplicadas = 0;
    var resueltas = 0;

    requestedTasks.forEach(function each(task) {
      expectedByTaskId[String(task.taskId).trim()] = task;
    });

    for (var i = 0; i < safeValidated.respuestas.length; i += 1) {
      var raw = safeValidated.respuestas[i];
      var payload = unwrapSubresponse(raw);
      if (!asPlainObject(payload)) {
        contaminadas += 1;
        rejected.push({ code: "respuesta_no_objeto", raw: raw });
        continue;
      }

      var taskId = String(payload.taskId || "").trim();
      if (!taskId || !expectedByTaskId[taskId]) {
        contaminadas += 1;
        rejected.push({ code: "taskId_no_esperado", raw: payload });
        continue;
      }
      if (byTaskId[taskId]) {
        duplicadas += 1;
        delete byTaskId[taskId];
        rejected.push({ code: "taskId_duplicado", raw: payload });
        continue;
      }

      var expected = expectedByTaskId[taskId];
      var analysisId = String(payload.analysisId || "").trim();
      var traceId = String(payload.traceId || "").trim();
      var schemaId = String(payload.schemaId || "").trim();
      var tipoTarea = String(payload.tipoTarea || "").trim();
      var moduloSolicitante = String(payload.moduloSolicitante || "").trim();

      if ((expected.analysisId && analysisId && analysisId !== expected.analysisId) ||
          (expected.traceId && traceId && traceId !== expected.traceId) ||
          (expected.schemaId && schemaId && schemaId !== expected.schemaId) ||
          (expected.tipoTarea && tipoTarea && tipoTarea !== expected.tipoTarea) ||
          (expected.moduloSolicitante && moduloSolicitante && moduloSolicitante !== expected.moduloSolicitante)) {
        contaminadas += 1;
        rejected.push({ code: "subrespuesta_contaminada", raw: payload });
        continue;
      }

      byTaskId[taskId] = payload;
      resueltas += 1;
    }

    var descartadas = 0;
    requestedTasks.forEach(function each(task) {
      if (!byTaskId[String(task.taskId).trim()]) {
        descartadas += 1;
      }
    });

    return {
      ok: true,
      byTaskId: byTaskId,
      geminiBatchId: safeValidated.geminiBatchId || null,
      resueltas: resueltas,
      contaminadas: contaminadas + duplicadas,
      descartadas: descartadas,
      rejected: rejected
    };
  }

  var api = {
    DEFAULT_MODEL: DEFAULT_MODEL,
    DEFAULT_BACKEND_URL: DEFAULT_BACKEND_URL,
    enviarLoteIA: enviarLoteIA,
    validarRespuestaLote: validarRespuestaLote,
    separarSubrespuestas: separarSubrespuestas
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroBrokerIa = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
