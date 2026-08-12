jest.mock('@/lib/firebase/server', () => {
  const records = new Map<string, Record<string, unknown>>();
  const transaction = {
    get: jest.fn(async (ref: { id: string }) => ({
      exists: records.has(ref.id),
      data: () => records.get(ref.id),
    })),
    set: jest.fn((ref: { id: string }, data: Record<string, unknown>) => {
      records.set(ref.id, data);
    }),
    delete: jest.fn((ref: { id: string }) => {
      records.delete(ref.id);
    }),
  };
  const dbAdmin = {
    collection: jest.fn(() => ({ doc: (id: string) => ({ id }) })),
    runTransaction: jest.fn(async (callback: (value: typeof transaction) => Promise<void>) => {
      await callback(transaction);
    }),
    __records: records,
  };
  return { dbAdmin };
});

import { dbAdmin } from '@/lib/firebase/server';
import { acquireStaffAgendaLocks } from './staff-agenda-lock';

const mockDbAdmin = dbAdmin as typeof dbAdmin & {
  __records: Map<string, Record<string, unknown>>;
  runTransaction: jest.Mock;
};

describe('bloqueo distribuido de agenda de personal', () => {
  beforeEach(() => {
    mockDbAdmin.__records.clear();
    jest.clearAllMocks();
  });

  it('bloquea cada empleado una sola vez y libera solo sus propios bloqueos', async () => {
    const release = await acquireStaffAgendaLocks(['emp-2', 'emp-1', 'emp-1']);

    expect(mockDbAdmin.__records.size).toBe(2);
    expect(mockDbAdmin.runTransaction).toHaveBeenCalledTimes(1);

    await release();

    expect(mockDbAdmin.__records.size).toBe(0);
    expect(mockDbAdmin.runTransaction).toHaveBeenCalledTimes(2);
  });

  it('rechaza una segunda actualización mientras el bloqueo sigue vigente', async () => {
    mockDbAdmin.__records.set('emp-1', {
      owner: 'otro-servidor',
      expiresAtMs: Date.now() + 30_000,
    });

    await expect(acquireStaffAgendaLocks(['emp-1'])).rejects.toThrow(/se está actualizando/i);
    expect(mockDbAdmin.__records.get('emp-1')?.owner).toBe('otro-servidor');
  });

  it('reemplaza un bloqueo vencido para recuperarse de una ejecución interrumpida', async () => {
    mockDbAdmin.__records.set('emp-1', {
      owner: 'servidor-caido',
      expiresAtMs: Date.now() - 1,
    });

    const release = await acquireStaffAgendaLocks(['emp-1']);

    expect(mockDbAdmin.__records.get('emp-1')?.owner).not.toBe('servidor-caido');
    await release();
    expect(mockDbAdmin.__records.has('emp-1')).toBe(false);
  });
});
