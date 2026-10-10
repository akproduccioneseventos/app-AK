/**
 * Auditoría 86, IA: agentes autónomos.
 *
 * Qué se rompía:
 * - El botón "ejecutar ahora" del Vigilante de Publicidad devolvía "Agente no reconocido".
 * - El despertador volvía a correr un agente de 15 minutos a los 60 segundos de la última vez
 *   (llenando el historial de repeticiones).
 *
 * Probado rompiéndolo: sin el `case 'vigilante_publicidad'` la primera prueba da rojo; sin el
 * chequeo de intervalo da rojo la de "hace 1 minuto".
 */
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));
jest.mock('@/lib/marketing/meta-ads', () => ({ getMetaAdsSummary: jest.fn() }));
jest.mock('@/lib/marketing/meta-commercial-metrics', () => ({ loadMetaCommercialMetrics: jest.fn() }));
jest.mock('@/lib/marketing/meta-ads-acciones', () => ({ pausarCampana: jest.fn(), ajustarPresupuestoCampana: jest.fn() }));

const archivos: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const escrituras: string[] = [];
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (f in archivos ? copia(archivos[f]) : d)),
  writeData: jest.fn(async (f: string, v: any) => { escrituras.push(f); archivos[f] = copia(v); }),
}));

import { AGENTES_DEFAULT_CONFIG } from '@/lib/agentes/tipos';
import * as motor from '@/lib/agentes/motor-agentes';
import { ejecutarAgenteManual } from '@/app/actions/agentes-autonomos';

const AHORA = new Date('2026-10-10T15:00:00.000Z');
const haceMin = (m: number) => new Date(AHORA.getTime() - m * 60_000).toISOString();

beforeEach(() => {
  for (const k of Object.keys(archivos)) delete archivos[k];
  escrituras.length = 0;
});

describe('Ejecutar un agente a mano', () => {
  it('todos los agentes de la lista tienen su caso (ninguno da "no reconocido")', async () => {
    for (const a of AGENTES_DEFAULT_CONFIG) {
      const r = await ejecutarAgenteManual(a.id);
      expect(r.error ?? '').not.toMatch(/no reconocido/i);
    }
  });

  it('el Vigilante de Publicidad corre y deja su registro', async () => {
    const r = await ejecutarAgenteManual('vigilante_publicidad');
    expect(r.error ?? '').not.toMatch(/no reconocido/i);
    expect(r.success).toBe(true);
    expect(r.registro?.agenteId).toBe('vigilante_publicidad');
  });
});

describe('El despertador respeta el intervalo de cada agente', () => {
  const configCon = (ultimaEjecucion: string) =>
    AGENTES_DEFAULT_CONFIG.map((a) => ({ ...a, activo: a.id === 'vigilante_fiestas', ultimaEjecucion }));

  it('corrió hace 1 minuto con intervalo de 15: no corre ni escribe historial', async () => {
    archivos['agentes-configuracion.json'] = configCon(haceMin(1));
    const regs = await motor.ejecutarAgentesAutonomos(AHORA);
    expect(regs).toHaveLength(0);
    expect(escrituras).not.toContain('agentes-historial.json');
  });

  it('corrió hace 16 minutos con intervalo de 15: corre', async () => {
    archivos['agentes-configuracion.json'] = configCon(haceMin(16));
    const regs = await motor.ejecutarAgentesAutonomos(AHORA);
    expect(regs.map((r) => r.agenteId)).toEqual(['vigilante_fiestas']);
    expect(escrituras).toContain('agentes-historial.json');
  });

  it('el "ejecutar todos" manual no espera el intervalo', async () => {
    archivos['agentes-configuracion.json'] = configCon(haceMin(1));
    const regs = await motor.ejecutarAgentesAutonomos(AHORA, { ignorarIntervalo: true });
    expect(regs).toHaveLength(1);
  });
});
