# Orden 251 — Un solo número de plata en toda la app, y la pregunta frecuente del ajuste (27/10/2026)

**Para Gemini. Va en la MISMA propuesta que las órdenes 247 y 249** (rama `gemini/orden-247-admin-sesiones-y-plata`).
Las tres son de plata y están en la app publicada. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md`.
`el-candado-de-la-plata.test.ts` tiene que seguir en verde.

**De dónde sale:**

- Codex encontró cuatro casos (auditorías 732 y 737, rama `codex/697-auditoria-automatismos-20261026`, órdenes 250 y 251
  de Codex con sus evidencias `docs/evidencias/729-738*`).
- Claude barrió la app con la pregunta 110 y encontró que **el mismo número de plata se calcula de cinco maneras**.

La causa de fondo es una sola, y por eso va todo junto.

## Las decisiones (las tomó Claude con el visto bueno del dueño: "decidí todo")

1. **"Cobrado" es lo que entró, por la fecha del cobro**, en hora de Uruguay. Se descuenta la comisión de Mercado Pago
   confirmada (`comisionProveedor`). No se estima una comisión que no se conoce: si falta, se muestra "sin comisión
   informada" y no se toma como cero confirmado.
2. **"Vendido" o "pactado" es el total del presupuesto o de la factura, con el ajuste anual.** Siempre con ese nombre,
   nunca como "ingreso" ni como "cobrado".
3. **El costo de una fiesta sale de UNA función:** `calcularGananciaDeEvento` (`src/lib/costos/ganancia-evento.ts:121-166`).
   Con estas reglas, que pasan a esa función:
   - **personal:** el mayor entre `others.totalPersonalCost` y lo calculado de `personalAsignado` (la regla de
     `reportes.ts:200-217`);
   - **un renglón con pago parcial:** el mayor entre lo pagado y lo estimado, hasta que se marque cerrado;
   - **importes negativos:** cuentan como 0.
4. **Los pagos a proveedores:**
   - en un reporte **por período** cuentan por **la fecha del pago**;
   - en la ganancia **de una fiesta** cuentan todos los de esa fiesta.

   Son dos vistas distintas y cada una lo dice en su título.
5. **Los gastos generales** (que no son de una fiesta) se restan sólo en el reporte por período, con el renglón
   "Gastos generales" a la vista.

## Bloque 1 — lo que encontró Codex

- **R1, la comisión no llega al reporte.**
  - `getProfitAndLossData` (`src/app/actions/reportes.ts`) no descuenta `comisionProveedor`.
  - `analytics.ts` (~152 y ~267) llama `calcularGananciaDeEvento(gestionCostos, pagosProveedores)` **sin** los cobros.
  - `src/app/admin/finanzas/page.tsx:36` hace lo mismo.
  - Hay que pasar los cobros en los tres. Cada comisión se resta **una sola vez**, y si ya figura como gasto cargado a
    mano, no se repite.
- **R2, el pago al proveedor cae en el mes equivocado.** `getProfitAndLossData` filtra primero por la fecha del evento
  y después agrega todos los pagos sin mirar `pago.fecha`. Va la decisión 4, con `inRange` de Uruguay.
- **R3, la seña sin presupuesto desaparece.** `registerBookingDeposit` sobre una fiesta sin `presupuestoId` crea el
  recibo cobrado. El libro (`calculateFinancialLedger`) lo cuenta y el reporte no, porque `isFirmSalesInvoice` excluye
  los recibos de seña.
  - El reporte toma los cobros con la misma conciliación del libro, contando cada cobro una vez, haya presupuesto o
    no.
  - La seña se muestra como **"Seña cobrada"**, no como venta.
  - No se re-cobra nada ni se crea un presupuesto para taparlo.

## Bloque 2 — lo que encontró el barrido (pregunta 110)

- **"Ingresos" son cinco cosas distintas:**
  - Reportes (`reportes.ts:118-153`);
  - el libro y el panel (`src/lib/commercial-flow/ledger-service.ts:187-236` y `dashboard.ts:136,246-258`);
  - Analíticas (`analytics.ts:120-138,249-259`), que no aplica el ajuste anual a los presupuestos sin factura;
  - Finanzas (`admin/finanzas/page.tsx:38-49`; ya pedido en la orden 247, bloque 5);
  - la Comparativa de ganancias (`ganancia-evento.ts:178` y `src/app/(app)/comparativa-ganancias/page.tsx:187`), que
    muestra lo pactado con el texto "de lo cobrado".

  Cada pantalla usa las decisiones 1 y 2 y lo dice con esas palabras. **Analíticas aplica el ajuste anual** con la
  misma función del libro (`getBudgetCollectibleTotal`, `ledger-service.ts:225`).
- **El mes de los cobros en el libro** (`getMes`, `ledger-service.ts:187-193`) usa `new Date(...).getMonth()` del
  servidor. Que use el día de Uruguay, como `inRange`.
- **"Lo que me deben"** sale de dos lugares y da dos números:
  - el panel (`dashboard.ts:137`, `ledger-service.ts:238-241`) resta todo junto, así que un cliente que pagó de más
    tapa la deuda de otro;
  - la alerta, el asistente (`src/lib/asistente/contexto-negocio.ts:125-134`) y el flujo de caja (`dashboard.ts:381-392`)
    lo cuentan presupuesto por presupuesto;
  - el asistente de WhatsApp (`src/lib/asistente/por-whatsapp.ts:454`) usa el del panel.

  **Todos pasan a sumar el saldo de cada presupuesto**, contando sólo los positivos, con `getBudgetPaymentSummary`. Así
  el panel, la alerta y los dos asistentes dicen el mismo número.
- **Presupuestos "Facturado" sin factura firme:** el libro (sólo `Aceptado`) y Reportes (`isFirmBudgetStatus`) no los
  tratan igual. Que usen la misma regla, la de Reportes.

## Bloque 3 — la pregunta frecuente del ajuste (Codex 737)

`src/data/preguntas-frecuentes-contrato.ts:21` dice "un ajuste del 15% sobre lo que falte". El contrato (cláusula 2)
y la cuenta de la app ajustan **el total del presupuesto** y después restan lo pagado. Con 100.000 de base, firma en
2026, evento en 2027 y 50.000 pagados, la cuenta da 65.000 de saldo, y lo que dice la pregunta da 57.500.

**Se corrige el texto, no la cuenta.** Queda:

> "Sí. Si el evento es en un año posterior al de la firma, cada 1º de enero el total del presupuesto se ajusta un 15%,
> acumulado año a año, y a ese total se le restan los pagos que ya hiciste. Ejemplo: presupuesto de $100.000, pagaste
> $50.000; si el evento es al año siguiente, el total pasa a $115.000 y te quedan $65.000."

No prometas que adelantar pagos evita el ajuste. No toques contratos ya firmados.

## Pruebas

**Jest**, en `src/__tests__/un-solo-numero-de-plata.test.ts`. Usá una fiesta totalmente cobrada de 100.000, con 3.000 de
comisión. Tiene que comprobar:

- **Comisión:** Reportes, Analíticas, Finanzas y Comparativa dan 97.000. Con comisión 0, dan 100.000.
- **Pago al proveedor:** uno del 21/10 de una fiesta del 20/09 aparece en el reporte de octubre y no en el de
  septiembre.
- **Seña sin presupuesto:** de 1.000, aparece una vez en el reporte del período, como "Seña cobrada".
- **Saldo:**
  - el cliente A debe 10.000 y el B pagó 2.000 de más;
  - el panel, la alerta, el asistente y el asistente de WhatsApp dicen 10.000.
- **Fecha:** un cobro a las 23:30 del 31/10 en Uruguay cae en octubre, en el libro y en el reporte.
- **Pago parcial:** un renglón con estimado 5.000 y pagado 2.000 cuesta 5.000 en todas las pantallas.

Rompé a propósito el caso de la comisión y fijate que se ponga en rojo.

**Jest**, en `src/__tests__/faq-ajuste-anual-coincide-con-contrato.test.ts`. Toma el ejemplo de la pregunta frecuente y
lo pasa por la cuenta real de la app: tienen que dar el mismo saldo.

```comprobar
usa: comisionProveedor en src/app/actions/reportes.ts
usa: pagosCliente en src/app/actions/analytics.ts
usa: pagosCliente en src/app/admin/finanzas/page.tsx
usa: getBudgetPaymentSummary en src/lib/asistente/por-whatsapp.ts
no-usa: sobre lo que falte en src/data/preguntas-frecuentes-contrato.ts
prueba: src/__tests__/un-solo-numero-de-plata.test.ts
prueba: src/__tests__/faq-ajuste-anual-coincide-con-contrato.test.ts
```
