/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · ORQUESTADOR PRINCIPAL
 * ═══════════════════════════════════════════════════════════════
 * Archivos necesarios (cargar en este orden):
 *   1. B1_enums.js
 *   2. B1_contratos.js
 *   3. B1_diagnostico.js
 *   4. B1_prechequeo.js
 *   5. B1_ocr_base.js
 *   6. B1_fiabilidad.js
 *   7. B1_slots.js
 *   8. B1_rescate.js
 *   9. B1_merge.js
 *  10. B1_core.js
 * ═══════════════════════════════════════════════════════════════
 */

function _B1_timing(stageStart, totalStart) {
  return {
    stageElapsedMs: Date.now() - stageStart,
    totalElapsedMs: Date.now() - totalStart
  };
}

function _B1_crearMetricasActuales(tiemposProceso, params = {}) {
  const elapsedMs = params.elapsedMs ?? 0;
  return B1_crearMetricas({
    pageConfidence: params.pageConfidence ?? null,
    criticalZoneScore: params.criticalZoneScore ?? null,
    slotsEnviados: params.slotsEnviados ?? 0,
    slotsDevueltos: params.slotsDevueltos ?? 0,
    mergeStatus: params.mergeStatus ?? B1_MERGE_STATUS.NO_INTENTADO,
    rescatesIntentados: params.rescatesIntentados ?? 0,
    rescatesAplicados: params.rescatesAplicados ?? 0,
    elapsedMs,
    abortReason: params.abortReason ?? null,
    tiempos: B1_exportarTiemposProceso(tiemposProceso, elapsedMs)
  });
}

