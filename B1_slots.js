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
 *
 * Importante:
 * - No corrige texto final
 * - No decide negocio
 * - Solo decide qué merece llegar al agente
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
    stems: [
      'huevo', 'egg', 'oeuf', 'ovo', 'albumina', 'ovalbumina', 'ovalbumin'
    ]
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
  'peso', 'neto', 'poids', 'weight',
  'kg', 'g', 'gr', 'gram', 'grams',
  'ml', 'cl', 'l', 'litro', 'litros', 'litre', 'litres',
  'pack', 'formato', 'x', 'unidades', 'unidad', 'bandeja', 'botella'
];

const B1_STOPWORDS_NOMBRE = new Set([
  'desde', 'para', 'con', 'sin', 'por',
  'ingredientes', 'informacion', 'información', 'information',
  'nutritionnelle', 'valor', 'energetico', 'energetique',
  'producto', 'produit', 'puede', 'contener',
  'trazas', 'de', 'del', 'la', 'el', 'los', 'las'
]);


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

  // si no hay ni letras ni números, es basura pura
  if (!/[\p{L}\p{N}]/u.test(sinEspacios)) return true;

  // nube de signos
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


// ─── PUNTUAR FAMILIA PRIORITARIA ────────────────────────────
function _B1_puntuarFamiliaPrioritaria(tokenCompacto, tolerancia) {
  if (!tokenCompacto || tokenCompacto.length < 3) {
    return { score: 0, familia: null, motivo: null, matchedStem: null };
  }

  let mejor = { score: 0, familia: null, motivo: null, matchedStem: null };

  B1_FAMILIAS_PRIORITARIAS.forEach(familia => {
    familia.stems.forEach(stem => {
      const stemCompacto = _B1_compactarComparacion(stem);
      if (!stemCompacto) return;

      let score = 0;
      let motivo = null;

      if (tokenCompacto === stemCompacto) {
        score = 320;
        motivo = 'coincidencia_exacta_familia';
      } else if (tokenCompacto.includes(stemCompacto) || stemCompacto.includes(tokenCompacto)) {
        score = 280;
        motivo = 'subcadena_familia';
      } else {
        const dist = _B1_distanciaSimple(tokenCompacto, stemCompacto);
        if (dist <= tolerancia) {
          score = 240 - (dist * 20);
          motivo = 'parecido_familia';
        }
      }

      if (score > mejor.score) {
        mejor = {
          score,
          familia: familia.id,
          motivo,
          matchedStem: stem
        };
      }
    });
  });

  return mejor;
}


// ─── PUNTUAR PESO / FORMATO / PACK ──────────────────────────
function _B1_puntuarPesoFormato(p, tokenOriginal, tokenCompacto) {
  const texto = String(tokenOriginal || '').trim();
  const bloqueTexto = p && p.bloque && typeof p.bloque.texto === 'string' ? p.bloque.texto : '';
  const bloqueNorm = _B1_normalizarComparacion(bloqueTexto);
  const contextoNorm = _B1_normalizarComparacion([
    _B1_obtenerTextoVecino(p, -1),
    texto,
    _B1_obtenerTextoVecino(p, 1)
  ].join(' '));

  let score = 0;
  let motivo = null;

  if (/^\d+[x×]\d+([.,]\d+)?$/i.test(texto)) {
    score = 280;
    motivo = 'formato_pack';
  }

  if (/^\d+([.,]\d+)?(kg|g|gr|ml|cl|l)$/i.test(tokenCompacto)) {
    if (280 > score) {
      score = 280;
      motivo = 'medida_compacta';
    }
  }

  if (/^\d+([.,]\d+)?$/i.test(texto) && /(kg|g|gr|ml|cl|l)\b/.test(contextoNorm)) {
    if (250 > score) {
      score = 250;
      motivo = 'numero_con_unidad_vecina';
    }
  }

  if (/^(kg|g|gr|ml|cl|l)$/i.test(tokenCompacto) && /\d/.test(contextoNorm)) {
    if (240 > score) {
      score = 240;
      motivo = 'unidad_con_numero_vecino';
    }
  }

  const tienePalabraClave = B1_PALABRAS_PESO_FORMATO.some(k => bloqueNorm.includes(_B1_normalizarComparacion(k)));
  if (tienePalabraClave && (/\d/.test(tokenCompacto) || B1_PALABRAS_PESO_FORMATO.includes(tokenCompacto))) {
    if (220 > score) {
      score = 220;
      motivo = 'bloque_peso_formato';
    }
  }

  return { score, motivo };
}


