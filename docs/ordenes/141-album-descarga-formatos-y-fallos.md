# 141 - Album: entregar formatos correctos y avisar descargas fallidas

NO CONTRASTADO CON LA TANDA DE PROGRAMACION LOCAL NO SUBIDA.
Responsable: Gemini programa; Claude compila el conjunto; Codex acepta resultado.
Incluir en la tanda abierta, NO crear/fusionar otra propuesta pequena.

## Base y contraste obligatorio

Fuente ejecutada: `2aac14e290b20945bd984a0c5e2ffdbe50eb853c`.
Main contrastado: `0af74652ebdf4c813b9eb443c358d51bc24542d7`.
Consumidor y lector social sin cambio en ese delta. PR1282 solo QA/documentos;
HEAD antes de esta orden `a8a69cc4f46f226a364c11d6bb4e9fa2ae4e5e90`.
Antes de programar, comparar con el HEAD real de Gemini: si ya esta arreglado,
traer evidencia y no volver a implementar. No conozco su trabajo local no subido.

## Dos defectos reproducidos, no solo sospechas de codigo

Ruta: `/evento/album/[fiestaId]`, cliente/invitado SIN cuenta del equipo.
Consumidor: `handleDownloadAll`, enlazado al boton `boton-descargar-album`, en
`src/app/evento/album/[fiestaId]/page.tsx` (181/356 en SHA ejecutado).
Lector: `getPublicSocialPosts` en `src/app/actions/social-gallery.ts`.

1. **ENT90-FORMATO P1.** Una foto PNG y un video WebM aprobado, reproducible320x180
   en Chromium, llegan al ZIP con sus bytes exactos. Pero el video se llama
   `recuerdo_2_plataforma_360.jpg`; cabecera EBML `1a45dfa3`, NO JPEG.
   Cliente recibe un video disfrazado de foto. Conservar formato real; no elegir
   solamente PNG/JPG por substring de URL. No transcodificar ni pagar un proveedor
   para corregir el nombre. Si formato no es determinable, avisar, no inventarlo.
2. **ENT90-VACIO P1.** Despues de cargar dos fotos aprobadas, abortar SUS dos GET de
   archivo al pulsar Descargar todo. Baja ZIP solo con `info-evento.txt`, cero
   medios. La pantalla anuncia: "Se empaquetaron 2 recuerdos en un archivo ZIP".
   No usar `posts.length` como cantidad entregada si `count===0`. Con cero medios,
   informar fallo y ofrecer reintento, no una entrega vacia presentada como exito.
   Si algunos bajan, no destruirlos: informar cantidad real y faltantes claramente.

Sonda real: `docs/evidencias/90-album-zip-final.spec.ts`, copiada SOLO al TEMP
autorizado. Raws90 y ZIP/JSON/capturas en `docs/evidencias/90-artifactos/`.
PC:1aprobado/2fallos reproducidos; movil: descarga de fotos1aprobada. No hardware
ni Hosting probado. Primera corrida con clic antes de hidratacion es error QA,
no defecto de app. Informe `90-album-descarga-final.md` explica los limites.

## Conservar y comprobar

- Ya aprobado PC/movil: dos fotos PNG/JPEG recuperadas con bytes exactos, recarga,
  sin cuenta ni endpoint administrativo; pendientes/ocultos/otra fiesta excluidos.
- No exigir login nuevo ni abrir permiso de admin para descargar el album publico.
  La publicacion del album con enlace es decision existente, NO una fuga nueva.
- Probar WebM y formatos soportados con MIME/cabecera coherentes; incluir URLs
  de Storage sin extension legible y parametros sin decidir por `.png` incidental.
- Probar fallo total, parcial y reintento: estado/boton recuperables, conteo real,
  sin desaparecer archivos aprobados ni incluir pendientes/ocultos/otra fiesta.
- Agregar regression de consumidor; existencia de boton/helper NO acepta entrega.
  La nueva prueba permanente en tests/e2e sigue PENDIENTE de creacion/ejecucion.
- Registrar SHA destino, comando, resultado, ZIP abierto y limites en YA-RESUELTO.
  No afirmar proveedor/hardware real ni toda el area limpia por estos casos.

```comprobar
archivo: src/app/evento/album/[fiestaId]/page.tsx
usa: handleDownloadAll en src/app/evento/album/[fiestaId]/page.tsx
prueba: docs/evidencias/90-album-zip-final.spec.ts
```
