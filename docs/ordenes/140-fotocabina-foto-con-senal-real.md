# 140 - La fotocabina debe entregar la imagen de la camara, no un recuadro negro

**NO CONTRASTADO CON LA TANDA DE PROGRAMACION LOCAL NO SUBIDA.**
Responsable: Gemini programa; Claude revisa/compila. Codex aporta la evidencia.
No fusionar automaticamente. No cambiar prioridades ni comportamiento comercial.

## Version y contraste

Fuente ejecutada: `2aac14e290b20945bd984a0c5e2ffdbe50eb853c`.
Main contrastado: `0af74652ebdf4c813b9eb443c358d51bc24542d7`.
Los consumidores y dependencias directas de esta captura no cambiaron entre ambos.
Al contrastar solo estaba abierta la PR documental 1282, HEAD `4a534eab`.
No conozco las correcciones locales no subidas de Gemini: compararlas primero y
no reimplementar un arreglo ya presente. Esto NO es comprobacion en Hosting ni
ensayo con la camara/impresora fisica.

## ENT89-IMAGEN - P1 reproducido en Chromium aislado

1. Fiesta ficticia propia, permiso firmado de fotocabina, SIN cookie del equipo.
2. Una foto por tanda, sin filtro/chroma, captura y botones reales de la estacion.
3. Camara nativa falsa de Chromium (`--use-fake-device-for-media-stream`), no
   sustitucion del resultado ni mock de la captura de la app.
4. Un reproductor independiente de la MISMA `srcObject` obtiene 307200 pixeles
   no negros en una muestra 640x480, con reproduccion activa. No toca el video
   de la app ni invoca `play()` sobre el.
5. Video de la app: ancho1080, readyState4, track live, pero paused=true y muestra
   negro. Se pulsa el boton real; la composicion final1200x1800 aparece.
6. Region interior de la foto, sin plantilla/pie: 0 de280000 pixeles no negros.
   No basta con que el JPEG tenga dimensiones, marco o un QR.

Evidencia: `89-e2e-nativa-y-portal-original.json`, archivos adjuntos de camara,
control independiente, recuerdo JPEG y medidas de pixeles; sonda
`docs/evidencias/89-fotocabina-entrega-sucesiva.spec.ts`.
Resultado: la foto pierde la imagen en este entorno de navegador. No atribuir
esto a permisos de hardware ni prometer que sucede en todos los equipos.

## Correccion requerida y limites

- Examinar `startCamera`, el efecto del estado y `captureToCanvas` en
  `src/app/evento/fotocabina/[fiestaId]/page.tsx`. Asegurar reproduccion y un cuadro
  util antes de disparar, y que los cambios de estado no lo sustituyan/detengan
  entre comprobacion y dibujo. La causa exacta debe demostrarse, no suponerse.
- Si la camara no puede arrancar, aviso visible y reintento; no entregar el marco
  vacio como foto lista ni guardar/publicar una captura perdida.
  El umbral de pixeles es control de ESTA senal QA conocida, no una regla nueva
  para rechazar fotos oscuras reales. No modificar esa politica sin el dueno.
- Conservar tira, marco, foto individual, consentimiento, permiso acotado,
  cola offline e identidad por captura. No arreglarlo dando sesion de equipo.
- Validar tanto una foto como tres, reinicio entre dos tandas, y corte de red.
  No aprobar por texto/imagen cualquiera/naturalWidth/no errores de consola.
- La sonda exige contenido dentro de la foto, descarga, QR decodificado, bytes
  del Storage demo y persistencia. Hoy FALLA antes de la aceptacion final: no
  presentarla como pasada ni declarar entrega de dos fotos validas.

## Errores de QA descartados

Navegar al JPEG de Storage inicia descarga: es correcto, no fallo de la app.
Camara canvas inicial daba negro; no se usa esa senal para demostrar este fallo.
Una tanda de una foto no muestra miniaturas: no exigir el selector de tres fotos.
Mismo contenido con IDs distintos no demuestra reutilizacion: el generador nativo
puede repetirse. No se usa esa igualdad de bytes como defecto.

```comprobar
archivo: src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: captureToCanvas en src/app/evento/fotocabina/[fiestaId]/page.tsx
prueba: docs/evidencias/89-fotocabina-entrega-sucesiva.spec.ts
prueba: src/__tests__/la-fotocabina-no-dibuja-un-video-pausado.test.ts
prueba: tests/e2e/la-fotocabina-saca-la-foto-con-imagen.spec.ts
usa: asegurarCuadroDeVideo en src/app/evento/fotocabina/[fiestaId]/page.tsx
```
