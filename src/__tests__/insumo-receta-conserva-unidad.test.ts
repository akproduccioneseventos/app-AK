/** @jest-environment node */
const catalogo = [{ id: 'carne', nombre: 'Carne', unidad: 'kg', valorUnitarioEstimado: 110 }];
let menu: any;
jest.mock('@/lib/auth/require-session', () => ({ requirePermisoAlguno: jest.fn(async () => undefined) }));
jest.mock('@/lib/insumos/leer-insumos', () => ({ leerInsumosCrudos: jest.fn(async () => catalogo) }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => [menu]),
  mutateDataItem: jest.fn(async (_file: string, _collection: string, _id: string, cambiar: (actual: any) => any) => {
    menu = cambiar(structuredClone(menu));
    return menu;
  }),
}));

import { aplicarInsumoEnMenus } from '@/app/actions/menus-catering';

describe('El precio de compra no cambia la magnitud de una receta', () => {
  it.each([['g', '250'], ['kg', '0.25'], ['ml', '250'], ['l', '0.25']])('conserva %s y su cantidad', async (unit, quantityPerPerson) => {
    const compra = unit === 'ml' || unit === 'l' ? 'l' : 'kg';
    catalogo[0].unidad = compra;
    menu = {
      id: 'menu', name: 'Menu', items: [{
        id: 'plato', name: 'Plato', suggestedSellingPrice: 50,
        ingredients: [{ id: 'ingrediente', origenId: 'carne', name: 'Carne', unit, quantityPerPerson, costoUnitario: 100 }],
      }],
    };
    const resultado = await aplicarInsumoEnMenus(catalogo[0] as any);
    expect(resultado.success).toBe(true);
    const ingrediente = menu.items[0].ingredients[0];
    expect(ingrediente.unit).toBe(unit);
    expect(ingrediente.quantityPerPerson).toBe(quantityPerPerson);
    expect(ingrediente.costoUnitario).toBe(110);
    expect(ingrediente.costoTotalReceta).toBeCloseTo(27.5);
    expect(menu.items[0].totalDishCost).toBeCloseTo(27.5);
    expect(menu.items[0].suggestedSellingPrice).toBe(50);
  });
});
