# Orden 325 — Todos los mensajes de prospectos al CRM, con la IA adentro (19/11/2026)

**Pedido del dueño:** *"todos los mensajes de redes sociales, inclusive WhatsApp, deberían llegar al CRM… el sistema debería
poder diferenciar porque ese WhatsApp también es mi número personal… por lo menos la gente que hace el simulador y las personas
que entran por anuncios sí… el CRM está alejado de la inteligencia artificial y del módulo de redes sociales"*.

**Cómo se entrega:** en la **misma propuesta que las órdenes 322 a 324**, sobre `claude/juntar-1443`, al final. Antes de
decir "terminé": `docs/ANTES-DE-ENTREGAR.md`. **Esto toca quién ve qué (mensajes de personas): lo revisa Claude línea por
línea.**

## Cómo está hoy (investigado por Claude el 19/11)

- **WhatsApp** (`src/app/api/whatsapp/webhook/route.ts`): contesta solo **sólo** si el mensaje viene de un anuncio
  (`correspondeContestarSolo`, `src/lib/whatsapp/vino-de-la-publicidad.ts:104`). Con el anuncio, arma un presupuesto
  borrador (`atenderProspectoAnuncioWhatsApp`, `src/lib/asistente/por-whatsapp.ts`), **pero no crea el prospecto en el CRM**.
  El resto de los mensajes se ignora (línea ~209), y así tiene que seguir para lo personal.
- **Simulador:** `captureSimulatorLeadProgress` (`src/app/actions/armado-rapido.ts:157`) crea el prospecto con su teléfono
  (`upsertPublicCommercialLead`, `src/lib/crm/public-lead-persistence.ts:213`). **Si después escribe por WhatsApp, ese mensaje
  se ignora**: no se lo reconoce.
- **Instagram y Facebook** (`src/app/api/meta/webhook/route.ts`): los mensajes directos se guardan en
  `social-mensajes-directos.json` y se ven en la **bandeja única** de Presencia digital (`src/lib/mensajes/bandeja-unica.ts`,
  `leerBandejaUnica`), **sin llegar al CRM**.
- **El prospecto** (`CrmLead`, `src/types/crm.ts`) tiene `phone`, `timeline` (`CrmTimelineItem`), `acquisition`,
  `leadTemperature` y `nextAction`, y **no tiene conversación**. `crm-leads.json` es colección (`prospectos` en
  `FILE_TO_COLLECTION`, `src/lib/firebase-sync.ts:22`): se guarda **de a un registro** (`mutateDataItem`), nunca la lista
  entera.

## Bloque 1 — Quién entra al CRM por WhatsApp (las tres puertas) y quién no

Función nueva `esProspectoDeWhatsApp(telefono, referencia, texto)` en `src/lib/whatsapp/quien-es-prospecto.ts`. Devuelve el
motivo, o `null`:

1. **Viene de un anuncio:** `esOrigenDePublicidad(referencia)` o una charla de anuncio vigente (lo que ya hace
   `correspondeContestarSolo`).
2. **Ya es prospecto:** su número normalizado (`normalizeUruguayPhone`) coincide con el `phone` de un prospecto del CRM
   (hizo el simulador o dejó sus datos en la web). **Si coincide con más de uno, no se elige ninguno**: se anota en el más
   reciente y se avisa (pregunta 71, elegir por coincidencia parcial).
3. **Escribe desde un botón de la web o del simulador:** esos botones arman el texto con una marca corta al final, por
   ejemplo `(ref AK-7Q2F)`. Buscá dónde se arman (`buildWhatsAppLink`, `src/lib/commercial/contact.ts`) y sumá la marca con el
   id del prospecto o de la página. Si el mensaje la trae, es prospecto.

**Nunca entra, y ni siquiera se guarda:**

