/**
 * Un cupón vencido, que todavía no empezó o que ya gastó sus usos NO se registra al guardar el
 * presupuesto (8/10/2026).
 *
 * `validarCupon` corre al armar el presupuesto, pero el cupón puede cambiar hasta el guardado.
 * El registro revalida adentro con LA MISMA regla (`motivoParaNoUsarCupon`): antes el registro
 * tenía una copia a medias y no miraba la fecha de inicio. Si no se puede, devuelve
 * { success: false, error } y NO sube el contador.
 */
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn().mockResolvedValue(undefined), requirePermisoAlguno: jest.fn().mockResolvedValue(undefined) }));

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
import { motivoParaNoUsarCupon } from '@/lib/cupones/motivo-para-no-usar';

const ayer = () => new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10);
const manana = () => new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);

describe('Un cupón que ya no sirve no se registra', () => {
  beforeEach(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    coleccion.cupones = {
      'cup-1': { id: 'cup-1', codigo: 'PROMO', activo: true, fechaInicio: '2020-01-01', fechaFin: '2099-12-31', usosMaximos: 3, usosActuales: 0 },
    };
    coleccion.cupones_usage = {};
  });

  it('vencido: se rechaza con un mensaje claro y los usos no cambian', async () => {
    coleccion.cupones['cup-1'].fechaFin = ayer();
    const r = await registrarUsoCupon('cup-1', 'pres-a', 'A', 1000, 10000);
    expect(r).toEqual({ success: false, error: 'Este cupón ha expirado.' });
    expect(coleccion.cupones['cup-1'].usosActuales).toBe(0);
    expect(Object.keys(coleccion.cupones_usage)).toHaveLength(0);
  });

  it('todavía no empezó: se rechaza y los usos no cambian', async () => {
    coleccion.cupones['cup-1'].fechaInicio = manana();
    const r = await registrarUsoCupon('cup-1', 'pres-a', 'A', 1000, 10000);
    expect(r).toEqual({ success: false, error: 'Este cupón aún no está vigente.' });
    expect(coleccion.cupones['cup-1'].usosActuales).toBe(0);
    expect(Object.keys(coleccion.cupones_usage)).toHaveLength(0);
  });

  it('en su tope de usos: se rechaza', async () => {
    coleccion.cupones['cup-1'].usosActuales = 3;
    const r = await registrarUsoCupon('cup-1', 'pres-a', 'A', 1000, 10000);
    expect(r).toEqual({ success: false, error: 'Este cupón ya alcanzó el límite de usos.' });
    expect(coleccion.cupones['cup-1'].usosActuales).toBe(3);
  });

  it('vigente: suma un uso, una sola vez aunque se guarde de nuevo', async () => {
    const a = await registrarUsoCupon('cup-1', 'pres-a', 'A', 1000, 10000);
    const b = await registrarUsoCupon('cup-1', 'pres-a', 'A', 1000, 10000);
    expect(a.success && b.success).toBe(true);
    expect(coleccion.cupones['cup-1'].usosActuales).toBe(1);
  });

  it('la regla compartida: desactivado, fechas rotas y el último día entero', () => {
    const base: any = { activo: true, fechaInicio: '2020-01-01', fechaFin: '2026-10-08', usosMaximos: 0, usosActuales: 99 };
    expect(motivoParaNoUsarCupon({ ...base, activo: false })).toMatch(/desactivado/);
    expect(motivoParaNoUsarCupon({ ...base, fechaFin: 'no-es-fecha' })).toMatch(/fechas/);
    // 0 usos máximos = ilimitado; y el último día vale hasta la medianoche.
    expect(motivoParaNoUsarCupon(base, new Date(2026, 9, 8, 23, 0))).toBeNull();
    expect(motivoParaNoUsarCupon(base, new Date(2026, 9, 9, 0, 1))).toMatch(/expirado/);
  });
});
