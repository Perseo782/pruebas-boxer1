/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 5 · SLOTS, ROI Y CONTEXTO
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

function B1_filtrarDudasRescatables(palabrasDudosas, sensitivityMode) {
  const config = B1_PRESUPUESTOS[sensitivityMode];
  
  return palabrasDudosas.filter(p => {
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
    bloque: p.bloque
  }));
}

function B1_recortarROI(canvasOriginal, boundingPoly, margen) {
  if (!boundingPoly || !boundingPoly.vertices || boundingPoly.vertices.length < 2) {
    return null;
  }
  
  const vertices = boundingPoly.vertices;
  const mg = margen || B1_CONFIG.ROI_MARGIN_PX;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
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

function B1_getVentanaContexto(sensitivityMode) {
  switch (sensitivityMode) {
    case B1_SENSITIVITY.BAJA: return 3;
    case B1_SENSITIVITY.MEDIA: return 5;
    case B1_SENSITIVITY.ALTA: return 8;
    default: return 5;
  }
}

function B1_prepararLoteRescate(palabrasDudosas, canvas, sensitivityMode) {
  const config = B1_PRESUPUESTOS[sensitivityMode];
  const rescatables = B1_filtrarDudasRescatables(palabrasDudosas, sensitivityMode);
  const slots = B1_crearSlots(rescatables, config.maxSlots);
  const ventana = B1_getVentanaContexto(sensitivityMode);
  
  const slotsPreparados = slots.map(slot => {
    const roiBase64 = B1_recortarROI(canvas, slot.boundingPoly, B1_CONFIG.ROI_MARGIN_PX);
    const contexto = B1_construirContexto(slot, ventana);
    
    return {
      slotId: slot.slotId,
      textoOriginal: slot.textoOriginal,
      confidence: slot.confidence,
      contexto: contexto,
      roiBase64: roiBase64,
      boundingPoly: slot.boundingPoly,
      pageIndex: slot.pageIndex,
      blockIndex: slot.blockIndex
    };
  });
  
  return {
    totalDudas: palabrasDudosas.length,
    totalRescatables: rescatables.length,
    totalSlots: slotsPreparados.length,
    maxSlots: config.maxSlots,
    truncado: rescatables.length > config.maxSlots,
    slots: slotsPreparados
  };
}
