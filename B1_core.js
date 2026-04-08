/**
 * =====================================================================
 * BOXER 1 v2 · CORE
 * =====================================================================
 * Director de orquesta del flujo Boxer 1.
 * Conecta validacion, prechequeo, OCR, motor, empaquetador, rescate,
 * merge y pasaporte.
 * =====================================================================
 */

function B1_aplanarPalabrasOCR(ocrNormalizado) {
  var lista = [];
  (ocrNormalizado && ocrNormalizado.paginas || []).forEach(function(pagina) {
    (pagina.bloques || []).forEach(function(bloque) {
      (bloque.palabras || []).forEach(function(palabra) {
        lista.push({
          texto: palabra.texto,
          confidence: palabra.confidence,
          boundingPoly: palabra.boundingPoly,
          pageIndex: pagina.pageIndex,
          blockIndex: bloque.blockIndex,
          wordIndex: palabra.wordIndex,
          bloque: bloque
        });
      });
    });
  });
  return lista;
}

function _B1_core_extraerTiemposOCR(respuestaVision) {
  return respuestaVision && respuestaVision.__b1TiemposCliente ? respuestaVision.__b1TiemposCliente : null;
}

function _B1_core_mapearProblemaPrechequeo(problemas) {
  var lista = Array.isArray(problemas) ? problemas : [];
  if (lista.indexOf('desenfoque_severo') !== -1) return B1_ERRORES.IMAGEN_DESENFOCADA;
  if (lista.indexOf('reflejo_severo') !== -1) return B1_ERRORES.IMAGEN_REFLEJO;
  if (lista.indexOf('sin_texto_visible') !== -1) return B1_ERRORES.IMAGEN_SIN_TEXTO;
  if (lista.indexOf('recorte_roto') !== -1) return B1_ERRORES.IMAGEN_RECORTE_ROTO;
  return B1_ERRORES.IMAGEN_INVALIDA;
}

function _B1_core_crearTiempos(params) {
  params = params || {};
  return {
    prechequeo: params.prechequeo || null,
    visionCliente: params.visionCliente || null,
    visionUpstream: params.visionUpstream || null,
    rescate: params.rescate || null
  };
}

function _B1_core_extraerPesoVolumenProducto(resultadoMotor) {
  var lista = resultadoMotor && Array.isArray(resultadoMotor.tablaBReconocida)
    ? resultadoMotor.tablaBReconocida
    : [];

  for (var i = 0; i < lista.length; i++) {
    if (lista[i] && lista[i].esPesoVolumenReal) {
      return lista[i];
    }
  }

  return null;
}

function _B1_core_errorEntrada(traceId, elapsedMs, diagnostico, message, detail) {
  return B1_crearRespuestaError({
    code: 'B1_INPUT_INVALIDA',
    message: message,
    tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
    retryable: false,
    traceId: traceId,
    elapsedMs: elapsedMs,
    detail: detail,
    diagnostico: diagnostico,
    accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO
  });
}

