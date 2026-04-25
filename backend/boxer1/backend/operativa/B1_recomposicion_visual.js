/**
 * =====================================================================
 * B1_recomposicion_visual.js · BOXER 1
 * =====================================================================
 * Recomposicion geometrica de filas de etiqueta a partir de los datos
 * ricos de Vision (fullTextAnnotation).
 *
 * Opera sobre los PARRAFOS de Vision con sus coordenadas reales.
 * Reagrupa los parrafos que estan en la misma fila visual
 * (izquierda a derecha) y construye un texto recompuesto fila a fila.
 *
 * Principios de diseno:
 *   - Solo geometria pura: sin interpretacion semantica.
 *   - Fallback automatico al OCR plano si la recomposicion pierde info.
 *   - Eficiencia O(n log n): una sola pasada de extraccion + sort unico.
 *   - Compatible ES5 (var, bucles for, sin arrow functions).
 *   - Defensivo: cualquier entrada nula/inesperada devuelve fallback.
 * =====================================================================
 */

// Umbral de proximidad de centros: dos parrafos son la misma fila si
// |centerY_A - centerY_B| <= RATIO * min(alturaA, alturaB).
var B1_RECOMP_CENTER_RATIO = 0.45;

// Umbral de solape vertical: dos parrafos son la misma fila si se
// solapan >= RATIO * min(alturaA, alturaB).
var B1_RECOMP_OVERLAP_RATIO = 0.35;

// Umbral de retencion de informacion alfanumerica.
// Si el texto recompuesto tiene menos del 85% de chars alfanumericos
// que el OCR plano, se usa el OCR plano como fallback.
var B1_RECOMP_MIN_ALFA_RATIO = 0.85;

/**
 * Punto de entrada principal.
 *
 * @param {object} visionRespuesta  Respuesta cruda de Vision desde Trastienda.
 * @param {object} ocrNormalizado   Resultado de B1_normalizarOCR (fallback).
 * @returns {{
 *   textoRecompuesto: string,
 *   filasRecompuestas: Array,
 *   usadoFallback: boolean,
 *   motivoFallback: string|null
 * }}
 */
function B1_recomponerFilasVision(visionRespuesta, ocrNormalizado) {
  var textoFallback = _B1_recomp_textoDesdeNorm(ocrNormalizado);

  // Extraer fullTextAnnotation de la respuesta Vision
  var resultado = (visionRespuesta && visionRespuesta.resultado) ? visionRespuesta.resultado : {};
  var fta = (resultado.visionRich) ? resultado.visionRich.fullTextAnnotation : null;

  // Sin datos ricos de Vision → fallback inmediato
  if (!fta || !Array.isArray(fta.pages) || fta.pages.length === 0) {
    return _B1_recomp_fallback(textoFallback, [], 'sin_datos_ricos');
  }

  // Extraer parrafos con sus coordenadas reales
  var parrafos = _B1_recomp_extraerParrafos(fta.pages);
  if (parrafos.length === 0) {
    return _B1_recomp_fallback(textoFallback, [], 'sin_parrafos');
  }

  // Agrupar parrafos en filas visuales y construir texto ordenado
  var filas = _B1_recomp_agruparEnFilas(parrafos);
  if (filas.length === 0) {
    return _B1_recomp_fallback(textoFallback, [], 'sin_filas_utiles');
  }

  var textoRecompuesto = _B1_recomp_unirFilas(filas);

  // Comprobar perdida de informacion frente al OCR plano
  if (textoFallback) {
    var charsOrig   = _B1_recomp_contarAlfa(textoFallback);
    var charsRecomp = _B1_recomp_contarAlfa(textoRecompuesto);
    var ratio = (charsOrig > 0) ? (charsRecomp / charsOrig) : 1;
    if (ratio < B1_RECOMP_MIN_ALFA_RATIO) {
      return _B1_recomp_fallback(textoFallback, filas, 'perdida_informacion');
    }
  }

  return {
    textoRecompuesto:  textoRecompuesto,
    filasRecompuestas: filas,
    usadoFallback:     false,
    motivoFallback:    null
  };
}

/* ── Extraccion de parrafos ──────────────────────────────────────── */

/**
 * Recorre pages → blocks → paragraphs y extrae los parrafos con texto
 * y bounding box valido.
 */
