jest.mock('server-only', () => ({}), { virtual: true });

const base: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (base[f] === undefined ? d : JSON.parse(JSON.stringify(base[f])))),
  writeData: jest.fn(async (f: string, v: any) => { base[f] = JSON.parse(JSON.stringify(v)); }),
}));

const mockMarcarCorrida = jest.fn(async () => undefined);
jest.mock('@/lib/automatico/tareas-automaticas', () => ({
  ...jest.requireActual('@/lib/automatico/tareas-automaticas'),
  marcarCorrida: (...args: any[]) => mockMarcarCorrida(...args),
}));

const mockCreateNotification = jest.fn(async () => ({ success: true }));
jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: (...args: any[]) => mockCreateNotification(...args),
}));

let mockPresupuestoIA = true;
const mockRegistrarConsumo = jest.fn(async () => undefined);
jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => mockPresupuestoIA),
  registrarConsumoIA: (...args: any[]) => mockRegistrarConsumo(...args),
}));

let mockGenerateBlogResult: any = null;
let mockGenerateBlogError: any = null;
jest.mock('@/lib/blog-ai-generator', () => ({
  generateBlogPostAndSocialDraft: jest.fn(async () => {
    if (mockGenerateBlogError) throw mockGenerateBlogError;
    if (mockGenerateBlogResult) return mockGenerateBlogResult;
    const post = {
      slug: 'nota-automatica-prueba',
      title: 'Nota automática de prueba',
      category: 'Presupuesto',
      publishedAt: new Date().toISOString().split('T')[0],
      excerpt: 'Resumen de prueba',
    };
    const posts = base['blog-posts.json'] || [];
    base['blog-posts.json'] = [post, ...posts];
    return {
      blogPost: { slug: post.slug, title: post.title, category: post.category },
      post,
      socialPost: { id: 'sp-1', platform: 'Instagram' },
    };
  }),
}));

const mockEscaneoRecordatorios = jest.fn(async () => ({ ok: true, cuotasEscaneadas: 0 }));
jest.mock('@/app/actions/invoices', () => ({
  ejecutarEscaneoDeRecordatorios: (...args: any[]) => mockEscaneoRecordatorios(...args),
}));

jest.mock('@/app/actions/notifications', () => ({
  checkAndCreateReunionReminders: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/presencia-digital/guardado-diario', () => ({
  guardarMetricasDelDia: jest.fn().mockResolvedValue({ guardado: true, fecha: '2026-10-10' }),
}));

jest.mock('@/lib/social-media/comments-backfill', () => ({
  syncCommentsFromNetworks: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/presencia-digital/publicador', () => ({
  procesarPosteosProgramados: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/app/actions/social-media', () => ({
  syncInstagramPosts: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/automatico/posicionamiento-diario', () => ({
  ejecutarRevisionPosicionamiento: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/lib/agentes/motor-agentes', () => ({
  ejecutarVigilanteFiestas: jest.fn().mockResolvedValue({}),
  ejecutarPerseguidorPresupuestos: jest.fn().mockResolvedValue({}),
  ejecutarAgentesAutonomos: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/lib/whatsapp/avisos-al-cliente', () => ({
  correrTareaAvisosAlCliente: jest.fn().mockResolvedValue({}),
}));

let mockRecordatorioInvitadosResult: any = { ok: true, mensajesPreparados: 0, errores: [] };
jest.mock('@/lib/invitaciones/recordatorio-invitados', () => ({
  correrTareaRecordatorioInvitados: jest.fn(async () => mockRecordatorioInvitadosResult),
}));

jest.mock('@/lib/invitaciones/recordatorio-no-abiertas', () => ({
  correrTareaRecordarInvitacionNoAbierta: jest.fn().mockResolvedValue({ corrio: true }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ ok: true, user: { perfil: 'dueno' } }),
  requireAdminSession: jest.fn().mockResolvedValue({ ok: true, user: { perfil: 'dueno' } }),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: { perfil: 'dueno' } }),
}));

jest.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: jest.fn().mockReturnValue(jest.fn()),
  },
  geminiModel: 'mock-gemini-model',
  ejecutarPromptConFallback: jest.fn().mockRejectedValue(new Error('IA no disponible')),
  generateWithGeminiFallback: jest.fn().mockRejectedValue(new Error('IA no disponible')),
  getGeminiModelForAgent: jest.fn().mockReturnValue('mock-model'),
}));

import { ponerAlDiaAlEntrar } from '@/lib/automatico/al-entrar-a-la-app';
import { resetearLockEnMemoria } from '@/lib/automatico/control-concurrencia';
import { ejecutarTareaManual } from '@/app/actions/tareas-automaticas.actions';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';

const ESTADO = () => Object.entries(base).find(([k]) => /estado|tareas-al-entrar/i.test(k) && !k.includes('lock'))?.[1];

