
'use server';

import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import { getServiciosEmpresa } from './servicios-empresa';
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

async function initializeLocalMenusFile() {
  const menus = await readMenusFile();
  let needsResave = menus.some(menu => 
      menu.items.some(item => 
        item.ingredients.some(ing => 
          typeof ing.cost === 'string' || 
          !('proveedor' in ing) || 
          !('marca' in ing) ||
          !('fecha_actualizacion' in ing) ||
          !('quantityPerPerson' in ing) ||
          !('origenId' in ing)
        ) ||
        (item as any).hasOwnProperty('basePortions') ||
        (item as any).hasOwnProperty('costPerPortion')
      )
    );

    if (needsResave) {
      console.log("Migrating menus-catering.json...");
      const correctedMenus = menus.map(menu => ({
        ...menu,
        items: menu.items.map(item => {
          const { basePortions, costPerPortion, ...restOfItem } = item as any; // Remove old fields
          return {
            ...restOfItem,
            ingredients: item.ingredients.map(ingredient => ({
              ...ingredient,
              quantityPerPerson: ingredient.quantityPerPerson || '0',
              cost: Number(ingredient.cost) || 0,
              proveedor: ingredient.proveedor || undefined,
              marca: ingredient.marca || undefined,
              fecha_actualizacion: ingredient.fecha_actualizacion || undefined,
              origenId: ingredient.origenId || undefined,
            })),
            totalDishCost: Number(item.totalDishCost) || 0,
          };
        })
      }));
      await writeMenusFile(correctedMenus);
      console.log("Migration complete for menus-catering.json.");
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

async function processMenuForSave(menuData: Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'> | FullMenu): Promise<FullMenu> {
  const catalogoInsumos = await getServiciosEmpresa();

  const processedItems = menuData.items.map(item => {
    const ingredients = item.ingredients.map(ing => {
      // If linked to catalog, sync price, name, and unit
      if (ing.origenId) {
        const catalogItem = catalogoInsumos.find(ci => ci.id === ing.origenId);
        if (catalogItem) {
          ing.cost = catalogItem.valorUnitarioEstimado || 0;
          ing.name = catalogItem.nombre;
          ing.unit = catalogItem.unidad || ing.unit;
        }
      }
      return {
        ...ing,
        name: ing.name.trim(),
        quantityPerPerson: ing.quantityPerPerson?.toString().trim() || '0', // Ensure it's a string
        unit: ing.unit.trim(),
        cost: Number(ing.cost) || 0,
        proveedor: ing.proveedor?.trim() || undefined,
        marca: ing.marca?.trim() || undefined,
        fecha_actualizacion: ing.fecha_actualizacion?.trim() ? new Date(ing.fecha_actualizacion.trim()).toISOString() : undefined,
      };
    });
    // totalDishCost is now cost per person for the dish
    const totalDishCost = calculateDishCostPerPerson(ingredients);
    const profitMargin = item.profitMargin === undefined ? 100 : item.profitMargin;
    
    return {
      ...item,
      name: item.name.trim(),
      ingredients,
      totalDishCost, // This is now the cost per person for the dish
      allergens: item.allergens?.trim() || undefined,
      notes: item.notes?.trim() || undefined,
      profitMargin: Number(profitMargin),
      suggestedSellingPrice: totalDishCost * (1 + Number(profitMargin) / 100),
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
