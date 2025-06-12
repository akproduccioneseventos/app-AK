
'use server';

import type { ServicioEmpresa } from '@/types/empresa';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const serviciosFilePath = path.join(dataDirectory, 'servicios-empresa.json');

// Datos iniciales ahora vacíos para que el usuario los agregue manualmente.
const initialServicios: ServicioEmpresa[] = [];

async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para servicios de empresa:', error);
  }
}

async function writeServiciosFile(data: ServicioEmpresa[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(serviciosFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de servicios:', error);
    throw new Error('Error al escribir los datos de servicios.'); 
  }
}

async function readServiciosFile(): Promise<ServicioEmpresa[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(serviciosFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    if (!Array.isArray(data)) {
      console.error('El archivo servicios-empresa.json no contiene un array. Intentando crear con datos iniciales (vacíos).');
      await writeServiciosFile(initialServicios);
      return [...initialServicios];
    }
    return data;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('Archivo servicios-empresa.json no encontrado, intentando crear con datos iniciales (vacíos)...');
      try {
        await writeServiciosFile(initialServicios);
        return [...initialServicios];
      } catch (writeErr) {
        console.error('Error crítico: No se pudo escribir el archivo inicial de servicios:', writeErr);
        throw new Error(`No se pudo crear el archivo de servicios: ${(writeErr as Error).message}`);
      }
    }
    console.error('Error crítico leyendo o parseando el archivo de servicios:', error);
    throw new Error(`Error al leer o parsear el archivo de servicios: ${error.message}`);
  }
}


export async function getServiciosEmpresa(): Promise<ServicioEmpresa[]> {
  const servicios = await readServiciosFile();
  return servicios.sort((a, b) => (a.categoria || '').localeCompare(b.categoria || '') || a.nombre.localeCompare(b.nombre));
}

export async function getServicioEmpresaById(id: string): Promise<ServicioEmpresa | null> {
  const servicios = await readServiciosFile();
  const servicio = servicios.find(s => s.id === id);
  return servicio ? { ...servicio } : null;
}

export async function saveServicioEmpresa(
  servicioData: Omit<ServicioEmpresa, 'id'> | ServicioEmpresa
): Promise<{ success: boolean; id?: string; servicio?: ServicioEmpresa; error?: string }> {
  let servicios = await readServiciosFile();
  
  try {
    if ('id' in servicioData && servicioData.id) {
      // Update existing servicio
      const index = servicios.findIndex(s => s.id === servicioData.id);
      if (index !== -1) {
        servicios[index] = { 
          ...servicios[index], 
          ...servicioData,
          precioEstimado: servicioData.precioEstimado !== undefined ? Number(servicioData.precioEstimado) || undefined : undefined,
        };
        await writeServiciosFile(servicios);
        return { success: true, id: servicioData.id, servicio: { ...servicios[index] } };
      } else {
        return { success: false, error: `Servicio con ID ${servicioData.id} no encontrado para actualizar.` };
      }
    } else {
      // Create new servicio
      const newServicio: ServicioEmpresa = {
        ...(servicioData as Omit<ServicioEmpresa, 'id'>), 
        id: `serv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        precioEstimado: servicioData.precioEstimado !== undefined ? Number(servicioData.precioEstimado) || undefined : undefined,
      };
      servicios.push(newServicio);
      await writeServiciosFile(servicios);
      return { success: true, id: newServicio.id, servicio: { ...newServicio } };
    }
  } catch (e: any) {
    return { success: false, error: e.message || "Ocurrió un error al guardar el servicio." };
  }
}

export async function deleteServicioEmpresa(id: string): Promise<{ success: boolean; error?: string }> {
  let servicios = await readServiciosFile();
  const initialLength = servicios.length;
  servicios = servicios.filter(s => s.id !== id);
  
  if (servicios.length < initialLength) {
    try {
      await writeServiciosFile(servicios);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Ocurrió un error al eliminar el servicio (escritura)." };
    }
  } else {
    return { success: false, error: `Servicio con ID ${id} no encontrado para eliminar.` };
  }
}

async function initializeServiciosData() {
    await ensureDataDirectoryExists();
    try {
        await fs.access(serviciosFilePath);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo servicios-empresa.json no encontrado, creando con datos iniciales (vacíos)...');
            try {
                await writeServiciosFile(initialServicios);
            } catch (initWriteError) {
                console.error("Error al crear el archivo de servicios inicial:", initWriteError);
            }
        }
    }
}

initializeServiciosData();
