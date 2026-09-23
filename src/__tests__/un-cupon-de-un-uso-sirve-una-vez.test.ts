/**
 * MATAFUEGO — Un cupon de un solo uso sirve una vez, aunque dos lo usen a la vez desde
 * servidores distintos, y un presupuesto guardado dos veces gasta un solo uso
 * (23 de septiembre de 2026).
 *
 * Se probo rompiendolo: con el registro de uso de antes (lista entera y turno de un solo
 * servidor, que la prueba simula mandando cada llamada por su lado), las dos primeras
 * comprobaciones se ponen en rojo.
 */
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn().mockResolvedValue(undefined) }));

const coleccion: Record<string, Record<string, any>> = { cupones: {}, cupones_usage: {} };
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = () => new Promise((seguir) => setTimeout(seguir, 10));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    await esperar();
    if (archivo === 'cupones.json') return Object.values(coleccion.cupones).map(copia);
    if (archivo === 'cupones-usage.json') return Object.values(coleccion.cupones_usage).map(copia);
    return porDefecto;
  }),
  writeData: jest.fn(async () => { throw new Error('no se guarda la lista entera con base'); }),
  mutateDataItem: jest.fn(async (_archivo: string, nombre: string, id: string, cambiar: (x: any) => any) => {
    await esperar();
    const actual = coleccion[nombre][id];
    if (!actual) return null;
    const nuevo = cambiar(copia(actual));
    if (!nuevo) return null;
    coleccion[nombre][id] = copia(nuevo);
    return nuevo;
  }),
  createDataItem: jest.fn(async (_archivo: string, nombre: string, id: string, item: any) => {
    await esperar();
    if (coleccion[nombre][id]) { const e: any = new Error('6 ALREADY_EXISTS: already exists'); e.code = 6; throw e; }
    coleccion[nombre][id] = copia(item);
  }),
}));

import { registrarUsoCupon } from '@/app/actions/cupones';

describe('Un cupon de un solo uso sirve una vez', () => {
  beforeEach(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    coleccion.cupones = { 'cup-1': { id: 'cup-1', codigo: 'REGALO', activo: true, fechaFin: '2099-12-31', usosMaximos: 1, usosActuales: 0 } };
    coleccion.cupones_usage = {};
  });

  it('dos presupuestos a la vez: uno lo usa y el otro no', async () => {
    const [a, b] = await Promise.all([
      registrarUsoCupon('cup-1', 'pres-a', 'A', 1000, 10000),
      registrarUsoCupon('cup-1', 'pres-b', 'B', 1000, 10000),
    ]);
    expect([a.success, b.success].filter(Boolean)).toHaveLength(1);
    expect(coleccion.cupones['cup-1'].usosActuales).toBe(1);
    expect(Object.keys(coleccion.cupones_usage)).toHaveLength(1);
  });

  it('el mismo presupuesto guardado dos veces a la vez gasta un solo uso', async () => {
    coleccion.cupones['cup-1'].usosMaximos = 5;
    const [a, b] = await Promise.all([
      registrarUsoCupon('cup-1', 'pres-a', 'A', 1000, 10000),
      registrarUsoCupon('cup-1', 'pres-a', 'A', 1000, 10000),
    ]);
    expect(a.success && b.success).toBe(true);
    expect(coleccion.cupones['cup-1'].usosActuales).toBe(1);
    expect(Object.keys(coleccion.cupones_usage)).toHaveLength(1);
  });

  it('un cupon desactivado no se usa', async () => {
    coleccion.cupones['cup-1'].activo = false;
    const r = await registrarUsoCupon('cup-1', 'pres-a', 'A', 1000, 10000);
    expect(r.success).toBe(false);
    expect(coleccion.cupones['cup-1'].usosActuales).toBe(0);
  });
});
