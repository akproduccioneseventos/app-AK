# Orden 19 — Los ajustes que se pueden tocar y no cambian nada

**Para Gemini. Escrita el 30 de agosto de 2026.**

> # ARRANCÁ POR ESTA. Antes que la 15, la 16, la 17 y la 18.
>
> **Lo decidió el dueño.** Tenés cuatro órdenes abiertas y ninguna cerrada. Esta va primero
> por tres motivos:
>
> 1. **Es la más corta**: son ajustes que ya existen, no hay que inventar nada.
> 2. **Está medida**: cada punto dice qué archivo lo lee y cuál no. No hay que investigar.
> 3. **Arregla algo que hoy le miente al equipo**: el que arma la fiesta toca ajustes,
>    guarda, y no pasa nada. Eso se nota en una fiesta real.
>
> **Terminá esta y recién ahí seguí con las otras.** Cuatro órdenes empezadas y ninguna
> terminada no le sirven a nadie.

---

## CÓMO SE ENTREGA (leer esto primero)

**UNA SOLA PROPUESTA con todos los bloques adentro.** Cada fusión dispara un despliegue y
eso se paga. Si un bloque se traba, **entregá el resto igual, en la misma propuesta**, y
avisá cuál faltó y por qué.

Antes de dar por terminado: **`npm run "publicar?"` completo en verde**. Es la puerta y sin
eso no se fusiona nada. Y lo anotado en `docs/YA-RESUELTO.md`, en la misma propuesta.

---

## El problema, medido

La pantalla donde el equipo arma el entretenimiento
(`src/app/(app)/fiestas/nueva/entretenimiento/page.tsx`) ofrece **25 ajustes por estación**.
Se revisó, uno por uno, quién los lee en toda la app. El resultado:

| Estación | Cuántos de los 25 lee |
|---|---|
| Fotocabina | **11** |
| Plataforma 360 | 4 |
| Bogue | 4 |
| Espejo Mágico | 4 |
| Touchpix | 3 |
| Buzón | **1** (sólo el color) |

**La regla del proyecto lo dice sin vueltas:** *un control en pantalla que no cambia nada es
peor que no tenerlo, porque el que lo usa cree que hizo algo.* Hoy el equipo arma la
Plataforma 360, le pone texto de marca, mensaje para compartir y marcos, **guarda, y no pasa
nada**.

---

## BLOQUE 1 — Los siete que no lee NADIE, en ninguna estación

Verificado: el **único** archivo que los toca es la pantalla donde se editan.

| Ajuste | Qué hacer |
|---|---|
| `footerText` (texto del pie) | **Engancharlo.** Va abajo en la tira de recuerdo, donde hoy se dibuja el nombre del evento. |
| `shareMessage` (mensaje al compartir) | **Engancharlo.** Es el texto que acompaña al QR y al compartir. |
| `captureModes` (modos de captura) | **Engancharlo.** Decide qué ofrece cada estación: foto, GIF, video. Si una estación no tiene un modo, no se muestra. |
| `consentRequired` (pedir consentimiento) | **NO LO TOQUES.** Lo hace Claude: es de los que deciden qué se publica de un invitado. |
| `activeTemplateId` (plantilla activa) | **Engancharlo** como la plantilla que viene elegida al abrir la estación. |
| `overlayName` (nombre del marco) | **Sacalo de la pantalla.** Es una etiqueta suelta que no cambia nada y no vale la pena engancharla: el marco ya se elige con `marcosHabilitados`. |
| `deliveryChannels` (canales de entrega) | **Sacalo de la pantalla.** Promete mail y mensaje de texto, y **eso está decidido que no se hace**: la entrega es por QR. Un ajuste que promete algo que la app no cumple es una mentira al que lo usa. |

**Cuando saques un ajuste de la pantalla, sacá también el campo** si no lo usa nadie más, y
anotá en `YA-RESUELTO.md` por qué se sacó.

---

## BLOQUE 2 — Tres que sólo andan en la fotocabina

Se configuran para todas las estaciones y sólo los respeta una:

- **`brandText` (texto de marca)** — anda en la fotocabina y en la barra. **Falta en la 360,
  Bogue, Espejo y Touchpix**: que se dibuje en el recuerdo igual que en la fotocabina.
- **`qrCallout` (texto del QR)** — sólo fotocabina. Que aparezca junto al QR en todas las que
  entregan por QR.
- **`marcosHabilitados` (qué marcos se ofrecen)** — sólo fotocabina. **Bogue ya tiene su
  propio selector de marcos**: que respete esta lista en vez de mostrar los cuatro siempre.

---

## BLOQUE 3 — Lo que le falta a cada estación, y es poco

Ya que se toca esto, que cada estación respete lo que hoy ignora:

- **Plataforma 360**: no lee `accentColor`. Es la única que no toma el color de la fiesta.
- **Bogue**: no lee `reviewSeconds` (cuánto queda la revisión en pantalla).
- **Touchpix**: no lee `accentColor` ni `reviewSeconds`.
- **Buzón**: lee **sólo** el color. Le faltan `countdownSeconds`, `maxRetakes` y
  `allowGuestRetake`, que son los tres que ya usan todas las demás.

---

## LO QUE NO SE TOCA

- **La fotocabina anda y está probada de punta a punta.** Lo único que hay que hacer ahí es
  lo del bloque 2 si le corresponde. **No la rehagas.**
- **`consentRequired`**: lo hace Claude.
- **La entrega por mail o mensaje de texto: no se hace.** Ni se agrega, ni se deja el ajuste.
- **Nada que se pague por mes** sin preguntar antes.
- **No se cambia lo que ya funciona.** Si ves algo que "estaría mejor de otra manera" pero
  anda, no lo toques: anotalo en una línea al final de tu reporte.

## Y la prueba que hay que dejar

Por cada ajuste que enganches, **una prueba que mire el resultado**, no que el campo exista.
La forma correcta: poner el ajuste en la fiesta de prueba, abrir la estación, y comprobar que
**se ve lo que se configuró**. Si la prueba pasa igual con el ajuste sin enganchar, no sirve
—y el control "Lo que se dijo es lo que es" te la va a frenar—.
