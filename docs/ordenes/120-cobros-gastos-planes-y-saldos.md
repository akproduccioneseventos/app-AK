# 120 - Claude: cobros, gastos, planes y saldos

**HECHA por Claude el 6/10/2026.** Ver `docs/YA-RESUELTO.md` del 6/10 y
`src/__tests__/auditoria-70-contabilidad.test.ts`.


Area: plata. Commit: `6a2143ffe6c257ca94e9761dd7cfacfafafe8e35`.
6/10/2026. PR1257 fusionada, ninguna PR abierta al iniciar. Se reproduce en
main. Contrastar una nueva tanda ANTES de programar. Una entrega, sin fusion
automatica. Claude programa dinero/permisos y compila; Codex revisa.

## Reproduccion

`node docs/evidencias/70-sondas-contables.cjs`

Carga TypeScript real con datos y persistencia sinteticos. Salida cero significa
defectos reproducidos, NO aprobacion. No hubo cobros ni escrituras productivas.
Salida conservada: `docs/evidencias/70-resultados/sondas.json`.

## Hallazgos y aceptacion

1. **COB10, P1: personal agrega/borrar cobros sin permiso.**
   `src/app/actions/presupuestos.ts:703,798`, helper `cambiarCobrosDelPresupuesto:223`.
   La sesion alcanza; rama con base va directo a `mutateDataItem` sin comprobar
   CONTABILIDAD. Sonda: personal con permiso falso registra pago confirmado y
   lo borra. Exigir permiso en altas, bajas, confirmaciones y rechazos. Separar
   comprobante informado por cliente de cobro administrativo, sin romper acceso
   legitimo ni webhooks. Probar personal/operador denegados y secretaria/dueno
   autorizados, en rama con base simulada y JSON, despues por HTTP aislado.
   Alta/borrado reproducidos; confirmar/rechazar comparten helper pero no fueron
   ejecutados por esta sonda: completar esos casos, no contarlos como probados.

2. **GAS01, P1: gastos sin perfil.** `src/app/actions/gastos.ts:19,25,61`.
   Personal lee, crea y elimina gastos con solamente sesion. Proteger servidor
   segun permisos existentes; contemplar categoria sueldos administrativos al
   proyectar informacion para quien no tiene SUELDOS.

3. **GAS02, P1: reintentos simultaneos duplican gasto.** `gastos.ts:33-46`.
   Misma idempotencyKey en Promise.all guarda dos IDs aleatorios: 200 en vez
   de 100. El segundo control bajo mutex solo existe en JSON. Usar identidad/
   creacion atomica entre instancias y cotejar payload al reutilizar clave.
   Dos operaciones distintas del mismo monto/fecha deben seguir siendo dos.
   No limpiar historicos por parecido ni borrar datos reales automaticamente.

4. **GAS03, P2: importes no finitos aceptados.** `gastos.ts:29`.
   NaN e Infinity pasan `monto <= 0` y llegan a persistencia con success.
   Rechazar antes de escribir; validar fecha/categoria y mostrar error legible.
   No se probo como Firestore serializa esos valores.

5. **PLAN01, P1: plan viejo deshace cuota pagada.** `payment-plans.ts:50-74`.
   A lee pendientes; B marca 1000 pagados; A guarda sus cuotas viejas al cambiar
   una nota: vuelve pendiente y pagado=0. No es COB02 (dos marcas simultaneas).
   Cambios puntuales/version/conflicto, conservando cobros actuales. Un mutex
   alrededor de reemplazar un array viejo NO resuelve esto. Verificar otros
   campos de fiesta y permiso contable de las acciones de cuotas.

6. **LEDGER01, P1: saldo del panel omite ajuste anual.**
   `src/lib/commercial-flow/ledger-service.ts:224,240`, consumidor dashboard:122.
   Aceptado 100000, firmado 2026, evento 2027, ajuste activo 15%, cobrado 100000:
   resumen de cobro=15000; libro mayor=0. Unificar saldo contractual cobrable,
   mantener precio vigente separado en propuesta y no ajustar dos veces factura.
   Probar 2026/2027/2028, ajuste desactivado, aceptado/facturado, vinculos y
   pendientes/rechazados sin duplicar ingresos.

Las 599 suites/3445 pruebas pasaron CON estos defectos. Agregar regresiones
de comportamiento que fallen antes del arreglo. Claude registra SHA, entorno
y compilacion; Codex contrasta estos casos. No prometer ausencia global de errores.
Prueba final del bloque: PROPUESTA, pendiente de crear y ejecutar.

```comprobar
archivo: src/app/actions/presupuestos.ts
usa: addPagoToPresupuesto en src/app/(app)/pagos-rapidos/page.tsx
archivo: src/app/actions/gastos.ts
usa: saveGastoGeneral en src/app/(app)/empresa/contabilidad/gastos/page.tsx
archivo: src/app/actions/payment-plans.ts
usa: savePlanDePagos en src/app/(app)/fiestas/nueva/plan-pagos/page.tsx
archivo: src/lib/commercial-flow/ledger-service.ts
usa: calculateFinancialLedger en src/app/actions/dashboard.ts
prueba: src/__tests__/auditoria-70-contabilidad.test.ts
```
