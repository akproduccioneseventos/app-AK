/** @jest-environment node */

let mockWhatsapp: any[] = [];
let mockComments: any[] = [];
let mockDms: any[] = [];
let mockReviews: any[] = [];
let mockPresupuestos: any[] = [];

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'whatsapp-conversations.json') return mockWhatsapp;
    if (file === 'social-comments.json') return mockComments;
    if (file === 'social-mensajes-directos.json') return mockDms;
    if (file === 'google-reviews.json') return mockReviews;
    if (file === 'presupuestos.json') return mockPresupuestos;
    return fallback;
  }),
  writeData: jest.fn(async () => {}),
}));

import { leerBandejaUnica } from '@/lib/mensajes/bandeja-unica';

describe('La bandeja junta todos los mensajes', () => {
  beforeEach(() => {
    mockWhatsapp = [
      {
        id: 'wa-1',
        phone: '099123456',
        name: 'Camila Cliente',
        messages: [{ text: 'Hola, tengo una consulta sobre mi fiesta', timestamp: '2026-10-20T10:00:00Z' }],
      },
    ];

    mockComments = [
      {
        id: 'comm-1',
        platform: 'Instagram',
        authorName: 'Lucía Pérez',
        text: '¿Cuánto sale la fotocabina?',
        createdAt: '2026-10-20T11:00:00Z',
      },
    ];

    mockDms = [
      {
        mid: 'dm-1',
        canal: 'instagram_dm',
        senderId: 'ig_user_1',
        senderName: 'Marcos Gómez',
        texto: 'Hola, hacen eventos empresariales?',
        timestamp: '2026-10-20T12:00:00Z',
      },
    ];

    mockReviews = [
      {
        id: 'rev-1',
        reviewerName: 'Valeria Silva',
        comment: 'Excelente el servicio del espejo mágico',
        createTime: '2026-10-20T13:00:00Z',
        starRating: 5,
      },
    ];

    mockPresupuestos = [
      {
        id: 'pres-1',
        clienteContacto: '099123456',
        clienteNombre: 'Camila Cliente',
      },
    ];
  });

  it('con un WhatsApp, un comentario, un mensaje directo y una reseña de mentira, leerBandejaUnica() devuelve los cuatro ordenados por fecha', async () => {
    const bandeja = await leerBandejaUnica();

    expect(bandeja.length).toBe(4);

    // Ordenados por fecha decreciente (más reciente primero)
    expect(bandeja[0].canal).toBe('google_review'); // 13:00
    expect(bandeja[1].canal).toBe('instagram_dm'); // 12:00
    expect(bandeja[2].canal).toBe('instagram_comentario'); // 11:00
    expect(bandeja[3].canal).toBe('whatsapp'); // 10:00
  });

  it('un número que es cliente sale marcado como cliente', async () => {
    const bandeja = await leerBandejaUnica();

    const mensajeCamila = bandeja.find(m => m.contacto?.includes('99123456') || m.autor.includes('Camila'));
    expect(mensajeCamila).toBeDefined();
    expect(mensajeCamila?.esCliente).toBe(true);

    const mensajeLucia = bandeja.find(m => m.autor.includes('Lucía'));
    expect(mensajeLucia).toBeDefined();
    expect(mensajeLucia?.esCliente).toBe(false);
  });
});
