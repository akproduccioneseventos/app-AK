# 229 - Gemini: cerrar los dos criterios de medios no aceptados

## Actualizacion25/10: correccion publica presente, no reprogramar

PR1353 avanzo a f8f7cf34e8778de784b20e2654058fd722b2a2ec.
Solo cambian buzon, galeria, video-frame-processor y extractor-facial.
571 documenta el delta.573 prepara fuente/build y prueba esa entrega por
separado: los fallos de525 en978 son HISTORICOS, no un rechazo automatico
del nuevo codigo. No duplicar esta orden ni implementar otra vez lo presente.
La aceptacion del archivo RESULTANTE debe conservar imagen, marco, sonido
y duracion. No resolver el marco suprimiendo el audio del video importado;
589 ya termino y demuestra una regresion de sonido, no una sospecha por grep.
Los resultados del contraste se agregan con su SHA, no por presencia de codigo.

### Dictamen de la entrega f8f7, fuente y build nuevos

574 compilo f8f7 con tipos/lint, exit0 y sourceDiff0.585 ejecuta TRES
criterios nativos reales con SDKdemo:1PASS/2FAIL. El video IMPORTADO ahora
SI supera el criterio de marco incorporado al archivo: conservar ese avance.
La grabacion en vivo no alcanza la revision esperada en45s y la busqueda
selfie no alcanza resultado terminal en60s. Esos DOS criterios siguen NO
ACEPTADOS, sin afirmar por el timeout una causa interna ni filtracion.
No usar el PASS historico472 de grabacion para aceptar esa variante en f8f7.

589 ejecuta el procesador ORIGINAL de cada SHA dentro de Chromium, con
MediaRecorder/canvas reales y el MISMO MP4 H264/AAC ficticio de1.5s. FFmpeg
decodifica video Y pista de audio en el archivo de entrada y en la salida
978; en la salida f8f7 decodifica video pero NO existe pista0:a:0. Recibo
589-audio-procesador.json conserva hashes/archivos/codigos de salida.
Esto SI es regresion reproducida del procesador, no prueba de microfono ni
una afirmacion sobre todos los videos de la aplicacion.

Consumidor f8f7 verificado: processSelectedVideoFile llama
renderUploadedVideoWithFrame y guarda processed.file sin remultiplexar audio,
en src/app/evento/buzon/[fiestaId]/page.tsx. El procesador captura el canvas
y pasa ese stream solo de video a MediaRecorder. Corregir conservando el
marco ya logrado, imagen, duracion y el audio ORIGINAL; no agregar silencio
como sustituto ni mutear el resultado para pasar la prueba. Aceptar entradas
sin audio, limpiar pistas/URL y permitir un error recuperable al fallar.
La implementacion corresponde aGemini, no aCodex. La regresion de producto
con pista reconocible y comprobacion de contenido queda PROPUESTA/PENDIENTE;
589 demuestra presencia/ausencia de pista con entrada sintetica, no voces
reales ni una prueba end-to-end de subida/descarga del proveedor.

## Evidencia original conservada

### Extension ejecutada25/10: no aceptar una grabacion vacia

620, sobre el mismo build574/f8f7, repite SOLO grabacion en vivo con camara
sintetica ANIMADA y pista real deAudioContext/oscillator, no un grabador
simulado. Observaciones604:MediaRecorder nativo con video+audio live,
MIMEvideo/webm;codecs=vp9,opus; eventosstart/dataavailable(bytes0)/stop.
La pantalla presenta VideoGrabado, duracion4segundos yENVIARRECUERDO, pero
la URLblob tiene0bytes yel reproductorreadyState0/videoWidth0. La asercion
del resultado falla despues de45s; no es el caso anterior con pista ausente.
El primer609 usaba entrada video-only y conserva su limite;620 lo corrige.

Esto confirma una salida vacia presentada como lista en ese navegador QA,
NO todoslos dispositivos/hardware ni una causa unica del encoder. El cuerpo
real startLiveVideoRecording/onstop crea File(chunks) yestado review SIN
comprobar tamaño/decodificacion. Extender ESTA orden, no otra duplicada:
conservar el contenido durantegrabacion, verificar artefacto no vacio y
reproducible ANTES de mostrar listo/permitir enviar; anteerror recuperar o
avisar con reintento, nunca inventar duracion/archivo valido. Investigar
ciclo de canvas/MediaRecorder ylimpieza; no retirar el test para aceptar.

