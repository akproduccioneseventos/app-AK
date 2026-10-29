jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (_path: string, _initial: unknown, update: (data: unknown) => unknown) => {
    update({});
    return update({ fecha: '2026-10-29', estado: 'whatsapp_enviado' });
  }),
}));
jest.mock('@/lib/asistente/avisar-al-duenio', () => ({ getAsistenteSettings: jest.fn() }));
jest.mock('@/lib/firebase/server-messaging', () => ({ sendPushNotificationToAll: jest.fn() }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: jest.fn() }));
import { enviarResumenMananaWhatsApp } from '@/lib/asistente/resumen-manana-whatsapp';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { sendPushNotificationToAll } from '@/lib/firebase/server-messaging';

test('un reintento que pierde la reserva no envia resumen ni push duplicado', async () => {
  const result = await enviarResumenMananaWhatsApp({
    fecha: '2026-10-29', textoHablado: '', textoResumen: '', itemsPrincipales: [], totalPendientes: 0,
  }, new Date('2026-10-29T11:30:00Z'));
  expect(result.enviado).toBe(false);
  expect(sendMetaWhatsAppMessage).not.toHaveBeenCalled();
  expect(sendPushNotificationToAll).not.toHaveBeenCalled();
});
