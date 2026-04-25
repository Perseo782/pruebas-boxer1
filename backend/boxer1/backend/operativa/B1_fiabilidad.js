/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 v2 · MEDIDOR DE FIABILIDAD
 * ═══════════════════════════════════════════════════════════════
 * Alineado con madre v5 y 12 reglas fijas del proyecto.
 *
 * REGLA 3: La fiabilidad NO decide cortes. Es termometro.
 * No rechaza fotos. No filtra palabras. No produce candidatos.
 * Solo mide la salud del OCR y devuelve numeros para metricas
 * y diagnostico.
 *
 * El motor de coste procesa TODAS las palabras sin importar
 * lo que diga la fiabilidad.
 *
 * Sin dependencia de B1_slots.js (muerto).
 * Sin sensitivityMode (muerto).
 * Sin B1_PRESUPUESTOS (muerto).
 * ═══════════════════════════════════════════════════════════════
 */


/* ── KEYWORDS DE ZONA CRITICA ────────────────────────────── */

var _B1_KEYWORDS_ZONA_CRITICA = [
  'ingredientes', 'ingredients', 'alergenos', 'allergens',
  'contiene', 'contains', 'trazas', 'traces',
  'puede contener', 'may contain', 'leche', 'milk',
  'gluten', 'huevo', 'egg', 'soja', 'soy',
  'frutos secos', 'nuts', 'cacahuete', 'peanut',
  'pescado', 'fish', 'apio', 'celery', 'mostaza', 'mustard',
  'sesamo', 'sesame', 'sulfitos', 'sulphites', 'altramuz',
  'lupin', 'moluscos', 'molluscs', 'trigo', 'wheat',
  'cebada', 'barley', 'centeno', 'rye', 'avena', 'oats',
  'crustaceos', 'crustaceans', 'marisco', 'shellfish'
];


/* ── UMBRAL FIJO PARA RACHAS ─────────────────────────────── */

var _B1_UMBRAL_RACHA = 0.55;


/* ── FUNCION PRINCIPAL ───────────────────────────────────── */

/**
 * Mide la salud del OCR. No decide nada. Solo devuelve numeros.
 *
 * @param {Object} ocrNormalizado - Salida de B1_normalizarOCR
 * @returns {Object} Informe de fiabilidad (solo metricas)
 */
function B1_medirFiabilidad(ocrNormalizado) {

  if (!ocrNormalizado || ocrNormalizado.visionVacia) {
    return {
      pageConfidence:    0,
      criticalZoneScore: 0,
      rachasMalas:       0,
      huecos:            0,
      totalPalabras:     0
    };
  }

  var todasPalabras = _B1_fiab_extraerTodasPalabras(ocrNormalizado);
  var pageConfidence = _B1_fiab_calcularConfianzaPagina(todasPalabras);
  var criticalZoneScore = _B1_fiab_calcularZonaCritica(ocrNormalizado);
  var rachasMalas = _B1_fiab_contarRachasMalas(todasPalabras);
  var huecos = _B1_fiab_contarHuecos(todasPalabras);

  return {
    pageConfidence:    Math.round(pageConfidence * 100) / 100,
    criticalZoneScore: Math.round(criticalZoneScore * 100) / 100,
    rachasMalas:       rachasMalas,
    huecos:            huecos,
    totalPalabras:     todasPalabras.length
  };
}


/* ── EXTRAER TODAS LAS PALABRAS ──────────────────────────── */

function _B1_fiab_extraerTodasPalabras(ocrNormalizado) {
  var todas = [];

  (ocrNormalizado.paginas || []).forEach(function(pagina) {
    (pagina.bloques || []).forEach(function(bloque) {
      (bloque.palabras || []).forEach(function(palabra) {
        todas.push({
          texto:           palabra.texto,
          confidence:      palabra.confidence,
          huecoHeuristico: palabra.huecoHeuristico === true
        });
      });
    });
  });

  return todas;
}


/* ── CONFIANZA GLOBAL DE PAGINA ──────────────────────────── */

function _B1_fiab_calcularConfianzaPagina(todasPalabras) {
  var sum = 0;
  var count = 0;

  for (var i = 0; i < todasPalabras.length; i++) {
    if (todasPalabras[i].confidence !== null) {
      sum += todasPalabras[i].confidence;
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}


/* ── ZONA CRITICA ────────────────────────────────────────── */

function _B1_fiab_calcularZonaCritica(ocrNormalizado) {
  var bloquesCriticos = [];

  (ocrNormalizado.paginas || []).forEach(function(pagina) {
    (pagina.bloques || []).forEach(function(bloque) {
      var textoLower = (bloque.texto || '').toLowerCase();
      for (var k = 0; k < _B1_KEYWORDS_ZONA_CRITICA.length; k++) {
        if (textoLower.indexOf(_B1_KEYWORDS_ZONA_CRITICA[k]) !== -1) {
          bloquesCriticos.push(bloque);
          break;
        }
      }
    });
  });

  if (bloquesCriticos.length === 0) {
    return _B1_fiab_calcularConfianzaPagina(
      _B1_fiab_extraerTodasPalabras(ocrNormalizado)
    );
  }

  var sum = 0;
  var count = 0;

  for (var b = 0; b < bloquesCriticos.length; b++) {
    var palabras = bloquesCriticos[b].palabras || [];
    for (var p = 0; p < palabras.length; p++) {
      if (palabras[p].confidence !== null) {
        sum += palabras[p].confidence;
        count++;
      }
    }
  }

  return count > 0 ? sum / count : 0;
}


/* ── RACHAS MALAS ────────────────────────────────────────── */

function _B1_fiab_contarRachasMalas(todasPalabras) {
  var rachas = 0;
  var consecutivas = 0;

  for (var i = 0; i < todasPalabras.length; i++) {
    var conf = todasPalabras[i].confidence;
    if (conf !== null && conf < _B1_UMBRAL_RACHA) {
      consecutivas++;
    } else {
      if (consecutivas >= 3) { rachas++; }
      consecutivas = 0;
    }
  }

  if (consecutivas >= 3) { rachas++; }
  return rachas;
}


/* ── HUECOS ──────────────────────────────────────────────── */

function _B1_fiab_contarHuecos(todasPalabras) {
  var count = 0;

  for (var i = 0; i < todasPalabras.length; i++) {
    var p = todasPalabras[i];
    if (p.confidence === null || !p.texto || !p.texto.trim() || p.huecoHeuristico) {
      count++;
    }
  }

  return count;
}