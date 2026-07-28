import type {
  ConfigEventoDataStorage,
  FiestaEnPlanificacion,
  GuestExperienceSettings,
  GuestPortalSettings,
  Invitado,
  MenuSeleccionPortal,
  ModulosContratados,
  ZonaDigitalAdolescentesSettings,
} from "@/types/fiesta";

export type PublicGuestEventConfig = Pick<
  ConfigEventoDataStorage,
  | "nombreEvento"
  | "nombreAgasajado"
  | "tipoCelebracion"
  | "fechaEvento"
  | "horaInicio"
  | "nombreLugar"
  | "direccionLugar"
  | "googleMapsUrl"
  | "primaryColor"
  | "instruccionesLlegada"
  | "infoEstacionamiento"
  | "rutaAccesibilidad"
  | "protocoloLluvia"
  | "mapaDelSalonUrl"
  | "telefonoAsistencia"
>;

export interface PublicGuestProgramItem {
  id: string;
  hora: string;
  titulo: string;
  descripcion?: string;
  icono?: string;
}

export interface PublicGuestEvent {
  configuracion: PublicGuestEventConfig;
  guestExperienceSettings?: GuestExperienceSettings;
  guestPortalSettings?: GuestPortalSettings;
  invitacionConfig?: {
    dressCode?: NonNullable<
      FiestaEnPlanificacion["invitacionConfig"]
    >["dressCode"];
    colorPrincipal?: string;
    fotoPortada?: string;
    rsvpActivo?: boolean;
  };
  invitacionSlug?: string;
  programa: PublicGuestProgramItem[];
  menuMesa?: {
    entrada?: string;
    platoPrincipal?: string;
    adolescentes?: string;
    postres?: string;
    bebidas?: string;
  };
  menuSeleccionPortal?: Pick<
    MenuSeleccionPortal,
    "entrada" | "principal" | "postre" | "bebidas"
  >;
  zonaDigitalAdolescentes?: ZonaDigitalAdolescentesSettings;
  modulosContratados?: ModulosContratados;
  galeriaUrl?: string;
}

export type PublicGuest = Pick<
  Invitado,
  | "id"
  | "nombre"
  | "rsvp"
  | "tableNumber"
  | "dietaryRestriction"
  | "alergiasEspecificas"
  | "cancionesDJ"
  | "mensaje"
  | "requiereAccesibilidad"
>;

export interface PublicGuestPortalData {
  fiesta: PublicGuestEvent;
  guest: PublicGuest;
}

export function buildPublicGuestEvent(
  fiesta: FiestaEnPlanificacion,
): PublicGuestEvent {
  const config = fiesta.configuracion;
  const invitation = fiesta.invitacionConfig;

  return {
    galeriaUrl: fiesta.galeriaUrl,
    configuracion: {
      nombreEvento: config.nombreEvento,
      nombreAgasajado: config.nombreAgasajado,
      tipoCelebracion: config.tipoCelebracion,
      fechaEvento: config.fechaEvento,
      horaInicio: config.horaInicio,
      nombreLugar: config.nombreLugar,
      direccionLugar: config.direccionLugar,
      googleMapsUrl: config.googleMapsUrl,
      primaryColor: config.primaryColor,
      instruccionesLlegada: config.instruccionesLlegada,
      infoEstacionamiento: config.infoEstacionamiento,
      rutaAccesibilidad: config.rutaAccesibilidad,
      protocoloLluvia: config.protocoloLluvia,
      mapaDelSalonUrl: config.mapaDelSalonUrl,
      telefonoAsistencia: config.telefonoAsistencia,
    },
    guestExperienceSettings: fiesta.guestExperienceSettings,
    guestPortalSettings: fiesta.guestPortalSettings,
    invitacionConfig: invitation
      ? {
          dressCode: invitation.dressCode,
          colorPrincipal: invitation.colorPrincipal,
          fotoPortada: invitation.fotoPortada,
          rsvpActivo: invitation.rsvpActivo,
        }
      : undefined,
    invitacionSlug: fiesta.invitacionSlug,
    programa: (fiesta.programa || [])
      .filter((item) => item.visibleParaCliente !== false)
      .map((item) => ({
        id: item.id,
        hora: item.hora,
        titulo: item.titulo,
        descripcion: item.descripcionCliente || item.descripcion,
        icono: item.icono,
      })),
    menuMesa: fiesta.menuMesa
      ? {
          entrada: fiesta.menuMesa.entrada,
          platoPrincipal: fiesta.menuMesa.platoPrincipal,
          adolescentes: fiesta.menuMesa.adolescentes,
          postres: fiesta.menuMesa.postres,
          bebidas: fiesta.menuMesa.bebidas,
        }
      : undefined,
    menuSeleccionPortal: fiesta.menuSeleccionPortal
      ? {
          entrada: fiesta.menuSeleccionPortal.entrada,
          principal: fiesta.menuSeleccionPortal.principal,
          postre: fiesta.menuSeleccionPortal.postre,
          bebidas: fiesta.menuSeleccionPortal.bebidas,
        }
      : undefined,
    zonaDigitalAdolescentes: fiesta.zonaDigitalAdolescentes,
    modulosContratados: fiesta.modulosContratados,
  };
}

export function buildPublicGuestPortalData(
  fiesta: FiestaEnPlanificacion,
  guestId: string,
  guestAccessToken: string,
): PublicGuestPortalData | null {
  const guest = (fiesta.invitados || []).find((item) => item.id === guestId);
  if (!guest || !guest.guestAccessToken || guest.guestAccessToken !== guestAccessToken) return null;

  return {
    fiesta: buildPublicGuestEvent(fiesta),
    guest: {
      id: guest.id,
      nombre: guest.nombre,
      rsvp: guest.rsvp,
      tableNumber: guest.tableNumber,
      dietaryRestriction: guest.dietaryRestriction,
      alergiasEspecificas: guest.alergiasEspecificas,
      cancionesDJ: guest.cancionesDJ,
      mensaje: guest.mensaje,
      requiereAccesibilidad: guest.requiereAccesibilidad,
    },
  };
}
