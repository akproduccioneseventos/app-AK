# Orden 20 — Igualar y superar a TODAS las plataformas del rubro

**Para Gemini. Escrita el 31 de agosto de 2026. Reemplaza la versión anterior de esta orden.**

> **Pedido del dueño, textual:** *"deben tener todo lo de las mejores plataformas en su
> totalidad: funciones, configuración, estética"*, *"el fondo se debe poder cambiar, las
> plataformas tienen varios, de un telón a varias cosas"*, *"la cámara también vertical u
> horizontal"*, *"necesito que repliques o mejores TODAS las funcionalidades"*.

## De dónde sale esta orden

**Se investigaron las plataformas líderes en agosto de 2026**, una por una: Simple Booth HALO,
dslrBooth/LumaBooth, Snappic, Touchpix y los programas de 360. Lo que sigue **no es una
opinión**: es lo que ellas hacen hoy, comparado contra lo que tenemos, medido archivo por
archivo.

**Nuestro estado real, medido:**

| Función | Las mejores | Nosotros |
|---|---|---|
| Cambiar el fondo (con y sin telón) | Todas | **NO EXISTE en ninguna estación** |
| Varios fondos para elegir en el momento | Todas | NO |
| Cámara vertical u horizontal | Todas | **NO: está fija** |
| Foto / GIF / boomerang / video / cámara lenta | Todas, en la misma estación | Repartido: cada una tiene una sola |
| Marcos animados | Touchpix trae 300 | Sólo marcos quietos |
| Filtro de belleza ("glam") | Todas | NO |
| Fondo desenfocado | Simple Booth | NO |
| Pantalla de espera con video | Todas | SÍ (5 de 6) |
| Galería de la noche | Todas | Sólo la Plataforma 360 |
| QR sin internet | Touchpix | Tenemos QR y cola sin internet |
| Impresión con diseño y copias | Todas | Imprime, pero **no lee** el diseño ni las copias |

**Lo que NO se copia, y es decisión tomada del dueño:** pedirle el mail o el teléfono al
invitado, y mandar por mail o mensaje de texto. **La entrega es por QR.** Las plataformas usan
eso para juntar contactos; nosotros no.

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA con todos los bloques adentro.** Cada fusión dispara un despliegue y eso
se paga. Si un bloque se traba, **entregá el resto igual, en la misma propuesta**, y avisá cuál
faltó y por qué.

**Los bloques están en orden de importancia. Si algo queda afuera, que sean los últimos.**

Antes de dar por terminado: **`npm run "publicar?"` completo en verde**, y anotado en
`docs/YA-RESUELTO.md`, en la misma propuesta.

---

## BLOQUE 1 — EL FONDO SE CAMBIA, CON TELÓN Y SIN TELÓN  ← LO MÁS IMPORTANTE

**Es la función que más se vende en el rubro y en toda nuestra app NO EXISTE.** Verificado:
cero resultados de segmentación en `src/app` y `src/lib`.

Las plataformas lo resuelven **por dos caminos, y hay que hacer los dos** porque el salón a
veces tiene telón y a veces no:

**1.a — Sin telón (lo que hace Simple Booth HALO y Touchpix).** La cámara reconoce a la
persona y le cambia todo lo que tiene atrás, sin poner nada en el salón.

- Se hace **en la máquina, sin pagar nada por mes**: MediaPipe Selfie Segmentation
  (`@mediapipe/selfie_segmentation`) o el equivalente de TensorFlow.js. **Si la única forma que
  encontrás cuesta plata por mes, NO la contrates: paralo y avisá.**
- **Touchpix lo hace sin internet.** Nosotros igual: el modelo se descarga con la app.

**1.b — Con telón verde o azul (lo que hace dslrBooth Pro).** Si el salón puso telón, se
recorta por color, que sale mejor y más rápido. Que la estación **elija sola**: si detecta un
fondo de color parejo usa el telón; si no, usa el reconocimiento.

**1.c — VARIOS fondos para elegir, y esto es lo que pidió el dueño.** No es un fondo: es una
tira de fondos abajo de la cámara —como la tira de estilos que ya tiene Touchpix— y **el
invitado toca y ve el cambio al instante, antes de sacar la foto**.

- Los fondos salen de **los que cargó el cliente para su fiesta**. Reusá el campo que ya
  existe para fondos; **no inventes uno nuevo**.
- Siempre va primero la opción **"Sin cambiar"**, elegida de entrada.
- Si el cliente no cargó ninguno, **la tira no se muestra**.

**1.d — Fondo desenfocado**, que es lo que hace Simple Booth cuando no querés cambiar el
fondo pero sí que la persona resalte. Es una opción más de la misma tira: "Desenfocar".

**Va en fotocabina, Bogue, Touchpix y Espejo Mágico.** En la 360 no (la cámara gira).

**Si la máquina no da** (se traba o baja de 15 cuadros por segundo), se apaga solo y la
estación sigue funcionando como hoy. **Nunca dejarla colgada por esto.**

