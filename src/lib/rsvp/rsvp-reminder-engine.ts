import { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';

export interface RsvpReminderMessage {
  guestId: string;
  guestName: string;
  phone: string;
  message: string;
  rsvpLink: string;
}

export interface RsvpReminderConfig {
  daysBeforeEvent: number[];
  customMessage?: string;
}

export const defaultRsvpConfig: RsvpReminderConfig = {
  daysBeforeEvent: [15, 7, 2]
};

export function generateRsvpMessage(guestName: string, eventName: string, eventDate: string, rsvpLink: string, daysLeft: number): string {
  return `¡Hola ${guestName}! 🎉 Faltan ${daysLeft} días para ${eventName}. Confirmá tu asistencia acá: ${rsvpLink}`;
}

export function getPendingRsvpGuests(invitados: Invitado[]): Invitado[] {
  return invitados.filter(invitado => invitado.rsvp === 'Pendiente' && invitado.contacto);
}

export function buildRsvpReminders(fiesta: FiestaEnPlanificacion, baseUrl: string): RsvpReminderMessage[] {
  const pendingGuests = getPendingRsvpGuests(fiesta.invitados || []);
  const eventDate = new Date(fiesta.fecha);
  const now = new Date();
  const diffTime = Math.abs(eventDate.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return pendingGuests.map(guest => {
    const rsvpLink = `${baseUrl}/rsvp/${guest.guestAccessToken}`;
    const message = generateRsvpMessage(guest.nombre, fiesta.nombre, fiesta.fecha, rsvpLink, diffDays);

    return {
      guestId: guest.id,
      guestName: guest.nombre,
      phone: guest.contacto || '',
      message,
      rsvpLink
    };
  });
}
