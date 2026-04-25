(function initBoxerFamilyGatewayModule(globalScope) {
  "use strict";

  var builtinBoxer2 = null;
  var builtinBoxer3 = null;
  var builtinBoxer4 = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      builtinBoxer2 = require("../../frontend/boxer2/boxer2_identidad.js");
    } catch (errRequire) {
      builtinBoxer2 = null;
    }
    try {
      builtinBoxer3 = require("../../frontend/boxer3/boxer3_peso_formato.js");
    } catch (errRequire2) {
      builtinBoxer3 = null;
    }
    try {
      builtinBoxer4 = require("../../frontend/boxer4/boxer4_alergenos.js");
    } catch (errRequire3) {
      builtinBoxer4 = null;
    }
  }
  if (!builtinBoxer2 && globalScope && globalScope.Boxer2Identidad) {
    builtinBoxer2 = globalScope.Boxer2Identidad;
  }
  if (!builtinBoxer3 && globalScope && globalScope.Boxer3PesoFormato) {
    builtinBoxer3 = globalScope.Boxer3PesoFormato;
  }
  if (!builtinBoxer4 && globalScope && globalScope.Boxer4Alergenos) {
    builtinBoxer4 = globalScope.Boxer4Alergenos;
  }

  function buildGatewayError(boxerName, message, retryable, detail) {
    var traceId = detail && detail.traceId ? detail.traceId : null;
    return {
      ok: false,
      resultado: {
        modulo: boxerName || null,
        estadoPasaporteModulo: "ROJO",
        elapsedMs: 0,
        traceId: traceId,
        datos: detail || {}
      },
      error: {
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        origin: "BoxerFamilyGateway",
        passport: "ROJO",
        message: message || "Gateway Boxer fallo.",
        retryable: !!retryable,
        tipoFallo: "desconocido"
      }
    };
  }

  async function invokeBoxer(options) {
    var safeOptions = options || {};
    var boxerName = String(safeOptions.boxer || "").trim();
    var handlers = safeOptions.handlers || {};
    var handler = handlers[boxerName];

    if (!handler && boxerName === "Boxer2_Identidad" && builtinBoxer2 && typeof builtinBoxer2.procesarAccionContrato === "function") {
      handler = builtinBoxer2.procesarAccionContrato;
    }
    if (!handler && boxerName === "Boxer3_PesoFormato" && builtinBoxer3 && typeof builtinBoxer3.procesarAccionContrato === "function") {
      handler = builtinBoxer3.procesarAccionContrato;
    }
    if (!handler && boxerName === "Boxer4_Alergenos" && builtinBoxer4 && typeof builtinBoxer4.procesarAccionContrato === "function") {
      handler = builtinBoxer4.procesarAccionContrato;
    }

    if (!boxerName) {
      return buildGatewayError(null, "Falta boxer de destino.", false, {});
    }
    if (typeof handler !== "function") {
      return buildGatewayError(boxerName, "El Boxer aun no esta conectado.", false, {
        boxer: boxerName,
        traceId: safeOptions.meta ? safeOptions.meta.traceId : null
      });
    }

    var request = {
      moduloOrigen: safeOptions.moduloOrigen || "Cerebro_Orquestador",
      moduloDestino: boxerName,
      accion: safeOptions.action || "",
      sessionToken: safeOptions.sessionToken || "",
      meta: safeOptions.meta || {},
      datos: safeOptions.datos || {}
    };

    try {
      return await handler(request, safeOptions.deps || {});
    } catch (err) {
      return buildGatewayError(boxerName, err && err.message ? err.message : "Excepcion no controlada en Boxer.", true, {
        boxer: boxerName,
        traceId: request.meta ? request.meta.traceId : null
      });
    }
  }

  var api = {
    invokeBoxer: invokeBoxer
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroBoxerFamilyGateway = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
