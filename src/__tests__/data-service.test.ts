/**
 * Tests for data-service.ts — writeData validation.
 *
 * We test path traversal guards and production Firestore error propagation.
 * readData is tested indirectly through integration tests.
 */

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock backup trigger
jest.mock('@/app/actions/backup', () => ({
  triggerAutoBackup: jest.fn().mockResolvedValue(undefined),
}));

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('data-service — writeData validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.VERCEL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects path traversal attempts', async () => {
    const { writeData } = await import('@/lib/data-service');
    await expect(writeData('../etc/passwd', 'malicious')).rejects.toThrow('Invalid data file path');
  });

  it('rejects absolute paths', async () => {
    const { writeData } = await import('@/lib/data-service');
    await expect(writeData('/etc/passwd', 'malicious')).rejects.toThrow('Invalid data file path');
  });

  it('blocks writes while browser tests use local JSON data', async () => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';

    const { writeData } = await import('@/lib/data-service');
    await expect(writeData('test.json', [{ id: '1' }])).rejects.toThrow(
      'La escritura esta deshabilitada en el modo local de pruebas.'
    );
  });

  it('throws when Firestore write fails in production', async () => {
    process.env.VERCEL = '1';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = 'production';

    jest.resetModules();

    // Mock firebase-sync to simulate failure
    jest.doMock('@/lib/firebase-sync', () => ({
      syncToFirestore: jest.fn().mockRejectedValue(new Error('Firestore unavailable')),
    }));

    const { writeData } = await import('@/lib/data-service');
    await expect(writeData('test.json', [{ id: '1' }])).rejects.toThrow('Error al guardar datos en Firestore');
  });

  it('registers automatic backup as post-response work after a successful write', async () => {
    const syncToFirestore = jest.fn().mockResolvedValue(undefined);
    const waitUntil = jest.fn();
    const triggerAutoBackup = jest.fn(() => new Promise<void>(() => {}));
    jest.doMock('@/lib/firebase-sync', () => ({
      syncToFirestore,
      readFromFirestore: jest.fn().mockResolvedValue([{ id: '1' }]),
    }));
    jest.doMock('@/app/actions/backup', () => ({ triggerAutoBackup }));
    jest.doMock('next/dist/server/lib/builtin-request-context', () => ({
      getBuiltinRequestContext: () => ({ waitUntil }),
    }));

    const { writeData } = await import('@/lib/data-service');
    await writeData('customers.json', [{ id: '1' }]);

    expect(syncToFirestore).toHaveBeenCalled();
    expect(triggerAutoBackup).toHaveBeenCalledTimes(1);
    expect(waitUntil).toHaveBeenCalledTimes(1);
  });

  it('can skip automatic backup during a restore', async () => {
    const triggerAutoBackup = jest.fn().mockResolvedValue(undefined);
    jest.doMock('@/lib/firebase-sync', () => ({
      syncToFirestore: jest.fn().mockResolvedValue(undefined),
      readFromFirestore: jest.fn().mockResolvedValue([{ id: '1' }]),
    }));
    jest.doMock('@/app/actions/backup', () => ({ triggerAutoBackup }));

    const { writeData } = await import('@/lib/data-service');
    await writeData('customers.json', [{ id: '1' }], undefined, { skipAutoBackup: true });

    expect(triggerAutoBackup).not.toHaveBeenCalled();
  });
});
