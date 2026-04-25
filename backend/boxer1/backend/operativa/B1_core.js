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

function _B1_core_extraerCodigoHttpUpstream(err) {
  var raw = err && err.raw ? err.raw : null;
  var candidatos = [
    raw && raw.error && raw.error.raw && raw.error.raw.error && raw.error.raw.error.code,
    raw && raw.error && raw.error.code,
    raw && raw.raw && raw.raw.error && raw.raw.error.code
  ];

  for (var i = 0; i < candidatos.length; i++) {
    var valor = candidatos[i];
    if (typeof valor === 'number' && Number.isFinite(valor)) return Math.floor(valor);
    if (typeof valor === 'string' && /^\d+$/.test(valor)) return parseInt(valor, 10);
  }

  return null;
}

function _B1_core_esGeminiTemporalmenteSaturado(err) {
  if (!err) return false;

  var code = typeof err.upstreamCode === 'string' ? err.upstreamCode : '';
  if (code !== 'GEMINI_API_ERROR') return false;

  var httpCode = _B1_core_extraerCodigoHttpUpstream(err);
  if (httpCode === 429 || httpCode === 500 || httpCode === 503 || httpCode === 504) return true;

  var message = err && err.message ? String(err.message) : '';
  var rawMessage = (
    err &&
    err.raw &&
    err.raw.error &&
    err.raw.error.raw &&
    err.raw.error.raw.error &&
    err.raw.error.raw.error.message
  ) ? String(err.raw.error.raw.error.message) : '';

  return /high demand|try again later|unavailable|temporar|overloaded|resource exhausted|too many requests/i.test(
    message + ' ' + rawMessage
  );
}

