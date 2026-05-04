export type PortalLedSelectionStatus = 'pendiente' | 'interesa' | 'incluido' | 'regalo' | 'descartado';

export type PortalLedSelectedItem = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  quantity?: number;
  estimatedUnitPrice?: number;
  status: PortalLedSelectionStatus;
  notes?: string;
};

export type PortalLedSession = {
  id: string;
  eventType?: string;
  guests?: number;
  selectedItems: PortalLedSelectedItem[];
  createdAt?: string;
  updatedAt?: string;
};

const BUDGET_READY_STATUSES = new Set<PortalLedSelectionStatus>(['interesa', 'incluido', 'regalo']);

function normalizeQuantity(value?: number): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) return undefined;
  return Math.max(0, Math.round(value));
}

function normalizePrice(value?: number): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) return undefined;
  return Math.max(0, value);
}

export function normalizePortalLedSelectedItem(item: PortalLedSelectedItem): PortalLedSelectedItem {
  return {
    ...item,
    name: item.name.trim(),
    category: item.category.trim(),
    subcategory: item.subcategory?.trim() || undefined,
    quantity: normalizeQuantity(item.quantity),
    estimatedUnitPrice: normalizePrice(item.estimatedUnitPrice),
    notes: item.notes?.trim() || undefined,
  };
}

export function getPortalLedBudgetReadyItems(session: PortalLedSession): PortalLedSelectedItem[] {
  return (session.selectedItems || [])
    .map(normalizePortalLedSelectedItem)
    .filter((item) => item.id && item.name && item.category && BUDGET_READY_STATUSES.has(item.status));
}

export function createPortalLedSession(input: Partial<PortalLedSession> & { id: string }): PortalLedSession {
  const now = new Date().toISOString();
  return {
    id: input.id,
    eventType: input.eventType,
    guests: normalizeQuantity(input.guests),
    selectedItems: (input.selectedItems || []).map(normalizePortalLedSelectedItem),
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

export function updatePortalLedSelectedItem(
  session: PortalLedSession,
  itemId: string,
  patch: Partial<PortalLedSelectedItem>
): PortalLedSession {
  return {
    ...session,
    selectedItems: session.selectedItems.map((item) =>
      item.id === itemId ? normalizePortalLedSelectedItem({ ...item, ...patch }) : item
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function buildPortalLedSalesFlowChecklist(): string[] {
  return [
    'Marcar cada servicio como pendiente, interesa, incluido, regalo o descartado.',
    'Pasar al presupuesto solo lo que el cliente pidio o lo que AK regala.',
    'Mantener cantidad, precio estimado y notas para revisar antes de cerrar.',
    'No bloquear el build si la entrevista LED aun no tiene items seleccionados.',
  ];
}
