/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 v2 · MERGE Y PASAPORTE
 * ═══════════════════════════════════════════════════════════════
 * Alineado con madre v5 y 12 reglas fijas del proyecto.
 *
 * REGLAS ABSOLUTAS:
 * - Fusionar respuestas por slotId, NUNCA por texto repetido.
 * - Simetria EXACTA entre slots enviados y devueltos.
 * - Si falta, sobra o se duplica un slot: merge CANCELADO.
 * - NO EXISTE merge parcial.
 *
 * REGLA 7:  no_resuelta en alergeno = ROJO. Siempre.
 * REGLA 12: Solo alergenos rotos llegan al merge. Tabla B
 *           quedo resuelta en el motor y nunca entra aqui.
 *           Por tanto, todo no_resuelta es critico.
 * ═══════════════════════════════════════════════════════════════
 */


/* ── VERIFICAR SIMETRIA ──────────────────────────────────── */

function B1_verificarSimetria(slotsEnviados, correccionesRecibidas) {
  var idsEnviados  = slotsEnviados.map(function(s) { return s.slotId; }).sort();
  var idsRecibidos = correccionesRecibidas.map(function(c) { return c.slotId; }).sort();

  if (idsEnviados.length !== idsRecibidos.length) {
    return {
      simetrica: false,
      detalle: 'Asimetria de cantidad: enviados=' + idsEnviados.length + ', devueltos=' + idsRecibidos.length
    };
  }

  var setRecibidos = {};
  for (var r = 0; r < idsRecibidos.length; r++) {
    if (setRecibidos[idsRecibidos[r]]) {
      return { simetrica: false, detalle: 'Slots duplicados en la respuesta de Gemini.' };
    }
    setRecibidos[idsRecibidos[r]] = true;
  }

  for (var i = 0; i < idsEnviados.length; i++) {
    if (idsEnviados[i] !== idsRecibidos[i]) {
      return {
        simetrica: false,
        detalle: 'SlotId no coincide: esperado=' + idsEnviados[i] + ', recibido=' + idsRecibidos[i]
      };
    }
  }

  return { simetrica: true, detalle: 'Simetria exacta confirmada.' };
}


/* ── EJECUTAR MERGE ──────────────────────────────────────── */

