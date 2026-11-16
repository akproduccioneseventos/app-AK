import type { FiestaEnPlanificacion } from '@/types/fiesta';

const IMPORTED_EVENT_ID = /^fiesta_(doc|verified)_(.+)_\d{4}_\d{2}_\d{2}$/;

function eventDateValue(fiesta: FiestaEnPlanificacion, fallback: number): number {
  const value = fiesta.configuracion.fechaEvento;
  if (!value) return fallback;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? fallback : parsed;
}

function tienePlataCargada(fiesta: FiestaEnPlanificacion): boolean {
  const f = fiesta as any;
  if (Array.isArray(f.pagos) && f.pagos.length > 0) return true;
  if (Array.isArray(f.presupuesto?.pagos) && f.presupuesto.pagos.length > 0) return true;
  if (Number(f.resumenPagos?.totalPagado) > 0 || Number(f.resumenPagos?.seniaPagada) > 0) return true;
  if (Array.isArray(f.planPagos) && f.planPagos.some((c: any) => c?.estado === 'pagada' || Number(c?.montoPagado) > 0)) {
    return true;
  }
  return false;
}

export function dedupeImportedEventCopies(
  fiestas: FiestaEnPlanificacion[],
): Array<FiestaEnPlanificacion & { revisarDuplicado?: boolean }> {
  const verifiedByClient = new Map<string, FiestaEnPlanificacion[]>();
  for (const fiesta of fiestas) {
    const match = fiesta.id.match(IMPORTED_EVENT_ID);
    if (match?.[1] === 'verified') {
      const list = verifiedByClient.get(match[2]) || [];
      list.push(fiesta);
      verifiedByClient.set(match[2], list);
    }
  }

  return fiestas.flatMap((fiesta) => {
    const match = fiesta.id.match(IMPORTED_EVENT_ID);
    if (match?.[1] !== 'doc') return [fiesta];
    const verifiedList = verifiedByClient.get(match[2]);
    if (!verifiedList || verifiedList.length === 0) return [fiesta];

    const fechaDoc = fiesta.configuracion?.fechaEvento || '';
    const mismaFecha = verifiedList.some((v) => (v.configuracion?.fechaEvento || '') === fechaDoc);

    if (tienePlataCargada(fiesta) || !mismaFecha) {
      return [{ ...fiesta, revisarDuplicado: true }];
    }
    return [];
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

/**
 * Identifica si una fiesta es de muestra (DEMO AK) y no debe mezclarse con la operación real.
 */
export function esFiestaDemo(fiesta?: Partial<FiestaEnPlanificacion> | null): boolean {
  if (!fiesta) return false;
  const id = String(fiesta.id || '').toLowerCase();
  const estado = String(fiesta.estado || '').trim();
  return estado === 'Demo AK' || id.startsWith('demo_');
}
