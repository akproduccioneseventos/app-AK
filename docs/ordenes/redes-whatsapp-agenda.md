# Orden 4: WhatsApp, redes, agenda con avisos al celular, y la web con modelos

**Para:** Gemini (Antigravity)
**Escrita:** 22 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta con todos los bloques adentro.** Si un bloque se traba,
entregá el resto igual, en la misma propuesta, avisando cuál faltó y por qué.

**Arrancá desde la versión principal de ahora.** Antes de tocar nada, leé
`docs/MANUAL-DE-LA-APP.md`, `docs/YA-RESUELTO.md` y `docs/WHATSAPP.md`.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

**Regla que no se toca:** el WhatsApp **prepara** los mensajes y los deja en la
bandeja; **el mensaje sale cuando una persona lo toca**, desde su propio WhatsApp.

---

## BLOQUE 1 — URGENTE: la bandeja de WhatsApp abre un número que no existe

**Verificado a mano.** En `src/app/(app)/contabilidad/crm/outbox/page.tsx:51`, al
tocar "enviar por WhatsApp" se arma el enlace sacándole los símbolos al teléfono:
`09 8555 1234` queda `0985551234`. **WhatsApp necesita el código de país**:
`598985551234`. Se abre la aplicación, dice que el número no existe, y el mensaje
no se puede mandar.

**Y lo grave:** la app **igual lo marca como enviado** (línea 65). En la planilla
figura que se avisó a esa persona, y esa persona nunca recibió nada. En
recordatorios de cuota, eso es plata que no se reclamó creyendo que sí.

**El arreglo ya existe en la app:** `toWhatsAppNumber()` en
`src/lib/commercial/contact.ts:18` arma bien el número y ya se usa en las tarjetas
del CRM. **Usala también en la bandeja.**

Además:
- **Si el número no se puede armar, no marques como enviado**: avisá que ese
  contacto tiene el teléfono mal cargado y a dónde ir a corregirlo.
- **Que se pueda decir "en realidad no lo mandé"**: hoy, si abrís WhatsApp y no
  mandás nada, queda como enviado igual y no hay forma de revertirlo.
- **Si reprogramar falla, avisá** (línea 81-89): hoy no dice nada y el usuario cree
  que quedó para mañana cuando quedó igual.
- **Que se pueda editar el mensaje antes de mandarlo.** Si el nombre está mal
  cargado, hoy sale así.
- **Una prueba** con un número uruguayo escrito de tres formas distintas, que
  verifique que el enlace sale bien y que un número imposible no se marca enviado.

---

## BLOQUE 2 — El planificador de redes miente sobre lo que publica solo

**Verificado.** El cartel de `src/app/(app)/empresa/redes-sociales/page.tsx:248`
dice *"Luego copia y pega para publicar"*. **Pero Instagram y Facebook se publican
solos** (`src/lib/presencia-digital/publicador.ts`). Lo que hay que copiar a mano
es WhatsApp, TikTok, Threads y X, que no se pueden automatizar.

El dueño no lo sabía: puede haber estado copiando y pegando al pedo, o publicando
dos veces.

**Qué hacer:**

1. **Que cada red diga qué va a pasar con ella**, en la misma tarjeta al elegirla:
   "Instagram: sale solo a la hora que elijas" / "TikTok: te lo dejamos listo para
   copiar". Sacá el cartel genérico.
2. **Botón "Publicar ahora"** en cada posteo. Hoy, para que algo salga ya, hay que
   cambiarle la fecha a una vieja y esperar.
3. **Una pantalla para los que hay que copiar a mano**, agrupados, con botón grande
   de "copiar texto" y "copiar imagen". Hoy están mezclados con todos los demás.
4. **Avisar cuando una publicación falla.** Hoy queda marcada como fallida en una
   lista y nadie se entera hasta días después
   (`src/lib/presencia-digital/publicador.ts:297`).
5. **Vista por estado**: cuántos esperando, cuántos listos para copiar, cuántos
   fallaron y por qué, cuántos salieron.

**Y la oportunidad más grande: que al cerrar una fiesta quede el posteo escrito.**
Un borrador tipo *"Qué noche la de los quince de Sofía, gracias por confiar en
AK"*, con las fotos **ya aprobadas** del muro de esa fiesta. Sale en borrador, se
edita y se programa. Es el contenido que más clientes trae y hoy se hace a mano o
no se hace.

---

