
'use server';

import type { FiestaEnPlanificacion, ConfigEventoDataStorage, PersonalAsignadoDetalleStorage, Reunion, SalonLayoutData, LayoutElement, Tarea, DecoracionData, ColorPalette, EventWebPageSettings, MusicaFiesta } from '@/types/fiesta';
import type { Invitado, NuevoInvitadoData, RsvpStatus } from '@/types/invitado';
import fs from 'fs/promises';
import path from 'path';
import { 
  initialFiestaActualData, 
  defaultConfiguracion,
  baseDefaultTareas as defaultTareas, // Renamed to avoid conflict with Tarea type
  defaultColorPalette,
  defaultDecoracion,
  defaultSalonLayout,
  defaultWebPageSettings,
  defaultMusicaFiesta
} from '@/lib/fiesta-defaults';


const FIESTA_ACTUAL_JSON_FILE = 'fiesta-actual.json';
const HISTORIAL_FIESTAS_JSON_FILE = 'historial-fiestas.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const fiestaActualFilePath = path.join(dataDirectory, FIESTA_ACTUAL_JSON_FILE);
const historialFiestasFilePath = path.join(dataDirectory, HISTORIAL_FIESTAS_JSON_FILE);


async function ensureDataDirectoryExists() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

async function readFiestaActualFile(): Promise<FiestaEnPlanificacion> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(fiestaActualFilePath);
    const fileContent = await fs.readFile(fiestaActualFilePath, 'utf-8');
    if (fileContent.trim() === '') throw new Error('Fiesta actual file is empty');
    return JSON.parse(fileContent) as FiestaEnPlanificacion;
  } catch (error) {
    // If file doesn't exist or is invalid, write and return initial data
    await writeFiestaActualFile(initialFiestaActualData);
    return initialFiestaActualData;
  }
}

async function writeFiestaActualFile(data: FiestaEnPlanificacion): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    await fs.writeFile(fiestaActualFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing fiesta-actual.json file:', error);
  }
}

async function readHistorialFile(): Promise<FiestaEnPlanificacion[]> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(historialFiestasFilePath);
    const fileContent = await fs.readFile(historialFiestasFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as FiestaEnPlanificacion[];
  } catch (error) {
    return [];
  }
}

