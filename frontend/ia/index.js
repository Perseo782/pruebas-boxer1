(function initCerebroIndexModule(globalScope) {
  "use strict";

  var api = null;
  if (typeof module !== "undefined" && module.exports) {
    api = {
      contratos: require("./cerebro_contratos.js"),
      errores: require("./cerebro_errores.js"),
      arbitraje: require("./cerebro_arbitraje.js"),
      metricas: require("./cerebro_metricas.js"),
      orquestador: require("./cerebro_orquestador.js")
    };
    module.exports = api;
  } else if (globalScope) {
    api = {
      contratos: globalScope.CerebroContratos,
      errores: globalScope.CerebroErrores,
      arbitraje: globalScope.CerebroArbitraje,
      metricas: globalScope.CerebroMetricas,
      orquestador: globalScope.CerebroOrquestador
    };
    globalScope.CerebroFase5 = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
