/** @jest-environment node */
/**
 * Catalogo de servicios (12/10/2026): guardar, borrar y ajustar guardaban la lista ENTERA leida de un
 * cache de 15 s, sin marcas de lectura y sin turno. Dos personas a la vez se pisaban (el precio
 * nuevo de una volvia al viejo, o el servicio recien creado desaparecia). Ahora cada servicio se
 * guarda y se borra SOLO, en la transaccion de la base. La base de mentira devuelve COPIAS.
 */
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = () => new Promise((r) => setTimeout(r, 10));
let servicios: any[] = [];
let turno: Promise<unknown> = Promise.resolve();
const writeData = jest.fn(async (_f: string, v: any) => { servicios = copia(v); });

jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(), requirePermisoAlguno: jest.fn(async () => undefined) }));
jest.mock('@/lib/server-cache', () => ({ cachedFetch: jest.fn(async (_k: string, f: () => any) => f()), cacheInvalidate: jest.fn() }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: jest.fn(async () => []) }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => copia(servicios).map((s) => ({ ...s, _leido: { v: '1', h: 'x', w: '1' } }))),
  writeData: (f: string, v: any) => writeData(f, v),
  createDataItem: jest.fn(async (_f: string, c: string, id: string, item: any) => {
    expect(c).toBe('servicios');
    servicios = [...servicios, { ...copia(item), id }];
  }),
  mutateDataItem: jest.fn((_f: string, c: string, id: string, cambiar: (a: any) => any) => {
    expect(c).toBe('servicios');
    const r = turno.then(async () => {
      const actual = servicios.find((s) => s.id === id);
      if (!actual) return null;
      const nuevo = cambiar(copia(actual));
      await esperar();
      servicios = servicios.map((s) => (s.id === id ? copia(nuevo) : s));
      return copia(nuevo);
    });
    turno = r.catch(() => undefined);
    return r;
  }),
  deleteDataItem: jest.fn(async (_f: string, _c: string, id: string) => {
    const antes = servicios.length;
    servicios = servicios.filter((s) => s.id !== id);
    return servicios.length < antes;
  }),
}));

import { saveServicioEmpresa, deleteServicioEmpresa, adjustAllServicePrices } from '@/app/actions/servicios-empresa';
import { COLECCIONES_QUE_NO_SE_BORRAN_POR_OMISION } from '@/lib/budget/los-cobros-no-se-pisan';

const base = (id: string, nombre: string, precio: number) => ({ id, nombre, categoria: 'Sonido', precioVenta: precio, valorUnitarioEstimado: 100, tipoItem: 'Servicio' });

beforeEach(() => {
  writeData.mockClear();
  servicios = [base('s1', 'DJ', 1000), base('s2', 'Luces', 2000)];
});

describe('el catalogo guarda de a un servicio', () => {
  it('dos cambios a la vez de servicios distintos quedan los dos', async () => {
    const [a, b] = await Promise.all([
      saveServicioEmpresa({ id: 's1', nombre: 'DJ', categoria: 'Sonido', precioVenta: 1500 } as any),
      saveServicioEmpresa({ id: 's2', nombre: 'Luces', categoria: 'Sonido', precioVenta: 2500 } as any),
    ]);
    expect(a.success && b.success).toBe(true);
    expect(servicios.map((s) => s.precioVenta)).toEqual([1500, 2500]);
    expect(writeData).not.toHaveBeenCalled(); // nunca se reescribe la lista entera
  });

  it('crear uno nuevo no toca a los demas, y borrar uno borra solo ese', async () => {
    const nuevo = await saveServicioEmpresa({ nombre: 'Humo', categoria: 'Efectos', precioVenta: 300 } as any);
    expect(nuevo.success).toBe(true);
    expect(servicios).toHaveLength(3);
    const del = await deleteServicioEmpresa('s1');
    expect(del.success).toBe(true);
    expect(servicios.map((s) => s.id)).not.toContain('s1');
    expect(servicios).toHaveLength(2);
    expect(writeData).not.toHaveBeenCalled();
  });

  it('editar un servicio que otra persona borro avisa y no lo vuelve a crear', async () => {
    servicios = servicios.filter((s) => s.id !== 's1');
    const r = await saveServicioEmpresa({ id: 's1', nombre: 'DJ', categoria: 'Sonido', precioVenta: 1 } as any);
    // el control de existencia previo lo detecta antes de escribir
    expect(r.success).toBe(false);
    expect(servicios.find((s) => s.id === 's1')).toBeUndefined();
  });
});

describe('el ajuste masivo', () => {
  it('guarda la lista con las marcas de lectura (no pisa lo que otro cambio) y sube el precio', async () => {
    const r = await adjustAllServicePrices(10);
    expect(r.success).toBe(true);
    const guardada = writeData.mock.calls[0][1] as any[];
    expect(guardada.every((s) => s._leido)).toBe(true);
    expect(guardada.map((s) => s.precioVenta)).toEqual([1100, 2200]);
  });

  it('la coleccion de servicios no se borra por omision al guardar la lista entera', () => {
    expect(COLECCIONES_QUE_NO_SE_BORRAN_POR_OMISION.has('servicios')).toBe(true);
  });
});
