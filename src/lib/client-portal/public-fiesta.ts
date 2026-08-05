import type { FiestaEnPlanificacion } from '@/types/fiesta';

function mapDocument(doc: any) {
  return {
    id: doc.id,
    fileName: doc.fileName,
    nombre: doc.nombre,
    titulo: doc.titulo,
    tipo: doc.tipo,
  };
}

function mapGuest(guest: any) {
  return {
    id: guest.id,
    nombre: guest.nombre,
    categoria: guest.categoria,
    rsvp: guest.rsvp,
    partySize: guest.partySize,
    tableNumber: guest.tableNumber,
    companionNames: guest.companionNames,
    isCeliac: guest.isCeliac,
    dietaryRestriction: guest.dietaryRestriction,
    alergiasEspecificas: guest.alergiasEspecificas,
    requiereAccesibilidad: guest.requiereAccesibilidad,
  };
}

export function mapFiestaToClientPortal(fiesta: FiestaEnPlanificacion | null): FiestaEnPlanificacion | null {
  if (!fiesta) return null;

  const legacyFiesta = fiesta as FiestaEnPlanificacion & {
    documentos?: any[];
    otrosDocumentos?: any[];
  };
  const { accessKey: _accessKey, clientPassword: _clientPassword, ...portalSettings } = fiesta.clientPortalSettings ?? {} as any;
  const decoration = fiesta.decoracion;

  return {
    id: fiesta.id,
    presupuestoId: fiesta.presupuestoId,
    configuracion: fiesta.configuracion ? {
      clienteId: fiesta.configuracion.clienteId,
      clienteNombre: fiesta.configuracion.clienteNombre,
      nombreEvento: fiesta.configuracion.nombreEvento,
      fechaEvento: fiesta.configuracion.fechaEvento,
      horaInicio: fiesta.configuracion.horaInicio,
      horaFin: fiesta.configuracion.horaFin,
      nombreLugar: fiesta.configuracion.nombreLugar,
      direccionLugar: fiesta.configuracion.direccionLugar,
      invitadosEstimados: fiesta.configuracion.invitadosEstimados,
      tipoCelebracion: fiesta.configuracion.tipoCelebracion,
      primaryColor: fiesta.configuracion.primaryColor,
      protagonistaFotoUrl: fiesta.configuracion.protagonistaFotoUrl,
    } as FiestaEnPlanificacion['configuracion'] : {} as FiestaEnPlanificacion['configuracion'],
    clientPortalSettings: portalSettings as FiestaEnPlanificacion['clientPortalSettings'],
    clientePortalExperience: fiesta.clientePortalExperience,
    modulosContratados: fiesta.modulosContratados,
    contratoDatos: fiesta.contratoDatos ? {
      senia: fiesta.contratoDatos.senia,
      saldo: fiesta.contratoDatos.saldo,
      ajusteAnualPorcentaje: fiesta.contratoDatos.ajusteAnualPorcentaje,
      fechaFirmaContrato: fiesta.contratoDatos.fechaFirmaContrato,
      planPagos: fiesta.contratoDatos.planPagos,
    } : undefined,
    planDePagos: fiesta.planDePagos,
    clientChecklist: fiesta.clientChecklist ?? [],
    clientNotes: fiesta.clientNotes ?? '',
    faqPortal: fiesta.faqPortal ?? [],
    menuSeleccionPortal: fiesta.menuSeleccionPortal ?? {},
    menuMesa: fiesta.menuMesa,
    listaMusicaPortal: fiesta.listaMusicaPortal ?? {},
    musica: fiesta.musica,
    decoracion: decoration ? {
      tema: decoration.tema,
      paletaColores: decoration.paletaColores,
      moodboardItems: decoration.moodboardItems,
      moodboardImageUrl: decoration.moodboardImageUrl,
      moodboardImages: decoration.moodboardImages,
      colorCubremantel: decoration.colorCubremantel,
      colorGlobos: decoration.colorGlobos,
      decoracionTorta: decoration.decoracionTorta,
      generalNotesDecoracion: decoration.generalNotesDecoracion,
      colorPalette: decoration.colorPalette,
      estiloDecoracion: decoration.estiloDecoracion,
    } : undefined,
    socialGallerySettings: fiesta.socialGallerySettings,
    timeline: fiesta.timeline ?? [],
    invitados: (fiesta.invitados ?? []).map(mapGuest),
    reuniones: fiesta.reuniones ?? [],
    programa: fiesta.programa ?? [],
    videoVida: fiesta.videoVida ? {
      galleryEnabled: fiesta.videoVida.galleryEnabled,
      photoCount: fiesta.videoVida.photoCount,
    } : {},
    fotografiaYFilmacion: fiesta.fotografiaYFilmacion ? {
      notasGenerales: fiesta.fotografiaYFilmacion.notasGenerales,
    } : {},
    clientMenuChangeRequests: fiesta.clientMenuChangeRequests ?? [],
    clientServiceChangeRequests: fiesta.clientServiceChangeRequests ?? [],
    clienteDebeLlevar: fiesta.clienteDebeLlevar ?? [],
    contratoFirmaInfo: fiesta.contratoFirmaInfo ? {
      isSigned: fiesta.contratoFirmaInfo.isSigned,
    } : {},
    contratoServicioTexto: fiesta.contratoServicioTexto ?? '',
    documentos: (legacyFiesta.documentos ?? []).map(mapDocument),
    otrosDocumentos: (legacyFiesta.otrosDocumentos ?? []).map(mapDocument),
    othersDocumentos: (fiesta.othersDocumentos ?? []).map(mapDocument),
    clientPaymentNotifications: (fiesta.clientPaymentNotifications ?? []).map(notification => ({
      id: notification.id,
      monto: notification.monto,
      estado: notification.estado,
      timestamp: notification.timestamp,
      comprobanteNombre: notification.comprobanteNombre,
    })),
    personalAsignado: [],
  } as unknown as FiestaEnPlanificacion;
}
