import type { Testimonial as TestimonioGuardado } from '@/types/feedback';

/**
 * Qué testimonios se le muestran al cliente.
 *
 * **Regla dura del dueño: una opinión mala nunca se publica.** El circuito tiene
 * tres candados y este archivo respeta los tres:
 *
 * 1. La opinión que deja el cliente después del evento va a una lista privada.
 * 2. El dueño elige cuál convertir en testimonio, y nace **sin aprobar**.
 * 3. Sólo se muestra lo que él aprobó a mano.
 *
 * Acá se vuelve a filtrar por aprobado aunque la consulta ya lo haga. Es a
 * propósito: si mañana alguien cambia la consulta o le pasa la lista completa por
 * error, igual no se cuela ninguna sin aprobar. Es el punto donde una equivocación
 * sale cara —una queja proyectada en la pantalla que se le muestra al cliente— así
 * que se controla dos veces.
 */

export interface TestimonioParaMostrar {
  id: string;
  authorName: string;
  source: string;
  text: string;
  date?: string;
}

function formatearMes(fechaIso?: string): string | undefined {
  if (!fechaIso) return undefined;
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return undefined;
  const mes = fecha.toLocaleDateString('es-UY', { month: 'long' });
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${fecha.getFullYear()}`;
}

/**
 * Los testimonios reales aprobados, listos para la pantalla.
 *
 * @param guardados  Lo que devuelve la aplicación. Se filtra igual por aprobado.
 * @param deEjemplo  Los de muestra, que se usan **sólo** si todavía no hay ninguno
 *                   real aprobado: una pantalla vacía en medio de una venta es peor
 *                   que un ejemplo.
 */
export function testimoniosParaMostrar(
  guardados: TestimonioGuardado[] | null | undefined,
  deEjemplo: TestimonioParaMostrar[],
): TestimonioParaMostrar[] {
  const aprobados = (guardados ?? [])
    .filter((testimonio) => testimonio?.isApproved === true)
    .filter((testimonio) => Boolean(testimonio.testimonialText?.trim()));

  if (aprobados.length === 0) return deEjemplo;

  return aprobados.map((testimonio) => ({
    id: testimonio.id,
    authorName: testimonio.clientName?.trim() || 'Cliente de AK',
    source: 'text',
    text: testimonio.testimonialText.trim(),
    date: formatearMes(testimonio.createdAt),
  }));
}
