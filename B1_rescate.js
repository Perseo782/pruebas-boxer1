/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 7 · RESCATE AVANZADO CON GEMINI
 * ═══════════════════════════════════════════════════════════════
 * Rol de Gemini en Boxer 1:
 * - Reparar OCR del fragmento marcado como slot
 * - Conservar idioma original de la etiqueta
 * - No traducir, no interpretar negocio, no tocar fuera del slot
 *
 * El campo `categoria` viaja en cada slot desde B1_prepararLoteRescate.
 * Si faltara por cualquier motivo, este archivo cae a contexto_critico.
 * ═══════════════════════════════════════════════════════════════
 */


// ─── MAPEO DECISION → CATEGORIA ─────────────────────────────
function B1_mapearCategoria(decision) {
  switch (decision) {
    case 'enviado_agente_familia':          return 'familia';
    case 'enviado_agente_peso_formato':     return 'peso_formato';
    case 'enviado_agente_nombre':           return 'nombre';
    case 'enviado_agente_contexto_critico': return 'contexto_critico';
    default:                                return 'contexto_critico';
  }
}


// ─── CONSTRUIR PROMPT DE RESCATE ────────────────────────────
function B1_construirPromptRescate(slots) {
  const lineas = [
    'REPARADOR OCR DE ETIQUETAS ALIMENTARIAS',
    '',
    'ROL: Reconstruyes fragmentos de texto dañados por OCR en etiquetas de productos alimentarios.',
    'Tu único trabajo es leer la imagen ROI del slot y reparar el fragmento dañado.',
    '',
    'REGLAS ABSOLUTAS:',
    '1. Repara OCR — nunca traduzcas. El idioma de salida es siempre el idioma del fragmento original.',
    '   Correcto: 0euf → oeuf | 3gg → egg | s0ja → soja | lche → leche',
    '   Prohibido: egg → huevo | oeuf → huevo | ovo → huevo',
    '2. Solo tocas el slot marcado con [[slotId|texto]]. El contexto es referencia, no objetivo.',
    '3. Cruza imagen ROI con contexto. Si contradicen, la imagen manda.',
    '4. Si no puedes leer el slot con seguridad: estado="no_resuelta". Nunca inventes.',
    '5. Si el texto del slot ya es correcto y la imagen lo confirma: devuélvelo igual.',
    '6. No corrijas conectores, preposiciones ni texto auxiliar aunque parezcan errores OCR.',
    '7. Responde solo JSON puro. No saludes. No expliques. No escribas texto fuera del JSON.',
    '',
    'INSTRUCCIONES POR CATEGORÍA:',
    '',
    '[familia] — El slot es un alérgeno o nombre de familia alérgena.',
    '  Repara el fragmento OCR dañado. Conserva el idioma exacto del original.',
    '  Si la ROI muestra claramente la palabra: aplica la corrección.',
    '  Si hay ambigüedad de idioma y la ROI no resuelve: no_resuelta.',
    '',
    '[peso_formato] — El slot es una cifra, unidad o formato de pack.',
    '  Solo aplica si el número o unidad es 100% legible en la ROI.',
    '  Si hay cualquier duda sobre la cifra: no_resuelta.',
    '  Nunca aproximes. El peso es dato legal.',
    '',
    '[nombre] — El slot es el nombre oficial del producto.',
    '  Conserva mayúsculas, formato y idioma del original.',
    '  Si hay ambigüedad: no_resuelta.',
    '',
    '[contexto_critico] — El sistema detectó riesgo OCR por contexto.',
    '  Mira la ROI. Si ves claramente una palabra de familia alérgena dañada: repárala.',
    '  Conserva el idioma de lo que ves en la ROI.',
    '  Si la ROI no muestra nada claro o no es un alérgeno: no_resuelta.',
    '',
    'FORMATO DE SALIDA (JSON puro, sin markdown, sin texto extra):',
    '{',
    '  "correcciones": [',
    '    {"slotId":"B1","solucion":"oeuf","estado":"aplicable"},',
    '    {"slotId":"B2","solucion":"","estado":"no_resuelta"}',
    '  ],',
    '  "simetria":"exacta"',
    '}',
    '',
    'SLOTS A RESOLVER:'
  ];

  (slots || []).forEach(slot => {
    lineas.push('');
    lineas.push(`--- ${slot.slotId} [${slot.categoria || 'contexto_critico'}] ---`);
    lineas.push(`OCR: "${slot.textoOriginal}"`);
    lineas.push(`Contexto: ${slot.contexto || ''}`);
    if (slot.roiBase64) {
      lineas.push('[Imagen ROI adjunta — validación visual obligatoria]');
    }
  });

  lineas.push('');
  lineas.push('RESPONDE SOLO JSON. SIN TEXTO ADICIONAL.');

  return lineas.join('\n');
}


