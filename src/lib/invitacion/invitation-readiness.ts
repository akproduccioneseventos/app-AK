export type InvitationReadinessInput = {
  title?: string | null;
  eventDate?: string | null;
  venue?: string | null;
  rsvpEnabled?: boolean;
  whatsappShareEnabled?: boolean;
  calendarEnabled?: boolean;
  qrEnabled?: boolean;
  galleryEnabled?: boolean;
};

export type InvitationReadinessResult = {
  score: number;
  readyToShare: boolean;
  missing: string[];
  suggestions: string[];
};

function hasValue(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

function validDate(value?: string | null) {
  if (!hasValue(value)) return false;
  const date = new Date(value as string);
  return !Number.isNaN(date.getTime());
}

export function getInvitationReadiness(input: InvitationReadinessInput): InvitationReadinessResult {
  const missing: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (!hasValue(input.title)) {
    score -= 20;
    missing.push('titulo');
  }

  if (!validDate(input.eventDate)) {
    score -= 20;
    missing.push('fecha');
  }

  if (!hasValue(input.venue)) {
    score -= 20;
    missing.push('lugar');
  }

  if (!input.rsvpEnabled) {
    score -= 15;
    suggestions.push('Activar RSVP para confirmar asistencia.');
  }

  if (!input.whatsappShareEnabled) {
    score -= 10;
    suggestions.push('Activar compartir por WhatsApp.');
  }

  if (!input.calendarEnabled) {
    score -= 5;
    suggestions.push('Agregar boton de calendario.');
  }

  if (!input.qrEnabled) {
    score -= 5;
    suggestions.push('Agregar QR para entrada o check-in.');
  }

  if (!input.galleryEnabled) {
    suggestions.push('La galeria puede quedar apagada si el evento aun no la necesita.');
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    readyToShare: finalScore >= 75 && missing.length === 0,
    missing,
    suggestions,
  };
}
