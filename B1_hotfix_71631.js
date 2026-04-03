/**
 * HOTFIX 716-31
 * Bloquea que fechas/códigos numéricos de cabecera entren por la ruta de nombre.
 * Cargar DESPUÉS de B1_slots.js.
 */
(function () {
  if (typeof _B1_esDatoNoNombreNiFamilia !== 'function') return;

  function _B1_esCabeceraNumericaNoNombre(original) {
    const txt = String(original || '').trim();
    if (!txt) return false;

    const sinEspacios = txt.replace(/\s+/g, '');
    const totalDigitos = (sinEspacios.match(/\d/g) || []).length;
    const totalLetras = (sinEspacios.match(/[A-Za-zÁÉÍÓÚÜÑÀÈÌÒÙÇáéíóúüñàèìòùç]/g) || []).length;

    // Solo números y separadores: 716-31 / 07-24 / 10:31 / 12/2023
    if (/^[\d:/.-]+$/.test(sinEspacios) && totalDigitos >= 2) return true;

    // Grupo numérico típico de fecha/hora/código corto.
    if (/^\d{1,4}([:/.-]\d{1,4}){1,3}$/.test(sinEspacios)) return true;

    // Predominio claro de dígitos con separador comercial/técnico.
    if (/[\-:/.]/.test(sinEspacios) && totalDigitos >= Math.max(2, totalLetras * 2)) return true;

    return false;
  }

  const _B1_esDatoNoNombreNiFamilia_original = _B1_esDatoNoNombreNiFamilia;

  _B1_esDatoNoNombreNiFamilia = function (textoOriginal, tokenCompacto) {
    if (_B1_esCabeceraNumericaNoNombre(textoOriginal)) return true;
    return _B1_esDatoNoNombreNiFamilia_original(textoOriginal, tokenCompacto);
  };
})();
