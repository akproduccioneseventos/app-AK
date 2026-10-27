# Orden249 - Claude: centavos del contador y factura que se cobra al borrarla

27/10/2026. DOS causas nuevas, reproducidas; NO correcciones implementadas porCodex.
Claude conserva dinero/permisos/validacion/compilacion/fusion. No fusionar documentos
solos. Coordinar con247 activa; NO reimplementar sus ocho bloques por esta orden.

## Fuente y contraste ANTES de programar

Main0abe9199ddb7281a945fd0f000a1a89f25b8fa8e. Misma fuente de los tres archivos
centrales en PR1368-092906d6, PR1344-103abce8, PR1337-5fbf0db0 y PR1329-64d1c5c8.
Claude publico74042dea4887be68a831ec00654744c8fea84f08 tambien los conserva.
Ver recibo725-contraste.json para SHA completos/blobs. Esto NO aprueba esas PR.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Verificar HEAD actual antes
de tocar. Si alguien ya esta corrigiendo estos IDs, completar su entrega, no duplicar.

## C1 / P1 - AK-CODEX-726-FACTURA-BORRADO-COBRO-INTERCALADO

Acciones reales en dos instancias del modulo, BD y sesion controladas:
1. Factura independiente sin pagos, total1000UYU.
2. A entra en deleteInvoice ->deleteInvoiceInner; pasa el control inicial sin pagos.
3. Se detiene justo antes del borrado fisico; B ejecuta addPaymentToInvoice, que
   guarda1000 y devuelve success:true/Paid.
4. A continua forceDeleteDocFromFirestore y devuelve success:true. Desaparece la
   factura con el comprobante del cobro. El estado final del fixture es lista vacia.

Control factura ya cobrada ANTES del pedido: SI rechaza. Control sin cobros: SI borra.
El defecto NO es falta de esa guarda inicial sino no comprobarla atomicamente
junto al delete. AsyncMutex por modulo/proceso no protege dos servidores.
No afirmar que se perdio dinero real ni que se ejecuto Firestore externo.

Archivos/simbolos comprobados:
- src/app/actions/invoices.ts: deleteInvoiceInner, addPaymentToInvoiceInner.
- src/lib/firebase-sync.ts: forceDeleteDocFromFirestore borra sin condicion.
- src/app/(app)/invoices/page.tsx: handleDelete llama deleteInvoiceAction.

Correccion requerida: lectura actual + condicion sinpagos/estado + eliminacion
de ESA factura en la misma operacion atomica del servidor. No leer/comprobar fuera
de la transaccion y borrar despues; no usar lista vieja para restaurar/reintentar.
El cobro concurrente tambien debe ver inexistencia/marca si el borrado gano primero.
Resultado valido: o el cobro se conserva y se rechaza borrar, o borrar gana y el
cobro se rechaza; NUNCA ambos exitos con comprobante desaparecido.
Preservar bloqueo de borrar facturas cobradas, permisos y recuperacion de vinculos.
No modificar forceDelete global para todos los datos por un unico consumidor.

## C2 / P2 - AK-CODEX-726-CONTADOR-CSV-PIERDE-CENTAVOS

Recorrido real saveGastoGeneral ->getProfitAndLossData ->armarResumenParaElContador,
con adaptadores locales/permisoDueno:
- Un gasto60.30 se guarda y aparece en reporte60.30; CSV exporta-60, texto dice60.
- Dos gastos60.30: reporte120.60, filasCSV suman-120 y texto dice121. Las tres
  representaciones no coinciden. Control gasto60 entero SI coincide.

src/lib/contabilidad/resumen-para-el-contador.ts: plata y filas de gastos usan
Math.round; consumidores reales:
- handleBajarPlanilla en src/app/(app)/empresa/contabilidad/reportes/page.tsx.
- mandarResumenAlContador en src/lib/contabilidad/mandar-resumen-al-contador.ts.

Conservar precision de costos ya aceptada en167/168: centavos de gastos y resultado
neto deben llegar intactos al CSV y al texto. Comparar sumas con precision definida
y signo negativo de gastos. FormatoCSV sin miles, correctamente interpretable al
abrirlo en la planilla prevista; comprobar ese round-trip, no solo un string.
NO cambiar roundMoney global, montos de invitados ni politica de ventas/cuotas
en pesos enteros. NO habilitar otras monedas, cambio automatico o nueva politica fiscal.

## Pruebas y cierre

Sonda existente726 en docs/evidencias:6casos3PASS3FAIL=DOScausas, no3bugs.
Conservar recibos anteriores. Promover reproduccion a suites de app con aserciones
de negocio, controles y ambos ordenes de intercalado. ParaC1 validar tambien el
camino SDK aislado y dos instancias; no un mock que entregue la misma referencia.
ParaC2 incluir enteros,60.30,60.30+60.30, signos, comillas y sumaCSV=resultado.

Deuda de pruebas, NO otras cinco fallas de dinero:725 ejecuta25suites142tests,
137PASS/5FAIL por readDataConDetalle ausente en DOS factories de tests.
727 agrega SOLO ese export al doble, sin cambiar17aserciones; los cinco casos
pasan. Arreglar fixtures originales en dos-cuotas NO: los afectados son
dos-cobros-a-la-vez-no-se-pisan.test.ts y una-sena-de-contrato-es-una-por-presupuesto.test.ts.
No modificar app para adaptarla al mock viejo ni afirmar canonica verde con727.

Antes de entregar: fuente congelada, focales + validacion conjunta deClaude,
registroYA/ESTADO conSHA/resultados/limites. Sin datos/cuentas/cargos/mails reales.
Codex retestea solo el delta. Area contable CON HALLAZGOS, no limpia/0errores.
Las dos pruebas siguientes son PROPUESTAS/PENDIENTES hasta que existan y corran.

```comprobar
archivo: src/app/actions/invoices.ts
usa: deleteInvoiceAction en src/app/(app)/invoices/page.tsx
archivo: src/lib/contabilidad/resumen-para-el-contador.ts
usa: armarResumenParaElContador en src/lib/contabilidad/mandar-resumen-al-contador.ts
prueba: src/__tests__/la-factura-no-se-borra-mientras-se-cobra.test.ts
prueba: src/__tests__/el-resumen-del-contador-conserva-centavos.test.ts
```
