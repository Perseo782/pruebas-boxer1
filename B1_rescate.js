/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 6 · RESCATE AVANZADO
 * ═══════════════════════════════════════════════════════════════
 * Adaptado al contrato real de Trastienda para Gemini.
 *
 * CAMBIO v2: B1_construirPromptRescate actualizado a los 3 estados
 *   corregida / ya_valida / no_resuelta
 * El resto del archivo no se toca.
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
    '- no_resuelta  → no puedes corregir con seguridad. No inventes.',
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
    '   → Usa imagen para desempatar.',
    '   → Si imagen borrosa → estado="no_resuelta"',
    '   PROHIBIDO elegir al azar.',
    '',
    '2. CIFRAS Y PESOS:',
    '   Si número roto y la imagen NO permite ver 100% claro:',
    '   → estado="no_resuelta"',
    '   NO aproximes. El peso es dato legal.',
    '',
    '3. VACÍO ILEGIBLE:',
    '   Si imagen es borrón/destello blanco:',
    '   → estado="no_resuelta"',
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
  const prompt = B1_construirPromptRescate(slots);
  const ocrTextoNormalizado = String(textoBase || '').trim();
  const incluirOcrCompleto = _B1_debeAdjuntarOcrCompleto(slots);
  const fragmentosImagen = slots
    .map(slot => _B1_normalizarImagenBase64(slot.roiBase64))
    .filter(fragmento => fragmento && fragmento.imageBase64);

  const body = {
    moduloDestino: 'TRASTIENDA',
    accion: 'procesarGemini',
    sessionToken: sessionToken || '',
    payload: {
      ocrTexto: incluirOcrCompleto ? ocrTextoNormalizado : '',
      contexto: prompt,
      fragmentosImagen,
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
