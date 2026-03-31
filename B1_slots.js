
/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 5 · SLOTS, ROI Y CONTEXTO
 * ═══════════════════════════════════════════════════════════════
 * Selector Prioritario de Rescate OCR
 *
 * Objetivo:
 * - Quitar basura pura
 * - Priorizar familias críticas / peso-formato / nombre
 * - Añadir una vigilancia crítica MUY estrecha para casos tipo "hvo"
 * - No saturar al agente
 * ═══════════════════════════════════════════════════════════════
 */

// ─── CAPTURAR OCR NORMALIZADO RECIENTE ──────────────────────
(function _B1_instalarCapturaOCRGlobal() {
  if (typeof globalThis === 'undefined') return;
  if (globalThis.__B1_WRAP_NORMALIZAR_OCR_INSTALADO__) return;
  if (typeof globalThis.B1_normalizarOCR !== 'function') return;

  const original = globalThis.B1_normalizarOCR;
  globalThis.B1_normalizarOCR = function (...args) {
    const out = original.apply(this, args);
    globalThis.__B1_LAST_OCR_NORMALIZADO__ = out;
    return out;
  };
  globalThis.__B1_WRAP_NORMALIZAR_OCR_INSTALADO__ = true;
})();

// ─── CONTADOR GLOBAL DE SLOTS ───────────────────────────────
let _b1SlotCounter = 0;

function _resetSlotCounter() {
  _b1SlotCounter = 0;
}

function _nextSlotId() {
  _b1SlotCounter++;
  return `B${_b1SlotCounter}`;
}

// ─── FAMILIAS IMPORTANTES ───────────────────────────────────
const B1_FAMILIAS_PRIORITARIAS = [
  {
    id: 'gluten',
    stems: [
      'gluten', 'trigo', 'wheat', 'blé', 'ble', 'cebada', 'barley',
      'centeno', 'rye', 'avena', 'oats', 'espelta', 'kamut',
      'semola', 'sémola', 'semoule'
    ]
  },
  {
    id: 'leche',
    stems: [
      'leche', 'milk', 'lait', 'leite', 'lacteo', 'lácteo',
      'lactosa', 'lactose', 'caseina', 'caseine', 'casein',
      'caseinato', 'caseinate', 'suero', 'whey', 'queso',
      'cheese', 'fromage', 'butter', 'mantequilla', 'cream',
      'nata', 'yogur', 'yogurt'
    ]
  },
  {
    id: 'huevo',
    stems: ['huevo', 'ovo', 'egg', 'oeuf', 'albumina', 'ovalbumina', 'ovalbumin']
  },
  { id: 'soja', stems: ['soja', 'soya', 'soy'] },
  { id: 'pescado', stems: ['pescado', 'fish', 'poisson'] },
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
    stems: ['moluscos', 'molusco', 'mollusc', 'molluscs', 'moule', 'mejillon', 'mejillones', 'calamar', 'pulpo', 'sepia']
  },
  { id: 'cacahuete', stems: ['cacahuete', 'cacahuetes', 'peanut', 'peanuts', 'arachid', 'arachide'] },
  {
    id: 'frutos_secos',
    stems: [
      'frutos secos', 'fruto seco', 'almendra', 'almendras', 'avellana', 'avellanas',
      'nuez', 'nueces', 'pistacho', 'pistachos', 'anacardo', 'anacardos',
      'cashew', 'hazelnut', 'walnut', 'nut', 'nuts'
    ]
  },
  { id: 'apio', stems: ['apio', 'celery', 'celeri', 'céleri'] },
  { id: 'mostaza', stems: ['mostaza', 'mustard', 'moutarde'] },
  { id: 'sesamo', stems: ['sesamo', 'sésamo', 'sesame'] },
  {
    id: 'sulfitos',
    stems: ['sulfitos', 'sulfito', 'sulfites', 'sulphites', 'sulphite', 'metabisulfito', 'metabisulfit', 'disulfite']
  },
  { id: 'altramuz', stems: ['altramuz', 'altramuces', 'lupin', 'lupino', 'lupins'] }
];

