/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 7 · MERGE Y PASAPORTE
 * ═══════════════════════════════════════════════════════════════
 * Sección 5.8, 5.9, 9 y 11 de la orden de trabajo v4
 *
 * REGLAS ABSOLUTAS:
 * - Fusionar respuestas por slotId, NUNCA por texto repetido.
 * - Simetría EXACTA entre slots enviados y devueltos.
 * - Si falta, sobra o se duplica un slot: merge CANCELADO.
 * - NO EXISTE merge parcial.
 * - Conservar texto base + texto auditado + correcciones + dudas.
 * - ROIs útiles viajan al Cerebro si hay validación humana.
 *
 * CAMBIO v2:
 * - B1_ejecutarMerge añade resultadosGemini (fuente canónica) y
 *   noResueltasCriticas (flag para el pasaporte).
 * - B1_emitirPasaporte usa la nueva regla:
 *     ROJO   → cualquier no_resuelta que no sea solo peso/formato.
 *     NARANJA → solo no_resueltas de peso/formato, o timeout.
 *     VERDE  → todos los slots corregida o ya_valida.
 * NOTA: B1_hotfix_71631.js sobreescribe ambas funciones en runtime
 * con la misma lógica. Este archivo actúa como fuente base y fallback.
 * ═══════════════════════════════════════════════════════════════
 */


// ─── HELPER INTERNO: detecta slots no críticos (solo peso/formato) ──────
function _B1_merge_esSlotPesoFormato(textoOriginal) {
  var t = String(textoOriginal || '').trim();
  if (!t) return false;
  if (/^\d+([.,]\d+)?(kg|g|gr|ml|cl|dl|l)$/i.test(t)) return true;
  if (/^\d+[x×]\d+([.,]\d+)?$/i.test(t)) return true;
  if (/^(kg|g|gr|ml|cl|dl|l)$/i.test(t)) return true;
  if (/^\d+([.,]\d+)?$/.test(t)) return true;
  return false;
}


// ─── VERIFICAR SIMETRÍA DE SLOTS ────────────────────────────────────────
/**
 * Comprueba simetría exacta entre slots enviados y devueltos.
 *
 * @param {Array} slotsEnviados - Slots que se mandaron a Gemini
 * @param {Array} correccionesRecibidas - Lo que devolvió Gemini
 * @returns {{ simetrica: boolean, detalle: string }}
 */
function B1_verificarSimetria(slotsEnviados, correccionesRecibidas) {
  const idsEnviados  = slotsEnviados.map(s => s.slotId).sort();
  const idsRecibidos = correccionesRecibidas.map(c => c.slotId).sort();

  if (idsEnviados.length !== idsRecibidos.length) {
    return {
      simetrica: false,
      detalle: `Asimetría de cantidad: enviados=${idsEnviados.length}, devueltos=${idsRecibidos.length}`
    };
  }

  const setRecibidos = new Set(idsRecibidos);
  if (setRecibidos.size !== idsRecibidos.length) {
    return { simetrica: false, detalle: 'Slots duplicados en la respuesta de Gemini.' };
  }

  for (let i = 0; i < idsEnviados.length; i++) {
    if (idsEnviados[i] !== idsRecibidos[i]) {
      return {
        simetrica: false,
        detalle: `SlotId no coincide: esperado=${idsEnviados[i]}, recibido=${idsRecibidos[i]}`
      };
    }
  }

  return { simetrica: true, detalle: 'Simetría exacta confirmada.' };
}


// ─── EJECUTAR MERGE ─────────────────────────────────────────────────────
/**
 * Fusiona las correcciones de Gemini con el texto base de Vision.
 *
 * CAMBIADO v2: añade resultadosGemini (fuente canónica con los 3 estados)
 * y noResueltasCriticas (flag para B1_emitirPasaporte).
 *
 * @param {string} textoBase
 * @param {Array}  slotsEnviados
 * @param {Object} resultadoRescate
 * @returns {Object}
 */
