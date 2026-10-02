# Area: cobros, cuotas, facturas y recibos

## Commit

`676a1a8d3fe3c04be453e7cfec829217e42380cd` (main consultado el 2 de octubre de 2026).

## Hallazgos

### COB-01 - P1: un error lanzado al pasar el cobro al presupuesto deja el pago en la factura; reintentar crea otro

- Ruta y simbolo: `src/app/actions/invoices.ts:addPaymentToInvoiceInner`, lineas 695-729.
- La factura guarda el cobro antes de llamar a `addPagoToPresupuesto`. El retorno `success:false` tiene compensacion; una excepcion de esa llamada NO entra a esa compensacion.
- Sonda de la funcion real: el espejo simulado lanza ISOLATED_DATABASE_FAILURE. La llamada rechaza, pero quedan 100 pesos guardados en la factura. Reintento por otros 100: vuelve a rechazar y quedan DOS registros, 200 pesos, ambos con `pasadoAlPresupuesto:false`.
- Alcance: no son dos cargos reales de tarjeta; es duplicacion del registro ante reintento, con persistencia simulada. No se invoco Mercado Pago ni Firebase.
- El reconciliador pendiente existente puede mover despues esos registros; su existencia no hace seguro crear otra identidad por el reintento. No se afirma que ese trabajo haya corrido en produccion.
- Para Claude: resolver tanto excepciones como retornos de error despues de guardar, y devolver un estado observable del cobro. Reintentar una misma operacion no debe crear otro registro. Conservar el mecanismo de conciliacion existente y NO mandar al usuario a cobrar de nuevo si ya hay un registro persistido.
- Regresion requerida, PENDIENTE: exception antes/despues del guardado del espejo, caida al compensar, reintento con identidad estable, factura/presupuesto coherentes. La prueba debe fallar con esta version.

### COB-02 - P1: dos cambios de cuotas pueden pisarse y avisar ambos como cobrados

- Ruta y simbolo: `src/app/actions/payment-plans.ts:updateCuotaEstado`, lineas 90-135. Consumidor: `src/app/(app)/fiestas/nueva/plan-pagos/page.tsx:handleMarkPaid`, 162-173.
- Cada accion lee toda la fiesta, arma toda la lista de cuotas y llama `saveFiesta`. No relee la cuota dentro de una transaccion de esa operacion.
- Sonda con las dos lecturas sincronizadas y guardado de documento completo simulado: dos respuestas exitosas, dos avisos, pero solo UNA de las dos cuotas termina pagada.
- Contraste del recorrido real de guardado: `src/app/actions/fiesta/fiesta.actions.ts:saveFiesta` (162-175) escribe via writeData; `src/lib/firebase-sync.ts` (379-400) hace set con merge:true del documento fiesta. La lista cuotas es un array y ese camino no usa el control transaccional de `cambiarCobrosDelPresupuesto`.
- **Clasificacion:** defecto reproducido de la accion con I/O simulado, respaldado por el recorrido de escritura. NO se ejecuto la prueba contra dos instancias reales de Firebase. Esa comprobacion sigue pendiente.
- No repetir el antiguo arreglo de mirar saveFiesta.success: ahora SI se mira. El defecto nuevo es la lectura/lista vieja ante concurrencia.
- Para Claude: cambio atomico sobre la cuota actual y aviso solo por la transicion efectivamente guardada; conservar cuotas ajenas. Probar tambien dos confirmaciones simultaneas de LA MISMA cuota, sin duplicar correo.
- Regresion requerida, PENDIENTE: dos cuotas diferentes, misma cuota dos veces, fallo de escritura y reintento, con persistencia real o emulador de dos clientes.

### COB-03 - P2: la pantalla de factura descarta el error devuelto al registrar un pago

- Ruta: `src/app/(app)/invoices/[id]/page.tsx:handleAddPaymentSubmit`, 123-147.
- Solo trata `result.success === true`. No hay else ni throw cuando la accion devuelve `success:false`; el catch solo ve excepciones.
- Sonda del handler real con `{success:false,error:'NO_BALANCE'}`: CERO mensajes de error y CERO recargas. El finally rehabilita el boton. No se comunica el rechazo.
- Esto no es un falso toast de exito: es un fallo silencioso. No se probo visualmente en una sesion privada del navegador.
- Para Claude: mostrar el error devuelto y el estado verdadero del pago; si existe conciliacion pendiente, decirlo sin sugerir duplicar el cobro.
- Regresion requerida, PENDIENTE: rechazo por saldo/permiso/comprobante, excepcion y caso de conciliacion pendiente, verificando el texto visible de la pantalla.

### COB-04 - P2: la tolerancia se puede gastar repetidas veces en una factura independiente ya pagada

- `src/app/actions/invoices.ts:getInvoiceBalance`, 53-55, devuelve saldo no negativo. `addPaymentToInvoiceInner`, 633-636 y 677-684, permite monto hasta saldo + tolerancia.
- Sonda: factura independiente, UYU, total 1000, ya cobrada 1000. Tres pagos separados de 1 peso pasan y dejan total cobrado 1003.
- Condicion: factura SIN sourcePresupuestoId. Con presupuesto vinculado hay una segunda validacion y no se generaliza ese resultado.
- No se propone eliminar la tolerancia de redondeo acordada: el defecto es aplicarla de nuevo despues de agotarla. Debe controlar el exceso TOTAL acumulado, no dar otro margen sobre un saldo truncado a cero.
- Regresion requerida para Claude, PENDIENTE: el exceso acumulado nunca supera la tolerancia elegida, incluso con varias llamadas o dos instancias.

