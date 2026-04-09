/**
 * =====================================================================
 * BOXER 1 v2 · CORE
 * =====================================================================
 * Director de orquesta del flujo Boxer 1.
 * Conecta validacion, prechequeo, OCR, motor, rescate opcional y pasaporte.
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

function _B1_core_construirPendientesSinRescate(rotasReconocidas) {
  var rotas = Array.isArray(rotasReconocidas) ? rotasReconocidas : [];
  var noResueltas = [];
  var detalleSlots = [];

  for (var i = 0; i < rotas.length; i++) {
    var rota = rotas[i] || {};
    var slotId = 'R' + (i + 1);
    noResueltas.push(slotId);
    detalleSlots.push({
      slotId: slotId,
      estadoFinal: 'no_resuelta',
      original: String(rota.tokenOriginal || ''),
      solucion: '',
      motivo: 'sin_rescate_configurado'
    });
  }

  return {
    noResueltas: noResueltas,
    detalleSlots: detalleSlots
  };
}

function _B1_core_esTimeoutTecnico(err) {
  return !!(err && err.upstreamCode === 'HTTP_TIMEOUT');
}

function _B1_core_esErrorTecnicoReparable(err) {
  if (!err) return false;

  var code = typeof err.upstreamCode === 'string' ? err.upstreamCode : '';
  var message = err && err.message ? String(err.message) : '';

  if (code === 'HTTP_TIMEOUT') return true;
  if (/^HTTP_5\d\d$/.test(code)) return true;
  if (code === 'HTTP_UNKNOWN') return true;
  if (err.name === 'TypeError') return true;
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(message)) return true;

  return false;
}

function _B1_core_crearIntentoAutoreparacion(intento, accion, err) {
  return {
    intento: intento,
    accion: accion,
    code: (err && (err.upstreamCode || err.code)) || B1_ERRORES.ERROR_INTERNO,
    modulo: (err && (err.upstreamModule || err.origin)) || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
    message: err && err.message ? String(err.message) : 'Error tecnico sin detalle.'
  };
}

function _B1_core_sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, Math.max(0, ms | 0));
  });
}

async function _B1_core_ejecutarConAutoreparacionTecnica(nombreOperacion, ejecutar, diagnosticoBuffer, cronometro) {
  var maxIntentos = Math.max(1, Math.min((B1_CONFIG && B1_CONFIG.AUTOREPAIR_MAX_ATTEMPTS) || 2, 2));
  var esRescateGemini = nombreOperacion === 'rescate_gemini';
  var maxTotalMs = esRescateGemini
    ? ((B1_CONFIG && B1_CONFIG.RESCATE_MAX_TOTAL_MS) || 15000)
    : null;
  var retryDelayMs = esRescateGemini
    ? ((B1_CONFIG && B1_CONFIG.AUTOREPAIR_RETRY_DELAY_MS) || 300)
    : 0;
  var intentos = [];
  var inicio = Date.now();
  var ultimoError = null;

  for (var intento = 1; intento <= maxIntentos; intento++) {
    var elapsedAntesIntento = Date.now() - inicio;
    var remainingMs = (typeof maxTotalMs === 'number') ? (maxTotalMs - elapsedAntesIntento) : null;

    if (typeof remainingMs === 'number' && remainingMs <= 0) {
      if (!ultimoError) {
        ultimoError = B1_crearErrorUpstream({
          message: 'Tiempo maximo total agotado en ' + nombreOperacion + '.',
          upstreamCode: 'HTTP_TIMEOUT',
          upstreamModule: B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
          raw: null
        });
        intentos.push(_B1_core_crearIntentoAutoreparacion(
          intento,
          'limite_tiempo_total',
          ultimoError
        ));
      }
      break;
    }

    try {
      var resultado = await ejecutar(intento, {
        elapsedMs: elapsedAntesIntento,
        remainingMs: remainingMs,
        maxTotalMs: maxTotalMs
      });
      if (intento > 1) {
        B1_diagReparacion(
          diagnosticoBuffer,
          nombreOperacion + ': recuperado tras reintento tecnico.',
          cronometro.elapsed(),
          null
        );
      }
      return {
        resultado: resultado,
        intentos: intentos,
        tiempoTotalReintentoMs: Date.now() - inicio
      };
    } catch (err) {
      ultimoError = err;
      intentos.push(_B1_core_crearIntentoAutoreparacion(
        intento,
        intento === 1 ? 'intento_inicial' : 'reintento_tecnico',
        err
      ));

      if (_B1_core_esTimeoutTecnico(err)) {
        B1_diagTimeout(diagnosticoBuffer, nombreOperacion, cronometro.elapsed(), null);
      }

      if (!_B1_core_esErrorTecnicoReparable(err) || intento >= maxIntentos) {
        break;
      }

      if (retryDelayMs > 0) {
        var elapsedTrasFallo = Date.now() - inicio;
        if (typeof maxTotalMs === 'number' && elapsedTrasFallo >= maxTotalMs) {
          break;
        }

        var delayAplicado = retryDelayMs;
        if (typeof maxTotalMs === 'number') {
          delayAplicado = Math.min(delayAplicado, Math.max(0, maxTotalMs - elapsedTrasFallo));
        }

        if (delayAplicado > 0) {
          await _B1_core_sleep(delayAplicado);
        }
      }
    }
  }

  if (ultimoError) {
    ultimoError.reparacionAgotada = intentos.length > 1 && _B1_core_esErrorTecnicoReparable(ultimoError);
    ultimoError.intentos = intentos;
    ultimoError.tiempoTotalReintentoMs = Date.now() - inicio;
  }

  throw ultimoError || new Error(nombreOperacion + ' fallo.');
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
  var prechequeo = null;
  var textoBase = '';
  var fiabilidad = null;
  var resultadoMotor = null;
  var loteRescate = null;
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

    var datosEntrada = entradaValida.datos || input.datos || {};
    var agentEnabled = datosEntrada.agentEnabled !== false;

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

    prechequeo = await B1_prechequeo(datosEntrada.imageRef, cronometro);
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
      visionRespuesta = (await _B1_core_ejecutarConAutoreparacionTecnica(
        'vision_ocr',
        function() {
          return B1_llamarVisionOCR(
            prechequeo.canvas,
            datosEntrada.sendMode,
            input.sessionToken,
            configValida.config.urlTrastienda
          );
        },
        diagnosticoBuffer,
        cronometro
      )).resultado;
    } catch (err) {
      B1_diagEncadenado(
        diagnosticoBuffer,
        err.upstreamCode || B1_ERRORES.OCR_FAILED,
        err.upstreamModule || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
        cronometro.elapsed()
      );
      return B1_crearRespuestaError({
        code: err.upstreamCode || B1_ERRORES.OCR_FAILED,
        message: err.reparacionAgotada
          ? 'Autoreparacion tecnica agotada en Vision OCR. El fallo persiste.'
          : (err.message || 'Vision OCR fallo.'),
        tipoFallo: err.reparacionAgotada ? B1_TIPO_FALLO.REPARACION_AGOTADA : B1_TIPO_FALLO.DESCONOCIDO,
        retryable: true,
        traceId: traceId,
        elapsedMs: cronometro.elapsed(),
        chainedFrom: err.upstreamModule || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
        errorOriginal: err.raw || null,
        detail: err.reparacionAgotada
          ? 'Boxer 1 intento autorepararse con un reintento tecnico en Vision OCR, pero el fallo persiste: ' + (err.message || 'sin detalle')
          : undefined,
        tiempoTotalReintentoMs: err.tiempoTotalReintentoMs || 0,
        intentos: err.intentos || undefined,
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

    var rotasReconocidas = Array.isArray(resultadoMotor.rotasReconocidas)
      ? resultadoMotor.rotasReconocidas
      : [];
    var merge = null;
    var slotsEnviados = 0;
    var slotsDevueltos = 0;
    var rescatesIntentados = 0;
    var rescatesAplicados = 0;

    if (!agentEnabled) {
      B1_diagBypass(diagnosticoBuffer, cronometro.elapsed(), null);
    }

    if (rotasReconocidas.length === 0) {
      merge = {
        mergeStatus: B1_MERGE_STATUS.NO_INTENTADO,
        textoAuditado: textoBase,
        correcciones: [],
        noResueltas: [],
        mergeCancelado: false,
        detalleSlots: []
      };
    } else if (!agentEnabled) {
      var pendientesSinRescate = _B1_core_construirPendientesSinRescate(rotasReconocidas);
      merge = {
        mergeStatus: B1_MERGE_STATUS.NO_INTENTADO,
        textoAuditado: textoBase,
        correcciones: [],
        noResueltas: pendientesSinRescate.noResueltas,
        mergeCancelado: false,
        detalleSlots: pendientesSinRescate.detalleSlots
      };
    } else {
      loteRescate = B1_empaquetarParaRescate({
        rotasReconocidas: rotasReconocidas,
        canvas: prechequeo.canvas
      });

      slotsEnviados = loteRescate.totalSlots || 0;

      if (slotsEnviados === 0) {
        merge = {
          mergeStatus: B1_MERGE_STATUS.NO_INTENTADO,
          textoAuditado: textoBase,
          correcciones: [],
          noResueltas: [],
          mergeCancelado: false,
          detalleSlots: []
        };
      } else {
        var resultadoRescate;
        try {
          resultadoRescate = (await _B1_core_ejecutarConAutoreparacionTecnica(
            'rescate_gemini',
            function(intento, contextoIntento) {
              var timeoutBase = (intento === 1)
                ? ((B1_CONFIG && B1_CONFIG.GEMINI_FETCH_TIMEOUT_MS) || 8000)
                : ((B1_CONFIG && B1_CONFIG.GEMINI_FETCH_TIMEOUT_MS_RETRY) || 6000);
              var remainingMs = contextoIntento && typeof contextoIntento.remainingMs === 'number'
                ? contextoIntento.remainingMs
                : null;
              var timeoutFinal = timeoutBase;

              if (typeof remainingMs === 'number') {
                timeoutFinal = Math.max(1, Math.min(timeoutBase, Math.floor(remainingMs)));
              }

              return B1_ejecutarRescate(
                loteRescate,
                textoBase,
                cronometro,
                input.sessionToken,
                configValida.config.urlTrastienda,
                { geminiTimeoutMs: timeoutFinal }
              );
            },
            diagnosticoBuffer,
            cronometro
          )).resultado;
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
            message: errRescate.reparacionAgotada
              ? 'Autoreparacion tecnica agotada en rescate Gemini. El fallo persiste.'
              : (errRescate.message || 'Rescate Gemini fallido.'),
            tipoFallo: errRescate.reparacionAgotada ? B1_TIPO_FALLO.REPARACION_AGOTADA : B1_TIPO_FALLO.DESCONOCIDO,
            retryable: true,
            traceId: traceId,
            elapsedMs: cronometro.elapsed(),
            chainedFrom: errRescate.upstreamModule || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
            errorOriginal: errRescate.raw || null,
            detail: errRescate.reparacionAgotada
              ? 'Boxer 1 intento autorepararse con un reintento tecnico en rescate Gemini, pero el fallo persiste: ' + (errRescate.message || 'sin detalle')
              : undefined,
            tiempoTotalReintentoMs: errRescate.tiempoTotalReintentoMs || 0,
            intentos: errRescate.intentos || undefined,
            textoBaseVision: textoBase,
            metricas: B1_crearMetricas({
              pageConfidence: fiabilidad.pageConfidence,
              criticalZoneScore: fiabilidad.criticalZoneScore,
              totalPalabrasAnalizadas: palabrasOCR.length,
              totalValidas: (resultadoMotor.validas || []).length,
              totalRotasReconocidas: rotasReconocidas.length,
              totalRechazadasDefinitivas: (resultadoMotor.rechazadasDefinitivas || []).length,
              totalTablaBReconocida: (resultadoMotor.tablaBReconocida || []).length,
              slotsEnviados: slotsEnviados,
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

        rescatesIntentados = resultadoRescate.intentado ? 1 : 0;
        slotsEnviados = resultadoRescate.slotsEnviados || slotsEnviados;
        slotsDevueltos = resultadoRescate.slotsDevueltos || 0;

        B1_diagRescate(diagnosticoBuffer, resultadoRescate, cronometro.elapsed(), null);
        merge = B1_ejecutarMerge(textoBase, loteRescate.slots, resultadoRescate, palabrasOCR);
        rescatesAplicados = (merge.correcciones || []).length;
      }
    }

    B1_diagMerge(diagnosticoBuffer, merge, cronometro.elapsed(), null);

    var pasaporte = B1_emitirPasaporte(merge, fiabilidad, agentEnabled, cronometro, null);
    if (agentEnabled && merge.noResueltas && merge.noResueltas.length > 0) {
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
      validas: resultadoMotor.validas || [],
      tablaBReconocida: resultadoMotor.tablaBReconocida || [],
      pesoVolumenProducto: _B1_core_extraerPesoVolumenProducto(resultadoMotor),
      detalleSlots: merge.detalleSlots || [],
      metricas: B1_crearMetricas({
        pageConfidence: fiabilidad.pageConfidence,
        criticalZoneScore: fiabilidad.criticalZoneScore,
        totalPalabrasAnalizadas: palabrasOCR.length,
        totalValidas: (resultadoMotor.validas || []).length,
        totalRotasReconocidas: rotasReconocidas.length,
        totalRechazadasDefinitivas: (resultadoMotor.rechazadasDefinitivas || []).length,
        totalTablaBReconocida: (resultadoMotor.tablaBReconocida || []).length,
        slotsEnviados: slotsEnviados,
        slotsDevueltos: slotsDevueltos,
        mergeStatus: merge.mergeStatus || B1_MERGE_STATUS.NO_INTENTADO,
        rescatesIntentados: rescatesIntentados,
        rescatesAplicados: rescatesAplicados,
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
  } finally {
    if (typeof B1_programarLimpiezaTemporales === 'function') {
      B1_programarLimpiezaTemporales({
        traceId: traceId,
        slots: loteRescate && loteRescate.slots ? loteRescate.slots : [],
        canvas: prechequeo && prechequeo.canvas ? prechequeo.canvas : null,
        delayMs: B1_CONFIG.POST_ANALYSIS_CLEANUP_DELAY_MS
      });
    }
  }
}
