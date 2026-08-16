# Siete bloques: tres cosas nuevas y cuatro agujeros reales

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 16 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. **Todo va en UNA SOLA PROPUESTA.** Si un
bloque se traba, entregá los demás igual en la misma propuesta y decí cuál faltó
y por qué.

**Son siete bloques y es mucho.** No pasa nada si no entrás con todos: entregá
los que estén terminados de verdad y avisá. Lo que no se acepta es entregar
cinco a medias. **El orden de importancia, si tenés que elegir:**

> **E, D, A, C, F, B, G.**

El E protege plata. El D evita un papelón en una fiesta de verdad. El A es el más
barato porque ya está construido.

## Antes de escribir una línea

**Nada de esto es un arreglo. La app está terminada y funciona.** Esto es
crecimiento y tapar agujeros. Los bloques A, B y C son ideas que el dueño eligió
después de mirar qué se usa en las fiestas grandes del mundo. Los bloques D a G
salieron de auditar el código y encontrar cosas que faltan de verdad.

Por eso la regla más importante de esta orden es al revés de lo habitual:

> **No construyas nada nuevo sin buscar primero.** Varios bloques se apoyan en
> motores que YA están en el repositorio. Uno de ellos **está entero y sin
> enchufar**. Si te encontrás escribiendo un cálculo de precios, un sistema de
> votación o un puntaje, **parate**: ya existe y lo estás duplicando.

**Las rutas de abajo las verifiqué a mano, abriendo cada archivo.** No salieron de
una búsqueda automática. Un ayudante que buscó esto mismo se perdió el sistema de
trivia completo del bloque A, así que no te fíes de una sola búsqueda.

---

# BLOQUE A — La trivia en la cena

**Es el más barato de todos y el que más se ve en el salón, porque ya está
construido.**

## Qué tiene que pasar

Antes de la tanda de baile, en la pantalla gigante aparece una pregunta:
*"¿Cuál es el blooper más grande de la quinceañera?"*. Todos responden desde el
celular en quince segundos. La pantalla muestra el podio.

## La sorpresa: está construido y nadie lo usa

Hay **dos sistemas** en el repositorio y hay que entender la diferencia:

**1. El que YA está enchufado y andando** — sirve para encuestas, no para trivia
con ganador:

- `src/app/actions/fiesta/screen-mode.actions.ts` — `launchGame()` lanza el juego,
  `voteActiveGameOption()` guarda el voto (con transacción, así no se pierden
  votos simultáneos), `clearActiveGame()` lo corta.
- `src/app/(app)/fiestas/nueva/muro-social/page.tsx` — el panel del equipo, con
  seis plantillas de juego, **una de ellas ya es de tipo `trivia`**.
- `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx` — la pantalla gigante dibuja
  la pregunta con las barras de porcentaje.
- El tipo `ActiveGameData` en `src/types/fiesta.ts` **ya tiene el campo
  `correctOptionId`**, o sea la respuesta correcta… **y nadie lo lee.**

**2. El que está entero y DESCONECTADO** — y es justo lo que falta:

- `src/lib/games/game-engine.ts` — tiene preguntas por defecto, verificación de
  respuesta correcta (`checkTriviaAnswer`) y **`calculateLeaderboard()`, que
  devuelve el podio: los tres primeros y también el ranking por mesa**.
- `src/components/games/TriviaGameScreen.tsx` — la pantalla del invitado.
- `src/components/games/TriviaAdminPanel.tsx` — el panel para cargar preguntas.
- `src/components/games/LeaderboardDisplay.tsx` — el podio dibujado.
- `src/components/games/PhotoMissionScreen.tsx` — misiones secretas por invitado.

**Estos cinco archivos no los usa ninguna pantalla.** Están escritos, terminados,
y muertos.

## Lo que hay que hacer, entonces

**No escribas una trivia. Enchufá la que hay.** El trabajo es de plomería:

