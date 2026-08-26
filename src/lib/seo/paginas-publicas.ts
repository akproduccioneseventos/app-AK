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
 */

import { blogPosts } from '@/data/blog-posts';

export const SITE_URL = 'https://akproducciones.uy';

/** Páginas de venta canónicas que Google debe mostrar. */
export const PAGINAS_PARA_GOOGLE = [
  '/',
  '/bodas',
  '/quinceaneras',
  '/cumpleanos',
  '/club-uruguay',
  '/catalogo',
  '/experiencia-ak',
  '/simulador-de-presupuesto',
  '/public/bodas',
  '/public/xv-anos',
  '/public/fiestas',
  '/public/blog',
  ...blogPosts.map((post) => `/public/blog/${post.slug}` as const),
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
  '/experiencia-ak': 0.7,
  '/public/bodas': 0.7,
  '/public/xv-anos': 0.7,
  '/public/fiestas': 0.7,
  '/public/blog': 0.7,
};

export function prioridadDePagina(ruta: string): number {
  if (ruta.startsWith('/public/blog/')) return 0.6;
  return PRIORIDAD[ruta] ?? 0.5;
}
