/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 · MEDIDOR DE FIABILIDAD
 * ═══════════════════════════════════════════════════════════════
 * Alcance nuevo:
 * - palabras dudosas por confianza
 * - candidatos de riesgo SOLO para:
 *   A) alérgenos / familias
 *   B) formato / peso / litros / pack
 *
 * Fuera de alcance:
 * - nombre de producto
 * ═══════════════════════════════════════════════════════════════
 * Dependencias cargadas desde B1_slots.js:
 * - _B1_deducirContextoSemantico
 * - _B1_esBasuraPura
 * - _B1_compactarComparacion
 * - _B1_distanciaSimple
 * - B1_FAMILIAS_PRIORITARIAS
 * - _B1_evaluarCandidatoFamiliaOCR
 * - _B1_evaluarCandidatoFormatoOCR
 */

const _B1_STOPWORDS_RIESGO = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'e', 'u',
  'con', 'sin', 'por', 'para', 'que', 'se', 'en', 'a', 'al',
  'and', 'or', 'of', 'the', 'et', 'ou', 'le', 'les', 'des',
  'von', 'und', 'per', 'com'
]);

function B1_medirFiabilidad(ocrNormalizado, sensitivityMode) {
  const config = B1_PRESUPUESTOS[sensitivityMode];

  if (ocrNormalizado.visionVacia) {
    return {
      pageConfidence: 0,
      criticalZoneScore: 0,
      palabrasDudosas: [],
      candidatosRiesgo: [],
      rachasMalas: 0,
      huecos: 0,
      totalPalabras: 0,
      fotoViable: false,
      razonInviable: 'Vision no devolvió texto.'
    };
  }

  const pageConfidence = _calcularConfianzaPagina(ocrNormalizado);
  const todasPalabras = _extraerTodasPalabras(ocrNormalizado);
  const palabrasDudosas = todasPalabras.filter(
    p => p.confidence !== null && p.confidence < config.minConfidenceWord
  );

  const candidatosRiesgo = _B1_unificarCandidatosRiesgo(
    _B1_construirCandidatosRiesgoFamilia(todasPalabras, palabrasDudosas),
    _B1_construirCandidatosRiesgoFormato(todasPalabras, palabrasDudosas)
  );

  const rachasMalas = _contarRachasMalas(todasPalabras, config.minConfidenceWord);
  const huecos = todasPalabras.filter(
    p => p.confidence === null || p.texto.trim() === '' || p.huecoHeuristico === true
  ).length;
  const criticalZoneScore = _calcularZonaCritica(ocrNormalizado, config.minConfidenceWord);

  const { fotoViable, razonInviable } = _decidirViabilidad(
    pageConfidence,
    criticalZoneScore,
    palabrasDudosas.length,
    todasPalabras.length,
    rachasMalas,
    config
  );

  return {
    pageConfidence: Math.round(pageConfidence * 100) / 100,
    criticalZoneScore: Math.round(criticalZoneScore * 100) / 100,
    palabrasDudosas,
    candidatosRiesgo,
    rachasMalas,
    huecos,
    totalPalabras: todasPalabras.length,
    fotoViable,
    razonInviable
  };
}

function _B1_construirCandidatosRiesgoFamilia(todasPalabras, palabrasDudosas) {
  const clavesDudosas = new Set(
    palabrasDudosas.map(p => p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex)
  );
  const candidatos = [];

  todasPalabras.forEach(p => {
    const clave = p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex;
    if (clavesDudosas.has(clave)) return;
    if (_B1_esBasuraPura(p.texto)) return;

    const token = _B1_compactarComparacion(p.texto);
    if (!token || token.length < 3) return;
    if (_B1_STOPWORDS_RIESGO.has(token)) return;

    const evaluacion = _B1_evaluarCandidatoFamiliaOCR(p);
    if (!evaluacion || !evaluacion.aplica) return;

    candidatos.push({
      texto: p.texto,
      confidence: p.confidence,
      boundingPoly: p.boundingPoly,
      pageIndex: p.pageIndex,
      blockIndex: p.blockIndex,
      wordIndex: p.wordIndex,
      bloque: p.bloque,
      origenDeteccion: 'candidato_riesgo',
      viaCompatibilidad: evaluacion.motivo || 'familia_riesgo'
    });
  });

  return candidatos;
}

function _B1_construirCandidatosRiesgoFormato(todasPalabras, palabrasDudosas) {
  const clavesDudosas = new Set(
    palabrasDudosas.map(p => p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex)
  );
  const candidatos = [];

  todasPalabras.forEach(p => {
    const clave = p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex;
    if (clavesDudosas.has(clave)) return;
    if (_B1_esBasuraPura(p.texto)) return;

    const evaluacion = _B1_evaluarCandidatoFormatoOCR(p);
    if (!evaluacion || !evaluacion.aplica) return;

    candidatos.push({
      texto: p.texto,
      confidence: p.confidence,
      boundingPoly: p.boundingPoly,
      pageIndex: p.pageIndex,
      blockIndex: p.blockIndex,
      wordIndex: p.wordIndex,
      bloque: p.bloque,
      origenDeteccion: 'candidato_riesgo',
      viaCompatibilidad: evaluacion.motivo || 'formato_riesgo'
    });
  });

  return candidatos;
}