609 tambien cierra grilla/descarga PCymovil yselfieMOVIL por sus criterios;
selfiePC no alcanza su asercion en75s aunque el adjunto final de cuerpo
contiene resultados. Mantener esa discrepancia como criterio noaceptado,
no filtracion ni causa de modelo inventadas, y no repetir grilla yaPASS.

NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Tanda publica observada:
PR1353/rama gemini/ordenes-180-195, HEAD978af7d65a60bd287f3ee3cc05037a29566074f4.
La reproduccion nativa es de917a98e32c63fe2f832f5cdc16db87f4fc722b6c/build406.
Directos buzon/galeria/caras siguen iguales en978; lector/permisos SI cambio.
ANTES de programar reproducir con fuente/build de la tanda nueva. Si ya hay
arreglo privado, contrastarlo; no rehacerlo ni usar build917 para aceptarlo.

## 1. Marco en video importado, no fallo de grabacion general

472:archivo469MP4H264/AAC,1.5s,4112bytes, color azul sin verde, seleccion nativa
con setInputFiles. Llega aVideoCargado yvideoBlobvisible/reproducible, pero
el criterio pixel del marcofloral devuelve0 frente a>20. Captura472 del
video importado muestra negro en la revision. No afirmar por eso que ningun
formato/codec funcione. La grabacion en vivo completa SI pasa en472.

Consumidor real:handleVideoChange llama renderUploadedVideoWithFrame en
src/app/evento/buzon/[fiestaId]/page.tsx:548. Implementacion real:
src/lib/buzon/video-frame-processor.ts. drawBuzonVideoFrame se llama en su
bucle y al terminar. No basta comprobar que existan esas llamadas.

Contrastar con el archivo finito y extraer fotogramas del RESULTADO real,
no solo medir el canvas previo ni agregar un marcoCSS sobre el reproductor.
Si la fixture o lectura de pixeles es la causa, documentar y conservar el
fallo inicial; no modificar la app para arreglar el arnes. Si se confirma
salida negra/sin marco, corregir el ciclo de render/grabacion y comprobar
fotogramas inicial/intermedio/final, contenido, sonido y duracion.

## 2. Busqueda local que no abandona Analizando

472:fiesta ficticia preparada, vectores sintéticos, permiso aceptado, camara
canvas blanca. Despues de60s no aparece Resultados niNoencontramos;478-last
captura muestra Analizando en tu telefono. No afirmar filtracion de selfie:
el caso no completo sus comprobaciones finales. No atribuir causa aUnsplash,
gtag o hardware sin evidencia. Modelos locales existen enpublic/models/caras.

Consumidor real:iniciarCamara/extraerVectorLocal en
src/app/evento/galeria/[fiestaId]/page.tsx; llama extraerDescriptorFacial en
src/lib/caras/extractor-facial.ts. Aislar carga/modelo/inferencia/actualizacion
de estado con tiempos observados. Verificar terminar con resultado o error
recuperable yCancelar cierra pistas, sin subir imagen/vector. No reemplazar
reconocimiento por resultados inventados ni vaciar fotos para pasar el test.
Preservar permisos y procesamiento local; cualquier cambio de funcionamiento
no necesario para el arreglo requiere validacion del dueno.

## Limites y aceptacion

465/468 son diez controles de codec positivos, no modelo/hardware real.
Los dos casos originales y las adaptaciones470 se conservan. Esperar el
caso CORRECTO:el primer4000ms cambiado por451 pertenecia a otro test, errorQA
rectificado en470. No rebajar assertions ni saltar estos casos para dar verde.
No tocar dinero/comida/permisos deClaude. Entrega una sola propuesta con
fuente, fixture, captura/fotogramas y pruebas observadas sobre el mismoSHA.
Los tests nuevos/regresion de la entrega quedanPENDIENTES hasta ejecutarlos;
esta orden NO implementa ni acepta una correccion.

```comprobar
archivo: src/lib/buzon/video-frame-processor.ts
usa: renderUploadedVideoWithFrame en src/app/evento/buzon/[fiestaId]/page.tsx
archivo: src/lib/caras/extractor-facial.ts
usa: extraerDescriptorFacial en src/app/evento/galeria/[fiestaId]/page.tsx
prueba: tests/e2e/entertainment-stations.spec.ts
prueba: tests/e2e/la-grilla-de-caras.spec.ts
prueba: docs/evidencias/473-ejecutar-tres-controles.mjs
```
