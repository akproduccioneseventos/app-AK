/** @jest-environment node */

jest.mock('server-only', () => ({}));

const mockStore: Record<string, any> = {};
const mockMarcarCorrida = jest.fn(async () => undefined);
const mockCreateNotification = jest.fn(async () => ({ success: true }));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, def: any) =>
    file in mockStore ? JSON.parse(JSON.stringify(mockStore[file])) : def,
  ),
  readDataConDetalle: jest.fn(async (file: string, def: any) => ({
    valor: file in mockStore ? JSON.parse(JSON.stringify(mockStore[file])) : def,
    huboFalla: false,
  })),
  writeData: jest.fn(async (file: string, data: any) => {
    mockStore[file] = JSON.parse(JSON.stringify(data));
  }),
}));

jest.mock('@/lib/automatico/tareas-automaticas', () => {
  const actual = jest.requireActual('@/lib/automatico/tareas-automaticas');
  return {
    ...actual,
    marcarCorrida: (...args: any[]) => (mockMarcarCorrida as any)(...args),
  };
});

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: (...args: any[]) => (mockCreateNotification as any)(...args),
}));

jest.mock('@/lib/automatico/puerta-de-las-tareas', () => ({
  abrirPuertaDeLaTarea: jest.fn(async () => ({ permitido: true, conClave: true })),
  respuestaDeLaTarea: (_puerta: any, cuerpo: any) => cuerpo,
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => []),
}));

jest.mock('@/lib/alertas/errores-humanos', () => ({
  detectarErroresHumanos: jest.fn(() => []),
}));

jest.mock('@/lib/asistente/clima-de-las-fiestas', () => ({
  detectarAlertasClimaFiestas: jest.fn(async () => []),
}));

jest.mock('@/lib/asistente/fechas-comerciales', () => ({
  obtenerProximasFechasComerciales: jest.fn(() => []),
}));

jest.mock('@/lib/asistente/propuestas-service', () => ({
  agregarPropuestasDeduplicadas: jest.fn(async () => ({ agregadas: [], ignoradas: 0 })),
  guardarResumenMientrasNoEstabas: jest.fn(async () => undefined),
}));

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  avisarAlDuenio: jest.fn(async () => null),
  getHoraUruguay: jest.fn(() => 12),
  getAsistenteSettings: jest.fn(async () => ({ avisosProactivosActivos: true })),
}));

jest.mock('@/lib/asistente/cierre-posfiesta', () => ({
  ejecutarCierrePosfiesta: jest.fn(async () => ({ nuevasPropuestas: [], errores: [] })),
}));

jest.mock('@/lib/asistente/avisos-operativos-whatsapp', () => ({
  enviarAvisosOperativosWhatsApp: jest.fn(async () => null),
}));

jest.mock('@/lib/ia/reglas-de-la-ia', () => ({
  getReglaParaTarea: jest.fn(async () => 'preguntar'),
  registrarAccionSola: jest.fn(async () => undefined),
}));

jest.mock('@/lib/presencia-digital/autogenerador-semanal', () => ({
  autoGenerarBorradoresSemanales: jest.fn(async () => ({ createdCount: 0 })),
}));

jest.mock('@/lib/presencia-digital/guardado-diario', () => ({
  guardarMetricasDelDia: jest.fn(async () => ({ ok: true })),
}));

jest.mock('@/lib/social-media/comments-backfill', () => ({
  syncCommentsFromNetworks: jest.fn(async () => ({ ok: true })),
}));

jest.mock('@/lib/presencia-digital/publicador', () => ({
  procesarPosteosProgramados: jest.fn(async () => ({ ok: true })),
}));

jest.mock('@/app/actions/invoices', () => ({
  ejecutarEscaneoDeRecordatorios: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/notifications', () => ({
  checkAndCreateReunionReminders: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/whatsapp/avisos-al-cliente', () => ({
  correrTareaAvisosAlCliente: jest.fn(async () => ({ ok: true })),
}));

jest.mock('@/lib/invitaciones/recordatorio-invitados', () => ({
  correrTareaRecordatorioInvitados: jest.fn(async () => ({ ok: true })),
}));

jest.mock('@/lib/invitaciones/recordatorio-no-abiertas', () => ({
  correrTareaRecordarInvitacionNoAbierta: jest.fn(async () => ({ corrio: true })),
}));

