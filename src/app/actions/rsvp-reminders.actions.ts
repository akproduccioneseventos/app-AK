'use server';

import { getFiestaById } from '@/app/actions/fiesta-actual';
import { buildRsvpReminders, getPendingRsvpGuests } from '@/lib/rsvp/rsvp-reminder-engine';

export async function getRsvpReminderPreview(fiestaId: string) {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) {
    throw new Error('Fiesta not found');
  }

  // Assuming baseUrl can be fetched from env or constructed, using a placeholder for now
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const pendingGuests = getPendingRsvpGuests(fiesta.invitados || []);
  const messages = buildRsvpReminders(fiesta, baseUrl);

  const totalGuests = (fiesta.invitados || []).length;
  const confirmados = (fiesta.invitados || []).filter(g => g.rsvp === 'Confirmado').length;
  const rechazados = (fiesta.invitados || []).filter(g => g.rsvp === 'No Asistirá').length;

  return {
    pendingGuests,
    messages,
    stats: {
      totalGuests,
      confirmados,
      rechazados,
      pendientes: pendingGuests.length
    }
  };
}

export async function generateWhatsAppRsvpLink(guestName: string, phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  // Strip non-numeric characters from phone
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
