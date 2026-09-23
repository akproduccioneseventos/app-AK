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

---

## La septima pregunta: ¿QUE PASA CUANDO FALLA, Y QUE PASA SI SON DOS A LA VEZ? (8 de septiembre de 2026)

**Esta pregunta falta desde el principio, y por eso se escaparon cinco defectos contables.**
Los encontro Codex y eran todos ciertos: un cobro que desaparecia, una cuota anunciada como
cobrada sin guardarse, una conciliacion que fallaba en silencio, un flujo de caja en cero falso,
y las facturas de la empresa legibles por cualquiera del equipo.

**Por que las preguntas anteriores no los agarraban.** Las seis miran el camino en que todo sale
bien: ¿esta escrito?, ¿alguien lo llama?, ¿deja rastro?, ¿el dato llega?, ¿la prueba termina el
trabajo? **Los cinco defectos pasaban las seis.** El codigo estaba escrito, lo llamaban, dejaba
rastro, tenia pruebas y las pruebas daban verde. **Todos vivian en el camino de al lado: el que
se recorre cuando algo falla, o cuando dos personas hacen lo mismo al mismo tiempo.**

Las dos mitades, y las dos se preguntan sobre cada cosa que toca plata:

**a) ¿Que pasa cuando el guardado falla?** No alcanza con que exista el `try`. Hay que ver
**quien mira el resultado**. En esta app varias funciones de guardado **devuelven** el error en
vez de tirarlo: si el que llama no lo mira, la app contesta que salio bien y no guardo nada. Y lo
mas caro no es el dato perdido: es **lo que sale para afuera igual** —el mail al cliente
diciendo que su cuota quedo paga—.

**b) ¿Que pasa si dos personas lo hacen al mismo tiempo?** Cualquier cosa que **lea, calcule y
despues guarde la lista entera** pierde una de las dos operaciones. El turno -el candado- no
alcanza si la lectura quedo afuera: el segundo guarda su copia vieja encima del primero. La
pregunta concreta es: **¿la lectura esta adentro del mismo turno que el guardado?**

**Y una tercera, que es la misma familia:** ¿un cero en pantalla puede significar "no se pudo
leer"? Si la respuesta es si, la pantalla esta mintiendo, porque cero y "no hay datos" se ven
igual.

**Donde se aplica primero:** cobros, cuotas, facturas, presupuestos y sueldos. Ahi un "dijo que
si y no paso nada" es plata.

**Y el corolario, que es lo que de verdad fallo:** *"la app esta terminada"* significa que no se
sale a buscar problemas de gusto. **No significa que un area ya mirada quede mirada para
siempre con las preguntas viejas.** Cuando se agrega una pregunta nueva al metodo, **se vuelve a
pasar lo que toca plata**, aunque ya se haya auditado. Eso no es auditar por auditar: es que la
pregunta no existia cuando se miro.

---

## La octava pregunta: ¿EL SERVIDOR SE LO MANDÓ? (9 de septiembre de 2026)

**Salió de un hallazgo de Codex que yo no vi**, y la anoto acá porque la pregunta que me faltaba
era de fondo, no un descuido.

**Qué pasó.** Al portal del cliente se le mandaba **el itinerario completo de la fiesta**: los
momentos que el equipo marca como internos y las notas internas de cada uno. Una de las dos
pantallas del portal los mostraba tal cual. La otra **los escondía**, y por eso parecía que estaba
bien.

**Por qué mi método no lo agarró.** Yo comprobaba lo que la pantalla muestra. Nunca me pregunté
**qué le manda el servidor al navegador**. Y ahí está el error de fondo:

> **Esconder algo que ya se mandó no es esconderlo.** El dato ya está en la computadora del
> cliente: cualquiera que sepa mirar lo ve, y la próxima pantalla que alguien escriba lo va a
> mostrar sin querer, porque está ahí.

**La pregunta, y dónde se aplica.** En todo lo que sale hacia afuera —el portal del cliente, la
invitación del invitado, la página pública del evento, la galería, cualquier respuesta que llega a
un navegador que no es del equipo— la pregunta no es *"¿la pantalla lo muestra?"*. Es:

