# Orden 318 — Pruebas funcionales del auditor (17/11/2026, informe consolidado)

Informe "Pruebas funcionales - AK Producciones" del 17/11. Va en la **misma propuesta** que tus órdenes abiertas, al final.
Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

## Lo que ya arregló Claude (NO rehacer)

- **F1:** un cobro de $1.201 sobre $1.200 ya no entra (sin margen de $1 en pesos: `financial-guardrails.ts`, `invoice-money.ts`).
- **F3:** una factura sin cobros ya no nace "Pagada", y una "Pagada" sin cobros puede volver atrás y borrarse (`invoices.ts`).
- **F2:** subir un documento privado ya no depende de firmar direcciones (`uploadToStorage` en `src/lib/firebase/storage.ts`).
- **F8:** caracteres rotos del simulador público y de Ajustes → IA; el control de acentos ahora agarra flechas y emojis rotos.
- **O15:** la ganancia de la fiesta ya no toma el precio de venta como costo (`esPrecioDeVentaCopiado` en `ganancia-evento.ts`).
- **O3:** el auditor ya guarda en toda la app (decisión del dueño); la franja lo dice.

## Bloque 0 — En la computadora del dueño (con su sesión)

1. **Permiso de Google que falta.** Las direcciones firmadas (videos de invitados, audios de dedicatorias, `/api/storage/signed-url`)
   fallan en el servidor publicado con `iam.serviceAccounts.signBlob denied`. Dar el rol "Creador de tokens de cuenta de
   servicio" a la cuenta del servidor sobre sí misma (es gratis, no suma nada por mes):
   `gcloud iam service-accounts add-iam-policy-binding firebase-app-hosting-compute@presupuestador-ak-producciones.iam.gserviceaccount.com --member=serviceAccount:firebase-app-hosting-compute@presupuestador-ak-producciones.iam.gserviceaccount.com --role=roles/iam.serviceAccountTokenCreator --project=presupuestador-ak-producciones`
   Si la cuenta del servidor tiene otro nombre, mirala en la consola de App Hosting. Anotá el resultado en
   `docs/evidencias/permiso-firma-de-archivos.md`.
2. **Borrar los datos PRUEBA del auditor** (suman en los totales). Ids del informe: fiesta `fiesta_1794945054053_ey4li0f`, presupuesto
   `pres_request_d0e9681302a935c0314920048664f34cad5edc7f83284c5a8e22bc6ea13bd781` (con el pago de $1.201, recibo 97449D5D41),
   factura `inv_op_5e6eb6ac03a9f3e4696c1165dfdf397b` (ahora se puede pasar a Borrador y borrar), cliente
   `cust_b2eb86b7-2984-4185-b4e5-73259d1793f6`, prospectos "Prueba Test", "PRUEBA BORDE TRES", "PRUEBA RONDA VIVO",
   reuniones "Prueba Test" de hoy, invitados "PRUEBA Invitado …" y el mensaje del muro. **Sólo los que empiezan con PRUEBA o
   esos ids exactos.** Anotá qué borraste en la misma evidencia.

## Bloque 1 — F4: la hora del evento

- `src/app/(app)/presupuestos/[id]/recibo-contrato/page.tsx:191` y `src/app/(app)/presupuestos/[id]/ver/page.tsx:81`:
  `extractTimeFromDate` saca la hora de la fecha guardada en Greenwich ("T03:00Z" → "03:00"). Si `eventoHoraInicio` está vacío,
  el contrato dice "a confirmar", nunca una hora sacada de la fecha. Borrá la copia duplicada: una sola función en `src/lib/`.
- Portal del invitado (`src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx:340`, dato de `guest-portal-public-data.ts:119`):
  si la fiesta no tiene hora cargada, no mostrar "21:00": mostrar sólo la fecha.
- Cuenta regresiva: `src/lib/public-experience/event-date.ts:20` (`getDaysUntilEvent`) cuenta con la hora del servidor. Que use
  `diasHastaEnUruguay` (`src/lib/utils.ts:48`), igual que el panel (`fiesta-progress.ts:50`) y el portal del cliente.

## Bloque 2 — F5: "Modificar confirmación" trae lo que ya respondió

`src/app/invitacion/[fiestaId]/rsvp/page.tsx:62-90` arranca vacío y no sabe quién es. El enlace (`invitado/[guestId]/page.tsx:335`)
tiene que llevar la credencial del invitado, y la pantalla precarga nombre, asistencia, acompañantes, restricción y mensaje con
una acción pública que lea **sólo a ese invitado** (no la lista). Guardar actualiza ese invitado, no crea otro.

## Bloque 3 — F6 y F7: el panel de la fiesta no se contradice, y el salón pide lo mismo al crear y al editar

- `src/app/(app)/fiestas/nueva/page.tsx:293` (`hasDocs`): "Documentación al día" sólo con contrato firmado (no con tener presupuesto).
- `:524` el botón fijo "EN VIVO": decir "Modo en vivo" y no presentarlo como estado de la fiesta.
- Salón: el alta (`createFiestaVacia`, `fiesta.actions.ts:~1387`) y la edición tienen que usar la misma regla. Elegí: salón
  **opcional en los dos**, con el aviso de `revisar-fiestas.ts:156`.

