/** @jest-environment node */
/**
 * Ajuste masivo de costos de insumos (12/10/2026).
 *
 * - El marcador de "ajuste pendiente" se escribia DESPUES de guardar los insumos: si el servidor se
 *   cortaba (o la propagacion a los menus tiraba un error) en el medio, no quedaba rastro y el
 *   reintento volvia a subir el porcentaje (10% + 10% = 121). Ahora se escribe ANTES.
 * - El redondeo a entero dejaba sin subir los insumos de $6 a $10 con aumentos chicos.
 * La base de mentira devuelve COPIAS.
 */
const base: Record<string, any> = {};
let insumos: any[] = [];
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const aplicarInsumoEnMenus = jest.fn(async (..._a: unknown[]) => ({ success: true } as { success: boolean; error?: string }));
const ordenDeEscritura: string[] = [];

jest.mock('@/lib/auth/require-session', () => ({ requirePermiso: jest.fn(async () => ({ ok: true, user: {} })) }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (f === 'insumos.json' ? copia(insumos) : base[f] !== undefined ? copia(base[f]) : d)),
  writeData: jest.fn(async (f: string, v: any) => {
    ordenDeEscritura.push(f);
    if (f === 'insumos.json') insumos = copia(v); else base[f] = copia(v);
  }),
  createDataItem: jest.fn(), mutateDataItem: jest.fn(), deleteDataItem: jest.fn(),
}));
jest.mock('@/lib/insumos/leer-insumos', () => ({ leerInsumosCrudos: jest.fn(async () => copia(insumos)), limpiarCacheInsumos: jest.fn() }));
jest.mock('@/app/actions/menus-catering', () => ({ aplicarInsumoEnMenus: (...a: unknown[]) => (aplicarInsumoEnMenus as any)(...a), invalidateMenusCache: jest.fn() }));

import { adjustAllInsumoCosts } from '@/app/actions/insumos';

beforeEach(() => {
  for (const k of Object.keys(base)) delete base[k];
  ordenDeEscritura.length = 0;
  insumos = [
    { id: 'a', nombre: 'Lomo', unidad: 'kg', valorUnitarioEstimado: 100, categoria: 'Carnes' },
    { id: 'b', nombre: 'Sal', unidad: 'kg', valorUnitarioEstimado: 6, categoria: 'Secos' },
  ];
  aplicarInsumoEnMenus.mockReset().mockResolvedValue({ success: true });
});

describe('El marcador de ajuste pendiente va ANTES de tocar los insumos', () => {
  it('se escribe el marcador antes que la lista de insumos', async () => {
    await adjustAllInsumoCosts(10);
    expect(ordenDeEscritura.indexOf('insumos-ajuste-pendiente.json')).toBeGreaterThanOrEqual(0);
    expect(ordenDeEscritura.indexOf('insumos-ajuste-pendiente.json')).toBeLessThan(ordenDeEscritura.indexOf('insumos.json'));
  });

  it('si se corta despues de guardar los insumos (error al llevar el costo a los menus), el reintento no sube otra vez', async () => {
    aplicarInsumoEnMenus.mockRejectedValueOnce(new Error('se cayo el servidor'));
    const primero = await adjustAllInsumoCosts(10);
    expect(primero.success).toBe(false);
    expect(insumos.map((i) => i.valorUnitarioEstimado)).toEqual([110, 6.6]);

    const reintento = await adjustAllInsumoCosts(10);
    expect(reintento.success).toBe(true);
    expect(insumos.map((i) => i.valorUnitarioEstimado)).toEqual([110, 6.6]); // no 121
  });

  it('si se corta antes de guardar los insumos, el reintento los pone una sola vez', async () => {
    const { writeData } = jest.requireMock('@/lib/data-service');
    const original = (writeData as jest.Mock).getMockImplementation()!;
    (writeData as jest.Mock).mockImplementation(async (f: string, v: any, ...r: any[]) => {
      if (f === 'insumos.json') throw new Error('corte');
      return original(f, v, ...r);
    });
    const primero = await adjustAllInsumoCosts(10);
    expect(primero.success).toBe(false);
    expect(insumos[0].valorUnitarioEstimado).toBe(100);

    (writeData as jest.Mock).mockImplementation(original);
    const reintento = await adjustAllInsumoCosts(10);
    expect(reintento.success).toBe(true);
    expect(insumos.map((i) => i.valorUnitarioEstimado)).toEqual([110, 6.6]);
    const otra = await adjustAllInsumoCosts(5);
    expect(otra.success).toBe(true); // el anterior ya termino: se puede hacer uno nuevo
  });
});

describe('Los insumos baratos tambien suben', () => {
  it('un insumo de $6 con +5% queda en $6,30 y no en $6', async () => {
    await adjustAllInsumoCosts(5);
    expect(insumos.find((i) => i.id === 'b').valorUnitarioEstimado).toBe(6.3);
    expect(insumos.find((i) => i.id === 'a').valorUnitarioEstimado).toBe(105);
  });
});
