# Recuento unico - 24/10/2026

Main observado3e45a4ac6b479f89605163168e31b37dc84f2d0f (PR1360 integrada).
Baseline nativo269/274:725e62ba2f909578628fad47402d125ed9632c70.
CandidatoGemini1353 congelado917a98e32c63fe2f832f5cdc16db87f4fc722b6c.
386 ejecuta bateria canonica:862suites5243PASS0FAIL0pending, sin adaptador370.
406 build917PASS tipos/lint;442 termina8nativosSDKPASS,443 verifica limpieza.
Cinco causas vigentes en TRESordenes214/220/221; no todas las areas aceptadas.
400-informe-final.md es el dictamen final consolidado, NO aprobacion global.
3f/349/359 son historicos preservados;364/376/386 resuelven su diagnostico.
390 comprobo HEAD privado igual917/tracked limpio a17:21UTC24/10;
cambios privados posteriores no publicados NO CONTRASTADOS.
EntregaClaude1357 integrada;254/255 retestean C1-C4 y217R1, ver256-cierre.
Indice consolidado de165/169/198/202/220 y recibos216-264. No prueba nueva por indice.
1358 auditada focalmente260-264:14criterios11PASS3FAIL, DOS causas nuevas;
no aceptacion de toda la entrega. Ver265, sin borrar cierres254/255.
AUDITADO = hay comprobaciones concretas del area, NO toda el area aceptada.
CORREGIDO/COMPROBADO = cierre por el alcance y fuente de su recibo; no prueba
automatica de todos los consumidores actuales. Manualdeldueno no es pendienteCodex.

## 1. Areas con auditoria documentada

| Area | Ejemplos comprobados | Recibos/indice |
| --- | --- | --- |
| Cobros/cuotas/facturas/recibos | Numeros, permisos, reintentos, aviso de pago y comprobante |124/128/130/133/154;222|
| Contrato/senia/firma | Fechas, cancelacion/reprogramacion, resumen, constancia y concurrencia |128/133/151/154;223/240|
| Comida/compras/insumos | Cocina, fecha civil, compras y controles focales |129/131/133/151|
| Ingreso/sesiones/permisos | Identidad, perfiles, acceso propio/ajeno y recortes |136/154/156/157/160/178|
| Fiesta/invitados/confirmaciones | Planificacion, agenda, mesas y viajes focales |126/131/132/133/135/151|
| Portal cliente | Pago, bancos, album, musica, portada, cambios y persistencia |188-195;221-229;240|
| Portal invitado | Identidad, enlaces y accesos focales |126/133/157|
| Web/blog/simuladores | Viaje comercial, PDF/CRM, galeria y controles de navegacion |133/150/154/155/161/172;213/215parciales|
| Redes/galeria | Sincronizador/duplicados por alcance y protocoloMeta |155/161/164/174/180;197/237|
| Entretenimiento | Estaciones/enlaces/tokens, 3D y filtros por alcance |125/133/135/157/174/180/182;233|
| Barra | Pedidos, DJ y controles focales |132/135|
| Asistente/WhatsApp | Guardados, resultados veraces, voz/Meta con dobles |118-121/135/157/162/171/174/180/182;237|
| Personal/recibos | Perfil propio, asignaciones, agenda y rol de atencion |129/131/133/154/160/178/179/181;191|
| Tareas automaticas | Puertas/respuestas, algunos motores, publicador y recordatorios |129/131/158-160/162/164;247-250|

## 2. Cierres concretos comprobados, no areas enteras

- Presupuestos manual/configurador: guardado tras respuesta perdida, fuentes118/119.
- Portal/aprobaciones: cinco causas211 cerradas por216; DOSintercalados213
  cerrados por242 sobre mainbaa (firma y compensacion que no borra invitados).
- Avisos de pago/reintentos/comprobante fallido:222SDK12PASS, A1/A2.
- Pedidos de menu/servicios simultaneos:221SDK9PASS, A9 por sus variantes.
- Cancelacion/reprogramacion/importes/PIN y reintentos:22315PASS, A5/A6.
- Acceso al presupuesto propio con sesion cliente y errores de lectura:224/227,
  A3/A4 por sus controles; el fallo de botonA7 NOqueda cerrado.
- Entrada de proveedor/error/reintento:19613PASS, cierre209 por alcance.
- Personal:1913PASS, sincronizador elige atencion y no cocina.
- Voz/Meta:197/237 protocolo compuesto; NOproveedor/modelo/audio real certificados.
- Cocina/fecha/cabecera y foco de visores tienen cierres historicos151/154/172;
  consultar recibo antes de reabrir. No declarar cada menu/pantalla completa.
