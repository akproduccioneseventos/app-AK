import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { diaCalendario } from "@/lib/reportes/rango-de-dias"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUruguayParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const findPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  return {
    year: parseInt(findPart('year'), 10),
    month: parseInt(findPart('month'), 10),
    day: parseInt(findPart('day'), 10),
    hour: parseInt(findPart('hour'), 10),
    minute: parseInt(findPart('minute'), 10),
    second: parseInt(findPart('second'), 10),
  };
}

/**
 * El día de hoy EN URUGUAY, como `AAAA-MM-DD`. `new Date().toISOString().slice(0, 10)` da el
 * día de Greenwich: de las nueve de la noche en adelante ya es mañana (pregunta 13).
 */
export function hoyEnUruguay(fecha: Date = new Date()): string {
  const { year, month, day } = getUruguayParts(fecha);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Días de calendario de Uruguay entre hoy y `fecha` (negativo si ya pasó, 0 si es hoy).
 * Los `daysUntil` viejos usaban la hora del servidor (Greenwich): desde las 21:00 de Uruguay
 * ya era mañana y todo se corría un día.
 */
export function diasHastaEnUruguay(fecha: string | Date, ahora: Date = new Date()): number {
  const dia = diaCalendario(fecha);
  if (!dia) return NaN;
  const hoy = parseUruguayDate(hoyEnUruguay(ahora));
  const objetivo = parseUruguayDate(dia);
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86_400_000);
}

export function parseUruguayDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, y, m, d] = match;
    const year = parseInt(y, 10);
    const month = parseInt(m, 10) - 1;
    const day = parseInt(d, 10);
    // Midday (12:00:00) avoids crossing day boundaries due to local/UTC offsets or DST shifts.
    return new Date(year, month, day, 12, 0, 0);
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

export function formatUruguayDateString(dateStrOrObj: string | Date): string {
  const date = typeof dateStrOrObj === 'string' ? parseUruguayDate(dateStrOrObj) : dateStrOrObj;
  const { year, month, day } = getUruguayParts(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function sanitizeActionError(err: any): string {
  const message = err instanceof Error ? err.message : String(err);
  if (process.env.NODE_ENV === 'production') {
    // If it's a known client-facing safe error message, we can pass it through.
    const safeErrorKeywords = [
      'Acceso denegado',
      'Sesión no autorizada',
      'Monto inválido',
      'Sugerencia vacía',
      'No hay cambios',
      'Formato de archivo no permitido',
      'Contrato ya firmado'
    ];
    const isSafe = safeErrorKeywords.some(keyword => message.includes(keyword));
    return isSafe ? message : 'Ocurrió un error en el servidor. Por favor, intenta de nuevo.';
  }
  return message;
}
