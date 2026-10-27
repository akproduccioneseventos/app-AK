# Revision contable725-728 - DOS hallazgos nuevos, area NO limpia

27/10/2026. Pedido: revisar contabilidad sin aceptar errores de dinero.
Codex audita/prueba/documenta; NO modifica app, compila o fusiona en esta entrega.
Fuente main0abe9199ddb7281a945fd0f000a1a89f25b8fa8e, no el mainc0 anterior.
QA ficticio ak-qa-725-contabilidad-c0c9c903. Sin claves heredadas ni .env, sin red
saliente (preload725), cuentas, cobros, mensajes, SDK/servidor/hardware reales.

## Procedencia y alcance

Se exporto una copia nueva desde QA709 sin mutar el aceptado709. Se compararon
2510 archivos src/config/lock contra el arbol remoto0abe y se materializaron los
49 cambios/faltantes EXACTOS desde blobsGit. Se retiraron4 extras del QA anterior
solo de la copia nueva. Verificacion antes/despues de cada corrida:2510 coinciden
(bytes originales o solo normalizacionCRLF->LF). No transplante de PASS desde0929.
El manifiesto y sus recibos quedan comprimidos; hash y limites conservados.
Una exportacion intermedia omitia un blob por respuesta de herramienta sin content;
se completo ANTES de pruebas. fiesta-defaults sinLFfinal se restauro a su blob exacto.
Esas diferencias fueron preparacionQA, NO defectos de app ni tests aprobados.

Dependencias reutilizadas, NO npmci limpio, no build/validacion amplia ni navegador.
Graphify compartido consultado de forma puntual; grafo auxiliar no se reconstruyo.
Serena no pudo iniciarTS en checkout sin node_modules: se continuo con AST/rg delQA,
no se instalo dependencia de produccion para solucionarlo.

## Resultados sin mezclar corridas

| Recibo | Ejecucion | Resultado | Interpretacion |
|---|---|---|---|
|725|25suites originales,142tests|137PASS/5FAIL/0omitidas|23suitesPASS; dos factories incompatibles con readDataConDetalle|
|726|6 sondas nuevas,acciones/helpers reales|3PASS/3FAIL|DOS causas de app; dos variantes de centavos no son bugs distintos|
|727|SOLO2copias adaptadas de las factories|5PASS/0FAIL|Diagnostico del mock;17aserciones intactas. NO reemplaza el rojo original725|

No sumar las cinco adaptadas al original y decir142canonicosPASS. El resultado
original se conserva completo. Las suites aprobadas cubren calculos de regalos/
descuentos/ajuste/saldo, permisos de gastos, comprobantes pendientes, cuotas y
concurrencia, limites y reintentos de cobro, costos/rentabilidad/comisiones,
recibos de personal y de seña por sus casos. El listado exacto esta en725-corrida.
No equivalen a todas las pantallas/botones/roles ni a pagos externos aceptados.

## C1 / P1 - factura borrada despues de cobrarla en otro servidor

ID AK-CODEX-726-FACTURA-BORRADO-COBRO-INTERCALADO.
deleteInvoiceInner mira sinpagos, luego borra con forceDelete sin condicion actual.
Sonda usa dos instancias reales del modulo con turnos independientes y BD con
copias. A llega al borrado; B cobra1000 y devuelve success/Paid; A elimina y tambien
devuelve success. El documento final no existe. Controles: sin cobro borra;
si ya estaba cobrado al empezar, NO borra. La guarda inicial no cierra la carrera.
Capturado antes/despues e IDs en726-observaciones; adaptadores, NO dos servidores
HTTP/SDK externo. Ver fuente forceDelete y consumidor handleDelete de la lista.
Requiere eliminar condicionalmente en la misma transaccion, coordinado con cobro.
No prueba que haya ocurrido en datos reales. No repetir como otra causa247.

## C2 / P2 - resumen/CSV del contador pierde centavos validos

ID AK-CODEX-726-CONTADOR-CSV-PIERDE-CENTAVOS.
Guardar60.30 -> releer/reporte60.30 -> CSV-60; texto tambien60.
Dos gastos60.30 -> reporte120.60 -> CSV-120 -> texto121. Control60enteroPASS.
La funcion armarResumenParaElContador redondea filas/texto, utilizada tanto por
descarga de planilla como por envio al contador. No es solo una presentacion
en pantalla: la suma del archivo no coincide con la ganancia del reporte.
No se envia correo enQA. Conservar centavos de costos aceptados; NO cambiar
politica de ingresos/cuotas enteros ni roundMoney global ni habilitar divisas.

## Contraste de entregas y no duplicacion

Los archivos invoices.ts/resumen-para-el-contador.ts/reportes.ts tienen los mismos
blobs en main0abe, PR1368-0929/1344-103a/1337-5fbf/1329-64d1 y Claude74042dea.
Ver725-contraste.json conSHA completos. Privados posteriores NO CONTRASTADOS.
Orden247 ya recoge pantallas viejas que pisan cobros, carga historica repetida,
sesiones/perfiles y cobrado vsesperado; se mantiene en curso, NO nueva implementacion
de sus bloques. No considerar cada orden247 historica como la actual: nombres/IDs.
La orden249 nueva corresponde SOLO C1/C2 y al mantenimiento de fixtures asociado.

El ayudante economico Averroes reviso10tests/limites en lectura. Su referencia a
247como publicador era la numeracion historica, NO esta247deadministracion;
el director la descarto y leyo la orden actual remota. No se adopto como hallazgo.
Principal reviso dinero, intercalado y conclusiones. Agente cerrado; sin servicios.

## Veredicto

NO APROBAR como contabilidad sin errores. DOS nuevos defectos reproducidos,
mas247en curso. Orden249 preparada paraClaude, pruebas de correccion PENDIENTES.
No es necesario reconstruir grafo ni repetir toda la bateria al cambiar solo docs.
Retestear cambios concretos de responsables sobre nuevoSHA y conservar controles.
No test fiscal/legal, datos reales ni certificacion de toda la app/Hosting/integraciones.
