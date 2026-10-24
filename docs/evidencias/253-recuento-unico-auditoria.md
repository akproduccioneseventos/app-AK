# Recuento unico - 23/10/2026

Main observado3e45a4ac6b479f89605163168e31b37dc84f2d0f (PR1360 integrada).
Baseline nativo269/274:725e62ba2f909578628fad47402d125ed9632c70.
CandidatoGemini1353b91; privados posteriores NO CONTRASTADOS.
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
|Fecha reprogramada ignorada; falloenvio+respaldo consume dia; reservafallida marcaexito|217R2/R3/R4 Gemini; Claude los agrega a215bloque6; sin delta nuevo verificado|
|Boton Informar pago sin formulario y enlace de album perdido|212/Gemini;227/229 confirman en1353b91; no corregido en fuente contrastada|
|Filtros: consumidores carasvacias, reactivos sin efecto, ruleta reinicia|214/Gemini;233 confirma en1353b91; no corregido en fuente contrastada|
|Devolucion general1353: compilacion, pruebas y controles enumerados porClaude|215/Gemini; no aprobada. No contar38pruebas fallidas como38bugs|

## 4. Cobertura pendiente de demostrar (NO lista de nuevos defectos)

- La bateria269 y su continuacion274 terminaron. Conciliacion277 con el formato
  REAL de Playwright:1144casos unicos,542ejecutados,496PASS/46FAIL o timeout,
  600SKIP declarados (516capturas optativas) y2FIXME. No1144PASS ni46bugs.
  El contador273 preliminar era incorrecto;277 lo sustituye conservando originales.
  Reensayo296 sobre3e:primer lote27PASS3FAIL; segundo interrumpido por RAM.
 312 restauro la copiaQA desdeGit sin cambios de fuente.311 continua con
 310 (UNarchivo/lote),297,304 y307, no todos aprobados por adelantado.
  No mezclar aprobaciones de725 y3e ni convertir cancelaciones en aprobaciones.
- Completar la matriz accion/estado/rol:421rutas/7roles/6401AST inventarian,
  pero no prueban que cada control de las14areas se haya ejecutado.
- Cubrir estados UI/offline/transiciones no acreditados de invitado y estaciones;
  no convertir las areas enteras en "nunca auditadas" ni atribuirles fallos sin prueba.
- Motores automaticos restantes: respuestas de11rutas NOprueban ejecucion completa
  de11motores;247/249/250 agregan escenarios, no cierran todo el conjunto.
- Verificar resultados de conexiones externas con evidencia del proveedor;
  dobles locales NOcertifican sincronizacion/modelo/voz/entrega de mensajes reales.

No hay base para decir "solo faltan Xbotones" ni "audite toda la app".
Los renglones de3 son trabajo conocido de correccion/retest, NO partes sin auditar.
Los de4 son limites concretos de evidencia, no cuatro areas nuevas descubiertas.
Este indice sustituye listas generales contradictorias; actualizar solo con
nuevo recibo/fuente, sin sumar otra vez las reejecuciones ni borrar cierres validos.
