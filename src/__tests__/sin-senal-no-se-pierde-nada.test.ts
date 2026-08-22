/**
 * @jest-environment jsdom
 */

import {
  saveOfflineMedia,
  getPendingOfflineMedia,
  getPendingOfflineMediaCount,
  removeOfflineMedia,
  updateOfflineMediaAttempt,
  clearAllOfflineMedia,
  type OfflineMediaItem,
} from '@/lib/offline/offline-db';

// Mock IndexedDB in-memory store for Jest JSDOM
class MockIDBDatabase {
  private store: Map<string, any> = new Map();

  createObjectStore() {
    return {
      createIndex: () => {},
    };
  }

  get objectStoreNames() {
    return {
      contains: () => true,
    };
  }

  transaction() {
    const self = this;
    return {
      objectStore: () => ({
        add: (item: any) => {
          const req: any = {};
          setTimeout(() => {
            self.store.set(item.id, { ...item });
            if (req.onsuccess) req.onsuccess({ target: req });
          }, 0);
          return req;
        },
        getAll: () => {
          const req: any = {};
          setTimeout(() => {
            req.result = Array.from(self.store.values());
            if (req.onsuccess) req.onsuccess({ target: req });
          }, 0);
          return req;
        },
        get: (id: string) => {
          const req: any = {};
          setTimeout(() => {
            req.result = self.store.get(id);
            if (req.onsuccess) req.onsuccess({ target: req });
          }, 0);
          return req;
        },
        put: (item: any) => {
          const req: any = {};
          setTimeout(() => {
            self.store.set(item.id, { ...item });
            if (req.onsuccess) req.onsuccess({ target: req });
          }, 0);
          return req;
        },
        delete: (id: string) => {
          const req: any = {};
          setTimeout(() => {
            self.store.delete(id);
            if (req.onsuccess) req.onsuccess({ target: req });
          }, 0);
          return req;
        },
        clear: () => {
          const req: any = {};
          setTimeout(() => {
            self.store.clear();
            if (req.onsuccess) req.onsuccess({ target: req });
          }, 0);
          return req;
        },
      }),
    };
  }
}

const mockDbInstance = new MockIDBDatabase();

const mockIndexedDB = {
  open: () => {
    const req: any = {};
    setTimeout(() => {
      req.result = mockDbInstance;
      if (req.onupgradeneeded) req.onupgradeneeded({ target: req });
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 0);
    return req;
  },
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

describe('Orden 2: Sin señal no se pierde nada (IndexedDB Offline Queue)', () => {
  beforeEach(async () => {
    await clearAllOfflineMedia();
  });

  afterAll(async () => {
    await clearAllOfflineMedia();
  });

  test('Guarda y recupera un Blob en la cola local de IndexedDB', async () => {
    const fakeBlob = new Blob(['fake image content'], { type: 'image/jpeg' });
    const fiestaId = 'fiesta-123';

    const id = await saveOfflineMedia({
      fiestaId,
      moduleId: 'fotocabina',
      fileBlob: fakeBlob,
      fileName: 'foto-1.jpg',
      mimeType: 'image/jpeg',
      authorName: 'Invitado Juan',
      metadata: { guestId: 'g-1' },
    });

    expect(id).toBeDefined();

    const pending = await getPendingOfflineMedia(fiestaId);
    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe(id);
    expect(pending[0].moduleId).toBe('fotocabina');
    expect(pending[0].authorName).toBe('Invitado Juan');
    expect(pending[0].attempts).toBe(0);
  });

  test('Cuenta correctamente los elementos pendientes por modulo y fiesta', async () => {
    const fakeBlob = new Blob(['data'], { type: 'image/jpeg' });

    await saveOfflineMedia({
      fiestaId: 'fiesta-A',
      moduleId: 'fotocabina',
      fileBlob: fakeBlob,
      fileName: 'f1.jpg',
      mimeType: 'image/jpeg',
      authorName: 'A1',
    });

    await saveOfflineMedia({
      fiestaId: 'fiesta-A',
      moduleId: 'plataforma-360',
      fileBlob: fakeBlob,
      fileName: 'v1.mp4',
      mimeType: 'video/mp4',
      authorName: 'A2',
    });

    await saveOfflineMedia({
      fiestaId: 'fiesta-B',
      moduleId: 'fotocabina',
      fileBlob: fakeBlob,
      fileName: 'f2.jpg',
      mimeType: 'image/jpeg',
      authorName: 'B1',
    });

    const totalA = await getPendingOfflineMediaCount('fiesta-A');
    expect(totalA).toBe(2);

    const fotocabinaA = await getPendingOfflineMediaCount('fiesta-A', 'fotocabina');
    expect(fotocabinaA).toBe(1);

    const fotocabinaB = await getPendingOfflineMediaCount('fiesta-B', 'fotocabina');
    expect(fotocabinaB).toBe(1);

    const totalGlobal = await getPendingOfflineMediaCount();
    expect(totalGlobal).toBe(3);
  });

  test('Elimina un elemento tras confirmacion de subida', async () => {
    const fakeBlob = new Blob(['data'], { type: 'image/jpeg' });

    const id = await saveOfflineMedia({
      fiestaId: 'fiesta-A',
      moduleId: 'fotocabina',
      fileBlob: fakeBlob,
      fileName: 'f1.jpg',
      mimeType: 'image/jpeg',
      authorName: 'A1',
    });

    let count = await getPendingOfflineMediaCount('fiesta-A');
    expect(count).toBe(1);

    await removeOfflineMedia(id);

    count = await getPendingOfflineMediaCount('fiesta-A');
    expect(count).toBe(0);
  });

  test('Registra intentos fallidos y mensaje de error sin borrar el elemento', async () => {
    const fakeBlob = new Blob(['data'], { type: 'image/jpeg' });

    const id = await saveOfflineMedia({
      fiestaId: 'fiesta-A',
      moduleId: 'fotocabina',
      fileBlob: fakeBlob,
      fileName: 'f1.jpg',
      mimeType: 'image/jpeg',
      authorName: 'A1',
    });

    await updateOfflineMediaAttempt(id, 'Network request failed');

    const pending = await getPendingOfflineMedia('fiesta-A');
    expect(pending.length).toBe(1);
    expect(pending[0].attempts).toBe(1);
    expect(pending[0].lastError).toBe('Network request failed');
  });
});
