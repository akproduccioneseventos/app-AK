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

**Ampliada el 24/10 (Codex 345, orden 224):** el barrido viejo miró el rebote y no la condición del cargando. Se busca `isLoading || !` (y `loading || !`) antes del `return` de la ruedita en `src/app`: si la lectura terminó sin dato, esa condición gira para siempre. La rama "no encontrado" va antes que la ruedita.

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


## Pregunta 24 — la que sumó el 25 de septiembre de 2026

### 24. Lo que atiende al invitado, ¿llama a alguna acción que pida sesión del equipo?

La barra atendía al invitado y, adentro, llamaba a dos acciones del equipo. Para el invitado
**una tiraba error después de descontar botellas** y la otra **fallaba en silencio y devolvía
datos de fábrica**. Las dos pasaban todas las preguntas anteriores: estaban escritas, las llamaba
alguien y tenían pruebas en verde, porque las pruebas corrían con sesión.

1. **¿La función la usa alguien sin sesión?** (invitado, prospecto, estación con permiso).
2. **¿Adentro llama a una función exportada de `src/app/actions/` que empieza con
   `requireAppSession`, `requirePermiso` o `verifySession`?** Si sí, para ese visitante falla.
3. **¿El error se ve, o hay un `.catch(() => valorDeFabrica)` que lo tapa?** Lo segundo es peor:
   muestra datos que no son los cargados.

El arreglo no es sacarle la guardia a la acción del equipo: es una lectura interna en `src/lib/`
(como `leer-insumos.ts` o `leer-carta-master.ts`) que sólo se llama desde el servidor.

## Pregunta 25 — la que sumó el 25 de septiembre de 2026 (Codex, BAR01)

### 25. Si el servidor se corta entre este paso y el siguiente, ¿queda algo a medias sin rastro?

La barra vaciaba la lista de botellas por devolver y después las devolvía. Pasaba la pregunta 22
(dos servidores a la vez), pero un reinicio entre los dos pasos perdía la devolución.

1. **¿Hay dos escrituras que tienen que pasar juntas?** (sacar de una lista y aplicar en otro
   lado; descontar y guardar; cobrar en la factura y en el presupuesto).
2. **¿Van en la misma transacción de la base?** Si no, un corte en el medio deja una sola hecha.
3. **Si no se pueden juntar**, ¿queda anotado ANTES lo que falta hacer, para que el próximo lo
   termine? Borrar el pendiente antes de hacerlo es perderlo.

## Pregunta 26 — la que sumó el 25 de septiembre de 2026

### 26. ¿Esta falla vive en un lugar, o en el mecanismo que usan todos?

Antes de arreglar, **contar cuántos lugares tienen la misma forma**. Si son muchos, se arregla el
mecanismo común (como `marca-de-lectura.ts` para las listas enteras) y se le pone una prueba que lo
mire directamente, en vez de ir de a uno. Arreglar de a uno lo que era una sola falla hizo que
Codex la encontrara siete veces.

## Pregunta 27 — la que sumó el 26 de septiembre de 2026 (Codex, devolución 89)

### 27. Lo que pasa a segundo plano, ¿lleva TODO su contexto, y el aviso final sale del resultado real?

Cuando algo deja de hacerse "mientras la persona espera" y pasa a hacerse "atrás", se rompen tres
cosas a la vez, y las tres se escaparon en la cabina con IA:

1. **El aviso final.** Antes el invitado veía el resultado; ahora lee un cartel. El cartel tiene
   que salir de **dónde quedó de verdad** (subido, guardado en el equipo, rechazado, perdido), no
   de que el trabajo terminó.
2. **El contexto.** El trabajo de atrás tiene que llevar **copia** de su identidad, su invitado y
   su consentimiento, fijada al empezar. Si lee el estado de la pantalla al terminar, ya es el del
   siguiente invitado.
3. **La promesa de "queda guardado".** Si se dice que la original queda a salvo, tiene que quedar
   **antes** de mandar el trabajo, en un lugar que sobreviva a recargar.

4. **La respuesta tardía.** Cuando el trabajo termina, la estación puede estar con el siguiente. El
   **servidor** tiene que comparar de qué captura es la respuesta y no aplicársela a otra; una
   comparación en la pantalla no alcanza. Y cada captura nueva tiene que tener identidad nueva, venga
   de donde venga (Codex encontró que "lista → cuenta regresiva" heredaba la del anterior).

5. **Lo que protege al trabajo, ¿depende de que siga vivo o de un reloj?** (Codex, orden 91.) Un
   plazo fijo ("tres minutos") no sabe si el trabajo terminó o se abandonó: con la IA lenta vence
   igual y se publican dos cosas. Lo que protege se **renueva mientras el trabajo vive** y se
   **reclama en una sola transacción**, así nunca lo tienen dos a la vez. Y **guardar en el equipo
   no espera a la red**: si un aviso al servidor va antes del guardado, un servidor colgado deja
   la foto sin guardar.

Al verificar: se sigue el trabajo hasta el cartel final **en cada salida**: bien, sin señal,
rechazo y sin lugar. Mirar sólo el camino que falla, como hice yo, deja pasar el cartel.

## Pregunta 28 — la que sumó el 27 de septiembre de 2026 (Codex, orden 93)

### 28. Lo que se promete, ¿se comprobó en el ÚLTIMO eslabón o en uno del medio?

Dos defectos del mismo día tenían la misma forma: la comprobación miraba un paso intermedio y lo
tomaba por el resultado.

- **"Aislado"** se comprobó mirando el ambiente del proceso. Pero el que atiende es Next, y Next
  lee solo los `.env*` de la carpeta. El último eslabón era **lo que ve Next**, no lo que le pasé.
- **"Publicada"** se anunciaba cuando la cola **reclamaba** la subida, antes de mandarla. El
  último eslabón era **la respuesta del servidor**.

Al verificar: para cada palabra que la pantalla o un informe afirma ("guardado", "publicado",
"aislado", "mandado"), se pregunta **quién es el último que lo hace de verdad** y se mira ahí. Si
lo que se mira es un paso antes, **se retiene ese último paso en la prueba** (una respuesta que no
llega, un archivo que el marco lee solo) y se comprueba que la afirmación no salga antes de tiempo.

## Pregunta 29 — la que sumó el 28 de septiembre de 2026 (Codex, recorridos de la orden 94)

### 29. Un botón que lleva a otro lado, ¿se muestra con la MISMA condición que su destino?

El portal del cliente mostraba el pendiente **"Confirmar menú"**, que lleva a la sección del menú.
Pero con el modo simple, o con el menú oculto desde los ajustes del portal, esa sección no se
dibuja: el cliente tocaba y no pasaba nada. El pendiente preguntaba "¿falta el menú?"; la sección,
"¿se muestra el menú?". Eran dos condiciones distintas para la misma cosa.

Al verificar: por cada botón, pendiente, tarjeta o aviso con enlace (`href="#…"`, `href: '#…'`,
`router.push`, `Link`), se busca **qué decide si se muestra el destino** (sección con ese `id`,
o pantalla que chequea un ajuste o un módulo) y se mira que el botón **también** lo cumpla. Si el
destino puede estar oculto, el botón se oculta con él, o lleva a otro lado que sí exista.

