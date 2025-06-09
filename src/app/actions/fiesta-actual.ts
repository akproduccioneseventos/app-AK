
'use server';

import type { FiestaEnPlanificacion, ConfigEventoDataStorage, PersonalAsignadoDetalleStorage, Reunion, SalonLayoutData, LayoutElement, Tarea, DecoracionData, ColorPalette, DecorationItem, EventWebPageSettings, MusicaFiesta } from '@/types/fiesta';
import type { Invitado, NuevoInvitadoData, RsvpStatus } from '@/types/invitado'; // Importar tipos de invitado
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

const defaultWebPageSettings: EventWebPageSettings = {
  pageTitle: 'Mi Evento Especial',
  welcomeMessage: '¡Bienvenidos a la celebración!',
  coverImageUrl: '',
  galleryImageUrls: [],
};

const defaultMusicaFiesta: MusicaFiesta = {
  cancionEntrada: '',
  cancionVals: '',
  playlistFiesta: '',
  listaNoReproducir: '',
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
  invitados: [],
  webPageSettings: { ...defaultWebPageSettings, galleryImageUrls: [] },
  musica: { ...defaultMusicaFiesta },
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
    let data = JSON.parse(fileContent) as Partial<FiestaEnPlanificacion>; // Parse as Partial to handle missing fields

    const validatedData: FiestaEnPlanificacion = {
        id: data.id || initialFiestaActualData.id,
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
        tareas: (data.tareas && data.tareas.length > 0 ? data.tareas : [...defaultTareas.map(t => ({...t}))]).map(t => ({
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
          pageTitle: data.webPageSettings?.pageTitle || defaultWebPageSettings.pageTitle || '',
          welcomeMessage: data.webPageSettings?.welcomeMessage || defaultWebPageSettings.welcomeMessage || '',
          coverImageUrl: data.webPageSettings?.coverImageUrl || defaultWebPageSettings.coverImageUrl || '',
          galleryImageUrls: data.webPageSettings?.galleryImageUrls || [],
        },
        musica: {
          cancionEntrada: data.musica?.cancionEntrada || defaultMusicaFiesta.cancionEntrada || '',
          cancionVals: data.musica?.cancionVals || defaultMusicaFiesta.cancionVals || '',
          playlistFiesta: data.musica?.playlistFiesta || defaultMusicaFiesta.playlistFiesta || '',
          listaNoReproducir: data.musica?.listaNoReproducir || defaultMusicaFiesta.listaNoReproducir || '',
        },
    };
    return validatedData;

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await writeFiestaActualFile(initialFiestaActualData);
      return { ...initialFiestaActualData };
    }
    console.error('Error leyendo el archivo de fiesta actual, usando datos iniciales:', error);
    // Attempt to write initial data if reading/parsing failed for other reasons
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
  // Return a deep copy to prevent direct modification of the in-memory cache if any
  return JSON.parse(JSON.stringify(fiesta));
}

export async function updateConfiguracionFiestaActual(
  configData: Partial<ConfigEventoDataStorage> // Allow partial updates
): Promise<{ success: boolean; updatedData?: ConfigEventoDataStorage; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.configuracion = { 
        ...fiestaActual.configuracion, 
        ...configData,
        // Ensure numeric fields are numbers or default
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
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.personalAsignado = [...personalData]; // Replace entire array
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
    let fiestaActual = await readFiestaActualFile();
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
    let fiestaActual = await readFiestaActualFile();
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
    let fiestaActual = await readFiestaActualFile();
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
    let fiestaActual = await readFiestaActualFile();
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
    let fiestaActual = await readFiestaActualFile();
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
  const fiesta = await readFiestaActualFile();
  return JSON.parse(JSON.stringify(fiesta.invitados || []));
}

export async function addInvitadoFiestaActual(
  invitadoData: NuevoInvitadoData
): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
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
    let fiestaActual = await readFiestaActualFile();
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
    let fiestaActual = await readFiestaActualFile();
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
    let fiestaActual = await readFiestaActualFile();
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
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.webPageSettings = {
      pageTitle: settings.pageTitle || fiestaActual.webPageSettings?.pageTitle || defaultWebPageSettings.pageTitle,
      welcomeMessage: settings.welcomeMessage || fiestaActual.webPageSettings?.welcomeMessage || defaultWebPageSettings.welcomeMessage,
      coverImageUrl: settings.coverImageUrl || fiestaActual.webPageSettings?.coverImageUrl || defaultWebPageSettings.coverImageUrl,
      galleryImageUrls: settings.galleryImageUrls || fiestaActual.webPageSettings?.galleryImageUrls || [],
    };
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
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.musica = {
        cancionEntrada: musicaData.cancionEntrada || fiestaActual.musica?.cancionEntrada || defaultMusicaFiesta.cancionEntrada,
        cancionVals: musicaData.cancionVals || fiestaActual.musica?.cancionVals || defaultMusicaFiesta.cancionVals,
        playlistFiesta: musicaData.playlistFiesta || fiestaActual.musica?.playlistFiesta || defaultMusicaFiesta.playlistFiesta,
        listaNoReproducir: musicaData.listaNoReproducir || fiestaActual.musica?.listaNoReproducir || defaultMusicaFiesta.listaNoReproducir,
    };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.musica)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la música de la fiesta." };
  }
}


export async function resetFiestaActual(): Promise<{ success: boolean; initialData?: FiestaEnPlanificacion, error?: string }> {
    try {
        // Create a deep copy of initialFiestaActualData to avoid modifying the constant
        const resetData = JSON.parse(JSON.stringify(initialFiestaActualData));
        await writeFiestaActualFile(resetData);
        return { success: true, initialData: resetData };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al reiniciar la fiesta." };
    }
}

// Initialize data file if it doesn't exist or is malformed
// This function is called when the module is loaded.
async function initializeDataFile() {
    await ensureDataDirectoryExists();
    try {
        // Attempt to read the file to ensure it's valid and contains all necessary default structures.
        // readFiestaActualFile itself handles creation with defaults if ENOENT or other read errors.
        await readFiestaActualFile(); 
        console.log("Fiesta actual data file checked/initialized successfully.");
    } catch (error) {
        console.error("Critical error during initial data file check/initialization:", error);
        // If readFiestaActualFile throws an error that it doesn't handle by writing defaults (should not happen),
        // we might try one more time to write the absolute defaults.
        try {
            await writeFiestaActualFile(initialFiestaActualData);
            console.log("Fiesta actual data file forcefully reset to initial defaults due to critical error.");
        } catch (writeError) {
            console.error("Failed to forcefully reset fiesta actual data file:", writeError);
        }
    }
}

initializeDataFile();

    