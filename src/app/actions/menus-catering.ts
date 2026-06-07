'use server';

import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import { readData, writeData } from '@/lib/data-service';
import { getInsumos } from './insumos';

const MENUS_CATERING_COLLECTION_JSON = 'menus-catering.json';

let cachedMenus: FullMenu[] | null = null;

export async function invalidateMenusCache() {
  cachedMenus = null;
}

/**
 * Convierte strings con comas o puntos a números de forma segura.
 * Maneja el error de interpretación de puntos decimales como miles.
 */
const parseSafeNumber = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    let str = String(val).trim();
    if (!str) return 0;
    
    if (str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else {
        const parts = str.split('.');
        if (parts.length === 2 && parts[1].length !== 3) {
            // Decimal
        } else if (parts.length > 2) {
            str = str.replace(/\./g, '');
        }
    }

    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
};

function calculateIngredientCost(ing: Partial<Ingredient>, catalogItems: ServicioEmpresa[]): number {
    const quantity = parseSafeNumber(ing.quantityPerPerson);
    const unitCost = parseSafeNumber(ing.costoUnitario);
    const recipeUnit = (ing.unit || '').toLowerCase().trim();
    
    if (quantity === 0 || unitCost === 0) return 0;
    
    const catalogItem = ing.origenId ? catalogItems.find(item => item.id === ing.origenId) : null;
    const catalogUnit = (catalogItem?.unidad || '').toLowerCase().trim();

    const isSmallRecipeUnit = ['g', 'gramos', 'ml', 'cc', 'cc.', 'no definido'].includes(recipeUnit);
    const isSmallCatalogUnit = ['g', 'gramos', 'ml', 'cc', 'cc.'].includes(catalogUnit);

    let factor = 1;
    if (isSmallRecipeUnit && !isSmallCatalogUnit) {
        factor = 1000;
    }
    
    return (quantity / factor) * unitCost;
}

function recalculateMenu(menu: FullMenu, catalogItems: ServicioEmpresa[], allDishes: MenuItem[]): FullMenu {
    return {
        ...menu,
        items: (menu.items || []).map(item => {
            let finalIngredients = [...(item.ingredients || [])];

            const upperName = item.name.toUpperCase();
            if (upperName.includes('MESA BUFET') || upperName.includes('MESA BUFFET')) {
                const mesaBuffetBase = allDishes.find(d => {
                    const dName = d.name.toUpperCase();
                    return (dName === 'MESA BUFET' || dName === 'MESA BUFFET') && d.id !== item.id;
                });
                
                if (mesaBuffetBase && mesaBuffetBase.ingredients) {
                    mesaBuffetBase.ingredients.forEach(buffetIng => {
                        if (!finalIngredients.some(existing => existing.name.toLowerCase() === buffetIng.name.toLowerCase())) {
                            finalIngredients.push({ ...buffetIng, id: `buffet_merge_${buffetIng.id}_${Date.now()}` });
                        }
                    });
                }
            }

            const ingredientsWithCost = finalIngredients.map(ing => ({
                ...ing,
                costoTotalReceta: calculateIngredientCost(ing, catalogItems)
            }));

            const totalDishCost = ingredientsWithCost.reduce((sum, ing) => sum + ing.costoTotalReceta, 0);
            const profitMargin = item.profitMargin === undefined ? 100 : Number(item.profitMargin);
            
            let suggestedSellingPrice: number;
            if (item.suggestedSellingPrice !== undefined && Number(item.suggestedSellingPrice) > 0) {
                suggestedSellingPrice = Math.round(Number(item.suggestedSellingPrice));
            } else {
                suggestedSellingPrice = Math.round(totalDishCost * (1 + profitMargin / 100));
            }

            return {
                ...item,
                ingredients: ingredientsWithCost,
                totalDishCost: totalDishCost,
                profitMargin: totalDishCost > 0 ? Math.round(((suggestedSellingPrice / totalDishCost) - 1) * 100) : profitMargin,
                suggestedSellingPrice: suggestedSellingPrice
            };
        })
    };
}

