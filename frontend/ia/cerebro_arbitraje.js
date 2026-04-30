(function initCerebroArbitrajeModule(globalScope) {
  "use strict";

  var contratos = null;
  var errores = null;
  var allergenCatalog = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./cerebro_contratos.js");
      errores = require("./cerebro_errores.js");
      allergenCatalog = require("../../../../shared/alergenos_oficiales.js");
    } catch (errRequire) {
      contratos = null;
      errores = null;
      allergenCatalog = null;
    }
  }
  if (!contratos && globalScope && globalScope.CerebroContratos) {
    contratos = globalScope.CerebroContratos;
  }
  if (!errores && globalScope && globalScope.CerebroErrores) {
    errores = globalScope.CerebroErrores;
  }
  if (!allergenCatalog && globalScope && globalScope.AppV2AlergenosOficiales) {
    allergenCatalog = globalScope.AppV2AlergenosOficiales;
  }

  var PASSPORTS = contratos ? contratos.PASSPORTS : { VERDE: "VERDE", NARANJA: "NARANJA", ROJO: "ROJO" };
  var IA_STATES = contratos ? contratos.IA_STATES : {
    NECESITA_LLAMADA: "NECESITA_LLAMADA",
    NO_NECESITA_LLAMADA: "NO_NECESITA_LLAMADA",
    NO_APLICA: "NO_APLICA",
    PENDIENTE_LOCAL: "PENDIENTE_LOCAL"
  };
  var SUGGESTED_ACTIONS = contratos ? contratos.SUGGESTED_ACTIONS : {
    GUARDAR_RESULTADO_ANALIZADO: "guardar_resultado_analizado",
    ABRIR_REVISION: "abrir_revision",
    BLOQUEAR_GUARDADO: "bloquear_guardado",
    ABORTAR_FLUJO: "abortar_flujo"
  };
  var DECISION_FLOW = contratos ? contratos.DECISION_FLOW : {
    GUARDAR: "guardar",
    REVISION: "revision",
    BLOQUEO: "bloqueo",
    ABORTADO: "abortado"
  };
  var ERROR_CODES = errores ? errores.ERROR_CODES : {
    CONFLICTO_MOTORES: "CER_CONFLICTO_MOTORES",
    DUPLICADO_DUDOSO: "CER_DUPLICADO_DUDOSO",
    ARBITRAJE_IMPOSIBLE: "CER_ARBITRAJE_IMPOSIBLE"
  };

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function normalizeFormat(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  function formatDisplayNumber(value) {
    var rounded = Math.round(Number(value) * 10000) / 10000;
    var text = String(rounded);
    return text.indexOf(".") >= 0 ? text.replace(/\.?0+$/, "") : text;
  }

  function normalizeDisplayUnit(unit) {
    var safe = String(unit || "").trim().toLowerCase();
    if (safe === "gr" || safe === "grs") return "g";
    if (safe === "lt" || safe === "litro" || safe === "litros") return "l";
    return safe;
  }

  function normalizeFormatForDisplay(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|grs|ml|cl|dl|l|lt|litro|litros)\b/gi, function replaceUnit(match, amount, unit) {
        var n = Number(String(amount || "").replace(",", "."));
        if (!Number.isFinite(n)) return match;
        var u = normalizeDisplayUnit(unit);
        if ((u === "g" || u === "kg") && (u === "kg" ? n * 1000 : n) >= 1000) {
          return formatDisplayNumber((u === "kg" ? n * 1000 : n) / 1000) + " kg";
        }
        if ((u === "ml" || u === "cl" || u === "dl" || u === "l") && (
          u === "l" ? n * 1000 : u === "cl" ? n * 10 : u === "dl" ? n * 100 : n
        ) >= 1000) {
          var ml = u === "l" ? n * 1000 : u === "cl" ? n * 10 : u === "dl" ? n * 100 : n;
          return formatDisplayNumber(ml / 1000) + " l";
        }
        return formatDisplayNumber(n) + " " + u;
      })
      .trim();
  }

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function uniqueStrings(list) {
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < list.length; i += 1) {
      var item = String(list[i] || "").trim();
      if (!item || seen[item]) continue;
      seen[item] = true;
      out.push(item);
    }
    return out;
  }

  function normalizeAllergenList(list) {
    if (allergenCatalog && typeof allergenCatalog.normalizeAllergenList === "function") {
      return allergenCatalog.normalizeAllergenList(list);
    }
    return uniqueStrings(Array.isArray(list) ? list : []);
  }

  function buildModuleSummary(boxerName, normalizedOutput) {
    var result = normalizedOutput.resultado || {};
    var datos = result.datos || {};
    var taskList = Array.isArray(normalizedOutput.tareasIA) ? normalizedOutput.tareasIA : [];
    return {
      modulo: boxerName,
      ok: normalizedOutput.ok === true,
      passport: result.estadoPasaporteModulo || PASSPORTS.ROJO,
      confidence: result.confidence || "media",
      requiereRevision: !!result.requiereRevision,
      estadoIA: normalizedOutput.estadoIA || IA_STATES.NO_NECESITA_LLAMADA,
      tareasIA: taskList,
      huboTareaIA: taskList.length > 0,
      taskIds: taskList.map(function each(task) { return task && task.taskId ? String(task.taskId) : null; }).filter(Boolean),
      resultadoLocal: normalizedOutput.resultadoLocal || null,
      datos: datos,
      error: normalizedOutput.error || null,
      elapsedMs: result.elapsedMs || 0
    };
  }

  function buildModuleSnapshot(summary) {
    var safeSummary = summary || {};
    var datos = safeSummary.datos || {};
    return {
      modulo: safeSummary.modulo || "",
      estadoPasaporteModulo: safeSummary.passport || PASSPORTS.ROJO,
      estadoIA: safeSummary.estadoIA || IA_STATES.NO_NECESITA_LLAMADA,
      elapsedMs: Math.max(0, Number(safeSummary.elapsedMs) || 0),
      huboTareaIA: !!safeSummary.huboTareaIA,
      taskIds: Array.isArray(safeSummary.taskIds) ? safeSummary.taskIds.slice() : [],
      requiereRevision: !!safeSummary.requiereRevision,
      conflictosPropios: uniqueStrings([].concat(
        Array.isArray(datos.alertas) ? datos.alertas : [],
        Array.isArray(datos.conflictos) ? datos.conflictos : [],
        datos.motivo_duda ? [datos.motivo_duda] : [],
        datos.motivoDuda ? [datos.motivoDuda] : []
      )),
      warning: datos.motivo_duda || datos.motivoDuda || "",
      confidence: safeSummary.confidence || "media",
      resultadoLocal: safeSummary.resultadoLocal ? clone(safeSummary.resultadoLocal) : {
        estadoPasaporteModulo: safeSummary.passport || PASSPORTS.ROJO,
        confidence: safeSummary.confidence || "media",
        requiereRevision: !!safeSummary.requiereRevision,
        elapsedMs: Math.max(0, Number(safeSummary.elapsedMs) || 0),
        datos: clone(datos || {})
      }
    };
  }

  function boxer1Usable(summary) {
    if (!summary || summary.ok !== true) return false;
    if (summary.passport === PASSPORTS.ROJO) return false;
    return !!(summary.datos.textoAuditado || summary.datos.textoBaseVision);
  }

  function getProposal(summaries) {
    var boxer2 = summaries.boxer2 ? summaries.boxer2.datos : {};
    var boxer3 = summaries.boxer3 ? summaries.boxer3.datos : {};
    var boxer4 = summaries.boxer4 ? summaries.boxer4.datos : {};
    var formato = normalizeFormatForDisplay(boxer3.formato || boxer3.formato_normalizado || "");

    return {
      nombre: boxer2.nombre || boxer2.nombrePropuesto || boxer2.nombreProducto || "",
      formato: formato,
      tipoFormato: boxer3.tipo || "desconocido",
      alergenos: normalizeAllergenList(boxer4.alergenos),
      trazas: normalizeAllergenList(boxer4.trazas)
    };
  }

  function collectDudas(summaries) {
    var list = [];
    Object.keys(summaries).forEach(function each(key) {
      var item = summaries[key];
      if (!item) return;
      if (Array.isArray(item.datos.dudas)) list = list.concat(item.datos.dudas);
      if (Array.isArray(item.datos.alertas)) list = list.concat(item.datos.alertas);
      if (item.datos.motivo_duda) list.push(String(item.datos.motivo_duda));
      if (item.requiereRevision) list.push("revision_" + item.modulo.toLowerCase());
    });
    return uniqueStrings(list);
  }

  function collectConflicts(summaries, proposal) {
    var conflicts = [];

    if (!proposal.nombre) {
      conflicts.push("nombre_no_resuelto");
    }
    if (!proposal.formato) {
      conflicts.push("formato_no_resuelto");
    }

    if (summaries.boxer3 && summaries.boxer3.datos.conflictoComercial) {
      conflicts.push("conflicto_comercial_formato");
    }
    if (summaries.boxer2 && summaries.boxer2.datos.conflictoIdentidad) {
      conflicts.push("conflicto_identidad");
    }
    if (summaries.boxer4 && (summaries.boxer4.datos.conflictoSanitario || summaries.boxer4.datos.alertaSanitaria)) {
      conflicts.push("conflicto_sanitario");
    }

    return uniqueStrings(conflicts);
  }

  function detectPossibleDuplicate(inputData, proposal, deps) {
    if (deps && typeof deps.duplicateDetector === "function") {
      var custom = deps.duplicateDetector({ inputData: inputData, proposal: proposal });
      if (custom && typeof custom === "object") {
        return {
          posibleDuplicado: !!custom.posibleDuplicado,
          fusionable: !!custom.fusionable,
          coincidencias: Array.isArray(custom.coincidencias) ? custom.coincidencias : []
        };
      }
    }

    var list = Array.isArray(inputData.posiblesDuplicados) ? inputData.posiblesDuplicados : [];
    var matches = [];
    var proposalName = normalizeText(proposal.nombre);
    var proposalFormat = normalizeText(proposal.formato);

    for (var i = 0; i < list.length; i += 1) {
      var item = list[i] || {};
      var itemName = normalizeText(item.nombre || item.nombreProducto || "");
      var itemFormat = normalizeText(item.formato || "");
      if (!proposalName || !itemName) continue;
      if (proposalName === itemName && (!proposalFormat || !itemFormat || proposalFormat === itemFormat)) {
        matches.push({
          id: item.id || item.productId || null,
          nombre: item.nombre || item.nombreProducto || null,
          formato: item.formato || null
        });
      }
    }

    return {
      posibleDuplicado: matches.length > 0,
      fusionable: false,
      coincidencias: matches
    };
  }

  function classifyDecision(input) {
    var boxer1 = input.boxer1;
    var boxer2 = input.boxer2;
    var boxer3 = input.boxer3;
    var boxer4 = input.boxer4;
    var proposal = input.proposal;
    var possibleDuplicate = input.possibleDuplicate;
    var mergeableDuplicate = !!input.mergeableDuplicate;
    var conflicts = input.conflicts;
    var dudas = input.dudas;

    if (!boxer1Usable(boxer1)) {
      return {
        passport: PASSPORTS.ROJO,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        decisionFlow: DECISION_FLOW.ABORTADO,
        errorCode: ERROR_CODES.ARBITRAJE_IMPOSIBLE,
        failType: "irrecuperable_por_diseno",
        conflicts: uniqueStrings(conflicts.concat(["boxer1_no_utilizable"])),
        dudas: dudas,
        posibleDuplicado: false
      };
    }

    if (boxer4 && boxer4.passport === PASSPORTS.ROJO) {
      return {
        passport: PASSPORTS.ROJO,
        suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        decisionFlow: DECISION_FLOW.BLOQUEO,
        errorCode: ERROR_CODES.ARBITRAJE_IMPOSIBLE,
        failType: "irrecuperable_por_diseno",
        conflicts: uniqueStrings(conflicts.concat(["perfil_sanitario_no_confiable"])),
        dudas: dudas,
        posibleDuplicado: false
      };
    }

    if ((boxer2 && boxer2.passport === PASSPORTS.ROJO) || (boxer3 && boxer3.passport === PASSPORTS.ROJO)) {
      return {
        passport: PASSPORTS.ROJO,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        decisionFlow: DECISION_FLOW.ABORTADO,
        errorCode: ERROR_CODES.ARBITRAJE_IMPOSIBLE,
        failType: "reparacion_agotada",
        conflicts: uniqueStrings(conflicts.concat(["motor_especializado_no_utilizable"])),
        dudas: dudas,
        posibleDuplicado: false
      };
    }

    if (possibleDuplicate && !mergeableDuplicate) {
      return {
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        decisionFlow: DECISION_FLOW.REVISION,
        errorCode: ERROR_CODES.DUPLICADO_DUDOSO,
        failType: "desconocido",
        conflicts: uniqueStrings(conflicts.concat(["posible_duplicado"])),
        dudas: dudas,
        posibleDuplicado: true
      };
    }

    if (conflicts.indexOf("conflicto_sanitario") >= 0) {
      return {
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        decisionFlow: DECISION_FLOW.REVISION,
        errorCode: ERROR_CODES.CONFLICTO_MOTORES,
        failType: "desconocido",
        conflicts: conflicts,
        dudas: dudas,
        posibleDuplicado: false
      };
    }

    if ((boxer1 && boxer1.passport === PASSPORTS.NARANJA) ||
        (boxer2 && boxer2.passport === PASSPORTS.NARANJA) ||
        (boxer3 && boxer3.passport === PASSPORTS.NARANJA) ||
        (boxer4 && boxer4.passport === PASSPORTS.NARANJA) ||
        conflicts.length > 0 ||
        dudas.length > 0 ||
        !proposal.nombre ||
        !proposal.formato) {
      return {
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        decisionFlow: DECISION_FLOW.REVISION,
        errorCode: ERROR_CODES.CONFLICTO_MOTORES,
        failType: "desconocido",
        conflicts: conflicts,
        dudas: dudas,
        posibleDuplicado: false
      };
    }

    return {
      passport: PASSPORTS.VERDE,
      suggestedAction: SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO,
      decisionFlow: DECISION_FLOW.GUARDAR,
      errorCode: null,
      failType: null,
      conflicts: conflicts,
      dudas: dudas,
      posibleDuplicado: false
    };
  }

  function buildLightDuplicateMatches(list) {
    var safeList = Array.isArray(list) ? list : [];
    return safeList.map(function each(item) {
      var safeItem = item || {};
      return {
        id: safeItem.id || null,
        nombre: safeItem.nombre || "",
        formato: safeItem.formato || ""
      };
    });
  }

  function buildRevisionData(dudas, conflicts, summaries, overrideRoiRefs) {
    var boxer1Data = summaries && summaries.boxer1 ? (summaries.boxer1.datos || {}) : {};
    var roiRefs = Array.isArray(overrideRoiRefs)
      ? overrideRoiRefs
      : (Array.isArray(boxer1Data.roiRefsRevision) ? boxer1Data.roiRefsRevision : []);
    var safeDudas = uniqueStrings(Array.isArray(dudas) ? dudas : []);
    var safeConflicts = uniqueStrings(Array.isArray(conflicts) ? conflicts : []);
    return {
      dudas: safeDudas,
      conflictos: safeConflicts,
      roiRefsRevision: uniqueStrings(roiRefs),
      motivoPrincipal: safeConflicts[0] || safeDudas[0] || ""
    };
  }

  function addReviewTarget(targets, target) {
    if (!target || targets.indexOf(target) >= 0) return;
    targets.push(target);
  }

  function moduleNeedsReview(summary) {
    if (!summary) return false;
    var passport = String(summary.passport || summary.estadoPasaporteModulo || "").trim().toUpperCase();
    return passport === PASSPORTS.NARANJA || passport === PASSPORTS.ROJO;
  }

  function collectReviewTargetsFromModules(summaries) {
    var safeSummaries = summaries || {};
    var targets = [];
    if (moduleNeedsReview(safeSummaries.boxer2)) addReviewTarget(targets, "nombre");
    if (moduleNeedsReview(safeSummaries.boxer3)) addReviewTarget(targets, "formato");
    if (moduleNeedsReview(safeSummaries.boxer4)) addReviewTarget(targets, "alergenos");
    if (moduleNeedsReview(safeSummaries.boxer1)) addReviewTarget(targets, "analisis");
    return targets;
  }

  function collectReviewTargetsFromReasons(revisionData) {
    var safeRevision = revisionData || {};
    var motivos = []
      .concat(Array.isArray(safeRevision.conflictos) ? safeRevision.conflictos : [])
      .concat(Array.isArray(safeRevision.dudas) ? safeRevision.dudas : []);
    var joined = String(motivos.join(" ") || "").toLowerCase();
    var targets = [];
    if (joined.indexOf("nombre") >= 0 || joined.indexOf("marca") >= 0) addReviewTarget(targets, "nombre");
    if (joined.indexOf("peso") >= 0 || joined.indexOf("formato") >= 0) addReviewTarget(targets, "formato");
    if (joined.indexOf("alergen") >= 0 || joined.indexOf("traza") >= 0 || joined.indexOf("sanitario") >= 0) {
      addReviewTarget(targets, "alergenos");
    }
    return targets;
  }

  function buildReviewTargetText(targets) {
    var safeTargets = Array.isArray(targets) ? targets : [];
    var labels = [];
    if (safeTargets.indexOf("nombre") >= 0) labels.push("nombre");
    if (safeTargets.indexOf("formato") >= 0) labels.push("formato");
    if (safeTargets.indexOf("alergenos") >= 0) labels.push("alergenos");
    if (safeTargets.indexOf("analisis") >= 0) labels.push("analisis");
    if (!labels.length) return "Revision requerida";
    if (labels.length === 1) return "Revisa " + labels[0];
    return "Revisa " + labels.slice(0, -1).join(", ") + " y " + labels[labels.length - 1];
  }

  function buildShortPassportMessage(decision, revisionData, summaries) {
    var safeDecision = decision || {};
    var passport = String(safeDecision.passport || PASSPORTS.ROJO).trim().toUpperCase();
    if (passport === PASSPORTS.VERDE) return "";

    var targets = collectReviewTargetsFromModules(summaries);
    if (!targets.length) targets = collectReviewTargetsFromReasons(revisionData);
    return buildReviewTargetText(targets);
  }

  function buildDecisionData(decision, revisionData, summaries) {
    var safeDecision = decision || {};
    return {
      pasaporte: safeDecision.passport || PASSPORTS.ROJO,
      decisionFlujo: safeDecision.decisionFlow || DECISION_FLOW.ABORTADO,
      accionSugerida: safeDecision.suggestedAction || SUGGESTED_ACTIONS.ABORTAR_FLUJO,
      mensajePasaporteCorto: buildShortPassportMessage(safeDecision, revisionData, summaries),
      requiereRevisionGlobal: (safeDecision.decisionFlow || DECISION_FLOW.ABORTADO) !== DECISION_FLOW.GUARDAR ||
        revisionData.conflictos.length > 0 ||
        revisionData.dudas.length > 0
    };
  }

  function buildFinalData(meta, summaries, decision, duplicateInfo, iaInfo) {
    var proposal = getProposal(summaries);
    var proposalAlergenos = normalizeAllergenList(proposal.alergenos);
    var proposalTrazas = normalizeAllergenList(proposal.trazas);
    var safeIa = iaInfo || {};
    var revisionData = buildRevisionData(decision.dudas, decision.conflicts, summaries, null);
    var snapshots = {
      boxer1: summaries.boxer1 ? buildModuleSnapshot(summaries.boxer1) : null,
      boxer2: summaries.boxer2 ? buildModuleSnapshot(summaries.boxer2) : null,
      boxer3: summaries.boxer3 ? buildModuleSnapshot(summaries.boxer3) : null,
      boxer4: summaries.boxer4 ? buildModuleSnapshot(summaries.boxer4) : null
    };
    return {
      schemaVersion: "CEREBRO_JSON_MAESTRO_V1",
      analysisId: meta.analysisId,
      traceId: meta.traceId || null,
      elapsedMs: Math.max(0, Number(meta.elapsedMs) || 0),
      decision: buildDecisionData(decision, revisionData, summaries),
      propuestaFinal: {
        nombre: proposal.nombre || "",
        nombreNormalizado: normalizeText(proposal.nombre || ""),
        formato: proposal.formato || "",
        formatoNormalizado: normalizeFormat(proposal.formato || ""),
        tipoFormato: proposal.tipoFormato || "desconocido",
        alergenos: proposalAlergenos,
        trazas: proposalTrazas,
        requiereRevision: decision.decisionFlow !== DECISION_FLOW.GUARDAR
      },
      revision: revisionData,
      duplicados: {
        posibleDuplicado: !!(duplicateInfo && duplicateInfo.posibleDuplicado),
        fusionable: !!(duplicateInfo && duplicateInfo.fusionable),
        coincidencias: buildLightDuplicateMatches(duplicateInfo && duplicateInfo.coincidencias)
      },
      ia: {
        huboLlamada: !!safeIa.huboLlamada,
        geminiBatchId: safeIa.geminiBatchId || null,
        totalBoxersConvocados: Math.max(0, Number(safeIa.totalBoxersConvocados) || 0),
        totalRespuestasContadas: Math.max(0, Number(safeIa.totalRespuestasContadas) || 0),
        tareasSolicitadas: Math.max(0, Number(safeIa.tareasSolicitadas) || 0),
        tareasResueltas: Math.max(0, Number(safeIa.tareasResueltas) || 0),
        tareasContaminadas: Math.max(0, Number(safeIa.tareasContaminadas) || 0),
        tareasDescartadas: Math.max(0, Number(safeIa.tareasDescartadas) || 0)
      },
      modulos: snapshots
    };
  }

  function buildFailureFinalData(meta, options) {
    var safeMeta = meta || {};
    var safeOptions = options || {};
    var proposal = safeOptions.propuestaFinal || {};
    var proposalAlergenos = normalizeAllergenList(proposal.alergenos);
    var proposalTrazas = normalizeAllergenList(proposal.trazas);
    var revisionData = buildRevisionData(
      safeOptions.dudas,
      safeOptions.conflicts,
      safeOptions.summaries || {},
      safeOptions.roiRefsRevision
    );
    var snapshots = safeOptions.modulos || {
      boxer1: null,
      boxer2: null,
      boxer3: null,
      boxer4: null
    };

    return {
      schemaVersion: "CEREBRO_JSON_MAESTRO_V1",
      analysisId: safeMeta.analysisId || null,
      traceId: safeMeta.traceId || null,
      elapsedMs: Math.max(0, Number(safeMeta.elapsedMs) || 0),
      decision: buildDecisionData({
        passport: safeOptions.passport || PASSPORTS.ROJO,
        decisionFlow: safeOptions.decisionFlow || DECISION_FLOW.ABORTADO,
        suggestedAction: safeOptions.suggestedAction || SUGGESTED_ACTIONS.ABORTAR_FLUJO
      }, revisionData),
      propuestaFinal: {
        nombre: proposal.nombre || "",
        nombreNormalizado: normalizeText(proposal.nombre || ""),
        formato: proposal.formato || "",
        formatoNormalizado: normalizeFormat(proposal.formato || ""),
        tipoFormato: proposal.tipoFormato || "desconocido",
        alergenos: proposalAlergenos,
        trazas: proposalTrazas,
        requiereRevision: (safeOptions.decisionFlow || DECISION_FLOW.ABORTADO) !== DECISION_FLOW.GUARDAR
      },
      revision: revisionData,
      duplicados: {
        posibleDuplicado: !!safeOptions.posibleDuplicado,
        fusionable: !!safeOptions.duplicadoFusionable,
        coincidencias: buildLightDuplicateMatches(safeOptions.coincidencias)
      },
      ia: {
        huboLlamada: false,
        geminiBatchId: null,
        totalBoxersConvocados: 0,
        totalRespuestasContadas: 0,
        tareasSolicitadas: 0,
        tareasResueltas: 0,
        tareasContaminadas: 0,
        tareasDescartadas: 0
      },
      modulos: snapshots
    };
  }

  var api = {
    buildModuleSummary: buildModuleSummary,
    boxer1Usable: boxer1Usable,
    getProposal: getProposal,
    collectDudas: collectDudas,
    collectConflicts: collectConflicts,
    buildShortPassportMessage: buildShortPassportMessage,
    detectPossibleDuplicate: detectPossibleDuplicate,
    classifyDecision: classifyDecision,
    buildFinalData: buildFinalData,
    buildFailureFinalData: buildFailureFinalData,
    buildModuleSnapshot: buildModuleSnapshot
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroArbitraje = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
