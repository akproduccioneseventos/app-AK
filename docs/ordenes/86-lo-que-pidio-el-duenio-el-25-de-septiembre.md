# Orden 86 — Lo que pidió el dueño el 25 de septiembre de 2026

**Para Gemini. UNA SOLA PROPUESTA con todos los bloques, y adentro de la misma propuesta
también la orden 85 y la devolución 76b** (siguen abiertas). Si un bloque se traba, entregá el
resto en la misma propuesta y decí cuál faltó. Antes de decir "terminé", leé
`docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste, y **corré tus pruebas de navegador antes de
entregar**.

Arrancá de la versión principal **actualizada** (hoy entran tres propuestas de Claude).

---

## Bloque 1 — El asistente del invitado, en la pantalla del invitado

**Qué pasa:** `chatConAsistenteInvitado` (`src/app/actions/asistente-virtual.ts` ~línea 246)
está hecho y probado, pero **ninguna pantalla lo usa**. Firma:
`chatConAsistenteInvitado(fiestaId, history: MessageData[], newMessage, invitadoNombre?, mesaAsignada?)`
→ `AssistantResponse`.

**Qué se pide:** un componente nuevo `src/components/invitacion/AsistenteDelInvitado.tsx`
(`'use client'`): un botón flotante "¿Tenés una duda?" que abre un chat chico. Llama a
`chatConAsistenteInvitado` con el `fiestaId`, el nombre del invitado y su mesa. Montarlo en
`src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx`. Podés copiar la forma visual de
`src/components/public/AsistenteVirtual.tsx`, **pero no lo reutilices**: ese llama a
`chatWithVirtualAssistant`, que es el de ventas.

**No tocar:** `src/app/actions/asistente-virtual.ts` (su aislamiento lo cuida
`src/__tests__/asistente-aislamiento-fiestas-y-seguridad.test.ts`).

## Bloque 2 — Sacar el karaoke de la página pública

El dueño decidió que **no hay karaoke**. La página lo promete: objeto `id: 'karaoke'` en
`src/components/public/InteractiveTechShowcase.tsx` (~líneas 164-179), con el botón "Quiero
Karaoke en mi fiesta". Sacar ese objeto entero, y cualquier otra mención en `src/types/galeria.ts`
que lo ofrezca. Nada más de esa vidriera se toca.

## Bloque 3 — Mails: al equipo solos, a los clientes preparados y a un toque

La app **ya manda mails** con la cuenta de Google conectada: `sendGoogleGmailMessage(account, to,
subject, html)` en `src/lib/google-workspace.ts` (~línea 625), usada por
`src/app/actions/google-workspace.ts` (~líneas 373, 543, 566). Regla del dueño: **a un cliente
no le sale nada solo**; se prepara y lo manda una persona con un toque.

1. En la bandeja de salida (`src/app/(app)/contabilidad/crm/outbox/page.tsx`, mensajes de
   `src/app/actions/scheduled-messages.ts`, tipo `ScheduledMessage` en
   `src/types/whatsapp-automation.ts` ~línea 44) agregar el canal **mail**: campo opcional
   `targetEmail` y `subject`. Un mensaje con mail muestra el botón **"Enviar por mail"**, que llama
   a una acción nueva con `requireAppSession()` que usa `sendGoogleGmailMessage` y después
   `markMessageAsSent`. Si no hay cuenta de Google conectada, el botón lo dice ("Conectá Google en
   Ajustes") en vez de fallar callado.
2. **No** mandar solo ningún mail a clientes. Los avisos internos al equipo ya existen como
   notificaciones: no hace falta agregar mails internos.

## Bloque 4 — Responder reseñas de Google, con aprobación de un toque

Hoy sólo se **publica** en Google Business (`src/lib/social-media/google-business-publisher.ts`),
no se leen reseñas. Agregar:

1. `src/lib/social-media/google-business-resenas.ts`: leer reseñas
   (`GET https://mybusiness.googleapis.com/v4/{accountLocationId}/reviews`, con el mismo acceso
   que usa el publicador) y publicar una respuesta (`PUT .../reviews/{reviewId}/reply`).
2. Una pantalla **"Reseñas de Google"** en Empresa: cada reseña sin responder trae un borrador
   escrito por la inteligencia artificial (amable, en criollo, sin prometer plazos ni precios:
   decisión del dueño del 27 de agosto), y un botón **"Publicar respuesta"**. Nada se publica
   solo.
