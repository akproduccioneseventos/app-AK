# Devolución de la orden 41 — casi todo bien, una cosa no

**Lo que quedó bien y ya está fusionado.** Lo verifiqué abriendo los archivos, no por el nombre:

- **Firmar o dibujar sobre la foto.** `LienzoDibujoCompartido` está bien resuelto: el dibujo se
  funde en el lienzo **antes de imprimir y antes de publicar**, así que sale en la hoja y en el
  muro. Eso es lo que había que comprobar y se cumple.
- **Marco animado en la fotocabina**, reusando `dibujarMarcoDinamico` como se pidió.
- **Diseño de la hoja de impresión**: `disenoImpresion` llega hasta `imprimirRecuerdo` y el
  formato "dos" imprime dos fotos de verdad.
- **Cuántos cuadros tiene el loop del Bogue**: `cuadrosDelLoop` entra como `totalFrames` en la
  captura. Cambia el resultado.
- **Decoración**: cuenta los invitados sola y avisa si un elemento ya está usado.
- **El recorrido de pantallas** ya no llama "rota" a una pantalla que avisa correctamente que le
  falta un dato.

---

## Lo que hay que rehacer, y es una sola cosa

### La velocidad del recuerdo no hace nada

`velocidadRecuerdo` se lee (`src/app/evento/fotocabina/[fiestaId]/page.tsx:192`) y se **muestra
en pantalla** —"Efecto configurado: boomerang"— **y ahí termina**. No hay boomerang, no hay
cámara lenta y no hay GIF: el recuerdo sale igual con los tres valores.

**Es exactamente el error que la app ya tiene escrito en sus reglas:** un ajuste que se puede
tocar y que no cambia nada es peor que no tenerlo, porque el operador cree que hizo algo.

**Y la culpa de la comprobación es mía**, no tuya: la línea decía `usa: velocidadRecuerdo` y eso
se cumple con una variable. La línea nueva pide el resultado.

**Qué falta hacer, concreto:**

1. La fotocabina ya graba video: `mediaRecorderRef` en la línea ~248.
2. Con `velocidadRecuerdo === 'lenta'`, el video entregado tiene que durar **más** que la toma.
   **La plataforma 360 ya lo resuelve** en `src/app/evento/plataforma-360/[fiestaId]/page.tsx`,
   alrededor de la línea 442: guarda los cuadros y los vuelve a dibujar a menos cuadros por
   segundo (`outputFps = frames.length / targetDurationSec`). **Copiá ese camino, no inventes
   otro.**
3. Con `velocidadRecuerdo === 'boomerang'`, los cuadros van hacia adelante y después al revés.
   El Bogue ya hace el rebote: mirá cómo arma el loop antes de escribir nada.
4. Con `'normal'`, todo queda como está hoy.

### Y una menor, en la misma pasada

En `imprimir-recuerdo.ts`, los formatos **"una" y "tira" imprimen exactamente lo mismo**: una
sola foto que ocupa toda la hoja. Si "tira" es la tira de cuatro fotos de la fotocabina, tiene
que verse distinta; si no, sobra una de las dos opciones. **Dos opciones que hacen lo mismo son
un ajuste que engaña.**

---

## Cómo se comprueba, y ahora pide el RESULTADO

```comprobar
usa: velocidadRecuerdo === 'lenta' en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: velocidadRecuerdo === 'boomerang' en src/app/evento/fotocabina/[fiestaId]/page.tsx
prueba: tests/e2e/la-fotocabina-tiene-todo.spec.ts
```

Y la prueba de navegador tiene que **mirar el resultado**: con el efecto en "lenta", el video que
queda dura más que la toma. No alcanza con que la palabra aparezca en la pantalla.