- Costos/seña1358:2617PASS con motores/helpers reales y almacenamiento controlado;
  conserva costos al mezclar, no duplica lavanderia ni oculta fallos de guardado,
  lectura vinculada ilegible devuelve null y respeta la seña explicita/default.
  NoSDK/UI ni todos los motores/consumidores de costos aceptados.

## 3. Ya auditado pero falta corregir o comprobar entrega

| Pendiente concreto | Responsable/estado contrastado |
| --- | --- |
|4causas contrato: resumen, constancia alterable, firma concurrente, texto no visto|CERRADAS por254SDK11PASS en725, no todaelarea contrato ni todoslosguardados|
|Aprobacion fallida tardia vuelve a pendiente un aviso que el reintento ya acredito|218 CERRADA por285:2PASS AdminSDKdemo en3e; intercalado y control positivo, no toda contabilidad|
|Guardado iniciado antes de firma escribe despues otro texto y deja constancia vieja|219 CERRADA por286:2PASS AdminSDKdemo en3e; gancho adaptado a actualizarFiesta; no reabre216C4|
|Recordatorio sinclave puede llamar remitente|CERRADA por2553PASS en725; no proveedor/HTTPreal|
|Fecha reprogramada ignorada; falloenvio+respaldo consume dia; reservafallida marcaexito|CERRADAS por388 en917:10PASS, incluidos los ocho criterios originales y DOSvariantes503; trace incidental403 ya no genera reintento ciego|
|Boton Informar pago sin formulario y enlace de album perdido|357 cierra212A7/A8 en3f:4PASS pagina/DTO/ReactDOM/modal/album/borrador/cierre sin enviar; no toda212, no pagos reales|
|Filtros: consumidores carasvacias, reactivos sin efecto, ruleta reinicia|356 retestea3f:12criterios9PASS3FAIL.415 extiende MISMA causa carasvacias: refFotocabina no alimentada. TRES causas214 en917, no cuarta ni otra orden|
|Devolucion general1353: compilacion, pruebas y controles enumerados porClaude|386 en917:862suites5243PASS oficial;406buildPASS tipos/lint. No acepta filtros, factura387 ni contraste423.392 fue preflight anterior sin iniciarbuild|
|Pantalla de tragos listos: titulo claro sobre main casi blanco|220/Gemini o223Claude PARCIAL:quita main.flex-1 pero ak-internal-experience-polish.css conserva fondo hijo.423/425 PC/movilFAIL1.390/1.376:1.393falsePASS ignoraba gradiente; misma orden, no repetir selector corregido|
|Factura ausente sigue cargando tras terminar las lecturas|221/Claude224:NULL CERRADO por387PASS en917; pendientePASS. MISMA orden conserva UNA varianteFAIL: lectura de plantilla rechazada termina afirmando factura inexistente. No error de importes demostrado|

## 4. Cierre ejecutado y limites de aceptacion

- La bateria269 y su continuacion274 terminaron. Conciliacion277 con el formato
  REAL de Playwright:1144casos unicos,542ejecutados,496PASS/46FAIL o timeout,
  600SKIP declarados (516capturas optativas) y2FIXME. No1144PASS ni46bugs.
  El contador273 preliminar era incorrecto;277 lo sustituye conservando originales.
  Reensayo318 sobre3e tenia149PASS/27FAIL o timeout/34SKIP.374 reejecuta
  SOLO esos27:10PASS/17FAIL.390 concilia210unicos/176ejecutados,
  159PASS/17FAIL o timeout/34SKIP. No17bugs ni suma de intentos como funciones.
  381 prueba5ciclos sugerir/cancelar;382 fecha realDOM pantalla/print2PASS,
  sin promover tests fallidos aPASS.317/319 clasifican errores de SDK/initScript;
  todos los fallos iniciales, cancelaciones y descartes quedan conservados.
- 321 completo la bateria existente:834suites/5136PASS/0FAIL/0pending,
  configuracion oficial Jest y red externa bloqueada.314 no era canonica:
  72fallos por forzadas globales de navegador, no72regresiones de app.
- 332/334 completaron374/374paginas en3e,0sin visitar:359PASO,
  1FALLO de aperturaPlaylist y14NO_PROBADA.67entradas internas se corrigieron
  porque el propio inventario omitiafiestaId.50handlers adicionales hacen
  424entradas actuales;421era inventario historico, no421paginas aprobadas.
