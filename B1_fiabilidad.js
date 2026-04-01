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


// ─── CAPA DE AUTONOMÍA DE FIABILIDAD ────────────────────────
// B1_fiabilidad no debe romperse si B1_slots.js aún no cargó.
// Usa helpers globales si existen y, si no, usa copias locales mínimas.
const _B1_FIAB_HELPERS = (() => {
  const familiasFallback = [
    { id:'gluten', stems:['gluten','trigo','wheat','blé','ble','cebada','barley','centeno','rye','avena','oats','espelta','kamut'] },
    { id:'leche', stems:['leche','milk','lait','lactosa','lactose','lact','lacteo','lacteos','lácteos','caseina','caseine','casein','suero','whey','mantequilla','butter','queso','cheese','fromage','yogur','yogurt','nata','cream'] },
    { id:'huevo', stems:['huevo','egg','oeuf','ovo','albumina','ovalbumina','ovalbumin'] },
    { id:'soja', stems:['soja','soya','soy'] },
    { id:'pescado', stems:['pescado','fish','poisson'] },
    { id:'crustaceos', stems:['crustaceos','crustaceo','crustaces','crustace','camaron','camarones','gamba','gambas','langostino','langostinos','crevette','crevettes','shrimp','prawn'] },
    { id:'moluscos', stems:['moluscos','molusco','molluscs','mollusc','moule','mejillon','mejillones','calamar','pulpo','sepia'] },
    { id:'cacahuete', stems:['cacahuete','cacahuetes','peanut','peanuts','arachid','arachide'] },
    { id:'frutos_secos', stems:['frutos secos','fruto seco','almendra','almendras','avellana','avellanas','nuez','nueces','pistacho','pistachos','anacardo','anacardos','cashew','hazelnut','walnut','nut','nuts'] },
    { id:'apio', stems:['apio','celery','celeri','céleri'] },
    { id:'mostaza', stems:['mostaza','mustard','moutarde'] },
    { id:'sesamo', stems:['sesamo','sésamo','sesame'] },
    { id:'sulfitos', stems:['sulfitos','sulfito','sulfites','sulphites','sulphite','metabisulfito','metabisulfit','disulfite','sodium metabisulfite'] },
    { id:'altramuz', stems:['altramuz','altramuces','lupin','lupino','lupins'] }
  ];

  const CONTEXTO_INGREDIENTES = ['ingred', 'ingredient'];
  const CONTEXTO_ALERGENOS = ['alerg', 'allerg', 'allergen', 'trazas', 'contener', 'contiene', 'manipula', 'manipulado', 'mayuscul', 'mayúscul'];
  const CONTEXTO_NUTRICIONAL = ['informacion nutric', 'información nutric', 'nutrition', 'valor energet', 'kcal', 'grasas', 'hidratos', 'proteinas', 'proteínas', 'protein', 'sal', 'por 100', 'pour 100'];
  const CONTEXTO_PESO = ['p.net', 'pnet', 'peso net', 'poids net', 'net weight', 'contenido neto', 'peso'];
  const CONTEXTO_IRRELEVANTE = ['lote', 'lot', 'rgseaa', 'rsseaa', 'elaborado por', 'fabricado por', 'conservar', 'consumir preferentemente', 'antes del fin', 'c/', 's.l', 's.a'];

  const normalizar = (typeof _B1_normalizarComparacion === 'function')
    ? _B1_normalizarComparacion
    : function(texto) {
        let t = String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const mapaOCR = {'0':'o','1':'i','3':'e','4':'a','5':'s','6':'g','7':'t','8':'b','9':'g','$':'s','@':'a','|':'l'};
        return [...t].map(ch => mapaOCR[ch] || ch).join('');
      };

  const compactar = (typeof _B1_compactarComparacion === 'function')
    ? _B1_compactarComparacion
    : function(texto) { return normalizar(texto).replace(/[^a-z0-9]/g, ''); };

  const esBasura = (typeof _B1_esBasuraPura === 'function')
    ? _B1_esBasuraPura
    : function(textoOriginal) {
        const texto = String(textoOriginal || '').trim();
        if (!texto) return true;
        const sinEspacios = texto.replace(/\s+/g, '');
        if (!sinEspacios) return true;
        if (!/[\p{L}\p{N}]/u.test(sinEspacios)) return true;
        if (/^[*\-_=~.,:;!?¡¿'"`´^|\\\/()[\]{}<>+]+$/u.test(sinEspacios)) return true;
        const sinBordes = texto.replace(/^[^\p{L}\p{N}]+/gu, '').replace(/[^\p{L}\p{N}]+$/gu, '');
        if (!sinBordes) return true;
        const nucleo = sinBordes.replace(/[^\p{L}\p{N}]/gu, '');
        return !nucleo;
      };

  const distancia = (typeof _B1_distanciaSimple === 'function')
    ? _B1_distanciaSimple
    : function(a, b) {
        const s = String(a || '');
        const t = String(b || '');
        if (s === t) return 0;
        if (!s.length) return t.length;
        if (!t.length) return s.length;
        const filas = s.length + 1;
        const cols = t.length + 1;
        const dp = Array.from({ length: filas }, () => Array(cols).fill(0));
        for (let i = 0; i < filas; i++) dp[i][0] = i;
        for (let j = 0; j < cols; j++) dp[0][j] = j;
        for (let i = 1; i < filas; i++) {
          for (let j = 1; j < cols; j++) {
            const coste = s[i - 1] === t[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + coste);
          }
        }
        return dp[s.length][t.length];
      };

  const incluirAlguna = (textoNormalizado, lista) => lista.some(k => textoNormalizado.includes(normalizar(k)));
  const obtenerTextoVecino = (p, offset) => {
    if (!p || !p.bloque || !Array.isArray(p.bloque.palabras)) return '';
    const idx = Number(p.wordIndex);
    if (!Number.isFinite(idx)) return '';
    const pos = idx + offset;
    if (pos < 0 || pos >= p.bloque.palabras.length) return '';
    const vecino = p.bloque.palabras[pos];
    return vecino && typeof vecino.texto === 'string' ? vecino.texto : '';
  };
  const obtenerTextoBloque = p => (p && p.bloque && typeof p.bloque.texto === 'string') ? p.bloque.texto : '';

  const deducirContexto = (typeof _B1_deducirContextoSemantico === 'function')
    ? _B1_deducirContextoSemantico
    : function(p) {
        const bloqueTexto = obtenerTextoBloque(p);
        const bloqueNorm = normalizar(bloqueTexto);
        const prev = normalizar(obtenerTextoVecino(p, -1));
        const next = normalizar(obtenerTextoVecino(p, 1));
        const alrededor = `${prev} ${bloqueNorm} ${next}`.trim();
        const ingredientesRaw = incluirAlguna(alrededor, CONTEXTO_INGREDIENTES);
        const alergenosRaw = incluirAlguna(alrededor, CONTEXTO_ALERGENOS);
        const nutricionalRaw = incluirAlguna(alrededor, CONTEXTO_NUTRICIONAL);
        const pesoRaw = incluirAlguna(alrededor, CONTEXTO_PESO);
        const irrelevanteRaw = incluirAlguna(alrededor, CONTEXTO_IRRELEVANTE);
        let zona = 'neutral';
        if (ingredientesRaw || alergenosRaw) zona = 'ingredientes_alergenos';
        else if (pesoRaw) zona = 'peso_formato';
        else if (nutricionalRaw) zona = 'nutricional';
        else if (irrelevanteRaw) zona = 'irrelevante';
        return {
          ingredientesRaw, alergenosRaw, nutricionalRaw, pesoRaw, irrelevanteRaw,
          zona,
          ingredientes: zona === 'ingredientes_alergenos',
          alergenos: zona === 'ingredientes_alergenos',
          nutricional: zona === 'nutricional',
          peso: zona === 'peso_formato',
          irrelevante: zona === 'irrelevante',
          bloqueNorm,
          blockWordCount: Array.isArray(p && p.bloque && p.bloque.palabras) ? p.bloque.palabras.length : 0
        };
      };

  return {
    familias: (typeof B1_FAMILIAS_PRIORITARIAS !== 'undefined') ? B1_FAMILIAS_PRIORITARIAS : familiasFallback,
    deducirContexto,
    esBasura,
    compactar,
    distancia
  };
})();



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
  // Palabras con confianza alta pero que podrían ser un alérgeno
  // roto. No afectan a viabilidad. Solo van al selector.
  const candidatosRiesgo = _B1_construirCandidatosRiesgo(todasPalabras, palabrasDudosas);

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
    const contexto = _B1_FIAB_HELPERS.deducirContexto(p);
    if (contexto.zona !== 'ingredientes_alergenos') return;

    // 2. No basura pura
    if (_B1_FIAB_HELPERS.esBasura(p.texto)) return;

    // 3. Exclusiones duras
    if (_B1_esExcluidoRiesgo(p.texto)) return;

    // 4. Dos normalizaciones distintas:
    //    - tokenRaw: sin corrección OCR — para exclusión exacta y detección de símbolos
    //    - tokenOCR: con corrección OCR — para distancia, truncado e inserción
    const tokenRaw = _B1_compactarSinCorreccionOCR(p.texto);
    const tokenOCR = _B1_FIAB_HELPERS.compactar(p.texto); // ya aplica corrección OCR

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
 * Compacta el texto SIN aplicar corrección de símbolos OCR.
 * Quita acentos y pasa a minúsculas, pero NO sustituye 0->o, 1->i, etc.
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
  const norm = _B1_FIAB_HELPERS.compactar(t);
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
  for (var f = 0; f < _B1_FIAB_HELPERS.familias.length; f++) {
    var familia = _B1_FIAB_HELPERS.familias[f];
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

  for (var f = 0; f < _B1_FIAB_HELPERS.familias.length; f++) {
    var familia = _B1_FIAB_HELPERS.familias[f];
    for (var s = 0; s < familia.stems.length; s++) {
      var stem = familia.stems[s];
      // stemOCR: stem normalizado CON corrección para comparar contra tokenOCR
      var stemOCR = _B1_FIAB_HELPERS.compactar(stem);
      if (!stemOCR || stemOCR.length < 3) continue;

      // Vía C: símbolo OCR raro — el token tenía símbolos y tras corrección encaja
      if (tieneSimbolosOCR) {
        if (tokenOCR === stemOCR) return 'C';
        var distC = _B1_FIAB_HELPERS.distancia(tokenOCR, stemOCR);
        var maxDistC = stemOCR.length <= 4 ? 1 : 2;
        if (distC <= maxDistC) return 'C';
      }

      // Vía A: distancia OCR corta con token ya corregido
      var maxDistA = stemOCR.length <= 4 ? 1 : 2;
      var distA = _B1_FIAB_HELPERS.distancia(tokenOCR, stemOCR);
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
