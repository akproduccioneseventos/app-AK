/**
 * Parser de fechas y horas en español uruguayo.
 * Interpreta expresiones como:
 *   "hoy", "mañana", "pasado mañana"
 *   "viernes", "el lunes"
 *   "12/5", "12 de mayo", "el 3 de junio"
 *   "a las 11", "15 hs", "3 de la tarde", "11:30"
 */

export interface ParsedDateTime {
  /** Fecha en formato ISO YYYY-MM-DD, si se detectó. */
  date?: string;
  /** Hora en formato HH:MM, si se detectó. */
  time?: string;
  /** Texto original del fragmento de fecha/hora detectado. */
  raw?: string;
}

const MESES: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};

// Día de semana → índice (0=domingo)
const DIAS_SEMANA: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2,
  miércoles: 3, miercoles: 3,
  jueves: 4, viernes: 5,
  sábado: 6, sabado: 6,
};

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function nextWeekday(targetDay: number, from: Date): Date {
  const result = new Date(from);
  let daysUntil = targetDay - from.getDay();
  if (daysUntil <= 0) daysUntil += 7;
  result.setDate(from.getDate() + daysUntil);
  return result;
}

/**
 * Parsea expresiones de fecha y hora en español rioplatense/uruguayo.
 * No lanza excepciones; devuelve un objeto vacío si no detecta nada.
 */
export function parseDateTimeUY(text: string, referenceDate?: Date): ParsedDateTime {
  const now = referenceDate ?? new Date();
  const lower = text.toLowerCase();
  const result: ParsedDateTime = {};

  // ── 1. Hora ────────────────────────────────────────────────────────────────
  // Patrón "a las 11", "a las 15:30", "a la 1"
  const aLasMatch = text.match(/\ba\s+las?\s+(\d{1,2})(?::(\d{2}))?\s*(?:hs?|horas?)?\b/i);
  // Patrón "15 hs", "11hs", "8:30 hs"
  const hsMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*hs?\b/i);
  // Patrón "3 de la tarde"
  const tardeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s+de\s+la\s+tarde\b/i);
  // Patrón "HH:MM" explícito (solo si tiene dos puntos)
  const colonMatch = text.match(/\b(\d{1,2}):(\d{2})\b/);

  const rawTimeMatch = aLasMatch ?? tardeMatch ?? hsMatch ?? colonMatch;
  if (rawTimeMatch) {
    let hour = parseInt(rawTimeMatch[1], 10);
    const min = rawTimeMatch[2] ? parseInt(rawTimeMatch[2], 10) : 0;

    if (tardeMatch && hour < 12) {
      hour += 12; // "3 de la tarde" → 15
    } else if ((aLasMatch || hsMatch) && hour < 7 && !colonMatch) {
      hour += 12; // "a las 3" (ambiguo) → 15:00
    }

    result.time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    result.raw = rawTimeMatch[0];
  }

  // ── 2. Fecha relativa ──────────────────────────────────────────────────────
  if (/\bhoy\b/.test(lower)) {
    result.date = toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
  } else if (/\bpasado\s+ma[ñn]ana\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(now.getDate() + 2);
    result.date = toIsoDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  } else if (/\bma[ñn]ana\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(now.getDate() + 1);
    result.date = toIsoDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  // ── 3. Día de la semana ────────────────────────────────────────────────────
  if (!result.date) {
    for (const [dia, idx] of Object.entries(DIAS_SEMANA)) {
      const diaRegex = new RegExp(`\\b(próximo|proximo|siguiente)?\\s*${dia}\\b`);
      const m = lower.match(diaRegex);
      if (m) {
        const isNextWeek = !!(m[1]); // "próximo" or "siguiente" forces at least 7 days away
        let target = nextWeekday(idx, now);
        if (isNextWeek && target.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
          // If "próximo sábado" and the next sábado is less than a week away,
          // skip to the one after (truly "next" week)
          target.setDate(target.getDate() + 7);
        }
        result.date = toIsoDate(target.getFullYear(), target.getMonth() + 1, target.getDate());
        result.raw = result.raw ?? m[0];
        break;
      }
    }
  }

  // ── 4. "12 de mayo" / "el 3 de junio de 2026" ─────────────────────────────
  if (!result.date) {
    const monthNamePat =
      /\b(?:el\s+)?(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{4}))?\b/i;
    const m = text.match(monthNamePat);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(MESES[m[2].toLowerCase()], 10);
      const year = m[3] ? parseInt(m[3], 10) : now.getFullYear();
      result.date = toIsoDate(year, month, day);
      result.raw = result.raw ?? m[0];
    }
  }

  // ── 5. "12/5" / "12/05/2026" ──────────────────────────────────────────────
  if (!result.date) {
    const slashPat = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/;
    const m = text.match(slashPat);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10);
      let year = m[3] ? parseInt(m[3], 10) : now.getFullYear();
      if (year < 100) year += 2000;
      result.date = toIsoDate(year, month, day);
      result.raw = result.raw ?? m[0];
    }
  }

  return result;
}
