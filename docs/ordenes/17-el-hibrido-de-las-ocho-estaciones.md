# Orden 17 — El híbrido: lo mejor de cada plataforma, en las ocho estaciones

**Para Gemini. UNA SOLA PROPUESTA con todos los bloques.** Si un bloque se traba,
entregá el resto igual, en la misma propuesta, avisando cuál faltó.

---

## Qué pidió el dueño

Comparar **cada una de las ocho estaciones** contra las mejores plataformas pagas de
su categoría, y **armar un híbrido que tome lo mejor de cada una**. No es una
comparación de la fotocabina sola: es de todo el entretenimiento.

## Reglas que mandan sobre esta orden

1. **Lo que ya anda no se toca.** Las ocho estaciones funcionan. Esto **suma**, no
   reescribe. Si algo te parece mejorable y no está en esta orden, no lo cambies.
2. **Nada que aumente lo que se paga por mes.** Todo lo de acá usa lo que ya hay
   (Gemini y el generador de imágenes que la app ya tiene). **Si algo obliga a
   contratar un servicio nuevo, dejalo preparado y avisá: no lo contrates.**
3. **Sin cara de famoso.** Los parecidos con personas reales traen problemas legales.
   Personajes propios o genéricos, nunca celebridades.
4. **Cada cosa que agregues tiene que estar enganchada y tener prueba de resultado**,
   o `npm run "publicar?"` te la frena.

---

## Segunda pasada: lo que faltó en la primera comparación

**El dueño lo marcó y tenía razón:** subir un fondo propio lo tiene cualquiera de esas
plataformas, y en la primera pasada no figuraba. Se revisó de nuevo, esta vez contra la
lista completa de lo que trae un software de cabina —LumaBooth, LA Photo Party, Social
Booth, dslrBooth, Touchpix— y comprobando en el código de AK una por una.

**Lo que AK ya tiene** (verificado, no hace falta tocarlo): marca del evento que se puede
sacar y poner desde la cabina, compartir por QR, mail, WhatsApp, galería y descarga,
reimpresión desde la pantalla de impresión, moderación del muro, y los modos foto, GIF,
boomerang y 360 como estaciones aparte.

**Lo que NO está y lo tiene todo el mundo:**

| Falta en AK | Quién lo tiene | Por qué importa en una fiesta |
|---|---|---|
| **Subir un fondo propio** | Todas | Es lo primero que pide un cliente con un tema |
| **Plantillas que se puedan editar** | Todas | Hoy hay ocho ajustes y sólo uno hace algo |
| **Fondo verde (croma)** | LumaBooth, LA Photo Party, Social Booth | Poner al invitado en cualquier lado. **En AK no existe nada.** |
| **Pantalla que llama cuando nadie la usa** | LumaBooth | Una cabina quieta no llama a nadie. Un video en repetición sí. |
| **Más de una forma de imprimir** | Todas | Hoy sale una sola: la tira de tres. Falta foto sola y tira de cuatro. |

Los dos primeros son el bloque 0. Los otros tres, el bloque 0 bis.

## Bloque 0 bis — Croma, pantalla que llama, y formas de imprimir

1. **Fondo verde (croma).** Que se pueda sacar el fondo real y poner otro. **No existe
   nada de esto en la app**: se comprobó buscando en todas las estaciones. Es lo que hace
   posible el disfraz y el "estabas en París".
2. **Pantalla que llama.** Cuando la cabina está sin usar, que muestre en repetición las
   últimas fotos de esa misma fiesta con un cartel de "tocá para tu foto". Acá AK le gana
   a los que ponen un video genérico: **las fotos son de la gente que está ahí**.
3. **Tres formas de imprimir, no una:** la tira de tres que ya existe, la foto sola en
   10x15, y la tira de cuatro. Que se elija por estación, y que el ajuste `printLayout`
   —que hoy se guarda y no lo mira nadie— sea el que manda.

---

## Bloque 0 — SUBIR UN FONDO Y PERSONALIZAR LAS PLANTILLAS (pedido del dueño)

**Es lo primero que hay que hacer.** El dueño lo pidió así: *"y poder subir un fondo
también, las plantillas deben poder cambiarse de color y personalizarse"*.