3. Si Google no da acceso a las reseñas con la cuenta conectada, la pantalla lo dice en criollo.

## Bloque 5 — Turnos del personal propuestos solos

La asignación vive en `personalAsignado` (`src/types/fiesta.ts` ~línea 1506, tipo
`PersonalAsignadoDetalleStorage` ~línea 175) y se guarda con `updatePersonal`
(`src/app/actions/fiesta/personal.actions.ts`, pide `PERMISOS.SUELDOS`). La disponibilidad por
fecha ya se calcula con `readActiveFiestasForStaffAgenda` (`src/lib/staff-agenda-data.ts`).

En la pantalla de personal de la fiesta (`src/app/(app)/fiestas/nueva/personal/page.tsx`), un
botón **"Proponer equipo"** que arma una propuesta: para cada rol que la fiesta necesita, el
empleado de ese rol que **no está en otra fiesta ese día**, repartiendo para no cargar siempre al
mismo. La propuesta se ve y **se guarda con un toque** usando `updatePersonal` tal como está.

**No tocar:** `personal.actions.ts` ni cómo se calcula el sueldo del evento (`eventSalary`): es
plata, de Claude. La propuesta usa el sueldo que ya trae el rol.

## Bloque 6 — Caricatura con inteligencia artificial en la fotocabina

Agregar un tema `caricatura` en `src/app/actions/touchpix-ai.ts`: al tipo `TouchpixThemeId`
(~líneas 28-35) y a `THEME_DEFINITIONS` (~líneas 44-92), con la misma forma que `disco_glam`
(`label`, `promptDescription`, `cssFallbackHint`). Y en la lista de la pantalla
`TOUCHPIX_THEMES` (`src/app/evento/touchpix/[fiestaId]/page.tsx` ~línea 61):
`{ id: 'caricatura', label: 'Caricatura', emoji: '🎨', ... }`. El pedido a la IA: caricatura
divertida y amable, rasgos exagerados con cariño, **nunca burlona**, fondo de fiesta.

## Bloque 7 — Firma del contrato en el portal: sólo una constancia, el papel es obligatorio

**Decisión del dueño (25 de septiembre):** *las dos firmas, papel obligatorio.* El cliente firma
en su portal para dejar constancia, pero **la reserva se confirma únicamente subiendo el contrato
firmado en papel** (`uploadPhysicalContract`, como hoy). **No hay botón de "Confirmar reserva"
por la firma digital**: no existe y no se agrega.

Claude ya hizo el servidor: `signContractDigitally` (`src/app/actions/fiesta/documentos.actions.ts`)
guarda la constancia en `fiesta.firmaDigitalConstancia` (`{ signedAt, signedBy, ip?, textoHuella,
planPagosAceptado }`, tipo `FirmaDigitalConstancia` en `src/types/fiesta.ts`), **no** en
`contratoFirmaInfo`. El portal recibe la constancia sin la IP.

1. **Portal del cliente** (`src/app/portal/[fiestaId]/contrato/page.tsx` ~línea 85): hoy el
   nombre del que firma se adivina del nombre del evento. Agregar un campo obligatorio **"Tu
   nombre completo"** y mandarlo en `signContractDigitally`. Con `fiesta.firmaDigitalConstancia`
   y sin `contratoFirmaInfo?.isSigned`, el cartel verde dice **"Firmaste el contrato el {fecha}.
   Para confirmar tu reserva falta firmar el contrato en papel con AK."** (hoy dice "Firmado y
   Validado ... desde la IP", y la IP no llega: sacar esa parte).
2. **Pantalla del equipo** (`src/app/(app)/fiestas/nueva/gestion-documental/contrato-servicio/page.tsx`
   ~línea 344): si hay `fiesta.firmaDigitalConstancia` y el contrato en papel todavía no se subió,
   mostrar **"{signedBy} firmó en el portal el {fecha}. Falta el contrato firmado en papel."**,
   junto al botón de subir el contrato en papel que ya existe.

**No tocar:** `signContractDigitally`, `uploadPhysicalContract`, `public-fiesta.ts`. Son de Claude.

## Bloque 8 — El resumen del mes para el contador, a un toque