const B1_PALABRAS_PESO_FORMATO = [
  'peso', 'p.net', 'pnet', 'neto', 'poids', 'weight', 'kg', 'g', 'gr', 'ml', 'cl', 'l',
  'litro', 'litros', 'litre', 'litres', 'pack', 'formato', 'x', 'unidades', 'unidad',
  'bandeja', 'botella'
];

const B1_STOPWORDS_NOMBRE = new Set([
  'desde', 'para', 'con', 'sin', 'por', 'ingredientes', 'informacion', 'información',
  'information', 'nutritionnelle', 'valor', 'energetico', 'energético', 'energetique',
  'producto', 'produit', 'puede', 'contener', 'trazas', 'de', 'del', 'la', 'el', 'los', 'las'
]);

const B1_CONTEXTO_INGREDIENTES = ['ingred', 'ingredient'];
const B1_CONTEXTO_ALERGENOS = [
  'alerg', 'allerg', 'allergen', 'trazas', 'contener', 'contiene', 'contains',
  'contain', 'may contain', 'peut contenir', 'pode conter', 'contém',
  'manipula', 'manipulado', 'mayuscul', 'mayúscul'
];
const B1_CONTEXTO_NUTRICIONAL = [
  'informacion nutric', 'información nutric', 'nutrition', 'valor energet',
  'kcal', 'grasas', 'hidratos', 'proteinas', 'proteínas', 'protein', 'sal', 'por 100', 'pour 100'
];
const B1_CONTEXTO_PESO = ['p.net', 'pnet', 'peso net', 'poids net', 'net weight', 'contenido neto', 'peso'];
const B1_CONTEXTO_IRRELEVANTE = [
  'lote', 'lot', 'rgseaa', 'rsseaa', 'elaborado por', 'fabricado por', 'conservar',
  'consumir preferentemente', 'antes del fin', 'c/', 's.l', 's.a', 'origin',
  'fecha de produccion', 'production date', 'best before', 'ref:'
];

// Solo para rescate forzado crítico
const B1_MAX_FORZADOS_CRITICOS = 2;
const B1_TOLERANCIA_FAMILIA_CRITICA = 1;

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

function _B1_compactarBruto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
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

// ─── UTILIDADES ─────────────────────────────────────────────
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

function _B1_bigramas(texto) {
  const t = String(texto || '');
  const out = new Set();
  if (t.length < 2) return out;
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
  return out;
}

function _B1_tieneSolapeBigramas(a, b) {
  const A = _B1_bigramas(a);
  const B = _B1_bigramas(b);
  if (!A.size || !B.size) return false;
  for (const bg of A) {
    if (B.has(bg)) return true;
  }
  return false;
}

function _B1_esSoloNumerico(textoOriginal) {
  const texto = String(textoOriginal || '').trim();
  return !!texto && /^\d+([.,]\d+)?$/.test(texto);
}

function _B1_contarTipoCaracteres(textoOriginal) {
  const texto = String(textoOriginal || '');
  const letras = (texto.match(/[A-Za-zÁÉÍÓÚÜÑÀÈÌÒÙÇáéíóúüñàèìòùç]/g) || []).length;
  const digitos = (texto.match(/\d/g) || []).length;
  return { letras, digitos };
}

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

function _B1_clonarBounding(vertices) {
  return {
    vertices: (vertices || []).map(v => ({ x: v.x || 0, y: v.y || 0 }))
  };
}

function _B1_unionBoundingPolys(words) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let count = 0;

  words.forEach(w => {
    const bp = w && w.boundingPoly;
    const verts = bp && Array.isArray(bp.vertices) ? bp.vertices : [];
    verts.forEach(v => {
      const x = v.x || 0;
      const y = v.y || 0;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      count++;
    });
  });

  if (!count) return null;

  return _B1_clonarBounding([
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY }
  ]);
}