function _B1_unificarCandidatosRiesgo(listaA, listaB) {
  const seen = new Set();
  const salida = [];

  function pushUnique(item) {
    const clave = item.pageIndex + ':' + item.blockIndex + ':' + item.wordIndex;
    if (seen.has(clave)) return;
    seen.add(clave);
    salida.push(item);
  }

  (listaA || []).forEach(pushUnique);
  (listaB || []).forEach(pushUnique);
  return salida;
}

function _calcularConfianzaPagina(ocrNormalizado) {
  let sumConf = 0;
  let sumPalabras = 0;

  ocrNormalizado.paginas.forEach(pagina => {
    pagina.bloques.forEach(bloque => {
      bloque.palabras.forEach(palabra => {
        if (palabra.confidence !== null) {
          sumConf += palabra.confidence;
          sumPalabras++;
        }
      });
    });
  });

  return sumPalabras > 0 ? sumConf / sumPalabras : 0;
}

function _extraerTodasPalabras(ocrNormalizado) {
  const todas = [];

  ocrNormalizado.paginas.forEach((pagina, pIdx) => {
    pagina.bloques.forEach((bloque, bIdx) => {
      bloque.palabras.forEach((palabra, wIdx) => {
        todas.push({
          texto: palabra.texto,
          confidence: palabra.confidence,
          boundingPoly: palabra.boundingPoly,
          huecoHeuristico: palabra.huecoHeuristico === true,
          pageIndex: pIdx,
          blockIndex: bIdx,
          wordIndex: wIdx,
          bloque: bloque
        });
      });
    });
  });

  return todas;
}

function _contarRachasMalas(todasPalabras, umbral) {
  let rachas = 0;
  let consecutivas = 0;

  todasPalabras.forEach(p => {
    if (p.confidence !== null && p.confidence < umbral) consecutivas++;
    else {
      if (consecutivas >= 3) rachas++;
      consecutivas = 0;
    }
  });

  if (consecutivas >= 3) rachas++;
  return rachas;
}

function _calcularZonaCritica(ocrNormalizado) {
  const KEYWORDS_CRITICAS = [
    'ingredientes', 'ingredients', 'alergen', 'allergen', 'trazas', 'contains',
    'leche', 'leite', 'milk', 'lait', 'gluten', 'trigo', 'wheat', 'cebada', 'barley',
    'huevo', 'egg', 'oeuf', 'ovo', 'soja', 'soy', 'mostaza', 'mustard', 'mostarda',
    'apio', 'celery', 'pescado', 'fish', 'crustaceos', 'crustáceos', 'moluscos',
    'sesamo', 'sésamo', 'sesame', 'sulfitos', 'sulfito', 'metabisulfito'
  ];

  const bloquesCriticos = [];

  ocrNormalizado.paginas.forEach(pagina => {
    pagina.bloques.forEach(bloque => {
      const textoLower = String(bloque.texto || '').toLowerCase();
      const esCritico = KEYWORDS_CRITICAS.some(kw => textoLower.includes(kw));
      if (esCritico) bloquesCriticos.push(bloque);
    });
  });

  if (bloquesCriticos.length === 0) return _calcularConfianzaPagina(ocrNormalizado);

  let sumConf = 0;
  let count = 0;
  bloquesCriticos.forEach(bloque => {
    bloque.palabras.forEach(palabra => {
      if (palabra.confidence !== null) {
        sumConf += palabra.confidence;
        count++;
      }
    });
  });

  return count > 0 ? sumConf / count : 0;
}

function _decidirViabilidad(pageConf, criticalScore, numDudosas, totalPalabras, rachas, config) {
  if (totalPalabras === 0) {
    return { fotoViable: false, razonInviable: 'Sin texto detectado.' };
  }

  const ratioDudas = numDudosas / totalPalabras;

  if (criticalScore < 0.30 && rachas >= 3) {
    return {
      fotoViable: false,
      razonInviable: 'Zona crítica ilegible con múltiples rachas dañadas.'
    };
  }

  if (ratioDudas > 0.70) {
    return {
      fotoViable: false,
      razonInviable: `Demasiadas palabras dudosas (${Math.round(ratioDudas * 100)}%).`
    };
  }

  if (pageConf < 0.25 && criticalScore < 0.35) {
    return {
      fotoViable: false,
      razonInviable: 'Confianza general y de zona crítica demasiado bajas.'
    };
  }

  return { fotoViable: true, razonInviable: null };
}
