/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · CONTRATOS DE ENTRADA Y SALIDA
 * ═══════════════════════════════════════════════════════════════
 */

function B1_validarEntrada(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, reason: 'Entrada vacía o no es objeto.' };
  }

  if (typeof input.moduloOrigen !== 'string' || !input.moduloOrigen.trim()) {
    return { valid: false, reason: 'Falta moduloOrigen.' };
  }

  if (input.moduloDestino !== B1_CONFIG.INPUT_MODULO_DESTINO) {
    return { valid: false, reason: `moduloDestino inválido. Debe ser "${B1_CONFIG.INPUT_MODULO_DESTINO}".` };
  }

  if (input.accion !== B1_CONFIG.INPUT_ACCION) {
    return { valid: false, reason: `accion inválida. Debe ser "${B1_CONFIG.INPUT_ACCION}".` };
  }

  if (typeof input.sessionToken !== 'string' || !input.sessionToken.trim()) {
    return { valid: false, reason: 'Falta sessionToken.' };
  }

  const d = input.datos;
  if (!d || typeof d !== 'object') {
    return { valid: false, reason: 'Falta bloque "datos" en la entrada.' };
  }

  if (!d.imageRef) {
    return { valid: false, reason: 'Falta imageRef.' };
  }

  const modesValidos = Object.values(B1_SEND_MODE);
  if (!modesValidos.includes(d.sendMode)) {
    return { valid: false, reason: `sendMode inválido: "${d.sendMode}". Permitidos: ${modesValidos.join(', ')}` };
  }

  if (typeof d.agentEnabled !== 'boolean') {
    return { valid: false, reason: 'agentEnabled debe ser true o false.' };
  }

  const sensValidas = Object.values(B1_SENSITIVITY);
  if (!sensValidas.includes(d.sensitivityMode)) {
    return { valid: false, reason: `sensitivityMode inválido: "${d.sensitivityMode}". Permitidos: ${sensValidas.join(', ')}` };
  }

  if (typeof d.timeBudgetMs !== 'number' || d.timeBudgetMs <= 0) {
    return { valid: false, reason: 'timeBudgetMs debe ser número positivo.' };
  }

  if (d.expect !== undefined) {
    if (!Array.isArray(d.expect) || d.expect.some(x => typeof x !== 'string' || !x.trim())) {
      return { valid: false, reason: 'expect debe ser un array de strings no vacíos.' };
    }
  }

  return {
    valid: true,
    datos: {
      ...d,
      expect: Array.isArray(d.expect) ? d.expect : []
    }
  };
}

function B1_validarConfig(config) {
  if (!config || typeof config !== 'object') {
    return { valid: false, reason: 'Falta config.' };
  }
  if (typeof config.urlTrastienda !== 'string' || !config.urlTrastienda.trim()) {
    return { valid: false, reason: 'config.urlTrastienda es obligatorio.' };
  }
  return { valid: true, config: { urlTrastienda: config.urlTrastienda.trim() } };
}

function B1_generarTraceId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `trc_b1_${ts}_${rand}`;
}

function B1_clonarPlano(valor) {
  if (Array.isArray(valor)) return valor.map(B1_clonarPlano);
  if (valor && typeof valor === 'object') {
    const out = {};
    Object.keys(valor).forEach(k => {
      out[k] = B1_clonarPlano(valor[k]);
    });
    return out;
  }
  return valor;
}

function B1_exportarTiemposProceso(tiemposProceso, totalElapsedMs) {
  const base = B1_clonarPlano(tiemposProceso || {});
  if (!base.total || typeof base.total !== 'object') base.total = {};
  base.total.t_total_boxer1_ms = totalElapsedMs ?? 0;
  return base;
}

