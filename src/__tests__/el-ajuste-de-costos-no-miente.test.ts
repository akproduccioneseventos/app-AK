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
// Cada menú se guarda sobre su versión de ese momento (`mutateDataItem`, auditoría con las 35
// preguntas): la prueba usa los menús de verdad y mira lo que llega a cada uno.
let fallaLaBase = false;
const guardados = new Map<string, any>();
const mutateDataItem = jest.fn(async (_f: string, _c: string, id: string, cambiar: (a: any) => any) => {
  if (fallaLaBase) return null;
  const actual = menus().find((m) => m.id === id);
  const nuevo = cambiar(JSON.parse(JSON.stringify(actual)));
  guardados.set(id, nuevo);
  return nuevo;
});

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: {} })),
  requirePermisoAlguno: jest.fn(async () => ({ ok: true, user: {} })),
}));

jest.mock('@/lib/data-service', () => ({
  readData: (...a: unknown[]) => readData(...(a as [])),
  mutateDataItem: (...a: unknown[]) => (mutateDataItem as any)(...a),
  writeData: (...a: unknown[]) => writeData(...(a as [])),
  deleteDataItem: jest.fn(async () => true),
}));

jest.mock('@/lib/insumos/leer-insumos', () => ({
  leerInsumosCrudos: (...a: unknown[]) => leerInsumosCrudos(...(a as [])),
  limpiarCacheInsumos: jest.fn(),
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
      items: [{ id: 'plato_1', name: 'Lomo al horno', ingredients: [{ origenId: 'ins_1', name: 'Lomo', costoUnitario: 100 }] }],
    },
    {
      id: 'menu_sin_lomo',
      name: 'Menu de pastas',
      items: [{ id: 'plato_2', name: 'Tallarines', ingredients: [{ origenId: 'ins_9', name: 'Fideos', costoUnitario: 20 }] }],
    },
  ];
}

describe('El ajuste de costos de insumos no miente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    leerInsumosCrudos.mockResolvedValue(INSUMOS);
    readData.mockImplementation(async (f: string) => (f === 'menus-catering.json' ? menus() : INSUMOS));
    fallaLaBase = false;
    guardados.clear();
  });

  it('si un menu no se pudo actualizar, avisa y NO dice que salio bien', async () => {
    fallaLaBase = true;
    const { adjustAllInsumoCosts } = await import('@/app/actions/insumos');

    const resultado = await adjustAllInsumoCosts(10);

    expect(resultado.success).toBe(false);
    expect(resultado.error).toMatch(/precio viejo|no se pudo/i);
  });

  it('solo guarda los menus que usan el insumo que cambio', async () => {
    const { adjustAllInsumoCosts } = await import('@/app/actions/insumos');

    const resultado = await adjustAllInsumoCosts(10);

    expect(resultado.success).toBe(true);
    expect([...guardados.keys()]).toEqual(['menu_con_lomo']);
  });

  it('el costo nuevo llega al plato', async () => {
    const { adjustAllInsumoCosts } = await import('@/app/actions/insumos');

    await adjustAllInsumoCosts(10);

    const guardado: any = guardados.get('menu_con_lomo');
    expect(guardado.items[0].ingredients[0].costoUnitario).toBe(110);
  });
});
