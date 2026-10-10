# Auditoria91 - Entrega final del recibo de personal

10/10/2026. Equipo que registra pago y recibe documento firmado. Resultado PARCIAL.
Fuente2aac14e290b20945bd984a0c5e2ffdbe50eb853c; main contrastado remoto
0af74652ebdf4c813b9eb443c358d51bc24542d7 sin delta en estos consumidores.
PR1282 documental, HEAD previo715368d9. Trabajo local de programadores NO
CONTRASTADO si no fue subido. Codex audita, Claude programa/compila dinero.

## Alcance nuevo y aprobaciones

Hueco de matriz84: el recibo firmado realmente subido y recuperado. No se repite
cobros anteriores ni se afirma area personal completa.
Nextdev3300, Firestore8085 y Storage9195 demo; fixture propio empleado, rol,
dos fiestas y otro empleado; sin datos, dinero, credenciales ni mensajes reales.
SDK siembra datos y verifica resultados; acciones/lectores UI reales no simulados.

- PC: marcar Pagado, guardar, subir PDFficticio, bytes exactos en Storage,
  enlace200application/pdf, recarga y otra sesion ven el archivo correcto.
  Otro empleado y otra fiesta permanecen intactos.
- Movil Chromium390x844: mismo recorrido de firmado/persistencia/otro lector pasa.

Raws `91-e2e-recibos-desktop.json`:150.216s,1pasa+1falla centavos;
`91-e2e-firmado-mobile.json`:79.136s,1pasa;
`91-e2e-reemplazo-desktop.json`:27.213s,1falla reemplazo.
Subida inicial usa setInputFiles; no prueba apertura nativa del boton Subir
firmado. Reemplazar SI usa boton y filechooser reales. PDFficticio no prueba
identidad del firmante, validez legal, pago bancario ni impresora fisica.

## Defectos: orden142 para Claude

### PER91-CENTAVOS P2

Monto1000, componentes visibles857.19/71.40/71.40: suman999.99. Total1000.
Sonda falla exactamente99999!=100000centavos. El segundo recibo500 suma bien:
no afirmar que todos fallan ni que se haya pagado de menos.
Evidencia `91-artifactos/desglose-papel.json`, `desglose-recibo.png`,
`recibos-papel-real.pdf` y `papel-render-1.png`.
Boton Descargar Todo(PDF) llama window.print; se espia ese llamado para evitar
dialogo OS, luego page.pdf captura el DOM/CSS de impresion real. NO es prueba
de una descarga PDF directa de la app. UnA4 renderizado e inspeccionado.
Consumidor calculateSalaryBreakdown79, llamadas252/516 en personal/recibos.

### PER91-REEMPLAZO P2

Recibo firmado existente, boton Reemplazar abre selector; elegir PDFnuevo.
Aviso Estado requerido / Primero marca el recibo como pagado. Archivo viejo,
estado firmado_subido,1000 y fecha2026-10-10 permanecen; no perdida de datos.
Sonda falla por anterior-a91.pdf en vez de reemplazo-a91.pdf.
Evidencia `91-artifactos/reemplazo-firmado.json`, `reemplazo-rechazado.png`.
uploadAndSaveSignedReceipt212/input510 en empleados/[id]/historial; guardia218.
Esperado: reemplazo documental con permisos, sin modificar pago ya confirmado.

### PER91-FECHA P2

Fixture guarda fechaEvento2026-10-10; recibo de Evento principal A91 dice9.
Papel PDF y render conservados muestran9 de octubre de2026, distinto de emision10.
formatDate51 en personal/recibos interpreta fecha sola via new Date; hay politica
diaCalendario existente ya usada en presupuesto/recibo-contrato.
La sonda final espero Evento principal A91 y selecciono SU header antes de
contrastar SDK10 con visible9. Fallo esperado10 / recibido9 observado en sesion.
LIMITACION: raw y screenshot de esa ultima sonda quedaron en TEMP, desaparecido
al retomar; no se inventan ni reconstruyen como salida ejecutada. Claude debe
reejecutar fecha antes de aceptarla. PDF y semilla/probe preservados sustentan
la observacion, no certificado global de fechas ni zona de todo despliegue.

## Descartes y limites

- Dos primeros intentos de fecha fallaron por selector estricto/datos aun sin
  cargar. `91-e2e-fecha-selector-original.json` y `91-e2e-fecha-antes-de-cargar.json`
  NO son fallos de app ni aprobaciones. No sumarlos como dos hallazgos.
- Todas las sondas tienen finally de limpieza de sus fixtures propios. Verificacion
  SDK final adicional no ejecutada: TEMP/runtime desaparecieron. Los PID propios
  ya no corresponden a esa ejecucion; no se mataron procesos ajenos/reutilizados.
- Sin build optimizado, TypeScript/lint global, Hosting, firma legal, pasarela,
  hardware ni19presupuestos originales. Permisos/concurrencia de reemplazo nuevo
  pendientes de prueba permanente; impresion de todas las fiestas no recorrida.
- Captura movil inspeccionada, tabla ancha; no aprobacion estetica total ni defecto
  por encabezado sticky de screenshot largo o indicadores de Nextdev.
- Mejora P3 opcional: papel usa margen izquierdo amplio. No se ordena redisenar
  ni cambiar politica de nomina sin aprobacion del dueno.

Dos aprobaciones acotadas, tres defectos pendientes. NO0errores ni14areaslimpias.
Entrega en misma PR1282; no producto modificado, nuevaPR ni fusion.
Validacion documental: sintaxis aislada de la sonda91 aprobada; check-acentos
2637archivos aprobado; git diff --check aprobado. ESTADO conserva39lineas.
