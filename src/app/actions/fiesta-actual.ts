

'use server';

import type { FiestaEnPlanificacion, Tarea, Invitado, DecoracionData, ProgramaEventoItem, PersonalAsignadoDetalleStorage, ClientTarea, ClientPortalSettings, EventWebPageSettings, MusicaFiesta, GiftItem, ReposteriaData, BebidasData, ListaDeCargaOperativa, GestionCostosData, FotografiaYFilmacionData, OtroDocumento, DocumentoTipo, PagoProveedor, VideoVidaData, InvitacionDigitalData } from '@/types/fiesta';
import { 
    getFiestas as getFiestasFromModule,
    getAllFiestas as getAllFiestasFromModule,
    archiveFiesta as archiveFiestaFromModule,
    resetFiestaActual as resetFiestaActualFromModule,
    getFiestaById as getFiestaByIdFromModule,
    saveFiesta as saveFiestaFromModule,
    createNewFiestaForCustomer as createNewFiestaForCustomerFromModule,
    addInvoiceId as addInvoiceIdToFiesta,
    removeInvoiceId as removeInvoiceIdFromFiesta,
    deleteFiestaArchivada as deleteFiestaArchivadaFromModule,
    deleteFiesta as deleteFiestaFromModule,
    duplicateFiesta as duplicateFiestaFromModule,
    getHistorialFiestas as getHistorialFiestasFromModule,
    getFiestaActual as getFiestaData // Keep this for now for legacy components that don't pass an ID
} from './fiesta/fiesta.actions';


import { updateConfiguracion } from './fiesta/configuracion.actions';
import { updateTareas } from './fiesta/tareas.actions';
import { addInvitado, deleteInvitado, updateInvitado, handleRsvpSubmission, getInvitados, checkInGuest } from './fiesta/invitados.actions';
import { updateDecoracion } from './fiesta/decoracion.actions';
import { updatePrograma } from './fiesta/itinerario.actions';
import { updatePersonal } from './fiesta/personal.actions';
import { updateClientChecklist, updateClientNotes, updatePortalSettings as updatePortalAndWebSettings } from './fiesta/portal.actions';
import { updateMusica } from './fiesta/musica.actions';
import { updateReposteria as updateReposteriaForFiesta } from './reposteria.actions';
import { updateBebidas as updateBebidasForFiesta } from './bebidas.actions';
import { updateListaDeCargaOperativa } from './fiesta/carga-operativa.actions';
import { updateGestionCostos } from './fiesta/costos.actions';
import { updateFotografiaYFilmacion as updateFotografiaYFilmacionFromModule } from './fiesta/fotografia.actions';
import { uploadDocumento, deleteDocumento } from './fiesta/documentos.actions';
import { updatePagosProveedores } from './fiesta/pagos.actions';
import { addReunion, deleteReunion, updateReunion } from './fiesta/reuniones.actions';
import { updateMenuAsignado } from './fiesta/catering.actions';
import { updateVideoVidaSettings as updateVideoVidaSettingsFromModule } from './fiesta/video-vida.actions';

// --- General Fiesta Actions ---
export const getFiestaActual = getFiestaData; // Legacy, use getFiestaById
export const getHistorialFiestas = getHistorialFiestasFromModule;
export const getFiestas = getFiestasFromModule;
export const getAllFiestas = getAllFiestasFromModule;
export const archiveFiesta = archiveFiestaFromModule;
export const deleteFiestaArchivada = deleteFiestaArchivadaFromModule;
export const deleteFiesta = deleteFiestaFromModule;
export const resetFiestaActual = resetFiestaActualFromModule;
export const getFiestaById = getFiestaByIdFromModule;
export const saveFiesta = saveFiestaFromModule;
export const createNewFiestaForCustomer = createNewFiestaForCustomerFromModule;
export const addInvoiceIdToFiestaActual = addInvoiceIdToFiesta;
export const removeInvoiceIdFromFiestaActual = removeInvoiceIdFromFiesta;
export const duplicateFiesta = duplicateFiestaFromModule;