// ─── EXTRAER JSON DE RESPUESTA ──────────────────────────────
function _B1_extraerPrimerJSON(texto) {
  const raw = String(texto || '').trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {}

  const inicio = raw.indexOf('{');
  const fin = raw.lastIndexOf('}');
  if (inicio === -1 || fin === -1 || fin <= inicio) return null;

  const recorte = raw.slice(inicio, fin + 1);
  try {
    return JSON.parse(recorte);
  } catch (e) {
    return null;
  }
}


// ─── NORMALIZAR RESPUESTA DE GEMINI ─────────────────────────
function _B1_normalizarEstadoCorreccion(estado) {
  const t = String(estado || '').trim().toLowerCase();
  if (t === 'aplicable' || t === 'aplicada' || t === 'ok') return 'aplicable';
  return 'no_resuelta';
}

function _B1_normalizarCorreccionesRescate(correccionesRaw, slots) {
  const slotsValidos = new Map();
  (slots || []).forEach(slot => slotsValidos.set(slot.slotId, slot));

  const out = [];
  const vistos = new Set();

  (Array.isArray(correccionesRaw) ? correccionesRaw : []).forEach(item => {
    const slotId = item && item.slotId ? String(item.slotId).trim() : '';
    if (!slotId || !slotsValidos.has(slotId) || vistos.has(slotId)) return;

    const solucion = item && typeof item.solucion === 'string'
      ? item.solucion.trim()
      : '';

    const estado = _B1_normalizarEstadoCorreccion(item && item.estado);

    out.push({
      slotId,
      solucion,
      estado: estado === 'aplicable' && solucion ? 'aplicable' : 'no_resuelta'
    });

    vistos.add(slotId);
  });

  return out;
}

function _B1_normalizarRespuestaGemini(raw, slots) {
  const base = raw && typeof raw === 'object' ? raw : {};
  const candidatos = [
    base,
    base.resultado,
    base.data,
    base.response,
    base.respuesta
  ].filter(Boolean);

  let jsonUtil = null;

  for (let i = 0; i < candidatos.length; i++) {
    const c = candidatos[i];
    if (c && Array.isArray(c.correcciones)) {
      jsonUtil = c;
      break;
    }
    if (c && typeof c.text === 'string') {
      const parsed = _B1_extraerPrimerJSON(c.text);
      if (parsed && Array.isArray(parsed.correcciones)) {
        jsonUtil = parsed;
        break;
      }
    }
    if (c && typeof c.rawText === 'string') {
      const parsed = _B1_extraerPrimerJSON(c.rawText);
      if (parsed && Array.isArray(parsed.correcciones)) {
        jsonUtil = parsed;
        break;
      }
    }
  }

  if (!jsonUtil && typeof base === 'string') {
    jsonUtil = _B1_extraerPrimerJSON(base);
  }

  if (!jsonUtil || !Array.isArray(jsonUtil.correcciones)) {
    const error = new Error('Respuesta Gemini sin JSON válido de correcciones.');
    error.upstreamCode = 'UPSTREAM_UNKNOWN';
    error.upstreamModule = 'TRASTIENDA';
    error.raw = raw;
    throw error;
  }

  const correcciones = _B1_normalizarCorreccionesRescate(jsonUtil.correcciones, slots);

  return {
    correcciones,
    simetria: String(jsonUtil.simetria || 'exacta'),
    slotsDevueltos: correcciones.length
  };
}


