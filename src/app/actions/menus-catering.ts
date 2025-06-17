
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
    // If the file doesn't exist or is invalid, and we expect a default,
    // we should ideally write the default here.
    // For now, if reading fails, it will return an empty array,
    // which might be acceptable if the default content is already in the JSON file itself.
    console.error("Error reading menus file, returning empty array:", error);
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
    await fs.access(menusFilePath); // Check if the file exists
    const fileContent = await fs.readFile(menusFilePath, 'utf-8');
    
    if (fileContent.trim() === '') {
      // If the file is empty, it implies the default menu (if intended to be there)
      // was not correctly placed or was overwritten.
      // For this request, we assume `menus-catering.json` is pre-populated by the XML change.
      // If it were truly *empty*, we might write a default initial array like `await writeMenusFile([]);`
      // or the default AK menu if that was the design.
      // Given the request, the file should NOT be empty after the XML change.
      console.warn("menus-catering.json was found empty during initialization. This might indicate an issue if a default menu was expected.");
      // Consider: await writeMenusFile(AK_DEFAULT_MENU_ARRAY); if needed.
      // For now, if it's empty, it stays empty, and `readMenusFile` will return [].
      return;
    }

    // If file has content, parse and check for necessary migrations (like new fields)
    const menus = JSON.parse(fileContent) as FullMenu[];
    let needsResave = menus.some(menu => 
      menu.items.some(item => 
        item.ingredients.some(ing => 
          typeof ing.cost === 'string' || 
          !('proveedor' in ing) || // Check if new fields are missing
          !('marca' in ing) ||
          !('fecha_actualizacion' in ing)
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
      console.log("Migrated existing menus-catering.json to include new ingredient fields.");
    }
  } catch (error) {
    // This catch block is for errors like file not found or JSON parse error.
    // If the file doesn't exist, it implies the user is running for the first time OR
    // the default file wasn't created by the XML change.
    // The XML change *should* create/replace `menus-catering.json`.
    // If it fails, `readMenusFile` will handle it and return [].
    console.warn(`Warning during menus-catering.json initialization (file might not exist or is invalid, will be handled by readMenusFile):`, error);
    // No need to write an empty file here if the expectation is that the XML places the default.
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
      name: ing.name.trim(),
      quantity: ing.quantity.trim(),
      unit: ing.unit.trim(),
      cost: Number(ing.cost) || 0,
      proveedor: ing.proveedor?.trim() || undefined,
      marca: ing.marca?.trim() || undefined,
      fecha_actualizacion: ing.fecha_actualizacion?.trim() ? new Date(ing.fecha_actualizacion.trim()).toISOString() : undefined,
    }));
    const totalDishCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);
    const basePortions = item.basePortions ? Number(item.basePortions) : undefined;
    const costPerPortion = (basePortions && basePortions > 0 && totalDishCost > 0)
                           ? totalDishCost / basePortions
                           : undefined;
    return {
      ...item,
      name: item.name.trim(),
      ingredients,
      totalDishCost,
      basePortions,
      costPerPortion,
      allergens: item.allergens?.trim() || undefined,
      notes: item.notes?.trim() || undefined,
    };
  });

  return {
    ...menuData,
    name: menuData.name.trim(),
    description: menuData.description.trim(),
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
