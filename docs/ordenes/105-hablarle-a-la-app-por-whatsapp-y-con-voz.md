# 105 — Hablarle a la app por WhatsApp, con audios y voz real, y lo mejor de los agentes del momento

**Para:** Gemini.
**Escrita por:** Claude, el 1 de octubre de 2026. Pedido del dueño: *"hacé todo en una PR para
Gemini; me gusta poder mandarle audios o llamar también, y que me conteste; quiero voces reales;
ojo, lo que haga automáticamente tiene que cuidar la plata y otras cosas delicadas"*.

Sale de comparar Gemini Spark (Google), Dots (ChatGPT), Muse (Meta), Perplexity, Zapia y el agente de
negocios de Meta en WhatsApp. Lo que ya está pedido en las órdenes 101 y 102 **no se repite acá**.

## Cómo se entrega

- **UNA SOLA PROPUESTA con las órdenes 104, 101, 102, 105 y 106**, en ese orden (primero los
  arreglos de la 104). Arrancá de la rama **`claude/ponte-al-dia-qtrho3`** (tiene estas órdenes y la
  versión principal de hoy). Si un bloque se traba, entregá el resto y avisá cuál.
- `npm run "publicar?"` completo y la última pantalla pegada en la propuesta.
- Pasá por `docs/ANTES-DE-ENTREGAR.md`. Anotá cada bloque en `docs/YA-RESUELTO.md` con su línea en
  `comprobar`.
- **Nada de esto puede aumentar lo que se paga por mes.** Gemini (transcribir, entender, hablar) se
  paga por uso con la clave que ya está: cada llamada pasa por `registrarConsumoIA` y respeta el tope
  mensual (`hayPresupuestoParaIA`, `src/lib/ai/consumo-servidor.ts`). Lo que necesite un servicio con
  abono (bloque 8) **se deja preparado y apagado**, y se le pregunta al dueño.

---

## Bloque 0 — LA REGLA DE ORO: qué hace solo y qué no (se programa primero)

Todo lo que llega por WhatsApp, audio, mail reenviado o voz termina en **una de tres puertas**, en
`src/lib/asistente/que-puede-hacer-solo.ts`, función pura `nivelDeRiesgo(accion): 'solo' | 'pregunta' | 'nunca'`:

| Nivel | Qué entra | Qué pasa |
|---|---|---|
| `solo` | Crear o completar una tarea propia, anotar una nota o un recordatorio, consultar ("¿cuánto me deben?", "¿qué tengo mañana?"), preparar un borrador | Lo hace y contesta qué hizo, con **"Deshacer"** por 24 horas |
| `pregunta` | **Todo lo que toca plata** (cargar un gasto, cambiar invitados o servicios de una fiesta —cambia el precio—, montos, cuotas), cambiar fechas, agendar con el cliente, preparar mensajes a clientes, prospectos o proveedores | Queda como **propuesta** en la bandeja "Tu asistente" (orden 102, bloque 1). **Se confirma sólo adentro de la app, con sesión**, nunca contestando "sí" por WhatsApp |
| `nunca` | Cobrar, marcar como pagado, emitir o anular facturas, aceptar o cerrar un presupuesto, borrar fiestas o clientes, tocar permisos o quién ve qué, mandar solo un mensaje a un cliente o prospecto (salvo las excepciones ya elegidas por el dueño) | Contesta *"Eso lo tenés que hacer vos desde la app"* con el enlace a la pantalla |

- **`nunca` no se puede cambiar desde Ajustes.** Está en el código.
- **Lo que no esté en la lista es `pregunta`**, no `solo` (lista de permitidas: una acción nueva
  queda protegida sola).
- Todo queda en un registro (`asistente-acciones`, colección, de a un registro con `mutateDataItem`):
  qué se pidió, por qué canal, qué nivel, qué hizo.

**La prueba** (`src/__tests__/el-asistente-cuida-la-plata.test.ts`): cada acción de `nunca`
devuelve `nunca`; cargar un gasto y cambiar invitados dan `pregunta`; una acción inventada da
`pregunta`; y por WhatsApp un "sí" **no** confirma una propuesta de plata. Tiene que ponerse en rojo
si alguien pasa `marcar_pagado` a `solo`.

## Bloque 1 — Hablarle a la app por WhatsApp, con texto o audio

**Lo que ya existe:** los mensajes de WhatsApp entran por `src/app/api/whatsapp/webhook/route.ts`
(~l.95-150, formato Meta: `value.messages[0]`, `messageData.from`) y van a `processIncomingMessage`
(`src/app/actions/whatsapp.ts`). Hoy sólo se contesta a quien llega por un anuncio (decisión del
dueño, ver `CLAUDE.md`).

**Por dónde le habla el dueño (01/10/2026).** El dueño quiere usar **su propio chat consigo mismo**
("Mensaje a mí mismo") en su número 098 355 530 (`59898355530`). Programá **los dos caminos**, en este
orden:

1. **Su propio chat.** Si su número está conectado a la API en modo coexistencia (aplicación
   WhatsApp Business + API en el mismo número), Meta manda al webhook lo que él escribe desde la
   aplicación como evento `smb_message_echoes`. Atendé ese evento: si el mensaje es **de su número a
   su mismo número**, va a `atenderAlEquipo`, y la respuesta sale por la API **a ese mismo chat**.
   Que Meta mande o no el chat consigo mismo **no está documentado**: dejá un registro (sin el texto)
   de cada `smb_message_echoes` que llega, para comprobarlo con un mensaje de prueba.
2. **Respaldo: un número propio de la IA.** Si el paso 1 no llega, la IA usa otro número (un chip
   aparte) cargado en Ajustes (`whatsapp-config.json`, `phoneNumberId` y número visible), **nunca
   escrito en el código**. Sin ese número, Ajustes avisa "Falta el número de la IA".

Cualquier otro mensaje que llegue como `smb_message_echoes` (lo que el dueño le escribe a sus
clientes) **no se contesta ni se procesa**.

**Qué hacer:**

1. En Ajustes, **"Números que hablan con la app"** (el primero, `59898355530`): el número del dueño y los del equipo que él
   habilite, cada uno con su nombre y rol (`src/types/settings.ts`, guardado con la función de
   ajustes que ya existe). **Sólo esos números** usan el asistente; el resto sigue exactamente como
   hoy.
2. En el webhook, **antes** de lo de hoy: si `from` está en esa lista, va a una función nueva
   `atenderAlEquipo(...)` en `src/lib/asistente/por-whatsapp.ts`. No toques el camino de los
   prospectos.
3. **Audios:** si `messageData.type === 'audio'`, bajá el audio con la API de medios de Meta
   (`GET /{media-id}` y después la URL, con el token que ya usa `sendMetaWhatsAppMessage` en
   `src/lib/whatsapp/meta-sender.ts`) y pasáselo a Gemini para transcribir y entender en una sola
   llamada. **Fotos:** igual, con `messageData.type === 'image'` (bloque 4).
4. Lo que se entendió pasa por el **bloque 0** y por las acciones del asistente interno que ya
   existen (`src/app/actions/multiagent.ts`: tareas, invitados, incidentes, prospectos, etc., más
   las de la orden 101).
5. Contesta por el mismo WhatsApp: qué entendió y qué hizo, o "te lo dejé para confirmar en la app"
   con el enlace.

**La prueba** (`src/__tests__/whatsapp-del-equipo.test.ts`): un audio simulado de un número
habilitado que dice "anotá llamar al salón mañana" crea la tarea y contesta; el mismo texto desde un
número **no** habilitado no crea nada y sigue el camino de hoy; "marcá como pagada la cuota de Ana"
no marca nada y contesta que eso se hace en la app.

## Bloque 2 — Que conteste con voz real

- En Ajustes, **"Contestarme con voz"** (apagado por omisión) y **elegir la voz**: un selector con las
  voces en español de la voz de Gemini (texto a voz de Gemini, p. ej. `gemini-2.5-flash-preview-tts`
  o el modelo de voz vigente en la cuenta) y un botón **"Escuchar"** para probarla.
- Si está prendido y el pedido llegó por audio, la respuesta va **en audio** (y el texto abajo).
  Gemini devuelve el audio crudo: pasalo a MP3 en el servidor con una biblioteca en JavaScript (por
  ejemplo `lamejs`; **nada que necesite instalar programas en el servidor**), subilo con la API de
  medios de Meta y mandalo como mensaje de audio.
- Tope: respuestas de voz de hasta 60 segundos; si es más largo, va en texto.
- **Reemplazá también la voz robótica** del "Parte de la mañana"
  (`src/components/mi-dia/ParteDeLaMananaPlayer.tsx` ~l.14-30 usa `speechSynthesis` del navegador):
  que use la misma voz elegida, generada en el servidor y guardada para no pagarla dos veces.

**La prueba**: con la voz prendida, la respuesta a un audio lleva un adjunto de audio; con la voz
apagada, sólo texto; una respuesta de 3 minutos sale en texto.

## Bloque 3 — "Llamarla": conversación en vivo con voz, adentro de la app

Una llamada telefónica de verdad necesita un servicio que esté prendido todo el tiempo, y eso **se
paga por mes** (bloque 8). Lo que sí va ahora, por uso: **un botón "Hablar" en el asistente**
(`MultiAgentWidget`, `src/components/multiagent/multiagent-widget.tsx`) que abre una conversación de
voz **en vivo** con la API en vivo de Gemini (audio de ida y vuelta, se puede interrumpir), con la
voz elegida. Funciona en el celular. Lo que se pida pasa por el **bloque 0** igual que todo lo demás.
Corta sola a los 10 minutos y respeta el tope mensual de IA.