// ─── CONTEXTO SEMÁNTICO ─────────────────────────────────────
function _B1_deducirContextoSemantico(p) {
  const bloqueTexto = _B1_obtenerTextoBloque(p);
  const bloqueNorm = _B1_normalizarComparacion(bloqueTexto);
  const prev = _B1_normalizarComparacion(_B1_obtenerTextoVecino(p, -1));
  const next = _B1_normalizarComparacion(_B1_obtenerTextoVecino(p, 1));
  const alrededor = `${prev} ${bloqueNorm} ${next}`.trim();

  const ingredientes = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_INGREDIENTES);
  const alergenos = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_ALERGENOS);
  const nutricional = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_NUTRICIONAL);
  const peso = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_PESO);
  const irrelevante = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_IRRELEVANTE);

  let zona = 'neutral';
  if (ingredientes || alergenos) zona = 'ingredientes_alergenos';
  else if (peso) zona = 'peso_formato';
  else if (nutricional) zona = 'nutricional';
  else if (irrelevante) zona = 'irrelevante';

  return {
    ingredientes,
    alergenos,
    nutricional,
    peso,
    irrelevante,
    zona,
    bloqueNorm,
    blockWordCount: Array.isArray(p && p.bloque && p.bloque.palabras) ? p.bloque.palabras.length : 0
  };
}

// ─── PUNTUAR FAMILIA PRIORITARIA ────────────────────────────
function _B1_puntuarFamiliaPrioritaria(p, tokenCompacto, contexto, tolerancia, opts = {}) {
  const opciones = Object.assign({
    permitirExactaNormalizada: true,
    bonusCritico: 0,
    exigirZonaCritica: false
  }, opts || {});

  if (!tokenCompacto || tokenCompacto.length < 3) {
    return { score: 0, familia: null, motivo: null, matchedStem: null, evidencia: null };
  }

  if (opciones.exigirZonaCritica && !(contexto.ingredientes || contexto.alergenos)) {
    return { score: 0, familia: null, motivo: null, matchedStem: null, evidencia: null };
  }

  if (_B1_esSoloNumerico(p && p.texto)) {
    return { score: 0, familia: null, motivo: null, matchedStem: null, evidencia: null };
  }

  const tipoChars = _B1_contarTipoCaracteres(p && p.texto);
  if (tipoChars.letras < 2) {
    return { score: 0, familia: null, motivo: null, matchedStem: null, evidencia: null };
  }

  const rawCompact = _B1_compactarBruto(p && p.texto);
  let mejor = { score: 0, familia: null, motivo: null, matchedStem: null, evidencia: null };

  B1_FAMILIAS_PRIORITARIAS.forEach(familia => {
    familia.stems.forEach(stem => {
      const stemCompacto = _B1_compactarComparacion(stem);
      if (!stemCompacto) return;

      let score = 0;
      let motivo = null;

      if (opciones.permitirExactaNormalizada && tokenCompacto === stemCompacto && rawCompact !== stemCompacto) {
        score = 320 + opciones.bonusCritico;
        motivo = 'coincidencia_exacta_normalizada';
      } else {
        const dist = _B1_distanciaSimple(tokenCompacto, stemCompacto);
        const haySolape = _B1_tieneSolapeBigramas(tokenCompacto, stemCompacto);

        if (dist <= tolerancia && haySolape) {
          score = 240 + opciones.bonusCritico - (dist * 20);
          motivo = 'parecido_familia';
        } else if (
          tokenCompacto.length >= 4 &&
          (stemCompacto.startsWith(tokenCompacto) || tokenCompacto.startsWith(stemCompacto)) &&
          haySolape
        ) {
          score = 260 + opciones.bonusCritico;
          motivo = 'prefijo_familia';
        }
      }

      if (score > mejor.score) {
        mejor = {
          score,
          familia: familia.id,
          motivo,
          matchedStem: stem,
          evidencia: `actual:${tokenCompacto}`
        };
      }
    });
  });

  return mejor;
}

// ─── PUNTUAR PESO / FORMATO / PACK ──────────────────────────
function _B1_puntuarPesoFormato(p, tokenOriginal, tokenCompacto, contexto) {
  if (contexto.nutricional) return { score: 0, motivo: null, evidencia: null };

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
    (contexto.peso || /(peso|neto|poids|weight|p\.?net)/.test(contexto.bloqueNorm))
  ) {
    if (260 > score) {
      score = 260;
      motivo = 'numero_con_unidad_comercial';
      evidencia = contextoLocal;
    }
  }

  if (/^(kg|g|gr|ml|cl|l)$/i.test(tokenCompacto) && /\d/.test(contextoLocal) && contexto.peso) {
    if (250 > score) {
      score = 250;
      motivo = 'unidad_con_numero_comercial';
      evidencia = contextoLocal;
    }
  }

  return { score, motivo, evidencia };
}