### Cómo está hoy, verificado a mano el 28 de agosto de 2026

- **El fondo y el color salen solos de la invitación digital de la fiesta.** Lo arma
  `getPublicEntertainmentEvent()` en `src/lib/entertainment/station-config.ts` (líneas
  160-195): toma la portada de la invitación, o el video de fondo, o la foto de portada,
  o la portada del portal del invitado; y el color, de la paleta de la invitación o del
  color principal de la fiesta. **Eso anda y NO se toca.**
- **No hay ninguna pantalla para subir un fondo propio de la estación.**
- **Las plantillas guardan ocho ajustes y la fotocabina lee UNO** (`accentColor`).
  Los otros siete —`filterPreset`, `backgroundStyle`, `animationStyle`, `printLayout`,
  `qualityPreset`, `overlayName`, `musicTrack`— no los mira nadie, y tampoco hay
  controles para editarlos.

### Lo que hay que construir

En la pantalla donde se arma el entretenimiento
(`src/app/(app)/fiestas/nueva/entretenimiento/page.tsx`), por estación:

1. **Subir un fondo propio.** Una imagen que reemplaza la de la invitación **sólo para
   esa estación**. Que se vea la que va a quedar antes de guardar, y que se pueda
   sacar para volver a la automática de un toque.
2. **Cambiar el color.** Un selector de color con el de la invitación **ya puesto** como
   punto de partida, no en blanco.
3. **Editar la plantilla entera**: el nombre del diseño, el marco, el filtro, la
   animación del disparo, el formato de impresión y la música. Con los valores que hoy
   vienen de fábrica ya cargados.
4. **Guardar la plantilla con nombre y volver a usarla en otra fiesta.** Es lo que
   cobran Snappic y Salsa, y para AK es más fácil porque los datos de la fiesta ya
   están.

### La regla de diseño, y es la que más importa

**Automático por defecto, la mano encima sólo si se quiere.** El fondo y el color de la
invitación se siguen tomando solos: lo que se sube **pisa** ese valor, no lo reemplaza
para siempre. Si el operador borra lo que subió, vuelve solo a lo de la invitación.

**Nunca dejes un campo vacío esperando que alguien lo llene.** Todo arranca con lo que
la app ya sabe de esa fiesta.

### Y que sirva de verdad

De nada vale poder editar los siete ajustes si la pantalla de la estación sigue sin
mirarlos. **Cada ajuste que quede editable tiene que verse en la foto o en el video**, y
tiene que tener una prueba que compruebe el resultado. Si alguno no se va a usar,
**sacalo de la plantilla** en vez de dejarlo como adorno.

---

## Estación 1 — Fotocabina Social

**Contra quién compite:** Snappic (69 dólares por mes), Simple Booth (29), Salsa de
Photobooth Supply (equipo de 2.999 más software Fiesta), Sparkbooth, LumaBooth.

**Lo que ellos tienen y nosotros no:**

| De ellos | Qué es | Por qué conviene |
|---|---|---|
| **Fondo que se saca solo** (Salsa Pro, Snappic) | La persona queda recortada y se le pone otro fondo | Es EL efecto que la gente comparte |
| **Filtro de belleza / glam** (Snappic, Salsa) | Piel pareja y luz suave | Es lo primero que miran los quince y las novias |
| **Plantillas que se empujan a todas las cabinas** (Snappic) | Cambiar el diseño desde la oficina | AK ya tiene el dato de la fiesta: se puede hacer mejor |
| **Modo sin internet** (Touchpix) | Sigue funcionando y sube después | En salones de Salto el wifi se cae |

**El híbrido de AK:**

1. **El fondo se saca solo, con lo que ya hay.** Usá el generador de imágenes que la
   app ya tiene. Y acá va la ventaja: **el fondo nuevo sale de la invitación digital
   de esa fiesta** —la misma portada y la misma paleta—, así la tira combina con todo
   lo demás. Ninguna plataforma paga puede hacer eso porque no sabe cómo es la fiesta.
2. **Un filtro de brillo suave**, uno solo, prendido o apagado. No cinco.
3. **Modo sin internet:** si no hay señal, guarda e imprime igual, y sube cuando
   vuelve. Con un cartel que diga qué está pasando, en criollo.
