# Mapa de ensamblaje Fase 12

Fecha: 2026-04-25

## Entrada local

- `index.html`
- Redirige a `frontend/pantallas/acceso.html`
- Tras login correcto abre `frontend/pantallas/gestion_registros.html`

## Pantallas oficiales conectadas

- `frontend/pantallas/acceso.html`
- `frontend/pantallas/gestion_registros.html`
- `frontend/pantallas/ajustes.html`
- `frontend/pantallas/alta_manual.html`
- `frontend/pantallas/alta_foto.html`
- `frontend/pantallas/revision.html`
- `frontend/pantallas/lote.html`
- `frontend/pantallas/importar_excel.html`
- `frontend/pantallas/exportar_excel.html`

## Piezas internas principales

- `backend/operativa`: altas, gestion, revision y lote.
- `backend/persistencia`: datos locales en memoria/navegador.
- `backend/adaptadores`: Firebase productos, activos y adaptador Boxer 1.
- `backend/historial`: historial de cambios.
- `backend/sync`: sincronizacion, conflictos, backups y estado.
- `backend/diagnostico`: registro tecnico y pruebas visibles.
- `backend/excel`: importar y exportar Excel.
- `backend/ia`: broker IA, persistencia de Cerebro y gateway de Boxers.
- `backend/boxer1`: copia validada de Boxer 1.
- `frontend/ia`: Cerebro visible y Boxers 2, 3 y 4.
- `assets`: fuentes Graphik, iconos oficiales y logo MHI.
- `vendor`: Excel minimo para navegador.

## Pendiente antes de GitHub/Firebase

- Revision final de subida para no incluir temporales ni secretos.
