# Orden 206 — La fecha de la fiesta no se corre un día

Responsable: **Gemini**. Va en la **misma propuesta** que la 205 (devolución de la 1344), contra la rama
`claude/app-debug-stabilize-m70e6z` actualizada. Antes de entregar, `docs/ANTES-DE-ENTREGAR.md`
(pregunta 70 de `COMO-AUDITAR.md`) y `npx tsc --noEmit` + `npx jest` en cero.

## El problema

Una fecha guardada sin hora ("2027-08-08") se lee en hora de Greenwich con `new Date("2027-08-08")`, y en
Uruguay muestra **el 7**. El barrido del 21/10/2026 (después de Codex 159) la encontró en estos lugares.
**No toques lo de plata** (año del ajuste anual): eso ya lo arregló Claude con `anioDeLaFechaDelEvento`.

## Bloque 1 — Lo que ve el cliente, el invitado o el prospecto

Reemplazá el formateo por `formatearFechaEvento` o `formatEventDateHub`
(`src/lib/fechas/formato-fecha-evento.ts`), o por `parseEventDate` (`src/lib/public-experience/event-date.ts`)
cuando hace falta un `Date`. **No cambies el texto alrededor ni el formato que ya se ve**, sólo el día.

- `src/lib/album/armar-album.ts` ~160 y `src/app/evento/album/[fiestaId]/page.tsx` ~288 (álbum del cliente).
- `src/components/presupuestos/BudgetPrintTemplate.tsx` ~44 y ~57, `src/components/budget/BudgetDocument.tsx`
  ~42 y ~55: `formatDateShort`/`formatDateLong` usan `getDate()` cuando la fecha no trae hora.
- `src/components/presupuestos/paso-4-resumen.tsx` ~154 (`{{FECHA_EVENTO}}` del WhatsApp al cliente).
- `src/app/simulador-de-presupuesto/page.tsx` ~2217 (presupuestos anteriores del prospecto).
- `src/app/actions/fiesta/portal.actions.ts` ~1466 y ~1467 (adenda de cambio de fecha).
- `src/components/invitacion/AddToCalendarButton.tsx` ~18 (botón "agregar al calendario" del invitado):
  armá `AAAAMMDD` desde el texto, no con `getDate()`.

## Bloque 2 — Pantallas del equipo

- `src/components/decoracion/DecoMuestrario.tsx` ~58, `src/app/control-tower/preparacion/page.tsx` ~60,
  `src/app/(app)/empresa/dashboard/page.tsx` ~154, `src/app/(app)/empresa/red-social-eventos/page.tsx` ~233,
  `src/app/(app)/fiestas/nueva/page.tsx` ~638, `src/app/(app)/eventos/page.tsx` ~661-683.
- `src/app/(app)/fiestas/nueva/tareas/client.tsx` ~209-212: el día de la semana sale con `getDay()` sobre la
  fecha corrida; usá `parseEventDate`.

**No son hallazgo** (no los toques): `timeline/page.tsx`, `agenda.ts`, `event-date.ts`, las comparaciones y
ordenamientos, y los que ya agregan `T00:00:00` o `T12:00:00`.

## Qué tiene que comprobar la prueba

Con `TZ=America/Montevideo`, que una fiesta del **8 de agosto de 2027** se muestre como 8 en el álbum, en el
presupuesto impreso, en el texto de WhatsApp y en el archivo de calendario (`20270808`). Y un control que
recorra `src/` y frene `new Date(<fechaEvento|eventoFecha>).toLocaleDateString` y `.getDate()` sobre esas
fechas. **Tiene que dar rojo con el código de hoy.**

```comprobar
usa: formatearFechaEvento en src/lib/album/armar-album.ts
no-usa: new Date(fiesta.configuracion.fechaEvento).toLocaleDateString en src/app/evento/album/[fiestaId]/page.tsx
no-usa: new Date(presupuesto.eventoFecha).toLocaleDateString en src/components/presupuestos/paso-4-resumen.tsx
no-usa: d.getDate()))}` en src/components/invitacion/AddToCalendarButton.tsx
archivo: src/lib/fechas/formato-fecha-evento.ts
```
