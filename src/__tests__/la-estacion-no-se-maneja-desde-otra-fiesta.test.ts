/**
 * @jest-environment node
 */
jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

const mockHasAppSession = jest.fn();
const mockRequireAppSession = jest.fn();
const mockRequireEventPermission = jest.fn();
const mockGetFiestaByIdRaw = jest.fn();
const mockGetFiestaById = jest.fn();
const mockActualizarFiesta = jest.fn();
const mockUploadToStorage = jest.fn();
const mockCreateSocialPost = jest.fn();
const mockCheckImageSafety = jest.fn();
const mockTransactionGet = jest.fn();
const mockTransactionSet = jest.fn();

jest.mock('@/lib/auth/require-session', () => ({
  hasAppSession: (...args: any[]) => mockHasAppSession(...args),
  requireAppSession: (...args: any[]) => mockRequireAppSession(...args),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: (...args: any[]) => mockRequireEventPermission(...args),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: (...args: any[]) => mockGetFiestaByIdRaw(...args),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: (...args: any[]) => mockGetFiestaById(...args),
  saveFiesta: jest.fn(),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: (...args: any[]) => mockActualizarFiesta(...args),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: (...args: any[]) => mockUploadToStorage(...args),
}));

jest.mock('@/app/actions/social-gallery', () => ({
  createSocialMediaPostFromUrlForStation: (...args: any[]) => mockCreateSocialPost(...args),
}));

jest.mock('@/lib/social-fiesta/content-safety-ai', () => ({
  checkImageSafety: (...args: any[]) => mockCheckImageSafety(...args),
}));

jest.mock('@/lib/firebase/modo-local', () => ({
  sinBaseDisponible: jest.fn(() => false),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(async () => ({ exists: false })),
        set: jest.fn(async () => undefined),
      })),
    })),
    runTransaction: jest.fn(async (cb: any) =>
      cb({
        get: (...args: any[]) => mockTransactionGet(...args),
        set: (...args: any[]) => mockTransactionSet(...args),
      }),
    ),
  },
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

import { hasEntertainmentGuestAccess } from '@/lib/auth/entertainment-token';
import {
  getPermisoDelAfiche,
  uploadEntretenimientoMedia,
} from '@/app/actions/fiesta/entretenimiento.actions';
import {
  completeEntertainmentSessionCycle,
  getEntertainmentSession,
  updateEntertainmentSessionStatus,
} from '@/app/actions/fiesta/sesion-entretenimiento';

describe('Orden 371 B3.1 & B3.2: la estación no se maneja desde otra fiesta', () => {
  const fiestaA = {
    id: 'fiesta-A',
    estado: 'confirmada',
    configuracion: { nombreEvento: 'Fiesta A', fechaEvento: '2099-12-20' },
    modulosContratados: ['fotocabina'],
    others: { entretenimiento: { modules: { fotocabina: { enabled: true, media: [] } } } },
  };
  const fiestaB = {
    id: 'fiesta-B',
    estado: 'confirmada',
    configuracion: { nombreEvento: 'Fiesta B', fechaEvento: '2099-12-21' },
    modulosContratados: ['fotocabina'],
    others: { entretenimiento: { modules: { fotocabina: { enabled: true, media: [] } } } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AK_ENTERTAINMENT_SECRET = 'test-secret-371-entropy-value-here';
    mockHasAppSession.mockResolvedValue(true);
    mockRequireAppSession.mockResolvedValue({ userId: 'op-a', perfil: 'operador' });
    // Operador asignado sólo a fiesta-A, no a fiesta-B
    mockRequireEventPermission.mockImplementation(async (fiestaId: string) => {
      if (fiestaId === 'fiesta-A') return fiestaA;
      throw new Error('Este evento no está asignado a tu usuario.');
    });
    mockGetFiestaByIdRaw.mockImplementation(async (fiestaId: string) =>
      fiestaId === 'fiesta-A' ? fiestaA : fiestaId === 'fiesta-B' ? fiestaB : null,
    );
    mockGetFiestaById.mockImplementation(async (fiestaId: string) =>
      fiestaId === 'fiesta-A' ? fiestaA : fiestaId === 'fiesta-B' ? fiestaB : null,
    );
    mockCheckImageSafety.mockResolvedValue({ safe: true, reason: 'clean' });
    mockUploadToStorage.mockResolvedValue('https://cdn.test/foto.jpg');
    mockCreateSocialPost.mockResolvedValue({
      success: true,
      post: { id: 'post-1', moderationStatus: 'approved' },
    });
    mockActualizarFiesta.mockResolvedValue({ success: true });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        fiestaId: 'fiesta-A',
        moduleId: 'fotocabina',
        status: 'recording',
        version: 1,
        captureId: 'cap-1',
      }),
    });
  });

  it('operador con sesión de fiesta A NO puede subir fotos ni manejar la estación ni sacar afiche de fiesta B', async () => {
    expect(await hasEntertainmentGuestAccess('fiesta-B', 'fotocabina')).toBe(false);

    const fdB = new FormData();
    fdB.append('fiestaId', 'fiesta-B');
    fdB.append('moduleId', 'fotocabina');
    fdB.append('file', new File([Buffer.from('abc')], 'foto.jpg', { type: 'image/jpeg' }));

    const uploadB = await uploadEntretenimientoMedia(fdB);
    expect(uploadB.success).toBe(false);
    expect(mockUploadToStorage).not.toHaveBeenCalled();

    expect(await getEntertainmentSession('fiesta-B', 'fotocabina')).toBeNull();
    expect((await updateEntertainmentSessionStatus('fiesta-B', 'fotocabina', 'done')).success).toBe(false);
    expect((await completeEntertainmentSessionCycle('fiesta-B', 'fotocabina')).success).toBe(false);
    expect((await getPermisoDelAfiche('fiesta-B')).success).toBe(false);
  });

  it('operador con permiso de fiesta A sí puede operar fiesta A', async () => {
    expect(await hasEntertainmentGuestAccess('fiesta-A', 'fotocabina')).toBe(true);

    const fdA = new FormData();
    fdA.append('fiestaId', 'fiesta-A');
    fdA.append('moduleId', 'fotocabina');
    fdA.append('file', new File([Buffer.from('abc')], 'foto.jpg', { type: 'image/jpeg' }));

    const uploadA = await uploadEntretenimientoMedia(fdA);
    expect(uploadA.success).toBe(true);

    const sesionA = await updateEntertainmentSessionStatus('fiesta-A', 'fotocabina', 'done');
    expect(sesionA.success).toBe(true);

    const aficheA = await getPermisoDelAfiche('fiesta-A');
    expect(aficheA.success).toBe(true);
    expect(aficheA.permiso).toBeTruthy();
  });
});
