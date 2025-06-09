
'use server';

import type { FiestaEnPlanificacion, ConfigEventoDataStorage, PersonalAsignadoDetalleStorage, Reunion, SalonLayoutData, Tarea, DecoracionData, ColorPalette } from '@/types/fiesta';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const fiestaActualFilePath = path.join(dataDirectory, 'fiesta-actual.json');

const defaultConfiguracion: ConfigEventoDataStorage = {
  nombreEvento: 'Boda Noelia Damaceno',
  tipoCelebracion: 'Boda',
  fechaEvento: new Date(2025, 5, 6).toISOString(), 
  horaInicio: '',
  horaFin: '',
  nombreLugar: 'Bonsai',
  direccionLugar: '',
  invitadosEstimados: 80,
  presupuestoEstimado: 156000,
  notasAdicionales: '',
};

const defaultTareas: Tarea[] = [
  { id: 'task_default_1', texto: 'Gestionar Vajilla y Mantelería', completada: false },
  { id: 'task_default_2', texto: 'Coordinar Mobiliario', completada: false },
  { id: 'task_default_3', texto: 'Contratar Mozos (4) y Mozos de cocina (4)', completada: false },
  { id: 'task_default_4', texto: 'Contratar Fotografía de fiesta y exteriores', completada: false },
  { id: 'task_default_5', texto: 'Contratar Plataforma 360 y Fotocabina', completada: false },
  { id: 'task_default_6', texto: 'Organizar Mesa de postres y Torta principal', completada: false },
  { id: 'task_default_7', texto: 'Contratar Barra de tragos', completada: false },
  { id: 'task_default_8', texto: 'Definir Decoración Básica', completada: false },
  { id: 'task_default_9', texto: 'Definir Discoteca Básica', completada: false },
  { id: 'task_default_10', texto: 'Crear Invitación digital', completada: false },
  { id: 'task_default_11', texto: 'Organizar Coffee Break', completada: false },
  { id: 'task_default_12', texto: 'Asegurar Hielo', completada: false },
];

const defaultColorPalette: ColorPalette = {
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  accent: '#FFFFFF',
};

const defaultNotasDecoracion = "Detalles pendientes de definir: colores de la fiesta, cubre mantel, decoración de torta, centros de mesa, zona de regalos, cuadro de firmas, gigantografía, alfombra roja, globos, telas, paneles shimmer, flores, tipo de mesas de torta, mobiliario, arreglos florales, números y letras.";

const defaultDecoracion: DecoracionData = {
  tema: 'Boda Noelia Damaceno', // Default from Excel in decoracion/page.tsx
  paletaColores: { ...defaultColorPalette },
  moodboardImageUrl: '',
  notas: defaultNotasDecoracion,
};

const initialFiestaActualData: FiestaEnPlanificacion = {
  id: 'fiesta-en-curso', 
  configuracion: { ...defaultConfiguracion },
  personalAsignado: [],
  menuAsignadoId: undefined,
  presupuestoId: undefined,
  invoiceIds: [],
  reuniones: [],
  salonLayout: {
    backgroundImageUrl: '',
    elements: [],
    generalNotes: '',
  },
  tareas: [...defaultTareas.map(t => ({...t}))],
  decoracion: { ...defaultDecoracion },
};

async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para fiesta actual:', error);
  }
}

