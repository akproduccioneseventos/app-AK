# Orden250 - Claude: conciliacion completa en reportes y periodos

## Retest31/10/2026: tres causas CERRADAS por alcance

Main `e6db627f74301706d5e51fc7e1838808c1d767fe`: sonda732 intacta8PASS;
comision97000, proveedor por fecha de pago y sena1000sinpresupuesto pasan.
760 con737 y regresiones entregadas:20PASS/0FAIL. No reprogramar estas causas.
Evidencia `docs/evidencias/760-763-cierre-main-e6db627.md` y760recibos.
Lo siguiente es HISTORICO0abe, no un estado actual sin corregir.
No certifica toda contabilidad/SDK/proveedores/despliegue ni0errores.

27/10/2026. TRES causas nuevas comprobadas, fuera de247 y249; NO implementadas.
Claude conserva dinero/permisos, validacion/compilacion y fusion. Codex solo audita.
No fusionar documentacion sola. Mantener sin cambios reglas comerciales, monedas,
contrato, cuota entera y centavos de costos. No reenviar cobros ni mensajes reales.

## Contraste obligatorio

Fuente0abe9199ddb7281a945fd0f000a1a89f25b8fa8e. Los cinco archivos centrales
conservan blobs enPR1368-0929,1344-103a,1337-5fbf,1329-64d1 yClaude publicado
89a263b1df4d8fd7d2217a684daf54cafaa0ad83. Ver735-contraste paraSHA completos.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Antes de programar releerHEAD
y coordinar con249 (borrado concurrente/centavosCSV) y247, sin duplicar esos arreglos.

## R1 / P1 - AK-CODEX-732-COMISION-NO-LLEGA-AL-REPORTE

Flujo reconcileMercadoPagoBudget REAL con informe ficticio approved100000,
fee_details collector3000 -> pago confirmado con comisionProveedor3000.
getComparativaDeGanancias REAL devuelve97000 (correcto); getProfitAndLossData
devuelve100000 ygetAnalyticsData rentabilidad100000 para la misma fiesta totalmente
cobrada, sin otros costos. Control comision0 coincide. DOS variantes, UNA causa.

src/app/actions/reportes.ts omite la comision de los cobros; analytics.ts llama
calcularGananciaDeEvento sin pagosCliente. La funcion oficial SI sabe descontarla.
Propagar importes confirmados al consumidor correcto; sumar cada comision UNAvez,
sin estimar porcentajes ni tratar comision desconocida como cero confirmado.
Conservar regla de recargos/rechazados/reintegrados del motor existente y no duplicar
si el gasto ya se registro por otro camino. No mover dinero ni tocar proveedorreal.

## R2 / P2 - AK-CODEX-732-PROVEEDOR-FECHA-EVENTO-VS-PAGO

agregarPagoProveedor REAL guarda1000 el21/10 para fiesta20/09: reporte global de
octubre lo omite. Fiesta20/10 y pago21/09: reporte de octubre incluye la fila21/09.
Mismo mes control SI incluye1000. Fuente: getProfitAndLossData descarta primero
porfechaEvento y despues agrega todos los pagos sin filtrar pago.fecha.

Separar el filtro de movimientos reales del de costos planificados. En reporte
por periodo, una fila marcada Egresos Reales con fecha de septiembre no puede
colarse silenciosamente en octubre mientras se excluye un pago de octubre.
Respetar diaCalendario/inRange Uruguay. No cambiar fechas almacenadas ni alterar
devengo/caja y politica de estimados sin decision del dueno: si el producto quiere
atribucion por evento, debe distinguir esa vista del movimiento por fecha de pago,
no mostrar ambas como el mismo periodo. Claude define el ajuste minimo coherente.

## R3 / P1 - AK-CODEX-732-SENA-SIN-PRESUPUESTO-NO-REPORTA

registerBookingDeposit REAL sobre fiesta valida SIN presupuestoId ->success,
factura deposit_receipt/Paid y pago1000 guardados. calculateFinancialLedger
totalCobrado1000; getProfitAndLossData del mismo periodo ingresos0. No es un dato
malformado: la propia accion admite ese camino y genero el comprobante del fixture.
El reporte usa isFirmSalesInvoice, que excluye todos los recibos de sena, pero no
incorpora el caso independiente que SI recoge el libro. Control con espejo en
presupuesto aceptado cuenta1000 UNAvez. No cambiar una sena en venta facturada.

Reutilizar conciliacion del libro para cobros independientes y espejados, con
identidades y origen, sin deduplicar clientes por telefono/nombre/fecha.
Conservar separado venta, adelanto cobrado y saldo; si la clasificacion contable
es anticipo, mostrarlo como tal y reconciliarlo con el efectivo, no hacerlo invisible.
No re-cobrar, re-crear presupuesto ni modificar historicos para tapar el reporte.

## Pruebas

732:8casos3PASS5FAIL=TRES causas. Dobles de BD/lecturas, permiso de evento real
con sesion ficticia, acciones/helpers reales. NO SDK/HTTP/MP/cuentas reales.
730inicial conserva3rechazos por getFiestaById ausente en factory: fueron QA,
no tres bugs mas.732 completa SOLO ese doble, sin cambiar aserciones.
729-734 ejecutan25suites complementarias/162casos unicos sin repetir725:
dos requirieron perfilQA de base atomica y Firebase inerte. Ver735 para conteo
y recibos iniciales. No alterar app para que encaje con un mock.

Convertir reproducciones en pruebas focales del consumidor y cubrir monto0/fee
desconocida, rechazado, reembolso, espejo, no-espejo, limites del mes y zonaUruguay.
Claude registraSHA, focales y UNA validacion conjunta congelada; actualizarYA/ESTADO.
No declarar contabilidad limpia ni contadores14areas por esta orden.
Prueba siguiente PROPUESTA/PENDIENTE; la sonda existente esta en docs/evidencias/732.

```comprobar
archivo: src/app/actions/reportes.ts
usa: getProfitAndLossData en src/app/(app)/empresa/contabilidad/reportes/page.tsx
archivo: src/app/actions/analytics.ts
usa: getAnalyticsData en src/app/analytics/page.tsx
prueba: src/__tests__/contabilidad-concilia-comisiones-senas-y-fechas.test.ts
```