async function B1_analizar(input, config) {
  var traceId = B1_generarTraceId();
  var diagnosticoBuffer = B1_crearBufferDiagnostico(traceId);
  var cronometro = B1_crearCronometro();
  var visionRespuesta = null;
  var textoBase = '';
  var fiabilidad = null;
  var resultadoMotor = null;
  var tiempos = _B1_core_crearTiempos();

  try {
    var entradaValida = B1_validarEntrada(input);
    if (!entradaValida.valid) {
      return _B1_core_errorEntrada(
        traceId,
        cronometro.elapsed(),
        B1_exportarDiagnostico(diagnosticoBuffer),
        'Entrada invalida.',
        entradaValida.reason
      );
    }

    var configValida = B1_validarConfig(config);
    if (!configValida.valid) {
      return B1_crearRespuestaError({
        code: 'B1_CONFIG_INVALIDA',
        message: 'Config invalida.',
        tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        traceId: traceId,
        elapsedMs: cronometro.elapsed(),
        detail: configValida.reason,
        diagnostico: B1_exportarDiagnostico(diagnosticoBuffer),
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO
      });
    }

    var prechequeo = await B1_prechequeo(input.datos.imageRef, cronometro);
    tiempos.prechequeo = prechequeo.tiempos || null;
    B1_diagPrechequeo(
      diagnosticoBuffer,
      !!prechequeo.ok,
      prechequeo.problemas || [],
      cronometro.elapsed(),
      prechequeo.tiempos && prechequeo.tiempos.t_total_prechequeo_ms
    );

    if (!prechequeo.ok) {
      return B1_crearRespuestaError({
        code: _B1_core_mapearProblemaPrechequeo(prechequeo.problemas),
        message: prechequeo.abortReason || 'Prechequeo fallido.',
        tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        traceId: traceId,
        elapsedMs: cronometro.elapsed(),
        metricas: B1_crearMetricas({
          elapsedMs: cronometro.elapsed(),
          abortReason: prechequeo.abortReason || null,
          tiempos: tiempos
        }),
        diagnostico: B1_exportarDiagnostico(diagnosticoBuffer),
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CORTE_TEMPRANO
      });
    }

    try {
      visionRespuesta = await B1_llamarVisionOCR(
        prechequeo.canvas,
        input.datos.sendMode,
        input.sessionToken,
        configValida.config.urlTrastienda
      );
    } catch (err) {
      B1_diagEncadenado(
        diagnosticoBuffer,
        err.upstreamCode || B1_ERRORES.OCR_FAILED,
        err.upstreamModule || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
        cronometro.elapsed()
      );
      return B1_crearRespuestaError({
        code: err.upstreamCode || B1_ERRORES.OCR_FAILED,
        message: err.message || 'Vision OCR fallo.',
        tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
        retryable: true,
        traceId: traceId,
        elapsedMs: cronometro.elapsed(),
        chainedFrom: err.upstreamModule || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
        errorOriginal: err.raw || null,
        metricas: B1_crearMetricas({
          elapsedMs: cronometro.elapsed(),
          abortReason: 'ocr_failed',
          tiempos: _B1_core_crearTiempos({
            prechequeo: tiempos.prechequeo,
            visionCliente: _B1_core_extraerTiemposOCR(visionRespuesta),
            visionUpstream: visionRespuesta && visionRespuesta.__b1Upstream ? visionRespuesta.__b1Upstream : null
          })
        }),
        diagnostico: B1_exportarDiagnostico(diagnosticoBuffer),
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.REINTENTAR
      });
    }

    tiempos.visionCliente = _B1_core_extraerTiemposOCR(visionRespuesta);
    tiempos.visionUpstream = visionRespuesta && visionRespuesta.__b1Upstream ? visionRespuesta.__b1Upstream : null;

    var ocrNormalizado = B1_normalizarOCR(visionRespuesta);
    textoBase = B1_construirTextoBase(ocrNormalizado);
    B1_diagOCR(
      diagnosticoBuffer,
      !!ocrNormalizado.visionVacia,
      ocrNormalizado.totalPalabras || 0,
      cronometro.elapsed(),
      tiempos.visionCliente && tiempos.visionCliente.t_ocr_llamada_total_ms
    );

    if (!textoBase || ocrNormalizado.visionVacia) {
      return B1_crearRespuestaError({
        code: B1_ERRORES.OCR_VACIO,
        message: 'Vision no devolvio texto util.',
        tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
        retryable: true,
        traceId: traceId,
        elapsedMs: cronometro.elapsed(),
        textoBaseVision: textoBase,
        metricas: B1_crearMetricas({
          totalPalabrasAnalizadas: ocrNormalizado.totalPalabras || 0,
          elapsedMs: cronometro.elapsed(),
          abortReason: 'ocr_vacio',
          tiempos: tiempos
        }),
        diagnostico: B1_exportarDiagnostico(diagnosticoBuffer),
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.REINTENTAR
      });
    }

    fiabilidad = B1_medirFiabilidad(ocrNormalizado);
    B1_diagFiabilidad(
      diagnosticoBuffer,
      {
        fotoViable: true,
        razonInviable: null,
        palabrasDudosas: [],
        pageConfidence: fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad.criticalZoneScore,
        rachasMalas: fiabilidad.rachasMalas
      },
      cronometro.elapsed(),
      null
    );

    if (!input.datos.agentEnabled) {
      B1_diagBypass(diagnosticoBuffer, cronometro.elapsed(), null);
      var pasaporteBypass = B1_emitirPasaporte(
        { mergeCancelado: false, noResueltas: [], correcciones: [] },
        fiabilidad,
        false,
        cronometro,
        null
      );
      B1_diagPasaporte(
        diagnosticoBuffer,
        pasaporteBypass.estado,
        pasaporteBypass.explicacion,
        cronometro.elapsed(),
        null
      );
      return B1_crearRespuestaOk({
        estadoPasaporte: pasaporteBypass.estado,
        accionSugeridaParaCerebro: pasaporteBypass.accionSugeridaParaCerebro,
        elapsedMs: cronometro.elapsed(),
        traceId: traceId,
        textoBaseVision: textoBase,
        textoAuditado: textoBase,
        correcciones: [],
        noResueltas: [],
        roiRefsRevision: [],
        validas: [],
        tablaBReconocida: [],
        pesoVolumenProducto: null,
        detalleSlots: [],
        metricas: B1_crearMetricas({
          pageConfidence: fiabilidad.pageConfidence,
          criticalZoneScore: fiabilidad.criticalZoneScore,
          totalPalabrasAnalizadas: ocrNormalizado.totalPalabras || 0,
          mergeStatus: B1_MERGE_STATUS.NO_INTENTADO,
          elapsedMs: cronometro.elapsed(),
          tiempos: tiempos
        }),
        diagnostico: B1_exportarDiagnostico(diagnosticoBuffer)
      });
    }

    if (!globalThis.B1_CATALOGOS_READY || !globalThis.B1_CATALOGOS) {
      return B1_crearRespuestaError({
        code: B1_ERRORES.CATALOGOS_NO_LISTO,
        message: 'Catalogos no listos.',
        tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        traceId: traceId,
        elapsedMs: cronometro.elapsed(),
        detail: globalThis.B1_CATALOGOS_ERROR || null,
        textoBaseVision: textoBase,
        metricas: B1_crearMetricas({
          pageConfidence: fiabilidad.pageConfidence,
          criticalZoneScore: fiabilidad.criticalZoneScore,
          totalPalabrasAnalizadas: ocrNormalizado.totalPalabras || 0,
          elapsedMs: cronometro.elapsed(),
          abortReason: 'catalogos_no_listos',
          tiempos: tiempos
        }),
        diagnostico: B1_exportarDiagnostico(diagnosticoBuffer),
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO
      });
    }

    var palabrasOCR = B1_aplanarPalabrasOCR(ocrNormalizado);
    resultadoMotor = B1_motorCosteOCR_filtrar({
      palabrasOCR: palabrasOCR,
      catalogos: globalThis.B1_CATALOGOS
    });

    var loteRescate = B1_empaquetarParaRescate({
      rotasReconocidas: resultadoMotor.rotasReconocidas,
      canvas: prechequeo.canvas
    });

    if (loteRescate.totalSlots === 0) {
      var pasaporteSinRotas = B1_emitirPasaporte(
        { mergeCancelado: false, noResueltas: [], correcciones: [] },
        fiabilidad,
        true,
        cronometro,
        null
      );
      B1_diagPasaporte(
        diagnosticoBuffer,
        pasaporteSinRotas.estado,
        pasaporteSinRotas.explicacion,
        cronometro.elapsed(),
        null
      );
      return B1_crearRespuestaOk({
        estadoPasaporte: pasaporteSinRotas.estado,
        accionSugeridaParaCerebro: pasaporteSinRotas.accionSugeridaParaCerebro,
        elapsedMs: cronometro.elapsed(),
        traceId: traceId,
        textoBaseVision: textoBase,
        textoAuditado: textoBase,
        correcciones: [],
        noResueltas: [],
        roiRefsRevision: [],
        validas: resultadoMotor.validas || [],
        tablaBReconocida: resultadoMotor.tablaBReconocida || [],
        pesoVolumenProducto: _B1_core_extraerPesoVolumenProducto(resultadoMotor),
        detalleSlots: [],
        metricas: B1_crearMetricas({
          pageConfidence: fiabilidad.pageConfidence,
          criticalZoneScore: fiabilidad.criticalZoneScore,
          totalPalabrasAnalizadas: palabrasOCR.length,
          totalValidas: (resultadoMotor.validas || []).length,
          totalRotasReconocidas: (resultadoMotor.rotasReconocidas || []).length,
          totalRechazadasDefinitivas: (resultadoMotor.rechazadasDefinitivas || []).length,
          totalTablaBReconocida: (resultadoMotor.tablaBReconocida || []).length,
          slotsEnviados: 0,
          slotsDevueltos: 0,
          mergeStatus: B1_MERGE_STATUS.NO_INTENTADO,
          elapsedMs: cronometro.elapsed(),
          tiempos: tiempos
        }),
        diagnostico: B1_exportarDiagnostico(diagnosticoBuffer)
      });
    }

    var resultadoRescate;
    try {
      resultadoRescate = await B1_ejecutarRescate(
        loteRescate,
        textoBase,
        cronometro,
        input.sessionToken,
        configValida.config.urlTrastienda
      );
      tiempos.rescate = resultadoRescate.tiempos || null;
    } catch (errRescate) {
      B1_diagEncadenado(
        diagnosticoBuffer,
        errRescate.upstreamCode || B1_ERRORES.RESCATE_FALLIDO,
        errRescate.upstreamModule || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
        cronometro.elapsed()
      );
      return B1_crearRespuestaError({
        code: errRescate.upstreamCode || B1_ERRORES.RESCATE_FALLIDO,
        message: errRescate.message || 'Rescate Gemini fallido.',
        tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
        retryable: true,
        traceId: traceId,
        elapsedMs: cronometro.elapsed(),
        chainedFrom: errRescate.upstreamModule || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
        errorOriginal: errRescate.raw || null,
        textoBaseVision: textoBase,
        metricas: B1_crearMetricas({
          pageConfidence: fiabilidad.pageConfidence,
          criticalZoneScore: fiabilidad.criticalZoneScore,
          totalPalabrasAnalizadas: palabrasOCR.length,
          totalValidas: (resultadoMotor.validas || []).length,
          totalRotasReconocidas: (resultadoMotor.rotasReconocidas || []).length,
          totalRechazadasDefinitivas: (resultadoMotor.rechazadasDefinitivas || []).length,
          totalTablaBReconocida: (resultadoMotor.tablaBReconocida || []).length,
          slotsEnviados: loteRescate.totalSlots,
          slotsDevueltos: 0,
          mergeStatus: B1_MERGE_STATUS.NO_INTENTADO,
          elapsedMs: cronometro.elapsed(),
          abortReason: 'rescate_fallido',
          tiempos: tiempos
        }),
        diagnostico: B1_exportarDiagnostico(diagnosticoBuffer),
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.REINTENTAR
      });
    }

    B1_diagRescate(diagnosticoBuffer, resultadoRescate, cronometro.elapsed(), null);

    var merge = B1_ejecutarMerge(textoBase, loteRescate.slots, resultadoRescate, palabrasOCR);
    B1_diagMerge(diagnosticoBuffer, merge, cronometro.elapsed(), null);

    var pasaporte = B1_emitirPasaporte(merge, fiabilidad, true, cronometro, null);
    if (merge.noResueltas && merge.noResueltas.length > 0) {
      pasaporte.estado = B1_PASSPORT.ROJO;
      pasaporte.explicacion = merge.noResueltas.length + ' alergenos no resueltos.';
      pasaporte.accionSugeridaParaCerebro = B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO;
    }
    B1_diagPasaporte(
      diagnosticoBuffer,
      pasaporte.estado,
      pasaporte.explicacion,
      cronometro.elapsed(),
      null
    );

    return B1_crearRespuestaOk({
      estadoPasaporte: pasaporte.estado,
      accionSugeridaParaCerebro: pasaporte.accionSugeridaParaCerebro,
      elapsedMs: cronometro.elapsed(),
      traceId: traceId,
      textoBaseVision: textoBase,
      textoAuditado: merge.textoAuditado || textoBase,
      correcciones: merge.correcciones || [],
      noResueltas: merge.noResueltas || [],
      roiRefsRevision: merge.roiRefsRevision || [],
      validas: resultadoMotor.validas || [],
      tablaBReconocida: resultadoMotor.tablaBReconocida || [],
      pesoVolumenProducto: _B1_core_extraerPesoVolumenProducto(resultadoMotor),
      detalleSlots: merge.detalleSlots || [],
      metricas: B1_crearMetricas({
        pageConfidence: fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad.criticalZoneScore,
        totalPalabrasAnalizadas: palabrasOCR.length,
        totalValidas: (resultadoMotor.validas || []).length,
        totalRotasReconocidas: (resultadoMotor.rotasReconocidas || []).length,
        totalRechazadasDefinitivas: (resultadoMotor.rechazadasDefinitivas || []).length,
        totalTablaBReconocida: (resultadoMotor.tablaBReconocida || []).length,
        slotsEnviados: resultadoRescate.slotsEnviados || 0,
        slotsDevueltos: resultadoRescate.slotsDevueltos || 0,
        mergeStatus: merge.mergeStatus || B1_MERGE_STATUS.NO_INTENTADO,
        rescatesIntentados: resultadoRescate.intentado ? 1 : 0,
        rescatesAplicados: (merge.correcciones || []).length,
        elapsedMs: cronometro.elapsed(),
        tiempos: tiempos
      }),
      diagnostico: B1_exportarDiagnostico(diagnosticoBuffer)
    });
  } catch (err) {
    return B1_crearRespuestaError({
      code: B1_ERRORES.ERROR_INTERNO,
      message: err && err.message ? err.message : 'Error interno Boxer1_Core.',
      tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
      retryable: true,
      traceId: traceId,
      elapsedMs: cronometro.elapsed(),
      textoBaseVision: textoBase,
      metricas: B1_crearMetricas({
        pageConfidence: fiabilidad && fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad && fiabilidad.criticalZoneScore,
        totalValidas: resultadoMotor && resultadoMotor.validas ? resultadoMotor.validas.length : 0,
        totalRotasReconocidas: resultadoMotor && resultadoMotor.rotasReconocidas ? resultadoMotor.rotasReconocidas.length : 0,
        totalRechazadasDefinitivas: resultadoMotor && resultadoMotor.rechazadasDefinitivas ? resultadoMotor.rechazadasDefinitivas.length : 0,
        totalTablaBReconocida: resultadoMotor && resultadoMotor.tablaBReconocida ? resultadoMotor.tablaBReconocida.length : 0,
        elapsedMs: cronometro.elapsed(),
        abortReason: 'error_interno',
        tiempos: tiempos
      }),
      diagnostico: B1_exportarDiagnostico(diagnosticoBuffer),
      errorOriginal: err && err.stack ? err.stack : String(err),
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.REINTENTAR
    });
  }
}
