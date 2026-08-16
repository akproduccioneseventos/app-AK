/**
 * Qué páginas puede mostrar Google y cuáles no.
 *
 * La aplicación tiene tres mundos mezclados en el mismo dominio:
 *
 * 1. Las páginas de venta (portada, bodas, quince, cumpleaños, catálogo, blog,
 *    simulador). Estas SÍ tienen que aparecer en Google: son las que traen
 *    clientes.
 * 2. Las pantallas internas del equipo (contabilidad, fiestas, empresa, ajustes).
 *    Nunca.
 * 3. Las pantallas con datos de una persona concreta: el portal del cliente, las
 *    invitaciones con la lista de invitados, la opinión post evento, los accesos
 *    del personal. Estas son las más delicadas: si Google las indexa, la fiesta de
 *    un cliente aparece en una búsqueda.
 *
 * Por eso la regla es al revés de lo habitual: **está todo cerrado y se abre sólo
 * lo que se enumera acá**. Si mañana alguien agrega una pantalla nueva con datos
 * de un cliente y se olvida de esta lista, queda cerrada por defecto, que es el
 * error barato. Al revés sería el caro.
 */

export const SITE_URL = 'https://akproducciones.uy';

/** Páginas de venta que Google puede mostrar. */
export const PAGINAS_PARA_GOOGLE = [
  '/',
  '/bodas',
  '/quinceaneras',
  '/cumpleanos',
  '/club-uruguay',
  '/catalogo',
  '/experiencia-ak',
  '/simulador-de-presupuesto',
  '/public',
  '/public/blog',
  '/landing/bodas',
  '/landing/xv-anos',
  '/landing/eventos',
] as const;

/**
 * Cada cuánto conviene que Google vuelva a mirar, y qué peso tiene cada página.
 * La portada y las tres páginas de tipo de evento son las que venden.
 */
const PRIORIDAD: Record<string, number> = {
  '/': 1,
  '/bodas': 0.9,
  '/quinceaneras': 0.9,
  '/cumpleanos': 0.9,
  '/catalogo': 0.8,
  '/club-uruguay': 0.8,
  '/simulador-de-presupuesto': 0.8,
};

export function prioridadDePagina(ruta: string): number {
  return PRIORIDAD[ruta] ?? 0.6;
}
