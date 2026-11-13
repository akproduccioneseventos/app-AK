# Orden 301 — La contabilidad dice lo que cuenta (13/11/2026)

**Para Gemini.** Va **en la misma propuesta que la 297 a 300**. Toca plata: repasá `docs/ANTES-DE-ENTREGAR.md`
(preguntas 88 a 107), el candado de la plata (`src/__tests__/el-candado-de-la-plata.test.ts`) y la ida y vuelta contra la
base para todo lo que guarde.

Sale de la auditoría de contabilidad, simulador y presupuestos (13/11/2026).

## Lo que NO se toca (decisiones del dueño)

- El 50% del Club Uruguay con el tachado al doble (`precioReal = precioBasePromo * 2`), el ajuste anual del 15% compuesto,
  la seña de $5.000, el precio de lista de marketing y el 10% de promoción del simulador y del presupuesto manual.
- Que el alquiler del salón se cobre aparte del presupuesto de AK.

## Ya lo hizo Claude (13/11/2026)

"Poner al día" ya **no** trae los cobros marcados (`src/app/(app)/empresa/contabilidad/poner-al-dia/page.tsx`).

## Barrido en toda la app (Claude, 13/11/2026)

- **Etiquetas que dicen otra cosa:** "Ventas totales — Suma de todas las facturas generadas" suma presupuestos aceptados
  (`src/app/(app)/empresa/contabilidad/page.tsx` ~136; la suma sale de `src/lib/commercial-flow/ledger-service.ts` ~26); "Cobros pendientes" del flujo de caja es una proyección de los próximos
  meses (`src/app/(app)/.../flujo-caja/page.tsx`); "Eficiencia operativa 100%" con costos en $0.
- **Poner al día:** el cobro se registra con la fecha de la fiesta (`src/app/actions/poner-al-dia.ts`), no con la de cobro.
- **El CRM no avanza solo:** 59 tarjetas con contrato firmado y "Firmó contrato: 0" en el CRM (`src/app/actions/crm.ts`).
- **El reporte de presupuestos** suma aceptados y pendientes a precio base, y el resto de la contabilidad usa el ajustado.
- **El presupuesto no muestra la línea del ajuste anual**: el estado de cuenta sí ("Ajuste anual (1 año · 15%) +$31.041").
- **Contrato:** cláusula 3 con huecos ("el al primer tercio del plazo"), la hora "12:00" para una fiesta de noche y el número
  de documento con formato roto (`#_09_12`). Los marcadores sin completar ya están en la orden 300, bloque 4.
- **La fiesta "DEMO AK - XV Martina"** cuenta entre las fiestas activas del tablero.

## Bloque 1 — Cada número dice qué cuenta (P1)

- Panel: "Ventas totales" → **"Ventas comprometidas"**, descripción **"Presupuestos aceptados y facturas"**; debajo, una
  línea aparte **"Facturado: $X"** (sólo facturas emitidas).
- Flujo de caja: "Cobros pendientes" → **"Ingresos esperados (próximos N meses)"**, y aparte **"Vencido sin cobrar: $X"**.
- Con costos en $0 o sin cobros, "Eficiencia" y "Ganancia" muestran **"Sin datos suficientes"**, no 100% ni $0.
- Reporte de presupuestos: el total se separa en **"Aceptados"** y **"Pendientes"**, y cada pantalla dice si el monto es
  **"con ajuste anual"** o **"sin ajuste"**.

## Bloque 2 — Poner al día pide la fecha real del cobro (P1)

Cada cobro marcado pide **fecha en que se cobró** (obligatoria, no puede ser futura) y **medio** (transferencia, efectivo,
Mercado Pago, tarjeta); `aplicarPonerAlDia` (`src/app/actions/poner-al-dia.ts`) guarda esa fecha y ese medio, nunca la de
la fiesta. Antes de aplicar, la pantalla muestra **"Vas a registrar N cobros por $X"** y pide confirmar. Prueba de ida y
vuelta contra la base: se aplica, se vuelve a leer el presupuesto y el pago tiene la fecha elegida.

## Bloque 3 — El CRM avanza con la venta real (P2)

Cuando un presupuesto pasa a aceptado, o la fiesta registra el contrato en papel firmado, el prospecto enganchado
(`leadId`) pasa solo a la etapa ganadora (`idsDeEtapaGanadora`, `src/lib/crm/etapas-finales.ts`) dentro del turno del CRM
(`conTurnoCrm`, `src/lib/crm/turno-crm.ts`). No crea prospectos ni mueve a "perdido". Una tarea de una sola vez acomoda los
que ya están aceptados o firmados.

## Bloque 4 — El presupuesto muestra el ajuste anual como línea (P2, lo ve el cliente)

En el presupuesto que ve el cliente, antes del total, una línea **"Ajuste anual (N años · 15%) +$X"**, con la misma cuenta
que el estado de cuenta. El total no cambia.

## Bloque 5 — El contrato sin huecos (P1, lo firma el cliente)

Cláusula 3 completa (el texto con el monto y la fecha del primer tercio), la **hora real** de la fiesta
(`configuracion.horaInicio` o la del presupuesto) y el número de documento con formato **"AK-AAAA-NNN"**.

## Bloque 6 — La fiesta de demostración no cuenta (P2)

Las fiestas cuyo nombre empieza con "DEMO AK" (y las `esMuestra` de la orden 299) quedan afuera de los conteos y totales del
tablero, del panel contable y de "Poner al día".

## Pruebas

- `src/__tests__/la-contabilidad-dice-lo-que-cuenta.test.ts`: los rótulos nuevos, "Sin datos suficientes" con costos en
  cero, el reporte separado por estado y la fiesta DEMO afuera de los totales.
- `tests/firebase/poner-al-dia-guarda-la-fecha-real.test.ts`: ida y vuelta, el pago queda con la fecha y el medio elegidos.
- `src/__tests__/el-crm-avanza-con-la-venta.test.ts`: aceptar un presupuesto mueve su prospecto a la etapa ganadora una
  sola vez, y con dos aceptaciones a la vez no se duplica (base de mentira que devuelve copias).
- `src/__tests__/el-presupuesto-muestra-el-ajuste.test.ts` y `src/__tests__/el-contrato-no-tiene-huecos.test.ts`.

```comprobar
no-usa: Suma de todas las facturas generadas en src/app/(app)/empresa/contabilidad/page.tsx
prueba: src/__tests__/la-contabilidad-dice-lo-que-cuenta.test.ts
prueba: tests/firebase/poner-al-dia-guarda-la-fecha-real.test.ts
prueba: src/__tests__/el-crm-avanza-con-la-venta.test.ts
prueba: src/__tests__/el-presupuesto-muestra-el-ajuste.test.ts
prueba: src/__tests__/el-contrato-no-tiene-huecos.test.ts
```
