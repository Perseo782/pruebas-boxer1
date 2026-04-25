/**
 * =====================================================================
 * BOXER 1 v2 · SLOTS EMPAQUETADOR
 * =====================================================================
 * Empaqueta rotasReconocidas para Gemini:
 * - slotId
 * - contexto 3+3 intrabloque
 * - ROI base64 jpeg
 * - auditoria de salida
 * =====================================================================
 */

var _B1_EMP_CLEANUP_SEQ = 0;
var _B1_EMP_CLEANUP_TIMEOUTS = Object.create(null);

function _B1_emp_generarCleanupId(traceId) {
  _B1_EMP_CLEANUP_SEQ += 1;
  return String(traceId || 'b1_cleanup') + '_' + _B1_EMP_CLEANUP_SEQ;
}

function _B1_emp_liberarCanvasTemporal(canvas) {
  if (!canvas) return;

  try {
    if (typeof canvas.getContext === 'function') {
      var ctx = canvas.getContext('2d');
      if (ctx && typeof ctx.clearRect === 'function') {
        ctx.clearRect(0, 0, canvas.width || 0, canvas.height || 0);
      }
    }
  } catch (_) {}

  try {
    if (typeof canvas.width === 'number') canvas.width = 1;
    if (typeof canvas.height === 'number') canvas.height = 1;
  } catch (_) {}
}

function _B1_emp_liberarSlotsTemporales(slots) {
  if (!Array.isArray(slots)) return;

  for (var i = 0; i < slots.length; i++) {
    var slot = slots[i];
    if (!slot || typeof slot !== 'object') continue;
    slot.roiBase64 = null;
    slot.boundingPoly = null;
    slot.contexto = '';
    slot.candidatoMotor = null;
    slot.candidatoMotor2 = null;
    slot.familiasCandidatas = [];
  }
}

function B1_programarLimpiezaTemporales(params) {
  params = params || {};

  var slots = Array.isArray(params.slots) ? params.slots : [];
  var canvas = params.canvas || null;
  var tieneSlotsConROI = slots.some(function(slot) {
    return !!(slot && slot.roiBase64);
  });

  if (!canvas && !tieneSlotsConROI) {
    return null;
  }

  var delayMs = typeof params.delayMs === 'number' && params.delayMs >= 0
    ? Math.round(params.delayMs)
    : ((typeof B1_CONFIG !== 'undefined' && B1_CONFIG && B1_CONFIG.POST_ANALYSIS_CLEANUP_DELAY_MS) || 3000);

  var cleanupId = _B1_emp_generarCleanupId(params.traceId);
  _B1_EMP_CLEANUP_TIMEOUTS[cleanupId] = setTimeout(function() {
    try {
      _B1_emp_liberarSlotsTemporales(slots);
      _B1_emp_liberarCanvasTemporal(canvas);
    } finally {
      delete _B1_EMP_CLEANUP_TIMEOUTS[cleanupId];
    }
  }, delayMs);

  return cleanupId;
}

function _B1_emp_extraerTextoPalabra(palabra) {
  if (typeof palabra === 'string') return palabra.trim();
  if (!palabra || typeof palabra !== 'object') return '';
  return String(
    palabra.texto != null ? palabra.texto :
    palabra.text != null ? palabra.text :
    palabra.valor != null ? palabra.valor :
    ''
  ).trim();
}

function _B1_emp_resolverPosicionPalabra(bloque, wordIndex, textoOriginal) {
  var palabras = bloque && Array.isArray(bloque.palabras) ? bloque.palabras : [];
  var i;

  if (typeof wordIndex === 'number') {
    for (i = 0; i < palabras.length; i++) {
      if (palabras[i] && palabras[i].wordIndex === wordIndex) return i;
    }
    if (wordIndex >= 0 && wordIndex < palabras.length) return wordIndex;
  }

  if (textoOriginal) {
    for (i = 0; i < palabras.length; i++) {
      if (_B1_emp_extraerTextoPalabra(palabras[i]) === textoOriginal) return i;
    }
  }

  return -1;
}

