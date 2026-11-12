import { finishAutoBackupLease } from '@/app/actions/backup';
import { avisarAlDuenio } from '@/lib/asistente/avisar-al-duenio';

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  avisarAlDuenio: jest.fn().mockResolvedValue({
    pushEnviado: true,
    whatsAppEnviado: false,
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue({}),
  readDataConDetalle: jest.fn().mockResolvedValue({ ok: true, data: {} }),
  writeData: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ userId: 'test', role: 'admin' }),
  requirePermiso: jest.fn().mockResolvedValue(true),
}));

describe('Orden 286 — Bloque 2: Aviso al dueño ante fallos de respaldo', () => {
  let mockDocData: Record<string, any>;
  let mockDocSet: jest.Mock;
  let mockDb: any;
  const avisarAlDuenioMock = avisarAlDuenio as unknown as jest.Mock;

  beforeEach(() => {
    mockDocData = {};
    mockDocSet = jest.fn().mockImplementation((data) => {
      mockDocData = { ...mockDocData, ...data };
      return Promise.resolve();
    });

    mockDb = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockImplementation(() =>
            Promise.resolve({
              exists: Object.keys(mockDocData).length > 0,
              data: () => mockDocData,
            })
          ),
          set: mockDocSet,
        }),
      }),
    };

    avisarAlDuenioMock.mockClear();
    avisarAlDuenioMock.mockResolvedValue({
      pushEnviado: true,
      whatsAppEnviado: false,
    });
  });

  it('no avisa en el primer ni segundo fallo seguido', async () => {
    // Fallo 1
    await finishAutoBackupLease(mockDb, new Error('Error 1'));
    expect(mockDocData.consecutiveFailures).toBe(1);
    expect(avisarAlDuenioMock).not.toHaveBeenCalled();

    // Fallo 2
    await finishAutoBackupLease(mockDb, new Error('Error 2'));
    expect(mockDocData.consecutiveFailures).toBe(2);
    expect(avisarAlDuenioMock).not.toHaveBeenCalled();
  });

  it('al tercer fallo seguido se llama a avisarAlDuenio una vez', async () => {
    mockDocData = {
      consecutiveFailures: 2,
      lastCompletedAt: '2026-10-15T12:00:00.000Z',
    };

    await finishAutoBackupLease(mockDb, new Error('Conexión perdida con Firestore'));

    expect(mockDocData.consecutiveFailures).toBe(3);
    expect(avisarAlDuenioMock).toHaveBeenCalledTimes(1);
    const propuestas = avisarAlDuenioMock.mock.calls[0][0];
    expect(propuestas[0].titulo).toContain('Los respaldos automáticos están fallando');
    expect(propuestas[0].titulo).toContain('Conexión perdida con Firestore');
    expect(mockDocData.avisadoEl).toBeDefined();
  });

  it('al cuarto fallo el mismo día, no vuelve a avisar', async () => {
    const hoyIso = new Date().toISOString();
    mockDocData = {
      consecutiveFailures: 3,
      lastCompletedAt: '2026-10-15T12:00:00.000Z',
      avisadoEl: hoyIso,
    };

    await finishAutoBackupLease(mockDb, new Error('Cuarto fallo'));

    expect(mockDocData.consecutiveFailures).toBe(4);
    expect(avisarAlDuenioMock).not.toHaveBeenCalled();
  });

  it('si avisarAlDuenio tira error, finishAutoBackupLease igual guarda el estado', async () => {
    mockDocData = {
      consecutiveFailures: 2,
      lastCompletedAt: '2026-10-15T12:00:00.000Z',
    };

    avisarAlDuenioMock.mockRejectedValueOnce(new Error('FCM no disponible'));

    await expect(finishAutoBackupLease(mockDb, new Error('Error crítico'))).resolves.not.toThrow();

    expect(mockDocData.consecutiveFailures).toBe(3);
    expect(mockDocData.lastError).toBe('Error crítico');
    expect(mockDocSet).toHaveBeenCalled();
  });
});
