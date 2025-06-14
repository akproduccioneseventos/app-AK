
'use server';

// import { dbAdmin as db } from '@/lib/firebase/server'; // Firebase disabled
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
    return JSON.parse(fileContent) as ServicioEmpresa[];
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
    console.error('Error writing servicios JSON file:', error);
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
      JSON.parse(fileContent);
    }
  } catch (error) {
    await writeServiciosFile([]);
  }
}
initializeLocalServiciosFile();

export async function getServiciosEmpresa(): Promise<ServicioEmpresa[]> {
  // console.log("Firebase is disabled. Reading servicios de empresa from JSON.");
  return readServiciosFile();
}

export async function getServicioEmpresaById(id: string): Promise<ServicioEmpresa | null> {
  // console.log(`Firebase is disabled. Reading servicio ${id} from JSON.`);
  const servicios = await readServiciosFile();
  return servicios.find(s => s.id === id) || null;
}

export async function saveServicioEmpresa(
  servicioData: Omit<ServicioEmpresa, 'id'> | ServicioEmpresa
): Promise<{ success: boolean; id?: string; servicio?: ServicioEmpresa; error?: string }> {
  // console.log("Firebase is disabled. Saving servicio to JSON.");
  let servicios = await readServiciosFile();
  let finalServicioData: Partial<ServicioEmpresa>;
  let servicioId: string;

  const dataWithParsedNumbers: Partial<ServicioEmpresa> = {
    ...servicioData,
    precioVenta: servicioData.precioVenta !== undefined ? Number(servicioData.precioVenta) : undefined,
    costoReal: servicioData.costoReal !== undefined ? Number(servicioData.costoReal) : undefined,
  };
  if (dataWithParsedNumbers.precioVenta === undefined || isNaN(dataWithParsedNumbers.precioVenta)) {
      delete dataWithParsedNumbers.precioVenta;
  }
  if (dataWithParsedNumbers.costoReal === undefined || isNaN(dataWithParsedNumbers.costoReal)) {
      delete dataWithParsedNumbers.costoReal;
  }
  // @ts-ignore // Ensure 'descripcion' is not part of the payload if it exists from old types
  delete dataWithParsedNumbers.descripcion;


  if (!dataWithParsedNumbers.nombre || dataWithParsedNumbers.nombre.trim() === "") {
    return { success: false, error: "El nombre del servicio es obligatorio." };
  }
  if (!dataWithParsedNumbers.categoria) {
    return { success: false, error: "La categoría del servicio es obligatoria." };
  }

  if ('id' in dataWithParsedNumbers && dataWithParsedNumbers.id) {
    // Update
    servicioId = dataWithParsedNumbers.id;
    const index = servicios.findIndex(s => s.id === servicioId);
    if (index === -1) {
      return { success: false, error: `Servicio con ID ${servicioId} no encontrado.` };
    }
    servicios[index] = { ...servicios[index], ...dataWithParsedNumbers } as ServicioEmpresa;
    finalServicioData = servicios[index];
  } else {
    // Create - Check for duplicates
    const existingService = servicios.find(
      s => s.nombre.trim().toLowerCase() === dataWithParsedNumbers.nombre!.trim().toLowerCase() &&
           s.categoria === dataWithParsedNumbers.categoria
    );
    if (existingService) {
      return { success: false, error: `Ya existe un servicio con el nombre "${dataWithParsedNumbers.nombre!.trim()}" en la categoría "${dataWithParsedNumbers.categoria}".` };
    }
    servicioId = `serv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalServicioData = {
      ...(dataWithParsedNumbers as Omit<ServicioEmpresa, 'id'>),
      id: servicioId,
    };
    servicios.push(finalServicioData as ServicioEmpresa);
  }
  await writeServiciosFile(servicios);
  return { success: true, id: servicioId, servicio: finalServicioData as ServicioEmpresa };
}

export async function deleteServicioEmpresa(id: string): Promise<{ success: boolean; error?: string }> {
  // console.log(`Firebase is disabled. Deleting servicio ${id} from JSON.`);
  let servicios = await readServiciosFile();
  const initialLength = servicios.length;
  servicios = servicios.filter(s => s.id !== id);
  if (servicios.length === initialLength) {
    return { success: false, error: `Servicio con ID ${id} no encontrado para eliminar.` };
  }
  await writeServiciosFile(servicios);
  return { success: true };
}