- Cualquier número que no pase por una de las tres puertas: familia, amigos, proveedores y clientes agendados.
- Un número que ya es **cliente con fiesta** (está en una fiesta como cliente): su charla es del portal, no del CRM.
- Los números que el dueño marque en **Ajustes → WhatsApp → "Números personales"** (lista que se carga a mano, por si
  alguien conocido hace el simulador). Ganan sobre las tres puertas.

Interruptor en Ajustes: **"Llevar al CRM los WhatsApp de prospectos"**, apagado de entrada. Con él apagado, todo funciona
como hoy.

## Bloque 2 — La conversación vive en el prospecto, de todos los canales

- Campo nuevo `conversacion?: CrmMensaje[]` en `CrmLead` (`src/types/crm.ts`): `{ id, canal: 'whatsapp' | 'instagram' |
  'facebook' | 'web' | 'simulador', direccion: 'entra' | 'sale', texto, fecha, idExterno }`. `idExterno` es el id del
  mensaje de Meta, para no guardarlo dos veces si Meta lo reenvía.
- **WhatsApp:** en el webhook, si `esProspectoDeWhatsApp` dice que sí, se crea o se completa el prospecto
  (`upsertPublicCommercialLead`) y se suma el mensaje a su conversación. Lo que el bot contesta también se suma, como
  `sale`. **Esto va antes de contestar y no cambia cuándo se contesta solo**: el bot sigue contestando sólo a quien viene de un
  anuncio.
- **Instagram y Facebook:** cada mensaje directo nuevo crea o completa el prospecto por el usuario de la red y se suma a la
  conversación (son cuentas de la empresa: no hay nada personal). Los comentarios en publicaciones, sólo si preguntan algo
  (precio, fecha, "info"), que ya clasifica `src/lib/social-media/clasificador-comentarios.ts`.
- **Simulador:** cada paso importante (empezó, eligió paquete, generó el presupuesto) va a la conversación como `simulador`.
- **Una sola fuente:** la bandeja única de Presencia digital lee de la misma conversación: el mensaje no se guarda dos veces.
- En la ficha del prospecto (`src/components/crm/CrmLeadTimeline.tsx` o una pestaña al lado), **"Conversación"**: todos los
  mensajes en orden, con el ícono del canal.

## Bloque 3 — La IA trabaja en el CRM

Con Gemini 4 Hydrogen (`geminiCommercialModel`, `src/ai/genkit.ts`), que pasa solo al modelo gratis si se termina el cupo:

- **Con cada mensaje nuevo que entra:** resumen de una línea de la charla, `leadTemperature` (frío, tibio, caliente),
  `nextAction` en criollo, y completar los datos que dijo y faltan (fecha, invitados, tipo de fiesta, salón), **sin pisar lo
  que el equipo ya cargó**.
- **Respuesta preparada:** un borrador de contestación al lado de la conversación, con el botón "Abrir en WhatsApp" con el
  texto listo. **No se manda sola**: la manda una persona (regla del dueño, "preparar sí, mandar no"). Las únicas que siguen
  saliendo solas son las que ya salían: el bot del anuncio y el recontacto con su interruptor.
- **Nada de precios ni promesas inventadas:** si pregunta precio, el borrador lleva al simulador o dice el precio de la lista
  (decisión del 14/11), nunca un rango.
- Todo pasa por `reservarConsumoIA` (`src/lib/ai/consumo-servidor.ts:133`).

## Bloque 4 — El asistente contesta solo a los prospectos, dice que es un asistente y ofrece una persona

**Decisión del dueño (19/11/2026):** *"que la inteligencia artificial conteste el WhatsApp automáticamente, preguntando al
cliente si quiere que lo siga atendiendo el robot o una persona… ver fecha, pasar el simulador, eso se podría hacer
automático"*. **Cambia la regla de "preparar sí, mandar no" sólo para los prospectos de las tres puertas del bloque 1.** Para
todos los demás (personal, clientes con fiesta, la lista de números personales) no cambia nada: no se contesta. El dueño lo
repitió: *"siempre diferenciando los mensajes de anuncios de los personales; los demás no"*.

