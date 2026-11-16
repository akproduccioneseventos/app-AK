import { triggerAutoBackup } from '@/app/actions/backup';
import { AUTO_BACKUP_INTERNAL_TOKEN } from '@/lib/backup/internal-token';
import { avisarAlDuenio } from '@/lib/asistente/avisar-al-duenio';

let mockDbRef: any = null;

jest.mock('@/lib/firebase/server', () => ({
  get dbAdmin() {
    return mockDbRef;
  },
}));

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  avisarAlDuenio: jest.fn().mockResolvedValue({
    pushEnviado: true,
    whatsAppEnviado: false,
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue({}),
  readDataConDetalle: jest.fn().mockResolvedValue({ valor: [], huboFalla: true, motivo: 'Conexión perdida con Firestore' }),
  writeData: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ userId: 'test', role: 'admin' }),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true }),
}));

describe('Orden 286 — Bloque 2: Aviso al dueño ante fallos de respaldo', () => {
  let mockDocData: Record<string, any>;
  let mockDocSet: jest.Mock;
  let mockDb: any;
  const avisarAlDuenioMock = avisarAlDuenio as unknown as jest.Mock;
  const { readDataConDetalle } = jest.requireMock('@/lib/data-service');

  beforeEach(() => {
    mockDocData = {};
    mockDocSet = jest.fn().mockImplementation((data) => {
      mockDocData = { ...mockDocData, ...data };
      return Promise.resolve();
    });

    const docObj = {
      get: jest.fn().mockImplementation(() =>
        Promise.resolve({
          exists: Object.keys(mockDocData).length > 0,
          data: () => mockDocData,
        })
      ),
      set: mockDocSet,
      delete: jest.fn().mockResolvedValue(undefined),
      collection: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
        doc: jest.fn().mockReturnValue({}),
      }),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue(docObj),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      }),
      runTransaction: jest.fn().mockImplementation(async (fn) => {
        return fn({
          get: () => docObj.get(),
          set: (_ref: any, data: any) => mockDocSet(data),
        });
      }),
      batch: jest.fn().mockReturnValue({
        set: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      }),
    };

    mockDbRef = mockDb;

    avisarAlDuenioMock.mockClear();
    avisarAlDuenioMock.mockResolvedValue({
      pushEnviado: true,
      whatsAppEnviado: false,
    });
    readDataConDetalle.mockResolvedValue({ valor: [], huboFalla: true, motivo: 'Conexión perdida con Firestore' });
  });

  const correrFallo = async (motivo = 'Conexión perdida con Firestore') => {
    if (mockDocData.lastAttemptAt) {
      mockDocData.lastAttemptAt = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    }
    mockDocData.leaseUntilMs = 0;
    readDataConDetalle.mockResolvedValue({ valor: [], huboFalla: true, motivo });
    await triggerAutoBackup(AUTO_BACKUP_INTERNAL_TOKEN);
  };

  it('no avisa en el primer ni segundo fallo seguido', async () => {
    await correrFallo('Error 1');
    expect(mockDocData.consecutiveFailures).toBe(1);
    expect(avisarAlDuenioMock).not.toHaveBeenCalled();

    await correrFallo('Error 2');
    expect(mockDocData.consecutiveFailures).toBe(2);
    expect(avisarAlDuenioMock).not.toHaveBeenCalled();
  });

  it('al tercer fallo seguido se llama a avisarAlDuenio una vez', async () => {
    mockDocData = {
      consecutiveFailures: 2,
      lastCompletedAt: '2026-10-15T12:00:00.000Z',
    };

    await correrFallo('Conexión perdida con Firestore');

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

    await correrFallo('Cuarto fallo');

    expect(mockDocData.consecutiveFailures).toBe(4);
    expect(avisarAlDuenioMock).not.toHaveBeenCalled();
  });

  it('si avisarAlDuenio tira error, el respaldo igual guarda el estado', async () => {
    mockDocData = {
      consecutiveFailures: 2,
      lastCompletedAt: '2026-10-15T12:00:00.000Z',
    };

    avisarAlDuenioMock.mockRejectedValueOnce(new Error('FCM no disponible'));

    await expect(correrFallo('Error crítico')).resolves.not.toThrow();

    expect(mockDocData.consecutiveFailures).toBe(3);
    expect(mockDocData.lastError).toContain('Error crítico');
    expect(mockDocSet).toHaveBeenCalled();
  });
});
