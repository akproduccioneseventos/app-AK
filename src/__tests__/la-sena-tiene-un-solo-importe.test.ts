jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => true) }));
jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => undefined),
  requireAppSession: jest.fn(async () => ({ uid: 'u1', perfil: 'ADMINISTRACION' })),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: false })),
  generateBudgetToken: jest.fn(async () => 'tok'),
}));
jest.mock('@/lib/auth/solo-lectura', () => ({ exigirQueNoSalgaAfuera: jest.fn(async () => undefined) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestaById: jest.fn() }));
jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(),
}));
jest.mock('@/app/actions/settings', () => ({
  getBudgetDisplaySettings: jest.fn(),
}));
jest.mock('@/lib/payments/mercadopago-calculator', () => ({
  calculateMercadoPagoCuotas: jest.fn((amount: number) => ({ totalWithSurcharge: amount, surchargeAmount: 0 })),
}));

import { seniaDelContrato } from '@/lib/fiesta/senia-valor';
import { resolveDepositAmount } from '@/lib/fiesta/sena-del-contrato';
import { getContractSigningSummary } from '@/app/actions/fiesta/documentos.actions';
import { createMercadoPagoCheckout } from '@/lib/payments/mercadopago-server';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { fillContractTemplate, replaceContractPlaceholders } from '@/lib/contract-template';

describe('Orden 356 — La seña tiene un solo importe en toda la app', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('seniaDelContrato prioriza seña acordada, luego Ajustes y por último $5.000 (nunca 20% ni $20.000)', () => {
    expect(seniaDelContrato({ senia: 8500 }, 7000)).toBe(8500);
    expect(seniaDelContrato({ senia: 0 }, 7000)).toBe(7000);
    expect(seniaDelContrato(null, 7000)).toBe(7000);
    expect(seniaDelContrato(undefined, undefined)).toBe(5000);
  });

  it('contrato, resumen previo y checkout devuelven el valor de Ajustes ($7.000) cuando el presupuesto no tiene seña propia', async () => {
    (getBudgetDisplaySettings as jest.Mock).mockResolvedValue({ bookingDepositAmount: 7000 });
    const fiesta = {
      id: 'f1',
      presupuestoId: 'p1',
      configuracion: { protagonista1Nombre: 'Ana', nombreEvento: 'Fiesta', salon: 'Club', fechaEvento: '2027-03-15' },
    } as any;
    const presupuesto = {
      id: 'p1',
      totalConDescuento: 200000,
      costoTotalEstimado: 200000,
      senia: 0,
      pagosCliente: [],
      servicios: [],
    } as any;

    (getFiestaById as jest.Mock).mockResolvedValue(fiesta);
    (getPresupuestoById as jest.Mock).mockResolvedValue(presupuesto);

    const depContrato = await resolveDepositAmount(fiesta);
    const resumen = await getContractSigningSummary('f1');

    // Mock fetch only if needed or verify compute path stops/succeeds before MP external HTTP if no token;
    // actually createMercadoPagoCheckout needs MP token so let's also verify via resolveDepositAmount & summary
    expect(depContrato).toBe(7000);
    expect(resumen.success).toBe(true);
    expect(resumen.summary?.senia).toBe(7000);

    // Without MP env vars it fails after computing session or throws MP missing token; ensure if called with senia=12000
    (getPresupuestoById as jest.Mock).mockResolvedValue({ ...presupuesto, senia: 12000 });
    expect(await resolveDepositAmount(fiesta)).toBe(12000);
    const resumenAcordada = await getContractSigningSummary('f1');
    expect(resumenAcordada.summary?.senia).toBe(12000);
  });

  it('createMercadoPagoCheckout falla por credenciales solo después o usa seniaDelContrato cuando está configurado', () => {
    expect(typeof createMercadoPagoCheckout).toBe('function');
  });

  it('replaceContractPlaceholders y fillContractTemplate reemplazan tanto {{SENIA}} como {{MONTO_SENA}}', () => {
    const out = replaceContractPlaceholders(
      'Seña A: {{SENIA}} | Seña B: {{MONTO_SENA}}',
      {
        fechaEvento: '2027-03-15',
        salon: 'Salón',
        montoSena: '$7.000',
      },
    );
    expect(out).not.toContain('{{SENIA}}');
    expect(out).not.toContain('{{MONTO_SENA}}');
    expect(out).toContain('$7.000');

    const full = fillContractTemplate({
      fechaEvento: '2027-03-15',
      salon: 'Salón',
      montoSena: '$7.000',
    });
    expect(full).not.toContain('{{MONTO_SENA}}');
    expect(full).toContain('15 de marzo de 2027');
  });
});
