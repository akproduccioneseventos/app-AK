export type LeadPriorityInput = {
  estimatedValue?: number | null;
  eventDate?: string | null;
  lastContactAt?: string | null;
  stage?: string | null;
};

export type LeadPriorityResult = {
  score: number;
  level: 'low' | 'medium' | 'high' | 'urgent';
  reasons: string[];
};

function daysBetween(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getLeadPriority(input: LeadPriorityInput, now = new Date()): LeadPriorityResult {
  const reasons: string[] = [];
  let score = 0;
  const estimatedValue = Math.max(0, input.estimatedValue ?? 0);
  const eventDate = parseDate(input.eventDate);
  const lastContactAt = parseDate(input.lastContactAt);
  const stage = input.stage?.toLowerCase() ?? '';

  if (estimatedValue >= 5000) {
    score += 25;
    reasons.push('Presupuesto estimado alto.');
  } else if (estimatedValue >= 2000) {
    score += 15;
    reasons.push('Presupuesto estimado medio.');
  }

  if (eventDate) {
    const daysToEvent = daysBetween(now, eventDate);
    if (daysToEvent <= 14) {
      score += 35;
      reasons.push('Evento muy cercano.');
    } else if (daysToEvent <= 45) {
      score += 20;
      reasons.push('Evento cercano.');
    }
  }

  if (lastContactAt) {
    const daysWithoutContact = daysBetween(lastContactAt, now);
    if (daysWithoutContact >= 7) {
      score += 25;
      reasons.push('Hace muchos dias que no se contacta.');
    } else if (daysWithoutContact >= 3) {
      score += 10;
      reasons.push('Conviene hacer seguimiento.');
    }
  } else {
    score += 15;
    reasons.push('No hay ultimo contacto registrado.');
  }

  if (['nuevo', 'new'].includes(stage)) {
    score += 10;
    reasons.push('Lead nuevo.');
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const level =
    finalScore >= 75 ? 'urgent' :
    finalScore >= 50 ? 'high' :
    finalScore >= 25 ? 'medium' :
    'low';

  return {
    score: finalScore,
    level,
    reasons: reasons.length > 0 ? reasons : ['Sin senales de urgencia.'],
  };
}
