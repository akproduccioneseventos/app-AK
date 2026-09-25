import {
  getGoogleBusinessReviews,
  replyToGoogleBusinessReview,
  generarBorradorRespuesta,
} from '@/lib/social-media/google-business-resenas';

describe('Orden 86 Bloque 4: Reseñas de Google con borrador IA y publicación a un toque', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('una reseña sin responder trae un borrador sugerido y no se publica nada automáticamente', async () => {
    const mockReviewsResponse = {
      reviews: [
        {
          name: 'accounts/123/locations/456/reviews/rev-001',
          reviewId: 'rev-001',
          reviewer: { displayName: 'Laura Benítez' },
          starRating: 'FIVE',
          comment: 'Excelente servicio de discoteca y sonido, los chicos de diez!',
          createTime: '2026-09-20T20:00:00.000Z',
          // Sin reviewReply -> pendiente
        },
        {
          name: 'accounts/123/locations/456/reviews/rev-002',
          reviewId: 'rev-002',
          reviewer: { displayName: 'Carlos Silva' },
          starRating: 'FIVE',
          comment: 'La cabina de fotos fue lo mejor de la fiesta.',
          createTime: '2026-09-18T10:00:00.000Z',
          reviewReply: {
            comment: '¡Muchas gracias Carlos!',
            updateTime: '2026-09-19T10:00:00.000Z',
          },
        },
      ],
      averageRating: 5.0,
      totalReviewCount: 2,
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockReviewsResponse),
    });
    global.fetch = fetchMock as any;

    const res = await getGoogleBusinessReviews({
      accessToken: 'token-valido',
      accountLocationId: 'accounts/123/locations/456',
    });

    expect(res.success).toBe(true);
    expect(res.reviews).toHaveLength(2);

    // Reseña sin responder: debe traer borrador sugerido amable
    const rev1 = res.reviews.find((r) => r.reviewId === 'rev-001');
    expect(rev1?.reviewReply).toBeUndefined();
    expect(rev1?.borradorSugerido).toBeDefined();
    expect(typeof rev1?.borradorSugerido).toBe('string');
    expect(rev1?.borradorSugerido).toContain('AK Producciones');
    expect(rev1?.borradorSugerido).toMatch(/Laura Benítez/);

    // Reseña ya respondida: no necesita borrador
    const rev2 = res.reviews.find((r) => r.reviewId === 'rev-002');
    expect(rev2?.reviewReply).toBeDefined();
    expect(rev2?.borradorSugerido).toBeUndefined();

    // Comprobar que NUNCA se llamó a PUT/reply (nada se publica solo)
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/reviews'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('si Google no da acceso con la cuenta conectada, lo dice en criollo', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: jest.fn().mockResolvedValue({
        error: { status: 'PERMISSION_DENIED', message: 'The caller does not have permission' },
      }),
    }) as any;

    const res = await getGoogleBusinessReviews({
      accessToken: 'token-sin-permisos',
      accountLocationId: 'accounts/123/locations/456',
    });

    expect(res.success).toBe(false);
    expect(res.errorCriollo).toContain('Google no da acceso');
  });

  it('solo se publica la respuesta cuando se llama explícitamente a replyToGoogleBusinessReview', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        comment: '¡Muchas gracias Laura por tu comentario!',
        updateTime: '2026-09-25T15:00:00.000Z',
      }),
    });
    global.fetch = fetchMock as any;

    const resultadoPublicacion = await replyToGoogleBusinessReview({
      accessToken: 'token-valido',
      accountLocationId: 'accounts/123/locations/456',
      reviewId: 'rev-001',
      comment: '¡Muchas gracias Laura por tu comentario!',
    });

    expect(resultadoPublicacion.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://mybusiness.googleapis.com/v4/accounts/123/locations/456/reviews/rev-001/reply',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ comment: '¡Muchas gracias Laura por tu comentario!' }),
      })
    );
  });
});
