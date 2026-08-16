# Tres cosas nuevas: la trivia, el video de la mañana y el configurador

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 16 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. **Todo va en UNA SOLA PROPUESTA**, los tres
bloques juntos. Si un bloque se traba, entregá los otros dos igual en la misma
propuesta y decí cuál faltó y por qué.

## Antes de escribir una línea

**Nada de esto es un arreglo. La app está terminada y funciona.** Esto es
crecimiento: tres cosas que el dueño pidió después de mirar qué se está usando en
las fiestas grandes del mundo.

Por eso la regla más importante de esta orden es al revés de lo habitual:

> **No construyas nada nuevo sin buscar primero.** Los tres bloques se apoyan en
> motores que YA están en el repositorio. Uno de ellos **está entero y sin
> enchufar**. Si te encontrás escribiendo un cálculo de precios, un sistema de
> votación o un puntaje, **parate**: ya existe y lo estás duplicando.

**Las rutas de abajo las verifiqué a mano, abriendo cada archivo.** No salieron de
una búsqueda automática. Un ayudante que buscó esto mismo se perdió el sistema de
trivia completo del bloque A, así que no te fíes de una sola búsqueda.

---

# BLOQUE A — La trivia en la cena

**Empezá por acá: es el más barato de los tres y el que más se ve en el salón.**

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

**Es el que más plata cierra y el más grande de los tres.**

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

## Lo que NO se toca nunca

- Plata, cobros, comida y permisos: eso lo escribe Claude. En esta orden, el
  único punto que roza plata es el precio del bloque C, y la regla es clara:
  **reusar, no recalcular**.
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
