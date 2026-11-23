import { diasHastaEnUruguay } from '@/lib/utils';

export const EVENT_TIMEZONE = 'America/Montevideo';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/;

const montevideoPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: EVENT_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function getPartsInMontevideo(date: Date) {
  const parts = montevideoPartsFormatter.formatToParts(date);
  const find = (type: string) => Number(parts.find((p) => p.type === type)?.value || '0');
  const rawHour = find('hour');
  return {
    year: find('year'),
    month: find('month'),
    day: find('day'),
    hour: rawHour === 24 ? 0 : rawHour,
    minute: find('minute'),
    second: find('second'),
  };
}

/**
 * Convierte una fecha y hora calendario en zona horaria `America/Montevideo`
 * al instante `Date` exacto, independiente del huso del servidor o navegador.
 */
function montevideoDateTimeToDate(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
): Date {
  const desiredAsUtc = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const firstParts = getPartsInMontevideo(new Date(desiredAsUtc));
  const firstAsUtc = Date.UTC(
    firstParts.year,
    firstParts.month - 1,
    firstParts.day,
    firstParts.hour,
    firstParts.minute,
    firstParts.second,
  );
  const candidateMs = desiredAsUtc - (firstAsUtc - desiredAsUtc);
  const secondParts = getPartsInMontevideo(new Date(candidateMs));
  const secondAsUtc = Date.UTC(
    secondParts.year,
    secondParts.month - 1,
    secondParts.day,
    secondParts.hour,
    secondParts.minute,
    secondParts.second,
  );
  return new Date(candidateMs + (desiredAsUtc - secondAsUtc));
}

export function parseEventHourParts(horaEvento?: string | null): { hours: number; minutes: number } | null {
  if (!horaEvento) return null;
  const trimmed = String(horaEvento).trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?(?:\s*hs?)?$/i);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = match[2] !== undefined ? Number(match[2]) : 0;
  if (!Number.isInteger(hours) || hours < 0 || hours > 23) return null;
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function extractCalendarDateParts(value: string): { year: number; month: number; day: number } | null {
  const trimmed = value.trim();
  const conBarras = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (conBarras) {
    const day = Number(conBarras[1]);
    const month = Number(conBarras[2]);
    const year = Number(conBarras[3]);
    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day) {
      return { year, month, day };
    }
    return null;
  }

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day) {
      return { year, month, day };
    }
    return null;
  }

  return null;
}

export function parseEventDate(value?: string, horaEvento?: string): Date | null {
  if (!value) return null;

  const hourParts = parseEventHourParts(horaEvento);
  if (hourParts) {
    const cal = extractCalendarDateParts(value);
    if (cal) {
      return montevideoDateTimeToDate(cal.year, cal.month, cal.day, hourParts.hours, hourParts.minutes);
    }
    const fallback = new Date(value);
    if (Number.isNaN(fallback.getTime())) return null;
    const uy = getPartsInMontevideo(fallback);
    return montevideoDateTimeToDate(uy.year, uy.month, uy.day, hourParts.hours, hourParts.minutes);
  }

  const conBarras = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (conBarras) {
    const parsed = new Date(Number(conBarras[3]), Number(conBarras[2]) - 1, Number(conBarras[1]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dateOnly = value.match(DATE_ONLY_PATTERN);
  const parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parsea fecha + hora del evento en `America/Montevideo` para cuentas regresivas.
 * - Si viene `horaEvento` (ej. `"21:00"`), arma ese instante exacto en `America/Montevideo`.
 * - Si `horaEvento` viene vacío o no es válido: si `value` trae hora explícita no medianoche con zona (`T...Z`/`±HH:MM`), respeta ese instante; si es fecha calendario (`YYYY-MM-DD`, `DD/MM/YYYY` o `T00:00:00Z`), usa `00:00` en `America/Montevideo`.
 */
export function parseEventDateTimeUruguay(value?: string, horaEvento?: string): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  const hourParts = parseEventHourParts(horaEvento);
  const cal = extractCalendarDateParts(trimmed);

  if (hourParts) {
    if (cal) {
      return montevideoDateTimeToDate(cal.year, cal.month, cal.day, hourParts.hours, hourParts.minutes);
    }
    return parseEventDate(trimmed, horaEvento);
  }

  const isoConHoraNoMedianoche = trimmed.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/);
  if (isoConHoraNoMedianoche && (isoConHoraNoMedianoche[1] !== '00' || isoConHoraNoMedianoche[2] !== '00')) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const isoSinZona = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (isoSinZona && cal) {
    return montevideoDateTimeToDate(cal.year, cal.month, cal.day, Number(isoSinZona[4]), Number(isoSinZona[5]));
  }

  if (cal) {
    return montevideoDateTimeToDate(cal.year, cal.month, cal.day, 0, 0);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDaysUntilEvent(value?: string, now = new Date()): number | null {
  if (!value) return null;
  const dias = diasHastaEnUruguay(value, now);
  if (dias !== null) return dias;
  const eventDate = parseEventDate(value);
  if (!eventDate) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  return Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);
}

export function formatEventDate(value?: string): string | null {
  if (!value) return null;
  const texto = value.trim();

  // 1. Barras: "15/12/2026 a las 21:00"
  const conBarras = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (conBarras) {
    const d = new Date(Number(conBarras[3]), Number(conBarras[2]) - 1, Number(conBarras[1]));
    if (!Number.isNaN(d.getTime())) {
      const fechaTexto = d.toLocaleDateString('es-UY', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return texto.replace(conBarras[0], fechaTexto);
    }
  }

  // 2. ISO / guiones: "2026-10-15 a las 21:00" o "2026-09-05T03:00:00Z"
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (!Number.isNaN(d.getTime())) {
      const fechaTexto = d.toLocaleDateString('es-UY', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const resto = texto.slice(iso[0].length).trim();
      return resto ? `${fechaTexto} ${resto}` : fechaTexto;
    }
  }

  const eventDate = parseEventDate(value);
  if (!eventDate) return null;

  return eventDate.toLocaleDateString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
