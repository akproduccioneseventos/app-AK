/** @jest-environment node */

import fs from 'fs';
import path from 'path';

let sesionActual = { success: true, user: { userId: 'dueno-1', email: 'dueno@ak.test', perfil: 'dueno' } };

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => sesionActual),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => sesionActual.user),
  requirePermisoAlguno: jest.fn(async () => undefined),
}));

jest.mock('@/app/actions/invoices', () => ({
  getInvoices: jest.fn(async () => []),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn(async () => []),
}));

jest.mock('@/app/actions/gastos', () => ({
  getGastosGenerales: jest.fn(async () => []),
}));

const fiestasMock: any[] = [];
const rolesMock: any[] = [];

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn(async () => fiestasMock),
}));

jest.mock('@/lib/roles/leer-roles-interno', () => ({
  leerRolesInterno: jest.fn(async () => rolesMock),
}));

import { resolverSueldoDelRol } from '@/lib/fiesta/sueldo-del-rol';
import { calculateSalaryBreakdown } from '@/lib/personal/desglose-recibo';
import { getProfitAndLossData } from '@/app/actions/reportes';

describe('Orden 370 B6.1: el sueldo del rol se lee igual en recibos, reportes y costos', () => {
  beforeEach(() => {
    fiestasMock.length = 0;
    rolesMock.length = 0;
  });

  it('resolverSueldoDelRol prioriza eventSalary, luego sueldo y por último el base del rol', () => {
    expect(resolverSueldoDelRol({ eventSalary: 5200, sueldo: 4000 }, { sueldoPorEvento: 3000 })).toBe(5200);
    expect(resolverSueldoDelRol({ eventSalary: 0, sueldo: 4100 }, { sueldoPorEvento: 3000 })).toBe(4100);
    expect(resolverSueldoDelRol({ eventSalary: 0 }, { sueldoPorEvento: 3500 })).toBe(3500);
    expect(resolverSueldoDelRol(null, { sueldoPorEvento: 2800 })).toBe(2800);
    expect(resolverSueldoDelRol({ eventSalary: 0 }, null)).toBe(0);
  });

  it('calculateSalaryBreakdown desglosa sobre el sueldo resuelto con resolverSueldoDelRol', () => {
    const rol = {
      id: 'rol-dj',
      nombre: 'DJ',
      sueldoPorEvento: 6000,
      porcentajeSalarioVacacional: 10,
      porcentajeAguinaldo: 10,
      porcentajeAportesPatronales: 20,
    };
    const sueldoResuelto = resolverSueldoDelRol({ eventSalary: 0 }, rol);
    const breakdown = calculateSalaryBreakdown(sueldoResuelto, rol);

    expect(sueldoResuelto).toBe(6000);
    expect(breakdown.base + breakdown.vacacional + breakdown.aguinaldo).toBe(6000);
    expect(breakdown.base).toBe(5000);
    expect(breakdown.vacacional).toBe(500);
    expect(breakdown.aguinaldo).toBe(500);
  });

  it('getProfitAndLossData calcula el costo pendiente del personal con el sueldo resuelto del rol', async () => {
    rolesMock.push({
      id: 'rol-mozo',
      nombre: 'Mozo',
      sueldoPorEvento: 4000,
      porcentajeAportesPatronales: 25,
    });
    fiestasMock.push({
      id: 'fiesta-sueldo-1',
      estado: 'Contratada',
      configuracion: {
        nombreEvento: 'Cumple de Prueba',
        fechaEvento: '2026-10-15',
      },
      personalAsignado: [
        { empleadoId: 'emp-1', rolId: 'rol-mozo', eventSalary: 0 },
      ],
      pagosProveedores: [],
      gestionCostos: { costosItems: [], others: {} },
    });

    const res = await getProfitAndLossData({
      from: new Date('2026-10-01T00:00:00.000Z'),
      to: new Date('2026-10-31T23:59:59.999Z'),
    });

    expect(res.success).toBe(true);
    // 4000 (sueldo base del rol) + 25% aportes (1000) = 5000
    expect(res.data?.costos.total).toBe(5000);
  });

  it('personal--recibos.tsx y reportes.ts usan resolverSueldoDelRol, y empleados--reporte.tsx no usa eventSalary directo', () => {
    const recibosCode = fs.readFileSync(
      path.join(process.cwd(), 'src', 'components', 'panels', 'personal--recibos.tsx'),
      'utf-8',
    );
    const reportesCode = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'actions', 'reportes.ts'),
      'utf-8',
    );
    const reporteEmpleadosCode = fs.readFileSync(
      path.join(process.cwd(), 'src', 'components', 'panels', 'empleados--reporte.tsx'),
      'utf-8',
    );

    expect(recibosCode).toContain('resolverSueldoDelRol');
    expect(reportesCode).toContain('resolverSueldoDelRol');
    expect(reporteEmpleadosCode).not.toContain('Number(asignacion.eventSalary || 0)');
    expect(reporteEmpleadosCode).toContain('esReciboCobrado');
  });
});
