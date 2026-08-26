# Orden 11 — El encargado y su equipo

**Para:** Gemini
**Fecha:** 26 de agosto de 2026
**Entrega:** **UNA SOLA propuesta con los siete bloques.** Si uno se traba, entregá los
otros seis igual y decí cuál faltó.

---

## Lo que pidió el dueño

*"La voz para hablar conmigo, modo enjambre pero controlado con un encargado. Hacé todo
lo que consideres para que sea espectacular, de una, sea fácil y me saque trabajo."*

**La idea en una frase: el dueño le habla a UNA persona, y esa persona tiene un equipo
atrás.** No siete asistentes contestando por separado: un encargado que reparte, junta y
contesta con una sola respuesta.

**Lo que hay hoy y sobre lo que se construye** (no empieces de cero):

- **La asistente ya tiene voz en las dos direcciones**
  (`src/components/multiagent/multiagent-widget.tsx`): dictado en español uruguayo y
  respuesta hablada, con botón de silencio.
- **Ya hay especialistas**: contable, comercial, marketing, secretaria, de fiesta.
- **Ya hay trabajadores que corren solos**: el vigilante de la noche y el de publicidad
  (`src/lib/agentes/motor-agentes.ts`).
- **Ya hay control de gasto**: todas las funciones de inteligencia artificial cuentan lo
  que gastan y respetan el tope mensual (`src/lib/ai/consumo-servidor.ts`).

**Lo que NO hay, y es lo que falta:** los especialistas **no se hablan entre ellos**.
`runMultiAgent()` es un conmutador: elige uno y ese contesta. Ninguno le pasa la posta a
otro.

---

## Bloque 1 — El encargado

**Qué es:** un agente que recibe el pedido, decide **qué especialistas hacen falta**, les
reparte el trabajo, espera, junta lo que trajeron y **contesta una sola vez**.

**Cómo se comporta:**

1. Si el pedido lo resuelve **uno solo**, lo manda a ese y listo. **No armes un comité
   para una pregunta simple**: eso gasta de más y tarda.
2. Si hace falta más de uno —"¿cómo viene el sábado?" toca la fiesta, la plata y el
   personal—, les pide a cada uno **su parte**, y arma **una respuesta sola**.
3. **Habla en primera persona y en criollo.** No dice "el agente contable informa que":
   dice *"del sábado falta cobrar la última cuota y confirmar dos mozos"*.
4. **Dice de dónde sacó cada dato** si se lo preguntan, pero no lo recita sin que se lo
   pidan.
5. **Si un especialista no contesta, sigue con los demás** y lo aclara: *"del personal no
   pude averiguar"*. Nunca inventa la parte que falta.

**El tope, que no es opcional:** un pedido puede usar **como máximo tres especialistas**.
Si el encargado cree que necesita más, contesta con lo que tiene y ofrece seguir. Sin este
tope, una pregunta amplia se come el presupuesto del mes.

---

## Bloque 2 — La voz, para trabajar sin manos

**Ya existe y hay que hacerla notar.** Primero averiguá por qué el dueño no la está
escuchando: puede estar silenciada por defecto o el botón puede no verse.

**Qué hay que hacer:**

1. **Un botón de voz que se vea**, no escondido. Que se entienda que puede hablarle.
2. **Modo manos libres**: toca una vez, habla, y el encargado contesta hablando. Sin
   escribir nada. Es para cuando está manejando o armando el salón.
3. **La voz del teléfono, no una de inteligencia artificial.** Es gratis, funciona sin
   internet y contesta al instante. Una voz de inteligencia artificial suena mejor pero
   **cuesta cada vez que habla y se queda muda con mala señal**, que es justo lo que hay
   en un salón.
4. **Que se pueda callar en un toque**, y que se acuerde de la elección.
5. **Respuestas cortas cuando habla.** Lo que se lee en pantalla puede ser largo; lo que
   se escucha, no. Tres frases y "¿querés que siga?".

---

## Bloque 3 — El parte de la mañana (esto es lo que le saca trabajo)

