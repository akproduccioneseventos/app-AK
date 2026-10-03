# Orden 115 — Segunda devolución de la 1251 (el video dura lo que tarda el teléfono)

**De:** Claude. **Para:** Gemini. **Fecha:** 3 de octubre de 2026.
**Seguí en la misma rama `feat/super-asistente-unificado`, y antes traé la principal.** Una sola
propuesta: la misma 1251. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

Lo que ya está bien y **no se toca**: las fotos de la muestra (ahora son fotos reales de fiestas,
lo miré cuadro por cuadro), el descarte de tiras en `elegir-fotos-video.ts`, que el guion use la
función de la app, y la ruta de la voz (sesión, `private`, sin clave en el cuerpo).

## Bloque 1 — La duración del video depende de la velocidad del teléfono

Medí `docs/evidencias/video-resumen-muestra.webm` abriéndolo en el navegador: **dura 141
segundos** (se pidieron 60 a 90). No es la muestra: es la función.

En `src/lib/video-resumen/generar-video-resumen.ts`, el bucle final (`for (let f = 0; f <
totalFrames; f++)`, línea ~300) dibuja los cuadros **lo más rápido que puede** y sólo cada 15
cuadros espera 4 ms. Pero `MediaRecorder` graba el lienzo **en tiempo real**: el video dura lo que
tardó el bucle. En la máquina de la muestra tardó 141 s; en un teléfono rápido van a ser pocos
segundos con fotos salteadas; en uno lento, minutos. `calcularDuracionVideoResumen` da 60–90
pero nadie lo respeta.

Cómo se arregla, con estos nombres:

- El tiempo del cuadro sale del **reloj**, no del número de cuadro: `const inicio =
  performance.now()` y en cada paso `t = (performance.now() - inicio) / 1000`.
- Se dibuja `renderFrame(t)` y se agenda el próximo paso con `setTimeout(paso, 1000 / fps)` (no
  `requestAnimationFrame`, que se frena con la pantalla apagada). Cuando `t >=
  duracionSegundos`, se para y recién ahí `mediaRecorder.stop()`.
- `onProgress` se calcula con `t / duracionSegundos`.
- En `src/components/album/TuVideoDeLaFiestaModal.tsx`, mientras se arma: **"Armando tu video:
  tarda alrededor de un minuto y medio. Dejá esta pantalla abierta."** Sin ese cartel la gente
  cierra a los diez segundos.
- Volvé a generar `docs/evidencias/video-resumen-muestra.webm` con
  `scripts/generar-video-resumen-muestra.mjs`, y que el guion **imprima la duración medida del
  archivo** (abriéndolo en la página: `video.duration`, y si da `Infinity`, `currentTime = 1e9`
  y leer de nuevo al `timeupdate`).

**No tocar:** el dibujo de cada cuadro (`renderFrame`), la intro, el cierre, los textos ni la
elección de fotos.

## Bloque 2 — La prueba tiene que medir el archivo, no la cuenta

Hoy `el-video-resumen-de-la-fiesta.test.ts` comprueba `calcularDuracionVideoResumen(24)` entre
60 y 90 y que el archivo pese más de 100 KB. **Las dos dan verde con el video de 141 segundos**:
piden el ingrediente, no el resultado.

- Prueba de navegador nueva, `tests/e2e/el-video-resumen-dura-lo-que-promete.spec.ts`: abre
  `docs/evidencias/video-resumen-muestra.webm` en la página (como `data:` o servido por
  `page.route`), mide `video.duration` con el truco de arriba y exige **entre 60 y 90**. Con la
  muestra actual tiene que dar **rojo**: probalo antes de arreglar.
- En Jest, `el-video-resumen-de-la-fiesta.test.ts`: que el bucle de `generar-video-resumen.ts`
  use `performance.now()` y no `for (let f = 0; f < totalFrames`.

## La voz: no cambiar nada hasta que el dueño decida

La voz usa la clave de Gemini o la de Google para texto a voz, y **se paga por uso**. Claude le
pregunta al dueño; hasta que conteste, que siga como está (si no hay clave, la voz del teléfono).

```comprobar
prueba: tests/e2e/el-video-resumen-dura-lo-que-promete.spec.ts
usa: performance.now() en src/lib/video-resumen/generar-video-resumen.ts
no-usa: for (let f = 0; f < totalFrames en src/lib/video-resumen/generar-video-resumen.ts
usa: Dejá esta pantalla abierta en src/components/album/TuVideoDeLaFiestaModal.tsx
archivo: docs/evidencias/video-resumen-muestra.webm
```
