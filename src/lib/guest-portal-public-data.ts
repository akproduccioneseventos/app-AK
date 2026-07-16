import type {
  ConfigEventoDataStorage,
  FiestaEnPlanificacion,
  GuestExperienceSettings,
  GuestPortalSettings,
  Invitado,
} from "@/types/fiesta";

export type PublicGuestEventConfig = Pick<
  ConfigEventoDataStorage,
  | "nombreEvento"
  | "tipoCelebracion"
  | "fechaEvento"
  | "horaInicio"
  | "nombreLugar"
  | "direccionLugar"
  | "googleMapsUrl"
  | "primaryColor"
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
  };
  invitacionSlug?: string;
  programa: PublicGuestProgramItem[];
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
  | "guestAccessToken"
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
    configuracion: {
      nombreEvento: config.nombreEvento,
      tipoCelebracion: config.tipoCelebracion,
      fechaEvento: config.fechaEvento,
      horaInicio: config.horaInicio,
      nombreLugar: config.nombreLugar,
      direccionLugar: config.direccionLugar,
      googleMapsUrl: config.googleMapsUrl,
      primaryColor: config.primaryColor,
    },
    guestExperienceSettings: fiesta.guestExperienceSettings,
    guestPortalSettings: fiesta.guestPortalSettings,
    invitacionConfig: invitation
      ? {
          dressCode: invitation.dressCode,
          colorPrincipal: invitation.colorPrincipal,
          fotoPortada: invitation.fotoPortada,
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
  };
}

export function buildPublicGuestPortalData(
  fiesta: FiestaEnPlanificacion,
  guestId: string,
): PublicGuestPortalData | null {
  const guest = (fiesta.invitados || []).find((item) => item.id === guestId);
  if (!guest) return null;

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
      guestAccessToken: guest.guestAccessToken,
    },
  };
}
