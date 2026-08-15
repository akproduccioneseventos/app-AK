import type { AprobacionRequest } from '@/types/approval';

/**
 * Una solicitud de cambio se decide UNA sola vez.
 *
 * Vive acá y no en `actions/approvals.ts` porque ese archivo es `'use server'` y
 * sólo puede exportar funciones asíncronas: hay una prueba que lo controla.
 *
 * El problema que resuelve: estas solicitudes llevan un impacto en pesos. Sin
 * este control, un cambio ya rechazado se podía volver a aprobar y quedaba
 * aprobado, sin rastro de que antes se había rechazado ni de quién lo había
 * hecho: el campo del que decide se pisaba con el último. Sobre un cambio de
 * presupuesto eso es plata que se mueve sin poder reconstruir quién la autorizó.
 *
 * Devuelve el aviso ya escrito, o null si la solicitud todavía se puede decidir.
 */
export function yaFueDecidida(aprobacion: AprobacionRequest): string | null {
  if (aprobacion.estadoAprobacion === 'Pendiente') return null;

  const quien = aprobacion.aprobadoPor ? ` por ${aprobacion.aprobadoPor}` : '';
  const cuando = fechaLegible(aprobacion.aprobadoEn);
  const queSeHizo = aprobacion.estadoAprobacion === 'Aprobado' ? 'aprobada' : 'rechazada';

  return `Esta solicitud ya fue ${queSeHizo}${quien}${cuando}. `
    + 'Si el cambio hay que revisarlo de nuevo, se pide una solicitud nueva.';
}

function fechaLegible(iso?: string): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return ` el ${fecha.toLocaleDateString('es-UY')}`;
}
