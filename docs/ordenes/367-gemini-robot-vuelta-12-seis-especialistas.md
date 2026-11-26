# Orden 367 — Robot, vuelta 12 (seis especialistas): listas que se pisan, cuentas de la ganancia, quién ve el parte del equipo, avisos que no salieron, tareas "corridas" que fallaron y fechas de Greenwich

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 366 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. **Los bloques 2, 3 y 6 son plata
o permisos: Claude los revisa línea por línea.** El candado de la plata (`src/__tests__/el-candado-de-la-plata.test.ts`) sigue en verde.

## Por qué
Primera vuelta con los seis especialistas (26/11/2026). Cada punto lo confirmó Claude abriendo el archivo. Esto está bien y no
se toca: los recibos y el empleado (miran `success`), la firma digital, el cambio de fecha sin doble toque, las multas fuera del
descuento, el pago del cliente desde el portal, el webhook de Meta con firma y la voz del equipo con permisos.

## Bloque 1 — Listas que el cliente y el equipo editan a la vez (pregunta 210)
1. **"Qué tiene que llevar" del cliente.** El portal (`src/app/portal-cliente/[id]/page.tsx` ~365-377, `handleToggleLlevar`) y el
   panel del equipo (`src/components/fiestas/panels/portal-cliente.tsx` ~479) mandan **la lista entera** que tenían al abrir, y
   `updateClientPackingList` (`src/app/actions/fiesta/portal.actions.ts` ~389) y `updateClienteDebeLlevar`
   (`src/app/actions/fiesta/fiesta.actions.ts` ~1884-1892) la reemplazan. Si el equipo agrega "D" y el cliente tilda "A" con su copia
   vieja, "D" desaparece. Que las dos acciones reciban **un cambio** (`{ itemId, llevado }`, agregar o quitar un ítem) y lo apliquen
   sobre la lista actual dentro de `actualizarFiesta`; la pantalla recarga la lista con lo que devuelve. Si falla, la casilla vuelve
   a como estaba.
2. **Recontacto automático de prospectos.** `src/lib/marketing/recontacto-automatico.ts` lee `crm-leads.json` al principio (~73),
   manda los WhatsApp de a uno (~89) y al final hace `writeData(LEADS_FILE, actualizados)` (~121) con **todos** los prospectos de
   esa lectura. Un prospecto que contesta en el medio pierde `lastInboundAt` y mañana le vuelve a llegar el recordatorio; uno nuevo
   cargado en el medio desaparece. `crm-leads.json` es colección (`prospectos`, `src/lib/firebase-sync.ts` ~24): guardá **de a un
   prospecto** con `mutateDataItem`, cambiando sólo `recontactoAutomaticoAt`, `lastContactedAt`, `lastContactMethod` y `updatedAt`
   sobre el registro actual.

## Bloque 2 — Las cuentas de la ganancia (`src/lib/costos/ganancia-evento.ts`)
1. ~199-205 `esGastoManualDeComision`: `t.includes('mp')` encuentra "mp" en "**co*mp*ra**", "ca*mp*ana"… Un gasto "Comisión por
   compra de vajilla" de $800 se resta de la comisión de Mercado Pago ($1.000 → $200) y la ganancia sale $800 de más. Exigí
   "mercado pago" o "mercadopago" (o la palabra entera "mp" con `\bmp\b`) (pregunta 241).
2. ~180-190 bloques automáticos: con algo pagado, cuentan **sólo lo pagado** (catering estimado $50.000, pagado $20.000 → costo
   $20.000), aunque el comentario dice "misma lógica" que los renglones manuales (~158-170), que usan `Math.max(pagado, estimado)` y
   suman a `sinRendir`. Aplicá la misma lógica a los bloques.
3. El ingreso guardado (`gestionCostos.ingresosTotalesEstimados`, escrito en `src/app/actions/fiesta/fiesta.actions.ts` ~1050 y
   `src/app/actions/fiesta/costos.actions.ts` ~197) no tiene el ajuste anual, y lo leen tal cual Finanzas
   (`src/components/contabilidad/panels/finanzas.tsx` ~58), la comparativa (`src/lib/costos/comparativa.ts` ~104) y el aviso de margen
   (`src/lib/costos/aviso-margen-historico.ts` ~45 y ~95). La tarjeta de rentabilidad sí lo tiene (`resolverIngresoRentabilidad`,
   `src/lib/costos/ingreso-rentabilidad.ts` ~20). Que los tres lean de `resolverIngresoRentabilidad`. (No toques lo de las cuotas:
   eso es la orden 364.)