1. **¿Qué campos salen del servidor?** Se mira la función que arma lo que se manda, no la pantalla.
2. **¿Sale algo que el de afuera no tiene por qué tener?** Notas internas, nombres del personal,
   costos, teléfonos de otros invitados, estados internos, claves de acceso.
3. **¿Se filtra en el servidor o recién en la pantalla?** Si es lo segundo, está mal: **la pantalla
   es la segunda barrera, no la primera.**

**Y el detalle que se repite:** cuando falta el texto pensado para el de afuera, es muy común que
el código use **el texto interno como reemplazo**. Ahí es donde una anotación del equipo termina
leyéndola el cliente. Si no hay texto para mostrar, va sin texto.

**Qué se hace al agregar esta pregunta:** se vuelve a pasar con ella **todo lo que proyecta datos
hacia un cliente o un invitado**, aunque ya estuviera auditado.

## La novena pregunta: ¿PUEDE TERMINAR A MEDIAS Y DECIR QUE TERMINO? (16 de septiembre de 2026)

**Salio de tres defectos de respaldos que encontro Codex**, y los tres pasaban las siete
preguntas anteriores: estaban escritos, alguien los llamaba, dejaban rastro, tenian prueba en
verde y **no fallaban**. Salian a medias y terminaban bien.

- Una copia a la que no se le pudo leer una parte se guardaba **marcada como completa**, y la
  rotacion borraba una copia vieja que si estaba entera.
- Una restauracion que dejaba archivos afuera anunciaba **"Restauracion Completa"** y recargaba
  la pantalla, tapando el aviso.

**La pregunta, y donde se aplica primero:** en todo lo que recorre una lista y sigue despues de
un tropiezo —respaldos, restauraciones, importaciones, envios en tanda, sincronizaciones—, hay
que buscar el **camino del medio**: ni todo ni nada.

Tres cosas que tiene que cumplir cualquiera de esos:

1. **Lo que salio a medias no dice que salio.** El resultado distingue completo, parcial y
   fallido, y el parcial **nombra lo que falto**.
2. **Lo que salio a medias no pisa ni borra lo anterior.** Es lo que convierte un aviso molesto
   en una perdida de datos.
3. **El aviso se puede leer.** Nada de recargar la pantalla arriba del cartel.

## La decima pregunta: ¿DE CUANTAS FORMAS PUEDE VENIR MAL ESTE DATO, Y CUAL NO HACE RUIDO? (17 de septiembre de 2026)

**Salio de dos arreglos mios que Codex tuvo que volver a encontrar al dia siguiente.** Los dos
tapaban el caso que me habian reportado y dejaban abierto el de al lado:

- El respaldo frenaba cuando la lectura **tiraba un error**. Pero leer en esta app casi nunca tira
  error: cuando la base no contesta, **devuelve la lista vacia** para no romper la pantalla. El
  respaldo seguia guardando cero datos, marcado como copia completa.
- El reporte ya comparaba dias en vez de horas, pero tomaba el dia **tal cual venia escrito**, y
  los cobros vienen con hora de Greenwich. Los de la noche del ultimo dia seguian afuera.

**La forma del defecto es siempre la misma:** un dato puede venir mal de varias maneras, y **la
que hace ruido se arregla; la que se calla queda**. La excepcion se ve; la lista vacia no. La
fecha rota se ve; la fecha corrida tres horas no.

**Como se hace la pregunta, sobre lo que uno acaba de tocar:**

1. **Listar las formas en que ese dato puede venir mal**, no la que se reporto: vacio, nulo, con
   zona horaria, sin zona, a medias, duplicado, viejo.
2. **Marcar cual de esas NO hace ruido** —no tira error, no deja rastro, sale en verde—. Esa es la
   que hay que probar primero.
3. **Un arreglo se prueba con el dato entrando por la otra puerta**, no repitiendo el caso que lo
   origino. Si la unica prueba nueva es la del caso reportado, el arreglo esta a medias.

**Se aplica primero a lo que toca plata**, y **antes que nada a verificar un arreglo propio**: es
exactamente ahi donde se escaparon los dos.

## La once pregunta: ESTO LO PUEDE MANDAR CUALQUIERA, ¿QUE CAMPOS SE COPIAN SIN MIRAR? (17 de septiembre de 2026)

