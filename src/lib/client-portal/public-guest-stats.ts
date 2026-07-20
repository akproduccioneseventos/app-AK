import type { PortalGuest } from './client-portal-summary';

export function toPublicGuestStatsInput(guests: unknown): PortalGuest[] {
  if (!Array.isArray(guests)) return [];

  return guests.map((guest) => {
    const record = guest && typeof guest === 'object' ? guest as Record<string, unknown> : {};
    const partySize = Math.max(1, Math.min(20, Math.round(Number(record.partySize) || 1)));

    return {
      rsvp: typeof record.rsvp === 'string' ? record.rsvp : 'pendiente',
      partySize,
    };
  });
}
