# 229 - Gemini: cerrar los dos criterios de medios no aceptados

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
