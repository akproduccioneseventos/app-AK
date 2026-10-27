# Diagnóstico acotado: Muro (batch 013)

## Identidad y alcance
-638e0251 es la revision de DOCUMENTOS, no el SHA de app. El fallo568 es de978af7d65a60bd287f3ee3cc05037a29566074f4. NuevoQA574 tiene f8f7cf34e8778de784b20e2654058fd722b2a2ec; su delta solo toca cuatro fuentes de medios y NO social. No confundir ambos SHAs.
- Diagnostico preliminar documental, sustituible por observaciones de609; no una prueba nueva ni orden de programacion.
- No se ejecutó la app, tests, build, navegador ni servicio externo. No se modificaron app ni tests.

## Observados
- `568-batch-013-resultados.json` registra dos fallos del mismo caso, Chromium desktop y mobile. Ambos caen en la aserción final de visibilidad, tras esperar 45 s por `/No se pudo publicar|publicada|Se subió|subida/i`; no aparece el texto.
- El test original que aporta el error-context ordena `Qué querés compartir` → click → `input[type=file]` (count 1) → `setInputFiles(FOTO_DE_PRUEBA)` → botón `^Publicar` visible → click → espera del mensaje. No hay comprobación/registro de que el handler se disparó ni de la respuesta de Storage.
- El DOM capturado al fallar muestra el muro/feed y los botones `¿Qué querés compartir?`, `Foto`, `Video`; no muestra selector/modal de publicación ni botón `Publicar`. Es captura al final del timeout, no registro temporal de cada acción.
- El adjunto `qa-egress-blocked` identifica intento bloqueado de cargar `googletagmanager.com`; `qa-fis-mode` indica Firebase local doble sin proveedor real. Son límites/ruido de entorno observados, no evidencia de que causaron este fallo.
- En HEAD actual existe consumidor `src/app/evento/social/[fiestaId]/page.tsx`: `selectUpload` (línea aprox. 554), envío multipart (645) y formulario/modal con `Publicar` (1119-1122). No se establece identidad exacta de este consumidor contra el artefacto QA `.qa-574` solo con este reporte.

## Dictamen y posibilidades (no afirmar causa)
- El artefacto fallido identifica QA480/978, no QA574/f8f7. El consumidor deMuro NO cambio en el delta de cuatro fuentes; eso no equivale a ejecutar una prueba nativa nueva.
- **No demostrado:** que en ambos intentos se completaran realmente click de Publicar y envío. El test fuente lo solicita y la ubicación del error es posterior, pero el reporte no aporta action trace/log de click; el DOM final no prueba ni refuta un diálogo intermedio.
- **Hipótesis por discriminar:** transición modal/fixture o selector; archivo (el fixture es PNG de 1x1); bloqueo/error de Storage; handler ejecutado sin aviso. Ninguna queda confirmada. Los términos/consentimiento no se observan en el DOM final ni en el contexto disponible.
- Por tanto, esto acredita timeout de una prueba compuesta, no defecto real confirmado de Muro ni causa raíz. No emitir orden de programación todavía.

## QA mínimo para resolverlo
1. Repetir únicamente el caso en el SHA exacto de `QAactual .qa-574-f8f-z1BF2d`, con fixture cargado, en un entorno aislado y sin cambiar test/app.
2. Capturar secuencia temporal: resultado de cada click (compartir, Foto, Publicar), estado/visibilidad del diálogo, `input.files` (nombre/tipo/tamaño), submit/handler y petición/respuesta de subida. Adjuntar screenshot antes del click final y al fallo; no incluir secretos.
3. Si se detiene antes de Publicar, corregir fixture/flujo de QA y repetir; no diagnosticar código de carga. Si llega al handler, registrar error concreto del proveedor emulado y si la UI muestra respuesta; recién entonces contrastar consumidor y clasificar como QA/entorno o defecto reproducible.

## Comprobar
- archivo: `src/app/evento/social/[fiestaId]/page.tsx` (solo referencia; no editado).
- usa: `selectUpload` y formulario de publicación con botón `Publicar` (símbolos consumidores arriba; verificar en SHA del nuevo QA antes de atribuir).
- prueba: `tests/e2e/muro-subir-foto.spec.ts`, reproceso focalizado pendiente; no ejecutado en este diagnóstico.
