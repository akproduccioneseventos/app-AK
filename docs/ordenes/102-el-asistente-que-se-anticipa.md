# 102 — El asistente que se anticipa (estilo "Dots" de ChatGPT)

**Para:** Gemini.
**Escrita por:** Claude, el 30 de septiembre de 2026. Pedido del dueño: *"IA proactiva que se
anticipa, evita errores, todo un asistente que trabaja 24/7"*, y que avise **por aviso en el celular
y por WhatsApp, los dos con interruptor**.

## Cómo se entrega

- **Después de las órdenes 100 y 101**, en una propuesta nueva y **una sola** con los cinco bloques.
- `npm run "publicar?"` completo, con la última pantalla pegada en la propuesta.
- Pasá por `docs/ANTES-DE-ENTREGAR.md`.
- **Las reglas de siempre no cambian:** mira, detecta, prepara y avisa **solo**; **no** manda
  mensajes a clientes ni a prospectos, no cobra, no marca pagos, no acepta presupuestos ni toca
  permisos sin que el dueño toque "Sí".

---

## Bloque 0 — Los "agentes autónomos" hoy no corren solos

`ejecutarAgentesAutonomos` (`src/lib/agentes/motor-agentes.ts` ~l.462: vigilante de fiestas,
perseguidor de presupuestos, cobrador, generador de contenido, vigilante de la noche y de la
publicidad) **sólo lo llama un botón manual** (`ejecutarTodosLosAgentesManual`,
`src/app/actions/agentes-autonomos.ts` ~l.73). Si nadie lo toca, no corre.

Registrá la tarea `asistente-proactivo` en los cuatro lugares de siempre
(`src/lib/automatico/puerta-de-las-tareas.ts`, `tareas-automaticas.ts`,
`src/data/tareas-automaticas.json`, `al-entrar-a-la-app.ts`) con su ruta
`src/app/api/cron/asistente-proactivo/route.ts` y `marcarCorrida('asistente-proactivo')`. Corre
**cada hora** entre las 8 y las 22 (hora de Uruguay) y **una vez de madrugada**.

## Bloque 1 — Una sola bandeja: "Tu asistente"

Cada corrida junta en **una lista** lo que encuentran:

- los seis agentes de `ejecutarAgentesAutonomos`;
- `detectarErroresHumanos` (`src/lib/alertas/errores-humanos.ts` ~l.53): personal o salón en dos
  fiestas, cobros, comida mal contada, etc.;
- el parte de la mañana (`getParteDeLaManana`, `src/lib/automatico/parte-manana.ts` ~l.41), una vez
  por día.

Cada cosa encontrada es una **propuesta** con: qué pasa (en criollo), por qué importa, qué propone
hacer, y el botón **"Sí, hacelo"** / **"Ahora no"** / **"No me avises más de esto"**.

- Se guarda en `asistente-propuestas` (colección, de a un registro con `mutateDataItem`), con un
  `clave` estable (por ejemplo `cuota-vencida:<presupuestoId>:<cuotaId>`) para **no repetir** la
  misma propuesta en cada corrida.
- Pantalla `src/app/(app)/asistente/page.tsx`, primera del menú, con las pendientes arriba.
  `npm run mapa:generar`.
- **"Sí, hacelo"** ejecuta la acción ya preparada, con la misma lista de acciones permitidas que el
  secretario (`src/app/actions/multiagent.ts`) más las de la orden 101 (bloque 4). Si la acción es
  un mensaje a un cliente, **lo deja en la bandeja de salida con `manual_click`**: no lo manda.

## Bloque 2 — Te busca: aviso en el celular y por WhatsApp, cada uno con su interruptor

En **Ajustes → Tu asistente** (`src/app/(app)/settings/asistente/page.tsx`), dos interruptores:
**Aviso en el celular** (prendido de fábrica) y **WhatsApp al dueño** (apagado de fábrica), más el
número del dueño y un horario de "no molestar" (de fábrica, de 23 a 8).

- Todo el envío al dueño vive en **`src/lib/asistente/avisar-al-duenio.ts`** (una función `avisarAlDuenio(propuestas)` que decide canal, horario y tope).
- **Aviso en el celular:** `sendPushNotificationToAll` (`src/lib/firebase/server-messaging.ts`
  ~l.25), que ya existe. Sólo para propuestas **importantes** (plata, fiesta en menos de 7 días,
  choques de personal o salón), agrupadas: **un** aviso por corrida con "Tenés 3 cosas para mirar".
- **WhatsApp al dueño:** `sendMetaWhatsAppMessage` (`src/lib/whatsapp/meta-sender.ts` ~l.21),
  **sólo al número del dueño** que se cargó en Ajustes, nunca a otro. Ojo: Meta sólo deja mandar un
  mensaje libre dentro de las 24 horas de la última vez que ese número escribió; fuera de eso pide
  una plantilla aprobada. Si Meta lo rechaza por eso, **no se reintenta**: queda el aviso en el
  celular y se anota en la bandeja "WhatsApp no salió: falta la plantilla aprobada".
- Máximo **3 WhatsApp por día**, y nada en horario de "no molestar" (se juntan para las 8).

## Bloque 3 — Aprende de lo que le decís

- **"No me avises más de esto"** guarda la regla (tipo de propuesta + fiesta o cliente, si
  corresponde) y la próxima corrida no la vuelve a proponer. En Ajustes se ve la lista y se puede
  deshacer.
- **"Ahora no"** la esconde 3 días.
- Si una propuesta se aceptó 3 veces seguidas igual, pregunta una vez: "¿Querés que esto lo deje
  preparado siempre sin preguntarte?". **Preparado**, no hecho: lo que sale para afuera o toca plata
  sigue esperando el "Sí".
- Guardado con `saveAgentLearning` **ya arreglado por la orden 100** (sin perder datos con dos a
  la vez).

## Bloque 4 — Metas del mes

En la pantalla del asistente, el dueño escribe una meta ("llenar noviembre", "cerrar 5
presupuestos"). En el parte de la mañana el asistente mide cómo va (fiestas confirmadas del mes,
presupuestos cerrados, leyendo los datos, **sin inventar**) y propone **una** cosa concreta del día,
como propuesta con su botón.

## La prueba

`src/__tests__/el-asistente-se-anticipa.test.ts`, con la base de mentira que devuelve copias:

- con una cuota vencida, la corrida crea **una** propuesta; una segunda corrida **no la duplica**;
- "No me avises más" hace que la siguiente corrida no la cree;
- con el WhatsApp apagado no se llama `sendMetaWhatsAppMessage`; prendido, se llama **sólo** con
  el número del dueño y nunca más de 3 veces por día; en horario de "no molestar", no se llama;
- "Sí, hacelo" sobre un recordatorio al cliente deja el mensaje con `sendingMode: 'manual_click'`
  y **no** llama a ningún envío;
- la tarea `asistente-proactivo` deja constancia (`marcarCorrida`).

```comprobar
archivo: src/app/api/cron/asistente-proactivo/route.ts
usa: asistente-proactivo en src/lib/automatico/puerta-de-las-tareas.ts
usa: ejecutarAgentesAutonomos en src/app/api/cron/asistente-proactivo/route.ts
archivo: src/app/(app)/asistente/page.tsx
archivo: src/app/(app)/settings/asistente/page.tsx
usa: sendPushNotificationToAll en src/lib/asistente/avisar-al-duenio.ts
usa: sendMetaWhatsAppMessage en src/lib/asistente/avisar-al-duenio.ts
prueba: src/__tests__/el-asistente-se-anticipa.test.ts
```
