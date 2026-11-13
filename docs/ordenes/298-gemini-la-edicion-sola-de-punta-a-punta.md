# Orden 298 — La edición sola, de punta a punta (13/11/2026)

**Para Gemini.** Va **en la misma propuesta que la 297**, en una rama nueva sobre `origin/main`. Una sola propuesta, sin
fusionar. Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 107. Si un bloque se traba, entregá el resto y avisá cuál.

**Decisión del dueño (13/11/2026):** "a todo sí". La app tiene que editar sola. Todo con lo que ya está instalado
(ffmpeg, OpenCV, MediaPipe, el navegador): **nada que se pague por mes**.

## Lo que ya anda y NO se rehace

- La 360 ("Lento y vuelta", `src/lib/entretenimiento/edicion-360.ts`), la fotocabina y sus filtros, el álbum que se arma solo
  (`src/lib/album/armar-album.ts`), la selección de fotos del video resumen (`elegir-fotos-video.ts`), los cortes por
  bloques del AK Editor (`herramientas/ak-editor/reglas.py`) y la exportación a Filmora.

## Bloque 1 — El video resumen del cliente con música y al ritmo (P1, lo ve el cliente)

`generarVideoResumenWebM` (`src/lib/video-resumen/generar-video-resumen.ts` ~111) graba sólo el canvas: sale **mudo**, aunque el tipo
declara `musicaUrl` (~26) y el encabezado promete cortes al ritmo.
- `TuVideoDeLaFiestaModal.tsx` ~55-59 pasa `musicaUrl` (la música elegida de la fiesta; si no hay, una pista libre de
  `public/` que ya use la app).
- El generador suma la pista al `MediaRecorder` (`AudioContext` → `createMediaStreamDestination` → `addTrack`), con
  entrada y salida suave.
- Los cambios de foto caen en los golpes de la música (`AnalyserNode` o un detector de energía simple); si no se detectan
  golpes, queda el reparto parejo de ahora (~81-82).

## Bloque 2 — El Video de Vida cambia al ritmo (P2)

`ajustar_tiempos_a_golpes` (`herramientas/ak-editor/video_de_vida.py` ~767) está escrita y **nadie la llama**. Llamala
dentro de `exportar_video_de_vida` (~914-949), después de `detectar_golpes_audio` (~949) y antes de fijar los tiempos.

## Bloque 3 — El Video de Vida elige las mejores fotos (P2)

`ordenar_fotos_vida` (~643) sólo ordena por fecha. Antes de ordenar, descartá las borrosas, las oscuras y las de ojos
cerrados con lo que ya hace `fotos.py` (~250, ~267, ~298). Si quedan más de las que entran en la duración, elegí por nota
de calidad y respetá el orden cronológico.

## Bloque 4 — Los cortes del AK Editor salen editados (P1)

`renderizar_corte_individual` (`herramientas/ak-editor/exportador_video.py` ~34) hoy sólo corta. Sumá, con filtros de
ffmpeg:
- **Cámara lenta por partes** en los momentos de pose y baile (`setpts`), tomando como modelo la rampa de la 360.
- **Boomerang** en los cortes cortos de pose (ida y vuelta con `reverse`).
- **Color automático** suave (`eq` o `curves` con un ajuste fijo de contraste y saturación).
- **Música**: en `exportar_video_ffmpeg` (~84), mezclar la música del bloque (vals en `reglas.py` ~289) o la general, con
  el sonido original más bajo en baile y entero en discursos (no se tapa a quien habla).

## Bloque 5 — Elige los mejores momentos, no sólo descarta los malos (P2)

Con las métricas por segundo que ya calcula `analizar_archivo_video` (`analizador.py` ~215) — nitidez, caras,
movimiento —, armá una nota por tramo y que `reglas.py` elija los tramos de nota más alta para cada bloque
(engancha en `app.py` ~142 y `reglas.py` ~576).

## Bloque 6 — Arranca sola al terminar la fiesta y entrega (P2)

- En el AK Editor, un modo "automático": al encontrar el material de la fiesta en la carpeta de entrada, corre análisis →
  cortes → exportación MP4 → Video de Vida → videos para redes, sin tocar botones, y deja un resumen de lo que hizo.
- Al terminar, sube a Wfolio con la subida que ya comprueba (`test_wfolio_no_dice_subido_sin_ver.py`) y deja **preparado**
  en el centro de fiesta el mensaje de entrega para el cliente (lo manda una persona; orden 290 bloque 3).
- El video resumen del cliente se genera solo la primera vez que el cliente abre su álbum, sin botón.

## Bloque 7 — Rehacer la prueba de "Presupuestos abre rápido" (devuelta de la entrega 1393)

`tests/e2e/presupuestos-abre-rapido.spec.ts` (orden 290, bloque 1) se sacó porque en la verificación no encontraba
"Central de Presupuestos" en 15 s. Tenía dos fallas: ponía media sesión (usá `ponerSesionDelEquipo` de
`tests/e2e/helpers/fiesta-de-prueba.ts`) y retenía la primera acción del servidor, que era la lista misma. Rehacela
reteniendo sólo `repairVerifiedBudgetDates` (manda `[]`), **corrida sola en verde** con `npm run test:e2e --` antes de
entregar, y comprobá que el texto buscado aparece una sola vez (también está en el título de `app-shell.tsx` ~39).

## Pruebas

- `src/__tests__/el-video-resumen-lleva-musica.test.ts`: con `musicaUrl`, el grabador recibe una pista de audio.
- `herramientas/ak-editor/pruebas/test_vida_al_ritmo.py`: con un WAV de golpes cada 0,5 s, los cambios de foto caen en
  los golpes (±0,1 s).
- `herramientas/ak-editor/pruebas/test_vida_elige_las_mejores.py`: una foto borrosa no entra.
- `herramientas/ak-editor/pruebas/test_cortes_editados.py`: un corte de pose sale más largo que el original (cámara
  lenta), y el MP4 final tiene pista de audio (ffprobe).
- `herramientas/ak-editor/pruebas/test_modo_automatico.py`: con una carpeta de muestra, el modo automático deja los MP4 y
  el resumen sin intervención.
- Reempaquetá el editor (`npm run editor:empaquetar`): la prueba `el-editor-que-se-baja-es-el-de-ahora` tiene que pasar.

```comprobar
usa: addTrack en src/lib/video-resumen/generar-video-resumen.ts
usa: ajustar_tiempos_a_golpes( en herramientas/ak-editor/video_de_vida.py
usa: setpts en herramientas/ak-editor/exportador_video.py
usa: reverse en herramientas/ak-editor/exportador_video.py
prueba: src/__tests__/el-video-resumen-lleva-musica.test.ts
prueba: herramientas/ak-editor/pruebas/test_vida_al_ritmo.py
prueba: herramientas/ak-editor/pruebas/test_vida_elige_las_mejores.py
prueba: herramientas/ak-editor/pruebas/test_cortes_editados.py
prueba: herramientas/ak-editor/pruebas/test_modo_automatico.py
prueba: tests/e2e/presupuestos-abre-rapido.spec.ts
```
