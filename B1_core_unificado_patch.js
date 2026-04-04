/* B1_core_unificado_patch.js - merge y pasaporte con 3 estados */
(function (global) {
  'use strict';

  function _B1_reemplazarPrimera(texto, original, solucion) {
    if (!original || !solucion || original === solucion) return texto;
    const idx = String(texto).indexOf(original);
    if (idx < 0) return texto;
    return String(texto).slice(0, idx) + solucion + String(texto).slice(idx + original.length);
  }

  function B1_aplicarResultadoRescate(textoBaseVision, slots, respuestaNormalizada) {
    let textoAuditado = String(textoBaseVision || '');
    const slotsList = Array.isArray(slots) ? slots : [];
    const respuesta = Array.isArray(respuestaNormalizada) ? respuestaNormalizada : [];
    const porId = Object.create(null);
    respuesta.forEach((r) => { if (r && r.slotId) porId[r.slotId] = r; });

    const corregidas = [];
    const yaValidas = [];
    const noResueltasVerdad = [];
    const correcciones = [];
    const roiRefsRevision = [];

    for (const slot of slotsList) {
      const r = porId[slot.slotId];
      if (!r) {
        noResueltasVerdad.push(slot.slotId);
        roiRefsRevision.push({ slotId: slot.slotId, ref: 'roi://temp/' + slot.slotId, ttlMs: 900000 });
        continue;
      }

      if (r.estado === 'aplicable') {
        textoAuditado = _B1_reemplazarPrimera(textoAuditado, r.original, r.solucion);
        const item = {
          slotId: r.slotId,
          original: r.original,
          solucion: r.solucion,
          estado: 'aplicada',
          categoria: r.categoria || slot.categoria || null,
          familia: r.familia || slot.familia || null
        };
        corregidas.push(item);
        correcciones.push(item);
        continue;
      }

      if (r.estado === 'ya_valida') {
        yaValidas.push({
          slotId: r.slotId,
          original: r.original,
          solucion: r.solucion || r.original,
          estado: 'ya_valida',
          categoria: r.categoria || slot.categoria || null,
          familia: r.familia || slot.familia || null
        });
        continue;
      }

      noResueltasVerdad.push(r.slotId);
      roiRefsRevision.push({ slotId: r.slotId, ref: 'roi://temp/' + r.slotId, ttlMs: 900000 });
    }

    const hayNoResueltaFamilia = noResueltasVerdad.some((slotId) => {
      const s = slotsList.find((x) => x.slotId === slotId);
      return s && s.categoria === 'familia';
    });
    const hayNoResueltaFormato = noResueltasVerdad.some((slotId) => {
      const s = slotsList.find((x) => x.slotId === slotId);
      return s && s.categoria === 'formato';
    });

    let estadoPasaporteModulo = 'VERDE';
    let accionSugeridaParaCerebro = null;
    let warning = null;

    if (hayNoResueltaFamilia) {
      estadoPasaporteModulo = 'ROJO';
      accionSugeridaParaCerebro = 'bloquear_y_revisar';
      warning = 'Rescate incompleto en alérgenos/familias.';
    } else if (hayNoResueltaFormato) {
      estadoPasaporteModulo = 'NARANJA';
      accionSugeridaParaCerebro = 'continuar_y_marcar_revision';
      warning = 'Rescate parcial en formato.';
    }

    return {
      textoAuditado,
      correcciones,
      corregidas,
      yaValidas,
      noResueltas: noResueltasVerdad,
      noResueltasVerdad,
      roiRefsRevision,
      mergeStatus: 'ok',
      estadoPasaporteModulo,
      accionSugeridaParaCerebro,
      warning
    };
  }

  global.B1_aplicarResultadoRescate = B1_aplicarResultadoRescate;
})(typeof window !== 'undefined' ? window : globalThis);
