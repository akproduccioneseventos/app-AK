/** @jest-environment node */

jest.mock('server-only', () => ({}));

const mockReadData = jest.fn();
const mockWriteData = jest.fn();
const mockCreateDataItem = jest.fn();

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  writeData: (...args: any[]) => mockWriteData(...args),
  createDataItem: (...args: any[]) => mockCreateDataItem(...args),
  mutateDataItem: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { perfil: 'dueno' } })),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { perfil: 'dueno' } })),
}));

const mockGetWhatsAppSettings = jest.fn();
const mockGetWhatsAppTemplates = jest.fn();
jest.mock('@/app/actions/settings', () => ({
  getWhatsAppSettings: (...args: any[]) => mockGetWhatsAppSettings(...args),
  getWhatsAppTemplates: (...args: any[]) => mockGetWhatsAppTemplates(...args),
}));

import { leerFacturasSinGuardia } from '@/lib/invoices/leer-facturas';
import { esLecturaFallida, marcarLecturaFallida } from '@/lib/marca-de-lectura';
import { ejecutarEscaneoDeRecordatorios } from '@/app/actions/invoices';
import { triggerWhatsAppAutomation } from '@/lib/whatsapp-automation-engine';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';

describe('Orden 369 B6 — Recordatorios de pago con lecturas fallidas y sin duplicados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
  });

  afterAll(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
  });

  it('leerFacturasSinGuardia conserva la marca esLecturaFallida en la copia devuelta', async () => {
    mockReadData.mockResolvedValueOnce(marcarLecturaFallida([{ id: 'inv_1' }], 'timeout'));
    const res = await leerFacturasSinGuardia();
    expect(esLecturaFallida(res)).toBe(true);
  });

  it('ejecutarEscaneoDeRecordatorios devuelve success: false y no programa avisos si facturas o mensajes vienen fallidos', async () => {
    // Caso 1: mensajes programados con lectura fallida
    mockReadData.mockImplementation(async (file: string) => {
      if (file === 'invoices.json') {
        return [{
          id: 'inv_1',
          customer: { id: 'c1', name: 'Ana', phone: '099123456' },
          dueDate: '2020-01-01',
          totalAmount: 1000,
          payments: [],
          status: 'Sent',
        }];
      }
      if (file === 'scheduled-messages.json') {
        return marcarLecturaFallida([], 'base caida');
      }
      return [];
    });

    const r1 = await ejecutarEscaneoDeRecordatorios(WHATSAPP_AUTOMATION_INTERNAL_TOKEN);
    expect(r1.success).toBe(false);
    expect(r1.triggeredCount).toBe(0);
    expect(mockWriteData).not.toHaveBeenCalled();

    // Caso 2: facturas con lectura fallida
    mockReadData.mockImplementation(async (file: string) => {
      if (file === 'invoices.json') {
        return marcarLecturaFallida([], 'base caida');
      }
      if (file === 'scheduled-messages.json') {
        return [];
      }
      return [];
    });

    const r2 = await ejecutarEscaneoDeRecordatorios(WHATSAPP_AUTOMATION_INTERNAL_TOKEN);
    expect(r2.success).toBe(false);
    expect(r2.triggeredCount).toBe(0);
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  it('dos escaneos seguidos generan el mismo id determinístico por factura y no duplican el aviso', async () => {
    const store: Record<string, any[]> = {
      'scheduled-messages.json': [],
    };

    mockReadData.mockImplementation(async (file: string, def: any) => store[file] ?? def);
    mockWriteData.mockImplementation(async (file: string, data: any) => {
      store[file] = data;
    });

    mockGetWhatsAppSettings.mockResolvedValue({
      enabled: true,
      paymentReminderTemplate: 'Hola {{NOMBRE}}, tenés un saldo de {{SALDO}}.',
      reminderMessageTemplate: '',
      automationRules: [
        {
          id: 'regla_vencido',
          name: 'Pago vencido',
          trigger: 'pago_vencido',
          delayHours: 0,
          templateType: 'pago_vencido',
          enabled: true,
          targetType: 'cliente',
        },
      ],
    });
    mockGetWhatsAppTemplates.mockResolvedValue({
      welcomeTemplate: '',
      budgetShareTemplate: '',
      contractShareTemplate: '',
    });

    const ctx = {
      targetId: 'cli_1',
      targetName: 'Ana',
      targetType: 'cliente' as const,
      targetPhone: '099123456',
      invoiceId: 'inv_99',
      dueDate: '2026-10-01',
      nombre: 'Ana',
      saldo: 'UYU 10000',
      fecha: '2026-10-01',
    };

    const primero = await triggerWhatsAppAutomation('pago_vencido', ctx, WHATSAPP_AUTOMATION_INTERNAL_TOKEN);
    const segundo = await triggerWhatsAppAutomation('pago_vencido', ctx, WHATSAPP_AUTOMATION_INTERNAL_TOKEN);

    expect(primero.scheduled).toBe(1);
    expect(segundo.scheduled).toBe(0);
    expect(store['scheduled-messages.json']).toHaveLength(1);
    expect(store['scheduled-messages.json'][0].id).toContain('inv_99');
    expect(store['scheduled-messages.json'][0].id).toContain('2026-10-01');
  });
});