async function writeHistorialFile(data: FiestaEnPlanificacion[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    const sortedData = data.sort((a, b) => 
        new Date(b.configuracion.fechaEvento || 0).getTime() - new Date(a.configuracion.fechaEvento || 0).getTime()
    );
    await fs.writeFile(historialFiestasFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing historial-fiestas.json file:', error);
  }
}

// Initialize files if they don't exist
async function initializeLocalFiestaFiles() {
  await readFiestaActualFile(); // This will create it if it doesn't exist
  await readHistorialFile();   // This will ensure it's at least an empty array if it doesn't exist
}
initializeLocalFiestaFiles();


export async function getFiestaActual(): Promise<FiestaEnPlanificacion> {
  const data = await readFiestaActualFile();
   // Deep merge with defaults to ensure all fields are present, similar to Firestore logic
   const validatedData: FiestaEnPlanificacion = {
    id: data.id || `fiesta_${Date.now()}`, // Ensure ID
    configuracion: {
        ...defaultConfiguracion,
        ...(data.configuracion || {}),
        clienteId: data.configuracion?.clienteId || undefined,
    },
    personalAsignado: data.personalAsignado || [],
    menuAsignadoId: data.menuAsignadoId || undefined,
    presupuestoId: data.presupuestoId || undefined,
    invoiceIds: data.invoiceIds || [],
    reuniones: (data.reuniones || []).map(r => ({
        id: r.id || `reunion_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
        titulo: r.titulo || 'Reunión sin título',
        fecha: r.fecha,
        notas: r.notas || ''
    })),
    salonLayout: {
        backgroundImageUrl: data.salonLayout?.backgroundImageUrl || defaultSalonLayout.backgroundImageUrl || '',
        elements: (data.salonLayout?.elements || []).map(el => ({
            id: el.id || `elem_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
            name: el.name || 'Elemento sin nombre',
            quantity: el.quantity === undefined ? 1 : (Number(el.quantity) || 1),
            notes: el.notes || undefined,
            imageUrl: el.imageUrl || undefined,
            x: el.x ?? 0,
            y: el.y ?? 0,
            width: el.width ?? 50,
            height: el.height ?? 50,
            rotation: el.rotation ?? 0,
            type: el.type ?? 'custom',
            category: el.category || 'Otro',
            dataAiHint: el.dataAiHint
        })),
        generalNotes: data.salonLayout?.generalNotes || defaultSalonLayout.generalNotes || '',
    },
    tareas: (data.tareas && data.tareas.length > 0 ? data.tareas : [...defaultTareas.map(t => ({...t, id: `task_${Date.now()}_${Math.random().toString(36).substring(2,9)}`}))]).map(t => ({
        id: t.id || `task_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
        texto: t.texto || 'Tarea sin descripción',
        completada: t.completada || false,
        fechaLimite: t.fechaLimite,
        asignadaA: t.asignadaA
    })),
    decoracion: {
        tema: data.decoracion?.tema || defaultDecoracion.tema || '',
        paletaColores: {
          ...defaultColorPalette,
          ...(data.decoracion?.paletaColores || {}),
        },
        moodboardImageUrl: data.decoracion?.moodboardImageUrl || defaultDecoracion.moodboardImageUrl || '',
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
        generalNotes: data.decoracion?.generalNotes === undefined ? defaultDecoracion.generalNotes : (data.decoracion.generalNotes || ''),
    },
    invitados: (data.invitados || []).map(inv => ({
      id: inv.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
      nombre: inv.nombre || 'Invitado sin nombre',
      contacto: inv.contacto || undefined,
      rsvp: inv.rsvp || 'Pendiente',
      partySize: inv.partySize === undefined ? 1 : (Number(inv.partySize) || 1),
      tableNumber: inv.tableNumber || undefined,
      notes: inv.notes || undefined,
    })),
    webPageSettings: {
      ...defaultWebPageSettings,
      ...(data.webPageSettings || {}),
      galleryImageUrls: data.webPageSettings?.galleryImageUrls || [],
    },
    musica: {
      ...defaultMusicaFiesta,
      ...(data.musica || {}),
    },
  };
  return JSON.parse(JSON.stringify(validatedData));
}

export async function updateConfiguracionFiestaActual(
  configData: Partial<ConfigEventoDataStorage>
): Promise<{ success: boolean; updatedData?: ConfigEventoDataStorage; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.configuracion = {
        ...fiestaActual.configuracion,
        ...configData,
        invitadosEstimados: configData.invitadosEstimados !== undefined ? Number(configData.invitadosEstimados) || 0 : fiestaActual.configuracion.invitadosEstimados,
        presupuestoEstimado: configData.presupuestoEstimado !== undefined ? Number(configData.presupuestoEstimado) || 0 : fiestaActual.configuracion.presupuestoEstimado,
    };
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
    let fiestaActual = await getFiestaActual();
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
    let fiestaActual = await getFiestaActual();
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
    let fiestaActual = await getFiestaActual();
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
    let fiestaActual = await getFiestaActual();
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
    let fiestaActual = await getFiestaActual();
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
    let fiestaActual = await getFiestaActual();
    const newReunion: Reunion = {
      id: `reunion_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      titulo: reunionData.titulo || 'Reunión sin título',
      fecha: reunionData.fecha,
      notas: reunionData.notas || '',
    };
    fiestaActual.reuniones = [...(fiestaActual.reuniones || []), newReunion];
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
    let fiestaActual = await getFiestaActual();
    fiestaActual.reuniones = (fiestaActual.reuniones || []).map(r =>
      r.id === reunionData.id ? { ...reunionData } : r
    );
    await writeFiestaActualFile(fiestaActual);
    const updatedReunion = fiestaActual.reuniones.find(r => r.id === reunionData.id);
    return { success: true, reunion: updatedReunion ? JSON.parse(JSON.stringify(updatedReunion)) : undefined };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la reunión." };
  }
}

export async function deleteReunionFromFiestaActual(
  reunionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    const initialLength = (fiestaActual.reuniones || []).length;
    fiestaActual.reuniones = (fiestaActual.reuniones || []).filter(r => r.id !== reunionId);
    if ((fiestaActual.reuniones || []).length < initialLength) {
      await writeFiestaActualFile(fiestaActual);
      return { success: true };
    } else {
      return { success: false, error: `Reunión con ID ${reunionId} no encontrada para eliminar.` };
    }
  } catch (e: any) {
    return { success: false, error: e.message || "Error al eliminar la reunión." };
  }
}

export async function updateSalonLayoutFiestaActual(
  layoutData: Partial<SalonLayoutData>
): Promise<{ success: boolean; updatedData?: SalonLayoutData; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.salonLayout = {
        backgroundImageUrl: layoutData.backgroundImageUrl || fiestaActual.salonLayout?.backgroundImageUrl || '',
        elements: (layoutData.elements || fiestaActual.salonLayout?.elements || []).map(el => ({
            id: el.id || `elem_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
            name: el.name || 'Elemento sin nombre',
            quantity: el.quantity === undefined ? 1 : (Number(el.quantity) || 1),
            notes: el.notes || undefined,
            imageUrl: el.imageUrl || undefined,
            x: el.x ?? 0,
            y: el.y ?? 0,
            width: el.width ?? 50,
            height: el.height ?? 50,
            rotation: el.rotation ?? 0,
            type: el.type ?? 'custom',
            category: el.category || 'Otro',
            dataAiHint: el.dataAiHint
        })),
        generalNotes: layoutData.generalNotes || fiestaActual.salonLayout?.generalNotes || ''
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
    let fiestaActual = await getFiestaActual();
    fiestaActual.tareas = nuevasTareas.map(t => ({
        id: t.id || `task_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
        texto: t.texto || 'Tarea sin descripción',
        completada: t.completada || false,
        fechaLimite: t.fechaLimite,
        asignadaA: t.asignadaA
    }));
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.tareas)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar las tareas." };
  }
}

