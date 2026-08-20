import { TAREAS_AUTOMATICAS, estadoDeLasTareas, marcarCorrida } from '@/lib/automatico/tareas-automaticas';
import { getEstadoConexiones } from '@/app/actions/conexiones-estado.actions';
import { dispararTareasVencidasDeFondo } from '@/app/actions/tareas-automaticas.actions';
import * as fs from 'fs';
import * as path from 'path';

// Mock de sesiones
jest.mock('@/lib/auth/require-session', () => ({
  // El disparo de fondo pide cuenta de ADMINISTRADOR, no cualquiera del equipo:
  // publica en las redes de la empresa y gasta inteligencia artificial.
  requireAdminSession: jest.fn().mockResolvedValue({ ok: true }),
  requireAppSession: jest.fn().mockResolvedValue({
    id: 'user-123',
    email: 'admin@akproducciones.com',
    role: 'ADMIN',
  }),
}));

// Mock de data-service
jest.mock('@/lib/data-service', () => {
  let mockData: Record<string, any> = {};
  return {
    readData: jest.fn().mockImplementation((file: string, def: any) => {
      return Promise.resolve(mockData[file] !== undefined ? mockData[file] : def);
    }),
    writeData: jest.fn().mockImplementation((file: string, data: any) => {
      mockData[file] = data;
      return Promise.resolve(data);
    }),
    __setMockData: (data: Record<string, any>) => {
      mockData = { ...data };
    },
  };
});

// Mock de librerías de fondo
jest.mock('@/lib/marketing-automation', () => ({
  runMarketingAutomation: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/presencia-digital/publicador', () => ({
  procesarPosteosProgramados: jest.fn().mockResolvedValue({ success: true, count: 0 }),
}));

jest.mock('@/lib/social-media/comments-backfill', () => ({
  syncCommentsFromNetworks: jest.fn().mockResolvedValue({ count: 0 }),
}));

jest.mock('@/lib/presencia-digital/guardado-diario', () => ({
  guardarMetricasDelDia: jest.fn().mockResolvedValue({ guardado: true, fecha: '2026-08-20' }),
}));

describe('Lo automático que se ve y Panel DJ', () => {
  beforeEach(() => {
    const dataService = require('@/lib/data-service');
    if (dataService.__setMockData) {
      dataService.__setMockData({});
    }
  });

  describe('Bloque 1: Tareas Automáticas declaradas y estado real', () => {
    it('declara exactamente las 4 tareas principales sin jerga', () => {
      expect(TAREAS_AUTOMATICAS).toHaveLength(4);
      const ids = TAREAS_AUTOMATICAS.map((t) => t.id);
      expect(ids).toContain('generate-blog-post');
      expect(ids).toContain('metricas-de-redes');
      expect(ids).toContain('publicar-programados');
      expect(ids).toContain('recordatorios-de-pago');

      for (const tarea of TAREAS_AUTOMATICAS) {
        expect(tarea.nombre.length).toBeGreaterThan(5);
        expect(tarea.siNoCorre.length).toBeGreaterThan(15);
        expect(tarea.cadaHoras).toBeGreaterThan(0);
      }
    });

    it('devuelve "nunca" si no hay marcas previas guardadas', async () => {
      const estados = await estadoDeLasTareas();
      expect(estados).toHaveLength(4);
      for (const est of estados) {
        expect(est.estado).toBe('nunca');
        expect(est.ultimaCorrida).toBeNull();
      }
    });

    it('marca una corrida correctamente y actualiza el estado', async () => {
      const ahora = new Date();
      await marcarCorrida('metricas-de-redes', ahora);
      const estados = await estadoDeLasTareas(ahora);
      const metricas = estados.find((t) => t.id === 'metricas-de-redes');

      expect(metricas?.estado).toBe('al-dia');
      expect(metricas?.ultimaCorrida).toBe(ahora.toISOString());
    });
  });

  describe('Bloque 2: Estado real de conexiones externas', () => {
    it('lista las 13 plataformas con estados válidos', async () => {
      const conexiones = await getEstadoConexiones();
      expect(conexiones.length).toBeGreaterThanOrEqual(13);

      const estadosPermitidos = ['conectada', 'falta-configurarla', 'no-se-usa'];

      for (const c of conexiones) {
        expect(estadosPermitidos).toContain(c.estado);
        expect(c.nombre).toBeTruthy();
        expect(c.queSePierdeSiFalta.length).toBeGreaterThan(10);
      }

      const ids = conexiones.map((c) => c.id);
      expect(ids).toContain('google-analytics');
      expect(ids).toContain('google-business');
      expect(ids).toContain('google-calendar');
      expect(ids).toContain('whatsapp');
      expect(ids).toContain('instagram');
      expect(ids).toContain('facebook');
      expect(ids).toContain('youtube');
      expect(ids).toContain('tiktok');
      expect(ids).toContain('threads');
      expect(ids).toContain('x');
      expect(ids).toContain('spotify');
      expect(ids).toContain('mercado-pago');
      expect(ids).toContain('meta-ads');
    });
  });

  describe('Bloque 3: Disparo en segundo plano seguro', () => {
    it('dispara solo tareas desatendidas y NUNCA recordatorios a clientes solos', async () => {
      const res = await dispararTareasVencidasDeFondo();
      expect(res.ejecutadas).toContain('generate-blog-post');
      expect(res.ejecutadas).toContain('metricas-de-redes');
      expect(res.ejecutadas).toContain('publicar-programados');
      // REGLA FUNDAMENTAL: recordatorios de pago NUNCA se disparan en segundo plano
      expect(res.ejecutadas).not.toContain('recordatorios-de-pago');
    });
  });

  describe('Bloque 4: Guía docs/PRENDER-LAS-TAREAS.md', () => {
    it('existe y contiene los 4 renglones exactos', () => {
      const filePath = path.join(process.cwd(), 'docs/PRENDER-LAS-TAREAS.md');
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('/api/cron/generate-blog-post');
      expect(content).toContain('/api/cron/metricas-de-redes');
      expect(content).toContain('/api/cron/publicar-programados');
      expect(content).toContain('/api/cron/recordatorios-de-pago');
    });
  });

  describe('Bloque 5: Música en Panel DJ', () => {
    it('el código del panel de DJ lee las canciones infaltables y las que no deben sonar', () => {
      const djPagePath = path.join(process.cwd(), 'src/app/evento/dj/[fiestaId]/page.tsx');
      const djSource = fs.readFileSync(djPagePath, 'utf8');

      expect(djSource).toContain('fiesta?.listaMusicaPortal?.imprescindibles');
      expect(djSource).toContain('fiesta?.listaMusicaPortal?.noQuiero');
      expect(djSource).toContain('INFALTABLES DEL CLIENTE');
      expect(djSource).toContain('PROHIBIDAS — NO REPRODUCIR');
    });
  });
});
