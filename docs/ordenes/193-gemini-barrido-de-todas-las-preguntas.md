# PARA GEMINI - Orden 193: lo que encontró el barrido de TODAS las preguntas del método en toda la app

**Una sola propuesta con todos los bloques.** Si un bloque se traba, entregá el resto igual en la misma
propuesta y avisá cuál faltó. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` entero. **Toca
plata y permisos: nombra el candado** (`src/__tests__/el-candado-de-la-plata.test.ts`), y cada arreglo de
plata lleva su prueba con "alguien sin permiso" y datos de la forma real (pregunta 37).

**Arrancá de la rama `claude/app-debug-stabilize-m70e6z`, no de `main`**, encima de las órdenes 188 a 192.

## De dónde sale

El 20/10/2026 se buscaron en `src/` las 73 preguntas de `docs/COMO-AUDITAR.md`, a pedido del dueño. Todo
lo de abajo **lo confirmó Claude abriendo la línea**. Lo descartado no está; la lista de lo descartado está
en `docs/barridos.json`.

## Bloque 1 — funciones que se pueden llamar desde afuera sin permiso (pregunta 69)

Diez archivos fuera de `src/app/actions` empiezan con `'use server'`. Eso convierte cada función exportada
en algo llamable desde el navegador:

- `src/lib/data-service.ts`
- `src/lib/data-service-firebase.ts`
- `src/lib/generic-json-store.ts`
- `src/lib/firebase-sync.ts`
- `src/lib/commercial-flow/deposit-service.ts`
- `src/ai/flows/multiagent-flow.ts`
- `src/ai/flows/marketing-agent-flow.ts`
- `src/ai/flows/extract-contract-data.ts`
- `src/ai/flows/extract-receipt-data.ts`
- `src/ai/flows/meeting-intelligence-flow.ts`

Entre esas funciones están el escritor genérico de todos los datos (`writeData`, `mutateDataItem`,
`deleteDataItem`), `forceDeleteCollectionFromFirestore` y `registerContractDeposit`, que escribe la seña.
Hoy ninguna pantalla las importa, y Next 15 no publica las que nadie usa. **Igual no pueden quedar así.**

- **En los diez:** sacá `'use server'` y poné `import 'server-only';`. Las acciones de `src/app/actions/**`
  que las usan siguen andando igual.
- **`deposit-service.ts`:** no lo importa nadie. Borralo, salvo que el compilador diga lo contrario.
- **Si una pantalla llamaba directo a una de esas funciones de IA** (buscá los imports desde
  `'use client'`): que pase por una acción de `src/app/actions/` que pida sesión y mire
  `hayPresupuestoParaIA()`.
- **`changePassword`** (`src/app/actions/auth.ts` ~652): que pida sesión, y que `userId` sea el de la
  sesión o un administrador.
- **Candado nuevo**, `src/__tests__/ningun-archivo-de-lib-es-una-accion-publica.test.ts`: falla si algún
  archivo de `src/lib/**` o `src/ai/**` empieza con `'use server'`. **Rompelo a propósito** y mirá que
  frene.

## Bloque 2 — pagos de proveedores cruzados por nombre (pregunta 71, la forma de la orden 185)

Cuando los dos tienen `proveedorId` distinto, igual se emparejan por nombre:

- `src/app/actions/fiesta/fiesta.actions.ts` ~163 y ~192;
- `src/app/actions/fiesta/catering.actions.ts` ~26 (`mismoProveedor`). Codex lo reprodujo (orden 185, devolución 149): `updateShoppingListStatus` marca pedido el proveedor B y **borra el pago de A** si se llaman igual, y `pideCambiarLaPlata` (`fiesta.actions.ts`) rechaza una lista sin cambios. Si los dos tienen id, manda el id; el nombre sólo vale para filas viejas sin id;
- `src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx` ~334, ~388 y ~530.

En el ~334, además, **le reescribe el id** al de otro (`estadoProveedor.proveedorId = proveedorId //
migración`).

**El arreglo:** usá la regla de `src/lib/fiesta/reponer-la-plata.ts`.
- Si los dos tienen id, se emparejan **sólo** por id.
- El nombre sirve sólo cuando a uno le falta el id **y** hay un único candidato con ese nombre.
- La migración del ~334 sólo pone el id si la entrada no tenía.

**Prueba:** dos proveedores "Carnicería López" con ids distintos. Marcar pagado uno no marca el otro,
guardar la fiesta no le pasa el pago al otro, y la lista de compras muestra cada uno con lo suyo.

## Bloque 3 — fechas un día antes, y una cuota pagada con fecha de mañana (preguntas 13 y 70)

- **PLATA:** `src/app/(app)/fiestas/nueva/plan-pagos/page.tsx` ~167 guarda
  `fechaPago: new Date().toISOString().split('T')[0]`. Una cuota marcada pagada entre las 21 y las 24 de
  Uruguay queda con fecha de mañana. Usá `hoyEnUruguay()` de `src/lib/utils.ts`.
- **El botón "Registrar Pago"** (~346) queda deshabilitado mientras corre `handleMarkPaid`.
- **`src/app/(app)/mi-dia/page.tsx` ~58:** `hoyStr` en hora de Greenwich hace que de noche una cuota de
  mañana aparezca vencida. Usá `hoyEnUruguay()`.
- **Fechas guardadas como "AAAA-MM-DD"** que se muestran con `new Date(x)` y la hora local. Leelas con
  `parseUruguayDate` (`src/lib/utils.ts`) o `diaCalendario` (`src/lib/reportes/rango-de-dias.ts` ~29):
  - `src/components/crm/BookingConfirmationDialog.tsx` ~140;
  - `src/components/presupuestos/paso-4-resumen.tsx` ~42-50;
  - `src/components/budget/BudgetDocument.tsx` ~41-60;
  - `src/app/actions/fiesta/portal.actions.ts` ~1466;
  - `src/app/simulador-de-presupuesto/page.tsx` ~2217;
  - `src/app/control-tower/page.tsx` ~83;
  - `src/app/control-tower/preparacion/page.tsx` ~60;
  - `src/app/(app)/empresa/dashboard/page.tsx` ~154;
  - `src/components/decoracion/DecoMuestrario.tsx` ~58.
- **Prueba:** con la zona `America/Montevideo`, "2027-08-08" se muestra 8/8 en el recibo, el presupuesto
  y el diálogo de reserva, y a las 22:30 la cuota pagada queda con la fecha de hoy.

## Bloque 4 — saldos sin el ajuste anual (pregunta 36)

Calculan el saldo como `totalConDescuento - pagos`, sin el 15% anual. La ficha del presupuesto sí lo
suma, con `getBudgetCollectibleTotal` (`src/lib/budget/financial-guardrails.ts` ~216).

- `src/lib/automatico/parte-manana.ts` ~150;
- `src/lib/alertas/errores-humanos.ts` ~161;
- `src/lib/agentes/motor-agentes.ts` ~224;
- `src/app/(app)/customers/[id]/page.tsx` ~153.

Usá `getBudgetCollectibleTotal` en los cuatro. `src/lib/fiesta/informe-automatico.ts` inventa
`|| 125000` y no lo importa nadie: borralo.

**Prueba:** con un presupuesto aceptado para el año que viene, el parte de la mañana, el agente cobrador y
la ficha del cliente dicen **el mismo saldo** que la ficha del presupuesto.

## Bloque 5 — un cobro a confirmar contado en la ganancia (pregunta 44)

`src/lib/costos/ganancia-evento.ts` ~165 sólo saca los `rechazado`. Usá `isConfirmedClientPayment`, igual
que `parte-manana.ts` ~149.

**Prueba:** un cobro de Mercado Pago en `pendiente_confirmacion` no suma comisión ni recargo.

## Bloque 6 — la alerta de alergias no ve las alergias (pregunta 17), y una lista que falla dice "sin alertas" (pregunta 21)

- **Alergias:** `src/lib/alertas/errores-humanos.ts` ~257 lee `alergias`, `dietaEspecial` y `menuEspecial`,
  que no existen.
  - Los del invitado son `alergiasEspecificas`, `dietaryRestriction` e `isCeliac` (`src/types/fiesta.ts`
    ~55-59).
  - Lo de catering (`menuCeliecos`, `menuVegetarianos`, `observacionesAlergias`): buscá en
    `src/types/fiesta.ts` cuáles existen de verdad y usá esos.
- **Cada registro con su propio `try`** en `errores-humanos.ts`: un invitado roto no se lleva la lista.
- **`src/app/actions/alertas-errores-humanos.ts` ~23:** el `catch` devuelve `[]`. Que devuelva
  `{ alertas: [], error: '...' }`, y que la pantalla diga "No se pudieron revisar las alertas".
- **`src/app/evento/moderacion/[fiestaId]/page.tsx` ~32:** lee `isDark`, `isBlurry` y `aiFlags?.isNsfw`, que
  no escribe nadie. O los lee del dato que sí existe (`imageAiSafe`), o la marca se saca.
- **Prueba:** un invitado con `alergiasEspecificas: 'maní'` y un catering sin notas dispara la alerta.

## Bloque 7 — WhatsApp que no abre (pregunta 72) y páginas raras con nombres del lenguaje (pregunta 73)

- **Enlaces armados a mano con el número sin 598.** Pasalos por `buildWhatsAppLink` o `toWhatsAppDigits`
  de `src/lib/commercial/contact.ts`:
  - `src/app/(app)/presupuestos/[id]/ver/page.tsx` ~705;
  - `src/app/(app)/pagos-rapidos/page.tsx` ~180;
  - `src/app/(app)/empleados/page.tsx` ~153 y ~209;
  - `src/app/(app)/empleados/reporte/page.tsx` ~257;
  - `src/app/actions/rsvp-reminders.actions.ts` ~40;
  - `src/app/(app)/empresa/salones/page.tsx` ~58;
  - `src/app/(app)/empresa/salones/club-uruguay/page.tsx` ~542 y ~632.
- **Nombres del lenguaje en la dirección:** `getCatalogBySlug` (`src/data/event-catalogs/index.ts` ~22) y
  `PROMO_PAGES[slug]` (`src/app/landing/[slug]/page.tsx` ~47 y ~58) aceptan `constructor`. Usá
  `Object.hasOwn(...)`. **Prueba:** `/public/constructor` y `/landing/constructor` dan 404.

## Bloque 8 — reintentos que duplican (pregunta 58) y cámaras que quedan prendidas (pregunta 49)

- **`applyPlaybookToFiesta`** (`src/app/actions/playbooks.ts` ~105-200) crea tareas, documentos y compras
  con ids de `Date.now()`.
  - Que reciba un `operacionId` desde la pantalla, y si ya se aplicó con ese id, que no lo repita.
  - **Prueba:** dos llamadas con el mismo `operacionId` dejan las tareas una sola vez.
- **Cámaras que quedan prendidas** cuando la pantalla se cierra mientras pide permiso.
  - Pasa en `src/app/evento/bogue/[fiestaId]/page.tsx` ~268 y `src/app/evento/espejo-magico/[fiestaId]/page.tsx`
    ~308: después del `await getUserMedia`, si ya se cerró, se apaga el stream y no se guarda.
  - Mirá lo mismo en `galeria`, `buzon` (~221, ~410, ~587, ~919), `social` (~853),
    `fiestas/[id]/centro/comprobacion-equipo.tsx` ~103, `MeetingIntelligenceRecorder.tsx` ~157,
    `fiestas/nueva/buzon` ~172 y `fiestas/nueva/entretenimiento` ~984.

## Bloque 9 — terminar los barridos que quedaron a medias

En `docs/barridos.json` hay preguntas marcadas `"parcial"`. Para cada una:

- hacé la búsqueda que dice su línea **en todo `src/`**;
- arreglá lo que no es plata, permisos ni comida;
- **lo que sí es, listalo en la entrega sin tocarlo**;
- cambiá su `resultado` a lo que encontraste, con la fecha.

**No borres preguntas del registro.**

## Qué NO tocar

- Las decisiones de `docs/YA-RESUELTO.md`.
- El voto sin invitado (`votarEnVivo`).
- `getEmployeeWorkspacePortal`: cada empleado ve sólo su sueldo, está bien.
- `social-gallery.ts` ~593: "revisión manual = false" es segura a propósito.

```comprobar
prueba: src/__tests__/ningun-archivo-de-lib-es-una-accion-publica.test.ts
no-usa: "use server" en src/lib/data-service.ts
no-usa: 'use server' en src/lib/generic-json-store.ts
no-usa: 'use server' en src/lib/firebase-sync.ts
no-usa: || a.proveedor === b.proveedor en src/app/actions/fiesta/catering.actions.ts
usa: hoyEnUruguay en src/app/(app)/fiestas/nueva/plan-pagos/page.tsx
usa: getBudgetCollectibleTotal en src/lib/automatico/parte-manana.ts
usa: getBudgetCollectibleTotal en src/lib/agentes/motor-agentes.ts
usa: isConfirmedClientPayment en src/lib/costos/ganancia-evento.ts
usa: alergiasEspecificas en src/lib/alertas/errores-humanos.ts
usa: buildWhatsAppLink en src/app/(app)/pagos-rapidos/page.tsx
usa: hasOwn en src/data/event-catalogs/index.ts
usa: operacionId en src/app/actions/playbooks.ts
```
