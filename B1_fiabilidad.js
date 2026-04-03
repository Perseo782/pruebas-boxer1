/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 4 · MEDIDOR DE FIABILIDAD
 * ═══════════════════════════════════════════════════════════════
 * Sección 5.4 y 6 de la orden de trabajo v4
 *
 * Calcula:
 * - Señal global orientativa de la página
 * - Señal específica de la zona crítica
 * - Palabras dudosas (por confianza baja)
 * - Candidatos de riesgo (por riesgo semántico OCR en zona crítica)
 * - Rachas malas
 * - Posibles huecos
 *
 * La nota global NO decide sola. La zona crítica pesa más.
 *
 * CAMBIO ESTRUCTURAL:
 * Se añade `candidatosRiesgo` como segunda salida independiente.
 * Recoge palabras que Vision aceptó con confianza alta pero que
 * podrían ser un alérgeno roto. Cubre las 14 familias y todas
 * sus variantes del catálogo, en todos los idiomas presentes.
 *
 * `candidatosRiesgo` NO afecta a viabilidad, rachas ni ratio de
 * dudas. Solo va al selector. El selector decide si va al agente.
 * ═══════════════════════════════════════════════════════════════
 *
 * DEPENDENCIA OBLIGATORIA:
 * Este archivo usa funciones que viven en B1_slots.js:
 *   - _B1_deducirContextoSemantico
 *   - _B1_esBasuraPura
 *   - _B1_compactarComparacion
 *   - _B1_distanciaSimple
 *   - B1_FAMILIAS_PRIORITARIAS
 *
 * B1_slots.js debe cargarse ANTES que B1_fiabilidad.js.
 * Si el orden de carga cambia, _B1_construirCandidatosRiesgo fallará.
 * ═══════════════════════════════════════════════════════════════
 */


// ─── CONSTANTES DE EXCLUSIÓN ────────────────────────────────
const _B1_STOPWORDS_RIESGO = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'e', 'u',
  'con', 'sin', 'por', 'para', 'que', 'se', 'en', 'a', 'al',
  'and', 'or', 'of', 'the', 'et', 'ou', 'le', 'les', 'des',
  'von', 'und', 'per', 'com', 'com'
]);

const _B1_SIMBOLOS_OCR = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a',
  '5': 's', '6': 'g', '7': 't', '8': 'b',
  '$': 's', '@': 'a', '|': 'l'
};

const _B1_KEYWORDS_BLOQUE_EXCLUIDO_CABECERA = [
  'ingredientes', 'ingredients', 'alergen', 'allergen',
  'informacion', 'informação', 'informacao', 'nutric', 'nutrition',
  'valor', 'energia', 'energetico', 'energetico', 'grasas', 'lipidos',
  'hidratos', 'azucares', 'proteinas', 'protein', 'sal',
  'preparacion', 'preparação', 'preparacao', 'preparation',
  'horno', 'microondas', 'freir', 'freír', 'calentar', 'conservar',
  'mantener', 'consumir', 'preferentemente', 'antes', 'lote',
  'peso', 'neto', 'liquido', 'líquido', 'www', 'http', '@',
  'fabricado', 'elaborado', 'producido', 'distribuido', 'envasado',
  'caducidad', 'consumo', 'empleo'
];

const _B1_STOPWORDS_CABECERA = new Set([
  ..._B1_STOPWORDS_RIESGO,
  'desde', 'since', 'maker', 'de', 'da', 'do'
]);


// ─── MEDIR FIABILIDAD COMPLETA ──────────────────────────────
/**
 * @param {Object} ocrNormalizado - Salida de B1_normalizarOCR
 * @param {string} sensitivityMode - baja/media/alta
 * @returns {Object} Informe completo de fiabilidad
 */
