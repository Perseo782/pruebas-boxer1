/**
 * ═══════════════════════════════════════════════════════════════
 * BOXER 1 v2 · ENUMS Y CONSTANTES
 * ═══════════════════════════════════════════════════════════════
 * Alineado con madre v5 y 12 reglas fijas del proyecto.
 * ═══════════════════════════════════════════════════════════════
 */

var B1_SEND_MODE = Object.freeze({
  BASE64: 'base64',
  NORMAL: 'normal'
});

var B1_PASSPORT = Object.freeze({
  VERDE:   'VERDE',
  NARANJA: 'NARANJA',
  ROJO:    'ROJO'
});

var B1_ESTADO_GEMINI = Object.freeze({
  CORREGIDA:   'corregida',
  YA_VALIDA:   'ya_valida',
  NO_RESUELTA: 'no_resuelta'
});

var B1_MERGE_STATUS = Object.freeze({
  OK:                      'ok',
  CANCELADO_POR_ASIMETRIA: 'cancelado_por_asimetria',
  NO_INTENTADO:            'no_intentado'
});

var B1_ACCIONES_CEREBRO = Object.freeze({
  REINTENTAR:           'reintentar',
  REINTENTAR_UNA_VEZ:   'reintentar_una_vez',
  REINTENTAR_MAS_TARDE: 'reintentar_mas_tarde',
  BLOQUEAR_GUARDADO:    'bloquear_guardado',
  ABRIR_REVISION:       'abrir_revision',
  CONTINUAR_Y_MARCAR:   'continuar_y_marcar_revision',
  ABORTAR_FLUJO:        'abortar_flujo',
  CORTE_TEMPRANO:       'corte_temprano',
  PEDIR_DATO_AL_USUARIO:'pedir_dato_al_usuario'
});

var B1_TIPO_FALLO = Object.freeze({
  REPARACION_AGOTADA:       'reparacion_agotada',
  IRRECUPERABLE_POR_DISENO: 'irrecuperable_por_diseno',
  DESCONOCIDO:              'desconocido'
});

var B1_ERRORES = Object.freeze({
  IMAGEN_INVALIDA:    'B1_IMAGEN_INVALIDA',
  IMAGEN_DESENFOCADA: 'B1_IMAGEN_DESENFOCADA',
  IMAGEN_REFLEJO:     'B1_IMAGEN_REFLEJO',
  IMAGEN_SIN_TEXTO:   'B1_IMAGEN_SIN_TEXTO',
  IMAGEN_RECORTE_ROTO:'B1_IMAGEN_RECORTE_ROTO',
  OCR_FAILED:         'B1_OCR_FAILED',
  OCR_VACIO:          'B1_OCR_VACIO',
  OCR_RUIDO:          'B1_OCR_RUIDO',
  RESCATE_TIMEOUT:    'B1_RESCATE_TIMEOUT',
  RESCATE_FALLIDO:    'B1_RESCATE_FALLIDO',
  MERGE_ASIMETRIA:    'B1_MERGE_ASIMETRIA',
  MERGE_DUPLICADO:    'B1_MERGE_DUPLICADO',
  PRESUPUESTO_AGOTADO:'B1_PRESUPUESTO_AGOTADO',
  CATALOGOS_NO_LISTO: 'B1_CATALOGOS_NO_LISTO',
  ERROR_INTERNO:      'B1_ERROR_INTERNO'
});

var B1_CONFIG = Object.freeze({
  MAX_IMAGE_SIDE_PX:          1280,
  DEFAULT_TIME_BUDGET_MS:     8000,
  ROI_MARGIN_PX:              15,
  ROI_TTL_MS:                 900000,
  VENTANA_CONTEXTO:           3,
  MAX_RETRY_ATTEMPTS:         3,
  MAX_RETRY_TOTAL_MS:         6000,
  MODULE_NAME:                'Boxer1_Core',
  MODULE_ORIGIN:              'Boxer1_Core',
  INPUT_MODULO_DESTINO:       'Boxer1_Core',
  INPUT_ACCION:               'analizar_texto_etiqueta',
  TRASTIENDA_MODULO_ORIGEN:   'BOXER1',
  TRASTIENDA_MODULO_DESTINO:  'TRASTIENDA',
  TRASTIENDA_ACCION_VISION:   'procesarVision',
  TRASTIENDA_ACCION_GEMINI:   'procesarGemini'
});