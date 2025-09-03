

'use server';

import type { FiestaEnPlanificacion, Tarea, OtroDocumento, DocumentoTipo, PagoProveedor, DecoracionData, ClientTarea, MusicaFiesta, ReposteriaData, BebidasData, ListaDeCargaOperativa, GestionCostosData, VideoVidaData, ProgramaEventoItem, FotografiaYFilmacionData, GiftItem, ClientPortalSettings, Reunion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import fs from 'fs/promises';
import path from 'path';
import { initialFiestaActualData, defaultWebPageSettings } from '@/lib/fiesta-defaults';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const FIESTAS_DIR = path.join(dataDirectory, 'fiestas');
const ARCHIVE_DIR = path.join(dataDirectory, 'archive');
// This is the fixed ID for the single, currently active party plan.
const FIESTA_ACTUAL_ID = "fiesta_1762181514757"; 
const FIESTA_ACTUAL_FILE_PATH = path.join(FIESTAS_DIR, `${FIESTA_ACTUAL_ID}.json`);


async function ensureDirectoryExists(dirPath: string) {
  try { await fs.access(dirPath); } catch { await fs.mkdir(dirPath, { recursive: true }); }
}

async function initializeDirectories() {
  await ensureDirectoryExists(FIESTAS_DIR);
  await ensureDirectoryExists(ARCHIVE_DIR);
}
initializeDirectories();

async function readFiestaFile(filePath: string): Promise<FiestaEnPlanificacion | null> {
  try {
    await fs.access(filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent) as FiestaEnPlanificacion;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null; // File does not exist, which is a valid state
    }
    console.error(`Error reading fiesta file ${filePath}:`, error);
    throw new Error(`Could not read fiesta file at ${filePath}`);
  }
}

