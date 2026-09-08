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

Medido el 2026-09-08. Total: **108**.

## src/app/(app)/calendario/page.tsx  (1)

- linea 741  updateAppointmentStatus()

## src/app/(app)/empresa/presentacion-led/configuracion/page.tsx  (1)

- linea 154  savePresentacionLedSettings()

## src/app/(app)/fiestas/nueva/invitados.actions.ts  (1)

- linea 23  saveFiesta()

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

## src/app/actions/assistant.ts  (1)

- linea 1415  saveFiesta()

## src/app/actions/crm.ts  (3)

- linea 697  saveFiesta()
- linea 818  saveFiesta()
- linea 828  moveCrmLead()

## src/app/actions/fiesta/configuracion.actions.ts  (1)

- linea 36  syncCustomerFromFiestaConfig()

## src/app/actions/fiesta/decoracion.actions.ts  (5)

- linea 52  updateDecoracion()
- linea 69  updateDecoracion()
- linea 88  updateDecoracion()
- linea 133  updateGestionCostos()
- linea 211  updateDecoracion()

## src/app/actions/fiesta/fiesta.actions.ts  (1)

- linea 878  deleteFiesta()

## src/app/actions/fiesta/live.actions.ts  (2)

- linea 36  saveFiesta()
- linea 140  saveFiesta()

## src/app/actions/fiesta/musica.actions.ts  (2)

- linea 16  saveFiesta()
- linea 51  saveFiesta()

## src/app/actions/fiesta/personal.actions.ts  (1)

- linea 158  saveFiesta()

## src/app/actions/fiesta/portal.actions.ts  (27)

- linea 45  saveFiesta()
- linea 144  createNotification()
- linea 157  createNotification()
- linea 336  saveFiesta()
- linea 338  createNotification()
- linea 385  saveFiesta()
- linea 390  createNotification()
- linea 443  saveFiesta()
- linea 448  createNotification()
- linea 564  createNotification()
- linea 599  createNotification()
- linea 621  createNotification()
- linea 656  createNotification()
- linea 691  saveFiesta()
- linea 712  saveFiesta()
- linea 786  saveFiesta()
- linea 791  createNotification()
- linea 843  saveFiesta()
- linea 883  saveFiesta()
- linea 925  saveFiesta()
- linea 946  saveFiesta()
- linea 1256  saveFiesta()
- linea 1260  createNotification()
- linea 1430  saveFiesta()
- linea 1434  createNotification()
- linea 1572  createNotification()
- linea 1619  createNotification()

## src/app/actions/fiesta/regalos.actions.ts  (1)

- linea 19  saveFiesta()

## src/app/actions/fiesta/reuniones.actions.ts  (1)

- linea 17  saveFiesta()

## src/app/actions/fiesta/screen-mode.actions.ts  (12)

- linea 72  saveFiesta()
- linea 143  saveFiesta()
- linea 166  saveFiesta()
- linea 187  saveFiesta()
- linea 236  saveFiesta()
- linea 272  saveFiesta()
- linea 309  saveFiesta()
- linea 330  saveFiesta()
- linea 354  saveFiesta()
- linea 377  saveFiesta()
- linea 440  saveFiesta()
- linea 497  saveFiesta()

## src/app/actions/fiesta/screen-playlist.actions.ts  (2)

- linea 20  saveFiesta()
- linea 37  saveFiesta()

## src/app/actions/fiesta/social-screen.actions.ts  (1)

- linea 20  saveFiesta()

## src/app/actions/fiesta/tareas.actions.ts  (1)

- linea 17  saveFiesta()

## src/app/actions/fiesta/video-vida.actions.ts  (1)

- linea 88  updateVideoVidaSettings()

## src/app/actions/fiestas-historicas.ts  (1)

- linea 136  createNotification()

## src/app/actions/games.actions.ts  (1)

- linea 132  saveFiesta()

## src/app/actions/historicos.ts  (2)

- linea 156  saveFiestaHistorica()
- linea 175  createNotification()

## src/app/actions/insumos.ts  (1)

- linea 233  propagateInsumoChangesToMenus()

## src/app/actions/meeting-intelligence.ts  (1)

- linea 336  saveFiesta()

## src/app/actions/menus-catering.ts  (1)

- linea 304  saveMenu()

## src/app/actions/multiagent.ts  (12)

- linea 216  verifySession()
- linea 230  verifySession()
- linea 246  verifySession()
- linea 253  verifySession()
- linea 270  verifySession()
- linea 309  createNotification()
- linea 330  verifySession()
- linea 354  createNotification()
- linea 386  verifySession()
- linea 420  verifySession()
- linea 456  verifySession()
- linea 494  createNotification()

## src/app/actions/post-event-intelligence.ts  (1)

- linea 153  createNotification()

## src/app/actions/simulator-agenda.ts  (1)

- linea 120  scheduleCrmMeeting()

## src/app/actions/social-gallery.ts  (1)

- linea 1013  saveFiesta()

## src/app/actions/social-interactive.ts  (3)

- linea 408  saveFiesta()
- linea 427  saveFiesta()
- linea 450  saveFiesta()

## src/app/actions/whatsapp.ts  (3)

- linea 248  createNotification()
- linea 259  createNotification()
- linea 289  createNotification()

## src/app/admin/ventas/page.tsx  (1)

- linea 52  saveFiesta()

## src/app/api/cron/recordatorio-a-los-invitados/route.ts  (1)

- linea 57  saveScheduledMessage()

## src/app/api/payments/mercadopago/webhook/route.ts  (1)

- linea 45  createNotification()

## src/app/marketing/page.tsx  (2)

- linea 392  saveMarketingChecklist()
- linea 505  saveMarketingChecklist()

## src/app/portal/[fiestaId]/moodboard/page.tsx  (2)

- linea 58  updateDecoracion()
- linea 88  updateDecoracion()

## src/components/catering/MenuForm.tsx  (1)

- linea 274  saveInsumo()

## src/lib/commercial-flow/deposit-service.ts  (1)

- linea 142  saveFiesta()

## src/lib/presencia-digital/resenas-seguimiento.ts  (1)

- linea 143  saveFiesta()

