/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 · SELECTOR CERRADO A/B
 * ═══════════════════════════════════════════════════════════════
 * Alcance oficial:
 * - A: alérgenos / familias / variantes aprobadas
 * - B: peso / litros / pack / formato
 *
 * Fuera de alcance:
 * - nombre de producto
 * - contexto crítico abierto
 * - derivados culinarios no aprobados
 *
 * Filosofía:
 * - solo pasan al agente tokens del universo A o B
 * - y solo si realmente necesitan rescate
 * - no se inventan categorías nuevas por contexto
 * ═══════════════════════════════════════════════════════════════
 */

let _b1SlotCounter = 0;

function _resetSlotCounter() {
  _b1SlotCounter = 0;
}

function _nextSlotId() {
  _b1SlotCounter++;
  return `B${_b1SlotCounter}`;
}

function _B1_mapearCategoriaRescate(decision) {
  switch (decision) {
    case 'enviado_agente_familia':
      return 'familia';
    case 'enviado_agente_peso_formato':
      return 'peso_formato';
    default:
      return 'desconocida';
  }
}

function B1_mapearCategoria(decision) {
  return _B1_mapearCategoriaRescate(decision);
}

const B1_FAMILIAS_PRIORITARIAS = [
  {
    id: 'gluten',
    stems: [
      'gluten', 'trigo', 'wheat', 'ble', 'blé', 'cebada', 'barley',
      'centeno', 'rye', 'avena', 'oats', 'espelta', 'kamut'
    ]
  },
  {
    id: 'leche',
    stems: [
      'leche', 'leite', 'milk', 'lait', 'lacteo', 'lacteos', 'lácteo', 'lácteos',
      'lactosa', 'lactose', 'caseina', 'caseína', 'casein', 'caseine',
      'suero', 'whey', 'dairy'
    ]
  },
  {
    id: 'huevo',
    stems: [
      'huevo', 'huevos', 'egg', 'eggs', 'oeuf', 'oeufs', 'ovo', 'ovos',
      'albumina', 'albúmina', 'ovalbumina', 'ovalbumin'
    ]
  },
  {
    id: 'soja',
    stems: ['soja', 'soya', 'soy']
  },
  {
    id: 'pescado',
    stems: ['pescado', 'fish', 'poisson', 'peixe']
  },
  {
    id: 'crustaceos',
    stems: [
      'crustaceos', 'crustáceos', 'crustaceo', 'crustáceo', 'crustaces', 'crustace',
      'shrimp', 'prawn', 'prawns', 'crevette', 'crevettes',
      'camaron', 'camaron', 'camarones', 'gamba', 'gambas',
      'langostino', 'langostinos'
    ]
  },
  {
    id: 'moluscos',
    stems: [
      'moluscos', 'molusco', 'mollusc', 'molluscs', 'mollusc', 'mollusque',
      'mejillon', 'mejillones', 'mexilhao', 'mexilhão', 'calamar', 'pulpo', 'sepia'
    ]
  },
  {
    id: 'cacahuete',
    stems: ['cacahuete', 'cacahuetes', 'peanut', 'peanuts', 'arachide', 'arachid']
  },
  {
    id: 'frutos_secos',
    stems: [
      'almendra', 'almendras', 'amande', 'amandes', 'almond', 'almonds',
      'avellana', 'avellanas', 'hazelnut', 'hazelnuts',
      'nuez', 'nueces', 'walnut', 'walnuts',
      'pistacho', 'pistachos', 'pistachio', 'pistachios',
      'anacardo', 'anacardos', 'cashew', 'cashews'
    ]
  },
  {
    id: 'apio',
    stems: ['apio', 'celery', 'celeri', 'céleri']
  },
  {
    id: 'mostaza',
    stems: ['mostaza', 'mustard', 'moutarde', 'mostarda']
  },
  {
    id: 'sesamo',
    stems: ['sesamo', 'sésamo', 'sesame', 'gergelim']
  },
  {
    id: 'sulfitos',
    stems: [
      'sulfito', 'sulfitos', 'sulfite', 'sulfites', 'sulphite', 'sulphites',
      'bisulfito', 'bisulfite', 'metabisulfito', 'metabisulfite'
    ]
  },
  {
    id: 'altramuz',
    stems: ['altramuz', 'altramuces', 'lupin', 'lupins', 'lupino']
  }
];

const B1_PALABRAS_PESO_FORMATO = [
  'peso', 'neto', 'liquido', 'líquido', 'weight', 'poids', 'poidsnet', 'netweight',
  'kg', 'g', 'gr', 'mg', 'ml', 'cl', 'dl', 'l', 'lt', 'lts',
  'pack', 'packs', 'formato', 'unidad', 'unidades', 'ud', 'uds', 'x'
];

