import type { FiestaEnPlanificacion } from '@/types/fiesta';

const IMPORTED_EVENT_ID = /^fiesta_(doc|verified)_(.+)_\d{4}_\d{2}_\d{2}$/;

function eventDateValue(fiesta: FiestaEnPlanificacion, fallback: number): number {
  const value = fiesta.configuracion.fechaEvento;
  if (!value) return fallback;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function dedupeImportedEventCopies(
  fiestas: FiestaEnPlanificacion[],
): FiestaEnPlanificacion[] {
  const verifiedClients = new Set(
    fiestas.flatMap(fiesta => {
      const match = fiesta.id.match(IMPORTED_EVENT_ID);
      return match?.[1] === 'verified' ? [match[2]] : [];
    }),
  );

  return fiestas.filter(fiesta => {
    const match = fiesta.id.match(IMPORTED_EVENT_ID);
    if (match?.[1] !== 'doc') return true;
    return !verifiedClients.has(match[2]);
  });
}

export function sortUpcomingEvents(fiestas: FiestaEnPlanificacion[]): FiestaEnPlanificacion[] {
  return [...fiestas].sort(
    (a, b) =>
      eventDateValue(a, Number.MAX_SAFE_INTEGER) -
      eventDateValue(b, Number.MAX_SAFE_INTEGER),
  );
}

export function sortPastEvents(fiestas: FiestaEnPlanificacion[]): FiestaEnPlanificacion[] {
  return [...fiestas].sort(
    (a, b) => eventDateValue(b, 0) - eventDateValue(a, 0),
  );
}
