export type CalendarEventInput = {
  title: string;
  startDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  details?: string | null;
  durationHours?: number;
};

function parseTimeParts(time?: string | null) {
  if (!time) return { hours: 20, minutes: 0 };
  const [hoursRaw, minutesRaw] = time.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw ?? '0');
  if (!Number.isFinite(hours)) return { hours: 20, minutes: 0 };
  return { hours, minutes: Number.isFinite(minutes) ? minutes : 0 };
}

export function buildGoogleCalendarUrl(input: CalendarEventInput): string | null {
  if (!input.startDate) return null;
  const dateText = String(input.startDate);
  const match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const { hours, minutes } = parseTimeParts(input.startTime);

  const pad = (n: number) => String(n).padStart(2, '0');
  const startStr = `${year}${pad(month)}${pad(day)}T${pad(hours)}${pad(minutes)}00`;

  let endUtc: number;
  if (input.endTime) {
    const endParts = parseTimeParts(input.endTime);
    const startUtc = Date.UTC(year, month - 1, day, hours, minutes);
    let candidateEndUtc = Date.UTC(year, month - 1, day, endParts.hours, endParts.minutes);
    if (candidateEndUtc <= startUtc) {
      candidateEndUtc += 24 * 60 * 60 * 1000;
    }
    endUtc = candidateEndUtc;
  } else {
    const duration = input.durationHours ?? 5;
    const startUtc = Date.UTC(year, month - 1, day, hours, minutes);
    endUtc = startUtc + duration * 60 * 60 * 1000;
  }

  const endDate = new Date(endUtc);
  const endStr = `${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth() + 1)}${pad(endDate.getUTCDate())}T${pad(endDate.getUTCHours())}${pad(endDate.getUTCMinutes())}00`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title || 'Evento AK Producciones',
    dates: `${startStr}/${endStr}`,
    details: input.details || 'Evento coordinado por AK Producciones.',
    location: input.location || '',
    ctz: 'America/Montevideo',
  });

  const rawUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
  return rawUrl.replace(`${startStr}%2F${endStr}`, `${startStr}/${endStr}`);
}
