/**
 * @jest-environment node
 */

const mockWriteSessionCookie = jest.fn();

jest.mock('@/lib/auth/session-token', () => {
  const actual = jest.requireActual('@/lib/auth/session-token');
  return {
    ...actual,
    writeSessionCookie: (...args: unknown[]) => mockWriteSessionCookie(...args),
  };
});

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: null,
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn().mockResolvedValue({ success: true }),
}));

import fs from 'fs';
import path from 'path';
import { loginUser } from '@/app/actions/auth';
import { getPublicSimulatorBootstrap } from '@/app/actions/public-simulator-bootstrap';
import { generateBudgetAndLeadFromSimulator } from '@/app/actions/armado-rapido';
import { buildPresupuestoNarrative } from '@/lib/budget/budget-narrative';
import { getBudgetCollectibleTotal, getBudgetPaymentSummary } from '@/lib/budget/financial-guardrails';
import type { Presupuesto } from '@/types/presupuesto';

describe('Recorrido completo: Acceso, Panel, Simulador y Presupuesto Formal (P3)', () => {
  const filesToPreserve = [
    'data/crm-leads.json',
    'data/notifications.json',
    'data/presupuestos.json',
    'src/data/crm-leads.json',
    'src/data/notifications.json',
    'src/data/presupuestos.json',
  ];
  const fileSnapshots = new Map<string, string | null>();

  beforeAll(() => {
    for (const relPath of filesToPreserve) {
      const fullPath = path.join(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        fileSnapshots.set(relPath, fs.readFileSync(fullPath, 'utf8'));
      } else {
        fileSnapshots.set(relPath, null);
      }
    }
  });

  afterAll(() => {
    for (const [relPath, content] of fileSnapshots.entries()) {
      const fullPath = path.join(process.cwd(), relPath);
      if (content !== null) {
        fs.writeFileSync(fullPath, content, 'utf8');
      } else if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.APP_PASSWORD = 'SOydocenTE2124.';
    process.env.NEXT_PUBLIC_AUTH_ALLOWED_EMAILS = 'akproduccionessalto@gmail.com';
    process.env.AK_SESSION_SECRET = 'clave-secreta-para-tests-de-recorrido-simulador';
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    process.env.AK_ALLOW_LOCAL_JSON_WRITES = 'true';
    process.env.USE_FIREBASE_DATA = 'false';
    mockWriteSessionCookie.mockResolvedValue(undefined);
  });

  it('1. Permite el ingreso administrativo y emite sesion segura para el dueno', async () => {
    const loginResult = await loginUser('akproduccionessalto@gmail.com', 'SOydocenTE2124.');
    expect(loginResult.success).toBe(true);
    expect(loginResult.user?.role).toBe('admin');
    expect(mockWriteSessionCookie).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'akproduccionessalto@gmail.com',
        role: 'admin',
        perfil: 'dueno',
      })
    );
  });

  it('2. El bootstrap del simulador carga catalogo, menus y configuracion sin fallar', async () => {
    const bootstrap = await getPublicSimulatorBootstrap();
    expect(bootstrap).toBeDefined();
    expect(Array.isArray(bootstrap.services)).toBe(true);
    expect(Array.isArray(bootstrap.menus)).toBe(true);
    expect(bootstrap.config).toBeDefined();
    expect(bootstrap.budgetSettings).toBeDefined();
  });

  it('3. Genera un presupuesto y permite armar el documento formal para PDF', async () => {
    const bootstrap = await getPublicSimulatorBootstrap();
    const service1 = bootstrap.services[0] || { id: 'serv_hielo', nombre: '20 kilos de Hielo', categoria: 'barras' };

    const simuladorData = {
      clienteNombre: 'Cliente Prueba Recorrido',
      clienteContacto: '099123456',
      eventoTipo: 'Boda',
      eventoFecha: '2026-11-20',
      adultos: 100,
      adolescentes: 0,
      ninos: 0,
      invitados: 100,
      duracionHoras: 5,
      totalPresupuesto: 150000,
      marketingConsent: true,
      selectedServiceIds: [service1.id],
      items: [
        {
          servicioId: service1.id,
          nombre: service1.nombre,
          categoria: (service1 as any).categoria || 'general',
          cantidad: 1,
          precioUnitario: 5000,
          precioTotal: 5000,
        },
      ],
    };

    const resultado = await generateBudgetAndLeadFromSimulator(simuladorData as any, {
      source: 'simulator',
      eventoTipo: 'Boda',
      salonFiestas: 'Club Uruguay',
    });

    expect(resultado.success).toBe(true);
    expect(resultado.presupuestoId).toBeDefined();
    expect(resultado.token).toBeDefined();
    expect(resultado.presupuesto).toBeDefined();

    // Verificacion de la estructura formal del presupuesto devuelto para impresion / PDF
    const presupuestoGenerado = resultado.presupuesto!;

    // 1. Calculo formal y saldo cobrable
    const totalCobrable = getBudgetCollectibleTotal(presupuestoGenerado);
    expect(totalCobrable).toBe(presupuestoGenerado.totalConDescuento);
    expect(totalCobrable).toBeGreaterThan(0);

    const summary = getBudgetPaymentSummary(presupuestoGenerado);
    expect(summary.total).toBe(presupuestoGenerado.totalConDescuento);
    expect(summary.balance).toBe(presupuestoGenerado.totalConDescuento);

    // 2. Narrativa formal generada para el documento PDF
    const narrative = buildPresupuestoNarrative(presupuestoGenerado);
    expect(typeof narrative).toBe('string');
    expect(narrative.length).toBeGreaterThan(20);
    expect(narrative.toLowerCase()).toContain('boda');
    expect(narrative).toContain('Club Uruguay');
  });
});
