# Reportes y conexiones: continuacion de auditoria

Fecha 2026-09-16. Main da6c566fbefdf82efec484f7fc9830db6ab5c4de. Codex documenta, no programa ni compila.

## Contraste de tandas

Actualizacion prioritaria 2026-09-17: main sigue en da6c566, pero PR1209 avanzo a b4c6929202b898740f81846e922daf8b771515be y SI modifica los cuatro caminos auditados. Lo descrito abajo es evidencia HISTORICA de main, no instrucciones de rehacer la solucion pendiente. YouTube ya incorpora descarga e intercambio resumable con PUT; reportes usa rango-de-dias; Gmail incorpora mutex y registro por invitado; TikTok consulta estado. Ninguno se declara validado integralmente. Ver CONTRASTE-1209-2026-09-17.md para los limites restantes. Las otras cuatro PR conservan los HEAD indicados abajo.

PR 1209 f6b619a; 1207 29943cd; 1206 **129c1988** (cambio durante esta revision); 1202 6622427; 1197 f0ac2027. Sus diffs completos no modifican reportes.ts, Google Workspace, publicador.ts, youtube-publisher.ts, tiktok-publisher.ts ni las pantallas consumidoras aqui indicadas. No se audito otra vez lo que Gemini esta corrigiendo. Trabajo local sin subir: no visible.

## REP01 - P1: el ultimo dia puede quedar fuera del reporte

Funcion real: getProfitAndLossData e inRange en src/app/actions/reportes.ts. Consumidor: handleGenerateReport en src/app/(app)/empresa/contabilidad/reportes/page.tsx. DatePickerDemo pasa la fecha seleccionada sin normalizar el final del dia; la pantalla dice Desde/Hasta por fecha, no por hora.

Reproduccion aislada: rango 1/9/2026 00:00 a 16/9/2026 00:00, zona -03:00; cobro confirmado de 1000 el 16/9 a las 12:00. Resultado success=true, ingresos=0. Control el 15/9 suma 1000; control el 17/9 queda fuera. La sonda usa la funcion real completa y simula lectores/validacion de estado de pago.

Para una persona que selecciona hasta el 16, faltan los cobros de ese dia. Claude: definir limites por dia civil de Uruguay, preferiblemente inicio incluido y comienzo del dia siguiente excluido; validar rango invertido/fechas invalidas. Probar ultimo dia, medianoche siguiente, fechas con hora y formato solo fecha. No cambiar criterio contable caja/devengado sin decision del dueno.

Observacion separada, NO correccion automatica: costos de fiestas se seleccionan por fecha del evento, ingresos por fecha del cobro; pueden incluir pagos de proveedor fuera del periodo. El reporte no explica esa mezcla. Confirmar criterio de negocio con el dueno antes de cambiarlo. No se declara un total correcto alternativo sin ese criterio.

## GML01 - P2: dos operadores pueden mandar dos invitaciones

Funcion real: notifyGuestsWithCalendarLinks en src/app/actions/google-workspace-extended.ts. Consumidor confirmado: handleNotifyGuests, src/app/(app)/settings/google-workspace/page.tsx, lineas 107-123.

Reproduccion: dos llamadas concurrentes leen el mismo registro sin envio previo; ambas llaman a sendCompanyEmail para el mismo invitado. Sonda: dos envios simulados. Control secuencial: solo uno. El boton deshabilitado en una ventana no protege otra ventana/instancia.

Gemini: evitar envios concurrentes duplicados mediante reserva persistente por fiesta/invitado/tipo de notificacion. Distinguir envio confirmado, fallido e incierto; no prometer exactly-once del proveedor. Probar tambien caida despues del envio y antes del registro; forceEmail no debe activarse de forma implicita. Claude valida permisos/datos involucrados. No se enviaron correos reales.

## YTB01 - P1: el camino de YouTube no sube los bytes del video

