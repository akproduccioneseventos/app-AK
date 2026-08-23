import { toWhatsAppNumber, normalizeUruguayPhone, isValidUruguayMobile } from '@/lib/commercial/contact';
import {
  unmarkMessageAsSent,
  updateScheduledMessageText,
  generateWhatsAppClickUrl,
} from '@/app/actions/scheduled-messages';

const datosGuardados: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    return datosGuardados[file] !== undefined ? JSON.parse(JSON.stringify(datosGuardados[file])) : fallback;
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    datosGuardados[file] = JSON.parse(JSON.stringify(data));
  }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn().mockResolvedValue({ ok: true }),
  requireAppSession: jest.fn().mockResolvedValue({ user: { email: 'test@ak.uy' } }),
}));

describe('BLOQUE 2.1: WhatsApp outbox y formato de numeros uruguayos', () => {
  beforeEach(() => {
    for (const key of Object.keys(datosGuardados)) {
      delete datosGuardados[key];
    }
    jest.clearAllMocks();
  });

  describe('Formateo de telefonos para WhatsApp (toWhatsAppNumber)', () => {
    it('formatea correctamente un numero con 09X XXX XXX', () => {
      expect(toWhatsAppNumber('098 555 123')).toBe('59898555123');
      expect(toWhatsAppNumber('099123456')).toBe('59899123456');
    });

    it('formatea correctamente un numero con codigo internacional +598 9X XXX XXX', () => {
      expect(toWhatsAppNumber('+598 98 555 123')).toBe('59898555123');
      expect(toWhatsAppNumber('59899123456')).toBe('59899123456');
    });

    it('formatea correctamente un numero sin el cero inicial 9X XXX XXX', () => {
      expect(toWhatsAppNumber('98 555 123')).toBe('59898555123');
      expect(toWhatsAppNumber('99123456')).toBe('59899123456');
    });

    it('devuelve cadena vacia para telefonos invalidos o fijos', () => {
      expect(toWhatsAppNumber('')).toBe('');
      expect(toWhatsAppNumber(null)).toBe('');
      expect(toWhatsAppNumber('0473 1234')).toBe(''); // Fijo de Salto no es movil
      expect(toWhatsAppNumber('12345')).toBe('');
    });
  });

  describe('Acciones de reversion y edicion de mensajes programados', () => {
    it('unmarkMessageAsSent devuelve el mensaje a estado pendiente', async () => {
      datosGuardados['scheduled-messages.json'] = [
        {
          id: 'msg_1',
          targetName: 'Juan Perez',
          targetPhone: '098555123',
          messageText: 'Hola Juan',
          status: 'enviado',
          scheduledAt: '2026-08-22T10:00:00.000Z',
          sentAt: '2026-08-22T10:05:00.000Z',
          sentBy: 'usuario',
        },
      ];

      const res = await unmarkMessageAsSent('msg_1');
      expect(res.success).toBe(true);

      const guardados = datosGuardados['scheduled-messages.json'];
      expect(guardados[0].status).toBe('pendiente');
      expect(guardados[0].sentAt).toBeUndefined();
      expect(guardados[0].sentBy).toBeUndefined();
    });

    it('updateScheduledMessageText modifica el texto del mensaje', async () => {
      datosGuardados['scheduled-messages.json'] = [
        {
          id: 'msg_2',
          targetName: 'Maria Rodriguez',
          targetPhone: '099123456',
          messageText: 'Texto viejo',
          status: 'pendiente',
          scheduledAt: '2026-08-22T12:00:00.000Z',
        },
      ];

      const res = await updateScheduledMessageText('msg_2', 'Texto editado y personalizado');
      expect(res.success).toBe(true);

      const guardados = datosGuardados['scheduled-messages.json'];
      expect(guardados[0].messageText).toBe('Texto editado y personalizado');
    });

    it('generateWhatsAppClickUrl arma un enlace con codigo 598 valido', async () => {
      const url = await generateWhatsAppClickUrl('Hola', '098 555 123');
      expect(url).toContain('https://wa.me/59898555123');
      expect(url).toContain('text=Hola');
    });
  });
});