## Bloque 3 — Quién ve el parte del equipo y las caras de los invitados
1. `src/app/actions/multiagent.ts`: `getMultiAgentTeamBriefing` (~470), `runMultiAgentTeamReview` (~487), `getChatsMultiagente`
   (~429), `getMemoriasMultiagente` (~463), `guardarAprendizajeAgente` (~440), `enviarAprendizajeAFiestasGeneral` (~637) y
   `cerrarFiestaConRetroalimentacion` (~674) piden **sólo sesión**. El parte (`src/lib/multiagent/diagnostics.ts` ~172-196) trae
   cuotas vencidas y comprobantes de pago por fiesta: lo recibe cualquiera del equipo (el personal, el operador). Pedí el permiso que
   usa la pantalla de multiagente para el resto, y quitá del parte los ítems de cuotas y comprobantes a quien no tiene CONTABILIDAD.
2. `getCarasDeFiesta` (`src/app/actions/social-gallery.ts` ~2281), sin sesión ni enlace, devuelve los **números de la cara** de cada
   invitado de la fiesta a quien tenga el número de la fiesta; la galería pública (`src/app/evento/galeria/[fiestaId]/page.tsx` ~130)
   los compara en el navegador. Hacé la comparación **en el servidor**: una acción `buscarmeEnLaGaleria(fiestaId, vectorDeLaSelfie)`
   que devuelve sólo los `fotoId` que coinciden, con el tope de pedidos públicos. `getCarasDeFiesta` deja de ser llamable desde
   afuera. El botón "Buscarme" sigue igual para el invitado (decisión del dueño del 20/11).

## Bloque 4 — Avisos que dicen que salieron y no salieron
1. **Alergias a la cocina.** `createNotification` (`src/app/actions/notifications.ts` ~117-120) devuelve `{ success: true }` sin crear
   nada cuando el aviso está apagado en las preferencias, y `src/components/fiestas/panels/alergias.tsx` ~203-208 dice "Aviso enviado
   a Cocina". Que devuelva `{ success: true, enviado: false, motivo: 'apagado' }` y que el panel diga "Guardado, pero los avisos de
   esta clase están apagados en Ajustes".
2. **Resumen al empleado.** `src/app/(app)/empleados/page.tsx` ~229-230: después de `window.open(...)` dice "✅ Resumen enviado". Lo
   manda una persona: que diga "Resumen listo: tocá enviar en WhatsApp", y si `window.open` devuelve `null`, que avise que el
   navegador bloqueó la ventana y ofrezca copiar el texto.

## Bloque 5 — Tareas que figuran "corridas" y no hicieron nada (pregunta 242)
1. `ejecutarAgentesAutonomos` (`src/lib/agentes/motor-agentes.ts` ~893-895): el `catch` de cada agente sólo hace `console.error`.
   Que la función devuelva también la lista de los que fallaron, y que `src/app/api/cron/asistente-proactivo/route.ts` (~78 y
   ~346-348) y `src/lib/automatico/al-entrar-a-la-app.ts` (~318, `esFalla`) no marquen la corrida si alguno falló. (Va junto con la
   orden 362, bloque 3.)
2. `src/lib/marketing-automation.ts` ~99-107: con el candado ocupado devuelve `success: true, skipped: true`, y la ruta del blog
   (`src/app/api/cron/generate-blog-post/route.ts` ~41) y el arranque (`al-entrar-a-la-app.ts` ~409) lo marcan corrido. Con `skipped`
   no se marca: la corre el que tiene el candado.
3. `src/lib/automatico/posicionamiento-diario.ts` ~69: con páginas rotas deja `estado: 'atencion'` y nadie se entera. Que cree un
   aviso al dueño con la lista de páginas que fallaron (una vez por día).
4. `src/lib/blog/sin-promesas.ts` ~4: `REGEX_PROMESAS` no tiene plazos ("24 horas", "24 hs", "en el día", "plazo"), y un artículo
   que promete "te respondemos en 24 horas" se publica solo (`src/lib/blog-ai-generator.ts` ~231-234). Sumalos.

## Bloque 6 — Fechas en Uruguay y botones del invitado (pregunta 70)
Usá `hoyEnUruguay()` (`src/lib/utils.ts` ~38) en vez de `new Date().toISOString().split('T')[0]`:
1. `src/app/(app)/presupuestos/[id]/ver/page.tsx` ~562: al guardar un pago, el campo de fecha vuelve a "mañana" desde las 21:00, y el
   cobro siguiente cae en otro día (y a fin de mes, en otro mes).
2. `src/components/fiestas/panels/plan-pagos.tsx` ~126: una cuota nueva nace venciendo mañana.
3. `src/lib/fiesta/revisar-fiestas.ts` ~110: la fiesta de hoy figura "pasada sin archivar" la misma noche.
4. `src/lib/budget/payment-summary.ts` ~30-35 (`isOverdue`) y `src/lib/planPagos.ts` ~254: una cuota que vence el 27 figura vencida
   desde las 21:00 del 26. Compará días de Uruguay (`parseUruguayDate`), no instantes.
Y en `src/app/evento/social/[fiestaId]/page.tsx` ~305, ~1324 y ~1536, los botones del invitado `h-9 w-9` pasan a `h-10 w-10`.

## Barrido en toda la app
- Listas enteras que dos lados editan (pregunta 210): `grep -rn "updateFiestaData(.*=> ({ \.\.\.data, \w\+: items" src/app/actions` y
  `grep -rn "await writeData(" src/lib/marketing src/lib/crm`.
