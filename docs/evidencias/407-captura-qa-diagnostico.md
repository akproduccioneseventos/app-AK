# Diagnostico QA: captura no llega a preview

Alcance: lectura de fuentes; no se ejecutaron pruebas, app, build ni servicios.
HEAD del checkout: `98f54f952d2ba72e3411112365613ae69565c88f` (no es ninguno de los SHA objetivo).
Fuentes comparadas: frozenQA `3e45a4ac6b479f89605163168e31b37dc84f2d0f`; candidata `917a98e32c63fe2f832f5cdc16db87f4fc722b6c`.
No se conoce la rama/tanda privada del dueño: **NO CONTRASTADO CON LA TANDA**.

## Evidencia

- `docs/evidencias/378-resultado-nativo-final.json` registra que 90 falla esperando `getByRole('button', {name:/publicar en el muro/i})` (línea 100 del test en la fuente) y 48 móvil espera “Publicar al muro”/“Guardar foto” tras `button[aria-label="Sacar foto"]` (línea 109). Ambos alcanzan el paso de captura pero no ven el control de preview; no revela por sí solo qué paso anterior falló.
- `tests/e2e/helpers/camara-falsa.ts`, `enchufarCamaraFalsa`: `getUserMedia` devuelve `canvas.captureStream(30)` desde lienzo blanco dibujado una vez; no actualiza píxeles ni espera/afirma `loadedmetadata`, `videoWidth`, `readyState` o avance de frames.
- Consumidores reales: `src/app/evento/fotocabina/[fiestaId]/page.tsx`, `takePhoto` lee `video.videoWidth/videoHeight` y `ctx.drawImage(video, ...)`; `capturarCuadrosDeCamara` agenda capturas con `setInterval` y dibuja el video. `src/app/evento/touchpix/[fiestaId]/page.tsx`, `takePhoto` también usa dimensiones y `drawImage`; captura tras countdown. Esos caminos dependen de video utilizable en el instante de captura, no meramente de `srcObject`.
- El helper no demuestra que ese supuesto esté incumplido: `captureStream(30)` puede producir video válido. Sin telemetría de la ejecución no se puede llamar causa concreta ni defecto de producto.
- Diferencia 3e45→917: helper y specs `tests/e2e/90-lo-que-va-atras-dice-donde-quedo.spec.ts`, `tests/e2e/48-touchpix-entrega-sin-reinicio.spec.ts` sin cambios. Ambos consumidores cambian solo en integración de `dibujarFiltroDeCara`/filtros (Fotocabina procesamiento de cuadros; Touchpix aplicación de belleza). No hay evidencia fuente de que estos cambios causen la ausencia de preview.
- No atribuir a selector obsoleto: los artefactos indican que “Publicar” coincide con el control esperado. Tampoco atribuir a gtag/modelo: no explica por sí mismo que no aparezca preview.

## Sonda mínima propuesta (pendiente; no ejecutada)

En los dos specs, después de `enchufarCamaraFalsa`/`goto` y justo antes de click de captura, adjuntar un único snapshot de `video`: `srcObject != null`, `readyState`, `videoWidth`, `videoHeight`, `currentTime`; esperar `loadedmetadata` con límite 5s y dos `requestVideoFrameCallback` (fallback `timeupdate`, límite 5s), registrar deltas. Al click, registrar errores de página y envolver temporalmente `CanvasRenderingContext2D.drawImage` para anotar llamada/exception solo cuando la fuente sea el video; esperar el botón preview y adjuntar estado final de UI.

Repetir la misma sonda, sin variar el test, en `.qa-366-main-TzCI01` a SHA `3e45a4ac6b479f89605163168e31b37dc84f2d0f` y `.qa-392-candidate-02Lhke` a SHA `917a98e32c63fe2f832f5cdc16db87f4fc722b6c`; confirmar SHA con `git rev-parse HEAD` en cada checkout. Comparar: metadata/dimensiones ausentes o frames estancados apuntan al fake-camera/runtime; video válido más excepción `drawImage` identifica el punto a investigar; video y draw válidos sin preview exige seguir la transición de estado del consumidor. Mantener cualquier resultado como evidencia, no como orden automática.

## Comprobar

- archivo: `tests/e2e/helpers/camara-falsa.ts`, `tests/e2e/90-lo-que-va-atras-dice-donde-quedo.spec.ts`, `tests/e2e/48-touchpix-entrega-sin-reinicio.spec.ts`, `src/app/evento/fotocabina/[fiestaId]/page.tsx`, `src/app/evento/touchpix/[fiestaId]/page.tsx`.
- usa: `enchufarCamaraFalsa`, `takePhoto` (Fotocabina y Touchpix), `capturarCuadrosDeCamara`; los specs esperan preview tras captura.
- prueba: PENDIENTE. Sonda de metadata/frame/draw descrita arriba, ambos SHAs exactos; no ejecutada.