## BLOQUE 3 — La agenda y los avisos al celular (lo que más pidió el dueño)

El dueño lo dijo así: *"antes tenía un asistente en WhatsApp que me mandaba
mensajes para recordarme reuniones"*.

**No hace falta WhatsApp: la app le puede avisar al celular.** Es gratis, no
ensucia su línea personal, y de un toque lo lleva a la pantalla.

### Lo que está roto o falta (verificado)

- **Los avisos al celular NO funcionan.** `public/firebase-messaging-sw.js` está en
  modo apagado: faltan las variables `NEXT_PUBLIC_FIREBASE_*`. La app **sí** sabe
  pedir permiso y guardar el teléfono (`src/lib/firebase/messaging.ts:58`), pero
  **no hay nadie que mande nada**. Otra vez escrito y sin producir nada.
- **Los recordatorios sólo se crean si alguien abre el panel.**
  `checkAndCreateReunionReminders()` (`src/app/actions/notifications.ts:274`) corre
  al cargar el dashboard. Si el dueño no entra, no existe el aviso.
- **No hay aviso de "reunión en una hora".** Sólo avisa si es hoy o mañana.
- **La reunión no guarda con quién ni dónde.** Son notas sueltas.
- **Hay dos agendas separadas**: las reuniones de la fiesta
  (`/fiestas/nueva/reuniones`) y las citas comerciales (`/calendario`).

### Qué hacer

1. **Encender los avisos al celular.** Configurá lo que falte y dejá anotado, en
   criollo, qué hay que cargar y dónde. **Si falta una clave que no tenés, PARÁ Y
   AVISÁ** en una línea; no lo dejes a medias sin decirlo.
2. **Que el despertador dispare los recordatorios**, no el dashboard. El
   despertador ya existe (`functions/src/index.ts`). Que revise la agenda y mande:
   - **"Reunión con X en una hora"**, con el lugar si está cargado.
   - El repaso de la mañana: qué hay hoy, quién debe, qué presupuesto está frío.
   - **Que tocar el aviso lleve a la pantalla de esa reunión o ese cliente.**
3. **Que la reunión guarde con quién y dónde.** Con el contacto enganchado al
   cliente o prospecto, no escrito a mano.
4. **Una sola agenda.** Que las reuniones de fiestas y las citas comerciales se
   vean juntas, en un solo lugar, ordenadas por fecha. Que se pueda seguir
   entrando por donde se entra hoy.
5. **Que el dueño elija de qué quiere que le avisen** y a qué hora, en una pantalla
   simple. Y que pueda apagarlos.

**Ojo con el gasto:** los avisos no cuestan por mensaje, pero **revisar la agenda
cada 15 minutos no puede disparar el mismo aviso muchas veces**. Cada aviso se
manda una sola vez: dejá marcado el que ya se mandó, como se hace con las tareas.

---

## BLOQUE 4 — La página web con modelos para elegir

El dueño quiere poder elegir entre varios diseños de su página de venta.

**Primero mirá qué hay:** existe `/empresa/landing-editor` y la configuración
`getLandingSettings()`. **No lo rehagas**: fijate hasta dónde llega y construí
encima.

**Qué hacer:**

1. **Tres o cuatro modelos completos** de la portada, con nombres en criollo
   ("Elegante", "Fiesta", "Sobrio"), que cambien colores, tipografías y el orden de
   las secciones. **Los textos y las fotos son los mismos**: cambia el vestido, no
   el contenido.
2. **Que se vea antes de aplicar.** Una vista previa de verdad, no una miniatura.
3. **Que se pueda volver atrás de un toque** al modelo anterior.
4. **Que no rompa el posicionamiento en Google**: los títulos, las descripciones y
   la ficha del negocio se mantienen igual con cualquier modelo. **Esto es
   obligatorio**, y hay un control automático que lo revisa.
5. **Probalo en el celular** con cada modelo: es donde mira el cliente.

**Y una cosa que el dueño tiene que saber, escribila en esa pantalla:** el diseño
ayuda, pero **lo que más mueve las consultas es lo que dice la página y en qué
orden**. Si más adelante quiere ir más lejos, lo que sirve es poder probar dos
versiones y ver cuál trae más consultas; no es parte de esta orden, pero dejá el
camino abierto.

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes sin avisar.
- **El WhatsApp prepara mensajes y no los manda.**
- Textos que ve el cliente, si no están pedidos.
- Si tocás o agregás una pantalla, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.
