# AK-CODEX-233 - Delta pendiente de191 en candidato1353

## Retest Codex356 - 24/10, candidata1353 SHA3f946018

12criterios9PASS/3FAIL y AST de los cuatro consumidores, ejecutados de nuevo
sobre3f9460185143ef034dcd713e975d2a0af5e20f1a; no resultado heredado de b91.
Persisten las MISMAS TRES causas descritas abajo: caras[] en tres estaciones,
guino/cejas sin efecto activo (dosFAIL, una causa) y ruleta no estable.
FotocabinaSI pasa carasDetectadasRef.current; no deshacer ese enlace.
Los dos modulos helpers tienen blobs identicos b91/3f, contraste adicional348.
No camara/modelo/pixeles/captura certificados. Actualizacion de esta misma
orden, NO una orden nueva ni reencargo de marcos que ya pasan. Ver359.

Responsable Gemini; no nueva decision de producto. Mantener lo aprobado en191.
Fuente probada:1353 b91bdbeff7d3db7489fabdadd599776376c0577a. No afirmar defecto
publicado en Hosting: esta es la TANDA pendiente. Privados posteriores NO CONTRASTADOS.
Codex no modifica la app ni fusiona.

233 ejecuta12criterios sobre los modulos reales:9PASS/3FAIL. Los dos FAIL de
guiño/cejas tienen UNA causa comun. A eso se suma un hueco de consumo comprobado
en tres llamadas reales: TRES causas de entrega, no seis por contar estaciones.

## Datos de caras vacios en tres consumidores

AST del SHA candidato y llamadas reales a dibujarFiltroDeCara:
- fotocabina/[fiestaId]/page.tsx:455 pasa carasDetectadasRef.current: correcto
  como conexion, NO deteccion/camara certificada por este informe.
- touchpix/[fiestaId]/page.tsx:483 pasa[] literal.
- bogue/[fiestaId]/page.tsx:633 pasa[] literal.
- espejo-magico/[fiestaId]/page.tsx:605 pasa[] literal.

La funcion real devuelvefalse y no hace llamadas canvas cuando recibe[]. Es la
proteccion correcta si no hay caras, pero esas tres llamadas NUNCA reciben las
que pudiera contener la imagen. No se puede cerrar191 por importar el simbolo.
Conectar la deteccion/lista real con el mismo render de previa y salida. No
inventar puntos ni dibujar una cara al centro para hacer pasar la prueba.
Preservar no-overlay cuando de verdad no hay caras. No agregar filtros de cara
a360:191 la excluye expresamente; sus marcos siguen funcionando.

## Guiño y cejas calculados pero sin efecto

evaluarEfectoReactivo devuelve destelloOjo=true/cambiarFiltro=true, pero el
dibujador activo solo utiliza confetiBoca. Con la misma cara, guiño y cejas
producen exactamente las mismas llamadas/propiedades canvas que la cara neutra.
191 pide destello al guiñar y siguiente filtro al levantar cejas. Conectar
esos resultados al renderer/estado real; no cerrar con el test del helper solo.
Conservar los controles de umbral y pausa que ya pasan. No cambiar el filtro
varias veces por cada frame mientras se mantienen las cejas levantadas.

## Ruleta no queda fija

obtenerOpcionRuleta(3100/6100/9100,'QA') devuelve TRES opciones distintas.
El consumidor usa timestampMs%10000, por lo que reinicia ademas el giro.
191 pide girar3segundos y detenerse en UNA opcion hasta el siguiente intento.
Guardar el resultado/semilla por intento, no derivarlo del reloj de cada frame;
evitar una opcion fija igual para todas las personas. No agregar ranking/datos
personales ni convertirlo en otra funcionalidad.

## Aceptacion y limites

233-filtros-funciones.json registra hashes, argumentos y9positivos: sincara,
nombre/corona, coordenadas normalizadas/pixel, movimiento, escala, marcoapagado,
marcoelegante, doscaras para intercambio y pausa de boca. Es un espia de canvas
con puntos sinteticos, NO pixeles/modelo/imagen real/captura/video/hardware.
Agregar prueba de consumidor con fuente de caras, no solo biblioteca; seguir
conservando los originales y negativos. El modelo y las escenas reales no
quedan certificados por esos nueve controles.

230 inicial no encontro consumidores y no resolvio TypeScript. La revision
principal RECTIFICO ambas cosas: SI hay llamadas, y TS se cargo desde el
artefacto local existente. No usar ese primer informe para eliminar funciones.

```comprobar
archivo: src/lib/entretenimiento/filtros-cara.ts
usa: dibujarFiltroDeCara en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: dibujarFiltroDeCara en src/app/evento/touchpix/[fiestaId]/page.tsx
usa: dibujarFiltroDeCara en src/app/evento/bogue/[fiestaId]/page.tsx
usa: dibujarFiltroDeCara en src/app/evento/espejo-magico/[fiestaId]/page.tsx
archivo: src/lib/entretenimiento/marcos-dinamicos.ts
usa: dibujarMarcoDinamico en src/app/evento/plataforma-360/[fiestaId]/page.tsx
prueba: docs/evidencias/233-filtros-funciones.mjs
```
