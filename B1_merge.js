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
 * ═══════════════════════════════════════════════════════════════
 */

// ─── VERIFICAR SIMETRÍA DE SLOTS ────────────────────────────
/**
 * Comprueba simetría exacta entre slots enviados y devueltos.
 *
 * @param {Array} slotsEnviados - Slots que se mandaron a Gemini
 * @param {Array} correccionesRecibidas - Lo que devolvió Gemini
 * @returns {{ simetrica: boolean, detalle: string }}
 */
function B1_verificarSimetria(slotsEnviados, correccionesRecibidas) {
  const idsEnviados = slotsEnviados.map(s => s.slotId).sort();
  const idsRecibidos = correccionesRecibidas.map(c => c.slotId).sort();

  // ¿Mismo número?
  if (idsEnviados.length !== idsRecibidos.length) {
    return {
      simetrica: false,
      detalle: `Asimetría de cantidad: enviados=${idsEnviados.length}, devueltos=${idsRecibidos.length}`
    };
  }

  // ¿Duplicados en recibidos?
  const setRecibidos = new Set(idsRecibidos);
  if (setRecibidos.size !== idsRecibidos.length) {
    return {
      simetrica: false,
      detalle: 'Slots duplicados en la respuesta de Gemini.'
    };
  }

  // ¿Coincidencia exacta?
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


// ─── EJECUTAR MERGE ─────────────────────────────────────────
/**
 * Fusiona las correcciones de Gemini con el texto base de Vision.
 * Aplica correcciones por slotId, NUNCA por texto.
 *
 * Si la simetría falla, el merge COMPLETO se cancela.
 *
 * @param {string} textoBase - Texto base de Vision
 * @param {Array} slotsEnviados - Slots originales
 * @param {Object} resultadoRescate - De B1_ejecutarRescate
 * @returns {Object} Resultado del merge
 */
function B1_ejecutarMerge(textoBase, slotsEnviados, resultadoRescate) {
  // Si no se intentó rescate, no hay merge
  if (!resultadoRescate.intentado) {
    return {
      mergeStatus:     B1_MERGE_STATUS.NO_INTENTADO,
      textoAuditado:   textoBase,
      correcciones:    [],
      noResueltas:     [],
      roiRefsRevision: [],
      mergeCancelado:  false
    };
  }

  // Verificar simetría EXACTA
  const simetria = B1_verificarSimetria(slotsEnviados, resultadoRescate.correcciones);

  if (!simetria.simetrica) {
    // ═══ MERGE CANCELADO ═══
    // No existe merge parcial. Todo se anula.
    // El texto base de Vision se conserva intacto.
    // Los slots se convierten en dudas no resueltas.
    const noResueltas = slotsEnviados.map(s => s.slotId);
    const roiRefs = slotsEnviados
      .filter(s => s.roiBase64)
      .map(s => B1_crearRoiRef(s.slotId));

    return {
      mergeStatus:     B1_MERGE_STATUS.CANCELADO_POR_ASIMETRIA,
      textoAuditado:   textoBase, // Sin tocar
      correcciones:    [],
      noResueltas:     noResueltas,
      roiRefsRevision: roiRefs,
      mergeCancelado:  true,
      motivoCancelacion: simetria.detalle
    };
  }

  // ═══ MERGE CON SIMETRÍA EXACTA ═══
  // Indexar correcciones por slotId para acceso rápido
  const mapCorrecciones = {};
  resultadoRescate.correcciones.forEach(c => {
    mapCorrecciones[c.slotId] = c;
  });

  let textoAuditado = textoBase;
  const correccionesAplicadas = [];
  const noResueltas = [];
  const roiRefsRevision = [];

  // Aplicar correcciones en orden inverso para no romper índices
  // Pero como trabajamos con texto completo y reemplazos por slotId,
  // usamos el texto original del slot como ancla
  slotsEnviados.forEach(slot => {
    const correccion = mapCorrecciones[slot.slotId];

    if (!correccion) return; // No debería pasar con simetría exacta

    if (correccion.estado === B1_SLOT_STATUS.APLICABLE || correccion.estado === B1_SLOT_STATUS.APLICADA) {
      const solucion = String(correccion.solucion || '').trim();
      const original = String(slot.textoOriginal || '').trim();

      // Confirmación sin cambio real:
      // no se cuenta como corrección aplicada ni como duda no resuelta.
      if (solucion && solucion === original) {
        return;
      }

      // Aplicar corrección real: reemplazar texto original por solución
      if (solucion) {
        textoAuditado = _reemplazarPorSlot(textoAuditado, slot.textoOriginal, solucion);
        correccionesAplicadas.push({
          slotId:   slot.slotId,
          original: slot.textoOriginal,
          solucion,
          estado:   B1_SLOT_STATUS.APLICADA
        });
      } else {
        // Gemini dijo "aplicable" pero no dio solución
        noResueltas.push(slot.slotId);
        if (slot.roiBase64) {
          roiRefsRevision.push(B1_crearRoiRef(slot.slotId));
        }
      }
    } else {
      // No resuelta por Gemini
      noResueltas.push(slot.slotId);
      if (slot.roiBase64) {
        roiRefsRevision.push(B1_crearRoiRef(slot.slotId));
      }
    }
  });

  return {
    mergeStatus:     B1_MERGE_STATUS.OK,
    textoAuditado:   textoAuditado,
    correcciones:    correccionesAplicadas,
    noResueltas:     noResueltas,
    roiRefsRevision: roiRefsRevision,
    mergeCancelado:  false
  };
}


// ─── EMITIR PASAPORTE FINAL ─────────────────────────────────
/**
 * Sección 5.9 y 11: Pasaporte operativo definitivo.
 * VERDE, NARANJA o ROJO con explicación legible.
 * Sin ocultar fallos. Sin falsa seguridad.
 *
 * @param {Object} merge - Resultado del merge
 * @param {Object} fiabilidad - Del medidor de fiabilidad
 * @param {boolean} agentEnabled
 * @param {Object} cronometro
 * @param {string|null} abortReason - Si hubo aborto temprano
 * @returns {Object} Pasaporte con estado y explicación
 */
function B1_emitirPasaporte(merge, fiabilidad, agentEnabled, cronometro, abortReason) {
  // ── ROJO: foto inviable o bypass ──────────────────────────
  if (abortReason) {
    return {
      estado: B1_PASSPORT.ROJO,
      explicacion: abortReason,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CORTE_TEMPRANO
    };
  }

  if (!fiabilidad.fotoViable) {
    return {
      estado: B1_PASSPORT.ROJO,
      explicacion: fiabilidad.razonInviable || 'Foto no procesable.',
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.ABORTAR_FLUJO
    };
  }

  // Bypass: agente apagado
  if (!agentEnabled) {
    return {
      estado: B1_PASSPORT.ROJO,
      explicacion: 'Agente desactivado. Solo OCR base sin rescate.',
      accionSugeridaParaCerebro: null // Bypass ROJO: sin rescate ni auditoría
    };
  }

  // ── CANCELACIÓN POR ASIMETRÍA ─────────────────────────────
  if (merge.mergeCancelado) {
    return {
      estado: B1_PASSPORT.NARANJA,
      explicacion: `Merge cancelado por asimetría de slots. ${merge.motivoCancelacion}. Texto base conservado.`,
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CONTINUAR_Y_MARCAR
    };
  }

  // ── Evaluación con merge exitoso ──────────────────────────
  const tieneNoResueltas = merge.noResueltas.length > 0;
  const tiempoAgotado = cronometro.expired();

  // NARANJA: hay dudas sin resolver o se cortó por tiempo
  if (tieneNoResueltas || tiempoAgotado) {
    const razones = [];
    if (tieneNoResueltas) {
      razones.push(`${merge.noResueltas.length} duda(s) sin resolver.`);
    }
    if (tiempoAgotado) {
      razones.push('Presupuesto de tiempo agotado.');
    }

    return {
      estado: B1_PASSPORT.NARANJA,
      explicacion: `Rescate parcial. ${razones.join(' ')}`,
      accionSugeridaParaCerebro: tieneNoResueltas
        ? B1_ACCIONES_CEREBRO.CONTINUAR_Y_MARCAR
        : B1_ACCIONES_CEREBRO.REINTENTAR_MAS_TARDE
    };
  }

  // VERDE: todo resuelto, sin dudas, merge limpio
  return {
    estado: B1_PASSPORT.VERDE,
    explicacion: 'Lectura sólida. Texto auditado utilizable.',
    accionSugeridaParaCerebro: null
  };
}


// ─── AUXILIAR: REEMPLAZO POR SLOT ───────────────────────────
/**
 * Reemplaza la primera ocurrencia del texto original por la solución.
 * Usa coincidencia exacta, no aproximada.
 */
function _reemplazarPorSlot(texto, textoOriginal, solucion) {
  // Escape para regex
  const escaped = textoOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, '');
  return texto.replace(regex, solucion);
}
