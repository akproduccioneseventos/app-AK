# Cómo se audita de ahora en más

**Orden del dueño, 20 de agosto de 2026.** El método viejo falló y hay que
cambiarlo. Este archivo reemplaza cualquier instrucción anterior sobre cómo
auditar.

## Por qué se cambia

La app estuvo declarada "terminada" y en un solo día aparecieron seis cosas rotas.
**Todas tenían exactamente la misma forma:**

- Escritas.
- Compilando.
- Con pruebas en verde.
- **Y sin producir nada en el mundo real.**

Cuatro tareas automáticas —el blog, el guardado diario de los números de las
redes, la publicación de posteos programados y los recordatorios de cuota
vencida— **no las disparaba nadie**. Ninguna corrió nunca. El archivo de las notas
del blog estaba mal escrito y no se podía leer. Las notas daban "no encontrada" al
abrirlas. Los frenos de gasto no frenaban porque contaban por un dato que escribe
el visitante.

**Ninguna auditoría lo agarró, y el motivo es uno solo:** preguntaban *"¿está
programado?"* y la respuesta era sí.

> **La pregunta vieja era "¿está escrito?". La pregunta nueva es "¿pasó de
> verdad?".**

## Las cuatro preguntas nuevas

Cada una es **mecánica**: se contesta contando, no leyendo con criterio. Ninguna
admite una opinión como respuesta. Ése es el punto: los ayudantes opinando dieron
70% de falsas alarmas; las cuentas mecánicas, 100% de aciertos.

### 1. ¿Dejó rastro?

Para **cada cosa que la app promete hacer sola**: cuándo fue la última vez que
pasó de verdad.

- La respuesta sale de un dato guardado, no de leer el código.
- **"Nunca" es una falla**, por más lindo que esté escrito.
- **"Hace más tiempo que su intervalo" también es una falla.**

Vive en `src/lib/automatico/tareas-automaticas.ts`. Una prueba recorre
`src/app/api/cron/` y falla si aparece una tarea sin declarar o que no deje
constancia al terminar.

### 2. ¿Alguien lo llama?

Para cada componente, cada acción y cada pantalla: **contar cuántos archivos lo
usan**. Cero es un hallazgo.

- Un componente que nadie importa es trabajo pago que nadie ve.
- Una pantalla a la que no lleva ningún enlace no existe para el usuario. **Ya
  aparecieron cinco así.**
- Una tarea que nadie dispara no corre. **Ya aparecieron cuatro así.**

### 3. ¿Necesita algo que hoy no está?

Para cada conexión con una plataforma de afuera: **qué necesita para funcionar, y
qué hace exactamente si eso falta**.

Hay dos respuestas posibles y una es grave:

- **Avisa que falta.** Correcto.
- **Simula y devuelve datos de ejemplo como si fueran reales.** **Eso es una
  falla, y de las peores**, porque el dueño ve una pantalla que funciona y cree
  que está resuelto. Ya pasó con los números del panel de redes y con el cartel de
  "ficha verificada" de Google.

### 4. ¿Lo que dice la pantalla existe en el código?

Tomar las frases que **ve el usuario** —"se envía solo", "se guarda
automáticamente", "todos los días", "te avisamos"— y buscar la función que lo
cumple y quién la llama.

**Una promesa en pantalla sin nadie que la cumpla es una mentira al cliente**, y
no la agarra ninguna prueba de tipos ni de compilación.

## Cómo se corre

- **Las cuatro pasadas van a los ayudantes económicos**, en paralelo y en segundo
  plano. Son conteos: no hace falta criterio para hacerlos.
- **El pedido a cada ayudante dice "contá y listá", nunca "revisá si está bien".**
  En cuanto se les pide criterio, inventan.
- **Cada hallazgo viene con archivo y línea, o no se reporta.**
- **El modelo principal confirma antes de tocar nada.** De diez hallazgos
  reportados por un ayudante, nueve fueron falsa alarma una vez.

## Lo que NO se hace

- **No se lanzan auditorías generales "a ver qué aparece".** Esto no las
  reemplaza: se corre cuando el dueño lo pide, o cuando algo falló de verdad.
- **No se reporta como pendiente algo que funciona y se ve bien.**
- **No se afloja un control cuando falla.** Si una de las pruebas que corren solas
  se pone en rojo, se arregla lo que señala; no se cambia la prueba para que pase.