jest.mock('@/lib/marketing/meta-commercial-metrics', () => ({
  loadMetaCommercialMetrics: jest.fn(async () => {
    throw new Error('Meta API caída');
  }),
}));

const mockRunMarketingAutomation = jest.fn();
jest.mock('@/lib/marketing-automation', () => ({
  runMarketingAutomation: (...args: any[]) => mockRunMarketingAutomation(...args),
}));

import { ejecutarAgentesAutonomos } from '@/lib/agentes/motor-agentes';
import { esFalla, ponerAlDiaAlEntrar } from '@/lib/automatico/al-entrar-a-la-app';
import { resetearLockEnMemoria } from '@/lib/automatico/control-concurrencia';
import { ejecutarRevisionPosicionamiento } from '@/lib/automatico/posicionamiento-diario';
import { textoQuePromete } from '@/lib/blog/sin-promesas';
import { GET as generateBlogGET } from '@/app/api/cron/generate-blog-post/route';
import { estadoDeLasTareas, marcarCorrida as marcarCorridaReal, marcarFallo, resumirTareasAutomaticas } from '@/lib/automatico/tareas-automaticas';

describe('Orden 367 B5 y Orden 372 B2.3 — Agentes caídos, skipped, alertas web, promesas y fallo_ultimo', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    for (const k of Object.keys(mockStore)) delete mockStore[k];
    jest.clearAllMocks();
    resetearLockEnMemoria();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('5.1: ejecutarAgentesAutonomos reporta agentesFallidos cuando un agente falla y asistente-proactivo/al-entrar no marcan éxito', async () => {
    // Dejamos sólo vigilante_publicidad y perseguidor_presupuestos activos; el resto apagados
    mockStore['agentes-configuracion.json'] = [
      { id: 'vigilante_fiestas', nombre: 'Vigilante de Fiestas', rol: 'r', descripcion: 'd', activo: false, intervaloMinutos: 15 },
      { id: 'perseguidor_presupuestos', nombre: 'Perseguidor', rol: 'r', descripcion: 'd', activo: true, intervaloMinutos: 60 },
      { id: 'cobrador', nombre: 'Cobrador', rol: 'r', descripcion: 'd', activo: false, intervaloMinutos: 60 },
      { id: 'generador_contenido', nombre: 'Contenido', rol: 'r', descripcion: 'd', activo: false, intervaloMinutos: 180 },
      { id: 'vigilante_noche', nombre: 'Noche', rol: 'r', descripcion: 'd', activo: false, intervaloMinutos: 15 },
      { id: 'vigilante_publicidad', nombre: 'Publicidad', rol: 'r', descripcion: 'd', activo: false, intervaloMinutos: 720 },
      { id: 'anticipador', nombre: 'Anticipador', rol: 'r', descripcion: 'd', activo: false, intervaloMinutos: 1440 },
    ];

    const { marcarLecturaFallida } = await import('@/lib/marca-de-lectura');
    mockStore['presupuestos.json'] = marcarLecturaFallida([], 'Base caída');
    const { readData } = await import('@/lib/data-service');
    (readData as jest.Mock).mockImplementationOnce(async () => mockStore['agentes-configuracion.json']);
    // Mejor usar mock directo de lectura fallida para presupuestos.json
    (readData as jest.Mock).mockImplementation(async (file: string, def: any) => {
      if (file === 'presupuestos.json') return marcarLecturaFallida([], 'Base caída');
      return file in mockStore ? mockStore[file] : def;
    });

    const resultados = await ejecutarAgentesAutonomos(new Date('2026-11-26T15:00:00Z'), { ignorarIntervalo: true });
    expect(resultados.agentesFallidos).toContain('perseguidor_presupuestos');
    expect(resultados.errores?.length).toBeGreaterThan(0);

    const check = esFalla(resultados);
    expect(check.fallo).toBe(true);

    // asistente-proactivo/route no marca corrida si un agente falló
    const { GET: asistenteProactivoGET } = await import('@/app/api/cron/asistente-proactivo/route');
    const resCron = await asistenteProactivoGET(new Request('http://localhost/api/cron/asistente-proactivo'));
    const bodyCron = await resCron.json();
    expect(resCron.status).toBe(500);
    expect(bodyCron.ok).toBe(false);
    expect(mockMarcarCorrida).not.toHaveBeenCalledWith('asistente-proactivo');

    // ponerAlDiaAlEntrar tampoco marca asistente_proactivo como corrida
    mockRunMarketingAutomation.mockResolvedValue({ success: true, skipped: false, seoSucceeded: true });
    global.fetch = jest.fn(async () => ({ status: 200, text: async () => '<title>AK</title>' })) as any;
    const resEntrar = await ponerAlDiaAlEntrar(new Date('2026-11-26T15:00:00Z'), 'app');
    expect(resEntrar.fallaron.map((f) => f.tarea)).toContain('asistente_proactivo');
    expect(resEntrar.corrio).not.toContain('asistente_proactivo');
  });

  it('5.2: si runMarketingAutomation devuelve skipped: true, generate-blog-post y ponerAlDiaAlEntrar no marcan corrida', async () => {
    mockRunMarketingAutomation.mockResolvedValue({
      success: true,
      skipped: true,
      source: 'cron',
      ranSeo: false,
      ranInstagram: false,
      message: 'El marketing automático ya se está corriendo en este momento.',
    });

    const resCron = await generateBlogGET(new Request('http://localhost/api/cron/generate-blog-post'));
    const body = await resCron.json();
    expect(resCron.status).toBe(200);
    expect(body.skipped).toBe(true);
    expect(mockMarcarCorrida).not.toHaveBeenCalledWith('generate-blog-post');

    global.fetch = jest.fn(async () => ({ status: 200, text: async () => '<title>AK</title>' })) as any;
    const resEntrar = await ponerAlDiaAlEntrar(new Date('2026-11-26T15:00:00Z'), 'app');
    expect(resEntrar.corrio).not.toContain('blog');
    expect(resEntrar.omitidas).toContain('blog');
  });

  it('5.3: posicionamiento-diario envía createNotification máximo 1 vez por día si hay páginas rotas', async () => {
    global.fetch = jest.fn(async (url: string) =>
      String(url).endsWith('/bodas')
        ? { status: 500, text: async () => '' }
        : { status: 200, text: async () => '<title>AK</title>' },
    ) as any;

    const ahora = new Date('2026-11-26T14:00:00.000Z');
    const rep1 = await ejecutarRevisionPosicionamiento(ahora);
    expect(rep1.estado).toBe('atencion');
    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        rolDestino: 'admin',
        mensaje: expect.stringContaining('/bodas'),
      }),
    );

    // Segunda corrida el mismo día: no repite la notificación
    await ejecutarRevisionPosicionamiento(new Date('2026-11-26T18:00:00.000Z'));
    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
  });

  it('5.4: sin-promesas detecta "24 horas", "24 hs", "en el día" y "plazo"', () => {
    expect(textoQuePromete('Respuesta en 24 horas')).not.toBeNull();
    expect(textoQuePromete('Entrega en 24 hs')).not.toBeNull();
    expect(textoQuePromete('Se resuelve en el día')).not.toBeNull();
    expect(textoQuePromete('Cumplimos en plazo récord')).not.toBeNull();
    expect(textoQuePromete('Presupuesto personalizado en Salto')).toBeNull();
  });

  it('Orden 372 B2.3: tarea con falloPosteriorAlExito queda como fallo_ultimo y NO cuenta como Al día', async () => {
    const exito = new Date('2026-11-26T10:00:00.000Z');
    const fallo = new Date('2026-11-26T11:00:00.000Z');
    const ahora = new Date('2026-11-26T12:00:00.000Z');

    // Usar la implementación real de tareas-automaticas (marcarCorridaReal)
    const { writeData } = await import('@/lib/data-service');
    await writeData('tareas-automaticas.json', { 'generate-blog-post': { fecha: exito.toISOString(), origen: 'despertador' } });
    await marcarFallo('generate-blog-post', 'Error al publicar', fallo);

    const estados = await estadoDeLasTareas(ahora);
    const blog = estados.find((t) => t.id === 'generate-blog-post');
    expect(blog?.falloPosteriorAlExito).toBe(true);
    expect(blog?.estado).toBe('fallo_ultimo');

    const resumen = resumirTareasAutomaticas(estados);
    expect(resumen.alDia).toBe(0);
    expect(resumen.falloUltimo).toBe(1);
    void marcarCorridaReal;
  });
});
