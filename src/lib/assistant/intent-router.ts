/**
 * Router de intenciones del Asistente AK.
 *
 * Detecta intenciones claras en mensajes de texto ANTES de llamar a Gemini,
 * permitiendo ejecutar acciones de forma determinista para los casos más comunes.
 *
 * Intenciones soportadas:
 *  - schedule_meeting  → "Agendame una cita con Norma mañana a las 15"
 *  - create_budget     → (alta confianza cuando hay nombre + tipo + servicios claros)
 *  - none              → no se detectó intención clara (pasar a Gemini)
 */

import { parseDateTimeUY } from './date-parser';

export type RouterIntentType =
  | 'schedule_meeting'
  | 'none';

export interface RouterDetectedIntent {
  type: RouterIntentType;
  confidence: 'high' | 'medium' | 'low';
  data: {
    name?: string;
    followUpDate?: string;
    time?: string;
    notes?: string;
  };
}

// ── Patrones de scheduling ───────────────────────────────────────────────────

/** Verbos que indican una intención de agendar. */
const SCHEDULE_VERB_REGEX =
  /\b(agend[aáe](?:me)?|agenda(?:me)?r?|cita\s+con|reuni[oó]n\s+(?:con|para))\b/i;

/** Extrae el nombre de persona de una frase de scheduling. */
const NAME_FROM_SCHEDULE_REGEX =
  /(?:agend[aá](?:me)?\s+(?:una?\s+(?:cita|reuni[oó]n)\s+)?(?:con|a|para)\s+|cita\s+(?:con|para)\s+|reuni[oó]n\s+(?:con|para)\s+)([A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+){0,2}?)(?=\s+a\s+las|\s+para|\s+el\s+\d{1,2}|\s+hoy|\s+mañana|\s+\d|$)/i;

/** Patrón alternativo: "Agenda a Norma" sin preposición "con/para". */
const AGENDA_A_NAME_REGEX =
  /\bagend[aá](?:me)?\s+a\s+([A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+){0,2}?)(?=\s+a\s+las|\s+para|\s+el\s+\d{1,2}|\s+hoy|\s+mañana|$)/i;

/** Patrón para "Agendar a Norma" / "Agendar Norma". */
const AGENDAR_NAME_REGEX =
  /\bagendar\s+(?:a\s+)?([A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+){0,2}?)(?=\s+a\s+las|\s+para|\s+el\s+\d{1,2}|\s+hoy|\s+mañana|$)/i;

function toTitleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

/** Extrae el nombre de persona de un mensaje de scheduling. */
function extractScheduleName(message: string): string | undefined {
  for (const pat of [NAME_FROM_SCHEDULE_REGEX, AGENDA_A_NAME_REGEX, AGENDAR_NAME_REGEX]) {
    const m = message.match(pat);
    if (m?.[1]) return toTitleCase(m[1].trim());
  }
  return undefined;
}

// ── Función principal ────────────────────────────────────────────────────────

/**
 * Analiza el mensaje y devuelve la intención detectada.
 * Si la intención es 'none', se debe llamar a Gemini.
 *
 * @param message - Mensaje del usuario.
 * @param referenceDate - Fecha de referencia para parsear fechas relativas (por defecto: hoy).
 */
export function detectIntent(
  message: string,
  referenceDate?: Date,
): RouterDetectedIntent {
  const trimmed = message.trim();
  if (!trimmed) return { type: 'none', confidence: 'low', data: {} };

  // ── Scheduling ─────────────────────────────────────────────────────────────
  if (SCHEDULE_VERB_REGEX.test(trimmed)) {
    const name = extractScheduleName(trimmed);
    const { date, time } = parseDateTimeUY(trimmed, referenceDate);

    if (name) {
      const notes: string[] = [];
      if (time) notes.push(`Hora solicitada: ${time}`);

      // Alta confianza cuando tenemos nombre + (fecha o hora)
      const confidence: 'high' | 'medium' = date || time ? 'high' : 'medium';

      return {
        type: 'schedule_meeting',
        confidence,
        data: {
          name,
          followUpDate: date,
          time,
          notes: notes.length > 0 ? notes.join('; ') : undefined,
        },
      };
    }
  }

  return { type: 'none', confidence: 'low', data: {} };
}
