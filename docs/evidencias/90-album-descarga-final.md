# Auditoria90 - El album descargado: archivos reales y fallos de entrega

10/10/2026. Rol: cliente/invitado que recibe recuerdos, SIN cuenta del equipo.
Fuente ejecutada `2aac14e290b20945bd984a0c5e2ffdbe50eb853c`, contrastada con main
`0af74652ebdf4c813b9eb443c358d51bc24542d7`. Album/lectores sin cambio en ese delta.
Runtime88 autorizado: Nextdev3300, Firestore demo8085, sin credenciales reales.
No es build optimizado, Hosting ni hardware. No hay producto modificado/merge.
PR1282 es la tanda documental vigente; Gemini local NO CONTRASTADO si no subido.

## Cobertura nueva, sin repetir los anteriores

La prueba existente `tests/e2e/el-album-se-baja-entero.spec.ts` solo comprobaba
boton y ausencia de llamada administrativa; ademas ponia cookie del equipo.
No comprobaba click, ZIP, contenido ni ausencia real de cuenta. No invalida las
pruebas anteriores: define exactamente el hueco que esta sonda complementa.

`90-album-zip-final.spec.ts` usa boton real y descarga Playwright, abre el ZIP
con JSZip, compara TODOS los bytes con fuentes propias y comprueba cabecera.
Las semillas se guardan mediante SDK en Firestore demo y fiesta JSON solo TEMP.
PNG/JPEG y video WebM320x180 se generan como fixtures aislados, NO como resultado
de fotocabina ni de equipo360. El video fuente reproduce antes de descargar.
Fotos pendientes/ocultas y de otra fiesta se siembran para comprobar exclusion.
La accion/lector de la app NO se simulan; solo el corte de GET de archivos es
provocado en el navegador. No se enviaron mensajes, cobros ni publicaciones.

## Aprobaciones acotadas

- **Fotos PC:** PNG y JPEG llegan al ZIP, dos archivos, mismos bytes, foto pendiente,
  oculta y de otra fiesta excluidas; boton liberado; recarga conserva la galeria.
  No cookie `ak_session` y cero llamadas al endpoint administrativo.
- **Fotos movil:** mismo recorrido pasa en Chromium390x844 con bytes exactos,
  ausencia de cuenta, exclusion y recarga. Captura inspeccionada; no aprobacion
  estetica de todas las fotos ni de cada pantalla. Fixture no es fotografia real.

PC:3casos/48.575s,1aprobado+2fallos nuevos. Movil:1caso/22.3s,1aprobado.
Raws: `90-e2e-album-desktop.json`, `90-e2e-album-mobile.json`.
Dos aprobaciones NO son dos areas limpias ni global0errores.

## Hallazgos reproducidos: orden141 Gemini

### ENT90-FORMATO P1 - Video descargado con extension de foto

ZIP contiene bytes WebM exactos726B y magic`1a45dfa39f428681`, pero nombre
`recuerdo_2_plataforma_360.jpg`. Control previo del MISMO archivo reproduce
320x180. No perdida de bytes ni fallo de red: falla extension coherente.
Sonda falla especificamente `/\.webm$/`; foto PNG1986B bien.
Evidencia: `90-artifactos/resultado-video.json`, `video-fuente-control.json`,
`album-video.zip` (abrible), `album-video.png`.
Esperado: medios utilizables con formato correcto, no anunciar video como JPEG.
Codigo consumidor confirmado: handleDownloadAll181 y onClick356 en la pagina.

### ENT90-VACIO P1 - Cero recuerdos descargados anuncia dos entregados

Se cargan dos fotos y se corta SOLO descarga de sus archivos, no el servidor ni
lector. ZIP contiene carpeta e info-evento.txt; cero archivos multimedia.
Aviso observable: "Se empaquetaron 2 recuerdos en un archivo ZIP"; boton se libera.
El usuario cree recibir todo y descubre carpeta vacia al abrirla. No es fallo
del selector: se obtiene archivo real y se abre. Evidencia resultado-corte.json,
album-corte.zip y captura album-corte.png inspeccionada.
Esperado: fallo/reintento cuando cero, conteo real/aviso explicito si parcial.
Codigo confirmado: excepciones por archivo ignoradas y fallback count/posts.length.

## Errores de la sonda, NO defectos nuevos

- Playwright exige destructurar fixtures; primera definicion fue rechazada sin
  probar la app. Raw `90-qa-fixtures-original.json` conservado.
- Primera corrida clico Galeria Completa antes de estar hidratada; siguio portada
  con dos recuerdos. Tres esperas de autor fallaron. `90-album-zip-original.spec.ts`
  y `90-e2e-antes-de-listo.json` conservados. Corregida SOLO la sonda: esperar
  dos recuerdos cargados antes del clic; siguiente corrida produjo ZIPs reales.
- Album publico por enlace es decision existente. Exclusion otra fiesta NO implica
  negar que alguien con enlace publico de aquella fiesta pueda abrir SU album.

## Otros limites, no nuevos encargos duplicados

- Ordenes139compras/140fotocabina y3D historico siguen separadas: no repetidas.
- Ayudante economico reviso hueco automatizaciones81: seguimiento TikTok de
  publishId hasta resultado final aun sin evidencia real. Consumidor cron
  publicar-programados; pruebas de PROCESSING no prueban proveedor final.
  Esto ya estaba registrado: no se crea otra orden ni se afirma fallo real nuevo.
- No probado aqui: dedicatorias/audios en ZIP, todos formatos/proveedores externos,
  limites de gran volumen, entrega360/fotocabina fisica, caducidad/enlaces Storage
  firmados, reintento parcial. Pendientes de cobertura, no automaticamente defectos.
- Graphify falta en este checkout; consulta puntual fallo "graph file not found".
  Serena y busqueda exacta verificaron consumidor/rutas. No se reconstruyo el grafo
  ni se agregaron herramientas/dependencias a produccion por esta auditoria.

Repeticion: copiar sonda90 a tests/e2e SOLO TEMP y usar runner88 con
`--project=chromium-desktop --workers=1 --retries=0`; movil usa filtro fotos.
Fuente/lector sin delta causal: no repetir aprobaciones previas de otras areas.

Limpieza comprobada por SDK: `fiestas90:[]`, `posts90:[]`; fixtures locales y
archivos propios quitados en finally. Ayudante economico cerrado. Sintaxis de
dos sondas y check-acentos2633archivos aprobados; no typecheck/lint/build global.
