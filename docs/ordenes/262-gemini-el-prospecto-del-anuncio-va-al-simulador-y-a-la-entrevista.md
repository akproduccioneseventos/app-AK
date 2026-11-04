# Orden 262 — Al que llega por un anuncio, el bot lo lleva al simulador y a reservar la entrevista (02/11/2026)

**Para Gemini.** Rama nueva desde `main` actualizada: `gemini/orden-262-anuncio-al-simulador`. **Una sola entrega, no
fusiones.** Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md`.

**Decisión del dueño (02/11/2026):** *"la idea es que la gente haga presupuesto y que reserve una entrevista; ese es el
objetivo"*.

Hoy, cuando alguien llega por un anuncio y ya dio los datos, **el bot no le contesta nada**. Desde la orden 255 sólo deja un
borrador en la bandeja. **Eso enfría al interesado.**

## Lo que ya existe (no se rehace)

- `atenderProspectoAnuncioWhatsApp` (`src/lib/asistente/por-whatsapp.ts:~126`): saca fecha, invitados, salón y tipo, y
  prepara el borrador con fotos (`prepararBorradorProspectoAnuncio`). **El borrador queda como está**, en la bandeja.
- Webhook: `src/app/api/whatsapp/webhook/route.ts:~214-225`. Con `atencionAnuncio.completo` devuelve sin contestar.
- El simulador (`src/app/simulador-de-presupuesto/page.tsx:~290-325`) lee de la dirección:
  - `guests`, la cantidad;
  - `tipo`, que acepta "15", "boda", "infantil", "empresa" y lo demás como cumpleaños;
  - `mes`, con forma `AAAA-MM`;
  - `salon=club`, sólo para Club Uruguay;
  - `entry`.

  **Ya termina ofreciendo la entrevista gratuita** ("Coordinar mi entrevista gratuita", ~1720-1731).
- El envío por WhatsApp: `sendMetaWhatsAppMessage` (`src/lib/whatsapp/meta-sender.ts:22`). Las claves se toman igual que
  en `enviarRespuestaWhatsApp` de `por-whatsapp.ts`.

**No se toca:**

- el freno `correspondeContestarSolo`: sólo se contesta a quien viene de un anuncio o publicación;
- el borrador con fotos en la bandeja;
- la charla común (`processIncomingMessage`).

## Bloque 1 — con los datos completos, el bot contesta solo con el enlace

En el webhook, cuando `atencionAnuncio.completo` es verdadero, **antes de devolver** se manda por WhatsApp un mensaje al
prospecto. Este texto exacto, con los datos reemplazados:

> ¡Gracias! Con lo que nos contaste ya podés ver tu presupuesto en el momento: {enlace}
> Al final vas a poder reservar una entrevista gratuita y sin compromiso con nosotros para ver todos los detalles.

**El enlace:** `https://akproducciones.uy/simulador-de-presupuesto?`, con:

- `guests` = invitados;
- `tipo` = tipo de fiesta;
- `mes` = AAAA-MM de la fecha, si se pudo leer;
- `salon=club` **sólo** si el salón es Club Uruguay;
- `entry=whatsapp_anuncio`.

Armalo con una función `enlaceAlSimuladorDelProspecto(datos)` en `por-whatsapp.ts`, para poder probarla.

**Lo que el mensaje NO dice:**

- precios;
- plazos de respuesta;
- "garantía";
- "congelar".

**Si el envío falla**, el borrador queda igual y se agrega una propuesta en la bandeja, "Contestar al prospecto: no salió
el mensaje automático", **sin repetir el envío**.

**No se manda dos veces** al mismo número por el mismo pedido: usá `messageId` como identificador. Un reintento de Meta no
repite el mensaje.

## Bloque 2 — con datos incompletos, también contesta

Hoy `atenderProspectoAnuncioWhatsApp` arma `respuestaTexto` pidiendo lo que falta, pero **nadie lo manda**. Que el webhook
lo envíe igual que en el bloque 1, y siga con `processIncomingMessage` sólo si no hubo respuesta del anuncio.

## Bloque 3 — los mensajes que preparan los agentes no pisan la bandeja

`src/lib/agentes/motor-agentes.ts:~495` hace `writeData('scheduled-messages.json', [...scheduledMessages, ...nuevos])`.
Lee la bandeja, le suma y la guarda **entera**. Si en el medio alguien agrega o borra un mensaje, eso se pierde.

Cambialo por un guardado con turno:

- `mutateGenericJsonArray` (`src/lib/generic-json-store.ts`), agregando sólo los nuevos;
- sin duplicar por `idEstable`.

**Prueba:** dos guardados a la vez, con una base de mentira que devuelve **copias**, conservan los mensajes de los dos.

## Bloque 4 — el Centro de control usa el mismo resumen del negocio

`darOrdenPorVozOTexto` (`src/app/actions/centro-de-control.ts:~441`) contesta sin el resumen del negocio que usan WhatsApp
y la voz. Pasale `armarContextoDelNegocio(usuario, …)` (`src/lib/multiagent/contexto-negocio.ts`), recortado por perfil,
igual que en `por-whatsapp.ts:~217`.

**Prueba:** una pregunta desde el Centro de control sobre "¿cuántas fiestas tengo este mes?" recibe el contexto con las
fiestas; para un perfil sin plata, el contexto **no** trae importes.

## Pruebas

**Jest**, en `src/__tests__/el-prospecto-del-anuncio-va-al-simulador.test.ts`, con Meta simulado. Tiene que comprobar:

- (a) "15 años, 120 invitados, marzo 2027, Club Uruguay": se manda **un** mensaje y el enlace tiene `guests=120`,
  `tipo=15`, `mes=2027-03`, `salon=club` y `entry=whatsapp_anuncio`.
- (b) El mismo `messageId` dos veces: un solo envío.
- (c) Falta el salón: se manda la pregunta de lo que falta y no el enlace.
- (d) Un número que no viene de un anuncio: **no** se manda nada.
- (e) Si Meta falla, queda la propuesta "Contestar al prospecto" y el borrador sigue.
- (f) Ningún mensaje contiene "$", "garant" ni "congel".

Rompé (a) a propósito y fijate que se ponga en rojo.

Corré `npx tsc --noEmit`, `npx jest --silent` y `npm run check:acentos`, y pegá las últimas líneas. No subas `data/` ni
`src/data/`.

```comprobar
no-usa: writeData('scheduled-messages.json' en src/lib/agentes/motor-agentes.ts
usa: armarContextoDelNegocio en src/app/actions/centro-de-control.ts
usa: enlaceAlSimuladorDelProspecto en src/app/api/whatsapp/webhook/route.ts
usa: sendMetaWhatsAppMessage en src/app/api/whatsapp/webhook/route.ts
prueba: src/__tests__/el-prospecto-del-anuncio-va-al-simulador.test.ts
```
