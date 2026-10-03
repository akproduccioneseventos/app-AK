# 113 - Claude: casos restantes de cobros tras la 1254

## Destino y contraste

Codex revisa; Claude programa dinero y compila. No fusionar esta documentacion
sola ni abrir otra PR solo para las notas. Incorporarla a la proxima tanda real.

- Main y fuente comprobados: `39da52a33fcdda83f7575d6751a9bc101b3484cf`.
- PR 1254 fusionada: estos son resultados DESPUES de sus arreglos.
- Tanda abierta 1251: `feat/super-asistente-unificado`, HEAD
  `ea2cb46d732b815492ee5c176cd9ea6e61e867de`, consultada nuevamente.
  No contiene estos arreglos de facturas ni una solucion a los casos de abajo.
  Traer main antes de integrar; no volver a poner el codigo contable anterior.
- Publicado: `/api/health` informa ese mismo 39da52a y compilacion
  `2026-10-03T00:32:58.521Z`. No se ejecutaron estos cobros sobre datos reales.

42/42 pruebas, 9 suites, aprobadas en checkout aislado con los mocks de cada
suite. Sonda independiente: 5 casos esperados aprobados y 4 casos restantes
reproducidos. No volver a programar COB01-04 ni el almacenamiento decimal de
COB05: ya tienen evidencia favorable. No ampliar la politica monetaria: sigue UYU;
el recibo decimal de abajo es para facturas existentes en otras monedas.

Evidencia: `docs/evidencias/65-retest-1254-y-pendientes.md` y
`docs/evidencias/65-resultados-cobros-39da52a.json`.

## Casos que faltan

1. **COB07 P1 - Reintento simultaneo anuncia un exito prematuro.**
   Dos invocaciones en servidores distintos leen la misma factura sin el pago.
   La primera guarda la operacion y queda esperando el espejo al presupuesto.
   La segunda encuentra `yaEstaba` adentro de `mutateDataItem` y devuelve
   `success:true` con la factura anterior, sin comprobar conciliacion. La primera
   termina fallando; queda un pago con `pasadoAlPresupuesto:false` aunque el
   reintento recibio exito. El mutex externo solo protege UN proceso.
   Archivo/simbolo: `src/app/actions/invoices.ts::addPaymentToInvoiceInner`.
   Consumidor: `handleAddPaymentSubmit` muestra "Pago Registrado" ante ese exito.
   No registrar otra vez; devolver estado actual y representar la conciliacion
   pendiente sin afirmar que se completo. Probar dos instancias, no solamente
   dos llamadas protegidas por el mismo mutex.

2. **COB08 P1 - Editar un cobro pendiente conserva el importe anterior sin avisar.**
   En el formulario original, intentar 100; el espejo lanza error y queda pendiente.
   Cambiar el input a 200 y volver a enviar: la pantalla conserva el `operacionId`.
   El servidor reconoce la operacion de 100, concilia esa y devuelve exito; la
   pantalla dice "Pago Registrado", pero el registro es de 100, no de 200.
   Archivos/simbolos: el mismo action y `operacionDelCobro` /
   `handleAddPaymentSubmit` en `src/app/(app)/invoices/[id]/page.tsx`.
   Mantener idempotencia, pero validar que una identidad existente corresponda
   al contenido original; no aceptar silenciosamente un contenido distinto.
   No rotar la identidad a ciegas despues de un timeout: eso puede duplicar el
   cobro que ya estaba guardado. La interfaz debe explicar el estado pendiente
   y el resultado real antes de permitir otra operacion.

3. **COB06 P2 - Recibo decimal con `undefined` en letras.**
   El almacenamiento de USD 12,50 ahora es correcto: 12.5. Pero
   `numberToSpanishWords(12.5)` devuelve `DIEZ Y undefined`, y el recibo imprime
   `DIEZ Y undefined DOLARES ESTADOUNIDENSES` (el rotulo real lleva acentos).
   Archivo/simbolo/consumidor: `numberToSpanishWords` y el campo LA SUMA DE en
   `src/app/(app)/invoices/[id]/page.tsx`. Separar entero y centavos respetando la
   moneda ya almacenada. No cambiar UYU ni agregar monedas nuevas. Comprobar
   contenido renderizado/impreso, no solo que exista `nombreDeLaMoneda`.

4. **COB09 P2 - "Se concilia solo" no es verdad.**
   `pasarCobroAlPresupuesto` dice eso en su error; `parte-manana.ts` solamente
   detecta y crea "Pasar ahora" hacia `/invoices?conciliar=1`. La unica llamada
   de pantalla a `pasarCobrosPendientesAlPresupuesto` esta en Facturas.
   Corregir mensaje y guia hacia la accion existente. NO automatizar dinero por
   esta orden: preservar la decision de conciliacion por una persona.

## Validacion y limites

- Prueba propuesta NUEVA, no existente ni ejecutada:
  `src/__tests__/cobros-1254-no-dan-exitos-falsos.test.ts` (PENDIENTE de crear).
  Debe fallar con 39da52a y aprobar solo despues de corregir simultaneidad entre
  instancias, payload editado, contenido del recibo y mensaje manual.
  Las 42 aprobadas no incluyen esos casos. No aceptar los tests viejos que pasan
  como evidencia automatica de que esta orden se cumplio.
- Conservar `dos-cuotas-a-la-vez-no-se-pisan.test.ts` y las pruebas financieras
  existentes. Compilacion final por Claude sobre la tanda congelada.
- Repetir la sonda y registrar SHA/resultado; adaptarla para exigir el comportamiento
  corregido, porque hoy exit 0 significa que REPRODUJO los cuatro defectos.
- El reporte usa funciones originales y persistencia simulada. No demuestra
  cargos bancarios, Firestore real ni la explotacion remota de permisos.
- No marcar el area entera limpia por este retest parcial. Diferenciar cinco
  casos anteriores comprobados de estos cuatro nuevos; no duplicarlos en el registro.

```comprobar
archivo: src/app/actions/invoices.ts
usa: addPaymentToInvoice en src/app/(app)/invoices/[id]/page.tsx
prueba: src/__tests__/cobros-1254-no-dan-exitos-falsos.test.ts
archivo: src/app/(app)/invoices/[id]/page.tsx
usa: numberToSpanishWords(lastPayment.amount) en src/app/(app)/invoices/[id]/page.tsx
prueba: src/__tests__/cobros-1254-no-dan-exitos-falsos.test.ts
archivo: src/app/actions/invoices.ts
usa: pasarCobrosPendientesAlPresupuesto en src/app/(app)/invoices/page.tsx
prueba: src/__tests__/cobros-1254-no-dan-exitos-falsos.test.ts
```
