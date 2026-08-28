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

### 5. ¿El visitante lo ve?

No alcanza con que exista, que alguien lo llame y que diga la verdad. Hay que abrir
la página en un navegador de verdad, en un celular, y mirar. Todo lo que se encontró
en la web pública el 26 de agosto —el pie que no aparece, las páginas sin título, la
ficha con una dirección que no existe— **pasaba las otras cuatro preguntas**.

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

---

## La quinta pregunta: ¿alguien lo publica? (22 de agosto de 2026)

Las cuatro preguntas de arriba nacieron de encontrar cosas escritas que no
producían nada. **El 22 de agosto la misma falla apareció tres veces en un día**, y
las tres pasaron los cuatro controles: tipos en cero, pruebas en verde, compila.

1. **El despertador llamaba a una puerta que no existe** — `/api/cron/despachador`
   contra `/api/cron-despachador`. Una barra donde iba un guión.
2. **La auditoría de títulos leía una copia de sí misma** — la lista estaba escrita
   dos veces y la pantalla usaba una, la auditoría la otra.
3. **El despertador no lo publica nadie** — el despliegue sube el sitio y deja la
   tarea programada sin subir. El código está, y no corre.

**La pregunta que hay que agregar, y va antes de dar algo por terminado:**

> **¿Esto llega hasta donde tiene que llegar, o se queda en el repositorio?**

En concreto, tres chequeos que no cuestan nada y que ningún control automático
hacía:

- **Cuando algo llama a otra cosa por su nombre escrito** (una dirección, una ruta,
  el nombre de un modelo), **verificar que ese nombre exista de verdad.** No que
  compile: que exista.
- **Cuando algo tiene que correr solo**, verificar que **algo lo dispare** y que
  eso esté publicado. Una tarea programada que no se despliega es una tarea que no
  existe.
- **Cuando algo lee datos para auditarlos**, contar **cuántas veces está definida
  esa fuente**. Si hay dos copias, la auditoría se está mirando al espejo.

**Y la regla que resume todo, que quedó del día:**

> **Compilar no es andar.** Y una prueba nueva no vale hasta verla en rojo: antes
> de darla por buena, romper a propósito lo que tiene que detectar.


## La quinta pregunta: ¿el dato LLEGA? (27 de agosto de 2026)

**El dueño lo preguntó así:** *"es increíble que después de tantas auditorías te enfocás en
la fotocabina y no funciona. ¿Habría alguna manera de que no pasara? Las auditorías son para
eso y fallan siempre."*

**Tenía razón, y la explicación no es que fallen: es que no preguntan esto.**

Las cuatro preguntas de arriba son sobre el código: ¿existe?, ¿alguien lo llama?, ¿le falta
algo?, ¿la pantalla dice la verdad? **La fotocabina pasa las cuatro** —existe, se llama,
tiene datos, no miente— y el recuerdo igual sale con el fondo pelado.

### Los tres casos del mismo día, con la misma forma exacta

- `componerTiraDeFotos` **sabe recibir** `imagenFondoUrl` → la fotocabina nunca se lo manda.
- `HeroSection` **sabe recibir** `backgroundVideoUrl` → ninguna página le mandaba uno.
- `puedeComprometer` **sabía recibir** `tipo` → los que la llamaban no se lo mandaban, y la
  prohibición de encender campañas quedaba salteada **en silencio**.

Siempre lo mismo: **el que recibe está preparado y el que envía nunca manda.** Eso compila,
pasa las pruebas, no rompe nada, y **no produce nada**.

### La regla exacta, para que se pueda automatizar

Es más fina de lo que parece, y el primer intento de detectarla falló justamente por no
afinarla. **No** es "un campo que nadie escribe en ningún lado" —así da cientos de falsas
alarmas y encima se le escapa el caso de la fotocabina, porque ese campo sí se escribe en
otro lado, en la invitación—.

**Es esto:**

> Una función acepta un parámetro **opcional**, y **ninguna de las llamadas a ESA función**
> se lo pasa.