- 344 completo15diagnosticos de excepciones sin alterar sus etiquetas:
  diez estaciones SI muestran estado/cola/denegacion de camara, dos lectores
  VideoVida muestran error y reintento.304 cubre lectores conSDKdemo.
  Factura y VideoVidaadministrativo no acreditaron cuerpo util en ese recorrido;
  345 aisla causalmente el caso de factura null, que ahora es la orden221.
  Playlist mostroAlgo salio mal en QA con red negada; logsEGRESS_BLOCKED no
  bastan para afirmar causa unica ni defecto publicado dePlaylist.
- 343 corrige la atribucion inicial de339: el diagnostico esperaba unmain
  inexistente sin timeout. No fue prueba de queBogue niCDP congelaran la app.
  344 comprueba presencia y acota lecturas; originales preservados/sourceDiff0.
- Apertura por un actor de equipo no completa accion/estado/rol de las14areas.
  Los controles especificos conservan sus recibos y fuentes; unNO_PROBADA,
  unSKIP o un error del arnes nunca se convierte en funcion aprobada.
- Motores automaticos restantes: respuestas de11rutas NOprueban ejecucion completa
  de11motores;247/249/250 agregan escenarios, no cierran todo el conjunto.
- Verificar resultados de conexiones externas con evidencia del proveedor;
  dobles locales NOcertifican sincronizacion/modelo/voz/entrega de mensajes reales.
- 342 detecta nuevaPR1353SHA3f,131entradas src/tests distintas frente a3e.
  347 compila SU fuente;349 ejecuta su bateria completa,13FAIL no borrados.
  350/356/357 cierran o mantienen los criterios concretos indicados arriba.
  352/355 album en fase financiera eran erroresQA,357faseorganizacion4PASS.
  358 preserva bloqueo de repeticion de siete suites:RAM<2GiB yTemp347ausente.
  359 cierra las EJECUCIONES de la tanda, no acepta toda1353/14areas/cadaaccion.
- 363/364 DEMUESTRAN sparse checkout omitia blogJSON original; al materializar
  su blobGit pasa el test.364 siete suites33casos21PASS12FAIL; no ocultarlos.
  376 diagnostico focal de cinco suites+controles:26PASS, adaptador deIOmock
  NO canonico.917 corrige contrato/mock y386 bateria oficial5243PASS sin370.
  385 registro cambioQA notifications,391 acredita restauracion exacta/sourceDiff0.
- 400 contiene dictamen final y clasificacion de17no aprobados, no17encargos.
  383/384 rectificados:selector Publicar vigente, SHA3e existe, ni modelo ni
  Bogue/CDP tienen causa demostrada por esos adjuntos. No falsos positivos.

- 405 clasifica34SKIP originales:todos guardias desktop-only, no34funciones
  ausentes.412 variantes moviles adicionales27PASS6FAIL1SKIP, sin retirar
  aserciones. No transformar losSKIP de3e ni sumar variantes como funciones.
- 406 compilo917 (exit0,tipos/lint) sin editar fuente;427 copia runtime3897
  archivos conSHA256 a fuenteGit fresca917. No nueva compilacion ni SHAmixta.
- 425SDKdemo:1PASS7FAIL1SKIP. Touchpix respuesta tardiaA/B SI pasa; los dos
  fallos423 son MISMA220. Fotocabina ysimulador se aislan con controles442.
- 442SDKdemo actual:8PASS0FAIL0SKIP. Preview1/3fotos, respaldo local/error
  rechazado enPC/movil, Visioncaida sin duplicados y simulador con presupuesto1
  yprospecto1 persistentes.443 verifica data restaurada/sourceDiff0/cleanup200
  y todos susPIDcerrados. No modelo/proveedor/hardware ni autoentrega futura.
  Tresfotos conserva respuestas de transicion invalida:previewPASS no acepta
  sincronizacion. Rechazo es respuesta cliente controlada tras subida local.
- 437 DESCARTA CTA/guardado roto inferido del test de simulador: nunca clico
  VerResumen.439 espera visibilidad antes declick; mismas asercionesPASS442.
- 393/410contrastePASS INVALIDADO por423:ignoraba background-image. Captura416
  y raster423 detectan el selector hijo. No confundir lecturaCSS con apariencia.
- 421 preflight9vs8 abandono antes de restaurar SUcopiaQA392:CUARENTENA, no
  restauracion exacta.426 carrera de copia,433argsPowerShell:erroresQA, noapp.
  427 fuente nueva limpia protege snapshots y443 acredita restauracion actual.

No hay base para decir "solo faltan Xbotones" ni "audite toda la app".
Los renglones de3 son trabajo conocido de correccion/retest, NO partes sin auditar.
Los de4 son limites concretos de evidencia, no nuevas areas descubiertas.
Este indice sustituye listas generales contradictorias; actualizar solo con
nuevo recibo/fuente, sin sumar otra vez las reejecuciones ni borrar cierres validos.
