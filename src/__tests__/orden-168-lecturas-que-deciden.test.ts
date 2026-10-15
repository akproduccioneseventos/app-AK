/**
 * @jest-environment node
 *
 * Orden 168 - Bloque 1: Lecturas que deciden plata o permisos.
 * Con la lectura rechazada:
 * 1. El prospecto firmado NO se borra (CRM).
 * 2. No se preparan avisos de cobro si falla leer mensajes programados (Invoices).
 * 3. La recuperación de clave no avanza si la base no contesta (SimpleAuth).
 * Con la lectura bien, todo se comporta normalmente.
 */

// --- Mocks para permisos y sesión ---
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { role: 'admin' } }),
  writeRecoveredAdminSession: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/auth/require-session', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { role: 'admin' } }),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: { role: 'admin' } }),
  requirePermisoAlguno: jest.fn().mockResolvedValue({ ok: true, user: { role: 'admin' } }),
  sesionConPermiso: jest.fn().mockResolvedValue({ success: true, user: { role: 'admin' } }),
}));

// --- Mock de data-service ---
const mockReadData = jest.fn();
const mockWriteData = jest.fn();
const mockMutateDataItem = jest.fn();
const mockDeleteDataItem = jest.fn();
jest.mock('@/lib/data-service', () => ({
  readData: (...args: unknown[]) => mockReadData(...args),
  writeData: (...args: unknown[]) => mockWriteData(...args),
  mutateDataItem: (...args: unknown[]) => mockMutateDataItem(...args),
  deleteDataItem: (...args: unknown[]) => mockDeleteDataItem(...args),
}));

// --- Mock de firebase server ---
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: (...args: unknown[]) => mockGetDoc(...args),
        update: (...args: unknown[]) => mockUpdateDoc(...args),
        set: jest.fn().mockResolvedValue(undefined),
      })),
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
        })),
      })),
    })),
  },
  verifyIdToken: jest.fn(),
}));

// --- Mock de firebase-sync ---
jest.mock('@/lib/firebase-sync', () => ({
  forceDeleteDocFromFirestore: jest.fn().mockResolvedValue(undefined),
}));

// --- Mock de WhatsApp automation y programados ---
const mockGetScheduledMessages = jest.fn();
const mockTriggerWhatsAppAutomation = jest.fn();
jest.mock('@/app/actions/scheduled-messages', () => ({
  getScheduledMessages: (...args: unknown[]) => mockGetScheduledMessages(...args),
}));
jest.mock('@/lib/whatsapp-automation-engine', () => ({
  triggerWhatsAppAutomation: (...args: unknown[]) => mockTriggerWhatsAppAutomation(...args),
}));
jest.mock('@/lib/whatsapp/internal-token', () => ({
  WHATSAPP_AUTOMATION_INTERNAL_TOKEN: Symbol('test-token'),
}));

