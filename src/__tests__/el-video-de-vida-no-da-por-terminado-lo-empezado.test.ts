import { progresoVideoVida } from '@/lib/video-vida/tope-de-fotos';

const saveFiestaMock = jest.fn();
const getFiestaByIdMock = jest.fn();
const mockGetFiles = jest.fn();

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'u1', perfil: 'admin' } }),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => ({ id: 'f_vv_359' })),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  saveFiesta: (...args: any[]) => saveFiestaMock(...args),
}));
jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: (...args: any[]) => getFiestaByIdMock(...args),
  getFiestaActual: jest.fn(),
}));
jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(async () => 'https://storage.googleapis.com/bucket/video-vida-photos/f_vv_359/01.jpg'),
  deleteFromStorage: jest.fn(async () => undefined),
}));
jest.mock('firebase-admin', () => ({
  __esModule: true,
  default: {
    apps: [{ name: '[DEFAULT]' }],
    storage: jest.fn(() => ({
      bucket: jest.fn(() => ({
        getFiles: (...args: any[]) => mockGetFiles(...args),
      })),
    })),
  },
}));

import { saveLifeStoryVideoPhoto, deleteAllVideoVidaPhotos } from '@/app/actions/fiesta/video-vida.actions';

describe('Orden 359: el Video de Vida no da por terminado lo que empezó', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveFiestaMock.mockResolvedValue({ success: true });
  });

  it('con 1 de 50 fotos, photosUploaded sigue en false y el progreso muestra "1 de 50"', async () => {
    getFiestaByIdMock.mockResolvedValue({
      id: 'f_vv_359',
      configuracion: { nombreEvento: 'Fiesta 359' },
      videoVida: { galleryEnabled: true, photoCount: 50, photosUploaded: false },
    });
    mockGetFiles.mockResolvedValue([[
      { name: 'video-vida-photos/f_vv_359/01.jpg', getMetadata: async () => [{}], getSignedUrl: async () => ['https://cdn/01.jpg'] },
    ]]);

    const fields: Record<string, any> = {
      file: { name: 'foto.jpg', type: 'image/jpeg', arrayBuffer: async () => new ArrayBuffer(4) },
      fiestaId: 'f_vv_359',
      photoNumber: '1',
    };
    const fd = { get: (k: string) => fields[k] ?? null } as unknown as FormData;

    const res = await saveLifeStoryVideoPhoto(fd);
    expect(res.success).toBe(true);
    const guardada = saveFiestaMock.mock.calls[0][0];
    expect(guardada.videoVida.photosUploaded).toBe(false);
    expect(guardada.videoVida.uploadedCount).toBe(1);

    const prog = progresoVideoVida(guardada.videoVida);
    expect(prog.completo).toBe(false);
    expect(`${prog.subidas} de ${prog.total}`).toBe('1 de 50');
  });

  it('al borrar todas las fotos, photosUploaded vuelve a false y uploadedCount a 0', async () => {
    getFiestaByIdMock.mockResolvedValue({
      id: 'f_vv_359',
      configuracion: { nombreEvento: 'Fiesta 359' },
      videoVida: { galleryEnabled: true, photoCount: 50, photosUploaded: true, uploadedCount: 50 },
    });
    mockGetFiles.mockResolvedValue([[{ delete: jest.fn().mockResolvedValue(true) }]]);

    const res = await deleteAllVideoVidaPhotos('f_vv_359');
    expect(res.success).toBe(true);
    const guardada = saveFiestaMock.mock.calls[0][0];
    expect(guardada.videoVida.photosUploaded).toBe(false);
    expect(guardada.videoVida.uploadedCount).toBe(0);
  });
});
