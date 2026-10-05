/**
 * Una tarea que falla no se anota como corrida (Codex, auditoría 66, AUTO02).
 *
 * Métricas y recordatorios tragaban el error de cada parte y la tarea quedaba "corrida" con todo
 * caído, y el reintento se postergaba un día. Se probó rompiéndolo: con el `.catch(() => null)`
 * de antes, la primera prueba falla.
 */
const base: Record<string, any> = {};
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (base[f] === undefined ? d : JSON.parse(JSON.stringify(base[f])))),
  writeData: jest.fn(async (f: string, v: any) => { base[f] = JSON.parse(JSON.stringify(v)); }),
}));
const metricas = jest.fn();
jest.mock('@/lib/presencia-digital/guardado-diario', () => ({ guardarMetricasDelDia: () => metricas() }));
jest.mock('@/lib/social-media/comments-backfill', () => ({ syncCommentsFromNetworks: jest.fn().mockResolvedValue({}) }));
jest.mock('@/lib/presencia-digital/publicador', () => ({ procesarPosteosProgramados: jest.fn().mockResolvedValue({}) }));
jest.mock('@/lib/marketing-automation', () => ({ runMarketingAutomation: jest.fn().mockResolvedValue({}) }));
const recordatorios = jest.fn();
jest.mock('@/app/actions/invoices', () => ({ ejecutarEscaneoDeRecordatorios: () => recordatorios() }));
jest.mock('@/app/actions/notifications', () => ({ checkAndCreateReunionReminders: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('@/lib/automatico/posicionamiento-diario', () => ({ ejecutarRevisionPosicionamiento: jest.fn().mockResolvedValue({}) }));
jest.mock('@/lib/agentes/motor-agentes', () => ({
  ejecutarVigilanteFiestas: jest.fn().mockResolvedValue({}),
  ejecutarPerseguidorPresupuestos: jest.fn().mockResolvedValue({}),
  ejecutarAgentesAutonomos: jest.fn().mockResolvedValue({}),
}));
jest.mock('@/lib/whatsapp/avisos-al-cliente', () => ({ correrTareaAvisosAlCliente: jest.fn().mockResolvedValue({}) }));
jest.mock('@/lib/invitaciones/recordatorio-no-abiertas', () => ({ correrTareaRecordarInvitacionNoAbierta: jest.fn().mockResolvedValue({}) }));

import { ponerAlDiaAlEntrar } from '@/lib/automatico/al-entrar-a-la-app';
import { resetearLockEnMemoria } from '@/lib/automatico/control-concurrencia';

const ESTADO = () => Object.entries(base).find(([k]) => /estado|tareas-al-entrar/i.test(k) && !k.includes('lock'))?.[1];

beforeEach(() => {
  for (const k of Object.keys(base)) delete base[k];
  resetearLockEnMemoria();
  metricas.mockReset().mockResolvedValue({});
  recordatorios.mockReset().mockResolvedValue({ success: true });
});

describe('Lo que falla se anota como falla', () => {
  it('las métricas que tiran y los recordatorios que contestan success:false no cuentan como corridas', async () => {
    metricas.mockRejectedValue(new Error('Meta caído'));
    recordatorios.mockResolvedValue({ success: false, errors: ['sin base'] });
    const r = await ponerAlDiaAlEntrar(new Date('2026-10-05T12:00:00Z'), 'despertador');
    expect(r.fallaron.map((f) => f.tarea).sort()).toEqual(['metricas', 'recordatorios']);
    expect(r.corrio).not.toContain('metricas');
    expect(r.corrio).toContain('blog');
    expect(ESTADO()?.ultimaCorrida?.metricas).toBeUndefined();
  });

  it('se reintenta a la hora, y cuando sale se anota como corrida', async () => {
    metricas.mockRejectedValueOnce(new Error('Meta caído'));
    await ponerAlDiaAlEntrar(new Date('2026-10-05T12:00:00Z'), 'despertador');
    const aLos10 = await ponerAlDiaAlEntrar(new Date('2026-10-05T12:10:00Z'), 'despertador');
    expect(aLos10.omitidas).toContain('metricas');
    const aLas2 = await ponerAlDiaAlEntrar(new Date('2026-10-05T14:00:00Z'), 'despertador');
    expect(aLas2.corrio).toContain('metricas');
    expect(ESTADO()?.ultimaCorrida?.metricas).toBe('2026-10-05T14:00:00.000Z');
  });
});