async function writeFiestaFile(filePath: string, data: FiestaEnPlanificacion): Promise<void> {
  await ensureDirectoryExists(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}


// --- MAIN DATA ACCESS FUNCTIONS ---

export async function getFiestaActual(): Promise<FiestaEnPlanificacion> {
  let fiesta = await readFiestaFile(FIESTA_ACTUAL_FILE_PATH);
  if (!fiesta) {
    // If the main file doesn't exist, create it with initial data.
    console.log("Fiesta actual no encontrada, creando una nueva con datos iniciales.");
    await writeFiestaFile(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    return initialFiestaActualData;
  }
  return fiesta;
}

export async function getHistorialFiestas(): Promise<FiestaEnPlanificacion[]> {
  try {
    const archiveFiles = await fs.readdir(ARCHIVE_DIR);
    const historiales = await Promise.all(
      archiveFiles
        .filter(file => file.endsWith('.json'))
        .map(file => readFiestaFile(path.join(ARCHIVE_DIR, file)))
    );
    return historiales.filter((f): f is FiestaEnPlanificacion => f !== null)
      .sort((a, b) => new Date(b.configuracion.fechaEvento || 0).getTime() - new Date(a.configuracion.fechaEvento || 0).getTime());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // No archive directory exists yet.
    }
    console.error("Error leyendo el historial de fiestas:", error);
    return [];
  }
}

export async function archiveFiesta(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  if (fiestaId !== FIESTA_ACTUAL_ID) {
    return { success: false, error: "Solo se puede archivar la fiesta activa." };
  }
  
  try {
    const fiestaActual = await getFiestaActual();
    if (!fiestaActual) {
      return { success: false, error: "No hay una fiesta activa para archivar." };
    }
    
    // Create a unique name for the archive file based on the event date and name
    const datePart = fiestaActual.configuracion.fechaEvento ? new Date(fiestaActual.configuracion.fechaEvento).toISOString().split('T')[0] : 'sin-fecha';
    const namePart = fiestaActual.configuracion.nombreEvento.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20);
    const archiveFilename = `fiesta_archivada_${datePart}_${namePart}_${fiestaActual.id}.json`;
    const archivePath = path.join(ARCHIVE_DIR, archiveFilename);
    
    await writeFiestaFile(archivePath, fiestaActual);

    // Reset the main file to the initial state
    await writeFiestaFile(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error al archivar la fiesta actual:", error);
    return { success: false, error: "No se pudo archivar la fiesta." };
  }
}


export async function resetFiestaActual(): Promise<{ success: boolean; error?: string }> {
    try {
        await writeFiestaFile(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
        return { success: true };
    } catch(e: any) {
        return { success: false, error: e.message };
    }
}

// --- MODULE-SPECIFIC UPDATE FUNCTIONS ---

async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion): Promise<{ success: boolean; updatedData?: FiestaEnPlanificacion; error?: string }> {
  try {
    const currentData = await getFiestaActual();
    const updatedData = updateFn(currentData);
    await writeFiestaFile(FIESTA_ACTUAL_FILE_PATH, updatedData);
    return { success: true, updatedData };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// CONFIGURACION
export async function updateConfiguracionFiestaActual(config: ConfigEventoDataStorage) {
  return updateFiestaData(data => ({ ...data, configuracion: config }));
}

// TAREAS
export async function updateTareasFiestaActual(tareas: Tarea[]) {
  return updateFiestaData(data => ({ ...data, tareas }));
}

// INVITADOS
export async function getInvitadosFiestaActual(): Promise<FiestaEnPlanificacion['invitados']> {
    const fiesta = await getFiestaActual();
    return fiesta.invitados || [];
}

export async function addInvitadoFiestaActual(nuevoInvitadoData: Omit<Invitado, 'id'>) {
    return updateFiestaData(data => {
        const nuevoInvitado: Invitado = { ...nuevoInvitadoData, id: `inv_${Date.now()}` };
        const invitados = [...(data.invitados || []), nuevoInvitado];
        return { ...data, invitados };
    });
}

export async function updateInvitadoFiestaActual(invitadoActualizado: Invitado) {
    return updateFiestaData(data => {
        const invitados = (data.invitados || []).map(inv => 
            inv.id === invitadoActualizado.id ? invitadoActualizado : inv
        );
        return { ...data, invitados };
    });
}

export async function deleteInvitadoFiestaActual(invitadoId: string) {
    return updateFiestaData(data => {
        const invitados = (data.invitados || []).filter(inv => inv.id !== invitadoId);
        return { ...data, invitados };
    });
}

export async function handleRsvpSubmission(submission: {nombreCompleto: string, confirmacion: string, numeroAsistentes: number, mensaje: string, companionNames: string[] }): Promise<{ success: boolean, invitado?: Invitado, error?: string}> {
   return updateFiestaData(data => {
     const invitadoExistenteIndex = (data.invitados || []).findIndex(
        inv => inv.nombre.trim().toLowerCase() === submission.nombreCompleto.toLowerCase()
      );
      
      let updatedInvitado: Invitado;

      if (invitadoExistenteIndex > -1) {
         updatedInvitado = {
           ...(data.invitados![invitadoExistenteIndex]),
           rsvp: submission.confirmacion as RsvpStatus,
           partySize: submission.numeroAsistentes,
           notes: [data.invitados![invitadoExistenteIndex].notes, submission.mensaje].filter(Boolean).join('\n---\n'),
           companionNames: submission.companionNames,
         };
         data.invitados![invitadoExistenteIndex] = updatedInvitado;
      } else {
         updatedInvitado = {
           id: `inv_rsvp_${Date.now()}`,
           nombre: submission.nombreCompleto,
           rsvp: submission.confirmacion as RsvpStatus,
           partySize: submission.numeroAsistentes,
           notes: submission.mensaje,
           companionNames: submission.companionNames,
         };
         data.invitados = [...(data.invitados || []), updatedInvitado];
      }
      return data;
   })
}

export async function checkInGuest(guestId: string): Promise<{ success: boolean; invitado?: Invitado; error?: string }> {
    try {
        const fiesta = await getFiestaActual();
        let invitadoActualizado: Invitado | undefined;
        let found = false;

        const invitados = (fiesta.invitados || []).map(inv => {
            if (inv.id === guestId) {
                found = true;
                if(inv.checkedIn) { // If already checked in, don't update timestamp
                   invitadoActualizado = inv;
                   return inv;
                }
                invitadoActualizado = { ...inv, checkedIn: true, checkInTimestamp: new Date().toISOString() };
                return invitadoActualizado;
            }
            return inv;
        });

        if (!found) {
            return { success: false, error: 'Invitado no encontrado.' };
        }
        
        const result = await updateFiestaData(data => ({ ...data, invitados }));

        if (result.success) {
            return { success: true, invitado: invitadoActualizado };
        } else {
            return { success: false, error: result.error };
        }
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// CATERING
export async function updateMenuAsignadoFiestaActual(menuId?: string) {
  return updateFiestaData(data => ({ ...data, menuAsignadoId: menuId }));
}

// DECORACION
export async function updateDecoracionFiestaActual(decoracion: DecoracionData) {
  return updateFiestaData(data => ({ ...data, decoracion }));
}

// CLIENT CHECKLIST
export async function updateClientChecklist(checklist: ClientTarea[]) {
  return updateFiestaData(data => ({ ...data, clientChecklist: checklist }));
}

// CLIENT NOTES
export async function updateClientNotes(notes: string) {
  return updateFiestaData(data => ({ ...data, clientNotes: notes }));
}

// PORTAL SETTINGS
export async function updatePortalSettings(settings: ClientPortalSettings) {
  return updateFiestaData(data => ({ ...data, clientPortalSettings: settings }));
}

// MUSICA
export async function updateMusicaFiestaActual(musica: MusicaFiesta) {
  return updateFiestaData(data => ({ ...data, musica }));
}

// REPOSTERIA
export async function updateReposteriaFiestaActual(reposteria: ReposteriaData) {
  return updateFiestaData(data => ({ ...data, reposteria }));
}

// BEBIDAS
export async function updateBebidasFiestaActual(bebidas: BebidasData) {
  return updateFiestaData(data => ({ ...data, bebidas }));
}

// CARGA OPERATIVA
export async function updateListaDeCargaOperativa(lista: ListaDeCargaOperativa) {
  return updateFiestaData(data => ({ ...data, listaDeCargaOperativa: lista }));
}

// GESTION DE COSTOS
export async function updateGestionCostosFiestaActual(costos: GestionCostosData) {
  return updateFiestaData(data => ({ ...data, gestionCostos: costos }));
}

// VIDEO DE VIDA
export async function updateVideoVidaSettings(settings: Partial<VideoVidaData>) {
    return updateFiestaData(data => ({
        ...data,
        videoVida: { ...(data.videoVida || { galleryEnabled: false, photosUploaded: false }), ...settings }
    }));
}

// ITINERARIO
export async function updateProgramaFiestaActual(programa: ProgramaEventoItem[]) {
  return updateFiestaData(data => ({ ...data, programa }));
}

// REUNIONES
export async function addReunionToFiestaActual(reunionData: Omit<Reunion, 'id'>) {
    const newReunion: Reunion = { ...reunionData, id: `reunion_${Date.now()}` };
    const result = await updateFiestaData(data => ({
        ...data,
        reuniones: [...(data.reuniones || []), newReunion]
    }));
    return {...result, reunion: newReunion };
}
export async function updateReunionInFiestaActual(updatedReunion: Reunion) {
    const result = await updateFiestaData(data => ({
        ...data,
        reuniones: (data.reuniones || []).map(r => r.id === updatedReunion.id ? updatedReunion : r)
    }));
    return {...result, reunion: updatedReunion };
}
export async function deleteReunionFromFiestaActual(reunionId: string) {
    return updateFiestaData(data => ({
        ...data,
        reuniones: (data.reuniones || []).filter(r => r.id !== reunionId)
    }));
}

// FOTOGRAFIA Y FILMACION
export async function updateFotografiaYFilmacion(fotografia: FotografiaYFilmacionData) {
    return updateFiestaData(data => ({ ...data, fotografiaYFilmacion: fotografia }));
}

// DOCUMENTOS
export async function uploadDocumentoFiesta(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as DocumentoTipo;
    const customName = formData.get('customName') as string;

    if (!file) return { success: false, error: 'No se proporcionó ningún archivo.' };

    try {
        const fiesta = await getFiestaActual();
        const docsDir = path.join(dataDirectory, 'documentos-varios-fiesta', fiesta.id);
        await ensureDirectoryExists(docsDir);
        
        const docId = `doc_${Date.now()}`;
        const newFilename = `${docId}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = path.join(docsDir, newFilename);

        const bytes = await file.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(bytes));
        
        const newDoc: OtroDocumento = {
            id: docId,
            nombre: customName.trim() || file.name,
            tipo: docType,
            fileName: newFilename,
            timestamp: new Date().toISOString(),
        };
        
        const otrosDocumentos = [...(fiesta.otrosDocumentos || []), newDoc];
        await updateFiestaData(data => ({...data, otrosDocumentos}));
        return { success: true };
    } catch(e:any) {
        return { success: false, error: e.message };
    }
}

export async function deleteDocumentoFiesta(docId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const fiesta = await getFiestaActual();
        const docToDelete = fiesta.otrosDocumentos?.find(d => d.id === docId);
        if (!docToDelete) {
            return { success: false, error: 'Documento no encontrado.' };
        }
        
        const filePath = path.join(dataDirectory, 'documentos-varios-fiesta', fiesta.id, docToDelete.fileName);
        try { await fs.unlink(filePath); } catch (e) { console.warn(`No se pudo eliminar el archivo físico ${filePath}, puede que ya no exista.`); }

        const otrosDocumentos = (fiesta.otrosDocumentos || []).filter(d => d.id !== docId);
        await updateFiestaData(data => ({...data, otrosDocumentos}));

        return { success: true };
    } catch (e:any) {
        return { success: false, error: e.message };
    }
}

// PAGOS A PROVEEDORES
export async function updatePagosProveedores(pagos: PagoProveedor[]) {
    return updateFiestaData(data => ({ ...data, pagosProveedores: pagos }));
}

// PERSONAL
export async function updatePersonalFiestaActual(personal: PersonalAsignadoDetalleStorage[]) {
  return updateFiestaData(data => ({ ...data, personalAsignado: personal }));
}

// GIFT REGISTRY
export async function updateGiftRegistry(giftList: GiftItem[]) {
    return updateFiestaData(data => {
        const webPageSettings = data.webPageSettings || defaultWebPageSettings;
        return {
            ...data,
            webPageSettings: { ...webPageSettings, giftRegistry: giftList }
        };
    });
}
export async function claimGift(giftId: string, guestName: string): Promise<{ success: boolean; error?: string }> {
    return updateFiestaData(data => {
        const webPageSettings = data.webPageSettings || defaultWebPageSettings;
        const giftList = webPageSettings.giftRegistry || [];
        const updatedList = giftList.map(gift => {
            if (gift.id === giftId && !gift.isClaimed) {
                return { ...gift, isClaimed: true, claimedBy: guestName };
            }
            return gift;
        });
        return { ...data, webPageSettings: { ...webPageSettings, giftRegistry: updatedList } };
    });
}


// --- Relational Updates ---

export async function addInvoiceIdToFiestaActual(invoiceId: string) {
  return updateFiestaData(data => {
    const invoiceIds = Array.from(new Set([...(data.invoiceIds || []), invoiceId]));
    return { ...data, invoiceIds };
  });
}

export async function removeInvoiceIdFromFiestaActual(invoiceId: string) {
  return updateFiestaData(data => {
    const invoiceIds = (data.invoiceIds || []).filter(id => id !== invoiceId);
    return { ...data, invoiceIds };
  });
}


// --- DEPRECATED/MIGRATED SECTION ---

// This function is being kept for backwards compatibility with older components
// that might still call it. It now delegates to getFiestaActual.
// New components should use getFiestas() or getFiestaById()
export async function getFiestas(includeArchived = false): Promise<FiestaEnPlanificacion[]> {
  const fiestaActual = await getFiestaActual();
  let allFiestas = fiestaActual ? [fiestaActual] : [];

  if (includeArchived) {
    const archivedFiestas = await getHistorialFiestas();
    allFiestas = allFiestas.concat(archivedFiestas);
  }
  
  return allFiestas.sort((a, b) => new Date(a.configuracion.fechaEvento || 0).getTime() - new Date(b.configuracion.fechaEvento || 0).getTime());
}

// This function is kept for backwards compatibility with older components
// that might still call it. It now delegates to getFiestaActual or searches history.
export async function getFiestaById(fiestaId: string): Promise<FiestaEnPlanificacion | null> {
    if (fiestaId === FIESTA_ACTUAL_ID) {
      return getFiestaActual();
    }
    // Fallback to check archive if not the active fiesta
    const archivePath = path.join(ARCHIVE_DIR, `fiesta_${fiestaId}.json`);
    try {
        await fs.access(archivePath);
        return await readFiestaFile(archivePath);
    } catch (archiveError) {
         return null;
    }
}


export async function saveFiesta(fiestaData: FiestaEnPlanificacion): Promise<{ success: boolean; fiesta?: FiestaEnPlanificacion; error?: string }> {
  try {
    const filePath = fiestaData.id === FIESTA_ACTUAL_ID ? FIESTA_ACTUAL_FILE_PATH : path.join(FIESTAS_DIR, `fiesta_${fiestaData.id}.json`);
    await writeFiestaFile(filePath, fiestaData);
    return { success: true, fiesta: fiestaData };
  } catch (error: any) {
    console.error("Error saving fiesta:", error);
    return { success: false, error: "No se pudo guardar la fiesta." };
  }
}

export async function createNewFiestaForCustomer(customer: Customer): Promise<{ success: boolean; fiesta?: FiestaEnPlanificacion; error?: string }> {
  
  const newFiesta: FiestaEnPlanificacion = {
    ...initialFiestaActualData,
    id: `fiesta_${customer.id}`, // Link to customer
    configuracion: {
      ...initialFiestaActualData.configuracion,
      clienteId: customer.id,
      nombreEvento: customer.partyType ? `${customer.partyType} de ${customer.name}` : `Evento de ${customer.name}`,
      fechaEvento: customer.partyDate || new Date().toISOString(),
      invitadosEstimados: customer.guestCount || 50,
      nombreLugar: customer.venueName || 'A definir',
    },
  };
  
  // This is tricky. In a multi-event system, we would save a new file.
  // In a single-event system, this would OVERWRITE the current event.
  // Let's assume for now it should overwrite if the user intends to start a new plan for a new customer.
  // The safer approach is to archive first, then create.
  
  // For now, let's just save it as the current one.
  return saveFiesta(newFiesta);
}
