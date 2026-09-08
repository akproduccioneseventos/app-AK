# 49 - Contabilidad: cobros completos, permisos y resultados verdaderos

Fecha: 2026-09-08. Estado: AUDITADO PARCIALMENTE; CORRECCIONES PENDIENTES.
Codex revisa; Gemini programa; Claude Opus compila y comprueba. El dueno fusiona.
No mezclar esta orden con cambios esteticos. No modificar datos reales para probar.

## Base y evidencia

- Codigo revisado: main `8c5eb6e173e7b7b8dce6a8811cade7cf38411dfe`.
  El worktree de revision tiene commits posteriores SOLO de documentacion; los
  archivos de acciones revisados no difieren de esa base.
- Consultados Graphify y el registro `docs/YA-RESUELTO.md`, incluidos los antecedentes
  contables del 9 y 15 de agosto, la deduplicacion del 25 de agosto y las pruebas
  de cuotas de Claude. No volver a implementar sus correcciones ya presentes.
- Serena no pudo iniciar TypeScript en este worktree sin dependencias. Se usaron
  busquedas exactas y rangos; no se instalaron paquetes ni reconstruyo el grafo.
- Un agente economico reviso las pantallas contables; Codex comprobo sus fuentes.
- Siete comprobaciones aisladas reproducen cinco grupos de defectos. Se ejecutan
  cuerpos reales de funciones extraidos mediante AST, con almacenamiento, sesiones
  y avisos falsos. No son pruebas de navegador, Firebase, despliegue ni hardware.
- Script: `docs/evidencias/49-sondas-contables.cjs`.
  Resultado y limites: `docs/evidencias/49-auditoria-contable.md`.
- La orden esta entregada cuando su contenido y commit estan verificados en GitHub.
  Eso NO implica que Gemini la haya leido, ejecutado o corregido.

## CON-05 - P1: el servidor no aplica el permiso contable en todas las acciones

Prioridad de ejecucion: primera, junto con CON-03.

`src/app/actions/invoices.ts:79-90` comprueba `verifySession().success`, pero no
CONTABILIDAD. La prueba usa un operador valido: `puede(operador, CONTABILIDAD)` es
false y, aun asi, `getInvoices` lee las facturas. No se probo una explotacion HTTP
ni se afirma que una persona sin sesion tenga acceso.

Extender la revision a las entradas de lectura/escritura de facturas, presupuestos,
cuotas y pagos. `addPaymentToInvoiceInner`, `addPagoToPresupuesto`, `confirmPagoCliente`
y `updateCuotaEstado` tambien usan sesion sin guardia contable explicita. El middleware
solo revisa la presencia de cookie; ocultar botones no sustituye controles de servidor.

Gemini: aplicar la politica existente con `requirePermiso(PERMISOS.CONTABILIDAD)`
en las entradas internas apropiadas, antes de leer o escribir. Mantener las rutas
publicas con token acotado y los portales autorizados; no romperlos exigiendoles un
perfil del equipo. No dar permisos nuevos a perfiles para hacer pasar una prueba.

Aceptacion: dueno y secretaria conservan sus operaciones contables; operador y
personal no leen ni alteran facturas/cobros ajenos mediante acciones directas.
Sin sesion y token de otro presupuesto deben rechazarse. Probar por HTTP en entorno
de pruebas, ademas de mocks; no exponer saldos antes de devolver el rechazo.

## CON-03 - P1: dos cobros simultaneos pueden perder uno

`src/app/actions/presupuestos.ts:550-617` lee el presupuesto y arma pagosCliente
ANTES de entrar al mutex de `updatePresupuesto` (lineas 318-361). El mutex serializa
el guardado, pero el segundo usa la lista vieja completa.

Reproducido con los cuerpos reales de ambas funciones y `AsyncMutex`: saldo inicial
suficiente, dos cobros de 1000 y 2000, ambas respuestas success=true; la lista final
solo suma 2000. Ocurre incluso dentro de una sola instancia. No es solamente la
limitacion multiinstancia que ya documenta `src/lib/mutex.ts`.

