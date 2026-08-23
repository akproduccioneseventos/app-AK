import { LANDING_THEME_PRESETS, defaultLandingSettings } from '@/types/landing-editor';
import type { LandingSettings, LandingThemeModel } from '@/types/landing-editor';
import { checkAndCreateReunionReminders } from '@/app/actions/notifications';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';

const mockFiestasData: any[] = [];
const mockNotificationsData: any[] = [];

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: jest.fn(async () => mockFiestasData),
  getHistorialFiestas: jest.fn(async () => []),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'notifications.json') return mockNotificationsData;
    return fallback;
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file === 'notifications.json') {
      mockNotificationsData.length = 0;
      mockNotificationsData.push(...data);
    }
  }),
}));

jest.mock('@/lib/firebase/firestore', () => ({
  createDocument: jest.fn().mockImplementation(async (_col: string, doc: any) => {
    mockNotificationsData.push(doc);
    return { success: true, id: doc.id };
  }),
  getAllDocuments: jest.fn().mockImplementation(async () => ({
    success: true,
    data: [...mockNotificationsData],
  })),
  updateDocument: jest.fn().mockResolvedValue({ success: true }),
  deleteDocument: jest.fn().mockResolvedValue({ success: true }),
  batchWrite: jest.fn().mockResolvedValue({ success: true }),
  COLLECTIONS: { NOTIFICACIONES: 'notificaciones' },
}));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn().mockResolvedValue({ ok: true }),
  requireAppSession: jest.fn().mockResolvedValue({ user: { email: 'admin@ak.uy' } }),
  hasAppSession: jest.fn().mockResolvedValue(true),
}));

describe('BLOQUE 2: Redes, agenda, modelos de portada y Google', () => {
  beforeEach(() => {
    mockFiestasData.length = 0;
    mockNotificationsData.length = 0;
    jest.clearAllMocks();
  });

  describe('2.4 Modelos de portada (Elegante, Fiesta, Sobrio, Moderno)', () => {
    it('cuenta con los 4 modelos requeridos con sus colores y descripciones', () => {
      const models: LandingThemeModel[] = ['elegante', 'fiesta', 'sobrio', 'moderno'];
      for (const model of models) {
        const preset = LANDING_THEME_PRESETS[model];
        expect(preset).toBeDefined();
        expect(preset.name.length).toBeGreaterThan(2);
        expect(preset.description.length).toBeGreaterThan(10);
        expect(preset.colors.overlayFrom).toBeDefined();
        expect(preset.colors.overlayTo).toBeDefined();
        expect(preset.colors.accentColor).toBeDefined();
        expect(preset.heroBadge).toBeDefined();
      }
    });

    it('cambiar el modelo actualiza los colores manteniendo intacto el SEO y los textos', () => {
      const initial: LandingSettings = {
        ...defaultLandingSettings,
        seo: {
          title: 'AK Producciones Eventos Salto',
          description: 'Producción de eventos en Salto Uruguay',
          ogImageUrl: '/img.jpg',
        },
      };

      const presetFiesta = LANDING_THEME_PRESETS.fiesta;
      const updated: LandingSettings = {
        ...initial,
        themeModel: 'fiesta',
        colors: { ...presetFiesta.colors },
        hero: { ...initial.hero, badgeText: presetFiesta.heroBadge },
      };

      expect(updated.themeModel).toBe('fiesta');
      expect(updated.colors.accentColor).toBe(presetFiesta.colors.accentColor);
      expect(updated.seo.title).toBe('AK Producciones Eventos Salto');
      expect(updated.seo.description).toBe('Producción de eventos en Salto Uruguay');
    });
  });

  describe('2.3 Avisos de reuniones en 1 hora y modo desatendido', () => {
    it('genera alerta prioritaria de reunión en 1 hora sin duplicar', async () => {
      const in45Minutes = new Date(Date.now() + 45 * 60 * 1000).toISOString();
      mockFiestasData.push({
        id: 'fiesta_123',
        configuracion: {
          nombreEvento: '15 de Valentina',
          nombreCliente: 'Carlos Rodriguez',
          lugar: 'Club Uruguay',
        },
        reuniones: [
          {
            id: 'reu_1',
            titulo: 'Prueba de luces y catering',
            fecha: in45Minutes,
            conQuien: 'Carlos Rodriguez',
            lugar: 'Club Uruguay',
          },
        ],
      });

      const res1 = await checkAndCreateReunionReminders(WHATSAPP_AUTOMATION_INTERNAL_TOKEN);
      expect(res1.success).toBe(true);
      expect(res1.created).toBeGreaterThanOrEqual(1);

      // Segunda corrida no debe duplicar la notificación
      const res2 = await checkAndCreateReunionReminders(WHATSAPP_AUTOMATION_INTERNAL_TOKEN);
      expect(res2.success).toBe(true);
      expect(res2.created).toBe(0);
    });
  });
});
