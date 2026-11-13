/**
 * Utilidades de fecha y hora local para Uruguay (America/Montevideo).
 */

const TIMEZONE_URUGUAY = 'America/Montevideo';

/**
 * Convierte una fecha o fecha/hora a string en formato 'AAAA-MM-DDTHH:mm'
 * en la zona horaria de Uruguay (America/Montevideo).
 */
export function aFechaHoraLocal(dateInput?: Date | string | null): string {
  let date: Date;

  if (!dateInput) {
    date = new Date();
  } else if (typeof dateInput === 'string') {
    // Si viene como 'AAAA-MM-DDTHH:mm' sin zona, interpretamos como fecha local de Uruguay
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) {
    return '';
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_URUGUAY,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value])
  );

  const hour = parts.hour === '24' ? '00' : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}

/**
 * Convierte un valor 'AAAA-MM-DDTHH:mm' ingresado en hora de Uruguay
 * a string ISO UTC garantizado para guardar en base de datos sin desfase.
 */
export function aIsoUruguay(fechaStr: string): string {
  if (!fechaStr) return '';
  const trimmed = fechaStr.trim();
  // Si ya tiene Z o offset explícito, parsear directo
  if (trimmed.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed).toISOString();
  }
  // Si es AAAA-MM-DDTHH:mm o AAAA-MM-DDTHH:mm:ss, Uruguay es UTC-3 (-03:00)
  const base = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  return new Date(`${base}-03:00`).toISOString();
}
