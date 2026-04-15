
/**
 * @fileOverview Central de Acciones de Servidor para la Planificación de Fiestas.
 */
'use server';

import * as FiestaModule from './fiesta/fiesta.actions';
import * as ConfigModule from './fiesta/configuracion.actions';
import * as TareasModule from './fiesta/tareas.actions';
import * as InvitadosModule from './fiesta/invitados.actions';
import * as DecoracionModule from './fiesta/decoracion.actions';
import * as ItinerarioModule from './fiesta/itinerario.actions';
import * as PersonalModule from './fiesta/personal.actions';
import * as PortalModule from './fiesta/portal.actions';
import * as MusicaModule from './fiesta/musica.actions';
import * as ReposteriaModule from './fiesta/reposteria.actions';
import * as BebidasModule from './fiesta/bebidas.actions';
import * as CargaModule from './fiesta/carga-operativa.actions';
import * as CostosModule from './fiesta/costos.actions';
import * as FotografiaModule from './fiesta/fotografia.actions';
import * as DocumentosModule from './fiesta/documentos.actions';
import * as PagosModule from './fiesta/pagos.actions';
import * as ReunionesModule from './fiesta/reuniones.actions';
import * as CateringModule from './fiesta/catering.actions';
import * as VideoModule from './fiesta/video-vida.actions';
import * as RegalosModule from './fiesta/regalos.actions';
import type { 
  FiestaEnPlanificacion, 
  ModulosContratados, 
  Tarea, 
  Invitado, 
  MusicaFiesta, 
  ReposteriaData, 
  BebidasData, 
  ListaDeCargaOperativa, 
  GestionCostosData, 
  FotografiaYFilmacionData, 
  PagoProveedor, 
  Reunion, 
  ClientTarea, 
  ClientPortalSettings, 
  MenuMesaData, 
  NumerosMesaData,
  VideoVidaData,
  GiftItem
} from '@/types/fiesta';

// --- ACCIONES GENERALES ---
export async function getFiestaActual() { return await FiestaModule.getFiestaActual(); }
export async function getHistorialFiestas() { return await FiestaModule.getHistorialFiestas(); }
export async function getFiestas(includeArchived = true) { return await FiestaModule.getFiestas(includeArchived); }
export async function archiveFiesta(fiestaId: string) { return await FiestaModule.archiveFiesta(fiestaId); }
export async function deleteFiestaArchivada(fiestaId: string) { return await FiestaModule.deleteFiestaArchivada(fiestaId); }
export async function deleteFiesta(fiestaId: string) { return await FiestaModule.deleteFiesta(fiestaId); }
export async function resetFiestaActual() { return await FiestaModule.resetFiestaActual(); }
export async function resetAllActiveFiestas() { return await FiestaModule.resetAllActiveFiestas(); }
export async function deleteAllFiestas() { return await FiestaModule.deleteAllFiestas(); }
export async function createFiestaVacia() { return await FiestaModule.createFiestaVacia(); }
export async function getFiestaById(fiestaId: string) { return await FiestaModule.getFiestaById(fiestaId); }
export async function saveFiesta(fiestaData: FiestaEnPlanificacion) { return await FiestaModule.saveFiesta(fiestaData); }
export async function addInvoiceIdToFiestaActual(fiestaId: string, invoiceId: string) { return await FiestaModule.addInvoiceId(fiestaId, invoiceId); }
export async function removeInvoiceIdFromFiestaActual(fiestaId: string, invoiceId: string) { return await FiestaModule.removeInvoiceId(fiestaId, invoiceId); }
export async function duplicateFiesta(fiestaId: string) { return await FiestaModule.duplicateFiesta(fiestaId); }
export async function syncFiestaFromBudget(fiestaId: string) { return await FiestaModule.syncFiestaFromBudget(fiestaId); }
export async function updateFiestaPresupuestoId(fiestaId: string, presupuestoId: string | null) { return await FiestaModule.updateFiestaPresupuestoId(fiestaId, presupuestoId); }

// --- CONFIGURACIÓN Y MÓDULOS ---
export async function updateConfiguracionFiestaActual(fiestaId: string, config: any) { return await ConfigModule.updateConfiguracion(fiestaId, config); }
export async function updateModulosContratadosFiestaActual(fiestaId: string, modulos: ModulosContratados) {
    const fiesta = await FiestaModule.getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");
    const updatedFiesta = { ...fiesta, modulosContratados: modulos };
    return await FiestaModule.saveFiesta(updatedFiesta);
}

// --- GESTIÓN DE TAREAS ---
export async function updateTareasFiestaActual(fiestaId: string, tareas: Tarea[]) { return await TareasModule.updateTareas(fiestaId, tareas); }
export async function addTareaToFiestaActual(fiestaId: string, tareaData: Omit<Tarea, 'id' | 'completada'>) { return await TareasModule.addTarea(fiestaId, tareaData); }
export async function deleteTareaFromFiestaActual(fiestaId: string, tareaId: string) { return await TareasModule.deleteTarea(fiestaId, tareaId); }

// --- GESTIÓN DE INVITADOS ---
export async function getInvitadosFiestaActual(fiestaId: string) { return await InvitadosModule.getInvitados(fiestaId); }
export async function addInvitadoFiestaActual(fiestaId: string, nuevoInvitadoData: Omit<Invitado, 'id'>) { return await InvitadosModule.addInvitado(fiestaId, nuevoInvitadoData); }
export async function updateInvitadoFiestaActual(fiestaId: string, invitadoActualizado: Invitado) { return await InvitadosModule.updateInvitado(fiestaId, invitadoActualizado); }
export async function handleRsvpSubmissionFiestaActual(fiestaId: string, submission: any) { return await InvitadosModule.handleRsvpSubmission(fiestaId, submission); }
export async function checkInGuestFiestaActual(fiestaId: string, guestId: string) { return await InvitadosModule.checkInGuest(fiestaId, guestId); }
export async function deleteInvitadoFiestaActual(fiestaId: string, invitadoId: string) { return await InvitadosModule.deleteInvitado(fiestaId, invitadoId); }

