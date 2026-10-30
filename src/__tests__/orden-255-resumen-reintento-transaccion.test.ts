let registro: any = {};
jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (_path: string, _initial: unknown, change: (data: any) => any) => {
    const next = change(registro);
    if (next !== null) registro = next;
    return next;
  }),
}));
jest.mock('@/lib/asistente/avisar-al-duenio', () => ({ getAsistenteSettings: jest.fn() }));
jest.mock('@/lib/firebase/server-messaging', () => ({ sendPushNotificationToAll: jest.fn() }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: jest.fn() }));
jest.mock('@/lib/ia/aprender-de-lo-aprobado', () => ({ aprenderDeLoAprobado: jest.fn().mockResolvedValue([]), resumirGuiaDeEstilo: jest.fn(() => 'cálido, profesional y directo') }));

import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import { sendPushNotificationToAll } from '@/lib/firebase/server-messaging';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { enviarResumenMananaWhatsApp } from '@/lib/asistente/resumen-manana-whatsapp';

const settings = getAsistenteSettings as jest.Mock;
const push = sendPushNotificationToAll as jest.Mock;
const meta = sendMetaWhatsAppMessage as jest.Mock;
const ahora = new Date('2026-10-29T11:30:00.000Z');
const parte = {
  fecha: '2026-10-29', textoHablado: '', textoResumen: '', totalPendientes: 6,
  itemsPrincipales: Array.from({ length: 6 }, (_, index) => ({
    id: `actual-${index + 1}`, tipo: 'fiesta_proxima' as const,
    titulo: `Punto actual ${index + 1}`, detalle: 'solo vigente', accionHref: '/mi-dia',
  })),
};

beforeEach(() => {
  jest.clearAllMocks();
  registro = {};
  settings.mockResolvedValue({
    whatsappDuenioHabilitado: true,
    numeroDuenio: '59899123456',
    numerosEquipo: [{ telefono: '099 123 456', nombre: 'Dueño', rol: 'Dueño' }],
  });
  meta.mockResolvedValue({ success: true, delivery: 'sent', messageId: 'wamid-1' });
  push.mockResolvedValue({ success: true, sentCount: 1, failureCount: 0 });
  process.env.META_WHATSAPP_TOKEN = 'token';
  process.env.META_WHATSAPP_PHONE_ID = 'phone-id';
});

describe('resumen matutino transaccional y respuesta segura', () => {
  it('envía solo al dueño del roster, conserva como máximo cuatro ítems reales y hasta cinco líneas', async () => {
    registro.pospuestosIds = ['actual-5'];
    const result = await enviarResumenMananaWhatsApp(parte, ahora);
    expect(result.enviado).toBe(true);
    expect(meta.mock.calls[0][0].to).toBe('59899123456');
    expect(meta.mock.calls[0][0].text.split('\n')).toHaveLength(5);
    expect(registro).toMatchObject({
      fecha: '2026-10-29', estado: 'whatsapp_enviado', destinatario: '59899123456',
      messageId: 'wamid-1',
    });
    expect(registro.items.map((item: any) => item.id)).toEqual(['actual-5', 'actual-1', 'actual-2', 'actual-3']);
    expect(registro.pospuestosIds).toEqual([]);
  });

  it('si WhatsApp es incierto, registra estado incierto y bloquea duplicar en la ventana', async () => {
    meta.mockResolvedValue({ success: false, delivery: 'uncertain', error: 'timeout' });
    push.mockResolvedValue({ success: false, sentCount: 0, failureCount: 1, error: 'push rechazado' });
    const first = await enviarResumenMananaWhatsApp(parte, ahora);
    const second = await enviarResumenMananaWhatsApp(parte, ahora);
    expect(first).toMatchObject({ enviado: false, fallbackPush: false });
    expect(registro.estado).toBe('envio_incierto');
    expect(second.motivo).toMatch(/ya se procesó/i);
    expect(meta).toHaveBeenCalledTimes(1);
  });

  it('sin messageId no afirma WhatsApp enviado aunque success sea true', async () => {
    meta.mockResolvedValue({ success: true, delivery: 'sent' });
    const result = await enviarResumenMananaWhatsApp(parte, ahora);
    expect(result.enviado).toBe(false);
    expect(registro.estado).toBe('push_fallback_incierto');
    expect(registro.messageId).toBeUndefined();
  });

  it('reintenta en la ventana solo tras rechazo definitivo y fallo confirmado del push', async () => {
    meta.mockResolvedValueOnce({ success: false, delivery: 'not_sent', error: 'rechazo definitivo' })
      .mockResolvedValueOnce({ success: true, delivery: 'sent', messageId: 'wamid-retry' });
    push.mockResolvedValueOnce({ success: false, sentCount: 0, failureCount: 1, error: 'push rechazado' });
    const first = await enviarResumenMananaWhatsApp(parte, ahora);
    expect(first.fallbackPush).toBe(false);
    expect(registro.estado).toBe('error');

    const retry = await enviarResumenMananaWhatsApp(parte, ahora);
    expect(retry.enviado).toBe(true);
    expect(registro).toMatchObject({ estado: 'whatsapp_enviado', messageId: 'wamid-retry' });
    expect(meta).toHaveBeenCalledTimes(2);
  });

  it('no autoriza WhatsApp por solo coincidir numeroDuenio si falta rol dueño en numerosEquipo', async () => {
    settings.mockResolvedValue({ whatsappDuenioHabilitado: true, numeroDuenio: '59899123456', numerosEquipo: [] });
    const result = await enviarResumenMananaWhatsApp(parte, ahora);
    expect(result.fallbackPush).toBe(true);
    expect(meta).not.toHaveBeenCalled();
  });
});