- **Primer mensaje, siempre igual de claro:** *"¡Hola! Soy el asistente virtual de AK Producciones 🤖. Te puedo decir si tu
  fecha está libre y armarte el presupuesto en el momento. ¿Seguimos así, o preferís que te escriba una persona del equipo?"*
  Con dos botones de respuesta rápida de WhatsApp: **"Seguí vos"** y **"Quiero una persona"**.
- **"Quiero una persona"** (o escribe "persona", "humano", "alguien", "hablar con…"): el asistente contesta *"¡Listo! Le aviso
  al equipo y te escriben por acá"*, **se calla en esa charla** (campo `atiende: 'persona'` en el prospecto) y al dueño le
  llega el aviso con la conversación. Desde la ficha del prospecto, un botón **"Devolverle la charla al asistente"**.
- **"Seguí vos":** el asistente (archivo nuevo `src/lib/whatsapp/asistente-de-prospectos.ts`), con Gemini 4 Hydrogen:
  - **Fecha:** si la dice, la mira con `checkDateAvailability` (`src/app/actions/simulador-v2.ts:81`). Si no se pudo leer el
    calendario, **no dice "libre"**: dice que la confirma una persona y avisa al equipo.
  - **Presupuesto:** manda el enlace al simulador con lo que ya contó (`enlaceAlSimuladorDelProspecto`, que ya usa el webhook).
  - **Preguntas:** contesta con lo que dice la app (catálogo, servicios, salones). Precio: el de la lista, o el simulador;
    **nunca** un rango inventado, ni descuentos, ni promesas, ni "garantía" (reglas del dueño).
  - **Se pasa solo a una persona** cuando: es una queja, pide reservar o pagar, pregunta algo que la app no sabe, o se
    enoja. Ahí hace lo mismo que con "Quiero una persona".
- **Nunca, aunque el prospecto lo pida:** reservar la fecha, tomar una seña, dar un presupuesto por aceptado, cobrar ni
  cambiar un precio. Eso lo hace una persona.
- **Horario:** contesta a toda hora, y si el pedido de persona llega de noche, avisa *"te escriben mañana por la mañana"*
  (sin prometer una hora).
- Interruptor propio en Ajustes: **"El asistente contesta a los prospectos"**, apagado de entrada; con el del bloque 1
  apagado, tampoco anda este.
- Cada mensaje que manda el asistente queda en la conversación del prospecto como `sale` y marcado como del asistente.

## Bloque 5 — El mismo asistente en la web, Instagram y Messenger, y al final a WhatsApp

**Pedido del dueño (19/11/2026):** *"que en Messenger, en la página web y en Instagram conteste todo automático y a lo último
redirija al WhatsApp, porque yo solamente contesto el WhatsApp… siempre que el usuario elija si quiere un humano o un robot,
porque a veces a la gente el robot le cae mal"*.

- **Un solo cerebro para los cuatro canales:** lo que contesta vive en `src/lib/whatsapp/asistente-de-prospectos.ts` (bloque
  4) y lo usan:
  - el chat de la web (`AsistenteVirtual`, `src/components/public/AsistenteVirtual.tsx`, que hoy llama a
    `chatWithVirtualAssistant`, `src/app/actions/asistente-virtual.ts`);
  - los mensajes directos de Instagram y Messenger (`evaluarRespuestaAutomatica`, `src/lib/mensajes/bandeja-unica.ts:201`);
  - WhatsApp (bloque 4).

  Mismas reglas en los cuatro: dice que es un asistente, mira la fecha, manda el simulador, precio de la lista y nunca reserva
  ni cobra. **No se escriben cuatro asistentes distintos.**
- **La elección, al principio y en cualquier momento:** el primer mensaje ofrece **"Seguí vos"** o **"Quiero una persona"**
  (botones en la web, respuestas rápidas en Instagram y Messenger). Escribir "persona", "humano" o algo parecido en
  cualquier momento hace lo mismo.