**La prueba tiene que comprobar** que con dos fondos cargados aparecen dos opciones más la de
"Sin cambiar", y que **la imagen final con fondo cambiado es distinta** de la de sin cambiar.
Que exista el botón no alcanza.

---

## BLOQUE 2 — LA CÁMARA, VERTICAL U HORIZONTAL

**Lo pidió el dueño y todas lo tienen.** Hoy nuestras estaciones tienen la forma de la imagen
fija en el código.

- Un ajuste por estación: **vertical (2:3), horizontal (3:2) o cuadrada (1:1)**. Son las tres
  que usa el rubro.
- **Cambia de verdad la foto que sale**, no sólo cómo se ve la pantalla: el recuerdo, el marco
  y lo que se imprime tienen que salir con esa forma.
- Por defecto **vertical**, que es como están hoy y es lo que se usa en fiesta.
- El marco tiene que acompañar: si el marco es vertical y la foto horizontal, **se avisa al
  armar la fiesta**, no se deforma la imagen.

**La prueba:** con la estación en horizontal, la imagen que se guarda es más ancha que alta.

---

## BLOQUE 3 — TODOS LOS MODOS DE CAPTURA, EN TODAS

Hoy cada estación tiene **uno solo** y las plataformas los tienen **todos juntos**: dslrBooth
hace foto, video, GIF, boomerang y cámara lenta en la misma; Touchpix suma la súper lenta.

Nosotros ya tenemos todas las piezas, **pero cada una encerrada en una estación**:

- El boomerang está sólo en Bogue (`generarGifDesdeImagenes`).
- La cámara lenta está sólo en la 360 (`processSlowMotionVideo`).
- La tanda de fotos está sólo en la fotocabina.

**No hay que inventar nada: hay que compartirlas.** Sacá esas tres funciones a un lugar común
(`src/lib/entretenimiento/`) y que **cada estación ofrezca los modos que diga `captureModes`**,
que hoy no lo lee nadie.

La tira de modos va arriba del botón de disparar, como la de estilos de Touchpix. **Lo que no
esté en `captureModes` no se muestra.**

**La prueba:** con `captureModes` en sólo foto, no aparece el botón de video; con los dos,
aparecen los dos y cada uno genera su archivo.

---

## BLOQUE 4 — MARCOS ANIMADOS Y FILTRO DE BELLEZA

Dos cosas que tienen todas y nosotros no:

**4.a — Marcos animados.** Touchpix trae 300. Los nuestros son quietos. Que el marco pueda ser
un video corto o un GIF transparente encima de la captura. **Con tres o cuatro alcanza para
empezar** —uno de brillos, uno de confeti, uno con el nombre de la fiesta—, pero la estación
tiene que saber usarlos.

**4.b — Filtro de belleza ("glam").** Es el filtro más pedido del rubro: suaviza la piel. El
Espejo y Touchpix ya tienen filtros; **agregá "Belleza" a la misma lista** y que se pueda
dejar puesto por defecto con `filterPreset`, que hoy no lo lee nadie.

---

## BLOQUE 5 — LA GALERÍA DE LA NOCHE, EN TODAS

Hoy **sólo la Plataforma 360** deja ver lo que se sacó
(`src/app/evento/plataforma-360/[fiestaId]/page.tsx`, `recentVideos`, líneas ~75 y ~197). En la
fotocabina, Bogue y Touchpix el invitado saca su foto y **no puede ver nada más**.

Copiá ese mismo patrón —la tira de últimas capturas abajo de la pantalla de espera— a
**fotocabina**, **Bogue** y **Touchpix**. Mismo aspecto, mismo lugar.

**Sólo capturas aprobadas de esa fiesta.** No mezclar fiestas nunca.

**La prueba:** con dos capturas hechas la tira muestra dos; sin capturas no se muestra la tira
(no un hueco vacío).

---

## BLOQUE 6 — Repetir la toma, en las dos que no la tienen

`maxRetakes` y `allowGuestRetake` ya los leen la fotocabina, Bogue, el Espejo y Touchpix.
**Faltan en la Plataforma 360 y en el Buzón.**

- **Plataforma 360**: después de grabar, botón "Repetir" antes de quedarse con el video.
- **Buzón**: "Volver a grabar". El buzón guarda **un** mensaje, así que repetir es descartar el
  anterior y grabar de nuevo. **No inventes una tanda.**

Respetá el tope de `maxRetakes`, y que `allowGuestRetake` en falso **esconda el botón**.

---

## BLOQUE 7 — Los ajustes que se tocan y no hacen NADA

Contados uno por uno en las seis estaciones.

| Ajuste | Qué hacer |
|---|---|
| `captureModes` | **Engancharlo** (bloque 3). |
| `filterPreset` | **Engancharlo** (bloque 4.b). |
| `logoUrl` | **Engancharlo**: el logo del cliente en el recuerdo, al lado de la marca de agua que ya existe. |
| `printLayout` y `printCopies` | **Engancharlos** en la impresión de la fotocabina, que es la única que imprime. Los tamaños del rubro son **4x6 y la tira 2x6**. |
| `overlayName` | **SACALO** de la pantalla y sacá el campo. El marco ya se elige con `marcosHabilitados`. |
| `deliveryChannels` | **SACALO** de la pantalla y sacá el campo. Promete mail y mensaje de texto, y **está decidido que eso no se hace**. |
| `moderationMode` | **NO LO TOQUES: lo hace Claude** (decide qué se publica de un invitado). |

