import {
  intentarAdquirirLock,
  liberarLock,
  resetearLockEnMemoria,
} from '@/lib/automatico/control-concurrencia';
import { ponerAlDiaAlEntrar } from '@/lib/automatico/al-entrar-a-la-app';
import {
  marcarCorrida,
  estadoDeLasTareas,
  TAREAS_AUTOMATICAS,
} from '@/lib/automatico/tareas-automaticas';

const datosGuardados: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    return datosGuardados[file] !== undefined ? JSON.parse(JSON.stringify(datosGuardados[file])) : fallback;
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    datosGuardados[file] = JSON.parse(JSON.stringify(data));
  }),
}));

// Mock de las funciones internas que ejecutan las tareas
jest.mock('@/lib/presencia-digital/guardado-diario', () => ({
  guardarMetricasDelDia: jest.fn().mockResolvedValue({ totalNetworks: 1 }),
}));
jest.mock('@/lib/social-media/comments-backfill', () => ({
  syncCommentsFromNetworks: jest.fn().mockResolvedValue({ totalComments: 0 }),
}));
jest.mock('@/lib/presencia-digital/publicador', () => ({
  procesarPosteosProgramados: jest.fn().mockResolvedValue({ publicados: 0 }),
}));
jest.mock('@/lib/marketing-automation', () => ({
  runMarketingAutomation: jest.fn().mockResolvedValue({ generated: 1 }),
}));
jest.mock('@/app/actions/invoices', () => ({
  ejecutarEscaneoDeRecordatorios: jest.fn().mockResolvedValue({ encolados: 0 }),
}));

describe('BLOQUE 0: Control de concurrencia y tareas automáticas desatendidas', () => {
  beforeEach(() => {
    resetearLockEnMemoria();
    for (const key of Object.keys(datosGuardados)) {
      delete datosGuardados[key];
    }
    jest.clearAllMocks();
  });

  it('10 llamadas simultáneas para adquirir el lock dejan exactamente una sola corrida activa', async () => {
    const origenes = ['visita', 'despertador', 'visita', 'app', 'visita', 'despertador', 'visita', 'visita', 'app', 'visita'] as const;

    const resultados = await Promise.all(
      origenes.map((origen) => intentarAdquirirLock(origen)),
    );

    const adquiridos = resultados.filter((r) => r === true);
    const rechazados = resultados.filter((r) => r === false);

    expect(adquiridos).toHaveLength(1);
    expect(rechazados).toHaveLength(9);
  });

  it('liberar el lock permite que una nueva llamada posterior pueda ejecutar', async () => {
    const primero = await intentarAdquirirLock('despertador');
    expect(primero).toBe(true);

    const segundoInmediato = await intentarAdquirirLock('visita');
    expect(segundoInmediato).toBe(false);

    await liberarLock();

    const terceroTrasLiberar = await intentarAdquirirLock('visita');
    expect(terceroTrasLiberar).toBe(true);
  });

  it('múltiples llamadas concurrentes a ponerAlDiaAlEntrar solo ejecutan las tareas una vez', async () => {
    const ahora = new Date('2026-08-22T15:00:00.000Z');

    const corridas = await Promise.all([
      ponerAlDiaAlEntrar(ahora, 'despertador'),
      ponerAlDiaAlEntrar(ahora, 'visita'),
      ponerAlDiaAlEntrar(ahora, 'visita'),
      ponerAlDiaAlEntrar(ahora, 'app'),
    ]);

    const exitosas = corridas.filter((c) => !c.omitidoPorConcurrencia);
    const omitidasPorConcurrencia = corridas.filter((c) => c.omitidoPorConcurrencia);

    expect(exitosas).toHaveLength(1);
    expect(omitidasPorConcurrencia).toHaveLength(3);
    expect(exitosas[0].corrio.length).toBeGreaterThan(0);
  });

  it('marcarCorrida guarda el origen y estadoDeLasTareas lo reporta correctamente', async () => {
    const ahora = new Date('2026-08-22T10:00:00.000Z');
    await marcarCorrida('metricas-de-redes', ahora, 'despertador');
    await marcarCorrida('generate-blog-post', ahora, 'visita');

    const estados = await estadoDeLasTareas(new Date('2026-08-22T11:00:00.000Z'));
    const metricas = estados.find((t) => t.id === 'metricas-de-redes');
    const blog = estados.find((t) => t.id === 'generate-blog-post');

    expect(metricas?.disparadoPor).toBe('despertador');
    expect(metricas?.estado).toBe('al-dia');
    expect(blog?.disparadoPor).toBe('visita');
    expect(blog?.estado).toBe('al-dia');
  });

  it('marca una tarea como atrasada si pasa más del doble de su intervalo esperado', async () => {
    const hace70Horas = new Date(Date.now() - 70 * 3600 * 1000);
    // metricas-de-redes corre cada 24hs; 70hs supera 48hs (el doble)
    await marcarCorrida('metricas-de-redes', hace70Horas, 'despertador');

    const estados = await estadoDeLasTareas();
    const metricas = estados.find((t) => t.id === 'metricas-de-redes');

    expect(metricas?.estado).toBe('atrasada');
    expect(metricas?.horasDesdeLaUltima).toBeGreaterThanOrEqual(70);
  });
});
