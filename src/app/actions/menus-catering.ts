
'use server';

import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';

// --- SIMULACIÓN DE BASE DE DATOS EN MEMORIA ---
let mockMenuDatabase: FullMenu[] = [
  {
    id: 'menu_clasico_casamiento_1',
    name: 'Menú Clásico Casamiento',
    description: 'Entrada, principal y postre tradicionales.',
    items: [
      {
        id: 'dish_empanadas_criollas',
        name: 'Empanadas Criollas (x Docena)',
        type: 'Entrada',
        ingredients: [
          { id: 'ing_tapas_empanada', name: 'Tapas de Empanada', quantity: '12', unit: 'un.', cost: '300.00' },
          { id: 'ing_carne_picada', name: 'Carne Picada Especial', quantity: '500', unit: 'gr', cost: '1200.00' },
        ],
        totalDishCost: 1500.00,
      },
      {
        id: 'dish_lomo_strogonoff',
        name: 'Lomo Strogonoff con Papas Noisette',
        type: 'Plato Principal',
        ingredients: [
          { id: 'ing_lomo_fresco', name: 'Lomo Fresco', quantity: '1', unit: 'kg', cost: '7500.00' },
          { id: 'ing_papas_noisette', name: 'Papas Noisette Congeladas', quantity: '1', unit: 'kg', cost: '1500.00' },
        ],
        totalDishCost: 9000.00,
      },
    ],
    createdAt: new Date(2023, 10, 15).toISOString(),
    updatedAt: new Date(2023, 10, 15).toISOString(),
  },
  {
    id: 'menu_infantil_cumple_2',
    name: 'Menú Cumpleaños Infantil',
    description: 'Opciones divertidas y adaptadas para niños.',
    items: [
      {
        id: 'dish_mini_pizzas',
        name: 'Mini Pizzas Muzzarella (x20)',
        type: 'Plato Principal',
        ingredients: [
            { id: 'ing_prepizzas', name: 'Prepizzas', quantity: '20', unit: 'un.', cost: '2000.00' },
            { id: 'ing_muzzarella_kg', name: 'Muzzarella', quantity: '1', unit: 'kg', cost: '3000.00' }
        ],
        totalDishCost: 5000.00,
      },
    ],
    createdAt: new Date(2023, 11, 1).toISOString(),
    updatedAt: new Date(2023, 11, 1).toISOString(),
  },
  // Default Menu based on "6 de junio" Excel
  {
    id: 'menu_base_boda_noelia',
    name: 'Menú Base Boda Noelia',
    description: 'Menú tipo basado en la fiesta del 6 de junio para Noelia Damaceno.',
    items: [
      {
        id: 'dish_tabla_fiambres_noelia',
        name: 'Tabla de fiambres',
        type: 'Entrada',
        ingredients: [
          { id: 'ing_fiambres_varios', name: 'Fiambres surtidos', quantity: '1', unit: 'global', cost: '3200.00' }
        ],
        totalDishCost: 3200.00, // For 80 guests at $40
      },
      {
        id: 'dish_sandwiches_saladitos_noelia',
        name: 'Sandwiches y saladitos',
        type: 'Entrada',
        ingredients: [
          { id: 'ing_sandwiches_varios', name: 'Sandwiches y saladitos surtidos', quantity: '1', unit: 'global', cost: '6400.00' }
        ],
        totalDishCost: 6400.00, // For 80 guests at $80
      },
      {
        id: 'dish_pollo_buffet_noelia',
        name: 'Pollo con mesa buffet',
        type: 'Plato Principal',
        ingredients: [
          { id: 'ing_pollo_buffet_completo', name: 'Pollo y acompañamientos buffet', quantity: '1', unit: 'global', cost: '9100.00' }
        ],
        totalDishCost: 9100.00, // For 70 guests at $130
      },
      {
        id: 'dish_hamburguesas_fritas_noelia',
        name: 'Hamburguesas c/ fritas (Menú Personal)',
        type: 'Plato Principal',
        ingredients: [
          { id: 'ing_hamburguesas_combo', name: 'Combo hamburguesa y fritas', quantity: '1', unit: 'global', cost: '3375.00' }
        ],
        totalDishCost: 3375.00, // For 25 guests at $135
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];
// --- FIN SIMULACIÓN BASE DE DATOS ---


export async function getMenus(): Promise<FullMenu[]> {
  // Simulación con delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Devolver una copia para evitar mutaciones directas del array mock
  return JSON.parse(JSON.stringify(mockMenuDatabase.sort((a,b) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )));
}

export async function getMenuById(id: string): Promise<FullMenu | null> {
  // Simulación con delay
  await new Promise(resolve => setTimeout(resolve, 300));
  const menu = mockMenuDatabase.find(m => m.id === id);
  return menu ? JSON.parse(JSON.stringify(menu)) : null;
}

export async function saveMenu(
  menuData: Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'> | FullMenu
): Promise<{ success: boolean; id?: string; error?: string; menu?: FullMenu }> {
  // Simulación con delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simular un error aleatorio para pruebas
  // if (Math.random() > 0.8) {
  //   return { success: false, error: "Error simulado al guardar el menú en la 'base de datos'." };
  // }

  if ('id' in menuData && menuData.id) {
    // Actualizar menú existente
    const index = mockMenuDatabase.findIndex(m => m.id === menuData.id);
    if (index !== -1) {
      mockMenuDatabase[index] = { 
        ...mockMenuDatabase[index], 
        ...menuData, 
        updatedAt: new Date().toISOString() 
      };
      return { success: true, id: menuData.id, menu: JSON.parse(JSON.stringify(mockMenuDatabase[index])) };
    } else {
      return { success: false, error: `Menú con ID ${menuData.id} no encontrado para actualizar.` };
    }
  } else {
    // Crear nuevo menú
    const newMenu: FullMenu = {
      ...menuData,
      id: `menu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockMenuDatabase.push(newMenu);
    return { success: true, id: newMenu.id, menu: JSON.parse(JSON.stringify(newMenu)) };
  }
}

export async function deleteMenu(id: string): Promise<{ success: boolean; error?: string }> {
  // Simulación con delay
  await new Promise(resolve => setTimeout(resolve, 800));
  const initialLength = mockMenuDatabase.length;
  mockMenuDatabase = mockMenuDatabase.filter(m => m.id !== id);
  
  if (mockMenuDatabase.length < initialLength) {
    return { success: true };
  } else {
    return { success: false, error: `Menú con ID ${id} no encontrado para eliminar.` };
  }
}
