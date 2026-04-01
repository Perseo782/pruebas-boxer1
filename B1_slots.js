/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 5 · SLOTS, ROI Y CONTEXTO
 * ═══════════════════════════════════════════════════════════════
 * Nombre del sistema:
 * SELECTOR PRIORITARIO DE RESCATE OCR
 *
 * Qué hace:
 * 1) Elimina basura pura
 * 2) Detecta sospechas importantes rotas
 * 3) Manda a slot solo lo importante para la app
 * 4) Expone una auditoría completa en selectorOCR
 *
 * Importante:
 * - No corrige texto final
 * - No decide negocio
 * - Solo decide qué merece llegar al agente
 *
 * NUEVOS BLOQUES:
 * - FILTRO_DE_VALIDACION_FINAL_DE_NEGOCIO
 * - FILTRO_DE_SOSPECHA_CONTEXTUAL_ACUMULADA
 *
 * ARREGLO ACTUAL:
 * - CONTEXTO CANÓNICO ÚNICO
 * - evita mezclar "zona crítica" con "zona no crítica"
 * ═══════════════════════════════════════════════════════════════
 */

// ─── CONTADOR GLOBAL DE SLOTS (por ejecución) ───────────────
let _b1SlotCounter = 0;

function _resetSlotCounter() {
  _b1SlotCounter = 0;
}

function _nextSlotId() {
  _b1SlotCounter++;
  return `B${_b1SlotCounter}`;
}


// ─── FAMILIAS IMPORTANTES DEL NEGOCIO ───────────────────────
const B1_FAMILIAS_PRIORITARIAS = [
  {
    id: 'gluten',
    stems: [
      'gluten', 'trigo', 'wheat', 'blé', 'ble', 'cebada', 'barley',
      'centeno', 'rye', 'avena', 'oats', 'espelta', 'kamut'
    ]
  },
  {
    id: 'leche',
    stems: [
      'leche', 'milk', 'lait', 'lactosa', 'lactose', 'lact', 'lacteo',
      'caseina', 'caseine', 'casein', 'suero', 'whey', 'mantequilla',
      'butter', 'queso', 'cheese', 'fromage', 'yogur', 'yogurt',
      'nata', 'cream'
    ]
  },
  {
    id: 'huevo',
    stems: ['huevo', 'egg', 'oeuf', 'ovo', 'albumina', 'ovalbumina', 'ovalbumin']
  },
  {
    id: 'soja',
    stems: ['soja', 'soya', 'soy']
  },
  {
    id: 'pescado',
    stems: ['pescado', 'fish', 'poisson']
  },
  {
    id: 'crustaceos',
    stems: [
      'crustaceos', 'crustaceo', 'crustaces', 'crustace',
      'camaron', 'camarones', 'gamba', 'gambas', 'langostino',
      'langostinos', 'crevette', 'crevettes', 'shrimp', 'prawn'
    ]
  },
  {
    id: 'moluscos',
    stems: [
      'moluscos', 'molusco', 'molluscs', 'mollusc', 'moule',
      'mejillon', 'mejillones', 'calamar', 'pulpo', 'sepia'
    ]
  },
  {
    id: 'cacahuete',
    stems: ['cacahuete', 'cacahuetes', 'peanut', 'peanuts', 'arachid', 'arachide']
  },
  {
    id: 'frutos_secos',
    stems: [
      'frutos secos', 'fruto seco', 'almendra', 'almendras', 'avellana',
      'avellanas', 'nuez', 'nueces', 'pistacho', 'pistachos',
      'anacardo', 'anacardos', 'cashew', 'hazelnut', 'walnut', 'nut', 'nuts'
    ]
  },
  {
    id: 'apio',
    stems: ['apio', 'celery', 'celeri', 'céleri']
  },
  {
    id: 'mostaza',
    stems: ['mostaza', 'mustard', 'moutarde']
  },
  {
    id: 'sesamo',
    stems: ['sesamo', 'sésamo', 'sesame']
  },
  {
    id: 'sulfitos',
    stems: [
      'sulfitos', 'sulfito', 'sulfites', 'sulphites', 'sulphite',
      'metabisulfito', 'metabisulfit', 'disulfite', 'sodium metabisulfite'
    ]
  },
  {
    id: 'altramuz',
    stems: ['altramuz', 'altramuces', 'lupin', 'lupino', 'lupins']
  }
];

const B1_PALABRAS_PESO_FORMATO = [
  'peso', 'p.net', 'pnet', 'neto', 'poids', 'poids net', 'weight', 'net weight',
  'kg', 'g', 'gr', 'gram', 'grams', 'ml', 'cl', 'l', 'litro', 'litros',
  'litre', 'litres', 'pack', 'formato', 'x', 'unidades', 'unidad', 'bandeja', 'botella'
];

const B1_STOPWORDS_NOMBRE = new Set([
  'desde', 'para', 'con', 'sin', 'por',
  'ingredientes', 'informacion', 'información', 'information',
  'nutritionnelle', 'valor', 'energetico', 'energetique',
  'producto', 'produit', 'puede', 'contener',
  'trazas', 'de', 'del', 'la', 'el', 'los', 'las'
]);

const B1_CONTEXTO_INGREDIENTES = [
  'ingred', 'ingredient'
];

const B1_CONTEXTO_ALERGENOS = [
  'alerg', 'allerg', 'allergen', 'trazas', 'contener', 'contiene',
  'manipula', 'manipulado', 'manipula', 'mayuscul', 'mayúscul'
];

const B1_CONTEXTO_NUTRICIONAL = [
  'informacion nutric', 'información nutric', 'nutrition',
  'valor energet', 'kcal', 'grasas', 'hidratos', 'proteinas',
  'proteínas', 'protein', 'sal', 'por 100', 'pour 100'
];

const B1_CONTEXTO_PESO = [
  'p.net', 'pnet', 'peso net', 'poids net', 'net weight', 'contenido neto', 'peso'
];

const B1_CONTEXTO_IRRELEVANTE = [
  'lote', 'lot', 'rgseaa', 'rsseaa', 'elaborado por', 'fabricado por',
  'conservar', 'consumir preferentemente', 'antes del fin', 'c/', 's.l', 's.a'
];

const B1_CONTEXTO_PREPARACION = [
  'freidora', 'horno', 'precalentar', 'calentar', 'freir', 'freír',
  'descongelar', 'minuto', 'minutos', 'tanda', 'aceite', 'reposar',
  'dorado', 'preparacion', 'preparación'
];

const B1_CONECTORES_LISTA = new Set([
  'y', 'e', 'o', 'u', 'and', 'or', 'et'
]);

const B1_CONFUSIONES_OCR = {
  '0': ['o'],
  '1': ['i', 'l'],
  '2': ['z'],
  '3': ['e'],
  '4': ['a'],
  '5': ['s'],
  '6': ['g'],
  '7': ['t'],
  '8': ['b'],
  '9': ['g'],
  '@': ['a'],
  '$': ['s'],
  '|': ['l'],
  '¡': ['i'],
  '!': ['i']
};


