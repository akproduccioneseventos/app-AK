import { readData, writeData } from '@/lib/data-service';
import {
  getVideosDeAyudaParaAjustes,
  guardarVideoDeAyuda,
  getVideosDeAyuda,
} from '@/app/actions/videos-de-ayuda';
import {
  getBudgetDisplaySettings,
  saveBudgetDisplaySettings,
} from '@/app/actions/settings';
import {
  getLandingSettings,
  saveLandingSettings,
} from '@/app/actions/landing-editor';
import { armarHojaDeCocina } from '@/lib/catering/hoja-de-cocina';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { BudgetDisplaySettings } from '@/types/settings';
import type { LandingSettings } from '@/types/landing-editor';

let mockVideosEnMemoria: any[] = [];

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ userId: 'admin', role: 'admin' }),
  requirePermisoAlguno: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { role: 'admin' } }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (file: string, mutator: (arr: any[]) => any[] | null) => {
    const updated = mutator(mockVideosEnMemoria) ?? mockVideosEnMemoria;
    mockVideosEnMemoria = [...updated];
    return mockVideosEnMemoria;
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

const mockReadData = readData as jest.MockedFunction<typeof readData>;
const mockWriteData = writeData as jest.MockedFunction<typeof writeData>;

describe('Pruebas de resultado para pantallas de gestión', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVideosEnMemoria = [];
  });

  describe('Pantalla /settings/videos-de-ayuda', () => {
    it('permite guardar un video de ayuda y verlo disponible en la lista', async () => {
      // Ruta: /settings/videos-de-ayuda
      mockReadData.mockImplementation(async (file, defaultVal) => {
        if (file === 'videos-de-ayuda.json') return mockVideosEnMemoria;
        return defaultVal;
      });

      // 1. Guardar video para portal cliente
      const saveRes = await guardarVideoDeAyuda(
        'portal-cliente',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'Cómo usar el portal cliente'
      );
      expect(saveRes.success).toBe(true);

      // 2. Comprobar que en la pantalla de ajustes se obtiene con su URL completa
      const listaAjustes = await getVideosDeAyudaParaAjustes();
      expect(listaAjustes).toHaveLength(1);
      expect(listaAjustes[0]).toMatchObject({
        lugar: 'portal-cliente',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        titulo: 'Cómo usar el portal cliente',
      });

      // 3. Comprobar que para los clientes e invitados se resuelve el videoId limpio
      const publicos = await getVideosDeAyuda();
      expect(publicos).toHaveLength(1);
      expect(publicos[0]).toEqual({
        lugar: 'portal-cliente',
        videoId: 'dQw4w9WgXcQ',
        titulo: 'Cómo usar el portal cliente',
      });
    });
  });

  describe('Pantalla /settings/budget-display', () => {
    it('guarda y recupera la configuración de columnas y textos del presupuesto', async () => {
      // Ruta: /settings/budget-display
      let savedSettings: BudgetDisplaySettings | null = null;
      mockReadData.mockImplementation(async (file, defaultVal) => {
        if (file === 'budget-display-settings.json') return savedSettings || defaultVal;
        return defaultVal;
      });
      mockWriteData.mockImplementation(async (file, data) => {
        if (file === 'budget-display-settings.json') savedSettings = data;
      });

      const nuevaConfig: Partial<BudgetDisplaySettings> = {
        showUnitPrices: false,
        showItemTotals: true,
        showDescriptions: true,
        headerNote: 'Validez de la propuesta: 10 días',
        footerNote: 'Gracias por elegir AK Producciones',
      };

      const saveRes = await saveBudgetDisplaySettings(nuevaConfig);
      expect(saveRes.success).toBe(true);
      expect(saveRes.settings?.showUnitPrices).toBe(false);
      expect(saveRes.settings?.headerNote).toBe('Validez de la propuesta: 10 días');

      const recuperada = await getBudgetDisplaySettings();
      expect(recuperada.showUnitPrices).toBe(false);
      expect(recuperada.showItemTotals).toBe(true);
      expect(recuperada.headerNote).toBe('Validez de la propuesta: 10 días');
    });
  });

  describe('Pantalla /empresa/landing-editor', () => {
    it('actualiza los bloques y configuraciones de la portada comercial', async () => {
      // Ruta: /empresa/landing-editor
      let landingData: LandingSettings | null = null;
      mockReadData.mockImplementation(async (file, defaultVal) => {
        if (file === 'landing-settings.json') return landingData || defaultVal;
        return defaultVal;
      });
      mockWriteData.mockImplementation(async (file, data) => {
        if (file === 'landing-settings.json') landingData = data;
      });

      const actualizacion: Partial<LandingSettings> = {
        heroTitle: 'Eventos Inolvidables en Salto',
        heroSubtitle: 'Sonido, iluminación y tecnología para tu noche soñada',
      };

      const res = await saveLandingSettings(actualizacion as LandingSettings);
      expect(res.success).toBe(true);

      const settings = await getLandingSettings();
      expect(settings.heroTitle).toBe('Eventos Inolvidables en Salto');
      expect(settings.heroSubtitle).toBe('Sonido, iluminación y tecnología para tu noche soñada');
    });
  });

  describe('Pantalla /fiestas/nueva/orden-de-evento', () => {
    it('arma la orden de evento con el catering completo sin recortar los artículos', () => {
      // Ruta: /fiestas/nueva/orden-de-evento
      const fiestaDemo: FiestaEnPlanificacion = {
        id: 'fiesta-orden-1',
        configuracion: {
          nombreEvento: 'Boda 100 Personas',
          fechaEvento: '2026-11-20T21:00:00.000Z',
          invitadosAdultos: 80,
          invitadosNinos: 20,
        },
      } as any;

      const platos = [
        { nombre: 'Recepción: Bruschettas', categoria: 'Recepción' },
        { nombre: 'Entrada: Empanaditas gourmet', categoria: 'Entrada' },
        { nombre: 'Plato Principal: Colita de cuadril', categoria: 'Plato Principal' },
        { nombre: 'Guarnición: Papas rústicas', categoria: 'Guarnición' },
        { nombre: 'Postre: Volcán de chocolate', categoria: 'Postre' },
        { nombre: 'Mesa Dulce: Mini gateaux', categoria: 'Mesa Dulce' },
        { nombre: 'Fin de Fiesta: Chivitos al pan', categoria: 'Fin de Fiesta' },
        { nombre: 'Cafetería: Café y petit fours', categoria: 'Bebidas' },
      ];

      const hoja = armarHojaDeCocina(fiestaDemo, platos, { adultos: 80, chicos: 20 });
      expect(hoja.adultos).toBe(80);
      expect(hoja.chicos).toBe(20);
      expect(hoja.totalContratado).toBe(100);

      // Verificamos que la hoja contenga todos los artículos de catering y no los corte
      expect(hoja.platos.length).toBeGreaterThanOrEqual(8);
      expect(hoja.platos.some((p) => p.nombre.includes('Fin de Fiesta'))).toBe(true);
      expect(hoja.platos.some((p) => p.nombre.includes('Cafetería'))).toBe(true);
    });
  });
});
