# Orden 237 — Devolución de la propuesta 1365 (órdenes 234 a 236), 26/10/2026

**Para Gemini. Seguí en la misma propuesta 1365**, rama `gemini/ordenes-234-235`. Antes de tocar nada:

1. Traé y fusioná `origin/claude/integracion-1353`, que es lo que se está publicando. Trae la entrega 1353
   corregida, los arreglos de Codex y los avisos de plata filtrados.
2. Resolvé los 4 choques mirando la versión de la integración:
   - `src/app/(app)/fiestas/nueva/page.tsx`
   - `src/app/api/cron/asistente-proactivo/route.ts`
   - `src/lib/agentes/motor-agentes.ts`
   - `src/lib/ai/consumo.ts`

Si un bloque se traba, entregá el resto en la misma propuesta y avisá cuál faltó. Antes de decir "terminé", pasá
`docs/ANTES-DE-ENTREGAR.md`, que ya tiene las preguntas 71 a 73.

## Lo que NO se toca al resolver los choques

- **`motor-agentes.ts`:** el vigilante de publicidad **no** llama `pausarCampana` ni `ajustarPresupuestoCampana`;
  sólo deja "Propuesta para tu OK". Lo frena `el-agente-de-publicidad-no-toca-campanias.test.ts`.
- **`asistente-proactivo/route.ts`:** el aviso a todos los teléfonos es genérico, sin nombres ni saldos, y el
  día se cuenta con `hoyEnUruguay`. Lo frena `el-aviso-a-todos-los-telefonos-no-lleva-plata.test.ts`.
- **`src/app/actions/notifications.ts`:** `textoParaElTelefono` y el filtro por permiso en `getNotifications`.
- **`/empresa/redes-sociales`:** sigue siendo el planificador. No se redirige.

## Bloque 1 — siete pruebas de Jest en rojo

Corridas sobre `3bedbeecb`.

- **`agentes-autonomos.test.ts` (~70):** el perseguidor devuelve `sin_novedades` donde se esperaba `exito`.
  Si ahora deja el borrador por otro camino (`commercial-followup`), el estado tiene que seguir siendo `exito`
  cuando deja un borrador. No cambies la prueba para que acepte `sin_novedades`.
- **`auditoria-puertas-abiertas.test.ts`, `las-fugas-de-plata-no-crecen.test.ts` (~94) y
  `ningun-archivo-de-lib-es-una-accion-publica.test.ts` (~46):** las tres frenan por lo mismo.
  `src/ai/flows/generate-testimonial-flow.ts` quedó como `'use server'`, y eso lo vuelve llamable desde afuera.
  Sacale el `'use server'` y llamalo desde una acción de `src/app/actions/` que pida
  `requirePermiso(PERMISOS.ORGANIZACION)`. Lo mismo para cualquier otro flujo nuevo de `src/ai/flows/` con
  `'use server'`.
- **`el-duenio-se-entera-de-lo-que-pregunta-el-cliente.test.ts` (orden 101):** fallan las dos pruebas. Tocaste
  `asistente-virtual.ts`: el aviso al dueño por una cancelación y por una pregunta común tiene que seguir
  saliendo. Corré la prueba y arreglá lo que rompiste.
- **`la-ia-que-se-paga-siempre-se-cuenta.test.ts` (~52):** moviste el generador a
  `src/lib/commercial/commercial-followup.ts`, y la prueba mira `commercial-intelligence.ts`. El tope de gasto y
  el texto de respaldo tienen que seguir: `hayPresupuestoParaIA`, el texto "tope de gasto" y
  `messageForLead(input.name, input.reason)`. Comprobá que estén en el archivo nuevo y actualizá la prueba para
  que mire ese archivo, **con las mismas comprobaciones**.
- **`cada-hallazgo-de-codex-tiene-su-pregunta.test.ts`:** ya está resuelto en la integración. Se arregla al
  fusionar.

## Bloque 2 — lo que falta de la orden 234: las 3 versiones para la quinceañera

No está hecho. Es el bloque 5 de `docs/ordenes/234-gemini-la-ia-arma-la-web-del-evento.md`:

- `propuestasDeWeb` y la acción `elegirPropuestaDeWeb`, con `verifyPortalSession` o `requireFiestaWriteAccess`.
- La pantalla `src/app/portal-cliente/[id]/tu-web/page.tsx`.
- La prueba `tests/e2e/la-quinceaniera-elige-su-web.spec.ts`.

Hacelo como dice la orden.

## Bloque 3 — la orden 236 entera: centro de control y la app que aprende

No se empezó. Está en `docs/ordenes/236-gemini-centro-de-control-y-la-app-que-aprende.md`. Ojo con un cambio: los
avisos de plata ya se filtran por permiso, así que la pestaña "Para tu OK" del centro tiene que usar
`getNotifications` y `esAvisoDePlata` (`src/lib/notifications/aviso-con-plata.ts`), no leer el archivo de avisos
directo.

## Bloque 4 — formas que mienten en archivos que tocaste

- **`src/app/(app)/fiestas/nueva/logistica/page.tsx` (~86):** el cartel de éxito sale sin esperar el
  resultado. Esperá la respuesta y mostrá el error si falla.
- **`armar-web-del-evento-flow.ts` (~180):** dice "garant…". En lo que ve un cliente no va "garantía".
- **`asistente-virtual.ts` (~305):** usa `writeData(` sobre una lista. Usá el guardado con turno
  (`mutateGenericJsonArray`).

## Bloque 5 — pruebas de navegador

Corré solas:

- `tests/e2e/la-ia-arma-la-web-del-evento.spec.ts`
- `tests/e2e/la-ia-trabaja-sola.spec.ts`
- las nuevas del bloque 2 y de la orden 236

Pegá el resumen. Después corré `npx tsc --noEmit`, `npx jest --silent` completo y `npm run "publicar?:rapido"`, y
pegá las últimas líneas de cada uno.

```comprobar
no-usa: 'use server' en src/ai/flows/generate-testimonial-flow.ts
usa: hayPresupuestoParaIA en src/lib/commercial/commercial-followup.ts
usa: elegirPropuestaDeWeb en src/app/portal-cliente/[id]/tu-web/page.tsx
archivo: src/app/(app)/centro-de-control/page.tsx
no-usa: notifications.json en src/app/actions/centro-de-control.ts
usa: textoParaElTelefono en src/app/actions/notifications.ts
# Bloque 3 — centro de control
usa: darOrdenPorVozOTexto en src/app/(app)/centro-de-control/page.tsx
archivo: src/lib/ia/aprender-de-lo-aprobado.ts
usa: await navigator.clipboard.writeText en src/app/(app)/fiestas/nueva/logistica/page.tsx
no-usa: garantía en src/ai/flows/armar-web-del-evento-flow.ts
usa: mutateGenericJsonArray en src/app/actions/asistente-virtual.ts
prueba: tests/e2e/la-ia-arma-la-web-del-evento.spec.ts
prueba: tests/e2e/la-ia-trabaja-sola.spec.ts
prueba: tests/e2e/la-quinceaniera-elige-su-web.spec.ts
prueba: tests/e2e/el-centro-de-control.spec.ts
```
