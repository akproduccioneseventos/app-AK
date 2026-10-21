# Orden 207 — Lo que encontró el barrido completo de las 26 preguntas que estaban "a medias"

Responsable: **Gemini**, con revisión de Claude en lo marcado "(plata)". Va en la **misma propuesta** que las
órdenes 205 y 206, contra `claude/app-debug-stabilize-m70e6z` actualizada. Antes de entregar,
`docs/ANTES-DE-ENTREGAR.md` y `npx tsc --noEmit` + `npx jest` en cero.

Lo de plata y permisos que ya arregló Claude el 21/10/2026 **no se toca**: lista de presupuestos que no dice
"vacía" si no leyó, invitados del chat al simulador, cuentas bancarias del portal, Meta Ads sin conectar,
permisos de `ejecutarTareaManual`, `notifyGuestsWithCalendarLinks`, `notifyContractSignedToClient`,
`activateUltimateEventSystem`, `deleteDocumento` y `extractReceiptDataAction`.

## Bloque 1 — El recordatorio a los invitados nunca corre (pregunta 6)

`src/app/api/cron/recordatorio-a-los-invitados/route.ts` existe y figura en
`src/lib/automatico/tareas-automaticas.ts` ~87, pero **nadie la dispara**: falta en `CADA_CUANTO` y
`MAPA_CRON_IDS` de `src/lib/automatico/al-entrar-a-la-app.ts` ~40-66. Sacá la lógica de la ruta a una función
en `src/lib/invitaciones/` (como `correrTareaRecordarInvitacionNoAbierta`), que la ruta y el despachador
llamen a la misma, y sumala con 24 horas. La prueba comprueba que el despachador la incluye y la corre.

## Bloque 2 — El álbum, la tablet y el centro de la fiesta no ven todas las estaciones (pregunta 66)

- `src/app/evento/album/[fiestaId]/page.tsx` ~247-248: la pestaña 360° filtra `plataforma_360` (se guarda
  `plataforma360`) y la de Espejo filtra `espejo_magico` (se guarda `espejoMagicoFoto`, `espejoMagicoFirma`,
  `espejoMagicoIA`). Usá `filtrarPorEstacion` como la galería, conservando el buzón con `capsulaTiempo`.
- `src/components/kiosk/kiosk-setup.tsx` ~324-334: falta Vogue (`bogue`).
- `src/app/(app)/fiestas/[id]/centro/page.tsx` ~80-83: faltan Vogue, Tótem IA y Buzón, sólo si están prendidas.

## Bloque 3 — Enlaces que el destino no lee (pregunta 30)

- Los avisos del portal llevan a `/fiestas/nueva?fiestaId=X&tab=...` (`src/app/actions/fiesta/portal.actions.ts`
  ~153 a ~1745) y `src/app/(app)/fiestas/nueva/page.tsx` no lee `tab`. Que abra la sección que dice el aviso.
- `src/app/(app)/fiestas/nueva/en-vivo/page.tsx` ~378 manda `?tab=retorno` y la pantalla abre "operaciones"
  (`Tabs defaultValue` ~216).

## Bloque 4 — Pantallas que se quedan cargando o dicen "vacío" sin haber leído (preguntas 19 y 50)

- `src/app/(app)/fiestas/nueva/gestion-documental/page.tsx` ~47 y `planner-costo-fiesta/page.tsx` ~325: sin
  `fiestaId` quedan cargando para siempre; mostrá `EventSelectionRequired` como `invitados/page.tsx` ~310.
- `src/app/actions/agenda.ts` ~264-272 (`getAppointments`) y ~147-149 (`getCalendarEvents`): usá
  `readDataConDetalle` y avisá si falló, para que el calendario no quede en blanco ni diga "no hay entrevistas".

## Bloque 5 — Corte a mitad de un guardado (pregunta 25) (plata, revisa Claude)

- `src/app/actions/presupuestos.ts` ~625-660 (`deletePresupuesto`): si no se pudo limpiar el prospecto o
  desenganchar la fiesta, devuelve `success: true` y sólo escribe en consola. Que devuelva un `aviso` y la
  pantalla lo muestre. El prospecto se limpia con `mutateDataItem` (pregunta 22), no reescribiendo la lista.
- `src/app/actions/customers.ts` ~260-296 (`deleteCustomer`): borra los archivos ANTES que la ficha. Primero la
  ficha; los archivos después.
- `src/app/actions/historicos.ts` ~30-190 (`processHistoricRecord`): seis escrituras seguidas, ids con
  `Date.now()` y sin llave de reintento. Usá `idDelIntento` (`src/lib/intento-en-servidor.ts`) para que un
  reintento no duplique el presupuesto cobrado, y guardá cliente y presupuesto de a un registro.

## Bloque 6 — Detalles (preguntas 2, 7, 8, 15 y 63)

- Carteles de "copiado" que no esperan a `navigator.clipboard.writeText`:
  `presupuestos/[id]/edit/page.tsx` ~328, `gestion-documental/cancelacion-contrato/page.tsx` ~241,
  `settings/whatsapp-business/page.tsx` ~364 (y los que marque `npm run formas-que-mienten`).
- Listas cortadas sin "y N más": `mi-dia/page.tsx` ~278, `fiestas/[id]/cierre-mundial/page.tsx` ~252,
  `settings/google-workspace/page.tsx` ~212.
- Selects sin nombre para el lector de pantalla: `settings/asistente/page.tsx` ~445, `pantallas-totem/page.tsx`
  ~433, `muro-social/page.tsx` ~2035; y lo elegido sólo por color: `settings/contratos/page.tsx` ~204,
  `experiencia/page.tsx` ~281 (`aria-pressed`), `PublicPortalView.tsx` ~2101 (`aria-selected`).
- `src/app/evento/social/[fiestaId]/page.tsx` ~72 importa `getPendingOfflineActions` sin usarla.

## Bloque 7 — Para consultar con el dueño, NO programar

**Contestado el 21/10/2026 y ya hecho por Claude** (`src/lib/fiesta/personal-por-invitados.ts`). No se toca.

El personal automático por invitados: el blog dice "un mozo de cocina y un mozo de atención cada 25"
(`applyAutomaticStaffByGuests`), pero el motor real (`fiesta.actions.ts` ~980-988) pone mozo cada 25, ayudante
de cocina cada 50, utilero cada 25 y barman cada 75. Claude se lo preguntó al dueño; no lo toques.

```comprobar
usa: recordatorio-a-los-invitados en src/lib/automatico/al-entrar-a-la-app.ts
usa: filtrarPorEstacion( en src/app/evento/album/[fiestaId]/page.tsx
usa: bogue en src/components/kiosk/kiosk-setup.tsx
usa: EventSelectionRequired en src/app/(app)/fiestas/nueva/gestion-documental/page.tsx
usa: readDataConDetalle en src/app/actions/agenda.ts
usa: idDelIntento en src/app/actions/historicos.ts
prueba: src/__tests__/un-permiso-que-no-se-mira-no-frena.test.ts
```
