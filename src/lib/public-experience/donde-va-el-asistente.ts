import { PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';

/**
 * En qué pantallas se muestra el asistente de ventas.
 *
 * Venía con una lista de pantallas **prohibidas**, y esa forma falla sola: alcanza
 * con que alguien agregue una pantalla nueva y se olvide de sumarla a la lista para
 * que el globito de ventas aparezca donde no va. Ya pasaba: se mostraba encima de
 * la invitación de un casamiento, en el portal del cliente que ya contrató, en las
 * estaciones de la fiesta y hasta en la presentación proyectada en el salón.
 *
 * Ahora es al revés: **está apagado en todos lados y se prende sólo en las páginas
 * de venta**, que son las mismas que se le muestran a Google. Si mañana se agrega
 * una pantalla nueva y nadie toca la lista, el asistente no aparece, que es el
 * error barato.
 */

/** Las páginas de venta donde un visitante todavía no es cliente. */
const PAGINAS_DE_VENTA = new Set<string>(PAGINAS_PARA_GOOGLE);

function sinBarraFinal(ruta: string): string {
  if (ruta.length > 1 && ruta.endsWith('/')) return ruta.slice(0, -1);
  return ruta;
}

export function mostrarAsistenteEn(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const ruta = sinBarraFinal(pathname.split('?')[0]);

  if (PAGINAS_DE_VENTA.has(ruta)) return true;

  // Las de adentro del blog y las de tipo de evento cuelgan de /public o /landing.
  return ruta.startsWith('/public/') || ruta.startsWith('/landing/');
}
