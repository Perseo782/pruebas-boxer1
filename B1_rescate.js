/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 6 · RESCATE AVANZADO
 * ══════════════════════════════════════════════════════════════
 * Adaptado al contrato real de Trastienda para Gemini.
 */

// ══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES DE TIMING
// ══════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════
// RESCATE AVANZADO
// ══════════════════════════════════════════════════════════════

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

function B1_construirPromptRescate(slots) {
  const instrucciones = [
    'REPARADOR OCR DE ETIQUETAS ALIMENTARIAS',
    '',
    'ROL: Reconstruyes fragmentos de texto dañados por OCR en etiquetas de productos alimentarios.',
    'Tu único trabajo es leer la imagen ROI del slot y reparar el fragmento dañado.',
    '',
    'REGLAS ABSOLUTAS:',
    '1. Repara OCR — nunca traduzcas. El idioma de salida es siempre el idioma del fragmento original.',
    '   Correcto: 0euf → oeuf | 3gg → egg | s0ja → soja | lche → leche',
    '   Prohibido: egg → huevo | oeuf → huevo | ovo → huevo',
    '2. Solo tocas el slot marcado con [[slotId|texto]]. El contexto es referencia, no objetivo.',
    '3. Cruza imagen ROI con contexto. Si contradicen, la imagen manda.',
    '4. Si no puedes leer el slot con seguridad: estado="no_resuelta". Nunca inventes.',
    '5. Si el texto del slot ya es correcto y la imagen lo confirma: devuélvelo igual.',
    '6. No corrijas conectores, preposiciones ni texto auxiliar aunque parezcan errores OCR.',
    '',
    'INSTRUCCIONES POR CATEGORÍA:',
    '',
    '[familia] — El slot es un alérgeno o nombre de familia alérgena.',
    '  Repara el fragmento OCR dañado. Conserva el idioma exacto del original.',
    '  Si la ROI muestra claramente la palabra: aplica la corrección.',
    '  Si hay ambigüedad de idioma y la ROI no resuelve: no_resuelta.',
    '',
    '[peso_formato] — El slot es una cifra, unidad o formato de pack.',
    '  Solo aplica si el número o unidad es 100% legible en la ROI.',
    '  Si hay cualquier duda sobre la cifra: no_resuelta.',
    '  Nunca aproximes. El peso es dato legal.',
    '',
    '[nombre] — El slot es el nombre oficial del producto.',
    '  Conserva mayúsculas, formato y idioma del original.',
    '  Si hay ambigüedad: no_resuelta.',
    '',
    '[contexto_critico] — El sistema detectó riesgo OCR por contexto.',
    '  Mira la ROI. Si ves claramente una palabra de familia alérgena dañada: repárala.',
    '  Conserva el idioma de lo que ves en la ROI.',
    '  Si la ROI no muestra nada claro o no es un alérgeno: no_resuelta.',
    '',
    'FORMATO SALIDA (JSON PURO - SIN MARKDOWN):',
    '{',
    '  "correcciones": [',
    '    {"slotId":"B1", "solucion":"oeuf", "estado":"aplicable"},',
    '    {"slotId":"B2", "solucion":"", "estado":"no_resuelta"}',
    '  ],',
    '  "simetria":"exacta"',
    '}',
    '',
    'SLOTS:'
  ];

  slots.forEach(slot => {
    instrucciones.push('');
    instrucciones.push(`--- ${slot.slotId} [${slot.categoria || 'contexto_critico'}] ---`);
    instrucciones.push(`OCR: "${slot.textoOriginal}"`);
    instrucciones.push(`Contexto: ${slot.contexto}`);
    if (slot.roiBase64) {
      instrucciones.push('[Imagen ROI adjunta - validación visual obligatoria]');
    }
  });

  instrucciones.push('');
  instrucciones.push('RESPONDE SOLO JSON. SIN CHARLA.');

  return instrucciones.join('\n');
}

async function B1_enviarRescateGemini(textoBase, slots, sessionToken, urlTrastienda) {
  const tInicio = _B1_nowMs();
  const tPayloadInicio = _B1_nowMs();
  const prompt = B1_construirPromptRescate(slots);
  const fragmentosImagen = slots
    .filter(slot => slot.roiBase64)
    .map(slot => ({
      imageBase64: slot.roiBase64,
      mimeType: 'image/jpeg'
    }));

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
