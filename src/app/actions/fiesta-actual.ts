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
import type { FiestaEnPlanificacion, ModulosContratados, Tarea, Invitado, MusicaFiesta, ReposteriaData, BebidasData, ListaDeCargaOperativa, GestionCostosData, FotografiaYFilmacionData, PagoProveedor, Reunion, ClientTarea, ClientPortalSettings, CartaTragosData, MenuMesaData, NumerosMesaData } from '@/types/fiesta';

// --- Re-exports using async function wrappers to avoid "found object" error in Server Actions ---

// General Fiesta Actions
export async function getFiestaActual() { return FiestaModule.getFiestaActual(); }
export async function getHistorialFiestas() { return FiestaModule.getHistorialFiestas(); }
export async function getFiestas(includeArchived = true) { return FiestaModule.getFiestas(includeArchived); }
export async function getAllFiestas() { return FiestaModule.getAllFiestas(); }
export async function archiveFiesta(fiestaId: string) { return FiestaModule.archiveFiesta(fiestaId); }
export async function deleteFiestaArchivada(fiestaId: string) { return FiestaModule.deleteFiestaArchivada(fiestaId); }
export async function deleteFiesta(fiestaId: string) { return FiestaModule.deleteFiesta(fiestaId); }
export async function resetFiestaActual() { return FiestaModule.resetFiestaActual(); }
export async function getFiestaById(fiestaId: string) { return FiestaModule.getFiestaById(fiestaId); }
export async function saveFiesta(fiestaData: FiestaEnPlanificacion) { return FiestaModule.saveFiesta(fiestaData); }
export async function addInvoiceIdToFiestaActual(fiestaId: string, invoiceId: string) { return FiestaModule.addInvoiceId(fiestaId, invoiceId); }
export async function removeInvoiceIdFromFiestaActual(fiestaId: string, invoiceId: string) { return FiestaModule.removeInvoiceId(fiestaId, invoiceId); }
export async function duplicateFiesta(fiestaId: string) { return FiestaModule.duplicateFiesta(fiestaId); }

// Configuration Actions
export async function updateConfiguracionFiestaActual(fiestaId: string, config: any) { return ConfigModule.updateConfiguracion(fiestaId, config); }
export async function updateModulosContratadosFiestaActual(fiestaId: string, modulos: ModulosContratados) {
    const fiesta = await FiestaModule.getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");
    const updatedFiesta = { ...fiesta, modulosContratados: modulos };
    return FiestaModule.saveFiesta(updatedFiesta);
}

// Contract Action
export async function updateContratoFiestaActual(fiestaId: string, text: string) {
    const fiesta = await FiestaModule.getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");
    const updatedFiesta = { ...fiesta, contratoServicioTexto: text };
    return FiestaModule.saveFiesta(updatedFiesta);
}

// Tareas Actions
export async function updateTareasFiestaActual(fiestaId: string, tareas: Tarea[]) { return TareasModule.updateTareas(fiestaId, tareas); }
export async function addTareaToFiestaActual(fiestaId: string, tareaData: Omit<Tarea, 'id' | 'completada'>) { return TareasModule.addTarea(fiestaId, tareaData); }
export async function deleteTareaFromFiestaActual(fiestaId: string, tareaId: string) { return TareasModule.deleteTarea(fiestaId, tareaId); }

// Invitados Actions
export async function getInvitadosFiestaActual(fiestaId: string) { return InvitadosModule.getInvitados(fiestaId); }
export async function addInvitadoFiestaActual(fiestaId: string, nuevoInvitadoData: Omit<Invitado, 'id'>) { return InvitadosModule.addInvitado(fiestaId, nuevoInvitadoData); }
export async function updateInvitadoFiestaActual(fiestaId: string, invitadoActualizado: Invitado) { return InvitadosModule.updateInvitado(fiestaId, invitadoActualizado); }
export async function handleRsvpSubmissionFiestaActual(fiestaId: string, submission: any) { return InvitadosModule.handleRsvpSubmission(fiestaId, submission); }
export async function checkInGuestFiestaActual(fiestaId: string, guestId: string) { return InvitadosModule.checkInGuest(fiestaId, guestId); }
export async function deleteInvitadoFiestaActual(fiestaId: string, invitadoId: string) { return InvitadosModule.deleteInvitado(fiestaId, invitadoId); }

// Decoracion Actions
export async function updateDecoracionFiestaActual(fiestaId: string, decoracion: any) { return DecoracionModule.updateDecoracion(fiestaId, decoracion); }