src/lib/social-media/youtube-publisher.ts recibe videoUrl pero despues de comprobar que existe no lo usa. Envia solo metadatos JSON a /youtube/v3/videos. Consumidor real: publishPostInternal en src/lib/presencia-digital/publicador.ts, llamado por publicacion aprobada y cola programada.

La documentacion oficial requiere transferir el contenido del video; la carga reanudable envia los bytes a la URL de sesion. Referencias consultadas:
- https://developers.google.com/youtube/v3/guides/implementation/videos
- https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol

Sonda con fetch simulado: una sola peticion de metadatos, ninguna descarga/carga de contenido. Ante HTTP 400 se informa fallo (control PASS). Ante respuesta 200 vacia sintetica, el helper inventa yt_published y el consumidor guarda Publicado (FAIL). No se afirma que YouTube devuelva realmente ese cuerpo vacio; prueba la validacion insuficiente y el marcador inventado.

Gemini: implementar transferencia real con control de tamano/tipo/origen y errores, conservar ID real, distinguir transferencia/procesamiento/publicacion. No inventar IDs ni declarar video publico solo por recibir metadatos. Prueba autorizada en cuenta de ensayo, inicialmente privada; no publicar material real durante auditoria. Evaluar permisos, cuotas y aprobacion del proveedor; quitar promesas de gratis de por vida no sustentadas.

## TTK01 - P1: TikTok se marca publicado al iniciar el proceso

src/lib/social-media/tiktok-publisher.ts llama solo /v2/post/publish/video/init/ y devuelve success con publish_id. publishPostInternal lo convierte inmediatamente en status=Publicado.

Sonda con la cadena real: init devuelve publish_id=pending-job; se guarda Publicado sin consulta de estado. La API oficial separa inicio y estado final; dispone de fetch status y eventos de publicacion. Referencia: https://developers.tiktok.com/docs/en/content-posting-api-reference-get-video-status

Gemini: conservar tarea pendiente y consultar estado o recibir confirmacion verificada, registrar fallo final, timeout y reintentos. No inventar tiktok_published si falta ID. Probar init aceptado -> fallo posterior, proceso en curso y exito confirmado. No confundir ingestion de contenido de redes hacia galeria con publicacion de la app hacia redes: son caminos diferentes.

## Que si se verifico sin cuentas externas

- Gmail tiene prueba existente que no cuenta un envio rechazado como entregado; usa proveedor simulado. No prueba autorizacion/entrega en la cuenta real.
- Instagram tiene prueba existente que rechaza sincronizacion sin credenciales en produccion y comprueba guardia manual. No prueba importacion completa, clasificacion correcta ni deduplicacion real.
- WhatsApp: el consumidor /api/whatsapp/webhook/route.ts invoca verificadores Meta/Twilio en produccion y rechaza formato generico. Los tests revisados comprueban firmas con cuerpos sinteticos. No se realizo envio/recepcion con cuenta real ni prueba de reentrega del proveedor.
- No se certifican Mercado Pago, FCM, todas las redes, OAuth en produccion ni estado de credenciales. Tampoco conciliacion de los 19 presupuestos.

## Evidencia y limites

docs/evidencias/reportes-google-sonda.cjs: 5 casos, 3 PASS / 2 FAIL.
docs/evidencias/publicadores-sonda.cjs: 3 casos, 1 PASS / 2 FAIL.
Ambas extraen funciones reales por AST con TypeScript 5.9.3 y Node 24, usando almacenamiento/red simulados. Sin React, sin Firebase real, sin envios ni publicaciones externas. No reemplazan pruebas integrales del producto. Los tests existentes revisados no se ejecutaron de nuevo.

No se alteran las PR de Gemini. Observaciones acumuladas para el diagnostico conjunto y correccion posterior. Antes de programar, contrastar HEAD otra vez para evitar repetir trabajo recien subido. No hay certificado global de lanzamiento.

