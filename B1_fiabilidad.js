/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · PASO 4 · MEDIDOR DE FIABILIDAD
 * ═══════════════════════════════════════════════════════════════
 * Sección 5.4 y 6 de la orden de trabajo v4
 *
 * Calcula:
 * - Señal global orientativa de la página
 * - Señal específica de la zona crítica
 * - Palabras dudosas
 * - Rachas malas
 * - Posibles huecos
 *
 * La nota global NO decide sola. La zona crítica pesa más.
 * ═══════════════════════════════════════════════════════════════
 */

// ─── MEDIR FIABILIDAD COMPLETA ──────────────────────────────
/**
 * @param {Object} ocrNormalizado - Salida de B1_normalizarOCR
 * @param {string} sensitivityMode - baja/media/alta
 * @returns {Object} Informe completo de fiabilidad
 */
function B1_medirFiabilidad(ocrNormalizado, sensitivityMode) {
  const config = B1_PRESUPUESTOS[sensitivityMode];

  if (ocrNormalizado.visionVacia) {
    return {
      pageConfidence:    0,
      criticalZoneScore: 0,
      palabrasDudosas:   [],
      rachasMalas:       0,
      huecos:            0,
      totalPalabras:     0,
      fotoViable:        false,
      razonInviable:     'Vision no devolvió texto.'
    };
  }

  // ── 1. CONFIANZA GLOBAL DE PÁGINA ─────────────────────────
  const pageConfidence = _calcularConfianzaPagina(ocrNormalizado);

  // ── 2. TODAS LAS PALABRAS CON SU CONFIANZA ───────────────
  const todasPalabras = _extraerTodasPalabras(ocrNormalizado);

  // ── 3. PALABRAS DUDOSAS - TODAS LAS PALABRAS ENTRAN ──────
  // Ya no filtramos por confianza aquí.
  // El filtro de rescatables está en B1_slots.js
  const palabrasDudosas = todasPalabras.filter(
    p => p.confidence !== null
  );

  // ── 4. RACHAS MALAS (3+ palabras dudosas consecutivas) ────
  const rachasMalas = _contarRachasMalas(todasPalabras, config.minConfidenceWord);

  // ── 5. HUECOS (palabras sin confianza o vacías) ───────────
  const huecos = todasPalabras.filter(
    p => p.confidence === null || p.texto.trim() === '' || p.huecoHeuristico === true
  ).length;

  // ── 6. ZONA CRÍTICA ───────────────────────────────────────
  // La zona crítica son los bloques que contienen palabras clave
  // de etiquetado: ingredientes, alérgenos, contiene, trazas, etc.
  const criticalZoneScore = _calcularZonaCritica(ocrNormalizado, config.minConfidenceWord);

  // ── 7. VEREDICTO DE VIABILIDAD ────────────────────────────
  // La decisión depende de zona crítica + dudas, NO solo de media global
  const { fotoViable, razonInviable } = _decidirViabilidad(
    pageConfidence,
    criticalZoneScore,
    palabrasDudosas.length,
    todasPalabras.length,
    rachasMalas,
    config
  );

  return {
    pageConfidence:    Math.round(pageConfidence * 100) / 100,
    criticalZoneScore: Math.round(criticalZoneScore * 100) / 100,
    palabrasDudosas:   palabrasDudosas,
    rachasMalas:       rachasMalas,
    huecos:            huecos,
    totalPalabras:     todasPalabras.length,
    fotoViable:        fotoViable,
    razonInviable:     razonInviable
  };
}


// ─── FUNCIONES INTERNAS ─────────────────────────────────────

/**
 * Media ponderada de confianza de todas las páginas.
 * Termómetro general, NO decisor.
 */
function _calcularConfianzaPagina(ocrNormalizado) {
  let sumConf = 0;
  let sumPalabras = 0;

  ocrNormalizado.paginas.forEach(pagina => {
    pagina.bloques.forEach(bloque => {
      bloque.palabras.forEach(palabra => {
        if (palabra.confidence !== null) {
          sumConf += palabra.confidence;
          sumPalabras++;
        }
      });
    });
  });

  return sumPalabras > 0 ? sumConf / sumPalabras : 0;
}

/**
 * Extrae lista plana de todas las palabras con metadata,
 * preservando orden de lectura y referencia a su bloque.
 */