function B1_crearRespuestaOk(params) {
  const {
    textoBaseVision,
    textoAuditado,
    estadoPasaporte,
    correcciones = [],
    noResueltas = [],
    roiRefsRevision = [],
    metricas,
    traceId,
    elapsedMs,
    accionSugeridaParaCerebro = null,
    warning = null,
    diagnostico = null
  } = params;

  const datos = {
    textoBaseVision,
    textoAuditado,
    correcciones,
    noResueltas,
    roiRefsRevision,
    metricas
  };

  if (diagnostico) datos.diagnostico = diagnostico;

  const resultado = {
    estadoPasaporteModulo: estadoPasaporte,
    modulo: B1_CONFIG.MODULE_NAME,
    elapsedMs,
    traceId,
    datos
  };

  if (accionSugeridaParaCerebro) resultado.accionSugeridaParaCerebro = accionSugeridaParaCerebro;
  if (warning) resultado.warning = warning;

  return { ok: true, resultado, error: null };
}

function B1_crearRespuestaError(params) {
  const {
    code,
    message,
    tipoFallo,
    retryable,
    traceId,
    elapsedMs,
    accionSugeridaParaCerebro,
    textoBaseVision = null,
    chainedFrom = null,
    intentos = null,
    tiempoTotalReintentoMs = 0,
    detail = null,
    motivo = null,
    errorOriginal = null,
    diagnostico = null,
    metricas = null
  } = params;

  const errorObj = {
    code,
    origin: B1_CONFIG.MODULE_ORIGIN,
    passport: B1_PASSPORT.ROJO,
    message,
    tipoFallo,
    retryable
  };

  if (tipoFallo === B1_TIPO_FALLO.REPARACION_AGOTADA) {
    errorObj.tiempoTotalReintentoMs = tiempoTotalReintentoMs;
  }

  if (intentos && tipoFallo === B1_TIPO_FALLO.REPARACION_AGOTADA) errorObj.intentos = intentos;
  if (chainedFrom) errorObj.chainedFrom = chainedFrom;
  if (motivo) errorObj.motivo = motivo;
  if (detail) errorObj.detail = detail;
  if (errorOriginal) errorObj.errorOriginal = errorOriginal;

  const datos = {};
  if (textoBaseVision !== null && textoBaseVision !== undefined) datos.textoBaseVision = textoBaseVision;
  if (metricas) datos.metricas = metricas;
  if (diagnostico) datos.diagnostico = diagnostico;

  const resultado = {
    estadoPasaporteModulo: B1_PASSPORT.ROJO,
    modulo: B1_CONFIG.MODULE_NAME,
    accionSugeridaParaCerebro,
    elapsedMs,
    traceId,
    datos
  };

  return { ok: false, resultado, error: errorObj };
}

function B1_crearMetricas(params = {}) {
  return {
    pageConfidence: params.pageConfidence ?? null,
    criticalZoneScore: params.criticalZoneScore ?? null,
    slotsEnviados: params.slotsEnviados ?? 0,
    slotsDevueltos: params.slotsDevueltos ?? 0,
    mergeStatus: params.mergeStatus ?? B1_MERGE_STATUS.NO_INTENTADO,
    rescatesIntentados: params.rescatesIntentados ?? 0,
    rescatesAplicados: params.rescatesAplicados ?? 0,
    elapsedMs: params.elapsedMs ?? 0,
    abortReason: params.abortReason ?? null,
    tiempos: params.tiempos ? B1_clonarPlano(params.tiempos) : null
  };
}

function B1_crearRoiRef(slotId, refUri) {
  return {
    slotId,
    ref: refUri || `roi://temp/${slotId}`,
    ttlMs: B1_CONFIG.ROI_TTL_MS
  };
}

function B1_crearCronometro(timeBudgetMs) {
  const inicio = Date.now();
  const presupuesto = timeBudgetMs || B1_CONFIG.DEFAULT_TIME_BUDGET_MS;

  return {
    elapsed() {
      return Date.now() - inicio;
    },
    remaining() {
      return Math.max(0, presupuesto - this.elapsed());
    },
    canAfford(estimatedMs) {
      return this.remaining() > estimatedMs;
    },
    expired() {
      return this.remaining() <= 0;
    }
  };
}

function B1_crearErrorUpstream({ message, upstreamCode, upstreamModule, raw, intentCount = 0 }) {
  const err = new Error(message || 'Error upstream');
  err.upstreamCode = upstreamCode || null;
  err.upstreamModule = upstreamModule || null;
  err.raw = raw || null;
  err.intentCount = intentCount || 0;
  return err;
}
