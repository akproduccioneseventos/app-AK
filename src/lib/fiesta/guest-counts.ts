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
