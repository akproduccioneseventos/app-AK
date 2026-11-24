# Estado actual — 24 de noviembre de 2026

## Publicado
- #1462 a #1465 (órdenes 331-336 de Claude/Gemini anteriores, y las órdenes 338-342 escritas).

## Devuelto a Gemini (en `GEMINI.md`, "TU TRABAJO DE HOY")
- **336+337+338 (`gemini/orden-338`, #1470):** revisada plata y permisos línea por línea. Claude arregló el costo por
  unidad (×1000 en 4 recetas), la clave del portal leída de la copia en disco y dos pruebas contra la base: van en
  `docs/parches/revision-claude-336-338.patch`. Faltan 5 pruebas de navegador de Gemini que no pasan.
- **339+340+342+341 (`gemini/orden-341`, #1468):** vació `YA-RESUELTO.md`, choca en `consumo.ts`, `decisiones.ts` y
  `whatsapp-media.ts`, y falta `pdfjs-dist` en el lock. Va después de publicar la 338.
- Cuando vuelvan: comprobar que el parche esté aplicado sin cambios, revisar con lupa el cerebro (tope y reservas) y la
  papelería (gasta IA por imagen).

## Ojo
- La puerta falla seguido por carga de la máquina: `npm run otravez`; `AK_TRABAJADORES=2`; lanzar con el tiempo máximo.