Gemini: validar saldo, leer estado actual y agregar/confirmar/rechazar el pago dentro
de una operacion atomica sobre el presupuesto. Cubrir multiples instancias con la
transaccion de base de datos, no solo otro mutex. Revisar concurrencia con el webhook
Mercado Pago que ya usa transaccion, y con cualquier escritor de la lista completa:
una escritura posterior de un snapshot viejo no debe borrar el cobro del webhook.
Usar identidad idempotente y no reentrar al mismo mutex (bloquea indefinidamente).

Aceptacion: dos importes distintos persisten una sola vez cada uno; reintentar una
misma operacion no duplica; dos intentos que juntos excedan el saldo no se aprueban
ambos; pago manual concurrente con webhook no pierde ninguno. Probar en emulador.

## CON-01 - P1: cuota pagada y plan guardado aunque falle guardar

`src/app/actions/payment-plans.ts:72-73,101-120` ignora el resultado de `saveFiesta`.
Esa funcion devuelve success=false cuando falla persistencia, no siempre arroja.

Reproducido: saveFiesta=false; savePlanDePagos devuelve success=true. Marcar una
cuota pagada devuelve success=true y llama una vez al aviso de pago al cliente
aunque guardar haya fallado. El aviso fue simulado, no se envio correo real.

Gemini: propagar el error y no notificar ni presentar exito antes de persistir.
Rechazar cuota inexistente. Probar tambien reintento y transicion repetida a pagado
para no anunciar varias veces el mismo cobro. Preservar la normalizacion ya probada
en `src/__tests__/plan-de-pagos-cuentas-que-cierran.test.ts`.

Aceptacion: ante fallo devuelto o excepcion, error visible, sin aviso al cliente,
sin marcar localmente como cobrado; recargar conserva el estado anterior. Con exito,
guardar, volver a leer y mostrar el mismo resultado.

## CON-02 - P1: conciliacion factura/presupuesto informa un resultado incorrecto

`src/app/actions/presupuestos.ts:588-600` encuentra un gemelo manual del cobro de
factura y le asigna referencia. Dos casos comprobados:

1. Si updatePresupuesto devuelve success=false, la accion devuelve success=true.
   La factura puede seguir su flujo creyendo que la sincronizacion se completo.
2. `buscarGemeloCargadoAMano` admite pendiente_confirmacion. Cuando llega el pago
   confirmado de factura, la rama solo cambia referencia: deja el gemelo pendiente.
   Hay un confirmado en factura y un pendiente en presupuesto para el mismo cobro.

Gemini: conservar la deduplicacion existente; corregir propagacion del error y
conciliacion de estado cuando existe evidencia de confirmacion de la factura.
No confirmar automaticamente un pago solo porque el cliente envio un comprobante.
No crear un segundo pago para evitar tratar el estado del primero. Preservar archivo
del comprobante, fecha, monto e identidad y dejar trazabilidad de la confirmacion.

Aceptacion: fallo de sincronizacion nunca responde exito; reintento no duplica.
Un pendiente correctamente conciliado con factura confirmada deja un solo cobro
confirmado y saldos iguales. Probar manual confirmado, pendiente, rechazado, fechas
distintas y dos cobros legitimos iguales del mismo dia sin quitar la regla del dueno.

## CON-04 - P1: flujo de caja confunde fuentes fallidas con cero

`src/app/actions/dashboard.ts:283-288` convierte fallos de las cuatro fuentes en [].
Luego devuelve success=true. Reproducido: todas fallan, devuelve seis meses en cero
sin informar fuentes no disponibles.

Ademas, `src/app/(app)/empresa/contabilidad/flujo-caja/page.tsx:24-58` guarda error
pero no lo renderiza; termina mostrando los KPIs en cero si la accion falla. Una
alerta temporal no basta para distinguir falta de datos de falta de cobros.