function B1_ejecutarMerge(textoBase, slotsEnviados, resultadoRescate, palabrasOCR) {

  if (!resultadoRescate.intentado) {
    return {
      mergeStatus:      B1_MERGE_STATUS.NO_INTENTADO,
      textoAuditado:    textoBase,
      correcciones:     [],
      noResueltas:      [],
      roiRefsRevision:  [],
      mergeCancelado:   false,
      resultadosGemini: [],
      detalleSlots:     []
    };
  }

  var simetria = B1_verificarSimetria(slotsEnviados, resultadoRescate.correcciones);

  if (!simetria.simetrica) {
    var noResueltas = slotsEnviados.map(function(s) { return s.slotId; });
    var roiRefs = [];
    var resultadosGemini = [];
    var detalleSlots = [];

    for (var a = 0; a < slotsEnviados.length; a++) {
      var sa = slotsEnviados[a];
      if (sa.roiBase64) { roiRefs.push(B1_crearRoiRef(sa.slotId)); }
      resultadosGemini.push({
        slotId: sa.slotId, estado: 'no_resuelta',
        original: sa.textoOriginal, solucion: '', motivo: 'asimetria_slots'
      });
      detalleSlots.push({
        slotId: sa.slotId, estadoFinal: 'no_resuelta',
        original: sa.textoOriginal, solucion: '', motivo: 'asimetria_slots'
      });
    }

    return {
      mergeStatus:       B1_MERGE_STATUS.CANCELADO_POR_ASIMETRIA,
      textoAuditado:     textoBase,
      correcciones:      [],
      noResueltas:       noResueltas,
      roiRefsRevision:   roiRefs,
      mergeCancelado:    true,
      motivoCancelacion: simetria.detalle,
      resultadosGemini:  resultadosGemini,
      detalleSlots:      detalleSlots
    };
  }

  // Indexar correcciones por slotId
  var mapCorrecciones = {};
  resultadoRescate.correcciones.forEach(function(c) {
    mapCorrecciones[c.slotId] = c;
  });

  var correccionesAplicadas = [];
  var noResueltas2          = [];
  var roiRefsRevision       = [];
  var resultadosGemini2     = [];
  var detalleSlots2         = [];
  var reemplazosPendientes  = [];
  var rangosOcupados        = [];
  var mapaPosicionesOCR     = _B1_indexarPosicionesTextoOCR(textoBase, palabrasOCR || []);

  slotsEnviados.forEach(function(slot) {
    var correccion = mapCorrecciones[slot.slotId];
    if (!correccion) return;

    var estado   = String(correccion.estado || correccion.resultado || '').trim();
    var solucion = String(correccion.solucion || '').trim();
    var original = String(slot.textoOriginal || '').trim();

    // ── CORREGIDA ──
    var esCorregida = ['corregida', 'corregido', 'aplicable', 'aplicada'].indexOf(estado) !== -1;
    if (esCorregida) {
      if (!solucion) {
        noResueltas2.push(slot.slotId);
        if (slot.roiBase64) { roiRefsRevision.push(B1_crearRoiRef(slot.slotId)); }
        resultadosGemini2.push({
          slotId: slot.slotId, estado: 'no_resuelta',
          original: slot.textoOriginal, solucion: '', motivo: 'solucion_vacia'
        });
        detalleSlots2.push({
          slotId: slot.slotId, estadoFinal: 'no_resuelta',
          original: slot.textoOriginal, solucion: '', motivo: 'solucion_vacia'
        });
        return;
      }

      if (solucion !== original) {
        var reemplazo = _B1_resolverReemplazoSlot(textoBase, slot, solucion, mapaPosicionesOCR, rangosOcupados);
        if (!reemplazo) {
          noResueltas2.push(slot.slotId);
          if (slot.roiBase64) { roiRefsRevision.push(B1_crearRoiRef(slot.slotId)); }
          resultadosGemini2.push({
            slotId: slot.slotId, estado: 'no_resuelta',
            original: slot.textoOriginal, solucion: '', motivo: 'replace_no_localizado'
          });
          detalleSlots2.push({
            slotId: slot.slotId, estadoFinal: 'no_resuelta',
            original: slot.textoOriginal, solucion: '', motivo: 'replace_no_localizado'
          });
          return;
        }

        reemplazosPendientes.push(reemplazo);
        rangosOcupados.push({ start: reemplazo.start, end: reemplazo.end });
        correccionesAplicadas.push({
          slotId: slot.slotId, original: slot.textoOriginal,
          solucion: solucion, estado: B1_ESTADO_GEMINI.CORREGIDA
        });
        resultadosGemini2.push({ slotId: slot.slotId, estado: 'corregida', original: slot.textoOriginal, solucion: solucion, motivo: '' });
        detalleSlots2.push({ slotId: slot.slotId, estadoFinal: 'corregida', original: slot.textoOriginal, solucion: solucion, motivo: '' });
        return;
      }

      resultadosGemini2.push({ slotId: slot.slotId, estado: 'ya_valida', original: slot.textoOriginal, solucion: original, motivo: '' });
      detalleSlots2.push({ slotId: slot.slotId, estadoFinal: 'ya_valida', original: slot.textoOriginal, solucion: original, motivo: '' });
      return;
    }

    // ── YA_VALIDA ──
    var esYaValida = ['ya_valida', 'yavalida', 'ya_correcto', 'yacorrecto', 'correcto',
                      'sin_cambio', 'sincambio', 'confirmado'].indexOf(estado) !== -1;
    if (esYaValida) {
      resultadosGemini2.push({ slotId: slot.slotId, estado: 'ya_valida', original: slot.textoOriginal, solucion: solucion || original, motivo: '' });
      detalleSlots2.push({ slotId: slot.slotId, estadoFinal: 'ya_valida', original: slot.textoOriginal, solucion: solucion || original, motivo: '' });
      return;
    }

    // ── NO_RESUELTA (todo lo demas) ──
    noResueltas2.push(slot.slotId);
    if (slot.roiBase64) { roiRefsRevision.push(B1_crearRoiRef(slot.slotId)); }
    resultadosGemini2.push({
      slotId: slot.slotId, estado: 'no_resuelta',
      original: slot.textoOriginal, solucion: '',
      motivo: String(correccion.motivo || '').slice(0, 64)
    });
    detalleSlots2.push({
      slotId: slot.slotId, estadoFinal: 'no_resuelta',
      original: slot.textoOriginal, solucion: '',
      motivo: String(correccion.motivo || '').slice(0, 64)
    });
  });

  var textoAuditado = _B1_aplicarReemplazos(textoBase, reemplazosPendientes);

  return {
    mergeStatus:      B1_MERGE_STATUS.OK,
    textoAuditado:    textoAuditado,
    correcciones:     correccionesAplicadas,
    noResueltas:      noResueltas2,
    roiRefsRevision:  roiRefsRevision,
    mergeCancelado:   false,
    resultadosGemini: resultadosGemini2,
    detalleSlots:     detalleSlots2
  };
}


