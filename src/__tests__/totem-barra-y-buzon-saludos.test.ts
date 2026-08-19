import { detectBuzonMedia } from '@/lib/buzon/media-upload';
import { buildPublicEventTools } from '@/lib/guest-portal/public-event-navigation';
import type { PublicGuestEvent } from '@/lib/guest-portal-public-data';

describe('Totem de la Barra y Buzon de Saludos', () => {
  describe('Buzon de Saludos - Soporte de Fotos en Backend', () => {
    it('detecta correctamente imagenes JPEG como mediaType photo', () => {
      // JPEG magic bytes: FF D8 FF
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const result = detectBuzonMedia(jpegBytes, 'photo', 'image/jpeg');

      expect(result).not.toBeNull();
      expect(result?.mediaType).toBe('photo');
      expect(result?.extension).toBe('.jpg');
      expect(result?.contentType).toBe('image/jpeg');
    });

    it('detecta correctamente imagenes PNG como mediaType photo', () => {
      // PNG magic bytes: 89 50 4E 47
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      const result = detectBuzonMedia(pngBytes, 'photo', 'image/png');

      expect(result).not.toBeNull();
      expect(result?.mediaType).toBe('photo');
      expect(result?.extension).toBe('.png');
      expect(result?.contentType).toBe('image/png');
    });

    it('detecta correctamente imagenes WEBP como mediaType photo', () => {
      // RIFF .... WEBP
      const webpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      const result = detectBuzonMedia(webpBytes, 'photo', 'image/webp');

      expect(result).not.toBeNull();
      expect(result?.mediaType).toBe('photo');
      expect(result?.extension).toBe('.webp');
      expect(result?.contentType).toBe('image/webp');
    });

    it('rechaza archivos que no coincidan con audio, video o foto', () => {
      const randomBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      expect(detectBuzonMedia(randomBytes, 'pdf', 'application/pdf')).toBeNull();
    });
  });

  describe('Portal del Invitado - Acceso al Buzon de Saludos', () => {
    const baseEvent: PublicGuestEvent = {
      configuracion: {
        nombreEvento: 'Cumpleanos de Sofia',
        nombreAgasajado: 'Sofia',
        tipoCelebracion: '15_anos',
        fechaEvento: '2026-10-20',
        horaInicio: '21:00',
        nombreLugar: 'Salon Las Lilas',
        direccionLugar: 'Av. Italia 1234',
      },
      guestPortalSettings: {
        showMural: true,
        showFotos: true,
        showInvitacionWeb: true,
        showMesaAsignada: true,
        showItinerario: true,
        showMusica: true,
        showRegalos: false,
        showCheckin: true,
        showBuzon: true,
      },
      buzonConfig: {
        enabled: true,
      },
      modulosContratados: {
        buzon: true,
      } as any,
      programa: [],
    };

    it('agrega la herramienta "buzon" cuando el buzon esta habilitado en la fiesta', () => {
      const tools = buildPublicEventTools({
        fiestaId: 'fiesta-123',
        guestId: 'guest-456',
        guestAccessToken: 'token-abc',
        event: baseEvent,
        photoCount: 5,
      });

      const buzonTool = tools.find((t) => t.id === 'buzon');
      expect(buzonTool).toBeDefined();
      expect(buzonTool?.label).toBe('Buzón de saludos');
      expect(buzonTool?.href).toContain('/evento/buzon/fiesta-123');
      expect(buzonTool?.href).toContain('guestId=guest-456');
    });

    it('no incluye "buzon" si buzonConfig.enabled es false', () => {
      const eventSinBuzon: PublicGuestEvent = {
        ...baseEvent,
        buzonConfig: {
          enabled: false,
        },
      };

      const tools = buildPublicEventTools({
        fiestaId: 'fiesta-123',
        guestId: 'guest-456',
        guestAccessToken: 'token-abc',
        event: eventSinBuzon,
        photoCount: 5,
      });

      const buzonTool = tools.find((t) => t.id === 'buzon');
      expect(buzonTool).toBeUndefined();
    });

    it('no incluye "buzon" si guestPortalSettings.showBuzon es false', () => {
      const eventConBuzonOculto: PublicGuestEvent = {
        ...baseEvent,
        guestPortalSettings: {
          ...baseEvent.guestPortalSettings,
          showBuzon: false,
        },
      };

      const tools = buildPublicEventTools({
        fiestaId: 'fiesta-123',
        guestId: 'guest-456',
        guestAccessToken: 'token-abc',
        event: eventConBuzonOculto,
        photoCount: 5,
      });

      const buzonTool = tools.find((t) => t.id === 'buzon');
      expect(buzonTool).toBeUndefined();
    });
  });
});