// ─── NORMALIZACIÓN SUAVE OCR ────────────────────────────────
function _B1_normalizarComparacion(texto) {
  let t = String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const mapaOCR = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '6': 'g',
    '7': 't',
    '8': 'b',
    '9': 'g',
    '$': 's',
    '@': 'a',
    '|': 'l'
  };

  t = [...t].map(ch => mapaOCR[ch] || ch).join('');
  return t;
}

function _B1_compactarComparacion(texto) {
  return _B1_normalizarComparacion(texto).replace(/[^a-z0-9]/g, '');
}


// ─── BASURA PURA ────────────────────────────────────────────
function _B1_esBasuraPura(textoOriginal) {
  const texto = String(textoOriginal || '').trim();
  if (!texto) return true;

  const sinEspacios = texto.replace(/\s+/g, '');
  if (!sinEspacios) return true;

  if (!/[\p{L}\p{N}]/u.test(sinEspacios)) return true;
  if (/^[*\-_=~.,:;!?¡¿'"`´^|\\\/()[\]{}<>+]+$/u.test(sinEspacios)) return true;

  const sinBordes = texto
    .replace(/^[^\p{L}\p{N}]+/gu, '')
    .replace(/[^\p{L}\p{N}]+$/gu, '');

  if (!sinBordes) return true;

  const nucleo = sinBordes.replace(/[^\p{L}\p{N}]/gu, '');
  if (!nucleo) return true;

  return false;
}


// ─── DISTANCIA SIMPLE ───────────────────────────────────────
function _B1_distanciaSimple(a, b) {
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
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + coste
      );
    }
  }

  return dp[s.length][t.length];
}


// ─── CONTEXTO CERCANO ───────────────────────────────────────
function _B1_obtenerTextoVecino(p, offset) {
  if (!p || !p.bloque || !Array.isArray(p.bloque.palabras)) return '';
  const idx = Number(p.wordIndex);
  if (!Number.isFinite(idx)) return '';

  const pos = idx + offset;
  if (pos < 0 || pos >= p.bloque.palabras.length) return '';

  const vecino = p.bloque.palabras[pos];
  return vecino && typeof vecino.texto === 'string' ? vecino.texto : '';
}

function _B1_obtenerTextoBloque(p) {
  return (p && p.bloque && typeof p.bloque.texto === 'string') ? p.bloque.texto : '';
}

function _B1_incluyeAlguna(textoNormalizado, lista) {
  return lista.some(k => textoNormalizado.includes(_B1_normalizarComparacion(k)));
}

function _B1_deducirContextoSemantico(p) {
  const bloqueTexto = _B1_obtenerTextoBloque(p);
  const bloqueNorm = _B1_normalizarComparacion(bloqueTexto);
  const prev = _B1_normalizarComparacion(_B1_obtenerTextoVecino(p, -1));
  const next = _B1_normalizarComparacion(_B1_obtenerTextoVecino(p, 1));
  const alrededor = `${prev} ${bloqueNorm} ${next}`.trim();

  const ingredientesRaw = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_INGREDIENTES);
  const alergenosRaw = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_ALERGENOS);
  const nutricionalRaw = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_NUTRICIONAL);
  const pesoRaw = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_PESO);
  const irrelevanteRaw = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_IRRELEVANTE);

  let zona = 'neutral';
  if (ingredientesRaw || alergenosRaw) zona = 'ingredientes_alergenos';
  else if (pesoRaw) zona = 'peso_formato';
  else if (nutricionalRaw) zona = 'nutricional';
  else if (irrelevanteRaw) zona = 'irrelevante';

  return {
    // señales crudas para diagnóstico
    ingredientesRaw,
    alergenosRaw,
    nutricionalRaw,
    pesoRaw,
    irrelevanteRaw,

    // zona canónica única
    zona,
    ingredientes: zona === 'ingredientes_alergenos',
    alergenos: zona === 'ingredientes_alergenos',
    nutricional: zona === 'nutricional',
    peso: zona === 'peso_formato',
    irrelevante: zona === 'irrelevante',

    bloqueNorm,
    blockWordCount: Array.isArray(p && p.bloque && p.bloque.palabras) ? p.bloque.palabras.length : 0
  };
}

function _B1_obtenerVentanaPalabras(p, radio) {
  if (!p || !p.bloque || !Array.isArray(p.bloque.palabras)) return [];
  const idx = Number(p.wordIndex);
  if (!Number.isFinite(idx)) return [];

  const inicio = Math.max(0, idx - (radio || 4));
  const fin = Math.min(p.bloque.palabras.length - 1, idx + (radio || 4));
  const out = [];

  for (let i = inicio; i <= fin; i++) {
    const palabra = p.bloque.palabras[i];
    if (palabra && typeof palabra.texto === 'string') out.push(palabra.texto);
  }
  return out;
}


// ─── AYUDAS DE TEXTO Y CATÁLOGO ─────────────────────────────
function _B1_textoIncluyeStemComoToken(texto, stem) {
  const textoNorm = _B1_normalizarComparacion(texto);
  const stemNorm = _B1_normalizarComparacion(stem);
  if (!textoNorm || !stemNorm) return false;

  if (stemNorm.includes(' ')) {
    return textoNorm.includes(stemNorm);
  }

  const tokens = textoNorm.split(/[^a-z0-9]+/).filter(Boolean);
  return tokens.includes(stemNorm);
}

function _B1_contarFamiliasDistintasEnTexto(texto) {
  const set = new Set();

  B1_FAMILIAS_PRIORITARIAS.forEach(familia => {
    const hit = familia.stems.some(stem => _B1_textoIncluyeStemComoToken(texto, stem));
    if (hit) set.add(familia.id);
  });

  return set;
}

function _B1_contarFamiliasDistintasEnVentana(p, radio) {
  const ventana = _B1_obtenerVentanaPalabras(p, radio || 4).join(' ');
  return _B1_contarFamiliasDistintasEnTexto(ventana);
}

function _B1_tieneContextoPreparacionCercano(p, radio) {
  const ventana = _B1_normalizarComparacion(_B1_obtenerVentanaPalabras(p, radio || 4).join(' '));
  return _B1_incluyeAlguna(ventana, B1_CONTEXTO_PREPARACION);
}

function _B1_contarConectoresListaCercanos(p) {
  const prev = _B1_normalizarComparacion(_B1_obtenerTextoVecino(p, -1));
  const next = _B1_normalizarComparacion(_B1_obtenerTextoVecino(p, 1));
  let count = 0;

  if (B1_CONECTORES_LISTA.has(prev)) count++;
  if (B1_CONECTORES_LISTA.has(next)) count++;

  return count;
}

function _B1_haySeparadoresCercanos(p) {
  const prev = String(_B1_obtenerTextoVecino(p, -1) || '').trim();
  const next = String(_B1_obtenerTextoVecino(p, 1) || '').trim();

  const esSep = t => /^[,;:/|]$/.test(t);
  return esSep(prev) || esSep(next);
}

function _B1_tokenCompatibleParaSospecha(tokenCompacto) {
  return /^[a-z]{3,14}$/.test(String(tokenCompacto || ''));
}

function _B1_mismoInicio(a, b, n = 1) {
  const s = String(a || '');
  const t = String(b || '');
  if (!s || !t) return false;
  return s.slice(0, n) === t.slice(0, n);
}

