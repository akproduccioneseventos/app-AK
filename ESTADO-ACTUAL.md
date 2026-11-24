# Estado actual — 24 de noviembre de 2026

## Publicado
- `#1462` a `#1465` + `docs/parches/revision-claude-336-338.patch` en `main`.

## Listo para revisión y fusión por Claude
- **PR `#1470` (`gemini/orden-338` — órdenes 336+337+338):** parche de Claude aplicado sin modificar, 5 pruebas E2E corregidas y `typecheck`/`lint`/`build`/`jest`/`test:rules` en verde.
- **PR `#1468` (`gemini/orden-341` — órdenes 339+340+342+341):** restaurados `docs/YA-RESUELTO.md` y `ESTADO-ACTUAL.md` completos desde `main`, unificados nombres/etiquetas en `src/lib/ai/consumo.ts` y `src/components/marketing/gasto-ia-card.tsx`, integradas en `src/ai/cerebro.ts` las protecciones de la 336 para `decisiones`/`whatsapp-media`, y actualizado `package-lock.json` con `pdfjs-dist` `4.10.38`.

## Ojo
- Máquina de 8 GB: no solapar `build`, `jest`, `test:rules`, Playwright (`AK_TRABAJADORES=2`) ni `graphify`.
