'use server';

import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import { getInsumos } from './insumos';
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
        await fs.writeFile(filePath, defaultContent, 'utf-8');
    }
}

async function readMenusFile(): Promise<FullMenu[]> {
  await ensureDataFileExists(menusFilePath, '[]');
  try {
    const fileContent = await fs.readFile(menusFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    const menus = JSON.parse(fileContent) as FullMenu[];
    return menus.map(menu => ({
      ...menu,
      items: menu.items.map(item => ({
        ...item,
        ingredients: item.ingredients.map(ingredient => ({
          ...ingredient,
          quantityPerPerson: ingredient.quantityPerPerson || '0',
          costoUnitario: Number(ingredient.costoUnitario) || 0,
          costoTotalReceta: Number(ingredient.costoTotalReceta) || 0,
        })),
        totalDishCost: Number(item.totalDishCost) || 0,
      }))
    }));
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

function calculateIngredientCost(ing: Partial<Ingredient>): number {
    const quantity = parseFloat(ing.quantityPerPerson || '0');
    const unitCost = Number(ing.costoUnitario) || 0;
    const unit = (ing.unit || '').toLowerCase().trim();
    if (isNaN(quantity) || isNaN(unitCost)) return 0;
    
    // Gramos, ml, cc, gramos (variantes) -> divide by 1000 to get kg/lt cost
    if (['g', 'ml', 'gramos', 'cc'].includes(unit)) {
      return (quantity / 1000) * unitCost;
    }
    
    // Si la cantidad es mayor a 1 y la unidad es Kg/Litro pero parece que son gramos
    if (['kg', 'kilos', 'kilo', 'litro', 'litros'].includes(unit) && quantity > 1) {
        return (quantity / 1000) * unitCost;
    }

    return quantity * unitCost;
}

function calculateDishCostPerPerson(ingredients: Ingredient[]): number {
  return ingredients.reduce((sum, ing) => sum + calculateIngredientCost(ing), 0);
}

export async function getMenus(): Promise<FullMenu[]> {
  const menus = await readMenusFile();
  return menus.map(menu => ({
    ...menu,
    items: menu.items.map(item => {
      const ingredientsWithCost = (item.ingredients || []).map(ingredient => ({
          ...ingredient,
          costoTotalReceta: calculateIngredientCost(ingredient),
      }));
      const totalDishCost = calculateDishCostPerPerson(ingredientsWithCost);
      const profitMargin = item.profitMargin === undefined || isNaN(Number(item.profitMargin)) ? 100 : Number(item.profitMargin);
      
      const suggestedSellingPrice = item.suggestedSellingPrice !== undefined && !isNaN(Number(item.suggestedSellingPrice))
          ? Math.round(item.suggestedSellingPrice)
          : Math.round(totalDishCost * (1 + profitMargin / 100));

      return {
        ...item,
        ingredients: ingredientsWithCost,
        totalDishCost: totalDishCost,
        profitMargin: profitMargin,
        suggestedSellingPrice: suggestedSellingPrice,
      };
    })
  }));
}

export async function getMenuById(id: string): Promise<FullMenu | null> {
  const menus = await getMenus();
  return menus.find(menu => menu.id === id) || null;
}

async function processMenuForSave(menuData: Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'> | FullMenu): Promise<FullMenu> {
  const processedItems = menuData.items.map(item => {
    const ingredients = item.ingredients.map(ing => ({
        ...ing,
        costoTotalReceta: calculateIngredientCost(ing),
    }));
    
    const totalDishCost = calculateDishCostPerPerson(ingredients);
    const profitMargin = item.profitMargin === undefined ? 100 : Number(item.profitMargin);
    const suggestedSellingPrice = item.suggestedSellingPrice !== undefined 
        ? Math.round(Number(item.suggestedSellingPrice)) 
        : Math.round(totalDishCost * (1 + profitMargin / 100));

    return {
      ...item,
      ingredients,
      totalDishCost,
      profitMargin,
      suggestedSellingPrice,
    };
  });
  
  return {
    ...menuData,
    items: processedItems,
  } as FullMenu;
}

export async function saveMenu(
  menuDataInput: Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'> | FullMenu
): Promise<{ success: boolean; id?: string; error?: string; menu?: FullMenu }> {
  let menus = await readMenusFile();
  let finalMenuData: FullMenu;
  let menuId: string;

  const processedInput = await processMenuForSave(menuDataInput);

  if ('id' in processedInput && processedInput.id) {
    menuId = processedInput.id;
    const index = menus.findIndex(m => m.id === menuId);
    if (index === -1) {
      return { success: false, error: `Menú con ID ${menuId} no encontrado.` };
    }
    menus[index] = { 
        ...menus[index], 
        ...processedInput, 
        updatedAt: new Date().toISOString() 
    };
    finalMenuData = menus[index];
  } else {
    menuId = `menu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalMenuData = {
      ...(processedInput as Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'>),
      id: menuId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    menus.push(finalMenuData);
  }
  await writeMenusFile(menus);
  return { success: true, id: menuId, menu: finalMenuData };
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
    const menus = await readMenusFile();
    const menuToDuplicate = menus.find(menu => menu.id === id);

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
    const menus = await readMenusFile();
    const updatedMenus = menus.map(menu => {
      const updatedItems = menu.items.map(item => {
        const newProfitMargin = (item.profitMargin ?? 100) + percentage;
        const newSuggestedSellingPrice = Math.round((item.totalDishCost || 0) * (1 + newProfitMargin / 100));
        return { ...item, profitMargin: newProfitMargin, suggestedSellingPrice: newSuggestedSellingPrice };
      });
      return { ...menu, items: updatedItems };
    });
    await writeMenusFile(updatedMenus);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Ocurrió un error al intentar ajustar los márgenes." };
  }
}
