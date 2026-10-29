let reservaDiaria: any = {};

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  getAsistenteSettings: jest.fn(async () => ({ whatsappDuenioHabilitado: false, numeroDuenio: '59812345678' })),
}));
jest.mock('@/lib/firebase/server-messaging', () => ({ sendPushNotificationToAll: jest.fn(async () => undefined) }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: jest.fn(async () => ({ success: true, messageId: 'wamid-test' })) }));
jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (_path: string, _empty: unknown, change: (data: any) => any) => {
    const next = await change(reservaDiaria);
    if (next !== null) reservaDiaria = next;
    return next;
  }),
}));

import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import { sendPushNotificationToAll } from '@/lib/firebase/server-messaging';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { enviarResumenMananaWhatsApp } from '@/lib/asistente/resumen-manana-whatsapp';

describe('Orden 255: resumen matutino del asistente AK', () => {
  const parte: any = {
    fecha: '2026-10-28',
    itemsPrincipales: [
      { id: 'a', tipo: 'fiesta_proxima', titulo: 'Preparar la fiesta del sábado' },
      { id: 'b', tipo: 'prospecto', titulo: 'Revisar propuestas pendientes' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    reservaDiaria = {};
    delete process.env.META_WHATSAPP_TOKEN;
    delete process.env.META_WHATSAPP_PHONE_ID;
  });

  test('envía al push genérico si falta WhatsApp y no repite el resumen del día', async () => {
    const hoy = new Date('2026-10-28T11:30:00.000Z'); // 08:30 en Uruguay
    const primero = await enviarResumenMananaWhatsApp(parte, hoy);
    const segundo = await enviarResumenMananaWhatsApp(parte, hoy);

    expect(primero).toMatchObject({ enviado: false, fallbackPush: true });
    expect(segundo.motivo).toMatch(/ya se procesó/i);
    expect(sendPushNotificationToAll).toHaveBeenCalledTimes(1);
    expect((sendPushNotificationToAll as jest.Mock).mock.calls[0][0].body).not.toMatch(/saldo|cobro|\$/i);
    expect(reservaDiaria).toMatchObject({ fecha: '2026-10-28', estado: 'push_fallback' });
  });

  test('cuando el dueño lo habilitó, manda como máximo cinco líneas al número configurado', async () => {
    (getAsistenteSettings as jest.Mock).mockResolvedValueOnce({ whatsappDuenioHabilitado: true, numeroDuenio: '59812345678' });
    process.env.META_WHATSAPP_TOKEN = 'test-token';
    process.env.META_WHATSAPP_PHONE_ID = '123456';
    const parteLarga = { ...parte, itemsPrincipales: Array.from({ length: 8 }, (_, i) => ({ id: String(i), titulo: `Punto ${i + 1}` })) };

    const result = await enviarResumenMananaWhatsApp(parteLarga, new Date('2026-10-28T11:30:00.000Z'));

    expect(result.enviado).toBe(true);
    const envio = (sendMetaWhatsAppMessage as jest.Mock).mock.calls[0][0];
    expect(envio.to).toBe('59812345678');
    expect(envio.text.split('\n')).toHaveLength(5);
    expect(sendPushNotificationToAll).not.toHaveBeenCalled();
    expect(reservaDiaria.estado).toBe('whatsapp_enviado');
  });
});