## Bloque 4 — F9, F10, F11

- **F9:** `src/lib/fiesta-defaults.ts:500` `tipoCelebracion: 'Boda'` por defecto → vacío, y las pantallas que lo muestran dicen
  "Sin tipo" (como `src/lib/costos/comparativa.ts:49`).
- **F10:** `src/components/crm/CrmLeadCard.tsx:370` sumar `leadPhone` a la dirección y leerlo en
  `src/app/(app)/presupuestos/nuevo/crear/page.tsx` (~266, donde lee `leadName`). Y `presupuestos/nuevo/page.tsx:49` que
  reenvíe todos los datos, no sólo `fiestaId` y `leadId`.
- **F11:** `src/app/(app)/presupuestos/[id]/ver/page.tsx:699`: con el enlace apagado, decir "Este enlace fue desactivado. Pedile
  uno nuevo a AK Producciones". El botón (`:859`, `handleApagarEnlace` `:618`) muestra el estado ("Enlace activo"/"Enlace apagado")
  y alterna.

## Bloque 5 — Observaciones que sí se arreglan

- **O1/O4:** Agenda del CRM (`src/app/(app)/contabilidad/crm/agenda/page.tsx`, `ScheduleMeetingDialog.tsx`): fecha obligatoria,
  y botones Cancelar y Reprogramar como en la Agenda de la Secretaria. Una cita del simulador también aparece en la Agenda del CRM
  y mueve al prospecto a "Agendó entrevista".
- **O9:** `src/app/(app)/fiestas/nueva/itinerario/page.tsx:613`: después de guardar un momento, el indicador dice "Guardado"
  (pasarle `lastSaved` al terminar de guardar).
- **O10:** `src/app/(app)/customers/page.tsx:232`: "con eventos futuros o activos" mira la fecha de sus fiestas, no sólo `estadoCliente`.
- **O13:** `src/app/evento/social/[fiestaId]/page.tsx:1306`: con 0 canciones, "Todavía no hay canciones para votar".
- **O14:** `src/app/(app)/empresa/activos-fijos/page.tsx:96` y el borrado de menús: cartel de éxito y la lista se actualiza sola.
- **O5:** `src/app/recepcion/[fiestaId]/RecepcionClient.tsx:59`: al tocar un invitado, que se vea el cambio (llegó) o el motivo.

No se tocan: O2 (es diseño), O6, O7, O8, O12 (sin evidencia suficiente), O11 ya va en la orden 314.

## Qué tiene que comprobar la prueba

- `src/__tests__/la-hora-del-evento-no-se-inventa.test.ts`: sin `eventoHoraInicio` y con fecha "2026-12-19T03:00:00Z", el texto
  del contrato no contiene "03:00"; la cuenta regresiva da lo mismo en el portal del invitado y en el panel a las 23:30 de Uruguay.
- `tests/e2e/modificar-confirmacion-trae-lo-respondido.spec.ts`: un invitado confirmado entra a modificar y ve su nombre y su
  restricción ya marcados.
- `src/__tests__/crear-presupuesto-desde-prospecto-trae-el-telefono.test.ts`.

## Barrido en toda la app

Hecho por Claude el 17/11:
- **Pregunta 171 (margen de redondeo que deja pasar plata entera):** `MONEY_TOLERANCE` e `invoiceMoneyTolerance` en `src/lib` y
  `src/app/actions`: los controles de sobrepago de presupuestos y facturas (arreglados, en pesos sin margen).
- **Pregunta 172 (un estado de plata que se pone solo con cero cobrado):** `status: … 'Paid'` en `invoices.ts`: alta de factura
  y `estadoTrasElPago` (arreglados).
- **Pregunta 173 (precio de venta tomado como costo):** `costoTotalItem` usado como costo: `syncCostosFromBudget` → contado en
  `ganancia-evento.ts` (arreglado ahí, que es la única cuenta de ganancia).
- **Pregunta 174 (una hora sacada de una fecha guardada en Greenwich):** `extractTimeFromDate` en `presupuestos/[id]/recibo-contrato`
  y `presupuestos/[id]/ver` (bloque 1).
- **Pregunta 175 (un formulario de "modificar" que arranca vacío):** RSVP (bloque 2); la edición de fiestas, presupuestos y
  clientes ya carga lo guardado.

```comprobar
usa: diasHastaEnUruguay en src/lib/public-experience/event-date.ts
no-usa: tipoCelebracion: 'Boda' en src/lib/fiesta-defaults.ts
usa: leadPhone en src/components/crm/CrmLeadCard.tsx
usa: leadPhone en src/app/(app)/presupuestos/nuevo/crear/page.tsx
usa: fue desactivado en src/app/(app)/presupuestos/[id]/ver/page.tsx
usa: Todavía no hay canciones en src/app/evento/social/[fiestaId]/page.tsx
prueba: src/__tests__/la-hora-del-evento-no-se-inventa.test.ts
prueba: tests/e2e/modificar-confirmacion-trae-lo-respondido.spec.ts
prueba: src/__tests__/crear-presupuesto-desde-prospecto-trae-el-telefono.test.ts
archivo: docs/evidencias/permiso-firma-de-archivos.md
```
