/** @jest-environment node */

let perfilActual = 'operador';

const copia = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const insumosSeed = [
  {
    id: 'ins_1',
    nombre: 'Lomo',
    tipoItem: 'Insumo/Ingrediente',
    categoria: 'Carnes',
    cantidadDisponible: 12,
    unidad: 'kg',
    proveedor: 'Frigorífico Norte',
    valorUnitarioEstimado: 450,
    precioVenta: 900,
    precioPorPersona: 225,
    precioBase: 450,
    tramosDePrecio: [{ id: 't1', desde: 1, hasta: 10, precio: 450 }],
    mantenimiento: {
      cadaDias: 30,
      historial: [{ id: 'm1', fecha: '2026-11-01', nota: 'Control', costo: 1500 }],
    },
  },
];

const menusSeed = [
  {
    id: 'menu_1',
    name: 'Menú Gala',
    description: 'Principal',
    estadoPublicacion: 'publicado',
    items: [
      {
        id: 'plato_1',
        name: 'Lomo a las brasas',
        type: 'Plato Principal',
        totalDishCost: 112.5,
        profitMargin: 100,
        suggestedSellingPrice: 225,
        ingredients: [
          {
            id: 'ing_1',
            origenId: 'ins_1',
            name: 'Lomo',
            quantityPerPerson: '0.25',
            unit: 'kg',
            costoUnitario: 450,
            costoTotalReceta: 112.5,
            proveedor: 'Frigorífico Norte',
          },
        ],
      },
    ],
  },
];

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({
    success: true,
    user: { userId: 'u1', perfil: perfilActual },
  })),
}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/insumos/leer-insumos', () => ({
  leerInsumosCrudos: jest.fn(async () => copia(insumosSeed)),
  limpiarCacheInsumos: jest.fn(),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => copia(menusSeed)),
  writeData: jest.fn(),
}));
jest.mock('@/lib/simulator/catalog', () => ({
  agregarVariantesBufet: (m: any) => m,
  esMesaBuffetBase: () => false,
  getMenuItemSellingPrice: () => 225,
}));

import { getInsumos, getInsumoById } from '@/app/actions/insumos';
import { getMenus, getMenuById, invalidateMenusCache } from '@/app/actions/menus-catering';

describe('Orden 371 B3.3 — El operador no ve costos ni márgenes en insumos ni menús', () => {
  beforeEach(async () => {
    perfilActual = 'secretaria';
    await invalidateMenusCache();
  });

  it('con perfil operador, getInsumos/getInsumoById y getMenus/getMenuById devuelven nombres y cantidades sin costos ni márgenes', async () => {
    perfilActual = 'operador';

    const insumos = await getInsumos();
    expect(insumos).toHaveLength(1);
    expect(insumos[0].nombre).toBe('Lomo');
    expect(insumos[0].cantidadDisponible).toBe(12);
    expect(insumos[0].unidad).toBe('kg');
    expect(insumos[0].valorUnitarioEstimado).toBeUndefined();
    expect(insumos[0].precioVenta).toBeUndefined();
    expect(insumos[0].precioPorPersona).toBeUndefined();
    expect(insumos[0].precioBase).toBeUndefined();
    expect(insumos[0].tramosDePrecio).toBeUndefined();
    expect(insumos[0].mantenimiento?.historial?.[0]?.costo).toBeUndefined();

    const insumo = await getInsumoById('ins_1');
    expect(insumo?.nombre).toBe('Lomo');
    expect(insumo?.valorUnitarioEstimado).toBeUndefined();

    const menus = await getMenus();
    expect(menus).toHaveLength(1);
    const plato = menus[0].items[0];
    expect(plato.name).toBe('Lomo a las brasas');
    expect(plato.totalDishCost).toBeUndefined();
    expect(plato.profitMargin).toBeUndefined();
    expect(plato.suggestedSellingPrice).toBeUndefined();
    expect(plato.ingredients[0].name).toBe('Lomo');
    expect(plato.ingredients[0].quantityPerPerson).toBe('0.25');
    expect(plato.ingredients[0].unit).toBe('kg');
    expect(plato.ingredients[0].costoUnitario).toBeUndefined();
    expect(plato.ingredients[0].costoTotalReceta).toBeUndefined();

    const menu = await getMenuById('menu_1');
    expect(menu?.items[0].totalDishCost).toBeUndefined();
    expect(menu?.items[0].profitMargin).toBeUndefined();
    expect(menu?.items[0].ingredients[0].costoUnitario).toBeUndefined();
  });

  it('con perfil secretaria (INSUMOS y CONTABILIDAD), sí ve costos y márgenes', async () => {
    perfilActual = 'secretaria';

    const insumos = await getInsumos();
    expect(insumos[0].valorUnitarioEstimado).toBe(450);

    const menus = await getMenus();
    const plato = menus[0].items[0];
    expect(plato.totalDishCost).toBeCloseTo(112.5, 6);
    expect(plato.profitMargin).toBe(100);
    expect(plato.ingredients[0].costoUnitario).toBe(450);
  });

  it('con perfil personal, no puede leer insumos ni menús', async () => {
    perfilActual = 'personal';
    await expect(getInsumos()).rejects.toThrow();
    await expect(getMenus()).rejects.toThrow();
  });
});
