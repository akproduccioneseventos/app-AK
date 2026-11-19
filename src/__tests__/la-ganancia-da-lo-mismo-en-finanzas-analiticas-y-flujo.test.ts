/** @jest-environment node */
/**
 * La ganancia de un mes da lo MISMO en Analiticas, Flujo de caja y Finanzas (12/10/2026).
 *
 * Antes cada una hacia su cuenta: sumaban solo los renglones manuales, tomaban los sueldos de
 * `eventSalary` a mano, ignoraban catering/bebidas/reposteria y contaban la merma duplicada. Ahora
 * todas salen de `calcularGananciaDeEvento`, la cuenta oficial.
 */
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { calcularGananciaDeEvento } from '@/lib/costos/ganancia-evento';

const hoy = new Date();
const fiesta: any = {
  id: 'f1',
  presupuestoId: 'p-none',
  configuracion: { fechaEvento: format(hoy, 'yyyy-MM-dd'), nombreEvento: 'X', tipoCelebracion: 'Quince' },
  gestionCostos: {
    ingresosTotalesEstimados: 20000,
    costosItems: [
      { id: 'c1', concepto: 'Flores', montoEstimado: 1000 },
      { id: 'auto_merma_bebidas', concepto: 'Merma', montoEstimado: 200 }, // ya viene contada adentro de bebidas
    ],
    others: { totalCateringCost: 5000, totalBebidasCost: 2000, totalReposteriaCost: 0, totalPersonalCost: 3000 },
  },
  pagosProveedores: [{ id: 'pp1', costoAsociadoId: 'c1', monto: 1200 }],
  // un sueldo cargado a mano: desde el 18/11/2026 (C18-01) la cuenta oficial también lo mira, y toma el mayor entre lo
  // sincronizado y lo asignado con sus aportes (9999 + 10% = 10999), igual en todas las pantallas.
  personalAsignado: [{ rolId: 'r1', eventSalary: 9999 }],
};

jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(), requirePermisoAlguno: jest.fn(async () => undefined) }));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: true, user: { perfil: 'dueno' } })) }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: jest.fn(async () => []) }));
jest.mock('@/app/actions/invoices', () => ({ getInvoices: jest.fn(async () => []) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getAllFiestas: jest.fn(async () => [JSON.parse(JSON.stringify(fiesta))]) }));
// Las cuentas del servidor leen los roles por acá (orden 197): mismo dato que el mock de getRoles.
jest.mock('@/lib/roles/leer-roles-interno', () => ({
  leerRolesInterno: () => require('@/app/actions/roles').getRoles(),
}));

jest.mock('@/app/actions/roles', () => ({ getRoles: jest.fn(async () => [{ id: 'r1', porcentajeAportesPatronales: 10 }]) }));
jest.mock('@/app/actions/empleados', () => ({ getEmpleados: jest.fn(async () => []) }));
jest.mock('@/app/actions/notifications', () => ({ checkAndCreateTaskReminders: jest.fn(), checkAndCreateReunionReminders: jest.fn(), getNotifications: jest.fn(async () => []) }));
jest.mock('@/app/actions/crm', () => ({ getCrmLeadsForDashboard: jest.fn(async () => []) }));
jest.mock('@/app/actions/alertas.actions', () => ({ getPrioridadesDescartadas: jest.fn(async () => []) }));

import { getAnalyticsData } from '@/app/actions/analytics';
import { getCashFlowProjection } from '@/app/actions/dashboard';

describe('una misma fiesta, un mismo numero', () => {
  const oficial = calcularGananciaDeEvento(fiesta.gestionCostos, fiesta.pagosProveedores, undefined, fiesta.personalAsignado, [{ id: 'r1', porcentajeAportesPatronales: 10 }]);

  it('la cuenta oficial: pagado donde hay pagos + bloques automaticos, sin la merma duplicada', () => {
    expect(oficial.costoReal).toBe(1200 + 5000 + 2000 + 10999);
    expect(oficial.sinRendir).toBe(5000 + 2000 + 10999);
  });

  it('Analiticas: el costo del mes es el de la cuenta oficial (en el mes y en el tipo de evento)', async () => {
    const r = await getAnalyticsData();
    expect(r.success).toBe(true);
    const mesActual = r.data!.monthlyProfitability[r.data!.monthlyProfitability.length - 1];
    expect(mesActual.costos).toBe(oficial.costoReal);
    // el tipo de evento solo aparece si hay un presupuesto aceptado de ese tipo; si aparece, es el oficial
    for (const t of r.data!.eventTypeProfitability) expect(t.costos).toBe(oficial.costoReal);
  });

  it('Flujo de caja: lo que falta gastar es lo estimado sin ningun pago, el de la cuenta oficial', async () => {
    const r: any = await getCashFlowProjection();
    expect(r.success).toBe(true);
    expect(r.data[0].expenses).toBe(oficial.sinRendir);
  });

  it('Finanzas usa la misma funcion y no su propia suma', () => {
    const fuente = fs.readFileSync(path.join(__dirname, '..', 'components', 'contabilidad', 'panels', 'finanzas.tsx'), 'utf8');
    expect(fuente).toContain('calcularGananciaDeEvento(fiesta.gestionCostos, fiesta.pagosProveedores, pagosCliente, fiesta.personalAsignado).costoReal');
    expect(fuente).not.toContain('montoEstimado ?? 0');
  });
});
