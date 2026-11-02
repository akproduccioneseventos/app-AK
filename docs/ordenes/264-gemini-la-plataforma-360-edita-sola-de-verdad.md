# Orden 264 — La Plataforma 360 edita sola el video, como las apps del rubro (03/11/2026)

**Para Gemini.** Va en la **misma** entrega que las órdenes 262 y 263 (rama `gemini/orden-262-anuncio-al-simulador`).
Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` y usá la skill `animaciones-pro`.

**Lo dijo el dueño (02/11/2026):** *"mi app no edita sola"*, comparándola con funEvent. **Tiene razón, y Claude lo midió.**

`src/app/evento/plataforma-360/[fiestaId]/page.tsx`:

- graba a **15 cuadros por segundo y 480 de ancho** (~485-496);
- graba sólo **un tercio** del tiempo pedido;
- `processSlowMotionVideo` (~519) **estira todo parejo**, de modo que el video sale entero lento y entrecortado.

**No hay cambios de velocidad ni ida y vuelta.** Lo que sí funciona y **no se toca**: el marco animado
(`dibujarMarcoDinamico`), la cortina de entrada y salida (`aplicarCortinaVideo`), la música (`customAudioRef`), la marca,
el QR, la subida al muro, la cuenta regresiva, la cantidad de vueltas y la repetición de la toma.

## Bloque 1 — grabar mejor

Capturá a **30 cuadros por segundo y 720 de ancho**, durante el tiempo real elegido (`selectedDuration`). No grabes un
tercio.

Para que no se quede sin memoria en el celular:

- guardá los cuadros como `ImageBitmap` (`createImageBitmap`), no como un canvas por cuadro;
- si el aparato no da, bajá a 540 de ancho **solo**, sin mostrar un error.

## Bloque 2 — la edición automática, sin que nadie toque nada

Al terminar de grabar, se arma **solo** el video final con esta receta:

1. **Arranque normal:** el primer 25 % a velocidad real.
2. **Cámara lenta:** el 25 % al 75 % a un tercio de velocidad. La entrada y la salida son **suaves**, en unos 0,4
   segundos, no un salto.
3. **Vuelve a normal:** el último 25 % a velocidad real.
4. **Ida y vuelta (boomerang):** al final, los últimos 1,5 segundos se repiten **al revés**.

El marco, la cortina, la marca y la música se aplican igual que hoy, sobre el video armado. Con el arranque y el final
real, la duración final cae entre 12 y 20 segundos.

Hacé la receta en una función pura, `armarLineaDeTiempo360(cantidadCuadros, fps, estilo)`, en
`src/lib/entretenimiento/edicion-360.ts`. Devuelve qué cuadro va en cada lugar del video final. Así se puede probar sin
cámara.

## Bloque 3 — el estilo lo elige el operador, una sola vez por fiesta

En los ajustes de la estación 360 sumá `estiloEdicion360`, con tres opciones:

- **"Lento y vuelta"**: la receta completa de arriba. **Es la que viene elegida.**
- **"Sólo cámara lenta"**: sin la ida y vuelta.
- **"Normal"**: sin efectos de velocidad.

El invitado no elige nada: graba y sale editado. El ajuste tiene que llegar a la estación; usá el mismo camino que
`vueltas360`.

## Pruebas

**Jest**, en `src/__tests__/la-360-edita-sola.test.ts`, contra `armarLineaDeTiempo360`. Tiene que comprobar:

- (a) Con 300 cuadros a 30 fps y estilo "Lento y vuelta":
  - el tramo del medio repite cada cuadro unas 3 veces;
  - el principio y el final no se repiten;
  - el final contiene los últimos cuadros **en orden inverso**.
- (b) "Sólo cámara lenta" no tiene tramo inverso.
- (c) "Normal" devuelve los cuadros en orden, sin repetir.
- (d) La duración final queda entre 12 y 20 segundos para grabaciones de 10 a 15 segundos.

Rompé (a) a propósito y fijate que se ponga en rojo.

**Navegador**, en `tests/e2e/la-360-edita-sola.spec.ts`, con la cámara simulada que ya usan las pruebas de estaciones:

- se graba;
- aparece el video final;
- su duración, leída del `<video>`, es mayor que la grabación.

Corré `npx tsc --noEmit` y `npx jest --silent`, y pegá las últimas líneas. No subas `data/` ni `src/data/`.

```comprobar
archivo: src/lib/entretenimiento/edicion-360.ts
usa: armarLineaDeTiempo360 en src/app/evento/plataforma-360/[fiestaId]/page.tsx
usa: estiloEdicion360 en src/app/evento/plataforma-360/[fiestaId]/page.tsx
prueba: src/__tests__/la-360-edita-sola.test.ts
prueba: tests/e2e/la-360-edita-sola.spec.ts
```
