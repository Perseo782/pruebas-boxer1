/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 7 · RESCATE AVANZADO CON GEMINI
 * ═══════════════════════════════════════════════════════════════
 * Rol de Gemini en Boxer 1:
 * - Reparar OCR del fragmento marcado como slot
 * - Conservar idioma original de la etiqueta
 * - No traducir, no interpretar negocio, no tocar fuera del slot
 *
 * El campo `categoria` viaja en cada slot desde B1_prepararLoteRescate
 * a través de B1_mapearCategoria. Gemini recibe instrucciones exactas
 * por tipo de dato sin necesidad de deducir nada.
 * ═══════════════════════════════════════════════════════════════
 */


// ─── MAPEO DECISION → CATEGORIA ─────────────────────────────
/**
 * Convierte la decisión del selector en la categoría para Gemini.
 * Se llama desde B1_prepararLoteRescate al construir slotsPreparados.
 *
 * @param {string} decision - Valor de decision del selectorOCR
 * @returns {string} categoria para el prompt
 */
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
/**
 * Construye el prompt completo para Gemini.
 * Los slots ya llegan con `categoria` desde B1_prepararLoteRescate.
 *
 * @param {Array} slots - Slots con slotId, textoOriginal, contexto,
 *                        categoria, roiBase64
 * @returns {string} Prompt listo para enviar a Gemini
 */
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
    '[contexto_critico] — Intenta reconstruir el slot solo si ROI + contexto muestran claramente una palabra de familia alérgena dañada.',
    '  Conserva el idioma de lo que ves en la ROI.',
    '  Si la ROI no muestra nada claro o la palabra no es un alérgeno: no_resuelta.',
    '',
    'RESPONDE EXCLUSIVAMENTE CON JSON VÁLIDO.',
    'NO SALUDES.',
    'NO EXPLIQUES.',
    'NO AÑADAS TEXTO FUERA DEL JSON.',
    'NO USES MARKDOWN.',
    '',
    'FORMATO DE SALIDA:',
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

  slots.forEach(slot => {
    lineas.push('');
    lineas.push(`--- ${slot.slotId} [${slot.categoria || 'contexto_critico'}] ---`);
    lineas.push(`OCR: "${slot.textoOriginal}"`);
    lineas.push(`Contexto: ${slot.contexto}`);
    if (slot.roiBase64) {
      lineas.push('[Imagen ROI adjunta — validación visual obligatoria]');
    }
  });

  lineas.push('');
  lineas.push('SALIDA OBLIGATORIA: SOLO JSON. CUALQUIER OTRO TEXTO ES INCORRECTO.');

  return lineas.join('\n');
}