function _B1_mismoFinal(a, b, n = 2) {
  const s = String(a || '');
  const t = String(b || '');
  if (!s || !t || s.length < n || t.length < n) return false;
  return s.slice(-n) === t.slice(-n);
}

function _B1_longitudCompatible(a, b) {
  return Math.abs(String(a || '').length - String(b || '').length) <= 1;
}

function _B1_esTokenRaroOCR(textoOriginal) {
  const texto = String(textoOriginal || '');
  if (!texto.trim()) return false;

  if (/[0-9]/.test(texto) && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/u.test(texto)) return true;
  if (/[|@$]/.test(texto)) return true;

  if (/[^\u0000-\u007F]/.test(texto)) {
    const normal = _B1_normalizarComparacion(texto);
    const compacto = _B1_compactarComparacion(texto);
    if (normal !== texto.toLowerCase() || compacto !== texto.toLowerCase().replace(/[^a-z0-9]/g, '')) return true;
  }

  const compacto = _B1_compactarComparacion(texto);
  if (!compacto) return false;
  if (/(.)\1\1/.test(compacto)) return true;

  return false;
}

function _B1_generarVariantesOCR(tokenOriginal) {
  const base = String(tokenOriginal || '');
  const norm = _B1_normalizarComparacion(base);
  const compacto = _B1_compactarComparacion(base);

  const variantes = new Set();
  if (compacto) variantes.add(compacto);
  if (norm && norm !== compacto) variantes.add(_B1_compactarComparacion(norm));

  const chars = [...norm];
  chars.forEach((ch, idx) => {
    const reemplazos = B1_CONFUSIONES_OCR[ch] || [];
    reemplazos.forEach(rep => {
      const clon = [...chars];
      clon[idx] = rep;
      variantes.add(_B1_compactarComparacion(clon.join('')));
    });
  });

  return [...variantes].filter(Boolean);
}

function _B1_mejorCoincidenciaCatalogo(tokenOriginal, stems) {
  const variantes = _B1_generarVariantesOCR(tokenOriginal);
  const resultados = [];

  stems.forEach(stem => {
    const stemCompacto = _B1_compactarComparacion(stem);
    if (!stemCompacto) return;

    variantes.forEach(variante => {
      const dist = _B1_distanciaSimple(variante, stemCompacto);
      resultados.push({
        stem,
        stemCompacto,
        variante,
        dist,
        mismoInicio1: _B1_mismoInicio(variante, stemCompacto, 1),
        mismoInicio2: _B1_mismoInicio(variante, stemCompacto, 2),
        mismoFinal2: _B1_mismoFinal(variante, stemCompacto, 2),
        longitudCompatible: _B1_longitudCompatible(variante, stemCompacto)
      });
    });
  });

  resultados.sort((a, b) => {
    if (a.dist !== b.dist) return a.dist - b.dist;
    if (a.mismoInicio2 !== b.mismoInicio2) return a.mismoInicio2 ? -1 : 1;
    if (a.mismoFinal2 !== b.mismoFinal2) return a.mismoFinal2 ? -1 : 1;
    return 0;
  });

  return resultados.length ? resultados[0] : null;
}


// ─── VENTANAS DE COMPARACIÓN ────────────────────────────────
function _B1_obtenerVentanasComparacion(p, tokenCompacto) {
  const prevCompacto = _B1_compactarComparacion(_B1_obtenerTextoVecino(p, -1));
  const nextCompacto = _B1_compactarComparacion(_B1_obtenerTextoVecino(p, 1));

  const ventanas = [];

  if (tokenCompacto) {
    ventanas.push({ valor: tokenCompacto, tipo: 'actual' });
  }
  if (tokenCompacto && nextCompacto) {
    ventanas.push({ valor: tokenCompacto + nextCompacto, tipo: 'actual_next' });
  }
  if (prevCompacto && tokenCompacto) {
    ventanas.push({ valor: prevCompacto + tokenCompacto, tipo: 'prev_actual' });
  }
  if (prevCompacto && tokenCompacto && nextCompacto) {
    ventanas.push({ valor: prevCompacto + tokenCompacto + nextCompacto, tipo: 'prev_actual_next' });
  }

  const unicas = [];
  const seen = new Set();

  ventanas.forEach(v => {
    if (!v.valor) return;
    const key = `${v.tipo}:${v.valor}`;
    if (seen.has(key)) return;
    seen.add(key);
    unicas.push(v);
  });

  return unicas;
}


