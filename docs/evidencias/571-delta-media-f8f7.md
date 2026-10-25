# Evidencia 571: delta de medios f8f7

- Comparacion: `978af7d65a60bd287f3ee3cc05037a29566074f4` -> `f8f7cf34e8778de784b20e2654058fd722b2a2ec` (`origin/audit-pr1353-20261025`).
- La referencia inicial resuelve a `origin/audit-pr1353-20261024-next`.
- `git diff --name-only ... -- src` devuelve solo los cuatro archivos de esta evidencia.
- La orden 229 describe dos criterios no aceptados y exige validar sobre la tanda nueva. Este delta es correccion presente en codigo, no prueba aprobada ni despliegue verificado. No se reencarga 229.

## Cambios observados

- `src/app/evento/buzon/[fiestaId]/page.tsx`: `GuestBuzonPage` conserva el ultimo `File` procesado para evitar duplicar el mismo evento; extrae `processSelectedVideoFile`, llama al procesador y maneja error/reintento. El input conecta `onchange` en callback ref ademas de `onChange`. Los reproductores de revision ahora declaran `playsInline`, `preload="auto"`; uno agrega `autoPlay muted loop`.
- Consumidor: `handleVideoChange` -> `processSelectedVideoFile` -> `renderUploadedVideoWithFrame` (import y llamada presentes en el archivo). No se ejecutó.
- `src/lib/buzon/video-frame-processor.ts`: MIME candidatos priorizan WebM VP9/VP8; metadata acepta `loadeddata` y espera readiness limitada; verifica URL de salida con metadata/data/canplay y timeout. Renderiza frame inicial, graba canvas sin pista de audio, refresca por intervalo y `requestAnimationFrame`, y finaliza por fin de playback/limite/timeout. Cambia cálculo/reporting de duración y cleanup.
- Alcance del cambio: retirar la mezcla de audio de entrada significa que el delta no conserva audio en la salida. No afirmar que el archivo resultante sea reproducible ni tenga marco, contenido o duración correctos.
- `src/app/evento/galeria/[fiestaId]/page.tsx`: `iniciarCamara` limpia cancelación, detiene stream si se cancela, espera montaje/readiness con límites, toma hasta tres cuadros y para al reunir dos vectores; cancelar marca flag. Callback ref vuelve a asociar y reproducir el stream.
- Consumidor observado: `iniciarCamara` llama `extraerVectorLocal` en línea 302 del archivo; el cambio se ubica en el flujo de selfie. No se contrastó el cuerpo/consumidor indirecto de `extraerVectorLocal` por limitación al leer ruta con corchetes.
- `src/lib/caras/extractor-facial.ts`: `asegurarModelosFaciales` ahora devuelve boolean, maneja fallo reintentable, readiness/carga con timeouts; `extraerDescriptorFacial` valida video, toma snapshot a canvas, espera modelos, usa inputSize 224/scoreThreshold 0.5 y limita inferencia con timeout.
- Contrato: llamadas que antes recibían `Promise<void>` ahora reciben `Promise<boolean>`; revisión de todos los consumidores y compatibilidad no ejecutada.

## Límites y verificación

- Inspección estática del diff y referencias; no se ejecutó app, harness, prueba, build, QA ni verificación de píxeles/audio/duración.
- Criterio video de 229: pendiente extraer/inspeccionar fotogramas del resultado real (inicial, intermedio, final), contenido, marco, audio y duración con fixture finita.
- Criterio búsqueda de 229: pendiente reproducir flujo real hasta resultado/no-resultados y verificar terminación. Timeouts/modelos en código no prueban resolución del estado Analizando.
- Sin conclusión de seguridad, dinero, aprobación de funcionamiento o despliegue. Director compila/QA la tanda nueva tras 567, según instrucción.

## Comprobar

- archivo: `src/app/evento/buzon/[fiestaId]/page.tsx`, `src/lib/buzon/video-frame-processor.ts`; `src/app/evento/galeria/[fiestaId]/page.tsx`, `src/lib/caras/extractor-facial.ts`.
- usa: `GuestBuzonPage.handleVideoChange` -> `renderUploadedVideoWithFrame`; `GaleriaPage.iniciarCamara` -> `extraerVectorLocal` (cuerpo/consumidor indirecto no contrastado); `extraerDescriptorFacial` y `asegurarModelosFaciales` (consumidores globales no contrastados).
- prueba: pendiente. Video con fixture finita y fotogramas/pistas/duración del resultado; búsqueda facial hasta estado terminal con cámara/modelos locales. No ejecutadas aquí.
