/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 CORE · ENUMS Y CONSTANTES
 * ═══════════════════════════════════════════════════════════════
 */
const B1_SENSITIVITY = Object.freeze({
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta'
});
const B1_SEND_MODE = Object.freeze({
  BASE64: 'base64',
  NORMAL: 'normal'
});
const B1_PASSPORT = Object.freeze({
  VERDE: 'VERDE',
  NARANJA: 'NARANJA',
  ROJO: 'ROJO'
});
const B1_SLOT_STATUS = Object.freeze({
  APLICABLE: 'aplicable',
  APLICADA: 'aplicada',
  DESCARTADA: 'descartada',
  NO_RESUELTA: 'no_resuelta'
});
const B1_MERGE_STATUS = Object.freeze({
  OK: 'ok',
  CANCELADO_POR_ASIMETRIA: 'cancelado_por_asimetria',
  NO_INTENTADO: 'no_intentado'
});
const B1_ACCIONES_CEREBRO = Object.freeze({
  REINTENTAR: 'reintentar',
  REINTENTAR_UNA_VEZ: 'reintentar_una_vez',
  REINTENTAR_MAS_TARDE: 'reintentar_mas_tarde',
  BLOQUEAR_GUARDADO: 'bloquear_guardado',
  ABRIR_REVISION: 'abrir_revision',
  CONTINUAR_Y_MARCAR: 'continuar_y_marcar_revision',
  ABORTAR_FLUJO: 'abortar_flujo',
  CORTE_TEMPRANO: 'corte_temprano',
  PEDIR_DATO_AL_USUARIO: 'pedir_dato_al_usuario'
});
const B1_TIPO_FALLO = Object.freeze({
  REPARACION_AGOTADA: 'reparacion_agotada',
  IRRECUPERABLE_POR_DISENO: 'irrecuperable_por_diseño',
  DESCONOCIDO: 'desconocido'
});
const B1_ERRORES = Object.freeze({
  IMAGEN_INVALIDA: 'B1_IMAGEN_INVALIDA',
  IMAGEN_DESENFOCADA: 'B1_IMAGEN_DESENFOCADA',
  IMAGEN_REFLEJO: 'B1_IMAGEN_REFLEJO',
  IMAGEN_SIN_TEXTO: 'B1_IMAGEN_SIN_TEXTO',
  IMAGEN_RECORTE_ROTO: 'B1_IMAGEN_RECORTE_ROTO',
  OCR_FAILED: 'B1_OCR_FAILED',
  OCR_VACIO: 'B1_OCR_VACIO',
  OCR_RUIDO: 'B1_OCR_RUIDO',
  RESCATE_TIMEOUT: 'B1_RESCATE_TIMEOUT',
  RESCATE_FALLIDO: 'B1_RESCATE_FALLIDO',
  MERGE_ASIMETRIA: 'B1_MERGE_ASIMETRIA',
  MERGE_DUPLICADO: 'B1_MERGE_DUPLICADO',
  PRESUPUESTO_AGOTADO: 'B1_PRESUPUESTO_AGOTADO',
  ERROR_INTERNO: 'B1_ERROR_INTERNO'
});
const B1_PRESUPUESTOS = Object.freeze({
  [B1_SENSITIVITY.BAJA]: {
    maxSlots: 999,
    minConfidenceWord: 0.70,
    minConfidencePage: 0.60,
    rescateAgresivo: false
  },
  [B1_SENSITIVITY.MEDIA]: {
    maxSlots: 999,
    minConfidenceWord: 0.55,
    minConfidencePage: 0.50,
    rescateAgresivo: false
  },
  [B1_SENSITIVITY.ALTA]: {
    maxSlots: 999,
    minConfidenceWord: 0.40,
    minConfidencePage: 0.35,
    rescateAgresivo: true
  }
});
const B1_CONFIG = Object.freeze({
  MAX_IMAGE_SIDE_PX: 1280,
  DEFAULT_TIME_BUDGET_MS: 8000,
  ROI_MARGIN_PX: 15,
  ROI_TTL_MS: 900000,
  MAX_RETRY_ATTEMPTS: 3,
  MAX_RETRY_TOTAL_MS: 6000,
  MODULE_NAME: 'Boxer1_Core',
  MODULE_ORIGIN: 'Boxer1_Core',
  INPUT_MODULO_DESTINO: 'Boxer1_Core',
  INPUT_ACCION: 'analizar_texto_etiqueta',
  TRASTIENDA_MODULO_ORIGEN: 'BOXER1',
  TRASTIENDA_MODULO_DESTINO: 'TRASTIENDA',
  TRASTIENDA_ACCION_VISION: 'procesarVision',
  TRASTIENDA_ACCION_GEMINI: 'procesarGemini'
});
