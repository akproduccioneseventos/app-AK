
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
          quantityPerPerson: ingredient.quantityPerPerson || '0', // Ensure exists, default to '0' if migrating
          cost: Number(ingredient.cost) || 0,
          proveedor: ingredient.proveedor || undefined,
          marca: ingredient.marca || undefined,
          fecha_actualizacion: ingredient.fecha_actualizacion || undefined,
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
      console.warn("menus-catering.json was found empty during initialization.");
      return;
    }

    const menus = JSON.parse(fileContent) as FullMenu[];
    let needsResave = menus.some(menu => 
      menu.items.some(item => 
        item.ingredients.some(ing => 
          typeof ing.cost === 'string' || 
          !('proveedor' in ing) || 
          !('marca' in ing) ||
          !('fecha_actualizacion' in ing) ||
          !('quantityPerPerson' in ing) // Check for new quantityPerPerson field
        ) ||
        item.hasOwnProperty('basePortions') || // Check for old fields to remove
        item.hasOwnProperty('costPerPortion')
      )
    );

    if (needsResave) {
      const correctedMenus = menus.map(menu => ({
        ...menu,
        items: menu.items.map(item => {
          const { basePortions, costPerPortion, ...restOfItem } = item as any; // Remove old fields
          return {
            ...restOfItem,
            ingredients: item.ingredients.map(ingredient => ({
              ...ingredient,
              quantityPerPerson: ingredient.quantityPerPerson || '0', // Default for migration
              cost: Number(ingredient.cost) || 0,
              proveedor: ingredient.proveedor || undefined,
              marca: ingredient.marca || undefined,
              fecha_actualizacion: ingredient.fecha_actualizacion || undefined,
            })),
            totalDishCost: Number(item.totalDishCost) || 0, // Recalculate if needed, but for now keep stored
          };
        })
      }));
      await writeMenusFile(correctedMenus);
      console.log("Migrated existing menus-catering.json for per-person ingredient quantities and removed old fields.");
    }
  } catch (error) {
    console.warn(`Warning during menus-catering.json initialization:`, error);
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

// Helper to calculate totalDishCost for a MenuItem based on its ingredients
function calculateDishCostPerPerson(ingredients: Ingredient[]): number {
  return ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
}

function processMenuForSave(menuData: Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'> | FullMenu): FullMenu {
  const processedItems = menuData.items.map(item => {
    const ingredients = item.ingredients.map(ing => ({
      ...ing,
      name: ing.name.trim(),
      quantityPerPerson: ing.quantityPerPerson.trim() || '0', // Ensure it's a string
      unit: ing.unit.trim(),
      cost: Number(ing.cost) || 0,
      proveedor: ing.proveedor?.trim() || undefined,
      marca: ing.marca?.trim() || undefined,
      fecha_actualizacion: ing.fecha_actualizacion?.trim() ? new Date(ing.fecha_actualizacion.trim()).toISOString() : undefined,
    }));
    // totalDishCost is now cost per person for the dish
    const totalDishCost = calculateDishCostPerPerson(ingredients);
    
    return {
      ...item,
      name: item.name.trim(),
      ingredients,
      totalDishCost, // This is now the cost per person for the dish
      allergens: item.allergens?.trim() || undefined,
      notes: item.notes?.trim() || undefined,
      // basePortions and costPerPortion are no longer part of MenuItem
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

