/** @jest-environment node */
import { NextRequest } from 'next/server';

const mockProcesar = jest.fn();
const mockBorrador = jest.fn();
jest.mock('@/app/actions/whatsapp', () => ({
  getWhatsAppConfig: jest.fn(async () => ({ enabled: true })),
  processIncomingMessage: (...args: unknown[]) => mockProcesar(...args),
}));
jest.mock('@/lib/whatsapp/vino-de-la-publicidad', () => ({ correspondeContestarSolo: jest.fn(async () => true) }));
jest.mock('@/lib/asistente/por-whatsapp', () => ({
  atenderAlEquipo: jest.fn(async () => ({ atendido: false })),
  atenderProspectoAnuncioWhatsApp: (...args: unknown[]) => mockBorrador(...args),
}));
import { POST } from '@/app/api/whatsapp/webhook/route';

describe('Orden 255: el webhook de anuncios nunca envia el borrador', () => {
  beforeEach(() => jest.clearAllMocks());
  test.each([true, false])('con completo=%s no activa el bot de envio', async (completo) => {
    mockBorrador.mockResolvedValue({ completo, faltantes: [], error: completo ? undefined : 'Sin precios confirmados' });
    const response = await POST(new NextRequest('https://example.test/api/whatsapp/webhook', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ object: 'whatsapp_business_account', entry: [{ changes: [{ value: {
        messages: [{ id: 'wamid-ad-1', from: '59899111222', type: 'text', text: { body: 'Boda con 100 invitados' } }],
      } }] }] }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ respondido: false, requiereRevision: true });
    expect(mockBorrador).toHaveBeenCalledWith(expect.objectContaining({ messageId: 'wamid-ad-1' }));
    expect(mockProcesar).not.toHaveBeenCalled();
  });
});
