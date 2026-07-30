const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/;

export function parseEventDate(value?: string): Date | null {
  if (!value) return null;

  const dateOnly = value.match(DATE_ONLY_PATTERN);
  const parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDaysUntilEvent(value?: string, now = new Date()): number | null {
  const eventDate = parseEventDate(value);
  if (!eventDate) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  return Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);
}

export function formatEventDate(value?: string): string | null {
  const eventDate = parseEventDate(value);
  if (!eventDate) return null;

  return eventDate.toLocaleDateString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
