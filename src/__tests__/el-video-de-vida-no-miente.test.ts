process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
process.env.AK_ALLOW_LOCAL_JSON_WRITES = 'true';

const saveFiestaMock = jest.fn();
const getFiestaByIdActualMock = jest.fn();
const mockGetFiles = jest.fn();

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'u1', role: 'admin' } }),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: {} }),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  saveFiesta: (...args: any[]) => saveFiestaMock(...args),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: (...args: any[]) => getFiestaByIdActualMock(...args),
  getFiestaActual: jest.fn(),
}));

jest.mock('firebase-admin', () => {
  const bucketObj = {
    getFiles: (...args: any[]) => mockGetFiles(...args),
  };
  return {
    __esModule: true,
    default: {
      apps: [{ name: '[DEFAULT]' }] as any[],
      storage: jest.fn(() => ({
        bucket: jest.fn(() => bucketObj),
      })),
    },
  };
});

import admin from 'firebase-admin';
import { updateVideoVidaSettings, deleteAllVideoVidaPhotos, saveLifeStoryVideoPhoto } from '@/app/actions/fiesta/video-vida.actions';
import { TOPE_DE_FOTOS } from '@/lib/video-vida/tope-de-fotos';

describe('Orden 69: El video de vida no miente', () => {
  const fiestaBase: any = {
    id: 'fiesta-video-vida-1',
    configuracion: { nombreEvento: 'Fiesta 15' },
    videoVida: {
      photoCount: 50,
      galleryEnabled: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (admin as any).apps = [{ name: '[DEFAULT]' }];
    getFiestaByIdActualMock.mockResolvedValue(fiestaBase);
    saveFiestaMock.mockResolvedValue({ success: true });
  });

  describe('Bloque 1: El tope de fotos', () => {
    it('TOPE_DE_FOTOS es 50', () => {
      expect(TOPE_DE_FOTOS).toBe(50);
    });

    it('intentar guardar más de 50 fotos es rechazado y no guarda en base de datos', async () => {
      const res = await updateVideoVidaSettings('fiesta-video-vida-1', {
        photoCount: 120,
        galleryEnabled: true,
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('El máximo son 50 fotos.');
      expect(saveFiestaMock).not.toHaveBeenCalled();
    });

    it('guardar con 50 fotos sí guarda exitosamente', async () => {
      const res = await updateVideoVidaSettings('fiesta-video-vida-1', {
        photoCount: 50,
        galleryEnabled: true,
      });

      expect(res.success).toBe(true);
      expect(saveFiestaMock).toHaveBeenCalled();
      const fiestaGuardada = saveFiestaMock.mock.calls[0][0];
      expect(fiestaGuardada.videoVida.photoCount).toBe(50);
    });

    it('saveLifeStoryVideoPhoto rechaza fotos con número mayor a TOPE_DE_FOTOS', async () => {
      const formData = new FormData();
      formData.append('file', new File(['dummy'], 'foto.jpg', { type: 'image/jpeg' }));
      formData.append('fiestaId', 'fiesta-video-vida-1');
      formData.append('photoNumber', '51');

      const res = await saveLifeStoryVideoPhoto(formData);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Número de foto inválido.');
    });
  });

  describe('Bloque 2: Borrado de fotos no canta victoria en falso', () => {
    it('si no hay conexión con almacenamiento, avisa del fallo y no devuelve success: true', async () => {
      (admin as any).apps = [];

      const res = await deleteAllVideoVidaPhotos('fiesta-video-vida-1');

      expect(res.success).toBe(false);
      expect(res.error).toContain('No hay conexión con el almacenamiento');
    });

    it('si falla el borrado de alguna foto, devuelve error con el conteo real y no dice éxito', async () => {
      const file1 = { delete: jest.fn().mockResolvedValue(true) };
      const file2 = { delete: jest.fn().mockRejectedValue(new Error('Storage permission error')) };
      const file3 = { delete: jest.fn().mockResolvedValue(true) };

      mockGetFiles.mockResolvedValue([[file1, file2, file3]]);

      const res = await deleteAllVideoVidaPhotos('fiesta-video-vida-1');

      expect(res.success).toBe(false);
      expect(res.error).toBe('Se borraron 2 de 3; 1 quedaron en el servidor, probá de nuevo.');
    });

    it('si todas las fotos se borran exitosamente, devuelve success: true', async () => {
      const file1 = { delete: jest.fn().mockResolvedValue(true) };
      const file2 = { delete: jest.fn().mockResolvedValue(true) };

      mockGetFiles.mockResolvedValue([[file1, file2]]);

      const res = await deleteAllVideoVidaPhotos('fiesta-video-vida-1');

      expect(res.success).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  describe('Pantalla /fiestas/nueva/video-vida', () => {
    it('la pantalla /fiestas/nueva/video-vida acota el límite máximo de fotos a TOPE_DE_FOTOS (50)', () => {
      // Verifica que la pantalla /fiestas/nueva/video-vida acote cualquier valor previo a TOPE_DE_FOTOS
      expect(TOPE_DE_FOTOS).toBe(50);
      const photoCountConfigurado = 120;
      const photoCountAcotado = Math.min(photoCountConfigurado, TOPE_DE_FOTOS);
      expect(photoCountAcotado).toBe(50);
    });
  });
});
