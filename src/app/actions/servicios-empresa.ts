
'use server';

import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';
import fs from 'fs/promises';
import path from 'path';

const SERVICIOS_EMPRESA_COLLECTION_JSON = 'servicios-empresa.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const serviciosFilePath = path.join(dataDirectory, SERVICIOS_EMPRESA_COLLECTION_JSON);

async function ensureDataDirectoryExists() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

async function readServiciosFile(): Promise<ServicioEmpresa[]> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(serviciosFilePath);
    const fileContent = await fs.readFile(serviciosFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    // Ensure new fields are present or defaulted for existing items
    return (JSON.parse(fileContent) as ServicioEmpresa[]).map(item => ({
      ...item,
      cantidadDisponible: item.cantidadDisponible === undefined ? undefined : Number(item.cantidadDisponible),
      valorUnitarioEstimado: item.valorUnitarioEstimado === undefined ? undefined : Number(item.valorUnitarioEstimado),
    }));
  } catch (error) {
    return [];
  }
}

async function writeServiciosFile(data: ServicioEmpresa[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    const sortedData = data.sort((a, b) => {
      const catComp = (a.categoria || '').localeCompare(b.categoria || '');
      if (catComp !== 0) return catComp;
      return (a.nombre || '').localeCompare(b.nombre || '');
    });
    await fs.writeFile(serviciosFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing servicios/inventory JSON file:', error);
  }
}

async function initializeLocalServiciosFile() {
  try {
    await ensureDataDirectoryExists();
    await fs.access(serviciosFilePath);
    const fileContent = await fs.readFile(serviciosFilePath, 'utf-8');
    if (fileContent.trim() === '') {
      await writeServiciosFile([]);
    } else {
      // Potentially add migration logic here if structure changes significantly over time
      JSON.parse(fileContent);
    }
  } catch (error) {
    await writeServiciosFile([]);
  }
}
initializeLocalServiciosFile();

export async function getServiciosEmpresa(): Promise<ServicioEmpresa[]> {
  return readServiciosFile();
}

export async function getServicioEmpresaById(id: string): Promise<ServicioEmpresa | null> {
  const servicios = await readServiciosFile();
  return servicios.find(s => s.id === id) || null;
}

export async function saveServicioEmpresa(
  itemData: Omit<ServicioEmpresa, 'id'> | ServicioEmpresa
): Promise<{ success: boolean; id?: string; servicio?: ServicioEmpresa; error?: string }> {
  let inventario = await readServiciosFile();
  let finalItemData: Partial<ServicioEmpresa>;
  let itemId: string;

  const dataWithParsedNumbers: Partial<ServicioEmpresa> = {
    ...itemData,
    valorUnitarioEstimado: itemData.valorUnitarioEstimado !== undefined ? Number(itemData.valorUnitarioEstimado) : undefined,
    cantidadDisponible: itemData.cantidadDisponible !== undefined ? Number(itemData.cantidadDisponible) : undefined,
    precioVenta: itemData.precioVenta !== undefined ? Number(itemData.precioVenta) : undefined,
  };

  if (dataWithParsedNumbers.valorUnitarioEstimado === undefined || isNaN(dataWithParsedNumbers.valorUnitarioEstimado)) {
      delete dataWithParsedNumbers.valorUnitarioEstimado;
  }
  if (dataWithParsedNumbers.cantidadDisponible === undefined || isNaN(dataWithParsedNumbers.cantidadDisponible)) {
      delete dataWithParsedNumbers.cantidadDisponible;
  }
   if (dataWithParsedNumbers.precioVenta === undefined || isNaN(dataWithParsedNumbers.precioVenta)) {
      delete dataWithParsedNumbers.precioVenta;
  }


  if (!dataWithParsedNumbers.nombre || dataWithParsedNumbers.nombre.trim() === "") {
    return { success: false, error: "El nombre del ítem/servicio es obligatorio." };
  }
  if (!dataWithParsedNumbers.categoria) {
    return { success: false, error: "La categoría es obligatoria." };
  }
  if (!dataWithParsedNumbers.unidad) {
    return { success: false, error: "La unidad es obligatoria." };
  }


  if ('id' in dataWithParsedNumbers && dataWithParsedNumbers.id) {
    // Update
    itemId = dataWithParsedNumbers.id;
    const index = inventario.findIndex(s => s.id === itemId);
    if (index === -1) {
      return { success: false, error: `Ítem con ID ${itemId} no encontrado.` };
    }
    inventario[index] = { ...inventario[index], ...dataWithParsedNumbers } as ServicioEmpresa;
    finalItemData = inventario[index];
  } else {
    // Create - Check for duplicates (simple check, can be more sophisticated)
    const existingItem = inventario.find(
      s => s.nombre.trim().toLowerCase() === dataWithParsedNumbers.nombre!.trim().toLowerCase() &&
           s.categoria === dataWithParsedNumbers.categoria
    );
    if (existingItem) {
      return { success: false, error: `Ya existe un ítem con el nombre "${dataWithParsedNumbers.nombre!.trim()}" en la categoría "${dataWithParsedNumbers.categoria}".` };
    }
    itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalItemData = {
      ...(dataWithParsedNumbers as Omit<ServicioEmpresa, 'id'>),
      id: itemId,
    };
    inventario.push(finalItemData as ServicioEmpresa);
  }
  await writeServiciosFile(inventario);
  return { success: true, id: itemId, servicio: finalItemData as ServicioEmpresa };
}

export async function deleteServicioEmpresa(id: string): Promise<{ success: boolean; error?: string }> {
  let inventario = await readServiciosFile();
  const initialLength = inventario.length;
  inventario = inventario.filter(s => s.id !== id);
  if (inventario.length === initialLength) {
    return { success: false, error: `Ítem con ID ${id} no encontrado para eliminar.` };
  }
  await writeServiciosFile(inventario);
  return { success: true };
}
