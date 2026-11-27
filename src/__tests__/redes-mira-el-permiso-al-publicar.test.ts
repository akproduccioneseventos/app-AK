let mockPosts: any[] = [];
let mockPermisoFotos: string[] = [];
const sendWhatsappMock = jest.fn();
const publishFbMock = jest.fn();
const notifMock = jest.fn();

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, def: any) => {
    if (file === 'social-posts.json') return JSON.parse(JSON.stringify(mockPosts));
    if (file === 'presencia-digital-ajustes.json') return { activo: true, publicarSolo: true };
    if (file === 'social-connections.json') return [{ platform: 'Facebook', isConnected: true, pageId: 'pg1', pageAccessToken: 'tok1' }];
    if (file === 'asistente-settings.json') return { numeroDuenio: '099111222' };
    return def;
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file === 'social-posts.json') mockPosts = JSON.parse(JSON.stringify(data));
  }),
  mutateDataItem: jest.fn(async (file: string, _col: string, id: string, cb: (p: any) => any) => {
    if (file !== 'social-posts.json') return null;
    const idx = mockPosts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated = cb(JSON.parse(JSON.stringify(mockPosts[idx])));
    if (!updated) return null;
    mockPosts[idx] = JSON.parse(JSON.stringify(updated));
    return updated;
  }),
  createDataItem: jest.fn(),
}));

jest.mock('@/lib/auth/solo-lectura', () => ({
  exigirQueNoSalgaAfuera: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: (...args: any[]) => sendWhatsappMock(...args),
}));
jest.mock('@/lib/social-media/meta-publisher', () => ({
  publishToFacebookPage: (...args: any[]) => publishFbMock(...args),
  publishToInstagramBusiness: jest.fn().mockResolvedValue({ success: true }),
}));
jest.mock('@/lib/asistente/comercial-borrador', () => ({
  fotosPromocionalesDeFiesta: jest.fn(async () => mockPermisoFotos.map((url) => ({ id: url, url }))),
  validarFotosPromocionalesAlEnviar: jest.fn(async () => ({ allowed: true })),
}));
jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: (...args: any[]) => notifMock(...args),
}));

import { procesarBorradoresPublicarSolo, procesarPosteosProgramados } from '@/lib/presencia-digital/publicador';

describe('Orden 361: redes mira el permiso al publicar y mide 12h desde el aviso al dueño', () => {
  const prevWaToken = process.env.META_WHATSAPP_TOKEN;
  const prevPhoneId = process.env.META_WHATSAPP_PHONE_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    process.env.META_WHATSAPP_TOKEN = 'wa_tok';
    process.env.META_WHATSAPP_PHONE_ID = 'wa_phone';
    mockPosts = [];
    mockPermisoFotos = [];
    publishFbMock.mockResolvedValue({ success: true });
  });

  afterAll(() => {
    process.env.META_WHATSAPP_TOKEN = prevWaToken;
    process.env.META_WHATSAPP_PHONE_ID = prevPhoneId;
  });

  it('no publica un posteo programado cuya foto perdió el permiso promocional', async () => {
    mockPosts = [
      {
        id: 'post_revocado',
        platform: 'Facebook',
        status: 'Programado',
        publishDate: '2026-11-26T10:00:00.000Z',
        eventId: 'fiesta_1',
        mediaUrl: 'https://cdn/foto_revocada.jpg',
        text: 'Fiesta increíble',
        createdAt: '2026-11-25T10:00:00.000Z',
        updatedAt: '2026-11-25T10:00:00.000Z',
      },
    ];
    mockPermisoFotos = []; // Permiso revocado

    const res = await procesarPosteosProgramados(3, new Date('2026-11-26T12:00:00.000Z'));
    expect(publishFbMock).not.toHaveBeenCalled();
    expect(res.publicados).toEqual([]);
    expect(res.fallados).toHaveLength(1);
    expect(res.fallados[0].error).toContain('Rechazado por permiso');
    expect(mockPosts[0].status).toBe('Rechazado por permiso');
  });

  it('si enviarPreviewBorradorAlDuenio falla no marca previewEnviadaAlDuenioAt y espera 12h desde el aviso real', async () => {
    const hace48Horas = '2026-11-24T10:00:00.000Z';
    mockPosts = [
      {
        id: 'borrador_viejo',
        platform: 'Facebook',
        status: 'Borrador',
        publishDate: '2026-11-26T23:00:00.000Z',
        text: 'Borrador viejo sin aviso previo',
        createdAt: hace48Horas,
        updatedAt: hace48Horas,
      },
    ];

    sendWhatsappMock.mockResolvedValueOnce({ success: false });
    const ahora = new Date('2026-11-26T12:00:00.000Z');
    const r1 = await procesarBorradoresPublicarSolo(ahora);
    expect(r1.promocionados).toEqual([]);
    expect(mockPosts[0].previewEnviadaAlDuenioAt).toBeUndefined();
    expect(mockPosts[0].status).toBe('Borrador');

    // Ahora el aviso sí sale: se marca la fecha del aviso pero sigue esperando 12h
    sendWhatsappMock.mockResolvedValueOnce({ success: true });
    const r2 = await procesarBorradoresPublicarSolo(ahora);
    expect(r2.promocionados).toEqual([]);
    expect(mockPosts[0].previewEnviadaAlDuenioAt).toBe(ahora.toISOString());

    // 13 horas después del aviso, recién pasa a Programado
    const treceHorasDespues = new Date(ahora.getTime() + 13 * 60 * 60 * 1000);
    const r3 = await procesarBorradoresPublicarSolo(treceHorasDespues);
    expect(r3.promocionados).toEqual(['borrador_viejo']);
    expect(mockPosts[0].status).toBe('Programado');
  });
});
