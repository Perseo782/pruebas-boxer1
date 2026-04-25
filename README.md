# Alergenos V2

Esta es la carpeta preparada para subir al repositorio.

## Que subir

Sube el contenido completo de esta carpeta:

- `index.html`
- `assets`
- `backend`
- `frontend`
- `shared`
- `vendor`
- `tests`
- `docs`
- `README.md`

No subas las carpetas antiguas de fases ni la carpeta completa `APPV2`.

## Entrada de la app

La entrada local es:

- `index.html`

La pantalla de acceso esta en:

- `frontend/pantallas/acceso.html`

## Pruebas

Prueba rapida sin credenciales reales:

```bash
node tests/smoke/run_smoke_ensamblaje.js
```

Las pruebas reales de Firebase, IA y Vision solo se ejecutan si se pasan credenciales por variables privadas.

## Nota

Boxer 1 ya esta incluido dentro de `backend/boxer1`. No hace falta subir carpetas antiguas externas para esta pieza.
