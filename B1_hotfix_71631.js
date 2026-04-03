/**
 * HOTFIX 716-31 REPARADO
 *
 * Mantiene el bloqueo de cabeceras numéricas y añade parches seguros para:
 * - no mandar al agente familias/alérgenos ya correctos
 * - exigir estados finos por slot en rescate Gemini
 * - distinguir corregido / ya_correcto / dudoso / ilegible
 * - sacar pasaporte VERDE cuando todos los slots vuelven resueltos
 * - respetar la sensibilidad elegida sin reescribir el core
 *
 * Cargar DESPUÉS de B1_slots.js.
 */
(function () {
  'use strict';

  const G = typeof globalThis !== 'undefined' ? globalThis : window;
  if (!G) return;

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

  function _esFamiliaYaCorrecta(textoOriginal) {
    const tokenCompacto = _safeCompact(textoOriginal);
    if (!tokenCompacto || !Array.isArray(G.B1_FAMILIAS_PRIORITARIAS)) return false;

    for (const familia of G.B1_FAMILIAS_PRIORITARIAS) {
      const stems = Array.isArray(familia && familia.stems) ? familia.stems : [];
      for (const stem of stems) {
        const stemCompacto = _safeCompact(stem);
        if (!stemCompacto) continue;

        if (tokenCompacto === stemCompacto) return true;

        // Formas contextuales válidas que no necesitan rescate.
        if (tokenCompacto === ('d' + stemCompacto)) return true;
        if (tokenCompacto === ('de' + stemCompacto)) return true;
        if (tokenCompacto === ('des' + stemCompacto)) return true;
        if (tokenCompacto === ('du' + stemCompacto)) return true;
      }
    }

    return false;
  }

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

      if (_esFamiliaYaCorrecta(textoOriginal)) {
        return vacio;
      }

      const salida = _origFamilia(p);

      if (salida && salida.aplica && _esFamiliaYaCorrecta(textoOriginal)) {
        return vacio;
      }

      return salida;
    };
  }

  function _normalizarCorreccionGemini(item) {
    if (!item || typeof item !== 'object') return null;

    const slotId = _txt(item.slotId);
    if (!slotId) return null;

    const solucion = _txt(item.solucion);
    const motivo = _motivoCorto(item.motivo, '');
    const estadoRaw = _normalizarClaveEstado(item.estado || item.resultado || '');

    let estado;
    switch (estadoRaw) {
      case 'corregido':
      case 'aplicable':
      case 'aplicada':
        estado = 'corregido';
        break;
      case 'ya_correcto':
      case 'yacorrecto':
      case 'correcto':
      case 'sin_cambio':
      case 'sincambio':
      case 'sin_cambios':
      case 'sincambios':
      case 'confirmado':
        estado = 'ya_correcto';
        break;
      case 'ilegible':
        estado = 'ilegible';
        break;
      case 'dudoso':
      case 'no_resuelta':
      case 'noresuelta':
      case 'no_resuelto':
      case 'noresuelto':
      case 'descartada':
      case 'descartado':
        estado = 'dudoso';
        break;
      default:
        estado = solucion ? 'corregido' : 'dudoso';
        break;
    }

    if (estado === 'corregido' && !solucion) {
      estado = 'dudoso';
    }

    return { slotId, solucion, estado, motivo };
  }

  function _parcheTardio() {
    if (G.__B1_HOTFIX_71631_TARDIO_APLICADO) return;
    G.__B1_HOTFIX_71631_TARDIO_APLICADO = true;

    if (typeof G.B1_construirPromptRescate === 'function' && typeof G._B1_agruparSlotsAB === 'function') {
      G.B1_construirPromptRescate = function (slots) {
        const grupos = G._B1_agruparSlotsAB(slots);
        const out = [
          'REPARADOR OCR DE ETIQUETAS ALIMENTARIAS · BOXER 1',
          '',
          'ALCANCE CERRADO:',
          '- PAQUETE A: posibles alérgenos o familias rotas.',
          '- PAQUETE B: posibles pesos, litros, packs, unidades o formatos rotos.',
          '',
          'REGLA CRÍTICA:',
          '- Debes devolver UNA fila por cada slot recibido.',
          '- No se permite omitir slots.',
          '- No se permite texto extra fuera del JSON.',
          '',
          'ESTADOS PERMITIDOS POR SLOT:',
          '- corregido: has reparado el texto con seguridad.',
          '- ya_correcto: el texto ya estaba bien y debe quedarse igual.',
          '- dudoso: no puedes corregir con seguridad.',
          '- ilegible: la ROI no permite leer con fiabilidad.',
          '',
          'REGLAS DE SALIDA:',
          '- Si estado = corregido o ya_correcto, solucion es obligatoria.',
          '- Si estado = dudoso o ilegible, solucion debe ir vacía.',
          '- Si estado = dudoso o ilegible, motivo debe ser corto y técnico.',
          '- Conserva siempre el idioma original del slot.',
          '- No traduzcas.',
          '- No inventes categorías.',
          '- No toques palabras fuera del slot marcado.',
          '- Si el slot ya está bien leído, usa ya_correcto.',
          '- Si no puedes corregir con seguridad, usa dudoso o ilegible.',
          '',
          'FORMATO DE SALIDA (JSON PURO):',
          '{',
          '  "correcciones": [',
          '    {"slotId":"B1", "estado":"corregido", "solucion":"huevo"},',
          '    {"slotId":"B2", "estado":"ya_correcto", "solucion":"egg"},',
          '    {"slotId":"B3", "estado":"dudoso", "solucion":"", "motivo":"baja_confianza_roi"},',
          '    {"slotId":"B4", "estado":"ilegible", "solucion":"", "motivo":"texto_no_legible"}',
          '  ],',
          '  "simetria":"exacta"',
          '}',
          ''
        ];

        out.push(`PAQUETE A · TOTAL ${grupos.paqueteA.length}`);
        if (grupos.paqueteA.length === 0) out.push('[vacío]');
        grupos.paqueteA.forEach(slot => {
          out.push(`--- ${slot.slotId} [familia] ---`);
          out.push(`OCR: "${slot.textoOriginal}"`);
          out.push(`Contexto: ${slot.contexto}`);
          if (slot.roiBase64) out.push('[Imagen ROI adjunta]');
          out.push('');
        });

        out.push(`PAQUETE B · TOTAL ${grupos.paqueteB.length}`);
        if (grupos.paqueteB.length === 0) out.push('[vacío]');
        grupos.paqueteB.forEach(slot => {
          out.push(`--- ${slot.slotId} [peso_formato] ---`);
          out.push(`OCR: "${slot.textoOriginal}"`);
          out.push(`Contexto: ${slot.contexto}`);
          if (slot.roiBase64) out.push('[Imagen ROI adjunta]');
          out.push('');
        });

        out.push('RESPONDE SOLO JSON. SIN TEXTO EXTRA.');
        return out.join('\n');
      };
    }

    if (typeof G._parsearRespuestaGemini === 'function') {
      G._parsearRespuestaGemini = function (respuestaTrastienda) {
        const resultado = respuestaTrastienda && respuestaTrastienda.resultado ? respuestaTrastienda.resultado : {};
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
          return { ok: false, correcciones: [], simetria: null, raw: payload, parseError: 'respuestaGemini ausente o inválida' };
        }

        const rawCorrecciones = [];
        if (Array.isArray(payload.correcciones)) rawCorrecciones.push(...payload.correcciones);
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

    if (typeof G.B1_ejecutarMerge === 'function' && typeof G.B1_verificarSimetria === 'function') {
      G.B1_ejecutarMerge = function (textoBase, slotsEnviados, resultadoRescate) {
        G.__B1_ULTIMO_DETALLE_SLOTS = null;

        if (!resultadoRescate.intentado) {
          return {
            mergeStatus: G.B1_MERGE_STATUS.NO_INTENTADO,
            textoAuditado: textoBase,
            correcciones: [],
            noResueltas: [],
            roiRefsRevision: [],
            mergeCancelado: false,
            detalleSlots: []
          };
        }

        const simetria = G.B1_verificarSimetria(slotsEnviados, resultadoRescate.correcciones);
        if (!simetria.simetrica) {
          const noResueltas = slotsEnviados.map(s => s.slotId);
          const roiRefs = slotsEnviados
            .filter(s => s.roiBase64)
            .map(s => G.B1_crearRoiRef(s.slotId));
          const detalleSlots = slotsEnviados.map(s => ({
            slotId: s.slotId,
            original: s.textoOriginal,
            estadoFinal: 'dudoso',
            solucion: '',
            motivo: 'asimetria_slots'
          }));
          G.__B1_ULTIMO_DETALLE_SLOTS = detalleSlots;
          return {
            mergeStatus: G.B1_MERGE_STATUS.CANCELADO_POR_ASIMETRIA,
            textoAuditado: textoBase,
            correcciones: [],
            noResueltas,
            roiRefsRevision: roiRefs,
            mergeCancelado: true,
            motivoCancelacion: simetria.detalle,
            detalleSlots
          };
        }

        const mapCorrecciones = {};
        (resultadoRescate.correcciones || []).forEach(c => {
          mapCorrecciones[c.slotId] = c;
        });

        let textoAuditado = textoBase;
        const correccionesAplicadas = [];
        const noResueltas = [];
        const roiRefsRevision = [];
        const detalleSlots = [];

        (slotsEnviados || []).forEach(slot => {
          const original = _txt(slot.textoOriginal);
          const c = mapCorrecciones[slot.slotId] || { slotId: slot.slotId, estado: 'dudoso', solucion: '', motivo: 'sin_respuesta_slot' };
          const estado = _normalizarCorreccionGemini(c).estado;
          const solucion = _txt(c.solucion);
          const motivo = _motivoCorto(c.motivo, estado);

          if (estado === 'corregido') {
            if (solucion && solucion !== original) {
              textoAuditado = textoAuditado.replace(new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), solucion);
              correccionesAplicadas.push({
                slotId: slot.slotId,
                original: slot.textoOriginal,
                solucion,
                estado: G.B1_SLOT_STATUS.APLICADA
              });
              detalleSlots.push({ slotId: slot.slotId, original: slot.textoOriginal, estadoFinal: 'corregido', solucion, motivo: '' });
              return;
            }

            if (solucion === original) {
              detalleSlots.push({ slotId: slot.slotId, original: slot.textoOriginal, estadoFinal: 'ya_correcto', solucion, motivo: '' });
              return;
            }

            noResueltas.push(slot.slotId);
            if (slot.roiBase64) roiRefsRevision.push(G.B1_crearRoiRef(slot.slotId));
            detalleSlots.push({ slotId: slot.slotId, original: slot.textoOriginal, estadoFinal: 'dudoso', solucion: '', motivo: 'corregido_sin_solucion' });
            return;
          }

          if (estado === 'ya_correcto') {
            detalleSlots.push({ slotId: slot.slotId, original: slot.textoOriginal, estadoFinal: 'ya_correcto', solucion: solucion || original, motivo: '' });
            return;
          }

          noResueltas.push(slot.slotId);
          if (slot.roiBase64) roiRefsRevision.push(G.B1_crearRoiRef(slot.slotId));
          detalleSlots.push({
            slotId: slot.slotId,
            original: slot.textoOriginal,
            estadoFinal: estado === 'ilegible' ? 'ilegible' : 'dudoso',
            solucion: '',
            motivo
          });
        });

        G.__B1_ULTIMO_DETALLE_SLOTS = detalleSlots;
        return {
          mergeStatus: G.B1_MERGE_STATUS.OK,
          textoAuditado,
          correcciones: correccionesAplicadas,
          noResueltas,
          roiRefsRevision,
          mergeCancelado: false,
          detalleSlots
        };
      };
    }

    if (typeof G.B1_analizar === 'function' && !G.__B1_ANALIZAR_SENSITIVITY_PATCHED) {
      const _origAnalizar = G.B1_analizar;
      G.__B1_ANALIZAR_SENSITIVITY_PATCHED = true;
      G.B1_analizar = async function (input, config) {
        const snapshot = _clonarPresupuestoMedia();
        const modoSolicitado = input && input.datos ? input.datos.sensitivityMode : null;
        if (modoSolicitado) _aplicarPresupuestoComoMedia(modoSolicitado);
        G.__B1_ULTIMO_DETALLE_SLOTS = null;
        try {
          const salida = await _origAnalizar.call(this, input, config);
          if (
            salida && salida.resultado && salida.resultado.datos &&
            Array.isArray(G.__B1_ULTIMO_DETALLE_SLOTS) && G.__B1_ULTIMO_DETALLE_SLOTS.length
          ) {
            salida.resultado.datos.detalleSlots = G.__B1_ULTIMO_DETALLE_SLOTS;
          }
          return salida;
        } finally {
          _restaurarPresupuestoMedia(snapshot);
          G.__B1_ULTIMO_DETALLE_SLOTS = null;
        }
      };
    }
  }

  if (typeof queueMicrotask === 'function') queueMicrotask(_parcheTardio);
  else setTimeout(_parcheTardio, 0);
})();
