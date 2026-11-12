export interface GoogleWorkspaceEventInput {
  summary: string;
  description: string;
  location?: string;
  startIso: string;
  endIso: string;
  attendees?: string[];
}

export function googleCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function buildGoogleCalendarTemplateUrl(input: GoogleWorkspaceEventInput): string {
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', input.summary);
  url.searchParams.set('details', input.description);
  url.searchParams.set('dates', `${googleCalendarDate(new Date(input.startIso))}/${googleCalendarDate(new Date(input.endIso))}`);
  if (input.location) url.searchParams.set('location', input.location);
  return url.toString();
}
