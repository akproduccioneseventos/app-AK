# Orden 20 — Que las estaciones tengan TODO lo de las mejores plataformas

**Para Gemini. Escrita el 31 de agosto de 2026.**

> **Pedido del dueño, textual:** *"deben tener todo lo de las mejores plataformas en su
> totalidad: funciones, configuración, estética."*
>
> Esto **no es una auditoría "a ver qué aparece"**: es trabajo que el dueño pidió. Todo lo que
> está acá abajo fue **medido y verificado a mano**, archivo por archivo. Ya se descartaron
> tres avisos falsos (que Bogue no leía el texto de marca, que la 360 no ponía marca de agua y
> que Touchpix no leía el color: **las tres cosas SÍ están** y no se tocan).

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA con todos los bloques adentro.** Cada fusión dispara un despliegue y eso
se paga. Si un bloque se traba, **entregá el resto igual, en la misma propuesta**, y avisá
cuál faltó y por qué.

Antes de dar por terminado: **`npm run "publicar?"` completo en verde**, y lo anotado en
`docs/YA-RESUELTO.md`, en la misma propuesta.

**El bloque 9 NO lo hagas: lo programa Claude** (decide qué se publica de un invitado).

---

## BLOQUE 1 — El fondo se cambia sin tela verde  ← ARRANCÁ POR ESTE

**Es la función estrella de las mejores (Sparkbooth, dslrBooth) y en toda nuestra app NO
EXISTE.** Verificado: cero resultados de segmentación en `src/app` y `src/lib`.

Qué tiene que pasar: el invitado se para frente a la cámara y **aparece con otro fondo** —una
foto que subió el cliente para su fiesta— sin poner ninguna tela atrás.

- Va en **fotocabina**, **Bogue** y **Touchpix**. En la 360 no (la cámara gira).
- Se hace **en el navegador, sin pagar nada por mes**: MediaPipe Selfie Segmentation
  (`@mediapipe/selfie_segmentation`) o el equivalente de TensorFlow. **Si la única forma que
  encontrás cuesta plata por mes, NO la contrates: paralo y avisá.**
- El fondo se elige **de los que cargó el cliente**: reusá el campo que ya existe para los
  fondos, no inventes uno nuevo. Si no hay fondos cargados, la opción **no se muestra**.
- **Si la máquina no da** (se traba o baja de 15 cuadros por segundo), se apaga solo y sigue
  funcionando como hoy. **Nunca dejar la estación colgada por esto.**

**La prueba tiene que comprobar** que con un fondo cargado aparece el botón de cambiar fondo,
y que al elegirlo la imagen final **es distinta** de la que sale sin fondo. Que exista el
botón no alcanza.

---

## BLOQUE 2 — La galería de la noche, en todas

Hoy **sólo la Plataforma 360** deja ver lo que se sacó
(`src/app/evento/plataforma-360/[fiestaId]/page.tsx`, `recentVideos`, líneas ~75 y ~197). En
la fotocabina, en Bogue y en Touchpix el invitado saca su foto y **no puede ver nada más**.

Copiá ese mismo patrón —la tira de últimas capturas abajo de la pantalla de espera— a
**fotocabina**, **Bogue** y **Touchpix**. Mismo aspecto, mismo lugar.

**Sólo se muestran las capturas aprobadas de esa fiesta.** No mezclar fiestas nunca.

**La prueba:** con dos capturas hechas, la tira muestra dos; sin capturas, no se muestra la
tira (no un hueco vacío).

---

## BLOQUE 3 — Repetir la toma, en las tres que no la tienen

`maxRetakes` y `allowGuestRetake` ya los leen la fotocabina, Bogue, el Espejo y Touchpix.
**Faltan en la Plataforma 360 y en el Buzón.**

- **Plataforma 360**: después de grabar, botón "Repetir" antes de quedarse con el video.
- **Buzón**: después de grabar el mensaje, "Volver a grabar". El buzón guarda un mensaje, así
  que **repetir = descartar el anterior y grabar de nuevo**. No inventes una tanda.

Respetá el tope de `maxRetakes` y que `allowGuestRetake` en falso **esconda el botón**.

**La prueba:** con `allowGuestRetake` en falso no aparece el botón; en verdadero aparece, y al
tocarlo se vuelve a grabar.

---

## BLOQUE 4 — Los ocho ajustes que se tocan y no hacen NADA

Contados uno por uno en las seis estaciones. Hoy el equipo los configura, guarda, y no pasa
nada.

| Ajuste | Qué hacer |
|---|---|
| `captureModes` | **Engancharlo.** Decide qué ofrece la estación (foto / GIF / video). Lo que no está en la lista, no se muestra. |
| `filterPreset` | **Engancharlo** como el filtro que viene elegido al abrir. El Espejo y Touchpix ya tienen filtros: usá los de ellos. |
| `logoUrl` | **Engancharlo**: el logo del cliente va en el recuerdo, al lado de la marca de agua que ya existe. |
| `printLayout` y `printCopies` | **Engancharlos** en la impresión de la fotocabina, que es la única que imprime. |
| `overlayName` | **SACALO de la pantalla** y sacá el campo. El marco ya se elige con `marcosHabilitados`. |
| `deliveryChannels` | **SACALO de la pantalla** y sacá el campo. Promete mail y mensaje de texto, y **está decidido que eso no se hace**: la entrega es por QR. |
| `moderationMode` | **NO LO TOQUES: lo hace Claude.** Decide qué se publica de un invitado. |