4. **Cerrá lo de la orden 16:** que las plantillas de estación hagan algo o se saquen,
   y que se pueda elegir qué marcos aparecen en cada fiesta.

---

## Estación 2 — Plataforma 360

**Contra quién compite:** RevoSpin, OrcaVue, Snappic 360.

**Lo que ellos tienen:** cámara lenta de verdad (120 o 240 cuadros por segundo),
más de sesenta efectos, marca de agua propia arriba del video, y salida lista para
historias.

**El híbrido de AK:**

1. **Cámara lenta y rampa de velocidad**: que el video arranque normal, baje a lento
   en el medio y vuelva. Es lo que hace que se vea caro.
2. **Tres efectos, no sesenta.** Elegí los que se usan: lento, rebote y luces.
   Sesenta opciones frenan la fila.
3. **El video sale con el nombre del agasajado y la fecha**, sacados de la fiesta.
4. **Cortina de música**: que el video salga con la pista que el equipo eligió para la
   estación. **Ese ajuste ya existe guardado y no lo usa nadie** (`musicTrack`).

---

## Estación 3 — Bogue (boomerang)

**Lo que ellos tienen:** salida vertical para historias, marca del evento, y que pese
poco para que se comparta al toque.

**Lo que AK ya tiene, verificado:** el GIF, el boomerang, la impresión, el QR y la
guía por voz.

**Falta:**

1. **Que salga también en vertical 9:16**, que es como se comparte en historias.
2. **Que se pueda elegir la velocidad del rebote** (lento, normal, rápido). Es un ajuste
   y cambia mucho el resultado.
3. **Contador de cuántos se compartieron**, para el resumen de la noche.

---

## Tercera pasada: las estaciones que la primera vez se despacharon en dos líneas

El dueño preguntó si se habían mirado **todas**. La respuesta honesta era que no con la
misma profundidad: la fotocabina, la 360, el retrato IA y la cápsula sí; el Bogue, los
espejos y los tótems no. Se revisaron, contra las plataformas de su categoría y contra el
código de AK.

### HALLAZGO GRAVE: el tótem promete cuatro cosas y hace una

La pantalla donde se arma el entretenimiento le muestra al equipo —y por ahí se le vende
al cliente— que el tótem sirve para: *"Invitado interactúa con el menú"*, *"Completa
encuesta o juego"*, *"Ve fotos de la fiesta en el muro"*, *"Consulta mapa/agenda"*, y
además *"Captura de feedback"*, *"Mapeo de mesas"* y *"Estadísticas de participación"*.

**Verificado leyendo `src/app/evento/totem/[fiestaId]/[totemId]/page.tsx` (503 líneas):
lo único que existe es ver las fotos del muro.** Es una pantalla que muestra —fondo
animado, fotos que flotan, distintas formas de pantalla— no un tótem con el que se
interactúe. Cinco botones en todo el archivo.

**No es un error de programación: es una promesa que la app le hace al cliente y no
cumple.** Se arregla de una de dos maneras, y **la decisión es del dueño, no tuya**:

- **Construir lo que falta**: menú, una encuesta de una sola pregunta, el mapa de mesas y
  la agenda. Es lo que dice el bloque de tótems más abajo.
- **O corregir el texto** para que diga lo que hace de verdad: una pantalla que muestra
  las fotos de la fiesta.

**Hasta que el dueño elija, no toques los textos.** Son decisión comercial suya.

### El tótem ya deja poner un fondo, pero pegando una dirección web

En `src/app/(app)/fiestas/nueva/pantallas-totem/page.tsx` (línea 377) hay un campo para
el fondo, y es una casilla donde se pega un `https://...`. **El dueño no tiene dónde sacar
esa dirección.** Cuando hagas el bloque 0, que sea **subir el archivo** desde la
computadora o el teléfono, y que este campo del tótem use lo mismo.

---

## Estación 4 y 5 — Espejo Mágico (foto y firma)

**Contra quién compite:** los espejos con software tipo Magic Mirror.

**Lo que ellos tienen:** que se maneje con gestos además de toque, accesorios
virtuales, y firma con el dedo arriba de la foto.

**Lo que AK ya tiene, verificado en el código:** firma, cambio de cara, retrato,
guía por voz, un juego, impresión y QR. Está bastante completo.