function B1_medirFiabilidad(ocrNormalizado, sensitivityMode) {
  const config = B1_PRESUPUESTOS[sensitivityMode];

  if (ocrNormalizado.visionVacia) {
    return {
      pageConfidence:    0,
      criticalZoneScore: 0,
      palabrasDudosas:   [],
      candidatosRiesgo:  [],
      rachasMalas:       0,
      huecos:            0,
      totalPalabras:     0,
      fotoViable:        false,
      razonInviable:     'Vision no devolvió texto.'
    };
  }

  // ── 1. CONFIANZA GLOBAL DE PÁGINA ─────────────────────────
  const pageConfidence = _calcularConfianzaPagina(ocrNormalizado);

  // ── 2. TODAS LAS PALABRAS CON SU CONFIANZA ───────────────
  const todasPalabras = _extraerTodasPalabras(ocrNormalizado);

  // ── 3. PALABRAS DUDOSAS (por debajo del umbral) ───────────
  const palabrasDudosas = todasPalabras.filter(
    p => p.confidence !== null && p.confidence < config.minConfidenceWord
  );

  // ── 4. CANDIDATOS DE RIESGO ───────────────────────────────
  // Se unen dos vías:
  // - riesgo semántico en zona crítica
  // - nombre de cabecera roto (zona alta, bloque corto, no narrativo)
  // No afectan a viabilidad. Solo van al selector.
  const candidatosRiesgo = _B1_unificarCandidatosRiesgo(
    _B1_construirCandidatosRiesgo(todasPalabras, palabrasDudosas),
    _B1_construirCandidatosNombreCabecera(todasPalabras, palabrasDudosas)
  );

  // ── 5. RACHAS MALAS (3+ palabras dudosas consecutivas) ────
  // Solo palabrasDudosas. candidatosRiesgo no participa.
  const rachasMalas = _contarRachasMalas(todasPalabras, config.minConfidenceWord);

  // ── 6. HUECOS (palabras sin confianza o vacías) ───────────
  const huecos = todasPalabras.filter(
    p => p.confidence === null || p.texto.trim() === '' || p.huecoHeuristico === true
  ).length;

  // ── 7. ZONA CRÍTICA ───────────────────────────────────────
  const criticalZoneScore = _calcularZonaCritica(ocrNormalizado, config.minConfidenceWord);

  // ── 8. VEREDICTO DE VIABILIDAD ────────────────────────────
  // Solo palabrasDudosas. candidatosRiesgo no participa.
  const { fotoViable, razonInviable } = _decidirViabilidad(
    pageConfidence,
    criticalZoneScore,
    palabrasDudosas.length,
    todasPalabras.length,
    rachasMalas,
    config
  );

  return {
    pageConfidence:    Math.round(pageConfidence * 100) / 100,
    criticalZoneScore: Math.round(criticalZoneScore * 100) / 100,
    palabrasDudosas:   palabrasDudosas,
    candidatosRiesgo:  candidatosRiesgo,
    rachasMalas:       rachasMalas,
    huecos:            huecos,
    totalPalabras:     todasPalabras.length,
    fotoViable:        fotoViable,
    razonInviable:     razonInviable
  };
}


// ─── CANDIDATOS DE RIESGO ────────────────────────────────────
/**
 * Construye la lista de candidatos de riesgo semántico OCR.
 *
 * Una palabra entra si:
 * 1. Zona ingredientes_alergenos
 * 2. No es basura pura
 * 3. No cae en exclusión dura
 * 4. No coincide exactamente con variante válida SIN corrección OCR
 * 5. Cumple al menos una vía de compatibilidad OCR con el catálogo
 *
 * No decide familia. No decide agente. Solo detecta riesgo.
 * La decisión final es de B1_slots.
 *
 * @param {Array} todasPalabras - Lista plana de todas las palabras
 * @param {Array} palabrasDudosas - Ya captadas por confianza baja
 * @returns {Array} Candidatos de riesgo con origenDeteccion marcado
 */
function _B1_construirCandidatosRiesgo(todasPalabras, palabrasDudosas) {
  // Índice de palabras ya capturadas por confianza baja
  const clavesDudosas = new Set(
    palabrasDudosas.map(p => p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex)
  );

  const candidatos = [];

  todasPalabras.forEach(p => {
    // 1. Zona crítica obligatoria
    const contexto = _B1_deducirContextoSemantico(p);
    if (contexto.zona !== 'ingredientes_alergenos') return;

    // 2. No basura pura
    if (_B1_esBasuraPura(p.texto)) return;

    // 3. Exclusiones duras
    if (_B1_esExcluidoRiesgo(p.texto)) return;

    // 4. Dos normalizaciones distintas:
    //    - tokenRaw: sin corrección OCR — para exclusión exacta y detección de símbolos
    //    - tokenOCR: con corrección OCR — para distancia, truncado e inserción
    const tokenRaw = _B1_compactarSinCorreccionOCR(p.texto);
    const tokenOCR = _B1_compactarComparacion(p.texto); // ya aplica corrección OCR

    if (!tokenRaw || tokenRaw.length < 3) return;

    // 5. No coincide exactamente con stem válido SIN corrección OCR
    //    Se usa tokenRaw para que s0ja no quede excluido como 'soja'
    if (_B1_coincideExactoSinCorreccion(tokenRaw)) return;

    // 6. Comprueba vías de compatibilidad OCR
    const viaDetectada = _B1_detectarViaCompatibilidad(tokenRaw, tokenOCR);
    if (!viaDetectada) return;

    // Marcar origen
    const clave = p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex;
    const origenDeteccion = clavesDudosas.has(clave) ? 'ambas' : 'candidato_riesgo';

    candidatos.push({
      texto:             p.texto,
      confidence:        p.confidence,
      boundingPoly:      p.boundingPoly,
      pageIndex:         p.pageIndex,
      blockIndex:        p.blockIndex,
      wordIndex:         p.wordIndex,
      bloque:            p.bloque,
      origenDeteccion,
      viaCompatibilidad: viaDetectada
    });
  });

return candidatos;
}

