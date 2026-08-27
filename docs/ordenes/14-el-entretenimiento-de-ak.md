# Orden 14 — El entretenimiento de AK: una sola experiencia, mejor que cualquiera del mercado

**Para Gemini. Escrita el 27 de agosto de 2026.**

> **Ojo con el número:** hay otra orden 13 (`13-la-fotocabina-que-gana.md`), de otra IA, sobre la fotocabina. Esta es la **14** y no toca la fotocabina.

> # DEVOLUCIÓN 1 — 27 de agosto de 2026. LEER ANTES DE SEGUIR.
>
> **La entrega de la rama `feat/orden-14-entretenimiento-unificado` NO se fusionó.** No es
> por calidad del código: compila, los tipos dan cero, las 2268 pruebas pasan, la seguridad
> de la base pasa y los acentos están limpios. **El problema es otro: la mitad de lo que
> escribiste no lo llama nadie.**
>
> Existe, compila, tiene prueba propia… y **en la app no pasa nada**. Es exactamente la
> falla que describe `docs/COMO-AUDITAR.md`: *la pregunta no es "¿está escrito?", es "¿pasó
> de verdad?"*.
>
> ## Lo que hay que conectar (verificado por nombre de archivo Y por nombre de función)
>
> Ninguno de estos tiene **un solo** llamador en la aplicación. Sólo los importan sus
> propias pruebas:
>
> | Lo que escribiste | Quién lo usa hoy | Dónde tiene que engancharse |
> |---|---|---|
> | `src/lib/entretenimiento/gif-generator.ts` (`generarGifDesdeImagenes`) | nadie | La estación tiene que poder entregar el GIF después de la tanda |
> | `src/lib/entretenimiento/marcos-dinamicos.ts` (`dibujarMarcoDinamico`) | nadie | El armado del recuerdo, donde hoy se dibuja el marco fijo |
> | `src/lib/entretenimiento/resumen-noche.ts` (`calcularResumenNoche`) | nadie | El cierre de la fiesta y el tablero del operador |
> | `src/lib/social-gallery/moderacion-automatica.ts` (`evaluarModeracionFoto`) | nadie | Antes de la cola manual de `/evento/moderacion/[fiestaId]` |
> | `src/components/entretenimiento/SelectorFormatoCaptura.tsx` | nadie | La pantalla del invitado, antes de disparar |
>
> **Mientras no estén conectados, para el dueño esas cinco cosas no existen.** El muro sigue
> moderándose 100% a mano, no hay GIF, el marco sigue siendo el fijo y nadie ve el resumen
> de la noche.
>
> ## Y el tablero del operador no tiene puerta
>
> `/fiestas/[id]/entretenimiento/control` existe y está bien hecho, pero **no hay ningún
> botón ni menú que lleve hasta ahí**. Sólo figura en el mapa generado. Una pantalla sin
> puerta es una pantalla que nadie va a abrir: hay que dejarla a un toque desde donde el
> equipo maneja la fiesta.
>
> ## Falta el bloque 14 entero, y no avisaste
>
> **No hay nada de la música**: ni la bandeja que entiende enlaces de Spotify y de YouTube,
> ni el cruce con los pedidos de los invitados, ni la playlist en la cuenta del dueño, ni la
> comprobación real del panel de conexiones que se te pidió hacer desde tu máquina.
>
> La orden dice, textual: *"Si un bloque se traba, entregá el resto igual, en la misma
> propuesta, y avisá cuál faltó y por qué."* **Entregar sin decir qué falta es lo que hace
> que el dueño se entere tarde.** Si algo no se pudo, se dice en una línea.
>
> ## Lo que sí quedó bien, y no se toca
>
> - **El saludo y la guía en pantalla** (`GuiaPosicionamiento`), enchufada de verdad en la
>   Plataforma 360, en Bogue y en Touchpix.
> - **El arreglo del tótem**: el texto ya no se parte palabra por palabra ni se pisa.
> - **El Club Uruguay siempre visible** en la Presentación LED, marcado como opcional y
>   aclarando que el alquiler se abona en el Club. Bien resuelto.
>
> ## Y una cosa más: `docs/YA-RESUELTO.md` quedó afirmando cosas que no pasan
>
> Anotaste *"auto-aprobación de capturas"*, *"resumen automático para el cliente"* y
> *"generación de GIFs para compartir"* como si funcionaran. **No funcionan: nadie los
> llama.** Esa lista es la que leen las próximas auditorías para no volver a revisar algo;
> si dice que algo anda cuando no anda, el error queda tapado para siempre. Corregilo en la
> misma entrega.
>
> ## Cómo se cierra esto
>
> **En la misma propuesta**, no en una nueva: conectá las cinco piezas, ponele puerta al
> tablero, hacé el bloque de la música (o decí en una línea por qué no), y dejá
> `YA-RESUELTO.md` diciendo sólo lo que de verdad pasa.
>
> **Y antes de entregar, la prueba que importa no es que compile:** abrí la app y confirmá
> que el invitado puede llevarse un GIF, que el marco sale con el nombre de la fiesta, que
> una foto mala queda frenada sola y que el resumen de la noche se ve en algún lado.

