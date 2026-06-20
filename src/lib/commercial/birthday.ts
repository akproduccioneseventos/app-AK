export function normalizeBirthdayMonthDay(value?: string | null): string | undefined {
  if (!value) return undefined;
  const match = value.trim().match(/^(?:\d{4}-)?(\d{2})-(\d{2})$/);
  if (!match) return undefined;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const probe = new Date(2024, month - 1, day);
  if (probe.getMonth() !== month - 1 || probe.getDate() !== day) return undefined;
  return `${match[1]}-${match[2]}`;
}

export function daysUntilBirthday(monthDay?: string | null, from = new Date()): number | null {
  const normalized = normalizeBirthdayMonthDay(monthDay);
  if (!normalized) return null;

  const [month, day] = normalized.split('-').map(Number);
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let next = new Date(start.getFullYear(), month - 1, day);
  if (next < start) next = new Date(start.getFullYear() + 1, month - 1, day);
  return Math.round((next.getTime() - start.getTime()) / 86_400_000);
}
