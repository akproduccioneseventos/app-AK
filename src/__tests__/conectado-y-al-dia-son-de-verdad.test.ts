/** @jest-environment node */

const copia = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
let almacen: Record<string, any> = {};

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ userId: 'u1', perfil: 'dueno', role: 'admin' })),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { userId: 'u1', perfil: 'dueno', role: 'admin' } })),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) =>
    almacen[file] !== undefined ? copia(almacen[file]) : copia(fallback),
  ),
  writeData: jest.fn(async (file: string, data: any) => {
    almacen[file] = copia(data);
  }),
}));

jest.mock('@/lib/marketing/meta-ads', () => ({
  getMetaAdsSummary: jest.fn(async () => null),
}));

jest.mock('@/lib/presencia-digital/google-analytics', () => ({
  getGoogleAnalyticsMetrics: jest.fn(async () => ({
    hasCredentials: false,
    periodoDias: 30,
    totalVisitors: null,
    visitorsChangePct: null,
    sources: [],
    topPages: [],
    simulatorFunnel: { started: 0, completed: 0, completionRatePct: 0 },
    updatedAt: '2026-11-26T00:00:00.000Z',
  })),
}));

jest.mock('@/lib/presencia-digital/revision-diaria', () => ({
  buildDigitalPresenceDailyReview: jest.fn(async () => ({
    date: '2026-11-26',
    hasAnyDatedPost: false,
    inactivePlatforms: [],
    topPost: null,
    activePlatformsWithRecentPosts: [],
  })),
}));

const mockProcessRemarketing = jest.fn();
jest.mock('@/lib/marketing/whatsapp-remarketing', () => ({
  processUnbookedLeadsRemarketing: (...args: any[]) => mockProcessRemarketing(...args),
}));

const mockElegirCandidatos = jest.fn();
jest.mock('@/lib/marketing/candidatos-recontacto', () => ({
  elegirCandidatosDeRecontacto: (...args: any[]) => mockElegirCandidatos(...args),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/social-media/meta-history-backfill', () => ({
  syncMetaPublicHistory: jest.fn(async () => ({
    success: false,
    earliestDate: '2019-09-01T00:00:00.000Z',
    fetched: 0,
    imported: 0,
    updated: 0,
    platforms: [{ platform: 'Instagram', mode: 'skipped', fetched: 0, imported: 0, updated: 0, complete: false, error: 'Token vencido' }],
  })),
}));

jest.mock('@/lib/social-media/youtube-history-backfill', () => ({
  syncYouTubePublicHistory: jest.fn(async () => ({
    success: false,
    mode: 'rss',
    channelId: 'ch1',
    fetched: 0,
    imported: 0,
    updated: 0,
    complete: false,
    error: 'Sin conexión a YouTube',
  })),
}));

import { getDigitalPresenceDashboard } from '@/app/actions/presencia-digital';
import { sincronizarHistorialRedesAction } from '@/app/actions/social-history';
import { estadoDeLasTareas, marcarCorrida, marcarFallo } from '@/lib/automatico/tareas-automaticas';
import { resumirTareasAutomaticas } from '@/lib/automatico/resumen-tareas';
import { correrRecontactoAutomatico } from '@/lib/marketing/recontacto-automatico';

describe('Orden 372 B2 — conectado, éxito y al día son de verdad', () => {
  beforeEach(() => {
    almacen = {};
    jest.clearAllMocks();
  });

  it('sin credenciales de Google (ni token ni locationId), la tarjeta de Google figura desconectada', async () => {
    almacen['social-connections.json'] = [
      { platform: 'Google', isConnected: true },
    ];
    const res = await getDigitalPresenceDashboard();
    expect(res.success).toBe(true);
    const googleCard = res.data?.platformsStatus.find((p) => p.platform === 'Google');
    expect(googleCard?.isConnected).toBe(false);

    almacen['social-connections.json'] = [
      { platform: 'Google', isConnected: true, accessToken: 'tok-g', locationId: 'loc-1' },
    ];
    const resConCreds = await getDigitalPresenceDashboard();
    const googleConectada = resConCreds.data?.platformsStatus.find((p) => p.platform === 'Google');
    expect(googleConectada?.isConnected).toBe(true);
  });

  it('sincronizarHistorialRedesAction devuelve success: false si ninguna red trajo datos y hubo errores', async () => {
    const res = await sincronizarHistorialRedesAction({ forceFull: true });
    expect(res.success).toBe(false);
    expect(res.error || res.mensaje).toMatch(/Instagram|YouTube/i);
  });

  it('una tarea con falla posterior al último éxito no cuenta como al día', async () => {
    const ahora = new Date('2026-11-26T12:00:00.000Z');
    await marcarCorrida('generate-blog-post', new Date('2026-11-26T08:00:00.000Z'), 'despertador');
    await marcarFallo('generate-blog-post', 'Error de IA', new Date('2026-11-26T10:00:00.000Z'));

    const tareas = await estadoDeLasTareas(ahora);
    const blog = tareas.find((t) => t.id === 'generate-blog-post');
    expect(blog?.falloPosteriorAlExito).toBe(true);
    expect(blog?.estado).toBe('fallo_ultimo');
    expect(blog?.estado).not.toBe('al-dia');

    const resumen = resumirTareasAutomaticas(tareas);
    expect(resumen.conFalloReciente.some((t) => t.id === 'generate-blog-post')).toBe(true);
    expect(resumen.alDia).toBe(0);
  });

  it('correrRecontactoAutomatico con elegidos y todos fallados devuelve corrio: false y motivo', async () => {
    almacen['marketing-recontacto.json'] = { activo: true };
    almacen['crm-leads.json'] = [
      { id: 'lead-1', name: 'Ana', phone: '099111222', stageId: 'contacted' },
    ];
    mockElegirCandidatos.mockReturnValue({
      candidatos: [{ id: 'lead-1', name: 'Ana', phone: '099111222', paso: 1 }],
      descartados: [],
    });
    mockProcessRemarketing.mockResolvedValue({
      sentCount: 0,
      failedCount: 1,
      details: [{ leadId: 'lead-1', success: false, error: 'Token vencido' }],
    });

    const res = await correrRecontactoAutomatico(new Date('2026-11-26T12:00:00.000Z'));
    expect(res.corrio).toBe(false);
    expect(res.enviados).toBe(0);
    expect(res.elegidos).toBe(1);
    expect(res.motivo).toMatch(/Token vencido|ningún/i);
  });
});
