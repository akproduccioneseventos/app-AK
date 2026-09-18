/** @jest-environment node */
/**
 * EL AJUSTE DE COSTOS NO DICE "LISTO" SI LOS MENUS QUEDARON CON EL PRECIO VIEJO.
 *
 * **Lo encontro Codex el 18 de septiembre de 2026, y son dos cosas:**
 *
 * 1. Si un menu no se podia guardar, el error se anotaba en un registro que no mira nadie y la
 *    pantalla decia **"listo"** igual. Los platos seguian costando lo viejo y **el presupuesto
 *    siguiente salia con precios de antes**, que es plata que no se cobra.
 * 2. Se guardaban **todos** los menus, no solo los que usan el insumo que cambio: se pisaban
 *    menus que nadie habia tocado.
 */

const readData = jest.fn();
const writeData = jest.fn(async () => undefined);
const leerInsumosCrudos = jest.fn();
const getMenus = jest.fn();
const saveMenu = jest.fn(async () => ({ success: true }));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: {} })),
}));

jest.mock('@/lib/data-service', () => ({
  readData: (...a: unknown[]) => readData(...(a as [])),
  writeData: (...a: unknown[]) => writeData(...(a as [])),
  deleteDataItem: jest.fn(async () => true),
}));

jest.mock('@/lib/insumos/leer-insumos', () => ({
  leerInsumosCrudos: (...a: unknown[]) => leerInsumosCrudos(...(a as [])),
  limpiarCacheInsumos: jest.fn(),
}));

jest.mock('@/app/actions/menus-catering', () => ({
  getMenus: (...a: unknown[]) => getMenus(...(a as [])),
  saveMenu: (...a: unknown[]) => saveMenu(...(a as [])),
  invalidateMenusCache: jest.fn(),
}));

const INSUMOS = [
  { id: 'ins_1', nombre: 'Lomo', unidad: 'kg', valorUnitarioEstimado: 100, categoria: 'Carnes' },
  { id: 'ins_2', nombre: 'Papa', unidad: 'kg', valorUnitarioEstimado: 50, categoria: 'Verduras' },
];

function menus() {
  return [
    {
      id: 'menu_con_lomo',
      name: 'Menu con lomo',
      items: [{ id: 'plato_1', ingredients: [{ origenId: 'ins_1', name: 'Lomo', costoUnitario: 100 }] }],
    },
    {
      id: 'menu_sin_lomo',
      name: 'Menu de pastas',
      items: [{ id: 'plato_2', ingredients: [{ origenId: 'ins_9', name: 'Fideos', costoUnitario: 20 }] }],
    },
  ];
}

describe('El ajuste de costos de insumos no miente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    leerInsumosCrudos.mockResolvedValue(INSUMOS);
    readData.mockResolvedValue(INSUMOS);
    getMenus.mockImplementation(async () => menus());
    saveMenu.mockImplementation(async () => ({ success: true }));
  });

  it('si un menu no se pudo actualizar, avisa y NO dice que salio bien', async () => {
    saveMenu.mockImplementation(async () => ({ success: false, error: 'la base no contesta' }));
    const { adjustAllInsumoCosts } = await import('@/app/actions/insumos');

    const resultado = await adjustAllInsumoCosts(10);

    expect(resultado.success).toBe(false);
    expect(resultado.error).toMatch(/precio viejo|no se pudo/i);
  });

  it('solo guarda los menus que usan el insumo que cambio', async () => {
    const { adjustAllInsumoCosts } = await import('@/app/actions/insumos');

    const resultado = await adjustAllInsumoCosts(10);

    expect(resultado.success).toBe(true);
    const guardados = saveMenu.mock.calls.map((llamada: any[]) => llamada[0].id);
    expect(guardados).toContain('menu_con_lomo');
    expect(guardados).not.toContain('menu_sin_lomo');
  });

  it('el costo nuevo llega al plato', async () => {
    const { adjustAllInsumoCosts } = await import('@/app/actions/insumos');

    await adjustAllInsumoCosts(10);

    const guardado: any = saveMenu.mock.calls.find((llamada: any[]) => llamada[0].id === 'menu_con_lomo')?.[0];
    expect(guardado.items[0].ingredients[0].costoUnitario).toBe(110);
  });
});
