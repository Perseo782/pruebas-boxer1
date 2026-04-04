/* B1_rescate.js - normaliza estados de Gemini */
(function (global) {
  'use strict';

  function _B1_normalizarEstadoGemini(estadoRaw, original, solucion) {
    const estado = String(estadoRaw || '').trim().toLowerCase();
    const orig = String(original || '').trim();
    const sol = String(solucion || '').trim();

    if (estado === 'ya_valida' || estado === 'ya_valida_sin_cambio' || estado === 'sin_cambio') return 'ya_valida';
    if (estado === 'no_resuelta' || estado === 'no_resuelto') return 'no_resuelta';
    if (estado === 'aplicable' || estado === 'aplicada' || estado === 'corregida') {
      if (!sol || sol === orig) return 'ya_valida';
      return 'aplicable';
    }
    if (!sol) return 'no_resuelta';
    if (sol === orig) return 'ya_valida';
    return 'aplicable';
  }

  function B1_normalizarRespuestaGemini(respuesta, slots) {
    const correcciones = Array.isArray(respuesta && respuesta.correcciones) ? respuesta.correcciones : [];
    const slotsPorId = Object.create(null);
    (Array.isArray(slots) ? slots : []).forEach((s) => { if (s && s.slotId) slotsPorId[s.slotId] = s; });

    return correcciones.map((c) => {
      const slot = slotsPorId[c.slotId] || {};
      const original = c.original != null ? c.original : (slot.original || '');
      const solucion = c.solucion != null ? c.solucion : '';
      const estado = _B1_normalizarEstadoGemini(c.estado, original, solucion);
      return {
        slotId: c.slotId,
        original: original,
        solucion: solucion,
        estado: estado,
        categoria: c.categoria || slot.categoria || null,
        familia: c.familia || slot.familia || null
      };
    });
  }

  global.B1_normalizarRespuestaGemini = B1_normalizarRespuestaGemini;
})(typeof window !== 'undefined' ? window : globalThis);