async function readFiestaActualFile(): Promise<FiestaEnPlanificacion> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(fiestaActualFilePath, 'utf-8');
    let data = JSON.parse(fileContent) as FiestaEnPlanificacion;
    
    const validatedData: FiestaEnPlanificacion = {
        ...initialFiestaActualData, 
        ...data, 
        configuracion: {
            ...initialFiestaActualData.configuracion,
            ...(data.configuracion || {}),
        },
        personalAsignado: data.personalAsignado || [],
        menuAsignadoId: data.menuAsignadoId || undefined,
        presupuestoId: data.presupuestoId || undefined,
        invoiceIds: data.invoiceIds || [],
        reuniones: data.reuniones || [],
        salonLayout: { 
            ...(initialFiestaActualData.salonLayout || { elements: [], backgroundImageUrl: '', generalNotes: '' }),
            ...(data.salonLayout || {}), 
             elements: (data.salonLayout?.elements || []), 
        },
        tareas: (data.tareas && data.tareas.length > 0) ? data.tareas : [...defaultTareas.map(t => ({...t}))],
        decoracion: {
            ...initialFiestaActualData.decoracion, // Start with full default decoracion
            ...(data.decoracion || {}), // Spread saved decoracion, potentially overriding defaults
            paletaColores: { // Ensure paletaColores always exists and merges correctly
              ...(initialFiestaActualData.decoracion?.paletaColores || defaultColorPalette),
              ...(data.decoracion?.paletaColores || {}),
            }
        },
    };
    return validatedData;

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await writeFiestaActualFile(initialFiestaActualData);
      return { ...initialFiestaActualData };
    }
    console.error('Error leyendo el archivo de fiesta actual, usando datos iniciales:', error);
    try {
        await writeFiestaActualFile(initialFiestaActualData);
    } catch (writeError) {
        console.error('Error escribiendo datos iniciales de fiesta actual después de un error de lectura:', writeError);
    }
    return { ...initialFiestaActualData };
  }
}

async function writeFiestaActualFile(data: FiestaEnPlanificacion): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(fiestaActualFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de fiesta actual:', error);
  }
}

export async function getFiestaActual(): Promise<FiestaEnPlanificacion> {
  const fiesta = await readFiestaActualFile();
  return JSON.parse(JSON.stringify(fiesta)); 
}

export async function updateConfiguracionFiestaActual(
  configData: ConfigEventoDataStorage
): Promise<{ success: boolean; updatedData?: ConfigEventoDataStorage; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.configuracion = { ...configData };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.configuracion)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la configuración." };
  }
}

export async function updatePersonalFiestaActual(
  personalData: PersonalAsignadoDetalleStorage[]
): Promise<{ success: boolean; updatedData?: PersonalAsignadoDetalleStorage[]; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.personalAsignado = [...personalData];
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.personalAsignado)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el personal." };
  }
}

export async function updateMenuAsignadoFiestaActual(
  menuId?: string
): Promise<{ success: boolean; menuId?: string; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.menuAsignadoId = menuId;
    await writeFiestaActualFile(fiestaActual);
    return { success: true, menuId: menuId };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el menú asignado." };
  }
}

export async function updatePresupuestoAsignadoFiestaActual(
  presupuestoId?: string | null
): Promise<{ success: boolean; presupuestoId?: string | null; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.presupuestoId = presupuestoId === null ? undefined : presupuestoId;
    await writeFiestaActualFile(fiestaActual);
    return { success: true, presupuestoId: fiestaActual.presupuestoId };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el presupuesto asignado." };
  }
}

export async function addInvoiceIdToFiestaActual(
  invoiceId: string
): Promise<{ success: boolean; invoiceIds?: string[]; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    if (!fiestaActual.invoiceIds) {
      fiestaActual.invoiceIds = [];
    }
    if (!fiestaActual.invoiceIds.includes(invoiceId)) {
      fiestaActual.invoiceIds.push(invoiceId);
      await writeFiestaActualFile(fiestaActual);
    }
    return { success: true, invoiceIds: fiestaActual.invoiceIds };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al añadir ID de factura." };
  }
}

export async function removeInvoiceIdFromFiestaActual(
  invoiceId: string
): Promise<{ success: boolean; invoiceIds?: string[]; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    if (fiestaActual.invoiceIds) {
      fiestaActual.invoiceIds = fiestaActual.invoiceIds.filter(id => id !== invoiceId);
      await writeFiestaActualFile(fiestaActual);
    }
    return { success: true, invoiceIds: fiestaActual.invoiceIds || [] };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al quitar ID de factura." };
  }
}