/**
 * Añade una segunda vía de entrada al selector para nombres de
 * cabecera rotos. No depende de la zona crítica y no compite
 * con palabras narrativas.
 *
 * Regla:
 * - solo primeros bloques de la primera página
 * - bloque corto y no narrativo
 * - primeras palabras del bloque
 * - sin números / web / email / trazabilidad / nutricional
 * - y además:
 *   a) confianza moderadamente baja, o
 *   b) compatibilidad OCR con familia conocida en cabecera
 */
function _B1_construirCandidatosNombreCabecera(todasPalabras, palabrasDudosas) {
  const clavesDudosas = new Set(
    palabrasDudosas.map(p => p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex)
  );

  const bloquesCabecera = _B1_obtenerBloquesCabeceraNombre(todasPalabras);
  const candidatos = [];

  bloquesCabecera.forEach(entry => {
    const palabrasBloque = entry.palabras;
    palabrasBloque.forEach(p => {
      if (p.wordIndex > 2) return;
      if (_B1_esExcluidoNombreCabecera(p.texto)) return;

      const tokenRaw = _B1_compactarSinCorreccionOCR(p.texto);
      const tokenOCR = _B1_compactarComparacion(p.texto);

      if (!tokenRaw || tokenRaw.length < 4) return;

      const viaFamilia = _B1_detectarViaCompatibilidad(tokenRaw, tokenOCR);
      const confianzaBajaCabecera = p.confidence !== null && p.confidence < 0.80;

      if (!confianzaBajaCabecera && !viaFamilia) return;

      const clave = p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex;
      const origenDeteccion = clavesDudosas.has(clave)
        ? 'ambas'
        : 'candidato_nombre_cabecera';

      candidatos.push({
        texto:             p.texto,
        confidence:        p.confidence,
        boundingPoly:      p.boundingPoly,
        pageIndex:         p.pageIndex,
        blockIndex:        p.blockIndex,
        wordIndex:         p.wordIndex,
        bloque:            p.bloque,
        origenDeteccion,
        viaCompatibilidad: viaFamilia || 'NOMBRE_CABECERA'
      });
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

function _B1_obtenerBloquesCabeceraNombre(todasPalabras) {
  const mapa = new Map();

  todasPalabras.forEach(p => {
    if (p.pageIndex !== 0) return;
    if (p.blockIndex > 4) return;

    const clave = p.pageIndex + ':' + p.blockIndex;
    if (!mapa.has(clave)) {
      mapa.set(clave, {
        pageIndex: p.pageIndex,
        blockIndex: p.blockIndex,
        bloque: p.bloque,
        palabras: []
      });
    }
    mapa.get(clave).palabras.push(p);
  });

  const bloques = Array.from(mapa.values())
    .filter(_B1_bloquePuedeSerNombreCabecera)
    .sort((a, b) => a.blockIndex - b.blockIndex);

  return bloques.slice(0, 2);
}

function _B1_bloquePuedeSerNombreCabecera(entry) {
  const palabras = entry.palabras || [];
  if (palabras.length === 0 || palabras.length > 6) return false;

  const textoNorm = _B1_normalizarTextoCabecera(entry.bloque && entry.bloque.texto);
  if (!textoNorm) return false;

  if (_B1_KEYWORDS_BLOQUE_EXCLUIDO_CABECERA.some(k => textoNorm.includes(_B1_normalizarTextoCabecera(k)))) {
    return false;
  }

  if (/[,@;]/.test(textoNorm)) return false;

  const totalConDigitos = palabras.filter(p => /\d/.test(String(p.texto || ''))).length;
  if (totalConDigitos > 0) return false;

  const totalLargas = palabras.filter(p => _B1_compactarSinCorreccionOCR(p.texto).length >= 4).length;
  if (totalLargas < 1) return false;

  if (palabras.length === 1) {
    const unica = palabras[0];
    const token = _B1_compactarSinCorreccionOCR(unica.texto);
    const conf = unica.confidence;
    if (entry.blockIndex > 2) return false;
    if (!token || token.length < 6) return false;
    if (conf === null || conf >= 0.75) return false;
    return true;
  }

  if (palabras.length < 2) return false;

  return true;
}

function _B1_esExcluidoNombreCabecera(texto) {
  const t = String(texto || '').trim();
  if (!t) return true;
  if (/\d/.test(t)) return true;
  if (/[@/]/.test(t)) return true;
  if (_B1_esBasuraPura(t)) return true;
  if (!/[a-záéíóúüñàèìòùçA-Z]/u.test(t)) return true;

  const tokenRaw = _B1_compactarSinCorreccionOCR(t);
  const tokenOCR = _B1_compactarComparacion(t);

  if (!tokenRaw || tokenRaw.length < 4) return true;
  if (_B1_STOPWORDS_CABECERA.has(tokenOCR)) return true;

  return false;
}

function _B1_normalizarTextoCabecera(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Compacta el texto SIN aplicar corrección de símbolos OCR. * Quita acentos y pasa a minúsculas, pero NO sustituye 0->o, 1->i, etc.
 * Usado para exclusión exacta y detección de símbolos OCR reales.
 */
function _B1_compactarSinCorreccionOCR(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9$@|]/g, '');
}

/**
 * Exclusiones duras antes de evaluar compatibilidad.
 * Descarta números, %, unidades, aditivos, stopwords y basura técnica.
 */
function _B1_esExcluidoRiesgo(texto) {
  const t = String(texto || '').trim();
  if (!t) return true;

  // Número o porcentaje
  if (/^\d+([.,]\d+)?%?$/.test(t)) return true;

  // Unidad de medida sola
  if (/^(kg|g|gr|ml|cl|dl|l|mg)$/i.test(t)) return true;

  // Código aditivo E-xxx
  if (/^e-?\d{3}/i.test(t)) return true;

  // Token sin ninguna letra
  if (!/[a-záéíóúüñàèìòùçA-Z]/u.test(t)) return true;

  // Stopword funcional
  const norm = _B1_compactarComparacion(t);
  if (_B1_STOPWORDS_RIESGO.has(norm)) return true;

  return false;
}

/**
 * Comprueba si el token coincide exactamente con algún stem del
 * catálogo SIN necesidad de corrección OCR.
 * Si solo coincide tras corrección OCR, NO se excluye — ese es
 * justo el caso que debe entrar como candidato de riesgo.
 */
function _B1_coincideExactoSinCorreccion(tokenRaw) {
  // tokenRaw: compactado SIN corrección OCR
  // stemRaw: stem compactado también SIN corrección OCR
  // Solo excluye si coinciden sin necesidad de corregir símbolos
  for (var f = 0; f < B1_FAMILIAS_PRIORITARIAS.length; f++) {
    var familia = B1_FAMILIAS_PRIORITARIAS[f];
    for (var s = 0; s < familia.stems.length; s++) {
      var stemRaw = _B1_compactarSinCorreccionOCR(familia.stems[s]);
      if (tokenRaw === stemRaw) return true;
    }
  }
  return false;
}

/**
 * Detecta qué vía de compatibilidad OCR cumple el token.
 * Devuelve el nombre de la vía o null si no cumple ninguna.
 *
 * Vía A: distancia OCR corta (dist <=1 para stems 3-4, <=2 para 5+)
 * Vía B: truncado plausible (stem empieza por token, mín 4 letras)
 * Vía C: símbolo OCR raro (contiene símbolo y tras sustitución encaja)
 * Vía D: inserción simple (token contiene stem o viceversa, diff <=1)
 */
function _B1_detectarViaCompatibilidad(tokenRaw, tokenOCR) {
  // tokenRaw: compactado SIN corrección OCR — para detectar símbolos reales
  // tokenOCR: compactado CON corrección OCR — para distancia, truncado, inserción
  // tieneSimbolosOCR: true solo si el token original tenía símbolos reales
  const tieneSimbolosOCR = tokenRaw !== tokenOCR;

  for (var f = 0; f < B1_FAMILIAS_PRIORITARIAS.length; f++) {
    var familia = B1_FAMILIAS_PRIORITARIAS[f];
    for (var s = 0; s < familia.stems.length; s++) {
      var stem = familia.stems[s];
      // stemOCR: stem normalizado CON corrección para comparar contra tokenOCR
      var stemOCR = _B1_compactarComparacion(stem);
      if (!stemOCR || stemOCR.length < 3) continue;

      // Vía C: símbolo OCR raro — el token tenía símbolos y tras corrección encaja
      if (tieneSimbolosOCR) {
        if (tokenOCR === stemOCR) return 'C';
        var distC = _B1_distanciaSimple(tokenOCR, stemOCR);
        var maxDistC = stemOCR.length <= 4 ? 1 : 2;
        if (distC <= maxDistC) return 'C';
      }

      // Vía A: distancia OCR corta con token ya corregido
      var maxDistA = stemOCR.length <= 4 ? 1 : 2;
      var distA = _B1_distanciaSimple(tokenOCR, stemOCR);
      if (distA > 0 && distA <= maxDistA) return 'A';

      // Vía B: truncado plausible — token es prefijo real del stem
      if (
        tokenOCR.length >= 4 &&
        stemOCR.startsWith(tokenOCR) &&
        (stemOCR.length - tokenOCR.length) <= 4
      ) return 'B';

      // Vía D: inserción simple — uno contiene al otro con diff <= 1
      if (Math.abs(tokenOCR.length - stemOCR.length) <= 1) {
        if (tokenOCR.includes(stemOCR) || stemOCR.includes(tokenOCR)) {
          return 'D';
        }
      }
    }
  }

  return null;
}

/**
 * Aplica sustituciones de símbolos OCR conocidos al token.
 * Usado solo para detección de riesgo, no para corrección de texto.
 */
function _B1_aplicarCorreccionSimbolosOCR(tokenCompacto) {
  return [...tokenCompacto].map(ch => _B1_SIMBOLOS_OCR[ch] || ch).join('');
}


// ─── FUNCIONES INTERNAS ─────────────────────────────────────

/**
 * Media ponderada de confianza de todas las páginas.
 * Termómetro general, NO decisor.
 */
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

/**
 * Extrae lista plana de todas las palabras con metadata,
 * preservando orden de lectura y referencia a su bloque.
 */
function _extraerTodasPalabras(ocrNormalizado) {
  const todas = [];

  ocrNormalizado.paginas.forEach((pagina, pIdx) => {
    pagina.bloques.forEach((bloque, bIdx) => {
      bloque.palabras.forEach((palabra, wIdx) => {
        todas.push({
          texto:           palabra.texto,
          confidence:      palabra.confidence,
          boundingPoly:    palabra.boundingPoly,
          huecoHeuristico: palabra.huecoHeuristico === true,
          pageIndex:       pIdx,
          blockIndex:      bIdx,
          wordIndex:       wIdx,
          bloque:          bloque
        });
      });
    });
  });

  return todas;
}

/**
 * Cuenta rachas de 3+ palabras dudosas consecutivas.
 * Indicador de zona muy dañada. Solo usa palabrasDudosas.
 */
function _contarRachasMalas(todasPalabras, umbral) {
  let rachas = 0;
  let consecutivas = 0;

  todasPalabras.forEach(p => {
    if (p.confidence !== null && p.confidence < umbral) {
      consecutivas++;
    } else {
      if (consecutivas >= 3) rachas++;
      consecutivas = 0;
    }
  });

  if (consecutivas >= 3) rachas++;
  return rachas;
}

/**
 * Zona crítica: busca bloques con palabras clave de etiquetado
 * alimentario y calcula la confianza media solo de esos bloques.
 *
 * Si no encuentra zona crítica, usa la confianza global.
 */
function _calcularZonaCritica(ocrNormalizado, umbral) {
  const KEYWORDS_CRITICAS = [
    'ingredientes', 'ingredients', 'alérgenos', 'allergens',
    'contiene', 'contains', 'trazas', 'traces',
    'puede contener', 'may contain', 'leche', 'milk',
    'gluten', 'huevo', 'egg', 'soja', 'soy', 'frutos secos',
    'nuts', 'cacahuete', 'peanut', 'marisco', 'shellfish',
    'pescado', 'fish', 'apio', 'celery', 'mostaza', 'mustard',
    'sésamo', 'sesame', 'sulfitos', 'sulphites', 'altramuz',
    'lupin', 'moluscos', 'molluscs', 'trigo', 'wheat',
    'cebada', 'barley', 'centeno', 'rye', 'avena', 'oats'
  ];

  const bloquesCriticos = [];

  ocrNormalizado.paginas.forEach(pagina => {
    pagina.bloques.forEach(bloque => {
      const textoLower = bloque.texto.toLowerCase();
      const esCritico = KEYWORDS_CRITICAS.some(kw => textoLower.includes(kw));
      if (esCritico) bloquesCriticos.push(bloque);
    });
  });

  if (bloquesCriticos.length === 0) {
    return _calcularConfianzaPagina(ocrNormalizado);
  }

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

/**
 * Decide si la foto es viable para seguir trabajando.
 * Solo usa palabrasDudosas. candidatosRiesgo no participa.
 */
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
