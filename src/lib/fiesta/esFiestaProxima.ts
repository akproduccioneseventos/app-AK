import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { esFiestaDemo } from '@/lib/events/event-ordering';
import { esFiestaSuspendida } from '@/lib/fiesta/revisar-fiestas';
import { diaCalendario } from '@/lib/reportes/rango-de-dias';
import { hoyEnUruguay } from '@/lib/utils';

/**
 * Regla compartida para contar "eventos próximos / en planificación activa":
 * excluye fiestas demo y suspendidas, y exige fecha de hoy en adelante
 * (en hora de Uruguay) o estado Contratada (o sin fecha aún definida).
 */
export function esFiestaProxima(fiesta: FiestaEnPlanificacion | null | undefined, hoy?: string): boolean {
  if (!fiesta || esFiestaDemo(fiesta) || esFiestaSuspendida(fiesta)) {
    return false;
  }
  if (fiesta.estado === 'Contratada') {
    return true;
  }
  const fechaEvento = fiesta.configuracion?.fechaEvento;
  const dia = fechaEvento ? diaCalendario(fechaEvento) : null;
  if (!dia) {
    return true;
  }
  const referenciaHoy = hoy || hoyEnUruguay();
  return dia >= referenciaHoy;
}