// --- DECORACIÓN Y DISEÑO ---
export async function updateDecoracionFiestaActual(fiestaId: string, decoracion: any) { return await DecoracionModule.updateDecoracion(fiestaId, decoracion); }

// --- CRONOGRAMA ---
export async function updateProgramaFiestaActual(fiestaId: string, programa: any[]) { return await ItinerarioModule.updatePrograma(fiestaId, programa); }

// --- PERSONAL Y PAGOS ---
export async function updatePersonalFiestaActual(fiestaId: string, personal: any[]) { return await PersonalModule.updatePersonal(fiestaId, personal); }
export async function updatePagosProveedoresFiestaActual(fiestaId: string, pagos: PagoProveedor[]) { return await PagosModule.updatePagosProveedores(fiestaId, pagos); }

// --- PORTAL Y PÁGINA WEB ---
export async function updateClientChecklistFiestaActual(fiestaId: string, checklist: ClientTarea[]) { return await PortalModule.updateClientChecklist(fiestaId, checklist); }
export async function updateClientNotesFiestaActual(fiestaId: string, notes: string) { return await PortalModule.updateClientNotes(fiestaId, notes); }
export async function updatePortalSettingsFiestaActual(fiestaId: string, clientSettings: ClientPortalSettings) { return await PortalModule.updatePortalSettings(fiestaId, clientSettings); }

// --- MÚSICA Y REPOSTERÍA ---
export async function updateMusicaFiestaActual(fiestaId: string, musica: MusicaFiesta) { return await MusicaModule.updateMusica(fiestaId, musica); }
export async function saveSugerenciaMusicalFiestaActual(fiestaId: string, sugerencia: string) { return await MusicaModule.saveSugerenciaMusical(fiestaId, sugerencia); }
export async function updateReposteriaFiestaActual(fiestaId: string, reposteria: ReposteriaData) { return await ReposteriaModule.updateReposteria(fiestaId, reposteria); }
export async function updateBebidasFiestaActual(fiestaId: string, bebidas: BebidasData) { return await BebidasModule.updateBebidas(fiestaId, bebidas); }

// --- LOGÍSTICA Y COSTOS ---
export async function updateListaDeCargaOperativaFiestaActual(fiestaId: string, lista: ListaDeCargaOperativa) { return await CargaModule.updateListaDeCargaOperativa(fiestaId, lista); }
export async function updateGestionCostosFiestaActual(fiestaId: string, costos: GestionCostosData) { return await CostosModule.updateGestionCostos(fiestaId, costos); }

// --- FOTOGRAFÍA Y DOCUMENTOS ---
export async function updateFotografiaYFilmacionFiestaActual(fiestaId: string, fotografia: FotografiaYFilmacionData) { return await FotografiaModule.updateFotografiaYFilmacion(fiestaId, fotografia); }
export async function uploadDocumentoFiesta(formData: FormData) { return await DocumentosModule.uploadDocumento(formData); }
export async function deleteDocumentoFiesta(fiestaId: string, docId: string) { return await DocumentosModule.deleteDocumento(fiestaId, docId); }
export async function signContractDigitally(fiestaId: string, name: string) { return await DocumentosModule.signContractDigitally(fiestaId, name); }
export async function uploadPhysicalContract(formData: FormData) { return await DocumentosModule.uploadPhysicalContract(formData); }

// --- REUNIONES ---
export async function addReunionToFiestaActual(reunionData: Omit<Reunion, 'id'>) { return await ReunionesModule.addReunion(reunionData); }
export async function updateReunionInFiestaActual(updatedReunion: Reunion) { return await ReunionesModule.updateReunion(updatedReunion); }
export async function deleteReunionFromFiestaActual(fiestaId: string, reunionId: string) { return await ReunionesModule.deleteReunion(fiestaId, reunionId); }

// --- CATERING Y OTROS ---
export async function updateMenuAsignadoFiestaActual(fiestaId: string, menuId?: string) { return await CateringModule.updateMenuAsignado(fiestaId, menuId); }
export async function updateVideoVidaSettingsFiestaActual(videoVidaData: VideoVidaData) { return await VideoModule.updateVideoVidaSettings(videoVidaData); }
export async function claimGiftFiestaActual(fiestaId: string, giftId: string, guestName: string) { return await RegalosModule.claimGift(fiestaId, giftId, guestName); }
export async function addGiftToRegistryFiestaActual(fiestaId: string, newGiftData: Omit<GiftItem, 'id' | 'isClaimed'>) { return await RegalosModule.addGiftToRegistry(fiestaId, newGiftData); }

// --- SEÑALÉTICA E IMPRESIÓN ---
export async function updateMenuMesa(fiestaId: string, menuData: MenuMesaData) { return await FiestaModule.updateMenuMesa(fiestaId, menuData); }
export async function updateNumerosMesa(fiestaId: string, data: NumerosMesaData) { return await FiestaModule.updateNumerosMesa(fiestaId, data); }
export async function updateContratoFiestaActual(fiestaId: string, text: string) {
    const fiesta = await FiestaModule.getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");
    const updatedFiesta = { ...fiesta, contratoServicioTexto: text };
    return await FiestaModule.saveFiesta(updatedFiesta);
}
