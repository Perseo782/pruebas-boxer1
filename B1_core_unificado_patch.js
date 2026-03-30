
async function B1_analizar(input, config) {
  const traceId = B1_generarTraceId();
  const startTime = Date.now();
  const diag = (typeof B1_crearBufferDiagnostico === 'function') ? B1_crearBufferDiagnostico(traceId) : null;
  const tiempos = {
    cliente: {},
    upstream: { vision: null, gemini: null },
    estimaciones: { t_vision_externo_no_desglosado_ms: null, t_gemini_externo_no_desglosado_ms: null },
    total: { t_total_boxer1_ms: 0 }
  };

  const validacion = B1_validarEntrada(input);
  if (!validacion.valid) {
    tiempos.total.t_total_boxer1_ms = Date.now() - startTime;
    return B1_crearRespuestaError({
      code: B1_ERRORES.ERROR_INTERNO,
      message: validacion.reason,
      tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
      retryable: false,
      traceId,
      elapsedMs: Date.now() - startTime,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.PEDIR_DATO_AL_USUARIO,
      motivo: 'Entrada incompleta o con valores no permitidos.',
      metricas: B1_crearMetricas({ elapsedMs: Date.now() - startTime, abortReason: 'Validación de entrada falló.', tiempos }),
      diagnostico: B1_exportarDiagnostico(diag)
    });
  }

  const validacionConfig = B1_validarConfig(config);
  if (!validacionConfig.valid) {
    if (typeof B1_diagModoSeguro === 'function') B1_diagModoSeguro(diag, Date.now() - startTime, validacionConfig.reason, 0);
    tiempos.total.t_total_boxer1_ms = Date.now() - startTime;
    return B1_crearRespuestaError({
      code: B1_ERRORES.ERROR_INTERNO,
      message: validacionConfig.reason,
      tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
      retryable: false,
      traceId,
      elapsedMs: Date.now() - startTime,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.PEDIR_DATO_AL_USUARIO,
      motivo: 'Configuración inválida de Boxer 1.',
      metricas: B1_crearMetricas({ elapsedMs: Date.now() - startTime, abortReason: 'Validación de config falló.', tiempos }),
      diagnostico: B1_exportarDiagnostico(diag)
    });
  }

  const datos = validacion.datos;
  const cfg = validacionConfig.config;
  const cronometro = B1_crearCronometro(datos.timeBudgetMs);

  let textoBase = '';
  let ocrNormalizado = null;
  let canvasListo = null;
  let selectorOCR = null;

  try {
    const tPre = Date.now();
    const prechequeo = await B1_prechequeo(datos.imageRef, cronometro);
    const preStage = Date.now() - tPre;
    tiempos.cliente = Object.assign(tiempos.cliente, prechequeo.tiempos || { t_total_prechequeo_ms: preStage });

    B1_diagPrechequeo(diag, prechequeo.ok, prechequeo.problemas || [], Date.now() - startTime, preStage);

    if (!prechequeo.ok) {
      tiempos.total.t_total_boxer1_ms = Date.now() - startTime;
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
        metricas: B1_crearMetricas({ elapsedMs: Date.now() - startTime, abortReason: prechequeo.abortReason || 'Prechequeo falló.', tiempos }),
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    canvasListo = prechequeo.canvas;

    if (cronometro.expired()) {
      return _respuestaTimeout('antes_ocr', traceId, startTime, textoBase, null, diag, tiempos, selectorOCR);
    }

    const tOCR = Date.now();
    let respuestaVision;

    try {
      respuestaVision = await B1_llamarVisionOCR(canvasListo, datos.sendMode, input.sessionToken, cfg.urlTrastienda);
    } catch (err) {
      tiempos.total.t_total_boxer1_ms = Date.now() - startTime;
      B1_diagEncadenado(diag, err.upstreamCode || 'UPSTREAM_UNKNOWN', err.upstreamModule || 'TRASTIENDA', Date.now() - startTime, 0);
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
        metricas: B1_crearMetricas({ elapsedMs: Date.now() - startTime, abortReason: 'Vision OCR falló.', tiempos }),
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    Object.assign(tiempos.cliente, respuestaVision.__b1TiemposCliente || {});
    tiempos.upstream.vision = respuestaVision.__b1Upstream || null;

    if (
      tiempos.upstream.vision &&
      typeof tiempos.upstream.vision.t_total_trastienda_ms === 'number' &&
      typeof tiempos.cliente.t_fetch_vision_total_ms === 'number'
    ) {
      tiempos.estimaciones.t_vision_externo_no_desglosado_ms = Math.max(
        0,
        tiempos.cliente.t_fetch_vision_total_ms - tiempos.upstream.vision.t_total_trastienda_ms
      );
    }

    const tNorm = Date.now();
    ocrNormalizado = B1_normalizarOCR(respuestaVision);
    textoBase = B1_construirTextoBase(ocrNormalizado);
    tiempos.cliente.t_normalizar_ocr_ms = Date.now() - tNorm;
    tiempos.cliente.t_ocr_total_ms = Date.now() - tOCR;

    B1_diagOCR(diag, ocrNormalizado.visionVacia, ocrNormalizado.totalPalabras, Date.now() - startTime, tiempos.cliente.t_ocr_total_ms);

    if (ocrNormalizado.visionVacia) {
      tiempos.total.t_total_boxer1_ms = Date.now() - startTime;
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
        metricas: B1_crearMetricas({ elapsedMs: Date.now() - startTime, abortReason: 'Vision no detectó texto.', tiempos }),
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    const tFiab = Date.now();
    const fiabilidad = B1_medirFiabilidad(ocrNormalizado, datos.sensitivityMode);
    tiempos.cliente.t_fiabilidad_ms = Date.now() - tFiab;

    B1_diagFiabilidad(diag, fiabilidad, Date.now() - startTime, tiempos.cliente.t_fiabilidad_ms);

    if (!fiabilidad.fotoViable) {
      tiempos.total.t_total_boxer1_ms = Date.now() - startTime;
      const metricas = B1_crearMetricas({
        pageConfidence: fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad.criticalZoneScore,
        elapsedMs: Date.now() - startTime,
        abortReason: fiabilidad.razonInviable,
        tiempos
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
        metricas,
        selectorOCR,
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    if (!datos.agentEnabled) {
      const elapsedMs = Date.now() - startTime;
      tiempos.total.t_total_boxer1_ms = elapsedMs;
      B1_diagBypass(diag, elapsedMs, 0);

      const metricas = B1_crearMetricas({
        pageConfidence: fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad.criticalZoneScore,
        elapsedMs,
        abortReason: null,
        tiempos
      });

      return B1_crearRespuestaOk({
        textoBaseVision: textoBase,
        textoAuditado: textoBase,
        estadoPasaporte: B1_PASSPORT.NARANJA,
        metricas,
        selectorOCR,
        traceId,
        elapsedMs,
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CONTINUAR_Y_MARCAR,
        warning: 'Agente desactivado. Resultado usable con OCR base.',
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    if (cronometro.expired()) {
      return _respuestaTimeout('antes_slots', traceId, startTime, textoBase, fiabilidad, diag, tiempos, selectorOCR);
    }

    const tSlots = Date.now();
    const loteRescate = B1_prepararLoteRescate(fiabilidad.palabrasDudosas, canvasListo, datos.sensitivityMode);
    selectorOCR = loteRescate.selectorOCR || null;

    tiempos.cliente.t_slots_ms = Date.now() - tSlots;
    tiempos.cliente.t_total_dudas_detectadas = fiabilidad.palabrasDudosas.length;
    tiempos.cliente.t_total_slots_preparados = loteRescate.totalSlots;

    if (loteRescate.totalSlots === 0) {
      const elapsedMs = Date.now() - startTime;
      tiempos.total.t_total_boxer1_ms = elapsedMs;

      const metricas = B1_crearMetricas({
        pageConfidence: fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad.criticalZoneScore,
        elapsedMs,
        tiempos
      });

      const pasaporte = {
        estado: B1_PASSPORT.VERDE,
        explicacion: 'Sin dudas rescatables. OCR base suficiente.',
        accionSugeridaParaCerebro: null
      };

      B1_diagPasaporte(diag, pasaporte.estado, pasaporte.explicacion, elapsedMs, 0);

      return B1_crearRespuestaOk({
        textoBaseVision: textoBase,
        textoAuditado: textoBase,
        estadoPasaporte: B1_PASSPORT.VERDE,
        metricas,
        selectorOCR,
        traceId,
        elapsedMs,
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    const tRescate = Date.now();
    let resultadoRescate;

    try {
      resultadoRescate = await B1_ejecutarRescate(loteRescate, textoBase, cronometro, input.sessionToken, cfg.urlTrastienda);
    } catch (err) {
      tiempos.total.t_total_boxer1_ms = Date.now() - startTime;
      B1_diagEncadenado(diag, err.upstreamCode || 'UPSTREAM_UNKNOWN', err.upstreamModule || 'TRASTIENDA', Date.now() - startTime, 0);

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
        metricas: B1_crearMetricas({
          pageConfidence: fiabilidad.pageConfidence,
          criticalZoneScore: fiabilidad.criticalZoneScore,
          elapsedMs: Date.now() - startTime,
          abortReason: 'Rescate Gemini falló.',
          tiempos
        }),
        selectorOCR,
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    tiempos.cliente.t_rescate_total_ms = Date.now() - tRescate;
    B1_diagRescate(diag, resultadoRescate, Date.now() - startTime, tiempos.cliente.t_rescate_total_ms);

    if (resultadoRescate.upstreamError) {
      B1_diagEncadenado(diag, resultadoRescate.upstreamError.upstreamCode || 'UPSTREAM_UNKNOWN', resultadoRescate.upstreamError.upstreamModule || 'TRASTIENDA', Date.now() - startTime, 0);
    }

    const tMerge = Date.now();
    const merge = B1_ejecutarMerge(textoBase, loteRescate.slots, resultadoRescate);
    tiempos.cliente.t_merge_ms = Date.now() - tMerge;

    B1_diagMerge(diag, merge, Date.now() - startTime, tiempos.cliente.t_merge_ms);

    const pasaporte = B1_emitirPasaporte(merge, fiabilidad, datos.agentEnabled, cronometro, null);
    const elapsedMs = Date.now() - startTime;
    tiempos.total.t_total_boxer1_ms = elapsedMs;

    if (
      resultadoRescate.upstreamError &&
      (pasaporte.estado === B1_PASSPORT.VERDE || pasaporte.estado === B1_PASSPORT.NARANJA)
    ) {
      B1_diagRecuperacion(
        diag,
        B1_PASSPORT.ROJO,
        pasaporte.estado,
        elapsedMs,
        'Hubo fallo upstream en rescate pero Boxer 1 devolvió salida utilizable.',
        0
      );
    }

    B1_diagPasaporte(diag, pasaporte.estado, pasaporte.explicacion, elapsedMs, 0);

    const metricas = B1_crearMetricas({
      pageConfidence: fiabilidad.pageConfidence,
      criticalZoneScore: fiabilidad.criticalZoneScore,
      slotsEnviados: resultadoRescate.slotsEnviados,
      slotsDevueltos: resultadoRescate.slotsDevueltos,
      mergeStatus: merge.mergeStatus,
      rescatesIntentados: resultadoRescate.slotsEnviados,
      rescatesAplicados: merge.correcciones.length,
      elapsedMs,
      abortReason: null,
      tiempos
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
        selectorOCR,
        traceId,
        elapsedMs,
        accionSugeridaParaCerebro: pasaporte.accionSugeridaParaCerebro,
        warning: pasaporte.estado === B1_PASSPORT.NARANJA ? pasaporte.explicacion : null,
        diagnostico: B1_exportarDiagnostico(diag)
      });
    }

    tiempos.total.t_total_boxer1_ms = Date.now() - startTime;

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
      metricas: B1_crearMetricas({
        pageConfidence: fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad.criticalZoneScore,
        elapsedMs,
        abortReason: 'Pasaporte ROJO final.',
        tiempos
      }),
      selectorOCR,
      diagnostico: B1_exportarDiagnostico(diag)
    });

  } catch (errorInesperado) {
    tiempos.total.t_total_boxer1_ms = Date.now() - startTime;

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
      metricas: B1_crearMetricas({
        elapsedMs: Date.now() - startTime,
        abortReason: 'Error inesperado en catch.',
        tiempos
      }),
      selectorOCR,
      diagnostico: B1_exportarDiagnostico(diag)
    });
  }
}

function _respuestaTimeout(fase, traceId, startTime, textoBase, fiabilidad, diag, tiempos, selectorOCR = null) {
  const elapsedMs = Date.now() - startTime;
  if (tiempos && tiempos.total) tiempos.total.t_total_boxer1_ms = elapsedMs;

  B1_diagTimeout(diag, fase, elapsedMs, 0);

  const metricas = fiabilidad
    ? B1_crearMetricas({
        pageConfidence: fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad.criticalZoneScore,
        elapsedMs,
        abortReason: 'Presupuesto de tiempo agotado.',
        tiempos
      })
    : B1_crearMetricas({
        elapsedMs,
        abortReason: 'Presupuesto de tiempo agotado.',
        tiempos
      });

  if (textoBase) {
    return B1_crearRespuestaOk({
      textoBaseVision: textoBase,
      textoAuditado: textoBase,
      estadoPasaporte: B1_PASSPORT.NARANJA,
      metricas,
      selectorOCR,
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
    selectorOCR,
    diagnostico: B1_exportarDiagnostico(diag)
  });
}