function _B1_core_esErrorTecnicoReparable(err) {
  if (!err) return false;

  var code = typeof err.upstreamCode === 'string' ? err.upstreamCode : '';
  var message = err && err.message ? String(err.message) : '';

  if (code === 'HTTP_TIMEOUT') return true;
  if (/^HTTP_5\d\d$/.test(code)) return true;
  if (code === 'HTTP_UNKNOWN') return true;
  if (_B1_core_esGeminiTemporalmenteSaturado(err)) return true;
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
  var esRescateGemini = nombreOperacion === 'rescate_gemini';
  var maxIntentosBase = Math.max(1, (B1_CONFIG && B1_CONFIG.AUTOREPAIR_MAX_ATTEMPTS) || 2);
  var maxIntentosRescate = Math.max(
    maxIntentosBase,
    (B1_CONFIG && B1_CONFIG.AUTOREPAIR_MAX_ATTEMPTS_RESCATE) || 3
  );
  var maxIntentos = esRescateGemini
    ? Math.max(1, Math.min(maxIntentosRescate, 4))
    : Math.max(1, Math.min(maxIntentosBase, 2));
  var maxTotalMs = esRescateGemini
    ? ((B1_CONFIG && B1_CONFIG.RESCATE_MAX_TOTAL_MS) || 15000)
    : null;
  var retryDelayMs = esRescateGemini
    ? (
      (B1_CONFIG && B1_CONFIG.AUTOREPAIR_RETRY_DELAY_MS_RESCATE) ||
      (B1_CONFIG && B1_CONFIG.AUTOREPAIR_RETRY_DELAY_MS) ||
      300
    )
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
        if (esRescateGemini) {
          delayAplicado = retryDelayMs * Math.max(1, intento);
          if (_B1_core_esGeminiTemporalmenteSaturado(err)) {
            delayAplicado = Math.max(delayAplicado, retryDelayMs * Math.max(2, intento + 1));
          }
        }
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
  var textoBaseVisionRaw = '';
  var filasVisionRecompuestas = [];
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
    textoBaseVisionRaw = B1_construirTextoBase(ocrNormalizado);
    var _recomp = (typeof B1_recomponerFilasVision === 'function')
      ? B1_recomponerFilasVision(visionRespuesta, ocrNormalizado)
      : null;
    textoBase = (_recomp && !_recomp.usadoFallback)
      ? _recomp.textoRecompuesto
      : textoBaseVisionRaw;
    filasVisionRecompuestas = _recomp ? (_recomp.filasRecompuestas || []) : [];
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
        textoBaseVision: textoBaseVisionRaw,
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
        textoBaseVision: textoBaseVisionRaw,
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
            textoBaseVision: textoBaseVisionRaw,
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
        merge = _B1_core_ejecutarMergeRuntime(textoBase, loteRescate.slots, resultadoRescate, palabrasOCR);
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
      textoBaseVision: textoBaseVisionRaw,
      textoAuditado: merge.textoAuditado || textoBase,
      filasVisionRecompuestas: filasVisionRecompuestas,
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
      textoBaseVision: textoBaseVisionRaw,
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

function _B1_core_fase5EstadoIA(estado, fallback) {
  if (
    typeof B1_FASE5_ESTADO_IA !== 'undefined' &&
    B1_FASE5_ESTADO_IA &&
    B1_FASE5_ESTADO_IA[estado]
  ) {
    return B1_FASE5_ESTADO_IA[estado];
  }
  return fallback;
}

function _B1_core_crearSalidaDesacoplada(params) {
  if (typeof B1_fase5CrearSalidaLocal === 'function') {
    return B1_fase5CrearSalidaLocal(params);
  }

  params = params || {};
  return {
    modulo: B1_CONFIG.MODULE_NAME,
    estadoIA: params.estadoIA || _B1_core_fase5EstadoIA('NO_NECESITA_LLAMADA', 'NO_NECESITA_LLAMADA'),
    tareasIA: Array.isArray(params.tareasIA) ? params.tareasIA : [],
    resultadoLocal: params.resultadoLocal || {},
    traceId: params.traceId || null,
    elapsedMs: params.elapsedMs || 0
  };
}

function _B1_core_crearSalidaFinalDesacoplada(respuestaFinal, traceId, cronometro) {
  return _B1_core_crearSalidaDesacoplada({
    estadoIA: _B1_core_fase5EstadoIA('NO_NECESITA_LLAMADA', 'NO_NECESITA_LLAMADA'),
    tareasIA: [],
    resultadoLocal: {
      finalizada: true,
      respuestaFinal: respuestaFinal
    },
    traceId: traceId,
    elapsedMs: cronometro.elapsed()
  });
}

function _B1_core_extraerMetaCerebro(input) {
  input = input || {};
  var meta = (input.meta && typeof input.meta === 'object') ? input.meta : {};

  return {
    traceId: meta.traceId || input.traceId || null,
    analysisId: meta.analysisId || input.analysisId || null
  };
}

function _B1_core_tieneMetaCerebroValida(meta) {
  return !!(
    meta &&
    typeof meta.traceId === 'string' &&
    meta.traceId.trim() &&
    typeof meta.analysisId === 'string' &&
    meta.analysisId.trim()
  );
}

function _B1_core_validarContratoEntradaDesacoplada(input, datosEntrada) {
  var rawDatos = input && input.datos && typeof input.datos === 'object' ? input.datos : null;

  if (!rawDatos || !Object.prototype.hasOwnProperty.call(rawDatos, 'agentEnabled')) {
    return {
      valid: false,
      reason: 'La via nueva exige agentEnabled explicito desde Cerebro.'
    };
  }

  if (!rawDatos || !Object.prototype.hasOwnProperty.call(rawDatos, 'timeBudgetMs')) {
    return {
      valid: false,
      reason: 'La via nueva exige timeBudgetMs recibido desde Cerebro.'
    };
  }

  if (
    !datosEntrada ||
    typeof datosEntrada.timeBudgetMs !== 'number' ||
    !Number.isFinite(datosEntrada.timeBudgetMs) ||
    datosEntrada.timeBudgetMs <= 0
  ) {
    return {
      valid: false,
      reason: 'timeBudgetMs debe ser un numero positivo en la via nueva.'
    };
  }

  return {
    valid: true,
    timeBudgetMs: datosEntrada.timeBudgetMs
  };
}

function _B1_core_crearErrorContratoCerebro(traceId, analysisId, cronometro, diagnosticoBuffer, detail) {
  return B1_crearRespuestaError({
    code: B1_ERRORES.CONTRATO_CEREBRO_INVALIDO,
    message: 'Faltan IDs obligatorios de Cerebro en Boxer1_Core.',
    tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
    retryable: false,
    traceId: traceId || null,
    elapsedMs: cronometro && typeof cronometro.elapsed === 'function' ? cronometro.elapsed() : 0,
    detail: detail || 'La via desacoplada exige traceId y analysisId recibidos desde Cerebro.',
    diagnostico: B1_exportarDiagnostico(diagnosticoBuffer || B1_crearBufferDiagnostico(traceId || null)),
    accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.ABORTAR_FLUJO
  });
}

function _B1_core_resolverMergeRuntime() {
  if (typeof globalThis !== 'undefined' && typeof globalThis.B1_ejecutarMerge === 'function') {
    return globalThis.B1_ejecutarMerge;
  }
  if (typeof B1_ejecutarMerge === 'function') {
    return B1_ejecutarMerge;
  }
  throw new Error('B1_ejecutarMerge no disponible.');
}

function _B1_core_ejecutarMergeRuntime(textoBase, slotsEnviados, resultadoRescate, palabrasOCR) {
  return _B1_core_resolverMergeRuntime()(textoBase, slotsEnviados, resultadoRescate, palabrasOCR);
}

function _B1_core_crearSalidaPendienteIA(contextoLocal, tareaIA) {
  return _B1_core_crearSalidaDesacoplada({
    estadoIA: _B1_core_fase5EstadoIA('NECESITA_LLAMADA', 'NECESITA_LLAMADA'),
    tareasIA: tareaIA ? [tareaIA] : [],
    resultadoLocal: contextoLocal,
    traceId: contextoLocal && contextoLocal.traceId,
    elapsedMs: contextoLocal && contextoLocal.cronometro ? contextoLocal.cronometro.elapsed() : 0
  });
}

function _B1_core_programarLimpieza(traceId, loteRescate, prechequeo) {
  if (typeof B1_programarLimpiezaTemporales === 'function') {
    B1_programarLimpiezaTemporales({
      traceId: traceId,
      slots: loteRescate && loteRescate.slots ? loteRescate.slots : [],
      canvas: prechequeo && prechequeo.canvas ? prechequeo.canvas : null,
      delayMs: B1_CONFIG.POST_ANALYSIS_CLEANUP_DELAY_MS
    });
  }
}

function _B1_core_construirRespuestaFinalOk(params) {
  return B1_crearRespuestaOk({
    estadoPasaporte: params.pasaporte.estado,
    accionSugeridaParaCerebro: params.pasaporte.accionSugeridaParaCerebro,
    elapsedMs: params.cronometro.elapsed(),
    traceId: params.traceId,
    textoBaseVision: params.textoBaseVisionRaw || params.textoBase || '',
    textoAuditado: params.merge.textoAuditado || params.textoBase || params.textoBaseVisionRaw || '',
    filasVisionRecompuestas: params.filasVisionRecompuestas || [],
    correcciones: params.merge.correcciones || [],
    noResueltas: params.merge.noResueltas || [],
    validas: params.resultadoMotor.validas || [],
    tablaBReconocida: params.resultadoMotor.tablaBReconocida || [],
    pesoVolumenProducto: _B1_core_extraerPesoVolumenProducto(params.resultadoMotor),
    detalleSlots: params.merge.detalleSlots || [],
    metricas: B1_crearMetricas({
      pageConfidence: params.fiabilidad.pageConfidence,
      criticalZoneScore: params.fiabilidad.criticalZoneScore,
      totalPalabrasAnalizadas: params.palabrasOCR.length,
      totalValidas: (params.resultadoMotor.validas || []).length,
      totalRotasReconocidas: params.rotasReconocidas.length,
      totalRechazadasDefinitivas: (params.resultadoMotor.rechazadasDefinitivas || []).length,
      totalTablaBReconocida: (params.resultadoMotor.tablaBReconocida || []).length,
      slotsEnviados: params.slotsEnviados || 0,
      slotsDevueltos: params.slotsDevueltos || 0,
      mergeStatus: params.merge.mergeStatus || B1_MERGE_STATUS.NO_INTENTADO,
      rescatesIntentados: params.rescatesIntentados || 0,
      rescatesAplicados: params.rescatesAplicados || 0,
      elapsedMs: params.cronometro.elapsed(),
      tiempos: params.tiempos
    }),
    diagnostico: B1_exportarDiagnostico(params.diagnosticoBuffer)
  });
}

function _B1_core_normalizarEntradaCierreDesacoplado(salidaLocal) {
  if (!salidaLocal || typeof salidaLocal !== 'object') return null;
  if (salidaLocal.resultadoLocal && typeof salidaLocal.resultadoLocal === 'object') {
    return {
      estadoIA: salidaLocal.estadoIA || null,
      traceId: salidaLocal.traceId || salidaLocal.resultadoLocal.traceId || null,
      analysisId: salidaLocal.resultadoLocal.analysisId || null,
      contexto: salidaLocal.resultadoLocal
    };
  }

  return {
    estadoIA: null,
    traceId: salidaLocal.traceId || null,
    analysisId: salidaLocal.analysisId || null,
    contexto: salidaLocal
  };
}

function _B1_core_construirResultadoRescateBroker(contextoLocal, dataRescate) {
  return {
    intentado: true,
    correcciones: dataRescate.correcciones || [],
    slotsEnviados: contextoLocal.slotsEnviados || 0,
    slotsDevueltos: (dataRescate.correcciones || []).length,
    necesitaTroceo: false,
    lotesEjecutados: 1,
    razon: null,
    erroresLote: 0,
    upstreamError: null,
    tiempos: dataRescate.tiempos || null
  };
}

function B1_cerrarConSubrespuestaIA(salidaLocal, subrespuestaIA) {
  var entrada = _B1_core_normalizarEntradaCierreDesacoplado(salidaLocal);
  if (!entrada || !entrada.contexto) {
    throw new Error('Salida local Boxer 1 invalida para cerrar.');
  }

  var contextoLocal = entrada.contexto;
  if (contextoLocal.finalizada && contextoLocal.respuestaFinal) {
    return contextoLocal.respuestaFinal;
  }

  var traceId = entrada.traceId || contextoLocal.traceId || null;
  var analysisId = entrada.analysisId || contextoLocal.analysisId || null;
  var cronometro = contextoLocal.cronometro || B1_crearCronometro();
  var diagnosticoBuffer = contextoLocal.diagnosticoBuffer || B1_crearBufferDiagnostico(traceId);

  if (!_B1_core_tieneMetaCerebroValida({ traceId: traceId, analysisId: analysisId })) {
    return _B1_core_crearErrorContratoCerebro(
      traceId,
      analysisId,
      cronometro,
      diagnosticoBuffer,
      'Cierre desacoplado sin traceId/analysisId validos de Cerebro.'
    );
  }
  var validacion = (typeof B1_fase5ValidarSubrespuestaIARescate === 'function')
    ? B1_fase5ValidarSubrespuestaIARescate(subrespuestaIA, {
      traceId: traceId,
      analysisId: analysisId,
      taskId: (typeof B1_fase5TaskIdRescate === 'function') ? B1_fase5TaskIdRescate() : 'b1_r01'
    })
    : { ok: true, data: subrespuestaIA };

  if (!validacion.ok) {
    B1_diagEncadenado(
      diagnosticoBuffer,
      B1_ERRORES.RESCATE_FALLIDO,
      'Broker_IA',
      cronometro.elapsed()
    );

    return B1_crearRespuestaError({
      code: B1_ERRORES.RESCATE_FALLIDO,
      message: 'Subrespuesta IA invalida para Boxer 1.',
      tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
      retryable: true,
      traceId: traceId,
      elapsedMs: cronometro.elapsed(),
      chainedFrom: 'Broker_IA',
      detail: validacion.reason || 'Sin detalle.',
      textoBaseVision: contextoLocal.textoBaseVisionRaw || contextoLocal.textoBase || '',
      metricas: B1_crearMetricas({
        pageConfidence: contextoLocal.fiabilidad && contextoLocal.fiabilidad.pageConfidence,
        criticalZoneScore: contextoLocal.fiabilidad && contextoLocal.fiabilidad.criticalZoneScore,
        totalPalabrasAnalizadas: contextoLocal.palabrasOCR ? contextoLocal.palabrasOCR.length : 0,
        totalValidas: contextoLocal.resultadoMotor && contextoLocal.resultadoMotor.validas ? contextoLocal.resultadoMotor.validas.length : 0,
        totalRotasReconocidas: contextoLocal.rotasReconocidas ? contextoLocal.rotasReconocidas.length : 0,
        totalRechazadasDefinitivas: contextoLocal.resultadoMotor && contextoLocal.resultadoMotor.rechazadasDefinitivas ? contextoLocal.resultadoMotor.rechazadasDefinitivas.length : 0,
        totalTablaBReconocida: contextoLocal.resultadoMotor && contextoLocal.resultadoMotor.tablaBReconocida ? contextoLocal.resultadoMotor.tablaBReconocida.length : 0,
        slotsEnviados: contextoLocal.slotsEnviados || 0,
        slotsDevueltos: 0,
        mergeStatus: B1_MERGE_STATUS.NO_INTENTADO,
        rescatesIntentados: 1,
        elapsedMs: cronometro.elapsed(),
        abortReason: 'subrespuesta_ia_invalida',
        tiempos: contextoLocal.tiempos || null
      }),
      diagnostico: B1_exportarDiagnostico(diagnosticoBuffer),
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.ABRIR_REVISION
    });
  }

  var normalizado = B1_normalizarSubrespuestaIARescate(validacion.data);
  if (!normalizado.ok) {
    B1_diagEncadenado(
      diagnosticoBuffer,
      B1_ERRORES.RESCATE_FALLIDO,
      'Broker_IA',
      cronometro.elapsed()
    );

    return B1_crearRespuestaError({
      code: B1_ERRORES.RESCATE_FALLIDO,
      message: 'Respuesta IA sin formato util para Boxer 1.',
      tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
      retryable: true,
      traceId: traceId,
      elapsedMs: cronometro.elapsed(),
      chainedFrom: 'Broker_IA',
      detail: normalizado.reason || 'Sin detalle.',
      textoBaseVision: contextoLocal.textoBaseVisionRaw || contextoLocal.textoBase || '',
      metricas: B1_crearMetricas({
        pageConfidence: contextoLocal.fiabilidad && contextoLocal.fiabilidad.pageConfidence,
        criticalZoneScore: contextoLocal.fiabilidad && contextoLocal.fiabilidad.criticalZoneScore,
        totalPalabrasAnalizadas: contextoLocal.palabrasOCR ? contextoLocal.palabrasOCR.length : 0,
        totalValidas: contextoLocal.resultadoMotor && contextoLocal.resultadoMotor.validas ? contextoLocal.resultadoMotor.validas.length : 0,
        totalRotasReconocidas: contextoLocal.rotasReconocidas ? contextoLocal.rotasReconocidas.length : 0,
        totalRechazadasDefinitivas: contextoLocal.resultadoMotor && contextoLocal.resultadoMotor.rechazadasDefinitivas ? contextoLocal.resultadoMotor.rechazadasDefinitivas.length : 0,
        totalTablaBReconocida: contextoLocal.resultadoMotor && contextoLocal.resultadoMotor.tablaBReconocida ? contextoLocal.resultadoMotor.tablaBReconocida.length : 0,
        slotsEnviados: contextoLocal.slotsEnviados || 0,
        slotsDevueltos: 0,
        mergeStatus: B1_MERGE_STATUS.NO_INTENTADO,
        rescatesIntentados: 1,
        elapsedMs: cronometro.elapsed(),
        abortReason: 'normalizacion_ia_invalida',
        tiempos: contextoLocal.tiempos || null
      }),
      diagnostico: B1_exportarDiagnostico(diagnosticoBuffer),
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.ABRIR_REVISION
    });
  }

  var tiempos = contextoLocal.tiempos || _B1_core_crearTiempos();
  tiempos.rescate = normalizado.tiempos || tiempos.rescate || null;

  var resultadoRescate = _B1_core_construirResultadoRescateBroker(contextoLocal, normalizado);
  var slotsDevueltos = resultadoRescate.slotsDevueltos || 0;
  B1_diagRescate(diagnosticoBuffer, resultadoRescate, cronometro.elapsed(), null);

  var merge = _B1_core_ejecutarMergeRuntime(
    contextoLocal.textoBase || '',
    (contextoLocal.loteRescate && contextoLocal.loteRescate.slots) ? contextoLocal.loteRescate.slots : [],
    resultadoRescate,
    contextoLocal.palabrasOCR || []
  );
  var rescatesAplicados = (merge.correcciones || []).length;
  B1_diagMerge(diagnosticoBuffer, merge, cronometro.elapsed(), null);

  var pasaporte = B1_emitirPasaporte(
    merge,
    contextoLocal.fiabilidad || { pageConfidence: null, criticalZoneScore: null },
    contextoLocal.agentEnabled !== false,
    cronometro,
    null
  );
  if (contextoLocal.agentEnabled !== false && merge.noResueltas && merge.noResueltas.length > 0) {
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

  return _B1_core_construirRespuestaFinalOk({
    pasaporte: pasaporte,
    cronometro: cronometro,
    traceId: traceId,
    textoBase: contextoLocal.textoBase || '',
    merge: merge,
    resultadoMotor: contextoLocal.resultadoMotor || {},
    fiabilidad: contextoLocal.fiabilidad || { pageConfidence: null, criticalZoneScore: null },
    palabrasOCR: contextoLocal.palabrasOCR || [],
    rotasReconocidas: contextoLocal.rotasReconocidas || [],
    slotsEnviados: contextoLocal.slotsEnviados || 0,
    slotsDevueltos: slotsDevueltos,
    rescatesIntentados: 1,
    rescatesAplicados: rescatesAplicados,
    tiempos: tiempos,
    diagnosticoBuffer: diagnosticoBuffer
  });
}

function _B1_core_minimizarResultadoLocalParaSalida(contextoLocal) {
  if (!contextoLocal || typeof contextoLocal !== 'object') {
    return {};
  }

  return {
    version: contextoLocal.version || 'b1_fase5_desacoplado_v1',
    finalizada: !!contextoLocal.finalizada,
    traceId: contextoLocal.traceId || null,
    analysisId: contextoLocal.analysisId || null,
    timeBudgetMs: contextoLocal.timeBudgetMs || null,
    textoBase: contextoLocal.textoBase || '',
    textoBaseVisionRaw: contextoLocal.textoBaseVisionRaw || contextoLocal.textoBase || '',
    fiabilidad: contextoLocal.fiabilidad || null,
    resultadoMotor: contextoLocal.resultadoMotor || null,
    palabrasOCR: Array.isArray(contextoLocal.palabrasOCR) ? contextoLocal.palabrasOCR : [],
    loteRescate: contextoLocal.loteRescate || null,
    tiempos: contextoLocal.tiempos || null,
    agentEnabled: contextoLocal.agentEnabled !== false,
    rotasReconocidas: Array.isArray(contextoLocal.rotasReconocidas) ? contextoLocal.rotasReconocidas : [],
    slotsEnviados: contextoLocal.slotsEnviados || 0,
    rescatesIntentados: contextoLocal.rescatesIntentados || 0,
    rescatesAplicados: contextoLocal.rescatesAplicados || 0,
    respuestaFinal: contextoLocal.respuestaFinal || null
  };
}

function _B1_core_extraerResultadoFaseLocalDesdeSalidaDesacoplada(salida) {
  var salidaLocal = salida || {};
  var resultadoLocal = salidaLocal.resultadoLocal || {};
  var traceId = salidaLocal.traceId || resultadoLocal.traceId || null;
  var analysisId = resultadoLocal.analysisId || null;
  var elapsedMs = typeof salidaLocal.elapsedMs === 'number' ? salidaLocal.elapsedMs : 0;

  if (resultadoLocal && resultadoLocal.finalizada && resultadoLocal.respuestaFinal) {
    return {
      finalizada: true,
      respuestaFinal: resultadoLocal.respuestaFinal,
      traceId: traceId,
      analysisId: analysisId,
      elapsedMs: elapsedMs
    };
  }

  return {
    finalizada: false,
    traceId: traceId,
    analysisId: analysisId,
    elapsedMs: elapsedMs,
    resultadoLocal: _B1_core_minimizarResultadoLocalParaSalida(resultadoLocal)
  };
}

async function _B1_analizarDesacopladoInterno(input, config, dependenciasExternas) {
  dependenciasExternas = dependenciasExternas || {};

  var metaCerebro = _B1_core_extraerMetaCerebro(input);
  var traceId = metaCerebro.traceId || null;
  var analysisId = metaCerebro.analysisId || null;
  var diagnosticoBuffer = B1_crearBufferDiagnostico(traceId);
  var cronometro = B1_crearCronometro();
  var visionRespuesta = null;
  var prechequeo = null;
  var textoBase = '';
  var textoBaseVisionRaw = '';
  var filasVisionRecompuestas = [];
  var fiabilidad = null;
  var resultadoMotor = null;
  var loteRescate = null;
  var tiempos = _B1_core_crearTiempos();

  try {
    if (!_B1_core_tieneMetaCerebroValida(metaCerebro)) {
      return _B1_core_crearSalidaFinalDesacoplada(
        _B1_core_crearErrorContratoCerebro(
          traceId,
          analysisId,
          cronometro,
          diagnosticoBuffer,
          'La via desacoplada de Boxer1_Core no puede inventar traceId ni analysisId.'
        ),
        traceId,
        cronometro
      );
    }

    var entradaValida = B1_validarEntrada(input);
    if (!entradaValida.valid) {
      return _B1_core_crearSalidaFinalDesacoplada(
        _B1_core_errorEntrada(
          traceId,
          cronometro.elapsed(),
          B1_exportarDiagnostico(diagnosticoBuffer),
          'Entrada invalida.',
          entradaValida.reason
        ),
        traceId,
        cronometro
      );
    }

    var datosEntrada = entradaValida.datos || input.datos || {};
    var agentEnabled = datosEntrada.agentEnabled !== false;
    var contratoEntradaDesacoplada = _B1_core_validarContratoEntradaDesacoplada(input, datosEntrada);
    if (!contratoEntradaDesacoplada.valid) {
      return _B1_core_crearSalidaFinalDesacoplada(
        _B1_core_errorEntrada(
          traceId,
          cronometro.elapsed(),
          B1_exportarDiagnostico(diagnosticoBuffer),
          'Entrada invalida.',
          contratoEntradaDesacoplada.reason
        ),
        traceId,
        cronometro
      );
    }
    var timeBudgetMs = contratoEntradaDesacoplada.timeBudgetMs;

    var configValida = B1_validarConfig(config);
    if (!configValida.valid) {
      return _B1_core_crearSalidaFinalDesacoplada(
        B1_crearRespuestaError({
          code: 'B1_CONFIG_INVALIDA',
          message: 'Config invalida.',
          tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
          retryable: false,
          traceId: traceId,
          elapsedMs: cronometro.elapsed(),
          detail: configValida.reason,
          diagnostico: B1_exportarDiagnostico(diagnosticoBuffer),
          accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO
        }),
        traceId,
        cronometro
      );
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
      return _B1_core_crearSalidaFinalDesacoplada(
        B1_crearRespuestaError({
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
        }),
        traceId,
        cronometro
      );
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
      return _B1_core_crearSalidaFinalDesacoplada(
        B1_crearRespuestaError({
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
        }),
        traceId,
        cronometro
      );
    }

    tiempos.visionCliente = _B1_core_extraerTiemposOCR(visionRespuesta);
    tiempos.visionUpstream = visionRespuesta && visionRespuesta.__b1Upstream ? visionRespuesta.__b1Upstream : null;

    var ocrNormalizado = B1_normalizarOCR(visionRespuesta);
    textoBaseVisionRaw = B1_construirTextoBase(ocrNormalizado);
    var _recomp = (typeof B1_recomponerFilasVision === 'function')
      ? B1_recomponerFilasVision(visionRespuesta, ocrNormalizado)
      : null;
    textoBase = (_recomp && !_recomp.usadoFallback)
      ? _recomp.textoRecompuesto
      : textoBaseVisionRaw;
    filasVisionRecompuestas = _recomp ? (_recomp.filasRecompuestas || []) : [];
    B1_diagOCR(
      diagnosticoBuffer,
      !!ocrNormalizado.visionVacia,
      ocrNormalizado.totalPalabras || 0,
      cronometro.elapsed(),
      tiempos.visionCliente && tiempos.visionCliente.t_ocr_llamada_total_ms
    );

    if (!textoBase || ocrNormalizado.visionVacia) {
      return _B1_core_crearSalidaFinalDesacoplada(
        B1_crearRespuestaError({
          code: B1_ERRORES.OCR_VACIO,
          message: 'Vision no devolvio texto util.',
          tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
          retryable: true,
          traceId: traceId,
          elapsedMs: cronometro.elapsed(),
          textoBaseVision: textoBaseVisionRaw,
          metricas: B1_crearMetricas({
            totalPalabrasAnalizadas: ocrNormalizado.totalPalabras || 0,
            elapsedMs: cronometro.elapsed(),
            abortReason: 'ocr_vacio',
            tiempos: tiempos
          }),
          diagnostico: B1_exportarDiagnostico(diagnosticoBuffer),
          accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.REINTENTAR
        }),
        traceId,
        cronometro
      );
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
      return _B1_core_crearSalidaFinalDesacoplada(
        B1_crearRespuestaError({
          code: B1_ERRORES.CATALOGOS_NO_LISTO,
          message: 'Catalogos no listos.',
          tipoFallo: B1_TIPO_FALLO.IRRECUPERABLE_POR_DISENO,
          retryable: false,
          traceId: traceId,
          elapsedMs: cronometro.elapsed(),
          detail: globalThis.B1_CATALOGOS_ERROR || null,
          textoBaseVision: textoBaseVisionRaw,
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
        }),
        traceId,
        cronometro
      );
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
        var tareaIA = (dependenciasExternas.crearTareaRescateIA || B1_fase5CrearSolicitudRescateIA)(
          loteRescate,
          textoBase,
          traceId,
          analysisId
        );

        rescatesIntentados = 1;

        return _B1_core_crearSalidaPendienteIA({
          version: 'b1_fase5_desacoplado_v1',
          finalizada: false,
          traceId: traceId,
          analysisId: analysisId,
          timeBudgetMs: timeBudgetMs,
          cronometro: cronometro,
          diagnosticoBuffer: diagnosticoBuffer,
          textoBase: textoBase,
          textoBaseVisionRaw: textoBaseVisionRaw,
          fiabilidad: fiabilidad,
          resultadoMotor: resultadoMotor,
          palabrasOCR: palabrasOCR,
          loteRescate: loteRescate,
          tiempos: tiempos,
          agentEnabled: agentEnabled,
          rotasReconocidas: rotasReconocidas,
          slotsEnviados: slotsEnviados,
          rescatesIntentados: rescatesIntentados,
          rescatesAplicados: rescatesAplicados,
          dependenciasExternas: {
            cerrarConSubrespuestaIA: 'B1_cerrarConSubrespuestaIA'
          }
        }, tareaIA);
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

    return _B1_core_crearSalidaFinalDesacoplada(
      _B1_core_construirRespuestaFinalOk({
        pasaporte: pasaporte,
        cronometro: cronometro,
        traceId: traceId,
        textoBase: textoBase,
        textoBaseVisionRaw: textoBaseVisionRaw,
        filasVisionRecompuestas: filasVisionRecompuestas,
        merge: merge,
        resultadoMotor: resultadoMotor,
        fiabilidad: fiabilidad,
        palabrasOCR: palabrasOCR,
        rotasReconocidas: rotasReconocidas,
        slotsEnviados: slotsEnviados,
        slotsDevueltos: slotsDevueltos,
        rescatesIntentados: rescatesIntentados,
        rescatesAplicados: rescatesAplicados,
        tiempos: tiempos,
        diagnosticoBuffer: diagnosticoBuffer
      }),
        traceId,
        cronometro
      );
  } catch (err) {
    return _B1_core_crearSalidaFinalDesacoplada(
      B1_crearRespuestaError({
        code: B1_ERRORES.ERROR_INTERNO,
        message: err && err.message ? err.message : 'Error interno Boxer1_Core.',
        tipoFallo: B1_TIPO_FALLO.DESCONOCIDO,
        retryable: true,
        traceId: traceId,
        elapsedMs: cronometro.elapsed(),
        textoBaseVision: textoBaseVisionRaw,
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
      }),
      traceId,
      cronometro
    );
  } finally {
    _B1_core_programarLimpieza(traceId, loteRescate, prechequeo);
  }
}

async function B1_ejecutarFaseLocal(input, config, dependenciasExternas) {
  var salidaLocal = await _B1_analizarDesacopladoInterno(input, config, dependenciasExternas);
  return _B1_core_extraerResultadoFaseLocalDesdeSalidaDesacoplada(salidaLocal);
}

function B1_generarSolicitudIADesdeResultadoLocal(resultadoFaseLocal, dependenciasExternas) {
  dependenciasExternas = dependenciasExternas || {};
  var faseLocal = resultadoFaseLocal || {};

  if (faseLocal.finalizada) {
    return _B1_core_crearSalidaDesacoplada({
      estadoIA: _B1_core_fase5EstadoIA('NO_NECESITA_LLAMADA', 'NO_NECESITA_LLAMADA'),
      tareasIA: [],
      resultadoLocal: {
        finalizada: true,
        respuestaFinal: faseLocal.respuestaFinal || null
      },
      traceId: faseLocal.traceId || null,
      elapsedMs: faseLocal.elapsedMs || 0
    });
  }

  var contextoLocal = faseLocal.resultadoLocal || {};
  var loteRescate = contextoLocal.loteRescate || {};
  var totalSlots = loteRescate && typeof loteRescate.totalSlots === 'number'
    ? loteRescate.totalSlots
    : ((loteRescate.slots && loteRescate.slots.length) || 0);

  if (!totalSlots) {
    return _B1_core_crearSalidaDesacoplada({
      estadoIA: _B1_core_fase5EstadoIA('NO_NECESITA_LLAMADA', 'NO_NECESITA_LLAMADA'),
      tareasIA: [],
      resultadoLocal: contextoLocal,
      traceId: faseLocal.traceId || null,
      elapsedMs: faseLocal.elapsedMs || 0
    });
  }

  var crearSolicitud = dependenciasExternas.crearTareaRescateIA || B1_fase5CrearSolicitudRescateIA;
  var tareaIA = crearSolicitud(
    loteRescate,
    contextoLocal.textoBase || '',
    faseLocal.traceId || null,
    faseLocal.analysisId || null
  );

  return _B1_core_crearSalidaDesacoplada({
    estadoIA: _B1_core_fase5EstadoIA('NECESITA_LLAMADA', 'NECESITA_LLAMADA'),
    tareasIA: tareaIA ? [tareaIA] : [],
    resultadoLocal: contextoLocal,
    traceId: faseLocal.traceId || null,
    elapsedMs: faseLocal.elapsedMs || 0
  });
}

async function B1_analizar_desacoplado(input, config, dependenciasExternas) {
  var resultadoFaseLocal = await B1_ejecutarFaseLocal(input, config, dependenciasExternas);
  return B1_generarSolicitudIADesdeResultadoLocal(resultadoFaseLocal, dependenciasExternas);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Object.assign(module.exports || {}, {
    B1_analizar: B1_analizar,
    B1_ejecutarFaseLocal: B1_ejecutarFaseLocal,
    B1_generarSolicitudIADesdeResultadoLocal: B1_generarSolicitudIADesdeResultadoLocal,
    B1_analizar_desacoplado: B1_analizar_desacoplado,
    B1_cerrarConSubrespuestaIA: B1_cerrarConSubrespuestaIA
  });
}
