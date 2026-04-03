
/**
 * ══════════════════════════════════════════════════════════════
 * BOXER 1 · RESCATE MULTIMODAL CERRADO A/B
 * ══════════════════════════════════════════════════════════════
 * A: alérgenos / familias rotas
 * B: peso / litros / pack / formato roto
 *
 * Fuera de alcance:
 * - nombre del producto
 * - contexto crítico abierto
 * ══════════════════════════════════════════════════════════════
 */

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

function _B1_agruparSlotsAB(slots) {
  const paqueteA = [];
  const paqueteB = [];

  (slots || []).forEach(slot => {
    if (slot.categoria === 'familia') paqueteA.push(slot);
    else if (slot.categoria === 'peso_formato') paqueteB.push(slot);
  });

  return { paqueteA, paqueteB };
}

function _B1_normalizarEstadoGeminiTexto(estado) {
  const e = String(estado || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (!e) return 'no_resuelta';
  if (e === 'aplicable' || e === 'aplicada' || e === 'corregida') return 'aplicable';
  if (
    e === 'ya_valida' ||
    e === 'ya valida' ||
    e === 'sin_cambio_necesario' ||
    e === 'sin cambio necesario' ||
    e === 'ya_valida_sin_cambio'
  ) {
    return 'ya_valida';
  }
  return 'no_resuelta';
}

function B1_construirPromptRescate(slots) {
  const grupos = _B1_agruparSlotsAB(slots);
  const out = [
    'REPARADOR OCR DE ETIQUETAS ALIMENTARIAS · BOXER 1',
    '',
    'ALCANCE CERRADO:',
    '- PAQUETE A: posibles alérgenos o familias alérgenas rotas.',
    '- PAQUETE B: posibles pesos, litros, packs, unidades o formatos rotos.',
    '',
    'PROHIBICIONES ABSOLUTAS:',
    '1. No traduzcas.',
    '2. No inventes categorías.',
    '3. No toques palabras fuera del slot marcado.',
    '4. Si el slot ya está bien leído, devuélvelo como ya_valida.',
    '5. Si la ROI no permite corregir con seguridad, devuélvelo como no_resuelta.',
    '6. No corrijas nombres de producto. Están fuera de alcance.',
    '',
    'REGLAS DE PAQUETE A:',
    '- El slot ya ha sido prefiltrado por código como posible alérgeno/familia rota.',
    '- Conserva el idioma que veas en la ROI.',
    '- Corrige solo si la ROI y el contexto confirman una forma válida del universo alérgeno.',
    '- Si el término ya está correcto, no lo cambies y devuélvelo como ya_valida.',
    '',
    'REGLAS DE PAQUETE B:',
    '- El slot ya ha sido prefiltrado por código como posible formato roto.',
    '- Corrige solo cifras, separadores y unidades.',
    '- No aproximes pesos ni inventes unidades.',
    '- Si el valor ya es correcto, devuélvelo como ya_valida.',
    '- Si la cifra o unidad no se ve clara: no_resuelta.',
    '',
    'FORMATO DE SALIDA (JSON PURO):',
    '{',
    '  "correcciones": [',
    '    {"slotId":"B1", "solucion":"mostaza", "estado":"aplicable"},',
    '    {"slotId":"B2", "solucion":"", "estado":"ya_valida"},',
    '    {"slotId":"B3", "solucion":"", "estado":"no_resuelta"}',
    '  ],',
    '  "simetria":"exacta"',
    '}',
    ''
  ];

  out.push(`PAQUETE A · TOTAL ${grupos.paqueteA.length}`);
  if (grupos.paqueteA.length === 0) out.push('[vacío]');
  grupos.paqueteA.forEach(slot => {
    out.push(`--- ${slot.slotId} [familia] ---`);
    out.push(`OCR: "${slot.textoOriginal}"`);
    out.push(`Contexto: ${slot.contexto}`);
    if (slot.roiBase64) out.push('[Imagen ROI adjunta]');
    out.push('');
  });

  out.push(`PAQUETE B · TOTAL ${grupos.paqueteB.length}`);
  if (grupos.paqueteB.length === 0) out.push('[vacío]');
  grupos.paqueteB.forEach(slot => {
    out.push(`--- ${slot.slotId} [peso_formato] ---`);
    out.push(`OCR: "${slot.textoOriginal}"`);
    out.push(`Contexto: ${slot.contexto}`);
    if (slot.roiBase64) out.push('[Imagen ROI adjunta]');
    out.push('');
  });

  out.push('RESPONDE SOLO JSON. SIN TEXTO EXTRA.');
  return out.join('\n');
}

async function B1_enviarRescateGemini(textoBase, slots, sessionToken, urlTrastienda) {
  const tInicio = _B1_nowMs();
  const tPayloadInicio = _B1_nowMs();
  const prompt = B1_construirPromptRescate(slots);
  const fragmentosImagen = (slots || [])
    .filter(slot => slot.roiBase64)
    .map(slot => ({ imageBase64: slot.roiBase64, mimeType: 'image/jpeg' }));

  const body = {
    moduloDestino: 'TRASTIENDA',
    accion: 'procesarGemini',
    payload: {
      ocrTexto: String(textoBase || '').trim(),
      contexto: prompt,
      fragmentosImagen
    }
  };

  const bodyString = JSON.stringify(body);
  const tBuildPayload = _B1_roundMs(_B1_nowMs() - tPayloadInicio);

  const tFetchInicio = _B1_nowMs();
  const response = await fetch(urlTrastienda, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: bodyString
  });
  const rawText = await response.text();
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

function _parsearRespuestaGemini(respuestaTrastienda) {
  const resultado = respuestaTrastienda && respuestaTrastienda.resultado ? respuestaTrastienda.resultado : {};
  let payload = resultado.respuestaGemini;

  if (typeof payload === 'string') {
    payload = payload.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
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
    correcciones: Array.isArray(payload.correcciones)
      ? payload.correcciones.map(item => ({
          slotId: item && item.slotId ? item.slotId : null,
          solucion: typeof item?.solucion === 'string' ? item.solucion : '',
          estado: _B1_normalizarEstadoGeminiTexto(item && item.estado)
        }))
      : [],
    simetria: payload.simetria || null,
    raw: payload
  };
}

function B1_decidirTroceo(slots, cronometro) {
  const MAX_ROIS_POR_LOTE = 15;
  const slotsConROI = (slots || []).filter(s => s.roiBase64);
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

async function B1_ejecutarRescate(loteRescate, textoBase, cronometro, sessionToken, urlTrastienda) {
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
      const envio = await B1_enviarRescateGemini(textoBase, lote, sessionToken, urlTrastienda);
      const resultado = envio.parseado;

      tiemposCliente.t_build_payload_gemini_ms += envio.tiempos?.cliente?.t_build_payload_gemini_ms || 0;
      tiemposCliente.t_fetch_gemini_total_ms += envio.tiempos?.cliente?.t_fetch_gemini_total_ms || 0;
      tiemposCliente.t_parse_respuesta_gemini_cliente_ms += envio.tiempos?.cliente?.t_parse_respuesta_gemini_cliente_ms || 0;
      tiemposCliente.t_gemini_total_ms += envio.tiempos?.cliente?.t_gemini_lote_total_ms || 0;

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
    err.upstreamCode = primero.upstreamCode || null;
    err.upstreamModule = primero.upstreamModule || null;
    err.raw = primero.raw || null;
    err.intentCount = errores.length;
    throw err;
  }

  const upstreamAgregado = tiemposUpstreamLotes.reduce((acc, lote) => _B1_sumarObjetoNumerico(acc, lote), {});
  const externoAgregado = tiemposEstimadosLotes
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