// ─── PUNTUAR NOMBRE DE PRODUCTO ─────────────────────────────
function _B1_puntuarNombreProducto(p, tokenOriginal, tokenCompacto, contexto) {
  if (!p) return { score: 0, motivo: null, evidencia: null };
  if (!tokenCompacto || tokenCompacto.length < 4) return { score: 0, motivo: null, evidencia: null };
  if (/\d/.test(tokenCompacto)) return { score: 0, motivo: null, evidencia: null };

  if (contexto.ingredientes || contexto.alergenos || contexto.nutricional || contexto.irrelevante || contexto.peso) {
    return { score: 0, motivo: null, evidencia: null };
  }

  if (B1_STOPWORDS_NOMBRE.has(tokenCompacto)) {
    return { score: 0, motivo: null, evidencia: null };
  }

  if (contexto.blockWordCount < 2 || contexto.blockWordCount > 5) {
    return { score: 0, motivo: null, evidencia: null };
  }

  const texto = String(tokenOriginal || '').trim();
  const mayusculas = texto.replace(/[^A-ZÁÉÍÓÚÜÑÀÈÌÒÙÇ]/gu, '').length;
  const letras = texto.replace(/[^A-Za-zÁÉÍÓÚÜÑÀÈÌÒÙÇáéíóúüñàèìòùç]/gu, '').length;
  const ratioMayusculas = letras > 0 ? mayusculas / letras : 0;

  let score = 0;
  if (ratioMayusculas >= 0.6) score = 140;
  else if (contexto.blockWordCount <= 3 && ratioMayusculas >= 0.3) score = 110;
  else return { score: 0, motivo: null, evidencia: null };

  return {
    score,
    motivo: 'nombre_por_exclusion',
    evidencia: `ratioMayusculas=${ratioMayusculas.toFixed(2)};blockWords=${contexto.blockWordCount}`
  };
}

