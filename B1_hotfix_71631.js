/**
 * HOTFIX 716-31 REPARADO
 *
 * Mantiene el bloqueo de cabeceras numéricas y añade parches seguros para:
 * - no mandar al agente familias/alérgenos ya correctos
 * - exigir estados finos por slot en rescate Gemini
 * - respetar la sensibilidad elegida sin reescribir el core
 *
 * PATCH v2 — ESTADOS GEMINI:
 * Los únicos estados válidos de Gemini son ahora: corregida / ya_valida / no_resuelta
 * El pasaporte es ROJO si cualquier alérgeno queda en no_resuelta.
 * El pasaporte es NARANJA solo si lo no resuelto es peso o formato.
 * El pasaporte es VERDE cuando todos los slots quedan corregida o ya_valida.
 *
 * FUNCIONES CAMBIADAS:
 *   _normalizarCorreccionGemini        → estados renombrados
 *   B1_construirPromptRescate (override) → prompt con 3 estados, sin requisito _B1_agruparSlotsAB
 *   _parsearRespuestaGemini (override)  → lógica idéntica, heredan los estados nuevos
 *   B1_ejecutarMerge (override)         → añade resultadosGemini + noResueltasCriticas
 *   B1_emitirPasaporte (override NUEVO) → ROJO/NARANJA/VERDE según noResueltasCriticas
 *   B1_analizar (override)              → inyecta resultadosGemini en datos de salida
 *
 * FUNCIONES SIN CAMBIO:
 *   _esCabeceraNumericaNoNombre
 *   _esFamiliaYaCorrecta
 *   parche _B1_esDatoNoNombreNiFamilia
 *   parche _B1_evaluarCandidatoFamiliaOCR
 *   helpers de presupuesto (_clonarPresupuestoMedia, _aplicar…, _restaurar…)
 *
 * Cargar DESPUÉS de B1_slots.js.
 */