// ─── VALIDACIÓN FINAL DE NEGOCIO ────────────────────────────
function _B1_aprobarFamiliaEnValidacionFinal(decision, contexto, palabraOriginal) {
  const token = _B1_compactarComparacion(decision.textoOriginal);
  if (!token || !decision.matchedStem) {
    return {
      aprobado: false,
      motivo: 'sin_stem_o_token',
      detalle: null
    };
  }

  const mejor = _B1_mejorCoincidenciaCatalogo(decision.textoOriginal, [decision.matchedStem]);
  if (!mejor) {
    return {
      aprobado: false,
      motivo: 'sin_mejor_coincidencia',
      detalle: null
    };
  }

  let puntos = 0;
  const razones = [];

  if (contexto.zona === 'ingredientes_alergenos') {
    puntos++;
    razones.push('contexto_ingredientes_alergenos');
  }

  if (mejor.dist === 0) {
    puntos += 3;
    razones.push('distancia_0');
  } else if (mejor.dist === 1) {
    puntos += 2;
    razones.push('distancia_1');
  } else if (mejor.dist === 2) {
    puntos += 1;
    razones.push('distancia_2');
  }

  if (mejor.mismoInicio2) {
    puntos += 2;
    razones.push('mismo_inicio_2');
  } else if (mejor.mismoInicio1) {
    puntos += 1;
    razones.push('mismo_inicio_1');
  }

  if (mejor.mismoFinal2) {
    puntos += 1;
    razones.push('mismo_final_2');
  }

  if (mejor.longitudCompatible) {
    puntos += 1;
    razones.push('longitud_compatible');
  }

  // ── PUERTA DURA PARA TOKENS DE 3 LETRAS ─────────────────
  // Separa roturas OCR reales de palabras comunes cortas.
  // `egg`, `soy`, `ovo` (dist 0) pasan directamente.
  // Tokens rotos de 3 letras (dist 1) exigen microcontexto fuerte.
  // Tokens de 4+ letras usan el umbral original de puntos >= 4.
  if (token.length === 3) {

    // Exactos: pasan sin más comprobaciones
    if (mejor.dist === 0) {
      return {
        aprobado: true,
        motivo: 'familia_validada_token3_exacta',
        detalle: { puntos, razones, dist: mejor.dist, stem: mejor.stem, variante: mejor.variante }
      };
    }

    // Rotos (dist 1): requisitos obligatorios
    const tokenLimpio3  = /^[a-z]{3}$/.test(token);
    const distOk        = mejor.dist === 1;
    const longOk        = mejor.longitudCompatible === true;
    const preparacionCerca = _B1_tieneContextoPreparacionCercano(palabraOriginal || {}, 4);
    const sinPrep       = !preparacionCerca;
    const esOCRdudoso   =
      (decision.tokenRaroOCR === true) ||
      (typeof decision.confidence === 'number' && decision.confidence <= 0.90);

    if (!tokenLimpio3 || !distOk || !longOk || !sinPrep || !esOCRdudoso) {
      return {
        aprobado: false,
        motivo: 'familia_rechazada_token3_requisitos_no_cumplidos',
        detalle: { puntos, razones, dist: mejor.dist, tokenLimpio3, distOk, longOk, sinPrep, esOCRdudoso }
      };
    }

    // Microcontexto fuerte — debe cumplir UNO de los dos
    const SENALES_ALERGENO_EXPLICITO = ['trazas', 'contiene', 'contener', 'contains', 'allergen', 'alergen'];
    const ventanaTexto = _B1_normalizarComparacion(
      _B1_obtenerVentanaPalabras(palabraOriginal || {}, 3).join(' ')
    );
    const microContextoExplicito = SENALES_ALERGENO_EXPLICITO.some(s => ventanaTexto.includes(s));

    const familiasCerca     = _B1_contarFamiliasDistintasEnVentana(palabraOriginal || {}, 4);
    const hayEstructuraLista =
      _B1_haySeparadoresCercanos(palabraOriginal || {}) ||
      _B1_contarConectoresListaCercanos(palabraOriginal || {}) > 0;
    const microContextoLista = familiasCerca.size >= 2 && hayEstructuraLista;

    if (!microContextoExplicito && !microContextoLista) {
      return {
        aprobado: false,
        motivo: 'familia_rechazada_token3_sin_microcontexto_fuerte',
        detalle: {
          puntos, razones, dist: mejor.dist,
          microContextoExplicito, microContextoLista,
          familiasCerca: [...familiasCerca], ventanaTexto
        }
      };
    }

    return {
      aprobado: true,
      motivo: 'familia_validada_token3_microcontexto_fuerte',
      detalle: {
        puntos, razones, dist: mejor.dist, stem: mejor.stem, variante: mejor.variante,
        microContextoExplicito, microContextoLista
      }
    };
  }

  // ── TOKENS DE 4+ LETRAS ─────────────────────────────────
  // dist 2 sin mismoInicio2 no basta: cierra casos como PASTA->nata
  // (mismoFinal2 solo + distancia 2 = parecido demasiado flojo)
  if (mejor.dist === 2 && !mejor.mismoInicio2) {
    return {
      aprobado: false,
      motivo: 'familia_rechazada_dist2_sin_inicio_fuerte',
      detalle: {
        puntos,
        razones,
        dist: mejor.dist,
        stem: mejor.stem,
        variante: mejor.variante,
        mismoInicio2: mejor.mismoInicio2,
        mismoFinal2: mejor.mismoFinal2,
        longitudCompatible: mejor.longitudCompatible
      }
    };
  }

  const aprobado = puntos >= 4;

  return {
    aprobado,
    motivo: aprobado ? 'familia_validada' : 'familia_rechazada_por_validacion_final',
    detalle: {
      puntos,
      razones,
      dist: mejor.dist,
      stem: mejor.stem,
      variante: mejor.variante,
      mismoInicio2: mejor.mismoInicio2,
      mismoFinal2: mejor.mismoFinal2,
      longitudCompatible: mejor.longitudCompatible
    }
  };
}

function _B1_aprobarPesoFormatoEnValidacionFinal(decision, contexto) {
  const token = _B1_compactarComparacion(decision.textoOriginal);
  const original = String(decision.textoOriginal || '').trim();

  const aprobado =
    contexto.zona === 'peso_formato' ||
    (/^\d+([.,]\d+)?(kg|g|gr|ml|cl|l)$/i.test(token)) ||
    (/^\d+[x×]\d+([.,]\d+)?$/i.test(original));

  return {
    aprobado,
    motivo: aprobado ? 'peso_formato_validado' : 'peso_formato_rechazado_por_validacion_final',
    detalle: {
      contextoZona: contexto.zona,
      token,
      original
    }
  };
}

function _B1_aprobarNombreEnValidacionFinal(decision, contexto) {
  const token = _B1_compactarComparacion(decision.textoOriginal);
  const original = String(decision.textoOriginal || '').trim();

  const letras = original.replace(/[^A-Za-zÁÉÍÓÚÜÑÀÈÌÒÙÇáéíóúüñàèìòùç]/gu, '').length;
  const mayusculas = original.replace(/[^A-ZÁÉÍÓÚÜÑÀÈÌÒÙÇ]/gu, '').length;
  const ratioMayusculas = letras > 0 ? mayusculas / letras : 0;

  const aprobado =
    contexto.zona === 'neutral' &&
    token.length >= 4 &&
    !B1_STOPWORDS_NOMBRE.has(token) &&
    contexto.blockWordCount <= 6 &&
    ratioMayusculas >= 0.45;

  return {
    aprobado,
    motivo: aprobado ? 'nombre_validado' : 'nombre_rechazado_por_validacion_final',
    detalle: {
      token,
      ratioMayusculas,
      blockWordCount: contexto.blockWordCount
    }
  };
}

function _B1_validarDecisionFinal(decision, palabraOriginal) {
  const contexto = _B1_deducirContextoSemantico(palabraOriginal);

  let resultado = {
    aprobado: false,
    motivo: 'sin_validacion',
    detalle: null,
    contextoZona: contexto.zona
  };

  if (decision.decision === 'candidato_agente_familia') {
    resultado = _B1_aprobarFamiliaEnValidacionFinal(decision, contexto, palabraOriginal);
  } else if (decision.decision === 'candidato_agente_peso_formato') {
    resultado = _B1_aprobarPesoFormatoEnValidacionFinal(decision, contexto);
  } else if (decision.decision === 'candidato_agente_nombre') {
    resultado = _B1_aprobarNombreEnValidacionFinal(decision, contexto);
  }

  return {
    aprobado: resultado.aprobado,
    motivo: resultado.motivo,
    detalle: resultado.detalle,
    contextoZona: contexto.zona
  };
}

function _B1_aplicarFiltroValidacionFinal(candidatas) {
  const aprobadas = [];
  const descartadas = [];

  candidatas.forEach(item => {
    const validacion = _B1_validarDecisionFinal(item.decision, item.palabra);

    item.decision.validacionFinal = {
      nombreFiltro: 'FILTRO_DE_VALIDACION_FINAL_DE_NEGOCIO',
      aprobado: validacion.aprobado,
      motivo: validacion.motivo,
      contextoZona: validacion.contextoZona,
      detalle: validacion.detalle
    };

    if (validacion.aprobado) {
      aprobadas.push(item);
    } else {
      item.decision.decision = 'descartado_validacion_final';
      item.decision.motivo = validacion.motivo;
      descartadas.push(item);
    }
  });

  return {
    aprobadas,
    descartadas,
    auditoria: {
      nombreFiltro: 'FILTRO_DE_VALIDACION_FINAL_DE_NEGOCIO',
      totalCandidatasRevisadas: candidatas.length,
      totalAprobadas: aprobadas.length,
      totalDescartadas: descartadas.length,
      aprobadas: aprobadas.map(x => ({
        textoOriginal: x.decision.textoOriginal,
        decisionOriginal: x.decision.decision,
        familia: x.decision.familia || null,
        prioridad: x.decision.prioridad,
        validacionFinal: x.decision.validacionFinal
      })),
      descartadas: descartadas.map(x => ({
        textoOriginal: x.decision.textoOriginal,
        decisionOriginal: 'candidata_descartada_por_validacion_final',
        familia: x.decision.familia || null,
        prioridad: x.decision.prioridad,
        validacionFinal: x.decision.validacionFinal
      }))
    }
  };
}


