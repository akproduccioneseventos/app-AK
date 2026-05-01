export type EventNextActionInput = {
  hasSignedContract?: boolean;
  balanceDue?: number;
  pendingRsvps?: number;
  overdueTasks?: number;
  missingVendors?: number;
  eventDate?: string | null;
};

export type EventNextAction = {
  id: string;
  label: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
};

function daysUntil(date?: string | null, now = new Date()) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function priorityFromDays(days: number | null): EventNextAction['priority'] {
  if (days === null) return 'medium';
  if (days <= 3) return 'urgent';
  if (days <= 14) return 'high';
  if (days <= 30) return 'medium';
  return 'low';
}

export function getEventNextActions(input: EventNextActionInput, now = new Date()): EventNextAction[] {
  const actions: EventNextAction[] = [];
  const days = daysUntil(input.eventDate, now);
  const timePriority = priorityFromDays(days);

  if (!input.hasSignedContract) {
    actions.push({
      id: 'contract',
      label: 'Cerrar o confirmar contrato del evento.',
      priority: timePriority,
    });
  }

  if ((input.balanceDue ?? 0) > 0) {
    actions.push({
      id: 'balance',
      label: 'Revisar saldo pendiente y proximo vencimiento.',
      priority: timePriority === 'low' ? 'medium' : timePriority,
    });
  }

  if ((input.pendingRsvps ?? 0) > 0) {
    actions.push({
      id: 'rsvp',
      label: `Faltan ${input.pendingRsvps} confirmacion(es) de invitados.`,
      priority: timePriority,
    });
  }

  if ((input.overdueTasks ?? 0) > 0) {
    actions.push({
      id: 'tasks',
      label: `Hay ${input.overdueTasks} tarea(s) vencida(s).`,
      priority: 'urgent',
    });
  }

  if ((input.missingVendors ?? 0) > 0) {
    actions.push({
      id: 'vendors',
      label: `Falta confirmar ${input.missingVendors} proveedor(es).`,
      priority: timePriority,
    });
  }

  const rank = { urgent: 0, high: 1, medium: 2, low: 3 };
  return actions.sort((a, b) => rank[a.priority] - rank[b.priority]);
}