- **"Quiero una persona" fuera de WhatsApp = pasar a WhatsApp con todo listo:** el asistente contesta *"¡Dale! Te escribe una
  persona del equipo por WhatsApp: tocá acá"* con el enlace de WhatsApp (`buildWhatsAppLink`) y un texto ya escrito que lleva
  **lo que contó** (fecha, invitados, tipo de fiesta) y la marca `(ref AK-…)` del bloque 1. Así entra al CRM por la puerta 3
  y el dueño no le vuelve a preguntar lo mismo.
- **Al terminar con el asistente**, cuando ya tiene presupuesto o fecha, también lo invita a seguir por WhatsApp con el mismo
  enlace armado.
- **Comentarios públicos en publicaciones:** el asistente **nunca** dice precios ni fechas en público. Contesta *"¡Te
  escribimos por privado!"* y sigue por mensaje directo (eso ya lo hace `evaluarRespuestaAutomatica` con sus interruptores:
  no se cambia).
- Interruptor por canal en Ajustes (web, Instagram, Messenger, WhatsApp), apagados de entrada. Los de Instagram y Messenger
  que ya existen se reusan.

## Qué NO tocar

- La regla del número personal: **lo que no pasa por una de las tres puertas no se guarda ni se contesta**.
- El recontacto con su interruptor. El bot del anuncio pasa a ser el asistente del bloque 4.
- Los cobros, la seña y cerrar un presupuesto: siguen siendo de una persona.

## Qué tiene que comprobar la prueba

- Un mensaje de WhatsApp **sin** anuncio, **sin** prospecto y **sin** marca: **no** aparece en ningún archivo ni en el CRM.
- El mismo número después de hacer el simulador: el mensaje aparece en la conversación de **ese** prospecto.
- Un número de la lista "Números personales" que hizo el simulador: **no** entra.
- Un número que es cliente con fiesta: **no** entra al CRM.
- El mismo mensaje reenviado por Meta dos veces: queda **una** vez.
- Un mensaje directo de Instagram crea el prospecto con su conversación, y la bandeja única lo muestra una sola vez.
- La IA (simulada) completa la fecha que faltaba y **no pisa** los invitados que ya cargó el equipo; el borrador **no se
  envía**.
- Con el interruptor apagado, todo igual que hoy.
- **Bloque 4:** el primer mensaje dice "asistente virtual" y ofrece una persona; con "Quiero una persona" el asistente **no
  vuelve a contestar** en esa charla; con la fecha ocupada dice que está ocupada; con el calendario sin leer **no** dice
  "libre"; si pide reservar o pagar, pasa a persona y **no** cambia nada del presupuesto ni de la seña. Un número personal
  que escribe no recibe **ninguna** respuesta.
- **Bloque 5:** el chat de la web y un mensaje de Instagram (simulado) reciben la misma primera respuesta que WhatsApp; con
  "Quiero una persona" reciben el enlace de WhatsApp con la fecha y los invitados que contaron **y** la marca `ref AK-`;
  un comentario público que pregunta el precio **no** recibe un precio.

```comprobar
archivo: src/lib/whatsapp/quien-es-prospecto.ts
usa: esProspectoDeWhatsApp en src/app/api/whatsapp/webhook/route.ts
usa: conversacion en src/types/crm.ts
usa: conversacion en src/app/api/meta/webhook/route.ts
usa: conversacion en src/lib/mensajes/bandeja-unica.ts
usa: ref AK- en src/lib/commercial/contact.ts
archivo: src/lib/whatsapp/asistente-de-prospectos.ts
usa: checkDateAvailability en src/lib/whatsapp/asistente-de-prospectos.ts
usa: Quiero una persona en src/app/api/whatsapp/webhook/route.ts
usa: asistente-de-prospectos en src/app/actions/asistente-virtual.ts
usa: asistente-de-prospectos en src/lib/mensajes/bandeja-unica.ts
```
