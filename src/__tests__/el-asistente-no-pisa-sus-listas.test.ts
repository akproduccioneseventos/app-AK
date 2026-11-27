/** @jest-environment node */

const copia = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
let almacen: Record<string, any> = {};
let simularFallaLecturaArchivo: string | null = null;

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ userId: 'u1', perfil: 'dueno', role: 'admin' })),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { userId: 'u1', perfil: 'dueno', role: 'admin' } })),
  requirePermisoAlguno: jest.fn(async () => undefined),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({
    success: true,
    user: { userId: 'u1', email: 'dueno@ak.uy', perfil: 'dueno', role: 'admin' },
  })),
}));

jest.mock('@/lib/data-service', () => {
  const { marcarLecturaFallida } = jest.requireActual('@/lib/marca-de-lectura');
  return {
    readData: jest.fn(async (file: string, fallback: any) => {
      if (simularFallaLecturaArchivo === file) {
        return marcarLecturaFallida(copia(fallback), 'Falla simulada');
      }
      return almacen[file] !== undefined ? copia(almacen[file]) : copia(fallback);
    }),
    readDataConDetalle: jest.fn(async (file: string, fallback: any) => {
      if (simularFallaLecturaArchivo === file) {
        return { valor: copia(fallback), huboFalla: true, motivo: 'Falla simulada' };
      }
      const val = almacen[file] !== undefined ? copia(almacen[file]) : copia(fallback);
      return { valor: val, huboFalla: false };
    }),
    writeData: jest.fn(async (file: string, data: any) => {
      almacen[file] = copia(data);
    }),
  };
});

let cola: Promise<unknown> = Promise.resolve();
jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn((file: string, cambiar: (lista: any[]) => any[] | null) => {
    const turno = cola.then(async () => {
      if (simularFallaLecturaArchivo === file) {
        throw new Error(`Falla de lectura en ${file}`);
      }
      const actual = Array.isArray(almacen[file]) ? copia(almacen[file]) : [];
      const nueva = cambiar(actual);
      if (nueva) {
        almacen[file] = copia(nueva);
      }
      return nueva;
    });
    cola = turno.catch(() => undefined);
    return turno;
  }),
  mutarDocumento: jest.fn(async (file: string, vacio: any, cambiar: (v: any) => any | null) => {
    const actual = almacen[file] !== undefined ? copia(almacen[file]) : copia(vacio);
    const nuevo = await cambiar(actual);
    if (nuevo) almacen[file] = copia(nuevo);
    return nuevo;
  }),
}));

jest.mock('@/lib/multiagent/memory-store', () => ({
  saveAgentLearning: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/multiagent', () => ({
  ejecutarAccionSecretario: jest.fn(async () => ({ success: true, mensaje: 'ok' })),
}));

jest.mock('@/app/actions/scheduled-messages', () => ({
  saveScheduledMessage: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/asistente/planes-ejecutor', () => ({
  prepararMensajeDelPlan: jest.fn(async () => ({ resultado: 'ok' })),
}));

jest.mock('@/lib/ia/aprender-de-lo-aprobado', () => ({
  aprenderDeLoAprobado: jest.fn(async () => []),
  resumirGuiaDeEstilo: jest.fn(() => ''),
}));

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  getAsistenteSettings: jest.fn(async () => ({})),
  saveAsistenteSettings: jest.fn(async () => ({})),
}));

import { registrarDecisionDuenio, registrarAccionSola } from '@/lib/ia/reglas-de-la-ia';
import {
  getReglasAprendidas,
  desestimarReglaAprendida,
  posponerPropuesta,
  descartarNoAvisarMas,
  tomarPropuesta,
} from '@/lib/asistente/propuestas-service';
import {
  posponerPropuestaAction,
  descartarPropuestaAction,
  tomarPropuestaAction,
} from '@/app/actions/asistente-proactivo.actions';