---

## CÓMO SE ENTREGA (leer esto primero)

**UNA SOLA PROPUESTA DE CAMBIOS con todos los bloques adentro.** No una por bloque:
cada fusión dispara un despliegue y eso se paga.

Si un bloque se traba, **entregá el resto igual, en la misma propuesta**, y avisá cuál
faltó y por qué.

Antes de dar por terminado: compila, pruebas en verde, `npm run check:acentos` limpio, y
lo anotado en `docs/YA-RESUELTO.md` y `docs/QUE-HAY-EN-LA-APP.md` **dentro de la misma
propuesta**. Si tocás o agregás una pantalla, corré `npm run mapa:generar`.

**La fotocabina queda afuera.** La está trabajando otra IA en paralelo. **No la toques.**

---

## Lo que hay que construir, en una frase

Hoy AK tiene **seis estaciones sueltas**, cada una con su pantalla, sus reglas y su forma
de hacer las cosas. Hay que convertirlas en **una sola experiencia**: la misma para el
invitado en todas, la misma para el operador en todas, y que **sepa de qué fiesta se trata
y quién está parado adelante.**

Eso último es lo que ninguna plataforma del mundo puede hacer, y es la razón por la que
esto va a quedar mejor que todas: **los programas del rubro son fotocabinas sueltas.** No
conocen a los invitados, ni las mesas, ni el tema de la fiesta, ni al cliente. La app de AK
sí. Todo lo que sigue sale de ahí.

---

# PARTE 1 — LA EXPERIENCIA DEL INVITADO

**Una sola, igual en la Plataforma 360, en Bogue, en el Espejo Mágico, en Touchpix y en la
cápsula del tiempo.** Hoy cada una hace lo suyo a su manera. Que el invitado pase de una a
otra y sienta que es la misma fiesta.

## BLOQUE 1 — La estación lo conoce

Cuando el invitado llega con su enlace personal —el mismo que ya usa para su mesa y para el
hub— la estación **lo saluda por su nombre**: *"Hola, Lucía. Ponete cómoda."*

- La captura queda **atada a ese invitado**: aparece después en su recuerdo personal y en
  el álbum del cliente, **sin que tenga que hacer nada más**.
- **Si no viene el enlace, la estación funciona igual, sin nombre.** Nunca se bloquea por
  no saber quién es.
- Los textos, cortos y en criollo: los lee parado, con gente atrás esperando.

## BLOQUE 2 — Elige qué quiere, con un toque

Una fila de opciones grande y clara, siempre en el mismo lugar en todas las estaciones:
**foto, GIF, video, boomerang y avatar con inteligencia artificial.**

- Cada estación ofrece lo que puede hacer y **no muestra lo que no**.
- **El GIF hay que agregarlo**: es lo que la gente manda por WhatsApp y hoy no está en
  ninguna. Tres o cuatro fotos seguidas que se repiten.
- En la pantalla de revisión puede **cambiar de idea sin repetir la toma**: si sacó la
  secuencia, que pueda llevarse la foto o el GIF.

## BLOQUE 3 — La guía que lo lleva de la mano

- **Dónde pararse**, dibujado en pantalla.
- **Cuenta regresiva grande**, que se vea de lejos.
- **Qué está pasando** en cada momento: "grabando", "procesando", "listo".
- Nada de pantallas mudas: si la app está trabajando, se dice.

