/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 3 · OCR BASE CON VISION
 * ═══════════════════════════════════════════════════════════════
 * Adaptado al contrato real de Trastienda.
 * Trastienda devuelve ocrTexto limpio, no fullTextAnnotation crudo.
 */

async function B1_llamarVisionOCR(canvas, sendMode, sessionToken, urlTrastienda) {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
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
      message: err.mensaje || err.message || `Trastienda respondió ${response.status || 'sin status'} en Vision OCR`,
      upstreamCode: err.codigo || `HTTP_${response.status || 'UNKNOWN'}`,
      upstreamModule: err.modulo || B1_CONFIG.TRASTIENDA_MODULO_DESTINO,
      raw: respuesta
    });
  }

  return respuesta;
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

