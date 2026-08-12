# Orden de trabajo: el contrato que firma el cliente

Fecha: 12 de agosto de 2026.

**Entregá UNA SOLA propuesta de cambio con los dos bloques adentro.** Si uno se
traba, entregá el otro igual en la misma propuesta y avisá cuál faltó y por qué.

Contexto: esto es el papel que el cliente firma. Un número o una fecha mal en ese
papel se descubre delante del cliente, o peor, cuando hay que cobrar.

Los dos hallazgos están verificados leyendo el código, no son sospechas.

---

## Bloque 1 — El recibo de contrato muestra el total SIN el ajuste anual

**Dónde:** `src/app/(app)/presupuestos/[id]/recibo-contrato/page.tsx`, alrededor
de la línea 149.

**Qué hace hoy:**

```ts
const summary = getBudgetPaymentSummary(presupuesto);
return { totalCosto: summary.total, totalPagado: summary.paid, saldoPendiente: summary.balance, pagos: pagosList };
```

`getBudgetPaymentSummary` devuelve el total **base**, sin el ajuste anual.

**Por qué está mal:** el ajuste anual corresponde siempre en un evento contratado
que se celebra en un año posterior al del presupuesto. Es decisión tomada del
dueño. El estado de cuenta y el portal del cliente ya lo aplican; **este recibo
no**. Resultado: el papel que se firma muestra un total y un saldo menores que los
reales, y la diferencia aparece recién al cobrar la última cuota.

**Qué hay que hacer:** usar `calcularEstadoDeCuenta` de
`src/lib/budget/saldo-con-ajuste.ts`, que es el cálculo bueno y ya está probado.
Devuelve `total`, `totalBase`, `ajusteAnual`, `pagado` y `saldo`.

```ts
const cuenta = calcularEstadoDeCuenta(presupuesto);
// totalCosto  -> cuenta.total   (con el ajuste ya incluido)
// totalPagado -> cuenta.pagado
// saldoPendiente -> cuenta.saldo
```

**Además, y esto importa para que el papel se entienda:** cuando el ajuste
corresponde (`cuenta.ajusteAnual > 0`), el recibo tiene que **mostrar el ajuste
como una línea aparte**, no esconderlo dentro del total. Algo como:

```
Subtotal contratado           $ 120.000
Ajuste anual (15%)            $  18.000
Total                         $ 138.000
```

Si el cliente ve un número más alto que el del presupuesto original sin ninguna
explicación, se genera una discusión al firmar. Con la línea visible, se explica
solo.

**Cómo comprobarlo:** un presupuesto Aceptado, firmado en 2025, con evento en 2026
y `ajusteAnualActivo` en verdadero, tiene que mostrar en el recibo el mismo total
que muestra el estado de cuenta de ese presupuesto. Hoy muestran distinto.

---

## Bloque 2 — La fecha del contrato sale un día antes

**Dónde:** `src/app/(app)/presupuestos/[id]/recibo-contrato/page.tsx`, alrededor
de la línea 46.

**Qué hace hoy:**

```ts
return new Date(dateString).toLocaleDateString('es-ES', { ... });
```

**Por qué está mal:** las fechas del evento se guardan como texto sin hora
(`2026-12-15`). `new Date('2026-12-15')` las interpreta en horario universal, y
como Uruguay va tres horas atrás, al mostrarlas aparece **el día anterior**. Un
evento del 15 de diciembre sale impreso como 14 de diciembre.

**Qué hay que hacer:** usar `parseEventDate` de
`src/lib/public-experience/event-date.ts`, que es el ayudante que ya resolvió esto
mismo en las invitaciones y el portal. Si `parseEventDate` devuelve nulo, mantener
el guion que ya se muestra hoy.

**Ojo, no toques esta otra:** en
`src/app/(app)/fiestas/nueva/gestion-documental/contrato-servicio/page.tsx`, línea
38, hay otra función `formatDate` que **ya está bien**: extrae año, mes y día en
horario universal y arma la fecha local, así que no se corre de día. Se revisó y
funciona. No la cambies.

---

## Lo que NO hay que tocar

Se revisó y está correcto:

- La validación de marcadores de plantilla: si queda un `{{ALGO}}` inventado, no
  deja guardar. Ya funciona.
- Los permisos: la pantalla está detrás de la sesión del equipo y
  `getPresupuestoById` valida antes de devolver datos.
- Los datos vacíos: se muestran como `___________` o `—`, nunca como `undefined`
  ni `Invalid Date`.
- El ajuste anual en sí: el 15% va siempre, y el descuento del Salón Club Uruguay
  y el del presupuesto son decisiones de marketing del dueño. No se discuten.

## Antes de entregar

- `npm run check:acentos` sin acentos rotos.
- `npx tsc --noEmit` en cero.
- `npx jest --silent` todo en verde.
- `npm run build` termina bien.
- Anotá los dos arreglos en `docs/YA-RESUELTO.md`, en la misma propuesta. Una
  propuesta que toca código y no toca esa lista está incompleta.
- Agregá una prueba que fije el total del recibo con ajuste anual: es plata y no
  puede volver a soltarse.