// --- Configuration Actions ---
export const updateConfiguracionFiestaActual = updateConfiguracion;

// --- Tareas Actions ---
export const updateTareasFiestaActual = updateTareas;

// --- Invitados Actions ---
export const getInvitadosFiestaActual = getInvitados;
export const addInvitadoFiestaActual = addInvitado;
export const updateInvitadoFiestaActual = updateInvitado;
export const handleRsvpSubmissionFiestaActual = handleRsvpSubmission;
export const checkInGuestFiestaActual = checkInGuest;


// --- Decoracion Actions ---
export const updateDecoracionFiestaActual = updateDecoracion;

// --- Itinerario Actions ---
export const updateProgramaFiestaActual = updatePrograma;

// --- Personal Actions ---
export const updatePersonalFiestaActual = updatePersonal;

// --- Portal & Digital Invitation Actions ---
export const updateClientChecklistFiestaActual = updateClientChecklist;
export const updateClientNotesFiestaActual = updateClientNotes;
export const updatePortalSettings = updatePortalAndWebSettings; // Renamed to reflect it does both
export const updateInvitacionDigital = async (fiestaId: string, invitacionData: InvitacionDigitalData) => {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");
    const updatedFiesta = { ...fiesta, invitacionDigital: invitacionData };
    return saveFiesta(updatedFiesta);
}


// --- Musica Actions ---
export const updateMusicaFiestaActual = updateMusica;

// --- Reposteria Actions ---
export const updateReposteriaFiestaActual = updateReposteriaForFiesta;

// --- Bebidas Actions ---
export const updateBebidasFiestaActual = updateBebidasForFiesta;

// --- Carga Operativa Actions ---
export const updateListaDeCargaOperativaFiestaActual = updateListaDeCargaOperativa;

// --- Costos Actions ---
export const updateGestionCostosFiestaActual = updateGestionCostos;

// --- Fotografia Actions ---
export const updateFotografiaYFilmacionFiestaActual = updateFotografiaYFilmacionFromModule;

// --- Documentos Actions ---
export const uploadDocumentoFiesta = uploadDocumento;
export const deleteDocumentoFiesta = deleteDocumento;

// --- Pagos Proveedores Actions ---
export const updatePagosProveedoresFiestaActual = updatePagosProveedores;

// --- Reuniones Actions ---
export const addReunionToFiestaActual = addReunion;
export const updateReunionInFiestaActual = updateReunion;
export const deleteReunionFromFiestaActual = deleteReunion;

// --- Catering Actions ---
export const updateMenuAsignadoFiestaActual = updateMenuAsignado;

// --- Video de Vida Actions ---
export const updateVideoVidaSettingsFiestaActual = updateVideoVidaSettingsFromModule;

export const claimGiftFiestaActual = async (fiestaId: string, giftId: string, guestName: string): Promise<{ success: boolean; error?: string }> => {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta || !fiesta.invitacionDigital || !fiesta.invitacionDigital.regalos) {
        return { success: false, error: 'Fiesta o datos de regalos no encontrados.' };
    }
    
    let giftFoundAndUpdated = false;
    const updatedItems = (fiesta.invitacionDigital.regalos.items || []).map(item => {
        if (item.id === giftId && !item.isClaimed) {
            giftFoundAndUpdated = true;
            return { ...item, isClaimed: true, claimedBy: guestName };
        }
        return item;
    });

    if (!giftFoundAndUpdated) {
        return { success: false, error: "El regalo no se encontró o ya fue reclamado." };
    }

    const updatedInvitacionData = { 
        ...fiesta.invitacionDigital, 
        regalos: {
            ...(fiesta.invitacionDigital.regalos || {}),
            items: updatedItems
        }
    };
    
    const updatedFiesta = { ...fiesta, invitacionDigital: updatedInvitacionData };
    const result = await saveFiesta(updatedFiesta);
    return { success: result.success, error: result.error };
};

// This action is now obsolete as guests are deleted via a dedicated action in invitados.actions
export const deleteInvitadoFiestaActual = deleteInvitado;