1. **Que el podio aparezca en la pantalla gigante cuando la trivia termina.** Hoy
   se ven las barras con porcentajes mientras se vota, y después nada. Usá
   `calculateLeaderboard()` y `LeaderboardDisplay.tsx`, que ya están hechos.
   **El podio por mesa es el que enciende el salón**: las mesas compiten entre
   ellas.
2. **Que se use la respuesta correcta.** El campo está y se ignora. Al cerrar,
   marcar cuál era la buena, en verde, antes del podio.
3. **Que el invitado pueda responder desde su celular** sin instalar nada, con el
   código que ya escanea. Enganchate donde ya vota.
4. **Que el equipo pueda escribir sus propias preguntas** desde el panel del muro
   social. Las preguntas buenas son las de esa familia —"el blooper más grande de
   la quinceañera"—, no las genéricas que trae el motor de ejemplo.
5. **Quince segundos, con cuenta regresiva visible** en la pantalla grande.

**Si algo de los cinco archivos muertos no sirve o está a medio hacer, decilo y
hacelo de nuevo limpio.** Pero miralos primero: reescribir lo que ya está es
tirar plata.

## Cómo tiene que verse

Es una pantalla de televisor mirada **desde lejos, en un salón oscuro, por gente
parada y con ruido**:

- Letras enormes. La pregunta se tiene que leer desde la última mesa.
- El podio con animación cuando aparece: es el momento del aplauso.
- Nada de textos chicos ni de explicaciones. Una pregunta, opciones, podio.

---

# BLOQUE B — El video de la mañana siguiente

## Qué tiene que pasar

La fiesta termina a las seis. Al mediodía, cuando la quinceañera se despierta,
**ya tiene esperando un video corto y vertical con lo mejor de la noche**, listo
para subir a sus historias, con la marca de AK.

Hoy eso se pierde todas las noches: ella sube lo que le mandó una amiga por
WhatsApp.

## De qué colgarse (verificado)

- **Las fotos con sus corazones ya están.** `SocialGalleryPost` en
  `src/types/social-gallery.ts` tiene `likes`, `moderationStatus`, `mediaType` y
  `sourceModule` (de qué estación salió).
- **Elegir las mejores por corazones ya está resuelto dos veces.** Mirá
  `src/app/actions/social-media.ts`, en `generateDraftPostsFromPartyPhotos()`, que
  filtra aprobadas y ordena por corazones para quedarse con las cuatro mejores.
  **Usá ese mismo criterio**, no inventes otro.
- **El recap de la mañana ya existe, pero es sólo datos, no video.**
  `src/lib/recap/recap-engine.ts`, función `buildMorningRecap()`, y la pantalla
  `src/app/invitacion/[fiestaId]/recap/page.tsx`. **Ojo: hoy toma las primeras
  doce fotos sin ordenar por corazones.** Eso hay que cambiarlo.
- **El álbum público que el cliente reparte ya existe:**
  `src/app/evento/album/[fiestaId]/page.tsx`.

## Lo que NO existe y hay que hacer

**Nada arma un video.** Lo único parecido es el boomerang del Bogue, que es otra
cosa. No hay ffmpeg ni nada que compile.

**Antes de elegir cómo armarlo, mirá qué se puede hacer sin agregar herramientas
pesadas al servidor.** Si el video se puede armar en el propio celular del cliente
—las fotos pasando con música, grabado desde el navegador— es mucho mejor que
montar un procesador de video en el servidor. **Si te convencés de que no se
puede sin agregar algo pesado, no lo hagas: entregá los otros bloques y explicá
por qué.** Eso es una respuesta válida y esperada.

## Reglas que no se negocian

- **Sólo fotos aprobadas.** El `moderationStatus` manda. Una foto no moderada en
  las historias de la clienta es un problema serio.
- **La marca de AK va en el video**, discreta, y el enlace al simulador va en el
  texto que se le sugiere, no encima de la imagen.
