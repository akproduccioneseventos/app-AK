export type RsvpProStatus = 'pendiente' | 'confirmado' | 'no_asiste' | 'tal_vez' | 'cancelacion_solicitada';

export type RsvpProGuestKind = 'adulto' | 'adolescente' | 'nino' | 'staff' | 'proveedor';

export type RsvpProGuest = {
  id: string;
  fullName: string;
  kind: RsvpProGuestKind;
  groupId?: string;
  status: RsvpProStatus;
  canSelfConfirm: boolean;
  canCancel: boolean;
  allowPlusOne: false;
  confirmedAt?: string;
  cancelledAt?: string;
  notes?: string;
  dietaryRestrictions?: string;
  songSuggestion?: string;
  messageToHost?: string;
};

export type RsvpProGroup = {
  id: string;
  label: string;
  guestIds: string[];
  locked: true;
  maxConfirmations: number;
};

export type RsvpProUpdateInput = {
  guestId: string;
  status: Exclude<RsvpProStatus, 'cancelacion_solicitada'>;
  notes?: string;
  dietaryRestrictions?: string;
  songSuggestion?: string;
  messageToHost?: string;
  now?: string;
};

export type RsvpProCancelInput = {
  guestId: string;
  reason?: string;
  now?: string;
  allowDirectCancel?: boolean;
};

export type RsvpProResult = {
  ok: boolean;
  guests: RsvpProGuest[];
  message: string;
  requiresOrganizerReview?: boolean;
};

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function buildRsvpProGuest(input: {
  id: string;
  fullName: string;
  kind?: RsvpProGuestKind;
  groupId?: string;
  canCancel?: boolean;
}): RsvpProGuest {
  return {
    id: input.id,
    fullName: normalizeName(input.fullName),
    kind: input.kind ?? 'adulto',
    groupId: input.groupId,
    status: 'pendiente',
    canSelfConfirm: true,
    canCancel: input.canCancel ?? true,
    allowPlusOne: false,
  };
}

export function buildLockedRsvpGroup(input: {
  id: string;
  label: string;
  guestIds: string[];
}): RsvpProGroup {
  return {
    id: input.id,
    label: normalizeName(input.label),
    guestIds: Array.from(new Set(input.guestIds)),
    locked: true,
    maxConfirmations: Array.from(new Set(input.guestIds)).length,
  };
}

export function updateRsvpProGuest(
  guests: RsvpProGuest[],
  input: RsvpProUpdateInput
): RsvpProResult {
  const now = input.now ?? new Date().toISOString();
  const target = guests.find(guest => guest.id === input.guestId);

  if (!target) {
    return { ok: false, guests, message: 'Invitado no encontrado.' };
  }

  if (!target.canSelfConfirm) {
    return { ok: false, guests, message: 'Este invitado no puede confirmar desde el link público.' };
  }

  const updated = guests.map(guest => {
    if (guest.id !== input.guestId) return guest;
    return {
      ...guest,
      status: input.status,
      notes: input.notes ?? guest.notes,
      dietaryRestrictions: input.dietaryRestrictions ?? guest.dietaryRestrictions,
      songSuggestion: input.songSuggestion ?? guest.songSuggestion,
      messageToHost: input.messageToHost ?? guest.messageToHost,
      confirmedAt: input.status === 'confirmado' ? now : guest.confirmedAt,
      cancelledAt: input.status === 'no_asiste' ? now : guest.cancelledAt,
    };
  });

  return {
    ok: true,
    guests: updated,
    message: input.status === 'confirmado'
      ? 'Asistencia confirmada correctamente.'
      : input.status === 'no_asiste'
        ? 'Asistencia marcada como no asiste.'
        : 'Respuesta registrada correctamente.',
  };
}

export function requestRsvpCancellation(
  guests: RsvpProGuest[],
  input: RsvpProCancelInput
): RsvpProResult {
  const now = input.now ?? new Date().toISOString();
  const target = guests.find(guest => guest.id === input.guestId);

  if (!target) {
    return { ok: false, guests, message: 'Invitado no encontrado.' };
  }

  if (!target.canCancel) {
    return { ok: false, guests, message: 'La cancelacion de este invitado debe revisarla AK Producciones.' };
  }

  const directCancel = input.allowDirectCancel === true;
  const updated = guests.map(guest => {
    if (guest.id !== input.guestId) return guest;
    return {
      ...guest,
      status: directCancel ? 'no_asiste' : 'cancelacion_solicitada',
      cancelledAt: now,
      notes: input.reason ? `Cancelacion: ${input.reason}` : guest.notes,
    };
  });

  return {
    ok: true,
    guests: updated,
    message: directCancel
      ? 'Cancelacion registrada.'
      : 'Cancelacion solicitada. AK Producciones revisara el cambio.',
    requiresOrganizerReview: !directCancel,
  };
}

export function getRsvpProGroupGuests(guests: RsvpProGuest[], group: RsvpProGroup): RsvpProGuest[] {
  const ids = new Set(group.guestIds);
  return guests.filter(guest => ids.has(guest.id));
}

export function canAddUnauthorizedCompanion(): false {
  return false;
}

export function getRsvpProSummary(guests: RsvpProGuest[]) {
  return guests.reduce(
    (summary, guest) => {
      summary.total += 1;
      summary[guest.status] += 1;
      return summary;
    },
    {
      total: 0,
      pendiente: 0,
      confirmado: 0,
      no_asiste: 0,
      tal_vez: 0,
      cancelacion_solicitada: 0,
    } as Record<RsvpProStatus | 'total', number>
  );
}

export function buildRsvpProHelperText(): string {
  return 'Cada invitado confirma su propia asistencia. No se permiten acompañantes libres: si una familia tiene 5 personas, se cargan 5 invitados autorizados o un grupo familiar bloqueado.';
}
