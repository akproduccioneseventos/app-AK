# Estado actual — 24 de noviembre de 2026

## Publicado hoy / Rama principal
- **#1462** (órdenes 331-334), **#1463** (mirar no escribe, orden 336), **#1464** (orden 335 + escaneos 211, 212, 214), **#1465** (auditoría general maestra y órdenes 337-342).

## Nuestra entrega actual (Rama `gemini/orden-339`)
- **PR #1466 (`gemini/orden-336`):** orden 336 (auditoría 2da vuelta completa y controles pasados).
- **Rama `gemini/orden-339`:** órdenes **339** (auditor robot en emulador) y **340** (modelos Gemini centralizados + `docs/jules/tarea-diaria.md`).
  - Foto inicial del robot: **537 casilleros en rojo o sin mirar de 1672** (`456` visuales `sin-mirar`, `81` `robot:rojo`, `1135` `robot:verde`).
  - `pdfjs-dist` declarado en `package.json` (falta `npm install` fuera de este entorno).

## En cola para Gemini (siguientes propuestas)
1. **Órdenes 342 y 341** juntas en una propuesta (primero 342, después 341; desde `claude/app-debug-stabilize-m70e6z` / `main`).
2. **Orden 337** (auditoría general maestra) y **Orden 338** (auditoría funcional 23/11), junto con los rojos que encontró el robot.

## Ojo
- No mezclar trabajos en ramas ya cerradas o con PR abierta.
- En esta PC de 8 GB: no solapar `build`, `jest` ni emuladores de Playwright.
- Si `npm install` no corrió en este entorno, correrlo antes de exigir extracción PDF completa con `pdfjs-dist`. La puerta falla seguido por carga: `npm run otravez`.