- **Nada se publica solo.** Se le deja el video listo y un botón para
  compartirlo. **Publica ella, no el sistema.**

---

# BLOQUE C — El configurador visual para la reunión de cierre

**Es el que más plata cierra y el más grande de todos.**

## Qué tiene que pasar

Los padres van a la oficina a cerrar. Hoy AK les explica con palabras qué es la
pista LED, la pantalla gigante y la cabina 360. Ellos asienten pero no lo están
viendo, se llevan un PDF y se van a pensarlo. **Ahí es donde se pierden las
ventas.**

Con esto: se abre una tablet, se ve el salón, y **los padres tocan**. Tocan
"pista LED" y el salón cambia. Tocan "pantalla gigante" y aparece. Abajo, el
precio se mueve en el momento.

## De qué colgarse (verificado)

- **El cálculo de precios: `calculateSimulatorPricing()` en
  `src/lib/simulator/pricing.ts`.** Es el que usa el simulador público. Devuelve
  subtotal, descuentos, ajuste anual, total y precio por persona.
- **El catálogo de extras: `getServiciosEmpresa()` en
  `src/app/actions/servicios-empresa.ts`.** Cada servicio ya trae nombre, precio,
  foto y forma de cobro (fijo, por persona o por tramo).
- **El salón en 3D ya existe: `src/components/salon-3d/SalonScene.tsx`.** Dibuja
  mesas, pista, escenario, barra e iluminación, y tiene `captureScreenshot()`. Lo
  usan el croquis del salón y el armado de mesas.

## Lo que NO se toca, y es lo más importante de esta orden

> **El precio lo calcula `calculateSimulatorPricing()` y nadie más.**

Si escribís una suma de precios, una regla de descuento o el ajuste anual en la
pantalla del configurador, **está mal, aunque el número dé bien**. El día que
cambie un precio va a quedar uno viejo escondido acá, el cliente va a ver dos
números distintos en dos pantallas, y eso **mata la venta más que cualquier otra
cosa**.

El ajuste anual del 15% y el descuento del Club Uruguay son decisiones del dueño,
ya están adentro del cálculo, **no se recalculan acá**.

## Cómo tiene que verse

Es una pantalla para **una tablet apoyada en un escritorio, mirada por dos padres
y un vendedor al mismo tiempo**. Eso manda todo:

- **El salón ocupa la mayor parte de la pantalla.** Es lo que están mirando.
- **Los extras son botones grandes, de un toque**, con la foto del servicio y el
  nombre. Nada de casillitas: los va a tocar alguien que no conoce la app, con el
  dedo, sin que le expliquen.
- **Al tocar un extra tiene que verse que pasó algo.** Si alguno no se puede
  dibujar en el 3D, que al menos se prenda su tarjeta y aparezca en un resumen al
  costado.
- **El precio abajo, grande y siempre visible**: el total y el precio por persona.
  Que se vea moverse al tocar. Ése es el momento en que deciden.
- **Nada de jerga ni de botones de administración**: el cliente está mirando.

## Dónde vive

Una ruta interna nueva, dentro de la parte del equipo (pide sesión). No es
pública: es la herramienta del vendedor.

Y **al terminar, un botón que convierta eso en presupuesto de verdad** por el
camino que ya existe, para no cargar todo a mano de nuevo.

---

# SEGUNDA TANDA — Cuatro cosas que salieron de auditar, no de pedir

Los bloques A, B y C son ideas nuevas. **Estos cuatro son otra cosa: salieron de
mirar el código y encontrar agujeros reales.** Cada uno se verificó abriendo los
archivos, no con una búsqueda rápida.

**Si no llegás con los siete, entregá lo que tengas y decí qué faltó.** Pero
respetá este orden de importancia: **E, D, F, G.** El bloque E protege plata y el
D evita un papelón en una fiesta de verdad.