- Palabras buscadas por pedazos (pregunta 241): `grep -rnE "includes\('[a-zñ]{2,3}'\)" src/lib src/app/actions`.
- Tareas que juntan varias y no cuentan las de adentro (pregunta 242): `grep -rn "catch (err) {" src/lib/agentes src/lib/automatico`
  y mirar si la falla llega al que marca la corrida.
- Fechas: `grep -rn "toISOString().split('T')\[0\]\|toISOString().slice(0, 10)" src --include=*.ts*` (descartá las que guardan una hora
  exacta, no un día).
Plata, cobros y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No mandar mensajes solos: el resumen al empleado y el recontacto siguen como están (el recontacto sale solo por decisión del dueño).
- No cambiar el 10% del cambio de fecha ni la amortización de equipos: son reglas del negocio que el dueño no pidió cambiar.
- No sacar el "Buscarme" de la galería.

## Qué tiene que comprobar la prueba
- `src/__tests__/lo-que-lleva-el-cliente-no-se-pisa.test.ts` (base que devuelve **copias**): el equipo agrega "D" y el cliente tilda
  "A" con su copia vieja: quedan las dos cosas.
- `src/__tests__/el-recontacto-no-pisa-prospectos.test.ts`: un prospecto que contesta durante el envío conserva `lastInboundAt`, y
  uno creado en el medio sigue existiendo.
- `src/__tests__/la-ganancia-no-confunde-compra-con-mercado-pago.test.ts`: el gasto "Comisión por compra" no baja la comisión de MP;
  un bloque con $20.000 pagados de $50.000 estimados cuenta $50.000 y $30.000 sin rendir; Finanzas, la comparativa y el aviso de
  margen usan el ingreso con el ajuste.
- `src/__tests__/el-parte-del-equipo-no-muestra-plata.test.ts`: un perfil con NOCHE no recibe cuotas ni comprobantes del parte.
- `src/__tests__/las-caras-no-salen-del-servidor.test.ts`: `buscarmeEnLaGaleria` devuelve `fotoId` y nunca `vector`.
- `src/__tests__/una-tarea-con-un-agente-caido-no-figura-corrida.test.ts`: un agente que tira error deja la corrida sin marcar; el blog
  con el candado ocupado tampoco se marca.
- `src/__tests__/las-fechas-de-cobros-son-de-uruguay.test.ts`: a las 22:30 del 26/11 en Uruguay, la fecha por defecto del pago y de la
  cuota es el 26, la fiesta del 26 no está "pasada" y una cuota del 27 no está vencida.

```comprobar
no-usa: clienteDebeLlevar: items })) en src/app/actions/fiesta/portal.actions.ts
no-usa: clienteDebeLlevar: items }) en src/app/actions/fiesta/fiesta.actions.ts
usa: mutateDataItem en src/lib/marketing/recontacto-automatico.ts
no-usa: t.includes('mp') en src/lib/costos/ganancia-evento.ts
usa: resolverIngresoRentabilidad en src/components/contabilidad/panels/finanzas.tsx
usa: resolverIngresoRentabilidad en src/lib/costos/comparativa.ts
usa: CONTABILIDAD en src/lib/multiagent/diagnostics.ts
usa: buscarmeEnLaGaleria en src/app/evento/galeria/[fiestaId]/page.tsx
no-usa: getCarasDeFiesta en src/app/evento/galeria/[fiestaId]/page.tsx
usa: enviado: false en src/app/actions/notifications.ts
no-usa: Resumen enviado en src/app/(app)/empleados/page.tsx
usa: skipped en src/app/api/cron/generate-blog-post/route.ts
usa: createNotification en src/lib/automatico/posicionamiento-diario.ts
no-usa: fechaVencimiento: new Date().toISOString() en src/components/fiestas/panels/plan-pagos.tsx
no-usa: setNewPagoFecha(new Date().toISOString() en src/app/(app)/presupuestos/[id]/ver/page.tsx
usa: hoyEnUruguay en src/lib/fiesta/revisar-fiestas.ts
usa: parseUruguayDate en src/lib/budget/payment-summary.ts
no-usa: grid h-9 w-9 en src/app/evento/social/[fiestaId]/page.tsx
prueba: src/__tests__/lo-que-lleva-el-cliente-no-se-pisa.test.ts
prueba: src/__tests__/el-recontacto-no-pisa-prospectos.test.ts
prueba: src/__tests__/la-ganancia-no-confunde-compra-con-mercado-pago.test.ts
prueba: src/__tests__/el-parte-del-equipo-no-muestra-plata.test.ts
prueba: src/__tests__/las-caras-no-salen-del-servidor.test.ts
prueba: src/__tests__/una-tarea-con-un-agente-caido-no-figura-corrida.test.ts
prueba: src/__tests__/las-fechas-de-cobros-son-de-uruguay.test.ts
```