describe('Orden 372 B3 — el asistente no pisa sus listas ni cambia propuestas resueltas', () => {
  const entorno = { node: process.env.NODE_ENV, local: process.env.AK_USE_LOCAL_JSON_ONLY };

  beforeEach(() => {
    almacen = {};
    simularFallaLecturaArchivo = null;
    (process.env as any).NODE_ENV = 'production';
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    jest.clearAllMocks();
  });

  afterAll(() => {
    (process.env as any).NODE_ENV = entorno.node;
    if (entorno.local !== undefined) process.env.AK_USE_LOCAL_JSON_ONLY = entorno.local;
  });

  it('con lectura fallida, registrarDecisionDuenio y registrarAccionSola no borran las anteriores', async () => {
    const previas = [
      { id: 'd1', tipoTarea: 'cobrador', decision: 'si', fecha: '2026-11-01T10:00:00Z' },
      { id: 'd2', tipoTarea: 'cobrador', decision: 'si', fecha: '2026-11-02T10:00:00Z' },
    ];
    const registroPrevio = [
      { id: 'r1', tareaId: 'vigilante_fiestas', que: 'Chequeo', fecha: '2026-11-01T10:00:00Z' },
    ];
    almacen['ia-aprendizaje.json'] = copia(previas);
    almacen['ia-registro.json'] = copia(registroPrevio);

    simularFallaLecturaArchivo = 'ia-aprendizaje.json';
    await registrarDecisionDuenio({ tipoTarea: 'cobrador', decision: 'no' });
    expect(almacen['ia-aprendizaje.json']).toHaveLength(2);

    simularFallaLecturaArchivo = 'ia-registro.json';
    await registrarAccionSola({ tareaId: 'vigilante_fiestas', que: 'Nueva acción' });
    expect(almacen['ia-registro.json']).toHaveLength(1);
  });

  it('getReglasAprendidas lanza error si la lectura falla, y desestimarReglaAprendida no borra todas', async () => {
    almacen['asistente-reglas-aprendidas.json'] = [
      { id: 'reg-1', tipoPropuesta: 'cuota', regla: 'no_avisar_mas', creadaEn: '2026-11-01T00:00:00Z' },
      { id: 'reg-2', tipoPropuesta: 'otro', regla: 'no_avisar_mas', creadaEn: '2026-11-01T00:00:00Z' },
    ];

    simularFallaLecturaArchivo = 'asistente-reglas-aprendidas.json';
    await expect(getReglasAprendidas()).rejects.toThrow();
    await expect(desestimarReglaAprendida('reg-1')).rejects.toThrow();
    expect(almacen['asistente-reglas-aprendidas.json']).toHaveLength(2);
  });

  it('posponer, descartar y tomar una propuesta ya aceptada o inexistente no la cambia y devuelve fallo explícito', async () => {
    almacen['asistente-propuestas.json'] = [
      {
        id: 'prop-aceptada',
        clave: 'c:1',
        area: 'ventas',
        titulo: 'Propuesta resuelta',
        quePasa: 'Pasa',
        porQueImporta: 'Importa',
        quePropone: 'Propone',
        estado: 'aceptada',
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-01T00:00:00Z',
      },
    ];

    const rPos = await posponerPropuesta('prop-aceptada');
    expect(rPos.ok).toBe(false);
    expect(rPos.updated).toBe(false);
    expect(almacen['asistente-propuestas.json'][0].estado).toBe('aceptada');

    const rDesc = await descartarNoAvisarMas('prop-aceptada');
    expect(rDesc.ok).toBe(false);
    expect(rDesc.updated).toBe(false);
    expect(almacen['asistente-propuestas.json'][0].estado).toBe('aceptada');
    expect(almacen['asistente-reglas-aprendidas.json']).toBeUndefined();

    const rTomar = await tomarPropuesta('prop-aceptada', 'Lucía');
    expect(rTomar.ok).toBe(false);
    expect(rTomar.updated).toBe(false);
    expect(almacen['asistente-propuestas.json'][0].tomadaPor).toBeUndefined();

    const actPos = await posponerPropuestaAction('prop-inexistente');
    expect(actPos.success).toBe(false);
    expect(actPos.error).toBeTruthy();

    const actDesc = await descartarPropuestaAction('prop-aceptada');
    expect(actDesc.success).toBe(false);
    expect(actDesc.error).toBeTruthy();

    const actTomar = await tomarPropuestaAction('prop-aceptada');
    expect(actTomar.success).toBe(false);
    expect(actTomar.error).toBeTruthy();
  });
});
