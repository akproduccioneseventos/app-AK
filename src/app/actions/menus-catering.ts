'use server';

import type { FullMenu, MenuItem, Ingredient } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import fs from 'fs/promises';
import path from 'path';

const MENUS_CATERING_COLLECTION_JSON = 'menus-catering.json';
const INSUMOS_COLLECTION_JSON = 'insumos.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const menusFilePath = path.join(dataDirectory, MENUS_CATERING_COLLECTION_JSON);
const insumosFilePath = path.join(dataDirectory, INSUMOS_COLLECTION_JSON);

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

/**
 * Convierte strings con comas o puntos a números de forma segura.
 * Maneja el error de interpretación de puntos decimales como miles.
 */
const parseSafeNumber = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    let str = String(val).trim();
    if (!str) return 0;
    
    // Si contiene coma, es formato uruguayo (ej: 2.044,2 o 38,15)
    if (str.includes(',')) {
        // Quitamos puntos de miles y cambiamos coma por punto
        str = str.replace(/\./g, '').replace(',', '.');
    } else {
        // Si no tiene coma pero tiene punto, verificamos si es decimal o miles
        // Si hay más de un punto o el punto está seguido de exactamente 3 dígitos al final de un número largo
        // pero aquí priorizamos tratar el punto único como decimal para evitar el error de $5.301
        const parts = str.split('.');
        if (parts.length === 2 && parts[1].length !== 3) {
            // Es un decimal seguro (ej: 53.01)
        } else if (parts.length > 2) {
            // Tiene múltiples puntos, es miles (ej: 1.000.000)
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

    // REGLA DE AUDITORÍA:
    // Gramos, ml, cc y "No definido" (Gas) dividen por 1000 si el catálogo es Kg/Lt
    const isSmallRecipeUnit = ['g', 'gramos', 'ml', 'cc', 'cc.', 'no definido'].includes(recipeUnit);
    const isSmallCatalogUnit = ['g', 'gramos', 'ml', 'cc', 'cc.'].includes(catalogUnit);

    let factor = 1;
    if (isSmallRecipeUnit && !isSmallCatalogUnit) {
        factor = 1000;
    }
    
    return (quantity / factor) * unitCost;
}

async function readInsumosFile(): Promise<ServicioEmpresa[]> {
    await ensureDataFileExists(insumosFilePath, '[]');
    try {
        const fileContent = await fs.readFile(insumosFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch { return []; }
}

function recalculateMenu(menu: FullMenu, catalogItems: ServicioEmpresa[], allDishes: MenuItem[]): FullMenu {
    return {
        ...menu,
        items: (menu.items || []).map(item => {
            let finalIngredients = [...(item.ingredients || [])];

            // FUSIÓN DINÁMICA: Si es una versión "CON MESA BUFET", inyectamos ingredientes de la mesa fría
            if (item.name.toUpperCase().includes('MESA BUFET') || item.name.toUpperCase().includes('MESA BUFFET')) {
                const mesaBuffetBase = allDishes.find(d => 
                    (d.name === 'MESA BUFET' || d.name === 'Mesa Buffet') && d.id !== item.id
                );
                
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
  const [menus, catalog] = await Promise.all([readMenusFile(), readInsumosFile()]);
  
  // INYECCIÓN VIRTUAL: Creamos las variantes "CON MESA BUFET" para los platos de carne
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
  return menus.map(m => recalculateMenu(m, catalog, allDishes));
}

export async function getMenuById(id: string): Promise<FullMenu | null> {
  const allMenus = await getMenus(); // Usamos getMenus para incluir las versiones virtuales
  const menu = allMenus.find(m => m.id === id);
  return menu || null;
}

async function readMenusFile(): Promise<FullMenu[]> {
  await ensureDataFileExists(menusFilePath, '[]');
  try {
    const fileContent = await fs.readFile(menusFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as FullMenu[];
  } catch { return []; }
}

async function writeMenusFile(data: FullMenu[]): Promise<void> {
  await ensureDataFileExists(menusFilePath, '[]');
  // Al guardar, filtramos los items virtuales para no ensuciar el JSON
  const cleanData = data.map(menu => ({
      ...menu,
      items: menu.items.filter(item => !item.id.endsWith('_virtual_buffet'))
  }));
  await fs.writeFile(menusFilePath, JSON.stringify(cleanData, null, 2), 'utf-8');
}

export async function saveMenu(
  menuDataInput: Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'> | FullMenu
): Promise<{ success: boolean; id?: string; error?: string; menu?: FullMenu }> {
  const [menus, catalog] = await Promise.all([readMenusFile(), readInsumosFile()]);
  let menuId: string;

  const allDishes = menus.flatMap(m => m.items);
  const menuToSave = recalculateMenu(menuDataInput as FullMenu, catalog, allDishes);

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
  return { success: true, id: menuId, menu: menus.find(m => m.id === menuId) };
}

export async function deleteMenu(id: string): Promise<{ success: boolean; error?: string }> {
  let menus = await readMenusFile();
  const initialLength = menus.length;
  menus = menus.filter(menu => menu.id !== id);
  if (menus.length === initialLength) return { success: false, error: `Menú con ID ${id} no encontrado para eliminar.` };
  await writeMenusFile(menus);
  return { success: true };
}

export async function duplicateMenu(id: string): Promise<{ success: boolean; error?: string; menu?: FullMenu }> {
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