## Pregunta 30 — la que sumó el 28 de septiembre de 2026 (Codex, web pública)

### 30. Un enlace que lleva un dato, ¿el destino lee ESE nombre?

Las landings de bodas y quinceañeras abrían el simulador con `?tipo=boda`, y el simulador sólo
leía `eventType`. Cada uno andaba por separado; juntos, el novio que venía de un anuncio de bodas
arrancaba en "Cumpleaños". Nadie lo vio porque las pruebas del simulador lo abrían con `eventType`.

Al verificar: por cada enlace con datos en la dirección (`?algo=`), se busca en la pantalla de
destino `searchParams.get('algo')` con **ese** nombre. Y la prueba abre el destino **con el enlace
que usa la pantalla de origen**, no con uno armado a mano.

## Pregunta 31 — la que sumó el 2 de octubre de 2026 (Codex, propuesta 1248)

### 31. Al pasar un dato escrito por una persona a otro formato, ¿se pierde algo de lo que escribió?

El contrato pasaba "15/12/2026 a las 21:00" a "15 de diciembre de 2026": la hora acordada
desaparecía. Cada formateo andaba bien con el ejemplo de su comentario, que no tenía hora.

Al verificar: por cada función que toma un texto que cargó una persona (fecha, horario, nombre,
dirección, monto) y lo devuelve en otro formato, se prueba con un ejemplo que traiga **algo más**
que el caso de libro, y se mira que eso siga en la salida.

Y la de siempre, que en la 1248 no se pasó: **todo almacén nuevo que trae una entrega pasa por las
preguntas 22 y 23**, aunque la orden no lo nombre.

## Pregunta 32 — la que sumó el 2 de octubre de 2026 (Codex, área cobros)

### 32. Después de guardar, ¿qué pasa si el paso siguiente TIRA en vez de devolver un error? ¿Y el tope usa un número recortado?

La factura miraba `resultado.success` del paso al presupuesto y compensaba si era `false`, pero si
la llamada tiraba una excepción el pago quedaba guardado sin compensar, y el reintento creaba otro.
La pregunta 8 miraba el error **devuelto**; ésta mira el error **tirado**, y el reintento.

Y el tope de un pago sumaba la tolerancia a un saldo **recortado a cero**: con la factura ya
pagada, cada pago nuevo volvía a tener margen.

Al verificar: todo `await` a otro paso de plata **después** de guardar va con `try/catch` y una
salida clara; un reintento de la misma operación no crea otro registro; y un tope nunca suma
tolerancia a un `Math.max(0, …)`.


## Pregunta 33 — la que sumó el 3 de octubre de 2026 (Codex, auditoría 64, PER01)

### 33. Una función que importa una pantalla del navegador, ¿quién más la puede llamar?

`getInvitados` vivía en un archivo `'use server'`, leía la fiesta con `LECTURA_COMPLETA` y la
importaba el muro social, que es una pantalla del navegador. Eso la deja llamable desde internet
con sólo el número de la fiesta, y devolvía el teléfono y la credencial de cada invitado. Yo
miraba si la **pantalla** pedía sesión; nadie preguntaba si la **función** la pedía.

Al verificar: toda función exportada de un archivo `'use server'` que lee con `LECTURA_COMPLETA`
pide sesión o permiso **adentro**, o devuelve sólo lo que es de quien llama (el invitado con su
credencial, un número, la configuración pública). Una tarea automática o una pantalla del
servidor que necesita la lista entera la lee cruda, sin pasar por la acción.

## Pregunta 34 — la que sumó el 3 de octubre de 2026 (Codex, segunda vuelta de cobros)

### 34. Cuando una operación "ya estaba", ¿qué se contesta?

Al arreglar el reintento de un cobro puse "si ya estaba, listo". Codex encontró tres formas en que
ese "listo" mentía: otro servidor lo había guardado pero todavía no lo había pasado al
presupuesto, el reintento traía otro importe, y el aviso prometía una conciliación que hace una
persona.

Al verificar: un "ya estaba" compara **lo pedido con lo guardado** y contesta **el estado real del
paso siguiente**, leído de la base, nunca de la copia que se leyó antes de empezar.

## Pregunta 35 — la que sumó el 5 de octubre de 2026 (Codex, auditoría 66)

### 35. ¿Pide sesión, o pide el permiso del perfil que corresponde?

Diez acciones de plata, stock y personas pedían "que haya sesión" y se daban por protegidas. Pero
el personal y el operador también tienen sesión: el operador ("nada de plata") leía los cobros de
los presupuestos, el personal podía cambiar costos de insumos y operar la barra. Yo miraba si
había un control, no **cuál**.

Al verificar: para cada acción de plata, stock o datos de personas, se pregunta **qué perfil** la
usa de verdad (`PERMISOS_POR_PERFIL` en `src/lib/auth/perfiles.ts`) y se pide ese permiso; si es de
una fiesta, `requireEventPermission`, que además mira que el operador esté asignado. Si un perfil
necesita una parte, se le da esa parte (el operador ve los servicios, no los cobros).

**Y se abre la puerta de paso (auditoría 69, 6/10/2026).** Una acción que llama a una función con
nombre de permiso (`requireFiestaWriteAccess`) no está protegida hasta ver qué pide esa función por
dentro: ésa terminaba en "tiene sesión" y dejaba al personal leer y guardar la fiesta entera. Se
sigue cada puerta hasta el control real.

### 36. ¿El mismo número de plata se calcula en dos lugares? ¿Dan lo mismo?

El panel calculaba el saldo con el precio sin ajuste anual y la ficha del presupuesto con el
ajuste: con $15.000 por cobrar, el panel decía cero (Codex, auditoría 70, LEDGER01). Cada uno
estaba bien escrito; lo que nadie preguntó fue si coincidían.

Al verificar: por cada número de plata que muestra la app (saldo, cobrado, total), se busca
**dónde más se calcula** y se arma una prueba con los dos lados sobre el mismo presupuesto, con
y sin ajuste, en años distintos. Si hay una función que ya lo sabe (`getBudgetCollectibleTotal`),
los dos lados la usan.

Y la pregunta 22 vale también para lo que vive **adentro de la fiesta** (el plan de cuotas): una
pantalla que guarda la lista entera que leyó antes deshace lo que otro cobró entretanto.

### 37. ¿Los datos de la prueba tienen la forma real?

Una prueba armaba presupuestos con campos inventados —los mismos que leía el código roto— y daba
verde con el saldo en cero (revisión de plata, 6/10/2026). Al revisar una prueba: cada campo de sus
datos tiene que existir en el tipo (`src/types/`). Si no existe, la prueba copia el error en vez de
encontrarlo.

## Preguntas 38 y 39 — las que sumó el 6 de octubre de 2026 (Codex, auditoría 71)

### 38. ¿Hay una puerta general que guarde lo que otra acción cuida con más permiso?

El cobro de una cuota pedía contabilidad, pero el guardado general de la fiesta (entero o de a
partes) aceptaba el plan de pagos con sólo organización, y el portal del cliente marcaba el
contrato en papel firmado. **El permiso va en el CAMPO, no en la pantalla ni en la acción
específica**: para cada campo de plata o de contrato, buscar todas las funciones que lo pueden
escribir —sobre todo las que guardan el objeto entero o un parcial que manda el navegador— y
comprobar que todas piden lo mismo.