## BLOQUE 4 — El fondo se cambia sin tela verde

La inteligencia artificial recorta a la persona y le pone atrás lo que se elija: el salón
decorado, el tema de la fiesta, una foto que trajo el cliente.

- El operador elige el fondo desde los ajustes de la estación.
- **Se puede apagar**: si el recorte sale mal, la foto normal tiene que salir igual.
- **Si esto obliga a contratar un servicio que se paga por mes, dejalo preparado y
  preguntá antes de contratar.** Esa regla no se rompe.

## BLOQUE 5 — El marco se arma solo con los datos de la fiesta

Hoy los marcos son imágenes fijas que alguien tiene que cargar.

- Que el marco **se arme solo** con lo que la app ya sabe: el nombre del agasajado, la
  fecha y los colores del evento. **Sin que nadie cargue nada.**
- Que **se mueva**: un brillo que pasa, confeti que cae, el nombre que aparece. Alcanza con
  **tres o cuatro** que luzcan —uno elegante, uno de quince, uno de casamiento, uno de
  cumpleaños de nene—, no con trescientos.
- Igual en la foto y en el video.

## BLOQUE 6 — Los accesorios se le pegan a la cara

Hoy los stickers del espejo quedan quietos donde uno los suelta.

- Anteojos, bigote, sombrero, corona y orejas **pegados a la cara**, que la sigan cuando se
  mueve.
- Que ande con **varias personas** en la foto, cada una con los suyos.
- Los stickers sueltos de ahora **se quedan**: esto se suma, no los reemplaza.

## BLOQUE 7 — Se la lleva sin dar un dato

- **QR grande**, que se escanee de lejos y en un toque.
- **Nada de pedirle el mail ni el teléfono.** Decidido: frena la fila y junta datos que
  después hay que cuidar.
- **Si no hay señal, la captura se guarda y se sube sola cuando vuelve.** Que el invitado
  no se quede esperando ni pierda su foto.

---

# PARTE 2 — LA EXPERIENCIA DEL OPERADOR

Hoy el operador tiene una pantalla por estación y ninguna le dice cómo va la noche.

## BLOQUE 8 — Un solo tablero para toda la fiesta

Una pantalla donde el operador ve **todas las estaciones juntas**:

- Cuál está prendida y cuál no.
- **Cuántas capturas lleva cada una esta noche**, con número grande.
- La última captura de cada una, para darse cuenta de un vistazo si algo salió mal.
- **El aviso cuando una estación falla**, en criollo y diciendo qué hacer.
- Desde ahí se entra a operar cualquiera.

Que el número sea **de verdad**: sale de lo guardado. Si no se puede leer, **se dice que no
se pudo**; nunca un cero que parezca un dato real.

## BLOQUE 9 — Todo listo antes de llegar al salón

Que el equipo prepare la fiesta **desde la app, el día anterior**: qué estaciones van, qué
marcos, qué estilos de IA, qué fondos. Que al llegar al salón esté todo cargado y sólo haya
que prender.

## BLOQUE 10 — El resumen de la noche

Al cerrar la fiesta, **automático**: cuántas capturas hizo cada estación, cuál fue la más
usada y a qué hora estuvo el pico.

Ese resumen **se le muestra al cliente**. Es material de venta para la próxima fiesta.

---

# PARTE 3 — LO QUE SE MIRA Y LO QUE QUEDA PARA DESPUÉS

## BLOQUE 11 — El tótem se ve desarmado (ESTÁ ROTO)

Se abrió `/evento/totem/[fiestaId]/[totemId]` en el navegador y la pantalla sale rota: el
texto "Escaneá el QR y compartí tus fotos en la pantalla" cae **una palabra por renglón**,
el título de la fiesta queda **cortado arriba**, y el cartel "SUBÍ TU FOTO AL MURO" **se
pisa** con lo que tiene detrás.

Es la pantalla que los invitados miran toda la noche parada en el salón.

- Que el texto ocupe el ancho que tiene y no se parta palabra por palabra.
- Que el título entre entero y que ningún cartel se pise con otro.
- **Probalo parada (vertical, como se usa en el salón) y acostada.** Dejá una foto de
  pantalla de cada una en la propuesta.

## BLOQUE 12 — El muro se modera solo primero

