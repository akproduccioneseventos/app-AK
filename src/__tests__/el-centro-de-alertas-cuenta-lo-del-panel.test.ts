jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ userId: 'u_duenio', role: 'admin' })),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn(async () => []),
}));

jest.mock('@/app/actions/activos-fijos', () => ({
  getActivosFijos: jest.fn(async () => []),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => []),
  writeData: jest.fn(async () => undefined),
}));

jest.mock('@/app/actions/dashboard', () => ({
  getDashboardKpiData: jest.fn(async () => ({
    success: true,
    data: {
      alerts: [
        {
          id: 'budget_balance_p1',
          type: 'budget_balance',
          severity: 'high',
          title: 'Saldo pendiente en presupuesto aceptado',
          description: 'Falta cobrar $15.000 de Ana García',
          href: '/presupuestos/p1',
        },
      ],
    },
  })),
}));

import { getAlertasGlobalesConLeidas, getAlertasNoLeidas } from '@/app/actions/alertas.actions';

describe('Orden 317 Bloque 1: el Centro de Alertas cuenta lo del panel', () => {
  it('incluye budget_balance_* en getAlertasGlobalesConLeidas y coincide con el contador del menú', async () => {
    const todas = await getAlertasGlobalesConLeidas();
    const noLeidas = await getAlertasNoLeidas();

    expect(todas.some((a) => a.id === 'budget_balance_p1')).toBe(true);
    expect(noLeidas.length).toBe(todas.length);
  });
});