**Es la parte que más vale de toda la orden.**

El equipo trabaja mientras él no está. Cuando entra a la app, **el encargado ya tiene el
parte hecho** y se lo dice en «Mi día», y si toca el botón, se lo dice hablando:

> *"Buen día. Hoy hay tres cosas: cobrarle la segunda cuota a Marcela, confirmar el menú
> del sábado con el salón, y Rodrigo está esperando el presupuesto desde el martes.
> ¿Por cuál empezamos?"*

Y él contesta **por voz**: *"mandale el presupuesto a Rodrigo"*, y el encargado lo deja
preparado.

**Las reglas de ese parte:**

- **Sale de datos que ya existen.** No inventa números ni prioridades.
- **Usa las palabras de «Mi día»**: sin *riesgo*, *urgente*, *crítico*, *vencido*,
  *alerta*, *atrasado* ni *pendiente*.
- **Tres cosas, no quince.** Si hay más, dice "y hay cuatro más" y las muestra en pantalla.
- **Si no hay nada, lo dice y se calla.** *"Por hoy está todo al día."*
- **Se arma una vez por día**, no en cada pantalla que abre. Gasta una vez.

---

## Bloque 4 — Qué puede hacer el equipo, y qué no

**Lo que el encargado puede hacer solo, porque no sale de la app:**

- Buscar, contar, comparar, resumir.
- **Preparar**: dejar el mensaje escrito, el presupuesto armado, el recordatorio listo.
- Llevarlo a la pantalla que corresponde.

**Lo que NO puede hacer nunca, y va con prueba que lo impida:**

- **Mandar un mensaje a un cliente.** Se prepara y **lo manda una persona**, desde su
  propio WhatsApp. Es la regla más vieja del proyecto y no se toca.
- **Publicar en redes.** Deja el borrador.
- **Cambiar plata**: precios, cuotas, descuentos, facturas. Puede proponer el cambio y
  mostrarlo; lo confirma una persona.
- **Borrar nada.**

**La línea es siempre la misma: preparar sí, mandar no.**

---

## Bloque 5 — Que se vea que hay un equipo atrás

El dueño pidió que sea **espectacular**. Lo espectacular acá no es una animación: es que
**se vea el trabajo pasando**.

- Mientras el encargado reparte, que se vea **quién está trabajando**: *"le pregunto al
  contable y al de personal…"*, con los nombres de los especialistas apareciendo.
- Cuando cada uno vuelve, que se vea **tacharse de la lista**.
- Y al final, **una sola respuesta**, no tres burbujas.

Eso es lo que hace sentir que hay un equipo y no un programa. Y de paso explica por qué
una pregunta grande tarda unos segundos más.

**La regla del bloque 13 de la orden 9 vale acá también: se ve primero, se anima después.**
Si la animación no corre, la respuesta llega igual.

---

## Bloque 6 — El freno de gasto, a la vista

El enjambre multiplica las consultas de inteligencia artificial. **El control ya existe y
funciona** (`hayPresupuestoParaIA`): lo que falta es que se vea y que frene con criterio.

1. **Tope por pedido:** máximo tres especialistas, como dice el bloque 1.
2. **Tope del día**, aparte del mensual. Un día raro no se puede comer el mes.
3. **Cuando el mes llega al tope**, el encargado lo dice en criollo: *"este mes ya usé
   todo lo que tengo asignado; sigo contestando lo que puedo sin consultar"*. **No se
   apaga en silencio.**
4. **Y lo más importante: el parte de la mañana y las notas del blog tienen prioridad.**
   Si hay que recortar, se recortan las consultas sueltas, no lo que trabaja solo.
5. Que el gasto del mes se vea en la pantalla de la asistente, en pesos o en cantidad de
   consultas. **Sin número inventado**: si no se puede calcular, no se muestra.

---

## Bloque 7 — Que trabaje en vueltas, no de a una respuesta

