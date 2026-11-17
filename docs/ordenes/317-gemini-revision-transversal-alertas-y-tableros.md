# Orden 317 — Revisión transversal del auditor: alertas y tableros que dicen qué cuentan (17/11/2026)

Informe del auditor externo "Revisión transversal de la aplicación" (17/11, 10:35-11:12). Va en la **misma propuesta**
que el resto de tus órdenes abiertas, al final. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

## Lo que ya arregló Claude (NO rehacer)

- **H2, "✓ Guardado" en un menú nuevo sin guardar:** `getSaveStatusLabel` en `src/components/catering/MenuForm.tsx`
  dice "Sin guardar todavía" si el menú es nuevo y no se guardó.
- **O1, tablero ejecutivo** (`src/app/actions/analytics.ts`): el promedio se divide por las ventas de los 12 meses
  (`ventasEnElPeriodo`), no por las fiestas pasadas de toda la historia; y el margen sin costos cargados dice "Sin costos
  cargados" en vez de 100%.
- **O3, `/presupuestos`:** redirige desde el servidor, sin la pantalla de "Redirigiendo...".
- **Lo contable de la auditoría interna** (recibos en $0, pagos a proveedor en $0, rechazar un cobro confirmado, portal con
  pagos rechazados "en revisión", cantidades con coma en el presupuesto manual). No se toca.

## Bloque 1 — H1: el panel y el Centro de Alertas cuentan cosas distintas

`src/app/(app)/admin/page.tsx` línea ~196 arma "Alertas Urgentes" con `kpiData.alerts` de `getDashboardKpiData`
(`src/app/actions/dashboard.ts` línea ~165: tareas vencidas, facturas pendientes, **saldo pendiente de presupuestos
aceptados** `budget_balance_*`, reuniones). El Centro de Alertas (`src/app/(app)/alertas/page.tsx`) y el contador del menú
(`src/components/main-nav.tsx` línea ~164) usan `getAlertasGlobalesConLeidas` (`src/app/actions/alertas.actions.ts`), que
sólo evalúa las reglas de las fiestas. Por eso el panel dice 4 y el centro no las tiene.

Arreglo: que el Centro de Alertas muestre **también** las del panel (sumar las de `getDashboardKpiData()`, campo `data.alerts`, como una
sección "Plata y agenda", con su enlace), y que el contador del menú cuente lo mismo que el centro. El número del panel
tiene que ser el total real, no `slice(0, 4)`: mostrar 4 y decir "4 de N". **No cambiar qué alerta sale ni su texto.**

## Bloque 2 — O1 y O2: cada número del tablero dice qué cuenta

- `src/app/analytics/page.tsx`: debajo de cada tarjeta, una línea chica con qué cuenta y de qué período. Textos:
  "Fiestas con fecha pasada", "Facturas y presupuestos aceptados de los últimos 12 meses ÷ cantidad de ventas",
  "Presupuestos aceptados ÷ todos los presupuestos", "Ingresos − costos cargados, últimos 12 meses",
  "Presupuestos del simulador que se aceptaron", "(Ingresos − costos) ÷ ingresos; sin costos cargados no se calcula".
- `src/app/admin/finanzas/page.tsx` línea ~141 "Por cobrar": agregar "sólo de las fiestas cargadas" y un enlace
  "Ver todo lo que se debe" al Panel Contable. El panel contable y el menú dicen "facturas y presupuestos aceptados".
- **No cambiar ninguna cuenta**: sólo los rótulos.

## Bloque 3 — Cuentas por rol y clientes de prueba para el auditor (pedido del dueño: "que el auditor pruebe todo")

El auditor ya puede guardar en toda la app (Claude, 17/11). Le falta poder ver la app como cada perfil. En la
computadora del dueño, con su sesión: crear desde Ajustes → Usuarios tres cuentas de prueba (perfiles `secretaria`,
`operador` y `personal`) con correos `auditor+secretaria@…`, etc. que te pase el dueño en pantalla, y dos clientes de
prueba con fiesta en estado "Demo AK" (que `esFiestaDemo` los deje fuera de los números). **No inventes correos reales ni
uses datos de clientes.** Anotá en `docs/evidencias/cuentas-del-auditor.md` qué cuentas quedaron (sin claves).

## Qué tiene que comprobar la prueba

- `src/__tests__/el-centro-de-alertas-cuenta-lo-del-panel.test.ts`: con un presupuesto aceptado con saldo, la alerta
  `budget_balance_*` aparece en lo que muestra el Centro de Alertas y el contador del menú es igual al total del centro.
- `tests/e2e/el-tablero-dice-que-cuenta.spec.ts`: `/analytics` muestra el texto "últimos 12 meses" y nunca "100%" en el
  margen cuando no hay costos (con los datos locales de prueba).

## Barrido en toda la app

Hecho por Claude el 17/11:
- **Pregunta 166 (importe vacío o en cero en algo "pagado"):** `monto…: Number(… || 0)` en `src/app` y `src/components`:
  sólo el historial de sueldos (`empleados/[id]/historial`), que el servidor ahora frena. Pagos a proveedor: `<= 0`.
  Facturas, cobros de presupuesto y gastos ya rechazaban el cero.
- **Pregunta 167 (cambio de estado de plata sin mirar el de antes):** `estadoPago: 'rechazado'` y `estado: 'anulad|cancelad'`
  en `src/app/actions` y `src/lib`: sólo `rejectPagoCliente` (arreglado). Mensajes programados y entretenimiento no
  son plata.
- **Pregunta 168 (dos contadores de lo mismo que no coinciden):** el panel y el centro de alertas (bloque 1); el resto de
  los "por cobrar" se rotula en el bloque 2.
- **Pregunta 169 ("Guardado" antes de guardar):** `✓ Guardado` / `>Guardado<` en `src/app` y `src/components`: el de menús
  (arreglado); `auto-save-indicator.tsx` sólo dice "Guardado" con `lastSaved`, que se pone al guardar.
- **Pregunta 170 (un número de tablero sin decir qué cuenta):** `/analytics` y `/admin/finanzas` (bloque 2).

```comprobar
usa: ventasEnElPeriodo en src/app/actions/analytics.ts
usa: Sin guardar todavía en src/components/catering/MenuForm.tsx
usa: getDashboardKpiData en src/app/(app)/alertas/page.tsx
usa: últimos 12 meses en src/app/analytics/page.tsx
prueba: src/__tests__/el-centro-de-alertas-cuenta-lo-del-panel.test.ts
prueba: tests/e2e/el-tablero-dice-que-cuenta.spec.ts
archivo: docs/evidencias/cuentas-del-auditor.md
```