const B1_CONTEXTO_INGREDIENTES = [
  'ingredientes', 'ingrediente', 'ingredients', 'ingredient',
  'trazas', 'traza', 'contiene', 'contener', 'contains', 'may contain',
  'puede contener', 'vestigios', 'alergen', 'allergen', 'allergens'
];

const B1_CONTEXTO_NUTRICIONAL = [
  'informacion nutric', 'información nutric', 'nutric', 'nutrition',
  'valor energetic', 'valor energético', 'energia', 'energia',
  'kcal', 'kj', 'grasas', 'lipidos', 'hidratos', 'azucares', 'azúcares',
  'proteinas', 'proteínas', 'sal'
];

const B1_CONTEXTO_PESO = [
  'peso net', 'peso neto', 'peso', 'poids net', 'poids', 'net weight',
  'contenido neto', 'pack', 'formato', 'unidad', 'unidades'
];

const B1_CONTEXTO_IRRELEVANTE = [
  'lote', 'lot', 'rgseaa', 'rsseaa', 'fabricado', 'elaborado', 'producido',
  'distribuido', 'conservar', 'consumir preferentemente', 'antes del fin',
  'telefono', 'correo', 'www', 'http'
];

const B1_STOPWORDS_RUIDO = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'o', 'u', 'con', 'sin',
  'para', 'por', 'en', 'al', 'a', 'do', 'da', 'dos', 'das', 'and', 'or',
  'et', 'ou', 'the', 'of', 'una', 'uno', 'un'
]);

const B1_EXCLUSION_NO_PRIORITARIA = new Set([
  'queso', 'quesos', 'queijo', 'queijos', 'mantequilla', 'butter', 'nata', 'cream',
  'yogur', 'yogurt', 'fromage', 'cheese',
  'polvo', 'caldo', 'sabor', 'aromas', 'especias', 'abrir', 'conservar',
  'consumir', 'preferentemente', 'antes', 'fin'
]);

const B1_UNIDADES_FORMATO = ['kg', 'g', 'gr', 'mg', 'ml', 'cl', 'dl', 'l', 'lt', 'lts'];
const B1_UNIDADES_FORMATO_SET = new Set(B1_UNIDADES_FORMATO);

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
  '!': ['i']
};

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
    '|': 'l',
    '!': 'i'
  };

  return [...t].map(ch => mapaOCR[ch] || ch).join('');
}

function _B1_compactarComparacion(texto) {
  return _B1_normalizarComparacion(texto).replace(/[^a-z0-9]/g, '');
}

function _B1_compactarSinCorreccionOCR(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9$@|!]/g, '');
}

function _B1_esBasuraPura(textoOriginal) {
  const texto = String(textoOriginal || '').trim();
  if (!texto) return true;
  const sinEspacios = texto.replace(/\s+/g, '');
  if (!sinEspacios) return true;
  if (!/[\p{L}\p{N}]/u.test(sinEspacios)) return true;
  if (/^[*\-_=~.,:;!?¡¿'"`´^|\\\/()[\]{}<>+%]+$/u.test(sinEspacios)) return true;
  return false;
}

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

function _B1_mismoInicio(a, b, n) {
  const s = String(a || '');
  const t = String(b || '');
  const nn = Number(n || 1);
  if (!s || !t || s.length < nn || t.length < nn) return false;
  return s.slice(0, nn) === t.slice(0, nn);
}

function _B1_mismoFinal(a, b, n) {
  const s = String(a || '');
  const t = String(b || '');
  const nn = Number(n || 2);
  if (!s || !t || s.length < nn || t.length < nn) return false;
  return s.slice(-nn) === t.slice(-nn);
}

function _B1_longitudCompatible(a, b, maxDiff) {
  return Math.abs(String(a || '').length - String(b || '').length) <= Number(maxDiff || 1);
}

function _B1_generarVariantesOCR(tokenOriginal) {
  const base = String(tokenOriginal || '');
  const norm = _B1_normalizarComparacion(base);
  const variantes = new Set();
  const compacto = _B1_compactarComparacion(base);
  if (compacto) variantes.add(compacto);

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

function _B1_esTokenRaroOCR(textoOriginal) {
  const texto = String(textoOriginal || '');
  if (!texto.trim()) return false;
  if (/[0-9]/.test(texto) && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/u.test(texto)) return true;
  if (/[@$|!]/.test(texto)) return true;
  return false;
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
  return p && p.bloque && typeof p.bloque.texto === 'string' ? p.bloque.texto : '';
}

function _B1_incluyeAlguna(textoNormalizado, lista) {
  return (lista || []).some(k => textoNormalizado.includes(_B1_normalizarComparacion(k)));
}

function _B1_deducirContextoSemantico(p) {
  const bloqueTexto = _B1_obtenerTextoBloque(p);
  const bloqueNorm = _B1_normalizarComparacion(bloqueTexto);
  const prev = _B1_normalizarComparacion(_B1_obtenerTextoVecino(p, -1));
  const next = _B1_normalizarComparacion(_B1_obtenerTextoVecino(p, 1));
  const alrededor = `${prev} ${bloqueNorm} ${next}`.trim();

  const ingredientesRaw = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_INGREDIENTES);
  const nutricionalRaw = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_NUTRICIONAL);
  const pesoRaw = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_PESO);
  const irrelevanteRaw = _B1_incluyeAlguna(alrededor, B1_CONTEXTO_IRRELEVANTE);

  let zona = 'neutral';
  if (ingredientesRaw) zona = 'ingredientes_alergenos';
  else if (pesoRaw) zona = 'peso_formato';
  else if (nutricionalRaw) zona = 'nutricional';
  else if (irrelevanteRaw) zona = 'irrelevante';

  return {
    zona,
    ingredientesRaw,
    alergenosRaw: ingredientesRaw,
    nutricionalRaw,
    pesoRaw,
    irrelevanteRaw,
    bloqueNorm,
    blockWordCount: Array.isArray(p && p.bloque && p.bloque.palabras) ? p.bloque.palabras.length : 0
  };
}