function _extraerTodasPalabras(ocrNormalizado) {
  const todas = [];

  ocrNormalizado.paginas.forEach((pagina, pIdx) => {
    pagina.bloques.forEach((bloque, bIdx) => {
      bloque.palabras.forEach((palabra, wIdx) => {
        todas.push({
          texto:       palabra.texto,
          confidence:  palabra.confidence,
          boundingPoly:palabra.boundingPoly,
          huecoHeuristico: palabra.huecoHeuristico === true,
          pageIndex:   pIdx,
          blockIndex:  bIdx,
          wordIndex:   wIdx,
          bloque:      bloque
        });
      });
    });
  });

  return todas;
}

/**
 * Cuenta rachas de 3+ palabras dudosas consecutivas.
 * Indicador de zona muy dañada.
 */
function _contarRachasMalas(todasPalabras, umbral) {
  let rachas = 0;
  let consecutivas = 0;

  todasPalabras.forEach(p => {
    if (p.confidence !== null && p.confidence < umbral) {
      consecutivas++;
    } else {
      if (consecutivas >= 3) rachas++;
      consecutivas = 0;
    }
  });

  if (consecutivas >= 3) rachas++;
  return rachas;
}

/**
 * Zona crítica: busca bloques con palabras clave de etiquetado
 * alimentario y calcula la confianza media solo de esos bloques.
 *
 * Si no encuentra zona crítica, usa la confianza global.
 */
function _calcularZonaCritica(ocrNormalizado, umbral) {
  const KEYWORDS_CRITICAS = [
    'ingredientes', 'ingredients', 'alérgenos', 'allergens',
    'contiene', 'contains', 'trazas', 'traces',
    'puede contener', 'may contain', 'leche', 'milk',
    'gluten', 'huevo', 'egg', 'soja', 'soy', 'frutos secos',
    'nuts', 'cacahuete', 'peanut', 'marisco', 'shellfish',
    'pescado', 'fish', 'apio', 'celery', 'mostaza', 'mustard',
    'sésamo', 'sesame', 'sulfitos', 'sulphites', 'altramuz',
    'lupin', 'moluscos', 'molluscs', 'trigo', 'wheat',
    'cebada', 'barley', 'centeno', 'rye', 'avena', 'oats'
  ];

  const bloquesCriticos = [];

  ocrNormalizado.paginas.forEach(pagina => {
    pagina.bloques.forEach(bloque => {
      const textoLower = bloque.texto.toLowerCase();
      const esCritico = KEYWORDS_CRITICAS.some(kw => textoLower.includes(kw));

      if (esCritico) {
        bloquesCriticos.push(bloque);
      }
    });
  });

  if (bloquesCriticos.length === 0) {
    // Sin zona crítica detectada, devolver confianza global
    return _calcularConfianzaPagina(ocrNormalizado);
  }

  // Confianza media de las palabras en bloques críticos
  let sumConf = 0;
  let count = 0;

  bloquesCriticos.forEach(bloque => {
    bloque.palabras.forEach(palabra => {
      if (palabra.confidence !== null) {
        sumConf += palabra.confidence;
        count++;
      }
    });
  });

  return count > 0 ? sumConf / count : 0;
}

/**
 * Decide si la foto es viable para seguir trabajando.
 *
 * Regla decisiva (sección 6):
 * - La nota global actúa como semáforo orientativo.
 * - La decisión real depende de zona crítica + dudas + tiempo.
 */
function _decidirViabilidad(pageConf, criticalScore, numDudosas, totalPalabras, rachas, config) {
  // Si no hay palabras, inviable
  if (totalPalabras === 0) {
    return { fotoViable: false, razonInviable: 'Sin texto detectado.' };
  }

  // Ratio de palabras dudosas
  const ratioDudas = numDudosas / totalPalabras;

  // Si la zona crítica está muy mal Y hay muchas rachas malas
  if (criticalScore < 0.30 && rachas >= 3) {
    return {
      fotoViable: false,
      razonInviable: 'Zona crítica ilegible con múltiples rachas dañadas.'
    };
  }

  // Si más del 70% son dudas, la foto es ruido
  if (ratioDudas > 0.70) {
    return {
      fotoViable: false,
      razonInviable: `Demasiadas palabras dudosas (${Math.round(ratioDudas * 100)}%).`
    };
  }

  // Si la confianza global es catastrófica Y la zona crítica también
  if (pageConf < 0.25 && criticalScore < 0.35) {
    return {
      fotoViable: false,
      razonInviable: 'Confianza general y de zona crítica demasiado bajas.'
    };
  }

  return { fotoViable: true, razonInviable: null };
}
