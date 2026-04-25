# Inventario inicial del ensamblaje final Fase 12

Fecha: 2026-04-25
Estado: ensamblaje inicial creado y pruebas locales basicas superadas

## Entrada oficial

- `index.html`
- `frontend/pantallas/acceso.html`

La entrada limpia abre primero acceso y, si el login es correcto, pasa a `frontend/pantallas/gestion_registros.html`.

## Piezas integradas en esta carpeta

- Pantallas principales: acceso, gestion de registros, alta manual, alta por foto, revision, lote, ajustes, importar Excel y exportar Excel.
- Frontend operativo: estado de pantallas, carga Firebase, tienda local del navegador y runtime visible de Cerebro.
- Backend local usado en navegador: alta manual, alta por foto, gestion, revision, lote, persistencia local y adaptadores Firebase.
- Ajustes e historial: piezas de Fase 7 integradas en `backend/historial` y `frontend/pantallas/ajustes.html`.
- Sync: piezas de Fase 8 integradas en `backend/sync`.
- Excel: piezas de Fase 10 integradas en `backend/excel`.
- Diagnostico: piezas de Fase 11 integradas en `backend/diagnostico`.
- IA: broker IA, persistencia de Cerebro, gateway de Boxers 2/3/4 y modulos visibles de Cerebro/Boxers.
- Compartido: `shared/alergenos_oficiales.js`.
- Recursos visuales: fuentes Graphik, iconos oficiales y logo MHI dentro de `assets`.
- Excel en navegador: `vendor/xlsx.full.min.js`.

## Piezas referenciadas fuera por ahora

- Boxer 1 reconstruido: se integra como copia validada en `backend/boxer1`. No se reconstruye.

## Fuera del ensamblaje inicial

- Bancos de prueba.
- Pantallas temporales.
- Carpetas `tests/tmp`.
- Documentacion antigua.
- `node_modules` completo.

## Pruebas locales realizadas

- `tests/smoke/smoke_entrada_ensamblaje.js`: acceso, login simulado y entrada a gestion de registros dentro del ensamblaje.
- `tests/smoke/smoke_operativa_ensamblaje.js`: alta manual, gestion, alta por foto simulada, revision, lote simulado, historial, diagnostico, exportacion Excel e importacion Excel.
- `tests/smoke/smoke_pantallas_ensamblaje.js`: apertura como web local de entrada, acceso, gestion, ajustes, alta manual, alta por foto, revision, lote, importar Excel y exportar Excel.
- `tests/smoke/smoke_servicios_reales_ensamblaje.js`: login Firebase real, validar sesion, emitir token Firebase, diagnostico backend, IA y Vision.
- `tests/smoke/run_smoke_ensamblaje.js`: ejecuta las tres pruebas anteriores en un solo paso.
- Revision de referencias locales: las pantallas no apuntan ya a Fase 9 ni a `node_modules` para fuentes, iconos, logo o Excel.
- Limpieza visible: las pantallas oficiales ya no muestran etiquetas de fases antiguas en titulos y cabeceras.
- Revision de secretos: no se han encontrado claves privadas ni secretos evidentes; solo configuracion publica de Firebase.

Resultado actual:

- `OK smoke_entrada_ensamblaje`
- `OK smoke_operativa_ensamblaje`
- `OK smoke_pantallas_ensamblaje`
- `OK smoke_servicios_reales_ensamblaje`
- `OK run_smoke_ensamblaje`

## Riesgos abiertos

- Alta por foto y lote todavia dependen de Boxer 1 externo.
- Sin riesgo abierto de dependencia externa de Boxer 1 en esta carpeta final.
