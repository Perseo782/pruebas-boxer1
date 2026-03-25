/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 3 · OCR BASE CON VISION
 * ═══════════════════════════════════════════════════════════════
 * Adaptado al contrato real de Trastienda.
 * Trastienda devuelve ocrTexto limpio, no fullTextAnnotation crudo.
 */

function _B1_nowMs() {
  return (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
}

function _B1_roundMs(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function _B1_extraerTiemposInternosResultado(respuestaTrastienda) {
  if (!respuestaTrastienda || typeof respuestaTrastienda !== 'object') return null;

  const candidatos = [
    respuestaTrastienda?.resultado?.metadatos?.tiemposInternos,
    respuestaTrastienda?.resultado?.tiemposInternos,
    respuestaTrastienda?.metadatos?.tiemposInternos,
    respuestaTrastienda?.tiemposInternos
  ];

  for (const candidato of candidatos) {
    if (candidato && typeof candidato === 'object' && !Array.isArray(candidato)) {
      return B1_clonarPlano ? B1_clonarPlano(candidato) : JSON.parse(JSON.stringify(candidato));
    }
  }

  return null;
}

function _B1_estimarExternoNoDesglosado(fetchTotalMs, tiemposInternos) {
  if (!tiemposInternos || typeof tiemposInternos !== 'object') return null;
  const totalInterno = typeof tiemposInternos.t_total_gas_interno_ms === 'number'
    ? tiemposInternos.t_total_gas_interno_ms
    : null;
  if (totalInterno === null) return null;
  return Math.max(0, _B1_roundMs(fetchTotalMs) - _B1_roundMs(totalInterno));
}

async function B1_llamarVisionOCR(canvas, sendMode, sessionToken, urlTrastienda) {
  const tInicio = _B1_nowMs();

  const tToDataUrlInicio = _B1_nowMs();
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const tToDataUrl = _B1_roundMs(_B1_nowMs() - tToDataUrlInicio);

  const tPayloadInicio = _B1_nowMs();
  const base64 = dataUrl.split(',')[1];
  const body = {
    moduloOrigen: B1_CONFIG.TRASTIENDA_MODULO_ORIGEN,
    moduloDestino: B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
    accion: B1_CONFIG.TRASTIENDA_ACCION_VISION,
    sessionToken,
    datos: {
      imageBase64: base64,
      mimeType: 'image/jpeg'
    }
  };
  const bodyString = JSON.stringify(body);
  const tBuildPayload = _B1_roundMs(_B1_nowMs() - tPayloadInicio);

  const tFetchInicio = _B1_nowMs();
  const response = await fetch(urlTrastienda, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
      message: err.mensaje || err.message || `Trastienda respondió ${response.status || 'sin status'} en Vision OCR`,
      upstreamCode: err.codigo || `HTTP_${response.status || 'UNKNOWN'}`,
      upstreamModule: err.modulo || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
      raw: respuesta
    });
  }

  const tiemposInternos = _B1_extraerTiemposInternosResultado(respuesta);
  const tExternoNoDesglosado = _B1_estimarExternoNoDesglosado(tFetchTotal, tiemposInternos);

  return {
    respuestaTrastienda: respuesta,
    tiempos: {
      cliente: {
        sendModeSolicitado: sendMode,
        sendModeAplicado: B1_SEND_MODE.BASE64,
        t_toDataURL_ms: tToDataUrl,
        t_build_payload_vision_ms: tBuildPayload,
        t_fetch_vision_total_ms: tFetchTotal,
        t_parse_respuesta_vision_cliente_ms: tParseCliente,
        t_ocr_llamada_total_ms: _B1_roundMs(_B1_nowMs() - tInicio)
      },
      upstream: tiemposInternos,
      estimaciones: {
        t_vision_externo_no_desglosado_ms: tExternoNoDesglosado
      },
      transporte: {
        httpStatus: response.status
      }
    }
  };
}

