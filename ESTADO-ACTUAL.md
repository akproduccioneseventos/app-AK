# Estado actual — 24 de noviembre de 2026

## Publicado hoy / Rama principal
- **#1462** (órdenes 331-334), **#1463** (mirar no escribe, orden 336), **#1464** (orden 335 + escaneos 211, 212, 214), **#1465** (auditoría general maestra y órdenes 337-342).

## PRs abiertas de esta sesión (sin fusionar por regla del usuario)
- **PR #1466 (`gemini/orden-336`):** orden 336 (auditoría 2da vuelta completa).
- **PR #1467 (`gemini/orden-339`):** órdenes **339** (auditor robot en emulador, foto inicial 537 en rojo/sin-mirar de 1672) y **340** (`src/ai/modelos.ts` + `docs/jules/tarea-diaria.md`).

## Entrega actual (Rama `gemini/orden-341`, apilada sobre `gemini/orden-339`)
- Órdenes **342** (`src/ai/cerebro.ts`, 6 puertas migradas y `/asistente` unificado en 4 solapas) y **341** (`disenar-con-ia.ts`, PDFs mm exactos, paneles de papelería y fotocabina con marco IA).

## En cola para Gemini (siguientes propuestas)
1. **Orden 337** (`gemini/orden-337`, después de la 336): auditoría general maestra (accesos, seguridad de descargas, Google y Ajustes).
2. **Orden 338** (`gemini/orden-338`, después de la 337) junto con los rojos que detectó el auditor robot.

## Ojo
- No mezclar trabajos en ramas ya cerradas o con PR abierta.
- En esta PC de 8 GB: no solapar `build`, `jest`, `graphify` ni Playwright; anteponer `node.exe` al `PATH` en Windows.
- Falta `npm install` fuera de este entorno para extracción PDF completa con `pdfjs-dist`. La puerta falla seguido por carga: `npm run otravez`.
