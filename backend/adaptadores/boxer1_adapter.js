(function initBoxer1AdapterModule(globalScope) {
  "use strict";

  function normalizeRefName(ref) {
    var base = String(ref || "").trim();
    if (!base) return "";
    var token = base.split(/[\\/]/).pop() || base;
    token = token.replace(/\.[a-z0-9]+$/i, "");
    token = token.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    return token;
  }

  function fallbackAnalysis(fotoRefs) {
    var guessed = normalizeRefName(fotoRefs[0]);
    return {
      nombrePropuesto: guessed && guessed.length >= 3 ? guessed : "Producto por revisar",
      alergenosPropuestos: [],
      confianzaGlobal: 0.55,
      fuente: "fallback_local"
    };
  }

  async function analizarFotosParaBorrador(payload, deps) {
    var safePayload = payload || {};
    var safeDeps = deps || {};
    var fotoRefs = Array.isArray(safePayload.fotoRefs) ? safePayload.fotoRefs.filter(Boolean) : [];
    if (!fotoRefs.length) {
      return {
        ok: false,
        errorCode: "BOXER_SIN_FOTOS",
        message: "Falta al menos una foto para analisis."
      };
    }

    if (safeDeps.boxerAnalyzer && typeof safeDeps.boxerAnalyzer === "function") {
      return safeDeps.boxerAnalyzer(safePayload);
    }

    if (safeDeps.simulatedBoxerResult && typeof safeDeps.simulatedBoxerResult === "object") {
      return {
        ok: true,
        resultado: safeDeps.simulatedBoxerResult
      };
    }

    return {
      ok: true,
      resultado: fallbackAnalysis(fotoRefs)
    };
  }

  var api = {
    analizarFotosParaBorrador: analizarFotosParaBorrador
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Fase3Boxer1Adapter = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