**Salio de la encuesta post fiesta, que encontro Codex.** La app es casi toda con sesion, asi que
la costumbre es confiar en lo que llega. Pero hay unas pocas puertas abiertas al publico —la
encuesta, la confirmacion de asistencia, el buzon de recuerdos, el muro de fotos— y ahi lo que
llega **no lo manda la pantalla necesariamente**.

En la encuesta se guardaba lo que llegaba **tal cual**, con un copiado entero. Con eso entraba una
nota de 99 —que ensucia los promedios del panel— y, peor, un campo interno que marca "a este
cliente ya se le pidio la resena en Google": mandandolo, **la resena no se pide nunca mas**.

**Como se hace la pregunta, sobre cualquier cosa que conteste alguien sin cuenta:**

1. **Buscar el copiado entero** —`...loQueLlego`— en lo que se guarda. Ahi entra todo lo que
   manden.
2. **Listar que campos son del que contesta y cuales son de la app.** Los de la app —marcas de
   "ya se hizo", identificadores, estados— **no pueden venir de afuera nunca**.
3. **Preguntar por cada numero: ¿que pasa si viene 99, -5 o con coma?** Si el panel lo muestra o
   lo promedia, tiene que rechazarse, no acomodarse.
4. **Y lo de siempre en estas puertas:** si dos personas contestan al mismo tiempo, ¿se pierde
   una? La lectura va adentro del turno.

## Las cuatro preguntas de la forma de Codex (17 de septiembre de 2026)

**Orden del dueno: "suma mas preguntas como hace Codex".** Estas cuatro no salen de un hallazgo
suelto: salen de mirar **que tienen en comun los veinticinco que encontro**. Todos pasan las
preguntas viejas —estan escritos, los llama alguien, dejan rastro, tienen prueba en verde— y
fallan igual. La forma es siempre la misma: **el camino en que todo sale bien esta mirado; el de
al lado, no.**

### La doce: ¿QUE PASA SI TOCA DOS VECES?

No es lo mismo que "dos personas a la vez". Es **una sola persona con el dedo nervioso o la senal
lenta**: aprieta "Enviar", no ve respuesta, aprieta de nuevo.

- ¿Se cobra dos veces, se manda el mensaje dos veces, se genera la imagen dos veces —que se paga—?
- ¿El boton se apaga mientras trabaja, y se vuelve a prender **pase lo que pase**?
- ¿La segunda vez se guarda un registro repetido que despues alguien tiene que limpiar a mano?

### La trece: ¿ESTE CALCULO USA LA HORA DE URUGUAY?

El servidor trabaja en hora de Greenwich; el negocio, en hora de Salto. **Tres horas de
diferencia alcanzan para que un cobro de la noche caiga en el mes siguiente.**

- Todo lo que corte por dia, mes o semana —reportes, cierres, vencimientos de cuota,
  recordatorios, "lo de hoy"— se pregunta **en que hora esta cortando**.
- Una fecha guardada con `Z` al final **no es el dia que dice**: es tres horas mas tarde que aca.

### La catorce: ¿QUE VE EL QUE ADIVINA EL ENLACE?

Varias pantallas se abren sin cuenta a proposito —la invitacion, el album, la encuesta, el muro—.
La pregunta no es si esta bien que sean publicas: es **que trae de mas la que se abre**.

- ¿Viene pegado algo interno: el presupuesto, el telefono del cliente, la lista del personal, el
  itinerario de la empresa?
- Y la otra mitad: lo que **manda** el que no tiene cuenta, ¿se copia entero? Ahi entran los
  campos internos. (Es la pregunta once, y van juntas: lo que sale y lo que entra.)

### La quince: ¿QUE PASA CUANDO LA LISTA SE HACE LARGA?

La app guarda listas enteras en un solo lugar: cada cambio lee todo y escribe todo. Con veinte
fiestas anda. **La pregunta es con mil.**

- ¿Se escribe la lista completa para cambiar un renglon? Eso es lo que hace que dos guardados se
  pisen, y lo que un dia no entra mas.
- ¿La pantalla los trae todos para mostrar diez?

**Como se usan estas cuatro:** igual que las once anteriores, **sobre lo que uno acaba de tocar**,
antes de decir "terminé". No son una auditoria general: eso sigue prohibido.