Hoy es 100% a mano: alguien mira foto por foto. En una fiesta de ochenta invitados eso no
lo hace nadie, y el muro termina sin moderar.

- Lo claramente bien, **entra solo**.
- Lo claramente mal —desnudo, pantalla negra, ilegible, repetido— **queda frenado solo**, y
  se avisa por qué.
- Lo del medio va a la cola de siempre para que decida una persona.
- **El operador siempre puede dar vuelta la decisión de la máquina, en los dos sentidos.**
- **Que no frene de más:** ante la duda, va a la cola humana, no al rechazo. Una foto buena
  frenada molesta más que una regular publicada.

## BLOQUE 13 — La cápsula del tiempo se abre sola

Hoy los mensajes quedan guardados y ahí terminan.

- Que se pueda marcar **cuándo se abre**: al año, a los cinco, a los quince.
- Que **el despertador la abra solo** cuando llega la fecha y avise que los mensajes están
  esperando. Que nadie se tenga que acordar.
- **El aviso se prepara y lo manda una persona**, como todo lo que sale para afuera.

---

# PARTE 4 — LA MÚSICA, QUE ES LO QUE MÁS SE USA Y LO QUE PEOR ESTÁ

## BLOQUE 14 — La música de la fiesta, toda junta y conectada de verdad

**Pedido del dueño, 27 de agosto de 2026.** Sus palabras: *"quiero que el cliente pueda
compartirme su playlist de Spotify conectado al mío"* y *"muchas veces nos pasan link de
YouTube; quiero que todo esté conectado, no sólo el link."*

### Qué pasa hoy

La música de la fiesta llega por todos lados y **queda tirada en pedazos**:

- El cliente manda un link de Spotify o de YouTube por WhatsApp.
- La app guarda **el link pelado** (`playlistFiesta` en `src/types/fiesta.ts:952`): nadie
  sabe qué canciones tiene adentro hasta que alguien lo abre a mano.
- Los invitados piden temas desde la invitación y quedan como texto suelto
  (`cancionesDJ` en `src/types/fiesta.ts:60`).
- El equipo termina copiando todo a mano para armar la lista del DJ.

**Guardar un link no es tenerlo conectado.** Eso es lo que hay que cambiar.

### Qué hay que construir: una sola bandeja de música por fiesta

Un solo lugar donde entra **cualquier cosa** y sale **una sola lista de canciones**:

1. **Entra lo que sea, sin preguntarle al cliente qué es:**
   - Link de una playlist de Spotify.
   - Link de un tema suelto de Spotify.
   - Link de un video de YouTube.
   - Link de una playlist de YouTube.
   - Texto pegado, tal cual lo manda por WhatsApp: *"Despacito, Bad Bunny - Tití me
     preguntó, La Bicicleta"*.

2. **La app reconoce sola qué es y lo resuelve a canciones de verdad**: título y artista,
   no un link. Ya existe la búsqueda en Spotify (`src/lib/spotify.ts`), que hoy anda con
   una llave de la aplicación y sirve para buscar y para leer playlists públicas.

3. **Cada canción queda cruzada entre los dos servicios.** Si vino de YouTube, se busca su
   equivalente en Spotify y se guardan los dos enlaces. Si vino de Spotify, igual al revés
   cuando se pueda. Así el DJ la encuentra esté donde esté.

4. **Todo se junta con los pedidos de los invitados**, en la misma lista, marcando de dónde
   salió cada tema: del cliente, de un invitado (y cuál), o del catálogo de AK.

5. **Se vuelca a una playlist en la cuenta de Spotify del dueño**, con el nombre de la
   fiesta, y **se mantiene al día sola** cuando entran pedidos nuevos.

6. **Y el DJ la ve ordenada**, que es para lo que se hace todo esto. Palabras del dueño:
   *"si es para mejor organización del DJ, mejoralo."* En su pantalla:
   - **Los momentos de la fiesta separados**: entrada, cena, vals, baile, torta, cierre.
     La app ya sabe qué momentos tiene la fiesta.
   - **Qué pidió el cliente y qué pidieron los invitados**, marcado, sin mezclar.
   - **Los repetidos juntados**: si diez invitados piden el mismo tema, aparece una vez,
     con el número al lado. Eso además le dice al DJ qué es lo que más quieren.

### LO QUE YA EXISTE Y NO SE REHACE

