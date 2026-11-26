/** @jest-environment node */

jest.mock('server-only', () => ({}));

jest.mock('@/lib/automatico/control-concurrencia', () => ({
  intentarAdquirirLock: jest.fn().mockResolvedValue('lock1'),
  renovarLock: jest.fn().mockResolvedValue(undefined),
  liberarLock: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/automatico/tareas-automaticas', () => ({
  marcarCorrida: jest.fn().mockResolvedValue(undefined),
  marcarToqueDespertador: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_f: string, def: unknown) => def),
  writeData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return {
    ...actual,
    hoyEnUruguay: jest.fn(() => '2026-11-26'),
    getUruguayParts: jest.fn(() => ({
      year: 2026,
      month: 11,
      day: 26,
      hour: 12,
      minute: 0,
      second: 0,
    })),
  };
});

jest.mock('@/lib/presencia-digital/guardado-diario', () => ({
  guardarMetricasDelDia: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/social-media/comments-backfill', () => ({
  syncCommentsFromNetworks: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/presencia-digital/publicador', () => ({
  procesarPosteosProgramados: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/marketing-automation', () => ({
  runMarketingAutomation: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/app/actions/invoices', () => ({
  ejecutarEscaneoDeRecordatorios: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/app/actions/notifications', () => ({
  checkAndCreateReunionReminders: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/automatico/posicionamiento-diario', () => ({
  ejecutarRevisionPosicionamiento: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/agentes/motor-agentes', () => ({
  ejecutarVigilanteFiestas: jest.fn().mockResolvedValue({ ok: true }),
  ejecutarPerseguidorPresupuestos: jest.fn().mockResolvedValue({ ok: true }),
  ejecutarAgentesAutonomos: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/whatsapp/avisos-al-cliente', () => ({
  correrTareaAvisosAlCliente: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/invitaciones/recordatorio-invitados', () => ({
  correrTareaRecordatorioInvitados: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/invitaciones/recordatorio-no-abiertas', () => ({
  correrTareaRecordarInvitacionNoAbierta: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/experience-ak/demo-fiesta-factory', () => ({
  buildAkDemoFiesta: jest.fn(() => ({
    id: 'fiesta_muestra_auditor',
    configuracion: {},
    invitados: [],
  })),
}));

jest.mock('@/lib/automatico/clasificar-galeria-ia', () => ({
  clasificarPendientesGaleriaIA: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/automatico/empezar-2027', () => ({
  correrMigracionEmpezar2027: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/automatico/sincronizar-cuotas-pagos', () => ({
  correrSincronizacionCuotasPagosUnaVez: jest.fn().mockResolvedValue({
    ejecutada: false,
    sincronizadas: 0,
  }),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: { uid: 'dueno-1', perfil: 'dueno', role: 'dueno' },
  }),
}));

jest.mock('@/lib/auth/solo-lectura', () => ({
  esSesionDeAuditor: jest.fn().mockResolvedValue(false),
  esSesionDeSoloLectura: jest.fn().mockResolvedValue(false),
}));

import { GET } from '@/app/api/cron-despachador/route';
import * as guardadoDiario from '@/lib/presencia-digital/guardado-diario';
import * as avisosCliente from '@/lib/whatsapp/avisos-al-cliente';
import * as recordatorioInvitados from '@/lib/invitaciones/recordatorio-invitados';
import * as recordarNoAbierta from '@/lib/invitaciones/recordatorio-no-abiertas';
import * as empezar2027 from '@/lib/automatico/empezar-2027';

describe('cron-despachador sin clave no manda ni borra (Orden 365)', () => {
  const prevCronSecret = process.env.CRON_SECRET;
  const prevTareasSecret = process.env.TAREAS_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.TAREAS_SECRET;
  });

  afterAll(() => {
    if (prevCronSecret !== undefined) process.env.CRON_SECRET = prevCronSecret;
    else delete process.env.CRON_SECRET;
    if (prevTareasSecret !== undefined) process.env.TAREAS_SECRET = prevTareasSecret;
    else delete process.env.TAREAS_SECRET;
  });

  it('sin CRON_SECRET ni TAREAS_SECRET corre métricas pero NO manda avisos ni corre empezar_2027', async () => {
    const spyMetricas = jest.spyOn(guardadoDiario, 'guardarMetricasDelDia');
    const spyAvisos = jest.spyOn(avisosCliente, 'correrTareaAvisosAlCliente');
    const spyRecordatorioInv = jest.spyOn(recordatorioInvitados, 'correrTareaRecordatorioInvitados');
    const spyNoAbierta = jest.spyOn(recordarNoAbierta, 'correrTareaRecordarInvitacionNoAbierta');
    const spyEmpezar2027 = jest.spyOn(empezar2027, 'correrMigracionEmpezar2027');

    const res = await GET(new Request('http://localhost/api/cron-despachador'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(spyMetricas).toHaveBeenCalledTimes(1);
    expect(spyRecordatorioInv).not.toHaveBeenCalled();
    expect(spyNoAbierta).not.toHaveBeenCalled();
    expect(spyAvisos).not.toHaveBeenCalled();
    expect(spyEmpezar2027).not.toHaveBeenCalled();
    expect(body.omitidas).toEqual(
      expect.arrayContaining([
        'avisos_cliente',
        'recordatorio_invitados',
        'recordar_invitacion',
        'empezar_2027',
      ]),
    );
  });

  it('con CRON_SECRET válido y sesión de dueño SÍ corre las tareas que mandan y empezar_2027', async () => {
    process.env.CRON_SECRET = 'clave-secreta-test';

    const spyAvisos = jest.spyOn(avisosCliente, 'correrTareaAvisosAlCliente');
    const spyRecordatorioInv = jest.spyOn(recordatorioInvitados, 'correrTareaRecordatorioInvitados');
    const spyNoAbierta = jest.spyOn(recordarNoAbierta, 'correrTareaRecordarInvitacionNoAbierta');
    const spyEmpezar2027 = jest.spyOn(empezar2027, 'correrMigracionEmpezar2027');

    const res = await GET(
      new Request('http://localhost/api/cron-despachador', {
        headers: {
          Authorization: 'Bearer clave-secreta-test',
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(spyAvisos).toHaveBeenCalledTimes(1);
    expect(spyRecordatorioInv).toHaveBeenCalledTimes(1);
    expect(spyNoAbierta).toHaveBeenCalledTimes(1);
    expect(spyEmpezar2027).toHaveBeenCalledTimes(1);
    expect(body.corrio).toEqual(
      expect.arrayContaining([
        'avisos_cliente',
        'recordatorio_invitados',
        'recordar_invitacion',
        'empezar_2027',
      ]),
    );
  });
});
