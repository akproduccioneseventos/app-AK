export type PortalHealthStatus = 'ready' | 'attention' | 'critical';

export type PortalHealthInput = {
  eventDate?: string | null;
  totalDue?: number | null;
  totalPaid?: number | null;
  pendingApprovals?: number | null;
  pendingClientTasks?: number | null;
  missingSections?: string[];
};

export type PortalHealthResult = {
  score: number;
  status: PortalHealthStatus;
  messages: string[];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasPastDate(date?: string | null) {
  if (!date) return false;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < Date.now();
}

export function getClientPortalHealth(input: PortalHealthInput): PortalHealthResult {
  const messages: string[] = [];
  let score = 100;

  const totalDue = Math.max(0, input.totalDue ?? 0);
  const totalPaid = Math.max(0, input.totalPaid ?? 0);
  const pendingApprovals = Math.max(0, input.pendingApprovals ?? 0);
  const pendingClientTasks = Math.max(0, input.pendingClientTasks ?? 0);
  const missingSections = input.missingSections ?? [];

  if (!input.eventDate) {
    score -= 20;
    messages.push('Falta fecha del evento.');
  } else if (hasPastDate(input.eventDate)) {
    score -= 15;
    messages.push('La fecha del evento ya paso o esta mal cargada.');
  }

  if (totalDue > totalPaid) {
    score -= 20;
    messages.push('Hay saldo pendiente visible para el cliente.');
  }

  if (pendingApprovals > 0) {
    score -= Math.min(20, pendingApprovals * 5);
    messages.push(`Hay ${pendingApprovals} aprobacion(es) pendiente(s).`);
  }

  if (pendingClientTasks > 0) {
    score -= Math.min(15, pendingClientTasks * 3);
    messages.push(`Hay ${pendingClientTasks} tarea(s) del cliente pendiente(s).`);
  }

  if (missingSections.length > 0) {
    score -= Math.min(25, missingSections.length * 5);
    messages.push(`Faltan secciones: ${missingSections.join(', ')}.`);
  }

  const finalScore = clampScore(score);
  const status: PortalHealthStatus =
    finalScore >= 85 ? 'ready' : finalScore >= 55 ? 'attention' : 'critical';

  return {
    score: finalScore,
    status,
    messages: messages.length > 0 ? messages : ['El portal esta listo para revisar con el cliente.'],
  };
}
