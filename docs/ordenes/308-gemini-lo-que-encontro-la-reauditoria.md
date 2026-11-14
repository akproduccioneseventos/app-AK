# Orden 308 — Lo que encontró la reauditoría y no estaba pedido (14/11/2026)

**Para Gemini.** Va **en la misma propuesta que la 297 a 307**. Antes de "terminé": `docs/ANTES-DE-ENTREGAR.md`.
Sale de la reauditoría posterior a la publicación del 13/11.

## Lo que NO se toca

- El candado de sólo mirar del auditor (`src/lib/auth/solo-lectura.ts`): el servidor ya rechaza lo que escribe. Esto es sólo la pantalla.
- El control de sesión del portal (`src/lib/portal/el-portal-pide-sesion.ts`).

## Barrido en toda la app (Claude, 14/11/2026)

- **Botones que borran, visibles para quien no puede usarlos:** "Eliminar todo permanentemente" en `src/app/(app)/eventos/page.tsx`
  ~470 y `src/app/(app)/settings/datos/page.tsx` ~278, "Reiniciar Planificador" en `eventos/page.tsx` ~430, Archivar/Eliminar/Duplicar
  por evento y "Restaurar" en el respaldo. Se buscan todos los botones con "Eliminar", "Borrar", "Restaurar", "Reiniciar" en `src/app/(app)`.
- **El contrato no carga ni con sesión del equipo:** `src/app/portal/[fiestaId]/contrato/page.tsx` ~78 lee con
  `getFiestaForPortalSession(fiestaId)`; con sesión del equipo (o del auditor) sin sesión del portal devuelve vacío y la pantalla dice
  "No pudimos cargar tu contrato". **Medilo antes de arreglar** (qué devuelve esa función con cada sesión).
- **Textos:** pestaña "Stonk" (`src/app/(app)/empresa/menus/tragos/page.tsx` ~348), "GROUMET" (`src/data/menus-catering.json` ~1913),
  "MÓDULO MAESTRO INDEPENDIENTE Y SINCRONIZADO" en la barra de tragos, y los conteos del planificador que no coinciden
  ("25 entradas disponibles" con 22 platos, "19 opciones principales" con 22).
- **Barra:** en las recetas se ve la cantidad pero el insumo aparece vacío. Mirar si la receta guarda el id de un insumo que no existe
  (ya hay prueba `las-recetas-de-la-barra-descuentan-de-verdad`) o si la pantalla no lo muestra.

## Bloque 1 — Lo que borra se esconde para quien no puede (P1)

Los botones que borran, reinician o restauran no se muestran si la sesión no tiene `PERMISOS.ADMINISTRACION` o es de sólo mirar
(`esSesionDeSoloLectura`). Prueba de navegador con la sesión del auditor: esos botones no están.

## Bloque 2 — El contrato abre con la sesión del equipo (P1)

Con la sesión del equipo o del auditor, la pantalla del contrato muestra el contrato de la fiesta (de sólo lectura para el auditor).
Sin ninguna sesión, ya la frena el control del portal. Si de verdad la fiesta no tiene contrato armado, decir "Todavía no hay contrato
para esta fiesta", no "No pudimos cargar".

## Bloque 3 — Barra y textos (P2)

- El insumo de cada línea de receta se ve con su nombre; si el insumo no existe, "Insumo borrado: elegí otro".
- "Stock", "GOURMET", sin la nota interna, y los conteos del planificador iguales a la cantidad de platos.

## Pruebas

```comprobar
usa: esSesionDeSoloLectura en src/app/(app)/eventos/page.tsx
prueba: tests/e2e/lo-que-borra-no-se-ve-para-el-auditor.spec.ts
prueba: tests/e2e/el-contrato-abre-con-la-sesion-del-equipo.spec.ts
no-usa: Stonk en src/app/(app)/empresa/menus/tragos/page.tsx
```