### 39. ¿El permiso y la comparación salen de lo que se PIDE, o de una lectura que otro puede cambiar?

La lista de compras decidía si "cambiaba un pago" comparando con una lectura hecha antes de la
operación, y después guardaba la lista que mandaba la pantalla: un pago anotado en el medio se
deshacía. **Lo que se guarda es lo pedido, casilla por casilla, sobre lo de ese momento**; el
permiso sale de qué casillas se piden cambiar; si otro cambió la misma casilla, se pide recargar.

## Pregunta 40 — la que sumó el 7 de octubre de 2026 (Codex, PR 1263)

### 40. ¿Lo que pasa adentro de una transacción sobrevive a un intento descartado?

Con dos servidores, la base **repite** la transacción si otro guardó en el medio, y descarta el
primer intento. Todo lo que el cambio anota **afuera** —un contador, una marca de "encontrado",
"actualizado" o "borrado", un renglón agregado a una lista de afuera— queda del intento
descartado si no se vuelve a poner en cero al empezar cada intento. Así la sincronización de
Instagram informaba dos reels con uno guardado, y actualizar un registro que otro acababa de
borrar decía "guardado". **Al principio del cambio, todo lo de afuera vuelve a su valor inicial**;
y adentro no va nada que no se pueda repetir (mandar un mensaje, borrar un archivo, escribir otro
documento): eso va después de la transacción, con lo del intento que quedó.

## Preguntas 41 y 42 — las que sumó el 7 de octubre de 2026 (Codex, auditoría 78)

### 41. ¿Lo que la pantalla ofrece, el servidor lo acepta? ¿Y lo que se abre sin cuenta, pide algo que exige cuenta?

El simulador mostraba platos que se armaban sólo al mostrar y el servidor no conocía: los ofrecía
y al guardar los rechazaba. Y la pantalla del presupuesto, que el cliente abre con un enlace,
pedía la ficha privada de la empresa: sin sesión se caía todo. **Para cada lista que se ofrece,
buscar dónde se valida al guardar y comprobar que salen de la misma función. Para cada pantalla
que se abre con enlace, recorrer TODO lo que pide al cargar**, no sólo el dato principal.

### 42. ¿El mismo número se cuenta con la misma unidad en todas las pantallas? ¿El campo significa lo mismo para todos los que lo leen?

El portal contaba invitaciones y el equipo personas. La fecha de la fiesta se guardaba en el
campo de las citas y la agenda la mostraba como entrevista. **Cuando dos pantallas muestran "el
mismo" número, que salga de la misma función; cuando un campo se escribe, mirar quién más lo lee
y qué cree que significa.**

## Preguntas 43 y 44 — las que sumó el 9 de octubre de 2026 (Codex, auditoría 81)

### 43. Lo que corre sin sesión, ¿lleva la llave hasta el fondo?

Una tarea del despertador pasa su guardia con la llave interna y después llama a otra función que
**vuelve a pedir sesión** (o la llama sin la llave). Desde el despertador eso falla **siempre**, y
si el error se traga con `.catch(() => [])` el resultado dice "todo al día" o "ok". Así los
recordatorios de cuota no se armaban, los de los invitados contestaban "ok" sin guardar nada, y
el parte de la mañana decía "todo al día" y lo dejaba guardado para el resto del día. **Se sigue
cada llamada de una tarea sin sesión hasta la lectura final**, y una falla de lectura no se
convierte en lista vacía: se avisa y no se guarda como resultado del día.

### 44. ¿"Cobrado" quiere decir confirmado?

Sumar los pagos del cliente sacando sólo los rechazados cuenta como cobrado lo que el cliente
**informó y nadie confirmó**. El saldo baja, la alerta de seña no sale y el recordatorio dice de
menos. **Toda suma de cobros usa `isConfirmedClientPayment`.**

## Pregunta 45 — la que sumó el 9 de octubre de 2026 (Codex, retest de la 81)

### 45. El candado que se puso, ¿lo pasan TODAS las puertas que llegan a la acción?

Se puso un reclamo para que la vuelta programada no publicara dos veces, y "publicar ahora"
llamaba a la misma función por al lado, sin reclamo: dos toques mandaban el posteo dos veces.
Y un recordatorio con id al azar se guardaba dos veces si la tarea corría dos veces el mismo día.
**Al poner un candado, se buscan todos los que llaman a la función protegida**, y el candado va
adentro de la función, no en uno de los que la llaman. Lo que se prepara por día lleva un id
estable, no uno al azar.

## Pregunta 46 — la que sumó el 9 de octubre de 2026 (Codex, auditoría 83)

### 46. Lo que hace un invitado o una estación, ¿se puede GUARDAR con su permiso?

El invitado de Bogue tenía permiso para grabar, pero el guardado pedía sesión del equipo o del
portal: se le rechazaba siempre, y la pantalla no decía nada. Igual la trivia y la pantalla en
vivo. Y la prueba de la trivia no lo veía porque reemplazaba el guardado por uno que siempre decía
que sí. **Se sigue la acción del invitado hasta el guardado**, y en la prueba el guardado de
mentira rechaza como el de verdad cuando falta el permiso.

## Pregunta 47 — la que sumó el 10 de octubre de 2026 (Codex, auditoría 86)

### 47. Lo que cambia algo para TODO el negocio, ¿pide el permiso de quien lo maneja, o sólo sesión?

El candado de la plata mira cobros y facturas. Nadie miraba los ajustes generales: el personal
podía apagar los agentes automáticos, y con la misma forma otros 32 ajustes (datos de la empresa,
WhatsApp, roles, conexiones a redes, promociones) pedían sólo sesión. **Toda acción que guarda una
configuración general se mira con el perfil "personal"**: si guarda, es un hallazgo.

## Pregunta 48 — la que sumó el 10 de octubre de 2026 (Codex, órdenes 144 y 145)

### 48. Cuando un dato puede ser "sí / no / no sé", ¿el "no sé" se trata como "no"?

La revisión automática de una foto puede decir segura, riesgosa o **no pude mirar**. El muro lo
convertía en `false` ("adulto") y rechazaba la foto, todos los videos de las estaciones y las fotos
del tótem de la barra, sin crear el posteo, mientras la pantalla anunciaba "enviada". **Se buscan los
`=== false` / `!== true` sobre un resultado que puede faltar**: el "no sé" es un tercer estado
(pendiente de revisión manual), nunca aprobado y nunca rechazado. Y se sigue la respuesta hasta la
pantalla: si un paso de adentro falló, `success: true` es mentira.

Y la hermana, de la foto negra: **al arreglar una forma en una estación, se busca la misma forma en
todas** (`drawImage(video` en `src/app` y `src/components`); lo recorre
`las-estaciones-aseguran-el-cuadro-antes-de-dibujar.test.ts`.

## Preguntas 49 a 56 — las que sumó el 12 de octubre de 2026 (Codex, órdenes 146 a 152)

Todas salieron de cosas que Codex encontró y yo no. Cada una lleva su búsqueda para barrer la app.