/* ── EMITIR PASAPORTE ────────────────────────────────────── */
/*
 * REGLA 7:  no_resuelta en alergeno = ROJO. Siempre.
 * REGLA 12: Solo alergenos llegan al merge. Todo no_resuelta es critico.
 * REGLA 3:  Fiabilidad no decide cortes. No se consulta fotoViable.
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

  // Agente apagado
  if (!agentEnabled) {
    return {
      estado: B1_PASSPORT.NARANJA,
      explicacion: 'Agente desactivado. Solo OCR base sin rescate.',
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.CONTINUAR_Y_MARCAR
    };
  }

  // Merge cancelado por asimetria
  if (merge.mergeCancelado) {
    return {
      estado: B1_PASSPORT.ROJO,
      explicacion: 'Merge cancelado. Alergenos sin resolver. ' + (merge.motivoCancelacion || ''),
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO
    };
  }

  var hayNoResueltos = merge.noResueltas && merge.noResueltas.length > 0;

  // ROJO: cualquier no_resuelta — regla 7, todo es alergeno — regla 12
  if (hayNoResueltos) {
    return {
      estado: B1_PASSPORT.ROJO,
      explicacion: merge.noResueltas.length + ' alergeno(s) sin resolver.',
      accionSugeridaParaCerebro: B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO
    };
  }

  // VERDE: todos corregida o ya_valida
  return {
    estado: B1_PASSPORT.VERDE,
    explicacion: 'Lectura solida. Texto auditado utilizable.',
    accionSugeridaParaCerebro: null
  };
}


/* ── AUXILIAR: REEMPLAZO POR SLOT ────────────────────────── */

function _B1_claveOCR(item) {
  return [
    typeof item.pageIndex === 'number' ? item.pageIndex : '',
    typeof item.blockIndex === 'number' ? item.blockIndex : '',
    typeof item.wordIndex === 'number' ? item.wordIndex : ''
  ].join('|');
}

function _B1_indexarPosicionesTextoOCR(textoBase, palabrasOCR) {
  var texto = String(textoBase || '');
  var cursor = 0;
  var mapa = {};

  for (var i = 0; i < palabrasOCR.length; i++) {
    var palabra = palabrasOCR[i];
    if (!palabra) continue;

    var token = String(palabra.texto || '');
    if (!token) continue;

    var idx = texto.indexOf(token, cursor);
    if (idx === -1) continue;

    mapa[_B1_claveOCR(palabra)] = {
      start: idx,
      end: idx + token.length,
      tokenOriginal: token
    };
    cursor = idx + token.length;
  }

  return mapa;
}

function _B1_resolverReemplazoSlot(textoBase, slot, solucion, mapaPosicionesOCR, rangosOcupados) {
  var clave = _B1_claveOCR(slot);
  var pos = mapaPosicionesOCR[clave];

  if (
    pos &&
    textoBase.slice(pos.start, pos.end) === String(slot.textoOriginal || '') &&
    !_B1_rangoSeSolapa(pos.start, pos.end, rangosOcupados)
  ) {
    return {
      slotId: slot.slotId,
      start: pos.start,
      end: pos.end,
      solucion: solucion
    };
  }

  return _B1_buscarReemplazoTokenAislado(textoBase, slot, solucion, rangosOcupados);
}

function _B1_buscarReemplazoTokenAislado(textoBase, slot, solucion, rangosOcupados) {
  var textoOriginal = String(slot.textoOriginal || '');
  if (!textoOriginal) return null;

  var escaped = textoOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var charsToken = '0-9A-Za-z\\u00C0-\\u017F';
  var regex = new RegExp('(^|[^' + charsToken + '])(' + escaped + ')(?=$|[^' + charsToken + '])', 'g');
  var match;

  while ((match = regex.exec(textoBase)) !== null) {
    var start = match.index + match[1].length;
    var end = start + match[2].length;
    if (_B1_rangoSeSolapa(start, end, rangosOcupados)) {
      continue;
    }
    return {
      slotId: slot.slotId,
      start: start,
      end: end,
      solucion: solucion
    };
  }

  return null;
}

function _B1_rangoSeSolapa(start, end, rangosOcupados) {
  for (var i = 0; i < rangosOcupados.length; i++) {
    var rango = rangosOcupados[i];
    if (start < rango.end && end > rango.start) {
      return true;
    }
  }
  return false;
}

function _B1_aplicarReemplazos(textoBase, reemplazos) {
  var texto = String(textoBase || '');
  if (!reemplazos || reemplazos.length === 0) return texto;

  var ordenados = reemplazos.slice().sort(function(a, b) {
    return b.start - a.start;
  });

  for (var i = 0; i < ordenados.length; i++) {
    var reemplazo = ordenados[i];
    texto =
      texto.slice(0, reemplazo.start) +
      reemplazo.solucion +
      texto.slice(reemplazo.end);
  }

  return texto;
}