---

# BLOQUE D — Si se cae el internet en la fiesta, hoy no pasa nada

**Es el más aburrido de los siete y el más importante de todos.**

## Lo que se verificó

No hay **nada**. Ni un reintento, ni una cola, ni un aviso. Se buscó
`navigator.onLine`, escuchas de `offline` y colas de envío en todo
`src/app/evento/` y no aparece ninguna. Lo único que hay es el service worker de
`public/sw.js`, que guarda la app para que **abra** sin conexión, pero **ninguna
acción sobrevive**.

Traducido a la fiesta: el invitado sube una foto, se corta el wifi en ese
segundo, **la foto se pierde y él no se entera**. Lo mismo con anotar la llegada
de un invitado en la puerta y con un pedido a la barra.

Y no es una hipótesis rebuscada: **un salón lleno, doscientos celulares en el
mismo wifi.** El muro ya tarda hasta veinte segundos con buena conexión.

## Qué hacer

- **Que lo pendiente se guarde en el celular y se mande solo cuando vuelve la
  señal.** No hace falta resolverlo para toda la app: empezá por las tres que
  duelen en una fiesta —subir una foto al muro, anotar la llegada de un invitado
  y el pedido de la barra—.
- **Que la persona vea qué está pasando**: "se está guardando, no cierres" y
  después "listo". Nunca un botón que parece que anduvo y no anduvo.
- **Que no se duplique** si el envío sale dos veces. Una foto repetida en el muro
  es feo; un pedido de trago repetido en la barra es un problema.

**No inventes un sistema general de sincronización.** Tres acciones, bien
resueltas, y listo.

# BLOQUE E — Al cotizar, nada avisa si el margen no se va a cumplir

**Éste es de plata. Leé la restricción antes de escribir una línea.**

## Lo que se verificó

El cotizador **nunca mira lo que costaron las fiestas anteriores**. Se buscó
cualquier referencia a históricos dentro de `src/lib/simulator/`,
`src/lib/budget/` y el simulador público: **no hay ninguna**.

Los datos existen y están cargados: hay costos reales por fiesta
(`src/app/actions/fiesta/costos.actions.ts`), la pantalla de gestión de costos y
rentabilidad, y la comparativa de ganancias. **Pero eso vive aparte y no se cruza
nunca con el presupuesto que se está armando.**

Resultado: se puede cotizar unos quince en el Club Uruguay para 150 personas con
un margen que **en las últimas tres fiestas iguales no se cumplió**, y nadie
avisa hasta que la fiesta ya pasó.

## Qué hacer

Mientras se arma el presupuesto, **un renglón discreto** que compare contra
fiestas parecidas —mismo tipo de evento, salón parecido, cantidad de invitados
parecida— y diga algo como:

> *En las últimas 3 fiestas parecidas, la comida costó un 12% más de lo
> estimado.*

- **Avisa, no frena.** El dueño decide igual. Nada de bloquear el presupuesto.
- **Si no hay suficientes fiestas parecidas, no muestres nada.** Un promedio de
  una sola fiesta no dice nada y confunde.
- En criollo, no en jerga: "costó más de lo estimado", no "desvío de margen".

## La restricción, que es lo importante

> **Este bloque MUESTRA un aviso. NO toca el cálculo del precio.**

El precio lo sigue calculando `calculateSimulatorPricing()` en
`src/lib/simulator/pricing.ts`, exactamente igual que hoy. **No cambies un solo
número, ni una regla, ni el ajuste anual, ni un descuento.** Lo tuyo es leer lo
que pasó antes y ponerlo al lado, como un cartel. Nada más.

Si te encontrás modificando cómo se calcula un total, **parate y avisá**: eso lo
escribe Claude.

# BLOQUE F — Cada fiesta deja 200 invitados y no queda ninguno

## Lo que se verificó

