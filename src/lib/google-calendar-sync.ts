export interface GoogleCalendarEventDetails {
  title: string;
  description: string;
  location?: string;
  startIso: string;
  endIso?: string;
}

/**
 * Builds a direct Google Calendar event creation URL.
 * Uses manual string concatenation for `dates` to avoid URLSearchParams encoding the `/` separator.
 */
export function buildGoogleCalendarUrl(details: GoogleCalendarEventDetails): string {
  const startDate = new Date(details.startIso);
  if (isNaN(startDate.getTime())) {
    throw new Error(`[GoogleCalendar] Fecha de inicio invÃ¡lida: ${details.startIso}`);
  }

  const endDate = details.endIso
    ? new Date(details.endIso)
    : new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

  if (isNaN(endDate.getTime())) {
    throw new Error(`[GoogleCalendar] Fecha de fin invÃ¡lida: ${details.endIso}`);
  }

  const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
  const dates = `${fmt(startDate)}/${fmt(endDate)}`;
  const location = details.location || 'AK Producciones - Montevideo, Uruguay';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: details.title,
    details: details.description,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}&dates=${dates}`;
}
