
'use server';

import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';
import fs from 'fs/promises';
import path from 'path';

const MENUS_CATERING_COLLECTION_JSON = 'menus-catering.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const menusFilePath = path.join(dataDirectory, MENUS_CATERING_COLLECTION_JSON);

async function ensureDataDirectoryExists() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

async function readMenusFile(): Promise<FullMenu[]> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(menusFilePath);
    const fileContent = await fs.readFile(menusFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    const menus = JSON.parse(fileContent) as FullMenu[];
    // Ensure costs are numbers and new ingredient fields are present
    return menus.map(menu => ({
      ...menu,
      items: menu.items.map(item => ({
        ...item,
        ingredients: item.ingredients.map(ingredient => ({
          ...ingredient,
          cost: Number(ingredient.cost) || 0,
          proveedor: ingredient.proveedor || undefined,
          marca: ingredient.marca || undefined,
          fecha_actualizacion: ingredient.fecha_actualizacion || undefined,
        })),
        totalDishCost: Number(item.totalDishCost) || 0,
        basePortions: item.basePortions ? Number(item.basePortions) : undefined,
        costPerPortion: item.costPerPortion ? Number(item.costPerPortion) : undefined,
      }))
    }));
  } catch (error) {
    return [];
  }
}

async function writeMenusFile(data: FullMenu[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
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

async function initializeLocalMenusFile() {
  try {
    await ensureDataDirectoryExists();
    await fs.access(menusFilePath);
    const fileContent = await fs.readFile(menusFilePath, 'utf-8');
    if (fileContent.trim() === '') {
      await writeMenusFile([]);
    } else {
      const menus = JSON.parse(fileContent) as FullMenu[];
      let needsResave = menus.some(menu => 
        menu.items.some(item => 
          item.ingredients.some(ing => 
            typeof ing.cost === 'string' || 
            !('proveedor' in ing) // Check if new fields are missing for potential migration
          )
        )
      );
      if (needsResave) {
        const correctedMenus = menus.map(menu => ({
          ...menu,
          items: menu.items.map(item => ({
            ...item,
            ingredients: item.ingredients.map(ingredient => ({
              ...ingredient,
              cost: Number(ingredient.cost) || 0,
              proveedor: ingredient.proveedor || undefined,
              marca: ingredient.marca || undefined,
              fecha_actualizacion: ingredient.fecha_actualizacion || undefined,
            })),
            totalDishCost: Number(item.totalDishCost) || 0,
            basePortions: item.basePortions ? Number(item.basePortions) : undefined,
            costPerPortion: item.costPerPortion ? Number(item.costPerPortion) : undefined,
          }))
        }));
        await writeMenusFile(correctedMenus);
      }
    }
  } catch (error) {
    await writeMenusFile([]);
  }
}
initializeLocalMenusFile();

export async function getMenus(): Promise<FullMenu[]> {
  return readMenusFile();
}

export async function getMenuById(id: string): Promise<FullMenu | null> {
  const menus = await readMenusFile();
  return menus.find(menu => menu.id === id) || null;
}

function processMenuForSave(menuData: Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'> | FullMenu): FullMenu {
  const processedItems = menuData.items.map(item => {
    const ingredients = item.ingredients.map(ing => ({
      ...ing,
      cost: Number(ing.cost) || 0,
      proveedor: ing.proveedor?.trim() || undefined,
      marca: ing.marca?.trim() || undefined,
      fecha_actualizacion: ing.fecha_actualizacion?.trim() || undefined,
    }));
    const totalDishCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);
    const basePortions = item.basePortions ? Number(item.basePortions) : undefined;
    const costPerPortion = (basePortions && basePortions > 0 && totalDishCost > 0)
                           ? totalDishCost / basePortions
                           : undefined;
    return {
      ...item,
      ingredients,
      totalDishCost,
      basePortions,
      costPerPortion,
      allergens: item.allergens || undefined,
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

  const processedInput = processMenuForSave(menuDataInput);

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

