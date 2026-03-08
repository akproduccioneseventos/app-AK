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
          proveedor: ingredient.proveedor || undefined,
          marca: ingredient.marca || undefined,
          fecha_actualizacion: ingredient.fecha_actualizacion || undefined,
          origenId: ingredient.origenId || undefined,
        })),
        totalDishCost: Number(item.totalDishCost) || 0,
      }))
    }));
  } catch (error) {
    console.error("Error reading menus file, returning empty array:", error);
    return [];
  }
}

async function writeMenusFile(data: FullMenu[]): Promise<void> {
  await ensureDataFileExists(menusFilePath, '[]');
  try {
    const sortedData = data.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return (a.name || '').localeCompare(b.name || '');
    });
    await fs.writeFile(menusFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing menus JSON file:', error);
  }
}

function calculateIngredientCost(ing: Partial<Ingredient>): number {
    const quantity = parseFloat(ing.quantityPerPerson || '0');
    const unitCost = Number(ing.costoUnitario) || 0;
    const unit = (ing.unit || '').toLowerCase().trim();
    if (isNaN(quantity) || isNaN(unitCost)) return 0;
    
    // Gramos, ml, cc -> divide by 1000 to get kg/lt cost
    if (['g', 'ml', 'gramos', 'cc'].includes(unit)) {
      return (quantity / 1000) * unitCost;
    }
    
    // If quantity is high (e.g. > 1) and unit is Kg/Litros, it's likely meant to be g/ml based on user data
    if (['litros', 'kg', 'kilos', 'kilo', 'litro'].includes(unit) && quantity > 1) {
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
  const catalogoInsumos = await getInsumos();

  const processedItems = menuData.items.map(item => {
    const ingredients = item.ingredients.map(ing => {
      if (ing.origenId) {
        const catalogItem = catalogoInsumos.find(ci => ci.id === ing.origenId);
        if (catalogItem) {
          ing.costoUnitario = catalogItem.valorUnitarioEstimado || 0;
          ing.name = catalogItem.nombre;
          ing.unit = catalogItem.unidad || ing.unit;
        }
      }
      return {
        ...ing,
        name: ing.name.trim(),
        quantityPerPerson: ing.quantityPerPerson?.toString().trim() || '0',
        unit: (ing.unit || '').trim(),
        costoUnitario: Number(ing.costoUnitario) || 0,
        costoTotalReceta: calculateIngredientCost(ing),
        proveedor: ing.proveedor?.trim() || undefined,
        marca: ing.marca?.trim() || undefined,
        fecha_actualizacion: ing.fecha_actualizacion?.trim() ? new Date(ing.fecha_actualizacion.trim()).toISOString() : undefined,
      };
    });
    
    const totalDishCost = calculateDishCostPerPerson(ingredients);
    
    let finalProfitMargin: number;
    let finalSuggestedSellingPrice: number;

    if (item.suggestedSellingPrice !== undefined && !isNaN(Number(item.suggestedSellingPrice))) {
        finalSuggestedSellingPrice = Math.round(Number(item.suggestedSellingPrice));
        if (totalDishCost > 0) {
            finalProfitMargin = Math.round(((finalSuggestedSellingPrice / totalDishCost) - 1) * 100);
        } else {
            finalProfitMargin = item.profitMargin === undefined ? 100 : Number(item.profitMargin);
        }
    } else {
        finalProfitMargin = item.profitMargin === undefined ? 100 : Number(item.profitMargin);
        finalSuggestedSellingPrice = Math.round(totalDishCost * (1 + finalProfitMargin / 100));
    }

    return {
      ...item,
      name: item.name.trim(),
      ingredients,
      totalDishCost,
      profitMargin: finalProfitMargin,
      suggestedSellingPrice: finalSuggestedSellingPrice,
    };
  });
  
  return {
    ...menuData,
    name: menuData.name.trim(),
    description: (menuData.description || '').trim(),
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
  if (isNaN(percentage)) {
    return { success: false, error: "El porcentaje debe ser un número." };
  }
  
  try {
    const menus = await readMenusFile();
    if (menus.length === 0) {
      return { success: false, error: "No hay menús para ajustar." };
    }

    const updatedMenus = menus.map(menu => {
      const updatedItems = menu.items.map(item => {
        const newProfitMargin = (item.profitMargin ?? 100) + percentage;
        const newSuggestedSellingPrice = Math.round((item.totalDishCost || 0) * (1 + newProfitMargin / 100));

        return {
          ...item,
          profitMargin: newProfitMargin,
          suggestedSellingPrice: newSuggestedSellingPrice
        };
      });
      return { ...menu, items: updatedItems };
    });

    await writeMenusFile(updatedMenus);

    return { success: true };
  } catch (error: any) {
    console.error("Error adjusting dish margins:", error);
    return { success: false, error: "Ocurrió un error al intentar ajustar los márgenes." };
  }
}