
'use server';

import type { FiestaEnPlanificacion, ConfigEventoDataStorage, PersonalAsignadoDetalleStorage, Reunion, SalonLayoutData, LayoutElement, Tarea, DecoracionData, ColorPalette, DecorationItem } from '@/types/fiesta';
import type { Invitado, NuevoInvitadoData } from '@/types/invitado'; // Importar tipos de invitado
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
  clienteId: undefined, 
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

const defaultDecoracion: DecoracionData = {
  tema: 'Boda Noelia Damaceno', 
  paletaColores: { ...defaultColorPalette },
  moodboardImageUrl: '',
  items: [], 
  generalNotes: "Detalles pendientes de definir: colores de la fiesta, cubre mantel, decoración de torta, centros de mesa, zona de regalos, cuadro de firmas, gigantografía, alfombra roja, globos, telas, paneles shimmer, flores, tipo de mesas de torta, mobiliario, arreglos florales, números y letras.",
};

const defaultSalonLayout: SalonLayoutData = {
    backgroundImageUrl: '',
    elements: [],
    generalNotes: '',
};


const initialFiestaActualData: FiestaEnPlanificacion = {
  id: 'fiesta-en-curso', 
  configuracion: { ...defaultConfiguracion },
  personalAsignado: [],
  menuAsignadoId: undefined,
  presupuestoId: undefined,
  invoiceIds: [],
  reuniones: [],
  salonLayout: { ...defaultSalonLayout, elements: [] },
  tareas: [...defaultTareas.map(t => ({...t}))],
  decoracion: { 
    ...defaultDecoracion, 
    items: [], 
    paletaColores: { ...defaultColorPalette } 
  },
  invitados: [], // Inicializar lista de invitados
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
            clienteId: data.configuracion?.clienteId || undefined,
        },
        personalAsignado: data.personalAsignado || [],
        menuAsignadoId: data.menuAsignadoId || undefined,
        presupuestoId: data.presupuestoId || undefined,
        invoiceIds: data.invoiceIds || [],
        reuniones: data.reuniones || [],
        salonLayout: { 
            ...(initialFiestaActualData.salonLayout || defaultSalonLayout),
            ...(data.salonLayout || {}), 
             elements: (data.salonLayout?.elements || []).map(el => ({
                id: el.id || `elem_${Date.now()}_${Math.random().toString(36).substring(2,9)}`, 
                name: el.name || 'Elemento sin nombre',
                quantity: el.quantity === undefined ? 1 : el.quantity,
                notes: el.notes || undefined,
                imageUrl: el.imageUrl || undefined,
                x: el.x ?? 0,
                y: el.y ?? 0,
                width: el.width ?? 50,
                height: el.height ?? 50,
                rotation: el.rotation ?? 0,
                type: el.type ?? 'custom',
                category: el.category || 'Otro',
             })),
             backgroundImageUrl: data.salonLayout?.backgroundImageUrl || '',
             generalNotes: data.salonLayout?.generalNotes || '',
        },
        tareas: (data.tareas && data.tareas.length > 0) ? data.tareas : [...defaultTareas.map(t => ({...t}))],
        decoracion: {
            ...(initialFiestaActualData.decoracion || defaultDecoracion),
            ...(data.decoracion || {}),
            paletaColores: {
              ...(initialFiestaActualData.decoracion?.paletaColores || defaultColorPalette),
              ...(data.decoracion?.paletaColores || {}),
            },
            items: (data.decoracion?.items || []).map(item => ({
                id: item.id || `decItem_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
                name: item.name || 'Ítem sin nombre',
                category: item.category || 'Otro',
                quantity: item.quantity === undefined ? 1 : (Number(item.quantity) || 1),
                estimatedCost: item.estimatedCost === undefined ? undefined : (Number(item.estimatedCost) || 0),
                supplier: item.supplier || undefined,
                notes: item.notes || undefined,
                imageUrl: item.imageUrl || undefined,
            })),
            generalNotes: data.decoracion?.generalNotes === undefined ? defaultDecoracion.generalNotes : data.decoracion.generalNotes,
            tema: data.decoracion?.tema === undefined ? defaultDecoracion.tema : data.decoracion.tema,
            moodboardImageUrl: data.decoracion?.moodboardImageUrl === undefined ? defaultDecoracion.moodboardImageUrl : data.decoracion.moodboardImageUrl,
        },
        invitados: (data.invitados || []).map(inv => ({ // Validar invitados
          id: inv.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
          nombre: inv.nombre || 'Invitado sin nombre',
          contacto: inv.contacto || undefined,
          rsvp: inv.rsvp || 'Pendiente',
          partySize: inv.partySize === undefined ? 1 : (Number(inv.partySize) || 1),
          tableNumber: inv.tableNumber || undefined,
          notes: inv.notes || undefined,
        })),
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
    fiestaActual.configuracion = { ...fiestaActual.configuracion, ...configData };
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
    const validatedElements = (layoutData.elements || []).map(el => ({
      id: el.id || `elem_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
      name: el.name || 'Elemento sin nombre',
      quantity: el.quantity === undefined ? 1 : el.quantity,
      notes: el.notes || undefined,
      imageUrl: el.imageUrl || undefined,
      x: el.x ?? 0,
      y: el.y ?? 0,
      width: el.width ?? 50,
      height: el.height ?? 50,
      rotation: el.rotation ?? 0,
      type: el.type ?? 'custom',
      category: el.category || 'Otro',
    }));
    fiestaActual.salonLayout = { 
        ...layoutData, 
        elements: validatedElements,
        backgroundImageUrl: layoutData.backgroundImageUrl || '',
        generalNotes: layoutData.generalNotes || ''
    };
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
    fiestaActual.decoracion = { 
        ...defaultDecoracion, 
        ...decoracionData, 
        items: (decoracionData.items || []).map(item => ({ 
            id: item.id || `decItem_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
            name: item.name || 'Ítem sin nombre',
            category: item.category || 'Otro',
            quantity: item.quantity === undefined ? 1 : (Number(item.quantity) || 1),
            estimatedCost: item.estimatedCost === undefined ? undefined : (Number(item.estimatedCost) || 0),
            supplier: item.supplier || undefined,
            notes: item.notes || undefined,
            imageUrl: item.imageUrl || undefined,
        })),
        paletaColores: {
            ...defaultColorPalette,
            ...(decoracionData.paletaColores || {})
        },
        generalNotes: decoracionData.generalNotes === undefined ? defaultDecoracion.generalNotes : decoracionData.generalNotes,
        tema: decoracionData.tema === undefined ? defaultDecoracion.tema : decoracionData.tema,
        moodboardImageUrl: decoracionData.moodboardImageUrl === undefined ? defaultDecoracion.moodboardImageUrl : decoracionData.moodboardImageUrl,
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.decoracion)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la decoración." };
  }
}

// Funciones para CRUD de Invitados
export async function getInvitadosFiestaActual(): Promise<Invitado[]> {
  const fiesta = await readFiestaActualFile();
  return JSON.parse(JSON.stringify(fiesta.invitados || []));
}

export async function addInvitadoFiestaActual(
  invitadoData: NuevoInvitadoData
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    const nuevoInvitado: Invitado = {
      ...invitadoData,
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      partySize: invitadoData.partySize === undefined ? 1 : Number(invitadoData.partySize) || 1,
    };
    if (!fiestaActual.invitados) {
      fiestaActual.invitados = [];
    }
    fiestaActual.invitados.push(nuevoInvitado);
    await writeFiestaActualFile(fiestaActual);
    return { success: true, invitado: JSON.parse(JSON.stringify(nuevoInvitado)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al añadir el invitado." };
  }
}

export async function updateInvitadoFiestaActual(
  invitadoData: Invitado
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    if (!fiestaActual.invitados) {
      fiestaActual.invitados = [];
    }
    const index = fiestaActual.invitados.findIndex(inv => inv.id === invitadoData.id);
    if (index !== -1) {
      fiestaActual.invitados[index] = { 
        ...invitadoData, 
        partySize: invitadoData.partySize === undefined ? 1 : Number(invitadoData.partySize) || 1,
      };
      await writeFiestaActualFile(fiestaActual);
      return { success: true, invitado: JSON.parse(JSON.stringify(fiestaActual.invitados[index])) };
    } else {
      return { success: false, error: `Invitado con ID ${invitadoData.id} no encontrado para actualizar.` };
    }
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el invitado." };
  }
}

export async function deleteInvitadoFiestaActual(
  invitadoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    if (fiestaActual.invitados) {
      const initialLength = fiestaActual.invitados.length;
      fiestaActual.invitados = fiestaActual.invitados.filter(inv => inv.id !== invitadoId);
      if (fiestaActual.invitados.length < initialLength) {
        await writeFiestaActualFile(fiestaActual);
        return { success: true };
      } else {
        return { success: false, error: `Invitado con ID ${invitadoId} no encontrado para eliminar.` };
      }
    }
    return { success: false, error: 'No hay invitados para eliminar.' };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al eliminar el invitado." };
  }
}

export async function resetFiestaActual(): Promise<{ success: boolean; initialData?: FiestaEnPlanificacion, error?: string }> {
    try {
        const resetData = { 
          ...initialFiestaActualData,
          configuracion: { ...defaultConfiguracion, clienteId: undefined },
          tareas: [...defaultTareas.map(t => ({...t}))], 
          decoracion: { ...defaultDecoracion, items: [], paletaColores: {...defaultColorPalette} },
          salonLayout: { ...defaultSalonLayout, elements: [] },
          invitados: [], // Resetear invitados
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

        if (!currentData.configuracion) {
            currentData.configuracion = { ...defaultConfiguracion };
            needsUpdate = true;
        } else if (currentData.configuracion.clienteId === undefined) { 
            currentData.configuracion.clienteId = undefined; 
        }

        if (!currentData.tareas || currentData.tareas.length === 0) {
            currentData.tareas = [...defaultTareas.map(t => ({...t}))];
            needsUpdate = true;
        }
        
        if (!currentData.decoracion) {
            currentData.decoracion = { ...defaultDecoracion, items: [], paletaColores: {...defaultColorPalette} };
            needsUpdate = true;
        } else {
            currentData.decoracion.paletaColores = {
                ...defaultColorPalette,
                ...(currentData.decoracion.paletaColores || {})
            };
            currentData.decoracion.items = (currentData.decoracion.items || []).map(item => ({
                id: item.id || `decItem_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
                name: item.name || 'Ítem sin nombre',
                category: item.category || 'Otro',
                quantity: item.quantity === undefined ? 1 : (Number(item.quantity) || 1),
                estimatedCost: item.estimatedCost === undefined ? undefined : (Number(item.estimatedCost) || 0),
                supplier: item.supplier || undefined,
                notes: item.notes || undefined,
                imageUrl: item.imageUrl || undefined,
            }));
            if (currentData.decoracion.generalNotes === undefined) {
                 currentData.decoracion.generalNotes = defaultDecoracion.generalNotes;
                 needsUpdate = true;
            }
            if (currentData.decoracion.tema === undefined) {
                currentData.decoracion.tema = defaultDecoracion.tema;
                needsUpdate = true;
            }
            if (currentData.decoracion.moodboardImageUrl === undefined) {
                currentData.decoracion.moodboardImageUrl = defaultDecoracion.moodboardImageUrl;
                 needsUpdate = true;
            }
        }
        
        if(!currentData.salonLayout){
            currentData.salonLayout = { ...defaultSalonLayout, elements: [] };
            needsUpdate = true;
        } else {
            currentData.salonLayout.elements = (currentData.salonLayout.elements || []).map(el => ({
                id: el.id || `elem_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
                name: el.name || 'Elemento sin nombre',
                quantity: el.quantity === undefined ? 1 : el.quantity,
                notes: el.notes || undefined,
                imageUrl: el.imageUrl || undefined,
                x: el.x ?? 0,
                y: el.y ?? 0,
                width: el.width ?? 50,
                height: el.height ?? 50,
                rotation: el.rotation ?? 0,
                type: el.type ?? 'custom',
                category: el.category || 'Otro',
            }));
            currentData.salonLayout.backgroundImageUrl = currentData.salonLayout.backgroundImageUrl || '';
            currentData.salonLayout.generalNotes = currentData.salonLayout.generalNotes || '';
        }

        if (!currentData.invitados) { // Asegurar que exista el array de invitados
            currentData.invitados = [];
            needsUpdate = true;
        } else { // Validar invitados existentes
            currentData.invitados = currentData.invitados.map(inv => ({
              id: inv.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
              nombre: inv.nombre || 'Invitado sin nombre',
              contacto: inv.contacto || undefined,
              rsvp: inv.rsvp || 'Pendiente',
              partySize: inv.partySize === undefined ? 1 : (Number(inv.partySize) || 1),
              tableNumber: inv.tableNumber || undefined,
              notes: inv.notes || undefined,
            }));
        }
        
        if (needsUpdate) {
            await writeFiestaActualFile(currentData);
        }

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo fiesta-actual.json no encontrado, creando con datos iniciales...');
            await writeFiestaActualFile(initialFiestaActualData);
        } else {
            console.error("Error during fiesta data initialization:", error);
        }
    }
}

initializeFiestaData();
