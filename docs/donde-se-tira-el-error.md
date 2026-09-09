# Los lugares donde todavia se tira el error

**Que es esto.** La lista completa, medida por `npm run dice-que-si?`, de cada lugar de la
app donde se llama a algo que **devuelve** el error y nadie mira el resultado. Es la forma
exacta que tuvieron los cinco defectos contables del 8 de septiembre de 2026: la pantalla
dice que salio bien y no paso nada.

**Lo que toca plata, cobros, comida, permisos y prospectos ya esta arreglado.** Lo que queda
en esta lista es de las pantallas del evento, la decoracion, el portal y las herramientas
internas, y va por la orden 49.

**No hace falta arreglar todo de una, pero NO PUEDE CRECER:** el trinquete
(`npm run "publicar?"`, paso "Lo que se dijo es lo que es") frena si aparece uno nuevo.

Medido el 2026-09-08. Total: **18** (reducido desde 108).

## src/app/(app)/calendario/page.tsx  (1)

- linea 741  updateAppointmentStatus()

## src/app/(app)/empresa/presentacion-led/configuracion/page.tsx  (1)

- linea 154  savePresentacionLedSettings()

## src/app/(app)/fiestas/nueva/muro-social/page.tsx  (1)

- linea 932  clearGallery()

## src/app/(app)/presupuestos/nuevo/crear/page.tsx  (1)

- linea 448  registrarUsoCupon()

## src/app/(app)/settings/feature-flags/page.tsx  (1)

- linea 248  updateGlobalOverride()

## src/app/actions/ak-100.ts  (1)

- linea 74  createNotification()

## src/app/actions/alertas.actions.ts  (1)

- linea 118  marcarAlertaLeida()

## src/app/actions/fiestas-historicas.ts  (1)

- linea 136  createNotification()

## src/app/actions/historicos.ts  (2)

- linea 156  saveFiestaHistorica()
- linea 175  createNotification()

## src/app/actions/insumos.ts  (1)

- linea 233  propagateInsumoChangesToMenus()

## src/app/actions/post-event-intelligence.ts  (1)

- linea 153  createNotification()

## src/app/actions/simulator-agenda.ts  (1)

- linea 120  scheduleCrmMeeting()

## src/app/api/cron/recordatorio-a-los-invitados/route.ts  (1)

- linea 57  saveScheduledMessage()

## src/app/api/payments/mercadopago/webhook/route.ts  (1)

- linea 45  createNotification()

## src/app/marketing/page.tsx  (2)

- linea 392  saveMarketingChecklist()
- linea 505  saveMarketingChecklist()

## src/components/catering/MenuForm.tsx  (1)

- linea 274  saveInsumo()