**La prueba**: el componente pide el micrófono, abre la sesión con la voz guardada en Ajustes y la
cierra a los 10 minutos; una acción de plata pedida por voz termina como propuesta, no hecha.

## Bloque 4 — Foto de una boleta o factura de compra → gasto para confirmar

Foto por WhatsApp o desde la app: Gemini lee proveedor, fecha, total y renglones. **Nivel
`pregunta`**: queda como propuesta "Gasto de $X en <proveedor>, ¿lo cargo?" con la foto; al
confirmar en la app se guarda con `saveGastoGeneral` (`src/app/actions/gastos.ts` ~l.25) **con
`idempotencyKey` = huella de la foto**, así la misma boleta mandada dos veces no carga dos gastos.

**La prueba**: la misma foto dos veces deja una sola propuesta; sin confirmar no hay gasto.

## Bloque 5 — Reenviarle un mail

Una dirección para reenviar (la cuenta de Google de la empresa con una etiqueta, p. ej. "reenviar a
la app", leída con el permiso de Gmail que ya está; **sin** servicio nuevo). Lo que llega se lee como
en la orden 102 bloque 8: si es de un proveedor con precio nuevo, queda propuesta de actualizarlo; si
es de un cliente, queda la respuesta escrita para que el dueño la mande. Todo pasa por el bloque 0.

## Bloque 6 — Pedir precios a proveedores

"Pedile precio de 200 servilletas negras para el 15 a los proveedores de decoración": arma un
mensaje por proveedor (de la lista de proveedores que ya existe) y los deja en la bandeja de salida
**para mandar con un toque** (`saveScheduledMessage` con `manual_click`). Cuando contestan (por
WhatsApp o mail), junta las respuestas en una tabla para comparar. **No sale nada solo.**

## Bloque 7 — Objetivos de varios pasos y reglas propias

- **"Dejá lista la fiesta de Ana"**: arma la lista de lo que falta (menú, personal, carga, cuotas,
  invitados) mirando la fiesta, hace solo lo de nivel `solo`, deja propuestas de lo de nivel
  `pregunta` y muestra el avance en "Tu asistente".
- **Pantalla "Qué puede hacer solo"** en Ajustes: la tabla del bloque 0, donde el dueño puede pasar
  una acción de `solo` a `pregunta` (más cuidado) **pero nunca de `pregunta` a `solo` si toca plata**
  ni tocar las de `nunca`, que se ven con un candado.
- **El prospecto que llega por anuncio** (lo único que el bot ya contesta): que le pregunte fecha,
  cantidad de invitados y salón, y le arme el presupuesto con el simulador que ya existe
  (`generateBudgetAndLeadFromSimulator`, `src/app/actions/armado-rapido.ts`) mandándole el enlace.
  **No da nada por cerrado** y avisa al dueño. Sin plazos ni precios prometidos (reglas de `CLAUDE.md`).

## Bloque 8 — Llamada telefónica de verdad: PREPARADO Y APAGADO

Atender una llamada al número de WhatsApp de la empresa (API de llamadas de WhatsApp) y que conteste
la IA con voz necesita un servidor siempre prendido o un servicio de telefonía: **eso cuesta por
mes**. No se activa. Dejá:

- en `docs/` una nota corta con qué servicio haría falta, cuánto cuesta por mes y por minuto (de la
  página oficial, con el enlace) y qué habría que conectar;
- en Ajustes, la opción **"Atender llamadas con la IA"** deshabilitada con el texto "Necesita un
  servicio pago. Consultalo antes de activarlo".

```comprobar
# Bloque 3 — hablar en vivo con el asistente
archivo: src/lib/asistente/sesion-voz-en-vivo.ts
usa: iniciarVozEnVivo en src/components/multiagent/multiagent-widget.tsx
usa: reservarMinutos en src/app/api/asistente/voz-en-vivo/route.ts
prueba: src/__tests__/la-voz-en-vivo-ruta.test.ts
prueba: src/__tests__/la-voz-en-vivo-cliente.test.ts
# Bloque 4 — la foto de la boleta queda como propuesta de gasto
usa: gasto_boleta en src/lib/asistente/por-whatsapp.ts
archivo: src/lib/asistente/que-puede-hacer-solo.ts
prueba: src/__tests__/el-asistente-cuida-la-plata.test.ts
archivo: src/lib/asistente/por-whatsapp.ts
usa: atenderAlEquipo en src/app/api/whatsapp/webhook/route.ts
prueba: src/__tests__/whatsapp-del-equipo.test.ts
no-usa: speechSynthesis en src/components/mi-dia/ParteDeLaMananaPlayer.tsx
usa: nivelDeRiesgo en src/lib/asistente/por-whatsapp.ts
```