export async function updateDecoracionFiestaActual(
  decoracionData: Partial<DecoracionData>
): Promise<{ success: boolean; updatedData?: DecoracionData; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.decoracion = {
        tema: decoracionData.tema || fiestaActual.decoracion?.tema || defaultDecoracion.tema,
        paletaColores: {
            ...defaultColorPalette,
            ...(fiestaActual.decoracion?.paletaColores || {}),
            ...(decoracionData.paletaColores || {})
        },
        moodboardImageUrl: decoracionData.moodboardImageUrl || fiestaActual.decoracion?.moodboardImageUrl || defaultDecoracion.moodboardImageUrl,
        items: (decoracionData.items || fiestaActual.decoracion?.items || []).map(item => ({
            id: item.id || `decItem_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
            name: item.name || 'Ítem sin nombre',
            category: item.category || 'Otro',
            quantity: item.quantity === undefined ? 1 : (Number(item.quantity) || 1),
            estimatedCost: item.estimatedCost === undefined ? undefined : (Number(item.estimatedCost) || 0),
            supplier: item.supplier || undefined,
            notes: item.notes || undefined,
            imageUrl: item.imageUrl || undefined,
        })),
        generalNotes: decoracionData.generalNotes === undefined ? (fiestaActual.decoracion?.generalNotes === undefined ? defaultDecoracion.generalNotes : fiestaActual.decoracion.generalNotes) : decoracionData.generalNotes,
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.decoracion)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la decoración." };
  }
}

export async function getInvitadosFiestaActual(): Promise<Invitado[]> {
  const fiesta = await getFiestaActual();
  return JSON.parse(JSON.stringify(fiesta.invitados || []));
}

export async function addInvitadoFiestaActual(
  invitadoData: NuevoInvitadoData
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    const nuevoInvitado: Invitado = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nombre: invitadoData.nombre || 'Invitado sin nombre',
      contacto: invitadoData.contacto || undefined,
      rsvp: invitadoData.rsvp || 'Pendiente',
      partySize: invitadoData.partySize === undefined ? 1 : Number(invitadoData.partySize) || 1,
      tableNumber: invitadoData.tableNumber || undefined,
      notes: invitadoData.notes || undefined,
    };
    fiestaActual.invitados = [...(fiestaActual.invitados || []), nuevoInvitado];
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
    let fiestaActual = await getFiestaActual();
    let invitadoEncontrado = false;
    fiestaActual.invitados = (fiestaActual.invitados || []).map(inv => {
      if (inv.id === invitadoData.id) {
        invitadoEncontrado = true;
        return {
          ...inv,
          ...invitadoData,
          partySize: invitadoData.partySize === undefined ? 1 : Number(invitadoData.partySize) || 1,
        };
      }
      return inv;
    });

    if (!invitadoEncontrado) {
        return { success: false, error: `Invitado con ID ${invitadoData.id} no encontrado para actualizar.` };
    }
    
    await writeFiestaActualFile(fiestaActual);
    const updatedInvitado = fiestaActual.invitados.find(inv => inv.id === invitadoData.id);
    return { success: true, invitado: updatedInvitado ? JSON.parse(JSON.stringify(updatedInvitado)) : undefined };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el invitado." };
  }
}

export async function deleteInvitadoFiestaActual(
  invitadoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    const initialLength = (fiestaActual.invitados || []).length;
    fiestaActual.invitados = (fiestaActual.invitados || []).filter(inv => inv.id !== invitadoId);
    if ((fiestaActual.invitados || []).length < initialLength) {
      await writeFiestaActualFile(fiestaActual);
      return { success: true };
    } else {
      return { success: false, error: `Invitado con ID ${invitadoId} no encontrado para eliminar.` };
    }
  } catch (e: any) {
    return { success: false, error: e.message || "Error al eliminar el invitado." };
  }
}

interface RsvpSubmissionData {
  nombreCompleto: string;
  email?: string;
  confirmacion: 'si' | 'no' | 'quizas' | '';
  numeroAsistentes: number;
  mensaje?: string;
}

export async function handleRsvpSubmission(
  submissionData: RsvpSubmissionData
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    if (!fiestaActual.invitados) {
      fiestaActual.invitados = [];
    }

    const guestNameLower = submissionData.nombreCompleto.trim().toLowerCase();
    const guestIndex = fiestaActual.invitados.findIndex(
      (inv) => inv.nombre.toLowerCase() === guestNameLower
    );

    if (guestIndex === -1) {
      return { success: false, error: "Invitación no encontrada. Por favor, verifica el nombre o contacta al organizador." };
    }

    const invitadoActual = fiestaActual.invitados[guestIndex];
    let newRsvpStatus: RsvpStatus = 'Pendiente';
    if (submissionData.confirmacion === 'si') newRsvpStatus = 'Confirmado';
    else if (submissionData.confirmacion === 'no') newRsvpStatus = 'Rechazado';
    else if (submissionData.confirmacion === 'quizas') newRsvpStatus = 'Quizás';

    const updatedInvitado: Invitado = {
      ...invitadoActual,
      rsvp: newRsvpStatus,
      partySize: Number(submissionData.numeroAsistentes) || invitadoActual.partySize || 1,
      contacto: submissionData.email?.trim() || invitadoActual.contacto, 
      notes: submissionData.mensaje?.trim()
        ? `${submissionData.mensaje.trim()}${invitadoActual.notes ? ` (Nota anterior: ${invitadoActual.notes})` : ''}`
        : invitadoActual.notes,
    };

    fiestaActual.invitados[guestIndex] = updatedInvitado;
    await writeFiestaActualFile(fiestaActual);
    return { success: true, invitado: JSON.parse(JSON.stringify(updatedInvitado)) };

  } catch (e: any) {
    console.error('Error procesando RSVP:', e);
    return { success: false, error: e.message || "Error al procesar la confirmación." };
  }
}


export async function updateWebPageSettingsFiestaActual(
  settings: Partial<EventWebPageSettings>
): Promise<{ success: boolean; updatedData?: EventWebPageSettings; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    
    const currentWebSettings = fiestaActual.webPageSettings || {};
    const newWebSettings: EventWebPageSettings = {
        ...defaultWebPageSettings, 
        ...currentWebSettings,   
        ...settings,             
        galleryImageUrls: settings.galleryImageUrls || currentWebSettings.galleryImageUrls || [],
    };
    newWebSettings.showCountdown = settings.showCountdown !== undefined ? settings.showCountdown : newWebSettings.showCountdown;
    newWebSettings.showOurStory = settings.showOurStory !== undefined ? settings.showOurStory : newWebSettings.showOurStory;
    newWebSettings.showEventDetails = settings.showEventDetails !== undefined ? settings.showEventDetails : newWebSettings.showEventDetails;
    newWebSettings.showDressCode = settings.showDressCode !== undefined ? settings.showDressCode : newWebSettings.showDressCode;
    newWebSettings.showGiftRegistry = settings.showGiftRegistry !== undefined ? settings.showGiftRegistry : newWebSettings.showGiftRegistry;
    newWebSettings.showGallery = settings.showGallery !== undefined ? settings.showGallery : newWebSettings.showGallery;
    newWebSettings.showRsvp = settings.showRsvp !== undefined ? settings.showRsvp : newWebSettings.showRsvp;

    fiestaActual.webPageSettings = newWebSettings;
    
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.webPageSettings)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la configuración de la página web." };
  }
}

export async function updateMusicaFiestaActual(
  musicaData: Partial<MusicaFiesta>
): Promise<{ success: boolean; updatedData?: MusicaFiesta; error?: string }> {
  try {
    let fiestaActual = await getFiestaActual();
    fiestaActual.musica = {
        ...defaultMusicaFiesta,
        ...(fiestaActual.musica || {}),
        ...musicaData,
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.musica)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la música de la fiesta." };
  }
}

export async function resetFiestaActual(): Promise<{ success: boolean; newFiesta?: FiestaEnPlanificacion, error?: string }> {
  try {
    const newInitialDataWithDynamicId = { ...initialFiestaActualData, id: `fiesta_${Date.now()}` };
    await writeFiestaActualFile(newInitialDataWithDynamicId);
    return { success: true, newFiesta: JSON.parse(JSON.stringify(newInitialDataWithDynamicId)) };
  } catch (e: any) {
    console.error("Error al reiniciar la fiesta:", e);
    return { success: false, error: e.message || "Error al reiniciar la fiesta." };
  }
}

export async function getHistorialFiestas(): Promise<FiestaEnPlanificacion[]> {
  return readHistorialFile();
}

export async function archivarFiestaActual(): Promise<{ success: boolean; error?: string; archivada?: FiestaEnPlanificacion, nuevaFiesta?: FiestaEnPlanificacion }> {
  try {
    const fiestaParaArchivar = await getFiestaActual();
    let historial = await readHistorialFile();
    
    const archivada = { ...fiestaParaArchivar, id: fiestaParaArchivar.id || `hist_${Date.now()}` };
    historial.push(archivada);
    await writeHistorialFile(historial);

    const resetResult = await resetFiestaActual();
    if (!resetResult.success || !resetResult.newFiesta) {
      // Attempt to roll back archive if reset fails
      const newHistorial = await readHistorialFile();
      await writeHistorialFile(newHistorial.filter(f => f.id !== archivada.id));
      throw new Error(resetResult.error || "No se pudo reiniciar la fiesta actual después de archivar.");
    }

    return { success: true, archivada: archivada, nuevaFiesta: resetResult.newFiesta };
  } catch (e: any) {
    console.error("Error archivando la fiesta actual:", e);
    return { success: false, error: e.message || "Error al archivar la fiesta." };
  }
}
