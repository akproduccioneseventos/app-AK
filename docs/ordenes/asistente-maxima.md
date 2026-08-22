# Orden 3: la asistente de la app, al máximo

**Para:** Gemini (Antigravity)
**Escrita:** 22 de agosto de 2026.
**Tamaño:** es la propuesta grande. Va después de `ahora.md` y puede ir antes o
después de `despues-sin-internet.md`.

## Cómo se entrega

**UNA SOLA propuesta con todos los bloques adentro.** Si un bloque se traba,
entregá el resto igual, en la misma propuesta, avisando cuál faltó y por qué.

**Arrancá desde la versión principal de ahora.** Antes de tocar nada, leé
`docs/MANUAL-DE-LA-APP.md` y `docs/YA-RESUELTO.md`.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

---

## Lo que pidió el dueño

Que la asistente de la app llegue al máximo: que haga muchas más cosas solas, no
sólo contestar. Y que se revise si hay un modelo mejor.

---

## De dónde partimos (verificado, no lo rehagas)

En `src/ai/flows/multiagent-flow.ts`, antes de cada respuesta se le arma un
contexto con: el manual (`src/lib/multiagent/manual-ak.ts`), **el mapa del panel
con las 39 opciones de menú** (`src/lib/multiagent/mapa-app.generado.ts`), la
memoria del agente, el diagnóstico del día y datos reales (KPIs, presupuestos,
prospectos, tareas, la fiesta en contexto).

**Hoy sólo puede hacer cuatro cosas:** crear una tarea, crear un recordatorio,
llevar a una pantalla, o contestar. Es poco para todo lo que sabe.

---

## BLOQUE 0 — El modelo: usar el que piensa donde hace falta

En `src/ai/genkit.ts:6-8` hay tres casilleros y **el del modelo "pro" apunta al
mismo modelo rápido que el común** (`gemini-3.6-flash` en los dos). O sea: cuando
la app pide el que razona, recibe el rápido.

**Qué hacer:**

1. **Confirmá contra la lista oficial de Google cuál es hoy el mejor modelo de
   razonamiento disponible** y cuál el rápido. No lo pongas de memoria: verificá.
   Dejá los nombres en un solo lugar, con un comentario que diga para qué sirve
   cada uno.
2. **Dos velocidades, y usar cada una donde corresponde:**
   - **Rápido** (lo de siempre): contestar dónde se hace algo, llevar a una
     pantalla, resumir, clasificar. Es la mayoría y tiene que seguir siendo barato.
   - **El que piensa**: entender un pedido largo del cliente, armar el borrador de
     un presupuesto, decidir entre varias opciones. Son pocas por día.
3. **Que se pueda cambiar sin tocar código**, y que la cadena de respaldo que ya
   existe siga andando si un modelo no está disponible.
4. **Cuidá el gasto**: ya hay un tope mensual de inteligencia artificial
   (`hayPresupuestoParaIA`). **El modelo que piensa también tiene que respetarlo**,
   y si se llegó al tope, cae al rápido en vez de fallar.

---

## BLOQUE 1 — Cargar un prospecto contándoselo (lo que más se usa por día)

**Hoy:** cargar un prospecto son varias pantallas y varios campos, muchas veces
por día.

**Que pase:** el dueño le dice *"me escribió Ana por un cumple de 15, el 14 de
marzo, para 120 personas, la contacté por Instagram"* y la asistente **deja el
prospecto cargado** con nombre, teléfono si lo dijo, tipo de evento, fecha,
cantidad de invitados, de dónde vino, etapa y próxima acción con fecha.

- **Antes de guardar, muestra lo que entendió y espera un toque de confirmación.**
  Nunca guarda a ciegas.
- **Lo que no entendió, lo pregunta**; no lo inventa ni lo deja vacío en silencio.
- **Busca si ya existe** por teléfono o nombre parecido antes de crear, como ya
  hace la pantalla de hoy. Un prospecto duplicado genera seguimientos dobles.

---

## BLOQUE 2 — El borrador del presupuesto (ojo: esto es plata)