// ─── FILTRO DE SOSPECHA CONTEXTUAL ACUMULADA ────────────────
function _B1_puntuarSospechaContextualAcumulada(decision, palabraOriginal) {
  const contexto = _B1_deducirContextoSemantico(palabraOriginal);
  const token = _B1_compactarComparacion(decision.textoOriginal);
  const familiasVentana = _B1_contarFamiliasDistintasEnVentana(palabraOriginal, 4);
  const conectores = _B1_contarConectoresListaCercanos(palabraOriginal);
  const haySeparadores = _B1_haySeparadoresCercanos(palabraOriginal);
  const preparacionCerca = _B1_tieneContextoPreparacionCercano(palabraOriginal, 4);

  let puntos = 0;
  const razones = [];

  if (contexto.zona === 'ingredientes_alergenos') {
    puntos += 2;
    razones.push('zona_critica');
  }

  if (familiasVentana.size >= 2) {
    puntos += 3;
    razones.push('vecindad_con_varios_alergenos');
  } else if (familiasVentana.size === 1) {
    puntos += 1;
    razones.push('vecindad_con_un_alergeno');
  }

  if (conectores > 0) {
    puntos += 1;
    razones.push('conector_de_lista_cercano');
  }

  if (haySeparadores) {
    puntos += 1;
    razones.push('separador_cercano');
  }

  if (decision.tokenRaroOCR || (typeof decision.confidence === 'number' && decision.confidence < 0.85)) {
    puntos += 1;
    razones.push('token_sospechoso');
  }

  if (_B1_tokenCompatibleParaSospecha(token)) {
    puntos += 1;
    razones.push('token_compatible');
  }

  if (decision.decision === 'descartado_validacion_final') {
    puntos += 1;
    razones.push('venia_de_validacion_final');
  }

  if (preparacionCerca) {
    puntos -= 3;
    razones.push('penalizacion_contexto_preparacion');
  }

  if (contexto.zona === 'nutricional' || contexto.zona === 'irrelevante' || contexto.zona === 'peso_formato') {
    puntos -= 2;
    razones.push('penalizacion_zona_no_critica');
  }

  const aprobado =
    puntos >= 5 &&
    familiasVentana.size >= 2 &&
    contexto.zona === 'ingredientes_alergenos';

  return {
    aprobado,
    motivo: aprobado ? 'rescatado_por_sospecha_contextual_acumulada' : 'descartado_por_sospecha_contextual_insuficiente',
    detalle: {
      puntos,
      razones,
      familiasDetectadasEnVentana: [...familiasVentana],
      totalFamiliasEnVentana: familiasVentana.size,
      conectores,
      haySeparadores,
      preparacionCerca,
      contextoZona: contexto.zona,
      contextoRaw: {
        ingredientesRaw: contexto.ingredientesRaw,
        alergenosRaw: contexto.alergenosRaw,
        nutricionalRaw: contexto.nutricionalRaw,
        pesoRaw: contexto.pesoRaw,
        irrelevanteRaw: contexto.irrelevanteRaw
      },
      token
    }
  };
}

function _B1_aplicarFiltroSospechaContextualAcumulada(pool) {
  const rescatadas = [];
  const descartadas = [];

  pool.forEach(item => {
    const evaluacion = _B1_puntuarSospechaContextualAcumulada(item.decision, item.palabra);

    item.decision.sospechaContextualAcumulada = {
      nombreFiltro: 'FILTRO_DE_SOSPECHA_CONTEXTUAL_ACUMULADA',
      aprobado: evaluacion.aprobado,
      motivo: evaluacion.motivo,
      detalle: evaluacion.detalle
    };

    if (evaluacion.aprobado) {
      item.decision.decision = 'candidato_agente_contexto_critico';
      item.decision.motivo = 'rescatado_por_sospecha_contextual_acumulada';
      rescatadas.push(item);
    } else {
      descartadas.push(item);
    }
  });

  return {
    rescatadas,
    descartadas,
    auditoria: {
      nombreFiltro: 'FILTRO_DE_SOSPECHA_CONTEXTUAL_ACUMULADA',
      totalRevisadas: pool.length,
      totalRescatadas: rescatadas.length,
      totalDescartadas: descartadas.length,
      rescatadas: rescatadas.map(x => ({
        textoOriginal: x.decision.textoOriginal,
        decisionFinal: x.decision.decision,
        familia: x.decision.familia || null,
        prioridad: x.decision.prioridad,
        sospechaContextualAcumulada: x.decision.sospechaContextualAcumulada
      })),
      descartadas: descartadas.map(x => ({
        textoOriginal: x.decision.textoOriginal,
        decisionFinal: x.decision.decision,
        familia: x.decision.familia || null,
        prioridad: x.decision.prioridad,
        sospechaContextualAcumulada: x.decision.sospechaContextualAcumulada
      }))
    }
  };
}


// ─── PUNTUAR FAMILIA PRIORITARIA ────────────────────────────
function _B1_puntuarFamiliaPrioritaria(p, tokenCompacto, contexto, tolerancia) {
  if (!tokenCompacto || tokenCompacto.length < 3) {
    return { score: 0, familia: null, motivo: null, matchedStem: null, evidencia: null };
  }

  const ventanas = _B1_obtenerVentanasComparacion(p, tokenCompacto);
  let mejor = { score: 0, familia: null, motivo: null, matchedStem: null, evidencia: null };

  B1_FAMILIAS_PRIORITARIAS.forEach(familia => {
    familia.stems.forEach(stem => {
      const stemCompacto = _B1_compactarComparacion(stem);
      if (!stemCompacto) return;

      ventanas.forEach(ventana => {
        let score = 0;
        let motivo = null;

        if (ventana.valor === stemCompacto) {
          score = 320;
          motivo = 'coincidencia_exacta_familia';
        } else if (stemCompacto.startsWith(ventana.valor) && ventana.valor.length >= 3) {
          score = 290;
          motivo = 'prefijo_familia';
        } else if (ventana.valor.includes(stemCompacto) || stemCompacto.includes(ventana.valor)) {
          score = 270;
          motivo = 'subcadena_familia';
        } else {
          const dist = _B1_distanciaSimple(ventana.valor, stemCompacto);
          if (dist <= tolerancia) {
            score = 240 - (dist * 20);
            motivo = 'parecido_familia';
          }
        }

        if (score > 0 && contexto.zona === 'ingredientes_alergenos') {
          score += 40;
        }

        if (score > mejor.score) {
          mejor = {
            score,
            familia: familia.id,
            motivo,
            matchedStem: stem,
            evidencia: `${ventana.tipo}:${ventana.valor}`
          };
        }
      });
    });
  });

  return mejor;
}