describe('Orden 244 — El blog no dice que publicó sin publicar', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const k of Object.keys(base)) delete base[k];
    resetearLockEnMemoria();
    mockMarcarCorrida.mockClear();
    mockCreateNotification.mockClear();
    mockRegistrarConsumo.mockClear();
    mockEscaneoRecordatorios.mockClear();
    mockPresupuestoIA = true;
    mockGenerateBlogResult = null;
    mockGenerateBlogError = null;
    mockRecordatorioInvitadosResult = { ok: true, mensajesPreparados: 0, errores: [] };
    process.env.GEMINI_API_KEY = 'clave-gemini-valida';
    process.env.GOOGLE_API_KEY = '';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('(a) Sin clave: la tarea "blog" queda en ultimoFallo con el motivo y no en ultimaCorrida', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    const fecha = new Date('2026-10-10T12:00:00Z');
    const r = await ponerAlDiaAlEntrar(fecha, 'despertador');

    expect(r.fallaron.map((f) => f.tarea)).toContain('blog');
    expect(r.corrio).not.toContain('blog');

    const estado = ESTADO();
    expect(estado?.ultimoFallo?.blog?.error).toContain('falta la clave');
    expect(estado?.ultimaCorrida?.blog).toBeUndefined();
    expect(mockMarcarCorrida).not.toHaveBeenCalledWith('generate-blog-post', expect.anything(), expect.anything());
  });

  it('(b) Con el tope de gasto alcanzado: la tarea "blog" queda en ultimoFallo con el motivo y no en ultimaCorrida', async () => {
    process.env.GEMINI_API_KEY = 'clave-valida';
    mockPresupuestoIA = false; // Tope alcanzado

    const fecha = new Date('2026-10-10T12:00:00Z');
    const r = await ponerAlDiaAlEntrar(fecha, 'despertador');

    expect(r.fallaron.map((f) => f.tarea)).toContain('blog');
    expect(r.corrio).not.toContain('blog');

    const estado = ESTADO();
    expect(estado?.ultimoFallo?.blog?.error).toContain('tope de gasto');
    expect(estado?.ultimaCorrida?.blog).toBeUndefined();
    expect(mockMarcarCorrida).not.toHaveBeenCalledWith('generate-blog-post', expect.anything(), expect.anything());
  });

  it('(c) Con clave y presupuesto: se agrega una nota a blog-posts.json y queda en ultimaCorrida', async () => {
    process.env.GEMINI_API_KEY = 'clave-valida';
    mockPresupuestoIA = true;

    const fecha = new Date('2026-10-10T12:00:00Z');
    const r = await ponerAlDiaAlEntrar(fecha, 'despertador');

    expect(r.corrio).toContain('blog');
    expect(r.fallaron.map((f) => f.tarea)).not.toContain('blog');

    const estado = ESTADO();
    expect(estado?.ultimaCorrida?.blog).toBe('2026-10-10T12:00:00.000Z');
    expect(estado?.ultimoFallo?.blog).toBeUndefined();

    // Se guardó la nota en blog-posts.json
    const posts = base['blog-posts.json'];
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0].slug).toBe('nota-automatica-prueba');
  });

  it('(d) Con 5 días sin nota: se crea el aviso al dueño', async () => {
    // Nota con 5 días de antigüedad respecto al momento de corrida
    base['blog-posts.json'] = [
      {
        slug: 'nota-hace-cinco-dias',
        title: 'Nota de hace 5 días',
        publishedAt: '2026-10-01',
      },
    ];

    const ahora = new Date('2026-10-06T12:00:00Z');
    await ponerAlDiaAlEntrar(ahora, 'despertador');

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'aviso',
        rolDestino: 'admin',
        href: '/settings/contenido-publico',
      }),
    );
  });

  describe('Prueba extra — Barrido de tareas y componentes sin IA', () => {
    it('una tarea de invitados que devuelve { ok: false } queda como falla', async () => {
      mockRecordatorioInvitadosResult = {
        ok: false,
        mensajesPreparados: 0,
        errores: ['Meta WhatsApp API desconectado'],
      };

      const ahora = new Date('2026-10-10T12:00:00Z');
      const r = await ponerAlDiaAlEntrar(ahora, 'despertador');

      expect(r.fallaron.map((f) => f.tarea)).toContain('recordatorio_invitados');
      expect(r.corrio).not.toContain('recordatorio_invitados');

      const estado = ESTADO();
      expect(estado?.ultimoFallo?.recordatorio_invitados?.error).toContain('Meta WhatsApp API desconectado');
      expect(estado?.ultimaCorrida?.recordatorio_invitados).toBeUndefined();
    });

    it('el botón de recordatorios-de-pago ejecuta el escaneo real de cuotas', async () => {
      const resultado = await ejecutarTareaManual('recordatorios-de-pago');

      expect(resultado.success).toBe(true);
      expect(mockEscaneoRecordatorios).toHaveBeenCalled();
      expect(mockMarcarCorrida).toHaveBeenCalledWith('recordatorios-de-pago');
    });

    it('el comprobante sin IA no muestra Extracción Exitosa y devuelve baja confianza', async () => {
      const data = await extractReceiptData({ receiptDataUri: 'data:image/png;base64,xxxx' });

      expect(data.confidence).toBe('baja');
      // No inventa proveedor ni fecha simulando haber leído
      expect(data.vendor).toBe('');
      expect(data.date).toBe('');
      expect(data.notes).toContain('No se pudo leer el comprobante automáticamente');
    });
  });
});