function _B1_emp_construirContexto(bloque, wordIndex, slotId, textoOriginal) {
  var marker = '[[' + slotId + '|' + String(textoOriginal || '').trim() + ']]';
  var palabras = bloque && Array.isArray(bloque.palabras) ? bloque.palabras : [];
  var ventana = (typeof B1_CONFIG !== 'undefined' && B1_CONFIG && B1_CONFIG.VENTANA_CONTEXTO) || 3;
  var posicion = _B1_emp_resolverPosicionPalabra(bloque, wordIndex, textoOriginal);

  if (!palabras.length || posicion < 0) {
    return marker;
  }

  var inicio = Math.max(0, posicion - ventana);
  var fin = Math.min(palabras.length - 1, posicion + ventana);
  var partes = [];

  for (var i = inicio; i <= fin; i++) {
    if (i === posicion) {
      partes.push(marker);
    } else {
      var texto = _B1_emp_extraerTextoPalabra(palabras[i]);
      if (texto) partes.push(texto);
    }
  }

  return partes.join(' ').replace(/\s+/g, ' ').trim() || marker;
}

function _B1_emp_extraerVertices(canvas, boundingPoly) {
  if (!canvas || !boundingPoly) return [];

  var raw = [];
  if (Array.isArray(boundingPoly)) raw = boundingPoly;
  else if (Array.isArray(boundingPoly.vertices)) raw = boundingPoly.vertices;
  else if (Array.isArray(boundingPoly.normalizedVertices)) raw = boundingPoly.normalizedVertices;

  var vertices = [];
  for (var i = 0; i < raw.length; i++) {
    var punto = raw[i] || {};
    var x = punto.x;
    var y = punto.y;

    if ((x == null || y == null) && punto.vertex) {
      x = punto.vertex.x;
      y = punto.vertex.y;
    }

    if (typeof x !== 'number' || typeof y !== 'number') continue;

    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      vertices.push({ x: x * canvas.width, y: y * canvas.height });
    } else {
      vertices.push({ x: x, y: y });
    }
  }

  return vertices;
}

