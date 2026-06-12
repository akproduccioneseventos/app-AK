import type { FiestaEnPlanificacion } from '@/types/fiesta';

function eventDateValue(fiesta: FiestaEnPlanificacion, fallback: number): number {
  const value = fiesta.configuracion.fechaEvento;
  if (!value) return fallback;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? fallback : parsed;
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