// Itinerario Actions
export async function updateProgramaFiestaActual(fiestaId: string, programa: any[]) { return ItinerarioModule.updatePrograma(fiestaId, programa); }

// Personal Actions
export async function updatePersonalFiestaActual(fiestaId: string, personal: any[]) { return PersonalModule.updatePersonal(fiestaId, personal); }

// Portal & Digital Invitation Actions
export async function updateClientChecklistFiestaActual(fiestaId: string, checklist: ClientTarea[]) { return PortalModule.updateClientChecklist(fiestaId, checklist); }
export async function updateClientNotesFiestaActual(fiestaId: string, notes: string) { return PortalModule.updateClientNotes(fiestaId, notes); }
export async function updatePortalSettingsFiestaActual(fiestaId: string, clientSettings: ClientPortalSettings) { return PortalModule.updatePortalSettings(fiestaId, clientSettings); }

// Musica Actions
export async function updateMusicaFiestaActual(fiestaId: string, musica: MusicaFiesta) { return MusicaModule.updateMusica(fiestaId, musica); }
export async function saveSugerenciaMusicalFiestaActual(fiestaId: string, sugerencia: string) { return MusicaModule.saveSugerenciaMusical(fiestaId, sugerencia); }

// Reposteria Actions
export async function updateReposteriaFiestaActual(fiestaId: string, reposteria: ReposteriaData) { return ReposteriaModule.updateReposteria(fiestaId, reposteria); }

// Bebidas Actions
export async function updateBebidasFiestaActual(fiestaId: string, bebidas: BebidasData) { return BebidasModule.updateBebidas(fiestaId, bebidas); }

// Carga Operativa Actions
export async function updateListaDeCargaOperativaFiestaActual(fiestaId: string, lista: ListaDeCargaOperativa) { return CargaModule.updateListaDeCargaOperativa(fiestaId, lista); }

// Costos Actions
export async function updateGestionCostosFiestaActual(fiestaId: string, costos: GestionCostosData) { return CostosModule.updateGestionCostos(fiestaId, costos); }

// Fotografia Actions
export async function updateFotografiaYFilmacionFiestaActual(fiestaId: string, fotografia: FotografiaYFilmacionData) { return FotografiaModule.updateFotografiaYFilmacion(fiestaId, fotografia); }

// Documentos Actions
export async function uploadDocumentoFiesta(formData: FormData) { return DocumentosModule.uploadDocumento(formData); }
export async function deleteDocumentoFiesta(fiestaId: string, docId: string) { return DocumentosModule.deleteDocumento(fiestaId, docId); }

// Pagos Proveedores Actions
export async function updatePagosProveedoresFiestaActual(fiestaId: string, pagos: PagoProveedor[]) { return PagosModule.updatePagosProveedores(fiestaId, pagos); }

// Reuniones Actions
export async function addReunionToFiestaActual(reunionData: Omit<Reunion, 'id'>) { return ReunionesModule.addReunion(reunionData); }
export async function updateReunionInFiestaActual(updatedReunion: Reunion) { return ReunionesModule.updateReunion(updatedReunion); }
export async function deleteReunionFromFiestaActual(fiestaId: string, reunionId: string) { return ReunionesModule.deleteReunion(fiestaId, reunionId); }

// Catering Actions
export async function updateMenuAsignadoFiestaActual(fiestaId: string, menuId?: string) { return CateringModule.updateMenuAsignado(fiestaId, menuId); }

// Video de Vida Actions
export async function updateVideoVidaSettingsFiestaActual(videoVidaData: VideoVidaData) { return VideoModule.updateVideoVidaSettings(videoVidaData); }

// Regalos Actions
export async function claimGiftFiestaActual(fiestaId: string, giftId: string, guestName: string) { return RegalosModule.claimGift(fiestaId, giftId, guestName); }
export async function addGiftToRegistryFiestaActual(fiestaId: string, newGiftData: Omit<GiftItem, 'id' | 'isClaimed'>) { return RegalosModule.addGiftToRegistry(fiestaId, newGiftData); }

// Carta Tragos / Menu Mesa Actions
export async function updateCartaTragos(fiestaId: string, cartaData: CartaTragosData) { return FiestaModule.updateCartaTragos(fiestaId, cartaData); }
export async function updateMenuMesa(fiestaId: string, menuData: MenuMesaData) { return FiestaModule.updateMenuMesa(fiestaId, menuData); }
export async function updateNumerosMesa(fiestaId: string, data: NumerosMesaData) { return FiestaModule.updateNumerosMesa(fiestaId, data); }
