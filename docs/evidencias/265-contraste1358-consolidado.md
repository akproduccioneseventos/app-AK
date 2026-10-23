# 260-264 - Revision focal de la entrega1358

Fuente congelada725e62ba2, main observado23/10;1359 abierta en e9477ba8e.
SoloQA/docs, no programa app ni fusionaCodex. Conservar253recuentounico.

## Nuevo fallo de dinero, UNAcausa

260:3criterios2PASS1FAIL, funciones reales deaprobar/rechazar/transicion;
almacen/cobro/permisos simulados.263:2criterios1PASS1FAIL con cobro REAL,
validador/normalizador/dedupe, data-service/actualizador/transacciones reales
FirestoreAdminSDKdemo. Son dos metodos sobre la MISMAcausa, no dos bugs.
Orden218/Claude: rechazo tardio deA deshace estado deBreintento ya acreditado.
Budget real rechazaA por saldo500, despues SDK corrige el otro pago del fixture;
B mismoaviso acredita1000 yA vuelve avisoapendiente. NOdoblecobro.
Identidad/event-access y avisos/sync sinks controlados; no permisos de7roles,
delete-paymentUI,HTTP,proveedores reales ni casos de produccion certificados.
0fiestas/0presupuestos/cleanup200/procesos cerrados.

## Correcciones de costos/senia comprobadas por alcance

261:7PASS0FAIL, motor/helper/validacion/mezcla de lavanderia y seña reales,
transaccion/almacen/permisos/lector de presupuesto controlados. NoSDK/UI.
Lavanderia conserva costo manual100.50 que entra al guardar; con callback
repetido no duplica; costo negativo no pisa anterior; guardado fallido no dice
success; presupuesto vinculado ilegible/ausente devuelve null; senia explicita
30000 se conserva; sinpresupuesto conserva default20000 vigente, no nueva politica.
No aceptacion de todas las cuentas automaticas, costos internos ni toda1358.

## Nuevo fallo de contrato, UNAcausa distinta

264:2criterios1PASS1FAIL, cadena real updateContratoFiestaActual ->
updateFiestaPartial -> updateDataPartial -> syncToFirestore set merge:true,
firma/actualizador/transaccion reales AdminSDKdemo. Si el equipo pasa la guarda
antes de la firma, el cliente firmaA y el equipo escribe despuesB, quedan
textoB+constanciaHuellaA y ambas acciones success:true. Orden219/Claude.
Control: guardado iniciado cuando YA estaba firmado se rechaza sin escribir.
No reabre216C4 (firma posterior a texto cambiado, cubierta254); es el escritor
del texto que termina despues de la firma. Identidad/portal/acceso al evento,
backup/copiaslocales/notificaciones controlados. NOHTTP/nativo/PDF/legal/roles.
0fiestas/cleanup200/servicioscerrados, sin datos reales.

En conjunto260/261/263/264:14criterios11PASS3FAIL. Los3FAIL son DOS causas,
porque260 y263 reproducen el mismo problema de pago con distinto transporte.
262 no ejecuto criterios: incidente del loader, no un tercer defecto de la app.

## Incidentes propios y limites

Al empezar habia168MiB/141MiB libres: no se inicio SDK ni se bajo su limite.
260 espero memoria>=512MiB, y263runnercomprobo>=768MiB. No parar procesosajenos.
262: import no configurado @/lib/budget/financial-guardrails en pago-duplicado;
fallo del loader antes de casos, no appbug. Script/ejecucion/loggz preservados.
263 namespace nuevo conecto el modulo real; no reescribio resultado262.
No prueba amplia/build/grafo por docs ni repeticion de los cierres254/255.
Cambiosprivados posteriores NO CONTRASTADOS. Orden218 no reemite213/216/217.

## Comprobacion de entrega

266 valida sin reejecutar casos: hashes de cuerpos Git del SHA725, totales de
JSON, sintaxis de9scripts, consumidores de218/219,37lineas de ESTADO y ausencia
de cambios tracked en app.32controles de integridadPASS, NO32pruebas de la app.
Luna verifico sintaxis/conteos en paralelo sin decidir dinero ni editar.
No pudo contrastar el objeto725 en su contexto; no se acepta esa limitacion
como ausencia del commit:266 del principal prueba rev-parse y hashes exactos.
La primera ruta de consumidor218 se corrigio ANTES de entrega: plan-pagos,
no portal-cliente. La primera aplicacion de este lote de docs fue rechazada
por doble operacion sobre ESTADO, sin escritura; reintentada con Update unico.
No errores adicionales de app ni resultados fallidos convertidos enPASS.
