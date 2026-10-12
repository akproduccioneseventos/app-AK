/** @jest-environment node */
/**
 * `adjustAllDishMargins` (menus-catering.ts) corre adentro del turno de menus y guarda cada menu con
 * `saveMenuInterno`. Con el `saveMenu` de antes volvia a pedir el turno (que no se puede reentrar) y
 * la pantalla quedaba colgada para siempre. La prueba exige que termine rapido y guarde los dos.
 */
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let menus: any[] = [];
const guardados: string[] = [];

jest.mock('@/lib/auth/require-session', () => ({ requirePermisoAlguno: jest.fn(async () => undefined) }));
jest.mock('@/lib/simulator/catalog', () => ({ agregarVariantesBufet: (m: any) => m, getMenuItemSellingPrice: () => 0 }));
jest.mock('@/app/actions/insumos', () => ({ getInsumos: jest.fn(async () => []) }));
jest.mock('@/lib/insumos/leer-insumos', () => ({ leerInsumosCrudos: jest.fn(async () => []) }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => copia(menus)),
  writeData: jest.fn(async (_f: string, v: any) => { menus = copia(v); }),
  createDataItem: jest.fn(),
  updateDataItem: jest.fn(async (_f: string, _c: string, id: string, item: any) => {
    guardados.push(id);
    menus = menus.map((m) => (m.id === id ? copia(item) : m));
    return true;
  }),
  deleteDataItem: jest.fn(),
  mutateDataItem: jest.fn(),
}));

import { adjustAllDishMargins } from '@/app/actions/menus-catering';

const plato = (id: string, costo: number) => ({
  id, name: id, category: 'Principal', ingredients: [], totalDishCost: costo, profitMargin: 100, suggestedSellingPrice: costo * 2,
});

beforeEach(() => {
  guardados.length = 0;
  menus = [
    { id: 'm1', name: 'Menu 1', items: [plato('m1a', 100)] },
    { id: 'm2', name: 'Menu 2', items: [plato('m2a', 200)] },
  ];
});

it('con dos menus termina en menos de 2 segundos y guarda los dos', async () => {
  const inicio = Date.now();
  const r = await Promise.race([
    adjustAllDishMargins(10),
    new Promise<{ success: boolean; error: string }>((res) => setTimeout(() => res({ success: false, error: 'COLGADO' }), 2000)),
  ]);
  expect(r.error).not.toBe('COLGADO');
  expect(Date.now() - inicio).toBeLessThan(2000);
  expect(r.success).toBe(true);
  expect(guardados.sort()).toEqual(['m1', 'm2']);
});
