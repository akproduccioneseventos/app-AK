import {
  buildAlbumDeliveryChecklist,
  buildClientAlbumDeliveryMessage,
  buildPortalAlbumCard,
  buildTemporaryMediaBatch,
  buildWfolioDelivery,
  getAlbumDeliveryStatus,
  isValidWfolioUrl,
  markTemporaryMediaDeleted,
  markTemporaryMediaDownloaded,
} from '@/lib/social-fiesta/wfolio-album-delivery';

describe('Wfolio album delivery workflow', () => {
  it('validates Wfolio links', () => {
    expect(isValidWfolioUrl('https://wfolio.com/my/disk')).toBe(true);
    expect(isValidWfolioUrl('https://example.com/album')).toBe(false);
  });

  it('builds delivered album when Wfolio link is valid', () => {
    const delivery = buildWfolioDelivery({
      fiestaId: 'fiesta_1',
      eventName: 'Los 15 de Sofia',
      clientName: 'Sofia',
      wfolioUrl: 'https://wfolio.com/my/disk',
      password: '1234',
      expiresAt: '2026-06-01T00:00:00.000Z',
    });

    expect(delivery.status).toBe('entregado_cliente');
    expect(delivery.deliveredAt).toBeDefined();
  });

  it('marks album as expiring soon or expired', () => {
    const delivery = buildWfolioDelivery({
      fiestaId: 'fiesta_1',
      eventName: 'Evento',
      wfolioUrl: 'https://wfolio.com/my/disk',
      expiresAt: '2026-05-10T00:00:00.000Z',
    });

    expect(getAlbumDeliveryStatus({ delivery, now: '2026-05-01T00:00:00.000Z' })).toBe('vence_pronto');
    expect(getAlbumDeliveryStatus({ delivery, now: '2026-05-20T00:00:00.000Z' })).toBe('vencido');
  });

  it('controls temporary media download and deletion', () => {
    const batch = buildTemporaryMediaBatch({
      fiestaId: 'fiesta_1',
      mediaCount: 120,
      totalSizeMb: 4500,
      createdAt: '2026-05-01T00:00:00.000Z',
      retentionDays: 10,
    });
    expect(batch.status).toBe('listo_para_descargar');

    const downloaded = markTemporaryMediaDownloaded(batch, '2026-05-02T00:00:00.000Z');
    expect(downloaded.status).toBe('descargado');

    const deleted = markTemporaryMediaDeleted(downloaded, '2026-05-03T00:00:00.000Z');
    expect(deleted.status).toBe('borrado');
  });

  it('builds checklist with warnings before deleting temporaries', () => {
    const delivery = buildWfolioDelivery({ fiestaId: 'fiesta_1', eventName: 'Evento' });
    const batch = buildTemporaryMediaBatch({ fiestaId: 'fiesta_1', mediaCount: 10, createdAt: '2026-05-01T00:00:00.000Z' });
    const checklist = buildAlbumDeliveryChecklist({ delivery, temporaryBatch: batch });

    expect(checklist.some(item => item.warning)).toBe(true);
    expect(checklist.find(item => item.id === 'upload_wfolio')?.done).toBe(false);
  });

  it('builds client message and portal card', () => {
    const delivery = buildWfolioDelivery({
      fiestaId: 'fiesta_1',
      eventName: 'Los 15 de Sofia',
      clientName: 'Sofia',
      wfolioUrl: 'https://wfolio.com/my/disk',
      password: '1234',
    });

    expect(buildClientAlbumDeliveryMessage({ delivery })).toContain('descargar las fotos');
    const card = buildPortalAlbumCard({ delivery });
    expect(card.buttonLabel).toBe('Abrir álbum digital');
    expect(card.showPassword).toBe(true);
  });
});