## La dieciseis: EL CAMPO QUE ESTE CONTROL COMPARA, ¿EXISTE EN EL DATO QUE LE LLEGA? (18 de septiembre de 2026)

**Salio del borrado de equipos, que encontro Codex.** El control que impide borrar un equipo
asignado comparaba `item.id` y `item.activoId`. **Ninguno de los dos existe** en la lista de
carga: ahi el equipo del catalogo se guarda en `origenId`. La comparacion nunca acertaba, asi que
el control decia siempre "no esta asignado".

**Lo peligroso es que se ve igual que uno que funciona**: esta escrito, lo llama alguien, deja
rastro y tiene prueba en verde. Solo falla cuando importa.

**Como se hace la pregunta:**

1. En todo control de "no se puede borrar", "ya esta usado" o "no se puede duplicar", **abrir el
   tipo del dato que le llega** y confirmar que el campo comparado existe ahi.
2. Ojo con `(item as any).loQueSea`: eso apaga al revisor de tipos, que es justo quien avisaria.
3. **Probar el control con el dato de verdad**, no con uno armado a mano en la prueba con los
   campos que el control espera. Si la prueba construye el dato a medida, la comparacion siempre
   acierta y no se prueba nada.


## Cuatro estados, no dos: lo propuso Codex el 19 de septiembre de 2026

Hasta ahora una cosa estaba "hecha" o "no hecha", y ahí se escondía el problema: **una prueba
aislada no es lo mismo que el recorrido real, y ninguna de las dos es lo mismo que verlo andar
publicado.** Cuando todo se anota igual, una aprobación termina cubriendo más de lo que de verdad
se comprobó.

**De ahora en adelante, cada arreglo se anota en uno de cuatro estados:**

1. **Programado** — el código está escrito.
2. **Probado suelto** — hay una prueba que **falla antes del arreglo y pasa después**. Esa es la
   única prueba que vale: si no se la vio en rojo, no prueba nada.
3. **Probado de punta a punta** — se recorrió la pantalla de verdad y **se miró lo que quedó
   guardado**, no sólo lo que dijo el cartel.
4. **Visto andando publicado** — alguien lo usó en la app de verdad.

**Y la regla que va con eso:** al contar un arreglo, se dice en qué estado está. Decir "arreglado"
sin aclarar que es el estado 2 es exactamente la forma en que esta app engañó a todo el mundo
durante meses.


## LA MATRIZ DE DIEZ ESCENARIOS (la trajo Codex el 19 de septiembre de 2026, y reemplaza a la lista larga)

**Las dieciséis preguntas funcionaban, pero son una lista larga y se leen de arriba abajo.** Esto
es mejor: **diez escenarios, y se eligen según lo que el cambio puede perder** —datos, plata,
acceso o confianza—. No se corren los diez en cada botón.

| Escenario | Cómo provocarlo | Qué mirar |
| --- | --- | --- |
| Normal | Datos válidos de verdad | Que el resultado **quede guardado**, no sólo que salga el cartel |
| Vacío y límite | 0, 1, el máximo, el máximo más uno | Que la pantalla y el servidor digan **el mismo límite**, y que un vacío a propósito no se rellene con ejemplos |
| Falla antes | Que falle la lectura o el primer guardado | Que no escriba encima ni anuncie éxito |
| Falla a medias | Que falle el segundo guardado | Que diga **qué quedó hecho** y qué no |
| Reintento | Repetir el mismo pedido después de un fallo | Que **no duplique** ni cobre dos veces |
| Dos operadores | Los dos leen, después los dos escriben | Que se conserven los dos cambios, o que uno sea rechazado con un motivo claro |
| Respuestas cruzadas | Demorar la primera, que llegue la segunda, y recién ahí soltar la primera | Que **el estado nuevo no retroceda** |
| Pantalla vieja | Que otro reserve o borre antes del clic | Que no confirme algo que ya no existe |
| Servicio de afuera | Que tarde, rechace o quede pendiente | Sin falso éxito ni descarga incompleta callada |
| Rol y dispositivo | Dos sesiones distintas, y en pantalla chica | Sin acceso de más ni botones que no se alcanzan |