// ─── PUNTUAR PESO / FORMATO / PACK ──────────────────────────
function _B1_puntuarPesoFormato(p, tokenOriginal, tokenCompacto, contexto) {
  if (contexto.zona === 'nutricional') {
    return { score: 0, motivo: null, evidencia: null };
  }

  const texto = String(tokenOriginal || '').trim();
  const prev = _B1_normalizarComparacion(_B1_obtenerTextoVecino(p, -1));
  const next = _B1_normalizarComparacion(_B1_obtenerTextoVecino(p, 1));
  const contextoLocal = `${prev} ${_B1_normalizarComparacion(texto)} ${next}`.trim();

  let score = 0;
  let motivo = null;
  let evidencia = null;

  if (/^\d+[x×]\d+([.,]\d+)?$/i.test(texto)) {
    score = 300;
    motivo = 'formato_pack';
    evidencia = texto;
  }

  if (/^\d+([.,]\d+)?(kg|g|gr|ml|cl|l)$/i.test(tokenCompacto) && 290 > score) {
    score = 290;
    motivo = 'medida_compacta';
    evidencia = tokenCompacto;
  }

  if (
    /^\d+([.,]\d+)?$/i.test(texto) &&
    /(kg|g|gr|ml|cl|l)\b/.test(contextoLocal) &&
    (contexto.zona === 'peso_formato' || /(peso|neto|poids|weight|p\.?net)/.test(contexto.bloqueNorm))
  ) {
    if (260 > score) {
      score = 260;
      motivo = 'numero_con_unidad_comercial';
      evidencia = contextoLocal;
    }
  }

  if (/^(kg|g|gr|ml|cl|l)$/i.test(tokenCompacto) && /\d/.test(contextoLocal) && contexto.zona === 'peso_formato') {
    if (250 > score) {
      score = 250;
      motivo = 'unidad_con_numero_comercial';
      evidencia = contextoLocal;
    }
  }

  if (contexto.zona === 'peso_formato' && (/\d/.test(tokenCompacto) || B1_PALABRAS_PESO_FORMATO.includes(tokenCompacto))) {
    if (230 > score) {
      score = 230;
      motivo = 'bloque_peso_formato';
      evidencia = contexto.bloqueNorm;
    }
  }

  return { score, motivo, evidencia };
}


// ─── PUNTUAR NOMBRE DE PRODUCTO ─────────────────────────────
function _B1_puntuarNombreProducto(p, tokenOriginal, tokenCompacto, contexto) {
  if (!p) return { score: 0, motivo: null, evidencia: null };
  if (!tokenCompacto || tokenCompacto.length < 4) return { score: 0, motivo: null, evidencia: null };
  if (/\d/.test(tokenCompacto)) return { score: 0, motivo: null, evidencia: null };

  if (contexto.zona !== 'neutral') {
    return { score: 0, motivo: null, evidencia: null };
  }

  if (B1_STOPWORDS_NOMBRE.has(tokenCompacto)) {
    return { score: 0, motivo: null, evidencia: null };
  }

  const texto = String(tokenOriginal || '').trim();
  const mayusculas = texto.replace(/[^A-ZÁÉÍÓÚÜÑÀÈÌÒÙÇ]/gu, '').length;
  const letras = texto.replace(/[^A-Za-zÁÉÍÓÚÜÑÀÈÌÒÙÇáéíóúüñàèìòùç]/gu, '').length;
  const ratioMayusculas = letras > 0 ? mayusculas / letras : 0;

  if (contexto.blockWordCount > 6) {
    return { score: 0, motivo: null, evidencia: null };
  }

  let score = 0;
  if (ratioMayusculas >= 0.6) score += 150;
  else if (contexto.blockWordCount <= 3) score += 120;
  else score += 90;

  return {
    score,
    motivo: 'nombre_por_exclusion',
    evidencia: `ratioMayusculas=${ratioMayusculas.toFixed(2)};blockWords=${contexto.blockWordCount}`
  };
}


// ─── CLASIFICAR UNA PALABRA DUDOSA ──────────────────────────
function _B1_clasificarPalabraDudosa(p, sensitivityMode) {
  const textoOriginal = (p && typeof p.texto === 'string') ? p.texto : '';
  const textoNormalizado = _B1_normalizarComparacion(textoOriginal);
  const tokenCompacto = _B1_compactarComparacion(textoOriginal);
  const toleranciaBase = sensitivityMode === B1_SENSITIVITY.ALTA ? 2 : 1;

  const contexto = _B1_deducirContextoSemantico(p);
  const tolerancia = contexto.zona === 'ingredientes_alergenos' ? Math.max(toleranciaBase, 2) : toleranciaBase;

  const base = {
    textoOriginal,
    textoNormalizado,
    pageIndex: p && typeof p.pageIndex === 'number' ? p.pageIndex : null,
    blockIndex: p && typeof p.blockIndex === 'number' ? p.blockIndex : null,
    wordIndex: p && typeof p.wordIndex === 'number' ? p.wordIndex : null,
    confidence: p && typeof p.confidence === 'number' ? p.confidence : null,
    decision: null,
    motivo: null,
    familia: null,
    prioridad: 0,
    matchedStem: null,
    evidencia: null,
    zona: contexto.zona,
    tokenRaroOCR: _B1_esTokenRaroOCR(textoOriginal)
  };

  if (_B1_esBasuraPura(textoOriginal)) {
    base.decision = 'descartado_basura';
    base.motivo = 'basura_pura';
    return base;
  }

  if (!tokenCompacto) {
    base.decision = 'descartado_basura';
    base.motivo = 'sin_nucleo_util';
    return base;
  }

  const familia = _B1_puntuarFamiliaPrioritaria(p, tokenCompacto, contexto, tolerancia);
  const peso = _B1_puntuarPesoFormato(p, textoOriginal, tokenCompacto, contexto);
  const nombre = _B1_puntuarNombreProducto(p, textoOriginal, tokenCompacto, contexto);

  let ganador = {
    tipo: null,
    score: 0,
    motivo: null,
    familia: null,
    matchedStem: null,
    evidencia: null
  };

  if (familia.score > ganador.score) {
    ganador = {
      tipo: 'familia',
      score: familia.score,
      motivo: familia.motivo,
      familia: familia.familia,
      matchedStem: familia.matchedStem,
      evidencia: familia.evidencia
    };
  }

  if (peso.score > ganador.score) {
    ganador = {
      tipo: 'peso_formato',
      score: peso.score,
      motivo: peso.motivo,
      familia: null,
      matchedStem: null,
      evidencia: peso.evidencia
    };
  }

  if (nombre.score > ganador.score) {
    ganador = {
      tipo: 'nombre',
      score: nombre.score,
      motivo: nombre.motivo,
      familia: null,
      matchedStem: null,
      evidencia: nombre.evidencia
    };
  }

  if (ganador.score <= 0) {
    base.decision = 'descartado_no_prioritario';
    base.motivo = 'no_prioritario_para_la_app';
    return base;
  }

  if (ganador.tipo === 'familia') {
    base.decision = 'candidato_agente_familia';
    base.motivo = ganador.motivo;
    base.familia = ganador.familia;
    base.prioridad = ganador.score;
    base.matchedStem = ganador.matchedStem;
    base.evidencia = ganador.evidencia;
    return base;
  }

  if (ganador.tipo === 'peso_formato') {
    base.decision = 'candidato_agente_peso_formato';
    base.motivo = ganador.motivo;
    base.prioridad = ganador.score;
    base.evidencia = ganador.evidencia;
    return base;
  }

  base.decision = 'candidato_agente_nombre';
  base.motivo = ganador.motivo;
  base.prioridad = ganador.score;
  base.evidencia = ganador.evidencia;
  return base;
}


