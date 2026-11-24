# Estado actual — 24 de noviembre de 2026

## Publicado
- `#1462` a `#1465` (órdenes 331-336 anteriores y las órdenes 338-342 escritas), más `docs/parches/revision-claude-336-338.patch` en `main`.

## Lista para revisión/fusión por Claude
- **336+337+338 (`gemini/orden-338`, #1470):** parche de Claude (`revision-claude-336-338.patch`) aplicado sin cambios + arreglos de las 5 pruebas E2E pendientes.
- Verificado en verde tras los últimos cambios: `npm run check:acentos`, `npm run typecheck`, `npm run lint`, `npm run build`, `npx jest --silent`, `npm run test:rules` y las pruebas E2E de los accesos externos, presentación LED y pantalla de fiesta por URL.

## Siguiente en curso
- **339+340+342+341 (`gemini/orden-341`, #1468):** actualizar desde `main` y resolver los 5 puntos pendientes en `GEMINI.md`:
  1. Conservar `YA-RESUELTO.md` y `ESTADO-ACTUAL.md` completos sumando arriba lo nuevo.
  2. Mantener todos los nombres de `consumo.ts` (ambas ramas).
  3. Integrar `decisiones.ts` y `whatsapp-media.ts` con reservas de tope, descargas con límite y tipos.
  4. Sumar `pdfjs-dist` en `package-lock.json` y correr las validaciones completas.

## Ojo
- La máquina de 8 GB requiere correr `build`, `jest`, `test:rules`, Playwright (`AK_TRABAJADORES=2`) y `graphify` de a uno por vez sin solapar procesos pesados.
