
'use server';

import type { Presupuesto, PlatoPresupuesto, ServicioAdicional } from '@/types/presupuesto';
import { getMenus } from './menus-catering'; 

import fs from 'fs/promises';
import path from 'path';

const PRESUPUESTOS_COLLECTION_JSON = 'presupuestos.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const presupuestosFilePath = path.join(dataDirectory, PRESUPUESTOS_COLLECTION_JSON);


async function ensureDataDirectoryExists() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

async function readPresupuestosFile(): Promise<Presupuesto[]> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(presupuestosFilePath);
    const fileContent = await fs.readFile(presupuestosFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as Presupuesto[];
  } catch (error) {
    return [];
  }
}

async function writePresupuestosFile(data: Presupuesto[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    const sortedData = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    await fs.writeFile(presupuestosFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing presupuestos JSON file:', error);
  }
}

async function initializeLocalPresupuestosFile() {
  try {
    await ensureDataDirectoryExists();
    await fs.access(presupuestosFilePath);
    const fileContent = await fs.readFile(presupuestosFilePath, 'utf-8');
    if (fileContent.trim() === '') {
      await writePresupuestosFile([]);
    } else {
      JSON.parse(fileContent);
    }
  } catch (error) {
    await writePresupuestosFile([]);
  }
}
initializeLocalPresupuestosFile();

function generateDataAiHint(name: string): string {
  const commonWords = ['de', 'con', 'y', 'a', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'para', 'por', 'sin', 'sobre', 'tras'];
  const cleanedName = name.toLowerCase()
    .replace(/\((tradicional|gourmet|opción invierno|estimado por persona|lata \d+ml|botella \d+ml|porrón \d+ml|vaso|jarra \d+l)\)/gi, '')
    .replace(/[^\w\s]/gi, '')
    .trim();
  
  const words = cleanedName.split(/\s+/).filter(word => word.length > 2 && !commonWords.includes(word));
  if (words.length === 0) return 'food item';
  if (words.length === 1) return words[0];
  return `${words[0]} ${words[1]}`;
}

export async function getPlatos(): Promise<PlatoPresupuesto[]> {
  try {
    const menus = await getMenus(); 
    const platosPresupuesto: PlatoPresupuesto[] = [];

    if (menus.length === 0) {
      return [];
    }

    menus.forEach(menu => {
      menu.items.forEach(item => {
        platosPresupuesto.push({
          id: item.id,
          nombre: item.name,
          descripcion: item.type || undefined,
          costoPorPersona: item.totalDishCost,
          imagenUrl: `https://placehold.co/300x200.png`,
          dataAiHint: generateDataAiHint(item.name),
          seleccionado: false,
        });
      });
    });
    return platosPresupuesto;
  } catch (error) {
    console.error('Error reading menus for getPlatos:', error);
    return [{ id: 'fallback_error_read_platos', nombre: 'Error al cargar platos', descripcion: 'Contactar soporte', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 0, dataAiHint: "error sign" }];
  }
}

export async function savePresupuesto(presupuestoData: Omit<Presupuesto, 'id' | 'timestamp' | 'estado' | 'invoiceId'>): Promise<{ success: boolean, id?: string, error?: string }> {
  let presupuestos = await readPresupuestosFile();
  const nuevoPresupuesto: Presupuesto = {
    ...presupuestoData,
    id: `pres_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    estado: 'Borrador', 
    invoiceId: undefined,
  };
  presupuestos.push(nuevoPresupuesto);
  await writePresupuestosFile(presupuestos);
  return { success: true, id: nuevoPresupuesto.id };
}

export async function getPresupuestos(): Promise<Presupuesto[]> {
  return readPresupuestosFile();
}

export async function getPresupuestoById(id: string): Promise<Presupuesto | null> {
  const presupuestos = await readPresupuestosFile();
  return presupuestos.find(p => p.id === id) || null;
}

export async function updatePresupuesto(presupuestoData: Presupuesto): Promise<{ success: boolean; presupuesto?: Presupuesto; error?: string }> {
  let presupuestos = await readPresupuestosFile();
  const index = presupuestos.findIndex(p => p.id === presupuestoData.id);
  if (index === -1) {
    return { success: false, error: `Presupuesto con ID ${presupuestoData.id} no encontrado.` };
  }

  const { id, ...dataToUpdate } = presupuestoData;
  
  // Recalculate totals if items are part of the update (though typically items are not edited this way after creation from the "editar" page)
  // For now, assume that if `platosSeleccionados` or `serviciosAdicionales` are present, they are the source of truth for totals
  let costoSubtotalPlatos = dataToUpdate.costoSubtotalPlatos;
  let costoSubtotalServicios = dataToUpdate.costoSubtotalServicios;
  let costoTotalEstimado = dataToUpdate.costoTotalEstimado;

  if(dataToUpdate.platosSeleccionados){
    costoSubtotalPlatos = dataToUpdate.platosSeleccionados.reduce((sum, plato) => sum + plato.costoTotalPlato, 0);
  }
  if(dataToUpdate.serviciosAdicionales){
     costoSubtotalServicios = dataToUpdate.serviciosAdicionales.reduce((sum, servicio) => sum + servicio.costoServicio, 0);
  }
  costoTotalEstimado = costoSubtotalPlatos + costoSubtotalServicios;


  const finalDataToUpdate = {
    ...dataToUpdate,
    costoSubtotalPlatos,
    costoSubtotalServicios,
    costoTotalEstimado,
    timestamp: new Date().toISOString(), // Always update timestamp on any modification
  };
  
  presupuestos[index] = { id, ...finalDataToUpdate };
  await writePresupuestosFile(presupuestos);
  return { success: true, presupuesto: presupuestos[index] };
}

export async function deletePresupuesto(id: string): Promise<{ success: boolean; error?: string }> {
  let presupuestos = await readPresupuestosFile();
  const initialLength = presupuestos.length;
  presupuestos = presupuestos.filter(p => p.id !== id);
  if (presupuestos.length === initialLength) {
    return { success: false, error: `Presupuesto con ID ${id} no encontrado para eliminar.` };
  }
  await writePresupuestosFile(presupuestos);
  return { success: true };
}

// Helper function that might be called by saveInvoice action
export async function markPresupuestoAsFacturado(presupuestoId: string, invoiceId: string): Promise<{ success: boolean; error?: string }> {
  let presupuestos = await readPresupuestosFile();
  const index = presupuestos.findIndex(p => p.id === presupuestoId);
  if (index === -1) {
    return { success: false, error: `Presupuesto con ID ${presupuestoId} no encontrado para marcar como facturado.` };
  }
  presupuestos[index].estado = 'Facturado';
  presupuestos[index].invoiceId = invoiceId;
  presupuestos[index].timestamp = new Date().toISOString(); // Update timestamp
  
  await writePresupuestosFile(presupuestos);
  return { success: true };
}