function _B1_esDatoNoNombreNiFamilia(textoOriginal, tokenCompacto) {
  const original = String(textoOriginal || '').trim();
  const token = String(tokenCompacto || '').trim();
  if (!original && !token) return false;
  if (/^\d{1,2}[:/-]\d{1,2}([:/-]\d{2,4})?$/.test(original)) return true;
  if (/^\d+([.,]\d+)?%$/.test(original)) return true;
  if (/^\d+([.,]\d+)?$/.test(original)) return true;
  if (/^\d+([.,]\d+)?\s?(kg|g|gr|mg|ml|cl|dl|l|lt|lts|kj|kcal|cal|ºc|°c)$/i.test(original)) return true;
  if (/^\d+[a-z]{1,4}$/i.test(token)) return true;
  return false;
}

function _B1_esUnidadExacta(tokenCompacto) {
  return B1_UNIDADES_FORMATO_SET.has(String(tokenCompacto || '').toLowerCase());
}

function _B1_esFormatoExacto(tokenOriginal) {
  const t = String(tokenOriginal || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!t) return false;
  if (/^\d+([.,]\d+)?(kg|g|gr|mg|ml|cl|dl|l|lt|lts)$/.test(t)) return true;
  if (/^\d+[x×]\d+([.,]\d+)?(kg|g|gr|mg|ml|cl|dl|l|lt|lts)?$/.test(t)) return true;
  if (/^\d+(ud|uds|unidad|unidades)$/.test(t)) return true;
  return false;
}

function _B1_hayContextoFormato(p) {
  const contexto = _B1_deducirContextoSemantico(p);
  if (contexto.zona === 'peso_formato') return true;
  const prev = _B1_compactarComparacion(_B1_obtenerTextoVecino(p, -1));
  const next = _B1_compactarComparacion(_B1_obtenerTextoVecino(p, 1));
  const actual = _B1_compactarComparacion(p && p.texto);
  return B1_PALABRAS_PESO_FORMATO.includes(prev) || B1_PALABRAS_PESO_FORMATO.includes(next) || B1_PALABRAS_PESO_FORMATO.includes(actual);
}

function _B1_normalizarFormatoOCR(texto) {
  let t = String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/×/g, 'x')
    .replace(/\s+/g, '');

  // Ocr típico en formatos: 6x2O0g -> 6x200g
  t = t.replace(/(?<=\d)o(?=\d)/g, '0');

  // Ocr típico en litros: 1,5I -> 1,5l
  t = t.replace(/(?<=\d(?:[.,]\d+)?)i(?=$|kg|g|gr|mg|ml|cl|dl|l|lt|lts)/g, 'l');
  t = t.replace(/(?<=\d(?:[.,]\d+)?)\|(?=$|kg|g|gr|mg|ml|cl|dl|l|lt|lts)/g, 'l');

  return t;
}

