/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 v2 · CONTRATOS DE ENTRADA Y SALIDA
 * ═══════════════════════════════════════════════════════════════
 * Alineado con madre v5 y 12 reglas fijas del proyecto.
 * Sin limite de tiempo. Sin penalizacion por duracion.
 * ═══════════════════════════════════════════════════════════════
 */


/* ── VALIDAR ENTRADA ─────────────────────────────────────── */

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
  return {
    valid: true,
    datos: {
      imageRef: d.imageRef,
      sendMode: d.sendMode
    }
  };
}


/* ── VALIDAR CONFIG ──────────────────────────────────────── */

function B1_validarConfig(config) {
  if (!config || typeof config !== 'object') {
    return { valid: false, reason: 'Falta config.' };
  }
  if (typeof config.urlTrastienda !== 'string' || !config.urlTrastienda.trim()) {
    return { valid: false, reason: 'config.urlTrastienda es obligatorio.' };
  }
  return { valid: true, config: { urlTrastienda: config.urlTrastienda.trim() } };
}


/* ── TRACE ID ────────────────────────────────────────────── */

function B1_generarTraceId() {
  var ts = Date.now().toString(36);
  var rand = Math.random().toString(36).substring(2, 8);
  return 'trc_b1_' + ts + '_' + rand;
}


/* ── RESPUESTA OK ────────────────────────────────────────── */

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


/* ── RESPUESTA ERROR ─────────────────────────────────────── */

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


/* ── METRICAS ────────────────────────────────────────────── */

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


/* ── ROI REF ─────────────────────────────────────────────── */

function B1_crearRoiRef(slotId, refUri) {
  return {
    slotId: slotId,
    ref:    refUri || ('roi://temp/' + slotId),
    ttlMs:  B1_CONFIG.ROI_TTL_MS
  };
}


/* ── CRONOMETRO ──────────────────────────────────────────── */
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


/* ── ERROR UPSTREAM ──────────────────────────────────────── */

function B1_crearErrorUpstream(params) {
  var err = new Error(params.message || 'Error upstream');
  err.upstreamCode   = params.upstreamCode   || null;
  err.upstreamModule = params.upstreamModule || null;
  err.raw            = params.raw            || null;
  err.intentCount    = params.intentCount    || 0;
  return err;
}