**Esto es lo que separa un chat de un empleado, y el dueño lo pidió con estas palabras:
que la asistente de la app trabaje al nivel al que trabaja Claude, pero con Gemini.**

Hoy `runMultiAgent()` hace **una sola vuelta**: recibe el mensaje, elige un agente, ese
contesta, se ejecuta como mucho una acción, y termina. Es un asistente de una pregunta por
vez.

**Lo que falta son cinco cosas. La primera ya está; las otras cuatro son este bloque.**

1. ✅ **Herramientas de verdad.** Ya las tiene: 24 acciones que crean presupuestos,
   registran pagos, emiten facturas, agendan reuniones.

2. ❌ **Trabajar en vueltas hasta terminar.** Que haga algo, **mire el resultado**, decida
   qué sigue, y siga. Ejemplo real: *"armá el presupuesto de la boda de Sofía para 120
   personas con paquete oro"* debería ser: buscar a Sofía → si no está, crearla → armar el
   presupuesto → aplicar el paquete → mostrarlo. Hoy eso son cinco preguntas del dueño.

3. ❌ **Comprobar antes de decir "listo".** Después de cada acción, **volver a leer** lo
   que quedó guardado y confirmar que es lo que se pidió. Si no coincide, decirlo.
   **Nunca dar por hecho que la acción funcionó porque no tiró error.**

4. ❌ **Parar y preguntar cuando la decisión es del dueño.** Si falta un dato que cambia
   la plata —la cantidad de invitados, la fecha, el paquete—, **preguntar una sola cosa**,
   no un formulario. Y si hay dos caminos razonables, preguntar cuál, no elegir solo.

5. ❌ **Decir cuando no puede.** Si después de intentar no lo resuelve, decir **qué** no
   pudo y **por qué**. Nunca inventar el final.

**Los frenos, que no son opcionales:**

- **Máximo cinco vueltas por pedido.** Si a la quinta no terminó, cuenta lo que hizo, lo
  que falta y para. Sin esto, un pedido mal entendido gira hasta comerse el presupuesto.
- **Cada vuelta que consulta al modelo se cuenta** en el tope de gasto, como todo lo demás.
- **Las vueltas no cruzan la línea del bloque 4.** Puede preparar todo lo que quiera; para
  mandar, cobrar, publicar o borrar, se detiene y espera a una persona.
- **Que se vea lo que está haciendo** mientras trabaja: *"busqué a Sofía… armé el
  presupuesto… le aplico el paquete oro"*. Si tarda ocho segundos y la pantalla está
  muda, el dueño cree que se colgó.

**Por qué importa comprobar, con un caso de verdad de hoy:** un ayudante reportó que
cuatro pantallas de la app estaban rotas. No era cierto: había mirado una compilación
vieja. **Un asistente de una sola vuelta habría dado ese aviso por bueno.** El que
comprueba, va, mira de nuevo y descubre que no hay nada roto. Esa es toda la diferencia.

---

## Antes de entregar

- `npm run check:acentos` — sin acentos rotos. **Con acentos rotos no se fusiona.**
- `npx tsc --noEmit` — cero errores. **Si falla nombrando archivos dentro de `.next/`, es
  la compilación vieja**: borrala y volvé a probar.
- `npx jest --silent` — todas en verde.
- `npm run build` — tiene que terminar bien.
- **Antes de subir, mirá `git status`**: la corrida de pruebas deja un prospecto de prueba
  y avisos. **Eso no se commitea.**
- **No toques `apphosting.yaml`.**
- **No cambies el modelo de inteligencia artificial.** El dueño preguntó por una versión
  más nueva y **todavía no está decidido**: cuesta distinto y escribe distinto.
- Anotá lo que hiciste en `docs/YA-RESUELTO.md` y en `docs/MANUAL-DE-LA-APP.md`.

## La prueba que tiene que quedar

Una que impida que el equipo actúe solo hacia afuera: **ningún agente puede mandar un
mensaje, publicar en una red, cobrar ni borrar sin que una persona lo toque.** Si algún
día alguien lo cambia, que se ponga en rojo.
