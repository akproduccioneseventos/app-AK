
'use server';

import type { ServicioEmpresa } from '@/types/empresa';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const serviciosFilePath = path.join(dataDirectory, 'servicios-empresa.json');

const initialServicios: ServicioEmpresa[] = [
  { id: 'serv_audio_basico', nombre: 'Sonido Básico para Eventos', descripcion: 'Incluye parlantes, micrófono y consola pequeña.', categoria: 'Audiovisual', precioEstimado: 200, unidad: 'por evento' },
  { id: 'serv_ilum_deco', nombre: 'Iluminación Decorativa LED', descripcion: 'Tachos LED, guirnaldas, efectos básicos.', categoria: 'Iluminación', precioEstimado: 150, unidad: 'por evento' },
  { id: 'serv_dj_completo', nombre: 'Servicio de DJ Profesional', descripcion: 'Música, equipos y DJ por 5 horas.', categoria: 'Música', precioEstimado: 500, unidad: 'por evento' },
];

async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para servicios de empresa:', error);
  }
}

async function readServiciosFile(): Promise<ServicioEmpresa[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(serviciosFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : [...initialServicios];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await writeServiciosFile(initialServicios);
      return [...initialServicios];
    }
    console.error('Error leyendo el archivo de servicios, usando datos iniciales:', error);
    return [...initialServicios];
  }
}

async function writeServiciosFile(data: ServicioEmpresa[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(serviciosFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de servicios:', error);
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
      ...servicioData,
      id: `serv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      precioEstimado: servicioData.precioEstimado !== undefined ? Number(servicioData.precioEstimado) || undefined : undefined,
    };
    servicios.push(newServicio);
    await writeServiciosFile(servicios);
    return { success: true, id: newServicio.id, servicio: { ...newServicio } };
  }
}

export async function deleteServicioEmpresa(id: string): Promise<{ success: boolean; error?: string }> {
  let servicios = await readServiciosFile();
  const initialLength = servicios.length;
  servicios = servicios.filter(s => s.id !== id);
  
  if (servicios.length < initialLength) {
    await writeServiciosFile(servicios);
    return { success: true };
  } else {
    return { success: false, error: `Servicio con ID ${id} no encontrado para eliminar.` };
  }
}

// Ensure the servicios-empresa.json file exists with initial data if it's missing
async function initializeServiciosData() {
    await ensureDataDirectoryExists();
    try {
        await fs.access(serviciosFilePath);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo servicios-empresa.json no encontrado, creando con datos iniciales...');
            await writeServiciosFile(initialServicios);
        }
    }
}

initializeServiciosData();
