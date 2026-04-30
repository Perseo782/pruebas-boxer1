/* Runtime optimizado para analisis por foto.
   Generado agrupando los modulos en el mismo orden de dependencias usado por gestion_registros_app.js. */


;/* BEGIN ../../backend/boxer1/backend/operativa/B1_enums.js */
/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * BOXER 1 v2 Â· ENUMS Y CONSTANTES
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * Alineado con madre v5 y 12 reglas fijas del proyecto.
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

var B1_SEND_MODE = Object.freeze({
  BASE64: 'base64',
  NORMAL: 'normal'
});

var B1_PASSPORT = Object.freeze({
  VERDE:   'VERDE',
  NARANJA: 'NARANJA',
  ROJO:    'ROJO'
});

var B1_ESTADO_GEMINI = Object.freeze({
  CORREGIDA:   'corregida',
  YA_VALIDA:   'ya_valida',
  NO_RESUELTA: 'no_resuelta'
});

var B1_MERGE_STATUS = Object.freeze({
  OK:                      'ok',
  CANCELADO_POR_ASIMETRIA: 'cancelado_por_asimetria',
  NO_INTENTADO:            'no_intentado'
});

var B1_ACCIONES_CEREBRO = Object.freeze({
  REINTENTAR:           'reintentar',
  REINTENTAR_UNA_VEZ:   'reintentar_una_vez',
  REINTENTAR_MAS_TARDE: 'reintentar_mas_tarde',
  BLOQUEAR_GUARDADO:    'bloquear_guardado',
  ABRIR_REVISION:       'abrir_revision',
  CONTINUAR_Y_MARCAR:   'continuar_y_marcar_revision',
  ABORTAR_FLUJO:        'abortar_flujo',
  CORTE_TEMPRANO:       'corte_temprano',
  PEDIR_DATO_AL_USUARIO:'pedir_dato_al_usuario'
});

var B1_TIPO_FALLO = Object.freeze({
  REPARACION_AGOTADA:       'reparacion_agotada',
  IRRECUPERABLE_POR_DISENO: 'irrecuperable_por_diseno',
  DESCONOCIDO:              'desconocido'
});

var B1_ERRORES = Object.freeze({
  IMAGEN_INVALIDA:    'B1_IMAGEN_INVALIDA',
  IMAGEN_DESENFOCADA: 'B1_IMAGEN_DESENFOCADA',
  IMAGEN_REFLEJO:     'B1_IMAGEN_REFLEJO',
  IMAGEN_SIN_TEXTO:   'B1_IMAGEN_SIN_TEXTO',
  IMAGEN_RECORTE_ROTO:'B1_IMAGEN_RECORTE_ROTO',
  OCR_FAILED:         'B1_OCR_FAILED',
  OCR_VACIO:          'B1_OCR_VACIO',
  OCR_RUIDO:          'B1_OCR_RUIDO',
  RESCATE_TIMEOUT:    'B1_RESCATE_TIMEOUT',
  RESCATE_FALLIDO:    'B1_RESCATE_FALLIDO',
  MERGE_ASIMETRIA:    'B1_MERGE_ASIMETRIA',
  MERGE_DUPLICADO:    'B1_MERGE_DUPLICADO',
  CONTRATO_CEREBRO_INVALIDO:'B1_CONTRATO_CEREBRO_INVALIDO',
  PRESUPUESTO_AGOTADO:'B1_PRESUPUESTO_AGOTADO',
  CATALOGOS_NO_LISTO: 'B1_CATALOGOS_NO_LISTO',
  ERROR_INTERNO:      'B1_ERROR_INTERNO'
});

var B1_CONFIG = Object.freeze({
  MAX_IMAGE_SIDE_PX:          1280,
  DEFAULT_TIME_BUDGET_MS:     8000,
  VISION_FETCH_TIMEOUT_MS:    15000,
  GEMINI_FETCH_TIMEOUT_MS:    8000,
  GEMINI_FETCH_TIMEOUT_MS_RETRY: 6000,
  RESCATE_MAX_TOTAL_MS:       15000,
  AUTOREPAIR_RETRY_DELAY_MS:  300,
  AUTOREPAIR_RETRY_DELAY_MS_RESCATE: 600,
  AUTOREPAIR_MAX_ATTEMPTS:    2,
  AUTOREPAIR_MAX_ATTEMPTS_RESCATE: 3,
  ROI_MARGIN_PX:              15,
  ROI_TTL_MS:                 900000,
  POST_ANALYSIS_CLEANUP_DELAY_MS: 3000,
  VENTANA_CONTEXTO:           3,
  MAX_RETRY_ATTEMPTS:         3,
  MAX_RETRY_TOTAL_MS:         6000,
  MODULE_NAME:                'Boxer1_Core',
  MODULE_ORIGIN:              'Boxer1_Core',
  INPUT_MODULO_DESTINO:       'Boxer1_Core',
  INPUT_ACCION:               'analizar_texto_etiqueta',
  TRASTIENDA_MODULO_ORIGEN:   'BOXER1',
  TRASTIENDA_MODULO_DESTINO:  'TRASTIENDA',
  TRASTIENDA_ACCION_VISION:   'procesarVision',
  TRASTIENDA_ACCION_GEMINI:   'procesarGemini'
});

;/* END ../../backend/boxer1/backend/operativa/B1_enums.js */

;/* BEGIN ../../backend/boxer1/backend/operativa/B1_contratos_unificado_patch.js */
/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * BOXER 1 v2 Â· CONTRATOS DE ENTRADA Y SALIDA
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * Alineado con madre v5 y 12 reglas fijas del proyecto.
 * Sin limite de tiempo. Sin penalizacion por duracion.
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */


/* â”€â”€ VALIDAR ENTRADA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function B1_validarEntrada(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, reason: 'Entrada vacia o no es objeto.' };
  }
  if (typeof input.moduloOrigen !== 'string' || !input.moduloOrigen.trim()) {
    return { valid: false, reason: 'Falta moduloOrigen.' };
  }
  if (input.moduloDestino !== B1_CONFIG.INPUT_MODULO_DESTINO) {
    return { valid: false, reason: 'moduloDestino invalido. Debe ser "' + B1_CONFIG.INPUT_MODULO_DESTINO + '".' };
  }
  if (input.accion !== B1_CONFIG.INPUT_ACCION) {
    return { valid: false, reason: 'accion invalida. Debe ser "' + B1_CONFIG.INPUT_ACCION + '".' };
  }
  if (typeof input.sessionToken !== 'string' || !input.sessionToken.trim()) {
    return { valid: false, reason: 'Falta sessionToken.' };
  }

  var d = input.datos;
  if (!d || typeof d !== 'object') {
    return { valid: false, reason: 'Falta bloque "datos" en la entrada.' };
  }
  if (!d.imageRef) {
    return { valid: false, reason: 'Falta imageRef.' };
  }
  if (Object.values(B1_SEND_MODE).indexOf(d.sendMode) === -1) {
    return { valid: false, reason: 'sendMode invalido: "' + d.sendMode + '".' };
  }
  if (d.agentEnabled != null && typeof d.agentEnabled !== 'boolean') {
    return { valid: false, reason: 'agentEnabled debe ser true o false cuando se envie.' };
  }
  if (
    d.timeBudgetMs != null &&
    (
      typeof d.timeBudgetMs !== 'number' ||
      !Number.isFinite(d.timeBudgetMs) ||
      d.timeBudgetMs <= 0
    )
  ) {
    return { valid: false, reason: 'timeBudgetMs debe ser un numero positivo cuando se envie.' };
  }
  return {
    valid: true,
    datos: {
      imageRef: d.imageRef,
      sendMode: d.sendMode,
      agentEnabled: d.agentEnabled !== false,
      timeBudgetMs: d.timeBudgetMs
    }
  };
}


/* â”€â”€ VALIDAR CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function B1_validarConfig(config) {
  if (!config || typeof config !== 'object') {
    return { valid: false, reason: 'Falta config.' };
  }
  if (typeof config.urlTrastienda !== 'string' || !config.urlTrastienda.trim()) {
    return { valid: false, reason: 'config.urlTrastienda es obligatorio.' };
  }
  return { valid: true, config: { urlTrastienda: config.urlTrastienda.trim() } };
}


/* â”€â”€ TRACE ID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function B1_generarTraceId() {
  var ts = Date.now().toString(36);
  var rand = Math.random().toString(36).substring(2, 8);
  return 'trc_b1_' + ts + '_' + rand;
}


/* â”€â”€ RESPUESTA OK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function B1_crearRespuestaOk(params) {
  var datos = {
    textoBaseVision:      params.textoBaseVision,
    textoAuditado:        params.textoAuditado,
    correcciones:         params.correcciones         || [],
    noResueltas:          params.noResueltas          || [],
    validas:              params.validas              || [],
    tablaBReconocida:     params.tablaBReconocida     || [],
    pesoVolumenProducto:  params.pesoVolumenProducto  || null,
    detalleSlots:         params.detalleSlots         || [],
    metricas:             params.metricas             || null
  };

  if (params.filasVisionRecompuestas) { datos.filasVisionRecompuestas = params.filasVisionRecompuestas; }
  if (params.diagnostico) { datos.diagnostico = params.diagnostico; }

  var resultado = {
    estadoPasaporteModulo: params.estadoPasaporte,
    modulo:                B1_CONFIG.MODULE_NAME,
    elapsedMs:             params.elapsedMs,
    traceId:               params.traceId,
    datos:                 datos
  };

  if (params.accionSugeridaParaCerebro) {
    resultado.accionSugeridaParaCerebro = params.accionSugeridaParaCerebro;
  }
  if (params.warning) { resultado.warning = params.warning; }

  return { ok: true, resultado: resultado, error: null };
}


/* â”€â”€ RESPUESTA ERROR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function B1_crearRespuestaError(params) {
  var errorObj = {
    code:      params.code,
    origin:    B1_CONFIG.MODULE_ORIGIN,
    passport:  B1_PASSPORT.ROJO,
    message:   params.message,
    tipoFallo: params.tipoFallo,
    retryable: params.retryable
  };

  if (params.tipoFallo === B1_TIPO_FALLO.REPARACION_AGOTADA) {
    errorObj.tiempoTotalReintentoMs = params.tiempoTotalReintentoMs || 0;
    if (params.intentos) { errorObj.intentos = params.intentos; }
  }
  if (params.chainedFrom)   { errorObj.chainedFrom = params.chainedFrom; }
  if (params.motivo)        { errorObj.motivo = params.motivo; }
  if (params.detail)        { errorObj.detail = params.detail; }
  if (params.errorOriginal) { errorObj.errorOriginal = params.errorOriginal; }

  var datos = {};
  if (params.textoBaseVision != null) { datos.textoBaseVision = params.textoBaseVision; }
  if (params.metricas)                { datos.metricas = params.metricas; }
  if (params.diagnostico)             { datos.diagnostico = params.diagnostico; }

  var resultado = {
    estadoPasaporteModulo:      B1_PASSPORT.ROJO,
    modulo:                     B1_CONFIG.MODULE_NAME,
    accionSugeridaParaCerebro:  params.accionSugeridaParaCerebro,
    elapsedMs:                  params.elapsedMs,
    traceId:                    params.traceId,
    datos:                      datos
  };

  return { ok: false, resultado: resultado, error: errorObj };
}


/* â”€â”€ METRICAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function B1_crearMetricas(params) {
  params = params || {};
  return {
    pageConfidence:             (params.pageConfidence != null)    ? params.pageConfidence    : null,
    criticalZoneScore:          (params.criticalZoneScore != null) ? params.criticalZoneScore : null,
    totalPalabrasAnalizadas:    params.totalPalabrasAnalizadas     || 0,
    totalValidas:               params.totalValidas                || 0,
    totalRotasReconocidas:      params.totalRotasReconocidas       || 0,
    totalRechazadasDefinitivas: params.totalRechazadasDefinitivas  || 0,
    totalTablaBReconocida:      params.totalTablaBReconocida       || 0,
    slotsEnviados:              params.slotsEnviados               || 0,
    slotsDevueltos:             params.slotsDevueltos              || 0,
    mergeStatus:                params.mergeStatus                 || B1_MERGE_STATUS.NO_INTENTADO,
    rescatesIntentados:         params.rescatesIntentados          || 0,
    rescatesAplicados:          params.rescatesAplicados           || 0,
    elapsedMs:                  params.elapsedMs                   || 0,
    abortReason:                params.abortReason                 || null,
    tiempos:                    params.tiempos                     || null
  };
}


/* â”€â”€ ROI REF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function B1_crearRoiRef(slotId, refUri) {
  return {
    slotId: slotId,
    ref:    refUri || ('roi://temp/' + slotId),
    ttlMs:  B1_CONFIG.ROI_TTL_MS
  };
}


/* â”€â”€ CRONOMETRO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*
 * Sin limite de tiempo. El cronometro queda para mantener trazas
 * consistentes y no romper contratos internos.
 */

function B1_crearCronometro() {
  var inicio = Date.now();

  return {
    elapsed: function() {
      return Date.now() - inicio;
    },
    remaining: function() {
      return Number.MAX_SAFE_INTEGER;
    },
    canAfford: function() {
      return true;
    },
    expired: function() {
      return false;
    }
  };
}


/* â”€â”€ ERROR UPSTREAM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function B1_crearErrorUpstream(params) {
  var err = new Error(params.message || 'Error upstream');
  err.upstreamCode   = params.upstreamCode   || null;
  err.upstreamModule = params.upstreamModule || null;
  err.raw            = params.raw            || null;
  err.intentCount    = params.intentCount    || 0;
  return err;
}

;/* END ../../backend/boxer1/backend/operativa/B1_contratos_unificado_patch.js */

;/* BEGIN ../../backend/boxer1/backend/operativa/B1_diagnostico_unificado_patch.js */

/**
 * Boxer1_Core · ADAPTADOR DE DIAGNÓSTICO (parche unificación)
 */
const B1_TIPO_EVENTO = Object.freeze({
  INFO: 'info', REPARACION: 'reparacion_silenciosa', DEGRADACION: 'degradacion', ERROR: 'error',
  RECUPERACION: 'recuperacion', TIMEOUT: 'timeout', ENCADENADO: 'error_encadenado', MODO_SEGURO: 'modo_seguro'
});
const B1_DIAG_MAX_CRITICOS = 80;
const B1_DIAG_MAX_INFO = 20;

function B1_crearBufferDiagnostico(traceId) {
  const eventosCriticos = [];
  const eventosInfo = [];
  return {
    traceId,
    emitir(params) {
      const evento = {
        ts: Date.now(),
        traceId,
        modulo: B1_CONFIG.MODULE_NAME,
        tipoEvento: params.tipoEvento,
        code: params.code || null,
        mensaje: params.mensaje,
        passport: params.passport || null,
        elapsedMs: params.totalElapsedMs ?? params.elapsedMs ?? null,
        stageElapsedMs: params.stageElapsedMs ?? params.elapsedMs ?? null,
        totalElapsedMs: params.totalElapsedMs ?? params.elapsedMs ?? null,
        detalle: params.detalle || null
      };
      const esCritico = _esEventoCritico(params.tipoEvento, params.passport);
      const bucket = esCritico ? eventosCriticos : eventosInfo;
      const max = esCritico ? B1_DIAG_MAX_CRITICOS : B1_DIAG_MAX_INFO;
      if (bucket.length >= max) bucket.shift();
      bucket.push(evento);
    },
    obtenerEventos() { return [...eventosCriticos, ...eventosInfo].sort((a,b)=>a.ts-b.ts); },
    resumen() { return { totalCriticos:eventosCriticos.length, totalInfo:eventosInfo.length, total:eventosCriticos.length+eventosInfo.length }; }
  };
}
function B1_exportarDiagnostico(buffer) { return buffer ? { resumen: buffer.resumen(), eventos: buffer.obtenerEventos() } : null; }
function _esEventoCritico(tipoEvento, passport) {
  if (passport === B1_PASSPORT.NARANJA || passport === B1_PASSPORT.ROJO) return true;
  return [B1_TIPO_EVENTO.ERROR,B1_TIPO_EVENTO.DEGRADACION,B1_TIPO_EVENTO.TIMEOUT,B1_TIPO_EVENTO.ENCADENADO,B1_TIPO_EVENTO.MODO_SEGURO].includes(tipoEvento);
}
function _emit(buffer, payload) { if (buffer) buffer.emitir(payload); }
function B1_diagPrechequeo(buffer, ok, problemas, totalMs, stageMs) {
  _emit(buffer,{ tipoEvento: ok?B1_TIPO_EVENTO.INFO:B1_TIPO_EVENTO.ERROR, code: ok?'B1_PRECHEQUEO_OK':'B1_PRECHEQUEO_FAIL', mensaje: ok?`Prechequeo completado en ${stageMs ?? totalMs}ms.`:`Prechequeo fallido: ${problemas.join(', ')}`, passport: ok?B1_PASSPORT.VERDE:B1_PASSPORT.ROJO, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? totalMs, detalle:{ problemas } });
}
function B1_diagOCR(buffer, vacia, totalPalabras, totalMs, stageMs) {
  _emit(buffer,{ tipoEvento: vacia?B1_TIPO_EVENTO.ERROR:B1_TIPO_EVENTO.INFO, code: vacia?'B1_OCR_VACIO':'B1_OCR_OK', mensaje: vacia?'Vision no devolvió texto.':`OCR completado: ${totalPalabras} palabras en ${stageMs ?? totalMs}ms.`, passport: vacia?B1_PASSPORT.ROJO:B1_PASSPORT.VERDE, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? totalMs, detalle:{ totalPalabras } });
}
function B1_diagFiabilidad(buffer, fiabilidad, totalMs, stageMs) {
  const passport = fiabilidad.fotoViable ? B1_PASSPORT.VERDE : B1_PASSPORT.ROJO;
  _emit(buffer,{ tipoEvento: fiabilidad.fotoViable?B1_TIPO_EVENTO.INFO:B1_TIPO_EVENTO.DEGRADACION, code: fiabilidad.fotoViable?'B1_FIAB_OK':'B1_FIAB_INVIABLE', mensaje: fiabilidad.fotoViable?`Fiabilidad OK. Page=${fiabilidad.pageConfidence}, CritZone=${fiabilidad.criticalZoneScore}`:`Foto inviable: ${fiabilidad.razonInviable}`, passport, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ pageConfidence:fiabilidad.pageConfidence, criticalZoneScore:fiabilidad.criticalZoneScore, totalDudosas:fiabilidad.palabrasDudosas.length, rachasMalas:fiabilidad.rachasMalas } });
}
function B1_diagBypass(buffer, totalMs, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.DEGRADACION, code:'B1_AGENTE_OFF', mensaje:'Agente desactivado. Solo OCR base.', passport:B1_PASSPORT.NARANJA, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0 }); }
function B1_diagRescate(buffer, resultado, totalMs, stageMs) { const ok=resultado.intentado && resultado.slotsDevueltos>0; _emit(buffer,{ tipoEvento:ok?B1_TIPO_EVENTO.INFO:B1_TIPO_EVENTO.DEGRADACION, code:ok?'B1_RESCATE_OK':'B1_RESCATE_PARCIAL', mensaje:resultado.intentado?`Rescate: ${resultado.slotsDevueltos}/${resultado.slotsEnviados} slots devueltos.`:`Rescate no intentado: ${resultado.razon}`, passport:ok?B1_PASSPORT.VERDE:B1_PASSPORT.NARANJA, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ slotsEnviados:resultado.slotsEnviados, slotsDevueltos:resultado.slotsDevueltos, erroresLote:resultado.erroresLote||0 } }); }
function B1_diagMerge(buffer, merge, totalMs, stageMs) { const cancelado=merge.mergeCancelado; _emit(buffer,{ tipoEvento:cancelado?B1_TIPO_EVENTO.DEGRADACION:B1_TIPO_EVENTO.INFO, code:cancelado?'B1_MERGE_CANCELADO':'B1_MERGE_OK', mensaje:cancelado?`Merge cancelado: ${merge.motivoCancelacion}`:`Merge OK. ${merge.correcciones.length} correcciones, ${merge.noResueltas.length} pendientes.`, passport:cancelado?B1_PASSPORT.NARANJA:B1_PASSPORT.VERDE, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ mergeStatus:merge.mergeStatus, correcciones:merge.correcciones.length, noResueltas:merge.noResueltas.length } }); }
function B1_diagTimeout(buffer, fase, totalMs, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.TIMEOUT, code:'B1_TIMEOUT', mensaje:`Presupuesto agotado en fase: ${fase}`, passport:B1_PASSPORT.NARANJA, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ fase } }); }
function B1_diagEncadenado(buffer, upstreamCode, upstreamModule, totalMs, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.ENCADENADO, code:'B1_ERROR_ENCADENADO', mensaje:`Error propagado desde ${upstreamModule}: ${upstreamCode}`, passport:B1_PASSPORT.ROJO, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ upstreamCode, upstreamModule } }); }
function B1_diagReparacion(buffer, descripcion, totalMs, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.REPARACION, code:'B1_REPARACION_SILENCIOSA', mensaje:descripcion, passport:B1_PASSPORT.VERDE, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0 }); }
function B1_diagPasaporte(buffer, estado, explicacion, totalMs, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.INFO, code:`B1_PASAPORTE_${estado}`, mensaje:`Pasaporte ${estado}: ${explicacion}`, passport:estado, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0 }); }
function B1_diagRecuperacion(buffer, desde, hacia, totalMs, motivo, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.RECUPERACION, code:'B1_RECUPERACION', mensaje:`Recuperación ${desde} → ${hacia}. ${motivo || ''}`.trim(), passport:hacia, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ desde, hacia, motivo:motivo || null } }); }
function B1_diagModoSeguro(buffer, totalMs, motivo, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.MODO_SEGURO, code:'B1_MODO_SEGURO', mensaje:motivo || 'Se activa modo seguro.', passport:B1_PASSPORT.NARANJA, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ motivo:motivo || null } }); }


;/* END ../../backend/boxer1/backend/operativa/B1_diagnostico_unificado_patch.js */

;/* BEGIN ../../backend/boxer1/backend/operativa/B1_prechequeo_unificado_patch.js */
/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * Boxer1_Core · PASO 2 · PRECHEQUEO DE IMAGEN
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

function B1_emitAnalysisTrace(name, data) {
  try {
    if (typeof globalThis === 'undefined') return;
    if (!globalThis.AnalysisExclusiveRuntime || typeof globalThis.AnalysisExclusiveRuntime.trace !== 'function') return;
    globalThis.AnalysisExclusiveRuntime.trace(name, data || null, { source: 'boxer1_prechequeo', phase: 'vision_prepare' });
  } catch (errTrace) {
    // No-op.
  }
}

async function B1_redimensionarImagen(imageSrc) {
  let bitmap;
  let cerrarBitmap = false;

  try {
    if (typeof ImageBitmap !== 'undefined' && imageSrc instanceof ImageBitmap) {
      bitmap = imageSrc;
    } else if (typeof HTMLImageElement !== 'undefined' && imageSrc instanceof HTMLImageElement) {
      bitmap = await createImageBitmap(imageSrc);
      cerrarBitmap = true;
    } else if (imageSrc instanceof Blob) {
      bitmap = await createImageBitmap(imageSrc);
      cerrarBitmap = true;
    } else if (typeof imageSrc === 'string' && imageSrc.trim()) {
      const blob = await (await fetch(imageSrc)).blob();
      bitmap = await createImageBitmap(blob);
      cerrarBitmap = true;
    } else {
      throw new Error('Tipo de imageRef no soportado. Usa Blob, HTMLImageElement, ImageBitmap o string URL/dataURL.');
    }

    const maxSide = B1_CONFIG.MAX_IMAGE_SIDE_PX;
    let w = bitmap.width;
    let h = bitmap.height;

    if (Math.max(w, h) > maxSide) {
      const ratio = maxSide / Math.max(w, h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);

    return { canvas, width: w, height: h };
  } finally {
    if (cerrarBitmap && bitmap && typeof bitmap.close === 'function') {
      bitmap.close();
    }
  }
}

function B1_chequeoRapido(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const totalPixels = w * h;

  const problemas = [];
  const metricas = {};

  metricas.focusScore = _calcularNitidez(data, w, h);
  if (metricas.focusScore < 15) problemas.push('desenfoque_severo');

  metricas.reflectionScore = _calcularReflejo(data, totalPixels);
  if (metricas.reflectionScore > 0.25) problemas.push('reflejo_severo');

  metricas.brightness = _calcularBrillo(data, totalPixels);
  if (metricas.brightness < 30) problemas.push('imagen_muy_oscura');
  else if (metricas.brightness > 240) problemas.push('imagen_muy_clara');

  metricas.textAreaRatio = _estimarAreaTexto(data, w, h);
  if (metricas.textAreaRatio < 0.05) problemas.push('sin_texto_visible');

  metricas.borderUniformity = _detectarRecorteRoto(data, w, h);
  if (metricas.borderUniformity > 0.85) problemas.push('recorte_roto');

  const graves = problemas.filter(p => ['desenfoque_severo', 'reflejo_severo', 'sin_texto_visible'].includes(p));
  return { viable: graves.length < 2, problemas, metricas };
}

function _calcularNitidez(data, w, h) {
  let sum = 0;
  let count = 0;
  const stride = 4;
  for (let y = 1; y < h - 1; y += 3) {
    for (let x = 1; x < w - 1; x += 3) {
      const idx = (y * w + x) * stride;
      const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const top = ((y - 1) * w + x) * stride;
      const bottom = ((y + 1) * w + x) * stride;
      const left = (y * w + (x - 1)) * stride;
      const right = (y * w + (x + 1)) * stride;
      const gTop = data[top] * 0.299 + data[top + 1] * 0.587 + data[top + 2] * 0.114;
      const gBottom = data[bottom] * 0.299 + data[bottom + 1] * 0.587 + data[bottom + 2] * 0.114;
      const gLeft = data[left] * 0.299 + data[left + 1] * 0.587 + data[left + 2] * 0.114;
      const gRight = data[right] * 0.299 + data[right + 1] * 0.587 + data[right + 2] * 0.114;
      sum += Math.abs(gTop + gBottom + gLeft + gRight - 4 * gray);
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

function _calcularReflejo(data, totalPixels) {
  let blancos = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250) blancos++;
  }
  return blancos / totalPixels;
}

function _calcularBrillo(data, totalPixels) {
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  return sum / totalPixels;
}

function _estimarAreaTexto(data, w, h) {
  const blockSize = 16;
  let bloquesCon = 0;
  let bloquesTotal = 0;
  for (let by = 0; by < h - blockSize; by += blockSize) {
    for (let bx = 0; bx < w - blockSize; bx += blockSize) {
      let sum = 0, sumSq = 0, n = 0;
      for (let y = by; y < by + blockSize; y += 2) {
        for (let x = bx; x < bx + blockSize; x += 2) {
          const idx = (y * w + x) * 4;
          const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
          sum += gray;
          sumSq += gray * gray;
          n++;
        }
      }
      const mean = sum / n;
      const variance = (sumSq / n) - (mean * mean);
      if (variance > 200) bloquesCon++;
      bloquesTotal++;
    }
  }
  return bloquesTotal > 0 ? bloquesCon / bloquesTotal : 0;
}

function _detectarRecorteRoto(data, w, h) {
  const sampleBorder = (pixels) => {
    if (pixels.length < 2) return 0;
    const first = pixels[0];
    let iguales = 0;
    for (let i = 1; i < pixels.length; i++) {
      if (Math.abs(pixels[i] - first) < 10) iguales++;
    }
    return iguales / (pixels.length - 1);
  };

  const topRow = [];
  const bottomRow = [];
  const leftCol = [];
  const rightCol = [];
  for (let x = 0; x < w; x += 4) {
    const tIdx = x * 4;
    const bIdx = ((h - 1) * w + x) * 4;
    topRow.push(data[tIdx] * 0.299 + data[tIdx + 1] * 0.587 + data[tIdx + 2] * 0.114);
    bottomRow.push(data[bIdx] * 0.299 + data[bIdx + 1] * 0.587 + data[bIdx + 2] * 0.114);
  }
  for (let y = 0; y < h; y += 4) {
    const lIdx = (y * w) * 4;
    const rIdx = (y * w + (w - 1)) * 4;
    leftCol.push(data[lIdx] * 0.299 + data[lIdx + 1] * 0.587 + data[lIdx + 2] * 0.114);
    rightCol.push(data[rIdx] * 0.299 + data[rIdx + 1] * 0.587 + data[rIdx + 2] * 0.114);
  }
  return [sampleBorder(topRow), sampleBorder(bottomRow), sampleBorder(leftCol), sampleBorder(rightCol)]
    .reduce((a, b) => a + b, 0) / 4;
}

async function B1_prechequeo(imageSrc, cronometro) {
  const startedAt = Date.now();
  B1_emitAnalysisTrace('vision_prepare_start', null);
  try {
    const tResize = Date.now();
    const { canvas, width, height } = await B1_redimensionarImagen(imageSrc);
    const t_redimensionar_ms = Date.now() - tResize;
    if (cronometro.expired()) {
      B1_emitAnalysisTrace('vision_prepare_end', { ok: false, reason: 'presupuesto_agotado_en_prechequeo' });
      return {
        ok: false,
        canvas: null,
        width,
        height,
        problemas: ['presupuesto_agotado_en_prechequeo'],
        metricasImagen: {},
        abortReason: 'Tiempo agotado durante redimensionado.'
      };
    }

    const tCheck = Date.now();
    const chequeo = B1_chequeoRapido(canvas);
    const t_chequeo_rapido_ms = Date.now() - tCheck;
    if (!chequeo.viable) {
      B1_emitAnalysisTrace('vision_prepare_end', {
        ok: false,
        reason: chequeo.problemas && chequeo.problemas.length ? chequeo.problemas[0] : 'prechequeo_no_viable'
      });
      return {
        ok: false,
        canvas: null,
        width,
        height,
        problemas: chequeo.problemas,
        metricasImagen: chequeo.metricas,
        tiempos: { t_redimensionar_ms, t_chequeo_rapido_ms, t_total_prechequeo_ms: Date.now() - startedAt },
        abortReason: `Foto imposible de procesar: ${chequeo.problemas.join(', ')}.`
      };
    }

    B1_emitAnalysisTrace('vision_prepare_end', {
      ok: true,
      width,
      height
    });
    return {
      ok: true,
      canvas,
      width,
      height,
      problemas: chequeo.problemas,
      metricasImagen: chequeo.metricas,
      tiempos: { t_redimensionar_ms, t_chequeo_rapido_ms, t_total_prechequeo_ms: Date.now() - startedAt },
      abortReason: null
    };
  } catch (err) {
    B1_emitAnalysisTrace('vision_prepare_end', {
      ok: false,
      reason: err && err.message ? err.message : 'error_interno_prechequeo'
    });
    return {
      ok: false,
      canvas: null,
      width: 0,
      height: 0,
      problemas: ['error_interno_prechequeo'],
      metricasImagen: {},
      tiempos: { t_redimensionar_ms: null, t_chequeo_rapido_ms: null, t_total_prechequeo_ms: Date.now() - startedAt },
      abortReason: `Error en prechequeo: ${err.message}`
    };
  }
}


;/* END ../../backend/boxer1/backend/operativa/B1_prechequeo_unificado_patch.js */

;/* BEGIN ../../backend/boxer1/backend/operativa/B1_ocr_base_unificado_patch.js */
;/* BEGIN ../../backend/ocr/ocr_fusion_engine.js */
(function initOcrFusionEngine(globalScope) {
  "use strict";

  var MAX_SOURCE_CHARS = 9000;
  var MAX_LINES = 140;
  var MAX_WORDS_PER_LINE = 80;
  var MIN_TOKEN_LEN = 2;

  function now() {
    return Date.now ? Date.now() : new Date().getTime();
  }

  function stripAccents(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function normalizeToken(value) {
    return stripAccents(value).toLowerCase().replace(/[^a-z0-9%]+/g, "");
  }

  function normalizeLine(value) {
    return stripAccents(value)
      .toLowerCase()
      .replace(/[^a-z0-9%]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, MAX_SOURCE_CHARS);
  }

  function splitLines(value) {
    var text = cleanText(value);
    if (!text) return [];
    var seen = Object.create(null);
    return text.split(/\n+/).map(function trim(line) {
      return String(line || "").trim();
    }).filter(function valid(line) {
      if (!line) return false;
      var key = normalizeLine(line);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    }).slice(0, MAX_LINES);
  }

  function tokenize(line) {
    return String(line || "").split(/\s+/).filter(Boolean).slice(0, MAX_WORDS_PER_LINE);
  }

  function levenshtein(a, b) {
    var left = normalizeToken(a);
    var right = normalizeToken(b);
    if (left === right) return 0;
    if (!left) return right.length;
    if (!right) return left.length;
    var prev = [];
    var curr = [];
    var i;
    var j;
    for (j = 0; j <= right.length; j += 1) prev[j] = j;
    for (i = 1; i <= left.length; i += 1) {
      curr[0] = i;
      for (j = 1; j <= right.length; j += 1) {
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + (left.charAt(i - 1) === right.charAt(j - 1) ? 0 : 1)
        );
      }
      var tmp = prev;
      prev = curr;
      curr = tmp;
    }
    return prev[right.length];
  }

  function looksBroken(token) {
    var raw = String(token || "");
    var norm = normalizeToken(raw);
    if (norm.length < MIN_TOKEN_LEN) return true;
    if (/\d/.test(norm)) return false;
    if (norm.length <= 3 && raw.length <= 3) return true;
    if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(norm)) return true;
    return false;
  }

  function scoreToken(token) {
    var norm = normalizeToken(token);
    var score = norm.length;
    if (!norm) return -100;
    if (looksBroken(token)) score -= 3;
    if (/^[a-z]+$/i.test(norm) && /[aeiou]/i.test(norm)) score += 2;
    if (/\d/.test(norm)) score += 2;
    return score;
  }

  function chooseToken(visionToken, deepseekToken, stats) {
    var leftNorm = normalizeToken(visionToken);
    var rightNorm = normalizeToken(deepseekToken);
    if (!leftNorm) return deepseekToken;
    if (!rightNorm) return visionToken;
    if (leftNorm === rightNorm) return visionToken.length >= deepseekToken.length ? visionToken : deepseekToken;

    var distance = levenshtein(leftNorm, rightNorm);
    var maxLen = Math.max(leftNorm.length, rightNorm.length);
    var near = maxLen >= 4 && distance <= Math.max(1, Math.ceil(maxLen * 0.4));
    if (near) {
      var leftScore = scoreToken(visionToken);
      var rightScore = scoreToken(deepseekToken);
      if (Math.abs(leftScore - rightScore) >= 2) {
        stats.mejorasAplicadas += 1;
        return rightScore > leftScore ? deepseekToken : visionToken;
      }
    }

    stats.fragmentosConservadosPorDuda += 1;
    return visionToken + " / " + deepseekToken;
  }

  function similarityLine(a, b) {
    var aTokens = tokenize(normalizeLine(a));
    var bTokens = tokenize(normalizeLine(b));
    var total = Math.max(aTokens.length, bTokens.length);
    var matches = 0;
    var used = Object.create(null);
    var i;
    var j;
    if (!total) return 0;
    for (i = 0; i < aTokens.length; i += 1) {
      for (j = 0; j < bTokens.length; j += 1) {
        if (used[j]) continue;
        if (aTokens[i] === bTokens[j] || levenshtein(aTokens[i], bTokens[j]) <= 1) {
          used[j] = true;
          matches += 1;
          break;
        }
      }
    }
    return matches / total;
  }

  function mergeLine(visionLine, deepseekLine, stats) {
    var v = tokenize(visionLine);
    var d = tokenize(deepseekLine);
    var total = Math.max(v.length, d.length);
    var out = [];
    var i;
    for (i = 0; i < total; i += 1) {
      if (v[i] && d[i]) {
        out.push(chooseToken(v[i], d[i], stats));
      } else if (v[i]) {
        out.push(v[i]);
      } else if (d[i]) {
        out.push(d[i]);
      }
    }
    return out.join(" ").replace(/\s+\/\s+/g, " / ").trim();
  }

  function fusionarOCR(input) {
    var started = now();
    var safe = input && typeof input === "object" ? input : {};
    var visionLines = splitLines(safe.textoVision || safe.vision || "");
    var deepseekLines = splitLines(safe.textoDeepSeek || safe.deepseek || "");
    var usedDeepseek = Object.create(null);
    var stats = {
      mejorasAplicadas: 0,
      fragmentosConservadosPorDuda: 0,
      lineasAnadidas: 0,
      avisos: []
    };
    var output = [];

    visionLines.forEach(function eachVision(line) {
      var bestIndex = -1;
      var bestScore = 0;
      deepseekLines.forEach(function eachDeepseek(candidate, index) {
        var score;
        if (usedDeepseek[index]) return;
        score = similarityLine(line, candidate);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });
      if (bestIndex >= 0 && bestScore >= 0.45) {
        usedDeepseek[bestIndex] = true;
        output.push(mergeLine(line, deepseekLines[bestIndex], stats));
        return;
      }
      output.push(line);
    });

    deepseekLines.forEach(function addUnused(line, index) {
      if (usedDeepseek[index]) return;
      output.push(line);
      stats.lineasAnadidas += 1;
    });

    var seen = Object.create(null);
    var finalLines = output.filter(function unique(line) {
      var key = normalizeLine(line);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
    var textoOCRFinal = finalLines.join("\n").trim();
    var longest = Math.max(cleanText(safe.textoVision || "").length, cleanText(safe.textoDeepSeek || "").length);
    var maxFinal = Math.max(longest + 1500, Math.floor(longest * 1.25), 2500);
    if (textoOCRFinal.length > maxFinal) {
      textoOCRFinal = textoOCRFinal.slice(0, maxFinal).trim();
      stats.avisos.push("fusion_recortada_para_evitar_texto_excesivo");
    }

    return {
      ok: true,
      textoOCRFinal: textoOCRFinal,
      metricas: {
        visionLineas: visionLines.length,
        deepseekLineas: deepseekLines.length,
        lineasFinales: finalLines.length,
        mejorasAplicadas: stats.mejorasAplicadas,
        fragmentosConservadosPorDuda: stats.fragmentosConservadosPorDuda,
        lineasAnadidas: stats.lineasAnadidas,
        elapsedMs: now() - started
      },
      avisos: stats.avisos
    };
  }

  var api = {
    fusionarOCR: fusionarOCR,
    normalizeToken: normalizeToken,
    similarityLine: similarityLine
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (globalScope) globalScope.AppV2OcrFusionEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../../backend/ocr/ocr_fusion_engine.js */
;/* BEGIN ../estado/ocr_settings.js */
(function initOcrSettings(globalScope) {
  "use strict";

  var SETTINGS_KEY = "appv2_ocr_settings_v1";
  var DETAIL_KEY = "appv2_last_ocr_detail_v1";
  var DEFAULT_SETTINGS = { ocrMode: "vision", updatedAt: "" };

  function storage() {
    try {
      return globalScope && globalScope.localStorage ? globalScope.localStorage : null;
    } catch (err) {
      return null;
    }
  }

  function normalizeMode(mode) {
    var value = String(mode || "").trim().toLowerCase();
    if (value === "deepseek" || value === "both" || value === "vision") return value;
    return "vision";
  }

  function readJson(key) {
    var ls = storage();
    if (!ls) return null;
    try {
      return JSON.parse(ls.getItem(key) || "null");
    } catch (err) {
      return null;
    }
  }

  function writeJson(key, value) {
    var ls = storage();
    if (!ls) return false;
    try {
      ls.setItem(key, JSON.stringify(value || null));
      return true;
    } catch (err) {
      return false;
    }
  }

  function removeKey(key) {
    var ls = storage();
    if (!ls) return false;
    try {
      ls.removeItem(key);
      return true;
    } catch (err) {
      return false;
    }
  }

  function getSettings() {
    var saved = readJson(SETTINGS_KEY) || {};
    return {
      ocrMode: normalizeMode(saved.ocrMode),
      updatedAt: String(saved.updatedAt || "")
    };
  }

  function saveSettings(next) {
    var saved = {
      ocrMode: normalizeMode(next && next.ocrMode),
      updatedAt: new Date().toISOString()
    };
    writeJson(SETTINGS_KEY, saved);
    return saved;
  }

  function modeLabel(mode) {
    var value = normalizeMode(mode);
    if (value === "deepseek") return "DeepSeek-OCR";
    if (value === "both") return "Vision + DeepSeek";
    return "Vision";
  }

  function saveLastOcrDetail(detail) {
    var safe = detail && typeof detail === "object" ? detail : {};
    var out = {
      createdAt: new Date().toISOString(),
      modo: normalizeMode(safe.modo || safe.ocrMode),
      motorSeleccionado: String(safe.motorSeleccionado || safe.modo || safe.ocrMode || ""),
      ok: safe.ok === true,
      vision: safe.vision || null,
      deepseek: safe.deepseek || null,
      fusion: safe.fusion || null,
      message: String(safe.message || "")
    };
    writeJson(DETAIL_KEY, out);
    return out;
  }

  function readLastOcrDetail() {
    return readJson(DETAIL_KEY);
  }

  function clearLastOcrDetail() {
    return removeKey(DETAIL_KEY);
  }

  function safeText(value) {
    return String(value == null ? "" : value).trim();
  }

  function secondsLabel(ms) {
    var n = Number(ms);
    if (!Number.isFinite(n) || n < 0) return "no disponible";
    if (n < 1000) return "menos de 1 segundo";
    var seconds = Math.max(1, Math.round(n / 1000));
    return seconds === 1 ? "1 segundo" : seconds + " segundos";
  }

  function engineSignature(engine, info) {
    var source = safeText(info && (info.firma || info.motor || info.source));
    if (source) return source;
    if (engine === "vision") return "FUENTE_REAL: GOOGLE_VISION_OCR";
    if (engine === "deepseek") return "FUENTE_REAL: DEEPSEEK_OCR_VERTEX_AI";
    return "FUENTE_REAL: OCR_NO_IDENTIFICADO";
  }

  function engineBlock(title, engine, info) {
    var safe = info && typeof info === "object" ? info : {};
    var raw = safeText(safe.rawJson || safe.raw);
    var ocrText = safeText(safe.texto || safe.text || safe.ocrTexto);
    var lines = [];
    lines.push("[" + title + "]");
    lines.push("Firma: " + engineSignature(engine, safe));
    lines.push("Tiempo: " + secondsLabel(safe.elapsedMs));
    lines.push("Estado: " + (safe.ok === false ? "AVISO" : "OK"));
    if (safe.message) lines.push("Mensaje: " + safeText(safe.message));
    lines.push("Texto devuelto:");
    lines.push(ocrText || "(sin texto OCR guardado; no es valido usar 'prueba completada' como texto OCR)");
    lines.push("");
    lines.push("TODOS LOS DETALLES DEVUELTOS POR EL OCR SELECCIONADO:");
    lines.push(raw || "(respuesta completa no guardada; repite la prueba o analiza una foto nueva)");
    return lines;
  }

  function formatOcrDetailForCopy(detail) {
    var d = detail || readLastOcrDetail();
    if (!d) return "";
    var modo = normalizeMode(d.modo);
    var lines = [];
    lines.push("DETALLE OCR - ULTIMO ANALISIS REAL");
    lines.push("Fecha: " + safeText(d.createdAt));
    lines.push("Motor seleccionado en Ajustes: " + modeLabel(modo));
    lines.push("Estado: " + (d.ok ? "OK" : "AVISO"));
    if (d.message) lines.push("Mensaje: " + safeText(d.message));
    lines.push("");
    if (modo === "vision") {
      lines = lines.concat(engineBlock("MOTOR USADO", "vision", d.vision));
    } else if (modo === "deepseek") {
      lines = lines.concat(engineBlock("MOTOR USADO", "deepseek", d.deepseek));
    } else {
      lines = lines.concat(engineBlock("MOTOR 1", "vision", d.vision));
      lines.push("");
      lines = lines.concat(engineBlock("MOTOR 2", "deepseek", d.deepseek));
      lines.push("");
      lines.push("[TEXTO FINAL FUSIONADO QUE RECIBE BOXER1]");
      lines.push("Firma: FUENTE_REAL: FUSION_LOCAL_VISION_DEEPSEEK");
      lines.push("Tiempo fusion: " + secondsLabel(d.fusion && d.fusion.elapsedMs));
      lines.push(safeText(d.fusion && (d.fusion.textoOCRFinal || d.fusion.message)) || "(sin fusion)");
    }
    return lines.join("\n");
  }

  var api = {
    SETTINGS_KEY: SETTINGS_KEY,
    DETAIL_KEY: DETAIL_KEY,
    getSettings: getSettings,
    saveSettings: saveSettings,
    normalizeMode: normalizeMode,
    modeLabel: modeLabel,
    saveLastOcrDetail: saveLastOcrDetail,
    readLastOcrDetail: readLastOcrDetail,
    clearLastOcrDetail: clearLastOcrDetail,
    formatOcrDetailForCopy: formatOcrDetailForCopy
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (globalScope) globalScope.AppV2OcrSettings = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../estado/ocr_settings.js */
/**
 * BOXER 1 Â· OCR base adaptado a GAS unificado + OCR rico completo.
 */
function B1_emitVisionCallTrace(name, data) {
  try {
    if (typeof globalThis === 'undefined') return;
    if (!globalThis.AnalysisExclusiveRuntime || typeof globalThis.AnalysisExclusiveRuntime.trace !== 'function') return;
    globalThis.AnalysisExclusiveRuntime.trace(name, data || null, { source: 'boxer1_ocr', phase: 'vision_call' });
  } catch (errTrace) {
    // No-op.
  }
}

async function B1_llamarVisionOCR(canvas, sendMode, sessionToken, urlTrastienda) {
  const t0 = Date.now();
  const tData = Date.now();
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const t_toDataURL_ms = Date.now() - tData;
  const base64 = dataUrl.split(',')[1];
  const tPayload = Date.now();
  const payload = { imageBase64: base64, mimeType: 'image/jpeg', sessionToken: sessionToken || '', token: sessionToken || '' };
  const t_build_payload_vision_ms = Date.now() - tPayload;
  const timeoutMs = (typeof B1_CONFIG !== 'undefined' && B1_CONFIG && B1_CONFIG.VISION_FETCH_TIMEOUT_MS) || 15000;
  const ocrMode = _B1_resolverModoOCR_();
  const ctxBase = { modo: ocrMode, t0, t_toDataURL_ms, t_build_payload_vision_ms, sendMode };

  B1_emitVisionCallTrace('vision_call_start', {
    timeoutMs,
    sendModeSolicitado: sendMode || B1_SEND_MODE.BASE64,
    sendModeAplicado: 'base64',
    ocrMode,
    t_toDataURL_ms,
    t_build_payload_vision_ms
  });

  const callVision = function() {
    return _B1_postOcrTrastienda_(urlTrastienda, B1_CONFIG.TRASTIENDA_ACCION_VISION, sessionToken, payload, timeoutMs, 'Vision OCR');
  };
  const callDeepseek = function() {
    return _B1_postOcrTrastienda_(urlTrastienda, 'procesarDeepSeekOCR', sessionToken, payload, timeoutMs, 'DeepSeek-OCR');
  };

  try {
    if (ocrMode === 'deepseek') {
      const deepseekOnly = await callDeepseek();
      return _B1_prepararRespuestaOCR_(deepseekOnly.respuesta, Object.assign({}, ctxBase, {
        textoFinal: _B1_extraerTextoOCR_(deepseekOnly.respuesta),
        vision: null,
        deepseek: deepseekOnly.respuesta,
        deepseekElapsedMs: deepseekOnly.durationMs,
        fusion: null,
        t_fetch_vision_total_ms: deepseekOnly.durationMs,
        t_parse_respuesta_vision_cliente_ms: deepseekOnly.parseMs
      }));
    }

    if (ocrMode === 'both') {
      const settled = await Promise.allSettled([callVision(), callDeepseek()]);
      const visionOk = settled[0].status === 'fulfilled' ? settled[0].value : null;
      const deepseekOk = settled[1].status === 'fulfilled' ? settled[1].value : null;
      if (!visionOk && !deepseekOk) throw (settled[0].reason || settled[1].reason);
      const textoVision = visionOk ? _B1_extraerTextoOCR_(visionOk.respuesta) : '';
      const textoDeepseek = deepseekOk ? _B1_extraerTextoOCR_(deepseekOk.respuesta) : '';
      const fusion = (typeof globalThis !== 'undefined' && globalThis.AppV2OcrFusionEngine && typeof globalThis.AppV2OcrFusionEngine.fusionarOCR === 'function')
        ? globalThis.AppV2OcrFusionEngine.fusionarOCR({ textoVision, textoDeepSeek: textoDeepseek })
        : { textoOCRFinal: textoVision || textoDeepseek, metricas: null, avisos: ['fusion_engine_no_cargado'] };
      return _B1_prepararRespuestaOCR_((visionOk || deepseekOk).respuesta, Object.assign({}, ctxBase, {
        textoFinal: fusion.textoOCRFinal || textoVision || textoDeepseek,
        vision: visionOk ? visionOk.respuesta : null,
        visionElapsedMs: visionOk ? visionOk.durationMs : null,
        deepseek: deepseekOk ? deepseekOk.respuesta : null,
        deepseekElapsedMs: deepseekOk ? deepseekOk.durationMs : null,
        fusion,
        t_fetch_vision_total_ms: Math.max(visionOk ? visionOk.durationMs : 0, deepseekOk ? deepseekOk.durationMs : 0),
        t_parse_respuesta_vision_cliente_ms: (visionOk ? visionOk.parseMs : 0) + (deepseekOk ? deepseekOk.parseMs : 0)
      }));
    }

    const visionOnly = await callVision();
    return _B1_prepararRespuestaOCR_(visionOnly.respuesta, Object.assign({}, ctxBase, {
      modo: 'vision',
      textoFinal: _B1_extraerTextoOCR_(visionOnly.respuesta),
      vision: visionOnly.respuesta,
      visionElapsedMs: visionOnly.durationMs,
      deepseek: null,
      fusion: null,
      t_fetch_vision_total_ms: visionOnly.durationMs,
      t_parse_respuesta_vision_cliente_ms: visionOnly.parseMs
    }));
  } catch (fetchErr) {
    B1_emitVisionCallTrace('vision_call_end', {
      ok: false,
      ocrMode,
      message: fetchErr && fetchErr.message ? fetchErr.message : String(fetchErr || ''),
      t_fetch_vision_total_ms: Date.now() - t0
    });
    throw fetchErr;
  }
}

async function _B1_postOcrTrastienda_(urlTrastienda, accion, sessionToken, payload, timeoutMs, label) {
  const tFetch = Date.now();
  const controller = (typeof AbortController === 'function') ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  let response;
  let respuesta = null;
  let parseMs = 0;
  try {
    response = await fetch(urlTrastienda, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduloDestino: B1_CONFIG.TRASTIENDA_MODULO_DESTINO, accion, sessionToken: sessionToken || '', payload }),
      signal: controller ? controller.signal : undefined
    });
  } catch (fetchErr) {
    if (controller && fetchErr && fetchErr.name === 'AbortError') {
      throw B1_crearErrorUpstream({ message: label + ' timeout tras ' + timeoutMs + 'ms', upstreamCode: 'HTTP_TIMEOUT', upstreamModule: B1_CONFIG.TRASTIENDA_MODULO_DESTINO, raw: null });
    }
    throw fetchErr;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  const tParse = Date.now();
  try { respuesta = await response.json(); } catch (_) { respuesta = null; }
  parseMs = Date.now() - tParse;
  if (!response.ok || !respuesta || respuesta.ok !== true) {
    const err = (respuesta && respuesta.error) || {};
    throw B1_crearErrorUpstream({
      message: err.mensaje || err.message || (label + ' respondio ' + (response.status || 'sin status')),
      upstreamCode: err.codigo || ('HTTP_' + (response.status || 'UNKNOWN')),
      upstreamModule: err.modulo || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
      raw: respuesta
    });
  }
  return { respuesta, durationMs: Date.now() - tFetch, parseMs };
}

function _B1_prepararRespuestaOCR_(respuesta, ctx) {
  const resultado = respuesta && respuesta.resultado ? respuesta.resultado : {};
  const textoFinal = String(ctx.textoFinal || '').trim();
  if (textoFinal) resultado.ocrTexto = textoFinal;
  respuesta.resultado = resultado;
  respuesta.__b1TiemposCliente = {
    t_toDataURL_ms: ctx.t_toDataURL_ms,
    t_build_payload_vision_ms: ctx.t_build_payload_vision_ms,
    t_fetch_vision_total_ms: ctx.t_fetch_vision_total_ms,
    t_parse_respuesta_vision_cliente_ms: ctx.t_parse_respuesta_vision_cliente_ms,
    t_ocr_llamada_total_ms: Date.now() - ctx.t0,
    sendModeSolicitado: ctx.sendMode || B1_SEND_MODE.BASE64,
    sendModeAplicado: 'base64',
    ocrMode: ctx.modo || 'vision'
  };
  respuesta.__b1Upstream = (respuesta && respuesta.meta && respuesta.meta.tiemposInternos) ? respuesta.meta.tiemposInternos : null;
  respuesta.__b1OcrDetalle = {
    modo: ctx.modo || 'vision',
    visionOk: !!ctx.vision,
    deepseekOk: !!ctx.deepseek,
    fusionMetricas: ctx.fusion && ctx.fusion.metricas ? ctx.fusion.metricas : null,
    fusionAvisos: ctx.fusion && Array.isArray(ctx.fusion.avisos) ? ctx.fusion.avisos : []
  };
  _B1_guardarDetalleOCR_(ctx, textoFinal);
  B1_emitVisionCallTrace('vision_call_end', {
    ok: true,
    ocrMode: ctx.modo || 'vision',
    t_fetch_vision_total_ms: ctx.t_fetch_vision_total_ms,
    t_parse_respuesta_vision_cliente_ms: ctx.t_parse_respuesta_vision_cliente_ms
  });
  return respuesta;
}

function _B1_resolverModoOCR_() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.AppV2OcrSettings && typeof globalThis.AppV2OcrSettings.getSettings === 'function') {
      return globalThis.AppV2OcrSettings.normalizeMode(globalThis.AppV2OcrSettings.getSettings().ocrMode);
    }
  } catch (err) {
    // No-op.
  }
  return 'vision';
}

function _B1_extraerTextoOCR_(respuesta) {
  const safe = respuesta && typeof respuesta === 'object' ? respuesta : {};
  const resultado = safe.resultado && typeof safe.resultado === 'object' ? safe.resultado : {};
  const data = safe.data && typeof safe.data === 'object' ? safe.data : {};
  const candidates = [resultado.ocrTexto, resultado.textoOCR, resultado.texto, resultado.text, data.ocrTexto, data.textoOCR, data.texto, data.text, safe.ocrTexto, safe.textoOCR, safe.texto, safe.text];
  for (let i = 0; i < candidates.length; i += 1) {
    if (typeof candidates[i] === 'string' && candidates[i].trim()) return candidates[i].trim();
  }
  return '';
}

function _B1_guardarDetalleOCR_(ctx, textoFinal) {
  try {
    if (typeof globalThis === 'undefined') return;
    if (!globalThis.AppV2OcrSettings || typeof globalThis.AppV2OcrSettings.saveLastOcrDetail !== 'function') return;
    globalThis.AppV2OcrSettings.saveLastOcrDetail({
      modo: ctx.modo || 'vision',
      motorSeleccionado: ctx.modo || 'vision',
      ok: true,
      vision: ctx.vision ? {
        motor: 'Google Vision OCR',
        firma: 'FUENTE_REAL: GOOGLE_VISION_OCR',
        ok: true,
        elapsedMs: ctx.visionElapsedMs,
        texto: _B1_extraerTextoOCR_(ctx.vision),
        rawJson: _B1_serializarRespuestaOCR_(ctx.vision)
      } : null,
      deepseek: ctx.deepseek ? {
        motor: 'DeepSeek-OCR en Vertex AI',
        firma: 'FUENTE_REAL: DEEPSEEK_OCR_VERTEX_AI',
        ok: true,
        elapsedMs: ctx.deepseekElapsedMs,
        texto: _B1_extraerTextoOCR_(ctx.deepseek),
        rawJson: _B1_serializarRespuestaOCR_(ctx.deepseek)
      } : null,
      fusion: ctx.fusion ? Object.assign({}, ctx.fusion, {
        elapsedMs: ctx.fusion && ctx.fusion.metricas ? ctx.fusion.metricas.elapsedMs : 0
      }) : { textoOCRFinal: textoFinal || '', elapsedMs: 0 },
      message: 'Detalle OCR generado por Boxer1.'
    });
  } catch (err) {
    // No-op.
  }
}

function _B1_serializarRespuestaOCR_(respuesta) {
  try {
    return JSON.stringify(respuesta || null, null, 2);
  } catch (err) {
    return String(respuesta || '');
  }
}

function B1_normalizarOCR(respuestaTrastienda) {
  const visionData = _extraerDatosVision(respuestaTrastienda);
  const rich = visionData.visionRich && visionData.visionRich.fullTextAnnotation;
  if (rich && Array.isArray(rich.pages) && rich.pages.length) {
    return _normalizarDesdeVisionRich(rich, visionData);
  }
  return _normalizarDesdeTextoPlano(visionData);
}

function B1_construirTextoBase(ocrNormalizado) {
  if (!ocrNormalizado || ocrNormalizado.visionVacia) return '';
  if (typeof ocrNormalizado.textoCompleto === 'string' && ocrNormalizado.textoCompleto.trim()) return ocrNormalizado.textoCompleto.trim();
  const lineas = [];
  ocrNormalizado.paginas.forEach(pagina => pagina.bloques.forEach(bloque => lineas.push(bloque.texto)));
  return lineas.join('\n');
}

function _extraerDatosVision(respuestaTrastienda) {
  if (!respuestaTrastienda) return { ocrTexto: '', metadatos: null, visionRich: null };
  const resultado = respuestaTrastienda.resultado || {};
  return {
    ocrTexto: typeof resultado.ocrTexto === 'string' ? resultado.ocrTexto : '',
    metadatos: resultado.metadatos || null,
    vacio: !!resultado.vacio,
    idiomaSolicitado: resultado.idiomaSolicitado || [],
    visionRich: resultado.visionRich || null
  };
}

function _normalizarDesdeVisionRich(fullTextAnnotation, visionData) {
  let totalPalabras = 0;
  const paginas = (fullTextAnnotation.pages || []).map((page, pageIndex) => {
    const bloques = (page.blocks || []).map((block, blockIndex) => {
      const palabras = [];
      (block.paragraphs || []).forEach((paragraph) => {
        (paragraph.words || []).forEach((word, wordIndex) => {
          const texto = _textoDesdeWord_(word);
          palabras.push({
            texto,
            confidence: _confidence_(word.confidence),
            huecoHeuristico: !texto,
            boundingPoly: _poly_(word.boundingBox || word.boundingPoly),
            simbolos: _symbols_(word.symbols || []),
            wordIndex
          });
          totalPalabras += 1;
        });
      });
      const textoBloque = palabras.map(p => p.texto).filter(Boolean).join(' ').trim();
      return {
        blockIndex,
        texto: textoBloque,
        confidence: _avg_(palabras.map(p => p.confidence)),
        boundingPoly: _poly_(block.boundingBox || block.boundingPoly),
        palabras
      };
    });
    return {
      pageIndex,
      confidence: _confidence_(page.confidence) ?? _avg_(bloques.map(b => b.confidence)),
      bloques
    };
  });
  const textoCompleto = typeof fullTextAnnotation.text === 'string' ? fullTextAnnotation.text.trim() : paginas.flatMap(p=>p.bloques.map(b=>b.texto)).join('\n').trim();
  return {
    textoCompleto,
    paginas,
    totalPalabras,
    visionVacia: totalPalabras === 0,
    metadatos: visionData.metadatos || null,
    fuente: 'vision_rica'
  };
}

function _normalizarDesdeTextoPlano(visionData) {
  const ocrTexto = typeof visionData.ocrTexto === 'string' ? visionData.ocrTexto.trim() : '';
  if (!ocrTexto) {
    return { textoCompleto:'', paginas:[], totalPalabras:0, visionVacia:true, metadatos: visionData.metadatos || null, fuente:'ocr_texto_plano' };
  }
  const lineas = ocrTexto.split(/\r?\n+/).map(x=>x.trim()).filter(Boolean);
  let totalPalabras = 0;
  const bloques = lineas.map((linea, blockIndex) => {
    const palabras = linea.split(/\s+/).filter(Boolean).map((texto, wordIndex) => {
      totalPalabras += 1;
      return { texto, confidence:_B1_confianzaHeuristicaPalabra(texto), huecoHeuristico:_B1_esHuecoHeuristico(texto), boundingPoly:null, simbolos:texto.split('').map(ch=>({ texto:ch, confidence:_B1_confianzaHeuristicaPalabra(ch) })), wordIndex };
    });
    return { blockIndex, texto: linea, confidence:_B1_mediaConfianzaPalabras(palabras), boundingPoly:null, palabras };
  });
  return { textoCompleto:ocrTexto, paginas:[{ pageIndex:0, confidence:_B1_mediaConfianzaBloques(bloques), bloques }], totalPalabras, visionVacia: totalPalabras === 0, metadatos: visionData.metadatos || null, fuente:'ocr_texto_plano' };
}

function _textoDesdeWord_(word) {
  if (!word) return '';
  if (Array.isArray(word.symbols) && word.symbols.length) return word.symbols.map(s => s && s.text ? s.text : '').join('').trim();
  if (typeof word.text === 'string') return word.text.trim();
  return '';
}
function _symbols_(symbols) { return (symbols || []).map(s => ({ texto: s && s.text ? s.text : '', confidence: _confidence_(s && s.confidence) })); }
function _poly_(poly) { return poly || null; }
function _confidence_(v) { return typeof v === 'number' ? Number(v.toFixed(2)) : null; }
function _avg_(arr) { const vals = (arr || []).filter(v => typeof v === 'number'); return vals.length ? Number((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2)) : null; }
function _B1_esHuecoHeuristico(texto) { if (typeof texto !== 'string') return true; const t=texto.trim(); if(!t) return true; if(/^[._\-â€“â€”]{2,}$/.test(t)) return true; if(/^[\|/\\]+$/.test(t)) return true; if(/^[*~]+$/.test(t)) return true; if(/^\?+$/.test(t)) return true; if(/^[0OQ]{1}$/.test(t)) return false; return false; }
function _B1_confianzaHeuristicaPalabra(texto) { if (!texto) return 0.35; let score=0.78; if(/[^\p{L}\p{N}\-.,()%/]/u.test(texto)) score-=0.15; if(/^[0-9]+$/.test(texto)) score-=0.08; if(texto.length===1) score-=0.10; if(texto.length>=18) score-=0.07; if(/(.)\1\1/.test(texto)) score-=0.12; if(/^[A-ZÃÃ‰ÃÃ“ÃšÃœÃ‘]{2,}$/.test(texto)) score-=0.03; return Math.max(0.35, Math.min(0.95, Number(score.toFixed(2)))); }
function _B1_mediaConfianzaPalabras(palabras) { return _avg_((palabras || []).map(p=>p.confidence)); }
function _B1_mediaConfianzaBloques(bloques) { return _avg_((bloques || []).map(b=>b.confidence)); }

;/* END ../../backend/boxer1/backend/operativa/B1_ocr_base_unificado_patch.js */

;/* BEGIN ../../backend/boxer1/backend/operativa/B1_fiabilidad.js */
/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * BOXER 1 v2 Â· MEDIDOR DE FIABILIDAD
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * Alineado con madre v5 y 12 reglas fijas del proyecto.
 *
 * REGLA 3: La fiabilidad NO decide cortes. Es termometro.
 * No rechaza fotos. No filtra palabras. No produce candidatos.
 * Solo mide la salud del OCR y devuelve numeros para metricas
 * y diagnostico.
 *
 * El motor de coste procesa TODAS las palabras sin importar
 * lo que diga la fiabilidad.
 *
 * Sin dependencia de B1_slots.js (muerto).
 * Sin sensitivityMode (muerto).
 * Sin B1_PRESUPUESTOS (muerto).
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */


/* â”€â”€ KEYWORDS DE ZONA CRITICA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

var _B1_KEYWORDS_ZONA_CRITICA = [
  'ingredientes', 'ingredients', 'alergenos', 'allergens',
  'contiene', 'contains', 'trazas', 'traces',
  'puede contener', 'may contain', 'leche', 'milk',
  'gluten', 'huevo', 'egg', 'soja', 'soy',
  'frutos secos', 'nuts', 'cacahuete', 'peanut',
  'pescado', 'fish', 'apio', 'celery', 'mostaza', 'mustard',
  'sesamo', 'sesame', 'sulfitos', 'sulphites', 'altramuz',
  'lupin', 'moluscos', 'molluscs', 'trigo', 'wheat',
  'cebada', 'barley', 'centeno', 'rye', 'avena', 'oats',
  'crustaceos', 'crustaceans', 'marisco', 'shellfish'
];


/* â”€â”€ UMBRAL FIJO PARA RACHAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

var _B1_UMBRAL_RACHA = 0.55;


/* â”€â”€ FUNCION PRINCIPAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/**
 * Mide la salud del OCR. No decide nada. Solo devuelve numeros.
 *
 * @param {Object} ocrNormalizado - Salida de B1_normalizarOCR
 * @returns {Object} Informe de fiabilidad (solo metricas)
 */
function B1_medirFiabilidad(ocrNormalizado) {

  if (!ocrNormalizado || ocrNormalizado.visionVacia) {
    return {
      pageConfidence:    0,
      criticalZoneScore: 0,
      rachasMalas:       0,
      huecos:            0,
      totalPalabras:     0
    };
  }

  var todasPalabras = _B1_fiab_extraerTodasPalabras(ocrNormalizado);
  var pageConfidence = _B1_fiab_calcularConfianzaPagina(todasPalabras);
  var criticalZoneScore = _B1_fiab_calcularZonaCritica(ocrNormalizado);
  var rachasMalas = _B1_fiab_contarRachasMalas(todasPalabras);
  var huecos = _B1_fiab_contarHuecos(todasPalabras);

  return {
    pageConfidence:    Math.round(pageConfidence * 100) / 100,
    criticalZoneScore: Math.round(criticalZoneScore * 100) / 100,
    rachasMalas:       rachasMalas,
    huecos:            huecos,
    totalPalabras:     todasPalabras.length
  };
}


/* â”€â”€ EXTRAER TODAS LAS PALABRAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function _B1_fiab_extraerTodasPalabras(ocrNormalizado) {
  var todas = [];

  (ocrNormalizado.paginas || []).forEach(function(pagina) {
    (pagina.bloques || []).forEach(function(bloque) {
      (bloque.palabras || []).forEach(function(palabra) {
        todas.push({
          texto:           palabra.texto,
          confidence:      palabra.confidence,
          huecoHeuristico: palabra.huecoHeuristico === true
        });
      });
    });
  });

  return todas;
}


/* â”€â”€ CONFIANZA GLOBAL DE PAGINA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function _B1_fiab_calcularConfianzaPagina(todasPalabras) {
  var sum = 0;
  var count = 0;

  for (var i = 0; i < todasPalabras.length; i++) {
    if (todasPalabras[i].confidence !== null) {
      sum += todasPalabras[i].confidence;
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}


/* â”€â”€ ZONA CRITICA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function _B1_fiab_calcularZonaCritica(ocrNormalizado) {
  var bloquesCriticos = [];

  (ocrNormalizado.paginas || []).forEach(function(pagina) {
    (pagina.bloques || []).forEach(function(bloque) {
      var textoLower = (bloque.texto || '').toLowerCase();
      for (var k = 0; k < _B1_KEYWORDS_ZONA_CRITICA.length; k++) {
        if (textoLower.indexOf(_B1_KEYWORDS_ZONA_CRITICA[k]) !== -1) {
          bloquesCriticos.push(bloque);
          break;
        }
      }
    });
  });

  if (bloquesCriticos.length === 0) {
    return _B1_fiab_calcularConfianzaPagina(
      _B1_fiab_extraerTodasPalabras(ocrNormalizado)
    );
  }

  var sum = 0;
  var count = 0;

  for (var b = 0; b < bloquesCriticos.length; b++) {
    var palabras = bloquesCriticos[b].palabras || [];
    for (var p = 0; p < palabras.length; p++) {
      if (palabras[p].confidence !== null) {
        sum += palabras[p].confidence;
        count++;
      }
    }
  }

  return count > 0 ? sum / count : 0;
}


/* â”€â”€ RACHAS MALAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function _B1_fiab_contarRachasMalas(todasPalabras) {
  var rachas = 0;
  var consecutivas = 0;

  for (var i = 0; i < todasPalabras.length; i++) {
    var conf = todasPalabras[i].confidence;
    if (conf !== null && conf < _B1_UMBRAL_RACHA) {
      consecutivas++;
    } else {
      if (consecutivas >= 3) { rachas++; }
      consecutivas = 0;
    }
  }

  if (consecutivas >= 3) { rachas++; }
  return rachas;
}


/* â”€â”€ HUECOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function _B1_fiab_contarHuecos(todasPalabras) {
  var count = 0;

  for (var i = 0; i < todasPalabras.length; i++) {
    var p = todasPalabras[i];
    if (p.confidence === null || !p.texto || !p.texto.trim() || p.huecoHeuristico) {
      count++;
    }
  }

  return count;
}

;/* END ../../backend/boxer1/backend/operativa/B1_fiabilidad.js */

;/* BEGIN ../../backend/boxer1/backend/operativa/B1_catalogos.js */
/**
 * =====================================================================
 * BOXER 1 v2 Â· CATALOGOS
 * =====================================================================
 * Catalogo cerrado de alergenos + patrones de peso/volumen.
 * Precalculado una vez al cargar la pagina.
 * Expone:
 *   - globalThis.B1_CATALOGOS
 *   - globalThis.B1_CATALOGOS_READY
 *   - globalThis.B1_CATALOGOS_ERROR
 * =====================================================================
 */

(function(global) {
  'use strict';

  var allergenCatalog = null;
  if (typeof module !== 'undefined' && module.exports) {
    try {
      allergenCatalog = require('../../../../../shared/alergenos_oficiales.js');
    } catch (errRequire) {
      allergenCatalog = null;
    }
  }
  if (!allergenCatalog && global && global.AppV2AlergenosOficiales) {
    allergenCatalog = global.AppV2AlergenosOficiales;
  }

  function B1_cat_crearError(code, message) {
    return { code: code, message: message };
  }

  function B1_cat_crearSetProtegido(values) {
    var set = new Set(values);

    ['add', 'delete', 'clear'].forEach(function(methodName) {
      Object.defineProperty(set, methodName, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function() {
          throw new TypeError('B1 blacklist exactas es de solo lectura.');
        }
      });
    });

    return Object.freeze(set);
  }

  function B1_cat_esObjetoCongelable(value) {
    return value && (typeof value === 'object' || typeof value === 'function');
  }

  function B1_cat_deepFreeze(value) {
    if (!B1_cat_esObjetoCongelable(value) || Object.isFrozen(value)) {
      return value;
    }

    Object.getOwnPropertyNames(value).forEach(function(key) {
      var child = value[key];
      if (B1_cat_esObjetoCongelable(child)) {
        B1_cat_deepFreeze(child);
      }
    });

    return Object.freeze(value);
  }

  function B1_cat_normalizarTexto(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['`]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function B1_cat_normalizarToken(texto) {
    return B1_cat_normalizarTexto(texto).replace(/\s+/g, ' ').trim();
  }

  function B1_cat_crearEsqueleto(texto) {
    return texto.replace(/[aeiou]/g, '');
  }

  function B1_cat_crearFirmaOCR(texto) {
    return texto
      .replace(/0/g, 'o')
      .replace(/[1l]/g, 'i')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/8/g, 'b')
      .replace(/\s+/g, '');
  }

  function B1_cat_agregarIndice(indices, key, item) {
    if (!Object.prototype.hasOwnProperty.call(indices, key)) {
      indices[key] = [];
    }
    indices[key].push(item);
  }

  function B1_cat_validarMatriz(matriz, familiasOficiales, idiomasOficiales) {
    var faltantes = {};
    var familiasPresentes = {};

    familiasOficiales.forEach(function(familia) {
      faltantes[familia] = [];
      familiasPresentes[familia] = true;

      idiomasOficiales.forEach(function(idioma) {
        var bucket = matriz[familia] && matriz[familia][idioma];
        if (!bucket || !bucket.length) {
          faltantes[familia].push(idioma);
        }
      });
    });

    return {
      familiasPresentes: Object.keys(familiasPresentes),
      faltantes: faltantes
    };
  }

  function B1_cat_validarFormasBasePorFamilia(matriz) {
    var required = {
      gluten: ['gluten'],
      crustaceos: ['crustaceos'],
      huevos: ['huevo', 'huevos'],
      pescado: ['pescado'],
      cacahuetes: ['cacahuete', 'cacahuetes'],
      soja: ['soja'],
      lacteos: ['lacteo', 'lacteos'],
      frutos_secos: ['almendra', 'avellana', 'nuez', 'anacardo', 'pistacho', 'macadamia', 'pecana'],
      apio: ['apio'],
      mostaza: ['mostaza'],
      sesamo: ['sesamo'],
      sulfitos: ['sulfitos'],
      altramuces: ['altramuz', 'altramuces'],
      moluscos: ['moluscos']
    };

    var faltan = {};

    Object.keys(required).forEach(function(familia) {
      var esperadas = required[familia] || [];
      var disponibles = {};
      var byIdioma = matriz[familia] || {};

      Object.keys(byIdioma).forEach(function(idioma) {
        (byIdioma[idioma] || []).forEach(function(rawForma) {
          var forma = B1_cat_normalizarToken(rawForma);
          if (forma) {
            disponibles[forma] = true;
          }
        });
      });

      var cumple = esperadas.some(function(esperada) {
        return !!disponibles[B1_cat_normalizarToken(esperada)];
      });

      if (!cumple) {
        faltan[familia] = esperadas.slice();
      }
    });

    return faltan;
  }

  function B1_cat_detectarChoquesBlacklist(blacklistValues, tablaAPalabras, tablaAFrases) {
    var formasOficiales = {};
    var choques = [];

    tablaAPalabras.forEach(function(item) {
      formasOficiales[item.forma] = true;
    });
    tablaAFrases.forEach(function(item) {
      formasOficiales[item.forma] = true;
    });

    blacklistValues.forEach(function(item) {
      if (formasOficiales[item] && choques.indexOf(item) === -1) {
        choques.push(item);
      }
    });

    return choques.sort();
  }

  function B1_cat_normalizarFormaValidada(rawForma, contexto) {
    if (typeof rawForma !== 'string') {
      throw B1_cat_crearError('B1_CAT_ENTRADA_INVALIDA', 'Entrada no string en ' + contexto + '.');
    }

    var forma = B1_cat_normalizarTexto(rawForma);
    if (!forma) {
      throw B1_cat_crearError('B1_CAT_ENTRADA_INVALIDA', 'Entrada vacia tras normalizar en ' + contexto + '.');
    }

    return forma;
  }

  function B1_cat_asegurarTablaNoVacia(nombre, tabla) {
    if (!Array.isArray(tabla) || tabla.length === 0) {
      throw B1_cat_crearError('B1_CAT_TABLA_VACIA', nombre + ' no puede quedar vacia.');
    }
  }

  function B1_cat_validarIndices(indices) {
    Object.keys(indices.hashExacto).forEach(function(key) {
      if (!Array.isArray(indices.hashExacto[key])) {
        throw B1_cat_crearError('B1_CAT_HASH_NO_ARRAY', 'hashExacto[' + key + '] debe ser array.');
      }
    });

    [
      'porLongitud',
      'porPrimeraLetra',
      'porUltimaLetra',
      'porEsqueleto',
      'porFirmaOCR',
      'frasesPorPrimerToken',
      'frasesPorNumeroTokens'
    ].forEach(function(indexName) {
      Object.keys(indices[indexName]).forEach(function(key) {
        if (!Array.isArray(indices[indexName][key])) {
          throw B1_cat_crearError(
            'B1_CAT_INDICE_NO_ARRAY',
            indexName + '[' + key + '] debe ser array.'
          );
        }
      });
    });
  }

  function B1_cat_congelarIndices(indices) {
    Object.keys(indices).forEach(function(key) {
      var bucket = indices[key];
      Object.keys(bucket).forEach(function(innerKey) {
        Object.freeze(bucket[innerKey]);
      });
      Object.freeze(bucket);
    });
    return Object.freeze(indices);
  }

  function B1_cat_congelarTablaB(tablaB) {
    tablaB.unidades = Object.freeze(tablaB.unidades.slice());

    tablaB.patronesCompactos = Object.freeze(tablaB.patronesCompactos.map(function(item) {
      return Object.freeze(item);
    }));
    tablaB.patronesSeparados = Object.freeze(tablaB.patronesSeparados.map(function(item) {
      return Object.freeze(item);
    }));
    tablaB.patronesMultipack = Object.freeze(tablaB.patronesMultipack.map(function(item) {
      return Object.freeze(item);
    }));

    return Object.freeze(tablaB);
  }

  try {
    var VERSION = 'B1_catalogos_v2_hijo1';
    var FAMILIAS_OFICIALES = Object.freeze(
      allergenCatalog && Array.isArray(allergenCatalog.NOMBRES_OFICIALES)
        ? allergenCatalog.NOMBRES_OFICIALES.slice()
        : [
            'altramuces',
            'apio',
            'cacahuetes',
            'crustaceos',
            'frutos_secos',
            'gluten',
            'huevos',
            'lacteos',
            'moluscos',
            'mostaza',
            'pescado',
            'sesamo',
            'soja',
            'sulfitos'
          ]
    );
    var IDIOMAS_OFICIALES = Object.freeze(['es', 'en', 'fr', 'de', 'it', 'pt']);

    var MATRIZ_PALABRAS = {
      gluten: {
        es: ['gluten', 'trigo', 'cebada', 'centeno', 'avena', 'espelta', 'kamut'],
        en: ['gluten', 'wheat', 'barley', 'rye', 'oats', 'spelt'],
        fr: ['gluten', 'ble', 'orge', 'seigle', 'avoine', 'epeautre'],
        de: ['gluten', 'weizen', 'gerste', 'roggen', 'hafer', 'dinkel'],
        it: ['glutine', 'frumento', 'orzo', 'segale', 'avena', 'farro'],
        pt: ['gluten', 'trigo', 'cevada', 'centeio', 'aveia']
      },
      crustaceos: {
        es: ['crustaceo', 'crustaceos'],
        en: ['crustacean', 'crustaceans'],
        fr: ['crustaces'],
        de: ['krebstiere'],
        it: ['crostacei'],
        pt: ['crustaceo', 'crustaceos']
      },
      huevos: {
        es: ['huevo', 'huevos'],
        en: ['egg', 'eggs'],
        fr: ['oeuf', 'oeufs'],
        de: ['ei', 'eier'],
        it: ['uovo', 'uova'],
        pt: ['ovo', 'ovos']
      },
      pescado: {
        es: ['pescado', 'pescados'],
        en: ['fish', 'fishes'],
        fr: ['poisson', 'poissons'],
        de: ['fisch', 'fische'],
        it: ['pesce', 'pesci'],
        pt: ['peixe', 'peixes']
      },
      cacahuetes: {
        es: ['cacahuete', 'cacahuetes', 'mani'],
        en: ['peanut', 'peanuts', 'groundnut'],
        fr: ['arachide', 'arachides'],
        de: ['erdnuss', 'erdnusse'],
        it: ['arachide'],
        pt: ['amendoim']
      },
      soja: {
        es: ['soja', 'soya'],
        en: ['soy', 'soya'],
        fr: ['soja'],
        de: ['soja'],
        it: ['soia'],
        pt: ['soja']
      },
      lacteos: {
        es: ['leche', 'lacteo', 'lacteos', 'lactosa', 'caseina', 'caseinas', 'suero'],
        en: ['milk', 'dairy', 'lactose', 'casein', 'caseins', 'whey'],
        fr: ['lait', 'lactose', 'caseine', 'lactoserum'],
        de: ['milch', 'laktose', 'kasein', 'molke'],
        it: ['latte', 'lattosio', 'caseina', 'siero'],
        pt: ['leite', 'lactose', 'caseina', 'soro']
      },
      frutos_secos: {
        es: ['almendra', 'almendras', 'avellana', 'avellanas', 'nuez', 'nueces', 'anacardo', 'anacardos', 'pistacho', 'pistachos', 'macadamia', 'macadamias', 'pecana', 'pecanas'],
        en: ['almond', 'almonds', 'hazelnut', 'hazelnuts', 'walnut', 'walnuts', 'cashew', 'cashews', 'pistachio', 'pistachios', 'pecan', 'pecans'],
        fr: ['amande', 'amandes', 'noisette', 'noisettes', 'noix', 'pistache', 'pistaches'],
        de: ['mandel', 'mandeln', 'haselnuss', 'haselnusse', 'walnuss', 'walnusse', 'pistazie', 'pistazien'],
        it: ['mandorla', 'mandorle', 'nocciola', 'nocciole', 'noce', 'noci', 'pistacchio', 'pistacchi'],
        pt: ['amendoa', 'amendoas', 'avela', 'avelas', 'noz', 'nozes']
      },
      apio: {
        es: ['apio'],
        en: ['celery'],
        fr: ['celeri'],
        de: ['sellerie'],
        it: ['sedano'],
        pt: ['aipo']
      },
      mostaza: {
        es: ['mostaza'],
        en: ['mustard'],
        fr: ['moutarde'],
        de: ['senf'],
        it: ['senape'],
        pt: ['mostarda']
      },
      sesamo: {
        es: ['sesamo', 'ajonjoli'],
        en: ['sesame'],
        fr: ['sesame'],
        de: ['sesam'],
        it: ['sesamo'],
        pt: ['gergelim']
      },
      sulfitos: {
        es: ['sulfito', 'sulfitos'],
        en: ['sulphite', 'sulphites', 'sulfite', 'sulfites'],
        fr: ['sulfite', 'sulfites'],
        de: ['sulfite'],
        it: ['solfito', 'solfiti'],
        pt: ['sulfitos']
      },
      altramuces: {
        es: ['altramuz', 'altramuces'],
        en: ['lupin', 'lupins'],
        fr: ['lupin'],
        de: ['lupine'],
        it: ['lupino'],
        pt: ['lupino']
      },
      moluscos: {
        es: ['molusco', 'moluscos'],
        en: ['mollusc', 'molluscs'],
        fr: ['mollusque', 'mollusques'],
        de: ['weichtier', 'weichtiere'],
        it: ['mollusco', 'molluschi'],
        pt: ['molusco', 'moluscos']
      }
    };

    var MATRIZ_FRASES = {
      frutos_secos: {
        es: ['frutos de cascara', 'fruto de cascara', 'frutos secos'],
        en: ['tree nuts'],
        fr: ['fruits a coque'],
        de: ['schalenfruchte'],
        it: ['frutta a guscio'],
        pt: ['frutos de casca']
      },
      sulfitos: {
        es: ['dioxido de azufre'],
        en: ['sulphur dioxide'],
        fr: ['dioxyde de soufre'],
        de: ['schwefeldioxid'],
        it: ['anidride solforosa'],
        pt: ['dioxido de enxofre']
      }
    };

    var validation = B1_cat_validarMatriz(MATRIZ_PALABRAS, FAMILIAS_OFICIALES, IDIOMAS_OFICIALES);
    var coberturaFaltante = {};
    var familiasSinCobertura = [];
    Object.keys(validation.faltantes).forEach(function(familia) {
      var idiomasFaltantes = validation.faltantes[familia];
      if (idiomasFaltantes.length) {
        coberturaFaltante[familia] = idiomasFaltantes.slice();
        familiasSinCobertura.push(familia);
      }
    });

    if (familiasSinCobertura.length) {
      throw B1_cat_crearError(
        'B1_CAT_COBERTURA_INCOMPLETA',
        'Matriz de catalogos incompleta: ' + familiasSinCobertura.join(', ')
      );
    }

    var faltantesFormasBase = B1_cat_validarFormasBasePorFamilia(MATRIZ_PALABRAS);
    if (Object.keys(faltantesFormasBase).length) {
      throw B1_cat_crearError(
        'B1_CAT_FAMILIA_BASE_FALTANTE',
        'Faltan formas base por familia: ' + JSON.stringify(faltantesFormasBase)
      );
    }

    var idiomasFaltantesFrasesSulfitos = IDIOMAS_OFICIALES.filter(function(idioma) {
      return !MATRIZ_FRASES.sulfitos || !MATRIZ_FRASES.sulfitos[idioma] || !MATRIZ_FRASES.sulfitos[idioma].length;
    });
    if (idiomasFaltantesFrasesSulfitos.length) {
      throw B1_cat_crearError(
        'B1_CAT_FRASES_INCOMPLETAS',
        'Frases de sulfitos incompletas: ' + idiomasFaltantesFrasesSulfitos.join(', ')
      );
    }

    var formaToFamilias = {};
    var tablaAPalabras = [];
    var tablaAFrases = [];

    FAMILIAS_OFICIALES.forEach(function(familia) {
      IDIOMAS_OFICIALES.forEach(function(idioma) {
        MATRIZ_PALABRAS[familia][idioma].forEach(function(rawForma) {
          var forma = B1_cat_normalizarFormaValidada(rawForma, 'tablaA.palabras.' + familia + '.' + idioma);
          if (!formaToFamilias[forma]) {
            formaToFamilias[forma] = {};
          }
          formaToFamilias[forma][familia] = true;
          tablaAPalabras.push({
            forma: forma,
            familia: familia,
            idioma: idioma
          });
        });
      });
    });

    Object.keys(MATRIZ_FRASES).forEach(function(familia) {
      var byIdioma = MATRIZ_FRASES[familia];
      Object.keys(byIdioma).forEach(function(idioma) {
        byIdioma[idioma].forEach(function(rawForma) {
          var forma = B1_cat_normalizarFormaValidada(rawForma, 'tablaA.frases.' + familia + '.' + idioma);
          var tokens = forma.split(' ');
          tablaAFrases.push({
            forma: forma,
            familia: familia,
            idioma: idioma,
            multifamilia: false,
            len: forma.replace(/\s+/g, '').length,
            primera: tokens[0] || '',
            ultima: tokens[tokens.length - 1] || '',
            esqueleto: B1_cat_crearEsqueleto(forma.replace(/\s+/g, '')),
            firmaOCR: B1_cat_crearFirmaOCR(forma),
            tokens: Object.freeze(tokens.slice()),
            numeroTokens: tokens.length
          });
        });
      });
    });

    var formasMultifamilia = [];
    tablaAPalabras = tablaAPalabras.map(function(item) {
      var familias = Object.keys(formaToFamilias[item.forma]);
      var multifamilia = familias.length > 1;
      if (multifamilia && formasMultifamilia.indexOf(item.forma) === -1) {
        formasMultifamilia.push(item.forma);
      }

      return Object.freeze({
        forma: item.forma,
        familia: item.familia,
        idioma: item.idioma,
        multifamilia: multifamilia,
        len: item.forma.length,
        primera: item.forma.charAt(0),
        ultima: item.forma.charAt(item.forma.length - 1),
        esqueleto: B1_cat_crearEsqueleto(item.forma),
        firmaOCR: B1_cat_crearFirmaOCR(item.forma)
      });
    });

    tablaAFrases = tablaAFrases.map(function(item) {
      if (formaToFamilias[item.forma]) {
        item.multifamilia = Object.keys(formaToFamilias[item.forma]).length > 1;
      }
      return Object.freeze(item);
    });

    B1_cat_asegurarTablaNoVacia('tablaA.palabras', tablaAPalabras);
    B1_cat_asegurarTablaNoVacia('tablaA.frases', tablaAFrases);

    var indices = {
      hashExacto: {},
      porLongitud: {},
      porPrimeraLetra: {},
      porUltimaLetra: {},
      porEsqueleto: {},
      porFirmaOCR: {},
      frasesPorPrimerToken: {},
      frasesPorNumeroTokens: {}
    };

    tablaAPalabras.forEach(function(item) {
      B1_cat_agregarIndice(indices.hashExacto, item.forma, item);
      B1_cat_agregarIndice(indices.porLongitud, String(item.len), item);
      B1_cat_agregarIndice(indices.porPrimeraLetra, item.primera, item);
      B1_cat_agregarIndice(indices.porUltimaLetra, item.ultima, item);
      B1_cat_agregarIndice(indices.porEsqueleto, item.esqueleto, item);
      B1_cat_agregarIndice(indices.porFirmaOCR, item.firmaOCR, item);
    });

    tablaAFrases.forEach(function(item) {
      B1_cat_agregarIndice(indices.frasesPorPrimerToken, item.primera, item);
      B1_cat_agregarIndice(indices.frasesPorNumeroTokens, String(item.numeroTokens), item);
    });
    B1_cat_validarIndices(indices);

    var unidadesTablaB = ['g', 'kg', 'l', 'ml', 'cl', 'oz', 'lb'];
    var tablaB = B1_cat_congelarTablaB({
      unidades: unidadesTablaB,
      patronesCompactos: [
        { id: 'numero_unidad', regex: /^\d+(?:[.,]\d+)?(?:g|kg|l|ml|cl|oz|lb)$/ },
        { id: 'unidad_sola', regex: /^(?:g|kg|l|ml|cl|oz|lb)$/ }
      ],
      patronesSeparados: [
        { id: 'numero_espacio_unidad', regex: /^\d+(?:[.,]\d+)?\s+(?:g|kg|l|ml|cl|oz|lb)$/ }
      ],
      patronesMultipack: [
        { id: 'multipack_compacto', regex: /^\d+\s*[x*]\s*\d+(?:[.,]\d+)?(?:g|kg|l|ml|cl|oz|lb)$/ },
        { id: 'multipack_separado', regex: /^\d+\s*[x*]\s*\d+(?:[.,]\d+)?\s+(?:g|kg|l|ml|cl|oz|lb)$/ }
      ]
    });
    B1_cat_asegurarTablaNoVacia('tablaB.unidades', tablaB.unidades);
    B1_cat_asegurarTablaNoVacia('tablaB.patronesCompactos', tablaB.patronesCompactos);
    B1_cat_asegurarTablaNoVacia('tablaB.patronesSeparados', tablaB.patronesSeparados);
    B1_cat_asegurarTablaNoVacia('tablaB.patronesMultipack', tablaB.patronesMultipack);

    var blacklistValues = ['sal', 'son', 'vez', 'pasta'];
    var choquesBlacklist = B1_cat_detectarChoquesBlacklist(blacklistValues, tablaAPalabras, tablaAFrases);
    if (choquesBlacklist.length) {
      throw B1_cat_crearError(
        'B1_CAT_BLACKLIST_CHOQUE',
        'Blacklist en conflicto con Tabla A: ' + choquesBlacklist.join(', ')
      );
    }

    var blacklist = Object.freeze({
      exactas: B1_cat_crearSetProtegido(blacklistValues)
    });

    var meta = Object.freeze({
      version: VERSION,
      familiasOficiales: FAMILIAS_OFICIALES,
      idiomasOficiales: IDIOMAS_OFICIALES,
      familiasDetectadas: Object.freeze(Array.from(new Set(
        tablaAPalabras.concat(tablaAFrases).map(function(item) {
          return item.familia;
        })
      ))),
      coberturaFaltante: Object.freeze(coberturaFaltante),
      formasMultifamilia: Object.freeze(formasMultifamilia.slice()),
      tablaACompleta: familiasSinCobertura.length === 0,
      tablaBCompleta:
        tablaB.unidades.length === 7 &&
        tablaB.patronesCompactos.length > 0 &&
        tablaB.patronesSeparados.length > 0 &&
        tablaB.patronesMultipack.length > 0
    });

    var catalogos = Object.freeze({
      tablaA: Object.freeze({
        palabras: Object.freeze(tablaAPalabras.slice()),
        frases: Object.freeze(tablaAFrases.slice())
      }),
      tablaB: tablaB,
      blacklist: blacklist,
      indices: B1_cat_congelarIndices(indices),
      meta: meta
    });

    B1_cat_deepFreeze(catalogos);

    global.B1_CATALOGOS = catalogos;
    global.B1_CATALOGOS_READY = true;
    global.B1_CATALOGOS_ERROR = null;
  } catch (error) {
    global.B1_CATALOGOS = null;
    global.B1_CATALOGOS_READY = false;
    global.B1_CATALOGOS_ERROR = error && error.code
      ? error
      : B1_cat_crearError('B1_CAT_BUILD_FAILED', error && error.message ? error.message : 'Error creando catalogos.');
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);

;/* END ../../backend/boxer1/backend/operativa/B1_catalogos.js */

;/* BEGIN ../../backend/boxer1/backend/operativa/B1_motor_coste_ocr.js */
/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * BOXER 1 v2 Â· MOTOR DE RECONOCIMIENTO POR COSTE OCR CERRADO
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * Alineado con madre v5 y 12 reglas fijas del proyecto.
 *
 * Regla madre: una palabra OCR solo entra al agente si puede
 * explicarse como deformacion de una palabra oficial del lexico,
 * con coste por debajo del umbral.
 * Si duda entre dos familias, va a Gemini. No muere ambigua.
 *
 * Misma entrada, misma salida. Siempre.
 *
 * 5 grupos de salida:
 *   validas, rotasReconocidas, rechazadasDefinitivas,
 *   tablaBReconocida, observabilidadMotor
 *
 * Sin sensitivityMode. Sin confidence como puerta.
 * Sin fetch, canvas, slots ni Gemini.
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAPA DE CONFUSIONES OCR â€” tabla cerrada
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

var _B1_MOTOR_PARES_COSTE_1 = {
  '0_o':1, '1_i':1, '1_l':1, '4_a':1, '5_s':1, '8_b':1,
  'b_h':1, 'c_e':1, 'n_r':1
};

var _B1_MOTOR_PARES_COSTE_2 = {
  'b_d':2, 'f_t':2, 'g_q':2, 'm_n':2, 'p_q':2, 'u_v':2
};

var _B1_MOTOR_COMPUESTOS = {
  'rn': {reemplazo:'m', coste:1},
  'cl': {reemplazo:'d', coste:1},
  'vv': {reemplazo:'w', coste:1},
  'ii': {reemplazo:'u', coste:1}
};

var _B1_MOTOR_COSTE_INFINITO = 9999;

function _B1_motor_costeSustitucion(a, b) {
  if (a === b) return 0;
  var clave = a < b ? (a + '_' + b) : (b + '_' + a);
  if (_B1_MOTOR_PARES_COSTE_1[clave]) return 1;
  if (_B1_MOTOR_PARES_COSTE_2[clave]) return 2;
  // Sustitucion sin parecido visual
  return 4;
}

function _B1_motor_costeInsercion(ch) {
  // Insercion = falta caracter en token (hay que anadir para llegar al candidato)
  if (ch === "'" || ch === '\u2019') return 1;
  return 2;
}

function _B1_motor_costeEliminacion(ch, prevCh, token, pos) {
  // Eliminacion = sobra caracter en token
  if (ch === "'" || ch === '\u2019') return 1;
  // Duplicado: mismo caracter que el anterior
  if (pos > 0 && ch === prevCh) return 1;
  return 2;
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   NORMALIZACION
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function _B1_motor_normalizar(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _B1_motor_soloLetras(texto) {
  return texto.replace(/[^a-z]/g, '');
}

function _B1_motor_esqueleto(texto) {
  return texto.replace(/[aeiou]/g, '');
}

function _B1_motor_firmaOCR(texto) {
  var out = '';
  for (var i = 0; i < texto.length; i++) {
    var ch = texto[i];
    if (ch === '0') { out += 'o'; }
    else if (ch === '1' || ch === 'l' || ch === 'i') { out += 'l'; }
    else if (ch === "'" || ch === '\u2019') { /* skip */ }
    else { out += ch; }
  }
  return out;
}

function _B1_motor_esVocal(ch) {
  return ch === 'a' || ch === 'e' || ch === 'i' || ch === 'o' || ch === 'u';
}

function _B1_motor_longitudesRachaVocalDesde(texto, inicio) {
  var out = [];
  var len = 0;

  for (var i = inicio; i < texto.length; i++) {
    if (!_B1_motor_esVocal(texto[i])) break;
    len++;
    if (len >= 2) out.push(len);
  }

  return out;
}

function _B1_motor_intentarActualizar(costes, back, fila, col, paso) {
  var actual = costes[fila][col];
  var prioridadActual = back[fila][col] ? back[fila][col].prioridad : 999;

  if (
    actual == null ||
    paso.coste < actual ||
    (paso.coste === actual && paso.prioridad < prioridadActual)
  ) {
    costes[fila][col] = paso.coste;
    back[fila][col] = paso;
  }
}

function _B1_motor_reconstruirOperaciones(back, fila, col) {
  var operaciones = [];
  var i = fila;
  var j = col;

  while (i > 0 || j > 0) {
    var paso = back[i][j];
    if (!paso) break;

    operaciones.push({
      op: paso.op,
      tokenConsumido: paso.tokenConsumido || '',
      candidatoConsumido: paso.candidatoConsumido || '',
      costOperacion: paso.costOperacion || 0,
      desdeFila: paso.pi,
      desdeCol: paso.pj,
      hastaFila: i,
      hastaCol: j
    });

    i = paso.pi;
    j = paso.pj;
  }

  operaciones.reverse();
  return operaciones;
}

function _B1_motor_mismoMulticonjunto(a, b) {
  if (a.length !== b.length) return false;

  var mapa = {};
  for (var i = 0; i < a.length; i++) {
    mapa[a[i]] = (mapa[a[i]] || 0) + 1;
  }

  for (var j = 0; j < b.length; j++) {
    if (!mapa[b[j]]) return false;
    mapa[b[j]]--;
  }

  return Object.keys(mapa).every(function(clave) {
    return mapa[clave] === 0;
  });
}

function _B1_motor_tieneReordenacion(token, candidato, operaciones) {
  if (token.length === candidato.length && token !== candidato && _B1_motor_mismoMulticonjunto(token, candidato)) {
    return true;
  }

  for (var i = 0; i < operaciones.length - 1; i++) {
    var op1 = operaciones[i];
    var op2 = operaciones[i + 1];

    if (
      op1.op === 'sustitucion' &&
      op2.op === 'sustitucion' &&
      op1.tokenConsumido.length === 1 &&
      op2.tokenConsumido.length === 1 &&
      op1.candidatoConsumido.length === 1 &&
      op2.candidatoConsumido.length === 1 &&
      op1.tokenConsumido === op2.candidatoConsumido &&
      op2.tokenConsumido === op1.candidatoConsumido
    ) {
      return true;
    }
  }

  return false;
}

function _B1_motor_totalInsercionesSimples(operaciones) {
  var total = 0;

  for (var i = 0; i < operaciones.length; i++) {
    if (operaciones[i].op === 'insercion') {
      total += operaciones[i].candidatoConsumido.length;
    }
  }

  return total;
}

function _B1_motor_analizarAlineamiento(token, candidato, operaciones, costeAbsoluto) {
  var longitudBase = Math.max(token.length, candidato.length) || 1;

  if (costeAbsoluto / longitudBase > 0.65) {
    return { prohibida: true, motivo: 'destruccion_excesiva' };
  }

  if (_B1_motor_tieneReordenacion(token, candidato, operaciones)) {
    return { prohibida: true, motivo: 'reordenacion' };
  }

  if (_B1_motor_totalInsercionesSimples(operaciones) >= 3) {
    return { prohibida: true, motivo: 'insercion_masiva' };
  }

  return { prohibida: false, motivo: null };
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LEVENSHTEIN PONDERADO CON CORTE TEMPRANO
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function _B1_motor_distanciaPonderada(token, candidatoForma, maxCoste) {
  var n = token.length;
  var m = candidatoForma.length;
  var costes = new Array(n + 1);
  var back = new Array(n + 1);

  for (var i = 0; i <= n; i++) {
    costes[i] = new Array(m + 1);
    back[i] = new Array(m + 1);
  }

  costes[0][0] = 0;

  for (var fila = 0; fila <= n; fila++) {
    for (var col = 0; col <= m; col++) {
      var costeBase = costes[fila][col];
      if (costeBase == null || costeBase > maxCoste) continue;

      if (fila < n && col < m) {
        var chToken = token[fila];
        var chCand = candidatoForma[col];
        var costeSust = _B1_motor_costeSustitucion(chToken, chCand);
        _B1_motor_intentarActualizar(costes, back, fila + 1, col + 1, {
          coste: costeBase + costeSust,
          prioridad: costeSust === 0 ? 0 : 1,
          pi: fila,
          pj: col,
          op: costeSust === 0 ? 'match' : 'sustitucion',
          costOperacion: costeSust,
          tokenConsumido: chToken,
          candidatoConsumido: chCand
        });
      }

      if (fila < n) {
        var costeElim = _B1_motor_costeEliminacion(
          token[fila],
          fila > 0 ? token[fila - 1] : '',
          token,
          fila
        );
        _B1_motor_intentarActualizar(costes, back, fila + 1, col, {
          coste: costeBase + costeElim,
          prioridad: 5,
          pi: fila,
          pj: col,
          op: 'eliminacion',
          costOperacion: costeElim,
          tokenConsumido: token[fila],
          candidatoConsumido: ''
        });
      }

      if (col < m) {
        var costeIns = _B1_motor_costeInsercion(candidatoForma[col]);
        _B1_motor_intentarActualizar(costes, back, fila, col + 1, {
          coste: costeBase + costeIns,
          prioridad: 5,
          pi: fila,
          pj: col,
          op: 'insercion',
          costOperacion: costeIns,
          tokenConsumido: '',
          candidatoConsumido: candidatoForma[col]
        });
      }

      if (fila + 1 < n && col < m) {
        var bigramaToken = token[fila] + token[fila + 1];
        var compuestoToken = _B1_MOTOR_COMPUESTOS[bigramaToken];
        if (compuestoToken && compuestoToken.reemplazo === candidatoForma[col]) {
          _B1_motor_intentarActualizar(costes, back, fila + 2, col + 1, {
            coste: costeBase + compuestoToken.coste,
            prioridad: 2,
            pi: fila,
            pj: col,
            op: 'compuesto_token_bigrama',
            costOperacion: compuestoToken.coste,
            tokenConsumido: bigramaToken,
            candidatoConsumido: candidatoForma[col]
          });
        }
      }

      if (fila < n && col + 1 < m) {
        var bigramaCand = candidatoForma[col] + candidatoForma[col + 1];
        var compuestoCand = _B1_MOTOR_COMPUESTOS[bigramaCand];
        if (compuestoCand && compuestoCand.reemplazo === token[fila]) {
          _B1_motor_intentarActualizar(costes, back, fila + 1, col + 2, {
            coste: costeBase + compuestoCand.coste,
            prioridad: 2,
            pi: fila,
            pj: col,
            op: 'compuesto_candidato_bigrama',
            costOperacion: compuestoCand.coste,
            tokenConsumido: token[fila],
            candidatoConsumido: bigramaCand
          });
        }
      }

      var rachasCand = _B1_motor_longitudesRachaVocalDesde(candidatoForma, col);
      for (var rc = 0; rc < rachasCand.length; rc++) {
        var lenCand = rachasCand[rc];
        _B1_motor_intentarActualizar(costes, back, fila, col + lenCand, {
          coste: costeBase + 3,
          prioridad: 3,
          pi: fila,
          pj: col,
          op: 'vocales_perdidas_token',
          costOperacion: 3,
          tokenConsumido: '',
          candidatoConsumido: candidatoForma.slice(col, col + lenCand)
        });
      }

      var rachasToken = _B1_motor_longitudesRachaVocalDesde(token, fila);
      for (var rt = 0; rt < rachasToken.length; rt++) {
        var lenToken = rachasToken[rt];
        _B1_motor_intentarActualizar(costes, back, fila + lenToken, col, {
          coste: costeBase + 3,
          prioridad: 3,
          pi: fila,
          pj: col,
          op: 'vocales_extra_token',
          costOperacion: 3,
          tokenConsumido: token.slice(fila, fila + lenToken),
          candidatoConsumido: ''
        });
      }
    }
  }

  var costeAbsoluto = costes[n][m];
  if (costeAbsoluto == null || costeAbsoluto > maxCoste) {
    return { coste: _B1_MOTOR_COSTE_INFINITO, prohibida: false, motivoProhibida: null, operaciones: [] };
  }

  var operaciones = _B1_motor_reconstruirOperaciones(back, n, m);
  var analisis = _B1_motor_analizarAlineamiento(token, candidatoForma, operaciones, costeAbsoluto);

  return {
    coste: costeAbsoluto,
    prohibida: analisis.prohibida,
    motivoProhibida: analisis.motivo,
    operaciones: operaciones
  };
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   UMBRALES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function _B1_motor_umbral(longitudCandidato) {
  if (longitudCandidato <= 3) return 0.35;
  if (longitudCandidato <= 4) return 0.45;
  return 0.65;
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PREPROCESO: TABLA B SEPARADA
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/*
 * Helper: los patrones de Tabla B pueden ser regex directas
 * o objetos { regex: /.../ }. Esta funcion maneja ambos.
 */
function _B1_motor_testPatron(patron, texto) {
  if (patron instanceof RegExp) return patron.test(texto);
  if (patron && patron.regex instanceof RegExp) return patron.regex.test(texto);
  return false;
}

var _B1_MOTOR_TABLA_B_UNIDADES = {
  g:  { grupo: 'masa',    factor: 1 },
  kg: { grupo: 'masa',    factor: 1000 },
  oz: { grupo: 'masa',    factor: 28.349523125 },
  lb: { grupo: 'masa',    factor: 453.59237 },
  ml: { grupo: 'volumen', factor: 1 },
  cl: { grupo: 'volumen', factor: 10 },
  l:  { grupo: 'volumen', factor: 1000 }
};

var _B1_MOTOR_TABLA_B_MARCAS_COMERCIALES = [
  'peso neto', 'peso liquido', 'peso lÃ­quido', 'contenido neto',
  'volumen neto', 'cantidad neta', 'net weight', 'net volume',
  'peso', 'liquido', 'lÃ­quido', 'neto', 'contenido'
];

var _B1_MOTOR_TABLA_B_MARCAS_NUTRICIONALES = [
  'informacion nutricional', 'informaciÃ³n nutricional', 'declaracion nutricional',
  'declaraÃ§Ã£o nutricional', 'valores nutricionales', 'valores nutricionales por',
  'valores medios por', 'valores mÃ©dios por', 'valeurs nutritionnelles',
  'nutrition facts', 'nutrition', 'energy value', 'valor energetico',
  'valor energÃ©tico', 'energia', 'grasas', 'lipidos', 'lÃ­pidos',
  'hidratos de carbono', 'carbohidratos', 'azucares', 'azÃºcares',
  'proteinas', 'proteÃ­nas', 'sal', 'saturadas', 'saturados',
  'por 100 g', 'por 100g', 'por 100 ml', 'por 100ml'
];

function _B1_motor_parsearNumeroTablaB(texto) {
  var valor = parseFloat(String(texto || '').replace(',', '.'));
  return isNaN(valor) ? null : valor;
}

function _B1_motor_normalizarUnidadTablaB(textoUnidad) {
  var unidad = String(textoUnidad || '').replace(/\s+/g, '').toLowerCase();
  var marcaEstimacion = false;

  if (!unidad) return null;

  if (unidad.length > 1 && unidad.endsWith('e')) {
    marcaEstimacion = true;
    unidad = unidad.slice(0, -1);
  }

  if (!_B1_MOTOR_TABLA_B_UNIDADES[unidad]) return null;

  return {
    unidad: unidad,
    marcaEstimacion: marcaEstimacion
  };
}

function _B1_motor_tipoProductoTablaB(item) {
  if (!item) return null;
  if (item.cantidadPack != null) return 'pack';
  if (item.grupoUnidad === 'volumen') return 'volumen';
  if (item.grupoUnidad === 'masa') return 'peso';
  return null;
}

function _B1_motor_resolverPosicionEnBloqueTablaB(bloque, wordIndex, textoOriginal) {
  var palabras = bloque && Array.isArray(bloque.palabras) ? bloque.palabras : [];
  var i;

  if (typeof wordIndex === 'number') {
    for (i = 0; i < palabras.length; i++) {
      if (palabras[i] && palabras[i].wordIndex === wordIndex) return i;
    }
    if (wordIndex >= 0 && wordIndex < palabras.length) return wordIndex;
  }

  if (textoOriginal) {
    for (i = 0; i < palabras.length; i++) {
      if (palabras[i] && String(palabras[i].texto || '').trim() === textoOriginal) return i;
    }
  }

  return -1;
}

function _B1_motor_extraerContextoTablaB(palabrasOCR, indice, consumeSiguiente) {
  var pal = palabrasOCR[indice] || {};
  var bloque = pal.bloque;
  var palabrasBloque = bloque && Array.isArray(bloque.palabras) ? bloque.palabras : [];
  var posicion = _B1_motor_resolverPosicionEnBloqueTablaB(bloque, pal.wordIndex, pal.texto);
  var inicio = 0;
  var fin = palabrasBloque.length - 1;
  var ventana = 6;
  var local = '';
  var bloqueTexto = bloque && bloque.texto ? bloque.texto : '';

  if (posicion >= 0) {
    inicio = Math.max(0, posicion - ventana);
    fin = Math.min(
      palabrasBloque.length - 1,
      posicion + (consumeSiguiente ? 1 : 0) + ventana
    );
    local = palabrasBloque.slice(inicio, fin + 1).map(function(item) {
      return String(item && item.texto || '').trim();
    }).filter(Boolean).join(' ');
  } else {
    local = String(pal.texto || '').trim();
  }

  return {
    local: local,
    localNorm: _B1_motor_normalizar(local),
    bloque: bloqueTexto,
    bloqueNorm: _B1_motor_normalizar(bloqueTexto)
  };
}

function _B1_motor_sumarMarcasTablaB(textoNorm, lista) {
  var score = 0;
  var motivos = [];

  if (!textoNorm) {
    return { score: 0, motivos: motivos };
  }

  for (var i = 0; i < lista.length; i++) {
    var marca = _B1_motor_normalizar(lista[i]);
    if (marca && textoNorm.indexOf(marca) !== -1) {
      score += 1;
      motivos.push(marca);
    }
  }

  return { score: score, motivos: motivos };
}

function _B1_motor_clasificarContextoTablaB(item, contexto) {
  var scoreComercial = 0;
  var scoreNutricional = 0;
  var motivos = [];
  var bloqueNorm = contexto && contexto.bloqueNorm ? contexto.bloqueNorm : '';
  var localNorm = contexto && contexto.localNorm ? contexto.localNorm : '';
  var marcasComLocal = _B1_motor_sumarMarcasTablaB(localNorm, _B1_MOTOR_TABLA_B_MARCAS_COMERCIALES);
  var marcasComBloque = _B1_motor_sumarMarcasTablaB(bloqueNorm, _B1_MOTOR_TABLA_B_MARCAS_COMERCIALES);
  var marcasNutLocal = _B1_motor_sumarMarcasTablaB(localNorm, _B1_MOTOR_TABLA_B_MARCAS_NUTRICIONALES);
  var marcasNutBloque = _B1_motor_sumarMarcasTablaB(bloqueNorm, _B1_MOTOR_TABLA_B_MARCAS_NUTRICIONALES);

  scoreComercial += marcasComLocal.score * 4;
  scoreComercial += marcasComBloque.score * 2;
  scoreNutricional += marcasNutLocal.score * 4;
  scoreNutricional += marcasNutBloque.score * 2;

  if (item.marcaEstimacion) {
    scoreComercial += 5;
    motivos.push('marca_estimacion_e');
  }

  if (item.cantidadPack != null) {
    scoreComercial += 3;
    motivos.push('multipack');
  }

  if (item.totalEstandar != null && item.totalEstandar >= 250) {
    scoreComercial += 1;
  }
  if (item.totalEstandar != null && item.totalEstandar <= 100 && scoreNutricional > 0) {
    scoreNutricional += 2;
  }

  if (localNorm.indexOf('por 100 g') !== -1 || localNorm.indexOf('por 100 ml') !== -1 ||
      bloqueNorm.indexOf('por 100 g') !== -1 || bloqueNorm.indexOf('por 100 ml') !== -1) {
    scoreNutricional += 6;
    motivos.push('por_100');
  }

  var origenContexto = 'neutro';
  if (scoreNutricional >= scoreComercial + 2 && scoreNutricional >= 4) {
    origenContexto = 'nutricional';
  } else if (scoreComercial > scoreNutricional && scoreComercial >= 3) {
    origenContexto = 'comercial';
  }

  return {
    origenContexto: origenContexto,
    scoreContextoComercial: scoreComercial,
    scoreContextoNutricional: scoreNutricional,
    motivoContexto: motivos.join('|') || null
  };
}

function _B1_motor_coincideConPatronesTablaB(tipo, texto, catalogos) {
  var patrones = [];
  if (tipo === 'compacto') patrones = catalogos.tablaB.patronesCompactos || [];
  else if (tipo === 'separado') patrones = catalogos.tablaB.patronesSeparados || [];
  else if (tipo === 'multipack') patrones = catalogos.tablaB.patronesMultipack || [];

  for (var i = 0; i < patrones.length; i++) {
    if (_B1_motor_testPatron(patrones[i], texto)) return true;
  }
  return false;
}

function _B1_motor_crearDetectadoTablaB(params) {
  var numero = params.numero != null ? _B1_motor_parsearNumeroTablaB(params.numero) : null;
  var unidadInfo = params.unidad ? _B1_MOTOR_TABLA_B_UNIDADES[params.unidad] : null;
  var valorEstandar = (numero != null && unidadInfo) ? (numero * unidadInfo.factor) : null;
  var totalEstandar = valorEstandar;

  if (params.cantidadPack != null && valorEstandar != null) {
    totalEstandar = params.cantidadPack * valorEstandar;
  }

  return {
    detectado: true,
    patron: params.patron,
    tokenConsumidoOriginal: params.tokenConsumidoOriginal,
    tokenConsumidoNormalizado: params.tokenConsumidoNormalizado,
    consumeSiguiente: !!params.consumeSiguiente,
    numero: numero,
    unidad: params.unidad || null,
    unidadDetectada: params.unidadDetectada || params.unidad || null,
    grupoUnidad: unidadInfo ? unidadInfo.grupo : null,
    valorEstandar: valorEstandar,
    totalEstandar: totalEstandar,
    cantidadPack: params.cantidadPack != null ? params.cantidadPack : null,
    marcaEstimacion: !!params.marcaEstimacion
  };
}

function _B1_motor_detectarTablaB(tokenNorm, siguienteNorm, textoOriginal, siguienteOriginal, catalogos) {
  var tokenPlano = (tokenNorm || '').replace(/\s+/g, '');
  var siguientePlano = (siguienteNorm || '').replace(/\s+/g, '');
  var combinadoSeparado = tokenNorm && siguienteNorm ? (tokenNorm + ' ' + siguienteNorm).trim() : '';
  var combinadoPlano = tokenPlano && siguientePlano ? (tokenPlano + siguientePlano) : '';

  var match;

  match = tokenPlano.match(/^(\d+(?:[.,]\d+)?)([a-z]+)$/);
  var unidadCompacta = match ? _B1_motor_normalizarUnidadTablaB(match[2]) : null;
  var tokenCompactoNormalizado = unidadCompacta ? (match[1] + unidadCompacta.unidad) : '';
  if (match && unidadCompacta && _B1_motor_coincideConPatronesTablaB('compacto', tokenCompactoNormalizado, catalogos)) {
    return _B1_motor_crearDetectadoTablaB({
      patron: 'compacto',
      tokenConsumidoOriginal: textoOriginal,
      tokenConsumidoNormalizado: tokenCompactoNormalizado,
      consumeSiguiente: false,
      numero: match[1],
      unidad: unidadCompacta.unidad,
      unidadDetectada: match[2],
      marcaEstimacion: unidadCompacta.marcaEstimacion
    });
  }

  match = tokenPlano.match(/^(\d+)[x*](\d+(?:[.,]\d+)?)([a-z]+)$/);
  var unidadMultipack = match ? _B1_motor_normalizarUnidadTablaB(match[3]) : null;
  var tokenMultipackNormalizado = unidadMultipack ? (match[1] + 'x' + match[2] + unidadMultipack.unidad) : '';
  if (match && unidadMultipack && _B1_motor_coincideConPatronesTablaB('multipack', tokenMultipackNormalizado, catalogos)) {
    return _B1_motor_crearDetectadoTablaB({
      patron: 'multipack',
      tokenConsumidoOriginal: textoOriginal,
      tokenConsumidoNormalizado: tokenMultipackNormalizado,
      consumeSiguiente: false,
      cantidadPack: parseInt(match[1], 10),
      numero: match[2],
      unidad: unidadMultipack.unidad,
      unidadDetectada: match[3],
      marcaEstimacion: unidadMultipack.marcaEstimacion
    });
  }

  if (combinadoSeparado) {
    match = combinadoSeparado.match(/^(\d+(?:[.,]\d+)?)\s+([a-z]+)$/);
    var unidadSeparada = match ? _B1_motor_normalizarUnidadTablaB(match[2]) : null;
    var combinadoSeparadoNormalizado = unidadSeparada ? (match[1] + ' ' + unidadSeparada.unidad) : '';
    if (match && unidadSeparada && _B1_motor_coincideConPatronesTablaB('separado', combinadoSeparadoNormalizado, catalogos)) {
      return _B1_motor_crearDetectadoTablaB({
        patron: 'separado',
        tokenConsumidoOriginal: textoOriginal + ' ' + siguienteOriginal,
        tokenConsumidoNormalizado: combinadoSeparadoNormalizado,
        consumeSiguiente: true,
        numero: match[1],
        unidad: unidadSeparada.unidad,
        unidadDetectada: match[2],
        marcaEstimacion: unidadSeparada.marcaEstimacion
      });
    }
  }

  if (combinadoPlano) {
    match = combinadoPlano.match(/^(\d+)[x*](\d+(?:[.,]\d+)?)([a-z]+)$/);
    var unidadMultipackSeparada = match ? _B1_motor_normalizarUnidadTablaB(match[3]) : null;
    var combinadoPlanoNormalizado = unidadMultipackSeparada ? (match[1] + 'x' + match[2] + unidadMultipackSeparada.unidad) : '';
    if (match && unidadMultipackSeparada && _B1_motor_coincideConPatronesTablaB('multipack', combinadoPlanoNormalizado, catalogos)) {
      return _B1_motor_crearDetectadoTablaB({
        patron: 'multipack',
        tokenConsumidoOriginal: textoOriginal + ' ' + siguienteOriginal,
        tokenConsumidoNormalizado: combinadoPlanoNormalizado,
        consumeSiguiente: true,
        cantidadPack: parseInt(match[1], 10),
        numero: match[2],
        unidad: unidadMultipackSeparada.unidad,
        unidadDetectada: match[3],
        marcaEstimacion: unidadMultipackSeparada.marcaEstimacion
      });
    }
  }

  var unidadSola = _B1_motor_normalizarUnidadTablaB(tokenPlano);
  if (unidadSola && _B1_motor_coincideConPatronesTablaB('compacto', unidadSola.unidad, catalogos)) {
    return _B1_motor_crearDetectadoTablaB({
      patron: 'unidad_sola',
      tokenConsumidoOriginal: textoOriginal,
      tokenConsumidoNormalizado: unidadSola.unidad,
      consumeSiguiente: false,
      numero: null,
      unidad: unidadSola.unidad,
      unidadDetectada: tokenPlano,
      marcaEstimacion: unidadSola.marcaEstimacion
    });
  }

  return { detectado: false };
}

function _B1_motor_construirMotivoTablaB(item, grupo, esGanadorGrupo) {
  var partes = [];
  var contexto = item.origenContexto || 'neutro';

  if (contexto === 'comercial') {
    partes.push('candidato comercial');
  } else if (contexto === 'nutricional') {
    partes.push('contexto nutricional');
  } else {
    partes.push('contexto neutro');
  }

  if (item.marcaEstimacion) {
    partes.push('marca e de envase');
  }

  if (esGanadorGrupo) {
    partes.push('mayor valor del grupo ' + grupo);
  } else {
    partes.push('mayor valor final candidato producto');
  }

  partes.push('frecuencia solo como desempate');
  return partes.join('; ');
}

function _B1_motor_resolverPesoVolumenReal(tablaBReconocida) {
  var frecuencias = {};
  var grupos = {};
  var ganadoresPorGrupo = [];
  var candidatosBase = [];

  function clave(item) {
    return [
      item.origenContexto || '',
      item.grupoUnidad || '',
      item.totalEstandar != null ? item.totalEstandar : 'null',
      item.cantidadPack != null ? item.cantidadPack : 'null'
    ].join('|');
  }

  function rankPatron(item) {
    if (item.patronDetectado === 'separado') return 4;
    if (item.patronDetectado === 'compacto') return 3;
    if (item.patronDetectado === 'multipack') return 2;
    if (item.patronDetectado === 'unidad_sola') return 0;
    return 1;
  }

  function compararDentroDeGrupo(a, b) {
    if ((b.scoreContextoComercial || 0) !== (a.scoreContextoComercial || 0)) {
      return (b.scoreContextoComercial || 0) - (a.scoreContextoComercial || 0);
    }
    if (a.totalEstandar !== b.totalEstandar) {
      return b.totalEstandar - a.totalEstandar;
    }
    if (!!b.marcaEstimacion !== !!a.marcaEstimacion) {
      return (b.marcaEstimacion ? 1 : 0) - (a.marcaEstimacion ? 1 : 0);
    }
    if (rankPatron(a) !== rankPatron(b)) {
      return rankPatron(b) - rankPatron(a);
    }
    if ((frecuencias[clave(a)] || 0) !== (frecuencias[clave(b)] || 0)) {
      return (frecuencias[clave(b)] || 0) - (frecuencias[clave(a)] || 0);
    }
    return a.ordenDeteccion - b.ordenDeteccion;
  }

  function compararGanadoresDeGrupo(a, b) {
    if ((b.scoreContextoComercial || 0) !== (a.scoreContextoComercial || 0)) {
      return (b.scoreContextoComercial || 0) - (a.scoreContextoComercial || 0);
    }
    if (a.totalEstandar !== b.totalEstandar) {
      return b.totalEstandar - a.totalEstandar;
    }
    if (!!b.marcaEstimacion !== !!a.marcaEstimacion) {
      return (b.marcaEstimacion ? 1 : 0) - (a.marcaEstimacion ? 1 : 0);
    }
    if (rankPatron(a) !== rankPatron(b)) {
      return rankPatron(b) - rankPatron(a);
    }
    if ((frecuencias[clave(a)] || 0) !== (frecuencias[clave(b)] || 0)) {
      return (frecuencias[clave(b)] || 0) - (frecuencias[clave(a)] || 0);
    }
    return a.ordenDeteccion - b.ordenDeteccion;
  }

  tablaBReconocida.forEach(function(item) {
    item.esPesoVolumenReal = false;
    item.esPesoVolumenRealGrupo = false;
    item.motivoSeleccion = null;
    if (item.totalEstandar == null || !item.grupoUnidad) return;

    if (item.origenContexto === 'comercial') {
      candidatosBase.push(item);
      return;
    }
  });

  if (candidatosBase.length === 0) {
    tablaBReconocida.forEach(function(item) {
      if (item.totalEstandar == null || !item.grupoUnidad) return;
      if (item.origenContexto !== 'nutricional') {
        candidatosBase.push(item);
      }
    });
  }

  if (candidatosBase.length === 0) return null;

  candidatosBase.forEach(function(item) {
    var k = clave(item);
    frecuencias[k] = (frecuencias[k] || 0) + 1;
    if (!grupos[item.grupoUnidad]) {
      grupos[item.grupoUnidad] = [];
    }
    grupos[item.grupoUnidad].push(item);
  });

  Object.keys(grupos).forEach(function(grupo) {
    grupos[grupo].sort(compararDentroDeGrupo);
    if (grupos[grupo].length > 0) {
      var ganadorGrupo = grupos[grupo][0];
      ganadorGrupo.esPesoVolumenRealGrupo = true;
      ganadorGrupo.motivoSeleccion = _B1_motor_construirMotivoTablaB(ganadorGrupo, grupo, true);
      ganadoresPorGrupo.push(ganadorGrupo);
    }
  });

  if (ganadoresPorGrupo.length === 0) return null;

  ganadoresPorGrupo.sort(compararGanadoresDeGrupo);
  ganadoresPorGrupo[0].esPesoVolumenReal = true;
  ganadoresPorGrupo[0].motivoSeleccion = _B1_motor_construirMotivoTablaB(ganadoresPorGrupo[0], ganadoresPorGrupo[0].grupoUnidad, false);
  return ganadoresPorGrupo[0];
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PREPROCESO: FRASES MULTITOKEN
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function _B1_motor_detectarFrase(indice, palabrasOCR, catalogos) {
  var tokenNorm = _B1_motor_normalizar(palabrasOCR[indice].texto);
  var candidatos = catalogos.indices.frasesPorPrimerToken[tokenNorm];
  if (!candidatos || candidatos.length === 0) return null;

  for (var f = 0; f < candidatos.length; f++) {
    var frase = candidatos[f];
    var tokens = frase.forma.split(' ');
    if (indice + tokens.length > palabrasOCR.length) continue;

    var coincide = true;
    for (var t = 0; t < tokens.length; t++) {
      var palNorm = _B1_motor_normalizar(palabrasOCR[indice + t].texto);
      if (palNorm !== tokens[t]) { coincide = false; break; }
    }

    if (coincide) {
      return { frase: frase, tokensConsumidos: tokens.length };
    }
  }

  return null;
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PREPROCESO: TOKENS FUSIONADOS Y PARTIDOS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function _B1_motor_intentarParticion(tokenNorm, catalogos) {
  if (tokenNorm.length < 8) return null;
  for (var corte = 3; corte <= tokenNorm.length - 3; corte++) {
    var parte1 = tokenNorm.substring(0, corte);
    var parte2 = tokenNorm.substring(corte);
    var match1 = catalogos.indices.hashExacto[parte1];
    var match2 = catalogos.indices.hashExacto[parte2];
    if (match1 && match1.length > 0 && match2 && match2.length > 0) {
      return { parte1: match1[0], parte2: match2[0] };
    }
  }
  return null;
}

function _B1_motor_intentarFusion(indice, palabrasOCR, catalogos) {
  if (indice >= palabrasOCR.length - 1) return null;
  var t1 = _B1_motor_normalizar(palabrasOCR[indice].texto);
  var t2 = _B1_motor_normalizar(palabrasOCR[indice + 1].texto);
  if (t1.length > 6 || t2.length > 6) return null;
  var combinado = t1 + t2;
  if (combinado.length < 4 || combinado.length > 15) return null;
  var match = catalogos.indices.hashExacto[combinado];
  if (match && match.length > 0) {
    return { forma: match[0], tokensConsumidos: 2 };
  }
  return null;
}

function _B1_motor_ordenarEntradasExactas(entradas) {
  return entradas.slice().sort(function(a, b) {
    if (a.familia !== b.familia) return a.familia < b.familia ? -1 : 1;
    if (a.forma !== b.forma) return a.forma < b.forma ? -1 : 1;
    if (a.idioma !== b.idioma) return a.idioma < b.idioma ? -1 : 1;
    return 0;
  });
}

function _B1_motor_agruparExactosPorFamilia(exacto) {
  var agrupadas = {};
  var familias = [];
  var ordenadas = _B1_motor_ordenarEntradasExactas(exacto);

  ordenadas.forEach(function(entrada) {
    if (!agrupadas[entrada.familia]) {
      agrupadas[entrada.familia] = [];
      familias.push(entrada.familia);
    }
    agrupadas[entrada.familia].push(entrada);
  });

  return {
    familias: familias,
    agrupadas: agrupadas,
    ordenadas: ordenadas
  };
}

function _B1_motor_construirCandidatoExacto(entrada) {
  return {
    forma: entrada.forma,
    familia: entrada.familia,
    idioma: entrada.idioma,
    costeAbsoluto: 0,
    costeNormalizado: 0
  };
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FUNCION PRINCIPAL
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function B1_motorCosteOCR_filtrar(params) {
  var palabrasOCR = params.palabrasOCR || [];
  var catalogos   = params.catalogos;

  var validas              = [];
  var rotasReconocidas     = [];
  var rechazadasDefinitivas= [];
  var tablaBReconocida     = [];
  var observabilidadMotor  = [];
  var refsTablaB           = [];

  var cache = {};
  var consumidos = {}; // indices consumidos por frases/fusion/tabla B separada

  // â”€â”€ PASADA PRINCIPAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  for (var i = 0; i < palabrasOCR.length; i++) {
    if (consumidos[i]) continue;

    var pal = palabrasOCR[i];
    var textoOriginal = pal.texto || '';
    var tokenNorm = _B1_motor_normalizar(textoOriginal);

    // â”€â”€ Vacio â”€â”€
    if (!tokenNorm) {
      rechazadasDefinitivas.push({
        tokenOriginal: textoOriginal, tokenNormalizado: '',
        decision: 'rechazada_definitiva', motivoRechazo: 'sin_match'
      });
      observabilidadMotor.push({
        tokenOriginal: textoOriginal, tokenNormalizado: '',
        candidato1: null, candidato2: null, margenUnicidad: null,
        tipoMatch: null, decision: 'rechazada_definitiva',
        motivoRechazo: 'sin_match', candidatosEvaluados: 0, usoCacheLocal: false
      });
      continue;
    }

    // â”€â”€ Cache â”€â”€
    if (cache[tokenNorm]) {
      var cached = cache[tokenNorm];
      // Clonar resultado con datos de posicion actuales
      var clonado = _B1_motor_clonarResultado(cached, pal);
      _B1_motor_colocarResultado(clonado, validas, rotasReconocidas, rechazadasDefinitivas, tablaBReconocida);
      observabilidadMotor.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        candidato1: cached.candidato1 || null, candidato2: cached.candidato2 || null,
        margenUnicidad: cached.margenUnicidad || null, tipoMatch: cached.tipoMatch || null,
        decision: cached.decision, motivoRechazo: cached.motivoRechazo || null,
        candidatosEvaluados: 0, usoCacheLocal: true
      });
      continue;
    }

    // â”€â”€ PASO 1: ya normalizado â”€â”€

    // â”€â”€ PASO 2: Lookup exacto â”€â”€
    var exacto = catalogos.indices.hashExacto[tokenNorm];
    if (exacto && exacto.length > 0) {
      var exactosAgrupados = _B1_motor_agruparExactosPorFamilia(exacto);
      var familiasUnicas = exactosAgrupados.familias;
      var tieneMultifamilia = exactosAgrupados.ordenadas.some(function(entradaExacta) {
        return !!entradaExacta.multifamilia;
      });

      if (familiasUnicas.length === 1 && !tieneMultifamilia) {
        // Una sola familia exacta: valida, con eleccion determinista
        var entrada = exactosAgrupados.agrupadas[familiasUnicas[0]][0];
        var resultado = {
          decision: 'valida', forma: entrada.forma, familia: entrada.familia,
          idioma: entrada.idioma, tipoMatch: 'exacta'
        };
        cache[tokenNorm] = resultado;
        validas.push({
          tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
          forma: entrada.forma, familia: entrada.familia, idioma: entrada.idioma,
          confidence: pal.confidence, pageIndex: pal.pageIndex,
          blockIndex: pal.blockIndex, wordIndex: pal.wordIndex
        });
        observabilidadMotor.push({
          tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
          candidato1: {forma:entrada.forma, familia:entrada.familia, costeAbsoluto:0, costeNormalizado:0},
          candidato2: null, margenUnicidad: null, tipoMatch: 'exacta',
          decision: 'valida', motivoRechazo: null, candidatosEvaluados: 1, usoCacheLocal: false
        });
      } else {
        // Multiples familias exactas o forma multifamilia: ambigua para Gemini
        var familiasOrdenadas = familiasUnicas.slice().sort();
        var ent1 = exactosAgrupados.agrupadas[familiasOrdenadas[0]][0];
        var ent2 = familiasOrdenadas.length > 1
          ? exactosAgrupados.agrupadas[familiasOrdenadas[1]][0]
          : null;
        var cand1Ex = _B1_motor_construirCandidatoExacto(ent1);
        var cand2Ex = ent2 ? _B1_motor_construirCandidatoExacto(ent2) : null;
        var resAmbEx = {
          decision: 'rota_reconocida', tipoMatch: 'ambigua_para_gemini',
          candidato1: cand1Ex, candidato2: cand2Ex, margenUnicidad: 0
        };
        cache[tokenNorm] = resAmbEx;
        rotasReconocidas.push({
          tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
          candidato1: cand1Ex, candidato2: cand2Ex,
          margenUnicidad: 0, tipoMatch: 'ambigua_para_gemini',
          decision: 'rota_reconocida', confidence: pal.confidence,
          boundingPoly: pal.boundingPoly, pageIndex: pal.pageIndex,
          blockIndex: pal.blockIndex, wordIndex: pal.wordIndex, bloque: pal.bloque
        });
        observabilidadMotor.push({
          tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
          candidato1: cand1Ex, candidato2: cand2Ex,
          margenUnicidad: 0, tipoMatch: 'ambigua_para_gemini',
          decision: 'rota_reconocida', motivoRechazo: null,
          candidatosEvaluados: exacto.length, usoCacheLocal: false,
          familiasExactas: familiasOrdenadas
        });
      }
      continue;
    }

    // â”€â”€ PASO 3: Tabla B â”€â”€
    var sigTexto = (i + 1 < palabrasOCR.length) ? palabrasOCR[i + 1].texto : null;
    var sigNorm  = (i + 1 < palabrasOCR.length) ? _B1_motor_normalizar(palabrasOCR[i + 1].texto) : '';
    var tablaB = _B1_motor_detectarTablaB(tokenNorm, sigNorm, textoOriginal, sigTexto, catalogos);
    if (tablaB.detectado) {
      var contextoTablaB = _B1_motor_extraerContextoTablaB(palabrasOCR, i, !!tablaB.consumeSiguiente);
      var itemTablaB = {
        tokenOriginal: tablaB.tokenConsumidoOriginal,
        tokenNormalizado: tablaB.tokenConsumidoNormalizado,
        patronDetectado: tablaB.patron,
        decision: 'tabla_b_reconocida',
        unidad: tablaB.unidad,
        unidadDetectada: tablaB.unidadDetectada || tablaB.unidad,
        grupoUnidad: tablaB.grupoUnidad,
        tipoProducto: null,
        valorEstandar: tablaB.valorEstandar,
        totalEstandar: tablaB.totalEstandar,
        cantidadPack: tablaB.cantidadPack,
        ordenDeteccion: tablaBReconocida.length,
        marcaEstimacion: !!tablaB.marcaEstimacion,
        origenContexto: 'neutro',
        scoreContextoComercial: 0,
        scoreContextoNutricional: 0,
        motivoContexto: null,
        esPesoVolumenReal: false,
        esPesoVolumenRealGrupo: false,
        motivoSeleccion: null
      };
      var clasificacionTablaB = _B1_motor_clasificarContextoTablaB(itemTablaB, contextoTablaB);
      itemTablaB.tipoProducto = _B1_motor_tipoProductoTablaB(itemTablaB);
      itemTablaB.origenContexto = clasificacionTablaB.origenContexto;
      itemTablaB.scoreContextoComercial = clasificacionTablaB.scoreContextoComercial;
      itemTablaB.scoreContextoNutricional = clasificacionTablaB.scoreContextoNutricional;
      itemTablaB.motivoContexto = clasificacionTablaB.motivoContexto;
      var obsTablaB = {
        tokenOriginal: tablaB.tokenConsumidoOriginal, tokenNormalizado: tablaB.tokenConsumidoNormalizado,
        candidato1: null, candidato2: null, margenUnicidad: null,
        tipoMatch: null, decision: 'tabla_b_reconocida',
        motivoRechazo: null, candidatosEvaluados: 0, usoCacheLocal: false,
        detalleTablaB: {
          patronDetectado: tablaB.patron,
          unidad: tablaB.unidad,
          unidadDetectada: tablaB.unidadDetectada || tablaB.unidad,
          tipoProducto: itemTablaB.tipoProducto,
          valorEstandar: tablaB.valorEstandar,
          totalEstandar: tablaB.totalEstandar,
          cantidadPack: tablaB.cantidadPack,
          marcaEstimacion: !!tablaB.marcaEstimacion,
          origenContexto: itemTablaB.origenContexto,
          scoreContextoComercial: itemTablaB.scoreContextoComercial,
          scoreContextoNutricional: itemTablaB.scoreContextoNutricional,
          motivoContexto: itemTablaB.motivoContexto,
          esPesoVolumenReal: false,
          esPesoVolumenRealGrupo: false
        }
      };
      tablaBReconocida.push(itemTablaB);
      observabilidadMotor.push(obsTablaB);
      refsTablaB.push({ item: itemTablaB, obs: obsTablaB });
      if (tablaB.consumeSiguiente) { consumidos[i + 1] = true; }
      continue;
    }

    // â”€â”€ PASO 3b: Frases multitoken â”€â”€
    var frase = _B1_motor_detectarFrase(i, palabrasOCR, catalogos);
    if (frase) {
      validas.push({
        tokenOriginal: textoOriginal, tokenNormalizado: frase.frase.forma,
        forma: frase.frase.forma, familia: frase.frase.familia, idioma: frase.frase.idioma,
        confidence: pal.confidence, pageIndex: pal.pageIndex,
        blockIndex: pal.blockIndex, wordIndex: pal.wordIndex
      });
      observabilidadMotor.push({
        tokenOriginal: textoOriginal, tokenNormalizado: frase.frase.forma,
        candidato1: {forma:frase.frase.forma, familia:frase.frase.familia, costeAbsoluto:0, costeNormalizado:0},
        candidato2: null, margenUnicidad: null, tipoMatch: 'frase_exacta',
        decision: 'valida', motivoRechazo: null, candidatosEvaluados: 1, usoCacheLocal: false
      });
      for (var fc = 1; fc < frase.tokensConsumidos; fc++) { consumidos[i + fc] = true; }
      continue;
    }

    // â”€â”€ PASO 3c: Fusion de 2 tokens consecutivos â”€â”€
    var fusion = _B1_motor_intentarFusion(i, palabrasOCR, catalogos);
    if (fusion) {
      var fe = fusion.forma;
      validas.push({
        tokenOriginal: textoOriginal + ' ' + palabrasOCR[i+1].texto,
        tokenNormalizado: fe.forma, forma: fe.forma, familia: fe.familia,
        idioma: fe.idioma, confidence: pal.confidence,
        pageIndex: pal.pageIndex, blockIndex: pal.blockIndex, wordIndex: pal.wordIndex
      });
      consumidos[i + 1] = true;
      continue;
    }

    // â”€â”€ PASO 4: Longitud minima â”€â”€
    var soloLetras = _B1_motor_soloLetras(tokenNorm);
    if (soloLetras.length < 3) {
      var resCorto = {
        decision: 'rechazada_definitiva', motivoRechazo: 'longitud_insuficiente'
      };
      cache[tokenNorm] = resCorto;
      rechazadasDefinitivas.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        decision: 'rechazada_definitiva', motivoRechazo: 'longitud_insuficiente'
      });
      observabilidadMotor.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        candidato1: null, candidato2: null, margenUnicidad: null,
        tipoMatch: null, decision: 'rechazada_definitiva',
        motivoRechazo: 'longitud_insuficiente', candidatosEvaluados: 0, usoCacheLocal: false
      });
      continue;
    }

    // â”€â”€ PASO 5: Blacklist â”€â”€
    if (catalogos.blacklist.exactas.has(tokenNorm)) {
      var resBL = {
        decision: 'rechazada_definitiva', motivoRechazo: 'blacklist'
      };
      cache[tokenNorm] = resBL;
      rechazadasDefinitivas.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        decision: 'rechazada_definitiva', motivoRechazo: 'blacklist'
      });
      observabilidadMotor.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        candidato1: null, candidato2: null, margenUnicidad: null,
        tipoMatch: null, decision: 'rechazada_definitiva',
        motivoRechazo: 'blacklist', candidatosEvaluados: 0, usoCacheLocal: false
      });
      continue;
    }

    // â”€â”€ PASO 6-9: Comparar contra todo tablaA.palabras â”€â”€
    var mejor1 = null; // {entrada, costeAbs, costeNorm}
    var mejor2 = null;
    var totalEvaluados = 0;

    var palabrasLexico = catalogos.tablaA.palabras;
    for (var k = 0; k < palabrasLexico.length; k++) {
      var candidato = palabrasLexico[k];
      var umbralMax = _B1_motor_umbral(candidato.len);
      var maxCosteAbs = Math.ceil(umbralMax * Math.max(tokenNorm.length, candidato.len));

      var dist = _B1_motor_distanciaPonderada(tokenNorm, candidato.forma, maxCosteAbs);
      totalEvaluados++;

      if (dist.coste >= _B1_MOTOR_COSTE_INFINITO) continue;
      if (dist.prohibida) continue;

      var costeNorm = dist.coste / Math.max(tokenNorm.length, candidato.len);
      if (costeNorm >= umbralMax) continue;

      var entry = { entrada: candidato, costeAbs: dist.coste, costeNorm: costeNorm };

      if (!mejor1 || costeNorm < mejor1.costeNorm) {
        mejor2 = mejor1;
        mejor1 = entry;
      } else if (!mejor2 || costeNorm < mejor2.costeNorm) {
        mejor2 = entry;
      }
    }

    // â”€â”€ PASO 3d: Particion de token largo (si no hubo match) â”€â”€
    if (!mejor1) {
      var part = _B1_motor_intentarParticion(tokenNorm, catalogos);
      if (part) {
        validas.push({
          tokenOriginal: textoOriginal, tokenNormalizado: part.parte1.forma,
          forma: part.parte1.forma, familia: part.parte1.familia, idioma: part.parte1.idioma,
          confidence: pal.confidence, pageIndex: pal.pageIndex,
          blockIndex: pal.blockIndex, wordIndex: pal.wordIndex
        });
        validas.push({
          tokenOriginal: textoOriginal, tokenNormalizado: part.parte2.forma,
          forma: part.parte2.forma, familia: part.parte2.familia, idioma: part.parte2.idioma,
          confidence: pal.confidence, pageIndex: pal.pageIndex,
          blockIndex: pal.blockIndex, wordIndex: pal.wordIndex
        });
        observabilidadMotor.push({
          tokenOriginal: textoOriginal, tokenNormalizado: part.parte1.forma + ' ' + part.parte2.forma,
          candidato1: {forma:part.parte1.forma, familia:part.parte1.familia, costeAbsoluto:0, costeNormalizado:0},
          candidato2: {forma:part.parte2.forma, familia:part.parte2.familia, costeAbsoluto:0, costeNormalizado:0},
          margenUnicidad: null, tipoMatch: 'particion_doble_exacta',
          decision: 'valida', motivoRechazo: null, candidatosEvaluados: 2, usoCacheLocal: false
        });
        continue;
      }
    }

    // Sin candidato valido
    if (!mejor1) {
      var resSM = {
        decision: 'rechazada_definitiva', motivoRechazo: 'sin_match'
      };
      cache[tokenNorm] = resSM;
      rechazadasDefinitivas.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        decision: 'rechazada_definitiva', motivoRechazo: 'sin_match'
      });
      observabilidadMotor.push({
        tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
        candidato1: null, candidato2: null, margenUnicidad: null,
        tipoMatch: null, decision: 'rechazada_definitiva',
        motivoRechazo: 'sin_match', candidatosEvaluados: totalEvaluados, usoCacheLocal: false
      });
      continue;
    }

    // â”€â”€ Decision por familia â”€â”€
    var cand1 = {
      forma: mejor1.entrada.forma, familia: mejor1.entrada.familia,
      idioma: mejor1.entrada.idioma,
      costeAbsoluto: mejor1.costeAbs, costeNormalizado: mejor1.costeNorm
    };
    var cand2 = mejor2 ? {
      forma: mejor2.entrada.forma, familia: mejor2.entrada.familia,
      idioma: mejor2.entrada.idioma,
      costeAbsoluto: mejor2.costeAbs, costeNormalizado: mejor2.costeNorm
    } : null;

    var margenUnicidad = (cand2) ? (cand2.costeNormalizado - cand1.costeNormalizado) : null;
    var tipoMatch = 'unica';

    // Multifamilia
    if (mejor1.entrada.multifamilia) {
      tipoMatch = 'ambigua_para_gemini';
    }
    // Dos familias distintas con margen insuficiente
    else if (cand2 && cand1.familia !== cand2.familia && margenUnicidad < 0.15) {
      tipoMatch = 'ambigua_para_gemini';
    }

    var resMotor = {
      decision: 'rota_reconocida', tipoMatch: tipoMatch,
      candidato1: cand1, candidato2: cand2, margenUnicidad: margenUnicidad
    };
    cache[tokenNorm] = resMotor;

    rotasReconocidas.push({
      tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
      candidato1: cand1, candidato2: cand2,
      margenUnicidad: margenUnicidad,
      tipoMatch: tipoMatch, decision: 'rota_reconocida',
      confidence: pal.confidence, boundingPoly: pal.boundingPoly,
      pageIndex: pal.pageIndex, blockIndex: pal.blockIndex,
      wordIndex: pal.wordIndex, bloque: pal.bloque
    });

    observabilidadMotor.push({
      tokenOriginal: textoOriginal, tokenNormalizado: tokenNorm,
      candidato1: cand1, candidato2: cand2,
      margenUnicidad: margenUnicidad, tipoMatch: tipoMatch,
      decision: 'rota_reconocida', motivoRechazo: null,
      candidatosEvaluados: totalEvaluados, usoCacheLocal: false
    });
  }

  var pesoVolumenReal = _B1_motor_resolverPesoVolumenReal(tablaBReconocida);
  for (var tb = 0; tb < refsTablaB.length; tb++) {
    refsTablaB[tb].obs.detalleTablaB.esPesoVolumenReal = refsTablaB[tb].item.esPesoVolumenReal;
    refsTablaB[tb].obs.detalleTablaB.esPesoVolumenRealGrupo = refsTablaB[tb].item.esPesoVolumenRealGrupo;
    refsTablaB[tb].obs.detalleTablaB.motivoSeleccion = refsTablaB[tb].item.motivoSeleccion;
  }

  return {
    validas:               validas,
    rotasReconocidas:      rotasReconocidas,
    rechazadasDefinitivas: rechazadasDefinitivas,
    tablaBReconocida:      tablaBReconocida,
    observabilidadMotor:   observabilidadMotor
  };
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HELPERS INTERNOS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function _B1_motor_clonarResultado(cached, pal) {
  return {
    decision: cached.decision,
    forma: cached.forma || null,
    familia: cached.familia || null,
    idioma: cached.idioma || null,
    tipoMatch: cached.tipoMatch || null,
    candidato1: cached.candidato1 || null,
    candidato2: cached.candidato2 || null,
    margenUnicidad: cached.margenUnicidad || null,
    motivoRechazo: cached.motivoRechazo || null,
    tokenOriginal: pal.texto,
    tokenNormalizado: _B1_motor_normalizar(pal.texto),
    confidence: pal.confidence,
    boundingPoly: pal.boundingPoly,
    pageIndex: pal.pageIndex,
    blockIndex: pal.blockIndex,
    wordIndex: pal.wordIndex,
    bloque: pal.bloque,
    patronDetectado: cached.patronDetectado || null
  };
}

function _B1_motor_colocarResultado(res, validas, rotasReconocidas, rechazadasDefinitivas, tablaBReconocida) {
  if (res.decision === 'valida') {
    validas.push({
      tokenOriginal: res.tokenOriginal, tokenNormalizado: res.tokenNormalizado,
      forma: res.forma, familia: res.familia, idioma: res.idioma,
      confidence: res.confidence, pageIndex: res.pageIndex,
      blockIndex: res.blockIndex, wordIndex: res.wordIndex
    });
  } else if (res.decision === 'rota_reconocida') {
    rotasReconocidas.push({
      tokenOriginal: res.tokenOriginal, tokenNormalizado: res.tokenNormalizado,
      candidato1: res.candidato1, candidato2: res.candidato2,
      margenUnicidad: res.margenUnicidad, tipoMatch: res.tipoMatch,
      decision: 'rota_reconocida', confidence: res.confidence,
      boundingPoly: res.boundingPoly, pageIndex: res.pageIndex,
      blockIndex: res.blockIndex, wordIndex: res.wordIndex, bloque: res.bloque
    });
  } else if (res.decision === 'rechazada_definitiva') {
    rechazadasDefinitivas.push({
      tokenOriginal: res.tokenOriginal, tokenNormalizado: res.tokenNormalizado,
      decision: 'rechazada_definitiva', motivoRechazo: res.motivoRechazo
    });
  } else if (res.decision === 'tabla_b_reconocida') {
    tablaBReconocida.push({
      tokenOriginal: res.tokenOriginal, tokenNormalizado: res.tokenNormalizado,
      patronDetectado: res.patronDetectado, decision: 'tabla_b_reconocida'
    });
  }
}

;/* END ../../backend/boxer1/backend/operativa/B1_motor_coste_ocr.js */

;/* BEGIN ../../backend/boxer1/backend/operativa/B1_slots_empaquetador.js */
/**
 * =====================================================================
 * BOXER 1 v2 Â· SLOTS EMPAQUETADOR
 * =====================================================================
 * Empaqueta rotasReconocidas para Gemini:
 * - slotId
 * - contexto 3+3 intrabloque
 * - ROI base64 jpeg
 * - auditoria de salida
 * =====================================================================
 */

var _B1_EMP_CLEANUP_SEQ = 0;
var _B1_EMP_CLEANUP_TIMEOUTS = Object.create(null);

function _B1_emp_generarCleanupId(traceId) {
  _B1_EMP_CLEANUP_SEQ += 1;
  return String(traceId || 'b1_cleanup') + '_' + _B1_EMP_CLEANUP_SEQ;
}

function _B1_emp_liberarCanvasTemporal(canvas) {
  if (!canvas) return;

  try {
    if (typeof canvas.getContext === 'function') {
      var ctx = canvas.getContext('2d');
      if (ctx && typeof ctx.clearRect === 'function') {
        ctx.clearRect(0, 0, canvas.width || 0, canvas.height || 0);
      }
    }
  } catch (_) {}

  try {
    if (typeof canvas.width === 'number') canvas.width = 1;
    if (typeof canvas.height === 'number') canvas.height = 1;
  } catch (_) {}
}

function _B1_emp_liberarSlotsTemporales(slots) {
  if (!Array.isArray(slots)) return;

  for (var i = 0; i < slots.length; i++) {
    var slot = slots[i];
    if (!slot || typeof slot !== 'object') continue;
    slot.roiBase64 = null;
    slot.boundingPoly = null;
    slot.contexto = '';
    slot.candidatoMotor = null;
    slot.candidatoMotor2 = null;
    slot.familiasCandidatas = [];
  }
}

function B1_programarLimpiezaTemporales(params) {
  params = params || {};

  var slots = Array.isArray(params.slots) ? params.slots : [];
  var canvas = params.canvas || null;
  var tieneSlotsConROI = slots.some(function(slot) {
    return !!(slot && slot.roiBase64);
  });

  if (!canvas && !tieneSlotsConROI) {
    return null;
  }

  var delayMs = typeof params.delayMs === 'number' && params.delayMs >= 0
    ? Math.round(params.delayMs)
    : ((typeof B1_CONFIG !== 'undefined' && B1_CONFIG && B1_CONFIG.POST_ANALYSIS_CLEANUP_DELAY_MS) || 3000);

  var cleanupId = _B1_emp_generarCleanupId(params.traceId);
  _B1_EMP_CLEANUP_TIMEOUTS[cleanupId] = setTimeout(function() {
    try {
      _B1_emp_liberarSlotsTemporales(slots);
      _B1_emp_liberarCanvasTemporal(canvas);
    } finally {
      delete _B1_EMP_CLEANUP_TIMEOUTS[cleanupId];
    }
  }, delayMs);

  return cleanupId;
}

function _B1_emp_extraerTextoPalabra(palabra) {
  if (typeof palabra === 'string') return palabra.trim();
  if (!palabra || typeof palabra !== 'object') return '';
  return String(
    palabra.texto != null ? palabra.texto :
    palabra.text != null ? palabra.text :
    palabra.valor != null ? palabra.valor :
    ''
  ).trim();
}

function _B1_emp_resolverPosicionPalabra(bloque, wordIndex, textoOriginal) {
  var palabras = bloque && Array.isArray(bloque.palabras) ? bloque.palabras : [];
  var i;

  if (typeof wordIndex === 'number') {
    for (i = 0; i < palabras.length; i++) {
      if (palabras[i] && palabras[i].wordIndex === wordIndex) return i;
    }
    if (wordIndex >= 0 && wordIndex < palabras.length) return wordIndex;
  }

  if (textoOriginal) {
    for (i = 0; i < palabras.length; i++) {
      if (_B1_emp_extraerTextoPalabra(palabras[i]) === textoOriginal) return i;
    }
  }

  return -1;
}

function _B1_emp_construirContexto(bloque, wordIndex, slotId, textoOriginal) {
  var marker = '[[' + slotId + '|' + String(textoOriginal || '').trim() + ']]';
  var palabras = bloque && Array.isArray(bloque.palabras) ? bloque.palabras : [];
  var ventana = (typeof B1_CONFIG !== 'undefined' && B1_CONFIG && B1_CONFIG.VENTANA_CONTEXTO) || 3;
  var posicion = _B1_emp_resolverPosicionPalabra(bloque, wordIndex, textoOriginal);

  if (!palabras.length || posicion < 0) {
    return marker;
  }

  var inicio = Math.max(0, posicion - ventana);
  var fin = Math.min(palabras.length - 1, posicion + ventana);
  var partes = [];

  for (var i = inicio; i <= fin; i++) {
    if (i === posicion) {
      partes.push(marker);
    } else {
      var texto = _B1_emp_extraerTextoPalabra(palabras[i]);
      if (texto) partes.push(texto);
    }
  }

  return partes.join(' ').replace(/\s+/g, ' ').trim() || marker;
}

function _B1_emp_extraerVertices(canvas, boundingPoly) {
  if (!canvas || !boundingPoly) return [];

  var raw = [];
  if (Array.isArray(boundingPoly)) raw = boundingPoly;
  else if (Array.isArray(boundingPoly.vertices)) raw = boundingPoly.vertices;
  else if (Array.isArray(boundingPoly.normalizedVertices)) raw = boundingPoly.normalizedVertices;

  var vertices = [];
  for (var i = 0; i < raw.length; i++) {
    var punto = raw[i] || {};
    var x = punto.x;
    var y = punto.y;

    if ((x == null || y == null) && punto.vertex) {
      x = punto.vertex.x;
      y = punto.vertex.y;
    }

    if (typeof x !== 'number' || typeof y !== 'number') continue;

    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      vertices.push({ x: x * canvas.width, y: y * canvas.height });
    } else {
      vertices.push({ x: x, y: y });
    }
  }

  return vertices;
}

function _B1_emp_crearCanvasTemporal(width, height) {
  if (typeof document !== 'undefined' && document && typeof document.createElement === 'function') {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  return null;
}

function _B1_emp_calcularEscalaZoomROI(w, h) {
  var factorBase = 2;
  var minLado = 120;
  var maxLado = 448;
  var ladoMenor = Math.max(1, Math.min(w, h));
  var factor = Math.max(factorBase, minLado / ladoMenor);
  factor = Math.min(factor, maxLado / Math.max(1, w), maxLado / Math.max(1, h));
  return Math.max(1, factor);
}

function _B1_emp_recortarROI(canvas, boundingPoly) {
  try {
    if (!canvas || typeof canvas.width !== 'number' || typeof canvas.height !== 'number') return null;
    if (!boundingPoly) return null;

    var vertices = _B1_emp_extraerVertices(canvas, boundingPoly);
    if (!vertices.length) return null;

    var minX = Number.POSITIVE_INFINITY;
    var minY = Number.POSITIVE_INFINITY;
    var maxX = Number.NEGATIVE_INFINITY;
    var maxY = Number.NEGATIVE_INFINITY;

    for (var i = 0; i < vertices.length; i++) {
      minX = Math.min(minX, vertices[i].x);
      minY = Math.min(minY, vertices[i].y);
      maxX = Math.max(maxX, vertices[i].x);
      maxY = Math.max(maxY, vertices[i].y);
    }

    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return null;

    var margin = (typeof B1_CONFIG !== 'undefined' && B1_CONFIG && B1_CONFIG.ROI_MARGIN_PX) || 15;
    var x = Math.max(0, Math.floor(minX - margin));
    var y = Math.max(0, Math.floor(minY - margin));
    var w = Math.min(canvas.width - x, Math.ceil((maxX - minX) + (margin * 2)));
    var h = Math.min(canvas.height - y, Math.ceil((maxY - minY) + (margin * 2)));

    if (w < 5 || h < 5) return null;

    var factor = _B1_emp_calcularEscalaZoomROI(w, h);
    var outW = Math.max(1, Math.round(w * factor));
    var outH = Math.max(1, Math.round(h * factor));
    var cropCanvas = _B1_emp_crearCanvasTemporal(outW, outH);
    if (!cropCanvas || typeof cropCanvas.getContext !== 'function') return null;

    var ctx = cropCanvas.getContext('2d');
    if (!ctx || typeof ctx.drawImage !== 'function') return null;

    if (typeof ctx.imageSmoothingEnabled === 'boolean') {
      ctx.imageSmoothingEnabled = false;
    }

    ctx.drawImage(canvas, x, y, w, h, 0, 0, outW, outH);

    if (typeof cropCanvas.toDataURL === 'function') {
      return cropCanvas.toDataURL('image/jpeg', 0.85);
    }

    return null;
  } catch (_) {
    return null;
  }
}

function _B1_emp_crearAuditoria(slots, totalRotasRecibidas) {
  var totalAmbiguas = 0;
  var totalUnicas = 0;
  var totalConROI = 0;
  var totalSinROI = 0;
  var slotIds = [];

  for (var i = 0; i < slots.length; i++) {
    var slot = slots[i];
    slotIds.push(slot.slotId);
    if (slot.tipoMatch === 'ambigua_para_gemini') totalAmbiguas += 1;
    else totalUnicas += 1;
    if (slot.roiBase64) totalConROI += 1;
    else totalSinROI += 1;
  }

  return {
    totalRotasRecibidas: totalRotasRecibidas,
    totalSlots: slots.length,
    totalAmbiguas: totalAmbiguas,
    totalUnicas: totalUnicas,
    totalConROI: totalConROI,
    totalSinROI: totalSinROI,
    slotIds: slotIds
  };
}

function _B1_emp_extraerFamiliasCandidatas(rota) {
  var familias = [];

  function pushFamilia(candidato) {
    if (!candidato || !candidato.familia) return;
    if (familias.indexOf(candidato.familia) === -1) {
      familias.push(candidato.familia);
    }
  }

  pushFamilia(rota && rota.candidato1);
  pushFamilia(rota && rota.candidato2);

  return familias;
}

function B1_empaquetarParaRescate(params) {
  params = params || {};

  var rotasReconocidas = Array.isArray(params.rotasReconocidas) ? params.rotasReconocidas : [];
  var canvas = params.canvas || null;
  var slots = [];
  var slotCounter = 0;

  for (var i = 0; i < rotasReconocidas.length; i++) {
    var rota = rotasReconocidas[i];
    if (!rota || typeof rota !== 'object') continue;

    slotCounter += 1;
    var slotId = 'B' + slotCounter;
    var textoOriginal = String(rota.tokenOriginal || '').trim();

    slots.push({
      slotId: slotId,
      textoOriginal: textoOriginal,
      confidence: rota.confidence != null ? rota.confidence : null,
      contexto: _B1_emp_construirContexto(rota.bloque, rota.wordIndex, slotId, textoOriginal),
      roiBase64: _B1_emp_recortarROI(canvas, rota.boundingPoly),
      boundingPoly: rota.boundingPoly || null,
      pageIndex: typeof rota.pageIndex === 'number' ? rota.pageIndex : null,
      blockIndex: typeof rota.blockIndex === 'number' ? rota.blockIndex : null,
      wordIndex: typeof rota.wordIndex === 'number' ? rota.wordIndex : null,
      origenDeteccion: 'motor_coste_ocr',
      candidatoMotor: rota.candidato1 || null,
      candidatoMotor2: rota.candidato2 || null,
      familiasCandidatas: _B1_emp_extraerFamiliasCandidatas(rota),
      tipoMatch: rota.tipoMatch || 'unica'
    });
  }

  return {
    totalRotasRecibidas: rotasReconocidas.length,
    totalSlots: slots.length,
    slots: slots,
    auditoria: _B1_emp_crearAuditoria(slots, rotasReconocidas.length)
  };
}

;/* END ../../backend/boxer1/backend/operativa/B1_slots_empaquetador.js */

;/* BEGIN ../../backend/boxer1/backend/operativa/B1_rescate.js */
/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * Boxer1_Core · PASO 6 · RESCATE AVANZADO
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * Adaptado al contrato real de Trastienda para Gemini.
 *
 * CAMBIO v2: B1_construirPromptRescate actualizado a los 3 estados
 *   corregida / ya_valida / no_resuelta
 * El resto del archivo no se toca.
 */

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FUNCIONES AUXILIARES DE TIMING
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function _B1_nowMs() {
  return Date.now();
}

function _B1_roundMs(ms) {
  return Math.round(ms);
}

function _B1_extraerTiemposInternosResultado(respuesta) {
  if (!respuesta || !respuesta.meta || !respuesta.meta.tiemposInternos) return null;
  return respuesta.meta.tiemposInternos;
}

function _B1_estimarExternoNoDesglosado(fetchTotal, tiemposInternos) {
  if (!tiemposInternos || typeof tiemposInternos.t_total_trastienda_ms !== 'number') return null;
  if (typeof fetchTotal !== 'number') return null;
  return Math.max(0, fetchTotal - tiemposInternos.t_total_trastienda_ms);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// RESCATE AVANZADO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const B1_RESCUE_ESTIMATED_MS = 3000;

function _B1_sumarObjetoNumerico(destino, origen) {
  if (!origen || typeof origen !== 'object') return destino;
  const out = destino || {};
  Object.keys(origen).forEach(key => {
    const valor = origen[key];
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      out[key] = (out[key] || 0) + valor;
    }
  });
  return out;
}

function _B1_slot_describirCandidato(candidato) {
  if (!candidato || typeof candidato !== 'object') return '';

  const partes = [];
  if (candidato.forma) partes.push(`forma="${candidato.forma}"`);
  if (candidato.familia) partes.push(`familia="${candidato.familia}"`);
  if (candidato.idioma) partes.push(`idioma="${candidato.idioma}"`);

  return partes.join(', ');
}

function _B1_normalizarImagenBase64(roiBase64) {
  if (typeof roiBase64 !== 'string') return null;
  var texto = roiBase64.trim();
  if (!texto) return null;

  var matchDataUrl = texto.match(/^data:([^;]+);base64,(.+)$/i);
  if (matchDataUrl) {
    return {
      mimeType: (matchDataUrl[1] || 'image/jpeg').toLowerCase(),
      imageBase64: String(matchDataUrl[2] || '').replace(/\s+/g, '')
    };
  }

  return {
    mimeType: 'image/jpeg',
    imageBase64: texto.replace(/\s+/g, '')
  };
}

function _B1_debeAdjuntarOcrCompleto(slots) {
  if (!Array.isArray(slots) || slots.length === 0) return false;

  for (var i = 0; i < slots.length; i++) {
    var slot = slots[i];
    if (!slot) return true;
    if (slot.tipoMatch === 'ambigua_para_gemini') return true;
    if (!slot.roiBase64) return true;
  }

  return false;
}

function _B1_construirPayloadRescateIA(textoBase, slots) {
  var listaSlots = Array.isArray(slots) ? slots : [];
  var prompt = B1_construirPromptRescate(listaSlots);
  var ocrTextoNormalizado = String(textoBase || '').trim();
  var incluirOcrCompleto = _B1_debeAdjuntarOcrCompleto(listaSlots);
  var fragmentosImagen = listaSlots
    .map(function(slot) { return _B1_normalizarImagenBase64(slot && slot.roiBase64); })
    .filter(function(fragmento) { return fragmento && fragmento.imageBase64; });

  return {
    prompt: prompt,
    ocrTexto: incluirOcrCompleto ? ocrTextoNormalizado : '',
    fragmentosImagen: fragmentosImagen
  };
}

function _B1_clonarSlotParaBroker(slot) {
  if (!slot || typeof slot !== 'object') return null;

  return {
    slotId: slot.slotId || null,
    textoOriginal: slot.textoOriginal || '',
    contexto: slot.contexto || '',
    tipoMatch: slot.tipoMatch || null,
    candidatoMotor: slot.candidatoMotor || null,
    candidatoMotor2: slot.candidatoMotor2 || null,
    familiasCandidatas: Array.isArray(slot.familiasCandidatas) ? slot.familiasCandidatas.slice() : [],
    roiBase64: slot.roiBase64 || null
  };
}

function B1_construirTareaIARescate(loteRescate, textoBase, traceId, analysisId) {
  var lote = loteRescate || {};
  var slots = Array.isArray(lote.slots) ? lote.slots : [];
  var tipoTarea = (
    typeof B1_FASE5_TIPO_TAREA !== 'undefined' &&
    B1_FASE5_TIPO_TAREA &&
    B1_FASE5_TIPO_TAREA.RESCATE_OCR
  ) ? B1_FASE5_TIPO_TAREA.RESCATE_OCR : 'B1_RESCATE_OCR_V1';
  var taskId = (typeof B1_fase5TaskIdRescate === 'function')
    ? B1_fase5TaskIdRescate()
    : 'b1_r01';

  return {
    taskId: taskId,
    traceId: traceId || null,
    analysisId: analysisId || null,
    moduloSolicitante: B1_CONFIG.MODULE_NAME,
    tipoTarea: tipoTarea,
    schemaId: tipoTarea,
    payload: {
      textoBase: String(textoBase || ''),
      slots: slots.map(_B1_clonarSlotParaBroker).filter(Boolean)
    },
    respuestaEsperada: {
      correcciones: [],
      simetria: 'exacta'
    }
  };
}

function B1_normalizarSubrespuestaIARescate(subrespuestaIA) {
  if (!subrespuestaIA || typeof subrespuestaIA !== 'object') {
    return {
      ok: false,
      reason: 'Subrespuesta IA vacia o no valida.'
    };
  }

  var data = (subrespuestaIA.data && typeof subrespuestaIA.data === 'object')
    ? subrespuestaIA.data
    : subrespuestaIA;
  var correcciones = Array.isArray(data.correcciones) ? data.correcciones : null;

  if (!correcciones) {
    return {
      ok: false,
      reason: 'La subrespuesta IA no trae correcciones.'
    };
  }

  var tiempos = null;
  if (data.tiempos && typeof data.tiempos === 'object') {
    tiempos = data.tiempos;
  } else if (typeof data.elapsedMs === 'number') {
    tiempos = {
      broker: {
        t_total_broker_ms: Math.max(0, Math.round(data.elapsedMs))
      }
    };
  }

  return {
    ok: true,
    correcciones: correcciones,
    tiempos: tiempos,
    raw: data
  };
}

/**
 * Construye el prompt para Gemini.
 * CAMBIADO v2: estados corregida / ya_valida / no_resuelta
 * Este prompt es la fuente base. B1_hotfix_71631.js lo sobreescribe en runtime
 * con la misma lógica de estados, por lo que ambas versiones son coherentes.
 */
function _B1_construirPromptRescate_legacy_unused(slots) {
  const instrucciones = [
    'REPARADOR OCR DE ETIQUETAS ALIMENTARIAS · BOXER 1',
    '',
    'CONTEXTO: Etiquetas alimentarias. Seguridad alimentaria. Supermercados.',
    '',
    'REGLA CRÍTICA:',
    '- Debes devolver UNA fila por cada slot recibido.',
    '- No se permite omitir slots.',
    '- No se permite texto extra fuera del JSON.',
    '',
    'ESTADOS PERMITIDOS POR SLOT (exactamente uno de los tres):',
    '- corregida    → el OCR estaba roto y propones una corrección concreta.',
    '- ya_valida    → el texto ya era correcto para la aplicación. No necesitaba cambio.',
    '- no_resuelta  -> no puedes corregir con seguridad. No inventes.',
    '',
    'REGLAS DE SALIDA:',
    '- Si estado = corregida,   solucion es obligatoria y diferente al original.',
    '- Si estado = ya_valida,   solucion debe ser igual al texto original.',
    '- Si estado = no_resuelta, solucion debe ir vacía y motivo debe ser corto.',
    '',
    'REGLAS ESPECIALES:',
    '',
    '1. AMBIGÜEDAD ENTRE ALÉRGENOS:',
    '   Si dos alérgenos tienen sentido (maíz/maní, soja/soya):',
    '   -> Usa imagen para desempatar.',
    '   -> Si imagen borrosa -> estado="no_resuelta"',
    '   PROHIBIDO elegir al azar.',
    '',
    '2. CIFRAS Y PESOS:',
    '   Si número roto y la imagen NO permite ver 100% claro:',
    '   -> estado="no_resuelta"',
    '   NO aproximes. El peso es dato legal.',
    '',
    '3. VACÍO ILEGIBLE:',
    '   Si imagen es borrón/destello blanco:',
    '   -> estado="no_resuelta"',
    '   Preferible error marcado que invención.',
    '',
    '4. TEXTO YA CORRECTO:',
    '   Si el texto del slot ya está bien leído, usa ya_valida — nunca lo marques como error.',
    '',
    '5. NO TRADUCIR:',
    '   Conserva idioma original del texto.',
    '',
    'FORMATO SALIDA (JSON PURO — SIN MARKDOWN):',
    '{',
    '  "correcciones": [',
    '    {"slotId":"B1", "estado":"corregida",   "solucion":"harina"},',
    '    {"slotId":"B2", "estado":"ya_valida",   "solucion":"egg"},',
    '    {"slotId":"B3", "estado":"no_resuelta", "solucion":"", "motivo":"imagen_ilegible"}',
    '  ],',
    '  "simetria":"exacta"',
    '}',
    '',
    'SLOTS:'
  ];

  slots.forEach(slot => {
    instrucciones.push('');
    instrucciones.push(`--- ${slot.slotId} ---`);
    instrucciones.push(`OCR: "${slot.textoOriginal}"`);
    instrucciones.push(`Contexto: ${slot.contexto}`);
    if (slot.roiBase64) {
      instrucciones.push('[Imagen ROI adjunta — validación visual obligatoria]');
    }
  });

  instrucciones.push('');
  instrucciones.push('RESPONDE SOLO JSON. SIN CHARLA.');

  return instrucciones.join('\n');
}

function B1_construirPromptRescate(slots) {
  const instrucciones = [
    'REPARADOR OCR DE ETIQUETAS ALIMENTARIAS · BOXER 1',
    '',
    'CONTEXTO: Etiquetas alimentarias. Seguridad alimentaria. Supermercados.',
    '',
    'REGLA CRITICA:',
    '- Debes devolver UNA fila por cada slot recibido.',
    '- No se permite omitir slots.',
    '- No se permite texto extra fuera del JSON.',
    '- Debes devolver UN SOLO objeto JSON valido para JSON.parse en JavaScript.',
    '- No uses markdown, comillas simples, comentarios, prefacios, saludos ni explicaciones.',
    '',
    'ESTADOS PERMITIDOS POR SLOT (exactamente uno de los tres):',
    '- corregida    -> el OCR estaba roto y propones una correccion concreta.',
    '- ya_valida    -> el texto ya era correcto para la aplicacion. No necesitaba cambio.',
    '- no_resuelta  -> no puedes corregir con seguridad. No inventes.',
    '',
    'REGLAS DE SALIDA:',
    '- Si estado = corregida,   solucion es obligatoria y diferente al original.',
    '- Si estado = ya_valida,   solucion debe ser igual al texto original.',
    '- Si estado = no_resuelta, solucion debe ir vacia y motivo debe ser corto.',
    '',
    'REGLAS ESPECIALES:',
    '',
    '1. AMBIGUEDAD ENTRE ALERGENOS:',
    '   Si dos alergenos compiten, usa contexto + ROI ampliada para desempatar.',
    '   Si el slot trae candidatas del motor, debes elegir entre esas candidatas.',
    '   Si foto + contexto no permiten decidir con seguridad, usa estado="no_resuelta".',
    '   PROHIBIDO elegir al azar o inventar una tercera opcion.',
    '',
    '2. CIFRAS Y PESOS:',
    '   Si numero roto y la imagen NO permite ver 100% claro:',
    '   -> estado="no_resuelta"',
    '   NO aproximes. El peso es dato legal.',
    '',
    '3. VACIO ILEGIBLE:',
    '   Si imagen es borron/destello blanco:',
    '   -> estado="no_resuelta"',
    '   Preferible error marcado que invencion.',
    '',
    '4. TEXTO YA CORRECTO:',
    '   Si el texto del slot ya esta bien leido, usa ya_valida.',
    '',
    '5. NO TRADUCIR:',
    '   Conserva idioma original del texto.',
    '',
    '6. VOCABULARIO CERRADO DEL MOTOR:',
    '   Si el slot trae candidatas del motor, tu solucion debe salir de esas candidatas.',
    '   Si el motor trae una unica candidata, solo confirma esa o marca no_resuelta.',
    '   No inventes palabras fuera del vocabulario dado por el motor.',
    '',
    '7. IMAGENES ADJUNTAS:',
    '   Cada ROI adjunta es un zoom del slot correspondiente.',
    '   Las ROIs se adjuntan en el mismo orden en que aparecen los slots con imagen.',
    '',
    'FORMATO SALIDA (JSON PURO - SIN MARKDOWN):',
    '{',
    '  "correcciones": [',
    '    {"slotId":"B1", "estado":"corregida",   "solucion":"harina"},',
    '    {"slotId":"B2", "estado":"ya_valida",   "solucion":"egg"},',
    '    {"slotId":"B3", "estado":"no_resuelta", "solucion":"", "motivo":"imagen_ilegible"}',
    '  ],',
    '  "simetria":"exacta"',
    '}',
    '',
    'SLOTS:'
  ];

  slots.forEach(slot => {
    instrucciones.push('');
    instrucciones.push(`--- ${slot.slotId} ---`);
    instrucciones.push(`OCR: "${slot.textoOriginal}"`);
    instrucciones.push(`Contexto 3+3: ${slot.contexto}`);
    instrucciones.push(`Tipo motor: ${slot.tipoMatch || 'unica'}`);
    if (slot.candidatoMotor) {
      instrucciones.push(`Candidata 1 motor: ${_B1_slot_describirCandidato(slot.candidatoMotor)}`);
    }
    if (slot.candidatoMotor2) {
      instrucciones.push(`Candidata 2 motor: ${_B1_slot_describirCandidato(slot.candidatoMotor2)}`);
    }
    if (Array.isArray(slot.familiasCandidatas) && slot.familiasCandidatas.length > 0) {
      instrucciones.push(`Familias candidatas: ${slot.familiasCandidatas.join(', ')}`);
    }
    if (slot.tipoMatch === 'ambigua_para_gemini') {
      instrucciones.push('Instruccion ambigua: elige exactamente una de las candidatas del motor o marca no_resuelta.');
    }
    if (slot.roiBase64) {
      instrucciones.push('[Imagen ROI ampliada adjunta - validacion visual obligatoria]');
    }
  });

  instrucciones.push('');
  instrucciones.push('RESPONDE SOLO UN OBJETO JSON VALIDO PARA JAVASCRIPT. SIN CHARLA. SIN SALUDO. SIN MARKDOWN.');

  return instrucciones.join('\n');
}

async function B1_enviarRescateGemini(textoBase, slots, sessionToken, urlTrastienda, timeoutOverrideMs) {
  const tInicio = _B1_nowMs();
  const tPayloadInicio = _B1_nowMs();
  const payloadIA = _B1_construirPayloadRescateIA(textoBase, slots);

  const body = {
    moduloDestino: 'TRASTIENDA',
    accion: 'procesarGemini',
    sessionToken: sessionToken || '',
    payload: {
      ocrTexto: payloadIA.ocrTexto,
      contexto: payloadIA.prompt,
      fragmentosImagen: payloadIA.fragmentosImagen,
      sessionToken: sessionToken || '',
      token: sessionToken || ''
    }
  };

  const bodyString = JSON.stringify(body);
  const tBuildPayload = _B1_roundMs(_B1_nowMs() - tPayloadInicio);

  const tFetchInicio = _B1_nowMs();
  const timeoutMs = (typeof timeoutOverrideMs === 'number' && timeoutOverrideMs > 0)
    ? Math.round(timeoutOverrideMs)
    : (((typeof B1_CONFIG !== 'undefined' && B1_CONFIG && B1_CONFIG.GEMINI_FETCH_TIMEOUT_MS) || 8000));
  const controller = (typeof AbortController === 'function') ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  let response;
  let rawText = '';
  try {
    response = await fetch(urlTrastienda, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyString,
      signal: controller ? controller.signal : undefined
    });
    rawText = await response.text();
  } catch (fetchErr) {
    if (controller && fetchErr && fetchErr.name === 'AbortError') {
      throw B1_crearErrorUpstream({
        message: 'Rescate Gemini timeout tras ' + timeoutMs + 'ms',
        upstreamCode: 'HTTP_TIMEOUT',
        upstreamModule: B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
        raw: null
      });
    }
    throw fetchErr;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  const tFetchTotal = _B1_roundMs(_B1_nowMs() - tFetchInicio);

  const tParseInicio = _B1_nowMs();
  let respuesta = null;
  try {
    respuesta = rawText ? JSON.parse(rawText) : null;
  } catch (_) {
    respuesta = null;
  }
  const tParseCliente = _B1_roundMs(_B1_nowMs() - tParseInicio);

  if (!response.ok || !respuesta || respuesta.ok !== true) {
    const err = (respuesta && respuesta.error) || {};
    throw B1_crearErrorUpstream({
      message: err.mensaje || err.message || `Trastienda respondió ${response.status || 'sin status'} en rescate Gemini`,
      upstreamCode: err.codigo || `HTTP_${response.status || 'UNKNOWN'}`,
      upstreamModule: err.modulo || 'TRASTIENDA',
      raw: respuesta
    });
  }

  const parseado = _parsearRespuestaGemini(respuesta);
  const tiemposInternos = _B1_extraerTiemposInternosResultado(respuesta);
  const tExternoNoDesglosado = _B1_estimarExternoNoDesglosado(tFetchTotal, tiemposInternos);

  return {
    parseado,
    respuestaTrastienda: respuesta,
    tiempos: {
      cliente: {
        t_build_payload_gemini_ms: tBuildPayload,
        t_fetch_gemini_total_ms: tFetchTotal,
        t_parse_respuesta_gemini_cliente_ms: tParseCliente,
        t_gemini_lote_total_ms: _B1_roundMs(_B1_nowMs() - tInicio)
      },
      upstream: tiemposInternos,
      estimaciones: {
        t_gemini_externo_no_desglosado_ms: tExternoNoDesglosado
      },
      transporte: {
        httpStatus: response.status
      }
    }
  };
}

function _B1_extraerJSONDeTextoGemini(payload) {
  if (typeof payload !== 'string') return payload;

  var limpio = payload.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  var inicio = limpio.indexOf('{');
  var fin = limpio.lastIndexOf('}');

  if (inicio !== -1 && fin !== -1 && fin >= inicio) {
    return limpio.slice(inicio, fin + 1);
  }

  return limpio;
}

function _parsearRespuestaGemini(respuestaTrastienda) {
  const resultado = respuestaTrastienda && respuestaTrastienda.resultado ? respuestaTrastienda.resultado : {};
  let payload = resultado.respuestaGemini;

  if (typeof payload === 'string') {
    payload = _B1_extraerJSONDeTextoGemini(payload);
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      return { ok: false, correcciones: [], simetria: null, raw: payload, parseError: e.message };
    }
  }

  if (!payload || typeof payload !== 'object') {
    return { ok: false, correcciones: [], simetria: null, raw: payload, parseError: 'respuestaGemini ausente o inválida' };
  }

  return {
    ok: true,
    correcciones: Array.isArray(payload.correcciones) ? payload.correcciones : [],
    simetria: payload.simetria || null,
    raw: payload
  };
}

function B1_decidirTroceo(slots, cronometro) {
  const MAX_ROIS_POR_LOTE = 15;
  const slotsConROI = slots.filter(s => s.roiBase64);
  if (slotsConROI.length <= MAX_ROIS_POR_LOTE && cronometro.canAfford(B1_RESCUE_ESTIMATED_MS)) {
    return { necesitaTroceo: false, lotes: [slots] };
  }

  const lotes = [];
  for (let i = 0; i < slots.length; i += MAX_ROIS_POR_LOTE) {
    if (!cronometro.canAfford(B1_RESCUE_ESTIMATED_MS)) break;
    lotes.push(slots.slice(i, i + MAX_ROIS_POR_LOTE));
  }
  return { necesitaTroceo: true, lotes };
}

async function B1_ejecutarRescate(loteRescate, textoBase, cronometro, sessionToken, urlTrastienda, opciones) {
  opciones = opciones || {};
  const tInicio = _B1_nowMs();
  const tiemposCliente = {
    t_decidir_troceo_rescate_ms: 0,
    t_build_payload_gemini_ms: 0,
    t_fetch_gemini_total_ms: 0,
    t_parse_respuesta_gemini_cliente_ms: 0,
    t_gemini_total_ms: 0,
    t_rescate_total_ms: 0
  };
  const tiemposUpstreamLotes = [];
  const tiemposEstimadosLotes = [];

  if (loteRescate.totalSlots === 0) {
    tiemposCliente.t_rescate_total_ms = _B1_roundMs(_B1_nowMs() - tInicio);
    return {
      intentado: false,
      correcciones: [],
      slotsEnviados: 0,
      slotsDevueltos: 0,
      razon: 'Sin slots rescatables.',
      erroresLote: 0,
      upstreamError: null,
      tiempos: {
        cliente: tiemposCliente,
        upstream: { lotes: [], agregado: null },
        estimaciones: { lotes: [], t_gemini_externo_no_desglosado_ms: null }
      }
    };
  }

  if (!cronometro.canAfford(B1_RESCUE_ESTIMATED_MS)) {
    tiemposCliente.t_rescate_total_ms = _B1_roundMs(_B1_nowMs() - tInicio);
    return {
      intentado: false,
      correcciones: [],
      slotsEnviados: 0,
      slotsDevueltos: 0,
      razon: 'Presupuesto de tiempo insuficiente para rescate.',
      erroresLote: 0,
      upstreamError: null,
      tiempos: {
        cliente: tiemposCliente,
        upstream: { lotes: [], agregado: null },
        estimaciones: { lotes: [], t_gemini_externo_no_desglosado_ms: null }
      }
    };
  }

  const tTroceoInicio = _B1_nowMs();
  const { necesitaTroceo, lotes } = B1_decidirTroceo(loteRescate.slots, cronometro);
  tiemposCliente.t_decidir_troceo_rescate_ms = _B1_roundMs(_B1_nowMs() - tTroceoInicio);

  if (lotes.length === 0) {
    tiemposCliente.t_rescate_total_ms = _B1_roundMs(_B1_nowMs() - tInicio);
    return {
      intentado: false,
      correcciones: [],
      slotsEnviados: 0,
      slotsDevueltos: 0,
      razon: 'Sin tiempo para ningún lote de rescate.',
      erroresLote: 0,
      upstreamError: null,
      tiempos: {
        cliente: tiemposCliente,
        upstream: { lotes: [], agregado: null },
        estimaciones: { lotes: [], t_gemini_externo_no_desglosado_ms: null }
      }
    };
  }

  const todasCorrecciones = [];
  let totalEnviados = 0;
  let totalDevueltos = 0;
  const errores = [];

  for (const lote of lotes) {
    if (!cronometro.canAfford(B1_RESCUE_ESTIMATED_MS)) break;
    try {
      totalEnviados += lote.length;
      const envio = await B1_enviarRescateGemini(
        textoBase,
        lote,
        sessionToken,
        urlTrastienda,
        opciones.geminiTimeoutMs
      );
      const resultado = envio.parseado;

      tiemposCliente.t_build_payload_gemini_ms         += envio.tiempos?.cliente?.t_build_payload_gemini_ms || 0;
      tiemposCliente.t_fetch_gemini_total_ms            += envio.tiempos?.cliente?.t_fetch_gemini_total_ms || 0;
      tiemposCliente.t_parse_respuesta_gemini_cliente_ms += envio.tiempos?.cliente?.t_parse_respuesta_gemini_cliente_ms || 0;
      tiemposCliente.t_gemini_total_ms                  += envio.tiempos?.cliente?.t_gemini_lote_total_ms || 0;

      tiemposUpstreamLotes.push(envio.tiempos?.upstream || null);
      tiemposEstimadosLotes.push(envio.tiempos?.estimaciones?.t_gemini_externo_no_desglosado_ms ?? null);

      if (resultado.ok && Array.isArray(resultado.correcciones)) {
        totalDevueltos += resultado.correcciones.length;
        todasCorrecciones.push(...resultado.correcciones);
      }
    } catch (err) {
      errores.push({
        message: err.message || 'Error en lote de rescate',
        upstreamCode: err.upstreamCode || null,
        upstreamModule: err.upstreamModule || null,
        raw: err.raw || null
      });
    }
  }

  tiemposCliente.t_rescate_total_ms = _B1_roundMs(_B1_nowMs() - tInicio);

  if (totalDevueltos === 0 && errores.length > 0) {
    const primero = errores[0];
    const err = new Error(primero.message || 'Rescate Gemini fallido');
    err.upstreamCode  = primero.upstreamCode || null;
    err.upstreamModule = primero.upstreamModule || null;
    err.raw           = primero.raw || null;
    err.intentCount   = errores.length;
    throw err;
  }

  const upstreamAgregado  = tiemposUpstreamLotes.reduce((acc, lote) => _B1_sumarObjetoNumerico(acc, lote), {});
  const externoAgregado   = tiemposEstimadosLotes
    .filter(x => typeof x === 'number')
    .reduce((acc, n) => acc + n, 0);

  return {
    intentado: true,
    correcciones: todasCorrecciones,
    slotsEnviados: totalEnviados,
    slotsDevueltos: totalDevueltos,
    necesitaTroceo,
    lotesEjecutados: lotes.length,
    razon: null,
    erroresLote: errores.length,
    upstreamError: errores.length ? errores[0] : null,
    tiempos: {
      cliente: tiemposCliente,
      upstream: {
        lotes: tiemposUpstreamLotes,
        agregado: Object.keys(upstreamAgregado).length ? upstreamAgregado : null
      },
      estimaciones: {
        lotes: tiemposEstimadosLotes,
        t_gemini_externo_no_desglosado_ms: tiemposEstimadosLotes.some(x => typeof x === 'number') ? externoAgregado : null
      }
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Object.assign(module.exports || {}, {
    B1_construirPromptRescate: B1_construirPromptRescate,
    B1_construirTareaIARescate: B1_construirTareaIARescate,
    B1_normalizarSubrespuestaIARescate: B1_normalizarSubrespuestaIARescate,
    B1_ejecutarRescate: B1_ejecutarRescate
  });
}


;/* END ../../backend/boxer1/backend/operativa/B1_rescate.js */

;/* BEGIN ../../backend/boxer1/backend/operativa/B1_merge.js */
/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * BOXER 1 v2 Â· MERGE Y PASAPORTE
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * Alineado con madre v5 y 12 reglas fijas del proyecto.
 *
 * REGLAS ABSOLUTAS:
 * - Fusionar respuestas por slotId, NUNCA por texto repetido.
 * - Simetria EXACTA entre slots enviados y devueltos.
 * - Si falta, sobra o se duplica un slot: merge CANCELADO.
 * - NO EXISTE merge parcial.
 *
 * REGLA 7:  no_resuelta en alergeno = ROJO. Siempre.
 * REGLA 12: Solo alergenos rotos llegan al merge. Tabla B
 *           quedo resuelta en el motor y nunca entra aqui.
 *           Por tanto, todo no_resuelta es critico.
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */


/* â”€â”€ VERIFICAR SIMETRIA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function B1_verificarSimetria(slotsEnviados, correccionesRecibidas) {
  var idsEnviados  = slotsEnviados.map(function(s) { return s.slotId; }).sort();
  var idsRecibidos = correccionesRecibidas.map(function(c) { return c.slotId; }).sort();

  if (idsEnviados.length !== idsRecibidos.length) {
    return {
      simetrica: false,
      detalle: 'Asimetria de cantidad: enviados=' + idsEnviados.length + ', devueltos=' + idsRecibidos.length
    };
  }

  var setRecibidos = {};
  for (var r = 0; r < idsRecibidos.length; r++) {
    if (setRecibidos[idsRecibidos[r]]) {
      return { simetrica: false, detalle: 'Slots duplicados en la respuesta de Gemini.' };
    }
    setRecibidos[idsRecibidos[r]] = true;
  }

  for (var i = 0; i < idsEnviados.length; i++) {
    if (idsEnviados[i] !== idsRecibidos[i]) {
      return {
        simetrica: false,
        detalle: 'SlotId no coincide: esperado=' + idsEnviados[i] + ', recibido=' + idsRecibidos[i]
      };
    }
  }

  return { simetrica: true, detalle: 'Simetria exacta confirmada.' };
}


/* â”€â”€ EJECUTAR MERGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function B1_ejecutarMerge(textoBase, slotsEnviados, resultadoRescate, palabrasOCR) {

  if (!resultadoRescate.intentado) {
    return {
      mergeStatus:      B1_MERGE_STATUS.NO_INTENTADO,
      textoAuditado:    textoBase,
      correcciones:     [],
      noResueltas:      [],
      roiRefsRevision:  [],
      mergeCancelado:   false,
      resultadosGemini: [],
      detalleSlots:     []
    };
  }

  var simetria = B1_verificarSimetria(slotsEnviados, resultadoRescate.correcciones);

  if (!simetria.simetrica) {
    var noResueltas = slotsEnviados.map(function(s) { return s.slotId; });
    var roiRefs = [];
    var resultadosGemini = [];
    var detalleSlots = [];

    for (var a = 0; a < slotsEnviados.length; a++) {
      var sa = slotsEnviados[a];
      if (sa.roiBase64) { roiRefs.push(B1_crearRoiRef(sa.slotId)); }
      resultadosGemini.push({
        slotId: sa.slotId, estado: 'no_resuelta',
        original: sa.textoOriginal, solucion: '', motivo: 'asimetria_slots'
      });
      detalleSlots.push({
        slotId: sa.slotId, estadoFinal: 'no_resuelta',
        original: sa.textoOriginal, solucion: '', motivo: 'asimetria_slots'
      });
    }

    return {
      mergeStatus:       B1_MERGE_STATUS.CANCELADO_POR_ASIMETRIA,
      textoAuditado:     textoBase,
      correcciones:      [],
      noResueltas:       noResueltas,
      roiRefsRevision:   roiRefs,
      mergeCancelado:    true,
      motivoCancelacion: simetria.detalle,
      resultadosGemini:  resultadosGemini,
      detalleSlots:      detalleSlots
    };
  }

  // Indexar correcciones por slotId
  var mapCorrecciones = {};
  resultadoRescate.correcciones.forEach(function(c) {
    mapCorrecciones[c.slotId] = c;
  });

  var correccionesAplicadas = [];
  var noResueltas2          = [];
  var roiRefsRevision       = [];
  var resultadosGemini2     = [];
  var detalleSlots2         = [];
  var reemplazosPendientes  = [];
  var rangosOcupados        = [];
  var mapaPosicionesOCR     = _B1_indexarPosicionesTextoOCR(textoBase, palabrasOCR || []);

  slotsEnviados.forEach(function(slot) {
    var correccion = mapCorrecciones[slot.slotId];
    if (!correccion) return;

    var estado   = String(correccion.estado || correccion.resultado || '').trim();
    var solucion = String(correccion.solucion || '').trim();
    var original = String(slot.textoOriginal || '').trim();

    // â”€â”€ CORREGIDA â”€â”€
    var esCorregida = ['corregida', 'corregido', 'aplicable', 'aplicada'].indexOf(estado) !== -1;
    if (esCorregida) {
      if (!solucion) {
        noResueltas2.push(slot.slotId);
        if (slot.roiBase64) { roiRefsRevision.push(B1_crearRoiRef(slot.slotId)); }
        resultadosGemini2.push({
          slotId: slot.slotId, estado: 'no_resuelta',
          original: slot.textoOriginal, solucion: '', motivo: 'solucion_vacia'
        });
        detalleSlots2.push({
          slotId: slot.slotId, estadoFinal: 'no_resuelta',
          original: slot.textoOriginal, solucion: '', motivo: 'solucion_vacia'
        });
        return;
      }

      if (solucion !== original) {
        var reemplazo = _B1_resolverReemplazoSlot(textoBase, slot, solucion, mapaPosicionesOCR, rangosOcupados);
        if (!reemplazo) {
          noResueltas2.push(slot.slotId);
          if (slot.roiBase64) { roiRefsRevision.push(B1_crearRoiRef(slot.slotId)); }
          resultadosGemini2.push({
            slotId: slot.slotId, estado: 'no_resuelta',
            original: slot.textoOriginal, solucion: '', motivo: 'replace_no_localizado'
          });
          detalleSlots2.push({
            slotId: slot.slotId, estadoFinal: 'no_resuelta',
            original: slot.textoOriginal, solucion: '', motivo: 'replace_no_localizado'
          });
          return;
        }

        reemplazosPendientes.push(reemplazo);
        rangosOcupados.push({ start: reemplazo.start, end: reemplazo.end });
        correccionesAplicadas.push({
          slotId: slot.slotId, original: slot.textoOriginal,
          solucion: solucion, estado: B1_ESTADO_GEMINI.CORREGIDA
        });
        resultadosGemini2.push({ slotId: slot.slotId, estado: 'corregida', original: slot.textoOriginal, solucion: solucion, motivo: '' });
        detalleSlots2.push({ slotId: slot.slotId, estadoFinal: 'corregida', original: slot.textoOriginal, solucion: solucion, motivo: '' });
        return;
      }

      resultadosGemini2.push({ slotId: slot.slotId, estado: 'ya_valida', original: slot.textoOriginal, solucion: original, motivo: '' });
      detalleSlots2.push({ slotId: slot.slotId, estadoFinal: 'ya_valida', original: slot.textoOriginal, solucion: original, motivo: '' });
      return;
    }

    // â”€â”€ YA_VALIDA â”€â”€
    var esYaValida = ['ya_valida', 'yavalida', 'ya_correcto', 'yacorrecto', 'correcto',
                      'sin_cambio', 'sincambio', 'confirmado'].indexOf(estado) !== -1;
    if (esYaValida) {
      resultadosGemini2.push({ slotId: slot.slotId, estado: 'ya_valida', original: slot.textoOriginal, solucion: solucion || original, motivo: '' });
      detalleSlots2.push({ slotId: slot.slotId, estadoFinal: 'ya_valida', original: slot.textoOriginal, solucion: solucion || original, motivo: '' });
      return;
    }

    // â”€â”€ NO_RESUELTA (todo lo demas) â”€â”€
    noResueltas2.push(slot.slotId);
    if (slot.roiBase64) { roiRefsRevision.push(B1_crearRoiRef(slot.slotId)); }
    resultadosGemini2.push({
      slotId: slot.slotId, estado: 'no_resuelta',
      original: slot.textoOriginal, solucion: '',
      motivo: String(correccion.motivo || '').slice(0, 64)
    });
    detalleSlots2.push({
      slotId: slot.slotId, estadoFinal: 'no_resuelta',
      original: slot.textoOriginal, solucion: '',
      motivo: String(correccion.motivo || '').slice(0, 64)
    });
  });

  var textoAuditado = _B1_aplicarReemplazos(textoBase, reemplazosPendientes);

  return {
    mergeStatus:      B1_MERGE_STATUS.OK,
    textoAuditado:    textoAuditado,
    correcciones:     correccionesAplicadas,
    noResueltas:      noResueltas2,
    roiRefsRevision:  roiRefsRevision,
    mergeCancelado:   false,
    resultadosGemini: resultadosGemini2,
    detalleSlots:     detalleSlots2
  };
}


/* â”€â”€ EMITIR PASAPORTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*
 * REGLA 7:  no_resuelta en alergeno = ROJO. Siempre.
 * REGLA 12: Solo alergenos llegan al merge. Todo no_resuelta es critico.
 * REGLA 3:  Fiabilidad no decide cortes. No se consulta fotoViable.
 */

function B1_emitirPasaporte(merge, fiabilidad, agentEnabled, cronometro, abortReason) {

  // Aborto externo
  if (abortReason) {
    return {
      estado: B1_PASSPORT.ROJO,
      explicacion: abortReason,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CORTE_TEMPRANO
    };
  }

  if (!agentEnabled) {
    return {
      estado: B1_PASSPORT.NARANJA,
      explicacion: 'Agente desactivado. Solo OCR + motor local.',
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CONTINUAR_Y_MARCAR
    };
  }

  // Merge cancelado por asimetria
  if (merge.mergeCancelado) {
    return {
      estado: B1_PASSPORT.ROJO,
      explicacion: 'Merge cancelado. Alergenos sin resolver. ' + (merge.motivoCancelacion || ''),
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO
    };
  }

  var hayNoResueltos = merge.noResueltas && merge.noResueltas.length > 0;

  // ROJO: cualquier no_resuelta â€” regla 7, todo es alergeno â€” regla 12
  if (hayNoResueltos) {
    return {
      estado: B1_PASSPORT.ROJO,
      explicacion: merge.noResueltas.length + ' alergeno(s) sin resolver.',
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO
    };
  }

  // VERDE: todos corregida o ya_valida
  return {
    estado: B1_PASSPORT.VERDE,
    explicacion: 'Lectura solida. Texto auditado utilizable.',
    accionSugeridaParaCerebro: null
  };
}


/* â”€â”€ AUXILIAR: REEMPLAZO POR SLOT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function _B1_claveOCR(item) {
  return [
    typeof item.pageIndex === 'number' ? item.pageIndex : '',
    typeof item.blockIndex === 'number' ? item.blockIndex : '',
    typeof item.wordIndex === 'number' ? item.wordIndex : ''
  ].join('|');
}

function _B1_indexarPosicionesTextoOCR(textoBase, palabrasOCR) {
  var texto = String(textoBase || '');
  var cursor = 0;
  var mapa = {};

  for (var i = 0; i < palabrasOCR.length; i++) {
    var palabra = palabrasOCR[i];
    if (!palabra) continue;

    var token = String(palabra.texto || '');
    if (!token) continue;

    var idx = texto.indexOf(token, cursor);
    if (idx === -1) continue;

    mapa[_B1_claveOCR(palabra)] = {
      start: idx,
      end: idx + token.length,
      tokenOriginal: token
    };
    cursor = idx + token.length;
  }

  return mapa;
}

function _B1_resolverReemplazoSlot(textoBase, slot, solucion, mapaPosicionesOCR, rangosOcupados) {
  var clave = _B1_claveOCR(slot);
  var pos = mapaPosicionesOCR[clave];

  if (
    pos &&
    textoBase.slice(pos.start, pos.end) === String(slot.textoOriginal || '') &&
    !_B1_rangoSeSolapa(pos.start, pos.end, rangosOcupados)
  ) {
    return {
      slotId: slot.slotId,
      start: pos.start,
      end: pos.end,
      solucion: solucion
    };
  }

  return _B1_buscarReemplazoTokenAislado(textoBase, slot, solucion, rangosOcupados);
}

function _B1_buscarReemplazoTokenAislado(textoBase, slot, solucion, rangosOcupados) {
  var textoOriginal = String(slot.textoOriginal || '');
  if (!textoOriginal) return null;

  var escaped = textoOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var charsToken = '0-9A-Za-z\\u00C0-\\u017F';
  var regex = new RegExp('(^|[^' + charsToken + '])(' + escaped + ')(?=$|[^' + charsToken + '])', 'g');
  var match;

  while ((match = regex.exec(textoBase)) !== null) {
    var start = match.index + match[1].length;
    var end = start + match[2].length;
    if (_B1_rangoSeSolapa(start, end, rangosOcupados)) {
      continue;
    }
    return {
      slotId: slot.slotId,
      start: start,
      end: end,
      solucion: solucion
    };
  }

  return null;
}

function _B1_rangoSeSolapa(start, end, rangosOcupados) {
  for (var i = 0; i < rangosOcupados.length; i++) {
    var rango = rangosOcupados[i];
    if (start < rango.end && end > rango.start) {
      return true;
    }
  }
  return false;
}

function _B1_aplicarReemplazos(textoBase, reemplazos) {
  var texto = String(textoBase || '');
  if (!reemplazos || reemplazos.length === 0) return texto;

  var ordenados = reemplazos.slice().sort(function(a, b) {
    return b.start - a.start;
  });

  for (var i = 0; i < ordenados.length; i++) {
    var reemplazo = ordenados[i];
    texto =
      texto.slice(0, reemplazo.start) +
      reemplazo.solucion +
      texto.slice(reemplazo.end);
  }

  return texto;
}

;/* END ../../backend/boxer1/backend/operativa/B1_merge.js */

;/* BEGIN ../../backend/boxer1/backend/adaptadores/B1_fase5_adapter.js */
/**
 * =====================================================================
 * BOXER 1 v2 Â· ADAPTADOR FASE 5
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

;/* END ../../backend/boxer1/backend/adaptadores/B1_fase5_adapter.js */

;/* BEGIN ../../backend/boxer1/backend/operativa/B1_core.js */
/**
 * =====================================================================
 * BOXER 1 v2 Â· CORE
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

;/* END ../../backend/boxer1/backend/operativa/B1_core.js */

;/* BEGIN ../ia/boxer3_motor.js */
"use strict";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BOXER 3 v3 â€” MOTOR DETECCIÃ“N PESO/FORMATO
//
// Pipeline:
//   0a â€” NormalizaciÃ³n OCR (Oâ†’0, mIâ†’ml, Ã—â†’x, slash multipack, espacio miles)
//   0b â€” NormalizaciÃ³n lingÃ¼Ã­stica (quitar acentos, lowercase) â€” solo comparaciÃ³n
//   0c â€” Parser numÃ©rico (miles europeo: 1.000â†’1000, 1.500,00â†’1500)
//   1  â€” Filtro basura
//   2a â€” FusiÃ³n de lÃ­neas partidas (etiqueta en lÃ­nea i, valor en i+1)
//   2b â€” ExtracciÃ³n + clasificaciÃ³n A1/A2/B/C/D
//   3  â€” Colapso de duplicados (mismo valorNorm+unidadNorm+clase)
//   4  â€” DecisiÃ³n: A1 > A2 > inferencia(B+C) > scoring(C) > vacÃ­o
//          Nunca "ENVIAR A IA" por diseÃ±o: ambigÃ¼edad real â†’ campo vacÃ­o + diagnÃ³stico
//
// Regla de negocio: escurrido > neto > bruto
// Multipack: texto original ("4x250g")
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€â”€ CAPA 0A: NORMALIZACIÃ“N OCR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function corregirNumeros(texto) {
  var r = texto;
  r = r.replace(/(\d)O(\d)/g, "$10$2");
  r = r.replace(/(\d)OO\b/g, "$100");
  var up = "(?=\\s*(?:kg|g|gr|grs|ml|mI|m1|cl|cI|c1|dl|dI|d1|lt|l|L|oz|litros?|Iitros?|1itros?)\\b)";
  r = r.replace(new RegExp("(\\d)O\\b" + up, "gi"), "$10");
  r = r.replace(new RegExp("\\bO(\\d+)\\b" + up, "gi"), "0$1");
  return r;
}

function corregirUnidades(texto) {
  var reglas = [
    { regex: /(\d+[,.]?\d*)\s*[I1]itros\b/g,    fix: "$1 litros" },
    { regex: /(\d+[,.]?\d*)\s*[I1]itro\b/g,     fix: "$1 litro"  },
    { regex: /(\d+[,.]?\d*)\s*mI\b/g,            fix: "$1 ml"     },
    { regex: /(\d+[,.]?\d*)\s*m1\b/g,            fix: "$1 ml"     },
    { regex: /(\d+[,.]?\d*)\s*ML\b/g,            fix: "$1 ml"     },
    { regex: /(\d+[,.]?\d*)\s*cI\b/g,            fix: "$1 cl"     },
    { regex: /(\d+[,.]?\d*)\s*c1\b/g,            fix: "$1 cl"     },
    { regex: /(\d+[,.]?\d*)\s*dI\b/g,            fix: "$1 dl"     },
    { regex: /(\d+[,.]?\d*)\s*d1\b/g,            fix: "$1 dl"     },
    { regex: /(\d+[,.]?\d*)\s*[kK]9\b/g,         fix: "$1 kg"     },
    { regex: /(\d+[,.]?\d*)\s*KG\b/g,            fix: "$1 kg"     },
    { regex: /(\d+[,.]?\d*)\s*[kK][gG][sS]\b/g,  fix: "$1 kg"     },
    { regex: /(\d+[,.]?\d*)\s*9[rR][sS]\b/g,     fix: "$1 grs"    },
    { regex: /(\d+[,.]?\d*)\s*9[rR]\b/g,         fix: "$1 gr"     },
    { regex: /(\d+[,.]?\d*)\s*GRS\b/g,           fix: "$1 grs"    },
    { regex: /(\d+[,.]?\d*)\s*[0O]z\b/gi,        fix: "$1 oz"     },
    { regex: /(\d+[,.]?\d*)\s*[Kk]ilos?\b/g,    fix: "$1 kg"     },
    { regex: /(\d)\s*\u00d7\s*(\d)/g,            fix: "$1x$2"     }
  ];
  var res = texto;
  for (var i = 0; i < reglas.length; i++) {
    res = res.replace(reglas[i].regex, reglas[i].fix);
  }
  // El sÃ­mbolo de envasado "â„®" suele salir del OCR como una "e" pegada a la unidad:
  // "1000 ge" / "500 mle". Lo limpiamos solo en tokens numÃ©ricos de peso/volumen.
  res = res.replace(
    /(\d+(?:[.,]\d+)?)\s*(kg|g|gr|grs|ml|cl|dl|lt|l|oz|lb)\s*[eE\u212e]\b/gi,
    "$1 $2"
  );
  return res;
}

// "4/250g" â†’ "4x250g" cuando el primer nÃºmero es entero 2-24 (cantidad pack)
// y el segundo va pegado a unidad vÃ¡lida. Descarta "08/2024" (fechas).
function normalizarSlashMultipack(texto) {
  return texto.replace(
    /\b([2-9]|1[0-9]|2[0-4])\/(\d+[,.]?\d*\s*(?:kg|g|gr|grs|ml|cl|dl|lt|l|oz|lb|litros?))\b/gi,
    "$1x$2"
  );
}

// "1 000 g" â†’ "1000 g": espacio como separador de miles antes de unidad
function normalizarEspaciosMiles(texto) {
  return texto.replace(
    /(\d{1,3})\s(\d{3})\b(?=\s*(?:kg|g|gr|grs|ml|cl|dl|lt|l|oz|lb|litros?)\b)/gi,
    "$1$2"
  );
}

// "TARA: 50g," â†’ eliminado antes de que UNIDADES_REGEX lo vea.
// "tara" es semÃ¡nticamente unÃ­voco en etiquetado; nunca es el peso del producto.
function eliminarTara(texto) {
  return texto.replace(
    /\btara\s*:\s*(?:\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+[.,]\d+|\d+)\s*(?:kg|g|gr|grs|ml|cl|dl|lt|l|oz|lb)\b[\s,;]*/gi,
    ""
  );
}

// "Peso: 3,5k" -> "Peso: 3,5 kg" solo en contexto comercial.
// Nunca aplica en lineas nutricionales.
function normalizarPesoKComercial(texto) {
  var lineas = String(texto || "").split("\n");
  var out = [];
  var hasLabel = /\b(?:peso(?:\s+neto)?|contenido\s+neto)\b/i;
  var isNutritional = /\b(?:por\s*100|valor\s*energetico|grasas?|hidratos?|proteinas?|sal|kcal|kj)\b/i;
  var kiloShorthand = /\b(\d+(?:[.,]\d+)?)\s*k\b/ig;

  for (var i = 0; i < lineas.length; i += 1) {
    var linea = String(lineas[i] || "");
    var lineaNorm = normalizarUnicode(linea);
    if (!hasLabel.test(lineaNorm) || isNutritional.test(lineaNorm)) {
      out.push(linea);
      continue;
    }
    out.push(linea.replace(kiloShorthand, "$1 kg"));
  }
  return out.join("\n");
}

function normalizarOCR(texto) {
  var r = corregirNumeros(texto);
  r = corregirUnidades(r);
  r = normalizarSlashMultipack(r);
  r = normalizarEspaciosMiles(r);
  r = eliminarTara(r);
  r = normalizarPesoKComercial(r);
  return r;
}

// â”€â”€â”€ CAPA 0B: REPARACIÃ“N LÃ‰XICA DIRIGIDA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// No corrige todo el OCR. Solo actÃºa en lÃ­neas con candidatos de peso.
// Principio: lÃ©xico cerrado + confusiones OCR ponderadas + umbral de seguridad.

// LÃ©xico objetivo estructurado por familia semÃ¡ntica.
// Solo se intenta reparar contra estas palabras conocidas.
var LEXICO_OBJETIVO = {
  NETO:        ["neto", "net"],
  BRUTO:       ["bruto", "gross"],
  ESCURRIDO:   ["escurrido", "drenado", "drained"],
  NUTRICIONAL: ["kcal", "kj", "grasas", "proteinas", "fibra",
                "sodio", "hidratos", "azucares",
                "glucides", "lipides", "proteines"]
};

// Tabla de costes de sustituciÃ³n para confusiones tÃ­picas de OCR.
// Parejas conocidas tienen coste bajo; sustituciÃ³n arbitraria: coste 1.0.
var CONFUSIONES = (function() {
  var tabla = {};
  var pares = [
    ["0","o",0.2], ["o","0",0.2],
    ["1","l",0.2], ["l","1",0.2],
    ["1","i",0.2], ["i","1",0.2],
    ["l","i",0.15],["i","l",0.15],
    ["5","s",0.3], ["s","5",0.3],
    ["8","b",0.35],["b","8",0.35],
    ["9","g",0.25],["g","9",0.25],
    ["q","g",0.3], ["g","q",0.3],
    ["4","a",0.35],["a","4",0.35]
  ];
  for (var p = 0; p < pares.length; p++) {
    tabla[pares[p][0] + pares[p][1]] = pares[p][2];
  }
  return tabla;
}());

// Distancia de ediciÃ³n ponderada por confusiones OCR.
// Inserciones/eliminaciones cuestan 0.8 (frecuentes en cortes de palabra).
function distanciaOCR(s, t) {
  var m = s.length, n = t.length;
  var d = [];
  for (var i = 0; i <= m; i++) { d[i] = [i * 0.8]; }
  for (var j = 1; j <= n; j++) { d[0][j] = j * 0.8; }
  for (var j = 1; j <= n; j++) {
    for (var i = 1; i <= m; i++) {
      var sc = (s[i-1] === t[j-1]) ? 0 : (CONFUSIONES[s[i-1] + t[j-1]] || 1.0);
      d[i][j] = Math.min(d[i-1][j] + 0.8, d[i][j-1] + 0.8, d[i-1][j-1] + sc);
    }
  }
  return d[m][n];
}

// Busca la palabra mÃ¡s cercana en todo el lÃ©xico.
// Devuelve la palabra reparada si la distancia normalizada < umbral, o null.
var UMBRAL_REPARACION = 0.28; // 0.35 permitía "ascorbido"→"escurrido" (0.33) — bajado a 0.28

// repararToken: busca en todas las familias del lÃ©xico
function repararToken(tokenNorm) {
  if (tokenNorm.length < 3) return null;
  var mejor = null, mejorDist = Infinity;
  var familias = Object.keys(LEXICO_OBJETIVO);
  for (var f = 0; f < familias.length; f++) {
    var palabras = LEXICO_OBJETIVO[familias[f]];
    for (var p = 0; p < palabras.length; p++) {
      var obj = palabras[p];
      if (Math.abs(tokenNorm.length - obj.length) > 2) continue;
      var dist = distanciaOCR(tokenNorm, obj);
      var distNorm = dist / obj.length;
      if (distNorm < mejorDist) { mejorDist = distNorm; mejor = obj; }
    }
  }
  if (mejor && mejorDist < UMBRAL_REPARACION && tokenNorm !== mejor) return mejor;
  return null;
}

// repararTokenEtiqueta: solo busca en NETO/BRUTO/ESCURRIDO â€” para lÃ­neas vecinas sin nÃºmero
// Evita reparar palabras de marketing ("azucar"â†’"azucares") que son falsas alarmas
function repararTokenEtiqueta(tokenNorm) {
  if (tokenNorm.length < 3) return null;
  var familias = ["NETO", "BRUTO", "ESCURRIDO"];
  var mejor = null, mejorDist = Infinity;
  for (var f = 0; f < familias.length; f++) {
    var palabras = LEXICO_OBJETIVO[familias[f]];
    for (var p = 0; p < palabras.length; p++) {
      var obj = palabras[p];
      if (Math.abs(tokenNorm.length - obj.length) > 2) continue;
      var dist = distanciaOCR(tokenNorm, obj);
      var distNorm = dist / obj.length;
      if (distNorm < mejorDist) { mejorDist = distNorm; mejor = obj; }
    }
  }
  if (mejor && mejorDist < UMBRAL_REPARACION && tokenNorm !== mejor) return mejor;
  return null;
}

// Repara tokens en lÃ­neas que contienen candidatos de peso (nÃºmero + unidad).
// No toca el resto del documento para no introducir alucinaciones.
var UNIDADES_PATRON = /(?:\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+[.,]\d+|\d+)\s*(?:kg|g|gr|grs|ml|cl|dl|lt|l|oz|lb|litros?)\b/i;

var EXCLUIR_UNIDADES_REP = /^(?:kg|g|gr|grs|ml|cl|dl|lt|oz|lb|mg|kcal|kj)$/i;

function repararTokensDeLinea(linea, soloEtiquetas) {
  return linea.replace(/\b[A-Za-z][A-Za-z0-9]{2,}\b/g, function(token) {
    if (EXCLUIR_UNIDADES_REP.test(token)) return token;
    var norm = token.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var reparado = soloEtiquetas ? repararTokenEtiqueta(norm) : repararToken(norm);
    return reparado ? reparado : token;
  });
}

function repararLineasCriticas(texto) {
  var lineas = texto.split("\n");
  var resultado = [];
  for (var i = 0; i < lineas.length; i++) {
    var linea = lineas[i];
    var tieneNumUnidad   = UNIDADES_PATRON.test(linea);
    // LÃ­nea de etiqueta sola: vecina a la siguiente que sÃ­ tiene nÃºmero+unidad
    // Solo repara contra vocabulario de etiquetas (neto/bruto/escurrido), no nutricional
    var esEtiquetaVecina = !tieneNumUnidad &&
                           i + 1 < lineas.length &&
                           UNIDADES_PATRON.test(lineas[i + 1]);

    if (tieneNumUnidad) {
      resultado.push(repararTokensDeLinea(linea, false)); // léxico completo
    } else if (esEtiquetaVecina) {
      resultado.push(repararTokensDeLinea(linea, true));  // solo etiquetas
    } else {
      resultado.push(linea);
    }
  }
  return resultado.join("\n");
}

// â”€â”€â”€ CAPA 0C: NORMALIZACIÃ“N LINGÃœÃSTICA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Solo para comparaciÃ³n semÃ¡ntica. El texto original nunca se modifica.

function normalizarUnicode(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// â”€â”€â”€ CAPA 0C: PARSER NUMÃ‰RICO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Casos:
//   1.500,00 o 1,500.00  (ambos separadores) â†’ 1500
//   1.000 o 1,000        (exactamente 3 decimales) â†’ 1000 (miles europeo/inglÃ©s)
//   1,5 o 1.5            (1-2 decimales) â†’ 1.5  (decimal normal)

function parsearNumero(texto) {
  var t = texto.trim();
  // Ambos separadores: "1.500,00" o "1,500.00"
  var ambos = t.match(/^(\d{1,3})[.,](\d{3})[.,](\d+)$/);
  if (ambos) {
    return parseFloat(ambos[1] + ambos[2] + "." + ambos[3]);
  }
  // Un solo separador con exactamente 3 decimales â†’ miles
  if (/^\d{1,3}[.,]\d{3}$/.test(t)) {
    return parseFloat(t.replace(/[.,]/, ""));
  }
  // Decimal normal
  return parseFloat(t.replace(",", "."));
}

// â”€â”€â”€ FILTRO 1: BASURA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function filtroBasura(texto) {
  var lineas = texto.split("\n");
  var limpias = [];
  for (var i = 0; i < lineas.length; i++) {
    var l = lineas[i];
    l = l.replace(/[&*#@!\u00a9\u00ae\u2122\u00a2|\\~^<>]/g, " ");
    l = l.replace(/[(){}\[\]]/g, " ");
    l = l.replace(/\b[A-Z]{1,3}[\-]?\d{3,}[A-Z0-9]*\b/g, " ");
    l = l.replace(/\b[A-Z]\d+[A-Z]+\d*\b/g, " ");
    l = l.replace(/(\d)\s+([gGlL])\b/g, "$1$2");
    l = l.replace(/(?<!\d\s?)\b[A-Za-z]\b(?!\s?\d)/g, " ");
    l = l.replace(/^[\s\-\._]+$/, "");
    l = l.replace(/\s+/g, " ").trim();
    if (l.length > 1) limpias.push(l);
  }
  return limpias.join("\n");
}

// â”€â”€â”€ DICCIONARIOS SEMÃNTICOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Todos en minÃºsculas sin acentos. Se comparan contra normalizarUnicode().
// JerarquÃ­a: A1(escurrido) > A2(neto) > B(bruto) > D(descarte) > C(neutro)

var TOKENS_ESCURRIDO = [
  "peso escurrido", "neto escurrido", "contenido escurrido", "escurrido",
  "peso drenado", "scurrido", "currido", "rrido",
  "drained weight", "drained wt",
  "poids egoutte", "oids egoutte", "poids net egoutte"
];

var TOKENS_NETO = [
  // EspaÃ±ol
  "peso neto", "contenido neto", "cont. neto", "cont neto",
  "peso liquido", "peso neto liquido",
  // Abreviaciones (con frontera)
  "cn:", "p.net", "p.n.", "p. n.", "p net", ".net ",
  // "neto:" directo â€” sin frontera, suficientemente especÃ­fico
  "neto:", "neto :",
  // Fragmentos rotos mÃ¡s cortos (con frontera, para evitar "producto:")
  "eto :",
  // InglÃ©s
  "net weight", "et weight", "net wt", "et wt", "net:",
  // FrancÃ©s
  "poids net", "oids net", "ids net", "contenu net",
  // Italiano
  "peso netto", "contenuto netto",
  // AlemÃ¡n (con frontera)
  "nettogewicht", "netto-gewicht", "netto:", "netto ",
  // PortuguÃ©s
  "conteudo liquido"
];

var TOKENS_BRUTO = [
  "peso bruto", "bruto",
  "gross weight", "gross wt", "ross weight", "ross wt",
  // AlemÃ¡n
  "grossgewicht", "bruttogewicht", "brutto",
  // Fragmentos rotos (con frontera obligatoria)
  "ruto:", "ruto :"
  // "uto:" eliminado â€” captura falsamente "producto:", "instrucciones:"
];

// Fragmentos cortos: requieren que el carÃ¡cter anterior NO sea letra
var REQUIEREN_FRONTERA = [
  "ruto:", "ruto :", "eto :", ".net ", "net:", "netto:", "netto ", "cn:"
];

// â”€â”€â”€ BLOQUEO NUTRICIONAL DURO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Estas seÃ±ales convierten la lÃ­nea en D ANTES que cualquier A1/A2/B.
// Son indicadores inequÃ­vocos de tabla nutricional que no pueden coexistir
// con una declaraciÃ³n de peso de producto (ej: "por 100 g de peso escurrido").

var BLOQUEO_NUTRICIONAL = [
  "por 100", "en 100", "per 100", "pour 100",
  "nutricional", "nutritional", "nutritive",
  "kcal", "kj"
];

// SeÃ±ales nutricionales estÃ¡ndar â€” se evalÃºan DESPUÃ‰S de A1/A2/B
var TOKENS_NUTRICIONAL = [
  "kilocalor", "calorias", "valor energetico",
  "valeur energetique", "valore energetico", "energiewert",
  "por porci",
  "hidratos de carbono", "hidratos", "carbohidratos",
  "proteinas", "proteina", "grasas", "azucares", "azucar",
  "fibra", "sodio",
  "glucides", "proteines", "lipides", "fibres", "sel:",
  "carboidrati", "lipidi", "fibre",
  "kohlenhydrate", "eiweiss", "ballaststoffe", "fett", "salz",
  "vitamina", "vitamin", "calcio", "calcium", "hierro",
  "%vrn", "%nrv", "%vd"
];

var TOKENS_RACION = [
  "tara", "racion", "porcion", "serving", "portion",
  "por unidad", "por servir", "cucharada", "cucharilla", "per serve"
];

// â”€â”€â”€ DETECCIÃ“N DE FRAGMENTOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function detectarFragmento(textoNorm, lista) {
  for (var i = 0; i < lista.length; i++) {
    var frag = lista[i];
    var idx = textoNorm.indexOf(frag);
    if (idx === -1) continue;
    if (REQUIEREN_FRONTERA.indexOf(frag) !== -1) {
      if (idx > 0 && /[a-z]/.test(textoNorm[idx - 1])) continue;
    }
    return frag;
  }
  return null;
}

// â”€â”€â”€ CLASIFICACIÃ“N DE LÃNEA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Orden: bloqueo nutricional duro â†’ A1 â†’ A2 â†’ B â†’ D â†’ C

function clasificarLinea(lineaNorm) {
  // BLOQUEO DURO: tabla nutricional inequÃ­voca â†’ D aunque lleve "escurrido/neto"
  for (var b = 0; b < BLOQUEO_NUTRICIONAL.length; b++) {
    if (lineaNorm.indexOf(BLOQUEO_NUTRICIONAL[b]) !== -1) return "D";
  }

  // Etiquetas positivas explÃ­citas
  if (detectarFragmento(lineaNorm, TOKENS_ESCURRIDO)) return "A1";
  if (detectarFragmento(lineaNorm, TOKENS_NETO))      return "A2";
  if (detectarFragmento(lineaNorm, TOKENS_BRUTO))     return "B";

  // Descarte secundario â€” solo si no hay etiqueta positiva
  if (/ingredientes?:|ingredients?:|contiene:|inhaltsstoffe:/.test(lineaNorm)) return "D";
  if (/%/.test(lineaNorm))             return "D";
  if (/[€$£]/.test(lineaNorm))         return "D";
  if (/grados|°[cf]/.test(lineaNorm))  return "D";
  // Slash solo es descarte si NO fue normalizado a multipack (x) por normalizarSlashMultipack
  if (/\d+\/\d+/.test(lineaNorm))      return "D";

  for (var n = 0; n < TOKENS_NUTRICIONAL.length; n++) {
    if (lineaNorm.indexOf(TOKENS_NUTRICIONAL[n]) !== -1) return "D";
  }
  for (var r = 0; r < TOKENS_RACION.length; r++) {
    if (lineaNorm.indexOf(TOKENS_RACION[r]) !== -1) return "D";
  }

  return "C";
}

// â”€â”€â”€ FUSIÃ“N DE LÃNEAS PARTIDAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Si lÃ­nea i tiene etiqueta semÃ¡ntica pero no peso, y lÃ­nea i+1 tiene peso pero
// no etiqueta â†’ se fusionan en una sola lÃ­nea.

var UNIDADES = ["kg", "g", "gr", "grs", "mg", "l", "lt", "ltr", "litro", "litros", "ml", "cl", "dl", "oz", "lb"];

// PatrÃ³n numÃ©rico completo: miles+decimal Â· decimal simple Â· entero
// Cubre: 1.500,00 | 1,500.00 | 1.000 | 1,5 | 500
var NUM_PAT = "(?:\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d+)?|\\d+[.,]\\d+|\\d+)";

// (?<![/\d-]) evita capturar "2" de "1/2 kg" o "500" de "450-500 g"
var UNIDADES_REGEX = new RegExp(
  "(?<![/\\d-])(" + NUM_PAT + ")\\s*x?\\s*(" + NUM_PAT + ")?\\s*(" + UNIDADES.join("|") + ")\\b",
  "gi"
);

function tieneEtiqueta(lineaNorm) {
  return detectarFragmento(lineaNorm, TOKENS_ESCURRIDO) ||
         detectarFragmento(lineaNorm, TOKENS_NETO)      ||
         detectarFragmento(lineaNorm, TOKENS_BRUTO);
}

function tienePeso(linea) {
  UNIDADES_REGEX.lastIndex = 0;
  return UNIDADES_REGEX.test(linea);
}

function fusionarLineasPartidas(textoLimpio) {
  var lineas = textoLimpio.split("\n");
  var resultado = [];
  var i = 0;
  while (i < lineas.length) {
    var lineaNorm = normalizarUnicode(lineas[i]);
    if (tieneEtiqueta(lineaNorm) && !tienePeso(lineas[i]) && i + 1 < lineas.length) {
      var sigNorm = normalizarUnicode(lineas[i + 1]);
      if (tienePeso(lineas[i + 1]) && !tieneEtiqueta(sigNorm)) {
        resultado.push(lineas[i] + " " + lineas[i + 1]);
        i += 2;
        continue;
      }
    }
    resultado.push(lineas[i]);
    i++;
  }
  return resultado.join("\n");
}

// â”€â”€â”€ UNIDADES â€” NORMALIZACIÃ“N â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function normalizarUnidad(u) {
  u = u.toLowerCase();
  if (u === "gr" || u === "grs")                                    return "g";
  if (u === "lt" || u === "ltr" || u === "litro" || u === "litros") return "l";
  return u;
}

function normalizarValor(valor, unidad) {
  var u = normalizarUnidad(unidad);
  if (u === "kg") return valor * 1000;
  if (u === "g")  return valor;
  if (u === "l")  return valor * 1000;
  if (u === "ml") return valor;
  if (u === "cl") return valor * 10;
  if (u === "dl") return valor * 100;
  if (u === "oz") return Math.round(valor * 28.35);
  if (u === "lb") return Math.round(valor * 453.59);
  return valor;
}

// â”€â”€â”€ EXTRACCIÃ“N DE CANDIDATOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function extraerCandidatos(textoLimpio) {
  var candidatos  = [];
  var descartados = [];
  var lineas      = textoLimpio.split("\n");

  for (var i = 0; i < lineas.length; i++) {
    var lineaOrig = lineas[i];
    var lineaNorm = normalizarUnicode(lineaOrig);
    var clase     = clasificarLinea(lineaNorm);

    var ctxIngredientes = false;
    if (clase === "C") {
      var ventana = lineas.slice(Math.max(0, i - 5), Math.min(lineas.length, i + 6));
      if (/ingredientes:|ingrediente:|ingredients:|contiene:/.test(
            normalizarUnicode(ventana.join(" ")))) {
        ctxIngredientes = true;
      }
    }

    var match;
    UNIDADES_REGEX.lastIndex = 0;

    while ((match = UNIDADES_REGEX.exec(lineaOrig)) !== null) {
      var tokenOrig  = match[0].trim();
      var val1txt    = match[1];
      var val2txt    = match[2] || null;
      var unidad     = match[3].toLowerCase();
      var valor1     = parsearNumero(val1txt);
      var valor2     = val2txt ? parsearNumero(val2txt) : null;
      var esMulti    = valor2 !== null;
      var valorTotal = esMulti ? valor1 * valor2 : valor1;

      // Detectar segundo extremo de rango "X - N unit" o "X-N unit" con espacio antes del guiÃ³n
      // El lookbehind ya bloquea "X-N" (sin espacios). Esto cubre "X - N" (con espacios).
      var matchStart = match.index;
      var lookback = lineaOrig.substring(Math.max(0, matchStart - 5), matchStart);
      if (/\d\s*-\s*$/.test(lookback)) {
        descartados.push({ token: tokenOrig, linea: lineaOrig, motivo: "segundo extremo de rango numérico", clase: "D" });
        continue;
      }

      // Valor cero o negativo â€” absurdo fÃ­sicamente
      if (valorTotal <= 0) {
        descartados.push({ token: tokenOrig, linea: lineaOrig, motivo: "valor cero o negativo", clase: "D" });
        continue;
      }

      if (unidad === "mg") {
        descartados.push({ token: tokenOrig, linea: lineaOrig, motivo: "mg siempre nutricional", clase: "D" });
        continue;
      }
      if (clase === "D") {
        descartados.push({ token: tokenOrig, linea: lineaOrig, motivo: "clase D", clase: "D" });
        continue;
      }
      // g < 10 sin multipack: descarte salvo etiqueta neto/escurrido explÃ­cita
      if ((unidad === "g" || unidad === "gr" || unidad === "grs") && !esMulti && valor1 < 10) {
        if (clase !== "A1" && clase !== "A2") {
          descartados.push({ token: tokenOrig, linea: lineaOrig, motivo: "g < 10 sin neto explícito", clase: "D" });
          continue;
        }
      }

      candidatos.push({
        tokenOriginal:   tokenOrig,
        valor1:          valor1,
        valor2:          valor2,
        valorTotal:      valorTotal,
        unidad:          unidad,
        unidadNorm:      normalizarUnidad(unidad),
        valorNorm:       normalizarValor(valorTotal, unidad),
        esMultipack:     esMulti,
        lineaOrigen:     lineaOrig.trim(),
        lineaIndex:      i,
        clase:           clase,
        ctxIngredientes: ctxIngredientes
      });
    }
  }

  return { candidatos: candidatos, descartados: descartados };
}

// â”€â”€â”€ COLAPSO DE DUPLICADOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Elimina candidatos equivalentes (mismo valor normalizado + unidad + clase).
// Maneja el caso bilingÃ¼e: "Net weight: 500g" y "Peso neto: 500g" â†’ uno solo.

// â”€â”€â”€ CONSOLIDAR CANDIDATOS EQUIVALENTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Dos candidatos son equivalentes solo si coinciden en:
//   1. misma clase (A1, A2, B, C)
//   2. mismo tipo fÃ­sico (masa vs volumen)
//   3. mismo valorNorm
//   4. misma estructura (simple vs multipack)
// Nunca fusionar: multipack+simple, A1+A2, A2+B.

var MASAS   = ["g", "kg", "oz", "lb"];
var VOLUMEN = ["ml", "l", "cl", "dl", "lt", "litro", "litros"];

function tipoFisico(unidadNorm) {
  if (MASAS.indexOf(unidadNorm) !== -1)   return "masa";
  if (VOLUMEN.indexOf(unidadNorm) !== -1) return "volumen";
  return "otro_" + unidadNorm; // desconocida -> nunca fusiona con nada
}

function colapsarDuplicados(candidatos) {
  var grupos = [];  // cada grupo = { clave, representante, evidencias }
  var mapa   = {};

  for (var i = 0; i < candidatos.length; i++) {
    var c = candidatos[i];
    var tf = tipoFisico(c.unidadNorm);
    var esM = c.esMultipack ? "multi" : "simple";
    // Clave exacta: clase + tipo fÃ­sico + valor canÃ³nico + estructura
    var clave = c.clase + "|" + tf + "|" + c.valorNorm + "|" + esM;

    if (mapa[clave] === undefined) {
      mapa[clave] = grupos.length;
      var rep = {};
      for (var k in c) { if (c.hasOwnProperty(k)) rep[k] = c[k]; }
      rep.evidencias  = 1;
      rep.lineasExtra = [];
      grupos.push(rep);
    } else {
      var idx = mapa[clave];
      grupos[idx].evidencias++;
      grupos[idx].lineasExtra.push(c.lineaOrigen);
    }
  }

  return grupos;
}

// â”€â”€â”€ INFERENCIA BRUTO â†’ NETO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function inferenciaBrutoNeto(cBruto, cNeutro) {
  var masas = ["g", "kg", "oz", "lb"];
  var vols  = ["ml", "l", "cl", "dl"];
  var bM = masas.indexOf(cBruto.unidadNorm)  !== -1;
  var nM = masas.indexOf(cNeutro.unidadNorm) !== -1;
  var bV = vols.indexOf(cBruto.unidadNorm)   !== -1;
  var nV = vols.indexOf(cNeutro.unidadNorm)  !== -1;

  if (!((bM && nM) || (bV && nV))) {
    return { aplicable: false, motivo: "unidades incomparables: " + cBruto.unidadNorm + " vs " + cNeutro.unidadNorm };
  }
  if (cBruto.esMultipack || cNeutro.esMultipack) {
    return { aplicable: false, motivo: "uno o ambos son multipack" };
  }
  if (cNeutro.valorNorm >= cBruto.valorNorm) {
    return { aplicable: false, motivo: "neutro no es menor que bruto" };
  }
  if (cNeutro.valorNorm < 50) {
    return { aplicable: false, motivo: "neutro (" + cNeutro.valorNorm + ") < 50 — posible porción" };
  }
  return {
    aplicable: true,
    resultado: cNeutro.tokenOriginal,
      motivo:    "inferencia: " + cNeutro.tokenOriginal + " (neutro<bruto) -> neto"
  };
}

// â”€â”€â”€ SCORING PARA CANDIDATOS NEUTROS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// totalLineas: nÃºmero total de lÃ­neas del texto limpio (para saber si es primera mitad)
function scoringNeutros(candidatos, totalLineas) {
  // Frecuencia de cada valorNorm entre los candidatos C â€” para detectar corroboraciÃ³n
  var cuentaValor = {};
  candidatos.forEach(function(c) {
    cuentaValor[c.valorNorm] = (cuentaValor[c.valorNorm] || 0) + 1;
  });

  return candidatos.map(function(c) {
    var pts = [], score = 0;
    var palabras = c.lineaOrigen.split(/\s+/).length;

    // â”€â”€ Criterios originales â”€â”€
    if (["kg","g","gr","grs","ml","l","cl","lt","litro","litros","oz","lb"].indexOf(c.unidad) !== -1) {
      pts.push({ r: "unidad_estandar", p: 25 }); score += 25;
    }
    if (c.esMultipack)                              { pts.push({ r: "multipack",        p: 20 }); score += 20; }
    if (palabras <= 4)                              { pts.push({ r: "token_aislado",    p: 15 }); score += 15; }
    if (c.ctxIngredientes)                          { pts.push({ r: "ctx_ingredientes", p:-20 }); score -= 20; }
    if (c.valorNorm >= 100 && c.valorNorm <= 10000) { pts.push({ r: "rango_tipico",     p: 20 }); score += 20; }

    // â”€â”€ Criterios nuevos de desempate â”€â”€

    // LÃ­nea completamente aislada: solo nÃºmero + unidad (â‰¤2 tokens)
    if (palabras <= 2)                              { pts.push({ r: "linea_aislada",    p: 15 }); score += 15; }

    // Primera mitad del documento: los pesos declarados van antes de ingredientes/nutriciÃ³n
    if (totalLineas > 0 && c.lineaIndex < totalLineas / 2) {
      pts.push({ r: "primera_mitad", p: 10 }); score += 10;
    }

    // Valor corroborado: el mismo valorNorm aparece en otro candidato C (repeticiÃ³n fiable)
    if ((cuentaValor[c.valorNorm] || 0) > 1)        { pts.push({ r: "valor_corroborado", p: 10 }); score += 10; }

    // Sin contexto sospechoso: la lÃ­nea no contiene aÃ±o 4 dÃ­gitos, temperatura negativa ni "lote"
    var lineaNorm = c.lineaOrigen;
    if (!/\b(?:20\d{2}|19\d{2})\b/.test(lineaNorm) &&
        !/[-\u2212]\s*\d+\s*[°cCfF]/.test(lineaNorm) &&
        !/\blote\b/i.test(lineaNorm)) {
      pts.push({ r: "sin_ctx_sospechoso", p: 10 }); score += 10;
    }

    return { token: c.tokenOriginal, lineaOrigen: c.lineaOrigen, score: score, detalle: pts };
  });
}

// â”€â”€â”€ NORMALIZACIÃ“N DE SALIDA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Formato uniforme: "920 g" Â· "1.5 kg" Â· "500 ml" Â· "4x2.5 kg"
// NÃºmero: separador decimal = punto, sin separador de miles, sin ceros finales.
// Unidad: forma corta normalizada (g, kg, ml, l, cl, dl, oz, lb).

function formatearNumero(n) {
  var r = Math.round(n * 10000) / 10000; // evita ruido flotante
  var s = r.toString();
  if (s.indexOf(".") !== -1) {
  s = s.replace(/\.?0+$/, ""); // elimina ceros finales: "1.50" -> "1.5", "1500.0" -> "1500"
  }
  return s;
}

function formatearSalida(candidato) {
  var u = candidato.unidadNorm;
  if (candidato.esMultipack) {
    // Multipack: "4x2.5 kg"
    var n1 = formatearNumero(candidato.valor1);
    var n2 = formatearNumero(candidato.valor2);
    return n1 + "x" + n2 + " " + u;
  }
  return formatearNumero(candidato.valorTotal) + " " + u;
}

// â”€â”€â”€ DECISIÃ“N FINAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Elige el representante de un cluster cercano (evidencias DESC, distancia a mediana ASC, limpieza ASC)
function elegirRepresentante(lista) {
  var vals = lista.map(function(c) { return c.valorNorm; }).sort(function(a, b) { return a - b; });
  var mediana = vals.length % 2 === 0
    ? (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2
    : vals[Math.floor(vals.length / 2)];
  var copia = lista.slice().sort(function(x, y) {
    if (y.evidencias !== x.evidencias) return y.evidencias - x.evidencias;
    var dx = Math.abs(x.valorNorm - mediana);
    var dy = Math.abs(y.valorNorm - mediana);
    if (Math.abs(dx - dy) > 0.01) return dx - dy;
    // "mÃ¡s limpio": valorTotal entero prefiere al decimal
    var xL = (x.valorTotal === Math.floor(x.valorTotal)) ? 0 : 1;
    var yL = (y.valorTotal === Math.floor(y.valorTotal)) ? 0 : 1;
    return xL - yL;
  });
  return copia[0];
}

function clusterCercano(lista, umbral) {
  if (lista.length < 2) return false;
  var vals = lista.map(function(c) { return c.valorNorm; });
  var minV  = Math.min.apply(null, vals);
  var maxV  = Math.max.apply(null, vals);
  return minV > 0 && (maxV - minV) / minV <= umbral;
}

function decidir(candidatos, textoLimpio) {
  if (candidatos.length === 0) {
    return { resultado: null, motivo: "ningún candidato", via: "sin_candidatos" };
  }

  // Colapsar duplicados equivalentes (bilingÃ¼e, misma cantidad expresada dos veces)
  var colapsados = colapsarDuplicados(candidatos);

  var a1 = colapsados.filter(function(c) { return c.clase === "A1"; });
  var a2 = colapsados.filter(function(c) { return c.clase === "A2"; });
  var b  = colapsados.filter(function(c) { return c.clase === "B";  });
  var cn = colapsados.filter(function(c) { return c.clase === "C";  });

  // â”€â”€â”€ VÃA A1 â€” escurrido explÃ­cito â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (a1.length === 1) {
    return { resultado: formatearSalida(a1[0]), motivo: "escurrido explícito", via: "clase_A1", candidatos: colapsados };
  }
  if (a1.length > 1) {
    var a1m = a1.filter(function(c) { return  c.esMultipack; });
    var a1s = a1.filter(function(c) { return !c.esMultipack; });

    // Multipack A1 confirmado por total equivalente (simÃ©trico a A2)
    if (a1m.length === 1 && a1s.length >= 1) {
      var totalMultiA1 = a1m[0].valorNorm;
      var confirmaA1   = a1s.some(function(c) { return Math.abs(c.valorNorm - totalMultiA1) < 2; });
      if (confirmaA1) {
        return { resultado: formatearSalida(a1m[0]), motivo: "multipack A1 confirmado por total equivalente", via: "clase_A1_multi", candidatos: colapsados };
      }
    }

    // Cluster A1 simples â‰¤5% â†’ mismo escurrido deformado por OCR/idioma
    if (a1s.length > 1 && clusterCercano(a1s, 0.05)) {
      var repA1 = elegirRepresentante(a1s);
    return { resultado: formatearSalida(repA1), motivo: "cluster A1 <=5%: representante por evidencia/mediana", via: "clase_A1", candidatos: colapsados };
    }

    // Spread >5% y sin multipack confirmado â†’ ambigÃ¼edad real â†’ campo vacÃ­o
    return { resultado: null, motivo: "varios A1 con valores muy distintos", via: "campo_vacio", candidatos: colapsados };
  }

  // â”€â”€â”€ VÃA A2 â€” neto explÃ­cito â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (a2.length === 1) {
    return { resultado: formatearSalida(a2[0]), motivo: "neto explícito", via: "clase_A2", candidatos: colapsados };
  }
  if (a2.length > 1) {
    var a2m = a2.filter(function(c) { return  c.esMultipack; });
    var a2s = a2.filter(function(c) { return !c.esMultipack; });

    // Multipack A2 confirmado por total equivalente
    if (a2m.length === 1 && a2s.length >= 1) {
      var totalMulti = a2m[0].valorNorm;
      var confirma   = a2s.some(function(c) { return Math.abs(c.valorNorm - totalMulti) < 2; });
      if (confirma) {
        return { resultado: formatearSalida(a2m[0]), motivo: "multipack A2 confirmado por total equivalente", via: "clase_A2_multi", candidatos: colapsados };
      }
    }

    // Cluster A2 simples â‰¤5% â†’ mismo neto deformado por OCR/idioma
    if (a2s.length > 1 && clusterCercano(a2s, 0.05)) {
      var repA2 = elegirRepresentante(a2s);
    return { resultado: formatearSalida(repA2), motivo: "cluster A2 <=5%: representante por evidencia/mediana", via: "clase_A2", candidatos: colapsados };
    }

    // Valores muy distintos â†’ ambigÃ¼edad real â†’ campo vacÃ­o
    return { resultado: null, motivo: "varios A2 con valores muy distintos", via: "campo_vacio", candidatos: colapsados };
  }

  // VÃA INFERENCIA â€” bruto(s) + neutro(s)
  // Regla: usar el B mÃ¡s pequeÃ±o (mÃ¡s prÃ³ximo al neto real)
  //        y el C mÃ¡s grande vÃ¡lido (< B, >= 50)
  if (b.length >= 1 && cn.length >= 1) {
    var bOrdenados = b.slice().sort(function(x, y) { return x.valorNorm - y.valorNorm; });
    var cOrdenados = cn.slice().sort(function(x, y) { return y.valorNorm - x.valorNorm; }); // desc

    var infResuelta = null;
    var cGanador    = null;
    for (var bi = 0; bi < bOrdenados.length && !infResuelta; bi++) {
      for (var ci = 0; ci < cOrdenados.length && !infResuelta; ci++) {
        var intento = inferenciaBrutoNeto(bOrdenados[bi], cOrdenados[ci]);
        if (intento.aplicable) { infResuelta = intento; cGanador = cOrdenados[ci]; }
      }
    }
    if (infResuelta && cGanador) {
      return { resultado: formatearSalida(cGanador), motivo: infResuelta.motivo, via: "inferencia_B_C", candidatos: colapsados };
    }
  }

  // â”€â”€â”€ VÃA SCORING â€” candidatos neutros sin resoluciÃ³n directa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (cn.length > 0) {
    var totalLineas = textoLimpio.split("\n").length;
    var scored = scoringNeutros(cn, totalLineas);
    scored.sort(function(a, b) { return b.score - a.score; });
    var g = scored[0], s = scored[1];
    if (g.score >= 30 && (!s || (g.score - s.score) >= 20)) {
      var cScoring = cn.filter(function(c) { return c.tokenOriginal === g.token; })[0] || cn[0];
      return { resultado: formatearSalida(cScoring), motivo: "scoring neutro: " + g.score + " pts", via: "scoring_C", candidatos: colapsados };
    }
    // Empate real entre neutros â†’ campo vacÃ­o. Los candidatos C son los mÃ¡s dÃ©biles;
    // si no hay desempate claro, no hay certeza suficiente.
    return { resultado: null, motivo: "empate entre neutros sin desempate claro", via: "campo_vacio", candidatos: colapsados };
  }

  // Solo bruto sin neto inferible â†’ campo vacÃ­o en resultado final.
  // El peso bruto no es el peso del producto; guardamos diagnÃ³stico para no perder el dato.
  if (b.length >= 1) {
    return {
      resultado:            null,
      motivo:               "solo bruto sin neto inferible",
      via:                  "campo_vacio",
      pesoBrutoDetectado:   formatearSalida(b[0]),
      candidatos:           colapsados
    };
  }

  return { resultado: null, motivo: "sin candidatos resolvibles", via: "campo_vacio", candidatos: colapsados };
}

// â”€â”€â”€ MOTOR PRINCIPAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function analizarMotorBoxer3(textoVision) {
  var textoEntrada = String(textoVision || "");
  var textoOCR = normalizarOCR(textoEntrada);
  var textoReparado = repararLineasCriticas(textoOCR);
  var textoFiltrado = filtroBasura(textoReparado);
  var textoLimpio = fusionarLineasPartidas(textoFiltrado);
  var extraccion = extraerCandidatos(textoLimpio);
  var consolidados = colapsarDuplicados(extraccion.candidatos);
  var decision = decidir(extraccion.candidatos, textoLimpio);
  var neutros = consolidados.filter(function(c) { return c.clase === "C"; });
  var totalLineas = textoLimpio ? textoLimpio.split("\n").length : 0;

  return {
    textoEntrada: textoEntrada,
    textoOCR: textoOCR,
    textoReparado: textoReparado,
    textoFiltrado: textoFiltrado,
    textoLimpio: textoLimpio,
    extraccion: extraccion,
    consolidados: consolidados,
    scoringNeutros: scoringNeutros(neutros, totalLineas),
    decision: decision
  };
}

function boxer3(textoVision) {
  console.log("===========================================");
  console.log("BOXER 3 v3");
  console.log("===========================================\n");

  var textoOCR = normalizarOCR(textoVision);
  if (textoOCR !== textoVision) {
    console.log("-- CAPA 0A: OCR --");
    var lo = textoVision.split("\n"), ln = textoOCR.split("\n");
    for (var z = 0; z < lo.length; z++) {
      if (lo[z] !== ln[z]) {
        console.log("  ANTES : \"" + lo[z].trim() + "\"");
        console.log("  AHORA : \"" + ln[z].trim() + "\"");
      }
    }
    console.log("");
  }

  var textoReparado = repararLineasCriticas(textoOCR);
  if (textoReparado !== textoOCR) {
    console.log("-- CAPA 0B: REPARACIÓN LÉXICA --");
    var lr0 = textoOCR.split("\n"), lr1 = textoReparado.split("\n");
    for (var zr = 0; zr < lr0.length; zr++) {
      if (lr0[zr] !== lr1[zr]) {
        console.log("  ANTES : \"" + lr0[zr].trim() + "\"");
        console.log("  AHORA : \"" + lr1[zr].trim() + "\"");
      }
    }
    console.log("");
  }

  var textoBruto   = filtroBasura(textoReparado);
  var textoLimpio  = fusionarLineasPartidas(textoBruto);

  console.log("-- FILTRO 1+2a: BASURA + FUSIÓN --");
  console.log(textoLimpio);
  console.log("");

  console.log("-- FILTRO 2b: CANDIDATOS --");
  var ext = extraerCandidatos(textoLimpio);
  ext.descartados.forEach(function(d) {
    console.log("  [D] \"" + d.token + "\" — " + d.motivo);
  });
  ext.candidatos.forEach(function(c) {
    console.log("  [" + c.clase + "] \"" + c.tokenOriginal + "\" (norm:" + c.valorNorm + " " + c.unidadNorm + ") | " + c.lineaOrigen);
  });
  console.log("");

  // Log consolidados
  var consolidados = colapsarDuplicados(ext.candidatos);
  if (consolidados.length !== ext.candidatos.length) {
  console.log("-- CONSOLIDADOS (" + ext.candidatos.length + " -> " + consolidados.length + ") --");
    consolidados.forEach(function(c) {
      console.log("  [" + c.clase + "] \"" + c.tokenOriginal + "\" ×" + c.evidencias + (c.evidencias > 1 ? " evidencias" : " evidencia") + " | " + c.lineaOrigen);
    });
    console.log("");
  }

  var dec = decidir(ext.candidatos, textoLimpio);
  console.log("-- DECISIÓN --");
  console.log("  Via       : " + dec.via);
  console.log("  Resultado : " + (dec.resultado || "campo vacío"));
  if (dec.pesoBrutoDetectado) {
    console.log("  Bruto     : " + dec.pesoBrutoDetectado + "  (solo bruto disponible, no es neto)");
  }
  console.log("  Motivo    : " + dec.motivo);
  console.log("===========================================\n");
}

// API publica del motor

var Boxer3MotorApi = {
  analizarMotorBoxer3: analizarMotorBoxer3,
  boxer3: boxer3,
  normalizarOCR: normalizarOCR,
  repararLineasCriticas: repararLineasCriticas,
  filtroBasura: filtroBasura,
  fusionarLineasPartidas: fusionarLineasPartidas,
  extraerCandidatos: extraerCandidatos,
  colapsarDuplicados: colapsarDuplicados,
  inferenciaBrutoNeto: inferenciaBrutoNeto,
  scoringNeutros: scoringNeutros,
  formatearSalida: formatearSalida,
  decidir: decidir
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = Boxer3MotorApi;
}
if (typeof globalThis !== "undefined") {
  globalThis.Boxer3Motor = Boxer3MotorApi;
}
// Pruebas de laboratorio separadas de la app final.



;/* END ../ia/boxer3_motor.js */

;/* BEGIN ../ia/Boxer4_Motor.js */
'use strict';

let catalogoAlergenos = null;
try {
  catalogoAlergenos = require("../shared/alergenos_oficiales.js");
} catch (errRequire) {
  if (typeof globalThis !== "undefined" && globalThis.AppV2AlergenosOficiales) {
    catalogoAlergenos = globalThis.AppV2AlergenosOficiales;
  }
}

/**
 * Boxer4_Alergenos Â· v2.2
 * Motor de reconocimiento de alÃ©rgenos â€” cÃ³digo dominante, sin IA operativa.
 *
 * Entrada:  paquete con textoAuditado (string) desde Cerebro_Orquestador
 * Salida:   JSON estructurado contrato 00B v4.1
 *
 * Doctrina: el cÃ³digo cierra siempre. Ante duda, activa y degrada. Nunca se bloquea.
 */

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 1A. BLOQUEOS GLOBALES DE PRODUCTO
//     Si cualquiera de estas frases aparece en el texto, el alÃ©rgeno queda
//     bloqueado en TODO el producto. No puede activarse en ninguna otra parte.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BLOQUEOS_GLOBALES = {
  altramuces: [
    'sin altramuces','libre de altramuces','no contiene altramuz',
    'lupin free','free from lupin','contains no lupin',
  ],
  apio: [
    'sin apio','libre de apio','no contiene apio',
    'celery free','free from celery','contains no celery',
  ],
  cacahuetes: [
    'sin cacahuetes','sin mani','libre de cacahuetes','no contiene cacahuetes',
    'peanut free','free from peanuts','contains no peanuts','groundnut free',
  ],
  crustaceos: [
    'sin crustaceos','libre de crustaceos','no contiene crustaceos',
    'crustacean free','free from crustaceans','contains no crustaceans',
  ],
  frutos_secos: [
    'sin frutos secos','libre de frutos secos','no contiene frutos secos',
    'nut free','tree nut free','free from nuts','contains no nuts',
  ],
  gluten: [
    'sin gluten','libre de gluten','no contiene gluten',
    'apto celiacos','apto para celiacos','certificado sin gluten','producto sin gluten',
    'gluten free','free from gluten','no gluten','contains no gluten',
    'suitable for coeliacs','suitable for celiacs',
    'glutenfrei','senza glutine','sem gluten','isento de gluten',
    'sans gluten',
  ],
  huevos: [
    'sin huevo','sin huevos','libre de huevo','no contiene huevo',
    'egg free','free from eggs','no eggs','contains no egg',
    'eierfrei','senza uova','sem ovos','sans oeufs',
  ],
  lacteos: [
    'sin lacteos','libre de lacteos','no contiene lacteos',
    'sin leche','libre de leche','no contiene leche',
    'dairy free','milk free','free from dairy','free from milk','contains no milk',
    'milchfrei','senza latte','sem leite','sans lait',
  ],
  moluscos: [
    'sin moluscos','libre de moluscos','no contiene moluscos',
    'mollusc free','mollusk free','free from molluscs','free from mollusks',
    'senza molluschi','sem moluscos','sans mollusques',
  ],
  mostaza: [
    'sin mostaza','libre de mostaza','no contiene mostaza',
    'mustard free','free from mustard','contains no mustard',
    'senfrei','senza senape','sem mostarda','sans moutarde',
  ],
  pescado: [
    'sin pescado','libre de pescado','no contiene pescado',
    'fish free','free from fish','contains no fish',
    'fischfrei','senza pesce','sem peixe','sans poisson',
  ],
  sesamo: [
    'sin sesamo','libre de sesamo','no contiene sesamo',
    'sesame free','free from sesame','contains no sesame',
    'sesamfrei','senza sesamo','sem sesamo','sans sesame',
  ],
  soja: [
    'sin soja','sin soya','libre de soja','no contiene soja',
    'soy free','soya free','free from soy','free from soya','contains no soy',
    'sojafrei','senza soia','sem soja','sans soja',
  ],
  sulfitos: [
    'sin sulfitos','libre de sulfitos','no contiene sulfitos',
    'sulphite free','sulfite free','free from sulphites','free from sulfites',
    'sulfitfrei','senza solfiti','sem sulfitos','sans sulfites',
  ],
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 1B. EXCLUSIONES LOCALES (subclaims)
//     Estas frases NO bloquean toda la familia. Solo excluyen su zona concreta.
//     Ejemplo: "sin lactosa" no apaga toda la familia lacteos.
//     Ejemplo: "sin trigo" no apaga toda la familia gluten.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const EXCLUSIONES_LOCALES = {
  lacteos: [
    'sin lactosa','libre de lactosa','no contiene lactosa',
    'apto intolerantes a la lactosa',
    'sin caseina','libre de caseina',
    'sin suero de leche',
    'lactose free','free from lactose',
    'laktosefrei','senza lattosio','sem lactose','sans lactose',
  ],
  gluten: [
    'sin trigo','libre de trigo','no contiene trigo',
    'sin cebada','libre de cebada',
    'sin avena','libre de avena',
    'wheat free','barley free','oat free',
    'weizenfrei','sem trigo',
  ],
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 2. DICCIONARIO DE FAMILIAS (singular y plural explÃ­citos)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const FAMILIAS = {
  altramuces: [
    'altramuz','altramuces','lupino','lupinos',
    'harina de altramuz','semilla de altramuz','semillas de altramuz',
    'lupin','lupins','lupin seed','lupin seeds','lupin flour','lupin bean','lupin beans',
    'graines de lupin','farine de lupin',
    'lupine','lupinen','lupinenmehl','lupinensamen',
    'semi di lupino','farina di lupino',
    'tremoco','tremocos','farinha de tremoco',
  ],
  apio: [
    'apio','semilla de apio','semillas de apio','sal de apio','raiz de apio','apio silvestre',
    'celery','celeriac','celery seed','celery seeds','celery salt','celery root',
    'celeri','graines de celeri','sel de celeri','celeri-rave',
    'sellerie','selleriesamen','selleriesalz','knollensellerie',
    'sedano','semi di sedano','sale di sedano','sedano rapa',
    'aipo','sal de aipo','raiz de aipo',
  ],
  cacahuetes: [
    'cacahuete','cacahuetes','mani','cacahuate','cacahuates',
    'mantequilla de cacahuete','aceite de cacahuete',
    'peanut','peanuts','groundnut','groundnuts','monkey nut','monkey nuts',
    'peanut butter','peanut oil',
    'arachide','arachides','beurre d arachide','huile d arachide',
    'erdnuss','erdnusse','erdnussbutter','erdnussol',
    'arachidi','burro di arachidi','olio di arachidi',
    'amendoim','amendoins','manteiga de amendoim',
  ],
  crustaceos: [
    'crustaceo','crustaceos',
    'cangrejo','cangrejos','gamba','gambas','langosta','langostas',
    'langostino','langostinos','bogavante','bogavantes',
    'percebe','percebes','necora','necoras','buey de mar',
    'cigala','cigalas','camaron','camarones','centollo','centollos',
    'crab','crabs','prawn','prawns','shrimp','shrimps',
    'lobster','lobsters','crayfish','barnacle','barnacles','scampi',
    'crabe','crabes','crevette','crevettes','homard','homards',
    'langouste','langoustes','langoustine','langoustines',
    'krabbe','krabben','garnele','garnelen','hummer','flusskrebs',
    'granchio','granchi','gambero','gamberi','aragosta','aragoste',
    'camarao','camaroes','lagosta','lagostas','lagostim','lagostins',
  ],
  frutos_secos: [
    'almendra','almendras','avellana','avellanas','nuez','nueces',
    'anacardo','anacardos','pistacho','pistachos',
    'nuez de macadamia','nuez de brasil','nuez pecana','nueces pecanas','nuez de caju',
    'almond','almonds','hazelnut','hazelnuts','walnut','walnuts',
    'cashew','cashews','pistachio','pistachios','macadamia','macadamias',
    'brazil nut','brazil nuts','pecan','pecan nut','pecan nuts','queensland nut',
    'amande','amandes','noisette','noisettes','noix','noix de cajou',
    'pistache','pistaches',
    'mandel','mandeln','haselnuss','haselnusse','walnuss','walnusse',
    'pistazie','pistazien',
    'mandorla','mandorle','nocciola','nocciole','noce','noci',
    'anacardio','anacardi','pistacchio','pistacchi',
    'amendoa','amendoas','avela','noz','castanha de caju',
    'frutos secos','tree nuts','fruits a coque','frutta a guscio',
    'schalenfruchte','frutos de casca rija',
  ],
  gluten: [
    'gluten','trigo','espelta','kamut','cebada','centeno','avena','triticale',
    'harina de trigo','harina de cebada','harina de centeno','harina de espelta',
    'semola','malta','almidon de trigo','salvado de trigo','germen de trigo',
    'proteina de trigo',
    'wheat','spelt','barley','rye','oats','malt',
    'wheat flour','wheat starch','wheat bran','wheat germ','wheat protein',
    'barley malt','rye flour','oat flour',
    'ble','epeautre','orge','seigle','avoine','farine de ble','amidon de ble',
    'weizen','dinkel','gerste','roggen','hafer',
    'weizenmehl','weizenstarke','malz','gerstenmalz',
    'frumento','farro','orzo','segale','farina di frumento','amido di frumento','malto',
    'cevada','centeio','farinha de trigo','amido de trigo','malte',
  ],
  huevos: [
    'huevo','huevos','yema','yemas','clara','claras de huevo',
    'albumina','ovoalbumina','lisozima','lecitina de huevo',
    'egg','eggs','yolk','yolks','egg white','egg whites',
    'albumin','ovalbumin','lysozyme','egg lecithin',
    'oeuf','oeufs','jaune d oeuf','blanc d oeuf','albumine',
    'ei','eier','eigelb','eiweiss','albumin','lysozym',
    'uovo','uova','tuorlo','tuorli','albume','albumina',
    'ovo','ovos','gema','gemas','clara de ovo',
  ],
  lacteos: [
    'leche','lactosa','caseina','suero de leche','mantequilla','nata',
    'queso','yogur','yogures','lactosuero','lactoalbumina',
    'lactoglobulina','leche desnatada','leche en polvo',
    'proteina de leche','grasa lactea','leche entera','leche semidesnatada',
    'milk','lactose','casein','whey','butter','cream','cheese','yoghurt','yogurt',
    'skimmed milk','milk powder','lactalbumin','lactoglobulin','milk protein','dairy',
    'whole milk','semi skimmed milk','buttermilk',
    'lait','caseine','petit-lait','beurre','creme','fromage','lait ecreme',
    'milch','laktose','kasein','molke','sahne','kase','milchpulver',
    'vollmilch','magermilch','buttermilch',
    'latte','lattosio','siero di latte','burro','panna','formaggio','latte scremato',
    'leite','soro de leite','manteiga','natas','queijo','leite em po',
  ],
  moluscos: [
    'molusco','moluscos',
    'almeja','almejas','mejillon','mejillones','ostra','ostras',
    'calamar','calamares','pulpo','pulpos','caracol','caracoles',
    'berberecho','berberechos','navaja','navajas','vieira','vieiras',
    'clam','clams','mussel','mussels','oyster','oysters',
    'squid','octopus','snail','snails','cockle','cockles',
    'razor clam','razor clams','scallop','scallops',
    'palourde','palourdes','moule','moules','huitre','huitres',
    'calmar','calmars','poulpe','escargot','escargots',
    'muschel','muscheln','auster','austern','tintenfisch','oktopus','schnecke','schnecken',
    'vongola','vongole','cozza','cozze','ostrica','ostriche',
    'calamaro','calamari','polpo','polpi','lumaca','lumache','capesante',
    'ameijoa','mexilhao','lula','polvo de mar',
  ],
  mostaza: [
    'mostaza','semilla de mostaza','semillas de mostaza',
    'harina de mostaza','aceite de mostaza',
    'mustard','mustard seed','mustard seeds','mustard flour','mustard powder','mustard oil',
    'moutarde','graine de moutarde','graines de moutarde','farine de moutarde',
    'senf','senfkorner','senfmehl','senfpulver','senfol',
    'senape','seme di senape','semi di senape','farina di senape','olio di senape',
    'mostarda','semente de mostarda','sementes de mostarda',
  ],
  pescado: [
    'pescado','pescados',
    'anchoa','anchoas','salmon','bacalao','atun','merluza',
    'boqueron','boquerones','sardina','sardinas','arenque','arenques',
    'colin','trucha','truchas','lenguado','lubina','dorada','rodaballo',
    'fish','anchovy','anchovies','salmon','cod','tuna','hake',
    'sardine','sardines','herring','herrings','pollock','trout',
    'sole','sea bass','sea bream','turbot',
    'poisson','anchois','saumon','morue','thon','merlan','hareng',
    'fisch','sardelle','lachs','kabeljau','thunfisch','hering','scholle','forelle',
    'pesce','acciuga','acciughe','salmone','merluzzo','tonno','aringa',
    'peixe','anchova','anchovas','salmao','bacalhau','atum','sardinhas',
  ],
  sesamo: [
    'sesamo','semilla de sesamo','semillas de sesamo',
    'tahini','tahina','pasta de sesamo','aceite de sesamo',
    'sesame','sesame seed','sesame seeds','sesame oil',
    'graines de sesame','huile de sesame',
    'sesam','sesamsamen','sesamol','sesampaste',
    'semi di sesamo','olio di sesamo',
    'sementes de sesamo','oleo de sesamo',
  ],
  soja: [
    'soja','soya','tofu','tempeh','miso',
    'proteina de soja','lecitina de soja','edamame',
    'harina de soja','aceite de soja','salsa de soja',
    'soy','soybean','soybeans','soy protein','soy lecithin',
    'soy flour','soy sauce','tamari',
    'lecithine de soja','sauce soja',
    'sojaprotein','sojalecithin','sojasauce','sojaol','sojamehl',
    'proteina di soia','lecitina di soia','salsa di soia',
    'proteina de soja','molho de soja',
  ],
  sulfitos: [
    'sulfito','sulfitos','dioxido de azufre','metabisulfito','bisulfito',
    'e220','e221','e222','e223','e224','e225','e226','e227','e228',
    'sulphite','sulphites','sulfite','sulfites',
    'sulfur dioxide','sulphur dioxide','metabisulphite','bisulphite','so2',
    'dioxyde de soufre','metabisulfite',
    'schwefeldioxid','metabisulfit',
    'anidride solforosa','metabisolfito','solfito','solfiti',
    'dioxido de enxofre','metabissulfito',
  ],
};

const ORDEN_ALFABETICO = (
  catalogoAlergenos &&
  Array.isArray(catalogoAlergenos.NOMBRES_OFICIALES)
)
  ? catalogoAlergenos.NOMBRES_OFICIALES.slice()
  : [
      'altramuces','apio','cacahuetes','crustaceos',
      'frutos_secos','gluten','huevos','lacteos',
      'moluscos','mostaza','pescado','sesamo','soja','sulfitos',
    ];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 3. UTILIDADES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escaparRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Detecta texto degradado: >35% de palabras rotas (< 3 letras, no conectores) */
const CONECTORES = new Set([
  'de','la','el','en','y','a','o','con','sin','por','para','del','al',
  'su','un','una','los','las','of','the','and','in','or','with','le',
  'et','du','au','di','da','e','i',
]);

function textoPareceDegradado(textoNorm) {
  const palabras = textoNorm.split(/\s+/).filter(w => w.length > 0);
  if (palabras.length < 5) return false;
  const rotas = palabras.filter(w => w.length < 3 && !CONECTORES.has(w));
  return (rotas.length / palabras.length) > 0.35;
}

/** Elimina Ãºnicamente duplicados idÃ©nticos. Conserva todas las evidencias vÃ¡lidas. */
function compactarEvidencias(lista) {
  // Solo elimina cadenas exactamente iguales (case-insensitive).
  // No elimina evidencias mÃ¡s cortas aunque sean subcadena de otra mÃ¡s larga:
  // "trigo" e "harina de trigo" son dos evidencias distintas y ambas son vÃ¡lidas.
  const vistas = new Set();
  return lista.filter(e => {
    const n = normalizar(e);
    if (vistas.has(n)) return false;
    vistas.add(n);
    return true;
  });
}

function buscarCoincidencias(textoOriginal, textoFiltrado, terminoNorm) {
  const escapado = escaparRegex(terminoNorm);
  const regex = new RegExp(`(?<![a-z0-9])${escapado}(?![a-z0-9])`, 'g');
  const resultados = [];
  let match;
  while ((match = regex.exec(textoFiltrado)) !== null) {
    const fragmento = textoOriginal.substring(match.index, match.index + match[0].length);
    resultados.push(fragmento);
  }
  return resultados;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 4. FILTRO DE EXCLUSIÃ“N â€” dos capas
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Capa A: detecta claims globales de producto.
 * Devuelve un Set con los alÃ©rgenos bloqueados en todo el texto.
 */
function detectarBloqueosGlobales(textoNorm) {
  const bloqueados = new Set();
  const bloqueosDetectados = {}; // { alergeno: 'frase que lo bloqueÃ³' }
  for (const [alergeno, frases] of Object.entries(BLOQUEOS_GLOBALES)) {
    for (const frase of frases) {
      const fraseNorm = normalizar(frase);
      const escapado = escaparRegex(fraseNorm);
      const regex = new RegExp(`(?<![a-z0-9])${escapado}(?![a-z0-9])`);
      if (regex.test(textoNorm)) {
        bloqueados.add(alergeno);
        bloqueosDetectados[alergeno] = frase;
        break;
      }
    }
  }
  return { bloqueados, bloqueosDetectados };
}

/**
 * Capa B: exclusiones locales (subclaims).
 * Sustituye la frase concreta por espacios para que el reconocedor no la vea.
 * No bloquea el alÃ©rgeno completo.
 */
function aplicarExclusionesLocales(textoNorm) {
  let textoFiltrado = textoNorm;
  const zonasExcluidas = [];

  for (const [alergeno, frases] of Object.entries(EXCLUSIONES_LOCALES)) {
    for (const frase of frases) {
      const fraseNorm = normalizar(frase);
      const escapado = escaparRegex(fraseNorm);
      const regex = new RegExp(`(?<![a-z0-9])${escapado}(?![a-z0-9])`, 'g');
      let match;
      while ((match = regex.exec(textoFiltrado)) !== null) {
        zonasExcluidas.push({ alergeno, frase, posicion: match.index });
        textoFiltrado =
          textoFiltrado.substring(0, match.index) +
          ' '.repeat(match[0].length) +
          textoFiltrado.substring(match.index + match[0].length);
      }
    }
  }

  return { textoFiltrado, zonasExcluidas };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 5. RECONOCEDOR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Ãndice de colisiÃ³n: tÃ©rminos presentes en mÃ¡s de una familia.
// Construido una sola vez al cargar el mÃ³dulo.
const INDICE_COLISION = (() => {
  const mapa = {};
  for (const [alergeno, terminos] of Object.entries(FAMILIAS)) {
    for (const t of terminos) {
      const tn = normalizar(t);
      if (!mapa[tn]) mapa[tn] = [];
      mapa[tn].push(alergeno);
    }
  }
  const colisiones = new Set();
  for (const [tn, familias] of Object.entries(mapa)) {
    if (familias.length > 1) colisiones.add(tn);
  }
  return colisiones;
})();

function reconocerAlergenos(textoOriginal, textoFiltrado) {
  const resultado = {};
  let colisionDetectada = false;

  for (const alergeno of ORDEN_ALFABETICO) {
    const terminos = [...FAMILIAS[alergeno]].sort((a, b) => b.length - a.length);
    const evidenciasRaw = [];

    for (const termino of terminos) {
      const terminoNorm = normalizar(termino);
      const encontradas = buscarCoincidencias(textoOriginal, textoFiltrado, terminoNorm);
      if (encontradas.length > 0 && INDICE_COLISION.has(terminoNorm)) {
        colisionDetectada = true;
      }
      evidenciasRaw.push(...encontradas);
    }

    const sinDuplicados = [...new Set(evidenciasRaw)];
    const evidencias = compactarEvidencias(sinDuplicados);
    resultado[alergeno] = { valor: evidencias.length > 0 ? 1 : 0, evidencias };
  }

  return { resultado, colisionDetectada };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 6. MOTOR PRINCIPAL â€” exportable como mÃ³dulo
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Boxer4_Alergenos(paqueteEntrada) {
  const { textoAuditado, analysisId, traceId } = paqueteEntrada;
  const tInicio = Date.now();

  // ValidaciÃ³n â€” contrato 00B v4.1: error con tipoFallo y retryable
  if (!textoAuditado || textoAuditado.trim() === '') {
    return {
      ok: false,
      resultado: {
        estadoPasaporteModulo: 'ROJO',
        modulo: 'Boxer4_Alergenos',
        accionSugeridaParaCerebro: 'abortar_flujo',
        elapsedMs: Date.now() - tInicio,
        traceId: traceId || null,
        datos: {},
      },
      error: {
        code: 'B4_SIN_TEXTO',
        origin: 'Boxer4_Alergenos',
        passport: 'ROJO',
        message: 'textoAuditado llegÃ³ vacÃ­o o nulo.',
        tipoFallo: 'irrecuperable_por_diseÃ±o',
        retryable: false,
        motivo: 'Sin texto no hay anÃ¡lisis posible.',
      },
    };
  }

  // PASO 1 â€” Normalizar
  const textoNorm = normalizar(textoAuditado);

  // PASO 2 â€” Detectar texto degradado
  const textoDegradado = textoPareceDegradado(textoNorm);

  // PASO 3A â€” Detectar bloqueos globales de producto
  const { bloqueados: bloqueadosGlobales, bloqueosDetectados } = detectarBloqueosGlobales(textoNorm);

  // PASO 3B â€” Aplicar exclusiones locales (subclaims)
  const { textoFiltrado, zonasExcluidas } = aplicarExclusionesLocales(textoNorm);

  // PASO 4 â€” Reconocimiento sobre texto con exclusiones locales aplicadas
  const { resultado: reconocido, colisionDetectada } = reconocerAlergenos(textoAuditado, textoFiltrado);

  // PASO 5 â€” Construir resultadoLocal
  // Si un alÃ©rgeno estÃ¡ en bloqueadosGlobales â†’ forzar 0
  const alergenos = {};
  const evidencias = {};

  for (const alergeno of ORDEN_ALFABETICO) {
    if (bloqueadosGlobales.has(alergeno)) {
      alergenos[alergeno] = 0;
    } else {
      const datos = reconocido[alergeno];
      alergenos[alergeno] = datos.valor;
      if (datos.valor === 1) {
        evidencias[alergeno] = datos.evidencias;
      }
    }
  }

  // PASO 6 â€” Pasaporte
  const sinTokens = textoAuditado.trim().split(/\s+/).filter(w => /[a-zÃ¡Ã©Ã­Ã³ÃºÃ¼Ã±]/i.test(w)).length === 0;
  const requiereRevision = textoDegradado || colisionDetectada;
  const elapsedMs = Date.now() - tInicio;

  // ROJO: no hay base real para analizar â†’ fallo real, ok: false, datos vacÃ­os
  if (sinTokens) {
    return {
      ok: false,
      resultado: {
        estadoPasaporteModulo: 'ROJO',
        modulo: 'Boxer4_Alergenos',
        accionSugeridaParaCerebro: 'abortar_flujo',
        elapsedMs,
        traceId: traceId || null,
        datos: {},
      },
      error: {
        code: 'B4_SIN_BASE_ANALISIS',
        origin: 'Boxer4_Alergenos',
        passport: 'ROJO',
        message: 'El texto no contiene tokens analizables. No hay base real para clasificar alÃ©rgenos.',
        tipoFallo: 'irrecuperable_por_diseÃ±o',
        retryable: false,
        motivo: 'Sin tokens Ãºtiles el motor no puede producir un resultado vÃ¡lido.',
      },
    };
  }

  let estadoPasaporteModulo;
  if (requiereRevision) estadoPasaporteModulo = 'NARANJA';
  else estadoPasaporteModulo = 'VERDE';

  const confidence = estadoPasaporteModulo === 'VERDE' ? 'alta' : 'media';

  // PASO 7 â€” Salida con contrato 00B v4.1
  const resultado = {
    estadoPasaporteModulo,
    modulo: 'Boxer4_Alergenos',
    elapsedMs,
    traceId: traceId || null,
    datos: {
      modulo: 'Boxer4_Alergenos',
      estadoIA: 'NO_NECESITA_LLAMADA',
      tareasIA: [],
      resultadoLocal: {
        analysisId: analysisId || null,
        alergenos,
        evidencias,
        requiereRevision,
        confidence,
        bloqueadosGlobales: [...bloqueadosGlobales],
        bloqueosDetectados,
        zonasExcluidas,
      },
    },
  };

  if (estadoPasaporteModulo === 'NARANJA') {
    resultado.accionSugeridaParaCerebro = 'continuar_y_marcar_revision';
    resultado.warning = 'Texto degradado o colisiÃ³n entre familias detectada.';
  }

  return { ok: true, resultado, error: null };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { Boxer4_Alergenos };
}
if (typeof globalThis !== "undefined") {
  globalThis.Boxer4Motor = { Boxer4_Alergenos: Boxer4_Alergenos };
}

;/* END ../ia/Boxer4_Motor.js */

;/* BEGIN ../ia/boxer2_contratos.js */
(function initBoxer2ContratosModule(globalScope) {
  "use strict";

  var MODULE_NAME = "Boxer2_Identidad";
  var CONTRACT_VERSION = "BOXER_PLUG_V2";
  var LEGACY_CONTRACT_VERSION = "BOXER_PLUG_V1";
  var MODULES = Object.freeze({
    CEREBRO: "Cerebro_Orquestador",
    BOXER2: MODULE_NAME
  });
  var ACTIONS = Object.freeze({
    RESOLVER_IDENTIDAD: "resolver_identidad_producto"
  });
  var PASSPORTS = Object.freeze({
    VERDE: "VERDE",
    NARANJA: "NARANJA",
    ROJO: "ROJO"
  });
  var CONFIDENCE = Object.freeze({
    ALTA: "alta",
    MEDIA: "media",
    BAJA: "baja"
  });
  var IA_STATES = Object.freeze({
    NECESITA_LLAMADA: "NECESITA_LLAMADA",
    NO_NECESITA_LLAMADA: "NO_NECESITA_LLAMADA",
    NO_APLICA: "NO_APLICA",
    PENDIENTE_LOCAL: "PENDIENTE_LOCAL"
  });
  var TASK_DEFINITIONS = Object.freeze({
    IDENTIDAD: {
      TASK_ID: "b2_n01",
      TIPO_TAREA: "B2_IDENTIDAD_V1",
      SCHEMA_ID: "B2_IDENTIDAD_V1"
    }
  });
  var SUGGESTED_ACTIONS = Object.freeze({
    GUARDAR_RESULTADO_ANALIZADO: "guardar_resultado_analizado",
    CONTINUAR_Y_MARCAR_REVISION: "continuar_y_marcar_revision",
    ABRIR_REVISION: "abrir_revision",
    BLOQUEAR_GUARDADO: "bloquear_guardado",
    ABORTAR_FLUJO: "abortar_flujo"
  });

  function asPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeConfidence(value) {
    var safe = String(value || "").trim().toLowerCase();
    if (safe === CONFIDENCE.ALTA || safe === CONFIDENCE.MEDIA || safe === CONFIDENCE.BAJA) return safe;
    return CONFIDENCE.MEDIA;
  }

  function normalizeIaState(value) {
    var safe = String(value || "").trim().toUpperCase();
    if (
      safe === IA_STATES.NECESITA_LLAMADA ||
      safe === IA_STATES.NO_NECESITA_LLAMADA ||
      safe === IA_STATES.NO_APLICA ||
      safe === IA_STATES.PENDIENTE_LOCAL
    ) {
      return safe;
    }
    return IA_STATES.NO_NECESITA_LLAMADA;
  }

  function normalizeLineas(list) {
    if (!Array.isArray(list)) return [];
    return list.map(function each(item) {
      return normalizeText(item);
    }).filter(Boolean);
  }

  function normalizeBloques(list) {
    if (!Array.isArray(list)) return [];
    return list.map(function each(item, index) {
      var safe = asPlainObject(item) ? item : {};
      return {
        texto: normalizeText(safe.texto),
        orden: Number.isFinite(Number(safe.orden)) ? Number(safe.orden) : index,
        tipoBloqueSugerido: normalizeText(safe.tipoBloqueSugerido) || null,
        origenBloque: normalizeText(safe.origenBloque) || null
      };
    }).filter(function keep(item) {
      return !!item.texto;
    });
  }

  function normalizeMetadatos(raw) {
    var safe = asPlainObject(raw) ? raw : {};
    return {
      marcaDetectada: normalizeText(safe.marcaDetectada) || null,
      contenedor: normalizeText(safe.contenedor) || null,
      idiomaProbable: normalizeText(safe.idiomaProbable).toLowerCase() || null,
      origen: normalizeText(safe.origen) || null
    };
  }

  function normalizeIncomingRequest(request) {
    var safeRequest = asPlainObject(request) ? request : {};
    var rawMeta = asPlainObject(safeRequest.meta) ? safeRequest.meta : {};
    var rawData = asPlainObject(safeRequest.datos) ? safeRequest.datos : {};

    return {
      moduloOrigen: normalizeText(safeRequest.moduloOrigen),
      moduloDestino: normalizeText(safeRequest.moduloDestino),
      accion: normalizeText(safeRequest.accion),
      sessionToken: normalizeText(safeRequest.sessionToken),
      meta: {
        versionContrato: normalizeText(rawMeta.versionContrato || CONTRACT_VERSION) || CONTRACT_VERSION,
        analysisId: normalizeText(rawMeta.analysisId),
        traceId: normalizeText(rawMeta.traceId),
        batchId: rawMeta.batchId == null ? null : normalizeText(rawMeta.batchId),
        modoEjecucion: normalizeText(rawMeta.modoEjecucion).toLowerCase() || "fase5"
      },
      datos: {
        textoAuditado: String(rawData.textoAuditado || "").trim(),
        textoBaseVision: String(rawData.textoBaseVision || "").trim(),
        lineasOCR: normalizeLineas(rawData.lineasOCR),
        bloquesOCR: normalizeBloques(rawData.bloquesOCR),
        metadatosOpcionales: normalizeMetadatos(rawData.metadatosOpcionales),
        roiRefsRevision: Array.isArray(rawData.roiRefsRevision) ? rawData.roiRefsRevision : []
      }
    };
  }

  function validateIncomingRequest(request) {
    var normalized = normalizeIncomingRequest(request);

    if (normalized.moduloOrigen !== MODULES.CEREBRO) {
      return {
        ok: false,
        code: "B2_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloOrigen debe ser Cerebro_Orquestador.",
        detail: { moduloOrigen: normalized.moduloOrigen || null }
      };
    }
    if (normalized.moduloDestino !== MODULES.BOXER2) {
      return {
        ok: false,
        code: "B2_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloDestino debe ser Boxer2_Identidad.",
        detail: { moduloDestino: normalized.moduloDestino || null }
      };
    }
    if (normalized.accion !== ACTIONS.RESOLVER_IDENTIDAD) {
      return {
        ok: false,
        code: "B2_CONTRATO_ENTRADA_INVALIDO",
        message: "accion invalida para Boxer2.",
        detail: { accion: normalized.accion || null }
      };
    }
    if (!normalized.sessionToken) {
      return {
        ok: false,
        code: "B2_CONTRATO_ENTRADA_INVALIDO",
        message: "Falta sessionToken.",
        detail: {}
      };
    }
    if (
      normalized.meta.versionContrato !== CONTRACT_VERSION &&
      normalized.meta.versionContrato !== LEGACY_CONTRACT_VERSION
    ) {
      return {
        ok: false,
        code: "B2_CONTRATO_ENTRADA_INVALIDO",
        message: "versionContrato invalida.",
        detail: { versionContrato: normalized.meta.versionContrato || null }
      };
    }
    if (!normalized.meta.analysisId || !normalized.meta.traceId) {
      return {
        ok: false,
        code: "B2_CONTRATO_ENTRADA_INVALIDO",
        message: "analysisId y traceId son obligatorios en Boxer2.",
        detail: {
          analysisId: normalized.meta.analysisId || null,
          traceId: normalized.meta.traceId || null
        }
      };
    }
    if (!normalized.datos.textoAuditado && !normalized.datos.textoBaseVision && !normalized.datos.lineasOCR.length && !normalized.datos.bloquesOCR.length) {
      return {
        ok: false,
        code: "B2_IDENTIDAD_VACIA",
        message: "Falta texto para resolver identidad.",
        detail: {}
      };
    }

    return {
      ok: true,
      normalized: normalized
    };
  }

  var api = {
    MODULE_NAME: MODULE_NAME,
    CONTRACT_VERSION: CONTRACT_VERSION,
    MODULES: MODULES,
    ACTIONS: ACTIONS,
    PASSPORTS: PASSPORTS,
    CONFIDENCE: CONFIDENCE,
    IA_STATES: IA_STATES,
    TASK_DEFINITIONS: TASK_DEFINITIONS,
    SUGGESTED_ACTIONS: SUGGESTED_ACTIONS,
    normalizeConfidence: normalizeConfidence,
    normalizeIaState: normalizeIaState,
    normalizeIncomingRequest: normalizeIncomingRequest,
    validateIncomingRequest: validateIncomingRequest,
    asPlainObject: asPlainObject,
    normalizeText: normalizeText
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer2Contratos = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../ia/boxer2_contratos.js */

;/* BEGIN ../ia/boxer2_errores.js */
(function initBoxer2ErroresModule(globalScope) {
  "use strict";

  var contratos = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./boxer2_contratos.js");
    } catch (errRequire) {
      contratos = null;
    }
  }
  if (!contratos && globalScope && globalScope.Boxer2Contratos) {
    contratos = globalScope.Boxer2Contratos;
  }

  var MODULE_NAME = contratos ? contratos.MODULE_NAME : "Boxer2_Identidad";
  var PASSPORTS = contratos ? contratos.PASSPORTS : { VERDE: "VERDE", NARANJA: "NARANJA", ROJO: "ROJO" };
  var CONFIDENCE = contratos ? contratos.CONFIDENCE : { ALTA: "alta", MEDIA: "media", BAJA: "baja" };
  var IA_STATES = contratos ? contratos.IA_STATES : {
    NECESITA_LLAMADA: "NECESITA_LLAMADA",
    NO_NECESITA_LLAMADA: "NO_NECESITA_LLAMADA",
    NO_APLICA: "NO_APLICA",
    PENDIENTE_LOCAL: "PENDIENTE_LOCAL"
  };
  var SUGGESTED_ACTIONS = contratos ? contratos.SUGGESTED_ACTIONS : {
    CONTINUAR_Y_MARCAR_REVISION: "continuar_y_marcar_revision",
    ABRIR_REVISION: "abrir_revision",
    BLOQUEAR_GUARDADO: "bloquear_guardado",
    ABORTAR_FLUJO: "abortar_flujo"
  };

  var ERROR_CODES = Object.freeze({
    NOMBRE_NO_DETECTADO: "B2_NOMBRE_NO_DETECTADO",
    IDENTIDAD_VACIA: "B2_IDENTIDAD_VACIA",
    NO_SEGURO: "B2_NO_SEGURO",
    SALIDA_IA_INVALIDA: "B2_SALIDA_IA_INVALIDA",
    SHORTLIST_VACIA: "B2_SHORTLIST_VACIA",
    IDIOMA_NO_RESUELTO: "B2_IDIOMA_NO_RESUELTO",
    CONTRATO_ENTRADA_INVALIDO: "B2_CONTRATO_ENTRADA_INVALIDO"
  });

  function buildFailureEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    var passport = String(safeOptions.passport || PASSPORTS.ROJO).trim().toUpperCase() || PASSPORTS.ROJO;
    return {
      modulo: safeContext.moduleName || MODULE_NAME,
      estadoIA: safeOptions.estadoIA || IA_STATES.NO_NECESITA_LLAMADA,
      tareasIA: Array.isArray(safeOptions.tareasIA) ? safeOptions.tareasIA : [],
      resultadoLocal: {
        analysisId: safeContext.analysisId || null,
        estadoPasaporteModulo: passport,
        accionSugeridaParaCerebro: safeOptions.suggestedAction || SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        confidence: safeOptions.confidence || CONFIDENCE.BAJA,
        requiereRevision: true,
        datos: safeOptions.datos || {},
        error: {
          code: safeOptions.code || ERROR_CODES.NO_SEGURO,
          origin: safeContext.moduleName || MODULE_NAME,
          passport: passport,
          message: safeOptions.message || "Fallo Boxer2.",
          tipoFallo: safeOptions.tipoFallo || "desconocido",
          retryable: !!safeOptions.retryable
        },
        metricas: safeContext.metricas || null
      },
      elapsedMs: Math.max(0, Number(safeContext.elapsedMs) || 0),
      traceId: safeContext.traceId || null
    };
  }

  var api = {
    ERROR_CODES: ERROR_CODES,
    buildFailureEnvelope: buildFailureEnvelope
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer2Errores = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../ia/boxer2_errores.js */

;/* BEGIN ../ia/boxer2_identidad.js */
(function initBoxer2IdentidadModule(globalScope) {
  "use strict";

  var contratos = null;
  var errores = null;

  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./boxer2_contratos.js");
      errores = require("./boxer2_errores.js");
    } catch (errRequire) {
      contratos = null;
      errores = null;
    }
  }

  if (!contratos && globalScope && globalScope.Boxer2Contratos) contratos = globalScope.Boxer2Contratos;
  if (!errores && globalScope && globalScope.Boxer2Errores) errores = globalScope.Boxer2Errores;

  var MODULE_NAME = contratos.MODULE_NAME;
  var PASSPORTS = contratos.PASSPORTS;
  var CONFIDENCE = contratos.CONFIDENCE;
  var IA_STATES = contratos.IA_STATES;
  var TASK_DEFINITIONS = contratos.TASK_DEFINITIONS;
  var ACTIONS = contratos.ACTIONS;
  var SUGGESTED_ACTIONS = contratos.SUGGESTED_ACTIONS;
  var ERROR_CODES = errores.ERROR_CODES;

  var SCORE_RULES = Object.freeze({
    COMMERCIAL_BLOCK: 48,
    UNKNOWN_BLOCK: 24,
    CLAIM_BLOCK: 8,
    EARLY_ZONE: 18,
    NEAR_TOP_ZONE: 10,
    IDEAL_WORDS: 16,
    ACCEPTABLE_WORDS: 8,
    NO_DIGITS: 10,
    NO_WEIGHT: 8,
    TITLE_SHAPE: 8,
    NATURAL_FUSION: 6,
    BRAND_HINT: 6,
    INGREDIENTS_PENALTY: -70,
    NUTRITION_PENALTY: -70,
    LEGAL_PENALTY: -55,
    STORAGE_PENALTY: -45,
    CLAIM_PENALTY: -18,
    WEIGHT_PENALTY: -25,
    DIGIT_PENALTY: -10,
    LONG_PENALTY: -16,
    COMMA_PENALTY: -18,
    TECHNICAL_STEP: -8,
    BAD_ORIGIN_PENALTY: -15
  });

  var KNOWN_LANGS = ["es", "fr", "en", "it", "pt"];
  var LANGUAGE_HINTS = Object.freeze({
    es: ["ingredientes", "contiene", "mostaza", "aceitunas", "queso", "sabor", "conservar"],
    fr: ["ingredients", "moutarde", "ancienne", "fromage", "olive", "conserver"],
    en: ["ingredients", "mustard", "cheese", "olive", "contains", "keep"],
    it: ["ingredienti", "senape", "antica", "formaggio", "olive", "conservare"],
    pt: ["ingredientes", "mostarda", "antiga", "queijo", "azeitonas", "conservar"]
  });

  var PHRASE_TRANSLATIONS = Object.freeze({
    fr: {
      "moutarde ancienne": "mostaza antigua",
      "olives vertes": "aceitunas verdes",
      "fromage affine": "queso curado",
      "fromage affinee": "queso curado"
    },
    en: {
      "old fashioned mustard": "mostaza antigua",
      "traditional mustard": "mostaza tradicional",
      "green olives": "aceitunas verdes",
      "cured cheese": "queso curado"
    },
    it: {
      "senape antica": "mostaza antigua",
      "olive verdi": "aceitunas verdes",
      "formaggio stagionato": "queso curado"
    },
    pt: {
      "mostarda antiga": "mostaza antigua",
      "azeitonas verdes": "aceitunas verdes",
      "queijo curado": "queso curado"
    }
  });

  var TOKEN_TRANSLATIONS = Object.freeze({
    fr: {
      moutarde: "mostaza",
      ancienne: "antigua",
      traditionnelle: "tradicional",
      olives: "aceitunas",
      olive: "aceituna",
      vertes: "verdes",
      verte: "verde",
      fromage: "queso",
      affine: "curado",
      affinee: "curado"
    },
    en: {
      mustard: "mostaza",
      old: "antigua",
      fashioned: "antigua",
      traditional: "tradicional",
      green: "verdes",
      olives: "aceitunas",
      olive: "aceituna",
      cured: "curado",
      cheese: "queso"
    },
    it: {
      senape: "mostaza",
      antica: "antigua",
      tradizionale: "tradicional",
      olive: "aceitunas",
      verdi: "verdes",
      formaggio: "queso",
      stagionato: "curado"
    },
    pt: {
      mostarda: "mostaza",
      antiga: "antigua",
      tradicional: "tradicional",
      azeitonas: "aceitunas",
      verdes: "verdes",
      queijo: "queso",
      curado: "curado"
    }
  });

  var ACCENT_FIXES = Object.freeze({
    bunuelos: "buñuelos",
    pate: "paté",
    iberico: "ibérico",
    clasico: "clásico",
    clasica: "clásica",
    organico: "orgánico",
    alinadas: "aliñadas",
    aliniadas: "aliñadas"
  });

  var SPANISH_LOWERCASE_WORDS = Object.freeze({
    a: true,
    al: true,
    con: true,
    de: true,
    del: true,
    e: true,
    el: true,
    en: true,
    la: true,
    las: true,
    los: true,
    para: true,
    por: true,
    sin: true,
    y: true
  });

  var WEIGHT_PATTERN = /\b\d{1,4}(?:[.,]\d{1,2})?\s?(?:kg|g|mg|l|ml|cl|ud|uds|unidades|capsulas|capsules|pack|x)\b/i;
  var INGREDIENTS_PATTERN = /^(ingredientes?|ingredients?|ingredienti|ingr[eé]dients?)\b|\b(contiene|contains|puede contener|may contain|trazas?|traces?)\b/i;
  var NUTRITION_PATTERN = /^(informacion nutricional|informaci[oó]n nutricional|declaracion nutricional|declaraci[oó]n nutricional|nutrition facts|nutrition|valor energ[eé]tico|energia|grasas|lipidos|hidratos|proteinas|proteins|salt|sal)\b/i;
  var LEGAL_PATTERN = /^(fabricado por|producido por|producido para|distribuido por|distributed by|importado por|direcci[oó]n|address|registro sanitario|registro|lote)\b/i;
  var STORAGE_PATTERN = /\b(preferentemente antes|best before|consumir preferentemente|conservar|mantener|frigorifico|frigor[ií]fico|keep refrigerated|store in)\b/i;
  var CLAIM_PATTERN = /^(sin gluten|gluten free|bio|eco|vegan|vegano|vegana|alto en|rich in|fuente de)\b/i;

  function nowMs() {
    return Date.now();
  }

  function generateId(prefix) {
    return String(prefix || "b2") + "_" + Math.random().toString(36).slice(2, 10);
  }

  function startOperation(meta) {
    var safeMeta = meta || {};
    return {
      analysisId: safeMeta.analysisId || "",
      traceId: safeMeta.traceId || "",
      startedAt: nowMs(),
      eventos: []
    };
  }

  function elapsedSince(startedAt) {
    return Math.max(0, nowMs() - Number(startedAt || nowMs()));
  }

  function pushEvent(metricCtx, level, code, message, detail) {
    if (!metricCtx) return;
    metricCtx.eventos.push({
      level: level,
      code: code,
      message: message,
      detail: detail || null,
      elapsedMs: elapsedSince(metricCtx.startedAt),
      traceId: metricCtx.traceId
    });
  }

  function finalizeMetricas(metricCtx, extra) {
    var safe = metricCtx || {};
    var addon = extra || {};
    return {
      traceId: safe.traceId || null,
      analysisId: safe.analysisId || null,
      elapsedMs: elapsedSince(safe.startedAt),
      totalEventos: Array.isArray(safe.eventos) ? safe.eventos.length : 0,
      totalCandidatos: addon.totalCandidatos || 0,
      modoResolucion: addon.modoResolucion || "ninguno_claro",
      iaUsada: !!addon.iaUsada,
      eventos: Array.isArray(safe.eventos) ? safe.eventos : []
    };
  }

  function stripMarks(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function collapseText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeCompareText(value) {
    return stripMarks(value).replace(/[^a-z0-9]+/g, " ").trim();
  }

  function splitWords(value) {
    return collapseText(value).split(/\s+/).filter(Boolean);
  }

  function splitTextLines(text) {
    var raw = String(text || "").replace(/\r/g, "").split(/\n+/);
    if (raw.length <= 1) {
      raw = String(text || "").split(/[.;]+/);
    }
    return raw.map(function each(item) {
      return collapseText(item);
    }).filter(Boolean);
  }

  function cleanupCandidateText(text) {
    var cleaned = String(text || "")
      .replace(/^[\-•·*\s]+/, "")
      .replace(/[|]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[,:;]+$/g, "")
      .trim();

    cleaned = cleaned.replace(/\b(?:\d{1,4}(?:[.,]\d{1,2})?\s?(?:kg|g|mg|l|ml|cl|ud|uds|x))\b/gi, " ");
    cleaned = cleaned.replace(/\b(?:sin gluten|gluten free|bio|eco|vegan|vegano|vegana)\b/gi, " ");
    cleaned = collapseText(cleaned);

    if (/^[^a-zA-ZÀ-ÿ]*$/.test(cleaned)) return "";
    return cleaned;
  }

  function inferLanguage(structure, metadata) {
    var hint = metadata && metadata.idiomaProbable ? String(metadata.idiomaProbable).toLowerCase() : "";
    if (KNOWN_LANGS.indexOf(hint) >= 0) return hint;

    var base = normalizeCompareText((structure.textoAuditado || "") + " " + (structure.textoBaseVision || ""));
    if (!base) return "desconocido";

    var bestLang = "desconocido";
    var bestScore = 0;
    var lang;
    var i;
    for (lang in LANGUAGE_HINTS) {
      if (!Object.prototype.hasOwnProperty.call(LANGUAGE_HINTS, lang)) continue;
      var score = 0;
      for (i = 0; i < LANGUAGE_HINTS[lang].length; i += 1) {
        if (base.indexOf(normalizeCompareText(LANGUAGE_HINTS[lang][i])) >= 0) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestLang = lang;
      }
    }
    return bestScore > 0 ? bestLang : "desconocido";
  }

  function reconstructStructure(normalizedInput) {
    var datos = normalizedInput.datos || {};
    var lineas = Array.isArray(datos.lineasOCR) ? datos.lineasOCR.slice() : [];
    if (!lineas.length) {
      lineas = splitTextLines(datos.textoAuditado || datos.textoBaseVision || "");
    }

    var bloques = Array.isArray(datos.bloquesOCR) ? datos.bloquesOCR.slice() : [];
    if (!bloques.length) {
      bloques = lineas.map(function each(linea, index) {
        return {
          texto: linea,
          orden: index,
          tipoBloqueSugerido: null,
          origenBloque: lineas.length ? "reconstruido_desde_linea" : "reconstruido_desde_texto"
        };
      });
    }

    return {
      textoAuditado: String(datos.textoAuditado || "").trim(),
      textoBaseVision: String(datos.textoBaseVision || "").trim(),
      lineasOCR: lineas,
      bloquesOCR: bloques,
      metadatosOpcionales: datos.metadatosOpcionales || {}
    };
  }

  function classifyEntry(text, order) {
    var safeText = collapseText(text);
    var lower = stripMarks(safeText);
    var wordCount = splitWords(safeText).length;
    var commaCount = (safeText.match(/,/g) || []).length;
    var kind = "desconocido";
    var discard = false;
    var badOrigin = false;
    var contamination = 0;

    if (!safeText) {
      return null;
    }

    if (INGREDIENTS_PATTERN.test(lower) || (commaCount >= 2 && /:/.test(safeText))) {
      kind = "ingredientes";
      discard = true;
      badOrigin = true;
      contamination = 4;
    } else if (NUTRITION_PATTERN.test(lower)) {
      kind = "nutricional";
      discard = true;
      badOrigin = true;
      contamination = 4;
    } else if (LEGAL_PATTERN.test(lower)) {
      kind = "legal";
      discard = true;
      badOrigin = true;
      contamination = 3;
    } else if (STORAGE_PATTERN.test(lower)) {
      kind = "conservacion";
      discard = true;
      badOrigin = true;
      contamination = 3;
    } else if (WEIGHT_PATTERN.test(safeText) && wordCount <= 3) {
      kind = "peso";
      discard = true;
      badOrigin = true;
      contamination = 3;
    } else if (CLAIM_PATTERN.test(lower)) {
      kind = "claim";
      discard = false;
      badOrigin = false;
      contamination = 2;
    } else if (Number(order) <= 2 && wordCount >= 1 && wordCount <= 8 && !/[,:]/.test(safeText)) {
      kind = "comercial";
    }

    return {
      text: safeText,
      normalized: normalizeCompareText(safeText),
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
      kind: kind,
      discard: discard,
      badOrigin: badOrigin,
      technicalContamination: contamination,
      commaCount: commaCount,
      wordCount: wordCount
    };
  }

  function buildEntries(structure) {
    var rawEntries = [];
    var bloques = Array.isArray(structure.bloquesOCR) ? structure.bloquesOCR : [];
    var i;
    if (bloques.length) {
      for (i = 0; i < bloques.length; i += 1) {
        var bloque = bloques[i] || {};
        var entry = classifyEntry(bloque.texto, bloque.orden);
        if (entry) rawEntries.push(entry);
      }
      return rawEntries;
    }

    var lines = Array.isArray(structure.lineasOCR) ? structure.lineasOCR : [];
    for (i = 0; i < lines.length; i += 1) {
      var lineEntry = classifyEntry(lines[i], i);
      if (lineEntry) rawEntries.push(lineEntry);
    }
    return rawEntries;
  }

  function makeCandidate(text, baseEntry, metadata, isFusion) {
    var literal = cleanupCandidateText(text);
    if (!literal) return null;

    var normalized = normalizeCompareText(literal);
    var words = splitWords(literal);
    if (!normalized || !words.length || words.length > 9) return null;

    var brandNormalized = metadata && metadata.marcaDetectada ? normalizeCompareText(metadata.marcaDetectada) : "";
    return {
      id: generateId("cand"),
      literal: literal,
      normalized: normalized,
      order: baseEntry.order,
      sourceKind: baseEntry.kind,
      badOrigin: !!baseEntry.badOrigin,
      fromIngredients: baseEntry.kind === "ingredientes",
      fromNutrition: baseEntry.kind === "nutricional",
      technicalContamination: baseEntry.technicalContamination,
      containsWeight: WEIGHT_PATTERN.test(literal),
      containsDigits: /\d/.test(literal),
      commaCount: (literal.match(/,/g) || []).length,
      wordCount: words.length,
      usefulLength: words.join("").length,
      isFusion: !!isFusion,
      metadataBrandMatch: !!(brandNormalized && normalized.indexOf(brandNormalized) >= 0),
      score: 0,
      scoreBreakdown: [],
      tieBreakReason: null
    };
  }

  function buildCandidates(entries, metadata) {
    var candidates = [];
    var seen = Object.create(null);
    var i;

    for (i = 0; i < entries.length; i += 1) {
      var entry = entries[i];
      if (!entry || entry.discard) continue;
      var candidate = makeCandidate(entry.text, entry, metadata, false);
      if (!candidate || seen[candidate.normalized]) continue;
      seen[candidate.normalized] = true;
      candidates.push(candidate);
    }

    for (i = 0; i < entries.length - 1; i += 1) {
      var current = entries[i];
      var next = entries[i + 1];
      if (!current || !next || current.discard || next.discard) continue;
      if (next.order !== current.order + 1) continue;
      if (current.technicalContamination > 1 || next.technicalContamination > 1) continue;
      var fusionText = cleanupCandidateText(current.text + " " + next.text);
      var fusionWords = splitWords(fusionText);
      if (!fusionText || fusionWords.length < 2 || fusionWords.length > 8) continue;
      var fusionBase = {
        order: current.order,
        kind: current.kind === "comercial" ? current.kind : next.kind,
        badOrigin: current.badOrigin || next.badOrigin,
        technicalContamination: current.technicalContamination + next.technicalContamination
      };
      var fusion = makeCandidate(fusionText, fusionBase, metadata, true);
      if (!fusion || seen[fusion.normalized]) continue;
      seen[fusion.normalized] = true;
      candidates.push(fusion);
    }

    return candidates;
  }

  function addScore(candidate, label, value) {
    candidate.score += value;
    candidate.scoreBreakdown.push({ factor: label, value: value });
  }

  function scoreCandidate(candidate) {
    candidate.score = 0;
    candidate.scoreBreakdown = [];

    if (candidate.sourceKind === "comercial") addScore(candidate, "bloque_comercial", SCORE_RULES.COMMERCIAL_BLOCK);
    else if (candidate.sourceKind === "claim") addScore(candidate, "bloque_claim", SCORE_RULES.CLAIM_BLOCK);
    else addScore(candidate, "bloque_neutro", SCORE_RULES.UNKNOWN_BLOCK);

    if (candidate.order <= 1) addScore(candidate, "zona_cabecera", SCORE_RULES.EARLY_ZONE);
    else if (candidate.order <= 3) addScore(candidate, "zona_superior", SCORE_RULES.NEAR_TOP_ZONE);

    if (candidate.wordCount >= 2 && candidate.wordCount <= 6) addScore(candidate, "longitud_ideal", SCORE_RULES.IDEAL_WORDS);
    else if (candidate.wordCount <= 8) addScore(candidate, "longitud_aceptable", SCORE_RULES.ACCEPTABLE_WORDS);
    else addScore(candidate, "demasiado_largo", SCORE_RULES.LONG_PENALTY);

    if (!candidate.containsDigits) addScore(candidate, "sin_digitos", SCORE_RULES.NO_DIGITS);
    else addScore(candidate, "con_digitos", SCORE_RULES.DIGIT_PENALTY);

    if (!candidate.containsWeight) addScore(candidate, "sin_peso", SCORE_RULES.NO_WEIGHT);
    else addScore(candidate, "con_peso", SCORE_RULES.WEIGHT_PENALTY);

    if (/^[A-Za-zÀ-ÿ\s]+$/.test(candidate.literal)) addScore(candidate, "forma_titulo", SCORE_RULES.TITLE_SHAPE);
    if (candidate.isFusion) addScore(candidate, "fusion_natural", SCORE_RULES.NATURAL_FUSION);
    if (candidate.metadataBrandMatch) addScore(candidate, "marca_detectada", SCORE_RULES.BRAND_HINT);

    if (candidate.sourceKind === "ingredientes") addScore(candidate, "penaliza_ingredientes", SCORE_RULES.INGREDIENTS_PENALTY);
    if (candidate.sourceKind === "nutricional") addScore(candidate, "penaliza_nutricional", SCORE_RULES.NUTRITION_PENALTY);
    if (candidate.sourceKind === "legal") addScore(candidate, "penaliza_legal", SCORE_RULES.LEGAL_PENALTY);
    if (candidate.sourceKind === "conservacion") addScore(candidate, "penaliza_conservacion", SCORE_RULES.STORAGE_PENALTY);
    if (candidate.sourceKind === "claim") addScore(candidate, "penaliza_claim", SCORE_RULES.CLAIM_PENALTY);
    if (candidate.badOrigin) addScore(candidate, "origen_malo", SCORE_RULES.BAD_ORIGIN_PENALTY);
    if (candidate.commaCount >= 2) addScore(candidate, "muchas_comas", SCORE_RULES.COMMA_PENALTY);
    if (candidate.technicalContamination > 0) addScore(candidate, "contaminacion_tecnica", SCORE_RULES.TECHNICAL_STEP * candidate.technicalContamination);

    return candidate;
  }

  function compareTieBreakDetailed(a, b) {
    if (!!a.fromIngredients !== !!b.fromIngredients) {
      return { value: a.fromIngredients ? 1 : -1, reason: "no_ingredientes" };
    }
    if (!!a.fromNutrition !== !!b.fromNutrition) {
      return { value: a.fromNutrition ? 1 : -1, reason: "no_nutricional" };
    }
    if (a.order !== b.order) {
      return { value: a.order < b.order ? -1 : 1, reason: "arriba_lectura" };
    }
    if (a.usefulLength !== b.usefulLength) {
      return { value: a.usefulLength > b.usefulLength ? -1 : 1, reason: "mayor_longitud_util" };
    }
    if (a.technicalContamination !== b.technicalContamination) {
      return { value: a.technicalContamination < b.technicalContamination ? -1 : 1, reason: "menor_contaminacion" };
    }
    return { value: 0, reason: "orden_lectura_estable" };
  }

  function sortCandidates(candidates) {
    return candidates.slice().sort(function sort(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      var tie = compareTieBreakDetailed(a, b);
      return tie.value;
    });
  }

  function confidenceFromScore(score) {
    if (score >= 90) return CONFIDENCE.ALTA;
    if (score >= 70) return CONFIDENCE.MEDIA;
    return CONFIDENCE.BAJA;
  }

  function resolveLocally(ranked) {
    var top = ranked[0] || null;
    var second = ranked[1] || null;
    if (!top) {
      return { resolved: false, reason: ERROR_CODES.NOMBRE_NO_DETECTADO };
    }

    if (!second) {
      if (top.score >= 70 && !top.badOrigin) {
        return {
          resolved: true,
          candidate: top,
          mode: "local",
          reason: "ganador_unico",
          confidence: confidenceFromScore(top.score)
        };
      }
      return { resolved: false, reason: ERROR_CODES.NO_SEGURO };
    }

    var margin = top.score - second.score;
    if (top.score >= 70 && margin >= 15 && !top.badOrigin) {
      return {
        resolved: true,
        candidate: top,
        mode: "local",
        reason: "ganador_claro",
        confidence: confidenceFromScore(top.score)
      };
    }

    if (top.score === second.score && top.score >= 70 && !top.badOrigin) {
      var tie = compareTieBreakDetailed(top, second);
      top.tieBreakReason = tie.reason;
      if (tie.reason !== "orden_lectura_estable") {
        return {
          resolved: true,
          candidate: top,
          mode: "local",
          reason: "desempate_" + tie.reason,
          confidence: CONFIDENCE.MEDIA
        };
      }
    }

    return {
      resolved: false,
      reason: ERROR_CODES.NO_SEGURO,
      margin: margin,
      top: top,
      second: second
    };
  }

  function buildShortlist(ranked) {
    return ranked.slice(0, 3).map(function each(candidate, index) {
      return {
        id: "candidato_" + (index + 1),
        literal: candidate.literal,
        candidate: candidate
      };
    });
  }

  function applyPhraseTranslation(text, lang) {
    var map = PHRASE_TRANSLATIONS[lang] || {};
    var normalized = normalizeCompareText(text);
    return map[normalized] || null;
  }

  function fixSpanishToken(token) {
    var normalized = stripMarks(token);
    if (Object.prototype.hasOwnProperty.call(ACCENT_FIXES, normalized)) {
      return ACCENT_FIXES[normalized];
    }
    return token;
  }

  function translateToSpanish(text, lang, metadata) {
    var original = collapseText(text);
    if (!original) return "";
    if (!lang || lang === "es" || lang === "desconocido") return original;

    var phrase = applyPhraseTranslation(original, lang);
    if (phrase) return phrase;

    var brandName = metadata && metadata.marcaDetectada ? collapseText(metadata.marcaDetectada) : "";
    var brandCompare = normalizeCompareText(brandName);
    var tokenMap = TOKEN_TRANSLATIONS[lang] || {};
    var tokens = splitWords(original);
    var out = [];
    var i;

    for (i = 0; i < tokens.length; i += 1) {
      var token = tokens[i];
      var compare = normalizeCompareText(token);
      if (brandCompare && compare === brandCompare) {
        out.push(brandName);
      } else if (tokenMap[compare]) {
        out.push(tokenMap[compare]);
      } else {
        out.push(stripMarks(token));
      }
    }

    return collapseText(out.join(" "));
  }

  function normalizeFinalName(text, lang, metadata) {
    var translated = translateToSpanish(text, lang, metadata);
    var cleaned = cleanupCandidateText(translated || text);
    cleaned = cleaned.replace(/\b(?:fabricado|producido|ingredientes|nutrition|contains|contiene)\b.*$/i, "");
    cleaned = collapseText(cleaned);
    if (!cleaned) return "";

    var brandName = metadata && metadata.marcaDetectada ? collapseText(metadata.marcaDetectada) : "";
    var brandCompare = normalizeCompareText(brandName);
    var words = splitWords(cleaned);
    var out = [];
    var i;

    for (i = 0; i < words.length; i += 1) {
      var originalWord = words[i];
      var word = fixSpanishToken(originalWord);
      var compare = normalizeCompareText(word);
      if (brandCompare && compare === brandCompare) {
        out.push(brandName);
      } else if (i > 0 && SPANISH_LOWERCASE_WORDS[compare]) {
        out.push(word.toLowerCase());
      } else if (/^[A-Z0-9]{2,4}$/.test(originalWord) && !Object.prototype.hasOwnProperty.call(ACCENT_FIXES, normalizeCompareText(originalWord)) && !SPANISH_LOWERCASE_WORDS[compare]) {
        out.push(originalWord);
      } else {
        var lower = word.toLowerCase();
        if (i === 0) out.push(lower.charAt(0).toUpperCase() + lower.slice(1));
        else out.push(lower);
      }
    }

    return collapseText(out.join(" "));
  }

  function buildCandidateView(candidate) {
    return {
      literal: candidate.literal,
      score: candidate.score,
      origen: candidate.sourceKind,
      banderaRoja: !!candidate.badOrigin,
      detalleScore: candidate.scoreBreakdown
    };
  }

  function normalizeIaResponse(raw) {
    var safeRaw = raw || {};
    var payload = safeRaw && safeRaw.data ? safeRaw.data : safeRaw;
    if (payload && payload.resultado) payload = payload.resultado;
    if (payload && payload.data) payload = payload.data;
    if (payload && payload.respuesta) payload = payload.respuesta;
    if (!contratos.asPlainObject(payload)) {
      return { ok: false, code: ERROR_CODES.SALIDA_IA_INVALIDA, message: "IA Boxer2 no devolvio JSON util." };
    }

    var decision = collapseText(payload.decision || "");
    var nombre = collapseText(payload.nombre_comercial_es || payload.nombreComercialEs || "");
    var literal = collapseText(payload.literal_origen || payload.literalOrigen || "");
    var confidence = contratos.normalizeConfidence(payload.confidence || CONFIDENCE.MEDIA);
    var motivo = collapseText(payload.motivo_duda || payload.motivoDuda || "");

    if (!decision) {
      return { ok: false, code: ERROR_CODES.SALIDA_IA_INVALIDA, message: "IA Boxer2 no devolvio decision." };
    }

    return {
      ok: true,
      taskId: collapseText(safeRaw.taskId || payload.taskId || ""),
      analysisId: collapseText(safeRaw.analysisId || payload.analysisId || ""),
      traceId: collapseText(safeRaw.traceId || payload.traceId || ""),
      tipoTarea: collapseText(safeRaw.tipoTarea || payload.tipoTarea || ""),
      schemaId: collapseText(safeRaw.schemaId || payload.schemaId || ""),
      decision: decision,
      nombre: nombre,
      literal: literal,
      confidence: confidence,
      motivo: motivo
    };
  }

  function serializeShortlist(shortlist) {
    return shortlist.map(function each(item) {
      return {
        id: item.id,
        literal: item.literal
      };
    });
  }

  function buildPromptFuncional(shortlist) {
    var resumen = serializeShortlist(shortlist).map(function each(item) {
      return item.id + ": " + item.literal;
    }).join("; ");
    return "Elige solo un candidato de la shortlist o responde ninguno_claro. Devuelve JSON con decision, nombre_comercial_es, literal_origen, confidence y motivo_duda. Shortlist: " + resumen;
  }

  function buildIaTask(shortlist, structure, idioma, context) {
    return {
      analysisId: context.analysisId,
      traceId: context.traceId,
      taskId: TASK_DEFINITIONS.IDENTIDAD.TASK_ID,
      moduloSolicitante: MODULE_NAME,
      tipoTarea: TASK_DEFINITIONS.IDENTIDAD.TIPO_TAREA,
      schemaId: TASK_DEFINITIONS.IDENTIDAD.SCHEMA_ID,
      payload: {
        textoAuditado: structure.textoAuditado || structure.textoBaseVision || "",
        idiomaProbable: idioma,
        shortlist: serializeShortlist(shortlist),
        promptFuncional: buildPromptFuncional(shortlist)
      },
      respuestaEsperada: {
        formato: "json",
        campos: ["decision", "nombre_comercial_es", "literal_origen", "confidence", "motivo_duda"]
      }
    };
  }

  function buildMetricasForEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    if (safeContext.metricCtx) {
      return finalizeMetricas(safeContext.metricCtx, {
        totalCandidatos: safeOptions.totalCandidatos || 0,
        modoResolucion: safeOptions.datos ? safeOptions.datos.modoResolucion : "ninguno_claro",
        iaUsada: !!safeOptions.iaUsada
      });
    }
    return safeContext.metricas || null;
  }

  function buildEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    var elapsedMs = safeContext.metricCtx
      ? elapsedSince(safeContext.metricCtx.startedAt)
      : Math.max(0, Number(safeContext.elapsedMs) || 0);
    var metricas = buildMetricasForEnvelope(safeContext, safeOptions);
    return {
      modulo: MODULE_NAME,
      estadoIA: contratos.normalizeIaState(safeOptions.estadoIA || IA_STATES.NO_NECESITA_LLAMADA),
      tareasIA: Array.isArray(safeOptions.tareasIA) ? safeOptions.tareasIA : [],
      resultadoLocal: {
        analysisId: safeContext.analysisId || null,
        traceId: safeContext.traceId || null,
        modulo: MODULE_NAME,
        elapsedMs: elapsedMs,
        estadoPasaporteModulo: safeOptions.passport || PASSPORTS.VERDE,
        accionSugeridaParaCerebro: safeOptions.suggestedAction || SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO,
        confidence: safeOptions.confidence || CONFIDENCE.MEDIA,
        requiereRevision: !!safeOptions.requiresRevision,
        datos: safeOptions.datos || {},
        error: safeOptions.error || null,
        metricas: metricas
      },
      elapsedMs: elapsedMs,
      traceId: safeContext.traceId
    };
  }

  function buildSuccessEnvelope(context, options) {
    return buildEnvelope(context, options || {});
  }

  function buildPendingIaEnvelope(context, options) {
    var safeOptions = options || {};
    return buildEnvelope(context, {
      estadoIA: IA_STATES.NECESITA_LLAMADA,
      tareasIA: safeOptions.tareasIA || [],
      passport: safeOptions.passport || PASSPORTS.NARANJA,
      suggestedAction: safeOptions.suggestedAction || SUGGESTED_ACTIONS.CONTINUAR_Y_MARCAR_REVISION,
      confidence: safeOptions.confidence || CONFIDENCE.MEDIA,
      requiresRevision: true,
      totalCandidatos: safeOptions.totalCandidatos || 0,
      datos: safeOptions.datos || {}
    });
  }

  function buildCloseContext(resultadoLocal) {
    var safeLocal = contratos.asPlainObject(resultadoLocal) ? resultadoLocal : {};
    return {
      moduleName: MODULE_NAME,
      analysisId: safeLocal.analysisId || null,
      traceId: safeLocal.traceId || null,
      elapsedMs: Math.max(0, Number(safeLocal.elapsedMs) || 0),
      metricas: safeLocal.metricas || null
    };
  }

  function B2_cerrarConSubrespuestaIA(subrespuesta, resultadoLocal) {
    var safeLocal = contratos.asPlainObject(resultadoLocal) ? resultadoLocal : {};
    var context = buildCloseContext(safeLocal);
    var datos = contratos.asPlainObject(safeLocal.datos) ? safeLocal.datos : {};
    var contextoIA = contratos.asPlainObject(datos.contextoIA) ? datos.contextoIA : {};
    var shortlist = Array.isArray(contextoIA.shortlist) ? contextoIA.shortlist : [];
    var idioma = contextoIA.idiomaOrigen || datos.idiomaOrigen || "desconocido";
    var metadata = {
      marcaDetectada: contextoIA.marcaDetectada || null
    };
    var normalized = normalizeIaResponse(subrespuesta);

    if (!normalized.ok) {
      return errores.buildFailureEnvelope(context, {
        code: normalized.code,
        message: normalized.message,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }

    if (normalized.taskId && normalized.taskId !== TASK_DEFINITIONS.IDENTIDAD.TASK_ID) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "taskId invalido en cierre IA Boxer2.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.analysisId && context.analysisId && normalized.analysisId !== context.analysisId) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "analysisId invalido en cierre IA Boxer2.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.traceId && context.traceId && normalized.traceId !== context.traceId) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "traceId invalido en cierre IA Boxer2.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.tipoTarea && normalized.tipoTarea !== TASK_DEFINITIONS.IDENTIDAD.TIPO_TAREA) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "tipoTarea invalido en cierre IA Boxer2.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.schemaId && normalized.schemaId !== TASK_DEFINITIONS.IDENTIDAD.SCHEMA_ID) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "schemaId invalido en cierre IA Boxer2.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (!shortlist.length) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "No hay shortlist local para cerrar IA Boxer2.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }

    if (normalized.decision === "ninguno_claro") {
      return buildSuccessEnvelope(context, {
        estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        confidence: normalized.confidence || CONFIDENCE.BAJA,
        requiresRevision: true,
        iaUsada: true,
        datos: {
          nombrePropuesto: datos.nombrePropuesto || "",
          nombre: datos.nombre || "",
          literalDetectado: datos.literalDetectado || "",
          idiomaOrigen: idioma,
          candidatosEvaluados: Array.isArray(datos.candidatosEvaluados) ? datos.candidatosEvaluados : [],
          modoResolucion: "ninguno_claro",
          confidence: normalized.confidence || CONFIDENCE.BAJA,
          requiereRevision: true,
          motivoDuda: normalized.motivo || ERROR_CODES.NO_SEGURO,
          conflictoIdentidad: true,
          dudas: [normalized.motivo || ERROR_CODES.NO_SEGURO],
          alertas: [ERROR_CODES.NO_SEGURO]
        }
      });
    }

    var chosen = null;
    for (var i = 0; i < shortlist.length; i += 1) {
      if (shortlist[i].id === normalized.decision) {
        chosen = shortlist[i];
        break;
      }
    }
    if (!chosen) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SALIDA_IA_INVALIDA,
        message: "IA Boxer2 eligio un candidato fuera de la shortlist.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }

    var literal = normalized.literal || chosen.literal;
    var nombre = normalizeFinalName(normalized.nombre || literal, idioma, metadata) || normalizeFinalName(literal, idioma, metadata) || literal;
    var confidence = normalized.confidence || CONFIDENCE.MEDIA;

    return buildSuccessEnvelope(context, {
      estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
      passport: confidence === CONFIDENCE.BAJA ? PASSPORTS.NARANJA : PASSPORTS.VERDE,
      suggestedAction: confidence === CONFIDENCE.BAJA ? SUGGESTED_ACTIONS.ABRIR_REVISION : SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO,
      confidence: confidence,
      requiresRevision: confidence === CONFIDENCE.BAJA,
      iaUsada: true,
      datos: {
        nombrePropuesto: nombre,
        nombre: nombre,
        literalDetectado: literal,
        idiomaOrigen: idioma,
        candidatosEvaluados: Array.isArray(datos.candidatosEvaluados) ? datos.candidatosEvaluados : [],
        modoResolucion: "ia",
        confidence: confidence,
        requiereRevision: confidence === CONFIDENCE.BAJA,
        motivoDuda: confidence === CONFIDENCE.BAJA ? (normalized.motivo || ERROR_CODES.NO_SEGURO) : "",
        conflictoIdentidad: confidence === CONFIDENCE.BAJA,
        dudas: confidence === CONFIDENCE.BAJA ? [normalized.motivo || ERROR_CODES.NO_SEGURO] : [],
        alertas: confidence === CONFIDENCE.BAJA ? [ERROR_CODES.NO_SEGURO] : []
      }
    });
  }

  async function procesarAccionContrato(request, deps) {
    var validation = contratos.validateIncomingRequest(request);
    var invalidMetricCtx;

    if (!validation.ok) {
      invalidMetricCtx = startOperation(contratos.normalizeIncomingRequest(request).meta);
      pushEvent(invalidMetricCtx, "error", validation.code, validation.message, validation.detail || null);
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: invalidMetricCtx.analysisId || null,
        traceId: invalidMetricCtx.traceId,
        elapsedMs: elapsedSince(invalidMetricCtx.startedAt),
        metricas: finalizeMetricas(invalidMetricCtx, {})
      }, {
        code: validation.code === ERROR_CODES.IDENTIDAD_VACIA ? ERROR_CODES.IDENTIDAD_VACIA : ERROR_CODES.CONTRATO_ENTRADA_INVALIDO,
        message: validation.message,
        suggestedAction: validation.code === ERROR_CODES.IDENTIDAD_VACIA ? SUGGESTED_ACTIONS.ABORTAR_FLUJO : SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        datos: {
          nombrePropuesto: "",
          nombre: "",
          literalDetectado: "",
          idiomaOrigen: "desconocido",
          candidatosEvaluados: [],
          modoResolucion: "ninguno_claro",
          confidence: CONFIDENCE.BAJA,
          requiereRevision: true,
          motivoDuda: validation.code,
          conflictoIdentidad: true,
          dudas: [validation.code],
          alertas: [validation.code]
        }
      });
    }

    var normalizedRequest = validation.normalized;
    var metricCtx = startOperation(normalizedRequest.meta);
    var context = {
      moduleName: MODULE_NAME,
      analysisId: metricCtx.analysisId,
      traceId: metricCtx.traceId,
      metricCtx: metricCtx
    };
    var structure = reconstructStructure(normalizedRequest);
    var metadata = structure.metadatosOpcionales || {};

    pushEvent(metricCtx, "info", "B2_INICIO", "Boxer2 inicia resolucion de identidad.", null);

    if (!structure.textoAuditado && !structure.textoBaseVision && !structure.lineasOCR.length) {
      pushEvent(metricCtx, "error", ERROR_CODES.IDENTIDAD_VACIA, "Boxer2 no tiene texto utilizable.", null);
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: metricCtx.analysisId,
        traceId: metricCtx.traceId,
        elapsedMs: elapsedSince(metricCtx.startedAt),
        metricas: finalizeMetricas(metricCtx, {})
      }, {
        code: ERROR_CODES.IDENTIDAD_VACIA,
        message: "Boxer2 recibio identidad vacia.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: {
          nombrePropuesto: "",
          nombre: "",
          literalDetectado: "",
          idiomaOrigen: "desconocido",
          candidatosEvaluados: [],
          modoResolucion: "ninguno_claro",
          confidence: CONFIDENCE.BAJA,
          requiereRevision: true,
          motivoDuda: ERROR_CODES.IDENTIDAD_VACIA,
          conflictoIdentidad: true,
          dudas: [ERROR_CODES.IDENTIDAD_VACIA],
          alertas: [ERROR_CODES.IDENTIDAD_VACIA]
        }
      });
    }

    var idioma = inferLanguage(structure, metadata);
    var entries = buildEntries(structure);
    var candidates = buildCandidates(entries, metadata).map(scoreCandidate);
    var ranked = sortCandidates(candidates).slice(0, 5);

    pushEvent(metricCtx, "info", "B2_CANDIDATOS", "Boxer2 construye candidatos locales.", {
      total: ranked.length,
      idioma: idioma
    });

    if (!ranked.length) {
      pushEvent(metricCtx, "warn", ERROR_CODES.SHORTLIST_VACIA, "No hay candidatos comerciales tras el filtro.", null);
      return buildSuccessEnvelope(context, {
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        confidence: CONFIDENCE.BAJA,
        requiresRevision: true,
        totalCandidatos: 0,
        datos: {
          nombrePropuesto: "",
          nombre: "",
          literalDetectado: "",
          idiomaOrigen: idioma,
          candidatosEvaluados: [],
          modoResolucion: "ninguno_claro",
          confidence: CONFIDENCE.BAJA,
          requiereRevision: true,
          motivoDuda: ERROR_CODES.SHORTLIST_VACIA,
          conflictoIdentidad: true,
          dudas: [ERROR_CODES.SHORTLIST_VACIA],
          alertas: [ERROR_CODES.SHORTLIST_VACIA]
        }
      });
    }

    var localResolution = resolveLocally(ranked);
    if (localResolution.resolved) {
      var nombreLocal = normalizeFinalName(localResolution.candidate.literal, idioma, metadata);
      if (!nombreLocal) {
        pushEvent(metricCtx, "warn", ERROR_CODES.IDIOMA_NO_RESUELTO, "Boxer2 no pudo normalizar el nombre final.", null);
        return buildSuccessEnvelope(context, {
          passport: PASSPORTS.NARANJA,
          suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
          confidence: CONFIDENCE.BAJA,
          requiresRevision: true,
          totalCandidatos: ranked.length,
          datos: {
            nombrePropuesto: localResolution.candidate.literal,
            nombre: localResolution.candidate.literal,
            literalDetectado: localResolution.candidate.literal,
            idiomaOrigen: idioma,
            candidatosEvaluados: ranked.map(buildCandidateView),
            modoResolucion: "ninguno_claro",
            confidence: CONFIDENCE.BAJA,
            requiereRevision: true,
            motivoDuda: ERROR_CODES.IDIOMA_NO_RESUELTO,
            conflictoIdentidad: true,
            dudas: [ERROR_CODES.IDIOMA_NO_RESUELTO],
            alertas: [ERROR_CODES.IDIOMA_NO_RESUELTO]
          }
        });
      }

      pushEvent(metricCtx, "info", "B2_LOCAL_OK", "Boxer2 resuelve identidad por programacion local.", {
        nombre: nombreLocal,
        motivo: localResolution.reason
      });
      return buildSuccessEnvelope(context, {
        passport: PASSPORTS.VERDE,
        suggestedAction: SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO,
        confidence: localResolution.confidence,
        requiresRevision: false,
        totalCandidatos: ranked.length,
        datos: {
          nombrePropuesto: nombreLocal,
          nombre: nombreLocal,
          literalDetectado: localResolution.candidate.literal,
          idiomaOrigen: idioma,
          candidatosEvaluados: ranked.map(buildCandidateView),
          modoResolucion: "local",
          confidence: localResolution.confidence,
          requiereRevision: false,
          motivoDuda: "",
          conflictoIdentidad: false,
          dudas: [],
          alertas: []
        }
      });
    }

    var shortlist = buildShortlist(ranked);
    var fallbackCandidate = ranked[0];
    var fallbackName = normalizeFinalName(fallbackCandidate.literal, idioma, metadata) || fallbackCandidate.literal;
    var tareaIA = buildIaTask(shortlist, structure, idioma, context);

    pushEvent(metricCtx, "info", "B2_IA_DECLARADA", "Boxer2 deja tarea IA preparada para Cerebro.", {
      taskId: tareaIA.taskId,
      totalShortlist: shortlist.length
    });

    return buildPendingIaEnvelope(context, {
      passport: PASSPORTS.NARANJA,
      suggestedAction: SUGGESTED_ACTIONS.CONTINUAR_Y_MARCAR_REVISION,
      confidence: CONFIDENCE.MEDIA,
      totalCandidatos: ranked.length,
      tareasIA: [tareaIA],
      datos: {
        nombrePropuesto: fallbackName,
        nombre: fallbackName,
        literalDetectado: fallbackCandidate.literal,
        idiomaOrigen: idioma,
        candidatosEvaluados: ranked.map(buildCandidateView),
        modoResolucion: "ia_pendiente",
        confidence: CONFIDENCE.MEDIA,
        requiereRevision: true,
        motivoDuda: localResolution.reason || ERROR_CODES.NO_SEGURO,
        conflictoIdentidad: true,
        dudas: [localResolution.reason || ERROR_CODES.NO_SEGURO],
        alertas: [ERROR_CODES.NO_SEGURO],
        contextoIA: {
          idiomaOrigen: idioma,
          marcaDetectada: metadata.marcaDetectada || null,
          shortlist: serializeShortlist(shortlist)
        }
      }
    });
  }

  var api = {
    MODULE_NAME: MODULE_NAME,
    ACTION_RESOLVER_IDENTIDAD: ACTIONS.RESOLVER_IDENTIDAD,
    procesarAccionContrato: procesarAccionContrato,
    B2_cerrarConSubrespuestaIA: B2_cerrarConSubrespuestaIA
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer2Identidad = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../ia/boxer2_identidad.js */

;/* BEGIN ../ia/boxer3_contratos.js */
(function initBoxer3ContratosModule(globalScope) {
  "use strict";

  var MODULE_NAME = "Boxer3_PesoFormato";
  var CONTRACT_VERSION = "BOXER_PLUG_V2";
  var LEGACY_CONTRACT_VERSION = "BOXER_PLUG_V1";
  var MODULES = Object.freeze({
    CEREBRO: "Cerebro_Orquestador",
    BOXER3: MODULE_NAME
  });
  var ACTIONS = Object.freeze({
    RESOLVER_FORMATO: "resolver_formato_comercial"
  });
  var PASSPORTS = Object.freeze({
    VERDE: "VERDE",
    NARANJA: "NARANJA",
    ROJO: "ROJO"
  });
  var CONFIDENCE = Object.freeze({
    ALTA: "alta",
    MEDIA: "media",
    BAJA: "baja"
  });
  var IA_STATES = Object.freeze({
    NECESITA_LLAMADA: "NECESITA_LLAMADA",
    NO_NECESITA_LLAMADA: "NO_NECESITA_LLAMADA",
    NO_APLICA: "NO_APLICA",
    PENDIENTE_LOCAL: "PENDIENTE_LOCAL"
  });
  var TASK_DEFINITIONS = Object.freeze({
    FORMATO: {
      TASK_ID: "b3_f01",
      TIPO_TAREA: "B3_FORMATO_V1",
      SCHEMA_ID: "B3_FORMATO_V1"
    }
  });
  var SUGGESTED_ACTIONS = Object.freeze({
    GUARDAR_RESULTADO_ANALIZADO: "guardar_resultado_analizado",
    CONTINUAR_Y_MARCAR_REVISION: "continuar_y_marcar_revision",
    ABRIR_REVISION: "abrir_revision",
    BLOQUEAR_GUARDADO: "bloquear_guardado",
    ABORTAR_FLUJO: "abortar_flujo"
  });

  function asPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeConfidence(value) {
    var safe = String(value || "").trim().toLowerCase();
    if (safe === CONFIDENCE.ALTA || safe === CONFIDENCE.MEDIA || safe === CONFIDENCE.BAJA) return safe;
    return CONFIDENCE.MEDIA;
  }

  function normalizeIaState(value) {
    var safe = String(value || "").trim().toUpperCase();
    if (
      safe === IA_STATES.NECESITA_LLAMADA ||
      safe === IA_STATES.NO_NECESITA_LLAMADA ||
      safe === IA_STATES.NO_APLICA ||
      safe === IA_STATES.PENDIENTE_LOCAL
    ) {
      return safe;
    }
    return IA_STATES.NO_NECESITA_LLAMADA;
  }

  function normalizeLineas(list) {
    if (!Array.isArray(list)) return [];
    return list.map(function each(item) {
      return String(item || "").replace(/\r/g, "").trim();
    }).filter(Boolean);
  }

  function normalizeBloques(list) {
    if (!Array.isArray(list)) return [];
    return list.map(function each(item, index) {
      var safe = asPlainObject(item) ? item : {};
      return {
        texto: String(safe.texto || "").trim(),
        orden: Number.isFinite(Number(safe.orden)) ? Number(safe.orden) : index,
        tipoBloqueSugerido: normalizeText(safe.tipoBloqueSugerido) || null,
        origenBloque: normalizeText(safe.origenBloque) || null
      };
    }).filter(function keep(item) {
      return !!item.texto;
    });
  }

  function normalizeMetadatos(raw) {
    var safe = asPlainObject(raw) ? raw : {};
    return {
      marcaDetectada: normalizeText(safe.marcaDetectada) || null,
      contenedor: normalizeText(safe.contenedor) || null,
      idiomaProbable: normalizeText(safe.idiomaProbable).toLowerCase() || null,
      origen: normalizeText(safe.origen) || null,
      nombreProvisional: normalizeText(safe.nombreProvisional) || null
    };
  }

  function normalizeIncomingRequest(request) {
    var safeRequest = asPlainObject(request) ? request : {};
    var rawMeta = asPlainObject(safeRequest.meta) ? safeRequest.meta : {};
    var rawData = asPlainObject(safeRequest.datos) ? safeRequest.datos : {};
    var rawControles = asPlainObject(rawData.controlesUsuario) ? rawData.controlesUsuario : {};

    return {
      moduloOrigen: normalizeText(safeRequest.moduloOrigen),
      moduloDestino: normalizeText(safeRequest.moduloDestino),
      accion: normalizeText(safeRequest.accion),
      sessionToken: normalizeText(safeRequest.sessionToken),
      meta: {
        versionContrato: normalizeText(rawMeta.versionContrato || CONTRACT_VERSION) || CONTRACT_VERSION,
        analysisId: normalizeText(rawMeta.analysisId),
        traceId: normalizeText(rawMeta.traceId),
        batchId: rawMeta.batchId == null ? null : normalizeText(rawMeta.batchId)
      },
      datos: {
        textoAuditado: String(rawData.textoAuditado || "").trim(),
        textoBaseVision: String(rawData.textoBaseVision || "").trim(),
        lineasOCR: normalizeLineas(rawData.lineasOCR),
        bloquesOCR: normalizeBloques(rawData.bloquesOCR),
        metadatosOpcionales: normalizeMetadatos(rawData.metadatosOpcionales),
        roiRefsRevision: Array.isArray(rawData.roiRefsRevision) ? rawData.roiRefsRevision : [],
        contextoAlta: normalizeText(rawData.contextoAlta) || null,
        senalesEnvase: asPlainObject(rawData.senalesEnvase) ? rawData.senalesEnvase : null,
        controlesUsuario: {
          timeBudgetMs: Number.isFinite(Number(rawControles.timeBudgetMs)) ? Math.max(0, Number(rawControles.timeBudgetMs)) : null,
          agentEnabled: typeof rawControles.agentEnabled === "boolean" ? rawControles.agentEnabled : true
        }
      }
    };
  }

  function validateIncomingRequest(request) {
    var normalized = normalizeIncomingRequest(request);

    if (normalized.moduloOrigen !== MODULES.CEREBRO) {
      return {
        ok: false,
        code: "B3_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloOrigen debe ser Cerebro_Orquestador.",
        detail: { moduloOrigen: normalized.moduloOrigen || null }
      };
    }
    if (normalized.moduloDestino !== MODULES.BOXER3) {
      return {
        ok: false,
        code: "B3_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloDestino debe ser Boxer3_PesoFormato.",
        detail: { moduloDestino: normalized.moduloDestino || null }
      };
    }
    if (normalized.accion !== ACTIONS.RESOLVER_FORMATO) {
      return {
        ok: false,
        code: "B3_CONTRATO_ENTRADA_INVALIDO",
        message: "accion invalida para Boxer3.",
        detail: { accion: normalized.accion || null }
      };
    }
    if (!normalized.sessionToken) {
      return {
        ok: false,
        code: "B3_CONTRATO_ENTRADA_INVALIDO",
        message: "Falta sessionToken.",
        detail: {}
      };
    }
    if (
      normalized.meta.versionContrato !== CONTRACT_VERSION &&
      normalized.meta.versionContrato !== LEGACY_CONTRACT_VERSION
    ) {
      return {
        ok: false,
        code: "B3_CONTRATO_ENTRADA_INVALIDO",
        message: "versionContrato invalida.",
        detail: { versionContrato: normalized.meta.versionContrato || null }
      };
    }
    if (!normalized.meta.analysisId || !normalized.meta.traceId) {
      return {
        ok: false,
        code: "B3_CONTRATO_ENTRADA_INVALIDO",
        message: "analysisId y traceId son obligatorios en Boxer3.",
        detail: {
          analysisId: normalized.meta.analysisId || null,
          traceId: normalized.meta.traceId || null
        }
      };
    }
    if (!normalized.datos.textoAuditado && !normalized.datos.textoBaseVision && !normalized.datos.lineasOCR.length && !normalized.datos.bloquesOCR.length) {
      return {
        ok: false,
        code: "B3_FORMATO_VACIO",
        message: "Falta texto para resolver peso o formato.",
        detail: {}
      };
    }

    return {
      ok: true,
      normalized: normalized
    };
  }

  var api = {
    MODULE_NAME: MODULE_NAME,
    CONTRACT_VERSION: CONTRACT_VERSION,
    MODULES: MODULES,
    ACTIONS: ACTIONS,
    PASSPORTS: PASSPORTS,
    CONFIDENCE: CONFIDENCE,
    IA_STATES: IA_STATES,
    TASK_DEFINITIONS: TASK_DEFINITIONS,
    SUGGESTED_ACTIONS: SUGGESTED_ACTIONS,
    normalizeConfidence: normalizeConfidence,
    normalizeIaState: normalizeIaState,
    normalizeIncomingRequest: normalizeIncomingRequest,
    validateIncomingRequest: validateIncomingRequest,
    normalizeText: normalizeText,
    asPlainObject: asPlainObject
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer3Contratos = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../ia/boxer3_contratos.js */

;/* BEGIN ../ia/boxer3_errores.js */
(function initBoxer3ErroresModule(globalScope) {
  "use strict";

  var contratos = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./boxer3_contratos.js");
    } catch (errRequire) {
      contratos = null;
    }
  }
  if (!contratos && globalScope && globalScope.Boxer3Contratos) {
    contratos = globalScope.Boxer3Contratos;
  }

  var MODULE_NAME = contratos ? contratos.MODULE_NAME : "Boxer3_PesoFormato";
  var PASSPORTS = contratos ? contratos.PASSPORTS : { VERDE: "VERDE", NARANJA: "NARANJA", ROJO: "ROJO" };
  var CONFIDENCE = contratos ? contratos.CONFIDENCE : { ALTA: "alta", MEDIA: "media", BAJA: "baja" };
  var IA_STATES = contratos ? contratos.IA_STATES : {
    NECESITA_LLAMADA: "NECESITA_LLAMADA",
    NO_NECESITA_LLAMADA: "NO_NECESITA_LLAMADA",
    NO_APLICA: "NO_APLICA",
    PENDIENTE_LOCAL: "PENDIENTE_LOCAL"
  };
  var SUGGESTED_ACTIONS = contratos ? contratos.SUGGESTED_ACTIONS : {
    CONTINUAR_Y_MARCAR_REVISION: "continuar_y_marcar_revision",
    ABRIR_REVISION: "abrir_revision",
    BLOQUEAR_GUARDADO: "bloquear_guardado",
    ABORTAR_FLUJO: "abortar_flujo"
  };

  var ERROR_CODES = Object.freeze({
    FORMATO_VACIO: "B3_FORMATO_VACIO",
    UNIDAD_INVALIDA: "B3_UNIDAD_INVALIDA",
    CONFLICTO_OCR_IA: "B3_CONFLICTO_OCR_IA",
    CONTRATO_ENTRADA_INVALIDO: "B3_CONTRATO_ENTRADA_INVALIDO",
    SUBRESPUESTA_CONTAMINADA: "B3_SUBRESPUESTA_CONTAMINADA",
    TAREA_IA_INVALIDA: "B3_TAREA_IA_INVALIDA",
    TIMEOUT_LOCAL: "B3_TIMEOUT_LOCAL",
    RESULTADO_LOCAL_INCONSISTENTE: "B3_RESULTADO_LOCAL_INCONSISTENTE"
  });

  function buildFailureEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    var passport = String(safeOptions.passport || PASSPORTS.ROJO).trim().toUpperCase() || PASSPORTS.ROJO;
    return {
      modulo: safeContext.moduleName || MODULE_NAME,
      estadoIA: safeOptions.estadoIA || IA_STATES.NO_NECESITA_LLAMADA,
      tareasIA: Array.isArray(safeOptions.tareasIA) ? safeOptions.tareasIA : [],
      resultadoLocal: {
        analysisId: safeContext.analysisId || null,
        traceId: safeContext.traceId || null,
        modulo: safeContext.moduleName || MODULE_NAME,
        estadoPasaporteModulo: passport,
        accionSugeridaParaCerebro: safeOptions.suggestedAction || SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        confidence: safeOptions.confidence || CONFIDENCE.BAJA,
        requiereRevision: true,
        datos: safeOptions.datos || {},
        error: {
          code: safeOptions.code || ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE,
          origin: safeContext.moduleName || MODULE_NAME,
          passport: passport,
          message: safeOptions.message || "Fallo Boxer3.",
          tipoFallo: safeOptions.tipoFallo || "desconocido",
          retryable: !!safeOptions.retryable
        },
        metricas: safeContext.metricas || null
      },
      elapsedMs: Math.max(0, Number(safeContext.elapsedMs) || 0),
      traceId: safeContext.traceId || null
    };
  }

  var api = {
    ERROR_CODES: ERROR_CODES,
    buildFailureEnvelope: buildFailureEnvelope
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer3Errores = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../ia/boxer3_errores.js */

;/* BEGIN ../ia/boxer3_peso_formato.js */
(function initBoxer3PesoFormatoModule(globalScope) {
  "use strict";

  var contratos = null;
  var errores = null;
  var motor = null;

  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./boxer3_contratos.js");
      errores = require("./boxer3_errores.js");
      motor = require("../../../boxer3_motor.js");
    } catch (errRequire) {
      contratos = null;
      errores = null;
      motor = null;
    }
  }

  if (!contratos && globalScope && globalScope.Boxer3Contratos) contratos = globalScope.Boxer3Contratos;
  if (!errores && globalScope && globalScope.Boxer3Errores) errores = globalScope.Boxer3Errores;
  if (!motor && globalScope && globalScope.Boxer3Motor) motor = globalScope.Boxer3Motor;

  var MODULE_NAME = contratos.MODULE_NAME;
  var PASSPORTS = contratos.PASSPORTS;
  var CONFIDENCE = contratos.CONFIDENCE;
  var IA_STATES = contratos.IA_STATES;
  var TASK_DEFINITIONS = contratos.TASK_DEFINITIONS;
  var SUGGESTED_ACTIONS = contratos.SUGGESTED_ACTIONS;
  var ERROR_CODES = errores.ERROR_CODES;

  function nowMs() {
    return Date.now();
  }

  function collapseText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function startOperation(meta) {
    var safeMeta = meta || {};
    return {
      analysisId: safeMeta.analysisId || "",
      traceId: safeMeta.traceId || "",
      startedAt: nowMs(),
      eventos: []
    };
  }

  function elapsedSince(startedAt) {
    return Math.max(0, nowMs() - Number(startedAt || nowMs()));
  }

  function pushEvent(metricCtx, level, code, message, detail) {
    if (!metricCtx) return;
    metricCtx.eventos.push({
      ts: new Date().toISOString(),
      modulo: MODULE_NAME,
      level: level,
      passport: detail && detail.passport ? detail.passport : null,
      code: code,
      message: message,
      tipoEvento: detail && detail.tipoEvento ? detail.tipoEvento : "diagnostico",
      traceId: metricCtx.traceId,
      elapsedMs: elapsedSince(metricCtx.startedAt)
    });
  }

  function finalizeMetricas(metricCtx, extra) {
    var safe = metricCtx || {};
    var addon = extra || {};
    return {
      traceId: safe.traceId || null,
      analysisId: safe.analysisId || null,
      elapsedMs: elapsedSince(safe.startedAt),
      totalEventos: Array.isArray(safe.eventos) ? safe.eventos.length : 0,
      totalCandidatos: addon.totalCandidatos || 0,
      modoResolucion: addon.modoResolucion || "ninguno_claro",
      iaUsada: !!addon.iaUsada,
      eventos: Array.isArray(safe.eventos) ? safe.eventos : []
    };
  }

  function buildMetricasForEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    if (safeContext.metricCtx) {
      return finalizeMetricas(safeContext.metricCtx, {
        totalCandidatos: safeOptions.totalCandidatos || 0,
        modoResolucion: safeOptions.datos ? safeOptions.datos.modoResolucion : "ninguno_claro",
        iaUsada: !!safeOptions.iaUsada
      });
    }
    return safeContext.metricas || null;
  }

  function buildEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    var elapsedMs = safeContext.metricCtx
      ? elapsedSince(safeContext.metricCtx.startedAt)
      : Math.max(0, Number(safeContext.elapsedMs) || 0);
    var metricas = buildMetricasForEnvelope(safeContext, safeOptions);
    return {
      modulo: MODULE_NAME,
      estadoIA: contratos.normalizeIaState(safeOptions.estadoIA || IA_STATES.NO_NECESITA_LLAMADA),
      tareasIA: Array.isArray(safeOptions.tareasIA) ? safeOptions.tareasIA : [],
      resultadoLocal: {
        analysisId: safeContext.analysisId || null,
        traceId: safeContext.traceId || null,
        modulo: MODULE_NAME,
        elapsedMs: elapsedMs,
        estadoPasaporteModulo: safeOptions.passport || PASSPORTS.VERDE,
        accionSugeridaParaCerebro: safeOptions.suggestedAction || SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO,
        confidence: safeOptions.confidence || CONFIDENCE.MEDIA,
        requiereRevision: !!safeOptions.requiresRevision,
        datos: safeOptions.datos || {},
        error: safeOptions.error || null,
        metricas: metricas
      },
      elapsedMs: elapsedMs,
      traceId: safeContext.traceId || null
    };
  }

  function buildSuccessEnvelope(context, options) {
    return buildEnvelope(context, options || {});
  }

  function buildPendingIaEnvelope(context, options) {
    var safeOptions = options || {};
    return buildEnvelope(context, {
      estadoIA: IA_STATES.NECESITA_LLAMADA,
      tareasIA: safeOptions.tareasIA || [],
      passport: safeOptions.passport || PASSPORTS.NARANJA,
      suggestedAction: safeOptions.suggestedAction || SUGGESTED_ACTIONS.CONTINUAR_Y_MARCAR_REVISION,
      confidence: safeOptions.confidence || CONFIDENCE.MEDIA,
      requiresRevision: true,
      totalCandidatos: safeOptions.totalCandidatos || 0,
      datos: safeOptions.datos || {}
    });
  }

  function buildCloseContext(resultadoLocal) {
    var safeLocal = contratos.asPlainObject(resultadoLocal) ? resultadoLocal : {};
    return {
      moduleName: MODULE_NAME,
      analysisId: safeLocal.analysisId || null,
      traceId: safeLocal.traceId || null,
      elapsedMs: Math.max(0, Number(safeLocal.elapsedMs) || 0),
      metricas: safeLocal.metricas || null
    };
  }

  function inferTipo(formato) {
    var safe = collapseText(formato);
    if (!safe) return "desconocido";
    return /^\d+\s*x/i.test(safe) ? "multipack" : "simple";
  }

  function inferConfidenceForVia(via) {
    if (via === "clase_A1" || via === "clase_A1_multi" || via === "clase_A2" || via === "clase_A2_multi") {
      return CONFIDENCE.ALTA;
    }
    if (via === "inferencia_B_C" || via === "scoring_C") {
      return CONFIDENCE.MEDIA;
    }
    return CONFIDENCE.BAJA;
  }

  function buildAnalysisText(datos) {
    var text = datos.textoAuditado || "";
    if (text) return text;
    if (datos.lineasOCR && datos.lineasOCR.length) return datos.lineasOCR.join("\n");
    if (datos.bloquesOCR && datos.bloquesOCR.length) {
      return datos.bloquesOCR
        .slice()
        .sort(function(a, b) { return a.orden - b.orden; })
        .map(function(item) { return item.texto; })
        .join("\n");
    }
    return datos.textoBaseVision || "";
  }

  function summarizeCandidates(candidatos) {
    if (!Array.isArray(candidatos)) return [];
    return candidatos.map(function each(item) {
      return {
        literal: item.tokenOriginal,
        clase: item.clase,
        formato: motor.formatearSalida(item),
        tipo: item.esMultipack ? "multipack" : "simple",
        evidencia: item.evidencias || 1,
        lineaOrigen: item.lineaOrigen
      };
    });
  }

  function buildRawCandidateOption(candidate, index, scoreMap) {
    var format = motor.formatearSalida(candidate);
    var scoreKey = candidate.tokenOriginal + "|" + candidate.lineaOrigen;
    return {
      id: "c" + String(index + 1),
      formato: format,
      formato_normalizado: format,
      tipo: candidate.esMultipack ? "multipack" : "simple",
      clase: candidate.clase,
      literal: candidate.tokenOriginal,
      lineaOrigen: candidate.lineaOrigen,
      score: scoreMap[scoreKey] == null ? null : scoreMap[scoreKey],
      evidencias: candidate.evidencias || 1
    };
  }

  function buildScoreMap(scored) {
    var map = {};
    (Array.isArray(scored) ? scored : []).forEach(function each(item) {
      map[item.token + "|" + item.lineaOrigen] = item.score;
    });
    return map;
  }

  function buildClosedCandidates(analysis) {
    var safeAnalysis = analysis || {};
    var consolidados = Array.isArray(safeAnalysis.consolidados) ? safeAnalysis.consolidados : [];
    var scoreMap = buildScoreMap(safeAnalysis.scoringNeutros);
    var a1 = consolidados.filter(function(c) { return c.clase === "A1"; });
    var a2 = consolidados.filter(function(c) { return c.clase === "A2"; });
    var neutros = consolidados.filter(function(c) { return c.clase === "C"; });
    var selected = [];

    if (a1.length > 1) {
      selected = a1.slice();
    } else if (a2.length > 1) {
      selected = a2.slice();
    } else if (neutros.length > 1) {
      selected = neutros.slice().sort(function(a, b) {
        var aScore = scoreMap[a.tokenOriginal + "|" + a.lineaOrigen] || 0;
        var bScore = scoreMap[b.tokenOriginal + "|" + b.lineaOrigen] || 0;
        return bScore - aScore;
      });
    } else if (consolidados.length > 1) {
      selected = consolidados.slice();
    }

    var out = [];
    var seen = {};
    for (var i = 0; i < selected.length; i += 1) {
      var option = buildRawCandidateOption(selected[i], out.length, scoreMap);
      var key = option.formato_normalizado + "|" + option.tipo + "|" + option.clase;
      if (seen[key]) continue;
      seen[key] = true;
      out.push(option);
      if (out.length >= 3) break;
    }
    return out;
  }

  function buildIaTask(candidates, analysis, context) {
    var safeCandidates = Array.isArray(candidates) ? candidates : [];
    var safeAnalysis = analysis || {};
    return {
      analysisId: context.analysisId,
      traceId: context.traceId,
      taskId: TASK_DEFINITIONS.FORMATO.TASK_ID,
      moduloSolicitante: MODULE_NAME,
      tipoTarea: TASK_DEFINITIONS.FORMATO.TIPO_TAREA,
      schemaId: TASK_DEFINITIONS.FORMATO.SCHEMA_ID,
      payload: {
        textoBase: safeAnalysis.textoLimpio || safeAnalysis.textoEntrada || "",
        candidatos: safeCandidates.map(function each(item) {
          return {
            id: item.id,
            formato: item.formato,
            tipo: item.tipo,
            clase: item.clase,
            literal: item.literal,
            lineaOrigen: item.lineaOrigen
          };
        })
      },
      respuestaEsperada: {
        formato: "json",
        campos: ["decision", "confidence", "motivo_duda"],
        decisionesPermitidas: safeCandidates.map(function each(item) { return item.id; }).concat(["ninguno_claro"])
      }
    };
  }

  function isValidIaTask(task) {
    return !!task &&
      task.taskId === TASK_DEFINITIONS.FORMATO.TASK_ID &&
      task.moduloSolicitante === MODULE_NAME &&
      task.tipoTarea === TASK_DEFINITIONS.FORMATO.TIPO_TAREA &&
      task.schemaId === TASK_DEFINITIONS.FORMATO.SCHEMA_ID &&
      contratos.asPlainObject(task.payload) &&
      Array.isArray(task.payload.candidatos) &&
      task.payload.candidatos.length >= 2 &&
      typeof task.payload.textoBase === "string";
  }

  function normalizeIaResponse(raw) {
    var safeRaw = raw || {};
    var payload = safeRaw;
    if (payload && payload.data) payload = payload.data;
    if (payload && payload.resultado) payload = payload.resultado;
    if (payload && payload.data) payload = payload.data;
    if (payload && payload.respuesta) payload = payload.respuesta;
    if (!contratos.asPlainObject(payload)) {
      return { ok: false, code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA, message: "IA Boxer3 no devolvio JSON util." };
    }

    var decision = collapseText(payload.decision || "");
    if (!decision) {
      return { ok: false, code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA, message: "IA Boxer3 no devolvio decision." };
    }

    return {
      ok: true,
      taskId: collapseText(safeRaw.taskId || payload.taskId || ""),
      analysisId: collapseText(safeRaw.analysisId || payload.analysisId || ""),
      traceId: collapseText(safeRaw.traceId || payload.traceId || ""),
      tipoTarea: collapseText(safeRaw.tipoTarea || payload.tipoTarea || ""),
      schemaId: collapseText(safeRaw.schemaId || payload.schemaId || ""),
      decision: decision,
      confidence: contratos.normalizeConfidence(payload.confidence || CONFIDENCE.MEDIA),
      motivo: collapseText(payload.motivo_duda || payload.motivoDuda || "")
    };
  }

  function buildDirectResultData(analysis) {
    var decision = analysis.decision || {};
    var format = collapseText(decision.resultado || "");
    return {
      formato: format,
      formato_normalizado: format,
      tipo: inferTipo(format),
      confidence: inferConfidenceForVia(decision.via),
      modoResolucion: "local",
      motivo_duda: "",
      conflictoComercial: false,
      pesoBrutoDetectado: collapseText(decision.pesoBrutoDetectado || ""),
      candidatosEvaluados: summarizeCandidates(decision.candidatos),
      dudas: [],
      alertas: []
    };
  }

  function inferEmptyReason(analysis) {
    var decision = analysis.decision || {};
    if (decision.pesoBrutoDetectado) return "solo_bruto_sin_neto";
    if (decision.via === "sin_candidatos") return ERROR_CODES.FORMATO_VACIO;
    return collapseText(decision.motivo || "") || ERROR_CODES.FORMATO_VACIO;
  }

  function buildEmptyResultData(analysis, modo, contextoIA) {
    var decision = analysis.decision || {};
    var reason = inferEmptyReason(analysis);
    return {
      formato: "",
      formato_normalizado: "",
      tipo: "desconocido",
      confidence: CONFIDENCE.MEDIA,
      modoResolucion: modo || "ninguno_claro",
      motivo_duda: reason,
      conflictoComercial: true,
      pesoBrutoDetectado: collapseText(decision.pesoBrutoDetectado || ""),
      candidatosEvaluados: summarizeCandidates(decision.candidatos),
      dudas: [reason],
      alertas: [reason],
      contextoIA: contextoIA || null
    };
  }

  function B3_cerrarConSubrespuestaIA(subrespuesta, resultadoLocal) {
    var safeLocal = contratos.asPlainObject(resultadoLocal) ? resultadoLocal : {};
    var context = buildCloseContext(safeLocal);
    var datos = contratos.asPlainObject(safeLocal.datos) ? safeLocal.datos : {};
    var contextoIA = contratos.asPlainObject(datos.contextoIA) ? datos.contextoIA : {};
    var shortlist = Array.isArray(contextoIA.candidatos) ? contextoIA.candidatos : [];
    var normalized = normalizeIaResponse(subrespuesta);

    if (!normalized.ok) {
      return errores.buildFailureEnvelope(context, {
        code: normalized.code,
        message: normalized.message,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }

    if (normalized.taskId && normalized.taskId !== TASK_DEFINITIONS.FORMATO.TASK_ID) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA,
        message: "taskId invalido en cierre IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.analysisId && context.analysisId && normalized.analysisId !== context.analysisId) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA,
        message: "analysisId invalido en cierre IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.traceId && context.traceId && normalized.traceId !== context.traceId) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA,
        message: "traceId invalido en cierre IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.tipoTarea && normalized.tipoTarea !== TASK_DEFINITIONS.FORMATO.TIPO_TAREA) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA,
        message: "tipoTarea invalido en cierre IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (normalized.schemaId && normalized.schemaId !== TASK_DEFINITIONS.FORMATO.SCHEMA_ID) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA,
        message: "schemaId invalido en cierre IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }
    if (!shortlist.length) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE,
        message: "No hay candidatos cerrados para cerrar IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }

    if (normalized.decision === "ninguno_claro") {
      return buildSuccessEnvelope(context, {
        estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        confidence: normalized.confidence,
        requiresRevision: true,
        iaUsada: true,
        totalCandidatos: shortlist.length,
        datos: {
          formato: "",
          formato_normalizado: "",
          tipo: "desconocido",
          confidence: normalized.confidence,
          modoResolucion: "ninguno_claro",
          motivo_duda: normalized.motivo || ERROR_CODES.FORMATO_VACIO,
          conflictoComercial: true,
          pesoBrutoDetectado: datos.pesoBrutoDetectado || "",
          candidatosEvaluados: datos.candidatosEvaluados || [],
          dudas: [normalized.motivo || ERROR_CODES.FORMATO_VACIO],
          alertas: [normalized.motivo || ERROR_CODES.FORMATO_VACIO]
        }
      });
    }

    var candidate = shortlist.filter(function each(item) {
      return item.id === normalized.decision;
    })[0] || null;

    if (!candidate) {
      return errores.buildFailureEnvelope(context, {
        code: ERROR_CODES.SUBRESPUESTA_CONTAMINADA,
        message: "decision invalida en cierre IA Boxer3.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: datos
      });
    }

    if (datos.formato_normalizado && datos.formato_normalizado !== candidate.formato_normalizado) {
      return buildSuccessEnvelope(context, {
        estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        confidence: normalized.confidence,
        requiresRevision: true,
        iaUsada: true,
        totalCandidatos: shortlist.length,
        datos: {
          formato: candidate.formato,
          formato_normalizado: candidate.formato_normalizado,
          tipo: candidate.tipo,
          confidence: normalized.confidence,
          modoResolucion: "ia",
          motivo_duda: ERROR_CODES.CONFLICTO_OCR_IA,
          conflictoComercial: true,
          pesoBrutoDetectado: datos.pesoBrutoDetectado || "",
          candidatosEvaluados: datos.candidatosEvaluados || [],
          dudas: [ERROR_CODES.CONFLICTO_OCR_IA],
          alertas: [ERROR_CODES.CONFLICTO_OCR_IA]
        }
      });
    }

    var passport = normalized.confidence === CONFIDENCE.BAJA ? PASSPORTS.NARANJA : PASSPORTS.VERDE;
    return buildSuccessEnvelope(context, {
      estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
      passport: passport,
      suggestedAction: passport === PASSPORTS.VERDE ? SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO : SUGGESTED_ACTIONS.ABRIR_REVISION,
      confidence: normalized.confidence,
      requiresRevision: passport !== PASSPORTS.VERDE,
      iaUsada: true,
      totalCandidatos: shortlist.length,
      datos: {
        formato: candidate.formato,
        formato_normalizado: candidate.formato_normalizado,
        tipo: candidate.tipo,
        confidence: normalized.confidence,
        modoResolucion: "ia",
        motivo_duda: normalized.motivo || "",
        conflictoComercial: passport !== PASSPORTS.VERDE,
        pesoBrutoDetectado: datos.pesoBrutoDetectado || "",
        candidatosEvaluados: datos.candidatosEvaluados || [],
        dudas: normalized.motivo ? [normalized.motivo] : [],
        alertas: normalized.motivo ? [normalized.motivo] : []
      }
    });
  }

  async function procesarAccionContrato(request) {
    var validation = contratos.validateIncomingRequest(request);
    var invalidMetricCtx;

    if (!validation.ok) {
      invalidMetricCtx = startOperation(contratos.normalizeIncomingRequest(request).meta);
      pushEvent(invalidMetricCtx, "error", validation.code, validation.message, validation.detail || null);
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: invalidMetricCtx.analysisId || null,
        traceId: invalidMetricCtx.traceId,
        elapsedMs: elapsedSince(invalidMetricCtx.startedAt),
        metricas: finalizeMetricas(invalidMetricCtx, {})
      }, {
        code: validation.code,
        message: validation.message,
        passport: validation.code === ERROR_CODES.FORMATO_VACIO ? PASSPORTS.NARANJA : PASSPORTS.ROJO,
        suggestedAction: validation.code === ERROR_CODES.FORMATO_VACIO ? SUGGESTED_ACTIONS.CONTINUAR_Y_MARCAR_REVISION : SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        datos: {
          formato: "",
          formato_normalizado: "",
          tipo: "desconocido",
          confidence: CONFIDENCE.BAJA,
          modoResolucion: "ninguno_claro",
          motivo_duda: validation.code,
          conflictoComercial: true,
          pesoBrutoDetectado: "",
          candidatosEvaluados: [],
          dudas: [validation.code],
          alertas: [validation.code]
        }
      });
    }

    var normalizedRequest = validation.normalized;
    var metricCtx = startOperation(normalizedRequest.meta);
    var context = {
      moduleName: MODULE_NAME,
      analysisId: metricCtx.analysisId,
      traceId: metricCtx.traceId,
      metricCtx: metricCtx
    };

    try {
      var text = buildAnalysisText(normalizedRequest.datos);
      pushEvent(metricCtx, "info", "B3_ANALISIS_LOCAL", "Analisis local Boxer3 iniciado.", { passport: PASSPORTS.VERDE });
      var analysis = motor.analizarMotorBoxer3(text);
      var decision = analysis.decision || {};
      var totalCandidatos = Array.isArray(analysis.consolidados) ? analysis.consolidados.length : 0;

      if (normalizedRequest.datos.controlesUsuario.timeBudgetMs != null &&
          elapsedSince(metricCtx.startedAt) > normalizedRequest.datos.controlesUsuario.timeBudgetMs) {
        pushEvent(metricCtx, "error", ERROR_CODES.TIMEOUT_LOCAL, "Boxer3 supero el tiempo local.", {
          passport: PASSPORTS.NARANJA,
          tipoEvento: "timeout"
        });
        return errores.buildFailureEnvelope({
          moduleName: MODULE_NAME,
          analysisId: context.analysisId,
          traceId: context.traceId,
          elapsedMs: elapsedSince(metricCtx.startedAt),
          metricas: finalizeMetricas(metricCtx, {
            totalCandidatos: totalCandidatos,
            modoResolucion: "timeout_local"
          })
        }, {
          code: ERROR_CODES.TIMEOUT_LOCAL,
          message: "Boxer3 agoto su tiempo local.",
          passport: PASSPORTS.NARANJA,
          suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
          datos: buildEmptyResultData(analysis, "timeout_local"),
          tipoFallo: "reparacion_agotada",
          retryable: true
        });
      }

      if (decision.resultado) {
        pushEvent(metricCtx, "info", "B3_LOCAL_VERDE", "Boxer3 resolvio formato en local.", { passport: PASSPORTS.VERDE });
        return buildSuccessEnvelope(context, {
          estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
          passport: PASSPORTS.VERDE,
          suggestedAction: SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO,
          confidence: inferConfidenceForVia(decision.via),
          requiresRevision: false,
          totalCandidatos: totalCandidatos,
          datos: buildDirectResultData(analysis)
        });
      }

      var closedCandidates = buildClosedCandidates(analysis);
      if (normalizedRequest.datos.controlesUsuario.agentEnabled && closedCandidates.length >= 2) {
        var task = buildIaTask(closedCandidates, analysis, context);
        if (!isValidIaTask(task)) {
          pushEvent(metricCtx, "error", ERROR_CODES.TAREA_IA_INVALIDA, "Boxer3 no pudo construir tarea IA valida.", {
            passport: PASSPORTS.ROJO
          });
          return errores.buildFailureEnvelope({
            moduleName: MODULE_NAME,
            analysisId: context.analysisId,
            traceId: context.traceId,
            elapsedMs: elapsedSince(metricCtx.startedAt),
            metricas: finalizeMetricas(metricCtx, {
              totalCandidatos: totalCandidatos,
              modoResolucion: "tarea_ia_invalida"
            })
          }, {
            code: ERROR_CODES.TAREA_IA_INVALIDA,
            message: "La tarea IA de Boxer3 no cumple el contrato.",
            passport: PASSPORTS.ROJO,
            suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
            datos: buildEmptyResultData(analysis, "pendiente_ia"),
            tipoFallo: "irrecuperable_por_diseno"
          });
        }

        pushEvent(metricCtx, "warn", "B3_ESCALA_IA", "Boxer3 necesita desempate externo.", {
          passport: PASSPORTS.NARANJA
        });
        return buildPendingIaEnvelope(context, {
          passport: PASSPORTS.NARANJA,
          suggestedAction: SUGGESTED_ACTIONS.CONTINUAR_Y_MARCAR_REVISION,
          confidence: CONFIDENCE.MEDIA,
          totalCandidatos: totalCandidatos,
          tareasIA: [task],
          datos: buildEmptyResultData(analysis, "pendiente_ia", {
            candidatos: closedCandidates,
            analysisId: context.analysisId,
            traceId: context.traceId
          })
        });
      }

      pushEvent(metricCtx, "warn", ERROR_CODES.FORMATO_VACIO, "Boxer3 no cerro formato seguro.", {
        passport: PASSPORTS.NARANJA
      });
      return buildSuccessEnvelope(context, {
        estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
        passport: PASSPORTS.NARANJA,
        suggestedAction: SUGGESTED_ACTIONS.ABRIR_REVISION,
        confidence: CONFIDENCE.MEDIA,
        requiresRevision: true,
        totalCandidatos: totalCandidatos,
        datos: buildEmptyResultData(analysis, "ninguno_claro")
      });
    } catch (err) {
      pushEvent(metricCtx, "error", ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE, err && err.message ? err.message : "Fallo interno Boxer3.", {
        passport: PASSPORTS.ROJO
      });
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: context.analysisId,
        traceId: context.traceId,
        elapsedMs: elapsedSince(metricCtx.startedAt),
        metricas: finalizeMetricas(metricCtx, {})
      }, {
        code: ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE,
        message: err && err.message ? err.message : "Excepcion no controlada en Boxer3.",
        passport: PASSPORTS.ROJO,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: {
          formato: "",
          formato_normalizado: "",
          tipo: "desconocido",
          confidence: CONFIDENCE.BAJA,
          modoResolucion: "error_interno",
          motivo_duda: ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE,
          conflictoComercial: true,
          pesoBrutoDetectado: "",
          candidatosEvaluados: [],
          dudas: [ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE],
          alertas: [ERROR_CODES.RESULTADO_LOCAL_INCONSISTENTE]
        },
        retryable: true
      });
    }
  }

  var api = {
    procesarAccionContrato: procesarAccionContrato,
    B3_cerrarConSubrespuestaIA: B3_cerrarConSubrespuestaIA
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer3PesoFormato = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../ia/boxer3_peso_formato.js */

;/* BEGIN ../ia/boxer4_contratos.js */
(function initBoxer4ContratosModule(globalScope) {
  "use strict";

  var MODULE_NAME = "Boxer4_Alergenos";
  var CONTRACT_VERSION = "BOXER_PLUG_V1";
  var MODULES = Object.freeze({
    CEREBRO: "Cerebro_Orquestador",
    BOXER4: MODULE_NAME
  });
  var ACTIONS = Object.freeze({
    CLASIFICAR_ALERGENOS: "clasificar_alergenos"
  });
  var PASSPORTS = Object.freeze({
    VERDE: "VERDE",
    NARANJA: "NARANJA",
    ROJO: "ROJO"
  });
  var CONFIDENCE = Object.freeze({
    ALTA: "alta",
    MEDIA: "media",
    BAJA: "baja"
  });
  var IA_STATES = Object.freeze({
    NECESITA_LLAMADA: "NECESITA_LLAMADA",
    NO_NECESITA_LLAMADA: "NO_NECESITA_LLAMADA",
    NO_APLICA: "NO_APLICA",
    PENDIENTE_LOCAL: "PENDIENTE_LOCAL"
  });
  var SUGGESTED_ACTIONS = Object.freeze({
    GUARDAR_RESULTADO_ANALIZADO: "guardar_resultado_analizado",
    CONTINUAR_Y_MARCAR_REVISION: "continuar_y_marcar_revision",
    ABRIR_REVISION: "abrir_revision",
    BLOQUEAR_GUARDADO: "bloquear_guardado",
    ABORTAR_FLUJO: "abortar_flujo"
  });

  function asPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeIaState(value) {
    var safe = String(value || "").trim().toUpperCase();
    if (
      safe === IA_STATES.NECESITA_LLAMADA ||
      safe === IA_STATES.NO_NECESITA_LLAMADA ||
      safe === IA_STATES.NO_APLICA ||
      safe === IA_STATES.PENDIENTE_LOCAL
    ) {
      return safe;
    }
    return IA_STATES.NO_NECESITA_LLAMADA;
  }

  function normalizeIncomingRequest(request) {
    var safeRequest = asPlainObject(request) ? request : {};
    var rawMeta = asPlainObject(safeRequest.meta) ? safeRequest.meta : {};
    var rawData = asPlainObject(safeRequest.datos) ? safeRequest.datos : {};

    return {
      moduloOrigen: normalizeText(safeRequest.moduloOrigen),
      moduloDestino: normalizeText(safeRequest.moduloDestino),
      accion: normalizeText(safeRequest.accion),
      sessionToken: normalizeText(safeRequest.sessionToken),
      meta: {
        versionContrato: normalizeText(rawMeta.versionContrato || CONTRACT_VERSION) || CONTRACT_VERSION,
        analysisId: normalizeText(rawMeta.analysisId),
        traceId: normalizeText(rawMeta.traceId),
        batchId: rawMeta.batchId == null ? null : normalizeText(rawMeta.batchId)
      },
      datos: {
        textoAuditado: Object.prototype.hasOwnProperty.call(rawData, "textoAuditado")
          ? String(rawData.textoAuditado || "")
          : undefined,
        textoBaseVision: String(rawData.textoBaseVision || "").trim(),
        lineasOCR: Array.isArray(rawData.lineasOCR) ? rawData.lineasOCR : [],
        bloquesOCR: Array.isArray(rawData.bloquesOCR) ? rawData.bloquesOCR : [],
        metadatosOpcionales: asPlainObject(rawData.metadatosOpcionales) ? rawData.metadatosOpcionales : {},
        roiRefsRevision: Array.isArray(rawData.roiRefsRevision) ? rawData.roiRefsRevision : []
      }
    };
  }

  function validateIncomingRequest(request) {
    var normalized = normalizeIncomingRequest(request);

    if (normalized.moduloOrigen !== MODULES.CEREBRO) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloOrigen debe ser Cerebro_Orquestador.",
        detail: { moduloOrigen: normalized.moduloOrigen || null }
      };
    }
    if (normalized.moduloDestino !== MODULES.BOXER4) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloDestino debe ser Boxer4_Alergenos.",
        detail: { moduloDestino: normalized.moduloDestino || null }
      };
    }
    if (normalized.accion !== ACTIONS.CLASIFICAR_ALERGENOS) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "accion invalida para Boxer4.",
        detail: { accion: normalized.accion || null }
      };
    }
    if (!normalized.sessionToken) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "Falta sessionToken.",
        detail: {}
      };
    }
    if (normalized.meta.versionContrato !== CONTRACT_VERSION) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "versionContrato invalida.",
        detail: { versionContrato: normalized.meta.versionContrato || null }
      };
    }
    if (!normalized.meta.analysisId || !normalized.meta.traceId) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "analysisId y traceId son obligatorios en Boxer4.",
        detail: {
          analysisId: normalized.meta.analysisId || null,
          traceId: normalized.meta.traceId || null
        }
      };
    }
    if (normalized.datos.textoAuditado === undefined) {
      return {
        ok: false,
        code: "B4_CONTRATO_ENTRADA_INVALIDO",
        message: "Falta datos.textoAuditado.",
        detail: {}
      };
    }

    return {
      ok: true,
      normalized: normalized
    };
  }

  var api = {
    MODULE_NAME: MODULE_NAME,
    CONTRACT_VERSION: CONTRACT_VERSION,
    MODULES: MODULES,
    ACTIONS: ACTIONS,
    PASSPORTS: PASSPORTS,
    CONFIDENCE: CONFIDENCE,
    IA_STATES: IA_STATES,
    SUGGESTED_ACTIONS: SUGGESTED_ACTIONS,
    normalizeIaState: normalizeIaState,
    normalizeIncomingRequest: normalizeIncomingRequest,
    validateIncomingRequest: validateIncomingRequest,
    normalizeText: normalizeText,
    asPlainObject: asPlainObject
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer4Contratos = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../ia/boxer4_contratos.js */

;/* BEGIN ../ia/boxer4_errores.js */
(function initBoxer4ErroresModule(globalScope) {
  "use strict";

  var contratos = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./boxer4_contratos.js");
    } catch (errRequire) {
      contratos = null;
    }
  }
  if (!contratos && globalScope && globalScope.Boxer4Contratos) {
    contratos = globalScope.Boxer4Contratos;
  }

  var MODULE_NAME = contratos ? contratos.MODULE_NAME : "Boxer4_Alergenos";
  var PASSPORTS = contratos ? contratos.PASSPORTS : { VERDE: "VERDE", NARANJA: "NARANJA", ROJO: "ROJO" };
  var CONFIDENCE = contratos ? contratos.CONFIDENCE : { ALTA: "alta", MEDIA: "media", BAJA: "baja" };
  var IA_STATES = contratos ? contratos.IA_STATES : {
    NECESITA_LLAMADA: "NECESITA_LLAMADA",
    NO_NECESITA_LLAMADA: "NO_NECESITA_LLAMADA",
    NO_APLICA: "NO_APLICA",
    PENDIENTE_LOCAL: "PENDIENTE_LOCAL"
  };
  var SUGGESTED_ACTIONS = contratos ? contratos.SUGGESTED_ACTIONS : {
    CONTINUAR_Y_MARCAR_REVISION: "continuar_y_marcar_revision",
    ABRIR_REVISION: "abrir_revision",
    BLOQUEAR_GUARDADO: "bloquear_guardado",
    ABORTAR_FLUJO: "abortar_flujo"
  };

  var ERROR_CODES = Object.freeze({
    CONTRATO_ENTRADA_INVALIDO: "B4_CONTRATO_ENTRADA_INVALIDO",
    SIN_TEXTO: "B4_SIN_TEXTO",
    SIN_BASE_ANALISIS: "B4_SIN_BASE_ANALISIS"
  });

  function buildFailureEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    var passport = String(safeOptions.passport || PASSPORTS.ROJO).trim().toUpperCase() || PASSPORTS.ROJO;
    return {
      modulo: safeContext.moduleName || MODULE_NAME,
      estadoIA: safeOptions.estadoIA || IA_STATES.NO_NECESITA_LLAMADA,
      tareasIA: [],
      resultadoLocal: {
        analysisId: safeContext.analysisId || null,
        traceId: safeContext.traceId || null,
        modulo: safeContext.moduleName || MODULE_NAME,
        estadoPasaporteModulo: passport,
        accionSugeridaParaCerebro: safeOptions.suggestedAction || SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        confidence: safeOptions.confidence || CONFIDENCE.BAJA,
        requiereRevision: passport !== PASSPORTS.VERDE,
        datos: safeOptions.datos || {},
        error: {
          code: safeOptions.code || ERROR_CODES.SIN_BASE_ANALISIS,
          origin: safeContext.moduleName || MODULE_NAME,
          passport: passport,
          message: safeOptions.message || "Fallo Boxer4.",
          tipoFallo: safeOptions.tipoFallo || "desconocido",
          retryable: !!safeOptions.retryable
        },
        metricas: safeContext.metricas || null
      },
      elapsedMs: Math.max(0, Number(safeContext.elapsedMs) || 0),
      traceId: safeContext.traceId || null
    };
  }

  var api = {
    ERROR_CODES: ERROR_CODES,
    buildFailureEnvelope: buildFailureEnvelope
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer4Errores = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../ia/boxer4_errores.js */

;/* BEGIN ../ia/boxer4_alergenos.js */
(function initBoxer4AlergenosModule(globalScope) {
  "use strict";

  var contratos = null;
  var errores = null;
  var motor = null;
  var allergenCatalog = null;

  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./boxer4_contratos.js");
      errores = require("./boxer4_errores.js");
      motor = require("../../../Boxer4_Motor.js");
      allergenCatalog = require("../../../../shared/alergenos_oficiales.js");
    } catch (errRequire) {
      contratos = null;
      errores = null;
      motor = null;
      allergenCatalog = null;
    }
  }

  if (!contratos && globalScope && globalScope.Boxer4Contratos) contratos = globalScope.Boxer4Contratos;
  if (!errores && globalScope && globalScope.Boxer4Errores) errores = globalScope.Boxer4Errores;
  if (!motor && globalScope && globalScope.Boxer4Motor) motor = globalScope.Boxer4Motor;
  if (!allergenCatalog && globalScope && globalScope.AppV2AlergenosOficiales) {
    allergenCatalog = globalScope.AppV2AlergenosOficiales;
  }

  var MODULE_NAME = contratos.MODULE_NAME;
  var PASSPORTS = contratos.PASSPORTS;
  var CONFIDENCE = contratos.CONFIDENCE;
  var IA_STATES = contratos.IA_STATES;
  var SUGGESTED_ACTIONS = contratos.SUGGESTED_ACTIONS;
  var ERROR_CODES = errores.ERROR_CODES;

  function nowMs() {
    return Date.now();
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function startOperation(meta) {
    var safeMeta = meta || {};
    return {
      analysisId: safeMeta.analysisId || "",
      traceId: safeMeta.traceId || "",
      startedAt: nowMs(),
      eventos: []
    };
  }

  function elapsedSince(startedAt) {
    return Math.max(0, nowMs() - Number(startedAt || nowMs()));
  }

  function pushEvent(metricCtx, level, code, message, detail) {
    if (!metricCtx) return;
    metricCtx.eventos.push({
      ts: new Date().toISOString(),
      modulo: MODULE_NAME,
      level: level,
      passport: detail && detail.passport ? detail.passport : null,
      code: code,
      message: message,
      tipoEvento: detail && detail.tipoEvento ? detail.tipoEvento : "diagnostico",
      traceId: metricCtx.traceId,
      elapsedMs: elapsedSince(metricCtx.startedAt)
    });
  }

  function finalizeMetricas(metricCtx, extra) {
    var safe = metricCtx || {};
    var addon = extra || {};
    return {
      traceId: safe.traceId || null,
      analysisId: safe.analysisId || null,
      elapsedMs: elapsedSince(safe.startedAt),
      totalEventos: Array.isArray(safe.eventos) ? safe.eventos.length : 0,
      totalAlergenos: addon.totalAlergenos || 0,
      modoResolucion: addon.modoResolucion || "local",
      iaUsada: false,
      eventos: Array.isArray(safe.eventos) ? safe.eventos : []
    };
  }

  function buildMetricasForEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    if (safeContext.metricCtx) {
      return finalizeMetricas(safeContext.metricCtx, {
        totalAlergenos: safeOptions.totalAlergenos || 0,
        modoResolucion: safeOptions.datos ? safeOptions.datos.modoResolucion : "local"
      });
    }
    return safeContext.metricas || null;
  }

  function buildEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    var elapsedMs = safeContext.metricCtx
      ? elapsedSince(safeContext.metricCtx.startedAt)
      : Math.max(0, Number(safeContext.elapsedMs) || 0);
    var metricas = buildMetricasForEnvelope(safeContext, safeOptions);
    return {
      modulo: MODULE_NAME,
      estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
      tareasIA: [],
      resultadoLocal: {
        analysisId: safeContext.analysisId || null,
        traceId: safeContext.traceId || null,
        modulo: MODULE_NAME,
        estadoPasaporteModulo: safeOptions.passport || PASSPORTS.VERDE,
        accionSugeridaParaCerebro: safeOptions.suggestedAction || SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO,
        confidence: safeOptions.confidence || CONFIDENCE.MEDIA,
        requiereRevision: !!safeOptions.requiresRevision,
        datos: safeOptions.datos || {},
        error: safeOptions.error || null,
        metricas: metricas
      },
      elapsedMs: elapsedMs,
      traceId: safeContext.traceId || null
    };
  }

  function activeAlergenosMapToList(map) {
    if (allergenCatalog && typeof allergenCatalog.activeFromProfile === "function") {
      return allergenCatalog.activeFromProfile(map);
    }
    var out = [];
    var safeMap = contratos.asPlainObject(map) ? map : {};
    Object.keys(safeMap).forEach(function each(key) {
      if (Number(safeMap[key]) === 1) out.push(key);
    });
    return out;
  }

  function flattenEvidenceMap(map) {
    var safeMap = contratos.asPlainObject(map) ? map : {};
    var seen = {};
    var out = [];
    Object.keys(safeMap).forEach(function each(key) {
      var list = Array.isArray(safeMap[key]) ? safeMap[key] : [];
      list.forEach(function add(item) {
        var normalized = normalizeText(item).toLowerCase();
        if (!normalized || seen[normalized]) return;
        seen[normalized] = true;
        out.push(normalizeText(item));
      });
    });
    return out;
  }

  function buildReasonData(rawLocal, passport, sourceCode) {
    var safeLocal = contratos.asPlainObject(rawLocal) ? rawLocal : {};
    var activeAlergenos = activeAlergenosMapToList(safeLocal.alergenos);
    var requiresRevision = !!safeLocal.requiereRevision || passport !== PASSPORTS.VERDE;
    var motivo = requiresRevision ? "perfil_alergenos_requiere_revision" : "";
    return {
      alergenos: activeAlergenos,
      trazas: [],
      evidencias: flattenEvidenceMap(safeLocal.evidencias),
      evidenciasPorAlergeno: safeLocal.evidencias || {},
      perfilAlergenos: allergenCatalog && typeof allergenCatalog.buildProfileMap === "function"
        ? allergenCatalog.buildProfileMap(activeAlergenos)
        : (safeLocal.alergenos || {}),
      requiereRevision: requiresRevision,
      confidence: safeLocal.confidence || (passport === PASSPORTS.VERDE ? CONFIDENCE.ALTA : CONFIDENCE.MEDIA),
      bloqueadosGlobales: allergenCatalog && typeof allergenCatalog.normalizeAllergenList === "function"
        ? allergenCatalog.normalizeAllergenList(safeLocal.bloqueadosGlobales)
        : (Array.isArray(safeLocal.bloqueadosGlobales) ? safeLocal.bloqueadosGlobales : []),
      bloqueosDetectados: safeLocal.bloqueosDetectados || {},
      zonasExcluidas: Array.isArray(safeLocal.zonasExcluidas) ? safeLocal.zonasExcluidas : [],
      modoResolucion: "local",
      motivo_duda: requiresRevision ? motivo : "",
      conflictoSanitario: false,
      alertaSanitaria: requiresRevision,
      dudas: requiresRevision ? [motivo] : [],
      alertas: requiresRevision ? [motivo] : [],
      origenMotor: sourceCode || null
    };
  }

  async function procesarAccionContrato(request) {
    var validation = contratos.validateIncomingRequest(request);
    var invalidMetricCtx;

    if (!validation.ok) {
      invalidMetricCtx = startOperation(contratos.normalizeIncomingRequest(request).meta);
      pushEvent(invalidMetricCtx, "error", validation.code, validation.message, validation.detail || null);
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: invalidMetricCtx.analysisId || null,
        traceId: invalidMetricCtx.traceId,
        elapsedMs: elapsedSince(invalidMetricCtx.startedAt),
        metricas: finalizeMetricas(invalidMetricCtx, {})
      }, {
        code: ERROR_CODES.CONTRATO_ENTRADA_INVALIDO,
        message: validation.message,
        passport: PASSPORTS.ROJO,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: {},
        tipoFallo: "irrecuperable_por_diseno",
        retryable: false
      });
    }

    var normalizedRequest = validation.normalized;
    var metricCtx = startOperation(normalizedRequest.meta);
    var context = {
      moduleName: MODULE_NAME,
      analysisId: metricCtx.analysisId,
      traceId: metricCtx.traceId,
      metricCtx: metricCtx
    };

    var textoAuditado = String(normalizedRequest.datos.textoAuditado == null ? "" : normalizedRequest.datos.textoAuditado);

    if (!textoAuditado.trim()) {
      pushEvent(metricCtx, "error", ERROR_CODES.SIN_TEXTO, "Boxer4 recibio texto vacio.", { passport: PASSPORTS.ROJO });
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: context.analysisId,
        traceId: context.traceId,
        elapsedMs: elapsedSince(metricCtx.startedAt),
        metricas: finalizeMetricas(metricCtx, {})
      }, {
        code: ERROR_CODES.SIN_TEXTO,
        message: "textoAuditado llego vacio o nulo.",
        passport: PASSPORTS.ROJO,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: {},
        tipoFallo: "irrecuperable_por_diseno",
        retryable: false
      });
    }

    try {
      pushEvent(metricCtx, "info", "B4_ANALISIS_LOCAL", "Analisis local Boxer4 iniciado.", { passport: PASSPORTS.VERDE });
      var raw = motor.Boxer4_Alergenos({
        textoAuditado: textoAuditado,
        analysisId: context.analysisId,
        traceId: context.traceId
      });

      if (!raw || typeof raw !== "object" || !raw.resultado || typeof raw.resultado !== "object") {
        pushEvent(metricCtx, "error", ERROR_CODES.SIN_BASE_ANALISIS, "Boxer4 devolvio estructura interna invalida.", { passport: PASSPORTS.ROJO });
        return errores.buildFailureEnvelope({
          moduleName: MODULE_NAME,
          analysisId: context.analysisId,
          traceId: context.traceId,
          elapsedMs: elapsedSince(metricCtx.startedAt),
          metricas: finalizeMetricas(metricCtx, {})
        }, {
          code: ERROR_CODES.SIN_BASE_ANALISIS,
          message: "La salida interna del motor Boxer4 no es util.",
          passport: PASSPORTS.ROJO,
          suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
          datos: {},
          tipoFallo: "desconocido",
          retryable: false
        });
      }

      if (raw.ok !== true) {
        var errorCode = raw.error && raw.error.code ? raw.error.code : ERROR_CODES.SIN_BASE_ANALISIS;
        var mappedCode = errorCode === "B4_SIN_TEXTO" ? ERROR_CODES.SIN_TEXTO : ERROR_CODES.SIN_BASE_ANALISIS;
        pushEvent(metricCtx, "error", mappedCode, raw.error && raw.error.message ? raw.error.message : "Fallo motor Boxer4.", {
          passport: PASSPORTS.ROJO
        });
        return errores.buildFailureEnvelope({
          moduleName: MODULE_NAME,
          analysisId: context.analysisId,
          traceId: context.traceId,
          elapsedMs: elapsedSince(metricCtx.startedAt),
          metricas: finalizeMetricas(metricCtx, {})
        }, {
          code: mappedCode,
          message: raw.error && raw.error.message ? raw.error.message : "El motor Boxer4 no pudo analizar.",
          passport: PASSPORTS.ROJO,
          suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
          datos: {},
          tipoFallo: raw.error && raw.error.tipoFallo ? raw.error.tipoFallo : "irrecuperable_por_diseno",
          retryable: !!(raw.error && raw.error.retryable)
        });
      }

      var legacyResult = raw.resultado || {};
      var inner = legacyResult.datos && legacyResult.datos.resultadoLocal ? legacyResult.datos.resultadoLocal : {};
      var passport = legacyResult.estadoPasaporteModulo || PASSPORTS.VERDE;
      var resultData = buildReasonData(inner, passport, "Boxer4_Motor");
      var totalAlergenos = resultData.alergenos.length;

      if (passport === PASSPORTS.NARANJA) {
        pushEvent(metricCtx, "warn", "B4_PERFIL_NARANJA", "Boxer4 devolvio perfil util con revision.", {
          passport: PASSPORTS.NARANJA
        });
      } else {
        pushEvent(metricCtx, "info", "B4_PERFIL_VERDE", "Boxer4 devolvio perfil sanitario util.", {
          passport: PASSPORTS.VERDE
        });
      }

      return buildEnvelope(context, {
        passport: passport,
        suggestedAction: passport === PASSPORTS.VERDE
          ? SUGGESTED_ACTIONS.GUARDAR_RESULTADO_ANALIZADO
          : SUGGESTED_ACTIONS.CONTINUAR_Y_MARCAR_REVISION,
        confidence: resultData.confidence,
        requiresRevision: resultData.requiereRevision,
        totalAlergenos: totalAlergenos,
        datos: resultData
      });
    } catch (err) {
      pushEvent(metricCtx, "error", ERROR_CODES.SIN_BASE_ANALISIS, err && err.message ? err.message : "Excepcion no controlada en Boxer4.", {
        passport: PASSPORTS.ROJO
      });
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        analysisId: context.analysisId,
        traceId: context.traceId,
        elapsedMs: elapsedSince(metricCtx.startedAt),
        metricas: finalizeMetricas(metricCtx, {})
      }, {
        code: ERROR_CODES.SIN_BASE_ANALISIS,
        message: err && err.message ? err.message : "Excepcion no controlada en Boxer4.",
        passport: PASSPORTS.ROJO,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        datos: {},
        tipoFallo: "desconocido",
        retryable: true
      });
    }
  }

  var api = {
    procesarAccionContrato: procesarAccionContrato
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.Boxer4Alergenos = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../ia/boxer4_alergenos.js */

;/* BEGIN ../../backend/ia/boxer_family_gateway.js */
(function initBoxerFamilyGatewayModule(globalScope) {
  "use strict";

  var builtinBoxer2 = null;
  var builtinBoxer3 = null;
  var builtinBoxer4 = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      builtinBoxer2 = require("../../frontend/boxer2/boxer2_identidad.js");
    } catch (errRequire) {
      builtinBoxer2 = null;
    }
    try {
      builtinBoxer3 = require("../../frontend/boxer3/boxer3_peso_formato.js");
    } catch (errRequire2) {
      builtinBoxer3 = null;
    }
    try {
      builtinBoxer4 = require("../../frontend/boxer4/boxer4_alergenos.js");
    } catch (errRequire3) {
      builtinBoxer4 = null;
    }
  }
  if (!builtinBoxer2 && globalScope && globalScope.Boxer2Identidad) {
    builtinBoxer2 = globalScope.Boxer2Identidad;
  }
  if (!builtinBoxer3 && globalScope && globalScope.Boxer3PesoFormato) {
    builtinBoxer3 = globalScope.Boxer3PesoFormato;
  }
  if (!builtinBoxer4 && globalScope && globalScope.Boxer4Alergenos) {
    builtinBoxer4 = globalScope.Boxer4Alergenos;
  }

  function buildGatewayError(boxerName, message, retryable, detail) {
    var traceId = detail && detail.traceId ? detail.traceId : null;
    return {
      ok: false,
      resultado: {
        modulo: boxerName || null,
        estadoPasaporteModulo: "ROJO",
        elapsedMs: 0,
        traceId: traceId,
        datos: detail || {}
      },
      error: {
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        origin: "BoxerFamilyGateway",
        passport: "ROJO",
        message: message || "Gateway Boxer fallo.",
        retryable: !!retryable,
        tipoFallo: "desconocido"
      }
    };
  }

  async function invokeBoxer(options) {
    var safeOptions = options || {};
    var boxerName = String(safeOptions.boxer || "").trim();
    var handlers = safeOptions.handlers || {};
    var handler = handlers[boxerName];

    if (!handler && boxerName === "Boxer2_Identidad" && builtinBoxer2 && typeof builtinBoxer2.procesarAccionContrato === "function") {
      handler = builtinBoxer2.procesarAccionContrato;
    }
    if (!handler && boxerName === "Boxer3_PesoFormato" && builtinBoxer3 && typeof builtinBoxer3.procesarAccionContrato === "function") {
      handler = builtinBoxer3.procesarAccionContrato;
    }
    if (!handler && boxerName === "Boxer4_Alergenos" && builtinBoxer4 && typeof builtinBoxer4.procesarAccionContrato === "function") {
      handler = builtinBoxer4.procesarAccionContrato;
    }

    if (!boxerName) {
      return buildGatewayError(null, "Falta boxer de destino.", false, {});
    }
    if (typeof handler !== "function") {
      return buildGatewayError(boxerName, "El Boxer aun no esta conectado.", false, {
        boxer: boxerName,
        traceId: safeOptions.meta ? safeOptions.meta.traceId : null
      });
    }

    var request = {
      moduloOrigen: safeOptions.moduloOrigen || "Cerebro_Orquestador",
      moduloDestino: boxerName,
      accion: safeOptions.action || "",
      sessionToken: safeOptions.sessionToken || "",
      meta: safeOptions.meta || {},
      datos: safeOptions.datos || {}
    };

    try {
      return await handler(request, safeOptions.deps || {});
    } catch (err) {
      return buildGatewayError(boxerName, err && err.message ? err.message : "Excepcion no controlada en Boxer.", true, {
        boxer: boxerName,
        traceId: request.meta ? request.meta.traceId : null
      });
    }
  }

  var api = {
    invokeBoxer: invokeBoxer
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroBoxerFamilyGateway = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../../backend/ia/boxer_family_gateway.js */

;/* BEGIN ../../backend/ia/cerebro_broker_ia.js */
(function initCerebroBrokerIaModule(globalScope) {
  "use strict";

  var DEFAULT_MODEL = "gemini-3.1-flash-lite-preview";
  var DEFAULT_BACKEND_URL = "https://europe-west1-project-a6f6b968-a591-4b1f-823.cloudfunctions.net/api";

  function asPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeTaskList(tasks) {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter(function each(task) {
      return asPlainObject(task) && String(task.taskId || "").trim();
    });
  }

  function buildError(code, message, detail) {
    return {
      ok: false,
      code: code,
      message: message,
      detail: detail || null
    };
  }

  function buildFirebaseBody(payload) {
    var safePayload = asPlainObject(payload) ? payload : {};
    var sessionToken = String(safePayload.sessionToken || "").trim();

    return {
      moduloDestino: "TRASTIENDA",
      accion: "procesarGeminiLoteCerebro",
      sessionToken: sessionToken,
      payload: {
        analysisId: String(safePayload.analysisId || "").trim(),
        traceId: String(safePayload.traceId || "").trim(),
        modelo: String(safePayload.modelo || DEFAULT_MODEL).trim() || DEFAULT_MODEL,
        totalBoxersConvocados: Number(safePayload.totalBoxersConvocados) || 0,
        totalRespuestasContadas: Number(safePayload.totalRespuestasContadas) || 0,
        tasks: normalizeTaskList(safePayload.tasks),
        sessionToken: sessionToken,
        token: sessionToken
      }
    };
  }

  function unwrapBackendPayload(rawResponse) {
    var payload = asPlainObject(rawResponse && rawResponse.data) ? rawResponse.data : rawResponse;

    if (asPlainObject(payload && payload.resultado)) payload = payload.resultado;
    if (asPlainObject(payload && payload.data)) payload = payload.data;
    if (asPlainObject(payload && payload.respuesta)) payload = payload.respuesta;

    return payload;
  }

  function unwrapSubresponse(raw) {
    var payload = asPlainObject(raw) ? raw : null;

    if (payload && String(payload.taskId || "").trim()) return payload;
    if (payload && asPlainObject(payload.resultado) && String(payload.resultado.taskId || "").trim()) {
      return payload.resultado;
    }
    if (payload && asPlainObject(payload.respuesta) && String(payload.respuesta.taskId || "").trim()) {
      return payload.respuesta;
    }
    if (payload && asPlainObject(payload.data) && String(payload.data.taskId || "").trim()) {
      return payload.data;
    }

    if (!payload && asPlainObject(raw && raw.data)) payload = raw.data;
    if (asPlainObject(payload && payload.resultado)) payload = payload.resultado;
    if (asPlainObject(payload && payload.data) && !String(payload.taskId || "").trim()) payload = payload.data;
    return payload;
  }

  async function enviarLoteIA(payload, deps) {
    var safeDeps = deps || {};

    if (typeof safeDeps.brokerResolver === "function") {
      return safeDeps.brokerResolver(payload);
    }
    if (typeof safeDeps.iaResolver === "function") {
      return safeDeps.iaResolver(payload);
    }
    if (typeof safeDeps.backendResolver === "function") {
      return safeDeps.backendResolver(payload);
    }

    var hasExplicitBackendUrl = Object.prototype.hasOwnProperty.call(safeDeps, "backendUrl") &&
      safeDeps.backendUrl !== undefined;
    var hasExplicitFetch = Object.prototype.hasOwnProperty.call(safeDeps, "fetch") &&
      safeDeps.fetch !== undefined;
    var backendUrl = hasExplicitBackendUrl
      ? safeDeps.backendUrl
      : (safeDeps.cerebroBrokerBackendUrl ||
        (safeDeps.config && safeDeps.config.cerebroBrokerBackendUrl) ||
        (globalScope && globalScope.CEREBRO_BROKER_IA_URL) ||
        DEFAULT_BACKEND_URL);
    var fetchImpl = hasExplicitFetch
      ? safeDeps.fetch
      : (typeof fetch === "function" ? fetch.bind(globalScope) : null);

    if (!backendUrl || !fetchImpl) {
      return buildError("CER_BROKER_NO_CONFIGURADO", "Broker IA de Cerebro no configurado.");
    }

    try {
      var response = await fetchImpl(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildFirebaseBody(payload))
      });

      if (!response || response.ok !== true) {
        return buildError("CER_BROKER_HTTP_ERROR", "Broker IA devolvio HTTP no valido.", {
          status: response ? response.status : null
        });
      }

      return {
        ok: true,
        data: await response.json()
      };
    } catch (err) {
      return buildError("CER_BROKER_HTTP_ERROR", err && err.message ? err.message : "Fallo llamando Broker IA.");
    }
  }

  function validarRespuestaLote(rawResponse, expected) {
    var expectedMeta = expected || {};
    var payload = unwrapBackendPayload(rawResponse);
    if (!asPlainObject(payload)) {
      return buildError("CER_BROKER_RESPUESTA_INVALIDA", "La respuesta global del Broker no es un objeto valido.");
    }

    var analysisId = String(payload.analysisId || "").trim();
    var traceId = String(payload.traceId || "").trim();
    var geminiBatchId = String(payload.geminiBatchId || "").trim();
    var respuestas = Array.isArray(payload.respuestas)
      ? payload.respuestas
      : (Array.isArray(payload.subrespuestas)
        ? payload.subrespuestas
        : (Array.isArray(payload.tasks)
          ? payload.tasks
          : []));

    if (expectedMeta.analysisId && analysisId && analysisId !== expectedMeta.analysisId) {
      return buildError("CER_BROKER_RESPUESTA_INVALIDA", "analysisId invalido en respuesta de Broker.", {
        analysisId: analysisId
      });
    }
    if (expectedMeta.traceId && traceId && traceId !== expectedMeta.traceId) {
      return buildError("CER_BROKER_RESPUESTA_INVALIDA", "traceId invalido en respuesta de Broker.", {
        traceId: traceId
      });
    }
    if (!Array.isArray(respuestas)) {
      return buildError("CER_BROKER_RESPUESTA_INVALIDA", "La respuesta del Broker no trae subtareas.");
    }

    return {
      ok: true,
      normalized: {
        analysisId: analysisId || expectedMeta.analysisId || null,
        traceId: traceId || expectedMeta.traceId || null,
        geminiBatchId: geminiBatchId || null,
        respuestas: respuestas
      }
    };
  }

  function separarSubrespuestas(validatedResponse, expectedTasks) {
    var safeValidated = validatedResponse && validatedResponse.normalized
      ? validatedResponse.normalized
      : { respuestas: [] };
    var requestedTasks = normalizeTaskList(expectedTasks);
    var expectedByTaskId = Object.create(null);
    var byTaskId = Object.create(null);
    var rejected = [];
    var contaminadas = 0;
    var duplicadas = 0;
    var resueltas = 0;

    requestedTasks.forEach(function each(task) {
      expectedByTaskId[String(task.taskId).trim()] = task;
    });

    for (var i = 0; i < safeValidated.respuestas.length; i += 1) {
      var raw = safeValidated.respuestas[i];
      var payload = unwrapSubresponse(raw);
      if (!asPlainObject(payload)) {
        contaminadas += 1;
        rejected.push({ code: "respuesta_no_objeto", raw: raw });
        continue;
      }

      var taskId = String(payload.taskId || "").trim();
      if (!taskId || !expectedByTaskId[taskId]) {
        contaminadas += 1;
        rejected.push({ code: "taskId_no_esperado", raw: payload });
        continue;
      }
      if (byTaskId[taskId]) {
        duplicadas += 1;
        delete byTaskId[taskId];
        rejected.push({ code: "taskId_duplicado", raw: payload });
        continue;
      }

      var expected = expectedByTaskId[taskId];
      var analysisId = String(payload.analysisId || "").trim();
      var traceId = String(payload.traceId || "").trim();
      var schemaId = String(payload.schemaId || "").trim();
      var tipoTarea = String(payload.tipoTarea || "").trim();
      var moduloSolicitante = String(payload.moduloSolicitante || "").trim();

      if ((expected.analysisId && analysisId && analysisId !== expected.analysisId) ||
          (expected.traceId && traceId && traceId !== expected.traceId) ||
          (expected.schemaId && schemaId && schemaId !== expected.schemaId) ||
          (expected.tipoTarea && tipoTarea && tipoTarea !== expected.tipoTarea) ||
          (expected.moduloSolicitante && moduloSolicitante && moduloSolicitante !== expected.moduloSolicitante)) {
        contaminadas += 1;
        rejected.push({ code: "subrespuesta_contaminada", raw: payload });
        continue;
      }

      byTaskId[taskId] = payload;
      resueltas += 1;
    }

    var descartadas = 0;
    requestedTasks.forEach(function each(task) {
      if (!byTaskId[String(task.taskId).trim()]) {
        descartadas += 1;
      }
    });

    return {
      ok: true,
      byTaskId: byTaskId,
      geminiBatchId: safeValidated.geminiBatchId || null,
      resueltas: resueltas,
      contaminadas: contaminadas + duplicadas,
      descartadas: descartadas,
      rejected: rejected
    };
  }

  var api = {
    DEFAULT_MODEL: DEFAULT_MODEL,
    DEFAULT_BACKEND_URL: DEFAULT_BACKEND_URL,
    enviarLoteIA: enviarLoteIA,
    validarRespuestaLote: validarRespuestaLote,
    separarSubrespuestas: separarSubrespuestas
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroBrokerIa = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../../backend/ia/cerebro_broker_ia.js */

;/* BEGIN ../../backend/ia/cerebro_productos_repository_resolver.js */
(function initCerebroProductosRepositoryResolverModule(globalScope) {
  "use strict";

  var firestoreIndexFactory = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      firestoreIndexFactory = require("../../backend/adaptadores/firestore_productos_remote.js");
    } catch (errRequire) {
      firestoreIndexFactory = null;
    }
  }
  if (!firestoreIndexFactory && globalScope && globalScope.Fase3FirestoreProductosRemote) {
    firestoreIndexFactory = globalScope.Fase3FirestoreProductosRemote;
  }

  var DEFAULT_COLLECTION = "fase3_productos";
  var cache = {
    appId: null,
    collectionName: null,
    repository: null
  };

  function buildError(errorCode, message, detail) {
    return {
      ok: false,
      errorCode: errorCode,
      message: message,
      detail: detail || null
    };
  }

  function resolveRuntime(deps) {
    var safeDeps = deps || {};
    return safeDeps.firebaseRuntime ||
      safeDeps.fase3FirebaseRuntime ||
      (globalScope && globalScope.Fase3FirebaseRuntime) ||
      null;
  }

  function resolveFactory(deps) {
    var safeDeps = deps || {};
    return safeDeps.productRepositoryFactory ||
      safeDeps.firestoreProductIndexFactory ||
      firestoreIndexFactory;
  }

  function resolveCollectionName(deps) {
    var safeDeps = deps || {};
    return String(safeDeps.productCollectionName || DEFAULT_COLLECTION).trim() || DEFAULT_COLLECTION;
  }

  function getAppId(runtime) {
    return runtime && runtime.app && runtime.app.options && runtime.app.options.appId
      ? String(runtime.app.options.appId).trim()
      : "unknown";
  }

  function buildRepository(factory, runtime, collectionName) {
    if (factory && typeof factory.createFirestoreProductosRemote === "function") {
      return factory.createFirestoreProductosRemote({
        firebaseApp: runtime.app,
        firestoreModule: runtime.firestoreModule,
        collectionName: collectionName,
        waitForAuth: typeof runtime.waitForAuth === "function" ? runtime.waitForAuth : null
      });
    }
    if (typeof factory === "function") {
      return factory({
        firebaseApp: runtime.app,
        firestoreModule: runtime.firestoreModule,
        collectionName: collectionName
      });
    }
    return buildError("CEREBRO_PRODUCT_REPOSITORY_FACTORY_INVALIDA", "No existe una fabrica valida para productos Firestore.");
  }

  function resolveProductRepository(deps) {
    var runtime = resolveRuntime(deps);
    if (!runtime || runtime.ok !== true || !runtime.app || !runtime.firestoreModule) {
      return buildError("CEREBRO_FIREBASE_RUNTIME_NO_LISTO", "Firebase de productos no esta listo para Fase 5.");
    }

    var factory = resolveFactory(deps);
    if (!factory) {
      return buildError("CEREBRO_PRODUCT_REPOSITORY_FACTORY_FALTANTE", "Falta la fabrica del repositorio real de productos.");
    }

    var collectionName = resolveCollectionName(deps);
    var appId = getAppId(runtime);
    if (cache.repository && cache.appId === appId && cache.collectionName === collectionName) {
      return {
        ok: true,
        repository: cache.repository,
        source: "cache",
        appId: appId,
        collectionName: collectionName
      };
    }

    var repository = buildRepository(factory, runtime, collectionName);
    if (!repository || repository.ok !== true) {
      return buildError(
        repository && repository.errorCode ? repository.errorCode : "CEREBRO_PRODUCT_REPOSITORY_BUILD_FAILED",
        repository && repository.message ? repository.message : "No se pudo preparar el repositorio real de productos.",
        repository && repository.detail ? repository.detail : null
      );
    }

    cache.appId = appId;
    cache.collectionName = collectionName;
    cache.repository = repository;

    return {
      ok: true,
      repository: repository,
      source: "runtime",
      appId: appId,
      collectionName: collectionName
    };
  }

  function resetCache() {
    cache.appId = null;
    cache.collectionName = null;
    cache.repository = null;
  }

  var api = {
    DEFAULT_COLLECTION: DEFAULT_COLLECTION,
    resolveProductRepository: resolveProductRepository,
    resetCache: resetCache
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroProductosRepositoryResolver = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);


;/* END ../../backend/ia/cerebro_productos_repository_resolver.js */

;/* BEGIN ../ia/cerebro_contratos.js */
(function initCerebroContratosModule(globalScope) {
  "use strict";

  var MODULE_NAME = "Cerebro_Orquestador";
  var CONTRACT_VERSION = "BOXER_PLUG_V1";

  var MODULES = Object.freeze({
    WEB_OPERATIVA: "Web_Operativa",
    CEREBRO: MODULE_NAME,
    BOXER1: "Boxer1_Core",
    BOXER2: "Boxer2_Identidad",
    BOXER3: "Boxer3_PesoFormato",
    BOXER4: "Boxer4_Alergenos",
    DATOS: "Datos_Persistencia",
    REVISION: "Revision_Incidencias"
  });

  var ACTIONS = Object.freeze({
    SOLICITAR_ANALISIS_FOTO: "solicitar_analisis_foto",
    ANALIZAR_TEXTO_ETIQUETA: "analizar_texto_etiqueta",
    RESOLVER_IDENTIDAD: "resolver_identidad_producto",
    RESOLVER_FORMATO: "resolver_formato_comercial",
    CLASIFICAR_ALERGENOS: "clasificar_alergenos",
    GUARDAR_RESULTADO: "guardar_resultado_analizado",
    ABRIR_REVISION: "abrir_revision_producto"
  });

  var PASSPORTS = Object.freeze({
    VERDE: "VERDE",
    NARANJA: "NARANJA",
    ROJO: "ROJO"
  });

  var IA_STATES = Object.freeze({
    NECESITA_LLAMADA: "NECESITA_LLAMADA",
    NO_NECESITA_LLAMADA: "NO_NECESITA_LLAMADA",
    NO_APLICA: "NO_APLICA",
    PENDIENTE_LOCAL: "PENDIENTE_LOCAL"
  });

  var CONFIDENCE = Object.freeze({
    ALTA: "alta",
    MEDIA: "media",
    BAJA: "baja"
  });

  var DECISION_FLOW = Object.freeze({
    GUARDAR: "guardar",
    REVISION: "revision",
    BLOQUEO: "bloqueo",
    ABORTADO: "abortado"
  });

  var SUGGESTED_ACTIONS = Object.freeze({
    GUARDAR_RESULTADO_ANALIZADO: "guardar_resultado_analizado",
    CONTINUAR_Y_MARCAR_REVISION: "continuar_y_marcar_revision",
    ABRIR_REVISION: "abrir_revision",
    BLOQUEAR_GUARDADO: "bloquear_guardado",
    ABORTAR_FLUJO: "abortar_flujo"
  });

  var FAIL_TYPES = Object.freeze({
    DESCONOCIDO: "desconocido",
    REPARACION_AGOTADA: "reparacion_agotada",
    IRRECUPERABLE_POR_DISENO: "irrecuperable_por_diseno"
  });

  function asPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizePassport(value) {
    var safe = String(value || "").trim().toUpperCase();
    if (safe === PASSPORTS.VERDE || safe === PASSPORTS.NARANJA || safe === PASSPORTS.ROJO) return safe;
    return null;
  }

  function normalizeConfidence(value) {
    var safe = String(value || "").trim().toLowerCase();
    if (safe === CONFIDENCE.ALTA || safe === CONFIDENCE.MEDIA || safe === CONFIDENCE.BAJA) return safe;
    return CONFIDENCE.MEDIA;
  }

  function normalizeIaState(value) {
    var safe = String(value || "").trim().toUpperCase();
    if (safe === IA_STATES.NECESITA_LLAMADA ||
        safe === IA_STATES.NO_NECESITA_LLAMADA ||
        safe === IA_STATES.NO_APLICA ||
        safe === IA_STATES.PENDIENTE_LOCAL) {
      return safe;
    }
    return IA_STATES.NO_NECESITA_LLAMADA;
  }

  function normalizeSendMode(value) {
    var safe = String(value || "").trim().toLowerCase();
    if (safe === "normal") return "normal";
    return "base64";
  }

  function normalizeContextoAlta(value) {
    var safe = String(value || "").trim().toLowerCase();
    if (safe === "lote") return "lote";
    return "individual";
  }

  function normalizeSensitivity(value) {
    var safe = String(value || "").trim().toLowerCase();
    if (safe === "baja" || safe === "media" || safe === "alta") return safe;
    return null;
  }

  function normalizeExpect(value) {
    if (!Array.isArray(value)) return [];
    return value.map(function each(item) {
      return String(item || "").trim();
    }).filter(Boolean);
  }

  function normalizeImageRefs(data) {
    var refs = [];
    if (Array.isArray(data.imageRefs)) {
      refs = data.imageRefs.map(function each(item) {
        return String(item || "").trim();
      }).filter(Boolean);
    }
    if (!refs.length && data.imageRef) {
      refs.push(String(data.imageRef).trim());
    }
    return refs;
  }

  function splitBoxer1Lines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map(function each(line) {
        return String(line || "").trim();
      })
      .filter(Boolean);
  }

  function buildBoxer1Blocks(rawLocal) {
    var palabras = Array.isArray(rawLocal && rawLocal.palabrasOCR) ? rawLocal.palabrasOCR : [];
    var grouped = Object.create(null);
    var order = [];
    var i = 0;

    for (i = 0; i < palabras.length; i += 1) {
      var item = asPlainObject(palabras[i]) ? palabras[i] : null;
      if (!item) continue;
      var key = String(Number(item.pageIndex) || 0) + ":" + String(Number(item.blockIndex) || 0);
      if (!grouped[key]) {
        grouped[key] = {
          pageIndex: Number(item.pageIndex) || 0,
          blockIndex: Number(item.blockIndex) || 0,
          palabras: []
        };
        order.push(key);
      }
      grouped[key].palabras.push({
        texto: String(item.texto || "").trim(),
        pageIndex: Number(item.pageIndex) || 0,
        blockIndex: Number(item.blockIndex) || 0,
        wordIndex: Number(item.wordIndex) || 0
      });
    }

    if (order.length) {
      return order.map(function each(key) {
        var block = grouped[key];
        return {
          pageIndex: block.pageIndex,
          blockIndex: block.blockIndex,
          texto: block.palabras.map(function eachWord(word) {
            return word.texto;
          }).filter(Boolean).join(" "),
          palabras: block.palabras
        };
      });
    }

    return splitBoxer1Lines(rawLocal && rawLocal.textoBase).map(function eachLine(line, index) {
      return {
        pageIndex: 0,
        blockIndex: index,
        texto: line,
        palabras: []
      };
    });
  }

  function buildBoxer1RoiRefs(rawLocal) {
    var slots = rawLocal && rawLocal.loteRescate && Array.isArray(rawLocal.loteRescate.slots)
      ? rawLocal.loteRescate.slots
      : [];

    return slots.map(function each(slot, index) {
      var safeSlot = asPlainObject(slot) ? slot : {};
      return {
        slotId: String(safeSlot.slotId || ("R" + (index + 1))).trim(),
        textoOriginal: String(safeSlot.textoOriginal || "").trim(),
        contextoAntes: String(safeSlot.contextBefore || "").trim(),
        contextoDespues: String(safeSlot.contextAfter || "").trim()
      };
    }).filter(function keep(item) {
      return !!item.slotId;
    });
  }

  function buildBoxer1PendingDatos(rawLocal) {
    var textoBase = String(rawLocal && rawLocal.textoBase || "").trim();
    var roiRefsRevision = buildBoxer1RoiRefs(rawLocal);
    var noResueltas = roiRefsRevision.map(function each(item) {
      return item.slotId;
    });

    return {
      textoAuditado: textoBase,
      textoBaseVision: textoBase,
      lineasOCR: splitBoxer1Lines(textoBase),
      bloquesOCR: buildBoxer1Blocks(rawLocal),
      roiRefsRevision: roiRefsRevision,
      correcciones: [],
      noResueltas: noResueltas,
      detalleSlots: roiRefsRevision.slice(),
      dudas: roiRefsRevision.length ? ["ocr_con_duda_localizada"] : [],
      metricas: rawLocal && rawLocal.tiempos ? rawLocal.tiempos : null
    };
  }

  function isBoxer1RawPendingResult(result, iaState) {
    if (!asPlainObject(result)) return false;
    if (normalizePassport(result.estadoPasaporteModulo)) return false;
    if (result.finalizada === true && asPlainObject(result.respuestaFinal)) return false;
    if (iaState === IA_STATES.NECESITA_LLAMADA) return true;
    return !!(
      String(result.textoBase || "").trim() ||
      (result.loteRescate && Array.isArray(result.loteRescate.slots) && result.loteRescate.slots.length)
    );
  }

  function tryNormalizeBoxer1RawOutput(boxerName, response, result, expectedTraceId) {
    if (boxerName !== MODULES.BOXER1) return null;

    if (!Number.isFinite(Number(response.elapsedMs)) || Number(response.elapsedMs) < 0) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "elapsedMs invalido en salida Boxer.",
        detail: { boxer: boxerName }
      };
    }

    if (String(response.traceId || "").trim() !== String(expectedTraceId || "").trim()) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "traceId inconsistente en salida Boxer.",
        detail: { boxer: boxerName, traceId: response.traceId || null }
      };
    }

    if (result.finalizada === true && asPlainObject(result.respuestaFinal)) {
      var closed = validateBoxerOutput(boxerName, result.respuestaFinal, expectedTraceId);
      if (!closed.ok) return closed;
      closed.normalized.estadoIA = normalizeIaState(response.estadoIA);
      closed.normalized.tareasIA = Array.isArray(response.tareasIA) ? response.tareasIA : [];
      closed.normalized.resultadoLocal = result;
      return closed;
    }

    var iaState = normalizeIaState(response.estadoIA);
    if (!isBoxer1RawPendingResult(result, iaState)) return null;

    return {
      ok: true,
      normalized: {
        ok: true,
        resultado: {
          modulo: boxerName,
          estadoPasaporteModulo: PASSPORTS.NARANJA,
          elapsedMs: Math.max(0, Number(response.elapsedMs) || 0),
          traceId: String(response.traceId || "").trim(),
          datos: buildBoxer1PendingDatos(result),
          confidence: CONFIDENCE.MEDIA,
          requiereRevision: true
        },
        error: null,
        metricas: result.metricas || response.metricas || null,
        estadoIA: iaState,
        tareasIA: Array.isArray(response.tareasIA) ? response.tareasIA : [],
        resultadoLocal: result
      }
    };
  }

  function normalizeIncomingRequest(request) {
    var safeRequest = asPlainObject(request) ? request : {};
    var rawMeta = asPlainObject(safeRequest.meta) ? safeRequest.meta : {};
    var rawData = asPlainObject(safeRequest.datos) ? safeRequest.datos : {};
    var rawControls = asPlainObject(rawData.controlesUsuario) ? rawData.controlesUsuario : {};
    var imageRefs = normalizeImageRefs(rawData);

    return {
      moduloOrigen: String(safeRequest.moduloOrigen || "").trim(),
      moduloDestino: String(safeRequest.moduloDestino || "").trim(),
      accion: String(safeRequest.accion || "").trim(),
      sessionToken: String(safeRequest.sessionToken || "").trim(),
      meta: {
        versionContrato: String(rawMeta.versionContrato || CONTRACT_VERSION).trim() || CONTRACT_VERSION,
        analysisId: String(rawMeta.analysisId || "").trim(),
        traceId: String(rawMeta.traceId || "").trim(),
        batchId: rawMeta.batchId == null ? null : String(rawMeta.batchId).trim()
      },
      datos: {
        imageRefs: imageRefs,
        imageRef: imageRefs[0] || null,
        sendMode: normalizeSendMode(rawData.sendMode),
        contextoAlta: normalizeContextoAlta(rawData.contextoAlta),
        controlesUsuario: {
          timeBudgetMs: Number.isFinite(Number(rawControls.timeBudgetMs)) ? Math.max(0, Number(rawControls.timeBudgetMs)) : null,
          expect: normalizeExpect(rawControls.expect),
          agentEnabled: typeof rawControls.agentEnabled === "boolean" ? rawControls.agentEnabled : true,
          sensitivityMode: normalizeSensitivity(rawControls.sensitivityMode)
        },
        posiblesDuplicados: Array.isArray(rawData.posiblesDuplicados) ? rawData.posiblesDuplicados : [],
        senalesEnvase: rawData.senalesEnvase || null,
        contextoExtra: rawData.contextoExtra || null
      }
    };
  }

  function validateIncomingRequest(request) {
    var normalized = normalizeIncomingRequest(request);

    if (normalized.moduloOrigen !== MODULES.WEB_OPERATIVA) {
      return {
        ok: false,
        code: "CER_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloOrigen debe ser Web_Operativa.",
        detail: { moduloOrigen: normalized.moduloOrigen || null }
      };
    }
    if (normalized.moduloDestino !== MODULES.CEREBRO) {
      return {
        ok: false,
        code: "CER_CONTRATO_ENTRADA_INVALIDO",
        message: "moduloDestino debe ser Cerebro_Orquestador.",
        detail: { moduloDestino: normalized.moduloDestino || null }
      };
    }
    if (normalized.accion !== ACTIONS.SOLICITAR_ANALISIS_FOTO) {
      return {
        ok: false,
        code: "CER_CONTRATO_ENTRADA_INVALIDO",
        message: "accion invalida para Cerebro.",
        detail: { accion: normalized.accion || null }
      };
    }
    if (!normalized.sessionToken) {
      return {
        ok: false,
        code: "CER_CONTRATO_ENTRADA_INVALIDO",
        message: "Falta sessionToken.",
        detail: {}
      };
    }
    if (normalized.meta.versionContrato !== CONTRACT_VERSION) {
      return {
        ok: false,
        code: "CER_CONTRATO_ENTRADA_INVALIDO",
        message: "versionContrato invalida.",
        detail: { versionContrato: normalized.meta.versionContrato }
      };
    }
    if (!normalized.datos.imageRefs.length) {
      return {
        ok: false,
        code: "CER_CONTRATO_ENTRADA_INVALIDO",
        message: "Falta al menos una referencia de imagen.",
        detail: {}
      };
    }

    return {
      ok: true,
      normalized: normalized
    };
  }

  function validateBoxerOutput(boxerName, response, expectedTraceId) {
    if (!asPlainObject(response)) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "El Boxer devolvio una estructura invalida.",
        detail: { boxer: boxerName }
      };
    }

    if (typeof response.ok === "boolean") {
      var legacyResult = asPlainObject(response.resultado) ? response.resultado : null;
      if (!legacyResult) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "El Boxer no devolvio bloque resultado.",
          detail: { boxer: boxerName }
        };
      }

      if (String(legacyResult.modulo || "").trim() !== boxerName) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "El Boxer devolvio modulo incorrecto.",
          detail: { boxer: boxerName, modulo: legacyResult.modulo || null }
        };
      }

      var legacyPassport = normalizePassport(legacyResult.estadoPasaporteModulo);
      if (!legacyPassport) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "Falta estadoPasaporteModulo valido.",
          detail: { boxer: boxerName }
        };
      }

      if (!Number.isFinite(Number(legacyResult.elapsedMs)) || Number(legacyResult.elapsedMs) < 0) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "elapsedMs invalido en salida Boxer.",
          detail: { boxer: boxerName }
        };
      }

      if (String(legacyResult.traceId || "").trim() !== String(expectedTraceId || "").trim()) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "traceId inconsistente en salida Boxer.",
          detail: { boxer: boxerName, traceId: legacyResult.traceId || null }
        };
      }

      if (!asPlainObject(legacyResult.datos)) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "Falta bloque datos en salida Boxer.",
          detail: { boxer: boxerName }
        };
      }

      if (response.ok !== true && !asPlainObject(response.error)) {
        return {
          ok: false,
          code: "CER_SALIDA_BOXER_INCOMPATIBLE",
          message: "El Boxer fallo pero no devolvio error estructurado.",
          detail: { boxer: boxerName }
        };
      }

      return {
        ok: true,
        normalized: {
          ok: response.ok === true,
          resultado: {
            modulo: boxerName,
            estadoPasaporteModulo: legacyPassport,
            elapsedMs: Math.max(0, Number(legacyResult.elapsedMs) || 0),
            traceId: String(legacyResult.traceId || "").trim(),
            datos: legacyResult.datos,
            confidence: normalizeConfidence(legacyResult.confidence),
            requiereRevision: typeof legacyResult.requiereRevision === "boolean"
              ? legacyResult.requiereRevision
              : legacyPassport !== PASSPORTS.VERDE
          },
          error: response.error || null,
          metricas: response.metricas || null,
          estadoIA: normalizeIaState(IA_STATES.NO_NECESITA_LLAMADA),
          tareasIA: [],
          resultadoLocal: null
        }
      };
    }

    var result = asPlainObject(response.resultadoLocal) ? response.resultadoLocal : null;
    if (!result) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "El Boxer no devolvio bloque resultadoLocal.",
        detail: { boxer: boxerName }
      };
    }

    if (String(response.modulo || "").trim() !== boxerName) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "El Boxer devolvio modulo incorrecto.",
        detail: { boxer: boxerName, modulo: response.modulo || null }
      };
    }

    var boxer1Raw = tryNormalizeBoxer1RawOutput(boxerName, response, result, expectedTraceId);
    if (boxer1Raw) {
      return boxer1Raw;
    }

    var passport = normalizePassport(result.estadoPasaporteModulo);
    if (!passport) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "Falta estadoPasaporteModulo valido.",
        detail: { boxer: boxerName }
      };
    }

    if (!Number.isFinite(Number(response.elapsedMs)) || Number(response.elapsedMs) < 0) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "elapsedMs invalido en salida Boxer.",
        detail: { boxer: boxerName }
      };
    }

    if (String(response.traceId || "").trim() !== String(expectedTraceId || "").trim()) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "traceId inconsistente en salida Boxer.",
        detail: { boxer: boxerName, traceId: response.traceId || null }
      };
    }

    if (!asPlainObject(result.datos)) {
      return {
        ok: false,
        code: "CER_SALIDA_BOXER_INCOMPATIBLE",
        message: "Falta bloque datos en salida Boxer.",
        detail: { boxer: boxerName }
      };
    }

    var localError = asPlainObject(result.error) ? result.error : null;

    return {
      ok: true,
      normalized: {
        ok: !localError && passport !== PASSPORTS.ROJO,
        resultado: {
          modulo: boxerName,
          estadoPasaporteModulo: passport,
          elapsedMs: Math.max(0, Number(response.elapsedMs) || 0),
          traceId: String(response.traceId || "").trim(),
          datos: result.datos,
          confidence: normalizeConfidence(result.confidence),
          requiereRevision: typeof result.requiereRevision === "boolean"
            ? result.requiereRevision
            : passport !== PASSPORTS.VERDE || String(response.estadoIA || "").trim().toUpperCase() === "NECESITA_LLAMADA"
        },
        error: localError,
        metricas: result.metricas || response.metricas || null,
        estadoIA: normalizeIaState(response.estadoIA),
        tareasIA: Array.isArray(response.tareasIA) ? response.tareasIA : [],
        resultadoLocal: result
      }
    };
  }

  var api = {
    MODULE_NAME: MODULE_NAME,
    CONTRACT_VERSION: CONTRACT_VERSION,
    MODULES: MODULES,
    ACTIONS: ACTIONS,
    PASSPORTS: PASSPORTS,
    IA_STATES: IA_STATES,
    CONFIDENCE: CONFIDENCE,
    DECISION_FLOW: DECISION_FLOW,
    SUGGESTED_ACTIONS: SUGGESTED_ACTIONS,
    FAIL_TYPES: FAIL_TYPES,
    normalizePassport: normalizePassport,
    normalizeConfidence: normalizeConfidence,
    normalizeIaState: normalizeIaState,
    normalizeIncomingRequest: normalizeIncomingRequest,
    validateIncomingRequest: validateIncomingRequest,
    validateBoxerOutput: validateBoxerOutput
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroContratos = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../ia/cerebro_contratos.js */

;/* BEGIN ../ia/cerebro_errores.js */
(function initCerebroErroresModule(globalScope) {
  "use strict";

  var contratos = null;
  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./cerebro_contratos.js");
    } catch (errRequire) {
      contratos = null;
    }
  }
  if (!contratos && globalScope && globalScope.CerebroContratos) {
    contratos = globalScope.CerebroContratos;
  }

  var FAIL_TYPES = contratos ? contratos.FAIL_TYPES : {
    DESCONOCIDO: "desconocido",
    REPARACION_AGOTADA: "reparacion_agotada",
    IRRECUPERABLE_POR_DISENO: "irrecuperable_por_diseno"
  };

  var ERROR_CODES = Object.freeze({
    CONFLICTO_MOTORES: "CER_CONFLICTO_MOTORES",
    DUPLICADO_DUDOSO: "CER_DUPLICADO_DUDOSO",
    ARBITRAJE_IMPOSIBLE: "CER_ARBITRAJE_IMPOSIBLE",
    SALIDA_BOXER_INCOMPATIBLE: "CER_SALIDA_BOXER_INCOMPATIBLE",
    CONTRATO_ENTRADA_INVALIDO: "CER_CONTRATO_ENTRADA_INVALIDO",
    DESTINO_INTERNO_FALLIDO: "CER_DESTINO_INTERNO_FALLIDO",
    REPOSITORIO_PRODUCTOS_NO_DISPONIBLE: "CER_REPOSITORIO_PRODUCTOS_NO_DISPONIBLE",
    TIMEOUT_OPERACION: "CER_TIMEOUT_OPERACION"
  });

  function buildFailureEnvelope(context, options) {
    var safeContext = context || {};
    var safeOptions = options || {};
    var passport = String(safeOptions.passport || "ROJO").trim().toUpperCase() || "ROJO";

    return {
      ok: false,
      resultado: {
        estadoPasaporteModulo: passport,
        modulo: safeContext.moduleName || "Cerebro_Orquestador",
        accionSugeridaParaCerebro: safeOptions.suggestedAction || "abortar_flujo",
        elapsedMs: Math.max(0, Number(safeContext.elapsedMs) || 0),
        traceId: safeContext.traceId || null,
        datos: safeOptions.datos || {}
      },
      error: {
        code: safeOptions.code || ERROR_CODES.ARBITRAJE_IMPOSIBLE,
        origin: safeContext.moduleName || "Cerebro_Orquestador",
        passport: passport,
        message: safeOptions.message || "Fallo en Cerebro.",
        tipoFallo: safeOptions.tipoFallo || FAIL_TYPES.DESCONOCIDO,
        retryable: !!safeOptions.retryable
      },
      metricas: safeContext.metricas || null
    };
  }

  var api = {
    ERROR_CODES: ERROR_CODES,
    FAIL_TYPES: FAIL_TYPES,
    buildFailureEnvelope: buildFailureEnvelope
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroErrores = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../ia/cerebro_errores.js */

;/* BEGIN ../ia/cerebro_metricas.js */
(function initCerebroMetricasModule(globalScope) {
  "use strict";

  function nowMs() {
    return Date.now();
  }

  function elapsedSince(startMs) {
    return Math.max(0, nowMs() - Number(startMs || 0));
  }

  function dateStamp() {
    var date = new Date();
    var y = String(date.getFullYear());
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + m + d;
  }

  function makeAnalysisId() {
    return "A-" + dateStamp() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  function makeTraceId() {
    return "T-" + dateStamp() + "-" + Math.random().toString(36).slice(2, 10);
  }

  function startOperation(meta) {
    var safeMeta = meta || {};
    return {
      startedAt: nowMs(),
      analysisId: safeMeta.analysisId || makeAnalysisId(),
      traceId: safeMeta.traceId || makeTraceId(),
      eventos: [],
      tiempos: {
        total: 0,
        boxers: {}
      }
    };
  }

  function pushEvent(ctx, level, code, message, detail) {
    if (!ctx) return;
    ctx.eventos.push({
      ts: nowMs(),
      level: level || "info",
      code: code || "CER_EVENTO",
      message: message || "",
      detail: detail || null
    });
  }

  function recordBoxerTime(ctx, boxerName, elapsedMs) {
    if (!ctx || !ctx.tiempos || !ctx.tiempos.boxers) return;
    ctx.tiempos.boxers[boxerName] = Math.max(0, Number(elapsedMs) || 0);
  }

  function finalizeMetricas(ctx) {
    if (!ctx) return null;
    ctx.tiempos.total = elapsedSince(ctx.startedAt);
    return {
      analysisId: ctx.analysisId,
      traceId: ctx.traceId,
      elapsedMs: ctx.tiempos.total,
      tiempos: ctx.tiempos,
      eventos: ctx.eventos.slice()
    };
  }

  var api = {
    nowMs: nowMs,
    elapsedSince: elapsedSince,
    makeAnalysisId: makeAnalysisId,
    makeTraceId: makeTraceId,
    startOperation: startOperation,
    pushEvent: pushEvent,
    recordBoxerTime: recordBoxerTime,
    finalizeMetricas: finalizeMetricas
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroMetricas = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);

;/* END ../ia/cerebro_metricas.js */

;/* BEGIN ../ia/cerebro_arbitraje.js */
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

    return {
      nombre: boxer2.nombre || boxer2.nombrePropuesto || boxer2.nombreProducto || "",
      formato: boxer3.formato || boxer3.formato_normalizado || "",
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

;/* END ../ia/cerebro_arbitraje.js */

;/* BEGIN ../ia/cerebro_orquestador.js */
(function initCerebroOrquestadorModule(globalScope) {
  "use strict";

  var contratos = null;
  var errores = null;
  var metricas = null;
  var arbitraje = null;
  var defaultGateway = null;
  var defaultBrokerIA = null;
  var defaultProductosPersistencia = null;
  var defaultProductRepositoryResolver = null;
  var defaultBoxer2Module = null;
  var defaultBoxer3Module = null;
  var defaultBoxer1Module = null;

  if (typeof module !== "undefined" && module.exports) {
    try {
      contratos = require("./cerebro_contratos.js");
      errores = require("./cerebro_errores.js");
      metricas = require("./cerebro_metricas.js");
      arbitraje = require("./cerebro_arbitraje.js");
      defaultGateway = require("../../backend/adaptadores/boxer_family_gateway.js");
      defaultBrokerIA = require("../../backend/adaptadores/cerebro_broker_ia.js");
      defaultProductosPersistencia = require("../../backend/adaptadores/cerebro_productos_persistencia.js");
      defaultProductRepositoryResolver = require("../../backend/adaptadores/cerebro_productos_repository_resolver.js");
      defaultBoxer2Module = require("../boxer2/boxer2_identidad.js");
      defaultBoxer3Module = require("../boxer3/boxer3_peso_formato.js");
      defaultBoxer1Module = require("../../backend/boxer1/backend/operativa/B1_core.js");
    } catch (errRequire) {
      contratos = null;
      errores = null;
      metricas = null;
      arbitraje = null;
      defaultGateway = null;
      defaultBrokerIA = null;
      defaultProductosPersistencia = null;
      defaultProductRepositoryResolver = null;
      defaultBoxer2Module = null;
      defaultBoxer3Module = null;
      defaultBoxer1Module = null;
    }
  }

  if (!contratos && globalScope && globalScope.CerebroContratos) contratos = globalScope.CerebroContratos;
  if (!errores && globalScope && globalScope.CerebroErrores) errores = globalScope.CerebroErrores;
  if (!metricas && globalScope && globalScope.CerebroMetricas) metricas = globalScope.CerebroMetricas;
  if (!arbitraje && globalScope && globalScope.CerebroArbitraje) arbitraje = globalScope.CerebroArbitraje;
  if (!defaultGateway && globalScope && globalScope.CerebroBoxerFamilyGateway) defaultGateway = globalScope.CerebroBoxerFamilyGateway;
  if (!defaultBrokerIA && globalScope && globalScope.CerebroBrokerIa) defaultBrokerIA = globalScope.CerebroBrokerIa;
  if (!defaultProductosPersistencia && globalScope && globalScope.CerebroProductosPersistencia) defaultProductosPersistencia = globalScope.CerebroProductosPersistencia;
  if (!defaultProductRepositoryResolver && globalScope && globalScope.CerebroProductosRepositoryResolver) defaultProductRepositoryResolver = globalScope.CerebroProductosRepositoryResolver;
  if (!defaultBoxer2Module && globalScope && globalScope.Boxer2Identidad) defaultBoxer2Module = globalScope.Boxer2Identidad;
  if (!defaultBoxer3Module && globalScope && globalScope.Boxer3PesoFormato) defaultBoxer3Module = globalScope.Boxer3PesoFormato;
  if (!defaultBoxer1Module && globalScope && typeof globalScope.B1_cerrarConSubrespuestaIA === "function") {
    defaultBoxer1Module = {
      B1_cerrarConSubrespuestaIA: globalScope.B1_cerrarConSubrespuestaIA
    };
  }

  var MODULE_NAME = contratos.MODULE_NAME;
  var MODULES = contratos.MODULES;
  var ACTIONS = contratos.ACTIONS;
  var PASSPORTS = contratos.PASSPORTS;
  var IA_STATES = contratos.IA_STATES;
  var SUGGESTED_ACTIONS = contratos.SUGGESTED_ACTIONS;
  var FAIL_TYPES = contratos.FAIL_TYPES;
  var ERROR_CODES = errores.ERROR_CODES;
  var ROUTE_IDEMPOTENCY_TTL_MS = 120000;
  var ROUTE_IDEMPOTENCY_STORAGE_KEY = "fase5_cerebro_route_idempotency_v1";
  var routeIdempotencyCache = Object.create(null);

  function safeClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (errClone) {
      return value;
    }
  }

  function traceAnalysisEvent(name, data, meta) {
    if (!globalScope || !globalScope.AnalysisExclusiveRuntime || typeof globalScope.AnalysisExclusiveRuntime.trace !== "function") {
      return;
    }
    globalScope.AnalysisExclusiveRuntime.trace(name, data || null, Object.assign({ source: "cerebro" }, meta || {}));
  }

  function cleanupRouteIdempotencyCache(nowMs) {
    var keys = Object.keys(routeIdempotencyCache);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var entry = routeIdempotencyCache[key];
      if (!entry || Number(entry.expiresAt || 0) <= nowMs) {
        delete routeIdempotencyCache[key];
      }
    }
  }

  function canUseStorage() {
    try {
      return !!(
        globalScope &&
        globalScope.localStorage &&
        typeof globalScope.localStorage.getItem === "function" &&
        typeof globalScope.localStorage.setItem === "function"
      );
    } catch (errStorage) {
      return false;
    }
  }

  function readRouteIdempotencyStorage(nowMs) {
    if (!canUseStorage()) return Object.create(null);
    var raw = null;
    try {
      raw = globalScope.localStorage.getItem(ROUTE_IDEMPOTENCY_STORAGE_KEY);
    } catch (errRead) {
      raw = null;
    }
    if (!raw) return Object.create(null);
    var parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (errParse) {
      parsed = null;
    }
    var safeParsed = parsed && typeof parsed === "object" ? parsed : {};
    var out = Object.create(null);
    var keys = Object.keys(safeParsed);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var entry = safeParsed[key];
      if (!entry || typeof entry !== "object") continue;
      if (Number(entry.expiresAt || 0) <= nowMs) continue;
      out[key] = entry;
    }
    return out;
  }

  function writeRouteIdempotencyStorage(map) {
    if (!canUseStorage()) return;
    try {
      globalScope.localStorage.setItem(ROUTE_IDEMPOTENCY_STORAGE_KEY, JSON.stringify(map || {}));
    } catch (errWrite) {
      // No-op.
    }
  }

  function buildDecisionIdempotencyKey(decision, meta) {
    var flow = String(decision && decision.decisionFlow || "").trim();
    var analysisId = String(meta && meta.analysisId || "").trim();
    var traceId = String(meta && meta.traceId || "").trim();
    var batchId = String(meta && meta.batchId || "").trim();
    if (!flow || !analysisId || !traceId) return "";
    return flow + "|" + analysisId + "|" + traceId + "|" + (batchId || "sin_batch");
  }

  function readRouteIdempotency(key, nowMs) {
    cleanupRouteIdempotencyCache(nowMs);
    var entry = routeIdempotencyCache[key];
    if (!entry || !entry.value) {
      var persisted = readRouteIdempotencyStorage(nowMs);
      var persistedEntry = persisted[key];
      if (!persistedEntry || !persistedEntry.value) return null;
      routeIdempotencyCache[key] = persistedEntry;
      entry = persistedEntry;
    }
    var cloned = safeClone(entry && entry.value ? entry.value : null);
    if (cloned && typeof cloned === "object") {
      cloned.deduped = true;
      cloned.idempotencyKey = key;
    }
    return cloned;
  }

  function storeRouteIdempotency(key, value, nowMs) {
    var entry = {
      value: safeClone(value),
      expiresAt: nowMs + ROUTE_IDEMPOTENCY_TTL_MS
    };
    routeIdempotencyCache[key] = entry;
    var persisted = readRouteIdempotencyStorage(nowMs);
    persisted[key] = entry;
    writeRouteIdempotencyStorage(persisted);
  }

  function isTimeBudgetExpired(meta, normalizedRequest) {
    var budgetMs = Number(
      normalizedRequest &&
      normalizedRequest.datos &&
      normalizedRequest.datos.controlesUsuario &&
      normalizedRequest.datos.controlesUsuario.timeBudgetMs
    );
    if (!Number.isFinite(budgetMs) || budgetMs <= 0) return false;
    return metricas.elapsedSince(meta.startedAt) >= Math.floor(budgetMs);
  }

  function buildTimeoutEnvelope(meta, summaries) {
    return errores.buildFailureEnvelope(buildContext(meta), {
      code: ERROR_CODES.TIMEOUT_OPERACION || "CER_TIMEOUT_OPERACION",
      message: "Cerebro supero el tiempo maximo de la operacion.",
      suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
      tipoFallo: FAIL_TYPES.REPARACION_AGOTADA,
      retryable: true,
      datos: buildFailureData(meta, {
        passport: PASSPORTS.ROJO,
        decisionFlow: contratos.DECISION_FLOW.ABORTADO,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        conflicts: ["timeout_operacion"],
        summaries: summaries || null
      })
    });
  }

  function buildMeta(normalizedRequest) {
    var ctx = metricas.startOperation(normalizedRequest.meta);
    return {
      analysisId: ctx.analysisId,
      traceId: ctx.traceId,
      startedAt: ctx.startedAt,
      metricCtx: ctx,
      versionContrato: contratos.CONTRACT_VERSION,
      batchId: normalizedRequest.meta.batchId || null
    };
  }

  function buildContext(meta) {
    return {
      moduleName: MODULE_NAME,
      traceId: meta.traceId,
      analysisId: meta.analysisId,
      elapsedMs: metricas.elapsedSince(meta.startedAt),
      metricas: metricas.finalizeMetricas(meta.metricCtx)
    };
  }

  function buildFailureData(meta, options) {
    var safeMeta = meta || {};
    var safeOptions = options || {};
    var safeSummaries = safeOptions.summaries || {};
    return arbitraje.buildFailureFinalData({
      analysisId: safeMeta.analysisId || null,
      traceId: safeMeta.traceId || null,
      elapsedMs: metricas.elapsedSince(safeMeta.startedAt)
    }, {
      passport: safeOptions.passport || PASSPORTS.ROJO,
      decisionFlow: safeOptions.decisionFlow || contratos.DECISION_FLOW.ABORTADO,
      suggestedAction: safeOptions.suggestedAction || SUGGESTED_ACTIONS.ABORTAR_FLUJO,
      propuestaFinal: safeOptions.propuestaFinal || null,
      dudas: safeOptions.dudas || [],
      conflicts: safeOptions.conflicts || [],
      roiRefsRevision: safeOptions.roiRefsRevision || [],
      posibleDuplicado: !!safeOptions.posibleDuplicado,
      duplicadoFusionable: !!safeOptions.duplicadoFusionable,
      coincidencias: safeOptions.coincidencias || [],
      modulos: {
        boxer1: safeSummaries.boxer1 && typeof arbitraje.buildModuleSnapshot === "function" ? arbitraje.buildModuleSnapshot(safeSummaries.boxer1) : null,
        boxer2: safeSummaries.boxer2 && typeof arbitraje.buildModuleSnapshot === "function" ? arbitraje.buildModuleSnapshot(safeSummaries.boxer2) : null,
        boxer3: safeSummaries.boxer3 && typeof arbitraje.buildModuleSnapshot === "function" ? arbitraje.buildModuleSnapshot(safeSummaries.boxer3) : null,
        boxer4: safeSummaries.boxer4 && typeof arbitraje.buildModuleSnapshot === "function" ? arbitraje.buildModuleSnapshot(safeSummaries.boxer4) : null
      }
    });
  }

  function buildBoxerRequest(boxerName, action, meta, normalizedRequest, extraData) {
    return {
      boxer: boxerName,
      action: action,
      moduloOrigen: MODULE_NAME,
      sessionToken: normalizedRequest.sessionToken,
      meta: {
        versionContrato: contratos.CONTRACT_VERSION,
        analysisId: meta.analysisId,
        traceId: meta.traceId,
        batchId: meta.batchId
      },
      datos: extraData || {},
      handlers: null,
      deps: null
    };
  }

  function buildDownstreamData(boxer1Summary, normalizedRequest) {
    return {
      textoAuditado: boxer1Summary.datos.textoAuditado || "",
      textoBaseVision: boxer1Summary.datos.textoBaseVision || "",
      lineasOCR: Array.isArray(boxer1Summary.datos.lineasOCR) ? boxer1Summary.datos.lineasOCR : [],
      bloquesOCR: Array.isArray(boxer1Summary.datos.bloquesOCR) ? boxer1Summary.datos.bloquesOCR : [],
      metadatosOpcionales: {
        marcaDetectada: boxer1Summary.datos.marcaDetectada || null,
        contenedor: normalizedRequest.datos.senalesEnvase && normalizedRequest.datos.senalesEnvase.contenedor
          ? normalizedRequest.datos.senalesEnvase.contenedor
          : null,
        idiomaProbable: normalizedRequest.datos.contextoExtra && normalizedRequest.datos.contextoExtra.idiomaProbable
          ? normalizedRequest.datos.contextoExtra.idiomaProbable
          : null,
        origen: normalizedRequest.datos.contextoAlta || null
      },
      roiRefsRevision: Array.isArray(boxer1Summary.datos.roiRefsRevision) ? boxer1Summary.datos.roiRefsRevision : [],
      contextoAlta: normalizedRequest.datos.contextoAlta,
      senalesEnvase: normalizedRequest.datos.senalesEnvase,
      controlesUsuario: normalizedRequest.datos.controlesUsuario
    };
  }

  function shouldRefreshDownstreamFromBoxer1(originalBoxer1Summary, refreshedBoxer1Summary) {
    if (!originalBoxer1Summary || !refreshedBoxer1Summary) return false;
    if (originalBoxer1Summary.estadoIA !== IA_STATES.NECESITA_LLAMADA) return false;
    if (!arbitraje.boxer1Usable(refreshedBoxer1Summary)) return false;

    var beforeText = String(
      originalBoxer1Summary.datos.textoAuditado ||
      originalBoxer1Summary.datos.textoBaseVision ||
      ""
    ).trim();
    var afterText = String(
      refreshedBoxer1Summary.datos.textoAuditado ||
      refreshedBoxer1Summary.datos.textoBaseVision ||
      ""
    ).trim();

    return !!afterText && afterText !== beforeText;
  }

  async function rerunDownstreamWithCorrectedBoxer1(boxer1Summary, normalizedRequest, meta, deps) {
    var downstreamData = buildDownstreamData(boxer1Summary, normalizedRequest);
    downstreamData.controlesUsuario = Object.assign({}, downstreamData.controlesUsuario || {}, {
      agentEnabled: false
    });

    var fanoutDeps = {
      gateway: deps.gateway,
      handlers: deps.handlers || {},
      destinations: deps.destinations || {},
      duplicateDetector: deps.duplicateDetector || null,
      productRepository: deps.productRepository
    };

    var fanout = await Promise.all([
      invokeAndValidate(MODULES.BOXER2, ACTIONS.RESOLVER_IDENTIDAD, downstreamData, normalizedRequest, meta, fanoutDeps),
      invokeAndValidate(MODULES.BOXER3, ACTIONS.RESOLVER_FORMATO, downstreamData, normalizedRequest, meta, fanoutDeps),
      invokeAndValidate(MODULES.BOXER4, ACTIONS.CLASIFICAR_ALERGENOS, downstreamData, normalizedRequest, meta, fanoutDeps)
    ]);

    var invalidFanout = fanout.find(function each(item) { return !item.ok; });
    if (invalidFanout) {
      return {
        ok: false,
        code: invalidFanout.code,
        message: invalidFanout.message,
        detail: invalidFanout.detail || null
      };
    }

    return {
      ok: true,
      summaries: {
        boxer1: boxer1Summary,
        boxer2: arbitraje.buildModuleSummary(MODULES.BOXER2, fanout[0].normalized),
        boxer3: arbitraje.buildModuleSummary(MODULES.BOXER3, fanout[1].normalized),
        boxer4: arbitraje.buildModuleSummary(MODULES.BOXER4, fanout[2].normalized)
      }
    };
  }

  async function invokeAndValidate(boxerName, action, data, normalizedRequest, meta, deps) {
    var boxerStartAt = Date.now();
    var boxerStage = boxerStageName(boxerName);
    traceAnalysisEvent(boxerStage + "_start", {
      action: action || null
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "boxer"
    });
    metricas.pushEvent(meta.metricCtx, "info", boxerName + "_START", "Inicio de " + boxerName + ".", {
      action: action || null
    });
    var request = buildBoxerRequest(boxerName, action, meta, normalizedRequest, data);
    request.handlers = deps && deps.handlers ? deps.handlers : {};
    request.deps = deps || {};

    var raw = await (deps && deps.gateway ? deps.gateway : defaultGateway).invokeBoxer(request);
    var validated = contratos.validateBoxerOutput(boxerName, raw, meta.traceId);
    if (!validated.ok) {
      metricas.pushEvent(meta.metricCtx, "error", validated.code, validated.message, validated.detail || null);
      return {
        ok: false,
        code: validated.code,
        message: validated.message,
        detail: validated.detail || null,
        raw: raw
      };
    }

    metricas.recordBoxerTime(meta.metricCtx, boxerName, validated.normalized.resultado.elapsedMs);
    metricas.pushEvent(meta.metricCtx, validated.normalized.ok ? "info" : "warn", boxerName + "_RESPUESTA", "Respuesta validada de " + boxerName + ".", {
      ok: validated.normalized.ok,
      passport: validated.normalized.resultado.estadoPasaporteModulo,
      elapsedMs: Math.max(0, Date.now() - boxerStartAt)
    });
    traceAnalysisEvent(boxerStage + "_done", {
      ok: validated.normalized.ok,
      passport: validated.normalized.resultado.estadoPasaporteModulo,
      elapsedMs: Math.max(0, Date.now() - boxerStartAt)
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "boxer"
    });

    return {
      ok: true,
      normalized: validated.normalized
    };
  }

  function asPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function cloneArray(list) {
    return Array.isArray(list) ? list.slice() : [];
  }

  function uniqueStrings(list) {
    var out = [];
    var seen = Object.create(null);
    var safeList = Array.isArray(list) ? list : [];
    for (var i = 0; i < safeList.length; i += 1) {
      var item = String(safeList[i] || "").trim();
      if (!item || seen[item]) continue;
      seen[item] = true;
      out.push(item);
    }
    return out;
  }

  function boxerStageName(boxerName) {
    var safe = String(boxerName || "").trim();
    if (safe === MODULES.BOXER1) return "boxer1";
    if (safe === MODULES.BOXER2) return "boxer2";
    if (safe === MODULES.BOXER3) return "boxer3";
    if (safe === MODULES.BOXER4) return "boxer4";
    return safe ? safe.toLowerCase() : "boxer";
  }

  function shortHash(text) {
    var safe = String(text || "");
    var hash = 0;
    for (var i = 0; i < safe.length; i += 1) {
      hash = ((hash << 5) - hash + safe.charCodeAt(i)) | 0;
    }
    return "h" + (hash >>> 0).toString(16);
  }

  function summarizeText(value, maxChars) {
    var safe = String(value == null ? "" : value);
    var limit = Math.max(80, Number(maxChars || 240));
    if (!safe) return "";
    if (safe.length <= limit) return safe;
    return "[resumen lenOriginal=" + safe.length + " hash=" + shortHash(safe) + "] " + safe.slice(0, limit);
  }

  function summarizeIaPayload(payload) {
    var safe = asPlainObject(payload) ? payload : {};
    var out = {
      keys: Object.keys(safe)
    };
    if (typeof safe.textoBase === "string") {
      out.textoBaseResumen = summarizeText(safe.textoBase, 240);
      out.textoBaseLength = safe.textoBase.length;
    }
    if (typeof safe.ocrTexto === "string") {
      out.ocrTextLength = safe.ocrTexto.length;
      out.ocrTextHash = shortHash(safe.ocrTexto);
      out.ocrResumen = summarizeText(safe.ocrTexto, 240);
    }
    if (Array.isArray(safe.slots)) {
      out.totalSlots = safe.slots.length;
      out.lineasRelevantes = safe.slots.slice(0, 4).map(function eachSlot(slot) {
        var line = slot && slot.textoOriginal ? String(slot.textoOriginal) : "";
        return summarizeText(line, 140);
      }).filter(Boolean);
    }
    if (Array.isArray(safe.fragmentosImagen)) {
      out.totalFragmentosImagen = safe.fragmentosImagen.length;
    }
    return out;
  }

  function summarizeIaExpected(expected) {
    var safe = asPlainObject(expected) ? expected : {};
    return {
      keys: Object.keys(safe),
      correccionesEsperadas: Array.isArray(safe.correcciones) ? safe.correcciones.length : null,
      simetria: safe.simetria || null
    };
  }

  function resolveBrokerApi(deps) {
    if (deps && deps.brokerIA) return deps.brokerIA;
    return defaultBrokerIA;
  }

  function resolveProductosPersistencia(deps) {
    if (deps && deps.productPersistence) return deps.productPersistence;
    return defaultProductosPersistencia;
  }

  function resolveProductRepositoryResolver(deps) {
    if (deps && deps.productRepositoryResolver) return deps.productRepositoryResolver;
    return defaultProductRepositoryResolver;
  }

  function hasProductRepository(deps) {
    return !!(deps && (deps.productRepository || deps.productRemoteIndex || deps.remoteIndex || deps.repository));
  }

  function ensureResolvedProductRepository(deps) {
    var safeDeps = deps || {};
    if (hasProductRepository(safeDeps)) {
      return {
        ok: true,
        deps: safeDeps
      };
    }

    var resolver = resolveProductRepositoryResolver(safeDeps);
    if (!resolver || typeof resolver.resolveProductRepository !== "function") {
      return {
        ok: false,
        code: ERROR_CODES.REPOSITORIO_PRODUCTOS_NO_DISPONIBLE,
        message: "Cerebro no pudo preparar el acceso real a productos.",
        detail: {
          reason: "resolver_no_configurado"
        }
      };
    }

    var resolved = resolver.resolveProductRepository(safeDeps);
    if (!resolved || resolved.ok !== true || !resolved.repository) {
      return {
        ok: false,
        code: ERROR_CODES.REPOSITORIO_PRODUCTOS_NO_DISPONIBLE,
        message: resolved && resolved.message
          ? resolved.message
          : "Cerebro no pudo preparar el acceso real a productos.",
        detail: {
          errorCode: resolved && resolved.errorCode ? resolved.errorCode : "CEREBRO_PRODUCT_REPOSITORY_RESOLVE_FAILED",
          source: resolved && resolved.source ? resolved.source : null,
          collectionName: resolved && resolved.collectionName ? resolved.collectionName : null
        }
      };
    }

    var nextDeps = Object.assign({}, safeDeps, {
      productRepository: resolved.repository,
      productRepositorySource: resolved.source || "runtime",
      productCollectionName: resolved.collectionName || null,
      productRepositoryAppId: resolved.appId || null
    });

    return {
      ok: true,
      deps: nextDeps
    };
  }

  async function resolveDuplicateInfo(normalizedRequest, proposal, deps) {
    var detector = deps && typeof deps.duplicateDetector === "function"
      ? deps.duplicateDetector
      : null;
    var persistencia = resolveProductosPersistencia(deps);
    var raw = null;

    if (detector) {
      raw = await detector({
        inputData: normalizedRequest.datos,
        proposal: proposal
      });
      return {
        ok: true,
        posibleDuplicado: !!(raw && raw.posibleDuplicado),
        fusionable: !!(raw && raw.fusionable),
        coincidencias: raw && Array.isArray(raw.coincidencias) ? raw.coincidencias : []
      };
    }

    if (persistencia && typeof persistencia.detectarDuplicadoReal === "function" && hasProductRepository(deps)) {
      raw = await persistencia.detectarDuplicadoReal({
        inputData: normalizedRequest.datos,
        proposal: proposal
      }, deps || {});
      if (raw && raw.ok === true) {
        return {
          ok: true,
          posibleDuplicado: !!raw.posibleDuplicado,
          fusionable: !!raw.fusionable,
          coincidencias: Array.isArray(raw.coincidencias) ? raw.coincidencias : []
        };
      }
      return {
        ok: false,
        errorCode: raw && raw.errorCode ? raw.errorCode : ERROR_CODES.REPOSITORIO_PRODUCTOS_NO_DISPONIBLE,
        message: raw && raw.message ? raw.message : "No se pudo consultar productos reales."
      };
    }

    raw = arbitraje.detectPossibleDuplicate(normalizedRequest.datos, proposal, deps || {});
    return {
      ok: true,
      posibleDuplicado: !!(raw && raw.posibleDuplicado),
      fusionable: !!(raw && raw.fusionable),
      coincidencias: raw && Array.isArray(raw.coincidencias) ? raw.coincidencias : []
    };
  }

  function resolveBoxerClosers(deps) {
    var injected = deps && deps.boxerClosers ? deps.boxerClosers : {};
    return {
      Boxer1_Core: injected.Boxer1_Core || injected[MODULES.BOXER1] || (
        defaultBoxer1Module && typeof defaultBoxer1Module.B1_cerrarConSubrespuestaIA === "function"
          ? function closeBoxer1(summary, subrespuesta) {
            return defaultBoxer1Module.B1_cerrarConSubrespuestaIA(summary.resultadoLocal || {}, subrespuesta);
          }
          : null
      ),
      Boxer2_Identidad: injected.Boxer2_Identidad || injected[MODULES.BOXER2] || (
        defaultBoxer2Module && typeof defaultBoxer2Module.B2_cerrarConSubrespuestaIA === "function"
          ? function closeBoxer2(summary, subrespuesta) {
            return defaultBoxer2Module.B2_cerrarConSubrespuestaIA(subrespuesta, summary.resultadoLocal || {});
          }
          : null
      ),
      Boxer3_PesoFormato: injected.Boxer3_PesoFormato || injected[MODULES.BOXER3] || (
        defaultBoxer3Module && typeof defaultBoxer3Module.B3_cerrarConSubrespuestaIA === "function"
          ? function closeBoxer3(summary, subrespuesta) {
            return defaultBoxer3Module.B3_cerrarConSubrespuestaIA(subrespuesta, summary.resultadoLocal || {});
          }
          : null
      )
    };
  }

  function collectIaBatchState(summaries) {
    var modules = [summaries.boxer1, summaries.boxer2, summaries.boxer3, summaries.boxer4].filter(Boolean);
    var tasks = [];
    var pending = [];
    var counted = 0;

    for (var i = 0; i < modules.length; i += 1) {
      var summary = modules[i];
      var state = summary.estadoIA || IA_STATES.NO_NECESITA_LLAMADA;
      if (state === IA_STATES.PENDIENTE_LOCAL) {
        pending.push(summary.modulo);
        continue;
      }
      counted += 1;
      if (state === IA_STATES.NECESITA_LLAMADA && Array.isArray(summary.tareasIA) && summary.tareasIA.length) {
        tasks = tasks.concat(summary.tareasIA);
      }
    }

    return {
      totalBoxersConvocados: modules.length,
      totalRespuestasContadas: counted,
      tareasSolicitadas: tasks.length,
      pendientes: pending,
      tasks: tasks
    };
  }

  function buildIaReviewSummary(summary, reasonCode, message) {
    var safeSummary = summary || {};
    var safeDatos = asPlainObject(safeSummary.datos) ? Object.assign({}, safeSummary.datos) : {};
    var dudas = cloneArray(safeDatos.dudas);
    var alertas = cloneArray(safeDatos.alertas);
    if (reasonCode) {
      dudas = uniqueStrings(dudas.concat([reasonCode]));
      alertas = uniqueStrings(alertas.concat([reasonCode]));
    }

    if (!safeDatos.motivo_duda && !safeDatos.motivoDuda && reasonCode) {
      safeDatos.motivo_duda = reasonCode;
    }
    safeDatos.dudas = dudas;
    safeDatos.alertas = alertas;
    if (safeSummary.modulo === MODULES.BOXER2) {
      safeDatos.conflictoIdentidad = true;
    }
    if (safeSummary.modulo === MODULES.BOXER3) {
      safeDatos.conflictoComercial = true;
    }

    return {
      modulo: safeSummary.modulo || "",
      ok: true,
      passport: PASSPORTS.NARANJA,
      confidence: safeSummary.confidence || "media",
      requiereRevision: true,
      estadoIA: IA_STATES.NO_NECESITA_LLAMADA,
      tareasIA: [],
      huboTareaIA: !!safeSummary.huboTareaIA,
      taskIds: cloneArray(safeSummary.taskIds),
      resultadoLocal: safeSummary.resultadoLocal || null,
      datos: safeDatos,
      error: {
        code: reasonCode || "CER_IA_CIERRE_PENDIENTE",
        origin: MODULE_NAME,
        message: message || "La subtarea IA no pudo cerrarse con seguridad."
      },
      elapsedMs: Math.max(0, Number(safeSummary.elapsedMs) || 0)
    };
  }

  async function closeIaSummary(summary, subresponse, normalizedRequest, meta, deps) {
    var closers = resolveBoxerClosers(deps);
    var closer = closers[summary.modulo];

    if (typeof closer !== "function") {
      return buildIaReviewSummary(summary, "ia_cierre_no_configurado", "No existe cierre IA configurado para " + summary.modulo + ".");
    }

    try {
      var rawClosed = await closer(summary, subresponse, {
        meta: meta,
        request: normalizedRequest,
        deps: deps || {}
      });
      var validated = contratos.validateBoxerOutput(summary.modulo, rawClosed, meta.traceId);
      if (!validated.ok) {
        return buildIaReviewSummary(summary, "ia_cierre_invalido", validated.message);
      }
      return arbitraje.buildModuleSummary(summary.modulo, validated.normalized);
    } catch (err) {
      return buildIaReviewSummary(summary, "ia_cierre_excepcion", err && err.message ? err.message : "Excepcion en cierre IA.");
    }
  }

  async function resolveIaBatch(summaries, normalizedRequest, meta, deps) {
    var batchState = collectIaBatchState(summaries);
    var iaInfo = {
      huboLlamada: false,
      geminiBatchId: null,
      totalBoxersConvocados: batchState.totalBoxersConvocados,
      totalRespuestasContadas: batchState.totalRespuestasContadas,
      tareasSolicitadas: batchState.tareasSolicitadas,
      tareasResueltas: 0,
      tareasContaminadas: 0,
      tareasDescartadas: 0
    };

    if (!batchState.tasks.length) {
      return {
        summaries: summaries,
        iaInfo: iaInfo
      };
    }

    if (batchState.pendientes.length) {
      metricas.pushEvent(meta.metricCtx, "warn", "CER_IA_PENDIENTE_LOCAL", "Hay modulos aun en pendiente local; no se lanza lote IA.", {
        pendientes: batchState.pendientes
      });
      return {
        summaries: summaries,
        iaInfo: iaInfo
      };
    }

    var broker = resolveBrokerApi(deps);
    if (!broker || typeof broker.enviarLoteIA !== "function" || typeof broker.validarRespuestaLote !== "function" || typeof broker.separarSubrespuestas !== "function") {
      metricas.pushEvent(meta.metricCtx, "warn", "CER_BROKER_NO_CONFIGURADO", "Broker IA no configurado. Se deriva a revision lo pendiente.", null);
      return {
        summaries: {
          boxer1: summaries.boxer1 && summaries.boxer1.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer1, "ia_broker_no_configurado", "Broker IA no configurado.") : summaries.boxer1,
          boxer2: summaries.boxer2 && summaries.boxer2.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer2, "ia_broker_no_configurado", "Broker IA no configurado.") : summaries.boxer2,
          boxer3: summaries.boxer3 && summaries.boxer3.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer3, "ia_broker_no_configurado", "Broker IA no configurado.") : summaries.boxer3,
          boxer4: summaries.boxer4
        },
        iaInfo: iaInfo
      };
    }

    var iaPrepareStartedAt = Date.now();
    traceAnalysisEvent("ia_batch_prepare_start", {
      totalTareas: batchState.tasks.length
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "ia"
    });
    var taskDetails = batchState.tasks.map(function eachTask(task) {
      var safeTask = asPlainObject(task) ? task : {};
      return {
        taskId: String(safeTask.taskId || "").trim() || null,
        moduloSolicitante: String(safeTask.moduloSolicitante || safeTask.modulo || "").trim() || null,
        tipoTarea: String(safeTask.tipoTarea || safeTask.schemaId || "").trim() || null,
        schemaId: String(safeTask.schemaId || "").trim() || null,
        motivoCreacion: String(safeTask.motivo || safeTask.reason || safeTask.motivoDuda || "").trim() || null,
        payloadResumenSinBase64: summarizeIaPayload(safeTask.payload),
        respuestaEsperadaResumen: summarizeIaExpected(safeTask.respuestaEsperada)
      };
    });
    var taskDetailById = Object.create(null);
    for (var tIndex = 0; tIndex < taskDetails.length; tIndex += 1) {
      var detailItem = taskDetails[tIndex];
      if (detailItem && detailItem.taskId) taskDetailById[detailItem.taskId] = detailItem;
      metricas.pushEvent(meta.metricCtx, "info", "CER_IA_TASK_DETAIL", "Detalle de tarea IA.", detailItem || null);
    }
    traceAnalysisEvent("ia_batch_tasks", {
      total: taskDetails.length,
      tasks: taskDetails
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "ia"
    });
    traceAnalysisEvent("ia_batch_prepare_done", {
      totalTareas: taskDetails.length,
      elapsedMs: Math.max(0, Date.now() - iaPrepareStartedAt)
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "ia"
    });

    metricas.pushEvent(meta.metricCtx, "info", "CER_IA_LOTE_ENVIO", "Cerebro envia un lote unico IA.", {
      tareas: taskDetails.length,
      taskIds: taskDetails.map(function each(item) { return item.taskId; }).filter(Boolean),
      modulosSolicitantes: uniqueStrings(taskDetails.map(function each(item) { return item.moduloSolicitante; }).filter(Boolean)),
      tiposTarea: uniqueStrings(taskDetails.map(function each(item) { return item.tipoTarea; }).filter(Boolean)),
      schemaIds: uniqueStrings(taskDetails.map(function each(item) { return item.schemaId; }).filter(Boolean))
    });

    var iaBackendStartedAt = Date.now();
    traceAnalysisEvent("ia_backend_call_start", {
      totalTareas: batchState.tasks.length
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "ia"
    });
    traceAnalysisEvent("ia_call_start", {
      totalTareas: batchState.tasks.length
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "ia"
    });
    var sent = await broker.enviarLoteIA({
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      sessionToken: normalizedRequest.sessionToken,
      tasks: batchState.tasks,
      modelo: broker.DEFAULT_MODEL || "gemini-3.1-flash-lite-preview",
      totalBoxersConvocados: batchState.totalBoxersConvocados,
      totalRespuestasContadas: batchState.totalRespuestasContadas
    }, deps || {});
    var iaBackendElapsed = Math.max(0, Date.now() - iaBackendStartedAt);
    traceAnalysisEvent("ia_backend_call_done", {
      ok: !!(sent && sent.ok === true),
      elapsedMs: iaBackendElapsed
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "ia"
    });
    traceAnalysisEvent("ia_call_end", {
      ok: !!(sent && sent.ok === true),
      elapsedMs: iaBackendElapsed
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "ia"
    });

    iaInfo.huboLlamada = true;

    if (!sent || sent.ok !== true) {
      metricas.pushEvent(meta.metricCtx, "warn", sent && sent.code ? sent.code : "CER_BROKER_ENVIO_FALLIDO", sent && sent.message ? sent.message : "Fallo enviando lote IA.", sent && sent.detail ? sent.detail : null);
      return {
        summaries: {
          boxer1: summaries.boxer1 && summaries.boxer1.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer1, "ia_lote_fallido", sent && sent.message ? sent.message : "Fallo lote IA.") : summaries.boxer1,
          boxer2: summaries.boxer2 && summaries.boxer2.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer2, "ia_lote_fallido", sent && sent.message ? sent.message : "Fallo lote IA.") : summaries.boxer2,
          boxer3: summaries.boxer3 && summaries.boxer3.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer3, "ia_lote_fallido", sent && sent.message ? sent.message : "Fallo lote IA.") : summaries.boxer3,
          boxer4: summaries.boxer4
        },
        iaInfo: iaInfo
      };
    }

    var iaValidateStartedAt = Date.now();
    traceAnalysisEvent("ia_response_validate_start", null, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "ia"
    });
    var validatedBatch = broker.validarRespuestaLote(sent, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      tasks: batchState.tasks
    });
    var iaValidateElapsed = Math.max(0, Date.now() - iaValidateStartedAt);
    traceAnalysisEvent("ia_response_validate_done", {
      ok: !!(validatedBatch && validatedBatch.ok === true),
      elapsedMs: iaValidateElapsed
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "ia"
    });
    if (!validatedBatch.ok) {
      metricas.pushEvent(meta.metricCtx, "warn", validatedBatch.code, validatedBatch.message, validatedBatch.detail || null);
      return {
        summaries: {
          boxer1: summaries.boxer1 && summaries.boxer1.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer1, "ia_respuesta_global_invalida", validatedBatch.message) : summaries.boxer1,
          boxer2: summaries.boxer2 && summaries.boxer2.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer2, "ia_respuesta_global_invalida", validatedBatch.message) : summaries.boxer2,
          boxer3: summaries.boxer3 && summaries.boxer3.estadoIA === IA_STATES.NECESITA_LLAMADA ? buildIaReviewSummary(summaries.boxer3, "ia_respuesta_global_invalida", validatedBatch.message) : summaries.boxer3,
          boxer4: summaries.boxer4
        },
        iaInfo: iaInfo
      };
    }

    var iaDistributeStartedAt = Date.now();
    traceAnalysisEvent("ia_response_distribute_start", null, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "ia"
    });
    var separated = broker.separarSubrespuestas(validatedBatch, batchState.tasks);
    iaInfo.geminiBatchId = separated.geminiBatchId || (validatedBatch.normalized && validatedBatch.normalized.geminiBatchId) || null;
    iaInfo.tareasResueltas = separated.resueltas;
    iaInfo.tareasContaminadas = separated.contaminadas;
    iaInfo.tareasDescartadas = separated.descartadas;

    var nextSummaries = {
      boxer1: summaries.boxer1,
      boxer2: summaries.boxer2,
      boxer3: summaries.boxer3,
      boxer4: summaries.boxer4
    };

    var summaryList = [summaries.boxer1, summaries.boxer2, summaries.boxer3, summaries.boxer4].filter(Boolean);
    for (var i = 0; i < summaryList.length; i += 1) {
      var summary = summaryList[i];
      if (summary.estadoIA !== IA_STATES.NECESITA_LLAMADA || !Array.isArray(summary.taskIds) || !summary.taskIds.length) {
        continue;
      }

      var subresponse = null;
      var matchedTaskId = null;
      for (var j = 0; j < summary.taskIds.length; j += 1) {
        var taskId = summary.taskIds[j];
        if (separated.byTaskId[taskId]) {
          subresponse = separated.byTaskId[taskId];
          matchedTaskId = taskId;
          break;
        }
      }

      if (!subresponse) {
        if (summary.taskIds && summary.taskIds[0]) {
          var missingTask = taskDetailById[summary.taskIds[0]] || {
            taskId: summary.taskIds[0],
            moduloSolicitante: summary.modulo,
            tipoTarea: null,
            schemaId: null
          };
          metricas.pushEvent(meta.metricCtx, "warn", "CER_IA_TASK_RESULT", "Resultado de tarea IA no disponible.", {
            taskId: missingTask.taskId || null,
            moduloSolicitante: missingTask.moduloSolicitante || null,
            tipoTarea: missingTask.tipoTarea || null,
            schemaId: missingTask.schemaId || null,
            resultadoEstado: "sin_subrespuesta",
            validada: false,
            contaminada: false,
            descartada: true,
            errorCode: "ia_subrespuesta_no_resuelta"
          });
        }
        nextSummaries[summary.modulo === MODULES.BOXER1 ? "boxer1" : (summary.modulo === MODULES.BOXER2 ? "boxer2" : "boxer3")] =
          buildIaReviewSummary(summary, "ia_subrespuesta_no_resuelta", "No llego subrespuesta valida para " + summary.modulo + ".");
        continue;
      }

      var taskMeta = matchedTaskId ? taskDetailById[matchedTaskId] : null;
      var closedSummary = await closeIaSummary(summary, subresponse, normalizedRequest, meta, deps || {});
      metricas.pushEvent(meta.metricCtx, "info", "CER_IA_TASK_RESULT", "Resultado de tarea IA procesado.", {
        taskId: matchedTaskId || (taskMeta && taskMeta.taskId) || null,
        moduloSolicitante: summary.modulo || (taskMeta && taskMeta.moduloSolicitante) || null,
        tipoTarea: taskMeta && taskMeta.tipoTarea ? taskMeta.tipoTarea : null,
        schemaId: taskMeta && taskMeta.schemaId ? taskMeta.schemaId : null,
        resultadoEstado: closedSummary && closedSummary.passport ? String(closedSummary.passport) : "desconocido",
        validada: true,
        contaminada: false,
        descartada: false,
        errorCode: closedSummary && closedSummary.error && closedSummary.error.code ? closedSummary.error.code : null,
        dataResumen: {
          requiereRevision: !!(closedSummary && closedSummary.requiereRevision),
          confidence: closedSummary && closedSummary.confidence ? closedSummary.confidence : null
        }
      });
      if (summary.modulo === MODULES.BOXER1) nextSummaries.boxer1 = closedSummary;
      if (summary.modulo === MODULES.BOXER2) nextSummaries.boxer2 = closedSummary;
      if (summary.modulo === MODULES.BOXER3) nextSummaries.boxer3 = closedSummary;
    }
    var iaDistributeElapsed = Math.max(0, Date.now() - iaDistributeStartedAt);
    traceAnalysisEvent("ia_response_distribute_done", {
      elapsedMs: iaDistributeElapsed
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "ia"
    });
    metricas.pushEvent(meta.metricCtx, "info", "CER_IA_BATCH_TIMING", "Tiempos del lote IA.", {
      elapsedPrepareMs: Math.max(0, iaBackendStartedAt - iaPrepareStartedAt),
      elapsedBackendMs: iaBackendElapsed,
      elapsedGeminiMs: sent && sent.tiempos && sent.tiempos.gemini && Number.isFinite(Number(sent.tiempos.gemini.t_total_gemini_ms))
        ? Number(sent.tiempos.gemini.t_total_gemini_ms)
        : null,
      elapsedValidateMs: iaValidateElapsed,
      elapsedDistributeMs: iaDistributeElapsed,
      elapsedTotalBatchMs: Math.max(0, Date.now() - iaPrepareStartedAt)
    });

    metricas.pushEvent(meta.metricCtx, "info", "CER_IA_LOTE_CIERRE", "Cerebro cierra subtareas del lote IA.", {
      geminiBatchId: iaInfo.geminiBatchId,
      resueltas: iaInfo.tareasResueltas,
      contaminadas: iaInfo.tareasContaminadas,
      descartadas: iaInfo.tareasDescartadas
    });

    return {
      summaries: nextSummaries,
      iaInfo: iaInfo
    };
  }

  async function routeDecision(decision, finalData, meta, deps) {
    var customDestinations = deps && deps.destinations ? deps.destinations : {};
    var persistencia = resolveProductosPersistencia(deps);
    var now = Date.now();
    var idempotencyKey = buildDecisionIdempotencyKey(decision, meta);
    var dedupeEnabled = (
      decision &&
      (decision.decisionFlow === contratos.DECISION_FLOW.GUARDAR ||
       decision.decisionFlow === contratos.DECISION_FLOW.REVISION) &&
      !!idempotencyKey
    );
    if (dedupeEnabled) {
      var cached = readRouteIdempotency(idempotencyKey, now);
      if (cached) return cached;
    }

    var destinations = {
      guardarResultadoAnalizado: customDestinations.guardarResultadoAnalizado || (
        persistencia && typeof persistencia.guardarResultadoAnalizado === "function" && hasProductRepository(deps)
          ? function guardarResultado(payload) {
            return persistencia.guardarResultadoAnalizado(payload, deps || {});
          }
          : null
      ),
      abrirRevisionProducto: customDestinations.abrirRevisionProducto || null
    };

    if (decision.decisionFlow === contratos.DECISION_FLOW.GUARDAR && typeof destinations.guardarResultadoAnalizado === "function") {
      var saveResult = await destinations.guardarResultadoAnalizado({
        analysisId: meta.analysisId,
        traceId: meta.traceId,
        batchId: meta.batchId || null,
        idempotencyKey: idempotencyKey || null,
        propuestaFinal: finalData.propuestaFinal,
        datos: finalData
      });
      if (dedupeEnabled && saveResult && saveResult.ok === true) {
        storeRouteIdempotency(idempotencyKey, saveResult, now);
      }
      return saveResult;
    }

    if (decision.decisionFlow === contratos.DECISION_FLOW.REVISION && typeof destinations.abrirRevisionProducto === "function") {
      var reviewResult = await destinations.abrirRevisionProducto({
        analysisId: meta.analysisId,
        traceId: meta.traceId,
        batchId: meta.batchId || null,
        idempotencyKey: idempotencyKey || null,
        propuestaFinal: finalData.propuestaFinal,
        datos: finalData
      });
      if (dedupeEnabled && reviewResult && reviewResult.ok === true) {
        storeRouteIdempotency(idempotencyKey, reviewResult, now);
      }
      return reviewResult;
    }

    return {
      ok: true,
      routed: false
    };
  }

  async function solicitarAnalisisFoto(request, deps) {
    var validation = contratos.validateIncomingRequest(request);
    if (!validation.ok) {
      var invalidMeta = metricas.startOperation({});
      metricas.pushEvent(invalidMeta, "error", validation.code, validation.message, validation.detail || null);
      return errores.buildFailureEnvelope({
        moduleName: MODULE_NAME,
        traceId: invalidMeta.traceId,
        elapsedMs: metricas.elapsedSince(invalidMeta.startedAt),
        metricas: metricas.finalizeMetricas(invalidMeta)
      }, {
        code: ERROR_CODES.CONTRATO_ENTRADA_INVALIDO,
        message: validation.message,
        suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        tipoFallo: FAIL_TYPES.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        datos: buildFailureData(invalidMeta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.BLOQUEO,
          suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
          conflicts: [validation.code]
        })
      });
    }

    var normalizedRequest = validation.normalized;
    var meta = buildMeta(normalizedRequest);
    traceAnalysisEvent("cerebro_start", {
      contextoAlta: normalizedRequest && normalizedRequest.datos ? normalizedRequest.datos.contextoAlta || null : null
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "cerebro"
    });
    var gateway = deps && deps.gateway ? deps.gateway : defaultGateway;
    var repositoryResolution = ensureResolvedProductRepository(deps || {});
    if (!gateway || typeof gateway.invokeBoxer !== "function") {
      metricas.pushEvent(meta.metricCtx, "error", ERROR_CODES.ARBITRAJE_IMPOSIBLE, "Gateway Boxer no configurado.", null);
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: ERROR_CODES.ARBITRAJE_IMPOSIBLE,
        message: "Cerebro no tiene gateway Boxer configurado.",
        suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        tipoFallo: FAIL_TYPES.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        datos: buildFailureData(meta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.BLOQUEO,
          suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
          conflicts: ["gateway_boxer_no_configurado"]
        })
      });
    }
    if (!repositoryResolution.ok) {
      metricas.pushEvent(meta.metricCtx, "error", repositoryResolution.code, repositoryResolution.message, repositoryResolution.detail || null);
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: repositoryResolution.code,
        message: repositoryResolution.message,
        suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        tipoFallo: FAIL_TYPES.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        datos: buildFailureData(meta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.BLOQUEO,
          suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
          conflicts: ["repositorio_productos_no_disponible"]
        })
      });
    }
    var effectiveDeps = repositoryResolution.deps;

    metricas.pushEvent(meta.metricCtx, "info", "CER_ANALISIS_INICIO", "Cerebro abre operacion de analisis.", {
      contextoAlta: normalizedRequest.datos.contextoAlta,
      productCollectionName: effectiveDeps.productCollectionName || null,
      productRepositorySource: effectiveDeps.productRepositorySource || null
    });

    var boxer1Data = {
      imageRef: normalizedRequest.datos.imageRef,
      imageRefs: normalizedRequest.datos.imageRefs,
      sendMode: normalizedRequest.datos.sendMode,
      contextoAlta: normalizedRequest.datos.contextoAlta,
      controlesUsuario: normalizedRequest.datos.controlesUsuario,
      agentEnabled: normalizedRequest.datos.controlesUsuario.agentEnabled,
      sensitivityMode: normalizedRequest.datos.controlesUsuario.sensitivityMode,
      timeBudgetMs: normalizedRequest.datos.controlesUsuario.timeBudgetMs,
      expect: normalizedRequest.datos.controlesUsuario.expect
    };

    var boxer1 = await invokeAndValidate(MODULES.BOXER1, ACTIONS.ANALIZAR_TEXTO_ETIQUETA, boxer1Data, normalizedRequest, meta, {
      gateway: gateway,
      handlers: effectiveDeps && effectiveDeps.handlers ? effectiveDeps.handlers : {},
      destinations: effectiveDeps && effectiveDeps.destinations ? effectiveDeps.destinations : {},
      duplicateDetector: effectiveDeps && effectiveDeps.duplicateDetector ? effectiveDeps.duplicateDetector : null
    });

    if (!boxer1.ok) {
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: ERROR_CODES.SALIDA_BOXER_INCOMPATIBLE,
        message: boxer1.message,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        tipoFallo: FAIL_TYPES.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        datos: buildFailureData(meta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.ABORTADO,
          suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
          conflicts: ["salida_boxer1_incompatible"]
        })
      });
    }

    var boxer1Summary = arbitraje.buildModuleSummary(MODULES.BOXER1, boxer1.normalized);
    if (!arbitraje.boxer1Usable(boxer1Summary)) {
      metricas.pushEvent(meta.metricCtx, "error", ERROR_CODES.ARBITRAJE_IMPOSIBLE, "Boxer1 no entrego salida utilizable.", null);
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: ERROR_CODES.ARBITRAJE_IMPOSIBLE,
        message: boxer1.normalized.error && boxer1.normalized.error.message
          ? boxer1.normalized.error.message
          : "Boxer1 no entrego salida utilizable.",
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        tipoFallo: FAIL_TYPES.REPARACION_AGOTADA,
        retryable: true,
        datos: buildFailureData(meta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.ABORTADO,
          suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
          conflicts: ["boxer1_no_utilizable"],
          roiRefsRevision: Array.isArray(boxer1Summary.datos.roiRefsRevision) ? boxer1Summary.datos.roiRefsRevision : [],
          summaries: { boxer1: boxer1Summary }
        })
      });
    }

    var downstreamData = buildDownstreamData(boxer1Summary, normalizedRequest);

    var fanoutDeps = {
      gateway: gateway,
      handlers: effectiveDeps && effectiveDeps.handlers ? effectiveDeps.handlers : {},
      destinations: effectiveDeps && effectiveDeps.destinations ? effectiveDeps.destinations : {},
      duplicateDetector: effectiveDeps && effectiveDeps.duplicateDetector ? effectiveDeps.duplicateDetector : null,
      productRepository: effectiveDeps.productRepository
    };

    var fanout = await Promise.all([
      invokeAndValidate(MODULES.BOXER2, ACTIONS.RESOLVER_IDENTIDAD, downstreamData, normalizedRequest, meta, fanoutDeps),
      invokeAndValidate(MODULES.BOXER3, ACTIONS.RESOLVER_FORMATO, downstreamData, normalizedRequest, meta, fanoutDeps),
      invokeAndValidate(MODULES.BOXER4, ACTIONS.CLASIFICAR_ALERGENOS, downstreamData, normalizedRequest, meta, fanoutDeps)
    ]);

    var invalidFanout = fanout.find(function each(item) { return !item.ok; });
    if (invalidFanout) {
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: ERROR_CODES.SALIDA_BOXER_INCOMPATIBLE,
        message: invalidFanout.message,
        suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
        tipoFallo: FAIL_TYPES.IRRECUPERABLE_POR_DISENO,
        retryable: false,
        datos: buildFailureData(meta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.ABORTADO,
          suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
          conflicts: ["salida_boxer_incompatible"],
          roiRefsRevision: Array.isArray(boxer1Summary.datos.roiRefsRevision) ? boxer1Summary.datos.roiRefsRevision : [],
          summaries: { boxer1: boxer1Summary }
        })
      });
    }

    var boxer2Summary = arbitraje.buildModuleSummary(MODULES.BOXER2, fanout[0].normalized);
    var boxer3Summary = arbitraje.buildModuleSummary(MODULES.BOXER3, fanout[1].normalized);
    var boxer4Summary = arbitraje.buildModuleSummary(MODULES.BOXER4, fanout[2].normalized);

    var summaries = {
      boxer1: boxer1Summary,
      boxer2: boxer2Summary,
      boxer3: boxer3Summary,
      boxer4: boxer4Summary
    };

    var iaResolution = await resolveIaBatch(summaries, normalizedRequest, meta, effectiveDeps || {});
    summaries = iaResolution.summaries;
    var iaInfo = iaResolution.iaInfo;

    if (shouldRefreshDownstreamFromBoxer1(boxer1Summary, summaries.boxer1)) {
      metricas.pushEvent(meta.metricCtx, "info", "CER_BOXER1_CORREGIDO", "Cerebro relanza Boxer2/3/4 con el texto corregido de Boxer1.", null);
      var refresh = await rerunDownstreamWithCorrectedBoxer1(summaries.boxer1, normalizedRequest, meta, effectiveDeps || {});
      if (!refresh.ok) {
        return errores.buildFailureEnvelope(buildContext(meta), {
          code: ERROR_CODES.SALIDA_BOXER_INCOMPATIBLE,
          message: refresh.message || "No se pudo refrescar Boxer2/3/4 tras corregir Boxer1.",
          suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
          tipoFallo: FAIL_TYPES.IRRECUPERABLE_POR_DISENO,
          retryable: false,
          datos: buildFailureData(meta, {
            passport: PASSPORTS.ROJO,
            decisionFlow: contratos.DECISION_FLOW.ABORTADO,
            suggestedAction: SUGGESTED_ACTIONS.ABORTAR_FLUJO,
            conflicts: ["refresh_downstream_boxer1_fallido"],
            roiRefsRevision: Array.isArray(summaries.boxer1 && summaries.boxer1.datos && summaries.boxer1.datos.roiRefsRevision)
              ? summaries.boxer1.datos.roiRefsRevision
              : [],
            summaries: summaries
          })
        });
      }
      summaries = refresh.summaries;
    }

    traceAnalysisEvent("boxer_collection_done", {
      totalBoxers: 4,
      iaPendiente: !!(summaries.boxer1 && summaries.boxer1.estadoIA === IA_STATES.NECESITA_LLAMADA) ||
        !!(summaries.boxer2 && summaries.boxer2.estadoIA === IA_STATES.NECESITA_LLAMADA) ||
        !!(summaries.boxer3 && summaries.boxer3.estadoIA === IA_STATES.NECESITA_LLAMADA)
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "boxers"
    });

    if (isTimeBudgetExpired(meta, normalizedRequest)) {
      metricas.pushEvent(meta.metricCtx, "error", ERROR_CODES.TIMEOUT_OPERACION || "CER_TIMEOUT_OPERACION", "Cerebro detiene el flujo por timeout global.", null);
      return buildTimeoutEnvelope(meta, summaries);
    }

    traceAnalysisEvent("decision_build_start", null, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "decision"
    });
    var proposal = arbitraje.getProposal(summaries);
    var dudas = arbitraje.collectDudas(summaries);
    var conflicts = arbitraje.collectConflicts(summaries, proposal);
    var duplicateInfo = await resolveDuplicateInfo(normalizedRequest, proposal, effectiveDeps || {});
    if (!duplicateInfo.ok) {
      metricas.pushEvent(meta.metricCtx, "error", duplicateInfo.errorCode || ERROR_CODES.REPOSITORIO_PRODUCTOS_NO_DISPONIBLE, duplicateInfo.message || "No se pudo consultar productos reales.", null);
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: duplicateInfo.errorCode || ERROR_CODES.REPOSITORIO_PRODUCTOS_NO_DISPONIBLE,
        message: duplicateInfo.message || "No se pudo consultar productos reales.",
        suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        tipoFallo: FAIL_TYPES.DESCONOCIDO,
        retryable: true,
        datos: buildFailureData(meta, {
          passport: PASSPORTS.ROJO,
          decisionFlow: contratos.DECISION_FLOW.BLOQUEO,
          suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
          conflicts: ["duplicados_reales_no_disponibles"],
          roiRefsRevision: Array.isArray(boxer1Summary.datos.roiRefsRevision) ? boxer1Summary.datos.roiRefsRevision : [],
          summaries: summaries
        })
      });
    }
    var decision = arbitraje.classifyDecision({
      boxer1: summaries.boxer1,
      boxer2: summaries.boxer2,
      boxer3: summaries.boxer3,
      boxer4: summaries.boxer4,
      proposal: proposal,
      dudas: dudas,
      conflicts: conflicts,
      possibleDuplicate: duplicateInfo.posibleDuplicado,
      mergeableDuplicate: duplicateInfo.fusionable
    });
    traceAnalysisEvent("decision_build_done", {
      passport: decision.passport,
      decisionFlujo: decision.decisionFlow
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "decision"
    });
    traceAnalysisEvent("final_payload_build_start", null, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "response"
    });
    var finalData = arbitraje.buildFinalData({
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      elapsedMs: metricas.elapsedSince(meta.startedAt)
    }, summaries, decision, duplicateInfo, iaInfo);
    traceAnalysisEvent("final_payload_build_done", {
      passport: decision.passport,
      decisionFlujo: decision.decisionFlow
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "response"
    });

    metricas.pushEvent(meta.metricCtx, decision.passport === PASSPORTS.VERDE ? "info" : "warn", "CER_DECISION_FINAL", "Cerebro decide el destino del caso.", {
      passport: decision.passport,
      decisionFlujo: decision.decisionFlow,
      posibleDuplicado: finalData.duplicados.posibleDuplicado
    });
    traceAnalysisEvent("cerebro_decision_done", {
      passport: decision.passport,
      decisionFlujo: decision.decisionFlow,
      elapsedMs: metricas.elapsedSince(meta.startedAt)
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "cerebro"
    });
    traceAnalysisEvent("decision_final_done", {
      passport: decision.passport,
      decisionFlujo: decision.decisionFlow,
      elapsedMs: metricas.elapsedSince(meta.startedAt)
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "cerebro"
    });

    if (isTimeBudgetExpired(meta, normalizedRequest)) {
      metricas.pushEvent(meta.metricCtx, "error", ERROR_CODES.TIMEOUT_OPERACION || "CER_TIMEOUT_OPERACION", "Cerebro evita efectos laterales por timeout global.", null);
      return buildTimeoutEnvelope(meta, summaries);
    }

    var routeDecisionStartedAt = Date.now();
    traceAnalysisEvent("route_decision_start", {
      decisionFlujo: decision.decisionFlow
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "route"
    });
    var routeResult = await routeDecision(decision, finalData, meta, effectiveDeps || {});
    traceAnalysisEvent("route_decision_done", {
      decisionFlujo: decision.decisionFlow,
      ok: !(routeResult && routeResult.ok === false),
      elapsedMs: Math.max(0, Date.now() - routeDecisionStartedAt)
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "route"
    });
    if (routeResult && routeResult.ok === false) {
      metricas.pushEvent(meta.metricCtx, "error", ERROR_CODES.DESTINO_INTERNO_FALLIDO, "Fallo el destino interno de Cerebro.", routeResult);
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: ERROR_CODES.DESTINO_INTERNO_FALLIDO,
        message: routeResult.message || "Fallo al entregar la salida de Cerebro.",
        suggestedAction: SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        tipoFallo: FAIL_TYPES.DESCONOCIDO,
        retryable: true,
        datos: finalData
      });
    }

    if (decision.passport === PASSPORTS.ROJO) {
      traceAnalysisEvent("cerebro_return_start", {
        ok: false,
        passport: decision.passport
      }, {
        analysisId: meta.analysisId,
        traceId: meta.traceId,
        phase: "return"
      });
      traceAnalysisEvent("build_response_start", {
        ok: false,
        passport: decision.passport
      }, {
        analysisId: meta.analysisId,
        traceId: meta.traceId,
        phase: "response"
      });
      traceAnalysisEvent("build_response_done", {
        ok: false,
        passport: decision.passport
      }, {
        analysisId: meta.analysisId,
        traceId: meta.traceId,
        phase: "response"
      });
      traceAnalysisEvent("cerebro_return_done", {
        ok: false,
        passport: decision.passport
      }, {
        analysisId: meta.analysisId,
        traceId: meta.traceId,
        phase: "return"
      });
      return errores.buildFailureEnvelope(buildContext(meta), {
        code: decision.errorCode || ERROR_CODES.ARBITRAJE_IMPOSIBLE,
        message: "Cerebro no pudo gobernar el caso con seguridad.",
        suggestedAction: decision.suggestedAction,
        tipoFallo: decision.failType || FAIL_TYPES.DESCONOCIDO,
        retryable: decision.suggestedAction !== SUGGESTED_ACTIONS.BLOQUEAR_GUARDADO,
        datos: finalData
      });
    }

    traceAnalysisEvent("cerebro_return_start", {
      ok: true,
      passport: decision.passport
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "return"
    });
    traceAnalysisEvent("build_response_start", {
      ok: true,
      passport: decision.passport
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "response"
    });
    traceAnalysisEvent("build_response_done", {
      ok: true,
      passport: decision.passport
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "response"
    });
    traceAnalysisEvent("cerebro_return_done", {
      ok: true,
      passport: decision.passport
    }, {
      analysisId: meta.analysisId,
      traceId: meta.traceId,
      phase: "return"
    });
    return {
      ok: true,
      resultado: {
        estadoPasaporteModulo: decision.passport,
        modulo: MODULE_NAME,
        accionSugeridaParaCerebro: decision.suggestedAction,
        elapsedMs: metricas.elapsedSince(meta.startedAt),
        traceId: meta.traceId,
        datos: finalData
      },
      error: null,
      metricas: metricas.finalizeMetricas(meta.metricCtx)
    };
  }

  async function procesarAccionContrato(request, deps) {
    return solicitarAnalisisFoto(request, deps);
  }

  var api = {
    MODULE_NAME: MODULE_NAME,
    CONTRACT_VERSION: contratos.CONTRACT_VERSION,
    ACTION_SOLICITAR_ANALISIS_FOTO: ACTIONS.SOLICITAR_ANALISIS_FOTO,
    solicitarAnalisisFoto: solicitarAnalisisFoto,
    procesarAccionContrato: procesarAccionContrato
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CerebroOrquestador = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);




;/* END ../ia/cerebro_orquestador.js */
