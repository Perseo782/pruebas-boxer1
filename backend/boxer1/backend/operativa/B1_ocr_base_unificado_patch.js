/**
 * BOXER 1 · OCR base adaptado a GAS unificado + OCR rico completo.
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
  const body = {
    moduloDestino: B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
    accion: B1_CONFIG.TRASTIENDA_ACCION_VISION,
    sessionToken: sessionToken || '',
    payload: {
      imageBase64: base64,
      mimeType: 'image/jpeg',
      sessionToken: sessionToken || '',
      token: sessionToken || ''
    }
  };
  const t_build_payload_vision_ms = Date.now() - tPayload;
  const tFetch = Date.now();
  const timeoutMs = (typeof B1_CONFIG !== 'undefined' && B1_CONFIG && B1_CONFIG.VISION_FETCH_TIMEOUT_MS) || 15000;
  const controller = (typeof AbortController === 'function') ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  let response;
  B1_emitVisionCallTrace('vision_call_start', {
    timeoutMs,
    sendModeSolicitado: sendMode || B1_SEND_MODE.BASE64,
    sendModeAplicado: 'base64',
    t_toDataURL_ms,
    t_build_payload_vision_ms
  });
  try {
    response = await fetch(urlTrastienda, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller ? controller.signal : undefined
    });
  } catch (fetchErr) {
    if (controller && fetchErr && fetchErr.name === 'AbortError') {
      throw B1_crearErrorUpstream({
        message: 'Vision OCR timeout tras ' + timeoutMs + 'ms',
        upstreamCode: 'HTTP_TIMEOUT',
        upstreamModule: B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
        raw: null
      });
    }
    B1_emitVisionCallTrace('vision_call_end', {
      ok: false,
      aborted: !!(controller && fetchErr && fetchErr.name === 'AbortError'),
      message: fetchErr && fetchErr.message ? fetchErr.message : String(fetchErr || ''),
      t_fetch_vision_total_ms: Date.now() - tFetch
    });
    throw fetchErr;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  const t_fetch_vision_total_ms = Date.now() - tFetch;

  const tParse = Date.now();
  let respuesta = null;
  try { respuesta = await response.json(); } catch (_) { respuesta = null; }
  const t_parse_respuesta_vision_cliente_ms = Date.now() - tParse;
  B1_emitVisionCallTrace('vision_call_end', {
    ok: !!(response.ok && respuesta && respuesta.ok === true),
    status: response.status || null,
    t_fetch_vision_total_ms,
    t_parse_respuesta_vision_cliente_ms
  });

  if (!response.ok || !respuesta || respuesta.ok !== true) {
    const err = (respuesta && respuesta.error) || {};
    throw B1_crearErrorUpstream({
      message: err.mensaje || err.message || `Trastienda respondió ${response.status || 'sin status'} en Vision OCR`,
      upstreamCode: err.codigo || `HTTP_${response.status || 'UNKNOWN'}`,
      upstreamModule: err.modulo || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
      raw: respuesta
    });
  }

  respuesta.__b1TiemposCliente = {
    t_toDataURL_ms,
    t_build_payload_vision_ms,
    t_fetch_vision_total_ms,
    t_parse_respuesta_vision_cliente_ms,
    t_ocr_llamada_total_ms: Date.now() - t0,
    sendModeSolicitado: sendMode || B1_SEND_MODE.BASE64,
    sendModeAplicado: 'base64'
  };
  respuesta.__b1Upstream = (respuesta && respuesta.meta && respuesta.meta.tiemposInternos) ? respuesta.meta.tiemposInternos : null;
  return respuesta;
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
function _B1_esHuecoHeuristico(texto) { if (typeof texto !== 'string') return true; const t=texto.trim(); if(!t) return true; if(/^[._\-–—]{2,}$/.test(t)) return true; if(/^[\|/\\]+$/.test(t)) return true; if(/^[*~]+$/.test(t)) return true; if(/^\?+$/.test(t)) return true; if(/^[0OQ]{1}$/.test(t)) return false; return false; }
function _B1_confianzaHeuristicaPalabra(texto) { if (!texto) return 0.35; let score=0.78; if(/[^\p{L}\p{N}\-.,()%/]/u.test(texto)) score-=0.15; if(/^[0-9]+$/.test(texto)) score-=0.08; if(texto.length===1) score-=0.10; if(texto.length>=18) score-=0.07; if(/(.)\1\1/.test(texto)) score-=0.12; if(/^[A-ZÁÉÍÓÚÜÑ]{2,}$/.test(texto)) score-=0.03; return Math.max(0.35, Math.min(0.95, Number(score.toFixed(2)))); }
function _B1_mediaConfianzaPalabras(palabras) { return _avg_((palabras || []).map(p=>p.confidence)); }
function _B1_mediaConfianzaBloques(bloques) { return _avg_((bloques || []).map(b=>b.confidence)); }
