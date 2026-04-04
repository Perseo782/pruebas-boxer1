/* B1_slots.js - cierre de entrada al agente: solo roturas reales de familia/formato */
(function (global) {
  'use strict';

  const FAMILIA_VARIANTES_VALIDAS = new Set([
    'apio','celery','celeri','celeriac',
    'cacahuete','cacahuetes','mani','peanut','peanuts','amendoim','amendoins',
    'crustaceo','crustaceos','crustacean','crustaceans',
    'gluten','trigo','wheat','ble','semola','semolina','cebada','barley','centeno','rye','espelta','spelt','kamut',
    'huevo','huevos','egg','eggs','ovo','ovos','oeuf','oeufs',"d'oeuf",'albumina',
    'leche','milk','leite','lait','lacteo','lacteos','queso','quesos','cheese','fromage','butter','mantequilla',
    'mostaza','mustard','moutarde','mostarda',
    'molusco','moluscos','mollusc','molluscs',
    'pescado','fish','peixe','poisson',
    'sesamo','sesame','gergelim',
    'soja','soy','soya',
    'sulfitos','sulfito','sulfites','sulfite',
    'frutos secos','frutossecos','nuts','nut','almendra','almendras','hazelnut','hazelnuts','noisette','noisettes','nuez','nueces',
    'altramuz','altramuces','lupin','lupino'
  ]);

  const FAMILIA_STEMS = [
    { familia: 'huevo', stem: 'huevo', prioridad: 280 },
    { familia: 'huevo', stem: 'ovo', prioridad: 280 },
    { familia: 'huevo', stem: 'eggs', prioridad: 280 },
    { familia: 'huevo', stem: 'oeuf', prioridad: 300 },
    { familia: 'leche', stem: 'leche', prioridad: 310 },
    { familia: 'leche', stem: 'leite', prioridad: 310 },
    { familia: 'leche', stem: 'lait', prioridad: 310 },
    { familia: 'leche', stem: 'milk', prioridad: 310 },
    { familia: 'leche', stem: 'lact', prioridad: 310 },
    { familia: 'mostaza', stem: 'mostaza', prioridad: 270 },
    { familia: 'mostaza', stem: 'mustard', prioridad: 270 },
    { familia: 'mostaza', stem: 'moutarde', prioridad: 270 },
    { familia: 'mostaza', stem: 'mostarda', prioridad: 270 },
    { familia: 'sulfitos', stem: 'sulfito', prioridad: 270 },
    { familia: 'sulfitos', stem: 'sulfites', prioridad: 270 },
    { familia: 'gluten', stem: 'trigo', prioridad: 260 },
    { familia: 'gluten', stem: 'wheat', prioridad: 260 },
    { familia: 'gluten', stem: 'ble', prioridad: 260 },
    { familia: 'gluten', stem: 'cebada', prioridad: 260 }
  ];

  const FORMATO_VALIDO_EXACTO = /^(?:\d+(?:[.,]\d+)?)(?:\s)?(?:kg|g|gr|ml|cl|l|lt|lts|ud|uds|u)$/i;
  const FORMATO_PACK_VALIDO = /^(?:\d+)\s?x\s?(?:\d+(?:[.,]\d+)?)(?:\s)?(?:kg|g|gr|ml|cl|l|lt|lts)$/i;

  function _B1_norm(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  function _B1_compacto(s) {
    return _B1_norm(s).replace(/\s+/g, '');
  }
  function _B1_lev(a, b) {
    a = String(a || '');
    b = String(b || '');
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }
  function _B1_esVarianteValidaExacta(token) {
    const t = _B1_compacto(token).replace(/[’']/g, "'");
    if (!t) return false;
    if (FAMILIA_VARIANTES_VALIDAS.has(t)) return true;
    return t === "doeuf" || t === "d'oeuf";
  }
  function _B1_parecidoARoturaFamilia(token) {
    const t = _B1_compacto(token).replace(/[’']/g, '');
    if (!t || _B1_esVarianteValidaExacta(t)) return null;
    for (const item of FAMILIA_STEMS) {
      const stem = _B1_compacto(item.stem).replace(/[’']/g, '');
      if (t.includes(stem) && t !== stem) {
        return { familia: item.familia, matchedStem: item.stem, prioridad: item.prioridad, motivo: 'subcadena' };
      }
      const dist = _B1_lev(t, stem);
      const longCompat = Math.abs(t.length - stem.length) <= 1;
      if (dist === 1 && longCompat) {
        return { familia: item.familia, matchedStem: item.stem, prioridad: item.prioridad, motivo: 'distancia_1' };
      }
    }
    return null;
  }
  function _B1_esFormatoYaValido(token) {
    const raw = String(token || '').trim();
    return FORMATO_VALIDO_EXACTO.test(raw) || FORMATO_PACK_VALIDO.test(raw);
  }
  function _B1_pareceFormatoRoto(token) {
    const raw = String(token || '').trim();
    const t = _B1_compacto(raw);
    if (!t || _B1_esFormatoYaValido(raw)) return null;
    if (/^(l:|lote|fecha|rgse|rsi|ce)/i.test(raw)) return null;
    if (/\//.test(raw)) return null;
    if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(raw)) return null;
    if (/^\d{2,6}[:.-]\d{2,6}$/.test(raw)) return null;
    const tieneDigitos = /\d/.test(t);
    if (!tieneDigitos) return null;
    const unidadDanada = /(kg|kq|k9|g|9|gr|ml|m1|cl|l|lt|lts|ud|uds|x)/i.test(t);
    const packDanado = /^\d+\s*x\s*\d+/i.test(raw) || /^\d+x\d+/i.test(t);
    if (unidadDanada || packDanado) {
      return { prioridad: 230, motivo: 'patron_formato_danado' };
    }
    return null;
  }

  function _B1_clasificarPalabraDudosa(entry) {
    const token = entry && entry.textoOriginal ? entry.textoOriginal : '';
    if (!token) return { ...entry, decision: 'descartado_no_prioritario', motivo: 'sin_texto' };
    if (_B1_esVarianteValidaExacta(token) || _B1_esFormatoYaValido(token)) {
      return { ...entry, decision: 'descartado_no_prioritario', motivo: 'fuera_de_alcance_o_ya_valido' };
    }
    const fam = _B1_parecidoARoturaFamilia(token);
    if (fam) return { ...entry, decision: 'candidato_agente_familia', motivo: fam.motivo, familia: fam.familia, matchedStem: fam.matchedStem, prioridad: fam.prioridad };
    const fmt = _B1_pareceFormatoRoto(token);
    if (fmt) return { ...entry, decision: 'candidato_agente_formato', motivo: fmt.motivo, familia: null, matchedStem: null, prioridad: fmt.prioridad };
    return { ...entry, decision: 'descartado_no_prioritario', motivo: 'fuera_de_alcance_o_ya_valido' };
  }

  function _B1_decisionFinal(entry) {
    if (!entry) return entry;
    if (!(entry.decision === 'candidato_agente_familia' || entry.decision === 'candidato_agente_formato')) return entry;
    return {
      ...entry,
      decision: entry.decision === 'candidato_agente_familia' ? 'enviado_agente_familia' : 'enviado_agente_formato',
      validacionFinal: {
        nombreFiltro: 'FILTRO_DE_VALIDACION_FINAL_DE_NEGOCIO',
        aprobado: true,
        motivo: entry.decision === 'candidato_agente_familia' ? 'familia_validada' : 'formato_validado',
        contextoZona: entry.zona || 'neutral',
        detalle: {
          tipo: entry.motivo || null,
          tokenRaw: entry.textoOriginal || '',
          tokenCompacto: _B1_compacto(entry.textoOriginal || ''),
          stem: entry.matchedStem || null
        }
      }
    };
  }

  function B1_prepararLoteRescate(payload) {
    const entradas = Array.isArray(payload && payload.entradasSelector) ? payload.entradasSelector : [];
    const decisiones = entradas.map(_B1_clasificarPalabraDudosa).map(_B1_decisionFinal);
    const enviados = decisiones.filter((d) => String(d.decision || '').startsWith('enviado_agente_'));
    const noPrioritario = decisiones.filter((d) => d.decision === 'descartado_no_prioritario');
    const slots = enviados.slice(0, (payload && payload.maxSlots) || 15).map((d, idx) => ({
      slotId: 'B' + (idx + 1),
      original: d.textoOriginal,
      categoria: d.decision === 'enviado_agente_formato' ? 'formato' : 'familia',
      familia: d.familia || null,
      matchedStem: d.matchedStem || null,
      evidencia: d.matchedStem ? `${d.textoOriginal}->${d.matchedStem}` : null,
      meta: d
    }));

    return {
      slots,
      selectorOCR: {
        totalDudas: decisiones.length,
        totalBasura: 0,
        totalEnviadoAgente: enviados.length,
        totalNoPrioritario: noPrioritario.length,
        totalDescartadoPorCupo: Math.max(0, enviados.length - slots.length),
        totalDescartadoValidacionFinal: 0,
        totalRescatadoContextoCritico: 0,
        descartadoBasura: [],
        enviadoAgente: enviados,
        descartadoNoPrioritario: noPrioritario,
        descartadoPorCupo: [],
        descartadoValidacionFinal: [],
        rescatadoContextoCritico: [],
        decisiones,
        validacionFinal: {
          nombreFiltro: 'FILTRO_DE_VALIDACION_FINAL_DE_NEGOCIO',
          totalCandidatasRevisadas: enviados.length,
          totalAprobadas: enviados.length,
          totalDescartadas: 0,
          aprobadas: enviados.map((e) => ({
            textoOriginal: e.textoOriginal,
            decisionOriginal: e.decision.replace('enviado_', 'candidato_'),
            familia: e.familia || null,
            prioridad: e.prioridad || 0,
            validacionFinal: e.validacionFinal
          })),
          descartadas: []
        },
        sospechaContextualAcumulada: {
          nombreFiltro: 'FILTRO_DE_SOSPECHA_CONTEXTUAL_ACUMULADA',
          totalRevisadas: noPrioritario.length,
          totalRescatadas: 0,
          totalDescartadas: noPrioritario.length,
          rescatadas: [],
          descartadas: noPrioritario.map((e) => ({
            textoOriginal: e.textoOriginal,
            decisionFinal: e.decision,
            familia: null,
            prioridad: 0,
            sospechaContextualAcumulada: {
              nombreFiltro: 'FILTRO_DE_SOSPECHA_CONTEXTUAL_ACUMULADA',
              aprobado: false,
              motivo: 'filtro_desactivado_fuera_de_alcance',
              detalle: null
            }
          }))
        }
      }
    };
  }

  global.B1_prepararLoteRescate = B1_prepararLoteRescate;
})(typeof window !== 'undefined' ? window : globalThis);
