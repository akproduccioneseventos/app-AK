# Orden de trabajo — Entretenimiento 03

**Para:** Gemini (Antigravity)
**Escribe:** Claude (auditoría y verificación)
**Fecha:** 9 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

## Por qué existe esta orden

La fotocabina ya quedó funcionando como las cabinas comerciales: tanda de tres
fotos, guía en pantalla e impresión automática. **Eso ya está hecho y fusionado
(#899): no lo rehagas.** Está descrito en `docs/YA-RESUELTO.md`, con el porqué de
cada decisión.

Lo que sigue es llevar el mismo nivel a las estaciones de video, que hoy se
quedaron atrás. Se investigó cómo lo hacen las plataformas del rubro y de ahí
salen los pedidos de abajo.

---

## Antes de empezar, siempre

```
npx tsc --noEmit
npx jest --silent
npm run check:acentos
npm run build
```

**Si alguno falla, no subas.** Guardá en UTF-8 y cuidado con las comillas
invertidas: ya rompieron el proyecto tres veces.

Leé antes:

- **`docs/YA-RESUELTO.md`** — lo ya arreglado y las decisiones del dueño. Si un
  hallazgo tuyo figura ahí, es falso positivo. **Y anotá ahí todo lo que
  modifiques, en la misma propuesta**: arreglos, mejoras con su porqué, y falsos
  positivos descartados.
- **`AGENTS.md`, sección "Errores ya cometidos"**.

## Lo que NO tenés que tocar

- **La fotocabina.** Ya está terminada. En particular: la primera cuenta es de 10
  segundos y las otras de 4, **a propósito**; no las emparejes. Y sólo se cantan
  en voz alta los últimos cinco números, para no tapar la música del salón.
- **La impresión.** Vive en `src/lib/entretenimiento/imprimir-recuerdo.ts` y la
  comparten la fotocabina y el espejo mágico. Si una estación necesita imprimir,
  **usá esa función**; no armes otra.
- **El armado de la tira**, en `src/lib/entretenimiento/tira-fotocabina.ts`. Es
  formato 10x15 y no tira de 5x15, porque la tira obliga a impresora con
  cortadora.
- Los topes ya calibrados: video del invitado 15 segundos, 5000 fotos por evento,
  3 generaciones de IA por sesión, 41 estilos.

---

# BLOQUE A — Plataforma 360

**Propuesta completa.**

`src/app/evento/plataforma-360/[fiestaId]/page.tsx`

Hoy graba 15 segundos y sube el video al muro. Las plataformas comerciales
entregan el clip **ya trabajado**, y eso es lo que hace que el invitado lo
comparta en vez de borrarlo.

**Qué agregar:**

1. **Cámara lenta.** Es la marca registrada del 360: el video se muestra a
   velocidad reducida. Que se pueda elegir por fiesta desde la configuración de
   entretenimiento, con la lenta como opción por defecto.
2. **Música de fondo.** Que el operador pueda dejar cargada una pista para el
   evento y que salga en todos los clips.
3. **Marca del evento encima del video** (el nombre de la fiesta, como ya hace la
   fotocabina en el pie de la tira).
4. **Guía en pantalla como la fotocabina.** Hoy el invitado no sabe cuánto falta
   ni cuándo terminó. Copiá el patrón: cuenta grande, texto que dice qué hacer y
   aviso de que ya está.

**Ojo con esto:** procesar video en el navegador es pesado. Si la cámara lenta o
la música no se pueden hacer sin que el equipo se trabe en una tablet, **paralo y
avisá** en vez de entregar algo que en la fiesta se cuelga. Es una respuesta
válida.

---

# BLOQUE B — Bogue: es una estación de FOTOS

**Propuesta completa.**

`src/app/evento/bogue/[fiestaId]/page.tsx`

**Corrección del dueño, 9 de agosto de 2026: el Bogue es de fotos, no de video.**

Lo que hay hoy, verificado en el código: saca varias fotos seguidas (quedan como
imágenes sueltas en `capturedFrames`, línea 74) y después las pega en un video
boomerang de ida y vuelta (`processBoomerangVideo`, línea 345). Lo único que se
guarda y se sube es ese video `.webm` (línea 391). **Las fotos se descartan.**

**Qué hay que hacer:**

1. **Guardar las fotos, no sólo el video.** Son el producto principal de esta
   estación. Hoy se pierden apenas se arma el boomerang.
2. **Mostrárselas al invitado por separado**, como quedó la fotocabina: las ve
   todas, y elige.
3. **Que se puedan imprimir**, igual que la fotocabina. Usá la función
   compartida `imprimirRecuerdo` y el armado de `tira-fotocabina.ts`: **no
   escribas otra**.
4. **El boomerang queda como extra para el muro**, no como la salida única.
5. **Guía en pantalla**: cuántas van, cuánto falta, cuándo terminó.
6. **Si falla el armado del boomerang, que las fotos igual se guarden.** Hoy si
   eso falla el invitado se va sin nada.

**Ojo:** la fotocabina arma la tira con **tres** fotos. Fijate cuántas saca el
Bogue y, si son más, hablalo antes de forzarlas todas en una hoja.

---

# BLOQUE C — Cápsula del tiempo (buzón)

**Propuesta completa.**

`src/app/evento/buzon/[fiestaId]/page.tsx`

Funciona y avisa bien cuando falla, eso ya se verificó. Lo que le falta es lo
mismo que a las demás: acompañar al invitado.

**Qué agregar:**

- **Guía de qué decir.** Una pantalla vacía con un botón de grabar deja mudo al
  invitado. Poné dos o tres disparadores cortos ("contale algo a los novios",
  "un deseo para los quince") que se puedan cambiar por fiesta.
- **Escucharlo antes de mandarlo.** Que pueda oír lo que grabó y regrabar si no
  le gustó.
- **Aviso de cuánto le queda** mientras graba: hoy el tope de 15 segundos le
  puede cortar la frase por la mitad sin avisarle.

---

# BLOQUE D — Que el operador pueda probar todo antes de la fiesta

**Propuesta completa.**

En la configuración de entretenimiento ya hay una captura de prueba. Falta que
sirva para lo que importa: llegar a la fiesta sabiendo que todo anda.

**Qué armar:**

- Una prueba por estación contratada, que diga en criollo si la cámara, el muro y
  la impresora responden.
- **Que la prueba de impresión imprima de verdad una hoja de prueba.** Es el
  único modo de saber si la impresora está bien puesta antes de que haya cola.
- Un cartel claro por estación: "lista" o "revisá esto".

---

## Cuando termines cada bloque

Avisá el número de la propuesta. Y **anotá en `docs/YA-RESUELTO.md`, en la misma
propuesta, todo lo que modificaste**, con el porqué de cada decisión: es la única
memoria compartida entre las tres IA.
