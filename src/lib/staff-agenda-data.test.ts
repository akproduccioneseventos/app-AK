jest.mock('@/lib/firebase/server', () => {
  const get = jest.fn();
  return {
    dbAdmin: {
      collection: jest.fn(() => ({ get })),
      __get: get,
    },
  };
});

import { dbAdmin } from '@/lib/firebase/server';
import { readActiveFiestasForStaffAgenda } from './staff-agenda-data';

const mockDbAdmin = dbAdmin as typeof dbAdmin & { __get: jest.Mock };
const originalLocalMode = process.env.AK_USE_LOCAL_JSON_ONLY;

describe('lectura estricta de agenda de personal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
  });

  afterAll(() => {
    if (originalLocalMode === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = originalLocalMode;
  });

  it('lee fiestas activas desde Firestore y elimina campos internos', async () => {
    mockDbAdmin.__get.mockResolvedValue({
      docs: [
        { id: 'activa', data: () => ({ configuracion: {}, _syncedAt: 'interno' }) },
        { id: 'archivada', data: () => ({ estado: 'Archivado', configuracion: {} }) },
      ],
    });
    const fallback = jest.fn();

    const result = await readActiveFiestasForStaffAgenda(fallback);

    expect(result).toEqual([{ id: 'activa', configuracion: {} }]);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('falla de forma segura si Firestore no puede confirmar la agenda', async () => {
    mockDbAdmin.__get.mockRejectedValue(new Error('sin conexión'));

    await expect(readActiveFiestasForStaffAgenda(jest.fn())).rejects.toThrow(
      /No se pudo verificar la agenda en Firestore: sin conexión/,
    );
  });

  it('usa JSON solamente cuando el modo local está declarado', async () => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    const local = [{ id: 'local', configuracion: {} }] as any;
    const fallback = jest.fn().mockResolvedValue(local);

    await expect(readActiveFiestasForStaffAgenda(fallback)).resolves.toBe(local);
    expect(mockDbAdmin.__get).not.toHaveBeenCalled();
  });
});