function _B1_tieneEstructuraComercialFormato(textoOriginal, prev, next) {
  const t = String(textoOriginal || '').trim().toLowerCase().replace(/\s+/g, '');
  const prevTxt = String(prev || '').toLowerCase();
  const nextTxt = String(next || '').toLowerCase();

  if (!t) return false;
  if (/^\d+([.,]\d+)?(kg|g|gr|mg|ml|cl|dl|l|lt|lts)$/.test(t)) return true;
  if (/^\d+[x×]\d+([.,]\d+)?(kg|g|gr|mg|ml|cl|dl|l|lt|lts)?$/.test(t)) return true;
  if (/^\d+(ud|uds|unidad|unidades)$/.test(t)) return true;
  if (/^(kg|g|gr|mg|ml|cl|dl|l|lt|lts|ud|uds|unidad|unidades)$/.test(t)) return /^\d+([.,]\d+)?$/.test(prevTxt) || /^\d+([.,]\d+)?$/.test(nextTxt);
  if (/^\d+([.,]\d+)?[a-z]{1,4}$/.test(t) && /(kg|g|gr|mg|ml|cl|dl|l|lt|lts|ud|uds)$/.test(t)) return true;
  if (/^[a-z]{1,4}$/.test(t) && (/^\d+([.,]\d+)?$/.test(prevTxt) || /^\d+([.,]\d+)?$/.test(nextTxt))) return true;
  if (/[x×]/.test(t) && /\d/.test(t)) return true;

  return false;
}