function _B1_recomp_extraerParrafos(pages) {
  var parrafos = [];

  for (var pi = 0; pi < pages.length; pi++) {
    var blocks = pages[pi].blocks;
    if (!Array.isArray(blocks)) continue;

    for (var bi = 0; bi < blocks.length; bi++) {
      var paragraphs = blocks[bi].paragraphs;
      if (!Array.isArray(paragraphs)) continue;

      for (var pri = 0; pri < paragraphs.length; pri++) {
        var para   = paragraphs[pri];
        var texto  = _B1_recomp_textoParrafo(para);
        if (!texto) continue;

        var bounds = _B1_recomp_bounds(para.boundingBox || para.boundingPoly);
        if (!bounds) continue;

        parrafos.push({
          texto:   texto,
          xMin:    bounds.xMin,
          xMax:    bounds.xMax,
          yMin:    bounds.yMin,
          yMax:    bounds.yMax,
          centerY: (bounds.yMin + bounds.yMax) / 2,
          height:  bounds.yMax - bounds.yMin
        });
      }
    }
  }

  return parrafos;
}

/**
 * Construye el texto de un parrafo concatenando los simbolos de cada word.
 * Prioriza symbols[] (mas preciso) sobre word.text.
 */
function _B1_recomp_textoParrafo(para) {
  if (!para || !Array.isArray(para.words)) return '';
  var partes = [];

  for (var wi = 0; wi < para.words.length; wi++) {
    var word = para.words[wi];
    var t = '';

    if (Array.isArray(word.symbols) && word.symbols.length > 0) {
      for (var si = 0; si < word.symbols.length; si++) {
        t += (word.symbols[si].text || '');
      }
    } else if (typeof word.text === 'string') {
      t = word.text;
    }

    t = t.trim();
    if (t) partes.push(t);
  }

  return partes.join(' ').trim();
}

/**
 * Extrae xMin, xMax, yMin, yMax del boundingPoly de Vision.
 * Soporta vertices y normalizedVertices.
 * Evita Math.min/max con spread para arrays potencialmente grandes.
 */
function _B1_recomp_bounds(poly) {
  if (!poly) return null;

  var verts = Array.isArray(poly.vertices)
    ? poly.vertices
    : (Array.isArray(poly.normalizedVertices) ? poly.normalizedVertices : null);

  if (!verts || verts.length < 2) return null;

  var xMin, xMax, yMin, yMax;
  var hasX = false, hasY = false;

  for (var i = 0; i < verts.length; i++) {
    var v = verts[i];
    if (typeof v.x === 'number') {
      if (!hasX) { xMin = v.x; xMax = v.x; hasX = true; }
      else { if (v.x < xMin) xMin = v.x; if (v.x > xMax) xMax = v.x; }
    }
    if (typeof v.y === 'number') {
      if (!hasY) { yMin = v.y; yMax = v.y; hasY = true; }
      else { if (v.y < yMin) yMin = v.y; if (v.y > yMax) yMax = v.y; }
    }
  }

  if (!hasX || !hasY) return null;
  return { xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax };
}

/* ── Agrupacion en filas ─────────────────────────────────────────── */

/**
 * Agrupa los parrafos en filas visuales usando criterios geometricos.
 * Algoritmo:
 *   1. Ordenar parrafos por yMin (una sola vez, O(n log n)).
 *   2. Para cada parrafo, buscarlo en filas existentes (O(n * f)).
 *      En la practica f (filas) es muy pequeño (10-40 filas por etiqueta).
 *   3. Ordenar parrafos dentro de cada fila por xMin.
 *   4. Construir texto de fila y metadata.
 *
 * @returns {Array<{texto, yMin, yMax, xMin, xMax, nParrafos}>}
 */