### 49. Lo que arranca después de un `await` y se puede cortar, ¿mira si ya lo cortaron?

La voz en vivo abría el micrófono aunque la persona ya hubiera tocado "Cortar", y diez pantallas
dejaban la cámara prendida si se salía mientras se pedía el permiso. **Después de cada `await` que
abre algo (`getUserMedia`, `new WebSocket`, un escáner), se mira una señal de cancelado; si llegó
tarde, se apaga lo que se abrió.** Barrido: `getUserMedia`, `new WebSocket`, `Ref.current = await`.

### 50. Un lector que atrapa el error, ¿distingue "no hay nada" de "no pude leer"?

Video de Vida, la galería, el muro, el portal del cliente y las fechas ocupadas del presupuesto
decían "no hay nada" cuando la base no contestaba. El defecto vivía en lectores compartidos
(`listCollectionFromFirestore`, `getSocialPosts`). **Se buscan `catch` que devuelven `[]`, `null` o
`{}` en `src/app/actions` y `src/lib`, y se sigue hasta la pantalla**: "vacío" y "falló" se muestran
distinto, y el que falló ofrece reintentar.

### 51. Lo que la app entrega para que lo lea otra máquina (un QR, un archivo), ¿lo leyó el lector real con muchos contenidos distintos?

El QR descargado pasó una prueba por caso y fallaba en 2 de 12 en celular. **Se prueba con el lector
de verdad y con cien contenidos distintos**, no con uno. Barrido: `QRCode`, `toDataURL`, `download=`.

### 52. Una regla de estilo general, ¿le cambia el lugar o el tamaño a una pantalla que la usa?

El muro a pantalla completa medía 0 px porque una regla de marca (`> * { position: relative }`)
le ganaba a `fixed`. Pasaba `toBeVisible`. **La prueba mide la caja y lo pintado
(`elementFromPoint`)**, y toda regla `> *` o de alcance general se cruza con sus consumidores que
usan `fixed`, `absolute` o `sticky`.

### 53. Lo que se saca de la compilación (`alias: false`, `externals`), ¿se probó con la primera llamada de un proceso nuevo?

La IA caía en la primera consulta de cada servidor porque un paquete anulado era un constructor que
otra biblioteca usaba. **Por cada exclusión de `next.config.js`, se busca quién usa ese módulo y qué
le pide**; si alguien lo construye, va un reemplazo inofensivo, no `false`.

### 54. En el camino de respaldo (cuando la IA o un servicio no contesta), ¿se filtra por fiesta y se sacan repetidos ANTES de cortar?

El resumen automático del agente de una fiesta mostraba pendientes de otra, y el mismo seis veces.
Barrido: `.slice(0, n)` en `src/ai` y `src/lib/agents` sobre listas que mezclan fiestas.

### 55. Al subir la versión mayor de una biblioteca de pantalla, ¿cada pantalla que la usa tiene una prueba que haga clic y cuente lo dibujado?

React 19, el calendario y el 3D cambiaron juntos; el 3D mostraba la escena sin mesas porque la
pantalla mandaba los datos con otro nombre. **"Hay un canvas" no alcanza: se cuentan las mesas, los
días, los íconos.** Barrido: el diff de `package.json` y quién importa cada biblioteca cambiada.

### 56. Un elemento flotante (barra, botón, asistente), ¿tapa un botón de acción?

La barra flotante tapaba parte de "Guardar como Presupuesto Formal". **Se comprueba con
`elementFromPoint` en el centro de cada botón principal**, en computadora y celular. Barrido:
`fixed bottom`, `sticky bottom` cruzado con los botones de guardar.

Y la ampliación de la 13 (la hora): **también las vigencias de cupones y las pantallas de ajustes**
(`new Date(`, `setHours`, `toISOString().slice` en `src/lib/cupones` y `src/app/(app)/settings`).

## Pregunta 57 — la que sumó el 12 de octubre de 2026 (Codex, orden 155)

### 57. Una ruta que entrega un ARCHIVO (`src/app/api/**/route.ts`), ¿pide el permiso del área o sólo sesión?

El candado de la plata miraba las acciones del servidor, no las rutas que bajan archivos. Cinco
rutas servían contratos, presupuestos, comprobantes y contratos laborales a cualquiera con sesión, y
el firmador genérico abría cualquier archivo guardado. **Barrido: toda ruta con `hasAppSession()` y
sin `requirePermiso`**; si lo que entrega es plata o sueldos, es un hallazgo.

## Pregunta 58 — la que sumó el 13 de octubre de 2026 (Codex, órdenes 159, 160, 161 y 162)

### 58. Si la respuesta del servidor se pierde y la persona vuelve a tocar, ¿se guarda dos veces?

Cuatro hallazgos seguidos con la misma forma: el mantenimiento con gasto, el ajuste de costos, el
configurador y el presupuesto que arma el chat. El servidor **sí guardaba**, la respuesta no llegaba
(se cortó la señal), la pantalla mostraba error y el segundo toque guardaba **otra vez**: dos gastos,
dos aumentos, dos presupuestos. La pregunta 9 (doble toque) no lo agarraba: el botón ya estaba
liberado porque la primera vuelta "falló".

**Cómo se mira:** toda acción que CREA algo (un cobro, un gasto, un presupuesto, una factura, un
recibo, una cuota, un invitado, una tarea) tiene que recibir de la pantalla **una identidad del
intento** —generada una vez por borrador y repetida en cada reintento— y el servidor, adentro de la
transacción, tiene que reconocerla y devolver lo ya creado en vez de crear otro. Un id armado en el
servidor con `Date.now()` o `Math.random()` **no sirve**: cambia en cada reintento.

**Barrido:** acciones en `src/app/actions/**` que crean con `Date.now()`, `randomUUID()` o
`Math.random()` en el servidor y sin `operationId`/`idempotencyKey`/`registroId` que venga de la
pantalla. Primero plata (cobros, gastos, facturas, recibos, señas, cuotas, sueldos, presupuestos);
después lo demás. **La prueba corta la respuesta** (la acción corre, el resultado no llega) y reintenta:
tiene que quedar uno solo.

## Preguntas 59 y 60 — las que sumó el 13 de octubre de 2026 (Codex, órdenes 157 y 158)

### 59. Un formulario que se abre de nuevo después de guardar, ¿arranca limpio? ¿Y conserva el borrador si falló?

"Nueva incidencia" se abría con el texto del caso recién guardado: la persona cargaba el siguiente
encima del anterior. **Al confirmar el guardado se limpia lo que era de ESE caso; si falló, se conserva
para reintentar; lo que se elige siempre (fiesta, responsable) queda.** Barrido: diálogos de "Nuevo …"
/ "Agregar …" (`setOpen(true)`, `DialogTrigger`) cuyo estado no se limpia en la rama de éxito.

### 60. Con un nombre o título de 80 caracteres, ¿la pantalla del celular sigue entera?

En las fichas de equipo e insumo un nombre largo empujaba "Guardar" y "Volver" fuera de la pantalla.
**Se prueba con textos largos de verdad (sin espacios también) a 390 px**: los botones se ven y se
pueden tocar. Barrido: encabezados `flex` con `h1`/`h2` que muestran un nombre cargado por el usuario
sin `min-w-0` / `break-words`.