### COB-05 - P2 condicional: la pantalla ofrece otras monedas, pero el cobro y su recibo usan reglas de UYU

- AK trabaja habitualmente en pesos uruguayos; NO se propone agregar dolares al negocio.
- La pantalla existente `src/app/(app)/invoices/new/page.tsx:270` acepta Moneda, con placeholder UYU, USD. El helper `src/lib/invoice-money.ts` conserva dos decimales fuera de UYU.
- Sin embargo `addPaymentToInvoiceInner:632` pasa antes por `parseCleanMoney`, que redondea a entero. Sonda de accion: monto solicitado USD 12.50, guardado 13.
- Recibo de la factura: `src/app/(app)/invoices/[id]/page.tsx:289` escribe literalmente PESOS URUGUAYOS con independencia de invoice.currency.
- Alcance: accion probada con entrada simulada; no se registro una factura en moneda extranjera real ni se probo el envio de decimales desde el formulario del navegador.
- Decision del dueno: si solo se permite UYU, las otras monedas deben rechazarse de manera explicita; si se mantiene la opcion ya visible, sus montos y recibos deben respetar la moneda. Claude no debe cambiar esta decision comercial sin confirmacion.
- Regresion requerida, PENDIENTE: comportamiento acordado de monedas en cliente y servidor, monto exacto y moneda del recibo.

## Evidencia y contraste

- Guia nueva `docs/codex/COMO-REVISA-CODEX.md`: aun no disponible en GitHub durante esta pasada (404), consistente con lo informado por el dueno sobre trabajo local sin subir. Se usa provisionalmente el formato Area / Commit / Hallazgos pedido en el chat.
- PR abierta contrastada: 1251, rama `feat/super-asistente-unificado`, HEAD `ee7ada01c7fb52ac000f4da68f5114d4e4a612c7`. Los blobs de invoices.ts, payment-plans.ts, invoices/[id]/page.tsx y financial-guardrails.ts son identicos al main revisado. No contiene estos arreglos.
- Trabajo LOCAL no publicado por Claude: **NO CONTRASTADO**. Antes de programar, contrastar estas sondas con su HEAD definitivo; no rehacer un arreglo que ya este ahi.
- Reutilizada la memoria de `docs/YA-RESUELTO.md`: transacciones de cobros, no pisar pagos al guardar listas, compensacion cuando el espejo devuelve failure, control de saldo entre servidores, recibos cerrados, aviso despues de guardar. No se reportan como ausentes.
- Graphify: copia local no disponible y wiki remota devuelve 404 en este SHA. Serena: sin proyecto activo de este checkout. Se usaron rutas reales verificadas, busquedas dirigidas y fragmentos del SHA indicado.
- Un agente economico inventario evidencia y pruebas anteriores; no emitio aprobacion de dinero ni repitio el analisis principal. Se cerro al terminar.

## Sonda ejecutada

`docs/evidencias/sondas/63-cobros-source-probe.cjs`

- Node v24.19.0, resultado exit 0.
- Verifica los blobs Git de los siete archivos usados antes de ejecutar; si cambia el codigo, rechaza evidencia obsoleta.
- Ejecuta funciones/handlers reales retirando solo anotaciones TypeScript con stripTypeScriptTypes. Todo I/O, permiso y persistencia es simulado.
- **Doce casos:** cinco reproducciones de defectos y siete controles con resultado esperado. Exit 0 significa que la sonda reprodujo lo esperado, incluidos los defectos; NO significa que la app paso una suite de lanzamiento.
- Controles esperados: confirmado/pending/rechazado se contabilizan separados; reserva de saldo y rechazo de importe invalido; limite normal de factura; compensation con retorno failure; validacion concurrente del saldo de factura; permiso denegado sin escritura; recibo cerrado no cambia monto ni vuelve a pendiente; tres escenarios de cuotas del contrato suman su total y se completan con pago total. Estos dos ultimos se agrupan como casos separados en el resultado.
- No se corrieron Jest, lint, build, navegador autenticado, Firestore ni integraciones reales.
- Para reproducir en checkout cuyos archivos tengan los mismos blobs: Node 24, `node docs/evidencias/sondas/63-cobros-source-probe.cjs <raiz-del-checkout>`. Usa codigo local; no contiene secretos ni escribe datos.
- Pruebas de regresion nuevas indicadas arriba: PENDIENTES, no implementadas ni ejecutadas aqui.

## Limites para marcar el area limpia

La revision tecnica no reemplaza: cobro real/sandbox y webhook Mercado Pago; comprobante subido y recibo/PDF descargado; acciones sin sesion y por perfil con permisos reales; lectura posterior desde otra sesion/servidor; conciliacion automatica; prueba visual de cuotas/pagos y respaldo/restauracion sobre un entorno aislado. Ninguno se certifica por estas sondas.

**Area no limpia: cinco hallazgos, uno condicionado a monedas no UYU.** No se altera el contador ni se declara lanzamiento aprobado.

## Propuestas de mejora

Ninguna nueva funcion en esta pasada. Las decisiones comerciales y las mejoras esteticas quedan aparte de estos defectos.