function _B1_esCodigoNoComercialFormato(textoOriginal, contexto) {
  const t = String(textoOriginal || '').trim().toLowerCase();
  const compact = t.replace(/\s+/g, '');

  if (!t) return false;

  if (/^(l|lot|lote)\s*[:\-]/.test(t)) return true;
  if (/^\d{1,2}[\/.-]\d{2,4}$/.test(compact)) return true;
  if (/^\d{1,2}[:]\d{2}$/.test(compact)) return true;
  if (/^\(?\d{2,}[./-]\d{2,}[a-z]?\)?$/.test(compact) && !/(kg|g|gr|mg|ml|cl|dl|l|lt|lts)$/.test(compact)) return true;
  if (/\//.test(compact) && !/(kg|g|gr|mg|ml|cl|dl|l|lt|lts|ud|uds|unidad|unidades)/.test(compact)) return true;
  if (/^[a-z]{0,3}\d{4,}[a-z]{0,3}$/.test(compact) && !/(kg|g|gr|mg|ml|cl|dl|l|lt|lts|ud|uds)$/.test(compact)) return true;
  if (/^\d{4,}$/.test(compact) && contexto.zona !== 'peso_formato') return true;
  if (/^[a-z]{0,2}:\d{3,}$/.test(compact)) return true;

  return false;
}

function _B1_evaluarCandidatoFamiliaOCR(p) {
  const textoOriginal = String(p && p.texto || '').trim();
  const tokenRaw = _B1_compactarSinCorreccionOCR(textoOriginal);
  const tokenCompacto = _B1_compactarComparacion(textoOriginal);
  const contexto = _B1_deducirContextoSemantico(p);
  const tokenRaroOCR = _B1_esTokenRaroOCR(textoOriginal);

  const vacio = { aplica: false, score: 0, familia: null, matchedStem: null, motivo: null, evidencia: null, damage: null };

  if (!textoOriginal || _B1_esBasuraPura(textoOriginal)) return vacio;
  if (contexto.zona !== 'ingredientes_alergenos') return vacio;
  if (!tokenCompacto || tokenCompacto.length < 3) return vacio;
  if (_B1_esDatoNoNombreNiFamilia(textoOriginal, tokenCompacto)) return vacio;
  if (B1_STOPWORDS_RUIDO.has(tokenCompacto) || B1_EXCLUSION_NO_PRIORITARIA.has(tokenCompacto)) return vacio;

  let mejor = null;

  B1_FAMILIAS_PRIORITARIAS.forEach(familia => {
    familia.stems.forEach(stem => {
      const stemCompacto = _B1_compactarComparacion(stem);
      if (!stemCompacto || stemCompacto.length < 3) return;

      const variantes = _B1_generarVariantesOCR(textoOriginal);
      variantes.forEach(variante => {
        const dist = _B1_distanciaSimple(variante, stemCompacto);
        const mismoInicio2 = _B1_mismoInicio(variante, stemCompacto, 2);
        const mismoFinal2 = _B1_mismoFinal(variante, stemCompacto, 2);
        const longOk = _B1_longitudCompatible(variante, stemCompacto, 1);
        const incluye = stemCompacto.includes(variante) || variante.includes(stemCompacto);

        let matchType = null;
        let score = 0;
        let necesitaRescate = false;

        if (variante === stemCompacto) {
          if (tokenRaroOCR) {
            matchType = 'exacta_danada';
            score = 330;
            necesitaRescate = true;
          }
        } else if (incluye && variante.length >= 4) {
          matchType = 'subcadena';
          score = 300;
          necesitaRescate = true;
        } else if (dist === 1 && (mismoInicio2 || mismoFinal2 || tokenRaroOCR)) {
          matchType = 'distancia_1';
          score = 280;
          necesitaRescate = true;
        } else if (dist === 2 && mismoInicio2 && mismoFinal2 && longOk && tokenRaroOCR) {
          matchType = 'distancia_2_fuerte';
          score = 250;
          necesitaRescate = true;
        }

        if (!necesitaRescate) return;

        const candidato = {
          aplica: true,
          score,
          familia: familia.id,
          matchedStem: stem,
          motivo: matchType,
          evidencia: `${variante}->${stemCompacto}`,
          damage: {
            tipo: matchType,
            dist,
            mismoInicio2,
            mismoFinal2,
            longitudCompatible: longOk,
            tokenRaroOCR,
            tokenRaw,
            tokenCompacto,
            stem: stemCompacto
          }
        };

        if (!mejor || candidato.score > mejor.score) mejor = candidato;
      });
    });
  });

  return mejor || vacio;
}

function _B1_evaluarCandidatoFormatoOCR(p) {
  const textoOriginal = String(p && p.texto || '').trim();
  const tokenCompacto = _B1_compactarComparacion(textoOriginal);
  const tokenRaw = _B1_compactarSinCorreccionOCR(textoOriginal);
  const contexto = _B1_deducirContextoSemantico(p);
  const tokenRaroOCR = _B1_esTokenRaroOCR(textoOriginal);
  const prev = _B1_compactarComparacion(_B1_obtenerTextoVecino(p, -1));
  const next = _B1_compactarComparacion(_B1_obtenerTextoVecino(p, 1));
  const compactNoSpace = textoOriginal.toLowerCase().replace(/\s+/g, '');
  const compactNorm = _B1_normalizarFormatoOCR(compactNoSpace);

  const vacio = { aplica: false, score: 0, motivo: null, evidencia: null, damage: null };

  if (!textoOriginal || _B1_esBasuraPura(textoOriginal)) return vacio;
  if (_B1_esFormatoExacto(compactNoSpace)) return vacio;
  if (_B1_esCodigoNoComercialFormato(textoOriginal, contexto)) return vacio;

  const contextoFormato = _B1_hayContextoFormato(p);
  const estructuraComercial = _B1_tieneEstructuraComercialFormato(textoOriginal, prev, next);
  if (!estructuraComercial && !contextoFormato) return vacio;

  const numeroPuro = /^\d+([.,]\d+)?$/.test(textoOriginal);
  const unidadExacta = _B1_esUnidadExacta(tokenCompacto);

  if (unidadExacta && !tokenRaroOCR) return vacio;
  if (numeroPuro && (_B1_esUnidadExacta(prev) || _B1_esUnidadExacta(next)) && !tokenRaroOCR) return vacio;

  // Caso 1: medida compacta dañada: 2kqe / 1,5I / 6x2O0g
  if (/\d/.test(compactNoSpace)) {
    const exactaTrasNormalizar = _B1_esFormatoExacto(compactNorm);
    if (exactaTrasNormalizar && compactNorm !== compactNoSpace) {
      return {
        aplica: true,
        score: 310,
        motivo: 'formato_compacto_danado',
        evidencia: `${compactNoSpace}->${compactNorm}`,
        damage: { tipo: 'formato_compacto_danado', tokenRaw, tokenCompacto, normalizado: compactNorm }
      };
    }

    const mMedidaCompacta = compactNoSpace.match(/^(\d+(?:[.,]\d+)?)([a-z]{1,4})$/);
    if (mMedidaCompacta) {
      const sufijo = _B1_compactarComparacion(mMedidaCompacta[2]);
      let mejorSufijo = null;
      B1_UNIDADES_FORMATO.forEach(unidad => {
        const dist = _B1_distanciaSimple(sufijo, unidad);
        if (dist <= 1 || (dist === 2 && _B1_mismoInicio(sufijo, unidad, 1) && _B1_longitudCompatible(sufijo, unidad, 2))) {
          const candidato = {
            aplica: true,
            score: dist === 0 ? 300 : (dist === 1 ? 290 : 260),
            motivo: 'medida_compacta_unidad_danada',
            evidencia: `${sufijo}->${unidad}`,
            damage: { tipo: 'medida_compacta_unidad_danada', sufijo, unidad, dist, tokenRaw, tokenCompacto }
          };
          if (!mejorSufijo || candidato.score > mejorSufijo.score) mejorSufijo = candidato;
        }
      });
      if (mejorSufijo) return mejorSufijo;
    }
  }

  // Caso 2: unidad rota cerca de número: kqe / q / 1 + kqe
  if (/^[a-z0-9]{1,6}$/i.test(tokenRaw) && !numeroPuro) {
    let mejor = null;
    B1_UNIDADES_FORMATO.forEach(unidad => {
      const dist = _B1_distanciaSimple(tokenCompacto, unidad);
      if (dist === 0 && !tokenRaroOCR) return;
      if (dist <= 1 || (dist === 2 && _B1_mismoInicio(tokenCompacto, unidad, 1) && _B1_longitudCompatible(tokenCompacto, unidad, 2))) {
        const hayNumeroCerca = /^\d+([.,]\d+)?$/.test(prev) || /^\d+([.,]\d+)?$/.test(next);
        const contextoValido = contexto.zona === 'peso_formato' || hayNumeroCerca;
        if (!contextoValido) return;
        const candidato = {
          aplica: true,
          score: dist === 0 ? 300 : (dist === 1 ? 285 : 255),
          motivo: 'unidad_danada',
          evidencia: `${tokenCompacto}->${unidad}`,
          damage: { tipo: 'unidad_danada', unidad, dist, hayNumeroCerca, tokenRaroOCR, tokenRaw, tokenCompacto }
        };
        if (!mejor || candidato.score > mejor.score) mejor = candidato;
      }
    });
    if (mejor) return mejor;
  }

  // Caso 3: pack roto solo si mantiene estructura comercial clara
  if (_B1_tieneEstructuraComercialFormato(textoOriginal, prev, next) &&
      (/[x×]/i.test(textoOriginal) || /ud|uds|unidad|unidades/i.test(textoOriginal) || (/\d/.test(textoOriginal) && /[a-z]/i.test(textoOriginal) && tokenRaroOCR))) {
    return {
      aplica: true,
      score: 250,
      motivo: 'patron_formato_danado',
      evidencia: tokenCompacto || tokenRaw,
      damage: { tipo: 'patron_formato_danado', tokenRaw, tokenCompacto, tokenRaroOCR, normalizado: compactNorm }
    };
  }

  return vacio;
}

function _B1_aprobarFamiliaEnValidacionFinal(decision, palabraOriginal) {
  const evaluacion = _B1_evaluarCandidatoFamiliaOCR(palabraOriginal);
  return {
    aprobado: evaluacion.aplica,
    motivo: evaluacion.aplica ? 'familia_validada' : 'familia_rechazada_por_validacion_final',
    detalle: evaluacion.damage,
    contextoZona: _B1_deducirContextoSemantico(palabraOriginal).zona
  };
}

function _B1_aprobarPesoFormatoEnValidacionFinal(decision, palabraOriginal) {
  const evaluacion = _B1_evaluarCandidatoFormatoOCR(palabraOriginal);
  return {
    aprobado: evaluacion.aplica,
    motivo: evaluacion.aplica ? 'peso_formato_validado' : 'peso_formato_rechazado_por_validacion_final',
    detalle: evaluacion.damage,
    contextoZona: _B1_deducirContextoSemantico(palabraOriginal).zona
  };
}

function _B1_validarDecisionFinal(decision, palabraOriginal) {
  if (decision.decision === 'candidato_agente_familia') {
    return _B1_aprobarFamiliaEnValidacionFinal(decision, palabraOriginal);
  }
  if (decision.decision === 'candidato_agente_peso_formato') {
    return _B1_aprobarPesoFormatoEnValidacionFinal(decision, palabraOriginal);
  }
  return {
    aprobado: false,
    motivo: 'fuera_de_alcance',
    detalle: null,
    contextoZona: _B1_deducirContextoSemantico(palabraOriginal).zona
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

    if (validacion.aprobado) aprobadas.push(item);
    else {
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

function _B1_aplicarFiltroSospechaContextualAcumulada(pool) {
  return {
    rescatadas: [],
    descartadas: pool,
    auditoria: {
      nombreFiltro: 'FILTRO_DE_SOSPECHA_CONTEXTUAL_ACUMULADA',
      totalRevisadas: pool.length,
      totalRescatadas: 0,
      totalDescartadas: pool.length,
      rescatadas: [],
      descartadas: pool.map(x => ({
        textoOriginal: x.decision.textoOriginal,
        decisionFinal: x.decision.decision,
        familia: x.decision.familia || null,
        prioridad: x.decision.prioridad,
        sospechaContextualAcumulada: {
          nombreFiltro: 'FILTRO_DE_SOSPECHA_CONTEXTUAL_ACUMULADA',
          aprobado: false,
          motivo: 'filtro_desactivado_fuera_de_alcance',
          detalle: null
        }
      }))
    }
  };
}

function _B1_clasificarPalabraDudosa(p) {
  const textoOriginal = p && typeof p.texto === 'string' ? p.texto : '';
  const textoNormalizado = _B1_normalizarComparacion(textoOriginal);
  const contexto = _B1_deducirContextoSemantico(p);

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

  const familia = _B1_evaluarCandidatoFamiliaOCR(p);
  const formato = _B1_evaluarCandidatoFormatoOCR(p);

  if (familia.aplica && familia.score >= formato.score) {
    base.decision = 'candidato_agente_familia';
    base.motivo = familia.motivo;
    base.familia = familia.familia;
    base.prioridad = familia.score;
    base.matchedStem = familia.matchedStem;
    base.evidencia = familia.evidencia;
    return base;
  }

  if (formato.aplica) {
    base.decision = 'candidato_agente_peso_formato';
    base.motivo = formato.motivo;
    base.prioridad = formato.score;
    base.evidencia = formato.evidencia;
    return base;
  }

  base.decision = 'descartado_no_prioritario';
  base.motivo = 'fuera_de_alcance_o_ya_valido';
  return base;
}

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

  const decisiones = palabrasDudosas.map(p => _B1_clasificarPalabraDudosa(p));
  const items = decisiones.map((decision, idx) => ({ idx, decision, palabra: palabrasDudosas[idx] }));

  const candidatasBrutas = items.filter(x =>
    x.decision.decision === 'candidato_agente_familia' ||
    x.decision.decision === 'candidato_agente_peso_formato'
  );

  const filtroValidacionFinal = _B1_aplicarFiltroValidacionFinal(candidatasBrutas);
  const poolSospecha = items.filter(x =>
    x.decision.decision === 'descartado_validacion_final' ||
    x.decision.decision === 'descartado_no_prioritario'
  );
  const filtroSospechaContextual = _B1_aplicarFiltroSospechaContextualAcumulada(poolSospecha);

  const candidatas = [...filtroValidacionFinal.aprobadas];
  candidatas.sort((a, b) => {
    const pesoCatA = a.decision.decision === 'candidato_agente_familia' ? 2 : 1;
    const pesoCatB = b.decision.decision === 'candidato_agente_familia' ? 2 : 1;
    if (pesoCatB !== pesoCatA) return pesoCatB - pesoCatA;
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
    if (x.decision.decision === 'candidato_agente_peso_formato') x.decision.decision = 'enviado_agente_peso_formato';
  });

  porCupo.forEach(x => {
    x.decision.decision = 'descartado_por_cupo';
    x.decision.motivo = 'fuera_por_cupo_de_slots';
  });

  const descartadoBasura = decisiones.filter(d => d.decision === 'descartado_basura');
  const enviadoAgente = decisiones.filter(d => d.decision === 'enviado_agente_familia' || d.decision === 'enviado_agente_peso_formato');
  const descartadoNoPrioritario = decisiones.filter(d => d.decision === 'descartado_no_prioritario');
  const descartadoPorCupo = decisiones.filter(d => d.decision === 'descartado_por_cupo');
  const descartadoValidacionFinal = decisiones.filter(d => d.decision === 'descartado_validacion_final');

  return {
    seleccionadas: enviadas.map(x => x.palabra),
    selectorOCR: {
      totalDudas: palabrasDudosas.length,
      totalBasura: descartadoBasura.length,
      totalEnviadoAgente: enviadoAgente.length,
      totalNoPrioritario: descartadoNoPrioritario.length,
      totalDescartadoPorCupo: descartadoPorCupo.length,
      totalDescartadoValidacionFinal: descartadoValidacionFinal.length,
      totalRescatadoContextoCritico: 0,
      descartadoBasura,
      enviadoAgente,
      descartadoNoPrioritario,
      descartadoPorCupo,
      descartadoValidacionFinal,
      rescatadoContextoCritico: [],
      decisiones,
      validacionFinal: filtroValidacionFinal.auditoria,
      sospechaContextualAcumulada: filtroSospechaContextual.auditoria
    }
  };
}

function B1_filtrarDudasRescatables(palabrasDudosas, candidatosRiesgo, sensitivityMode) {
  if (typeof candidatosRiesgo === 'string') {
    sensitivityMode = candidatosRiesgo;
    candidatosRiesgo = [];
  }

  const config = B1_PRESUPUESTOS[sensitivityMode] || {};
  const mapaOrigen = {};

  (palabrasDudosas || []).forEach(p => {
    const clave = p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex;
    mapaOrigen[clave] = { palabra: p, origenDeteccion: 'dudosa_confianza' };
  });

  (candidatosRiesgo || []).forEach(p => {
    const clave = p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex;
    if (mapaOrigen[clave]) mapaOrigen[clave].origenDeteccion = 'ambas';
    else mapaOrigen[clave] = { palabra: p, origenDeteccion: 'candidato_riesgo' };
  });

  const listaUnificada = Object.values(mapaOrigen).map(entry => {
    entry.palabra.origenDeteccion = entry.origenDeteccion;
    return entry.palabra;
  });

  return _B1_ejecutarSelectorOCR(listaUnificada, sensitivityMode, config.maxSlots).seleccionadas;
}

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
    bloque: p.bloque,
    origenDeteccion: p.origenDeteccion || 'dudosa_confianza'
  }));
}