// ─── LLAMAR TRASTIENDA GEMINI ───────────────────────────────
async function _B1_fetchGeminiTrastienda(payload, sessionToken, urlTrastienda) {
  if (!urlTrastienda) {
    const err = new Error('urlTrastienda no disponible para rescate Gemini.');
    err.upstreamCode = 'UPSTREAM_UNKNOWN';
    err.upstreamModule = 'TRASTIENDA';
    throw err;
  }

  const respuesta = await fetch(urlTrastienda, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': sessionToken ? `Bearer ${sessionToken}` : ''
    },
    body: JSON.stringify(payload)
  });

  let json = null;
  let texto = '';

  try {
    json = await respuesta.json();
  } catch (e) {
    try {
      texto = await respuesta.text();
    } catch (e2) {
      texto = '';
    }
  }

  if (!respuesta.ok || (json && json.ok === false)) {
    const upstreamCode =
      (json && json.error && json.error.code) ||
      (json && json.code) ||
      'UPSTREAM_UNKNOWN';

    const message =
      (json && json.error && json.error.message) ||
      (json && json.message) ||
      texto ||
      `HTTP ${respuesta.status}`;

    const err = new Error(message);
    err.upstreamCode = upstreamCode;
    err.upstreamModule = 'TRASTIENDA';
    err.raw = json || texto || null;
    throw err;
  }

  return json || texto;
}


// ─── EJECUTAR RESCATE ───────────────────────────────────────
/**
 * Contrato esperado por B1_core_unificado_patch.js
 *
 * @param {Object} loteRescate   - salida de B1_prepararLoteRescate
 * @param {string} textoBase     - OCR base completo
 * @param {Object} cronometro    - cronómetro del Boxer 1
 * @param {string} sessionToken  - token de sesión
 * @param {string} urlTrastienda - URL del backend
 * @returns {Object} resultadoRescate compatible con merge/core
 */
async function B1_ejecutarRescate(loteRescate, textoBase, cronometro, sessionToken, urlTrastienda) {
  const slots = (loteRescate && Array.isArray(loteRescate.slots)) ? loteRescate.slots : [];

  if (slots.length === 0) {
    return {
      correcciones: [],
      simetria: 'exacta',
      slotsEnviados: 0,
      slotsDevueltos: 0,
      upstreamError: null
    };
  }

  const slotsParaGemini = slots.map(slot => ({
    slotId: slot.slotId,
    textoOriginal: slot.textoOriginal,
    confidence: slot.confidence,
    contexto: slot.contexto,
    categoria: slot.categoria || 'contexto_critico',
    roiBase64: slot.roiBase64 || null,
    pageIndex: slot.pageIndex,
    blockIndex: slot.blockIndex,
    wordIndex: slot.wordIndex,
    origenDeteccion: slot.origenDeteccion || 'dudosa_confianza'
  }));

  const prompt = B1_construirPromptRescate(slotsParaGemini);

  const payload = {
    // Trastienda enruta por módulo; si falta, devuelve: "Módulo desconocido:".
    modulo: 'TRASTIENDA',
    module: 'TRASTIENDA',
    submodulo: 'gemini',
    accion: 'procesarGemini',
    action: 'procesarGemini',
    origen: 'Boxer1_Core',
    token: sessionToken || null,
    sessionToken: sessionToken || null,
    tokenSesion: sessionToken || null,
    textoBase: textoBase || '',
    prompt,
    promptUsuario: prompt,
    slots: slotsParaGemini,
    loteSlots: slotsParaGemini,
    timeBudgetMs: (cronometro && typeof cronometro.remainingMs === 'function')
      ? cronometro.remainingMs()
      : null
  };

  const raw = await _B1_fetchGeminiTrastienda(payload, sessionToken, urlTrastienda);
  const normalizado = _B1_normalizarRespuestaGemini(raw, slotsParaGemini);

  return {
    correcciones: normalizado.correcciones,
    simetria: normalizado.simetria,
    slotsEnviados: slotsParaGemini.length,
    slotsDevueltos: normalizado.slotsDevueltos,
    upstreamError: null
  };
}
