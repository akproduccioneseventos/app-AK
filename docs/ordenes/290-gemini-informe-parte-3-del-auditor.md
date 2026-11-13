# Orden 290 — Informe parte 3 (final) del auditor: presupuestos lentos, invitación, entrega del álbum (12/11/2026)

**Para Gemini.** Va **en la misma entrega que las 284 a 289** (tu rama `gemini/ordenes-282-283-entrega-completa`).
**Una sola propuesta, sin fusionar.** Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 95.

**Lo que ya hizo Claude y no se toca:** el respaldo automático no se guardaba nunca porque esperaba una lista en
`galeria-publica.json` y `carga-operativa-templates.json`, que son objetos (`src/lib/backup/backup-registry.ts`). Control:
`src/__tests__/el-respaldo-espera-la-forma-que-se-guarda.test.ts`.

**Fuera de esta orden** (sólo el dueño, desde su cuenta): el saldo de Gemini, y prender las tareas programadas de Firebase
(orden 278, bloque 1).

## Barrido en toda la app (Claude, 12/11/2026)

- Forma esperada contra forma guardada: comparadas las 80 entradas del respaldo y todas las lecturas con nombre fijo de
  `src/`. Sólo estaban mal las dos de arriba.
- Pantallas que corren una reparación cada vez que se abren: sólo `/presupuestos/nuevo` (bloque 1).
- Promesas de Wfolio: el módulo `src/lib/social-fiesta/wfolio-album-delivery.ts` **no lo importa nadie**, y
  `src/app/post-fiesta/[fiestaId]/page.tsx` ~97 promete "wfolio y Google Drive" (bloque 3).
- Lo que no se cambia: el portal pide clave (está bien), las estaciones y la invitación se ven bien (lo dijo el auditor),
  la restauración (sana en su prueba aislada).

## Bloque 1 — "Presupuestos" tarda 22 segundos en abrir en el celular (P2)

**Primero medí** dónde se va el tiempo en `/presupuestos/nuevo` (Playwright a 390 px, primera carga y segunda), y anotá
los números en el informe de la entrega. En el código hay dos candidatos a mirar, en
`src/app/(app)/presupuestos/nuevo/page.tsx` ~65-80:
- `repairVerifiedBudgetDates()` se **espera** antes de pedir la lista, cada vez que se abre la pantalla, y lee la lista
  entera de presupuestos (`src/app/actions/presupuestos.ts` ~124). Es una corrección de fechas importadas que hace falta
  una vez. Que la pantalla pida la lista **primero** y corra la corrección **después**, sin esperarla. Volvé a pedir la
  lista sólo si `changedCount > 0`. **No cambies lo que hace `repairVerifiedBudgetDates`.**
- `getPresupuestos(showArchived)` y `getPresupuestos(true)` leen dos veces la misma lista para mostrar un número. Que
  `getPresupuestos` devuelva también el total (`totalCount`) y se llame una sola vez.
- Si la medición dice que el tiempo se va en otro lado, arreglá eso y explicalo; no fuerces estos dos.

## Bloque 2 — La invitación repite tres veces "AK está preparando esta sección" (P3)

`src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx` ~1122: `PLACEHOLDER_EL` se agrega por cada sección sin
activar. Al invitado **no** se le muestran secciones vacías: si una sección no está activa, no se agrega nada. El texto
de "AK está preparando…" (con su acento: "está", "sección") se muestra **una sola vez** y sólo si **todas** las secciones
del medio están vacías.

## Bloque 3 — La entrega del álbum por Wfolio: que la app la use o que no la prometa (P2)

- En el centro de fiesta del equipo (`src/app/(app)/fiestas/[id]/centro/page.tsx`), una tarjeta **"Entrega del álbum"**
  que usa `buildWfolioDelivery` y `getAlbumDeliveryStatus` de `src/lib/social-fiesta/wfolio-album-delivery.ts`: un campo
  para el enlace del álbum (validado con `isValidWfolioUrl`), el estado, y "Mandarle el enlace al cliente" como mensaje
  **preparado** (lo manda una persona). Se guarda con la acción de la fiesta que ya pide permiso.
- Al terminar la subida comprobada a Wfolio (orden 288, bloque 4), el AK Editor abre esa pantalla con
  `?wfolioUrl=<enlace>` y el campo ya lleno: **un toque** para guardar.
- `src/app/post-fiesta/[fiestaId]/page.tsx` ~97: "Facilidad de acceso a wfolio y Google Drive…" → "Te pasamos el enlace a
  tu carpeta para bajar todo en alta calidad." (sin Google Drive: no está integrado).

## Bloque 4 — El simulador en el celular tarda en responder a los toques (P2)

En la verificación completa (con la máquina cargada), `/simulador-de-presupuesto?tipo=boda` en el celular muestra el paso
1 y **ningún botón responde durante más de 60 segundos** ("Armar mi presupuesto", "Continuar"); sola, la prueba pasa. Medí
cuánto tarda la página en quedar lista para tocar (`src/app/simulador-de-presupuesto/page.tsx`, más de 2.000 líneas en un
solo componente) y bajalo: partir la página en pasos que se cargan cuando se llega a ellos (`next/dynamic`). Y arreglá la
prueba `tests/e2e/el-simulador-respeta-el-tipo-de-fiesta.spec.ts`: la portada con `isVisible({ timeout })` no espera (ese
`timeout` no hace nada) y con `?tipo=` el celular arranca en el paso 1, donde el botón es `simulator-first-step-cta`.

## Pruebas

- `tests/e2e/presupuestos-abre-rapido.spec.ts`: a 390 px, la lista de presupuestos aparece **antes** de que termine la
  corrección de fechas (retené la respuesta de `repairVerifiedBudgetDates` con la ruta interceptada y mirá que la lista ya
  se vea).
- `src/__tests__/la-invitacion-no-muestra-secciones-vacias.test.tsx`: con tres secciones desactivadas y una activa, el
  texto "preparando" no aparece; con todas desactivadas, aparece una vez.
- `src/__tests__/la-entrega-del-album-se-usa.test.ts`: la tarjeta guarda un enlace válido de Wfolio y rechaza uno que no
  es de Wfolio; con `?wfolioUrl=` el campo aparece lleno.

```comprobar
usa: simulator-first-step-cta en tests/e2e/el-simulador-respeta-el-tipo-de-fiesta.spec.ts
no-usa: await withTimeout(repairVerifiedBudgetDates() en src/app/(app)/presupuestos/nuevo/page.tsx
usa: buildWfolioDelivery en src/app/(app)/fiestas/[id]/centro/page.tsx
no-usa: wfolio y Google Drive en src/app/post-fiesta/[fiestaId]/page.tsx
no-usa: AK esta preparando esta seccion en src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx
prueba: src/__tests__/la-invitacion-no-muestra-secciones-vacias.test.tsx
prueba: src/__tests__/la-entrega-del-album-se-usa.test.ts
```