export async function addReunionToFiestaActual(
  reunionData: Omit<Reunion, 'id'>
): Promise<{ success: boolean; reunion?: Reunion; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    const newReunion: Reunion = {
      ...reunionData,
      id: `reunion_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    if (!fiestaActual.reuniones) {
      fiestaActual.reuniones = [];
    }
    fiestaActual.reuniones.push(newReunion);
    await writeFiestaActualFile(fiestaActual);
    return { success: true, reunion: JSON.parse(JSON.stringify(newReunion)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al añadir la reunión." };
  }
}

export async function updateReunionInFiestaActual(
  reunionData: Reunion
): Promise<{ success: boolean; reunion?: Reunion; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    if (!fiestaActual.reuniones) {
      fiestaActual.reuniones = [];
    }
    const index = fiestaActual.reuniones.findIndex(r => r.id === reunionData.id);
    if (index !== -1) {
      fiestaActual.reuniones[index] = { ...reunionData };
      await writeFiestaActualFile(fiestaActual);
      return { success: true, reunion: JSON.parse(JSON.stringify(fiestaActual.reuniones[index])) };
    } else {
      return { success: false, error: `Reunión con ID ${reunionData.id} no encontrada para actualizar.` };
    }
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la reunión." };
  }
}

export async function deleteReunionFromFiestaActual(
  reunionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    if (fiestaActual.reuniones) {
      const initialLength = fiestaActual.reuniones.length;
      fiestaActual.reuniones = fiestaActual.reuniones.filter(r => r.id !== reunionId);
      if (fiestaActual.reuniones.length < initialLength) {
        await writeFiestaActualFile(fiestaActual);
        return { success: true };
      } else {
        return { success: false, error: `Reunión con ID ${reunionId} no encontrada para eliminar.` };
      }
    }
    return { success: false, error: 'No hay reuniones para eliminar.' };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al eliminar la reunión." };
  }
}

export async function updateSalonLayoutFiestaActual(
  layoutData: SalonLayoutData
): Promise<{ success: boolean; updatedData?: SalonLayoutData; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.salonLayout = { ...layoutData };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.salonLayout)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el diseño del salón." };
  }
}

export async function updateTareasFiestaActual(
  nuevasTareas: Tarea[]
): Promise<{ success: boolean; updatedData?: Tarea[]; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.tareas = [...nuevasTareas];
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.tareas)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar las tareas." };
  }
}

export async function updateDecoracionFiestaActual(
  decoracionData: DecoracionData
): Promise<{ success: boolean; updatedData?: DecoracionData; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.decoracion = { ...decoracionData };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.decoracion)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la decoración." };
  }
}


export async function resetFiestaActual(): Promise<{ success: boolean; initialData?: FiestaEnPlanificacion, error?: string }> {
    try {
        const resetData = { 
          ...initialFiestaActualData,
          tareas: [...defaultTareas.map(t => ({...t}))], 
          decoracion: { ...defaultDecoracion } 
        };
        await writeFiestaActualFile(resetData);
        return { success: true, initialData: JSON.parse(JSON.stringify(resetData)) };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al reiniciar la fiesta." };
    }
}

async function initializeFiestaData() {
    await ensureDataDirectoryExists();
    try {
        await fs.access(fiestaActualFilePath);
        const currentData = await readFiestaActualFile();
        let needsUpdate = false;
        if (!currentData.tareas || currentData.tareas.length === 0) {
            currentData.tareas = [...defaultTareas.map(t => ({...t}))];
            needsUpdate = true;
        }
        if (!currentData.decoracion || !currentData.decoracion.paletaColores || !currentData.decoracion.notas) { 
            currentData.decoracion = { 
                ...defaultDecoracion, 
                ...(currentData.decoracion || {}),
                paletaColores: {
                    ...defaultColorPalette,
                    ...(currentData.decoracion?.paletaColores || {})
                },
                notas: currentData.decoracion?.notas || defaultNotasDecoracion //Ensure notes has default if missing
            };
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            await writeFiestaActualFile(currentData);
        }

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo fiesta-actual.json no encontrado, creando con datos iniciales...');
            await writeFiestaActualFile(initialFiestaActualData);
        }
    }
}

initializeFiestaData();