function B1_recortarROI(canvasOriginal, boundingPoly, margen) {
  if (!canvasOriginal || !boundingPoly || !boundingPoly.vertices || boundingPoly.vertices.length < 2) return null;
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

function B1_construirContexto(slot, ventana) {
  if (!slot.bloque || !slot.bloque.palabras) return `[[${slot.slotId}|${slot.textoOriginal}]]`;
  const palabras = slot.bloque.palabras;
  const idx = slot.wordIndex;
  const inicio = Math.max(0, idx - ventana);
  const fin = Math.min(palabras.length - 1, idx + ventana);
  const partes = [];
  for (let i = inicio; i <= fin; i++) {
    if (i === idx) partes.push(`[[${slot.slotId}|${slot.textoOriginal}]]`);
    else partes.push(palabras[i].texto);
  }
  return partes.join(' ');
}

function B1_getVentanaContexto(sensitivityMode) {
  switch (sensitivityMode) {
    case B1_SENSITIVITY.BAJA:
      return 3;
    case B1_SENSITIVITY.MEDIA:
      return 5;
    case B1_SENSITIVITY.ALTA:
      return 6;
    default:
      return 5;
  }
}

function B1_prepararLoteRescate(palabrasDudosas, candidatosRiesgo, canvas, sensitivityMode) {
  const config = B1_PRESUPUESTOS[sensitivityMode];
  const mapaOrigen = {};

  (palabrasDudosas || []).forEach(p => {
    const clave = p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex;
    mapaOrigen[clave] = { palabra: p, origenDeteccion: 'dudosa_confianza' };
  });

  (candidatosRiesgo || []).forEach(p => {
    const clave = p.pageIndex + ':' + p.blockIndex + ':' + p.wordIndex;
    if (mapaOrigen[clave]) mapaOrigen[clave].origenDeteccion = 'ambas';
    else mapaOrigen[clave] = { palabra: p, origenDeteccion: 'candidato_riesgo' };
  });

  const listaUnificada = Object.values(mapaOrigen).map(entry => {
    entry.palabra.origenDeteccion = entry.origenDeteccion;
    return entry.palabra;
  });

  const totalDedupe = (palabrasDudosas || []).length + (candidatosRiesgo || []).length - listaUnificada.length;
  const selector = _B1_ejecutarSelectorOCR(listaUnificada, sensitivityMode, config.maxSlots);
  const rescatables = selector.seleccionadas;
  const slots = B1_crearSlots(rescatables, config.maxSlots);
  const ventana = B1_getVentanaContexto(sensitivityMode);

  const mapaCategoria = {};
  if (selector.selectorOCR && Array.isArray(selector.selectorOCR.enviadoAgente)) {
    selector.selectorOCR.enviadoAgente.forEach(d => {
      const clave = d.pageIndex + ':' + d.blockIndex + ':' + d.wordIndex;
      mapaCategoria[clave] = _B1_mapearCategoriaRescate(d.decision);
    });
  }

  const slotsPreparados = slots.map(slot => {
    const roiBase64 = B1_recortarROI(canvas, slot.boundingPoly, B1_CONFIG.ROI_MARGIN_PX);
    const contexto = B1_construirContexto(slot, ventana);
    const clave = slot.pageIndex + ':' + slot.blockIndex + ':' + slot.wordIndex;
    return {
      slotId: slot.slotId,
      textoOriginal: slot.textoOriginal,
      confidence: slot.confidence,
      contexto,
      roiBase64,
      boundingPoly: slot.boundingPoly,
      pageIndex: slot.pageIndex,
      blockIndex: slot.blockIndex,
      wordIndex: slot.wordIndex,
      origenDeteccion: slot.origenDeteccion || 'dudosa_confianza',
      categoria: mapaCategoria[clave] || 'desconocida'
    };
  });

  return {
    totalDudas: (palabrasDudosas || []).length,
    totalCandidatosRiesgo: (candidatosRiesgo || []).length,
    totalEntradasSelector: listaUnificada.length,
    totalDedupe,
    totalRescatables: rescatables.length,
    totalSlots: slotsPreparados.length,
    totalEnviadoAgentePorConfianza: rescatables.filter(p => p.origenDeteccion === 'dudosa_confianza' || p.origenDeteccion === 'ambas').length,
    totalEnviadoAgentePorRiesgo: rescatables.filter(p => p.origenDeteccion === 'candidato_riesgo' || p.origenDeteccion === 'ambas').length,
    maxSlots: config.maxSlots,
    truncado: rescatables.length > config.maxSlots,
    selectorOCR: selector.selectorOCR,
    slots: slotsPreparados
  };
}