// ─── EJECUTAR SELECTOR OCR ──────────────────────────────────
function _B1_ejecutarSelectorOCR(palabrasDudosas, sensitivityMode, maxSlots) {
  if (!Array.isArray(palabrasDudosas) || palabrasDudosas.length === 0) {
    return {
      seleccionadas: [],
      selectorOCR: {
        totalDudas: 0,
        totalBasura: 0,
        totalEnviadoAgente: 0,
        totalNoPrioritario: 0,
        totalDescartadoPorCupo: 0,
        totalDescartadoValidacionFinal: 0,
        totalRescatadoContextoCritico: 0,
        descartadoBasura: [],
        enviadoAgente: [],
        descartadoNoPrioritario: [],
        descartadoPorCupo: [],
        descartadoValidacionFinal: [],
        rescatadoContextoCritico: [],
        decisiones: [],
        validacionFinal: {
          nombreFiltro: 'FILTRO_DE_VALIDACION_FINAL_DE_NEGOCIO',
          totalCandidatasRevisadas: 0,
          totalAprobadas: 0,
          totalDescartadas: 0,
          aprobadas: [],
          descartadas: []
        },
        sospechaContextualAcumulada: {
          nombreFiltro: 'FILTRO_DE_SOSPECHA_CONTEXTUAL_ACUMULADA',
          totalRevisadas: 0,
          totalRescatadas: 0,
          totalDescartadas: 0,
          rescatadas: [],
          descartadas: []
        }
      }
    };
  }

  const decisiones = palabrasDudosas.map(p => _B1_clasificarPalabraDudosa(p, sensitivityMode));

  const items = decisiones.map((decision, idx) => ({
    idx,
    decision,
    palabra: palabrasDudosas[idx]
  }));

  const candidatasBrutas = items.filter(x =>
    x.decision.decision === 'candidato_agente_familia' ||
    x.decision.decision === 'candidato_agente_peso_formato' ||
    x.decision.decision === 'candidato_agente_nombre'
  );

  const filtroValidacionFinal = _B1_aplicarFiltroValidacionFinal(candidatasBrutas);

  const poolSospecha = items.filter(x =>
    x.decision.decision === 'descartado_validacion_final' ||
    x.decision.decision === 'descartado_no_prioritario'
  );

  const filtroSospechaContextual = _B1_aplicarFiltroSospechaContextualAcumulada(poolSospecha);

  const candidatas = [
    ...filtroValidacionFinal.aprobadas,
    ...filtroSospechaContextual.rescatadas
  ];

  candidatas.sort((a, b) => {
    if (b.decision.prioridad !== a.decision.prioridad) return b.decision.prioridad - a.decision.prioridad;
    if ((a.decision.pageIndex || 0) !== (b.decision.pageIndex || 0)) return (a.decision.pageIndex || 0) - (b.decision.pageIndex || 0);
    if ((a.decision.blockIndex || 0) !== (b.decision.blockIndex || 0)) return (a.decision.blockIndex || 0) - (b.decision.blockIndex || 0);
    return (a.decision.wordIndex || 0) - (b.decision.wordIndex || 0);
  });

  const limite = Number.isFinite(maxSlots) && maxSlots > 0 ? maxSlots : candidatas.length;
  const enviadas = candidatas.slice(0, limite);
  const porCupo = candidatas.slice(limite);

  enviadas.forEach(x => {
    if (x.decision.decision === 'candidato_agente_familia') x.decision.decision = 'enviado_agente_familia';
    else if (x.decision.decision === 'candidato_agente_peso_formato') x.decision.decision = 'enviado_agente_peso_formato';
    else if (x.decision.decision === 'candidato_agente_nombre') x.decision.decision = 'enviado_agente_nombre';
    else if (x.decision.decision === 'candidato_agente_contexto_critico') x.decision.decision = 'enviado_agente_contexto_critico';
  });

  porCupo.forEach(x => {
    x.decision.decision = 'descartado_por_cupo';
    x.decision.motivo = 'fuera_por_cupo_de_slots';
  });

  const descartadoBasura = decisiones.filter(d => d.decision === 'descartado_basura');
  const enviadoAgente = decisiones.filter(d =>
    d.decision === 'enviado_agente_familia' ||
    d.decision === 'enviado_agente_peso_formato' ||
    d.decision === 'enviado_agente_nombre' ||
    d.decision === 'enviado_agente_contexto_critico'
  );
  const descartadoNoPrioritario = decisiones.filter(d => d.decision === 'descartado_no_prioritario');
  const descartadoPorCupo = decisiones.filter(d => d.decision === 'descartado_por_cupo');
  const descartadoValidacionFinal = decisiones.filter(d => d.decision === 'descartado_validacion_final');
  const rescatadoContextoCritico = decisiones.filter(d =>
    d.decision === 'candidato_agente_contexto_critico' ||
    d.decision === 'enviado_agente_contexto_critico'
  );

  return {
    seleccionadas: enviadas.map(x => x.palabra),
    selectorOCR: {
      totalDudas: palabrasDudosas.length,
      totalBasura: descartadoBasura.length,
      totalEnviadoAgente: enviadoAgente.length,
      totalNoPrioritario: descartadoNoPrioritario.length,
      totalDescartadoPorCupo: descartadoPorCupo.length,
      totalDescartadoValidacionFinal: descartadoValidacionFinal.length,
      totalRescatadoContextoCritico: rescatadoContextoCritico.length,
      descartadoBasura,
      enviadoAgente,
      descartadoNoPrioritario,
      descartadoPorCupo,
      descartadoValidacionFinal,
      rescatadoContextoCritico,
      decisiones,
      validacionFinal: filtroValidacionFinal.auditoria,
      sospechaContextualAcumulada: filtroSospechaContextual.auditoria
    }
  };
}


// ─── FILTRAR DUDAS RESCATABLES ──────────────────────────────
function B1_filtrarDudasRescatables(palabrasDudosas, candidatosRiesgo, sensitivityMode) {
  if (typeof candidatosRiesgo === 'string' && sensitivityMode === undefined) {
    sensitivityMode = candidatosRiesgo;
    candidatosRiesgo = [];
  }

  const config = B1_PRESUPUESTOS[sensitivityMode] || {};
  const listaUnificada = []
    .concat(Array.isArray(palabrasDudosas) ? palabrasDudosas : [])
    .concat(Array.isArray(candidatosRiesgo) ? candidatosRiesgo : []);

  return _B1_ejecutarSelectorOCR(listaUnificada, sensitivityMode, config.maxSlots).seleccionadas;
}


// ─── CREAR SLOTS INDEXADOS ──────────────────────────────────
function B1_crearSlots(dudasRescatables, maxSlots) {
  _resetSlotCounter();

  const limitadas = dudasRescatables.slice(0, maxSlots);

  return limitadas.map(p => ({
    slotId:          _nextSlotId(),
    textoOriginal:   p.texto,
    confidence:      p.confidence,
    boundingPoly:    p.boundingPoly,
    pageIndex:       p.pageIndex,
    blockIndex:      p.blockIndex,
    wordIndex:       p.wordIndex,
    bloque:          p.bloque,
    origenDeteccion: p.origenDeteccion || 'dudosa_confianza'
  }));
}


