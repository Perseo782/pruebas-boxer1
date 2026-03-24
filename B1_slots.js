/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 5 · SLOTS, ROI Y CONTEXTO
 * ═══════════════════════════════════════════════════════════════
 * Sección 5.5, 5.6 y 9 de la orden de trabajo v4
 *
 * - Filtra dudas con esperanza real
 * - Asigna slotId único a cada una
 * - Recorta ROI con boundingPoly + margen de seguridad
 * - Construye contexto intrabloque por cada slot
 *
 * PROHIBIDO: mezclar bloques para fabricar contexto.
 * PROHIBIDO: reasignar slots por parecido textual.
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


// ─── FILTRAR DUDAS RESCATABLES ──────────────────────────────
/**
 * Sección 5.5: Filtro de rescate.
 * Solo las dudas con esperanza real pasan a rescate.
 * El ruido puro se elimina.
 *
 * Criterios de "esperanza real":
 * - La palabra tiene al menos algún carácter legible
 * - Su confianza no está en 0 absoluto (ruido puro)
 * - El bloque padre tiene al menos algo de texto legible alrededor
 * - No es una palabra de 1 carácter sin sentido
 *
 * @param {Array} palabrasDudosas - Del medidor de fiabilidad
 * @param {string} sensitivityMode
 * @returns {Array} Palabras que merecen rescate
 */
function B1_filtrarDudasRescatables(palabrasDudosas, sensitivityMode) {
  const config = B1_PRESUPUESTOS[sensitivityMode];

  return palabrasDudosas.filter(p => {
    // Ruido puro: confianza 0 o casi 0
    if (p.confidence !== null && p.confidence < 0.05) return false;

    // Palabra vacía o de un solo carácter basura
    if (!p.texto || p.texto.trim().length < 2) return false;

    // El bloque padre debe tener al menos 2 palabras legibles
    if (p.bloque) {
      const palabrasLegibles = p.bloque.palabras.filter(
        w => w.confidence === null || w.confidence >= config.minConfidenceWord
      );
      if (palabrasLegibles.length < 2) return false;
    }

    return true;
  });
}


// ─── CREAR SLOTS INDEXADOS ──────────────────────────────────
/**
 * Sección 9: Formato interno correcto - slots indexados.
 * Cada duda rescatable recibe un slotId único y estable.
 *
 * @param {Array} dudasRescatables - Filtradas
 * @param {number} maxSlots - Tope duro según sensibilidad
 * @returns {Array<Object>} Slots listos para rescate
 */
function B1_crearSlots(dudasRescatables, maxSlots) {
  _resetSlotCounter();

  // Respetar tope duro de slots
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
/**
 * Sección 5.6: ROI y contexto.
 * Recorta fragmento de imagen usando boundingPoly + margen.
 *
 * @param {HTMLCanvasElement} canvasOriginal - Imagen redimensionada
 * @param {Object} boundingPoly - Polígono de Vision
 * @param {number} margen - Píxeles extra alrededor (B1_CONFIG.ROI_MARGIN_PX)
 * @returns {string} Base64 del recorte, o null si no hay boundingPoly
 */
function B1_recortarROI(canvasOriginal, boundingPoly, margen) {
  if (!boundingPoly || !boundingPoly.vertices || boundingPoly.vertices.length < 2) {
    return null;
  }

  const vertices = boundingPoly.vertices;
  const mg = margen || B1_CONFIG.ROI_MARGIN_PX;

  // Encontrar bounding box del polígono
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  vertices.forEach(v => {
    const x = v.x || 0;
    const y = v.y || 0;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });

  // Aplicar margen de seguridad
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
/**
 * Sección 5.6: Construir contexto intrabloque alrededor de cada slot.
 * PROHIBIDO mezclar bloques para fabricar contexto.
 *
 * El contexto es: palabras del mismo bloque alrededor de la duda,
 * con la duda marcada como [[slotId|textoOriginal]].
 *
 * @param {Object} slot - Slot con referencia a bloque
 * @param {number} ventana - Palabras antes y después a incluir
 * @returns {string} Texto contextualizado
 */
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
      // La duda marcada con su slot
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
 * Función principal del paso 5.
 * Toma las dudas, crea slots, recorta ROIs, construye contextos.
 * Devuelve el lote listo para enviar a Gemini en paso 6.
 *
 * @param {Array} palabrasDudosas - Del medidor de fiabilidad
 * @param {HTMLCanvasElement} canvas - Imagen redimensionada
 * @param {string} sensitivityMode
 * @returns {Object} Lote preparado
 */
function B1_prepararLoteRescate(palabrasDudosas, canvas, sensitivityMode) {
  const config = B1_PRESUPUESTOS[sensitivityMode];

  // 1. Filtrar dudas con esperanza real
  const rescatables = B1_filtrarDudasRescatables(palabrasDudosas, sensitivityMode);

  // 2. Crear slots con IDs únicos
  const slots = B1_crearSlots(rescatables, config.maxSlots);

  // 3. Ventana de contexto según sensibilidad
  const ventana = B1_getVentanaContexto(sensitivityMode);

  // 4. Enriquecer cada slot con ROI y contexto
  const slotsPreparados = slots.map(slot => {
    const roiBase64 = B1_recortarROI(canvas, slot.boundingPoly, B1_CONFIG.ROI_MARGIN_PX);
    const contexto = B1_construirContexto(slot, ventana);

    return {
      slotId:        slot.slotId,
      textoOriginal: slot.textoOriginal,
      confidence:    slot.confidence,
      contexto:      contexto,
      roiBase64:     roiBase64,
      boundingPoly:  slot.boundingPoly,
      pageIndex:     slot.pageIndex,
      blockIndex:    slot.blockIndex
    };
  });

  return {
    totalDudas:      palabrasDudosas.length,
    totalRescatables:rescatables.length,
    totalSlots:      slotsPreparados.length,
    maxSlots:        config.maxSlots,
    truncado:        rescatables.length > config.maxSlots,
    slots:           slotsPreparados
  };
}
