/**
 * Router de intenciones del Asistente AK.
 *
 * Detecta intenciones claras en mensajes de texto ANTES de llamar a Gemini,
 * permitiendo ejecutar acciones de forma determinista para los casos más comunes.
 *
 * Intenciones soportadas:
 *  - schedule_meeting  → "Agendame una cita con Norma mañana a las 15"
 *  - create_budget     → "Haceme un presupuesto para María, XV años, 100 invitados"
 *  - create_lead       → "Registrá un prospecto: Ana García, casamiento, tel 098123456"
 *  - register_payment  → "Registrá un pago de 10000 pesos para el presupuesto de Mirta"
 *  - none              → no se detectó intención clara (pasar a Gemini)
 */

import { parseDateTimeUY } from './date-parser';

export type RouterIntentType =
  | 'schedule_meeting'
  | 'create_budget'
  | 'create_lead'
  | 'register_payment'
  | 'none';

export interface RouterDetectedIntent {
  type: RouterIntentType;
  confidence: 'high' | 'medium' | 'low';
  data: {
    name?: string;
    followUpDate?: string;
    time?: string;
    notes?: string;
    // create_budget
    eventoTipo?: string;
    invitados?: number;
    // register_payment
    monto?: number;
    metodoPago?: string;
    presupuestoId?: string;
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

// ── Patrones de presupuesto ──────────────────────────────────────────────────

const BUDGET_VERB_REGEX =
  /\b(presupuesto\s+para|hac[eé]me?\s+un\s+presupuesto|cre[aá]\s+(?:un\s+)?presupuesto|nuevo\s+presupuesto|generar?\s+presupuesto)\b/i;

const BUDGET_CLIENT_REGEX =
  /(?:para|cliente|de)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/i;

const BUDGET_TIPO_MAP: Array<[RegExp, string]> = [
  [/casamiento|boda/i, 'Boda'],
  [/quincea[ñn]os|15\s*a[ñn]os|xv\s*a[ñn]os/i, 'XV años'],
  [/cumplea[ñn]os/i, 'Cumpleaños'],
  [/egreso/i, 'Egreso'],
  [/corporativo|empresarial/i, 'Evento corporativo'],
];

const BUDGET_INVITADOS_REGEX = /(\d{2,4})\s*(?:invitados?|personas?)/i;

// ── Patrones de prospecto ────────────────────────────────────────────────────

const LEAD_VERB_REGEX =
  /\b(registr[aá](?:r|me)?\s+(?:un\s+)?(?:prospecto|lead|consulta)|agreg[aá](?:r|me)?\s+(?:un\s+)?(?:prospecto|lead)|nuevo\s+(?:prospecto|lead))\b/i;

const LEAD_NAME_REGEX =
  /(?:prospecto|lead|cliente|nombre)[:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/i;

// ── Patrones de pago ─────────────────────────────────────────────────────────

const PAYMENT_VERB_REGEX =
  /\b(registr[aá](?:r|me)?\s+(?:un\s+)?pago|carg[aá](?:r|me)?\s+(?:un\s+)?pago|anot[aá](?:r|me)?\s+(?:un\s+)?pago|ingres[aá](?:r|me)?\s+(?:un\s+)?pago)\b/i;

const PAYMENT_AMOUNT_REGEX = /(\d[\d.,]*)\s*(?:pesos?|uyu|\$)?/i;

const PAYMENT_METHOD_MAP: Array<[RegExp, string]> = [
  [/efectivo|cash/i, 'Efectivo'],
  [/transferencia|transf/i, 'Transferencia'],
  [/tarjeta/i, 'Tarjeta'],
  [/cheque/i, 'Cheque'],
];

// ── Utilidades ────────────────────────────────────────────────────────────────

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

function extractClientName(message: string): string | undefined {
  const m = message.match(BUDGET_CLIENT_REGEX);
  if (m?.[1]) return toTitleCase(m[1].trim());
  return undefined;
}

function extractEventoTipo(message: string): string | undefined {
  for (const [pat, tipo] of BUDGET_TIPO_MAP) {
    if (pat.test(message)) return tipo;
  }
  return undefined;
}

function extractInvitados(message: string): number | undefined {
  const m = message.match(BUDGET_INVITADOS_REGEX);
  if (m?.[1]) return parseInt(m[1], 10);
  return undefined;
}

function extractPaymentAmount(message: string): number | undefined {
  const m = message.match(PAYMENT_AMOUNT_REGEX);
  if (m?.[1]) {
    const raw = m[1].replace(/\./g, '').replace(/,/g, '.');
    const val = parseFloat(raw);
    return isNaN(val) ? undefined : val;
  }
  return undefined;
}

function extractPaymentMethod(message: string): string | undefined {
  for (const [pat, method] of PAYMENT_METHOD_MAP) {
    if (pat.test(message)) return method;
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

  // ── Presupuesto ────────────────────────────────────────────────────────────
  if (BUDGET_VERB_REGEX.test(trimmed)) {
    const name = extractClientName(trimmed);
    const eventoTipo = extractEventoTipo(trimmed);
    const invitados = extractInvitados(trimmed);
    const { date } = parseDateTimeUY(trimmed, referenceDate);

    // Alta confianza solo si tenemos nombre y tipo de evento
    if (name && eventoTipo) {
      return {
        type: 'create_budget',
        confidence: 'high',
        data: { name, eventoTipo, invitados, followUpDate: date },
      };
    }
    if (name) {
      return {
        type: 'create_budget',
        confidence: 'medium',
        data: { name, eventoTipo, invitados, followUpDate: date },
      };
    }
  }

  // ── Prospecto/Lead ─────────────────────────────────────────────────────────
  if (LEAD_VERB_REGEX.test(trimmed)) {
    const m = trimmed.match(LEAD_NAME_REGEX);
    const name = m?.[1] ? toTitleCase(m[1].trim()) : undefined;
    const eventoTipo = extractEventoTipo(trimmed);
    const { date } = parseDateTimeUY(trimmed, referenceDate);

    if (name) {
      return {
        type: 'create_lead',
        confidence: 'high',
        data: { name, eventoTipo, followUpDate: date },
      };
    }
    return {
      type: 'create_lead',
      confidence: 'medium',
      data: { eventoTipo, followUpDate: date },
    };
  }

  // ── Pago ───────────────────────────────────────────────────────────────────
  if (PAYMENT_VERB_REGEX.test(trimmed)) {
    const monto = extractPaymentAmount(trimmed);
    const metodoPago = extractPaymentMethod(trimmed);
    const clienteNombre = extractClientName(trimmed);

    return {
      type: 'register_payment',
      confidence: monto ? 'high' : 'medium',
      data: {
        monto,
        metodoPago,
        name: clienteNombre,
      },
    };
  }

  return { type: 'none', confidence: 'low', data: {} };
}