**Lo que les falta contra los espejos de referencia:**

1. **Accesorios virtuales** (sombreros, lentes, carteles) que se peguen a la cara. Con
   los mismos marcos que ya existen, no un sistema nuevo.
2. **La firma con más vida:** que se pueda cambiar el grosor y el color del trazo, y un
   efecto de neón. Hoy la firma es una sola.
3. **Que la firma y la foto se impriman juntas** en la tira de 10x15 que ya se arma.
4. **Que la voz guíe de verdad**: el espejo ya habla; que además diga qué hacer en cada
   paso, como la fotocabina.

---

## Estación 6 — Espejo Retrato IA

**Contra quién compite:** Touchpix AI, Snapbar AI, Booth Ledger.

**Lo que ellos tienen:** cambio de cara sobre personajes, retratos con estilo
(caricatura, pintura, retro), y lo más nuevo de 2026: **el retrato que se mueve** —una
foto que se convierte en un video corto de quince segundos—.

**El híbrido de AK:**

1. **Cuatro estilos de retrato, no más**, y elegidos según el tipo de fiesta: para unos
   quince no van los mismos que para un casamiento. **El tipo de celebración ya está
   cargado en la fiesta**: usalo para ofrecer los que corresponden.
2. **Personajes propios**, nunca caras de famosos.
3. **El retrato que se mueve, sólo si sale sin pagar nada nuevo.** Si obliga a
   contratar un servicio, dejalo preparado y avisá.

---

## Estación 7 — Tótems Interactivos

**Lo que ellos tienen:** autoservicio, encuestas, y estadísticas de participación.

**Lo que AK tiene hoy, verificado:** una pantalla que muestra fotos del muro
flotando, con fondo animado y varias formas de pantalla. **Nada más.**

**El híbrido de AK** (y ojo con el hallazgo de arriba: esto es lo que la app ya promete):

1. **El menú de la noche**, que el invitado lea qué se come sin preguntarle a nadie.
2. **Una sola pregunta por vez**, no un formulario. La gente en una fiesta no llena
   formularios. Una pregunta, tres respuestas con dibujos, y listo.
3. **Dónde me siento.** Que el invitado ponga su nombre y le diga la mesa. Es lo que más
   se pregunta en la entrada de una fiesta.
4. **La agenda de la noche**: a qué hora el vals, a qué hora la torta.
5. **Que se maneje solo**: si nadie lo toca en un minuto, vuelve a mostrar las fotos.

---

## Estación 8 — Cápsula del Tiempo

**Contra quién compite:** After The Tone (teléfono antiguo, 299 dólares el alquiler,
más 79 el libro virtual), y los libros de invitados digitales.

**Lo que ellos tienen, y es su mejor idea:** no entregan los audios el mismo día. Los
editan y los mandan después, **como una cápsula que se abre más adelante**. Y venden
el recuerdo físico: un USB o un disco de vinilo.

**El híbrido de AK, y acá les podemos ganar:**

1. **La cápsula se abre en una fecha.** Que el anfitrión elija cuándo —al mes, al año,
   a los quince años— y que la app **le avise sola ese día** con el enlace a los
   mensajes. Eso es lo que ellos cobran aparte y nosotros ya tenemos con qué hacerlo:
   el despertador de la app.
2. **Video además de audio**, en la misma tablet. Ellos necesitan un teléfono aparte.
3. **El resumen escrito de cada mensaje**, hecho por la asistente que la app ya tiene,
   para que el anfitrión sepa quién le dejó qué sin escuchar cuarenta audios.

**Ojo con la línea que no se cruza:** el aviso del día que se abre la cápsula **se
prepara y lo manda una persona**, como todo lo que sale para afuera.

---

## Cómo se entrega

- **Una sola propuesta**, con todos los bloques que puedas.
- **La documentación viaja adentro:** anotá en `docs/YA-RESUELTO.md` qué agregaste y
  **por qué se eligió así**, y actualizá `docs/MANUAL-DE-LA-APP.md`.
- Antes de subir, `npm run "publicar?"`. Si no pasa, no subas.
- **Si algo obliga a pagar un servicio nuevo, no lo contrates: dejalo preparado y
  escribí cuánto cuesta.**