Se verificó en el código. **No lo construyas de nuevo: conectá lo nuevo a esto.**

- **La pantalla del DJ ya separa "infaltables" y "prohibidas"**, y las prohibidas ya salen
  bien visibles (`src/app/evento/dj/[fiestaId]/page.tsx:130` y siguientes). Las canciones
  que entren por la bandeja nueva **tienen que caer en esa misma pantalla**, no en otra.
- **Ya se imprime la lista para el DJ** (`Imprimir para DJ`, en la pantalla de música del
  equipo). Que lo nuevo salga también ahí.
- **Ya está el campo de la canción del vals.**
- **Ya se buscan canciones en Spotify** (`src/lib/spotify.ts`), y la invitación ya lo usa
  para que el invitado pida temas.

**El agujero real es uno solo:** hoy los enlaces del cliente caen en un **cuadro de texto
libre** —dice literalmente *"Escribe géneros, artistas o pega enlaces a Spotify/YouTube..."*—
y **nadie los abre nunca**. Quedan ahí como texto. Eso es lo que hay que resolver.

### Y algo que apareció al revisar: el panel de conexiones puede mentir

El dueño preguntó si Spotify y YouTube están conectadas de verdad. Mirando
`src/app/actions/conexiones-estado.actions.ts` se ve que **el estado no se prueba contra el
servicio**: se decide por lo que hay guardado.

- **YouTube** figura "conectada" con que exista una ficha guardada marcada como conectada.
  Si el permiso venció, **sigue diciendo "conectada"**.
- **Spotify** figura "conectada" con que exista la llave de la aplicación
  (`SPOTIFY_CLIENT_ID`), aunque **la cuenta personal del dueño no esté autorizada**. Con
  eso se puede buscar canciones, pero no escribir en su playlist. El cartel no distingue
  una cosa de la otra.

Justo arriba, en el mismo archivo, Google Analytics **sí** está bien resuelto, y lo dice el
comentario: *"El estado se decide por lo que hace funcionar la medición, no por lo que haya
escrito en Ajustes."* Spotify y YouTube tienen que cumplir la misma regla.

**Primero, algo que sólo podés hacer vos, Gemini:** esta revisión se hizo en un contenedor
de prueba **sin acceso a la base ni a las credenciales de producción**, así que no se pudo
comprobar si las cuentas están conectadas de verdad. Vos corrés en la máquina del dueño y sí
tenés los accesos.

**Comprobalo y decilo en una línea en tu reporte:** si Spotify y YouTube contestan hoy, y en
el caso de Spotify, si la cuenta personal del dueño está autorizada para escribir en sus
playlists o sólo está la llave de la aplicación. **No lo des por hecho: probalo contra el
servicio.** Si algo falta, decí exactamente qué falta, en criollo y sin jerga.

**Qué hay que hacer:**

- Que el estado de las dos **se pruebe de verdad** contra el servicio, no contra lo guardado.
- Que Spotify muestre **los dos niveles por separado**, porque son distintos:
  *"buscar canciones: anda"* y *"escribir en tu playlist: falta permiso"*.
- Si el permiso venció, **decirlo y dejar el botón para renovarlo ahí mismo**.
- **No mostrar "conectada" sin haberlo comprobado.** Es la regla de la app: ninguna pantalla
  afirma lo que no verificó.

### Lo que hay que respetar, y no es negociable

- **Nada inventado.** Si un video de YouTube no se puede identificar como canción, **se
  dice cuál no se pudo** y queda a la vista para resolverlo a mano. Nunca poner "algo
  parecido" como si fuera lo que pidió el cliente. Es su fiesta.
- **Lo que la máquina entendió se muestra antes de darlo por bueno.** El nombre del video
  de YouTube no siempre es el nombre de la canción: que se vea qué entendió y que se pueda
  corregir de un toque.
- **Si la playlist del cliente está en privado, nadie la puede leer.** Decírselo en criollo
  en la misma pantalla —*"tu lista está en privado y no la podemos ver; ponela en pública o
  compartida"*— y dejarle el camino hecho. Nada de un error técnico.
