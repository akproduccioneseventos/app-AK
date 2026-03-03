
'use server';

import {
  getFiestas as getFiestasFromModule,
  getAllFiestas as getAllFiestasFromModule,
  archiveFiesta as archiveFiestaFromModule,
  resetFiestaActual as resetFiestaActualFromModule,
  getFiestaById as getFiestaByIdFromModule,
  saveFiesta as saveFiestaFromModule,
  createNewFiestaForCustomer as createNewFiestaForCustomerFromModule,
  addInvoiceId as addInvoiceIdFromModule,
  removeInvoiceId as removeInvoiceIdFromModule,
  deleteFiestaArchivada as deleteFiestaArchivadaFromModule,
  deleteFiesta as deleteFiestaFromModule,
  duplicateFiesta as duplicateFiestaFromModule,
  getHistorialFiestas as getHistorialFiestasFromModule,
  getFiestaActual as getFiestaData,
  updateCartaTragos as updateCartaTragosFromModule,
  updateMenuMesa as updateMenuMesaFromModule,
  updateNumerosMesa as updateNumerosMesaFromModule
} from './fiesta/fiesta.actions';

import { updateConfiguracion } from './fiesta/configuracion.actions';
import { updateTareas, addTarea as addTareaToFiesta, deleteTarea as deleteTareaFromFiesta } from './fiesta/tareas.actions';
import { addInvitado, deleteInvitado, updateInvitado, handleRsvpSubmission, getInvitados, checkInGuest } from './fiesta/invitados.actions';
import { updateDecoracion } from './fiesta/decoracion.actions';
import { updatePrograma } from './fiesta/itinerario.actions';
import { updatePersonal } from './fiesta/personal.actions';
import { updateClientChecklist, updateClientNotes, updatePortalSettings } from './fiesta/portal.actions';
import { updateMusica, saveSugerenciaMusical } from './fiesta/musica.actions';
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
import { claimGift, addGiftToRegistry } from './fiesta/regalos.actions';
import type { FiestaEnPlanificacion, ModulosContratados } from '@/types/fiesta';

// --- Re-exports ---

// General Fiesta Actions
export const getFiestaActual = getFiestaData;
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
export const addInvoiceIdToFiestaActual = addInvoiceIdFromModule;
export const removeInvoiceIdFromFiestaActual = removeInvoiceIdFromModule;
export const duplicateFiesta = duplicateFiestaFromModule;

// Configuration Actions
export const updateConfiguracionFiestaActual = updateConfiguracion;
export const updateModulosContratadosFiestaActual = async (fiestaId: string, modulos: ModulosContratados) => {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");
    const updatedFiesta = { ...fiesta, modulosContratados: modulos };
    return saveFiesta(updatedFiesta);
}

// Contract Action
export const updateContratoFiestaActual = async (fiestaId: string, text: string) => {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");
    const updatedFiesta = { ...fiesta, contratoServicioTexto: text };
    return saveFiesta(updatedFiesta);
}

// Tareas Actions
export const updateTareasFiestaActual = updateTareas;
export const addTareaToFiestaActual = addTareaToFiesta;
export const deleteTareaFromFiestaActual = deleteTareaFromFiesta;

// Invitados Actions
export const getInvitadosFiestaActual = getInvitados;
export const addInvitadoFiestaActual = addInvitado;
export const updateInvitadoFiestaActual = updateInvitado;
export const handleRsvpSubmissionFiestaActual = handleRsvpSubmission;
export const checkInGuestFiestaActual = checkInGuest;
export const deleteInvitadoFiestaActual = deleteInvitado;

// Decoracion Actions
export const updateDecoracionFiestaActual = updateDecoracion;

// Itinerario Actions
export const updateProgramaFiestaActual = updatePrograma;

// Personal Actions
export const updatePersonalFiestaActual = updatePersonal;

// Portal & Digital Invitation Actions
export const updateClientChecklistFiestaActual = updateClientChecklist;
export const updateClientNotesFiestaActual = updateClientNotes;
export const updatePortalSettingsFiestaActual = updatePortalSettings;

// Musica Actions
export const updateMusicaFiestaActual = updateMusica;
export const saveSugerenciaMusicalFiestaActual = saveSugerenciaMusical;

// Reposteria Actions
export const updateReposteriaFiestaActual = updateReposteriaForFiesta;

// Bebidas Actions
export const updateBebidasFiestaActual = updateBebidasForFiesta;

// Carga Operativa Actions
export const updateListaDeCargaOperativaFiestaActual = updateListaDeCargaOperativa;

// Costos Actions
export const updateGestionCostosFiestaActual = updateGestionCostos;

// Fotografia Actions
export const updateFotografiaYFilmacionFiestaActual = updateFotografiaYFilmacionFromModule;

// Documentos Actions
export const uploadDocumentoFiesta = uploadDocumento;
export const deleteDocumentoFiesta = deleteDocumento;

// Pagos Proveedores Actions
export const updatePagosProveedoresFiestaActual = updatePagosProveedores;

// Reuniones Actions
export const addReunionToFiestaActual = addReunion;
export const updateReunionInFiestaActual = updateReunion;
export const deleteReunionFromFiestaActual = deleteReunion;

// Catering Actions
export const updateMenuAsignadoFiestaActual = updateMenuAsignado;

// Video de Vida Actions
export const updateVideoVidaSettingsFiestaActual = updateVideoVidaSettingsFromModule;

// Regalos Actions
export const claimGiftFiestaActual = claimGift;
export const addGiftToRegistryFiestaActual = addGiftToRegistry;

// Carta Tragos / Menu Mesa Actions
export const updateCartaTragos = updateCartaTragosFromModule;
export const updateMenuMesa = updateMenuMesaFromModule;
export const updateNumerosMesa = updateNumerosMesaFromModule;
