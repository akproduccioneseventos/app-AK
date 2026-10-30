import { toPublicSocialEvent } from '@/lib/social-fiesta/public-event';
import { filtrarPorEstacion } from '@/lib/entertainment/station-config';
jest.mock('@/lib/asistente/propuestas-service', () => ({
  agregarPropuestasDeduplicadas: jest.fn().mockResolvedValue(undefined),
}));
import { atenderProspectoAnuncioWhatsApp } from '@/lib/asistente/por-whatsapp';

describe('Orden 205 - Devolución PR 1344', () => {
  describe('Álbum y estaciones', () => {
    it('filtrarPorEstacion para buzon conserva capsulaTiempo y sus variantes', () => {
      const posts = [
        { id: '1', sourceModule: 'buzon' },
        { id: '2', sourceModule: 'capsulaTiempo' },
        { id: '3', sourceModule: 'capsula_tiempo' },
        { id: '4', sourceModule: 'audio_guestbook' },
        { id: '5', sourceModule: 'trivia' },
      ];
      const resultado = filtrarPorEstacion(posts, 'buzon');
      expect(resultado).toHaveLength(4);
      expect(resultado.map((p) => p.id)).toEqual(['1', '2', '3', '4']);
    });

    it('toPublicSocialEvent expone configuración de Realidad Aumentada sin filtrar campos sensibles', () => {
      const fiestaMock: any = {
        id: 'fiesta-ar-1',
        configuracion: {
          nombreEvento: 'XV de Sofía',
          fechaEvento: '2027-03-15',
        },
        tieneRealidadAumentada: true,
        mindTargetUrl: 'https://storage.googleapis.com/test/card.mind',
      };
      const publico = toPublicSocialEvent(fiestaMock);
      expect(publico.tieneRealidadAumentada).toBe(true);
      expect(publico.mindTargetUrl).toBe('https://storage.googleapis.com/test/card.mind');
    });
  });

  describe('WhatsApp prospecto anuncio', () => {
    it('pide los datos obligatorios, incluido el tipo de fiesta, si falta alguno', async () => {
      const res = await atenderProspectoAnuncioWhatsApp({
        phone: '59899112233',
        text: 'Hola quiero consultar por una fiesta',
      });
      expect(res.completo).toBe(false);
      expect(res.faltantes.length).toBeGreaterThan(0);
      expect(res.faltantes).toContain('el tipo de fiesta');
      expect(res.respuestaTexto).toContain('necesitamos saber');
    });
  });
});
