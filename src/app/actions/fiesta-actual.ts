
'use server';

import type { FiestaEnPlanificacion, Tarea, Invitado, RsvpStatus, DecoracionData, ProgramaEventoItem, PersonalAsignadoDetalleStorage, ClientTarea, ClientPortalSettings, EventWebPageSettings, MusicaFiesta, GiftItem, ReposteriaData, BebidasData, ListaDeCargaOperativa, GestionCostosData, FotografiaYFilmacionData, OtroDocumento, DocumentoTipo, PagoProveedor, VideoVidaData } from '@/types/fiesta';
import { initialFiestaActualData, defaultWebPageSettings } from '@/lib/fiesta-defaults';
import { readData, writeData } from '@/lib/data-service';
import fs from 'fs/promises';
import path from 'path';

// DEPRECATED: This file is being split into smaller, modular action files
// inside the /app/actions/fiesta/ directory.
// The functions are temporarily re-exported from here for backward compatibility
// during the transition. New code should import from the specific action files.

import { 
    getFiestaActual as getFiestaActualFromModule,
    getHistorialFiestas as getHistorialFiestasFromModule,
    getFiestas as getFiestasFromModule,
    getAllFiestas as getAllFiestasFromModule,
    archiveFiesta as archiveFiestaFromModule,
    resetFiestaActual as resetFiestaActualFromModule,
    getFiestaById as getFiestaByIdFromModule,
    saveFiesta as saveFiestaFromModule,
    createNewFiestaForCustomer as createNewFiestaForCustomerFromModule,
    addInvoiceId,
    removeInvoiceId,
    deleteArchivedFiesta
} from './fiesta/fiesta.actions';

import { updateConfiguracion } from './fiesta/configuracion.actions';
import { updateTareas } from './fiesta/tareas.actions';
import { addInvitado, deleteInvitado, updateInvitado, handleRsvpSubmission, checkInGuest, getInvitados } from './fiesta/invitados.actions';
import { updateDecoracion } from './fiesta/decoracion.actions';
import { updatePrograma } from './fiesta/itinerario.actions';
import { updatePersonal } from './fiesta/personal.actions';
import { updateClientChecklist, updateClientNotes, updatePortalSettings } from './fiesta/portal.actions';
import { updateMusica } from './fiesta/musica.actions';
import { updateGiftRegistry, claimGift } from './fiesta/regalos.actions';
import { updateReposteria } from './fiesta/reposteria.actions';
import { updateBebidas } from './fiesta/bebidas.actions';
import { updateListaDeCargaOperativa } from './fiesta/carga-operativa.actions';
import { updateGestionCostos } from './fiesta/costos.actions';
import { updateFotografiaYFilmacion as updateFotografiaYFilmacionFromModule } from './fiesta/fotografia.actions';
import { uploadDocumento, deleteDocumento } from './fiesta/documentos.actions';
import { updatePagosProveedores } from './fiesta/pagos.actions';
import { addReunion, deleteReunion, updateReunion } from './fiesta/reuniones.actions';
import { updateMenuAsignado } from './fiesta/catering.actions';
import { updateVideoVidaSettings as updateVideoVidaSettingsFromModule } from './fiesta/video-vida.actions';


// --- General Fiesta Actions ---
export const getFiestaActual = getFiestaActualFromModule;
export const getHistorialFiestas = getHistorialFiestasFromModule;
export const getFiestas = getFiestasFromModule;
export const getAllFiestas = getAllFiestasFromModule;
export const archiveFiesta = archiveFiestaFromModule;
export const deleteFiestaArchivada = deleteArchivedFiesta;
export const resetFiestaActual = resetFiestaActualFromModule;
export const getFiestaById = getFiestaByIdFromModule;
export const saveFiesta = saveFiestaFromModule;
export const createNewFiestaForCustomer = createNewFiestaForCustomerFromModule;
export const addInvoiceIdToFiestaActual = addInvoiceId;
export const removeInvoiceIdFromFiestaActual = removeInvoiceId;

// --- Configuration Actions ---
export const updateConfiguracionFiestaActual = updateConfiguracion;

// --- Tareas Actions ---
export const updateTareasFiestaActual = updateTareas;

// --- Invitados Actions ---
export const getInvitadosFiestaActual = getInvitados;
export const addInvitadoFiestaActual = addInvitado;
export const updateInvitadoFiestaActual = updateInvitado;
export const deleteInvitadoFiestaActual = deleteInvitado;
export const handleRsvpSubmissionFiestaActual = handleRsvpSubmission;
export const checkInGuestFiestaActual = checkInGuest;

// --- Decoracion Actions ---
export const updateDecoracionFiestaActual = updateDecoracion;

// --- Itinerario Actions ---
export const updateProgramaFiestaActual = updatePrograma;

// --- Personal Actions ---
export const updatePersonalFiestaActual = updatePersonal;

// --- Portal Actions ---
export const updateClientChecklistFiestaActual = updateClientChecklist;
export const updateClientNotesFiestaActual = updateClientNotes;
export const updatePortalSettingsFiestaActual = updatePortalSettings;

// --- Musica Actions ---
export const updateMusicaFiestaActual = updateMusica;

// --- Regalos Actions ---
export const updateGiftRegistryFiestaActual = updateGiftRegistry;
export const claimGiftFiestaActual = claimGift;

// --- Reposteria Actions ---
export const updateReposteriaFiestaActual = updateReposteria;

// --- Bebidas Actions ---
export const updateBebidasFiestaActual = updateBebidas;

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