**Que pase:** desde una descripción (*"boda para 150, en el Club Uruguay, con
pista LED y fotocabina, el 8 de noviembre"*), la asistente **deja armado un
presupuesto EN BORRADOR** con los servicios que correspondan.

**Reglas que no se negocian, porque es plata:**

- **Sale siempre en borrador y lo cierra una persona.** Nunca se manda al cliente
  ni se da por aceptado solo.
- **Los precios salen del catálogo de la app**, nunca los inventa el modelo. Si un
  servicio no está en el catálogo, lo dice y lo deja afuera.
- **El ajuste anual del 15% y los descuentos se aplican con las reglas de siempre**
  (`src/lib/budget/financial-guardrails.ts`). No se recalculan aparte.
- **Muestra en pantalla de dónde salió cada renglón** antes de guardar.
- Si no está seguro de la cantidad de invitados o del salón, **pregunta**.

---

## BLOQUE 3 — Preparar los mensajes (preparar sí, mandar no)

**Que pase:** que arme el mensaje de WhatsApp de seguimiento, de recordatorio de
cuota o de post-fiesta, **con los datos reales de esa persona**, y lo deje en la
bandeja de salida que ya existe.

- **El mensaje sale cuando una persona lo toca, desde su propio WhatsApp.**
  Esto no cambia nunca. La línea es del dueño y es su número personal.
- Que se pueda editar antes de mandarlo.
- Tono rioplatense, corto, sin sonar a robot.

---

## BLOQUE 4 — Que hable sin que le pregunten

**Hoy sólo contesta cuando le hablan.** Que además deje escrito, sin que nadie se
lo pida, el repaso de la mañana en `/repaso-diario`:

- Quién debe y cuánto vence esta semana.
- Qué presupuesto lleva más de 5 días sin respuesta (y cuál más de 14, que ya es
  oportunidad fría).
- Qué falta para la fiesta más próxima.
- Qué tarea automática no corrió.

**Que lo arme la tarea programada** (el despertador que ya existe), **una vez por
día y no en cada visita**, para no gastar de más. Y que respete el tope de gasto.

---

## BLOQUE 5 — Una asistente para el cliente y para el invitado

**Esta es la que más le saca trabajo al equipo.** Hoy las preguntas de los
clientes y los invitados se contestan a mano, por WhatsApp, de noche y los
domingos.

**En el portal del cliente**: que conteste sobre **su** fiesta —a qué hora
empieza, qué menú quedó elegido, cuánto falta pagar y cuándo vence, qué falta
definir, cómo va la lista de invitados—.

**En el portal del invitado**: a qué hora y dónde es, qué mesa le tocó, cómo
confirmar, si puede llevar acompañante, cómo subir una foto al muro.

**Y acá está lo delicado, que es lo único que puede salir caro:**

- **Cada uno ve sólo lo suyo.** El contexto se arma **en el servidor**, con la
  sesión de esa persona, y trae **únicamente** los datos de su fiesta. Nunca se
  manda al navegador la lista de fiestas ni datos de otros.
- **Al invitado no le llega nada de plata.** Ni el total, ni lo que se debe, ni
  costos, ni datos de otros invitados que no sean su mesa.
- **Ni el cliente ni el invitado pueden pedirle acciones**: contesta y guía, no
  crea ni modifica nada. Salvo lo que ya puede hacer por su cuenta en el portal.
- **Si no sabe algo, dice que no sabe y ofrece escribirle al equipo.** Nunca
  inventa un horario ni una condición del contrato.
- **Tope de gasto propio**, para que un invitado curioso no queme el presupuesto
  del mes.

**Una prueba que lo demuestre:** que pidiéndole datos de otra fiesta, no los da.

---

## BLOQUE 6 — Que se note que aprende

Ya guarda memoria del agente. Sumale:

- **Que recuerde las decisiones tomadas** y no vuelva a proponer lo contrario.
- **Un pulgar arriba / abajo** en cada respuesta, para que lo que no sirvió no se
  repita.
- **Que muestre de dónde sacó el dato** cuando responde con números ("según los
  presupuestos al día de hoy"). Sin eso, nadie le va a creer una cifra.

---

## Lo que NO se le da, nunca

- **Cobrar.** Ni generar un cobro, ni marcar algo como pagado.
- **Mandar mensajes, correos o WhatsApp por su cuenta.**
- **Tocar quién ve qué**, ni permisos, ni accesos.
- **Cerrar un presupuesto** o darlo por aceptado.
- **Borrar** nada.

Todo eso queda con la mano de una persona arriba.

---

## Cómo se prueba que quedó bien

**No alcanza con que compile.** Hace falta:

- Una prueba por cada acción nueva: que con un pedido en criollo deje lo
  esperado, y que **no guarde si el usuario no confirmó**.
- Una prueba de que el borrador de presupuesto **usa precios del catálogo** y no
  números inventados.
- Una prueba de que la asistente del portal **no devuelve datos de otra fiesta**.
- Una prueba de que **al llegar al tope de gasto, cae al modelo rápido** en vez de
  fallar.

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes sin avisar.
- Textos que ve el cliente, si no están pedidos.
- El WhatsApp prepara mensajes y no los manda.
- Si tocás o agregás una pantalla, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.
