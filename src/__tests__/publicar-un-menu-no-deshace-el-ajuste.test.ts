/** @jest-environment node */

const copia = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

let menusDb: any[] = [];
const insumosDb = [
  { id: 'ins_carne', nombre: 'Carne', unidad: 'kg', valorUnitarioEstimado: 100 },
];

jest.mock('@/lib/auth/require-session', () => ({
  requirePermisoAlguno: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { userId: 'u1', perfil: 'dueno' } })),
}));
jest.mock('@/lib/insumos/leer-insumos', () => ({
  leerInsumosCrudos: jest.fn(async () => copia(insumosDb)),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => copia(menusDb)),
  writeData: jest.fn(async (_f: string, v: any) => {
    menusDb = copia(v);
  }),
  createDataItem: jest.fn(async (_f: string, _c: string, _id: string, item: any) => {
    menusDb.push(copia(item));
    return true;
  }),
  updateDataItem: jest.fn(async () => {
    throw new Error('saveMenuInterno no debe reemplazar el menú entero con updateDataItem.');
  }),
  mutateDataItem: jest.fn(async (_f: string, _c: string, id: string, mutar: (actual: any) => any) => {
    const idx = menusDb.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    const next = mutar(copia(menusDb[idx]));
    if (!next) return null;
    menusDb[idx] = copia(next);
    return copia(next);
  }),
  deleteDataItem: jest.fn(async () => true),
}));

import { getMenus, adjustAllDishMargins, saveMenu } from '@/app/actions/menus-catering';

describe('Orden 369 B5.1 — Publicar un menú no deshace el ajuste de márgenes', () => {
  beforeEach(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    menusDb = [
      {
        id: 'menu_1',
        name: 'Menú Clásico',
        description: 'Entrada y principal',
        estadoPublicacion: 'borrador',
        updatedAt: '2026-11-26T09:00:00.000Z',
        items: [
          {
            id: 'plato_1',
            name: 'Lomo al champignon',
            type: 'Plato Principal',
            ingredients: [
              {
                id: 'ing_1',
                origenId: 'ins_carne',
                name: 'Carne',
                unit: 'kg',
                quantityPerPerson: '1',
                costoUnitario: 100,
                costoTotalReceta: 100,
              },
            ],
            totalDishCost: 100,
            profitMargin: 100,
            suggestedSellingPrice: 200,
          },
        ],
      },
    ];
  });

  it('ajustar márgenes y después publicar con la copia vieja deja el margen y precio ajustados', async () => {
    const [copiaVieja] = await getMenus();
    expect(copiaVieja.items[0].profitMargin).toBe(100);
    expect(copiaVieja.items[0].suggestedSellingPrice).toBe(200);

    const ajuste = await adjustAllDishMargins(20);
    expect(ajuste.success).toBe(true);
    expect(menusDb[0].items[0].profitMargin).toBe(120);
    expect(menusDb[0].items[0].suggestedSellingPrice).toBe(220);

    const publicado = await saveMenu({ ...copiaVieja, estadoPublicacion: 'publicado' });
    expect(publicado.success).toBe(true);
    expect(menusDb[0].estadoPublicacion).toBe('publicado');
    expect(menusDb[0].items[0].profitMargin).toBe(120);
    expect(menusDb[0].items[0].suggestedSellingPrice).toBe(220);
  });
});
