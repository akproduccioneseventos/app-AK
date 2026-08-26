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

import { blogPosts } from '@/data/blog-posts';

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
  '/public/bodas',
  '/public/xv-anos',
  '/public/fiestas',
  '/public/blog',
  // Las notas del blog salen de `src/data/blog-posts.ts`, no escritas a mano.
  // Estaban tres de las seis: las otras tres existian y Google no las conocia,
  // **incluida la unica que habla de Salto**, que es la que mas rinde. Escritas a
  // mano se vuelven a desincronizar la proxima vez que se agregue una nota.
  ...blogPosts.map((post) => `/public/blog/${post.slug}` as const),
  '/landing/bodas',
  '/landing/xv-anos',
  '/landing/eventos',
] as const;

/**
 * Archivos que Google tiene que poder leer, pero que **no son paginas**.
 *
 * Van aparte de `PAGINAS_PARA_GOOGLE` porque esa lista alimenta dos cosas: el permiso
 * para robots **y el mapa del sitio**. Si el mapa se ofreciera a si mismo, o al archivo
 * de verificacion, le estariamos ofreciendo a Google paginas que no existen.
 *
 * **Por que hizo falta:** el permiso esta cerrado por defecto (`disallow: '/'`) y se abre
 * uno por uno. El mapa no estaba, asi que **Google tenia prohibido leerlo**: el dueno lo
 * intento dar de alta en Search Console y le dio error. El archivo de verificacion es lo
 * mismo: si Google no lo puede leer, no puede confirmar que el sitio es suyo.
 */
export const ARCHIVOS_QUE_GOOGLE_LEE = [
  '/sitemap.xml',
  '/robots.txt',
  '/google610ed09144764a8c.html',
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
