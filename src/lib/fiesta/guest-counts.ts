type GuestCountInput = {
  partySize?: number;
  kidsCount?: number;
  categoria?: string;
};

export function getGuestPartySize(guest: GuestCountInput): number {
  const parsed = Number(guest.partySize);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.max(1, Math.round(parsed));
}

export function getGuestKidsCount(guest: GuestCountInput): number {
  const partySize = getGuestPartySize(guest);
  const parsed = Number(guest.kidsCount);
  if (guest.kidsCount !== undefined && Number.isFinite(parsed)) {
    return Math.max(0, Math.min(partySize, Math.round(parsed)));
  }
  return guest.categoria === 'Niño/Adolescente' ? partySize : 0;
}

export function getGuestAdultsCount(guest: GuestCountInput): number {
  return getGuestPartySize(guest) - getGuestKidsCount(guest);
}

type GuestStatusInput = GuestCountInput & { rsvp?: string; checkedIn?: boolean };

const personas = (guests: GuestStatusInput[]) =>
  guests.reduce((total, guest) => total + getGuestPartySize(guest), 0);

/**
 * Los numeros del portal del cliente, en PERSONAS y no en filas (Codex, auditoria 78): una
 * invitacion para cuatro son cuatro personas. Un invitado marcado como llegado cuenta con todo
 * su grupo, que es como lo marca la puerta.
 */
export function contarPersonasDelPortal(guests: GuestStatusInput[]) {
  const confirmados = guests.filter((g) => g.rsvp === 'Confirmado');
  const rechazados = guests.filter((g) => g.rsvp === 'Rechazado');
  const sinResponder = guests.filter((g) => g.rsvp !== 'Confirmado' && g.rsvp !== 'Rechazado');
  const llegaron = guests.filter((g) => g.checkedIn);
  return {
    confirmados: personas(confirmados),
    noVienen: personas(rechazados),
    sinResponder: personas(sinResponder),
    llegaron: personas(llegaron),
    faltanLlegar: personas(confirmados.filter((g) => !g.checkedIn)),
  };
}
