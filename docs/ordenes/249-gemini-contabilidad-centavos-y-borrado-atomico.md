# Orden 249 — Contabilidad: una factura no se borra mientras se cobra, y el contador recibe los centavos (27/10/2026)

**Para Gemini. Va en la MISMA propuesta que la orden 247** (rama `gemini/orden-247-admin-sesiones-y-plata`). Las dos
son de plata y están rotas en la app publicada. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md`, en especial
las preguntas de "dos a la vez". `el-candado-de-la-plata.test.ts` tiene que seguir en verde.

Lo encontró Codex (auditoría 726). La reproducción y las evidencias están en la rama
`codex/697-auditoria-automatismos-20261026`: `docs/evidencias/725-*` y `726-*`. Ahí está también su texto original, en
`docs/ordenes/249-claude-contabilidad-centavos-y-borrado-atomico.md`. Claude confirmó los dos casos y barrió la app con
la misma forma.

## Bloque 1 — borrar una factura y cobrarla a la vez: desaparece el cobro

`deleteInvoiceInner` (`src/app/actions/invoices.ts` ~575-600):

- lee las facturas con `leerFacturasSinGuardia`;
- mira que no tenga `payments` y que su estado no sea `'Paid'`;
- **recién después** borra con `writeData` y `forceDeleteDocFromFirestore` (~600).

Si en el medio entra `addPaymentToInvoice` (~`addPaymentToInvoiceInner`), el cobro dice "registrado" y la factura
desaparece con él. El turno (`AsyncMutex`) es de un solo servidor.

**Qué hacer:**

1. **Leer, comprobar y borrar ESA factura en la misma transacción** de la base, con el mismo patrón que usa
   `cambiarCobrosDelPresupuesto` (`src/app/actions/presupuestos.ts`, `deletePagoFromPresupuesto` ~881). Si al momento
   de borrar tiene pagos o está cobrada, se rechaza: "Esta factura ya tiene un cobro. No se puede borrar."
2. **El cobro, adentro de su transacción, comprueba que la factura siga existiendo.** Si se borró antes, se rechaza:
   "Esa factura ya no existe."
3. **No cambies `forceDeleteDocFromFirestore`**, que es general. Hacé una función de borrado condicional para
   facturas.
4. **Se conserva lo de hoy:** el bloqueo de borrar facturas cobradas, los permisos y la limpieza de vínculos
   (`removeInvoiceId`).

## Bloque 2 — lo mismo en presupuestos

`deletePresupuesto` (`src/app/actions/presupuestos.ts` ~609-633):

- mira `estadoDelContrato(id)` (~613) **antes** de entrar al turno, y después borra con `forceDeleteDocFromFirestore`
  (~633);
- además **no mira `pagosCliente`**, así que un presupuesto con cobros, sin contrato firmado, se borra con los cobros
  adentro.

**Qué hacer.** El dueño decidió que los presupuestos se traten igual que las facturas. En una sola transacción:

- si el contrato está firmado, o el presupuesto tiene cobros en `pagosCliente`, **no se borra**: "Este presupuesto
  tiene cobros o contrato firmado. Archivalo en lugar de borrarlo.";
- si no, se borra.

## Bloque 3 — el resumen para el contador pierde los centavos

`src/lib/contabilidad/resumen-para-el-contador.ts` (~27, 49, 51) redondea a pesos enteros los montos de cobros y
gastos. El reporte (`reportes.ts:248-249`) sí tiene centavos. Codex lo midió:

- con un gasto de 60,30, el reporte dice 60,30 y el archivo y el texto dicen 60;
- con dos gastos de 60,30, el reporte dice 120,60, las filas del archivo suman 120 y el texto dice 121.

**Qué hacer:**

- **Gastos, costos y resultado** van con dos decimales al archivo y al texto, con el mismo redondeo de centavos del
  reporte (`*100/100`).
- **En el archivo:** punto como separador decimal y sin separador de miles, para que la planilla lo abra como número.
  Los gastos van con signo negativo.
- **No cambies `roundMoney` general, ni las ventas, cuotas e importes de invitados**, que van en pesos enteros por
  decisión del dueño.
- **También `src/app/actions/analytics.ts` (~157-159 y ~274-278):** la rentabilidad sale de los montos con centavos y
  se redondea al final, una sola vez, para que cierre con ingresos menos costos.

Los consumidores son `handleBajarPlanilla` (`src/app/(app)/empresa/contabilidad/reportes/page.tsx`) y
`mandarResumenAlContador` (`src/lib/contabilidad/mandar-resumen-al-contador.ts`).

## Bloque 4 — la misma forma, sin plata (borrar algo que otro está usando)

Se comprueba afuera y se borra después. Si en el medio se asigna lo que se borra, queda una referencia a algo que no
existe. Pasá el control adentro del mismo guardado:

- `deleteProveedorInterno` (`src/app/actions/proveedores.ts` ~116-168): insumos que lo usan;
- `deleteInsumoInterno` (`src/app/actions/insumos.ts` ~175-195): menús que lo usan;
- `deleteMenuInterno` (`src/app/actions/menus-catering.ts` ~262-285): presupuestos y fiestas que lo usan;
- `deleteActivoFijo` (`src/app/actions/activos-fijos.ts` ~122-148): fiestas que lo cargan;
- `deleteEmpleado` (`src/app/actions/empleados.ts` ~275-305): fiestas futuras que lo tienen asignado.

Si el turno de una lista es distinto del de la otra, lo mínimo es volver a mirar adentro del guardado justo antes de
borrar. Si no se puede hacer sin un cambio grande, avisá cuál quedó y por qué.

## Pruebas

**Jest**, en `src/__tests__/la-factura-no-se-borra-mientras-se-cobra.test.ts`. Usá una base de mentira que **devuelva
copias**, con dos instancias del módulo y los dos órdenes del cruce. Tiene que comprobar:

- **borrar llega primero:** el cobro se rechaza y no queda factura;
- **cobrar llega primero:** el borrado se rechaza y el cobro sigue;
- **nunca** los dos dicen "listo" y desaparece el comprobante;
- lo mismo para el presupuesto con cobros.

Rompé a propósito el borrado, volviendo a leer afuera, y fijate que se ponga en rojo.

**Jest**, en `src/__tests__/el-contador-recibe-los-centavos.test.ts`. Tiene que comprobar:

- con un entero, con 60,30 y con 60,30 + 60,30, la suma de las filas del archivo es igual al resultado del reporte y
  al texto;
- el signo de los gastos;
- un texto con comillas;
- que la planilla lo lea como número: armá el archivo y volvelo a leer.

**Deuda de pruebas que vio Codex:** a dos dobles de prueba les falta `readDataConDetalle`. Están en
`dos-cobros-a-la-vez-no-se-pisan.test.ts` y `una-sena-de-contrato-es-una-por-presupuesto.test.ts`. Agregalo **sin
cambiar ninguna comprobación**.

```comprobar
usa: deleteInvoiceAction en src/app/(app)/invoices/page.tsx
usa: armarResumenParaElContador en src/lib/contabilidad/mandar-resumen-al-contador.ts
no-usa: Math.round en src/lib/contabilidad/resumen-para-el-contador.ts
prueba: src/__tests__/la-factura-no-se-borra-mientras-se-cobra.test.ts
prueba: src/__tests__/el-contador-recibe-los-centavos.test.ts
```
