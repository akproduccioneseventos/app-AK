import { puedeImprimir } from '@/lib/social-fiesta/limite-de-impresion';
import type { SocialGalleryPost } from '@/types/social-gallery';

describe('Bloque 3 - Límite de impresión por invitado', () => {
  const postInvitadoA: SocialGalleryPost = {
    id: 'post-a-3',
    fiestaId: 'fiesta-1',
    authorName: 'Martín Rodríguez',
    guestId: 'invitado-a',
    imageUrl: 'https://ejemplo.com/foto-a-3.jpg',
    timestamp: new Date().toISOString(),
    approved: true,
  };

  const postInvitadoB: SocialGalleryPost = {
    id: 'post-b-2',
    fiestaId: 'fiesta-1',
    authorName: 'Lucía Fernández',
    guestId: 'invitado-b',
    imageUrl: 'https://ejemplo.com/foto-b-2.jpg',
    timestamp: new Date().toISOString(),
    approved: true,
  };

  const yaImpresos: SocialGalleryPost[] = [
    {
      id: 'post-a-1',
      fiestaId: 'fiesta-1',
      authorName: 'Martín Rodríguez',
      guestId: 'invitado-a',
      imageUrl: 'https://ejemplo.com/foto-a-1.jpg',
      timestamp: new Date().toISOString(),
      approved: true,
    },
    {
      id: 'post-a-2',
      fiestaId: 'fiesta-1',
      authorName: 'Martín Rodríguez',
      guestId: 'invitado-a',
      imageUrl: 'https://ejemplo.com/foto-a-2.jpg',
      timestamp: new Date().toISOString(),
      approved: true,
    },
    {
      id: 'post-b-1',
      fiestaId: 'fiesta-1',
      authorName: 'Lucía Fernández',
      guestId: 'invitado-b',
      imageUrl: 'https://ejemplo.com/foto-b-1.jpg',
      timestamp: new Date().toISOString(),
      approved: true,
    },
  ];

  it('un invitado que llegó al límite no puede imprimir más fotos', () => {
    // Límite configurado en 2: el invitado A ya tiene 2 impresas, no puede imprimir la 3ra
    const permitido = puedeImprimir(postInvitadoA, yaImpresos, 2);
    expect(permitido).toBe(false);
  });

  it('un invitado que no llegó al límite puede imprimir', () => {
    // Límite configurado en 2: la invitada B tiene 1 impresa, sí puede imprimir la 2da
    const permitido = puedeImprimir(postInvitadoB, yaImpresos, 2);
    expect(permitido).toBe(true);
  });

  it('si el límite es 0, no hay tope para ningún invitado', () => {
    const permitidoA = puedeImprimir(postInvitadoA, yaImpresos, 0);
    const permitidoB = puedeImprimir(postInvitadoB, yaImpresos, 0);
    expect(permitidoA).toBe(true);
    expect(permitidoB).toBe(true);
  });

  it('cuenta correctamente por authorName si no hay guestId', () => {
    const postSinGuestId: SocialGalleryPost = {
      id: 'post-anon-3',
      fiestaId: 'fiesta-1',
      authorName: 'Sofía Pereyra',
      imageUrl: 'https://ejemplo.com/foto-s-3.jpg',
      timestamp: new Date().toISOString(),
      approved: true,
    };

    const impresosSinGuestId: SocialGalleryPost[] = [
      {
        id: 'post-anon-1',
        fiestaId: 'fiesta-1',
        authorName: 'Sofía Pereyra',
        imageUrl: 'https://ejemplo.com/foto-s-1.jpg',
        timestamp: new Date().toISOString(),
        approved: true,
      },
      {
        id: 'post-anon-2',
        fiestaId: 'fiesta-1',
        authorName: 'Sofía Pereyra',
        imageUrl: 'https://ejemplo.com/foto-s-2.jpg',
        timestamp: new Date().toISOString(),
        approved: true,
      },
    ];

    expect(puedeImprimir(postSinGuestId, impresosSinGuestId, 2)).toBe(false);
    expect(puedeImprimir(postSinGuestId, impresosSinGuestId, 3)).toBe(true);
  });
});
