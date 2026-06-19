import { buildAuthoritativeSimulatorServices, getMenuItemSellingPrice } from './catalog';
import type { FullMenu } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';

describe('authoritative simulator catalog', () => {
  it('uses the configured selling price and only derives one when it is missing', () => {
    expect(getMenuItemSellingPrice({
      id: 'dish-1',
      name: 'Plato',
      type: 'Plato Principal',
      ingredients: [],
      totalDishCost: 100,
      profitMargin: 50,
      suggestedSellingPrice: 325,
    })).toBe(325);

    expect(getMenuItemSellingPrice({
      id: 'dish-2',
      name: 'Plato',
      type: 'Plato Principal',
      ingredients: [],
      totalDishCost: 100,
      profitMargin: 50,
    })).toBe(150);
  });

  it('keeps the company catalog as the authority when ids overlap', () => {
    const services: ServicioEmpresa[] = [{
      id: 'shared',
      nombre: 'Servicio configurado',
      tipoItem: 'Servicio',
      precioVenta: 900,
    }];
    const menus: FullMenu[] = [{
      id: 'menu',
      name: 'Menu',
      description: '',
      items: [{
        id: 'shared',
        name: 'Plato duplicado',
        type: 'Entrada',
        ingredients: [],
        totalDishCost: 10,
        suggestedSellingPrice: 20,
      }],
    }];

    expect(buildAuthoritativeSimulatorServices(services, menus)).toEqual([
      expect.objectContaining({ id: 'shared', nombre: 'Servicio configurado', precioVenta: 900 }),
    ]);
  });
});
