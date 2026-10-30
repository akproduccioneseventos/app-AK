/** @jest-environment node */
import { NextRequest } from 'next/server';

const mockProcesar = jest.fn();
const mockBorrador = jest.fn();
const mockCorresponde = jest.fn();
jest.mock('@/app/actions/whatsapp', () => ({
  getWhatsAppConfig: jest.fn(async () => ({ enabled: true })),
  processIncomingMessage: (...args: unknown[]) => mockProcesar(...args),
}));
jest.mock('@/lib/whatsapp/vino-de-la-publicidad', () => ({
  correspondeContestarSolo: (...args: unknown[]) => mockCorresponde(...args),
}));
jest.mock('@/lib/asistente/por-whatsapp', () => ({
  atenderAlEquipo: jest.fn(async () => ({ atendido: false })),
  atenderProspectoAnuncioWhatsApp: (...args: unknown[]) => mockBorrador(...args),
}));
import { POST } from '@/app/api/whatsapp/webhook/route';
import { WHATSAPP_WEBHOOK_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';

function metaRequest() {
  return new NextRequest('https://example.test/api/whatsapp/webhook', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ object: 'whatsapp_business_account', entry: [{ changes: [{ value: {
        contacts: [{ profile: { name: 'Prospecto' } }],
        messages: [{ id: 'wamid-ad-1', from: '59899111222', type: 'text', text: { body: 'Hola, quiero saber mas' }, referral: { source_type: 'ad' } }],
      } }] }] }),
  });
}

function twilioRequest() {
  return new NextRequest('https://example.test/api/whatsapp/webhook', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ From: 'whatsapp:59899111222', Body: 'Hola, quiero saber mas', ProfileName: 'Prospecto' }).toString(),
  });
}

describe('Orden 256: anuncios conversan automaticamente; presupuesto y fotos requieren envio humano', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCorresponde.mockResolvedValue(true);
    mockBorrador.mockResolvedValue({ completo: false, faltantes: ['fecha'] });
    mockProcesar.mockResolvedValue({ success: true, botResponse: 'Hola! Que fecha tenes pensada?' });
  });

  test('un prospecto de anuncio recibe la respuesta automatica habitual de Meta', async () => {
    const response = await POST(metaRequest());
    expect(response.status).toBe(200);
    expect(mockProcesar).toHaveBeenCalledWith('59899111222', 'Hola, quiero saber mas', 'Prospecto', WHATSAPP_WEBHOOK_INTERNAL_TOKEN);
    expect(mockBorrador).toHaveBeenCalledWith(expect.objectContaining({ messageId: 'wamid-ad-1' }));
  });

  test('no responde ni prepara presupuesto a numeros sin origen publicitario', async () => {
    mockCorresponde.mockResolvedValue(false);
    const response = await POST(metaRequest());
    expect(await response.json()).toMatchObject({ respondido: false, motivo: 'No viene de la publicidad: contesta una persona.' });
    expect(mockProcesar).not.toHaveBeenCalled();
    expect(mockBorrador).not.toHaveBeenCalled();
  });

  test.each([metaRequest, twilioRequest])('el presupuesto y fotos quedan sin enviar por ambos proveedores', async request => {
    mockBorrador.mockResolvedValue({ completo: true, faltantes: [] });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ completo: true, respondido: false, requiereRevision: true });
    expect(mockProcesar).not.toHaveBeenCalled();
  });

  test('Twilio recibe la charla en TwiML con caracteres escapados', async () => {
    mockProcesar.mockResolvedValue({ success: true, botResponse: 'Salon & fotos <sin reserva>' });
    const response = await POST(twilioRequest());
    expect(response.headers.get('content-type')).toContain('text/xml');
    expect(await response.text()).toBe('<?xml version="1.0" encoding="UTF-8"?><Response><Message>Salon &amp; fotos &lt;sin reserva&gt;</Message></Response>');
    expect(mockProcesar).toHaveBeenCalledTimes(1);
  });

  test('si falta precio confirmado no inventa presupuesto y conserva la charla comun', async () => {
    mockBorrador.mockResolvedValue({ completo: false, faltantes: [], error: 'Sin precios confirmados' });
    expect((await POST(metaRequest())).status).toBe(200);
    expect(mockProcesar).toHaveBeenCalledTimes(1);
  });

  test('un fallo del bot se reconoce sin inventar una respuesta enviada', async () => {
    mockProcesar.mockResolvedValue({ success: false, error: 'Proveedor no disponible' });
    const response = await POST(twilioRequest());
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(mockProcesar).toHaveBeenCalledTimes(1);
  });
});
