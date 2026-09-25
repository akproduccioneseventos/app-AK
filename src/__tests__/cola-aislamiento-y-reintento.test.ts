import { resolveOfflineMediaCredentials } from '@/lib/offline/offline-sync-manager';
import type { OfflineMediaItem } from '@/lib/offline/offline-db';

describe('Orden 81 — Aislamiento de credenciales en cola offline', () => {
  it('conserva estrictamente la identidad del invitado que generó la captura sin contaminarse con el scope actual', () => {
    const item: OfflineMediaItem = {
      id: 1,
      fiestaId: 'fiesta_123',
      moduleId: 'fotocabina',
      fileName: 'foto.jpg',
      fileBlob: new Blob(['test'], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      authorName: 'Invitado Original',
      guestId: 'guest_original_999',
      guestAccessToken: 'token_original_999',
      accessToken: 'estacion_token_viejo',
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    };

    // Un scope diferente presente en el navegador en el momento de sincronizar
    const scope = {
      fiestaId: 'fiesta_123',
      moduleId: 'fotocabina',
      guestId: 'guest_otro_activo',
      guestAccessToken: 'token_otro_activo',
      accessToken: 'estacion_token_nuevo',
    };

    const resolved = resolveOfflineMediaCredentials(item, scope);

    // Debe pertenecer estrictamente al invitado que sacó la foto
    expect(resolved.guestId).toBe('guest_original_999');
    expect(resolved.guestAccessToken).toBe('token_original_999');

    // La estación renueva su token para no quedar bloqueada
    expect(resolved.accessToken).toBe('estacion_token_nuevo');
  });

  it('no inyecta guestId en una captura anónima aunque haya un invitado logueado al sincronizar', () => {
    const itemAnonimo: OfflineMediaItem = {
      id: 2,
      fiestaId: 'fiesta_123',
      moduleId: 'fotocabina',
      fileName: 'foto_anonima.jpg',
      fileBlob: new Blob(['test'], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      authorName: 'Cabina AK',
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    };

    const scope = {
      fiestaId: 'fiesta_123',
      moduleId: 'fotocabina',
      guestId: 'guest_accidental',
      guestAccessToken: 'token_accidental',
    };

    const resolved = resolveOfflineMediaCredentials(itemAnonimo, scope);

    expect(resolved.guestId).toBeUndefined();
    expect(resolved.guestAccessToken).toBeUndefined();
  });
});
