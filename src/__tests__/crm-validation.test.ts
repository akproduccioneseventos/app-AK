/**
 * Unit tests for CRM addCrmLead validation logic.
 *
 * We mock data-service reads/writes and the notification dependency
 * so we can test validation rules in isolation.
 */

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/customers', () => ({
  saveCustomer: jest.fn(),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(),
  updatePresupuesto: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  saveFiesta: jest.fn(),
  syncFiestaFromBudget: jest.fn(),
}));

jest.mock('./notifications', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

jest.mock('@/app/actions/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/fiesta-defaults', () => ({
  initialFiestaActualData: {},
  defaultModulosContratados: [],
}));

import { readData } from '@/lib/data-service';
import { addCrmLead } from '@/app/actions/crm';

const mockReadData = readData as jest.MockedFunction<typeof readData>;

const defaultStages = [
  { id: 's1', name: 'Consultó', order: 1, headerBgColor: '', headerTextColor: '', bgColor: '', borderColor: '', textColor: '' },
];

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no existing leads, default stages
  mockReadData.mockImplementation(async (file: string) => {
    if (file === 'crm-leads.json') return [];
    if (file === 'crm-stages.json') return defaultStages;
    return [];
  });
});

describe('addCrmLead — name validation', () => {
  it('rejects empty name', async () => {
    const result = await addCrmLead({ name: '', budgetSource: 'manual' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/corto|obligatorio/i);
  });

  it('rejects single-character name', async () => {
    const result = await addCrmLead({ name: 'A', budgetSource: 'manual' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/corto/i);
  });

  it('rejects name that is only digits', async () => {
    const result = await addCrmLead({ name: '12345', budgetSource: 'manual' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/número/i);
  });

  it('accepts a normal valid name', async () => {
    const result = await addCrmLead({ name: 'María García', budgetSource: 'manual' });
    expect(result.success).toBe(true);
    expect(result.lead?.name).toBe('María García');
  });

  it('normalizes name to Title Case', async () => {
    const result = await addCrmLead({ name: 'juan perez', budgetSource: 'manual' });
    expect(result.success).toBe(true);
    expect(result.lead?.name).toBe('Juan Perez');
  });
});

describe('addCrmLead — phone deduplication', () => {
  it('rejects a lead with the same phone number', async () => {
    const existingLead = {
      id: 'lead_1', name: 'Ana López', phone: '099123456',
      createdAt: '', updatedAt: '', currentStageId: 's1', timeline: [], budgetSource: 'manual' as const,
    };
    mockReadData.mockImplementation(async (file: string) => {
      if (file === 'crm-leads.json') return [existingLead];
      if (file === 'crm-stages.json') return defaultStages;
      return [];
    });

    const result = await addCrmLead({ name: 'Ana López Nueva', phone: '099 123 456', budgetSource: 'manual' });
    expect(result.success).toBe(false);
    expect(result.duplicate).toBeDefined();
    expect(result.duplicate?.name).toBe('Ana López');
  });
});

describe('addCrmLead — name similarity deduplication', () => {
  it('rejects a lead with the same normalized name and same event type', async () => {
    const existingLead = {
      id: 'lead_1', name: 'Juan Pérez', phone: undefined,
      partyType: 'Casamiento',
      createdAt: '', updatedAt: '', currentStageId: 's1', timeline: [], budgetSource: 'manual' as const,
    };
    mockReadData.mockImplementation(async (file: string) => {
      if (file === 'crm-leads.json') return [existingLead];
      if (file === 'crm-stages.json') return defaultStages;
      return [];
    });

    const result = await addCrmLead({ name: 'juan pérez', partyType: 'Casamiento', budgetSource: 'manual' });
    expect(result.success).toBe(false);
    expect(result.duplicate).toBeDefined();
  });

  it('allows a lead with same name but different event type', async () => {
    const existingLead = {
      id: 'lead_1', name: 'Juan Pérez', phone: undefined,
      partyType: 'Casamiento',
      createdAt: '', updatedAt: '', currentStageId: 's1', timeline: [], budgetSource: 'manual' as const,
    };
    mockReadData.mockImplementation(async (file: string) => {
      if (file === 'crm-leads.json') return [existingLead];
      if (file === 'crm-stages.json') return defaultStages;
      return [];
    });

    const result = await addCrmLead({ name: 'Juan Pérez', partyType: 'Cumpleaños', budgetSource: 'manual' });
    expect(result.success).toBe(true);
  });
});

describe('addCrmLead — input sanitization', () => {
  it('truncates notes longer than 1000 characters', async () => {
    const longNotes = 'A'.repeat(1500);
    const result = await addCrmLead({ name: 'Carlos Ruiz', notes: longNotes, budgetSource: 'manual' });
    expect(result.success).toBe(true);
    expect(result.lead?.notes?.length).toBeLessThanOrEqual(1000);
  });

  it('normalizes phone by removing spaces and dashes', async () => {
    const result = await addCrmLead({ name: 'Pedro Martínez', phone: '099 555-123', budgetSource: 'manual' });
    expect(result.success).toBe(true);
    expect(result.lead?.phone).not.toContain(' ');
    expect(result.lead?.phone).not.toContain('-');
  });
});