function B1_ejecutarMerge(textoBase, slotsEnviados, resultadoRescate) {
  if (!resultadoRescate.intentado) {
    return {
      mergeStatus:        B1_MERGE_STATUS.NO_INTENTADO,
      textoAuditado:      textoBase,
      correcciones:       [],
      noResueltas:        [],
      roiRefsRevision:    [],
      mergeCancelado:     false,
      noResueltasCriticas: false,
      resultadosGemini:   []
    };
  }

  const simetria = B1_verificarSimetria(slotsEnviados, resultadoRescate.correcciones);

  if (!simetria.simetrica) {
    const noResueltas = slotsEnviados.map(s => s.slotId);
    const roiRefs     = slotsEnviados.filter(s => s.roiBase64).map(s => B1_crearRoiRef(s.slotId));
    const noResueltasCriticas = slotsEnviados.some(s => !_B1_merge_esSlotPesoFormato(s.textoOriginal));
    const resultadosGemini    = slotsEnviados.map(s => ({
      slotId:   s.slotId,
      estado:   'no_resuelta',
      original: s.textoOriginal,
      solucion: '',
      motivo:   'asimetria_slots'
    }));

    return {
      mergeStatus:        B1_MERGE_STATUS.CANCELADO_POR_ASIMETRIA,
      textoAuditado:      textoBase,
      correcciones:       [],
      noResueltas,
      roiRefsRevision:    roiRefs,
      mergeCancelado:     true,
      motivoCancelacion:  simetria.detalle,
      noResueltasCriticas,
      resultadosGemini
    };
  }

  // Indexar correcciones por slotId
  const mapCorrecciones = {};
  resultadoRescate.correcciones.forEach(c => {
    mapCorrecciones[c.slotId] = c;
  });

  let textoAuditado = textoBase;
  const correccionesAplicadas = [];
  const noResueltas           = [];
  const roiRefsRevision       = [];
  const resultadosGemini      = [];

  slotsEnviados.forEach(slot => {
    const correccion = mapCorrecciones[slot.slotId];
    if (!correccion) return;

    const estado   = String(correccion.estado || correccion.resultado || '').trim();
    const solucion = String(correccion.solucion || '').trim();
    const original = String(slot.textoOriginal || '').trim();

    // ── CORREGIDA (alias: aplicable, aplicada, corregido) ──
    const esCorregida = ['corregida', 'corregido', 'aplicable', 'aplicada'].includes(estado);
    if (esCorregida) {
      if (solucion && solucion !== original) {
        textoAuditado = _reemplazarPorSlot(textoAuditado, slot.textoOriginal, solucion);
        correccionesAplicadas.push({
          slotId:   slot.slotId,
          original: slot.textoOriginal,
          solucion,
          estado:   B1_SLOT_STATUS.APLICADA
        });
        resultadosGemini.push({ slotId: slot.slotId, estado: 'corregida',  original: slot.textoOriginal, solucion, motivo: '' });
        return;
      }
      // solucion === original → ya_valida
      resultadosGemini.push({ slotId: slot.slotId, estado: 'ya_valida',  original: slot.textoOriginal, solucion: original, motivo: '' });
      return;
    }

    // ── YA_VALIDA (alias: ya_correcto, correcto, sin_cambio, confirmado) ──
    const esYaValida = ['ya_valida', 'yavalida', 'ya_correcto', 'yacorrecto', 'correcto',
                        'sin_cambio', 'sincambio', 'confirmado'].includes(estado);
    if (esYaValida) {
      resultadosGemini.push({ slotId: slot.slotId, estado: 'ya_valida',  original: slot.textoOriginal, solucion: solucion || original, motivo: '' });
      return;
    }

    // ── NO_RESUELTA (todo lo demás) ──
    noResueltas.push(slot.slotId);
    if (slot.roiBase64) roiRefsRevision.push(B1_crearRoiRef(slot.slotId));
    resultadosGemini.push({
      slotId:   slot.slotId,
      estado:   'no_resuelta',
      original: slot.textoOriginal,
      solucion: '',
      motivo:   String(correccion.motivo || '').slice(0, 64)
    });
  });

  // Flag: ¿hay algún no_resuelta crítico (no solo peso/formato)?
  const noResueltasCriticas = noResueltas.some(slotId => {
    const slot = slotsEnviados.find(s => s.slotId === slotId);
    return slot ? !_B1_merge_esSlotPesoFormato(slot.textoOriginal) : true;
  });

  return {
    mergeStatus:        B1_MERGE_STATUS.OK,
    textoAuditado,
    correcciones:       correccionesAplicadas,
    noResueltas,
    roiRefsRevision,
    mergeCancelado:     false,
    noResueltasCriticas,
    resultadosGemini
  };
}