## Pregunta 61 — la que sumó el 13 de octubre de 2026 (repaso de todo lo de Codex: devolución 76b)

### 61. Una prueba que se saltea en el celular, ¿lo hace porque alcanza con uno, o esconde que en el celular no anda?

La importación de invitados tenía `test.skip(project !== 'chromium-desktop')` y en el celular el botón
de confirmar no se podía tocar: la orden figuraba hecha. **Si la pantalla la usa un invitado, un
cliente o el personal en el celular, la prueba de su resultado corre también en `chromium-mobile`.**
Saltear vale sólo cuando el resultado no depende del tamaño (un cálculo, un ajuste compartido, algo
que se imprime desde la computadora) y el motivo lo dice. Barrido: `test.skip(testInfo.project.name`
en `tests/e2e`, cruzado con las pantallas del invitado, del cliente y del personal.

## Pregunta 62 - dependencias (Codex123, 14/10/2026)

### 62. Una dependencia parcheada, ¿deja otras copias vulnerables y sigue funcionando su consumidor real?

Un build aprobado no demuestra que desaparecieron los avisos de seguridad. Se
comparan versiones resueltas y avisos unicos, no solo el numero agregado; se
prueban los consumidores usados (PDF, ZIP, sanitizador, servidor y escena), y
se documentan las copias que siguen vulnerables. No imponer una version mayor
por override a un consumidor antiguo sin comprobar su contrato. Un import
correcto tampoco certifica una pantalla ni un proveedor externo.

## Pregunta 63 - controles accesibles (Codex125, 14/10/2026)

### 63. El nombre y la seleccion que se ven, ¿tambien los reconoce el navegador sin depender del color?

El kiosco compartido por once entradas mostraba los textos pero el selector de
fiesta y el identificador del totem no tenian nombre accesible. El rol elegido
solo se distinguia por color. Revisar labels asociados, nombre de grupos,
aria-pressed y avisos de error anunciados; probar cambio de rol y guardado
bloqueado con datos ficticios, tambien en celular. Un archivo con texto cerca
del input no demuestra esa asociacion. Separar la prueba de configuracion de
una prueba de camara, impresora o plataforma fisica.

Tampoco alcanza con que inputValue sea correcto: mirar la captura con texto
escrito y medir color/fondo reales. Un Input text-foreground en tema claro
sobre un fondo oscuro daba contraste1.0013 y parecia vacio. Probar lectura y
placeholder en PC/celular (texto normal, umbral4.5), no solo clases de jsdom.

## Preguntas 64 a 67 - auditoría de Gemini (16/10/2026)

Las sumó la auditoría "con lupa" de Gemini: cuatro formas que ninguna pregunta anterior miraba.

### 64. Lo que se imprime, ¿sale entero?

Una regla general de impresión (`@media print` en `globals.css`) escondía todo `header` para sacar la
barra de la app, y se llevaba la cabecera de 21 documentos: contratos y recibos de sueldo salían sin logo,
título ni cliente. Codex lo vio en uno solo. Se mira con `page.emulateMedia({ media: 'print' })` en cada
documento imprimible, no en uno, y se lee qué quedó: el nombre del cliente, el título y la fecha tienen que
estar. Toda regla `display:none` de impresión se recorre contra todos los que imprimen.

### 65. Lo que la pantalla ofrece, ¿lo puede usar quien la está viendo?

El menú le mostraba a un operador "Pagos Rápidos", "Panel Contable" y "Facturas"; al tocarlos, el servidor
lo rechazaba. El servidor estaba bien: el defecto es ofrecer una puerta cerrada. Para cada perfil
(`PERMISOS_POR_PERFIL`), cada botón visible tiene que llevar a algo que ese perfil puede abrir. Es la
pregunta 41 (lo que la pantalla ofrece, el servidor lo acepta) mirada por perfil.

### 66. Cuando se suma una opción nueva (una estación, una categoría), ¿la tienen todas las listas que filtran por ella?

El álbum filtraba por Vogue y la galería del invitado no; el portal ofrecía cuatro extras y no las tres
estaciones más nuevas. Se busca el `id` de la opción (`'bogue'`, `'touchpix'`) en todos los lugares que
arman pestañas, filtros o listas de opciones, y se compara con una lista que ya la tiene.

### 67. ¿Dos botones llevan al mismo lugar?

En el portal del cliente "Documentos" y "Contrato" abrían la misma pantalla, igual que "Video de Vida" y
"Fotografía"; en el tablero, "Nuevo Lead" y "CRM". No rompe nada, pero confunde. En cada grilla o menú se
listan los `href` y se buscan repetidos.

### 68. Lo que una pantalla le esconde a un perfil, ¿viaja igual adentro de un objeto más grande?

La lista de empleados le escondía los sueldos a la secretaria, pero la fiesta viajaba entera con lo que
cobra cada persona (`personalAsignado[].eventSalary`), y la pantalla de recibos se los mostraba. Para cada
dato protegido por un permiso, se busca **en qué objetos más grandes va metido** (la fiesta, el
presupuesto, el cliente) y se mira qué perfiles reciben ese objeto entero. Y al revés: si se lo saca al
leer, **al guardar** el objeto sin ese dato no tiene que borrarlo (pregunta 38).

**Ampliada el 20/10 (Codex 150, orden 198):** también **lo que DEVUELVE un guardado**. `saveFiesta`
reponía la plata para guardar y devolvía la fiesta entera, con costos y sueldos ajenos. Se busca cada
`return { ..., fiesta: … }` o `updatedFiesta` de una acción, no sólo lo que se lee.

### 69. Una función "interna" sin permiso, ¿vive en un archivo `'use server'`?

La entrega de la orden 183 (propuesta 1333) agregó `updateGestionCostosInterno` sin pedir permiso, para
que la sincronización automática pudiera guardar costos. Pero la exportó desde `costos.actions.ts`, que
empieza con `'use server'`: **todo lo que se exporta de ahí se puede llamar desde el navegador**. "Interna"
era sólo el nombre. Lo frenó el candado de la plata. Al verificar: una función que se saltea el permiso
vive en un archivo **sin** `'use server'` (con `import 'server-only'`), y la acción pública la llama.

### 70. Una fecha sin hora (la del evento, un vencimiento), ¿se muestra el mismo día en Uruguay?

Codex 143 (orden 184): la hoja de cocina guardaba 2027-08-08 y mostraba el 7/8 en Uruguay, porque leía la
fecha como medianoche de Greenwich. Una fecha "civil" se arma con año, mes y día, nunca con
`new Date('AAAA-MM-DD')`, y la prueba corre con la zona `America/Montevideo`.

### 71. Dos registros con el mismo nombre, ¿la cuenta los distingue por su identificador?

Codex 148 (orden 185): al guardar la fiesta, los pagos a proveedores se reponían buscando por nombre; con dos
proveedores de igual nombre, uno se quedaba con la plata del otro. Si hay `id`, se empareja por `id`; el
nombre sólo para filas viejas sin `id`, y sólo si no es ambiguo.

### 72. Un número de teléfono local, ¿sale con el 598 cuando arma el enlace de WhatsApp?

