'use server';

import { getFiestaById } from '@/app/actions/fiesta-actual';
import { buildRsvpReminders, getPendingRsvpGuests } from '@/lib/rsvp/rsvp-reminder-engine';
import { requireAppSession } from '@/lib/auth/require-session';
import type { PublicGuest } from '@/lib/guest-portal-public-data';

export async function getRsvpReminderPreview(fiestaId: string) {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) {
    throw new Error('Fiesta not found');
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://akproducciones.uy';

  const pendingGuests = getPendingRsvpGuests(fiesta.invitados || []);
  const messages = buildRsvpReminders(fiesta, baseUrl);

  const totalGuests = (fiesta.invitados || []).length;
  const confirmados = (fiesta.invitados || []).filter((g: PublicGuest) => g.rsvp === 'Confirmado').length;
  const rechazados = (fiesta.invitados || []).filter((g: PublicGuest) => g.rsvp === 'Rechazado').length;

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

export async function generateWhatsAppRsvpLink(guestName: string, phone: string, message: string): Promise<string> {
  await requireAppSession();
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