// ─── PUNTUAR NOMBRE DE PRODUCTO ─────────────────────────────
function _B1_puntuarNombreProducto(p, tokenOriginal, tokenCompacto) {
  if (!p) return { score: 0, motivo: null };
  if ((p.pageIndex || 0) !== 0) return { score: 0, motivo: null };
  if ((p.blockIndex || 99) > 2) return { score: 0, motivo: null };
  if (!tokenCompacto || tokenCompacto.length < 4) return { score: 0, motivo: null };
  if (/\d/.test(tokenCompacto)) return { score: 0, motivo: null };
  if (B1_STOPWORDS_NOMBRE.has(tokenCompacto)) return { score: 0, motivo: null };

  let score = 0;

  if ((p.blockIndex || 99) === 0) score += 190;
  else if ((p.blockIndex || 99) === 1) score += 150;
  else score += 120;

  if (/^[A-ZÁÉÍÓÚÜÑÀÈÌÒÙÇ\-]+$/u.test(String(tokenOriginal || '').trim())) {
    score += 20;
  }

  return {
    score,
    motivo: 'zona_nombre_producto'
  };
}


// ─── CLASIFICAR UNA PALABRA DUDOSA ──────────────────────────
function _B1_clasificarPalabraDudosa(p, sensitivityMode) {
  const textoOriginal = (p && typeof p.texto === 'string') ? p.texto : '';
  const textoNormalizado = _B1_normalizarComparacion(textoOriginal);
  const tokenCompacto = _B1_compactarComparacion(textoOriginal);
  const tolerancia = sensitivityMode === B1_SENSITIVITY.ALTA ? 2 : 1;

  const base = {
    textoOriginal,
    textoNormalizado,
    pageIndex: p && typeof p.pageIndex === 'number' ? p.pageIndex : null,
    blockIndex: p && typeof p.blockIndex === 'number' ? p.blockIndex : null,
    wordIndex: p && typeof p.wordIndex === 'number' ? p.wordIndex : null,
    decision: null,
    motivo: null,
    familia: null,
    prioridad: 0
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

  const familia = _B1_puntuarFamiliaPrioritaria(tokenCompacto, tolerancia);
  const peso = _B1_puntuarPesoFormato(p, textoOriginal, tokenCompacto);
  const nombre = _B1_puntuarNombreProducto(p, textoOriginal, tokenCompacto);

  let ganador = { tipo: null, score: 0, motivo: null, familia: null };

  if (familia.score > ganador.score) {
    ganador = {
      tipo: 'familia',
      score: familia.score,
      motivo: familia.motivo,
      familia: familia.familia
    };
  }

  if (peso.score > ganador.score) {
    ganador = {
      tipo: 'peso_formato',
      score: peso.score,
      motivo: peso.motivo,
      familia: null
    };
  }

  if (nombre.score > ganador.score) {
    ganador = {
      tipo: 'nombre',
      score: nombre.score,
      motivo: nombre.motivo,
      familia: null
    };
  }

  if (ganador.score <= 0) {
    base.decision = 'descartado_no_prioritario';
    base.motivo = 'no_prioritario_para_la_app';
    return base;
  }

  if (ganador.tipo === 'familia') {
    base.decision = 'enviado_agente_familia';
    base.motivo = ganador.motivo;
    base.familia = ganador.familia;
    base.prioridad = ganador.score;
    return base;
  }

  if (ganador.tipo === 'peso_formato') {
    base.decision = 'enviado_agente_peso_formato';
    base.motivo = ganador.motivo;
    base.prioridad = ganador.score;
    return base;
  }

  base.decision = 'enviado_agente_nombre';
  base.motivo = ganador.motivo;
  base.prioridad = ganador.score;
  return base;
}


// ─── EJECUTAR SELECTOR OCR ──────────────────────────────────
function _B1_ejecutarSelectorOCR(palabrasDudosas, sensitivityMode) {
  if (!Array.isArray(palabrasDudosas) || palabrasDudosas.length === 0) {
    return {
      seleccionadas: [],
      selectorOCR: {
        totalDudas: 0,
        totalBasura: 0,
        totalEnviadoAgente: 0,
        totalNoPrioritario: 0,
        descartadoBasura: [],
        enviadoAgente: [],
        descartadoNoPrioritario: [],
        decisiones: []
      }
    };
  }

  const decisiones = [];
  const seleccionadas = [];

  palabrasDudosas.forEach(p => {
    const decision = _B1_clasificarPalabraDudosa(p, sensitivityMode);
    decisiones.push(decision);

    if (
      decision.decision === 'enviado_agente_familia' ||
      decision.decision === 'enviado_agente_peso_formato' ||
      decision.decision === 'enviado_agente_nombre'
    ) {
      seleccionadas.push({ palabra: p, prioridad: decision.prioridad });
    }
  });

  seleccionadas.sort((a, b) => {
    if (b.prioridad !== a.prioridad) return b.prioridad - a.prioridad;
    if ((a.palabra.pageIndex || 0) !== (b.palabra.pageIndex || 0)) {
      return (a.palabra.pageIndex || 0) - (b.palabra.pageIndex || 0);
    }
    if ((a.palabra.blockIndex || 0) !== (b.palabra.blockIndex || 0)) {
      return (a.palabra.blockIndex || 0) - (b.palabra.blockIndex || 0);
    }
    return (a.palabra.wordIndex || 0) - (b.palabra.wordIndex || 0);
  });

  const descartadoBasura = decisiones.filter(d => d.decision === 'descartado_basura');
  const enviadoAgente = decisiones.filter(d =>
    d.decision === 'enviado_agente_familia' ||
    d.decision === 'enviado_agente_peso_formato' ||
    d.decision === 'enviado_agente_nombre'
  );
  const descartadoNoPrioritario = decisiones.filter(d => d.decision === 'descartado_no_prioritario');

  return {
    seleccionadas: seleccionadas.map(x => x.palabra),
    selectorOCR: {
      totalDudas: palabrasDudosas.length,
      totalBasura: descartadoBasura.length,
      totalEnviadoAgente: enviadoAgente.length,
      totalNoPrioritario: descartadoNoPrioritario.length,
      descartadoBasura,
      enviadoAgente,
      descartadoNoPrioritario,
      decisiones
    }
  };
}


// ─── FILTRAR DUDAS RESCATABLES ──────────────────────────────
/**
 * Mantiene compatibilidad con el resto del módulo.
 * Devuelve solo las palabras que deben llegar al agente.
 */
function B1_filtrarDudasRescatables(palabrasDudosas, sensitivityMode) {
  return _B1_ejecutarSelectorOCR(palabrasDudosas, sensitivityMode).seleccionadas;
}


// ─── CREAR SLOTS INDEXADOS ──────────────────────────────────
/**
 * Se mantiene igual:
 * crea slots únicos para lo seleccionado.
 */
function B1_crearSlots(dudasRescatables, maxSlots) {
  _resetSlotCounter();

  const limitadas = dudasRescatables.slice(0, maxSlots);

  return limitadas.map(p => ({
    slotId:       _nextSlotId(),
    textoOriginal:p.texto,
    confidence:   p.confidence,
    boundingPoly: p.boundingPoly,
    pageIndex:    p.pageIndex,
    blockIndex:   p.blockIndex,
    wordIndex:    p.wordIndex,
    bloque:       p.bloque
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


// ─── PREPARAR LOTE COMPLETO PARA RESCATE ────────────────────
/**
 * Junta todo:
 * - selector
 * - slots
 * - ROI
 * - contexto
 *
 * Y devuelve también selectorOCR
 * para que aparezca en la Salida JSON del banco.
 */
function B1_prepararLoteRescate(palabrasDudosas, canvas, sensitivityMode) {
  const config = B1_PRESUPUESTOS[sensitivityMode];
  const selector = _B1_ejecutarSelectorOCR(palabrasDudosas, sensitivityMode);

  const rescatables = selector.seleccionadas;
  const slots = B1_crearSlots(rescatables, config.maxSlots);
  const ventana = B1_getVentanaContexto(sensitivityMode);

  const slotsPreparados = slots.map(slot => {
    const roiBase64 = B1_recortarROI(canvas, slot.boundingPoly, B1_CONFIG.ROI_MARGIN_PX);
    const contexto = B1_construirContexto(slot, ventana);

    return {
      slotId:        slot.slotId,
      textoOriginal: slot.textoOriginal,
      confidence:    slot.confidence,
      contexto,
      roiBase64,
      boundingPoly:  slot.boundingPoly,
      pageIndex:     slot.pageIndex,
      blockIndex:    slot.blockIndex
    };
  });

  return {
    totalDudas:       palabrasDudosas.length,
    totalRescatables: rescatables.length,
    totalSlots:       slotsPreparados.length,
    maxSlots:         config.maxSlots,
    truncado:         rescatables.length > config.maxSlots,
    selectorOCR:      selector.selectorOCR,
    slots:            slotsPreparados
  };
}
