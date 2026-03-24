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

async function B1_analizar(input, config) {
  const traceId = B1_generarTraceId();
  const startTime = Date.now();
  const diag = (typeof B1_crearBufferDiagnostico === 'function') ? B1_crearBufferDiagnostico(traceId) : null;

  const validacion = B1_validarEntrada(input);
  if (!validacion.valid) {
    return B1_crearRespuestaError({
      code: B1_ERRORES.ERROR_INTERNO,
      message: validacion.reason,
      tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
      retryable: false,
      traceId,
      elapsedMs: Date.now() - startTime,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.PEDIR_DATO_AL_USUARIO,
      motivo: 'Entrada incompleta o con valores no permitidos.',
      diagnostico: B1_exportarDiagnostico(diag)
    });
  }

  const validacionConfig = B1_validarConfig(config);
  if (!validacionConfig.valid) {
    if (typeof B1_diagModoSeguro === 'function') B1_diagModoSeguro(diag, Date.now() - startTime, validacionConfig.reason);
    return B1_crearRespuestaError({
      code: B1_ERRORES.ERROR_INTERNO,
      message: validacionConfig.reason,
      tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
      retryable: false,
      traceId,
      elapsedMs: Date.now() - startTime,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.PEDIR_DATO_AL_USUARIO,
      motivo: 'Configuración inválida de Boxer 1.',
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
    const prechequeo = await B1_prechequeo(datos.imageRef, cronometro);
    B1_diagPrechequeo(diag, prechequeo.ok, prechequeo.problemas || [], Date.now() - startTime);

    if (!prechequeo.ok) {
      return B1_crearRespuestaError({
        code: B1_ERRORES.IMAGEN_INVALIDA,
        message: prechequeo.abortReason || 'Foto imposible de procesar por mala calidad.',
        tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        traceId,
        elapsedMs: Date.now() - startTime,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CORTE_TEMPRANO,
        motivo: 'La imagen no cumple los mínimos de calidad.',
        detail: { problemas: prechequeo.problemas, metricas: prechequeo.metricasImagen },
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    canvasListo = prechequeo.canvas;

    if (cronometro.expired()) {
      return _respuestaTimeout('antes_ocr', traceId, startTime, textoBase, null, diag);
    }

    let respuestaVision;
    try {
      respuestaVision = await B1_llamarVisionOCR(canvasListo, datos.sendMode, input.sessionToken, cfg.urlTrastienda);
    } catch (err) {
      B1_diagEncadenado(diag, err.upstreamCode || 'UPSTREAM_UNKNOWN', err.upstreamModule || 'TRASTIENDA', Date.now() - startTime);
      return B1_crearRespuestaError({
        code: B1_ERRORES.OCR_FAILED,
        message: `Fallo en Vision OCR: ${err.message}`,
        tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
        retryable: true,
        traceId,
        elapsedMs: Date.now() - startTime,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.REINTENTAR,
        chainedFrom: err.upstreamCode || null,
        errorOriginal: { upstreamModule: err.upstreamModule || null, raw: err.raw || null },
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    ocrNormalizado = B1_normalizarOCR(respuestaVision);
    textoBase = B1_construirTextoBase(ocrNormalizado);
    B1_diagOCR(diag, ocrNormalizado.visionVacia, ocrNormalizado.totalPalabras, Date.now() - startTime);

    if (ocrNormalizado.visionVacia) {
      return B1_crearRespuestaError({
        code: B1_ERRORES.OCR_VACIO,
        message: 'Vision no detectó texto en la imagen.',
        tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        traceId,
        elapsedMs: Date.now() - startTime,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CORTE_TEMPRANO,
        textoBaseVision: '',
        motivo: 'La imagen no contiene texto detectable.',
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    const fiabilidad = B1_medirFiabilidad(ocrNormalizado, datos.sensitivityMode);
    B1_diagFiabilidad(diag, fiabilidad, Date.now() - startTime);

    if (!fiabilidad.fotoViable) {
      const metricas = B1_crearMetricas({
        pageConfidence: fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad.criticalZoneScore,
        elapsedMs: Date.now() - startTime,
        abortReason: fiabilidad.razonInviable
      });

      return B1_crearRespuestaError({
        code: B1_ERRORES.OCR_RUIDO,
        message: fiabilidad.razonInviable,
        tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        traceId,
        elapsedMs: Date.now() - startTime,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CORTE_TEMPRANO,
        textoBaseVision: textoBase,
        motivo: 'El OCR devolvió texto pero la fiabilidad es insuficiente para continuar.',
        detail: { fiabilidad: metricas },
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    if (!datos.agentEnabled) {
      B1_diagBypass(diag, Date.now() - startTime);
      return B1_crearRespuestaError({
        code: B1_ERRORES.OCR_FAILED,
        message: 'Agente desactivado. Solo OCR base sin auditoría.',
        tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        traceId,
        elapsedMs: Date.now() - startTime,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.ABRIR_REVISION,
        textoBaseVision: textoBase,
        motivo: 'El usuario desactivó el agente de rescate.',
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    if (cronometro.expired()) {
      return _respuestaTimeout('antes_slots', traceId, startTime, textoBase, fiabilidad, diag);
    }

    const loteRescate = B1_prepararLoteRescate(fiabilidad.palabrasDudosas, canvasListo, datos.sensitivityMode);

    if (loteRescate.totalSlots === 0) {
      const metricas = B1_crearMetricas({
        pageConfidence: fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad.criticalZoneScore,
        elapsedMs: Date.now() - startTime
      });
      const pasaporte = { estado: B1_PASSPORT.VERDE, explicacion: 'Sin dudas rescatables. OCR base suficiente.', accionSugeridaParaCerebro: null };
      B1_diagPasaporte(diag, pasaporte.estado, pasaporte.explicacion, Date.now() - startTime);
      return B1_crearRespuestaOk({
        textoBaseVision: textoBase,
        textoAuditado: textoBase,
        estadoPasaporte: B1_PASSPORT.VERDE,
        metricas,
        traceId,
        elapsedMs: Date.now() - startTime,
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    let resultadoRescate;
    try {
      resultadoRescate = await B1_ejecutarRescate(loteRescate, textoBase, cronometro, input.sessionToken, cfg.urlTrastienda);
    } catch (err) {
      B1_diagEncadenado(diag, err.upstreamCode || 'UPSTREAM_UNKNOWN', err.upstreamModule || 'TRASTIENDA', Date.now() - startTime);
      return B1_crearRespuestaError({
        code: B1_ERRORES.RESCATE_FALLIDO,
        message: `Fallo en rescate Gemini: ${err.message}`,
        tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
        retryable: true,
        traceId,
        elapsedMs: Date.now() - startTime,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.REINTENTAR_UNA_VEZ,
        textoBaseVision: textoBase,
        chainedFrom: err.upstreamCode || null,
        errorOriginal: { upstreamModule: err.upstreamModule || null, raw: err.raw || null },
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    B1_diagRescate(diag, resultadoRescate, Date.now() - startTime);
    if (resultadoRescate.upstreamError) {
      B1_diagEncadenado(diag, resultadoRescate.upstreamError.upstreamCode || 'UPSTREAM_UNKNOWN', resultadoRescate.upstreamError.upstreamModule || 'TRASTIENDA', Date.now() - startTime);
    }

    const merge = B1_ejecutarMerge(textoBase, loteRescate.slots, resultadoRescate);
    B1_diagMerge(diag, merge, Date.now() - startTime);

    const pasaporte = B1_emitirPasaporte(merge, fiabilidad, datos.agentEnabled, cronometro, null);
    const elapsedMs = Date.now() - startTime;

    if (resultadoRescate.upstreamError && (pasaporte.estado === B1_PASSPORT.VERDE || pasaporte.estado === B1_PASSPORT.NARANJA)) {
      B1_diagRecuperacion(diag, B1_PASSPORT.ROJO, pasaporte.estado, elapsedMs, 'Hubo fallo upstream en rescate pero Boxer 1 devolvió salida utilizable.');
    }
    B1_diagPasaporte(diag, pasaporte.estado, pasaporte.explicacion, elapsedMs);

    const metricas = B1_crearMetricas({
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
      diagnostico: B1_exportarDiagnostico(diag)
    });

  } catch (errorInesperado) {
    return B1_crearRespuestaError({
      code: B1_ERRORES.ERROR_INTERNO,
      message: `Error inesperado: ${errorInesperado.message}`,
      tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
      retryable: true,
      traceId,
      elapsedMs: Date.now() - startTime,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.REINTENTAR_UNA_VEZ,
      textoBaseVision: textoBase || null,
      errorOriginal: {
        message: errorInesperado.message,
        stack: errorInesperado.stack || null,
        upstreamCode: errorInesperado.upstreamCode || null,
        upstreamModule: errorInesperado.upstreamModule || null,
        raw: errorInesperado.raw || null
      },
      diagnostico: B1_exportarDiagnostico(diag)
    });
  }
}

function _respuestaTimeout(fase, traceId, startTime, textoBase, fiabilidad, diag) {
  const elapsedMs = Date.now() - startTime;
  B1_diagTimeout(diag, fase, elapsedMs);

  const metricas = fiabilidad ? B1_crearMetricas({
    pageConfidence: fiabilidad.pageConfidence,
    criticalZoneScore: fiabilidad.criticalZoneScore,
    elapsedMs,
    abortReason: 'Presupuesto de tiempo agotado.'
  }) : B1_crearMetricas({ elapsedMs, abortReason: 'Presupuesto de tiempo agotado.' });

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
    diagnostico: B1_exportarDiagnostico(diag)
  });
}