// Imports de las acciones
import { deleteCrmLead } from '@/app/actions/crm';
import { ejecutarEscaneoDeRecordatorios } from '@/app/actions/invoices';
import {
  verifyResetCode,
  resetPasswordWithCode,
  resetPasswordWithSecurityAnswers,
  resetPasswordWithRecoveryCode,
} from '@/app/actions/simple-auth';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Orden 168 - Bloque 1: CRM deleteCrmLead', () => {
  const leadConPresupuesto = {
    id: 'lead_123',
    name: 'Juan Perez',
    presupuestoId: 'presu_456',
    status: 'Negociacion',
  };

  test('con la lectura rechazada de presupuestos.json, el prospecto firmado NO se borra y devuelve error', async () => {
    mockReadData.mockImplementation(async (file: string) => {
      if (file === 'crm-leads.json' || file.includes('crm-leads') || file.includes('leads')) {
        return [leadConPresupuesto];
      }
      if (file === 'presupuestos.json' || file.includes('presupuestos')) {
        throw new Error('Falla de lectura de disco/base');
      }
      return [];
    });

    const resultado = await deleteCrmLead('lead_123');

    expect(resultado.success).toBe(false);
    expect(resultado.error).toBe('No pudimos comprobar si este prospecto ya firmó. Probá de nuevo.');
    expect(mockDeleteDataItem).not.toHaveBeenCalled();
  });

  test('con lectura exitosa y presupuesto aceptado/firmado, NO se borra', async () => {
    mockReadData.mockImplementation(async (file: string) => {
      if (file === 'crm-leads.json' || file.includes('crm-leads') || file.includes('leads')) {
        return [leadConPresupuesto];
      }
      if (file === 'presupuestos.json' || file.includes('presupuestos')) {
        return [{ id: 'presu_456', numero: 'P-100', estado: 'Aceptado' }];
      }
      return [];
    });

    const resultado = await deleteCrmLead('lead_123');

    expect(resultado.success).toBe(false);
    expect(resultado.error).toMatch(/No se puede borrar: este prospecto tiene el presupuesto/);
    expect(mockDeleteDataItem).not.toHaveBeenCalled();
  });

  test('con lectura exitosa y sin presupuesto firmado, se borra correctamente', async () => {
    mockReadData.mockImplementation(async (file: string) => {
      if (file === 'crm-leads.json' || file.includes('crm-leads') || file.includes('leads')) {
        return [leadConPresupuesto];
      }
      if (file === 'presupuestos.json' || file.includes('presupuestos')) {
        return [{ id: 'presu_456', numero: 'P-100', estado: 'Borrador' }];
      }
      return [];
    });
    mockDeleteDataItem.mockResolvedValue(true);

    const resultado = await deleteCrmLead('lead_123');

    expect(resultado.success).toBe(true);
    expect(mockDeleteDataItem).toHaveBeenCalledWith('crm-leads.json', 'prospectos', 'lead_123');
  });
});

describe('Orden 168 - Bloque 1: Invoices ejecutarEscaneoDeRecordatorios', () => {
  test('si getScheduledMessages falla, no prepara avisos ni corre cálculo de avisos pendientes', async () => {
    mockReadData.mockImplementation(async (file: string) => {
      if (file === 'invoices.json' || file.includes('invoices')) {
        return [{ id: 'inv_1', total: 1000, balance: 500, customer: { id: 'c1', name: 'Ana' } }];
      }
      return [];
    });
    mockGetScheduledMessages.mockRejectedValue(new Error('Fallo de conexión en mensajes'));

    const resultado = await ejecutarEscaneoDeRecordatorios();

    expect(resultado.success).toBe(false);
    expect(resultado.triggeredCount).toBe(0);
    expect(resultado.errors[0]).toMatch(/mensajes/i);
    expect(mockTriggerWhatsAppAutomation).not.toHaveBeenCalled();
  });
});

describe('Orden 168 - Bloque 1: SimpleAuth recuperación de clave ante falla de base', () => {
  beforeEach(() => {
    mockGetDoc.mockRejectedValue(new Error('Base no disponible'));
  });

  test('verifyResetCode corta con aviso claro si falla getAuthDoc', async () => {
    const res = await verifyResetCode('123456');
    expect(res.success).toBe(false);
    expect(res.error).toBe('No pudimos verificar el acceso ahora. Probá en unos minutos.');
  });

  test('resetPasswordWithCode corta con aviso claro si falla getAuthDoc', async () => {
    const res = await resetPasswordWithCode('123456', 'NuevaClaveSegura123!');
    expect(res.success).toBe(false);
    expect(res.error).toBe('No pudimos verificar el acceso ahora. Probá en unos minutos.');
  });

  test('resetPasswordWithSecurityAnswers corta con aviso claro si falla getAuthDoc', async () => {
    const res = await resetPasswordWithSecurityAnswers({
      answers: { q1: 'a', q2: 'b', q3: 'c' },
      newPassword: 'NuevaClaveSegura123!',
    });
    expect(res.success).toBe(false);
    expect(res.error).toBe('No pudimos verificar el acceso ahora. Probá en unos minutos.');
  });

  test('resetPasswordWithRecoveryCode corta con aviso claro si falla getAuthDoc', async () => {
    const res = await resetPasswordWithRecoveryCode('backup-code-123', 'NuevaClaveSegura123!');
    expect(res.success).toBe(false);
    expect(res.error).toBe('No pudimos verificar el acceso ahora. Probá en unos minutos.');
  });
});