function B1_normalizarOCR(respuestaTrastienda) {
  const visionData = _extraerDatosVision(respuestaTrastienda);
  const ocrTexto = typeof visionData.ocrTexto === 'string' ? visionData.ocrTexto.trim() : '';

  if (!ocrTexto) {
    return {
      textoCompleto: '',
      paginas: [],
      totalPalabras: 0,
      visionVacia: true,
      metadatos: visionData.metadatos || null,
      fuente: 'ocr_texto_plano'
    };
  }

  const lineas = ocrTexto
    .split(/\r?\n+/)
    .map(x => x.trim())
    .filter(Boolean);

  let totalPalabras = 0;
  const bloques = lineas.map((linea, blockIndex) => {
    const palabras = linea
      .split(/\s+/)
      .filter(Boolean)
      .map((texto, wordIndex) => {
        totalPalabras += 1;
        return {
          texto,
          confidence: _B1_confianzaHeuristicaPalabra(texto),
          huecoHeuristico: _B1_esHuecoHeuristico(texto),
          boundingPoly: null,
          simbolos: texto.split('').map(ch => ({ texto: ch, confidence: _B1_confianzaHeuristicaPalabra(ch) })),
          wordIndex
        };
      });

    return {
      blockIndex,
      texto: linea,
      confidence: _B1_mediaConfianzaPalabras(palabras),
      boundingPoly: null,
      palabras
    };
  });

  return {
    textoCompleto: ocrTexto,
    paginas: [{
      pageIndex: 0,
      confidence: _B1_mediaConfianzaBloques(bloques),
      bloques
    }],
    totalPalabras,
    visionVacia: totalPalabras === 0,
    metadatos: visionData.metadatos || null,
    fuente: 'ocr_texto_plano'
  };
}

function B1_construirTextoBase(ocrNormalizado) {
  if (!ocrNormalizado || ocrNormalizado.visionVacia) return '';
  const lineas = [];
  ocrNormalizado.paginas.forEach(pagina => {
    pagina.bloques.forEach(bloque => lineas.push(bloque.texto));
  });
  return lineas.join('\n');
}

function _extraerDatosVision(respuestaTrastienda) {
  if (!respuestaTrastienda) return { ocrTexto: '', metadatos: null };

  const resultado = respuestaTrastienda.resultado || {};
  if (typeof resultado.ocrTexto === 'string' || resultado.metadatos) {
    return {
      ocrTexto: resultado.ocrTexto || '',
      metadatos: resultado.metadatos || null,
      vacio: !!resultado.vacio,
      idiomaSolicitado: resultado.idiomaSolicitado || []
    };
  }

  return { ocrTexto: '', metadatos: null };
}

function _blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function _B1_esHuecoHeuristico(texto) {
  if (typeof texto !== 'string') return true;
  const t = texto.trim();
  if (!t) return true;
  if (/^[._\-–—]{2,}$/.test(t)) return true;
  if (/^[\|/\\]+$/.test(t)) return true;
  if (/^[*~]+$/.test(t)) return true;
  if (/^\?+$/.test(t)) return true;
  if (/^[0OQ]{1}$/.test(t)) return false;
  return false;
}

function _B1_confianzaHeuristicaPalabra(texto) {
  if (!texto) return 0.35;
  let score = 0.78;
  if (/[^\p{L}\p{N}\-.,()%/]/u.test(texto)) score -= 0.15;
  if (/^[0-9]+$/.test(texto)) score -= 0.08;
  if (texto.length === 1) score -= 0.10;
  if (texto.length >= 18) score -= 0.07;
  if (/(.)\1\1/.test(texto)) score -= 0.12;
  if (/^[A-ZÁÉÍÓÚÜÑ]{2,}$/.test(texto)) score -= 0.03;
  return Math.max(0.35, Math.min(0.95, Number(score.toFixed(2))));
}

function _B1_mediaConfianzaPalabras(palabras) {
  if (!palabras.length) return null;
  return Number((palabras.reduce((acc, p) => acc + (p.confidence || 0), 0) / palabras.length).toFixed(2));
}

function _B1_mediaConfianzaBloques(bloques) {
  if (!bloques.length) return null;
  const vals = bloques.map(b => b.confidence).filter(v => typeof v === 'number');
  if (!vals.length) return null;
  return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
}
