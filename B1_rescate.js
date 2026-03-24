/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 6 · RESCATE AVANZADO
 * ═══════════════════════════════════════════════════════════════
 * Adaptado al contrato real de Trastienda para Gemini.
 */

const B1_RESCUE_ESTIMATED_MS = 3000;

function B1_construirPromptRescate(slots) {
  const instrucciones = [
    'Eres un corrector OCR especializado en etiquetas alimentarias.',
    'Corrige SOLO lo deducible con certeza. No inventes.',
    'Devuelve exactamente los mismos slotId. Si no puedes resolver, estado = "no_resuelta".',
    'JSON estricto con {"correcciones":[...],"simetria":"exacta"}.',
    '',
    'SLOTS A CORREGIR:'
  ];

  slots.forEach(slot => {
    instrucciones.push(`\n--- Slot ${slot.slotId} ---`);
    instrucciones.push(`Texto OCR original: "${slot.textoOriginal}"`);
    instrucciones.push(`Confianza OCR: ${slot.confidence}`);
    instrucciones.push(`Contexto intrabloque: ${slot.contexto}`);
    if (slot.roiBase64) instrucciones.push(`[Imagen ROI adjunta para este slot]`);
  });

  return instrucciones.join('\n');
}

async function B1_enviarRescateGemini(textoBase, slots, sessionToken, urlTrastienda) {
  const prompt = B1_construirPromptRescate(slots);
  const fragmentosImagen = slots
    .filter(slot => slot.roiBase64)
    .map(slot => ({
      imageBase64: slot.roiBase64,
      mimeType: 'image/jpeg',
      etiqueta: `ROI ${slot.slotId}`
    }));

  const body = {
    moduloOrigen: B1_CONFIG.TRASTIENDA_MODULO_ORIGEN,
    moduloDestino: B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
    accion: B1_CONFIG.TRASTIENDA_ACCION_GEMINI,
    sessionToken,
    datos: {
      ocrTexto: String(textoBase || '').trim(),
      contexto: prompt,
      fragmentosImagen
    }
  };

  const response = await fetch(urlTrastienda, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });

  let respuesta = null;
  try {
    respuesta = await response.json();
  } catch (_) {
    respuesta = null;
  }

  if (!response.ok || !respuesta || respuesta.ok !== true) {
    const err = (respuesta && respuesta.error) || {};
    throw B1_crearErrorUpstream({
      message: err.mensaje || err.message || `Trastienda respondió ${response.status || 'sin status'} en rescate Gemini`,
      upstreamCode: err.codigo || `HTTP_${response.status || 'UNKNOWN'}`,
      upstreamModule: err.modulo || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
      raw: respuesta
    });
  }

  return _parsearRespuestaGemini(respuesta);
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
  if (loteRescate.totalSlots === 0) {
    return {
      intentado: false,
      correcciones: [],
      slotsEnviados: 0,
      slotsDevueltos: 0,
      razon: 'Sin slots rescatables.',
      erroresLote: 0,
      upstreamError: null
    };
  }

  if (!cronometro.canAfford(B1_RESCUE_ESTIMATED_MS)) {
    return {
      intentado: false,
      correcciones: [],
      slotsEnviados: 0,
      slotsDevueltos: 0,
      razon: 'Presupuesto de tiempo insuficiente para rescate.',
      erroresLote: 0,
      upstreamError: null
    };
  }

  const { necesitaTroceo, lotes } = B1_decidirTroceo(loteRescate.slots, cronometro);
  if (lotes.length === 0) {
    return {
      intentado: false,
      correcciones: [],
      slotsEnviados: 0,
      slotsDevueltos: 0,
      razon: 'Sin tiempo para ningún lote de rescate.',
      erroresLote: 0,
      upstreamError: null
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
      const resultado = await B1_enviarRescateGemini(textoBase, lote, sessionToken, urlTrastienda);
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

  if (totalDevueltos === 0 && errores.length > 0) {
    const primero = errores[0];
    const err = new Error(primero.message || 'Rescate Gemini fallido');
    err.upstreamCode = primero.upstreamCode || null;
    err.upstreamModule = primero.upstreamModule || null;
    err.raw = primero.raw || null;
    err.intentCount = errores.length;
    throw err;
  }

  return {
    intentado: true,
    correcciones: todasCorrecciones,
    slotsEnviados: totalEnviados,
    slotsDevueltos: totalDevueltos,
    necesitaTroceo,
    lotesEjecutados: lotes.length,
    razon: null,
    erroresLote: errores.length,
    upstreamError: errores.length ? errores[0] : null
  };
}