function _B1_recomp_agruparEnFilas(parrafos) {
  // Sort unico: de arriba a abajo, desempate por xMin
  var sorted = parrafos.slice().sort(function(a, b) {
    return (a.yMin !== b.yMin) ? (a.yMin - b.yMin) : (a.xMin - b.xMin);
  });

  // filas: { yMin, yMax, centerY, items: [] }
  var filas = [];

  for (var i = 0; i < sorted.length; i++) {
    var p = sorted[i];
    var asignado = false;

    for (var f = 0; f < filas.length; f++) {
      if (_B1_recomp_mismaFila(p, filas[f])) {
        var fila = filas[f];
        fila.items.push(p);
        // Actualizar bounding de la fila con el nuevo parrafo
        if (p.yMin < fila.yMin) fila.yMin = p.yMin;
        if (p.yMax > fila.yMax) fila.yMax = p.yMax;
        fila.centerY = (fila.yMin + fila.yMax) / 2;
        asignado = true;
        break;
      }
    }

    if (!asignado) {
      filas.push({
        yMin:    p.yMin,
        yMax:    p.yMax,
        centerY: p.centerY,
        items:   [p]
      });
    }
  }

  // Ordenar filas de arriba a abajo
  filas.sort(function(a, b) { return a.yMin - b.yMin; });

  // Construir resultado: ordenar items por xMin y generar texto de fila
  var resultado = [];
  for (var fi = 0; fi < filas.length; fi++) {
    var fila = filas[fi];
    fila.items.sort(function(a, b) { return a.xMin - b.xMin; });

    // Concatenar de izquierda a derecha con espacio simple
    var textoFila = '';
    for (var ii = 0; ii < fila.items.length; ii++) {
      if (ii > 0) textoFila += ' ';
      textoFila += fila.items[ii].texto;
    }
    // Normalizar espacios dobles
    textoFila = textoFila.replace(/  +/g, ' ').trim();
    if (!textoFila) continue;

    resultado.push({
      texto:     textoFila,
      yMin:      fila.yMin,
      yMax:      fila.yMax,
      xMin:      fila.items[0].xMin,
      xMax:      fila.items[fila.items.length - 1].xMax,
      nParrafos: fila.items.length
    });
  }

  return resultado;
}

/**
 * Decide si un parrafo pertenece a una fila existente.
 * Dos criterios alternativos (cualquiera basta):
 *   1. Distancia entre centros Y <= 45% de la altura menor.
 *   2. Solape vertical >= 35% de la altura menor.
 */
function _B1_recomp_mismaFila(parrafo, fila) {
  var alturaP   = parrafo.height;
  var alturaF   = fila.yMax - fila.yMin;
  var alturaMenor = (alturaP < alturaF) ? alturaP : alturaF;
  if (alturaMenor <= 0) return false;

  // Criterio 1: proximidad de centros Y
  var distCenters = parrafo.centerY - fila.centerY;
  if (distCenters < 0) distCenters = -distCenters;
  if (distCenters <= B1_RECOMP_CENTER_RATIO * alturaMenor) return true;

  // Criterio 2: solape vertical
  var solapeTop = (parrafo.yMin > fila.yMin) ? parrafo.yMin : fila.yMin;
  var solapeBot = (parrafo.yMax < fila.yMax) ? parrafo.yMax : fila.yMax;
  var solape    = solapeBot - solapeTop;
  if (solape >= B1_RECOMP_OVERLAP_RATIO * alturaMenor) return true;

  return false;
}

/* ── Utilidades ──────────────────────────────────────────────────── */

function _B1_recomp_unirFilas(filas) {
  var lineas = [];
  for (var i = 0; i < filas.length; i++) {
    if (filas[i].texto) lineas.push(filas[i].texto);
  }
  return lineas.join('\n');
}

/**
 * Cuenta chars alfanumericos (incluye acentos y ñ).
 * Evita regex /g con match() para no crear array de matches en textos largos.
 */
function _B1_recomp_contarAlfa(texto) {
  if (!texto) return 0;
  var n = 0;
  for (var i = 0; i < texto.length; i++) {
    var c = texto.charCodeAt(i);
    // 0-9 | A-Z | a-z | chars > 127 (acentos, ñ, ü, etc.)
    if ((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c > 127) {
      n++;
    }
  }
  return n;
}

/**
 * Extrae el texto plano de ocrNormalizado (resultado de B1_normalizarOCR).
 * Replica la logica de B1_construirTextoBase para usar como fallback.
 */
function _B1_recomp_textoDesdeNorm(ocrNormalizado) {
  if (!ocrNormalizado || ocrNormalizado.visionVacia) return '';
  if (typeof ocrNormalizado.textoCompleto === 'string' && ocrNormalizado.textoCompleto.trim()) {
    return ocrNormalizado.textoCompleto.trim();
  }
  var lineas = [];
  var paginas = ocrNormalizado.paginas || [];
  for (var pi = 0; pi < paginas.length; pi++) {
    var bloques = paginas[pi].bloques || [];
    for (var bi = 0; bi < bloques.length; bi++) {
      if (bloques[bi].texto) lineas.push(bloques[bi].texto);
    }
  }
  return lineas.join('\n');
}

/**
 * Construye el objeto de retorno cuando se activa el fallback.
 */
function _B1_recomp_fallback(textoFallback, filasRecompuestas, motivo) {
  return {
    textoRecompuesto:  textoFallback || '',
    filasRecompuestas: filasRecompuestas || [],
    usadoFallback:     true,
    motivoFallback:    motivo || 'desconocido'
  };
}
