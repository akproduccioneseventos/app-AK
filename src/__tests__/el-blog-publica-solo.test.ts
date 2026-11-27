jest.mock('server-only', () => ({}), { virtual: true });

import fs from 'node:fs';
import path from 'node:path';

const base: Record<string, any> = {};
const mockMarcarCorrida = jest.fn(async () => undefined);
const mockMarcarFallo = jest.fn(async () => undefined);
const mockSyncInstagram = jest.fn(async () => ({ success: true, photosCount: 0, videosCount: 0, plannerCount: 0 }));
const mockGenerateBlog = jest.fn(async () => ({
  blogPost: { slug: 'nota-test', title: 'Nota test', category: 'Organizacion' as const },
  post: { slug: 'nota-test', title: 'Nota test', category: 'Organizacion' as const, publishedAt: '2026-11-27' },
  socialPost: { id: 'sp-1', platform: 'Instagram' },
}));
let mockEstadoTareas: any[] = [];

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (base[f] === undefined ? d : JSON.parse(JSON.stringify(base[f])))),
  writeData: jest.fn(async (f: string, v: any) => { base[f] = JSON.parse(JSON.stringify(v)); }),
}));

jest.mock('@/lib/automatico/candado-con-nombre', () => ({
  tomarCandado: jest.fn(async () => 'lock-1'),
  soltarCandado: jest.fn(async () => undefined),
}));

jest.mock('@/lib/blog-ai-generator', () => ({
  generateBlogPostAndSocialDraft: (...args: any[]) => mockGenerateBlog(...args),
}));

jest.mock('@/app/actions/social-media', () => ({
  syncInstagramPosts: (...args: any[]) => mockSyncInstagram(...args),
}));

jest.mock('@/lib/marketing/recontacto-automatico', () => ({
  correrRecontactoAutomatico: jest.fn(async () => ({ corrio: false, elegidos: 0, enviados: 0, fallados: 0, descartados: 0 })),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => undefined),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ ok: true, user: { perfil: 'dueno' } })),
  requireAdminSession: jest.fn(async () => ({ ok: true, user: { perfil: 'dueno' } })),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { perfil: 'dueno' } })),
}));

jest.mock('@/lib/automatico/tareas-automaticas', () => {
  const actual = jest.requireActual('@/lib/automatico/tareas-automaticas');
  return {
    ...actual,
    estadoDeLasTareas: jest.fn(async () => mockEstadoTareas),
    marcarCorrida: (...args: any[]) => mockMarcarCorrida(...args),
    marcarFallo: (...args: any[]) => mockMarcarFallo(...args),
  };
});

import { runMarketingAutomation } from '@/lib/marketing-automation';
import { dispararTareasVencidasDeFondo, ejecutarTareaManual } from '@/app/actions/tareas-automaticas.actions';

describe('El blog publica solo y aparece en la web pública', () => {
  const origKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    for (const k of Object.keys(base)) delete base[k];
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key-valida';
    mockEstadoTareas = [{ id: 'generate-blog-post', estado: 'atrasada' }];
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = origKey;
  });

  it('cuando corre solo Instagram (SEO no vencido), seoSucceeded no sale en false', async () => {
    base['marketing-automation-state.json'] = {
      lastSeoRunAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    };
    const res = await runMarketingAutomation({ includeRecontacto: false });
    expect(res.ranInstagram).toBe(true);
    expect(res.ranSeo).toBe(false);
    expect(res.seoSucceeded).toBeUndefined();
    expect(mockGenerateBlog).not.toHaveBeenCalled();
  });

  it('dispararTareasVencidasDeFondo no marca como corrida la tarea del blog si no generó nota', async () => {
    base['marketing-automation-state.json'] = {
      lastSeoRunAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    };
    const res = await dispararTareasVencidasDeFondo();
    expect(res.errores).toHaveLength(0);
    expect(mockSyncInstagram).not.toHaveBeenCalled();
    expect(mockMarcarCorrida).not.toHaveBeenCalledWith('generate-blog-post');
  });

  it('ejecutarTareaManual("generate-blog-post") fuerza la nota sin disparar Instagram y la marca como corrida', async () => {
    base['marketing-automation-state.json'] = {
      lastSeoRunAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    };
    const res = await ejecutarTareaManual('generate-blog-post');
    expect(res.success).toBe(true);
    expect(mockGenerateBlog).toHaveBeenCalledTimes(1);
    expect(mockSyncInstagram).not.toHaveBeenCalled();
    expect(mockMarcarCorrida).toHaveBeenCalledWith('generate-blog-post');
  });

  it('/blog, /blog/[slug] y /sitemap.xml son dinámicos para mostrar notas nuevas al instante', () => {
    for (const rel of ['src/app/blog/page.tsx', 'src/app/blog/[slug]/page.tsx', 'src/app/sitemap.ts']) {
      const code = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
      expect(code).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
    }
  });
});
