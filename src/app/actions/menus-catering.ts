'use server';

import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';
import fs from 'fs/promises';
import path from 'path';

const MENUS_CATERING_COLLECTION_JSON = 'menus-catering.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const menusFilePath = path.join(dataDirectory, MENUS_CATERING_COLLECTION_JSON);

async function ensureDataFileExists(filePath: string, defaultContent: string = '[]') {
    try {
        await fs.access(dataDirectory);
    } catch {
        await fs.mkdir(dataDirectory, { recursive: true });
    }
    try {
        await fs.access(filePath);
    } catch {
        await fs.access(filePath).catch(() => fs.writeFile(filePath, defaultContent, 'utf-8'));
    }
}

/**
 * Función de parseo inteligente.
 * Si tiene coma, asume formato regional (1.234,56) y limpia puntos.
 * Si NO tiene coma, respeta el punto como decimal (formato JS estándar).
 */
const parseSafeNumber = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    
    let str = String(val).trim();
    if (!str) return 0;
    
    if (str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    }

    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calcula el costo de un ingrediente por persona (PASO 1).
 * REGLA: Unidades de peso/volumen o "No definido" dividen por 1000.
 */
function calculateIngredientCost(ing: Partial<Ingredient>): number {
    const quantity = parseSafeNumber(ing.quantityPerPerson);
    const unitCost = parseSafeNumber(ing.costoUnitario);
    const unit = (ing.unit || '').toLowerCase().trim();
    
    if (quantity === 0 || unitCost === 0) return 0;
    
    const countableUnits = ['un', 'unidad', 'unidades', 'uds', 'u', 'paquete', 'pack', 'set', 'docena', 'bolsa', 'caja', 'cajas'];
    
    if (countableUnits.includes(unit)) {
      return quantity * unitCost;
    }
    
    return (quantity / 1000) * unitCost;
}

/**
 * Recalcula todos los valores de costo de un menú desde cero.
 */
function recalculateMenu(menu: FullMenu): FullMenu {
    return {
        ...menu,
        items: (menu.items || []).map(item => {
            const ingredientsWithCost = (item.ingredients || []).map(ing => ({
                ...ing,
                costoTotalReceta: calculateIngredientCost(ing)
            }));

            const totalDishCost = ingredientsWithCost.reduce((sum, ing) => sum + ing.costoTotalReceta, 0);
            
            const profitMargin = item.profitMargin === undefined || isNaN(Number(item.profitMargin)) ? 100 : Number(item.profitMargin);
            
            let suggestedSellingPrice: number;
            if (item.suggestedSellingPrice !== undefined && Number(item.suggestedSellingPrice) > 0) {
                // Si el precio ya existe, recalculamos el margen basado en el costo real actual
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
  const menus = await readMenusFile();
  return menus.map(recalculateMenu);
}

export async function getMenuById(id: string): Promise<FullMenu | null> {
  const menus = await getMenus();
  const menu = menus.find(m => m.id === id);
  return menu ? recalculateMenu(menu) : null;
}

async function readMenusFile(): Promise<FullMenu[]> {
  await ensureDataFileExists(menusFilePath, '[]');
  try {
    const fileContent = await fs.readFile(menusFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as FullMenu[];
  } catch (error) {
    console.error("Error reading menus file:", error);
    return [];
  }
}

async function writeMenusFile(data: FullMenu[]): Promise<void> {
  await ensureDataFileExists(menusFilePath, '[]');
  try {
    await fs.writeFile(menusFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing menus JSON file:', error);
  }
}

export async function saveMenu(
  menuDataInput: Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'> | FullMenu
): Promise<{ success: boolean; id?: string; error?: string; menu?: FullMenu }> {
  let menus = await readMenusFile();
  let menuId: string;

  const menuToSave = recalculateMenu(menuDataInput as FullMenu);

  if ('id' in menuToSave && menuToSave.id) {
    menuId = menuToSave.id;
    const index = menus.findIndex(m => m.id === menuId);
    if (index === -1) {
      return { success: false, error: `Menú con ID ${menuId} no encontrado.` };
    }
    menus[index] = { 
        ...menuToSave, 
        updatedAt: new Date().toISOString() 
    } as FullMenu;
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
  return { success: true, id: menuId, menu: menus.find(m => m.id === menuId) };
}

export async function deleteMenu(id: string): Promise<{ success: boolean; error?: string }> {
  let menus = await readMenusFile();
  const initialLength = menus.length;
  menus = menus.filter(menu => menu.id !== id);
  if (menus.length === initialLength) {
    return { success: false, error: `Menú con ID ${id} no encontrado para eliminar.` };
  }
  await writeMenusFile(menus);
  return { success: true };
}

export async function duplicateMenu(id: string): Promise<{ success: boolean; error?: string; menu?: FullMenu }> {
    const menuToDuplicate = await getMenuById(id);
    if (!menuToDuplicate) {
        return { success: false, error: 'Menú a duplicar no encontrado.' };
    }
    const newMenu: Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'> = {
        ...menuToDuplicate,
        name: `[COPIA] ${menuToDuplicate.name}`,
    };
    return saveMenu(newMenu);
}

export async function adjustAllDishMargins(
  percentage: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const menus = await getMenus();
    for (const menu of menus) {
        menu.items = menu.items.map(item => {
            const newProfitMargin = (item.profitMargin ?? 100) + percentage;
            const newSuggestedSellingPrice = Math.round((item.totalDishCost || 0) * (1 + newProfitMargin / 100));
            return { ...item, profitMargin: newProfitMargin, suggestedSellingPrice: newSuggestedSellingPrice };
        });
        await saveMenu(menu);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Ocurrió un error al intentar ajustar los márgenes." };
  }
}