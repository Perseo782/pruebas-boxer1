
/**
 * Boxer1_Core Â· ADAPTADOR DE DIAGNÃ“STICO (parche unificaciÃ³n)
 */
const B1_TIPO_EVENTO = Object.freeze({
  INFO: 'info', REPARACION: 'reparacion_silenciosa', DEGRADACION: 'degradacion', ERROR: 'error',
  RECUPERACION: 'recuperacion', TIMEOUT: 'timeout', ENCADENADO: 'error_encadenado', MODO_SEGURO: 'modo_seguro'
});
const B1_DIAG_MAX_CRITICOS = 80;
const B1_DIAG_MAX_INFO = 20;

function B1_crearBufferDiagnostico(traceId) {
  const eventosCriticos = [];
  const eventosInfo = [];
  return {
    traceId,
    emitir(params) {
      const evento = {
        ts: Date.now(),
        traceId,
        modulo: B1_CONFIG.MODULE_NAME,
        tipoEvento: params.tipoEvento,
        code: params.code || null,
        mensaje: params.mensaje,
        passport: params.passport || null,
        elapsedMs: params.totalElapsedMs ?? params.elapsedMs ?? null,
        stageElapsedMs: params.stageElapsedMs ?? params.elapsedMs ?? null,
        totalElapsedMs: params.totalElapsedMs ?? params.elapsedMs ?? null,
        detalle: params.detalle || null
      };
      const esCritico = _esEventoCritico(params.tipoEvento, params.passport);
      const bucket = esCritico ? eventosCriticos : eventosInfo;
      const max = esCritico ? B1_DIAG_MAX_CRITICOS : B1_DIAG_MAX_INFO;
      if (bucket.length >= max) bucket.shift();
      bucket.push(evento);
    },
    obtenerEventos() { return [...eventosCriticos, ...eventosInfo].sort((a,b)=>a.ts-b.ts); },
    resumen() { return { totalCriticos:eventosCriticos.length, totalInfo:eventosInfo.length, total:eventosCriticos.length+eventosInfo.length }; }
  };
}
function B1_exportarDiagnostico(buffer) { return buffer ? { resumen: buffer.resumen(), eventos: buffer.obtenerEventos() } : null; }
function _esEventoCritico(tipoEvento, passport) {
  if (passport === B1_PASSPORT.NARANJA || passport === B1_PASSPORT.ROJO) return true;
  return [B1_TIPO_EVENTO.ERROR,B1_TIPO_EVENTO.DEGRADACION,B1_TIPO_EVENTO.TIMEOUT,B1_TIPO_EVENTO.ENCADENADO,B1_TIPO_EVENTO.MODO_SEGURO].includes(tipoEvento);
}
function _emit(buffer, payload) { if (buffer) buffer.emitir(payload); }
function B1_diagPrechequeo(buffer, ok, problemas, totalMs, stageMs) {
  _emit(buffer,{ tipoEvento: ok?B1_TIPO_EVENTO.INFO:B1_TIPO_EVENTO.ERROR, code: ok?'B1_PRECHEQUEO_OK':'B1_PRECHEQUEO_FAIL', mensaje: ok?`Prechequeo completado en ${stageMs ?? totalMs}ms.`:`Prechequeo fallido: ${problemas.join(', ')}`, passport: ok?B1_PASSPORT.VERDE:B1_PASSPORT.ROJO, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? totalMs, detalle:{ problemas } });
}
function B1_diagOCR(buffer, vacia, totalPalabras, totalMs, stageMs) {
  _emit(buffer,{ tipoEvento: vacia?B1_TIPO_EVENTO.ERROR:B1_TIPO_EVENTO.INFO, code: vacia?'B1_OCR_VACIO':'B1_OCR_OK', mensaje: vacia?'Vision no devolviÃ³ texto.':`OCR completado: ${totalPalabras} palabras en ${stageMs ?? totalMs}ms.`, passport: vacia?B1_PASSPORT.ROJO:B1_PASSPORT.VERDE, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? totalMs, detalle:{ totalPalabras } });
}
function B1_diagFiabilidad(buffer, fiabilidad, totalMs, stageMs) {
  const passport = fiabilidad.fotoViable ? B1_PASSPORT.VERDE : B1_PASSPORT.ROJO;
  _emit(buffer,{ tipoEvento: fiabilidad.fotoViable?B1_TIPO_EVENTO.INFO:B1_TIPO_EVENTO.DEGRADACION, code: fiabilidad.fotoViable?'B1_FIAB_OK':'B1_FIAB_INVIABLE', mensaje: fiabilidad.fotoViable?`Fiabilidad OK. Page=${fiabilidad.pageConfidence}, CritZone=${fiabilidad.criticalZoneScore}`:`Foto inviable: ${fiabilidad.razonInviable}`, passport, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ pageConfidence:fiabilidad.pageConfidence, criticalZoneScore:fiabilidad.criticalZoneScore, totalDudosas:fiabilidad.palabrasDudosas.length, rachasMalas:fiabilidad.rachasMalas } });
}
function B1_diagBypass(buffer, totalMs, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.DEGRADACION, code:'B1_AGENTE_OFF', mensaje:'Agente desactivado. Solo OCR base.', passport:B1_PASSPORT.NARANJA, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0 }); }
function B1_diagRescate(buffer, resultado, totalMs, stageMs) { const ok=resultado.intentado && resultado.slotsDevueltos>0; _emit(buffer,{ tipoEvento:ok?B1_TIPO_EVENTO.INFO:B1_TIPO_EVENTO.DEGRADACION, code:ok?'B1_RESCATE_OK':'B1_RESCATE_PARCIAL', mensaje:resultado.intentado?`Rescate: ${resultado.slotsDevueltos}/${resultado.slotsEnviados} slots devueltos.`:`Rescate no intentado: ${resultado.razon}`, passport:ok?B1_PASSPORT.VERDE:B1_PASSPORT.NARANJA, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ slotsEnviados:resultado.slotsEnviados, slotsDevueltos:resultado.slotsDevueltos, erroresLote:resultado.erroresLote||0 } }); }
function B1_diagMerge(buffer, merge, totalMs, stageMs) { const cancelado=merge.mergeCancelado; _emit(buffer,{ tipoEvento:cancelado?B1_TIPO_EVENTO.DEGRADACION:B1_TIPO_EVENTO.INFO, code:cancelado?'B1_MERGE_CANCELADO':'B1_MERGE_OK', mensaje:cancelado?`Merge cancelado: ${merge.motivoCancelacion}`:`Merge OK. ${merge.correcciones.length} correcciones, ${merge.noResueltas.length} pendientes.`, passport:cancelado?B1_PASSPORT.NARANJA:B1_PASSPORT.VERDE, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ mergeStatus:merge.mergeStatus, correcciones:merge.correcciones.length, noResueltas:merge.noResueltas.length } }); }
function B1_diagTimeout(buffer, fase, totalMs, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.TIMEOUT, code:'B1_TIMEOUT', mensaje:`Presupuesto agotado en fase: ${fase}`, passport:B1_PASSPORT.NARANJA, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ fase } }); }
function B1_diagEncadenado(buffer, upstreamCode, upstreamModule, totalMs, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.ENCADENADO, code:'B1_ERROR_ENCADENADO', mensaje:`Error propagado desde ${upstreamModule}: ${upstreamCode}`, passport:B1_PASSPORT.ROJO, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ upstreamCode, upstreamModule } }); }
function B1_diagReparacion(buffer, descripcion, totalMs, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.REPARACION, code:'B1_REPARACION_SILENCIOSA', mensaje:descripcion, passport:B1_PASSPORT.VERDE, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0 }); }
function B1_diagPasaporte(buffer, estado, explicacion, totalMs, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.INFO, code:`B1_PASAPORTE_${estado}`, mensaje:`Pasaporte ${estado}: ${explicacion}`, passport:estado, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0 }); }
function B1_diagRecuperacion(buffer, desde, hacia, totalMs, motivo, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.RECUPERACION, code:'B1_RECUPERACION', mensaje:`RecuperaciÃ³n ${desde} â†’ ${hacia}. ${motivo || ''}`.trim(), passport:hacia, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ desde, hacia, motivo:motivo || null } }); }
function B1_diagModoSeguro(buffer, totalMs, motivo, stageMs) { _emit(buffer,{ tipoEvento:B1_TIPO_EVENTO.MODO_SEGURO, code:'B1_MODO_SEGURO', mensaje:motivo || 'Se activa modo seguro.', passport:B1_PASSPORT.NARANJA, totalElapsedMs: totalMs, stageElapsedMs: stageMs ?? 0, detalle:{ motivo:motivo || null } }); }

