# Orden199 - Galeria publica: volver a la foto con el teclado

**NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.** Responsable Gemini.
ID estable: AK-CODEX-155-GALERIA-FOCO. Estado: FRICCION P2 reproducida en DOM,
pendiente correccion y retest nativo. Va con la tanda abierta, no otra propuesta.

Main894d01603e0e03cebc8f90a6ccf869ef86bbe1de. Consumidor y modulos cargados
iguales en1337HEAD45a0; Claude publicofc5e606a solo cambia el traspaso.
Verificar el HEAD de trabajo antes de tocarlo; no reimplementar un arreglo nuevo.

## Recorrido y resultado observado

src/app/page.tsx usa AsyncGallerySection -> GaleriaUnificadaSection ->
GallerySection. En el componente REAL renderizado con React/jsdom:

1. La tarjeta recibe foco y abre el visor: el dialogo aparece.
2. El foco sigue en Abrir foto, detras del dialogo aria-modal, no en el visor.
3. Flechas anterior/siguiente y Escape funcionan.
4. Tras enfocar Cerrar dentro y cerrar con Escape, el foco queda en BODY,
   sin volver a la tarjeta elegida. El usuario pierde su lugar en el recorrido.

Siete controles pasan, dos fallan por una misma falta de manejo del foco.
Control positivo Radix real pasa en el mismo DOM. Evidencia completa y limites:
docs/evidencias/155-galeria-teclado.json y155-galeria-foco.md.
NO es reproduccion con Tab nativo ni lector de pantalla, tampoco bloqueo de cierre.

## Correccion propuesta y aceptacion

-Al abrir desde teclado, llevar foco a un control visible del visor, sin abrir
  teclado virtual ni cambiar seleccion, categorias, negocio o imagenes.
-Mantener el foco dentro mientras el modal este abierto; al cerrar por Escape,
  boton o fondo devolverlo a la tarjeta original si sigue montada.
-Conservar flechas, vuelta primera/ultima, Escape y preferencia de movimiento
  reducido. No modificar Dialog global: su cancelacion de autofocus es explicita
  y no se ha auditado por que existe en todas sus pantallas.
-Retest de componente sobre SHA nuevo con recibo separado y prueba real de Tab,
  Shift+Tab, Escape y retorno en escritorio; comprobar tactil/movil sin teclado
  virtual indeseado. Estas pruebas futuras estan PENDIENTES, no se dan aprobadas.

## Bloque 2 (agregado por Claude, barrido de la pregunta 83) - Video de ayuda

`src/components/ayuda/VideoDeAyuda.tsx` (líneas ~48-74) abre un visor con `role="dialog"` y
`aria-modal="true"` que no hace ninguna de las tres cosas: no lleva el foco adentro, no cierra con
Escape y no devuelve el foco al botón que lo abrió. Se usa en el simulador de presupuesto
(`src/app/simulador-de-presupuesto/page.tsx` ~1576 y ~2021) y en `src/app/video-vida/[fiestaId]/page.tsx` ~209.

Copiar la forma que ya anda en `src/components/landing/VideoSection.tsx`: al abrir, guardar
`document.activeElement` en un ref y enfocar el botón Cerrar con `requestAnimationFrame` (línea ~204 y ~250);
Escape cierra (línea ~206); al cerrar, devolver el foco al ref guardado (línea ~230). No tocar el Dialog
global ni el video en sí. La prueba (Jest con jsdom) abre con el botón, mira que el foco quede en Cerrar,
aprieta Escape y mira que el foco vuelva al botón que lo abrió; tiene que dar rojo con el archivo de hoy.

```comprobar
archivo: src/components/landing/GallerySection.tsx
usa: GallerySection en src/components/landing/GaleriaUnificadaSection.tsx
prueba: docs/evidencias/155-galeria-teclado.mjs
usa: document.activeElement en src/components/ayuda/VideoDeAyuda.tsx
usa: Escape en src/components/ayuda/VideoDeAyuda.tsx
```
