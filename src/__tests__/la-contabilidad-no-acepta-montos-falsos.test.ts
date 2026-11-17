/** @jest-environment node */
/**
 * Auditoría contable del 17/11/2026 (pedido del dueño: "la contabilidad tiene que estar perfecta").
 * Cada caso se puso en rojo con el arreglo sacado.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getPortalPaymentSummary } from '@/lib/client-portal/client-portal-summary';
import { calculateBudgetFinancials } from '@/lib/budget/financial-guardrails';
import { recalcularCostoItem } from '@/lib/calculations';

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

describe('El portal no muestra como "en revisión" un pago que AK rechazó', () => {
  it('un pago rechazado no cuenta como pendiente ni como cobrado', () => {
    const resumen = getPortalPaymentSummary({
      total: 100000,
      payments: [
        { monto: 30000, estadoPago: 'confirmado' },
        { monto: 20000, estadoPago: 'rechazado' },
      ] as any,
    });
    expect(resumen.paid).toBe(30000);
    expect(resumen.pendingReviewCount).toBe(0);
    expect(resumen.pendingReviewAmount).toBe(0);
    expect(resumen.balance).toBe(70000);
  });

  it('un pago pendiente sí sigue en revisión', () => {
    const resumen = getPortalPaymentSummary({
      total: 100000,
      payments: [{ monto: 20000, estadoPago: 'pendiente_confirmacion' }] as any,
    });
    expect(resumen.pendingReviewCount).toBe(1);
  });
});

describe('Lo que la pantalla del presupuesto muestra es lo que se guarda', () => {
  it('con cantidad entera y precio positivo, el renglón de la pantalla coincide con el guardado', () => {
    const item = {
      idServicioCatalogo: 's1', nombreServicio: 'Fijo', calculationMethod: 'fijo',
      cantidad: 3, precioUnitario: 5000, precioUnitarioPresupuesto: 5000, costoTotalItem: 0,
    } as any;
    const enPantalla = recalcularCostoItem(item, 100, 0, 0);
    const guardado = calculateBudgetFinancials({ itemsPresupuestados: [item], invitadosAdultos: 100 } as any);
    expect(guardado.items[0].costoTotalItem).toBe(enPantalla);
    expect(enPantalla).toBe(15000);
  });

  it('la pantalla redondea la cantidad y no acepta negativos, igual que el guardado', () => {
    const fuente = leer('src/components/presupuestos/paso-3-resumen.tsx');
    expect(fuente).toMatch(/Math\.max\(0, Math\.round\(num\)\)/);
  });
});

describe('Importes en cero que no pueden pasar', () => {
  it('un pago a proveedor de $0 se rechaza', () => {
    const fuente = leer('src/app/actions/fiesta/pagos.actions.ts');
    expect(fuente).toMatch(/Number\(pago\.monto\) <= 0/);
  });

  it('un recibo de sueldo pagado con monto en cero se rechaza', () => {
    const fuente = leer('src/app/actions/recibos-personal.ts');
    expect(fuente).toMatch(/Un recibo pagado tiene que tener un monto mayor a cero/);
  });
});

describe('El tablero ejecutivo no inventa promedio ni margen', () => {
  it('el promedio se divide por las ventas del período y el margen sin costos no da 100%', () => {
    const fuente = leer('src/app/actions/analytics.ts');
    expect(fuente).toMatch(/Math\.round\(totalRevenue \/ ventasEnElPeriodo\)/);
    expect(fuente).not.toMatch(/totalRevenue \/ totalEventosRealizados/);
    expect(fuente).toMatch(/totalCosts > 0 \? Math\.round/);
  });
});
