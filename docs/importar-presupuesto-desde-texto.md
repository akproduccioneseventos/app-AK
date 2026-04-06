# Importar Presupuesto desde Texto y Crear Fiesta/Evento

## Descripción

Nueva funcionalidad que permite convertir un presupuesto en formato de texto (copiado del sistema AK Producciones) en un `Presupuesto` y/o `Fiesta/Evento` guardados en la base de datos, sin necesidad de cargarlo manualmente campo por campo.

---

## Flujo de uso

### Opción A — Importar desde texto (flujo completo)

1. Ir a **Central de Presupuestos** → clic en **"Importar desde Texto"**
   - Ruta: `/presupuestos/importar`
   - O directo desde el menú de presupuestos

2. Pegar el texto del presupuesto en el área de texto.
   - Para probar con el caso Vana Rodríguez, clic en **"Cargar ejemplo (Vana Rodríguez)"**.

3. Clic en **"Analizar Texto"** para que el parser detecte automáticamente:
   - Nombre del cliente
   - Fecha del evento
   - Tipo de evento
   - Ítems con cantidad, precio unitario e importe
   - Total declarado
   - Condición de seña (porcentaje)

4. Revisar los datos detectados en el panel de preview:
   - **Ajustar la fecha**: si la fecha fue detectada como "Mayo 2026" sin día, podés escribir la fecha exacta (ej: 2026-05-09).
   - **Seña manual**: si querés usar un monto distinto al porcentaje automático (ej: $5.000 UYU del contrato).

5. Activar o desactivar el toggle **"Crear Fiesta/Evento automáticamente"** (activo por defecto).

6. Clic en **"Crear Presupuesto + Fiesta"** (o "Crear Presupuesto" si el toggle está desactivado).

7. Al guardar con éxito, el sistema te redirige:
   - Con fiesta: a la página de planificación del evento (`/fiestas/nueva?fiestaId=...`)
   - Sin fiesta: a la vista del presupuesto (`/presupuestos/{id}/ver`)

---

### Opción B — Crear Fiesta desde un Presupuesto existente

1. Ir a la vista de un presupuesto existente (`/presupuestos/{id}/ver`).
2. En el menú de botones superiores, clic en **"Crear Fiesta/Evento"** (botón violeta).
3. Si ya existe una fiesta vinculada, el botón cambia a **"Ver Fiesta/Evento"**.

---

## Formato de texto soportado

```
PRESUPUESTO PARA FIESTAS O EVENTOS - AK PRODUCCIONES

Cliente: Vana Rodríguez
Fecha del evento: Mayo 2026
Validez: 30 días
Condición: Para asegurar el presupuesto debe abonar el 20% del total como seña.

DETALLE DE ARTÍCULOS

Mozos
Cantidad: 6
Precio unitario: $2.900
Descuento: 15%
Importe: $17.400

...

IMPORTE TOTAL: $338.300
```

### Reglas del parser
- El cliente se detecta con la línea `Cliente: ...`
- La fecha del evento con `Fecha del evento: ...` (soporta "Mayo 2026" y "09/05/26")
- Los ítems se detectan después de `DETALLE DE ARTÍCULOS`
- Cada ítem tiene cuatro líneas: nombre, `Cantidad:`, `Precio unitario:`, `Descuento:`, `Importe:`
- Los ítems con `Descuento: 100%` se marcan como `esRegalo: true` (importe $0)
- El total se lee de `IMPORTE TOTAL: ...`

---

## Datos del caso Vana Rodríguez

| Campo | Valor |
|-------|-------|
| Cliente | Vana Rodríguez |
| Fecha del evento | 09/05/2026 (Mayo 2026 en el texto; contrato: 09/05/26) |
| Total | $338.300 |
| Seña (20%) | $67.660 |
| Saldo | $270.640 |
| Invitados estimados | 150 |
| Ítems | 34 (27 pagos + 7 bonificados) |

### Fixture para QA rápido

```typescript
import { VANA_PRESUPUESTO_FIXTURE, VANA_FIESTA_FIXTURE } from '@/data/seeds/vana-rodriguez-fixture';
import { savePresupuesto } from '@/app/actions/presupuestos';
import { saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { initialFiestaActualData } from '@/lib/fiesta-defaults';

await savePresupuesto(VANA_PRESUPUESTO_FIXTURE);
await saveFiesta({ ...initialFiestaActualData, ...VANA_FIESTA_FIXTURE });
```

---

## Archivos modificados / creados

| Archivo | Cambio |
|---------|--------|
| `src/lib/parse-budget-text.ts` | **NUEVO** — Utilidad para parsear texto de presupuesto |
| `src/app/actions/presupuestos.ts` | **MODIFICADO** — Agregados `importarPresupuestoDesdeTexto` y `createFiestaFromPresupuesto` |
| `src/app/presupuestos/importar/page.tsx` | **NUEVO** — Página de importación con preview y toggles |
| `src/app/presupuestos/nuevo/page.tsx` | **MODIFICADO** — Botón "Importar desde Texto" en el dashboard |
| `src/app/presupuestos/[id]/ver/page.tsx` | **MODIFICADO** — Botón "Crear Fiesta/Evento" / "Ver Fiesta/Evento" |
| `src/data/seeds/vana-rodriguez-fixture.ts` | **NUEVO** — Fixture con datos completos de Vana Rodríguez |

---

## Atributos data-testid para E2E

| Selector | Elemento |
|----------|----------|
| `[data-testid="btn-importar-presupuesto"]` | Botón "Importar desde Texto" en el dashboard |
| `[data-testid="import-budget-textarea"]` | Textarea para pegar el texto |
| `[data-testid="btn-parse-text"]` | Botón "Analizar Texto" |
| `[data-testid="btn-load-fixture"]` | Botón "Cargar ejemplo (Vana Rodríguez)" |
| `[data-testid="parsed-preview"]` | Contenedor del preview parseado |
| `[data-testid="parsed-cliente"]` | Nombre del cliente detectado |
| `[data-testid="parsed-tipo"]` | Tipo de evento detectado |
| `[data-testid="parsed-invitados"]` | Cantidad de invitados detectada |
| `[data-testid="parsed-items-count"]` | Cantidad de ítems detectados |
| `[data-testid="parsed-total"]` | Total formateado |
| `[data-testid="parsed-sena"]` | Seña calculada |
| `[data-testid="parsed-saldo"]` | Saldo calculado |
| `[data-testid="input-fecha-evento"]` | Input de fecha ajustable |
| `[data-testid="input-sena-manual"]` | Input de seña manual |
| `[data-testid="switch-crear-fiesta"]` | Toggle "Crear Fiesta automáticamente" |
| `[data-testid="parsed-items-list"]` | Lista de ítems parseados |
| `[data-testid="btn-importar-guardar"]` | Botón final "Crear Presupuesto + Fiesta" |
| `[data-testid="btn-crear-fiesta-from-budget"]` | Botón en vista de presupuesto |
| `[data-testid="btn-ver-fiesta"]` | Botón "Ver Fiesta/Evento" (cuando ya existe) |