- **El dueño YA conectó Spotify y YouTube.** Están cargadas en el panel de conexiones de
  la app (`conexiones-estado.actions.ts` las reconoce). **No le pidas que las conecte de
  nuevo ni le armes otro botón**: usá lo que ya está.
  Ojo con una diferencia real: leer listas públicas y buscar canciones funciona con la
  llave de la aplicación, pero **escribir en la playlist personal del dueño necesita el
  permiso de su cuenta**. Si ese permiso falta, **la pantalla lo dice en criollo y en un
  renglón** —*"falta darle permiso a la app para escribir en tu Spotify"*—, y **todo lo
  demás sigue andando igual**: leer, reconocer, cruzar y armar la lista adentro de la app.
  Que la falta de permiso no rompa nada ni frene al DJ.
- **Nada que se pague por mes.** La búsqueda de Spotify y la lectura de YouTube se hacen
  con los cupos gratis. Si en algún momento no alcanzan, **se avisa y se pregunta**: no se
  contrata nada.

### Cómo se aplica acá la regla de la app

Automático para **leer, reconocer, cruzar y armar**. Mano humana para **confirmar lo dudoso**
y para decidir el orden de la noche. Nada de esto sale para afuera ni toca plata, así que el
resto va solo.

---

# PARTE 5 — LO QUE QUEDÓ SIN HACER DE ANTES

## BLOQUE 15 — El Club Uruguay se ofrece SIEMPRE en la Presentación LED

En `src/app/presentacion-led/slides/datos-evento-slide.tsx:281` el Club sólo aparece si el
cliente dice que **no** tiene salón. El que llega con otro salón medio decidido **nunca ve
las fotos**, y es justo al que se le puede dar vuelta la cabeza.

- Una pantalla propia del Club, **disponible en cualquier momento de la presentación**:
  fotos que luzcan, capacidad y el descuento.
- Que se pueda ofrecer **sin borrar lo que el cliente ya eligió**.

Palabras del dueño, y es la parte importante:

> *"El Club Uruguay se ofrece, pero no es obligación contratarlo."*

- **Se muestra como una opción, nunca como un requisito.** El cliente puede traer su propio
  salón y AK le arma la fiesta igual. Eso es parte de lo que vende: flexibilidad.
- **Nada de textos que presionen.**
- **Si ya eligió otro salón, se le muestra una vez y no se le vuelve a poner adelante.**
- **El presupuesto queda bien armado con cualquiera de las dos opciones.**
- El alquiler del Club **se paga aparte, directamente en el Club**. Ese texto ya existe y
  está bien: no lo cambies.

---

## LO QUE YA ANDA Y NO SE TOCA

No lo reescribas, no lo "mejores" y no lo reportes como problema:

- **La cámara lenta de la Plataforma 360.** No es un botón: graba a 15 cuadros por segundo
  y los estira. Y el marco que dibuja sobre cada cuadro.
- **El boomerang y los cuatro marcos de Bogue.**
- **Los stickers, la firma con el dedo, los estilos de IA y los filtros del Espejo Mágico.**
- **La entrega por QR** y los botones de compartir del álbum y la galería.
- **El aviso de señal mala**, la impresión, el consentimiento y el límite de repeticiones.
- **La cápsula con video, audio y foto.**

**Ya se arregló, no lo rehagas:** ninguna estación podía abrir su sesión —el operador tocaba
"Iniciar cuenta regresiva" y aparecía un cartel rojo en inglés—. Corregido en
`src/app/actions/fiesta/sesion-entretenimiento.ts`.

## LO QUE NO SE HACE (decidido)

- **Pedirle el mail o el teléfono al invitado para mandarle la foto.**
- **Encuestas al invitado en la estación.**
- **La fotocabina.** La trabaja otra IA.
- `apphosting.yaml`: el servidor se duerme a propósito.
- **Nada que aumente lo que se paga por mes sin preguntar antes.**
- **El WhatsApp prepara mensajes y no los manda.**
- **Ningún precio ni promoción se inventa**: salen del catálogo.
- **No se promete un plazo de respuesta ni un precio congelado.** El ajuste anual del 15%
  va siempre.

## Y la regla que manda sobre toda esta orden

**No se cambia lo que ya funciona.** Hacé lo que dice esta orden y nada más. Si mientras
trabajás ves algo que "estaría mejor de otra manera" pero anda, **no lo toques**: anotalo
en una línea al final de tu reporte y que decida el dueño.