Codex 136 (orden 186): el recordatorio de la agenda armaba `wa.me/099...` y WhatsApp no lo abría. Todo enlace
de WhatsApp pasa por la misma función que agrega el prefijo del país.

### 73. Una lista de nombres permitidos, ¿acepta nombres que el lenguaje trae de fábrica?

Codex 138 (orden 187): `esPerfilValido` preguntaba `valor in PERMISOS_POR_PERFIL`, y `"toString"` o `"constructor"`
pasaban como perfiles. Se pregunta con `Object.hasOwn` (o `hasOwnProperty`), nunca con `in`.

### 74. Lo que llama una máquina de afuera (despertador, webhook), ¿pasa la puerta general de la app?

Gemini, 20/10 (orden 194): el despertador de cada 15 minutos llama a `/api/cron-despachador` con su
clave, pero `src/middleware.ts` manda a `/login` todo lo que no tiene cookie y no figura en
`src/lib/auth/public-paths.ts`. La ruta revisaba su clave, sus pruebas daban verde… porque **llamaban a
la ruta directo, salteando la puerta**. Ya estaba anotado en `YA-RESUELTO.md` ("cron sin cookie dio
HTML") y nadie lo arregló. Se busca: toda ruta de `src/app/api/` que mire `CRON_SECRET`,
`TAREAS_SECRET` o una firma de webhook tiene que figurar como pública, y su prueba pasa por
`isPublicPath`, no sólo por el manejador.

### 75. Una función que se cuida sola con un dato opcional, ¿quien la llama le pasa ese dato?

Gemini, 20/10 (orden 194): `atenderAlEquipo` ignora los ecos si `isEcho` viene en verdadero, y el
webhook no se lo pasa nunca (tampoco `to`, `type` ni el audio). La protección existe y no se prende.
Se busca: parámetros opcionales de los que depende un `if` de seguridad o de plata; se mira cada
llamada y se comprueba que lo mande.

### 76. Todos los lugares que arman la sesión, ¿guardan los mismos datos que después mira el permiso?

Gemini, 20/10 (orden 194): el ingreso con clave guarda `perfil`; el ingreso con Google no, y
`perfilDe` cae a `secretaria` (o a dueño si falta el rol). Y once acciones miran `role !== 'admin'` en
vez del perfil, así que rol y perfil pueden decir cosas distintas. Se busca: cada `writeSessionCookie`
con los mismos campos, y ningún permiso decidido por `role`.

### 77. Lo que el cliente o el invitado puede hacer sin sesión, ¿termina en algo que pide sesión del equipo?

Amplía la 24 al portal del cliente. Gemini, 20/10 (orden 194): `updateDecoracion` con `allowPortal`
guarda y después llama a `syncDecoGastosToModule`, que pide sesión: la decoración queda guardada y el
cliente ve "no se pudo guardar". Se busca: cada acción con `allowPortal`, `publicRsvp` o token de
invitado, y **todo lo que llama después**, hasta el final.

### 78. Una acción pública que prueba una clave o respuestas, ¿tiene tope de intentos? Y si recibe un id de usuario, ¿mira que sea el de la sesión?

Gemini, 20/10 (orden 194): `resetPasswordWithQuestions` se puede probar sin límite; `changePassword`
recibe cualquier `userId`. Se busca: acciones sin sesión que comparan claves, PIN, respuestas o códigos
(van con `enforcePublicRateLimit`), y acciones que reciben `userId`, `empleadoId` o `clienteId` del
navegador.

### 79. Lo que una pantalla lee de una versión recortada, ¿viaja en esa versión?

La inversa de la 68. Gemini, 20/10 (orden 194): el portal del cliente recibe la fiesta por una lista
blanca (`mapGuest` en `src/lib/client-portal/public-fiesta.ts`) que no trae `checkedIn` ni
`photosUploaded`: la pantalla dice siempre "0 llegaron" y "faltan fotos". Se busca: cada campo que
lee una pantalla pública, contra lo que deja pasar su recorte.

### 80. Lo que una pantalla le pasa a otra (enlace, parámetro, estado), ¿la otra lo lee con ese nombre?

Gemini, 20/10 (orden 194): el simulador manda `&adultos=` y el otro lee `guests`; el plato elegido
queda en un estado que no llega a lo que se guarda; el enlace a confirmar pierde `guestId` y el de
"mi mesa" al hub también. Se busca: cada `href` y `router.push` con parámetros, contra el
`searchParams.get` de la pantalla de destino; y cada estado que se muestra elegido, contra lo que se
manda al guardar.

### 81. El arreglo y su control, ¿miran la forma en toda la app o sólo el archivo donde apareció?

**Es la que explica por qué "vuelven" cosas ya arregladas** (dueño, 20/10). El álbum que mandaba al
disco de todos los clientes se arregló en una pantalla y su control leía sólo esa; la misma línea
seguía en `src/app/post-fiesta/[fiestaId]/page.tsx`. **`node scripts/formas-ya-arregladas.mjs`** toma
cada forma que un control prohíbe en un archivo y la busca en toda la app. Se corre al juntar cada
entrega; lo que encuentra se confirma y va a una orden. Y un control nuevo que prohíbe una forma se
escribe recorriendo `src/`, no un archivo.

### 82. Lo que dice el asistente, la voz o un agente, ¿sale de los datos o es un texto fijo que parece un dato?

Entrega 1337 (orden 196): el Contador de "los dots" contestaba "este mes se cobraron $240.000 y restan
$85.000" siempre igual; la acción "ejecutada automáticamente" no hacía nada; el borrador de WhatsApp
"dejado listo en Mi Día" no se guardaba en ningún lado, y una acción desconocida respondía "recibida y
registrada". Todo con pruebas en verde. Se busca: cada respuesta del asistente que nombre un número, una
acción hecha o algo guardado, y se sigue hasta el dato o el guardado que la respalda. El control
`src/__tests__/el-asistente-no-inventa-plata.test.ts` frena los importes escritos a mano.

### 83. Un visor o ventana hecho a mano (`role="dialog"` sin el Dialog de Radix), ¿lleva el foco adentro, cierra con Escape y devuelve el foco a lo que lo abrió?

Codex 155 (orden 199): en la galería de la portada, abrir una foto con el teclado dejaba el foco detrás del
visor y, al cerrar, el foco quedaba en la nada: quien navega con teclado o lector de pantalla pierde su lugar.
Los visores de video y de historias de la portada ya lo hacían bien (guardan `document.activeElement` y lo
vuelven a enfocar). Se busca `role="dialog"` y `aria-modal` en `src/` y, en los que no importan
`@/components/ui/dialog`, se miran las tres cosas.

### 84. Donde alguien puede ver "lo suyo" (su portal, su ficha, sus recibos), ¿llega a la comprobación de que es suyo, o antes lo frena una lectura general que a su perfil le dice que no?

Codex 156 (orden 200): el portal del empleado leía la lista entera del personal y todas las fiestas antes
de mirar si el portal era el suyo; esas lecturas rechazan al perfil personal, así que nunca llegaba. La
regla estaba bien y el control de "es lo suyo" también: fallaba el orden. Se busca cada comprobación de
"propio" y se mira qué se llama antes; lo propio se lee con una lectura interna acotada a esa persona,
**sin** abrirle a ese perfil las lecturas generales.

### 85. Lo que una ruta contesta cuando entró sin clave, ¿trae datos de clientes, fiestas o mensajes?

Codex 158 (orden 201): las tareas automáticas que pueden correr sin la clave (porque sólo preparan
borradores) contestaban con todo el detalle: nombres de clientes, tipo de fiesta y días sin respuesta. La
puerta ya decía "sin clave, la respuesta va recortada" y nadie la recortaba. Ahora toda respuesta de una
tarea pasa por `respuestaDeLaTarea`, y `codex-156-158-portal-propio-y-tareas-recortadas.test.ts` lo exige
en todas las rutas que abren la puerta.

### 86. Una respuesta guardada para no repetir trabajo, ¿se devuelve antes de mirar quién la pide?

Codex 171 (orden 205, sobre la entrega 1344 de Gemini): la acción de voz guardaba en memoria el resultado
de cada pedido por su número y, si el número se repetía, lo devolvía **antes** de mirar el permiso. El
dueño preguntaba cuánto le deben; con el mismo número, un operador recibía la respuesta. Se busca todo
`Map`/caché de resultados por id en `src/app` y `src/lib`, y se mira que el permiso vaya primero y que el
resultado quede atado a quién lo pidió.


### 87. Cuando se elige un registro por su nombre (un rol, un servicio, un contacto), ¿puede caer en otro que contiene la misma palabra?

Codex 178 (orden 209): al armar el personal, "Mozo" agarraba el primer rol que lo contuviera, y con
"Mozo de Cocina, Mozo de Atención" los mozos de salón quedaban en la cocina. El barrido encontró lo mismo
en el asistente: "barra" cambiaba el precio de la primera barra del catálogo, y "Ana" le agendaba la cita a
"Mariana Pérez". Se busca `.find(` con `.includes(` sobre `nombre`/`name` en `src/`. Se mira que vaya
primero el nombre exacto y que, si hay más de uno parecido, se pregunte en vez de elegir.

### 88. Un valor por defecto escrito con `||` (`Number(x) || 15`), ¿pisa un 0 puesto a propósito?

Codex 201 (orden 210, A10): el portal calculaba el ajuste anual con `Number(...) || 15`. Un presupuesto
con ajuste 0 a propósito le mostraba y le pedía al cliente un 15% de más. Se buscan `|| <número>` sobre
porcentajes, precios, descuentos, sueldos y montos en `src/`. El valor por defecto va sólo cuando falta
el dato (`== null`), no cuando vale 0.

### 89. Cuando un guardado se cambia por otro (de `updatePresupuesto` a una transacción, por ejemplo), ¿el nuevo hace TODOS los controles que hacía el viejo?

Codex 204 (orden 211): Claude pasó las aprobaciones del portal a `mutarPresupuesto` para que no se
sumaran dos veces, y con eso se salteó lo que hacía `updatePresupuesto`: frenar si el contrato está
firmado y rehacer la cuenta desde los renglones. El arreglo quedó publicado unas horas con un agujero
nuevo. Antes de cambiar un guardado, se lista qué controles hace el viejo (permiso, contrato firmado,
recálculo, normalización, aviso al CRM) y se mira que el nuevo los haga o diga por qué no hacen falta.
Se buscan los `mutarPresupuesto(` y `mutateDataItem<Presupuesto>` de `src/` y se mira si cambian la
estructura del presupuesto (invitados, renglones, descuento) sin mirar la firma.

### 90. Un control que se mira ANTES de la transacción, y un "deshacer" que vuelve a una foto vieja: ¿aguantan que otro haga algo en el medio?

Codex 217-218 (orden 213-claude). Las aprobaciones del portal miraban la firma del contrato en la primera
lectura. Si se firmaba antes de la escritura, el extra entraba igual. Y al fallar el presupuesto, la
fiesta volvía a la configuración leída al principio, borrando lo que otro aprobó en el medio.

Dos cosas se miran:

1. Todo control que decide si se escribe (firma, saldo, estado, permiso del dueño del dato) va adentro
   de la transacción, sobre el dato que se va a guardar.
2. Todo "deshacer" o "volver atrás" trabaja sobre el dato de AHORA. Resta lo suyo, o vuelve un valor
   sólo si sigue siendo el que puso él.

Se buscan en `src/app/actions` y `src/lib` los `catch` y los "revertir/deshacer/rollback" que guardan
algo leído antes (`...antes`, `status: xAntes.status`, `writeData(archivo, original...)`).

### 91. Cuando el cliente acepta o firma algo, ¿queda registrado lo que VIO, y sólo por el camino de firmar?

Codex 240 (orden 216-claude). La firma del portal guardaba la huella del texto de ese momento, no la del
que el cliente tenía en pantalla. Si el equipo lo cambiaba en el medio, se le atribuía el nuevo. Además, la
constancia se podía reescribir por el guardado general, y dos firmas a la vez se pisaban.

Se miran tres cosas en cada aceptación del cliente:

1. Que la pantalla mande qué versión vio (huella, versión o fecha) y que el servidor la compare adentro
   de la escritura.
2. Que lo que se aceptó sólo lo escriba su acción, y que el guardado general lo deje como está.
3. Que el resumen que se le muestra antes de aceptar salga de sus datos reales. Si no se pueden leer,
   se dice, sin importes por defecto.

Se buscan en `src/app/actions` las acciones con `verifyPortalSession` que guardan una aceptación, una
firma o una aprobación del cliente.

### 92. Una tarea que corre sin clave, ¿le escribe a alguien? Y si falla a mitad, ¿queda anotada como corrida?

Codex 249-250 (orden 217). El recordatorio a los invitados mandaba WhatsApp y Gmail, y estaba en la lista
de "las que no hacen daño". La pregunta 85 miraba qué contestaba la ruta, no qué hacía.

Además se mira:

- Si una reserva o un envío fallan, ¿la corrida se anota igual como hecha?
- ¿El día queda consumido sin haberse mandado nada?

Se recorre `TAREAS_QUE_NO_HACEN_DANO` en `src/lib/automatico/puerta-de-las-tareas.ts` y, por cada una, se
busca en su motor `sendMetaWhatsAppMessage`, `sendGoogleGmailMessage` o cualquier envío a una persona
que no sea el dueño.

### 93. Si deshago porque falló, ¿pudo otro intento de LA MISMA operación haberla completado en el medio?

Codex 263 (orden 218). Aprobar un aviso de pago volvía a pendiente si el presupuesto no tomaba el cobro, y
miraba que el aviso siguiera "aprobado por mí". Un reintento que acreditaba el mismo aviso no cambiaba esa
marca, así que la respuesta tardía del primero lo deshacía con la plata adentro. La pregunta 90 miraba si
OTRA operación había tocado el dato; no si la misma, reintentada, había terminado bien.

Se mira que la vuelta atrás pregunte por una marca de que la operación TERMINÓ (cobro acreditado), no por la
de que empezó. Y que quien termina deje esa marca en el mismo lugar que lee la vuelta atrás.

Se buscan en `src/app/actions` los `if (!...success)` que vuelven algo a pendiente o deshacen, después de un
cobro, una factura o un descuento de stock.

### 94. Un control nuevo que frena una escritura, ¿está en la MISMA escritura?

Codex 264 (orden 219). En la revisión contable del 22/10 agregué "con firma no se cambia el texto" en
`updateFiestaPartial`, leyendo antes y escribiendo después con `updateDataPartial`. Una firma entre las dos
dejaba la constancia de un texto y el contrato con otro. La pregunta 90 ya lo decía; el barrido de esa
pregunta no miró el control que yo mismo acababa de agregar.

Se mira cada `if (...) return` que frena por firma, factura, cobro o estado cerrado, y se sigue hasta la
escritura: si es `updateDataPartial`, `writeData` o `saveFiesta`, el control tiene que repetirse adentro de
`actualizarFiesta`, `mutateDataItem` o la transacción. Vale primero para los controles agregados en la
misma tanda.

### 95. Una acción del servidor que llama a un ayudante que guarda plata, ¿pide permiso ella?

Revisión de la entrega 1353 de Gemini (23/10). `updateGestionCostosInterno` era una acción pública que sólo
llamaba a `guardarCostosInterno`, importado de otro archivo. El candado de la plata miraba los nombres de los
archivos y campos de plata adentro de la acción, no las llamadas a los ayudantes que los escriben, y no la vio.

Ahora el candado también cuenta como plata llamar a `guardarCostosInterno`, `mutarCostosInterno`,
`mutarPresupuesto`, `addPagoToPresupuesto`, `registerBookingDeposit` o `saveInvoice`. Cuando aparece un
ayudante nuevo que guarda plata, se suma a esa lista en `src/__tests__/el-candado-de-la-plata.test.ts`.

### 96. Una regla de estilo general, ¿le cambia el COLOR DE FONDO a una pantalla que se pensó oscura?

Codex 341 (orden 223). La regla `main.flex-1 { background:#f8fafc }` de `ak-global-premium.css` pintaba casi
blanco el fondo de cinco pantallas oscuras (barra lista, buzón, en vivo, experiencia, tecnología), y su texto
claro quedaba ilegible. La pregunta 52 miraba lugar y tamaño, no color.

Por cada regla de alcance general (`main`, `body`, `> *`, clases de marca) que pone `background` o `color`, se
buscan las pantallas que la reciben y escriben texto claro (`text-white`, `text-slate-100`…). La prueba mide
el color calculado del fondo (`getComputedStyle`), no la clase escrita.

**Ampliada el 24/10 (Codex 423, orden 227):** el barrido miró un solo archivo de estilos y la prueba miró
`background-color`. Quedaba `main.flex-1 > div:first-child` en `ak-internal-experience-polish.css` con un
degradado (`background-image`) casi blanco, y la prueba dio verde con el texto ilegible. Se buscan **todos**
los `.css` que importa `src/app/layout.tsx`, también los selectores de hijo (`main.flex-1 > ...`), y cada
`<main ... flex-1>` fuera del panel. La prueba compara píxeles de una captura, no estilos calculados.

### 97. Si hay un código de estado numérico, ¿se decide por el número o por el texto del error?

Codex 350 (orden 225). `esRechazoConocido` del recordatorio a invitados miraba el número y, si no era 4xx,
buscaba "403" en el texto. Un 503 con un rastreo que decía `qa403` se tomaba como rechazo: se liberaba la
reserva y el invitado recibía el recordatorio dos veces. La pregunta 93 miraba la marca de terminado, no cómo
se clasifica la falla.

Se buscan en `src` las expresiones que leen números de estado en el texto de un error
(`.test(msg)`, `.includes('403')`…). Si el error trae `status`, manda el número; el texto sólo cuenta cuando no
hay número, y con números enteros (`\b403\b`).

### 98. ¿Un control de permisos mira el rol viejo (`role === 'admin'`) en vez del perfil?

Codex 230 (órdenes 230 y 233). `requireAdminSession` aceptaba `role: 'admin'` aunque la cuenta tuviera perfil de
secretaria: cambiarle el perfil a alguien no le sacaba lo del dueño. La misma comparación seguía en once lugares, entre
ellos el borrado de la base. Se busca `role === 'admin'` y `role !== 'admin'` en `src/app` y `src/lib`: todo control de
permisos usa `puede(...)` o `requireAdminSession()`. Sólo el ingreso y la traducción de cuentas viejas leen el rol.

### 99. Un video, foto o audio que salió vacío, ¿se presenta como terminado?

Codex 229 (orden 229). La grabación con marco perdía el audio si fallaba WebAudio, y una captura de 0 bytes se
mostraba como "video listo". Se mira cada `onstop`, `toBlob` o `MediaRecorder`: antes de decir "listo" se mira el
tamaño y que se pueda reproducir. Si no, se muestra el reintento.

### 100. Algo que corre solo, ¿hace por su cuenta lo que el dueño decidió que hace una persona, o su descripción dice lo contrario de lo que hace?

Propia (26/10/2026). El vigilante de publicidad decía "nunca modifica campañas ni gasta dinero" y pausaba campañas y
subía el presupuesto un 25% cada 12 horas. Se sigue cada disparador automático (agentes, tareas programadas,
webhooks, efectos al entrar) hasta lo que termina haciendo: si manda afuera, cobra, cierra, toca permisos o gasta, es
un hallazgo de plata. Y se compara la descripción que ve el dueño con el código.

### 101. Una redirección, ¿deja una pantalla existente sin forma de abrirse?

Propia (26/10/2026). Una entrega redirigía `/empresa/redes-sociales` a otra pantalla y el planificador de redes que
vive ahí quedaba inalcanzable; además un botón llevaba a sí mismo. Por cada redirección incondicional se mira si en
el origen hay una `page.tsx` real.

### 102. Un aviso que llega a varias personas, ¿lleva plata o deudas de un cliente?

Codex en la 1364 (26/10/2026). El asistente mandaba al teléfono de todo el equipo el nombre del cliente y su saldo, y
el barrido mostró que **todo** aviso interno salía así ("Pago de $15.000 registrado para…"), y que la lista de avisos se
mostraba entera a cualquiera con sesión. Se mira cada envío a muchos (aviso al teléfono, lista de avisos, grupo): si
puede llegar a alguien sin permiso de plata, el texto no lleva importes ni deudas, y la lista filtra por permiso.

### 103. Una acción que usa lo que se acaba de escribir en pantalla, ¿lee eso o lo guardado antes?

Codex 704 (27/10/2026). Al cambiar nombre, fecha o salón y tocar "Crear 3 propuestas", la acción del servidor leía la
fiesta guardada, con los datos viejos, porque el autoguardado todavía no había corrido. Se mira cada botón que dispara
algo en el servidor justo después de editar: o le pasa los valores actuales (validados) o espera el guardado
confirmado antes de leer.

### 104. Un asistente que contesta o actúa, ¿usa datos reales o un ejemplo fijo cuando no sabe?

Codex sobre la 1365 (27/10/2026). El Centro de control armaba la web de "Sofía" si no encontraba la fiesta, y
contestaba el menú del sábado sin consultarlo. Se mira cada respuesta del asistente: si no tiene el dato, pregunta o
dice que no sabe; nunca rellena con un nombre o un dato de ejemplo.

