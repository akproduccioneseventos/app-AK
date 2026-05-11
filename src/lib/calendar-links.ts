export type CalendarEventInput = {
  title: string;
  startDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  details?: string | null;
  durationHours?: number;
};

function parseTime(time?: string | null) {
  if (!time) return { hours: 20, minutes: 0 };
  const [hoursRaw, minutesRaw] = time.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw ?? '0');
  if (!Number.isFinite(hours)) return { hours: 20, minutes: 0 };
  return { hours, minutes: Number.isFinite(minutes) ? minutes : 0 };
}

function parseLocalDateTime(date?: string | null, time?: string | null) {
  if (!date) return null;
  const dateText = String(date);
  const match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const { hours, minutes } = parseTime(time);

  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), hours, minutes);
  }

  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(hours, minutes, 0, 0);
  return parsed;
}

function toGoogleDate(date: Date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

export function buildGoogleCalendarUrl(input: CalendarEventInput) {
  const start = parseLocalDateTime(input.startDate, input.startTime);
  if (!start) return null;

  const end = parseLocalDateTime(input.startDate, input.endTime);
  const fallbackEnd = new Date(start.getTime() + (input.durationHours ?? 5) * 60 * 60 * 1000);
  const finalEnd = end && end > start ? end : fallbackEnd;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title || 'Evento AK Producciones',
    dates: `${toGoogleDate(start)}/${toGoogleDate(finalEnd)}`,
    details: input.details || 'Evento coordinado por AK Producciones.',
    location: input.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