// ─── EMITIR PASAPORTE FINAL ─────────────────────────────────────────────
/**
 * CAMBIADO v2: lógica de color ligada a noResueltasCriticas.
 *
 *   ROJO   → cualquier slot no_resuelta que no sea solo peso/formato.
 *   NARANJA → solo no_resueltas de peso/formato, o timeout sin críticos.
 *   VERDE  → todos los slots corregida o ya_valida.
 *
 * @param {Object}  merge
 * @param {Object}  fiabilidad
 * @param {boolean} agentEnabled
 * @param {Object}  cronometro
 * @param {string|null} abortReason
 * @returns {Object}
 */
function B1_emitirPasaporte(merge, fiabilidad, agentEnabled, cronometro, abortReason) {

  // Aborto externo
  if (abortReason) {
    return {
      estado: B1_PASSPORT.ROJO,
      explicacion: abortReason,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CORTE_TEMPRANO
    };
  }

  // Foto inviable
  if (!fiabilidad.fotoViable) {
    return {
      estado: B1_PASSPORT.ROJO,
      explicacion: fiabilidad.razonInviable || 'Foto no procesable.',
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.ABORTAR_FLUJO
    };
  }

  // Agente apagado
  if (!agentEnabled) {
    return {
      estado: B1_PASSPORT.ROJO,
      explicacion: 'Agente desactivado. Solo OCR base sin rescate.',
      accionSugeridaParaCerebro: null
    };
  }

  // Merge cancelado por asimetría: ROJO si hay slots críticos
  if (merge.mergeCancelado) {
    if (merge.noResueltasCriticas) {
      return {
        estado: B1_PASSPORT.ROJO,
        explicacion: `Merge cancelado. Alérgenos sin resolver. ${merge.motivoCancelacion || ''}`.trim(),
        accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO
      };
    }
    return {
      estado: B1_PASSPORT.NARANJA,
      explicacion: `Merge cancelado. Sin slots críticos afectados. ${merge.motivoCancelacion || ''}`.trim(),
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CONTINUAR_Y_MARCAR
    };
  }

  const tiempoAgotado  = cronometro.expired();
  const hayNoResueltos = merge.noResueltas && merge.noResueltas.length > 0;

  // ROJO: alérgeno no resuelto
  if (hayNoResueltos && merge.noResueltasCriticas) {
    return {
      estado: B1_PASSPORT.ROJO,
      explicacion: `Alérgeno sin resolver. ${merge.noResueltas.length} slot(s) no_resuelta con riesgo crítico.`,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO
    };
  }

  // NARANJA: solo no críticos sin resolver, o timeout
  if (hayNoResueltos || tiempoAgotado) {
    const razones = [];
    if (hayNoResueltos) razones.push(`${merge.noResueltas.length} slot(s) no crítico(s) sin resolver.`);
    if (tiempoAgotado)  razones.push('Presupuesto de tiempo agotado.');
    return {
      estado: B1_PASSPORT.NARANJA,
      explicacion: `Rescate parcial. ${razones.join(' ')}`,
      accionSugeridaParaCerebro: hayNoResueltos
        ? B1_ACCIONES_CEREBRO.CONTINUAR_Y_MARCAR
        : B1_ACCIONES_CEREBRO.REINTENTAR_MAS_TARDE
    };
  }

  // VERDE: todos los slots corregida o ya_valida
  return {
    estado: B1_PASSPORT.VERDE,
    explicacion: 'Lectura sólida. Texto auditado utilizable.',
    accionSugeridaParaCerebro: null
  };
}


// ─── AUXILIAR: REEMPLAZO POR SLOT ───────────────────────────────────────
function _reemplazarPorSlot(texto, textoOriginal, solucion) {
  const escaped = textoOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex   = new RegExp(escaped, '');
  return texto.replace(regex, solucion);
}