// ─── RECORTAR ROI ───────────────────────────────────────────
function B1_recortarROI(canvasOriginal, boundingPoly, margen) {
  if (!canvasOriginal || !boundingPoly || !boundingPoly.vertices || boundingPoly.vertices.length < 2) {
    return null;
  }

  const vertices = boundingPoly.vertices;
  const mg = margen || B1_CONFIG.ROI_MARGIN_PX;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  vertices.forEach(v => {
    const x = v.x || 0;
    const y = v.y || 0;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });

  minX = Math.max(0, minX - mg);
  minY = Math.max(0, minY - mg);
  maxX = Math.min(canvasOriginal.width, maxX + mg);
  maxY = Math.min(canvasOriginal.height, maxY + mg);

  const roiW = maxX - minX;
  const roiH = maxY - minY;

  if (roiW < 5 || roiH < 5) return null;

  const roiCanvas = document.createElement('canvas');
  roiCanvas.width = roiW;
  roiCanvas.height = roiH;
  const ctx = roiCanvas.getContext('2d');
  ctx.drawImage(canvasOriginal, minX, minY, roiW, roiH, 0, 0, roiW, roiH);

  return roiCanvas.toDataURL('image/jpeg', 0.90).split(',')[1];
}


// ─── CONSTRUIR CONTEXTO INTRABLOQUE ─────────────────────────
function B1_construirContexto(slot, ventana) {
  if (!slot.bloque || !slot.bloque.palabras) {
    return `[[${slot.slotId}|${slot.textoOriginal}]]`;
  }

  const palabras = slot.bloque.palabras;
  const idx = slot.wordIndex;
  const inicio = Math.max(0, idx - ventana);
  const fin = Math.min(palabras.length - 1, idx + ventana);

  const partes = [];

  for (let i = inicio; i <= fin; i++) {
    if (i === idx) {
      partes.push(`[[${slot.slotId}|${slot.textoOriginal}]]`);
    } else {
      partes.push(palabras[i].texto);
    }
  }

  return partes.join(' ');
}


// ─── VENTANA DE CONTEXTO POR SENSIBILIDAD ───────────────────
function B1_getVentanaContexto(sensitivityMode) {
  switch (sensitivityMode) {
    case B1_SENSITIVITY.BAJA:  return 3;
    case B1_SENSITIVITY.MEDIA: return 5;
    case B1_SENSITIVITY.ALTA:  return 8;
    default: return 5;
  }
}


// ─── MAPEO LOCAL DE CATEGORÍA (RESPALDO) ────────────────────
function _B1_mapearCategoriaLocal(decision) {
  switch (decision) {
    case 'enviado_agente_familia':          return 'familia';
    case 'enviado_agente_peso_formato':     return 'peso_formato';
    case 'enviado_agente_nombre':           return 'nombre';
    case 'enviado_agente_contexto_critico': return 'contexto_critico';
    default:                                return 'contexto_critico';
  }
}

function _B1_resolverCategoriaDesdeDecision(decision) {
  if (typeof B1_mapearCategoria === 'function') {
    return B1_mapearCategoria(decision);
  }
  return _B1_mapearCategoriaLocal(decision);
}


// ─── PREPARAR LOTE COMPLETO PARA RESCATE ────────────────────
function B1_prepararLoteRescate(palabrasDudosas, candidatosRiesgo, canvas, sensitivityMode) {
  const config = B1_PRESUPUESTOS[sensitivityMode];

  const mapaOrigen = {};

  (palabrasDudosas || []).forEach(p => {
    const clave = p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex;
    mapaOrigen[clave] = { palabra: p, origenDeteccion: 'dudosa_confianza' };
  });

  (candidatosRiesgo || []).forEach(p => {
    const clave = p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex;
    if (mapaOrigen[clave]) {
      mapaOrigen[clave].origenDeteccion = 'ambas';
    } else {
      mapaOrigen[clave] = { palabra: p, origenDeteccion: 'candidato_riesgo' };
    }
  });

  const listaUnificada = Object.values(mapaOrigen).map(entry => {
    entry.palabra.origenDeteccion = entry.origenDeteccion;
    return entry.palabra;
  });

  const totalDedupe =
    (palabrasDudosas || []).length +
    (candidatosRiesgo || []).length -
    listaUnificada.length;

  const selector = _B1_ejecutarSelectorOCR(listaUnificada, sensitivityMode, config.maxSlots);

  const rescatables = selector.seleccionadas;
  const slots = B1_crearSlots(rescatables, config.maxSlots);
  const ventana = B1_getVentanaContexto(sensitivityMode);

  const mapaDecision = {};
  const enviadosAgente = (selector && selector.selectorOCR && Array.isArray(selector.selectorOCR.enviadoAgente))
    ? selector.selectorOCR.enviadoAgente
    : [];

  enviadosAgente.forEach(item => {
    const clave = item.pageIndex + ':' + item.blockIndex + ':' + item.wordIndex;
    mapaDecision[clave] = item.decision;
  });

  const totalEnviadoAgentePorConfianza = rescatables.filter(
    p => p.origenDeteccion === 'dudosa_confianza' || p.origenDeteccion === 'ambas'
  ).length;
  const totalEnviadoAgentePorRiesgo = rescatables.filter(
    p => p.origenDeteccion === 'candidato_riesgo' || p.origenDeteccion === 'ambas'
  ).length;

  const slotsPreparados = slots.map(slot => {
    const roiBase64 = B1_recortarROI(canvas, slot.boundingPoly, B1_CONFIG.ROI_MARGIN_PX);
    const contexto = B1_construirContexto(slot, ventana);
    const clave = slot.pageIndex + ':' + slot.blockIndex + ':' + slot.wordIndex;
    const decision = mapaDecision[clave] || 'enviado_agente_contexto_critico';

    return {
      slotId:          slot.slotId,
      textoOriginal:   slot.textoOriginal,
      confidence:      slot.confidence,
      contexto,
      roiBase64,
      boundingPoly:    slot.boundingPoly,
      pageIndex:       slot.pageIndex,
      blockIndex:      slot.blockIndex,
      wordIndex:       slot.wordIndex,
      origenDeteccion: slot.origenDeteccion || 'dudosa_confianza',
      categoria:       _B1_resolverCategoriaDesdeDecision(decision)
    };
  });

  return {
    totalDudas:                    (palabrasDudosas || []).length,
    totalCandidatosRiesgo:         (candidatosRiesgo || []).length,
    totalEntradasSelector:         listaUnificada.length,
    totalDedupe:                   totalDedupe,
    totalRescatables:              rescatables.length,
    totalSlots:                    slotsPreparados.length,
    totalEnviadoAgentePorConfianza,
    totalEnviadoAgentePorRiesgo,
    maxSlots:                      config.maxSlots,
    truncado:                      rescatables.length > config.maxSlots,
    selectorOCR:                   selector.selectorOCR,
    slots:                         slotsPreparados
  };
}
