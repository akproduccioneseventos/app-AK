jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ userId: 'admin', role: 'admin' }),
  requirePermisoAlguno: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: jest.fn(),
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));

import {
  getSocialGlobalSettings,
  saveSocialGlobalSettings,
  getSocialFeedsAdmin,
  toggleFeedOverrideAdmin,
  type SocialGlobalSettings,
} from '@/app/actions/social-admin';
import { readData, writeData } from '@/lib/data-service';
import { getFiestas, getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';

const mockReadData = readData as jest.MockedFunction<typeof readData>;
const mockWriteData = writeData as jest.MockedFunction<typeof writeData>;
const mockGetFiestas = getFiestas as jest.MockedFunction<typeof getFiestas>;
const mockGetFiestaById = getFiestaById as jest.MockedFunction<typeof getFiestaById>;
const mockSaveFiesta = saveFiesta as jest.MockedFunction<typeof saveFiesta>;

describe('social-admin actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSocialGlobalSettings y saveSocialGlobalSettings', () => {
    it('obtiene la configuración global por defecto cuando no hay datos', async () => {
      mockReadData.mockResolvedValue({});
      const settings = await getSocialGlobalSettings();

      expect(settings.adFrequency).toBe(4);
      expect(settings.ads.length).toBeGreaterThan(0);
      expect(settings.ads[0].title).toBe('Plataforma 360° Premium');
    });

    it('guarda la configuración global de publicidad en redes', async () => {
      mockWriteData.mockResolvedValue(undefined);
      const customSettings: SocialGlobalSettings = {
        adFrequency: 5,
        ads: [
          {
            id: 'ad-custom-1',
            title: 'Promo Flash',
            description: 'Descuento especial',
            imageUrl: 'https://img.test/ad.jpg',
            ctaText: 'Ver promo',
            ctaUrl: '/promos',
            enabled: true,
          },
        ],
      };

      const res = await saveSocialGlobalSettings(customSettings);
      expect(res.success).toBe(true);
      expect(mockWriteData).toHaveBeenCalledWith('social-global-settings.json', customSettings);
    });
  });

  describe('getSocialFeedsAdmin', () => {
    it('devuelve el estado del feed social para las fiestas', async () => {
      mockGetFiestas.mockResolvedValue([
        {
          id: 'fiesta-1',
          configuracion: {
            nombreEvento: 'Boda de Prueba',
            fechaEvento: '2026-12-31T21:00:00.000Z',
          },
          socialGallerySettings: {
            enabled: true,
            title: 'Muro Boda',
          },
        } as any,
      ]);

      const feeds = await getSocialFeedsAdmin();
      expect(feeds).toHaveLength(1);
      expect(feeds[0].id).toBe('fiesta-1');
      expect(feeds[0].nombreEvento).toBe('Boda de Prueba');
      expect(feeds[0].manualEnabled).toBe(true);
    });
  });

  describe('toggleFeedOverrideAdmin', () => {
    it('habilita o deshabilita manualmente el feed de una fiesta', async () => {
      const fiesta = {
        id: 'fiesta-2',
        socialGallerySettings: {
          enabled: true,
        },
      } as any;

      mockGetFiestaById.mockResolvedValue(fiesta);
      mockSaveFiesta.mockResolvedValue({ success: true, fiesta });

      const res = await toggleFeedOverrideAdmin('fiesta-2', false);
      expect(res.success).toBe(true);
      expect(mockSaveFiesta).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'fiesta-2',
          socialGallerySettings: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });
  });
});
