export interface GoogleCalendarEventDetails {
  title: string;
  description: string;
  location?: string;
  startIso: string;
  endIso?: string;
}

/**
 * Builds a direct Google Calendar event creation URL for 1-click adding to user's Google Calendar.
 */
export function buildGoogleCalendarUrl(details: GoogleCalendarEventDetails): string {
  const startDate = new Date(details.startIso);
  const endDate = details.endIso ? new Date(details.endIso) : new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

  const formatGoogleDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: details.title,
    details: details.description,
    location: details.location || 'AK Producciones - Montevideo, Uruguay',
    dates,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
