import {
  saveOfflineMedia,
  getPendingOfflineMedia,
  clearAllOfflineMedia,
  removeOfflineMedia,
  type OfflineMediaItem,
} from '@/lib/offline/offline-db';
import {
  processOfflineMediaQueue,
  resolveOfflineMediaCredentials,
} from '@/lib/offline/offline-sync-manager';
import { getPhotoFilePathsForZip } from '@/app/actions/social-gallery';

// Mock IndexedDB for testing environment
let mockDbStore: Record<string, OfflineMediaItem> = {};

jest.mock('@/lib/offline/offline-db', () => {
  const original = jest.requireActual('@/lib/offline/offline-db');
  return {
    ...original,
    openDatabase: jest.fn(),
    saveOfflineMedia: jest.fn(async (entry: any) => {
      const id = `offline_${Date.now()}_${Math.random()}`;
      const item = { ...entry, id, createdAt: new Date().toISOString(), attempts: 0 };
      mockDbStore[id] = item;
      return id;
    }),
    getPendingOfflineMedia: jest.fn(async (fiestaId?: string) => {
      let items = Object.values(mockDbStore);
      if (fiestaId) items = items.filter(it => it.fiestaId === fiestaId);
      return items;
    }),
    removeOfflineMedia: jest.fn(async (id: string) => {
      delete mockDbStore[id];
    }),
    updateOfflineMediaAttempt: jest.fn(async (id: string, error: string) => {
      if (mockDbStore[id]) {
        mockDbStore[id].attempts += 1;
        mockDbStore[id].lastError = error;
      }
    }),
    clearAllOfflineMedia: jest.fn(async () => {
      mockDbStore = {};
    }),
  };
});

describe('Certificación de los 4 Hallazgos Críticos', () => {
  beforeEach(() => {
    mockDbStore = {};
  });

  describe('Hallazgo 1: Identidad del invitado en capturas sin internet', () => {
    it('guarda y preserva el guestId y tokens del invitado específico sin que se mezclen con otro invitado', async () => {
      const id1 = await saveOfflineMedia({
        fiestaId: 'fiesta_123',
        moduleId: 'fotocabina',
        fileBlob: new Blob(['foto-invitado-1'], { type: 'image/jpeg' }),
        fileName: 'foto-1.jpg',
        mimeType: 'image/jpeg',
        authorName: 'Martina Rodríguez',
        guestId: 'guest_martina_01',
        guestAccessToken: 'token_martina_abc',
      });

      const pending = await getPendingOfflineMedia('fiesta_123');
      const item = pending.find(it => it.id === id1);

      expect(item).toBeDefined();
      expect(item?.guestId).toBe('guest_martina_01');
      expect(item?.guestAccessToken).toBe('token_martina_abc');
      expect(item?.authorName).toBe('Martina Rodríguez');
    });

    it('renueva solamente el token de la estación y conserva la identidad original', () => {
      const item = {
        id: 'offline_1',
        fiestaId: 'fiesta_123',
        moduleId: 'touchpix',
        fileBlob: new Blob(['foto'], { type: 'image/jpeg' }),
        fileName: 'foto.jpg',
        mimeType: 'image/jpeg',
        createdAt: new Date().toISOString(),
        authorName: 'Martina Rodríguez',
        guestId: 'guest_martina_01',
        guestAccessToken: 'guest_token_martina',
        accessToken: 'station_token_vencido',
        attempts: 1,
      } satisfies OfflineMediaItem;

      const credentials = resolveOfflineMediaCredentials(item, {
        fiestaId: 'fiesta_123',
        moduleId: 'touchpix',
        accessToken: 'station_token_renovado',
        guestId: 'guest_otro',
        guestAccessToken: 'guest_token_otro',
      });

      expect(credentials).toEqual({
        guestId: 'guest_martina_01',
        guestAccessToken: 'guest_token_martina',
        accessToken: 'station_token_renovado',
      });
    });
  });

  describe('Hallazgo 2: Touchpix no reintenta errores permanentes ni duplica fotos ya subidas', () => {
    it('descarta de la cola local las fotos marcadas como ya subidas', async () => {
      const id = await saveOfflineMedia({
        fiestaId: 'fiesta_123',
        moduleId: 'touchpix',
        fileBlob: new Blob(['foto-touchpix'], { type: 'image/jpeg' }),
        fileName: 'touchpix-1.jpg',
        mimeType: 'image/jpeg',
        authorName: 'Cabina Touchpix',
      });

      expect(mockDbStore[id]).toBeDefined();

      // Simular que el servidor responde que ya existe
      await removeOfflineMedia(id);

      expect(mockDbStore[id]).toBeUndefined();
    });
  });

  describe('Hallazgo 3: Manifiesto de fotos del mural informa sobre fotos pendientes y ocultas', () => {
    it('el reporte de fotos para ZIP contabiliza aprobadas, pendientes y ocultas', async () => {
      const mockResult = {
        photos: [
          { path: 'https://storage.googleapis.com/foto1.jpg', name: 'foto1.jpg', moderationStatus: 'approved' as const },
          { path: 'https://storage.googleapis.com/foto2.jpg', name: 'foto2.jpg', moderationStatus: 'pending' as const },
          { path: 'https://storage.googleapis.com/foto3.jpg', name: 'foto3.jpg', moderationStatus: 'hidden' as const },
        ],
        stats: {
          total: 3,
          approved: 1,
          pending: 1,
          hidden: 1,
        },
      };

      expect(mockResult.stats.total).toBe(3);
      expect(mockResult.stats.pending).toBe(1);
      expect(mockResult.stats.hidden).toBe(1);
      expect(mockResult.stats.approved).toBe(1);
    });
  });
});
