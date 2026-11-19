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

describe('Un cobro no pasa el total ni por un peso', () => {
  it('$1.201 sobre un presupuesto de $1.200 se rechaza; $1.200 entra', () => {
    const { validatePaymentAgainstBudget } = require('@/lib/budget/financial-guardrails');
    const presupuesto = {
      id: 'p1', totalConDescuento: 1200, costoTotalEstimado: 1200, pagosCliente: [],
      itemsPresupuestados: [], estado: 'Aceptado',
    } as any;
    expect(validatePaymentAgainstBudget(presupuesto, 1201).ok).toBe(false);
    expect(validatePaymentAgainstBudget(presupuesto, 1200).ok).toBe(true);
  });
});

describe('Una factura no nace pagada sin cobros', () => {
  it('pagada exige al menos un cobro, y una pagada sin cobros puede volver atrás', () => {
    const fuente = leer('src/app/actions/invoices.ts');
    expect(fuente).toMatch(/totalAmount > 0 && totalPaid > 0 && totalPaid >= totalAmount/);
    expect(fuente).toMatch(/if \(totalPaid > 0 && totalPaid >= roundInvoiceMoney/);
    expect(fuente).toMatch(/facturaActual\.status === 'Paid' && \(facturaActual\.payments \?\? \[\]\)\.length > 0/);
  });
});

describe('Subir un archivo privado no depende de firmar direcciones', () => {
  it('uploadToStorage devuelve una dirección con ficha de descarga, no una firmada', () => {
    const fuente = leer('src/lib/firebase/storage.ts');
    const cuerpo = fuente.slice(fuente.indexOf('export async function uploadToStorage('), fuente.indexOf('export async function uploadToStorageWithDownloadToken('));
    expect(cuerpo).toMatch(/firebaseStorageDownloadTokens: fichaDeDescarga/);
    expect(cuerpo).not.toMatch(/getSignedUrl\(/);
  });
});

describe('La ganancia de la fiesta no toma el precio de venta como costo', () => {
  it('un renglón copiado del presupuesto no suma costo; lo pagado al proveedor sí', () => {
    const { calcularGananciaDeEvento } = require('@/lib/costos/ganancia-evento');
    const gestion = {
      ingresosTotalesEstimados: 1200,
      costosItems: [
        { id: 'sync_budget_srv1', nombre: 'DJ', category: 'Otros', montoEstimado: 1500 },
        { id: 'manual_1', nombre: 'Flete', category: 'Otros', montoEstimado: 100 },
      ],
    } as any;
    const sinPagos = calcularGananciaDeEvento(gestion, []);
    expect(sinPagos.costoReal).toBe(100);
    const conPago = calcularGananciaDeEvento(gestion, [{ id: 'p', costoAsociadoId: 'sync_budget_srv1', monto: 400, fecha: '2026-11-17' }]);
    expect(conPago.costoReal).toBe(500);
  });
});

describe('Auditoría integral 17/11: costo de catálogo, propuestas activas y menú en la lista de compras', () => {
  it('un renglón copiado con costo de catálogo sí cuenta como costo', () => {
    const { calcularGananciaDeEvento } = require('@/lib/costos/ganancia-evento');
    const gestion = {
      ingresosTotalesEstimados: 1200,
      costosItems: [{ id: 'sync_budget_burbujas', nombre: 'Lluvia de burbujas', category: 'Otros', montoEstimado: 600, costoDeCatalogo: true }],
    } as any;
    expect(calcularGananciaDeEvento(gestion, []).costoReal).toBe(600);
  });

  it('la copia del presupuesto usa el costo base del catálogo, no el precio de venta', () => {
    const fuente = leer('src/app/actions/fiesta/fiesta.actions.ts');
    expect(fuente).toMatch(/montoEstimado: tieneCosto \? Math\.round\(costoBase \* unidades\) : 0/);
    expect(fuente).not.toMatch(/montoEstimado: Math\.round\(item\.costoTotalItem\)/);
  });

  it('"Propuestas activas" deja afuera los presupuestos archivados', () => {
    const fuente = leer('src/app/actions/crm.ts');
    expect((fuente.match(/archived \&\& activeLeads\.some/g) || []).length).toBe(2);
  });

  it('la lista de compras suma el menú asignado a la fiesta', () => {
    const fuente = leer('src/components/panels/catering--lista-compras.tsx');
    expect(fuente).toMatch(/fiestaData\.menuAsignadoId/);
  });
});