Gemini: reutilizar el patron sourceStatus/unavailableSources del dashboard. Ante
fuentes fallidas no mostrar cero como cifra valida ni conclusiones de liquidez real.
Error persistente, fuente faltante, reintento y ultima actualizacion comprobada.
Un resultado parcial debe identificarse como parcial y no certificar totales.
Revisar tambien `empresa/contabilidad/page.tsx:84-100`: terminar loading en finally,
mostrar errores devueltos y excepciones; no dejar indicadores vacios sin explicacion.

Aceptacion: fuente realmente vacia muestra cero; fuente caida muestra indisponible;
recuperacion trae datos actuales y limpia error; fallo parcial no aparenta totalidad.

## Mejoras humanas y decisiones pendientes (no implementar sin validar alcance)

- Cada saldo deberia permitir ver los cobros/documentos que lo explican, sin tener
  que abrir varios modulos para averiguar por que no coinciden.
- Distinguir siempre venta contratada, dinero recibido, informado sin confirmar,
  saldo exigible y proyeccion. No llamar liquidez real a ingresos futuros estimados.
- El flujo proyectado no lee Gastos Generales; hoy calcula principalmente costos
  de eventos futuros. No sumar gastos historicos ya pagados como si fueran futuros.
  Definir con el dueno si se amplian obligaciones con fecha o se delimita la etiqueta.
- Marcar una cuota pagada modifica planDePagos. Falta comprobar su relacion con el
  registro central de cobros; no crear una sincronizacion nueva sin confirmar si es
  calendario o fuente contable. La orden no aprueba cambiar ese funcionamiento.
- Mantener interfaz contable sobria, legible y estable; animacion no debe distraer
  de importes, cambiar posiciones de botones ni simular aprobaciones.

## Comprobaciones que faltan para aprobar la parte contable

1. Revisar los 19 presupuestos manuales en Firebase autenticado, SOLO lectura:
   origen/importacion, cliente, fechas pasadas/futuras, total, pagos confirmados,
   saldo, fiesta y factura asociadas. No inferir que ya paso el evento = esta cobrado.
   No recalcular importes historicos con precios del catalogo actual automaticamente.
2. Recorrer en entorno de prueba pagos rapidos, factura, estado de cuenta y portal
   cliente; verificar el mismo cobro y saldo despues de recargar cada pantalla.
3. Probar regalos, descuentos, senas, ajuste anual, moneda/redondeo y PDF con las
   pruebas existentes sobre el commit de correccion. No duplicar suites por nombre.
4. Conciliar costos/proveedores/sueldos, gastos generales y rentabilidad con casos
   controlados. La lectura parcial de pantallas de esta orden no los certifica.
5. Mercado Pago: revision de codigo constata transaccion y comprobaciones de monto,
   moneda y entorno; falta prueba integral sandbox de duplicado, reembolso y rechazo.
   No cobrar una tarjeta real, activar credenciales ni tocar pagos productivos.
6. Claude registra SHA, entorno y resultados focalizados; compila cuando Gemini
   termine. El inventario comprobar no ejecuta estas pruebas ni es certificado.

Las siguientes pruebas E2E son propuestas, NO archivos existentes ni ejecuciones.
El script de sondas si existe y fue ejecutado; sus fallos son evidencia, no arreglos.

```comprobar
archivo: docs/evidencias/49-sondas-contables.cjs
usa: updateCuotaEstado en src/app/(app)/fiestas/nueva/plan-pagos/page.tsx
usa: addPagoToPresupuesto en src/app/(app)/pagos-rapidos/page.tsx
usa: addPaymentToInvoice en src/app/(app)/invoices/[id]/page.tsx
usa: getCashFlowProjection en src/app/(app)/empresa/contabilidad/flujo-caja/page.tsx
prueba: tests/e2e/49-contabilidad-cobros-conciliados.spec.ts
prueba: tests/e2e/49-contabilidad-permisos-y-errores.spec.ts
```
