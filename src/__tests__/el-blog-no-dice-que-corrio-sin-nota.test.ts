jest.mock('server-only', () => ({}), { virtual: true });

const base: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (base[f] === undefined ? d : JSON.parse(JSON.stringify(base[f])))),
  writeData: jest.fn(async (f: string, v: any) => { base[f] = JSON.parse(JSON.stringify(v)); }),
}));

let mockMarketingAutomationResult: any = { seoSucceeded: false, motivo: 'no se publicó ninguna nota' };
jest.mock('@/lib/marketing-automation', () => ({
  runMarketingAutomation: jest.fn(async () => mockMarketingAutomationResult),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
  registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/invoices', () => ({
  ejecutarEscaneoDeRecordatorios: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/app/actions/notifications', () => ({
  checkAndCreateReunionReminders: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/presencia-digital/guardado-diario', () => ({
  guardarMetricasDelDia: jest.fn().mockResolvedValue({ guardado: true }),
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

jest.mock('@/lib/invitaciones/recordatorio-invitados', () => ({
  correrTareaRecordatorioInvitados: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/invitaciones/recordatorio-no-abiertas', () => ({
  correrTareaRecordarInvitacionNoAbierta: jest.fn().mockResolvedValue({ corrio: true }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ ok: true, user: { perfil: 'dueno' } }),
}));

jest.mock('@/lib/automatico/control-concurrencia', () => ({
  intentarAdquirirLock: jest.fn().mockResolvedValue(true),
  liberarLock: jest.fn().mockResolvedValue(undefined),
  renovarLock: jest.fn().mockResolvedValue(undefined),
}));

import { ponerAlDiaAlEntrar } from '@/lib/automatico/al-entrar-a-la-app';

describe('Orden 291 — Bloque 4: El blog no dice que corrió sin nota nueva', () => {
  beforeEach(() => {
    for (const key of Object.keys(base)) {
      delete base[key];
    }
    // Nota de hace 5 días en blog-posts.json
    const fechaHace5Dias = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    base['blog-posts.json'] = [
      {
        slug: 'nota-hace-5-dias',
        title: 'Nota de hace 5 días',
        publishedAt: fechaHace5Dias,
      },
    ];
    base['tareas-automaticas-estado.json'] = {
      ultimaCorrida: {},
      ultimoFallo: {},
    };
  });

  it('con última nota de hace 5 días y runMarketingAutomation sin nota nueva, la tarea tira error con motivo', async () => {
    mockMarketingAutomationResult = {
      seoError: 'No se pudo generar contenido para el blog',
      seoSucceeded: false,
    };

    const ahora = new Date();
    const res = await ponerAlDiaAlEntrar(ahora, 'cron');

    expect(res.corrio).not.toContain('blog');
    const falloBlog = res.fallaron.find(f => f.tarea === 'blog');
    expect(falloBlog).toBeDefined();
    expect(falloBlog?.error).toContain('No se pudo generar contenido para el blog');
  });

  it('si runMarketingAutomation devuelve resultado sin error pero no crea nota nueva, tira error con motivo', async () => {
    mockMarketingAutomationResult = {
      seoSucceeded: true,
      motivo: 'Cuota de Gemini agotada al redactar la nota',
    };

    const ahora = new Date();
    const res = await ponerAlDiaAlEntrar(ahora, 'cron');

    expect(res.corrio).not.toContain('blog');
    const falloBlog = res.fallaron.find(f => f.tarea === 'blog');
    expect(falloBlog).toBeDefined();
    expect(falloBlog?.error).toContain('Cuota de Gemini agotada al redactar la nota');
  });
});
