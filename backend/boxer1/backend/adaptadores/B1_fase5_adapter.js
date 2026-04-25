/**
 * =====================================================================
 * BOXER 1 v2 · ADAPTADOR FASE 5
 * =====================================================================
 * Mantiene fuera del core el contrato de transporte hacia Broker IA.
 * =====================================================================
 */

var B1_FASE5_ESTADO_IA = Object.freeze({
  NECESITA_LLAMADA: 'NECESITA_LLAMADA',
  NO_NECESITA_LLAMADA: 'NO_NECESITA_LLAMADA',
  NO_APLICA: 'NO_APLICA',
  PENDIENTE_LOCAL: 'PENDIENTE_LOCAL'
});

var B1_FASE5_TIPO_TAREA = Object.freeze({
  RESCATE_OCR: 'B1_RESCATE_OCR_V1'
});

function B1_fase5TaskIdRescate() {
  return 'b1_r01';
}

function B1_fase5CrearSolicitudRescateIA(loteRescate, textoBase, traceId, analysisId) {
  return B1_construirTareaIARescate(
    loteRescate,
    textoBase,
    traceId,
    analysisId
  );
}

function B1_fase5CrearSalidaLocal(params) {
  params = params || {};
  return {
    modulo: B1_CONFIG.MODULE_NAME,
    estadoIA: params.estadoIA || B1_FASE5_ESTADO_IA.NO_NECESITA_LLAMADA,
    tareasIA: Array.isArray(params.tareasIA) ? params.tareasIA : [],
    resultadoLocal: params.resultadoLocal || {},
    traceId: params.traceId || null,
    elapsedMs: params.elapsedMs || 0
  };
}

function B1_fase5NormalizarPayloadSubrespuesta(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.data && typeof raw.data === 'object') return raw.data;
  if (raw.resultado && typeof raw.resultado === 'object') return raw.resultado;
  return raw;
}

function B1_fase5ValidarSubrespuestaIARescate(subrespuestaIA, esperado) {
  esperado = esperado || {};

  var payload = B1_fase5NormalizarPayloadSubrespuesta(subrespuestaIA);
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      reason: 'Subrespuesta IA vacia o invalida.'
    };
  }

  if (esperado.analysisId && payload.analysisId && payload.analysisId !== esperado.analysisId) {
    return {
      ok: false,
      reason: 'analysisId no coincide.'
    };
  }
  if (esperado.traceId && payload.traceId && payload.traceId !== esperado.traceId) {
    return {
      ok: false,
      reason: 'traceId no coincide.'
    };
  }
  if (esperado.taskId && payload.taskId && payload.taskId !== esperado.taskId) {
    return {
      ok: false,
      reason: 'taskId no coincide.'
    };
  }

  if (payload.moduloSolicitante && payload.moduloSolicitante !== B1_CONFIG.MODULE_NAME) {
    return {
      ok: false,
      reason: 'moduloSolicitante invalido.'
    };
  }
  if (payload.tipoTarea && payload.tipoTarea !== B1_FASE5_TIPO_TAREA.RESCATE_OCR) {
    return {
      ok: false,
      reason: 'tipoTarea invalido.'
    };
  }
  if (payload.schemaId && payload.schemaId !== B1_FASE5_TIPO_TAREA.RESCATE_OCR) {
    return {
      ok: false,
      reason: 'schemaId invalido.'
    };
  }

  var data = payload.data && typeof payload.data === 'object' ? payload.data : payload;
  if (!Array.isArray(data.correcciones)) {
    return {
      ok: false,
      reason: 'Falta array correcciones.'
    };
  }

  return {
    ok: true,
    data: data
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    B1_FASE5_ESTADO_IA: B1_FASE5_ESTADO_IA,
    B1_FASE5_TIPO_TAREA: B1_FASE5_TIPO_TAREA,
    B1_fase5TaskIdRescate: B1_fase5TaskIdRescate,
    B1_fase5CrearSolicitudRescateIA: B1_fase5CrearSolicitudRescateIA,
    B1_fase5CrearSalidaLocal: B1_fase5CrearSalidaLocal,
    B1_fase5ValidarSubrespuestaIARescate: B1_fase5ValidarSubrespuestaIARescate
  };
}