export async function getMenus(): Promise<FullMenu[]> {
  if (cachedMenus) return cachedMenus;
  const [menus, catalog] = await Promise.all([readMenusFile(), getInsumos()]);
  
  const mainMenu = menus.find(m => m.id === 'menu_principales_maestro');
  if (mainMenu) {
      const targetDishes = [
          'ASADO COMPLETO C/ GUARNICIÓN', 
          'POLLO ARROLLADO C/ GUARNICIÓN', 
          'CORDERO ASADO C/ GUARNICIÓN', 
          'CERDO ARROLLADO C/ GUARNICIÓN'
      ];
      
      const virtualItems: MenuItem[] = [];
      targetDishes.forEach(name => {
          const base = mainMenu.items.find(i => i.name === name);
          if (base) {
              const buffetName = name.replace('C/ GUARNICIÓN', 'CON MESA BUFET');
              if (!mainMenu.items.some(i => i.name === buffetName)) {
                  virtualItems.push({
                      ...base,
                      id: `${base.id}_virtual_buffet`,
                      name: buffetName
                  });
              }
          }
      });
      mainMenu.items = [...mainMenu.items, ...virtualItems];
  }

  const allDishes = menus.flatMap(m => m.items);
  const result = menus.map(m => recalculateMenu(m, catalog, allDishes));
  cachedMenus = result;
  return result;
}

export async function getMenuById(id: string): Promise<FullMenu | null> {
  const allMenus = await getMenus();
  const menu = allMenus.find(m => m.id === id);
  return menu || null;
}

async function readMenusFile(): Promise<FullMenu[]> {
  return await readData<FullMenu[]>(MENUS_CATERING_COLLECTION_JSON, []);
}

async function writeMenusFile(data: FullMenu[]): Promise<void> {
  const cleanData = data.map(menu => ({
      ...menu,
      items: menu.items.filter(item => !item.id.endsWith('_virtual_buffet'))
  }));
  await writeData(MENUS_CATERING_COLLECTION_JSON, cleanData);
  invalidateMenusCache();
}

export async function saveMenu(
  menuDataInput: Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'> | FullMenu
): Promise<{ success: boolean; id?: string; error?: string; menu?: FullMenu }> {
  invalidateMenusCache();
  const [menus, catalog] = await Promise.all([readMenusFile(), getInsumos()]);
  let menuId: string;

  const cleanItems = (menuDataInput.items || []).filter(item => !item.id.endsWith('_virtual_buffet'));
  const sanitizedMenuInput = { ...menuDataInput, items: cleanItems } as FullMenu;

  const allDishes = menus.flatMap(m => m.items);
  const menuToSave = recalculateMenu(sanitizedMenuInput, catalog, allDishes);

  if ('id' in menuToSave && menuToSave.id) {
    menuId = menuToSave.id;
    const index = menus.findIndex(m => m.id === menuId);
    if (index === -1) return { success: false, error: `Menú con ID ${menuId} no encontrado.` };
    menus[index] = { ...menuToSave, updatedAt: new Date().toISOString() } as FullMenu;
  } else {
    menuId = `menu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newMenu: FullMenu = {
      ...(menuToSave as Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'>),
      id: menuId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    menus.push(newMenu);
  }
  await writeMenusFile(menus);
  invalidateMenusCache();
  return { success: true, id: menuId, menu: menus.find(m => m.id === menuId) };
}

export async function deleteMenu(id: string): Promise<{ success: boolean; error?: string }> {
  invalidateMenusCache();
  let menus = await readMenusFile();
  const initialLength = menus.length;
  menus = menus.filter(menu => menu.id !== id);
  if (menus.length === initialLength) return { success: false, error: `Menú con ID ${id} no encontrado para eliminar.` };
  await writeMenusFile(menus);
  invalidateMenusCache();
  return { success: true };
}

export async function duplicateMenu(id: string): Promise<{ success: boolean; error?: string; menu?: FullMenu }> {
    invalidateMenusCache();
    const menuToDuplicate = await getMenuById(id);
    if (!menuToDuplicate) return { success: false, error: 'Menú a duplicar no encontrado.' };
    const newMenu: Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'> = {
        ...menuToDuplicate,
        name: `[COPIA] ${menuToDuplicate.name}`,
    };
    return saveMenu(newMenu);
}

export async function adjustAllDishMargins(percentage: number): Promise<{ success: boolean; error?: string }> {
  try {
    invalidateMenusCache();
    const menus = await getMenus();
    for (const menu of menus) {
        menu.items = menu.items.map(item => {
            const newProfitMargin = (item.profitMargin ?? 100) + percentage;
            const newSuggestedSellingPrice = Math.round((item.totalDishCost || 0) * (1 + newProfitMargin / 100));
            return { ...item, profitMargin: newProfitMargin, suggestedSellingPrice: newSuggestedSellingPrice };
        });
        await saveMenu(menu);
    }
    invalidateMenusCache();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Ocurrió un error al intentar ajustar los márgenes." };
  }
}
