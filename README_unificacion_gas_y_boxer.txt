PAQUETE DE REPARACIÓN

Qué sustituir:
1. Crear un proyecto GAS nuevo o usar el de Trastienda como base.
2. Pegar APP_UNIFICADO_SEGURIDAD_TRASTIENDA_v1.gs como código del backend unificado.
3. Desplegar UNA sola webapp.
4. En banco/app, poner la misma URL en Seguridad y Trastienda.
5. Forzar nuevo login.

Qué sustituir en Boxer 1 / banco:
- B1_contratos.js  -> B1_contratos_unificado_patch.js
- B1_diagnostico.js -> B1_diagnostico_unificado_patch.js
- B1_prechequeo.js -> B1_prechequeo_unificado_patch.js
- B1_ocr_base.js -> B1_ocr_base_unificado_patch.js
- B1_core.js -> B1_core_unificado_patch.js
- test_boxer1.html -> test_boxer1_unificado_patch.html

Qué corrige:
- elimina validación GAS->GAS por red
- router único por moduloDestino
- OCR rico completo desde Vision
- tiempos internos del backend
- agente OFF sin ROJO falso
- pre-warm en banco de pruebas
- lectura de OCR rico real en Boxer 1

Qué NO toca:
- calidad de imagen
- resolución
- OCR rico completo
- lógica general de rescate/merge fuera de lo necesario

Importante:
- No puedo desplegar tu GAS por ti desde aquí.
- El código está preparado, pero la prueba real depende del despliegue en tu cuenta.