function _B1_emp_crearCanvasTemporal(width, height) {
  if (typeof document !== 'undefined' && document && typeof document.createElement === 'function') {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  return null;
}

function _B1_emp_calcularEscalaZoomROI(w, h) {
  var factorBase = 2;
  var minLado = 120;
  var maxLado = 448;
  var ladoMenor = Math.max(1, Math.min(w, h));
  var factor = Math.max(factorBase, minLado / ladoMenor);
  factor = Math.min(factor, maxLado / Math.max(1, w), maxLado / Math.max(1, h));
  return Math.max(1, factor);
}

function _B1_emp_recortarROI(canvas, boundingPoly) {
  try {
    if (!canvas || typeof canvas.width !== 'number' || typeof canvas.height !== 'number') return null;
    if (!boundingPoly) return null;

    var vertices = _B1_emp_extraerVertices(canvas, boundingPoly);
    if (!vertices.length) return null;

    var minX = Number.POSITIVE_INFINITY;
    var minY = Number.POSITIVE_INFINITY;
    var maxX = Number.NEGATIVE_INFINITY;
    var maxY = Number.NEGATIVE_INFINITY;

    for (var i = 0; i < vertices.length; i++) {
      minX = Math.min(minX, vertices[i].x);
      minY = Math.min(minY, vertices[i].y);
      maxX = Math.max(maxX, vertices[i].x);
      maxY = Math.max(maxY, vertices[i].y);
    }

    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return null;

    var margin = (typeof B1_CONFIG !== 'undefined' && B1_CONFIG && B1_CONFIG.ROI_MARGIN_PX) || 15;
    var x = Math.max(0, Math.floor(minX - margin));
    var y = Math.max(0, Math.floor(minY - margin));
    var w = Math.min(canvas.width - x, Math.ceil((maxX - minX) + (margin * 2)));
    var h = Math.min(canvas.height - y, Math.ceil((maxY - minY) + (margin * 2)));

    if (w < 5 || h < 5) return null;

    var factor = _B1_emp_calcularEscalaZoomROI(w, h);
    var outW = Math.max(1, Math.round(w * factor));
    var outH = Math.max(1, Math.round(h * factor));
    var cropCanvas = _B1_emp_crearCanvasTemporal(outW, outH);
    if (!cropCanvas || typeof cropCanvas.getContext !== 'function') return null;

    var ctx = cropCanvas.getContext('2d');
    if (!ctx || typeof ctx.drawImage !== 'function') return null;

    if (typeof ctx.imageSmoothingEnabled === 'boolean') {
      ctx.imageSmoothingEnabled = false;
    }

    ctx.drawImage(canvas, x, y, w, h, 0, 0, outW, outH);

    if (typeof cropCanvas.toDataURL === 'function') {
      return cropCanvas.toDataURL('image/jpeg', 0.85);
    }

    return null;
  } catch (_) {
    return null;
  }
}

function _B1_emp_crearAuditoria(slots, totalRotasRecibidas) {
  var totalAmbiguas = 0;
  var totalUnicas = 0;
  var totalConROI = 0;
  var totalSinROI = 0;
  var slotIds = [];

  for (var i = 0; i < slots.length; i++) {
    var slot = slots[i];
    slotIds.push(slot.slotId);
    if (slot.tipoMatch === 'ambigua_para_gemini') totalAmbiguas += 1;
    else totalUnicas += 1;
    if (slot.roiBase64) totalConROI += 1;
    else totalSinROI += 1;
  }

  return {
    totalRotasRecibidas: totalRotasRecibidas,
    totalSlots: slots.length,
    totalAmbiguas: totalAmbiguas,
    totalUnicas: totalUnicas,
    totalConROI: totalConROI,
    totalSinROI: totalSinROI,
    slotIds: slotIds
  };
}

function _B1_emp_extraerFamiliasCandidatas(rota) {
  var familias = [];

  function pushFamilia(candidato) {
    if (!candidato || !candidato.familia) return;
    if (familias.indexOf(candidato.familia) === -1) {
      familias.push(candidato.familia);
    }
  }

  pushFamilia(rota && rota.candidato1);
  pushFamilia(rota && rota.candidato2);

  return familias;
}

function B1_empaquetarParaRescate(params) {
  params = params || {};

  var rotasReconocidas = Array.isArray(params.rotasReconocidas) ? params.rotasReconocidas : [];
  var canvas = params.canvas || null;
  var slots = [];
  var slotCounter = 0;

  for (var i = 0; i < rotasReconocidas.length; i++) {
    var rota = rotasReconocidas[i];
    if (!rota || typeof rota !== 'object') continue;

    slotCounter += 1;
    var slotId = 'B' + slotCounter;
    var textoOriginal = String(rota.tokenOriginal || '').trim();

    slots.push({
      slotId: slotId,
      textoOriginal: textoOriginal,
      confidence: rota.confidence != null ? rota.confidence : null,
      contexto: _B1_emp_construirContexto(rota.bloque, rota.wordIndex, slotId, textoOriginal),
      roiBase64: _B1_emp_recortarROI(canvas, rota.boundingPoly),
      boundingPoly: rota.boundingPoly || null,
      pageIndex: typeof rota.pageIndex === 'number' ? rota.pageIndex : null,
      blockIndex: typeof rota.blockIndex === 'number' ? rota.blockIndex : null,
      wordIndex: typeof rota.wordIndex === 'number' ? rota.wordIndex : null,
      origenDeteccion: 'motor_coste_ocr',
      candidatoMotor: rota.candidato1 || null,
      candidatoMotor2: rota.candidato2 || null,
      familiasCandidatas: _B1_emp_extraerFamiliasCandidatas(rota),
      tipoMatch: rota.tipoMatch || 'unica'
    });
  }

  return {
    totalRotasRecibidas: rotasReconocidas.length,
    totalSlots: slots.length,
    slots: slots,
    auditoria: _B1_emp_crearAuditoria(slots, rotasReconocidas.length)
  };
}