**Dos cosas más que agregó, y son ciertas:**

- **Un total se compara contra una cuenta hecha aparte**, no contra el mismo cálculo que lo
  produjo. Si no, la prueba se da la razón sola.
- **Un turno en memoria no alcanza si la app corre en más de un servidor.** Los turnos que puso
  Claude ordenan a dos personas atendidas por la **misma** instancia. Hoy alcanza, porque el
  servidor de esta app se despierta de a uno; pero **no es lo mismo que una transacción en la
  base**, y hay que decirlo así cuando se cuenta que algo está arreglado.

## LOS CINCO NIVELES DE EVIDENCIA (no son lo mismo y no se mezclan)

1. **Mirado** — se leyó el código.
2. **Probado suelto** — una prueba que **falla antes del arreglo y pasa después**.
3. **Probado de punta a punta** — se recorrió pantalla, servidor y **lo que quedó guardado**.
4. **Probado en navegador** — se abrió la pantalla de verdad y se miró el resultado.
5. **Visto andando publicado** — alguien lo usó en la app real.

**Al cerrar, se dice qué recorridos pasaron en qué versión, y cuáles quedan.** Nunca "cero
errores en toda la app": eso es exactamente lo que ya engañó a todo el mundo una vez.

---

## Preguntas 17, 18 y 19 — las que sumó el 20 de septiembre de 2026

Las tres salieron de cosas que encontró Codex y mi método no. Van con lo de siempre: **primero
se pasan por lo que toca plata, cobros, comida y permisos**, aunque esa área ya estuviera
auditada. Que un área esté mirada no la deja mirada para siempre con las preguntas viejas.

### 17. Cada `as any` que LEE un campo, ¿lee un campo que existe?

Un `as any` apaga al revisor de tipos. Si el nombre del campo está mal —una "s" de más o de
menos— la lectura da vacío **para siempre** y nadie se entera: no hay error, no hay rojo, la
cuenta simplemente da cero.

Fue exactamente eso: el indicador de preparación leía `fiesta.planPago` en vez de
`planDePagos`. **Daba 100% de fiesta lista con el cliente debiendo una cuota.**

La comprobación es mecánica: buscar `as any)` seguido de un punto y un nombre, y por cada uno
preguntar **si ese campo existe en el tipo y si alguien lo escribe alguna vez**. Si no, esa
cuenta viene dando cero desde siempre.

### 18. Cuando se juntan cosas para sumarlas, ¿la clave incluye todo lo que las hace distintas?

La lista de compras juntaba los renglones por nombre y proveedor, **sin la unidad**. 200 g de
manteca de un plato y 2 kg de otro se sumaban como "202". Según cuál unidad quedara, se compraba
diez veces de más o la fiesta se quedaba sin comida.

La pregunta vale para toda clave armada a mano: **unidad de medida, moneda, impuesto, fecha,
fiesta.** Si falta una, el total miente y nadie lo ve, porque el número se muestra prolijo.

### 19. Si la pantalla se abre con datos en la dirección, ¿sobreviven a un rebote por el ingreso? Y si falta el dato, ¿lo dice o se queda cargando?

Son dos mitades del mismo agujero, y las dos pasaron el mismo día:

- El portero mandaba al ingreso guardando sólo la ruta y tiraba el `?fiestaId=...`. Al volver,
  la pantalla abría **sin fiesta**.
- La lista de regalos, sin fiesta, salía de la carga **sin apagar la rueda**: giraba para
  siempre y no decía nada.

Se mira igual en toda pantalla que se abre con un dato en la dirección: **entrar sin ese dato**
y ver qué pasa. Una pantalla que se queda cargando es un error, aunque el código esté bien
escrito: el equipo la mira y cree que el sistema está pensando.

## Preguntas 20 y 21 — las que sumó el 22 de septiembre de 2026

**Las trajo Codex, sobre el calendario, y ninguna de las diecinueve anteriores las hubiera
agarrado.** Las dos son de la misma familia: no preguntan si algo funciona, preguntan
**sobre qué está funcionando**.

### 20. Si dos cosas distintas se dibujan igual, ¿la acción sabe cuál agarró?

