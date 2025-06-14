
'use server';

// import { dbAdmin as db } from '@/lib/firebase/server'; // Firebase disabled
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
    return JSON.parse(fileContent) as FullMenu[];
  } catch (error) {
    return [];
  }
}

async function writeMenusFile(data: FullMenu[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    // Sort by createdAt descending, or name if createdAt is missing
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
      JSON.parse(fileContent);
    }
  } catch (error) {
    await writeMenusFile([]);
  }
}
initializeLocalMenusFile();

export async function getMenus(): Promise<FullMenu[]> {
  // console.log("Firebase is disabled. Reading menus from JSON.");
  return readMenusFile();
}

export async function getMenuById(id: string): Promise<FullMenu | null> {
  // console.log(`Firebase is disabled. Reading menu ${id} from JSON.`);
  const menus = await readMenusFile();
  return menus.find(menu => menu.id === id) || null;
}

export async function saveMenu(
  menuData: Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'> | FullMenu
): Promise<{ success: boolean; id?: string; error?: string; menu?: FullMenu }> {
  // console.log("Firebase is disabled. Saving menu to JSON.");
  let menus = await readMenusFile();
  let finalMenuData: FullMenu;
  let menuId: string;

  if ('id' in menuData && menuData.id) {
    // Update
    menuId = menuData.id;
    const index = menus.findIndex(m => m.id === menuId);
    if (index === -1) {
      return { success: false, error: `Menú con ID ${menuId} no encontrado.` };
    }
    menus[index] = { 
        ...menus[index], 
        ...menuData,
        updatedAt: new Date().toISOString() 
    } as FullMenu;
    finalMenuData = menus[index];
  } else {
    // Create
    menuId = `menu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalMenuData = {
      ...(menuData as Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'>),
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
  // console.log(`Firebase is disabled. Deleting menu ${id} from JSON.`);
  let menus = await readMenusFile();
  const initialLength = menus.length;
  menus = menus.filter(menu => menu.id !== id);
  if (menus.length === initialLength) {
    return { success: false, error: `Menú con ID ${id} no encontrado para eliminar.` };
  }
  await writeMenusFile(menus);
  return { success: true };
}