---

## BLOQUE 8 — Que todas lean lo que hoy ignoran

- **Plataforma 360**: es la **única que no usa el color de la fiesta**. Cero menciones de
  `accentColor`: su violeta está escrito a mano (líneas ~791, ~823, ~876). Que lo lea, como la
  fotocabina en `src/app/evento/fotocabina/[fiestaId]/page.tsx:867`.
- **Espejo Mágico** y **Buzón**: no muestran `brandText` ni `qrCallout`. Que los muestren junto
  al QR, igual que Bogue en `src/app/evento/bogue/[fiestaId]/page.tsx:1106-1107`.
- **`footerText`**: sólo lo leen la 360 y Bogue. Falta en fotocabina, Espejo, Touchpix y Buzón.

**La prueba ya existe** y hace exactamente lo que hay que hacer:
`tests/e2e/las-estaciones-respetan-los-ajustes.spec.ts` pone un texto inconfundible, abre la
estación, llega a la pantalla de compartir y mira que **se vea**. **Ampliala. No la cambies
para que pase.**

---

## BLOQUE 9 — Cómo se ven: tres cosas vistas en pantalla

**Visto en las fotos de `test-results/como-se-ven/`, no leído en el código.**

**9.a — El Buzón es BLANCO y las otras cinco son negras.** En un salón de noche una pantalla
blanca **encandila** al invitado que se acerca y desentona con el resto. **Que use el mismo
fondo oscuro.** Lo demás del Buzón está bien: **es sólo el fondo.**

**9.b — Botones parejos.** El de la fotocabina es de 64px con texto grande
(`fotocabina/[fiestaId]/page.tsx:881`) y **es el que está bien**. La 360 (~876) y Bogue (~923)
son de 56px con texto chico; los estilos de Touchpix tienen texto de 10px (~49-65). Que el
botón principal de todas sea como el de la fotocabina y que nada que se toque baje de 14px.
**No toques la fotocabina.**

**9.c — El botón de sacar la foto de Touchpix no tiene nombre**: es un círculo con un dibujo.
Se ve bien, pero una prueba automática no lo encuentra —ya frenó una— y quien no entiende el
dibujo no sabe qué hace. Ponele el nombre "Sacar foto" **sin cambiar cómo se ve**.

---

## BLOQUE 10 — Que no le hablemos en inglés al invitado

**Visto en pantalla:** en Touchpix los estilos son *Original, Disco Glam, Neón Retro, Fantasía,
Pop Art, Luxury*, y hay una solapa que dice **"Face Swap"**
(`src/app/evento/touchpix/[fiestaId]/page.tsx:48-55`).

**Traducí sólo "Disco Glam", "Pop Art", "Luxury" y "Face Swap"** (que es cambiar la cara). **Los
que ya están en castellano no se tocan.** Es lo único de idioma en toda la app.

---

## BLOQUE 11 — El tablero del operador

`src/app/(app)/fiestas/[id]/entretenimiento/control/page.tsx` y
`src/components/entretenimiento/TableroControlEstaciones.tsx`. Muestra bien todas las
estaciones, pero:

1. **No se actualiza solo**: hay que tocar "Actualizar Tablero" (~103-113). En una fiesta nadie
   está tocando eso. **Que se refresque solo cada 15 segundos.**
2. **No se puede apagar una estación desde ahí.** Que se pueda apagar y encender.
3. **Cuenta fotos pero no invitados.** Agregá cuántos invitados distintos participaron.

---

## LO QUE NO SE TOCA

- **`moderationMode` y `consentRequired`: los hace Claude.** Deciden qué se publica de un
  invitado. Igual todo lo de plata, cobros y comida.
- **La fotocabina anda y está probada de punta a punta.** Sólo lo que dicen los bloques.
- **Las siete pantallas que no son de captura** —álbum, DJ, galería, muro en vivo, tótem, video
  de vida y zona digital— **están auditadas y sanas. No las toques.**
- **No se le pide mail ni teléfono al invitado**, y **no se entrega por mail ni por mensaje de
  texto**: sólo QR.
- **Nada que se pague por mes** sin preguntar antes. Ni servicios de inteligencia artificial en
  la nube para quitar fondos: **va en la máquina.**
- **No se cambia lo que ya funciona.** Si ves algo que "estaría mejor de otra manera" pero anda,
  anotalo en una línea al final de tu reporte y no lo toques.

## Y la prueba que hay que dejar

Por cada cosa que enganches, **una prueba que mire el resultado en pantalla**, no que el campo
exista. Si la prueba pasaría igual con la función sin enganchar, no sirve —y el control "Lo que
se dijo es lo que es" te la va a frenar—.
