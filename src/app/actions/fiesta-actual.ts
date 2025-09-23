
'use server';

import { 
    getFiestaActual,
    updateConfiguracion as updateConfiguracionFiestaActual 
} from './fiesta/configuracion.actions';
import { 
    addInvitado as addInvitadoFiestaActual,
    updateInvitado as updateInvitadoFiestaActual,
    deleteInvitado as deleteInvitadoFiestaActual,
    getInvitados as getInvitadosFiestaActual,
    handleRsvpSubmission,
    checkInGuest
} from './fiesta/invitados.actions';
import {
    updateTareas as updateTareasFiestaActual
} from './fiesta/tareas.actions';
import {
    updateDecoracion as updateDecoracionFiestaActual
} from './fiesta/decoracion.actions';
import {
    updateMenuAsignado as updateMenuAsignadoFiestaActual
} from './fiesta/catering.actions';
import {
    updateClientChecklist,
    updateClientNotes,
    updatePortalSettings
} from './fiesta/portal.actions';
import {
    updateMusica as updateMusicaFiestaActual
} from './fiesta/musica.actions';
import {
    updateReposteria as updateReposteriaFiestaActual
} from './fiesta/reposteria.actions';
import {
    updateBebidas as updateBebidasFiestaActual
} from './fiesta/bebidas.actions';
import {
    updateListaDeCargaOperativa
} from './fiesta/carga-operativa.actions';
import {
    updateGestionCostos as updateGestionCostosFiestaActual
} from './fiesta/costos.actions';
import {
    updateVideoVidaSettings
} from './fiesta/video-vida.actions';
import {
    updatePrograma as updateProgramaFiestaActual
} from './fiesta/itinerario.actions';
import {
    addReunion as addReunionToFiestaActual,
    updateReunion as updateReunionInFiestaActual,
    deleteReunion as deleteReunionFromFiestaActual
} from './fiesta/reuniones.actions';
import {
    updateFotografiaYFilmacion
} from './fiesta/fotografia.actions';
import {
    uploadDocumento as uploadDocumentoFiesta,
    deleteDocumento as deleteDocumentoFiesta
} from './fiesta/documentos.actions';
import {
    updatePagosProveedores
} from './fiesta/pagos.actions';
import {
    updatePersonal as updatePersonalFiestaActual
} from './fiesta/personal.actions';
import {
    updateGiftRegistry,
    claimGift
} from './fiesta/regalos.actions';
import {
    addInvoiceId as addInvoiceIdToFiestaActual,
    removeInvoiceId as removeInvoiceIdFromFiestaActual,
    archiveFiesta,
    getFiestaById,
    getFiestas,
    getAllFiestas,
    resetFiestaActual,
    saveFiesta,
    createNewFiestaForCustomer,
    getHistorialFiestas
} from './fiesta/fiesta.actions';

// Re-exporting all for backward compatibility during transition.
export {
    getFiestaActual,
    updateConfiguracionFiestaActual,
    addInvitadoFiestaActual,
    updateInvitadoFiestaActual,
    deleteInvitadoFiestaActual,
    getInvitadosFiestaActual,
    handleRsvpSubmission,
    checkInGuest,
    updateTareasFiestaActual,
    updateDecoracionFiestaActual,
    updateMenuAsignadoFiestaActual,
    updateClientChecklist,
    updateClientNotes,
    updatePortalSettings,
    updateMusicaFiestaActual,
    updateReposteriaFiestaActual,
    updateBebidasFiestaActual,
    updateListaDeCargaOperativa,
    updateGestionCostosFiestaActual,
    updateVideoVidaSettings,
    updateProgramaFiestaActual,
    addReunionToFiestaActual,
    updateReunionInFiestaActual,
    deleteReunionFromFiestaActual,
    updateFotografiaYFilmacion,
    uploadDocumentoFiesta,
    deleteDocumentoFiesta,
    updatePagosProveedores,
    updatePersonalFiestaActual,
    updateGiftRegistry,
    claimGift,
    addInvoiceIdToFiestaActual,
    removeInvoiceIdFromFiestaActual,
    archiveFiesta,
    getFiestaById,
    getFiestas,
    getAllFiestas,
    resetFiestaActual,
    saveFiesta,
    createNewFiestaForCustomer,
    getHistorialFiestas
}
