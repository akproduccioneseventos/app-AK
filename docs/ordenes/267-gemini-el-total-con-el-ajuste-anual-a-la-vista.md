# Orden 267 — El ajuste anual NO se muestra al prospecto (03/11/2026, corregida)

**Para Gemini.** Va en la **misma** entrega que la orden 266 (rama `gemini/orden-262-anuncio-al-simulador`). **Esta orden
reemplaza la versión anterior que pedía mostrar el total ajustado: es al revés.**

**Decisión del dueño (03/11/2026):** *"no quiero que aparezca; el prospecto ve un número cuatro años después y le parece muy
caro. El 15% va apareciendo en el panel del cliente cuando ya contrató. No va en el presupuesto, ni en el simulador, ni en
el presupuesto manual."*

**El contrato sigue diciendo lo del ajuste** (cláusula 2, `src/types/settings.ts:~208`), igual que la pregunta frecuente del
contrato (`src/data/preguntas-frecuentes-contrato.ts:22`). **Eso no se toca**: el cliente lo lee y lo firma.

## Lo que se saca

1. **Simulador público** (`src/app/simulador-de-presupuesto/page.tsx`): el párrafo "Los valores corresponden a eventos
   realizados en 2026. Para fechas desde 2027 se aplicará un ajuste acumulativo del 15%…" (~2064) y la pregunta "4.
   ¿Cómo aplica el ajuste para eventos en 2027 o 2028?" (~3131-3136). Renumerá las preguntas que siguen.
2. **Simulador AK** (`src/app/simulador-ak/page.tsx:~890`): que no le pase `annualProjection` a `BudgetDocument`.
   `ajusteAnualActivo` y `ajusteAnualPorcentaje` (~392-393, ~680) **siguen guardándose**: son los datos que usa el portal
   después.
3. **`BudgetDocument`** (`src/components/budget/BudgetDocument.tsx:~638-675`): la tabla "Proyección de Precios por Año"
   sale **sólo si el presupuesto está contratado** (`Aceptado` o `Facturado`). Hoy sale con que llegue `annualProjection`.
   Que lo decida el documento, no quien lo llama. Lo mismo en `BudgetPrintTemplate.tsx` y en el PDF del simulador
   (`src/lib/budget/simulator-budget-pdf.ts`): sin ajuste para un presupuesto no contratado.
4. **Búsqueda de textos:** `grep -rn -i "ajuste\|15%"` en lo que ve el prospecto: simulador, `BudgetDocument`, impresión,
   PDF, la portada y las landings. Todo lo que hable del ajuste anual a un prospecto **se saca**. Lo que está en el
   contrato, en las preguntas del contrato y en el portal del cliente **queda**.

**No se toca:**

- la cuenta (`buildAnnualAdjustmentProjection`, `saldo-con-ajuste.ts`);
- el portal del cliente;
- el contrato;
- el reloj ni la promoción del simulador.

## Pruebas

- **Jest**, en `src/__tests__/el-prospecto-no-ve-el-ajuste.test.tsx`:
  - `BudgetDocument` con un presupuesto **no contratado** para 2030 no muestra "Proyección" ni "15%";
  - **contratado**, sí.
- **Navegador**, en `tests/e2e/el-simulador-no-muestra-el-ajuste.spec.ts`: el resultado del simulador para una fecha de dos
  años después **no** contiene "15%" ni "ajuste".

Corré `npx tsc --noEmit` y `npx jest --silent`, con cero errores. No subas `data/` ni `src/data/`.

```comprobar
no-usa: ajuste acumulativo del 15% en src/app/simulador-de-presupuesto/page.tsx
no-usa: annualProjection={priceStats.annualProjection} en src/app/simulador-ak/page.tsx
prueba: src/__tests__/el-prospecto-no-ve-el-ajuste.test.tsx
prueba: tests/e2e/el-simulador-no-muestra-el-ajuste.spec.ts
```
