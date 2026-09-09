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

/**
 * EL ITINERARIO QUE SE LE MANDA AL CLIENTE.
 *
 * **Antes se le mandaba el programa entero.** Los momentos marcados como internos
 * -los que el equipo no quiere que el cliente vea- viajaban igual hasta su navegador,
 * y una de las dos pantallas del portal los mostraba tal cual. Aunque la pantalla los
 * escondiera, **ya estaban en su computadora**: esconder algo que ya se mando no es
 * esconderlo.
 *
 * Y habia un segundo agujero mas fino: cuando un momento no tenia texto para el
 * cliente, la pantalla usaba **la nota interna** como reemplazo. Asi es como una
 * anotacion del equipo termina leyendola el cliente.
 *
 * Ahora se filtra y se recorta ACA, en el servidor:
 *
 * - Sale solo lo que esta marcado como visible. **Lo que no dice nada se considera
 *   visible**, a proposito: los itinerarios viejos no tienen esa marca y ocultarlos
 *   todos de golpe le dejaria la pantalla vacia a los clientes de las fiestas que ya
 *   estan armadas.
 * - De cada momento se manda **solo lo que es para el cliente**: la hora, el titulo y
 *   su texto. La nota interna y el responsable no salen del servidor.
 *
 * Lo encontro Codex el 9 de septiembre de 2026.
 */
function mapProgramaParaElCliente(programa: any[] | undefined) {
  return (programa ?? [])
    .filter((item) => item?.visibleParaCliente !== false)
    .map((item) => ({
      id: item.id,
      hora: item.hora,
      titulo: item.titulo,
      descripcionCliente: item.descripcionCliente,
      icono: item.icono,
    }));
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
    programa: mapProgramaParaElCliente(fiesta.programa) as FiestaEnPlanificacion['programa'],
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