Claude ya hizo el armado: `armarResumenParaElContador(datos, nombreDelMes)` y `mesAnteriorA(hoy)`
en `src/lib/contabilidad/resumen-para-el-contador.ts` (asunto, texto y archivo para planilla), y
el parte de la mañana avisa los primeros cinco días del mes con enlace a
`/empresa/contabilidad/reportes?mes=AAAA-MM`.

1. En Ajustes de la empresa, un campo **"Mail del contador"**: `emailContador?: string` en el tipo
   de la empresa (`src/types/settings.ts`, junto a `googleReviewsLink` ~línea 151).
2. En `src/app/(app)/empresa/contabilidad/reportes/page.tsx`: si viene `?mes=AAAA-MM`, arrancar
   con ese mes elegido. Un botón **"Mandar al contador"** que arma el resumen con los datos que la
   pantalla ya tiene (`getProfitAndLossData`) y lo manda por mail al contador con el archivo
   adjunto, usando la acción de mail del bloque 3. Otro botón **"Bajar planilla"** que baja el
   archivo `.csv`. Sin mail del contador cargado, el botón lo dice.

**No tocar:** `src/lib/contabilidad/resumen-para-el-contador.ts` ni `getProfitAndLossData`: plata,
de Claude.

## Bloque 9 — Pasar al presupuesto los cobros de factura que quedaron a medias

Claude hizo `pasarCobrosPendientesAlPresupuesto()` en `src/app/actions/invoices.ts` (pide permiso
de contabilidad, no duplica). El parte de la mañana avisa con enlace a
`/invoices?conciliar=1`. En esa pantalla, si viene `conciliar=1`, mostrar
arriba un cartel "Hay cobros de factura que no llegaron al presupuesto" con el botón **"Pasar
ahora"** que llama a esa acción y muestra cuántos pasó. **No tocar la acción:** es plata.

---

## Qué NO se toca, en general

Plata, cobros, facturas, comida, permisos y `src/lib/firebase-sync.ts`,
`src/lib/marca-de-lectura.ts`, `src/lib/data-service.ts`. Si algo de eso te traba, listalo en la
propuesta y se lo pasás a Claude.

## Qué tiene que comprobar cada prueba (resultado, no ingrediente)

- **B1:** prueba de navegador: abrir la invitación del invitado, preguntar "¿a qué hora es?" y ver
  en pantalla la hora de la fiesta de prueba.
- **B2:** Jest: el archivo de la vidriera no contiene `karaoke`.
- **B3:** Jest: la acción de enviar por mail sin sesión del equipo **no manda nada**; con sesión y
  sin cuenta de Google, devuelve el aviso; con cuenta (simulada), llama a `sendGoogleGmailMessage`
  una vez y marca el mensaje como enviado.
- **B4:** Jest: una reseña sin responder trae un borrador y **no se publica** hasta que se llama a
  la acción de publicar.
- **B5:** Jest: con dos fiestas el mismo día, la propuesta **no pone al mismo empleado en las dos**.
- **B6:** Jest: `caricatura` existe en `THEME_DEFINITIONS` y en `TOUCHPIX_THEMES`.
- **B7:** prueba de navegador: con una constancia de firma y sin contrato en papel, la pantalla
  del equipo muestra "Falta el contrato firmado en papel"; y no aparece ningún botón que
  confirme la reserva sin el papel.
- **B8:** Jest: sin mail del contador, "Mandar al contador" no manda nada y avisa; con mail, manda
  un mail con el asunto del mes y el archivo adjunto.

Cada prueba **se rompe a propósito antes de entregar** y tiene que ponerse en rojo.

```comprobar
archivo: src/components/invitacion/AsistenteDelInvitado.tsx
usa: AsistenteDelInvitado en src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx
no-usa: Quiero Karaoke en mi fiesta en src/components/public/InteractiveTechShowcase.tsx
usa: sendGoogleGmailMessage en src/app/actions/scheduled-messages.ts
archivo: src/lib/social-media/google-business-resenas.ts
usa: caricatura en src/app/actions/touchpix-ai.ts
usa: firmaDigitalConstancia en src/app/(app)/fiestas/nueva/gestion-documental/contrato-servicio/page.tsx
usa: armarResumenParaElContador en src/app/(app)/empresa/contabilidad/reportes/page.tsx
usa: pasarCobrosPendientesAlPresupuesto en src/app/(app)/invoices/page.tsx
```
