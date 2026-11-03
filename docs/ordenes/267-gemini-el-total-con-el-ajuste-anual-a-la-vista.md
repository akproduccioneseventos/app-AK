# Orden 267 — El total con el ajuste anual, a la vista en el simulador y en el presupuesto (03/11/2026)

**Para Gemini.** Va en la **misma** entrega que la orden 266 (rama `gemini/orden-262-anuncio-al-simulador`). Antes de decir
"terminé", pasá `docs/ANTES-DE-ENTREGAR.md` y usá la skill `celular-primero`.

**Pedido del dueño (03/11/2026):** *"en el simulador y en el presupuesto manual dice al final que es un 15% anual pero no
aparece el total; eso desalienta a la gente, que no entiende el número faltando 4 años"*. Y: *"es 15 anual del total del
presupuesto"*.

## Cómo está hoy

**La cuenta ya existe y es la correcta:** `buildAnnualAdjustmentProjection` (`src/lib/budget/formal-budget.ts:74`). Aplica 15
% acumulado por año sobre el total del presupuesto y da el total de cada año. **No se cambia la cuenta: se muestra.**

1. **Simulador público** (`src/app/simulador-de-presupuesto/page.tsx`):
   - `stats.annualProjection` y `stats.totalProyectado` ya se calculan (`src/lib/simulator/pricing.ts:322,368`);
   - en pantalla sólo hay texto (~2064 y ~3134), **sin el total**.
2. **Presupuesto armado por el equipo** (`src/app/(app)/presupuestos/[id]/ver/page.tsx:~725,753,1325`): la tabla "Proyección
   de Precios por Año" de `BudgetDocument` (`src/components/budget/BudgetDocument.tsx:~638`) se pasa **sólo si está
   contratado** (`isContracted ? annualProjection : undefined`). Un presupuesto nuevo, que es el que mira el prospecto, no
   la muestra.
3. **Armador** (`src/components/presupuestos/paso-4-resumen.tsx:~235`): tampoco le pasa `annualProjection` a
   `BudgetDocument`. En cambio `paso-3-resumen.tsx:186` ya lo calcula.

## Bloque 1 — un recuadro claro con el total del año de la fiesta

Cuando el año de la fiesta es **posterior** al del presupuesto (`annualProjection.applies`), se muestra, cerca del total y
antes de los botones, este recuadro. Con los números reales:

> **Tu fiesta es en {año de la fiesta}.**
> Precio de hoy ({año actual}): **{total de hoy}**
> Total para {año de la fiesta}, con el ajuste del 15% anual sobre el total: **{total del año de la fiesta}**

Y debajo, chiquita, la tabla de años: un renglón por año, con el total de ese año. Es la misma que ya tiene
`BudgetDocument`.

- **En el simulador:** va al final del resultado, al lado del total. El texto suelto de ~2064 se reemplaza por el recuadro.
  La pregunta frecuente de ~3134 queda, pero con el ejemplo del total real.
- **En el presupuesto del equipo:** `ver/page.tsx` pasa `annualProjection` **siempre** que `applies`, no sólo si está
  contratado. Lo mismo en `paso-4-resumen.tsx`. Y que salga igual al imprimir y en el PDF (`BudgetPrintTemplate.tsx`,
  `simulator-budget-pdf.ts`).

**No se toca:**

- la cuenta;
- el 15 %;
- el reloj ni la promoción del simulador;
- el descuento;
- lo que dice el contrato.

**No se promete congelar el precio** ni se dice que pagar antes evita el ajuste.

## Pruebas

**Jest**, en `src/__tests__/el-total-con-ajuste-se-ve.test.tsx`. Con un presupuesto de $100.000 hecho en 2026 para una
fiesta en 2030, `BudgetDocument` sin contratar muestra:

- "Tu fiesta es en 2030";
- **$174.901**: 100.000 × 1,15⁴, redondeado año por año como la función;
- los años 2027 a 2030.

Con una fiesta en 2026 **no** aparece el recuadro.

**Navegador**, en `tests/e2e/el-simulador-muestra-el-total-con-ajuste.spec.ts`: un presupuesto en el simulador para una fecha
de dos años después, a 390 de ancho, muestra "Total para" con un monto mayor que el de hoy.

Corré `npx tsc --noEmit` y `npx jest --silent`, con cero errores. No subas `data/` ni `src/data/`.

```comprobar
usa: totalProyectado en src/app/simulador-de-presupuesto/page.tsx
usa: Tu fiesta es en en src/components/budget/BudgetDocument.tsx
no-usa: isContracted ? annualProjection : undefined en src/app/(app)/presupuestos/[id]/ver/page.tsx
usa: annualProjection en src/components/presupuestos/paso-4-resumen.tsx
prueba: src/__tests__/el-total-con-ajuste-se-ve.test.tsx
prueba: tests/e2e/el-simulador-muestra-el-total-con-ajuste.spec.ts
```
