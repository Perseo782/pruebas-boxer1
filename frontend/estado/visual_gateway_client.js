(function initVisualGatewayClientModule(globalScope) {
  "use strict";

  var DEFAULT_BACKEND_URL = "https://europe-west1-project-a6f6b968-a591-4b1f-823.cloudfunctions.net/api";
  var BACKEND_STORAGE_KEY = "fase5_visible_backend_url";
  var REQUEST_TIMEOUT_MS = 20000;

  function asText(value) {
    return String(value || "").trim();
  }

  function resolveBackendUrl(runtime, explicitBackendUrl) {
    var explicit = asText(explicitBackendUrl);
    if (explicit) return explicit;
    if (runtime && typeof runtime.getBackendUrl === "function") {
      var runtimeUrl = asText(runtime.getBackendUrl());
      if (runtimeUrl) return runtimeUrl;
    }
    try {
      if (globalScope && globalScope.localStorage) {
        var stored = asText(globalScope.localStorage.getItem(BACKEND_STORAGE_KEY));
        if (stored) return stored;
      }
    } catch (errStorage) {
      // No-op.
    }
    return DEFAULT_BACKEND_URL;
  }

  function toClientError(action, code, message, extra) {
    return Object.assign({
      ok: false,
      action: action,
      errorCode: code,
      message: message
    }, extra || {});
  }

  function normalizeBackendResult(action, payload) {
    var safe = payload && typeof payload === "object" ? payload : {};
    if (safe.ok === true) {
      return {
        ok: true,
        action: action,
        result: safe.resultado && typeof safe.resultado === "object" ? safe.resultado : {}
      };
    }
    var error = safe.error && typeof safe.error === "object" ? safe.error : {};
    return toClientError(
      action,
      asText(error.codigo) || asText(safe.errorCode) || "VISUAL_CLIENT_REQUEST_FAILED",
      asText(error.mensaje) || asText(safe.message) || "No se pudo completar la operacion visual.",
      { raw: safe }
    );
  }

  async function callVisualGateway(input) {
    var safe = input || {};
    var action = asText(safe.action);
    var sessionToken = asText(safe.sessionToken);
    var datos = safe.datos && typeof safe.datos === "object" ? safe.datos : {};
    var runtime = safe.runtime || null;
    var backendUrl = resolveBackendUrl(runtime, safe.backendUrl);

    if (!sessionToken) {
      return toClientError(
        action || "visual_unknown",
        "VISUAL_CLIENT_SESSION_MISSING",
        "Falta sessionToken para operar con fotos."
      );
    }

    if (!action) {
      return toClientError(
        "visual_unknown",
        "VISUAL_CLIENT_PAYLOAD_INVALID",
        "Falta accion visual."
      );
    }

    if (typeof fetch !== "function") {
      return toClientError(
        action,
        "VISUAL_CLIENT_FETCH_UNAVAILABLE",
        "Este navegador no permite comunicacion web."
      );
    }

    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timeoutId = controller
      ? setTimeout(function onTimeout() { controller.abort(); }, REQUEST_TIMEOUT_MS)
      : 0;

    try {
      var response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduloOrigen: "Web_Operativa",
          moduloDestino: "VISUAL_GATEWAY",
          accion: action,
          sessionToken: sessionToken,
          payload: datos,
          datos: datos
        }),
        signal: controller ? controller.signal : undefined
      });
      if (timeoutId) clearTimeout(timeoutId);
      var rawText = await response.text();
      var payload = {};
      try {
        payload = rawText ? JSON.parse(rawText) : {};
      } catch (errJson) {
        payload = { ok: false, error: { codigo: "VISUAL_CLIENT_NON_JSON", mensaje: rawText || "Respuesta no valida." } };
      }
      var normalized = normalizeBackendResult(action, payload);
      if (normalized.ok) return normalized;
      if (response.ok) return normalized;
      return toClientError(
        action,
        normalized.errorCode || "VISUAL_CLIENT_HTTP_FAILED",
        normalized.message || "Error HTTP en operacion visual.",
        { httpStatus: response.status, raw: normalized.raw || payload }
      );
    } catch (errRequest) {
      if (timeoutId) clearTimeout(timeoutId);
      return toClientError(
        action,
        errRequest && errRequest.name === "AbortError" ? "VISUAL_CLIENT_TIMEOUT" : "VISUAL_CLIENT_REQUEST_FAILED",
        errRequest && errRequest.message ? errRequest.message : "No se pudo llamar a VISUAL_GATEWAY."
      );
    }
  }

  function createVisualGatewayClient(options) {
    var safeOptions = options || {};
    var runtime = safeOptions.runtime || null;
    var backendUrl = asText(safeOptions.backendUrl);

    return {
      visualGatewayHealthcheck: function visualGatewayHealthcheck(sessionToken) {
        return callVisualGateway({
          action: "visualHealthcheck",
          sessionToken: sessionToken,
          datos: {},
          runtime: runtime,
          backendUrl: backendUrl
        });
      },
      visualUploadAsset: function visualUploadAsset(sessionToken, productId, assetId, thumbBase64, viewerBase64, extra) {
        var safeExtra = extra && typeof extra === "object" ? extra : {};
        return callVisualGateway({
          action: "visualUploadAsset",
          sessionToken: sessionToken,
          datos: Object.assign({}, safeExtra, {
            productId: asText(productId),
            assetId: asText(assetId) || undefined,
            thumbBase64: asText(thumbBase64),
            viewerBase64: asText(viewerBase64),
            thumbContentType: asText(safeExtra.thumbContentType) || "image/webp",
            viewerContentType: asText(safeExtra.viewerContentType) || "image/webp"
          }),
          runtime: runtime,
          backendUrl: backendUrl
        });
      },
      visualGetAssetIndex: function visualGetAssetIndex(sessionToken, assetId) {
        return callVisualGateway({
          action: "visualGetAssetIndex",
          sessionToken: sessionToken,
          datos: { assetId: asText(assetId) },
          runtime: runtime,
          backendUrl: backendUrl
        });
      },
      visualGetThumb: function visualGetThumb(sessionToken, assetId) {
        return callVisualGateway({
          action: "visualGetThumb",
          sessionToken: sessionToken,
          datos: { assetId: asText(assetId) },
          runtime: runtime,
          backendUrl: backendUrl
        });
      },
      visualGetViewer: function visualGetViewer(sessionToken, assetId) {
        return callVisualGateway({
          action: "visualGetViewer",
          sessionToken: sessionToken,
          datos: { assetId: asText(assetId) },
          runtime: runtime,
          backendUrl: backendUrl
        });
      }
    };
  }

  var api = {
    DEFAULT_BACKEND_URL: DEFAULT_BACKEND_URL,
    createVisualGatewayClient: createVisualGatewayClient
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase4VisualGatewayClient = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