Per función, no por texto global. Ahí `imagenFondoUrl` salta: `componerTiraDeFotos` tiene
una sola llamada y no lo manda. `backgroundVideoUrl` salta: cero llamadas lo mandaban.
`tipo` saltaba: tres llamadas y ninguna lo mandaba.

### Y el corolario, que es la mitad del valor

**Si un parámetro protege plata o permisos, no alcanza con detectarlo: hay que volverlo
obligatorio.** Cuando el `tipo` del freno de gasto pasó de opcional a obligatorio, apareció
al instante un tercer lugar que lo salteaba y que revisando a ojo no se veía. **Un control
que se puede omitir, se omite.**

### El primer intento falló, y queda anotado para no repetirlo

Se escribió un detector que contaba, en todo el código, cuántas veces se escribía cada campo
opcional. Dio **210 hallazgos**; de tres revisados a mano, **dos eran falsa alarma**, y **no
encontraba el caso de la fotocabina**. Se descartó. **El que sirve es el de arriba: por
función y por llamada, no por texto suelto.**


## La sexta pregunta, y la que de verdad cierra el circulo: ¿la prueba TERMINA EL TRABAJO?

**El dueño insistió:** *"¿hay alguna manera de revisar toda la app con un mecanismo de uso,
no sé el término, para que no sigan fallando las auditorías?"*

**El término es prueba de punta a punta**: la máquina abre la app y la usa como una persona.
**Y ya existe:** 21 archivos, 61 pruebas, en `tests/e2e/`. **Y sí tocan la fotocabina.**

**Entonces por qué se les escapó el fondo pelado.** Esto es lo que comprueban hoy las
pruebas de la fotocabina, textual:

- que la pantalla conteste sin error (`status < 400`)
- que no diga "no autorizado"
- que haya **un botón visible**
- que haya **un video en pantalla**

**Nunca se sacan la foto. Nunca miran la tira que sale.**

Por eso el fondo pelado pasó por delante de la auditoría, de las 2250 pruebas y de la prueba
de uso sin que ninguna lo viera: **todas confirman que la pantalla ABRE; ninguna confirma que
el resultado esté BIEN.** Es lo mismo que pasó con el pie de página de la web: existía,
alguien lo llamaba, y el visitante no lo veía.

### La regla, y es corta

> **Por cada cosa para la que sirve la app, una prueba que llegue hasta el final y mire el
> resultado** — no que la pantalla abrió.

Para la fotocabina: sacarse la tanda de tres y comprobar que **la tira tiene el fondo de la
fiesta y el nombre del homenajeado**. Para el simulador: llegar al presupuesto y comprobar
**el número**. Para la entrada: entrar de verdad y comprobar que **se llegó adentro**.

**Una sola de estas por módulo vale más que veinte que abren pantallas.** Son más lentas de
escribir y más lentas de correr, y por eso nadie las hace. Son las únicas que habrían
encontrado los tres problemas de hoy.

### Cómo saber si una prueba termina el trabajo

Miralo por lo que comprueba al final:

- Si comprueba que **algo es visible**, que **hay un botón** o que **la pantalla no dio
  error** → sólo confirma que abrió. **No cuenta.**
- Si comprueba **un texto, un número o una imagen que la app produjo** → esa sí.


---

## Estas preguntas ya no se hacen a mano (28 de agosto de 2026)

Las preguntas 2 (¿alguien lo llama?) y 6 (¿la prueba termina el trabajo?) las contesta
ahora una maquina, y **frena** en vez de informar:

```
npm run lo-que-se-dijo         # lo que cambia. Es paso de la puerta y del filtro.
npm run lo-que-se-dijo:todo    # la app entera. Informa, no frena.
```

**Que no cuenta como prueba, y es lo que hay que recordar:** la prueba que recorre las 348
pantallas de corrido **no prueba ninguna**. Solo mira que abran. Por ahi se colo la
fotocabina rota, con la auditoria en verde.