async function B1_analizar(input, config) {
  const traceId = B1_generarTraceId();
  const startTime = Date.now();
  const diag = (typeof B1_crearBufferDiagnostico === 'function') ? B1_crearBufferDiagnostico(traceId) : null;
  const tiemposProceso = {
    cliente: {},
    upstream: {
      vision: null,
      gemini: null
    },
    estimaciones: {}
  };

  const validacion = B1_validarEntrada(input);
  if (!validacion.valid) {
    const elapsedMs = Date.now() - startTime;
    return B1_crearRespuestaError({
      code: B1_ERRORES.ERROR_INTERNO,
      message: validacion.reason,
      tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
      retryable: false,
      traceId,
      elapsedMs,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.PEDIR_DATO_AL_USUARIO,
      motivo: 'Entrada incompleta o con valores no permitidos.',
      metricas: _B1_crearMetricasActuales(tiemposProceso, { elapsedMs, abortReason: 'entrada_invalida' }),
      diagnostico: B1_exportarDiagnostico(diag)
    });
  }

  const validacionConfig = B1_validarConfig(config);
  if (!validacionConfig.valid) {
    const elapsedMs = Date.now() - startTime;
    if (typeof B1_diagModoSeguro === 'function') B1_diagModoSeguro(diag, { stageElapsedMs: elapsedMs, totalElapsedMs: elapsedMs }, validacionConfig.reason);
    return B1_crearRespuestaError({
      code: B1_ERRORES.ERROR_INTERNO,
      message: validacionConfig.reason,
      tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
      retryable: false,
      traceId,
      elapsedMs,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.PEDIR_DATO_AL_USUARIO,
      motivo: 'Configuración inválida de Boxer 1.',
      metricas: _B1_crearMetricasActuales(tiemposProceso, { elapsedMs, abortReason: 'config_invalida' }),
      diagnostico: B1_exportarDiagnostico(diag)
    });
  }

  const datos = validacion.datos;
  const cfg = validacionConfig.config;
  const cronometro = B1_crearCronometro(datos.timeBudgetMs);

  let textoBase = '';
  let ocrNormalizado = null;
  let canvasListo = null;

  try {
    const prechequeoStageStart = Date.now();
    const prechequeo = await B1_prechequeo(datos.imageRef, cronometro);
    Object.assign(tiemposProceso.cliente, prechequeo.tiempos || {});
    B1_diagPrechequeo(diag, prechequeo.ok, prechequeo.problemas || [], {
      stageElapsedMs: prechequeo.tiempos?.t_total_prechequeo_ms ?? (Date.now() - prechequeoStageStart),
      totalElapsedMs: Date.now() - startTime
    });

    if (!prechequeo.ok) {
      const elapsedMs = Date.now() - startTime;
      return B1_crearRespuestaError({
        code: B1_ERRORES.IMAGEN_INVALIDA,
        message: prechequeo.abortReason || 'Foto imposible de procesar por mala calidad.',
        tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        traceId,
        elapsedMs,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CORTE_TEMPRANO,
        motivo: 'La imagen no cumple los mínimos de calidad.',
        detail: { problemas: prechequeo.problemas, metricas: prechequeo.metricasImagen },
        metricas: _B1_crearMetricasActuales(tiemposProceso, {
          elapsedMs,
          abortReason: prechequeo.abortReason || 'imagen_invalida'
        }),
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    canvasListo = prechequeo.canvas;

    if (cronometro.expired()) {
      return _respuestaTimeout('antes_ocr', traceId, startTime, textoBase, null, diag, tiemposProceso);
    }

    const ocrStageStart = Date.now();
    let llamadaVision;
    try {
      llamadaVision = await B1_llamarVisionOCR(canvasListo, datos.sendMode, input.sessionToken, cfg.urlTrastienda);
    } catch (err) {
      const elapsedMs = Date.now() - startTime;
      B1_diagEncadenado(diag, err.upstreamCode || 'UPSTREAM_UNKNOWN', err.upstreamModule || 'TRASTIENDA', _B1_timing(ocrStageStart, startTime));
      return B1_crearRespuestaError({
        code: B1_ERRORES.OCR_FAILED,
        message: `Fallo en Vision OCR: ${err.message}`,
        tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
        retryable: true,
        traceId,
        elapsedMs,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.REINTENTAR,
        chainedFrom: err.upstreamCode || null,
        errorOriginal: { upstreamModule: err.upstreamModule || null, raw: err.raw || null },
        metricas: _B1_crearMetricasActuales(tiemposProceso, { elapsedMs, abortReason: 'vision_ocr_fallido' }),
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    Object.assign(tiemposProceso.cliente, llamadaVision.tiempos?.cliente || {});
    tiemposProceso.upstream.vision = llamadaVision.tiempos?.upstream || null;
    Object.assign(tiemposProceso.estimaciones, llamadaVision.tiempos?.estimaciones || {});

    const normalizarStageStart = Date.now();
    ocrNormalizado = B1_normalizarOCR(llamadaVision.respuestaTrastienda);
    textoBase = B1_construirTextoBase(ocrNormalizado);
    tiemposProceso.cliente.t_normalizar_ocr_ms = Date.now() - normalizarStageStart;
    tiemposProceso.cliente.t_ocr_total_ms = Date.now() - ocrStageStart;

    B1_diagOCR(diag, ocrNormalizado.visionVacia, ocrNormalizado.totalPalabras, {
      stageElapsedMs: tiemposProceso.cliente.t_ocr_total_ms,
      totalElapsedMs: Date.now() - startTime
    });

    if (ocrNormalizado.visionVacia) {
      const elapsedMs = Date.now() - startTime;
      return B1_crearRespuestaError({
        code: B1_ERRORES.OCR_VACIO,
        message: 'Vision no detectó texto en la imagen.',
        tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        traceId,
        elapsedMs,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CORTE_TEMPRANO,
        textoBaseVision: '',
        motivo: 'La imagen no contiene texto detectable.',
        metricas: _B1_crearMetricasActuales(tiemposProceso, { elapsedMs, abortReason: 'ocr_vacio' }),
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    const fiabilidadStageStart = Date.now();
    const fiabilidad = B1_medirFiabilidad(ocrNormalizado, datos.sensitivityMode);
    tiemposProceso.cliente.t_fiabilidad_ms = Date.now() - fiabilidadStageStart;
    B1_diagFiabilidad(diag, fiabilidad, {
      stageElapsedMs: tiemposProceso.cliente.t_fiabilidad_ms,
      totalElapsedMs: Date.now() - startTime
    });

    if (!fiabilidad.fotoViable) {
      const elapsedMs = Date.now() - startTime;
      const metricas = _B1_crearMetricasActuales(tiemposProceso, {
        pageConfidence: fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad.criticalZoneScore,
        elapsedMs,
        abortReason: fiabilidad.razonInviable
      });

      return B1_crearRespuestaError({
        code: B1_ERRORES.OCR_RUIDO,
        message: fiabilidad.razonInviable,
        tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        traceId,
        elapsedMs,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CORTE_TEMPRANO,
        textoBaseVision: textoBase,
        motivo: 'El OCR devolvió texto pero la fiabilidad es insuficiente para continuar.',
        detail: { fiabilidad: metricas },
        metricas,
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    if (!datos.agentEnabled) {
      const elapsedMs = Date.now() - startTime;
      B1_diagBypass(diag, { stageElapsedMs: 0, totalElapsedMs: elapsedMs });
      return B1_crearRespuestaError({
        code: B1_ERRORES.OCR_FAILED,
        message: 'Agente desactivado. Solo OCR base sin auditoría.',
        tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        traceId,
        elapsedMs,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.ABRIR_REVISION,
        textoBaseVision: textoBase,
        motivo: 'El usuario desactivó el agente de rescate.',
        metricas: _B1_crearMetricasActuales(tiemposProceso, {
          pageConfidence: fiabilidad.pageConfidence,
          criticalZoneScore: fiabilidad.criticalZoneScore,
          elapsedMs,
          abortReason: 'agente_desactivado'
        }),
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    if (cronometro.expired()) {
      return _respuestaTimeout('antes_slots', traceId, startTime, textoBase, fiabilidad, diag, tiemposProceso);
    }

    const slotsStageStart = Date.now();
    const loteRescate = B1_prepararLoteRescate(fiabilidad.palabrasDudosas, canvasListo, datos.sensitivityMode);
    tiemposProceso.cliente.t_slots_ms = Date.now() - slotsStageStart;
    tiemposProceso.cliente.t_total_dudas_detectadas = loteRescate.totalDudas;
    tiemposProceso.cliente.t_total_slots_preparados = loteRescate.totalSlots;

    if (loteRescate.totalSlots === 0) {
      const elapsedMs = Date.now() - startTime;
      const metricas = _B1_crearMetricasActuales(tiemposProceso, {
        pageConfidence: fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad.criticalZoneScore,
        elapsedMs
      });
      const pasaporte = { estado: B1_PASSPORT.VERDE, explicacion: 'Sin dudas rescatables. OCR base suficiente.', accionSugeridaParaCerebro: null };
      B1_diagPasaporte(diag, pasaporte.estado, pasaporte.explicacion, { stageElapsedMs: 0, totalElapsedMs: elapsedMs });
      return B1_crearRespuestaOk({
        textoBaseVision: textoBase,
        textoAuditado: textoBase,
        estadoPasaporte: B1_PASSPORT.VERDE,
        metricas,
        traceId,
        elapsedMs,
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    const rescateStageStart = Date.now();
    let resultadoRescate;
    try {
      resultadoRescate = await B1_ejecutarRescate(loteRescate, textoBase, cronometro, input.sessionToken, cfg.urlTrastienda);
    } catch (err) {
      const elapsedMs = Date.now() - startTime;
      B1_diagEncadenado(diag, err.upstreamCode || 'UPSTREAM_UNKNOWN', err.upstreamModule || 'TRASTIENDA', _B1_timing(rescateStageStart, startTime));
      return B1_crearRespuestaError({
        code: B1_ERRORES.RESCATE_FALLIDO,
        message: `Fallo en rescate Gemini: ${err.message}`,
        tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
        retryable: true,
        traceId,
        elapsedMs,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.REINTENTAR_UNA_VEZ,
        textoBaseVision: textoBase,
        chainedFrom: err.upstreamCode || null,
        errorOriginal: { upstreamModule: err.upstreamModule || null, raw: err.raw || null },
        metricas: _B1_crearMetricasActuales(tiemposProceso, {
          pageConfidence: fiabilidad.pageConfidence,
          criticalZoneScore: fiabilidad.criticalZoneScore,
          elapsedMs,
          abortReason: 'rescate_fallido'
        }),
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    Object.assign(tiemposProceso.cliente, resultadoRescate.tiempos?.cliente || {});
    tiemposProceso.upstream.gemini = resultadoRescate.tiempos?.upstream || null;
    if (resultadoRescate.tiempos?.estimaciones) {
      Object.assign(tiemposProceso.estimaciones, resultadoRescate.tiempos.estimaciones);
    }

    B1_diagRescate(diag, resultadoRescate, {
      stageElapsedMs: tiemposProceso.cliente.t_rescate_total_ms ?? (Date.now() - rescateStageStart),
      totalElapsedMs: Date.now() - startTime
    });
    if (resultadoRescate.upstreamError) {
      B1_diagEncadenado(diag, resultadoRescate.upstreamError.upstreamCode || 'UPSTREAM_UNKNOWN', resultadoRescate.upstreamError.upstreamModule || 'TRASTIENDA', { stageElapsedMs: 0, totalElapsedMs: Date.now() - startTime });
    }

    const mergeStageStart = Date.now();
    const merge = B1_ejecutarMerge(textoBase, loteRescate.slots, resultadoRescate);
    tiemposProceso.cliente.t_merge_ms = Date.now() - mergeStageStart;
    B1_diagMerge(diag, merge, {
      stageElapsedMs: tiemposProceso.cliente.t_merge_ms,
      totalElapsedMs: Date.now() - startTime
    });

    const pasaporte = B1_emitirPasaporte(merge, fiabilidad, datos.agentEnabled, cronometro, null);
    const elapsedMs = Date.now() - startTime;

    if (resultadoRescate.upstreamError && (pasaporte.estado === B1_PASSPORT.VERDE || pasaporte.estado === B1_PASSPORT.NARANJA)) {
      B1_diagRecuperacion(diag, B1_PASSPORT.ROJO, pasaporte.estado, { stageElapsedMs: 0, totalElapsedMs: elapsedMs }, 'Hubo fallo upstream en rescate pero Boxer 1 devolvió salida utilizable.');
    }
    B1_diagPasaporte(diag, pasaporte.estado, pasaporte.explicacion, { stageElapsedMs: 0, totalElapsedMs: elapsedMs });

    const metricas = _B1_crearMetricasActuales(tiemposProceso, {
      pageConfidence: fiabilidad.pageConfidence,
      criticalZoneScore: fiabilidad.criticalZoneScore,
      slotsEnviados: resultadoRescate.slotsEnviados,
      slotsDevueltos: resultadoRescate.slotsDevueltos,
      mergeStatus: merge.mergeStatus,
      rescatesIntentados: resultadoRescate.slotsEnviados,
      rescatesAplicados: merge.correcciones.length,
      elapsedMs,
      abortReason: null
    });

    if (pasaporte.estado === B1_PASSPORT.VERDE || pasaporte.estado === B1_PASSPORT.NARANJA) {
      return B1_crearRespuestaOk({
        textoBaseVision: textoBase,
        textoAuditado: merge.textoAuditado,
        estadoPasaporte: pasaporte.estado,
        correcciones: merge.correcciones,
        noResueltas: merge.noResueltas,
        roiRefsRevision: merge.roiRefsRevision,
        metricas,
        traceId,
        elapsedMs,
        accionSugeridaParaCerebro: pasaporte.accionSugeridaParaCerebro,
        warning: pasaporte.estado === B1_PASSPORT.NARANJA ? pasaporte.explicacion : null,
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    return B1_crearRespuestaError({
      code: B1_ERRORES.RESCATE_FALLIDO,
      message: pasaporte.explicacion,
      tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
      retryable: false,
      traceId,
      elapsedMs,
      accionSugeridaParaCerebro: pasaporte.accionSugeridaParaCerebro,
      textoBaseVision: textoBase,
      motivo: 'Rescate y merge no dejaron salida fiable y no existe cadena real de autoreparación en Boxer 1.',
      metricas,
      diagnostico: B1_exportarDiagnostico(diag)
    });

  } catch (errorInesperado) {
    const elapsedMs = Date.now() - startTime;
    return B1_crearRespuestaError({
      code: B1_ERRORES.ERROR_INTERNO,
      message: `Error inesperado: ${errorInesperado.message}`,
      tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
      retryable: true,
      traceId,
      elapsedMs,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.REINTENTAR_UNA_VEZ,
      textoBaseVision: textoBase || null,
      errorOriginal: {
        message: errorInesperado.message,
        stack: errorInesperado.stack || null,
        upstreamCode: errorInesperado.upstreamCode || null,
        upstreamModule: errorInesperado.upstreamModule || null,
        raw: errorInesperado.raw || null
      },
      metricas: _B1_crearMetricasActuales(tiemposProceso, { elapsedMs, abortReason: 'error_inesperado' }),
      diagnostico: B1_exportarDiagnostico(diag)
    });
  }
}

function _respuestaTimeout(fase, traceId, startTime, textoBase, fiabilidad, diag, tiemposProceso) {
  const elapsedMs = Date.now() - startTime;
  B1_diagTimeout(diag, fase, { stageElapsedMs: 0, totalElapsedMs: elapsedMs });

  const metricas = fiabilidad ? _B1_crearMetricasActuales(tiemposProceso, {
    pageConfidence: fiabilidad.pageConfidence,
    criticalZoneScore: fiabilidad.criticalZoneScore,
    elapsedMs,
    abortReason: 'Presupuesto de tiempo agotado.'
  }) : _B1_crearMetricasActuales(tiemposProceso, {
    elapsedMs,
    abortReason: 'Presupuesto de tiempo agotado.'
  });

  if (textoBase) {
    return B1_crearRespuestaOk({
      textoBaseVision: textoBase,
      textoAuditado: textoBase,
      estadoPasaporte: B1_PASSPORT.NARANJA,
      metricas,
      traceId,
      elapsedMs,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CONTINUAR_Y_MARCAR,
      warning: 'Presupuesto de tiempo agotado. Solo texto base disponible.',
      diagnostico: B1_exportarDiagnostico(diag)
    });
  }

  return B1_crearRespuestaError({
    code: B1_ERRORES.PRESUPUESTO_AGOTADO,
    message: 'Presupuesto de tiempo agotado sin obtener texto.',
    tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
    retryable: true,
    traceId,
    elapsedMs,
    accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.REINTENTAR_MAS_TARDE,
    motivo: 'Presupuesto agotado sin cadena real de autoreparación interna.',
    metricas,
    diagnostico: B1_exportarDiagnostico(diag)
  });
}
