export type LiveBudgetItemKind = 'servicio' | 'menu' | 'entrada' | 'personal' | 'salon' | 'regalo' | 'extra';

export type LiveBudgetItem = {
  id: string;
  name: string;
  kind: LiveBudgetItemKind;
  quantity: number;
  unitPrice: number;
  isGift?: boolean;
  lockedAutomatic?: boolean;
  notes?: string;
};

export type LiveBudgetState = {
  eventType?: string;
  guestCount: number;
  items: LiveBudgetItem[];
  lastUpdatedAt: string;
};

export type LiveBudgetTotals = {
  subtotalReal: number;
  giftsCommercialValue: number;
  totalToCharge: number;
  editableItems: number;
  automaticItems: number;
};

function nowISO(): string {
  return new Date().toISOString();
}

function positiveNumber(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function normalizeQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.round(value));
}

function normalizeItem(item: LiveBudgetItem): LiveBudgetItem {
  return {
    ...item,
    quantity: normalizeQuantity(item.quantity),
    unitPrice: positiveNumber(item.unitPrice),
    isGift: item.isGift ?? false,
    lockedAutomatic: item.lockedAutomatic ?? false,
  };
}

export function createLiveBudgetState(input?: Partial<LiveBudgetState>): LiveBudgetState {
  return {
    eventType: input?.eventType,
    guestCount: normalizeQuantity(input?.guestCount ?? 0),
    items: (input?.items ?? []).map(normalizeItem),
    lastUpdatedAt: input?.lastUpdatedAt ?? nowISO(),
  };
}

export function addLiveBudgetItem(state: LiveBudgetState, item: LiveBudgetItem): LiveBudgetState {
  const normalized = normalizeItem(item);
  const existing = state.items.find(i => i.id === normalized.id);
  const items = existing
    ? state.items.map(i => i.id === normalized.id ? { ...i, quantity: i.quantity + normalized.quantity, unitPrice: normalized.unitPrice, isGift: normalized.isGift } : i)
    : [...state.items, normalized];

  return { ...state, items, lastUpdatedAt: nowISO() };
}

export function updateLiveBudgetItem(state: LiveBudgetState, itemId: string, patch: Partial<LiveBudgetItem>): LiveBudgetState {
  const items = state.items.map(item => {
    if (item.id !== itemId) return item;
    if (item.lockedAutomatic && (patch.name || patch.kind)) return item;
    return normalizeItem({ ...item, ...patch });
  });

  return { ...state, items, lastUpdatedAt: nowISO() };
}

export function removeLiveBudgetItem(state: LiveBudgetState, itemId: string): LiveBudgetState {
  return {
    ...state,
    items: state.items.filter(item => item.id !== itemId || item.lockedAutomatic),
    lastUpdatedAt: nowISO(),
  };
}

export function toggleLiveBudgetGift(state: LiveBudgetState, itemId: string, isGift?: boolean): LiveBudgetState {
  return updateLiveBudgetItem(state, itemId, {
    isGift: isGift ?? !state.items.find(item => item.id === itemId)?.isGift,
  });
}

export function calculateLiveBudgetTotals(state: LiveBudgetState): LiveBudgetTotals {
  return state.items.reduce<LiveBudgetTotals>((totals, item) => {
    const value = positiveNumber(item.unitPrice) * normalizeQuantity(item.quantity);
    if (item.isGift) {
      totals.giftsCommercialValue += value;
    } else {
      totals.subtotalReal += value;
      totals.totalToCharge += value;
    }

    if (item.lockedAutomatic) totals.automaticItems += 1;
    else totals.editableItems += 1;

    return totals;
  }, { subtotalReal: 0, giftsCommercialValue: 0, totalToCharge: 0, editableItems: 0, automaticItems: 0 });
}

export function applyAutomaticStaffByGuests(state: LiveBudgetState, options?: { mozoUnitPrice?: number; cocinaUnitPrice?: number; guestsPerStaff?: number }): LiveBudgetState {
  const guestsPerStaff = Math.max(1, options?.guestsPerStaff ?? 25);
  const staffCount = Math.max(1, Math.ceil(state.guestCount / guestsPerStaff));
  const mozoUnitPrice = positiveNumber(options?.mozoUnitPrice ?? 2990);
  const cocinaUnitPrice = positiveNumber(options?.cocinaUnitPrice ?? 2990);

  const withoutAutoStaff = state.items.filter(item => item.id !== 'auto_mozo' && item.id !== 'auto_mozo_cocina');
  return createLiveBudgetState({
    ...state,
    items: [
      ...withoutAutoStaff,
      { id: 'auto_mozo', name: 'Mozo automatico', kind: 'personal', quantity: staffCount, unitPrice: mozoUnitPrice, lockedAutomatic: true },
      { id: 'auto_mozo_cocina', name: 'Mozo de cocina automatico', kind: 'personal', quantity: staffCount, unitPrice: cocinaUnitPrice, lockedAutomatic: true },
    ],
  });
}

export function buildLiveBudgetEditChecklist(): string[] {
  return [
    'Elegir paquete o menu sin bloquear la edicion.',
    'Agregar mozos y dependencias automaticamente segun invitados.',
    'Permitir cambiar precio unitario, cantidad, regalo y notas en la misma pantalla.',
    'Ver total en vivo antes de pasar al resumen final.',
    'Volver desde el resumen a esta pantalla sin perder cambios.',
  ];
}