// ─── CLASIFICAR PALABRA DUDOSA NORMAL ───────────────────────
function _B1_clasificarPalabraDudosa(p, sensitivityMode) {
  const textoOriginal = (p && typeof p.texto === 'string') ? p.texto : '';
  const textoNormalizado = _B1_normalizarComparacion(textoOriginal);
  const tokenCompacto = _B1_compactarComparacion(textoOriginal);
  const tolerancia = sensitivityMode === B1_SENSITIVITY.ALTA ? 2 : 1;
  const contexto = _B1_deducirContextoSemantico(p);

  const base = {
    textoOriginal,
    textoNormalizado,
    pageIndex: p && typeof p.pageIndex === 'number' ? p.pageIndex : null,
    blockIndex: p && typeof p.blockIndex === 'number' ? p.blockIndex : null,
    wordIndex: p && typeof p.wordIndex === 'number' ? p.wordIndex : null,
    decision: null,
    motivo: null,
    familia: null,
    prioridad: 0,
    matchedStem: null,
    evidencia: null,
    zona: contexto.zona
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

  const familia = _B1_puntuarFamiliaPrioritaria(p, tokenCompacto, contexto, tolerancia, {
    permitirExactaNormalizada: true,
    bonusCritico: 0,
    exigirZonaCritica: true
  });
  const peso = _B1_puntuarPesoFormato(p, textoOriginal, tokenCompacto, contexto);
  const nombre = _B1_puntuarNombreProducto(p, textoOriginal, tokenCompacto, contexto);

  let ganador = { tipo: null, score: 0, motivo: null, familia: null, matchedStem: null, evidencia: null };

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

// ─── EXTRACCIÓN OCR COMPLETO PARA VIGILANCIA CRÍTICA ───────
function _B1_extraerPalabrasOCR(ocrNormalizado) {
  const salida = [];
  if (!ocrNormalizado || typeof ocrNormalizado !== 'object') return salida;

  const pushBlock = (bloque, pageIndexDefault, blockIndexDefault) => {
    if (!bloque || !Array.isArray(bloque.palabras)) return;
    const blockIndex = Number.isFinite(bloque.blockIndex) ? bloque.blockIndex : blockIndexDefault;
    const pageIndex = Number.isFinite(bloque.pageIndex) ? bloque.pageIndex : pageIndexDefault;

    bloque.palabras.forEach((palabra, wordIndex) => {
      const texto = palabra && typeof palabra.texto === 'string' ? palabra.texto : '';
      salida.push({
        texto,
        confidence: palabra && typeof palabra.confidence === 'number' ? palabra.confidence : null,
        boundingPoly: palabra && palabra.boundingPoly ? palabra.boundingPoly : null,
        pageIndex,
        blockIndex,
        wordIndex: Number.isFinite(palabra && palabra.wordIndex) ? palabra.wordIndex : wordIndex,
        bloque
      });
    });
  };

  if (Array.isArray(ocrNormalizado.bloques)) {
    ocrNormalizado.bloques.forEach((bloque, idx) => pushBlock(bloque, 0, idx));
  }

  if (Array.isArray(ocrNormalizado.paginas)) {
    ocrNormalizado.paginas.forEach((pagina, pIdx) => {
      if (Array.isArray(pagina && pagina.bloques)) {
        pagina.bloques.forEach((bloque, bIdx) => pushBlock(bloque, pIdx, bIdx));
      }
    });
  }

  return salida;
}

function _B1_keyPalabra(p) {
  const start = Number.isFinite(p && p.spanStartIndex) ? p.spanStartIndex : (p && p.wordIndex);
  const end = Number.isFinite(p && p.spanEndIndex) ? p.spanEndIndex : (p && p.wordIndex);
  return [
    p && p.pageIndex != null ? p.pageIndex : 'x',
    p && p.blockIndex != null ? p.blockIndex : 'x',
    start != null ? start : 'x',
    end != null ? end : 'x',
    _B1_compactarBruto(p && p.texto)
  ].join(':');
}

function _B1_crearPalabraSintetica(words) {
  if (!Array.isArray(words) || !words.length) return null;
  const primera = words[0];
  const ultima = words[words.length - 1];

  return {
    texto: words.map(w => w.texto).join(' '),
    confidence: words.reduce((min, w) => {
      const c = typeof w.confidence === 'number' ? w.confidence : 1;
      return c < min ? c : min;
    }, 1),
    boundingPoly: _B1_unionBoundingPolys(words),
    pageIndex: primera.pageIndex,
    blockIndex: primera.blockIndex,
    wordIndex: primera.wordIndex,
    spanStartIndex: primera.wordIndex,
    spanEndIndex: ultima.wordIndex,
    bloque: primera.bloque
  };
}

function _B1_esContextoCriticoForzado(p) {
  const ctx = _B1_deducirContextoSemantico(p);
  return ctx.alergenos || (
    ctx.ingredientes &&
    (
      ctx.bloqueNorm.includes('puede contener') ||
      ctx.bloqueNorm.includes('may contain') ||
      ctx.bloqueNorm.includes('peut contenir') ||
      ctx.bloqueNorm.includes('pode conter') ||
      ctx.bloqueNorm.includes('contiene') ||
      ctx.bloqueNorm.includes('contains') ||
      ctx.bloqueNorm.includes('trazas')
    )
  );
}

function _B1_generarCandidatosVigilanciaCritica(ocrNormalizado, palabrasDudosas) {
  const todas = _B1_extraerPalabrasOCR(ocrNormalizado);
  const yaEnDudas = new Set((Array.isArray(palabrasDudosas) ? palabrasDudosas : []).map(_B1_keyPalabra));
  const out = [];
  const seen = new Set();

  const porBloque = new Map();
  todas.forEach(p => {
    const key = `${p.pageIndex}:${p.blockIndex}`;
    if (!porBloque.has(key)) porBloque.set(key, []);
    porBloque.get(key).push(p);
  });

  porBloque.forEach(words => {
    words.sort((a, b) => (a.wordIndex || 0) - (b.wordIndex || 0));

    for (let i = 0; i < words.length; i++) {
      const single = words[i];
      if (!_B1_esContextoCriticoForzado(single)) continue;

      const textoSingle = String(single.texto || '').trim();
      const compactSingle = _B1_compactarComparacion(textoSingle);

      if (_B1_esBasuraPura(textoSingle)) continue;
      if (_B1_esSoloNumerico(textoSingle)) continue;
      if (!compactSingle || compactSingle.length < 3 || compactSingle.length > 8) continue;

      const tipoChars = _B1_contarTipoCaracteres(textoSingle);
      if (tipoChars.letras < 2) continue;

      const candidata1 = _B1_crearPalabraSintetica([single]);
      const key1 = _B1_keyPalabra(candidata1);
      if (!yaEnDudas.has(key1) && !seen.has(key1)) {
        out.push(candidata1);
        seen.add(key1);
      }

      if (i + 1 < words.length) {
        const next = words[i + 1];
        const textoNext = String(next.texto || '').trim();
        if (!_B1_esBasuraPura(textoNext)) {
          const candidata2 = _B1_crearPalabraSintetica([single, next]);
          const compact2 = _B1_compactarComparacion(candidata2.texto);
          if (compact2.length >= 4 && compact2.length <= 10) {
            const key2 = _B1_keyPalabra(candidata2);
            if (!yaEnDudas.has(key2) && !seen.has(key2)) {
              out.push(candidata2);
              seen.add(key2);
            }
          }
        }
      }
    }
  });

  return out;
}

function _B1_clasificarVigilanciaCritica(p) {
  const textoOriginal = (p && typeof p.texto === 'string') ? p.texto : '';
  const textoNormalizado = _B1_normalizarComparacion(textoOriginal);
  const tokenCompacto = _B1_compactarComparacion(textoOriginal);
  const rawCompact = _B1_compactarBruto(textoOriginal);
  const contexto = _B1_deducirContextoSemantico(p);

  const base = {
    textoOriginal,
    textoNormalizado,
    pageIndex: p && typeof p.pageIndex === 'number' ? p.pageIndex : null,
    blockIndex: p && typeof p.blockIndex === 'number' ? p.blockIndex : null,
    wordIndex: p && typeof p.wordIndex === 'number' ? p.wordIndex : null,
    decision: null,
    motivo: null,
    familia: null,
    prioridad: 0,
    matchedStem: null,
    evidencia: null,
    zona: contexto.zona,
    forcedCritical: true
  };

  if (_B1_esBasuraPura(textoOriginal) || !tokenCompacto) {
    base.decision = 'descartado_no_prioritario';
    base.motivo = 'vigilancia_critica_sin_nucleo';
    return base;
  }

  if (!_B1_esContextoCriticoForzado(p)) {
    base.decision = 'descartado_no_prioritario';
    base.motivo = 'vigilancia_fuera_de_contexto_critico';
    return base;
  }

  const familia = _B1_puntuarFamiliaPrioritaria(p, tokenCompacto, contexto, B1_TOLERANCIA_FAMILIA_CRITICA, {
    permitirExactaNormalizada: true,
    bonusCritico: 60,
    exigirZonaCritica: true
  });

  if (familia.score <= 0) {
    base.decision = 'descartado_no_prioritario';
    base.motivo = 'vigilancia_critica_sin_match';
    return base;
  }

  const stemCompacto = _B1_compactarComparacion(familia.matchedStem);
  if (rawCompact === stemCompacto) {
    base.decision = 'descartado_no_prioritario';
    base.motivo = 'familia_ya_legible';
    return base;
  }

  base.decision = 'candidato_agente_familia';
  base.motivo = 'vigilancia_familia_critica';
  base.familia = familia.familia;
  base.prioridad = familia.score;
  base.matchedStem = familia.matchedStem;
  base.evidencia = familia.evidencia;
  return base;
}

// ─── EJECUTAR SELECTOR OCR ──────────────────────────────────
function _B1_ejecutarSelectorOCR(palabrasDudosas, ocrNormalizado, sensitivityMode, maxSlots) {
  const dudas = Array.isArray(palabrasDudosas) ? palabrasDudosas : [];
  const decisiones = dudas.map(p => _B1_clasificarPalabraDudosa(p, sensitivityMode));

  const candidatasNormales = decisiones
    .map((decision, idx) => ({ decision, palabra: dudas[idx] }))
    .filter(x =>
      x.decision.decision === 'candidato_agente_familia' ||
      x.decision.decision === 'candidato_agente_peso_formato' ||
      x.decision.decision === 'candidato_agente_nombre'
    );

  const familiaNormalPorBloque = new Set(
    candidatasNormales
      .filter(x => x.decision.decision === 'candidato_agente_familia')
      .map(x => `${x.decision.pageIndex}:${x.decision.blockIndex}:${x.decision.familia}`)
  );

  const candidatasForzadas = [];
  const palabrasForzadas = _B1_generarCandidatosVigilanciaCritica(ocrNormalizado, dudas);

  palabrasForzadas.forEach(p => {
    const decision = _B1_clasificarVigilanciaCritica(p);
    decisiones.push(decision);

    if (decision.decision === 'candidato_agente_familia') {
      const claveBloqueFamilia = `${decision.pageIndex}:${decision.blockIndex}:${decision.familia}`;
      if (!familiaNormalPorBloque.has(claveBloqueFamilia)) {
        candidatasForzadas.push({ decision, palabra: p });
      }
    }
  });

  candidatasForzadas.sort((a, b) => b.decision.prioridad - a.decision.prioridad);
  const candidatasForzadasCortas = candidatasForzadas.slice(0, B1_MAX_FORZADOS_CRITICOS);

  const todasCandidatas = candidatasNormales.concat(candidatasForzadasCortas);

  const dedupe = new Map();
  todasCandidatas.forEach(item => {
    const key = _B1_keyPalabra(item.palabra);
    const prev = dedupe.get(key);
    if (!prev || item.decision.prioridad > prev.decision.prioridad) {
      dedupe.set(key, item);
    }
  });

  const candidatasOrdenadas = Array.from(dedupe.values());
  candidatasOrdenadas.sort((a, b) => {
    if (b.decision.prioridad !== a.decision.prioridad) return b.decision.prioridad - a.decision.prioridad;
    if ((a.decision.pageIndex || 0) !== (b.decision.pageIndex || 0)) return (a.decision.pageIndex || 0) - (b.decision.pageIndex || 0);
    if ((a.decision.blockIndex || 0) !== (b.decision.blockIndex || 0)) return (a.decision.blockIndex || 0) - (b.decision.blockIndex || 0);
    return (a.decision.wordIndex || 0) - (b.decision.wordIndex || 0);
  });

  const limite = Number.isFinite(maxSlots) && maxSlots > 0 ? maxSlots : candidatasOrdenadas.length;
  const enviadas = candidatasOrdenadas.slice(0, limite);
  const porCupo = candidatasOrdenadas.slice(limite);

  enviadas.forEach(x => {
    if (x.decision.decision === 'candidato_agente_familia') x.decision.decision = 'enviado_agente_familia';
    else if (x.decision.decision === 'candidato_agente_peso_formato') x.decision.decision = 'enviado_agente_peso_formato';
    else x.decision.decision = 'enviado_agente_nombre';
  });

  porCupo.forEach(x => {
    x.decision.decision = 'descartado_por_cupo';
    x.decision.motivo = 'fuera_por_cupo_de_slots';
  });

  const descartadoBasura = decisiones.filter(d => d.decision === 'descartado_basura');
  const enviadoAgente = decisiones.filter(d =>
    d.decision === 'enviado_agente_familia' ||
    d.decision === 'enviado_agente_peso_formato' ||
    d.decision === 'enviado_agente_nombre'
  );
  const descartadoNoPrioritario = decisiones.filter(d => d.decision === 'descartado_no_prioritario');
  const descartadoPorCupo = decisiones.filter(d => d.decision === 'descartado_por_cupo');

  return {
    seleccionadas: enviadas.map(x => x.palabra),
    selectorOCR: {
      totalDudas: dudas.length,
      totalBasura: descartadoBasura.length,
      totalEnviadoAgente: enviadoAgente.length,
      totalNoPrioritario: descartadoNoPrioritario.length,
      totalDescartadoPorCupo: descartadoPorCupo.length,
      totalForzadoCritico: candidatasForzadasCortas.length,
      descartadoBasura,
      enviadoAgente,
      descartadoNoPrioritario,
      descartadoPorCupo,
      decisiones
    }
  };
}

// ─── FILTRAR DUDAS RESCATABLES ──────────────────────────────
function B1_filtrarDudasRescatables(palabrasDudosas, sensitivityMode) {
  const config = B1_PRESUPUESTOS[sensitivityMode] || {};
  const ocrNormalizado = (typeof globalThis !== 'undefined' && globalThis.__B1_LAST_OCR_NORMALIZADO__)
    ? globalThis.__B1_LAST_OCR_NORMALIZADO__
    : null;
  return _B1_ejecutarSelectorOCR(palabrasDudosas, ocrNormalizado, sensitivityMode, config.maxSlots).seleccionadas;
}

// ─── CREAR SLOTS INDEXADOS ──────────────────────────────────
function B1_crearSlots(dudasRescatables, maxSlots) {
  _resetSlotCounter();

  const limitadas = dudasRescatables.slice(0, maxSlots);

  return limitadas.map(p => ({
    slotId: _nextSlotId(),
    textoOriginal: p.texto,
    confidence: p.confidence,
    boundingPoly: p.boundingPoly,
    pageIndex: p.pageIndex,
    blockIndex: p.blockIndex,
    wordIndex: p.wordIndex,
    spanStartIndex: Number.isFinite(p.spanStartIndex) ? p.spanStartIndex : p.wordIndex,
    spanEndIndex: Number.isFinite(p.spanEndIndex) ? p.spanEndIndex : p.wordIndex,
    bloque: p.bloque
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
  const idxInicio = Number.isFinite(slot.spanStartIndex) ? slot.spanStartIndex : slot.wordIndex;
  const idxFin = Number.isFinite(slot.spanEndIndex) ? slot.spanEndIndex : slot.wordIndex;
  const inicio = Math.max(0, idxInicio - ventana);
  const fin = Math.min(palabras.length - 1, idxFin + ventana);

  const partes = [];

  for (let i = inicio; i <= fin; i++) {
    if (i === idxInicio) {
      partes.push(`[[${slot.slotId}|${slot.textoOriginal}]]`);
    } else if (i > idxInicio && i <= idxFin) {
      // ya representado por el span
    } else {
      partes.push(palabras[i].texto);
    }
  }

  return partes.join(' ');
}

// ─── VENTANA DE CONTEXTO POR SENSIBILIDAD ───────────────────
function B1_getVentanaContexto(sensitivityMode) {
  switch (sensitivityMode) {
    case B1_SENSITIVITY.BAJA: return 3;
    case B1_SENSITIVITY.MEDIA: return 5;
    case B1_SENSITIVITY.ALTA: return 8;
    default: return 5;
  }
}

// ─── PREPARAR LOTE COMPLETO PARA RESCATE ────────────────────
function B1_prepararLoteRescate(palabrasDudosas, canvas, sensitivityMode) {
  const config = B1_PRESUPUESTOS[sensitivityMode];
  const ocrNormalizado = (typeof globalThis !== 'undefined' && globalThis.__B1_LAST_OCR_NORMALIZADO__)
    ? globalThis.__B1_LAST_OCR_NORMALIZADO__
    : null;

  const selector = _B1_ejecutarSelectorOCR(palabrasDudosas, ocrNormalizado, sensitivityMode, config.maxSlots);

  const rescatables = selector.seleccionadas;
  const slots = B1_crearSlots(rescatables, config.maxSlots);
  const ventana = B1_getVentanaContexto(sensitivityMode);

  const slotsPreparados = slots.map(slot => {
    const roiBase64 = B1_recortarROI(canvas, slot.boundingPoly, B1_CONFIG.ROI_MARGIN_PX);
    const contexto = B1_construirContexto(slot, ventana);

    return {
      slotId: slot.slotId,
      textoOriginal: slot.textoOriginal,
      confidence: slot.confidence,
      contexto,
      roiBase64,
      boundingPoly: slot.boundingPoly,
      pageIndex: slot.pageIndex,
      blockIndex: slot.blockIndex
    };
  });

  return {
    totalDudas: Array.isArray(palabrasDudosas) ? palabrasDudosas.length : 0,
    totalRescatables: rescatables.length,
    totalSlots: slotsPreparados.length,
    maxSlots: config.maxSlots,
    truncado: rescatables.length > config.maxSlots,
    selectorOCR: selector.selectorOCR,
    slots: slotsPreparados
  };
}
