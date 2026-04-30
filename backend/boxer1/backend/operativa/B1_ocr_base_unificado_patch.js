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
        texto: _B1_extraerTextoOCR_(ctx.vision)
      } : null,
      deepseek: ctx.deepseek ? {
        motor: 'DeepSeek-OCR en Vertex AI',
        firma: 'FUENTE_REAL: DEEPSEEK_OCR_VERTEX_AI',
        ok: true,
        elapsedMs: ctx.deepseekElapsedMs,
        texto: _B1_extraerTextoOCR_(ctx.deepseek)
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