Un invitado entra a la lista de prospectos **sólo si él solo se pone a pedir un
presupuesto**. Se confirmó en `src/lib/crm/public-lead-persistence.ts`: la
atribución guarda de qué fiesta y de qué invitado vino, **pero sólo cuando la
persona ya hizo la consulta por su cuenta**.

Los otros ciento noventa y pico —que usaron la fotocabina, subieron fotos, votaron
la música— se van y no queda nada de ellos.

## Qué hacer

**Pedirles permiso en el mejor momento posible**, que es cuando están
descargando su foto y están contentos:

- Un solo toque: *"¿Querés que te avisemos cuando armemos la tuya?"*
- El que dice que sí entra a la lista **con el nombre de la fiesta que lo trajo**,
  que es información que ya se guarda.
- Con lo mínimo: un contacto y listo. Nada de formularios.

## Lo que está prohibido

> **No se le manda nada a nadie que no lo haya pedido con un toque explícito.**

Nada de agarrar la lista de invitados de la fiesta y usarla. Nada de casillas ya
marcadas. **Eso quema la marca y es exactamente lo contrario de lo que se busca.**
Y como siempre: **no se manda nada solo**, se deja la lista para que el equipo
decida.

# BLOQUE G — El equipo trabaja de noche con pantallas blancas

## Lo que se verificó

La app **no tiene modo oscuro**. Existen los restos de la configuración pero no
hay ni interruptor ni nada que lo active, y sólo siete archivos usan estilos
oscuros.

A las tres de la mañana, en un salón a oscuras, el encargado abre el celular para
ver la lista de invitados y **se come una pantalla blanca en la cara**. Molesta, y
se ve amateur al lado de un salón ambientado.

## Qué hacer, y qué NO

> **No pintes la app de oscuro.** Son cientos de pantallas y ya se descartó una
> vez, con razón.

**Sólo las pantallas que se usan durante la noche de la fiesta**, que son un
puñado: la llegada de invitados en la puerta, el plan de la noche del equipo, la
moderación del muro y la logística. Ésas y ninguna más.

Y no es sólo el color: **botones grandes, letras grandes, mucho contraste.** Se
usa de pie, con una mano, apurado y con poca luz.

---

## Lo que NO se toca nunca

- Plata, cobros, comida y permisos: eso lo escribe Claude. En esta orden hay
  **dos puntos que rozan plata y los dos tienen la misma regla**: el precio del
  bloque C y el aviso del bloque E. En los dos, **se reusa y se muestra; no se
  recalcula nada**. Si te encontrás escribiendo cómo se arma un total, parate y
  avisá.
- La validación del token de proveedor en `fotografia` y `catering`.
- Los tiempos de la fotocabina: 10 segundos la primera foto, 4 las demás.
- Los topes del contrato: 10% de reducción, 30% de aumento.
- **Nada se publica ni se manda solo.** Ni el video, ni un mensaje, ni un posteo.
- **No subas el ruido** que se bajó: nada de carteles de éxito nuevos, ni
  parpadeos, ni globitos rojos que cuenten de más.
- **No migres colores al tema.** La app no tiene modo oscuro.

## Los controles antes de entregar

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx jest --silent`
4. `npm run check:acentos`

**Sobre el conjunto entero, no bloque por bloque.** Dos cosas que pasan por
separado pueden romper juntas; ya pasó.

Y para lo que se ve: **sacá las fotos antes y después.**

```
AK_FOTOS=true node scripts/run-playwright-production.mjs tests/e2e/fotos-de-la-app.spec.ts
```

Mirá las que empiezan con `celular-`: **es donde se va a ver casi siempre**. La
trivia es la excepción, que se mira en un televisor.

## Cuando termines

Avisá el número de la propuesta, anotá lo hecho en `docs/YA-RESUELTO.md` —con el
porqué de cada decisión, no sólo qué hiciste— y mové este archivo a `hechas/` en
la misma propuesta.