(function () {
  'use strict';

  const G = typeof globalThis !== 'undefined' ? globalThis : window;
  if (!G) return;

  // ─── UTILIDADES ──────────────────────────────────────────────────────────

  function _txt(v) {
    return String(v == null ? '' : v).trim();
  }

  function _safeNorm(texto) {
    if (typeof _B1_normalizarComparacion === 'function') return _B1_normalizarComparacion(texto);
    return _txt(texto)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function _safeCompact(texto) {
    if (typeof _B1_compactarComparacion === 'function') return _B1_compactarComparacion(texto);
    return _safeNorm(texto).replace(/[^a-z0-9]/g, '');
  }

  function _normalizarClaveEstado(estado) {
    return _safeNorm(estado).replace(/[^a-z0-9_]/g, '');
  }

  function _motivoCorto(motivo, fallback) {
    const limpio = _txt(motivo).slice(0, 64);
    return limpio || fallback || '';
  }

  // ─── NUEVO v2: detector de slots no críticos (solo peso / formato) ───────
  // Un slot es NO CRÍTICO si su texto es un número, una unidad de medida, o
  // una combinación de ambos. Todo lo demás se trata como potencialmente crítico.
  function _esSlotPesoFormato(textoOriginal) {
    const t = _txt(textoOriginal);
    if (!t) return false;
    if (/^\d+([.,]\d+)?(kg|g|gr|ml|cl|dl|l)$/i.test(t)) return true;
    if (/^\d+[x×]\d+([.,]\d+)?$/i.test(t)) return true;
    if (/^(kg|g|gr|ml|cl|dl|l)$/i.test(t)) return true;
    if (/^\d+([.,]\d+)?$/.test(t)) return true;
    return false;
  }

  // ─── HELPERS DE PRESUPUESTO (sin cambio) ─────────────────────────────────

  function _clonarPresupuestoMedia() {
    try {
      if (!G.B1_PRESUPUESTOS || !G.B1_SENSITIVITY) return null;
      const media = G.B1_PRESUPUESTOS[G.B1_SENSITIVITY.MEDIA];
      if (!media || typeof media !== 'object') return null;
      return {
        maxSlots: media.maxSlots,
        minConfidenceWord: media.minConfidenceWord,
        minConfidencePage: media.minConfidencePage,
        rescateAgresivo: media.rescateAgresivo
      };
    } catch (_) {
      return null;
    }
  }

  function _aplicarPresupuestoComoMedia(modo) {
    try {
      if (!G.B1_PRESUPUESTOS || !G.B1_SENSITIVITY) return;
      const media = G.B1_PRESUPUESTOS[G.B1_SENSITIVITY.MEDIA];
      const origen = G.B1_PRESUPUESTOS[modo];
      if (!media || !origen) return;
      media.maxSlots = origen.maxSlots;
      media.minConfidenceWord = origen.minConfidenceWord;
      media.minConfidencePage = origen.minConfidencePage;
      media.rescateAgresivo = origen.rescateAgresivo;
    } catch (_) {}
  }

  function _restaurarPresupuestoMedia(snapshot) {
    try {
      if (!snapshot || !G.B1_PRESUPUESTOS || !G.B1_SENSITIVITY) return;
      const media = G.B1_PRESUPUESTOS[G.B1_SENSITIVITY.MEDIA];
      if (!media) return;
      media.maxSlots = snapshot.maxSlots;
      media.minConfidenceWord = snapshot.minConfidenceWord;
      media.minConfidencePage = snapshot.minConfidencePage;
      media.rescateAgresivo = snapshot.rescateAgresivo;
    } catch (_) {}
  }

  // ─── CABECERA NUMÉRICA (sin cambio) ──────────────────────────────────────

  function _esCabeceraNumericaNoNombre(original) {
    const txt = _txt(original);
    if (!txt) return false;

    const sinEspacios = txt.replace(/\s+/g, '');
    const totalDigitos = (sinEspacios.match(/\d/g) || []).length;
    const totalLetras = (sinEspacios.match(/[A-Za-zÁÉÍÓÚÜÑÀÈÌÒÙÇáéíóúüñàèìòùç]/g) || []).length;

    if (/^[\d:/.-]+$/.test(sinEspacios) && totalDigitos >= 2) return true;
    if (/^\d{1,4}([:/.-]\d{1,4}){1,3}$/.test(sinEspacios)) return true;
    if (/[\-:/.]/.test(sinEspacios) && totalDigitos >= Math.max(2, totalLetras * 2)) return true;
    return false;
  }

  // ─── FAMILIA YA CORRECTA (sin cambio) ────────────────────────────────────

  function _esFamiliaYaCorrecta(textoOriginal) {
    const tokenCompacto = _safeCompact(textoOriginal);
    if (!tokenCompacto || !Array.isArray(G.B1_FAMILIAS_PRIORITARIAS)) return false;

    for (const familia of G.B1_FAMILIAS_PRIORITARIAS) {
      const stems = Array.isArray(familia && familia.stems) ? familia.stems : [];
      for (const stem of stems) {
        const stemCompacto = _safeCompact(stem);
        if (!stemCompacto) continue;

        if (tokenCompacto === stemCompacto) return true;
        if (tokenCompacto === ('d' + stemCompacto)) return true;
        if (tokenCompacto === ('de' + stemCompacto)) return true;
        if (tokenCompacto === ('des' + stemCompacto)) return true;
        if (tokenCompacto === ('du' + stemCompacto)) return true;
      }
    }

    return false;
  }

  // ─── PARCHES DE DATOS / FAMILIA (sin cambio) ─────────────────────────────

  if (typeof G._B1_esDatoNoNombreNiFamilia === 'function') {
    const _origDato = G._B1_esDatoNoNombreNiFamilia;
    G._B1_esDatoNoNombreNiFamilia = function (textoOriginal, tokenCompacto) {
      if (_esCabeceraNumericaNoNombre(textoOriginal)) return true;
      return _origDato(textoOriginal, tokenCompacto);
    };
  }

  if (typeof G._B1_evaluarCandidatoFamiliaOCR === 'function') {
    const _origFamilia = G._B1_evaluarCandidatoFamiliaOCR;
    G._B1_evaluarCandidatoFamiliaOCR = function (p) {
      const textoOriginal = _txt(p && p.texto);
      const vacio = {
        aplica: false,
        score: 0,
        familia: null,
        matchedStem: null,
        motivo: null,
        evidencia: null,
        damage: null
      };

      if (!textoOriginal) return vacio;
      if (_esFamiliaYaCorrecta(textoOriginal)) return vacio;

      const salida = _origFamilia(p);
      if (salida && salida.aplica && _esFamiliaYaCorrecta(textoOriginal)) return vacio;

      return salida;
    };
  }

  // ─── NORMALIZACIÓN DE ESTADOS GEMINI — CAMBIADO v2 ───────────────────────
  // Esquema único: corregida / ya_valida / no_resuelta
  // Acepta todos los alias históricos y los mapea al estado nuevo correcto.
  function _normalizarCorreccionGemini(item) {
    if (!item || typeof item !== 'object') return null;

    const slotId = _txt(item.slotId);
    if (!slotId) return null;

    const solucion = _txt(item.solucion);
    const motivo = _motivoCorto(item.motivo, '');
    const estadoRaw = _normalizarClaveEstado(item.estado || item.resultado || '');

    let estado;
    switch (estadoRaw) {
      // Alias históricos + nombre nuevo
      case 'corregida':
      case 'corregido':
      case 'aplicable':
      case 'aplicada':
        estado = 'corregida';
        break;
      // Alias históricos + nombre nuevo
      case 'ya_valida':
      case 'yavalida':
      case 'ya_correcto':
      case 'yacorrecto':
      case 'correcto':
      case 'sin_cambio':
      case 'sincambio':
      case 'sin_cambios':
      case 'sincambios':
      case 'confirmado':
        estado = 'ya_valida';
        break;
      // Todos los casos de fallo → no_resuelta
      case 'no_resuelta':
      case 'noresuelta':
      case 'dudoso':
      case 'ilegible':
      case 'no_resuelto':
      case 'noresuelto':
      case 'descartada':
      case 'descartado':
        estado = 'no_resuelta';
        break;
      default:
        // Si hay solución, asumir corregida; si no, no_resuelta
        estado = solucion ? 'corregida' : 'no_resuelta';
        break;
    }

    // Guardia dura: corregida sin solución es no_resuelta
    if (estado === 'corregida' && !solucion) {
      estado = 'no_resuelta';
    }

    return { slotId, solucion, estado, motivo };
  }

  // ─── PARCHE TARDÍO ────────────────────────────────────────────────────────

  function _parcheTardio() {
    if (G.__B1_HOTFIX_71631_TARDIO_APLICADO) return;
    G.__B1_HOTFIX_71631_TARDIO_APLICADO = true;

    // ── OVERRIDE B1_construirPromptRescate — CAMBIADO v2 ──────────────────
    // Instrucciones actualizadas a los 3 estados nuevos.
    // Se elimina la dependencia de _B1_agruparSlotsAB (función no existente en runtime).
    if (typeof G.B1_construirPromptRescate === 'function') {
      G.B1_construirPromptRescate = function (slots) {
        const out = [
          'REPARADOR OCR DE ETIQUETAS ALIMENTARIAS · BOXER 1',
          '',
          'CONTEXTO: Etiquetas alimentarias. Seguridad alimentaria. Supermercados.',
          '',
          'REGLA CRÍTICA:',
          '- Debes devolver UNA fila por cada slot recibido.',
          '- No se permite omitir slots.',
          '- No se permite texto extra fuera del JSON.',
          '',
          'ESTADOS PERMITIDOS POR SLOT (exactamente uno de los tres):',
          '- corregida    → el OCR estaba roto y propones una corrección concreta.',
          '- ya_valida    → el texto ya era correcto para la aplicación. No necesitaba cambio.',
          '- no_resuelta  → no puedes corregir con seguridad. No inventes.',
          '',
          'REGLAS DE SALIDA:',
          '- Si estado = corregida,   solucion es obligatoria y diferente al original.',
          '- Si estado = ya_valida,   solucion debe ser igual al texto original.',
          '- Si estado = no_resuelta, solucion debe ir vacía y motivo debe ser corto.',
          '- NUNCA uses ya_valida cuando el texto sea incorrecto o dudoso.',
          '- NUNCA uses corregida si no estás seguro de la corrección.',
          '- NUNCA inventes una corrección. Prefiere no_resuelta.',
          '- Conserva siempre el idioma original del slot.',
          '- No traduzcas.',
          '- No toques palabras fuera del slot marcado.',
          '',
          'FORMATO DE SALIDA (JSON PURO — SIN MARKDOWN):',
          '{',
          '  "correcciones": [',
          '    {"slotId":"B1", "estado":"corregida",   "solucion":"huevo"},',
          '    {"slotId":"B2", "estado":"ya_valida",   "solucion":"egg"},',
          '    {"slotId":"B3", "estado":"no_resuelta", "solucion":"", "motivo":"imagen_ilegible"}',
          '  ],',
          '  "simetria":"exacta"',
          '}',
          '',
          'SLOTS:'
        ];

        (slots || []).forEach(slot => {
          out.push('');
          out.push(`--- ${slot.slotId} ---`);
          out.push(`OCR: "${slot.textoOriginal}"`);
          out.push(`Contexto: ${slot.contexto}`);
          if (slot.roiBase64) out.push('[Imagen ROI adjunta — validación visual obligatoria]');
        });

        out.push('');
        out.push('RESPONDE SOLO JSON. SIN TEXTO EXTRA.');
        return out.join('\n');
      };
    }

    // ── OVERRIDE _parsearRespuestaGemini — lógica idéntica, estados nuevos ─
    // Los estados salen de _normalizarCorreccionGemini, ya actualizada arriba.
    if (typeof G._parsearRespuestaGemini === 'function') {
      G._parsearRespuestaGemini = function (respuestaTrastienda) {
        const resultado = respuestaTrastienda && respuestaTrastienda.resultado
          ? respuestaTrastienda.resultado
          : {};
        let payload = resultado.respuestaGemini;

        if (typeof payload === 'string') {
          payload = payload.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
          try {
            payload = JSON.parse(payload);
          } catch (e) {
            return { ok: false, correcciones: [], simetria: null, raw: payload, parseError: e.message };
          }
        }

        if (!payload || typeof payload !== 'object') {
          return {
            ok: false,
            correcciones: [],
            simetria: null,
            raw: payload,
            parseError: 'respuestaGemini ausente o inválida'
          };
        }

        const rawCorrecciones = [];
        if (Array.isArray(payload.correcciones))  rawCorrecciones.push(...payload.correcciones);
        if (Array.isArray(payload.correccionesA)) rawCorrecciones.push(...payload.correccionesA);
        if (Array.isArray(payload.correccionesB)) rawCorrecciones.push(...payload.correccionesB);

        return {
          ok: true,
          correcciones: rawCorrecciones.map(_normalizarCorreccionGemini).filter(Boolean),
          simetria: payload.simetria || null,
          raw: payload
        };
      };
    }

    // ── OVERRIDE B1_ejecutarMerge — CAMBIADO v2 ───────────────────────────
    // Añade resultadosGemini (fuente canónica) y noResueltasCriticas (flag para pasaporte).
    if (typeof G.B1_ejecutarMerge === 'function' && typeof G.B1_verificarSimetria === 'function') {
      G.B1_ejecutarMerge = function (textoBase, slotsEnviados, resultadoRescate) {
        G.__B1_ULTIMO_DETALLE_SLOTS = null;
        G.__B1_ULTIMO_RESULTADOS_GEMINI = null;

        // Sin rescate → no hay merge
        if (!resultadoRescate.intentado) {
          return {
            mergeStatus:        G.B1_MERGE_STATUS.NO_INTENTADO,
            textoAuditado:      textoBase,
            correcciones:       [],
            noResueltas:        [],
            roiRefsRevision:    [],
            mergeCancelado:     false,
            noResueltasCriticas: false,
            resultadosGemini:   [],
            detalleSlots:       []
          };
        }

        // Verificar simetría exacta
        const simetria = G.B1_verificarSimetria(slotsEnviados, resultadoRescate.correcciones);
        if (!simetria.simetrica) {
          const noResueltas = slotsEnviados.map(s => s.slotId);
          const roiRefs     = slotsEnviados.filter(s => s.roiBase64).map(s => G.B1_crearRoiRef(s.slotId));
          // Si hay cualquier slot que no sea solo peso/formato, es crítico
          const noResueltasCriticas = slotsEnviados.some(s => !_esSlotPesoFormato(s.textoOriginal));
          const resultadosGemini = slotsEnviados.map(s => ({
            slotId:   s.slotId,
            estado:   'no_resuelta',
            original: s.textoOriginal,
            solucion: '',
            motivo:   'asimetria_slots'
          }));
          const detalleSlots = slotsEnviados.map(s => ({
            slotId:      s.slotId,
            original:    s.textoOriginal,
            estadoFinal: 'no_resuelta',
            solucion:    '',
            motivo:      'asimetria_slots'
          }));
          G.__B1_ULTIMO_DETALLE_SLOTS      = detalleSlots;
          G.__B1_ULTIMO_RESULTADOS_GEMINI  = resultadosGemini;
          return {
            mergeStatus:        G.B1_MERGE_STATUS.CANCELADO_POR_ASIMETRIA,
            textoAuditado:      textoBase,
            correcciones:       [],
            noResueltas,
            roiRefsRevision:    roiRefs,
            mergeCancelado:     true,
            motivoCancelacion:  simetria.detalle,
            noResueltasCriticas,
            resultadosGemini,
            detalleSlots
          };
        }

        // Indexar correcciones por slotId
        const mapCorrecciones = {};
        (resultadoRescate.correcciones || []).forEach(c => {
          mapCorrecciones[c.slotId] = c;
        });

        let textoAuditado = textoBase;
        const correccionesAplicadas = [];
        const noResueltas           = [];
        const roiRefsRevision       = [];
        const detalleSlots          = [];
        const resultadosGemini      = [];

        (slotsEnviados || []).forEach(slot => {
          const original = _txt(slot.textoOriginal);
          const raw = mapCorrecciones[slot.slotId] || {
            slotId:  slot.slotId,
            estado:  'no_resuelta',
            solucion: '',
            motivo:  'sin_respuesta_slot'
          };
          const norm    = _normalizarCorreccionGemini(raw);
          const estado  = norm.estado;
          const solucion = _txt(norm.solucion);
          const motivo   = _motivoCorto(norm.motivo, estado);

          // ── CORREGIDA ──
          if (estado === 'corregida') {
            if (solucion && solucion !== original) {
              textoAuditado = textoAuditado.replace(
                new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
                solucion
              );
              correccionesAplicadas.push({
                slotId:   slot.slotId,
                original: slot.textoOriginal,
                solucion,
                estado:   G.B1_SLOT_STATUS.APLICADA
              });
              resultadosGemini.push({ slotId: slot.slotId, estado: 'corregida',  original: slot.textoOriginal, solucion, motivo: '' });
              detalleSlots.push(     { slotId: slot.slotId, estadoFinal: 'corregida',  original: slot.textoOriginal, solucion, motivo: '' });
              return;
            }
            // Gemini dijo corregida pero la solución es igual al original → ya_valida
            resultadosGemini.push({ slotId: slot.slotId, estado: 'ya_valida',  original: slot.textoOriginal, solucion: original, motivo: '' });
            detalleSlots.push(     { slotId: slot.slotId, estadoFinal: 'ya_valida',  original: slot.textoOriginal, solucion: original, motivo: '' });
            return;
          }

          // ── YA_VALIDA ──
          if (estado === 'ya_valida') {
            resultadosGemini.push({ slotId: slot.slotId, estado: 'ya_valida',  original: slot.textoOriginal, solucion: solucion || original, motivo: '' });
            detalleSlots.push(     { slotId: slot.slotId, estadoFinal: 'ya_valida',  original: slot.textoOriginal, solucion: solucion || original, motivo: '' });
            return;
          }

          // ── NO_RESUELTA ──
          noResueltas.push(slot.slotId);
          if (slot.roiBase64) roiRefsRevision.push(G.B1_crearRoiRef(slot.slotId));
          resultadosGemini.push({ slotId: slot.slotId, estado: 'no_resuelta', original: slot.textoOriginal, solucion: '', motivo });
          detalleSlots.push(     { slotId: slot.slotId, estadoFinal: 'no_resuelta', original: slot.textoOriginal, solucion: '', motivo });
        });

        // Flag crítico: ¿hay algún no_resuelta que NO sea solo peso/formato?
        const noResueltasCriticas = noResueltas.some(slotId => {
          const slot = (slotsEnviados || []).find(s => s.slotId === slotId);
          // Si no encontramos el slot, asumir crítico por seguridad alimentaria
          return slot ? !_esSlotPesoFormato(slot.textoOriginal) : true;
        });

        G.__B1_ULTIMO_DETALLE_SLOTS     = detalleSlots;
        G.__B1_ULTIMO_RESULTADOS_GEMINI = resultadosGemini;

        return {
          mergeStatus:        G.B1_MERGE_STATUS.OK,
          textoAuditado,
          correcciones:       correccionesAplicadas,
          noResueltas,
          roiRefsRevision,
          mergeCancelado:     false,
          noResueltasCriticas,
          resultadosGemini,
          detalleSlots
        };
      };
    }

    // ── OVERRIDE B1_emitirPasaporte — NUEVO v2 ────────────────────────────
    // ROJO  → cualquier slot no_resuelta que no sea solo peso/formato.
    // NARANJA → solo quedan no_resueltas de peso/formato, o timeout.
    // VERDE  → todos los slots son corregida o ya_valida.
    if (typeof G.B1_emitirPasaporte === 'function' && !G.__B1_EMITIR_PASAPORTE_V2_APLICADO) {
      G.__B1_EMITIR_PASAPORTE_V2_APLICADO = true;
      G.B1_emitirPasaporte = function (merge, fiabilidad, agentEnabled, cronometro, abortReason) {

        // Lógica de aborto / viabilidad / bypass — sin cambio respecto al original
        if (abortReason) {
          return {
            estado: G.B1_PASSPORT.ROJO,
            explicacion: abortReason,
            accionSugeridaParaCerebro: G.B1_ACCIONES_CEREBRO.CORTE_TEMPRANO
          };
        }
        if (!fiabilidad.fotoViable) {
          return {
            estado: G.B1_PASSPORT.ROJO,
            explicacion: fiabilidad.razonInviable || 'Foto no procesable.',
            accionSugeridaParaCerebro: G.B1_ACCIONES_CEREBRO.ABORTAR_FLUJO
          };
        }
        if (!agentEnabled) {
          return {
            estado: G.B1_PASSPORT.ROJO,
            explicacion: 'Agente desactivado. Solo OCR base sin rescate.',
            accionSugeridaParaCerebro: null
          };
        }

        // Merge cancelado por asimetría: ROJO si afecta slots críticos
        if (merge.mergeCancelado) {
          if (merge.noResueltasCriticas) {
            return {
              estado: G.B1_PASSPORT.ROJO,
              explicacion: `Merge cancelado. Alérgenos sin resolver. ${merge.motivoCancelacion || ''}`.trim(),
              accionSugeridaParaCerebro: G.B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO
            };
          }
          return {
            estado: G.B1_PASSPORT.NARANJA,
            explicacion: `Merge cancelado. Sin slots críticos afectados. ${merge.motivoCancelacion || ''}`.trim(),
            accionSugeridaParaCerebro: G.B1_ACCIONES_CEREBRO.CONTINUAR_Y_MARCAR
          };
        }

        const tiempoAgotado  = cronometro.expired();
        const hayNoResueltos = Array.isArray(merge.noResueltas) && merge.noResueltas.length > 0;

        // ROJO: queda al menos un alérgeno o familia sin resolver
        if (hayNoResueltos && merge.noResueltasCriticas) {
          return {
            estado: G.B1_PASSPORT.ROJO,
            explicacion: `Alérgeno sin resolver. ${merge.noResueltas.length} slot(s) no_resuelta con riesgo crítico.`,
            accionSugeridaParaCerebro: G.B1_ACCIONES_CEREBRO.BLOQUEAR_GUARDADO
          };
        }

        // NARANJA: solo no críticos (peso/formato) sin resolver, o timeout
        if (hayNoResueltos || tiempoAgotado) {
          const razones = [];
          if (hayNoResueltos) razones.push(`${merge.noResueltas.length} slot(s) no crítico(s) sin resolver.`);
          if (tiempoAgotado)  razones.push('Presupuesto de tiempo agotado.');
          return {
            estado: G.B1_PASSPORT.NARANJA,
            explicacion: `Rescate parcial. ${razones.join(' ')}`,
            accionSugeridaParaCerebro: hayNoResueltos
              ? G.B1_ACCIONES_CEREBRO.CONTINUAR_Y_MARCAR
              : G.B1_ACCIONES_CEREBRO.REINTENTAR_MAS_TARDE
          };
        }

        // VERDE: todos los slots corregida o ya_valida
        return {
          estado: G.B1_PASSPORT.VERDE,
          explicacion: 'Lectura sólida. Texto auditado utilizable.',
          accionSugeridaParaCerebro: null
        };
      };
    }

    // ── OVERRIDE B1_analizar — CAMBIADO v2 ───────────────────────────────
    // Inyecta detalleSlots + resultadosGemini en datos de salida.
    if (typeof G.B1_analizar === 'function' && !G.__B1_ANALIZAR_SENSITIVITY_PATCHED) {
      const _origAnalizar = G.B1_analizar;
      G.__B1_ANALIZAR_SENSITIVITY_PATCHED = true;
      G.B1_analizar = async function (input, config) {
        const snapshot = _clonarPresupuestoMedia();
        const modoSolicitado = input && input.datos ? input.datos.sensitivityMode : null;
        if (modoSolicitado) _aplicarPresupuestoComoMedia(modoSolicitado);
        G.__B1_ULTIMO_DETALLE_SLOTS     = null;
        G.__B1_ULTIMO_RESULTADOS_GEMINI = null;
        try {
          const salida = await _origAnalizar.call(this, input, config);
          if (salida && salida.resultado && salida.resultado.datos) {
            if (Array.isArray(G.__B1_ULTIMO_DETALLE_SLOTS) && G.__B1_ULTIMO_DETALLE_SLOTS.length) {
              salida.resultado.datos.detalleSlots = G.__B1_ULTIMO_DETALLE_SLOTS;
            }
            if (Array.isArray(G.__B1_ULTIMO_RESULTADOS_GEMINI) && G.__B1_ULTIMO_RESULTADOS_GEMINI.length) {
              salida.resultado.datos.resultadosGemini = G.__B1_ULTIMO_RESULTADOS_GEMINI;
            }
          }
          return salida;
        } finally {
          _restaurarPresupuestoMedia(snapshot);
          G.__B1_ULTIMO_DETALLE_SLOTS     = null;
          G.__B1_ULTIMO_RESULTADOS_GEMINI = null;
        }
      };
    }
  }

  if (typeof queueMicrotask === 'function') queueMicrotask(_parcheTardio);
  else setTimeout(_parcheTardio, 0);
})();
