async function B1_analizar(input, config) {
  const startTime = Date.now();

  const datos = input.datos || {};
  const sessionToken = input.sessionToken;
  const traceId = "trc_" + Math.random().toString(36).slice(2);

  const ocr = await B1_llamarVisionOCR(
    datos.imageRef,
    datos.sendMode,
    sessionToken,
    config.urlTrastienda
  );

  const textoBase = ocr?.resultado?.ocrTexto || "";

  if (!datos.agentEnabled) {
    return B1_crearRespuestaOk({
      textoBaseVision: textoBase,
      textoAuditado: textoBase,
      estadoPasaporte: B1_PASSPORT.VERDE,
      correcciones: [],
      noResueltas: [],
      roiRefsRevision: [],
      agentBypassed: true,
      traceId,
      elapsedMs: Date.now() - startTime
    });
  }

  const fiabilidad = B1_medirFiabilidad(textoBase, datos.sensitivityMode);
  const palabrasDudosas = fiabilidad.palabrasDudosas || [];

  const lote = B1_prepararLoteRescate(
    palabrasDudosas,
    datos.canvas || null,
    datos.sensitivityMode
  );

  let rescate = { intentado: false, correcciones: [] };

  if (lote.totalSlots > 0) {
    try {
      rescate = await B1_ejecutarRescate(
        lote,
        textoBase,
        { canAfford: () => true },
        sessionToken,
        config.urlTrastienda
      );
    } catch (_) {}
  }

  const correcciones = rescate.correcciones || [];
  let textoAuditado = textoBase;

  if (correcciones.length > 0) {
    textoAuditado = B1_aplicarCorrecciones(textoBase, correcciones);
  }

  return B1_crearRespuestaOk({
    textoBaseVision: textoBase,
    textoAuditado,
    estadoPasaporte: B1_PASSPORT.VERDE,
    correcciones,
    noResueltas: [],
    roiRefsRevision: [],
    agentBypassed: false,
    traceId,
    elapsedMs: Date.now() - startTime
  });
}