En el calendario, una **reunión** y una **fiesta** se ven iguales, se arrastran igual y las
dos llevan el número de la fiesta. Y había **una sola acción** para las dos: arrastrar una
entrevista **reprogramaba la celebración entera y le mandaba el aviso al cliente**.

La pregunta se hace en cualquier lista, calendario o tablero donde convivan dos tipos de
cosa:

1. **¿Qué tipos de cosa entran en esta lista?** No "qué muestra": qué cosas **distintas**
   terminan dibujadas ahí.
2. **¿La acción distingue una de otra antes de tocar nada?** Si las dos comparten un
   identificador —el número de la fiesta, el del cliente—, tener el identificador **no dice
   qué se agarró**.
3. **¿Cuál es el daño de equivocarse?** Si lo que se toca es una fecha que le sale por
   correo al cliente, o plata, no alcanza con que "casi siempre" sea el tipo correcto.

**Y el corolario:** si mover una cosa todavía no está programado, **no se la deja arrastrar
y se avisa**. Dejar que se arrastre y que haga otra cosa es lo peor de los tres caminos.

### 21. Un registro roto en la lista, ¿se lleva puesta la lista entera?

Una sola fiesta con la fecha ilegible dejaba el calendario **completamente vacío**: la
conversión tiraba error, el `catch` de afuera devolvía una lista vacía, y en pantalla no se
veía ni un error — se veía **una agenda sin nada**, que es exactamente igual a no tener
fiestas.

Dónde se busca: en todo `map`, `forEach` o `for` que arme una lista para mostrar, con un
`try` **por fuera del ciclo** en vez de adentro.

1. **¿El error se aísla en el registro, o se come la lista?** Adentro del ciclo, no afuera.
2. **¿Una lista vacía por falla se distingue de una lista vacía de verdad?** Si no, la
   pantalla miente con toda tranquilidad. Es la misma forma del respaldo que guardaba cero
   fiestas como si la empresa no tuviera ninguna.
3. **¿Queda dicho cuál es el registro que hay que arreglar?** Si no, nadie lo arregla nunca.

## Preguntas 22 y 23 — las que sumó el 23 de septiembre de 2026

### 22. ¿Quién MÁS guarda la lista entera donde vive este dato?

La pregunta 8 ya preguntaba si la lectura estaba adentro del turno. No alcanza: **el turno
cuida un solo servidor**, y la app corre en varios. Y aunque la función que cobra esté
perfecta, **cualquier otra** que guarde la lista entera de presupuestos —crear uno, archivar
otro, cambiar un ítem— la escribe con la versión que leyó un rato antes: pisa el cobro que
otro anotó y **borra el presupuesto que otro creó**, porque guardar la lista borraba "lo que
no está".

Dónde se busca: `writeData(` sobre una colección (las de `FILE_TO_COLLECTION` en
`src/lib/firebase-sync.ts`) o sobre un documento que guarda una lista entera.

1. **¿Este dato lo cambia más de una función?** Si sí, las que no son dueñas del dato no lo
   pueden reescribir con una lista vieja. Plata: `los-cobros-no-se-pisan.ts`.
2. **¿Guardar la lista puede borrar lo que otro creó?** En presupuestos y facturas ya no
   (`COLECCIONES_QUE_NO_SE_BORRAN_POR_OMISION`): se borra explícito.
3. **¿El cambio se hace sobre el dato leído EN ESE MOMENTO?** `mutateDataItem` para un
   registro, `mutateGenericJsonArray` para una lista guardada en un solo documento.

### 23. Lo que llega del invitado o del operador, ¿se comprueba que sea DE ESTA fiesta?

Un invitado votaba las veces que quisiera porque su enlace llegaba y nadie lo miraba; un
operador de otra fiesta cerraba votaciones de ésta porque la acción pedía "tener sesión" y
no "estar asignado a esta fiesta"; un invitado pedía tragos a nombre de otro.

1. **¿El identificador del invitado viene con su enlace, y se compara?** Sin enlace, el
   identificador no prueba nada.
2. **¿La acción del equipo pide permiso POR FIESTA** (`requireEventPermission`) y no sólo
   sesión?
3. **¿Repetir la misma operación la cuenta dos veces?** Un identificador fijo por operación
   (el pedido, la captura, el uso del cupón) la vuelve inofensiva.

