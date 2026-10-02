/**
 * Aceptar una propuesta del asistente respeta la regla de oro (2/10/2026).
 *
 * Pasó: la bandeja "Tu asistente" trataba a todos como dueño (`|| true`) y aceptar una propuesta
 * ejecutaba cualquier acción sin mirar `nivelDeRiesgo`, y la marcaba aceptada aunque fallara.
 */
let guardado: any[] = [];

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) =>
    file === 'asistente-propuestas.json' ? JSON.parse(JSON.stringify(guardado)) : fallback),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file === 'asistente-propuestas.json') guardado = JSON.parse(JSON.stringify(data));
  }),
}));
jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (_file: string, cambiar: (l: any[]) => any[] | null) => {
    const nueva = cambiar(JSON.parse(JSON.stringify(guardado)));
    if (nueva) guardado = JSON.parse(JSON.stringify(nueva));
    return nueva;
  }),
}));
jest.mock('@/lib/multiagent/memory-store', () => ({ saveAgentLearning: jest.fn(async () => ({})) }));
jest.mock('@/app/actions/scheduled-messages', () => ({ saveScheduledMessage: jest.fn(async () => ({ success: true })) }));
const ejecutar = jest.fn(async () => ({ success: true, mensaje: 'hecho' }));
jest.mock('@/app/actions/multiagent', () => ({ ejecutarAccionSecretario: (...a: any[]) => (ejecutar as any)(...a) }));

import { aceptarPropuesta, agregarPropuestasDeduplicadas } from '@/lib/asistente/propuestas-service';

function propuesta(type: string) {
  guardado = [{ id: 'p1', clave: `${type}:1`, estado: 'pendiente', quePropone: 'x', accion: { type, data: {} } }];
}

beforeEach(() => { ejecutar.mockClear(); ejecutar.mockImplementation(async () => ({ success: true, mensaje: 'hecho' })); });

describe('Aceptar una propuesta respeta la regla de oro', () => {
  it('lo de "nunca" no se ejecuta, ni siquiera para el dueño', async () => {
    propuesta('marcar_pagado');
    const r = await aceptarPropuesta('p1', 'dueno@ak', { esDuenio: true });
    expect(r.success).toBe(false);
    expect(ejecutar).not.toHaveBeenCalled();
    expect(guardado[0].estado).toBe('pendiente');
  });

  it('lo que toca plata no lo acepta alguien que no es el dueño', async () => {
    propuesta('cargar_gasto');
    const r = await aceptarPropuesta('p1', 'secretaria@ak', { esDuenio: false });
    expect(r.success).toBe(false);
    expect(ejecutar).not.toHaveBeenCalled();
  });

  it('el dueño sí lo acepta', async () => {
    propuesta('cargar_gasto');
    const r = await aceptarPropuesta('p1', 'dueno@ak', { esDuenio: true });
    expect(r.success).toBe(true);
    expect(ejecutar).toHaveBeenCalledTimes(1);
    expect(guardado[0].estado).toBe('aceptada');
  });

  it('si la acción falla, la propuesta no queda como aceptada', async () => {
    propuesta('crear_tarea');
    ejecutar.mockImplementation(async () => ({ success: false, mensaje: 'no se pudo' }));
    const r = await aceptarPropuesta('p1', 'dueno@ak', { esDuenio: true });
    expect(r.success).toBe(false);
    expect(guardado[0].estado).toBe('pendiente');
  });

  it('dos toques a la vez hacen la acción una sola vez', async () => {
    propuesta('cargar_gasto');
    const [a, b] = await Promise.all([
      aceptarPropuesta('p1', 'dueno@ak', { esDuenio: true }),
      aceptarPropuesta('p1', 'dueno@ak', { esDuenio: true }),
    ]);
    expect(ejecutar).toHaveBeenCalledTimes(1);
    expect([a.success, b.success].filter(Boolean)).toHaveLength(1);
  });

  it('dos tandas de propuestas a la vez: quedan las dos, y la misma clave una sola vez', async () => {
    guardado = [];
    const base = { titulo: 't', quePropone: 'x', area: 'general' } as any;
    const [a, b] = await Promise.all([
      agregarPropuestasDeduplicadas([{ ...base, clave: 'uno' }, { ...base, clave: 'igual' }]),
      agregarPropuestasDeduplicadas([{ ...base, clave: 'dos' }, { ...base, clave: 'igual' }]),
    ]);
    expect(a.agregadas.length + b.agregadas.length).toBe(3);
    expect(guardado.map((p) => p.clave).sort()).toEqual(['dos', 'igual', 'uno']);
  });
});