---

## BLOQUE 5 — Que todas lean lo que hoy ignoran

Medido, estación por estación:

- **Plataforma 360**: es la **única que no usa el color de la fiesta**. Cero menciones de
  `accentColor` en todo el archivo: su violeta está escrito a mano (líneas ~791, ~823, ~876).
  Que lo lea, como lo hace la fotocabina en `src/app/evento/fotocabina/[fiestaId]/page.tsx:867`
  con `style={{ backgroundColor: ... }}`.
- **Espejo Mágico** y **Buzón**: no muestran `brandText` ni `qrCallout`. Que los muestren
  junto al QR, igual que Bogue en `src/app/evento/bogue/[fiestaId]/page.tsx:1106-1107`.
- **`footerText`**: sólo lo leen la 360 y Bogue. Falta en fotocabina, Espejo, Touchpix y Buzón.
- **Buzón**: es la más pobre de todas. Además de lo de arriba, le faltan `maxRetakes` y
  `allowGuestRetake` (bloque 3).

**La prueba:** ya existe `tests/e2e/las-estaciones-respetan-los-ajustes.spec.ts` y hace
exactamente lo que hay que hacer: pone un texto inconfundible en la fiesta, abre la estación,
llega a la pantalla de compartir y mira que **se vea**. **Ampliala** con las estaciones y
ajustes que agregues. **No la cambies para que pase.**

---

## BLOQUE 6 — Botones parejos y grandes, que se usan a oscuras

Se usan en una fiesta, de noche, con gente parada y el dedo. Hoy no son parejos:

- **Fotocabina**: botón principal de 64px de alto, texto grande
  (`src/app/evento/fotocabina/[fiestaId]/page.tsx:881`). **Es el que está bien: ese es el
  patrón.**
- **Plataforma 360** (línea ~876) y **Bogue** (línea ~923): 56px y texto chico.
- **Touchpix**: botones de estilo con texto de 10px (líneas ~49-65). **Muy chico.**

Que el botón principal de **todas** sea como el de la fotocabina, y que ningún texto que el
invitado tenga que tocar baje de 14px.

**No toques la fotocabina**: ya está bien.

---

## BLOQUE 7 — Que no le hablemos en inglés al invitado

En **Touchpix** los estilos se le muestran al invitado mezclados: "Disco Glam", "Neón Retro",
"Fantasy Enchanted", "Pop Art", "Golden Luxury"
(`src/app/evento/touchpix/[fiestaId]/page.tsx:48-55`).

Ponelos todos en castellano. Es lo único de idioma que apareció en toda la app: **el resto
está bien y no hay que revisarlo.**

---

## BLOQUE 8 — El tablero del operador, que hoy es sólo un espejo

`src/app/(app)/fiestas/[id]/entretenimiento/control/page.tsx` y
`src/components/entretenimiento/TableroControlEstaciones.tsx`. Muestra bien todas las
estaciones, pero:

1. **No se actualiza solo**: hay que tocar "Actualizar Tablero" (líneas ~103-113). En una
   fiesta nadie está tocando eso. **Que se refresque solo cada 15 segundos.**
2. **No se puede apagar una estación desde ahí**: hay que ir hasta la máquina. **Que se pueda
   apagar y volver a encender desde el tablero.**
3. **Cuenta fotos pero no invitados.** Agregá cuántos invitados distintos participaron.

**La prueba:** que el tablero muestre un número nuevo sin que nadie toque nada, y que al
apagar una estación desde el tablero, la estación quede apagada.

---

## BLOQUE 9 — LO HACE CLAUDE, NO LO TOQUES

- `moderationMode` y `consentRequired`: deciden qué se publica de un invitado.
- Todo lo de plata, cobros y comida.

---

## LO QUE NO SE TOCA

- **La fotocabina anda y está probada de punta a punta.** Sólo lo que dicen los bloques 2 y 4.
- **Las siete pantallas que no son de captura** —álbum, DJ, galería, muro en vivo, tótem,
  video de vida y zona digital— **están sanas y auditadas. No las toques.**
- **Nada que se pague por mes** sin preguntar antes.
- **No se cambia lo que ya funciona.** Si ves algo que "estaría mejor de otra manera" pero
  anda, **anotalo en una línea al final de tu reporte** y no lo toques.

## Y la prueba que hay que dejar

Por cada cosa que enganches, **una prueba que mire el resultado en pantalla**, no que el campo
exista. Si la prueba pasaría igual con la función sin enganchar, no sirve —y el control "Lo
que se dijo es lo que es" te la va a frenar—.
