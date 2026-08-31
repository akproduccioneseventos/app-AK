import { blogPosts } from '@/data/blog-posts';
import { catalogList } from '@/data/event-catalogs';

export interface ResultadoBusqueda {
  tipo: 'articulo' | 'servicio';
  titulo: string;
  resumen: string;
  url: string;
  etiqueta?: string;
}

/**
 * Buscador dentro del sitio sin costo mensual ni dependencias externas.
 * Indexa artículos del blog y servicios del catálogo en memoria.
 */
export function buscarEnElSitio(termino: string): ResultadoBusqueda[] {
  const query = termino.trim().toLowerCase();
  if (!query) return [];

  const sinonimos: Record<string, string[]> = {
    quince: ['15', 'xv-anos', 'quince'],
    quinceañera: ['15', 'xv-anos'],
    quinceanera: ['15', 'xv-anos'],
    casamiento: ['boda', 'bodas'],
    matrimonio: ['boda', 'bodas'],
    cumple: ['cumpleaños', 'cumpleanos'],
  };

  const terminosBusqueda = [query, ...(sinonimos[query] || [])];
  const resultados: ResultadoBusqueda[] = [];

  // 1. Artículos del Blog
  for (const post of blogPosts) {
    const coincide = terminosBusqueda.some((t) =>
      post.title.toLowerCase().includes(t) ||
      post.excerpt.toLowerCase().includes(t) ||
      post.category?.toLowerCase().includes(t)
    );

    if (coincide) {
      resultados.push({
        tipo: 'articulo',
        titulo: post.title,
        resumen: post.excerpt,
        url: `/blog/${post.slug}`,
        etiqueta: post.category || 'Blog',
      });
    }
  }

  // 2. Catálogos y Servicios
  for (const catalog of catalogList) {
    const coincide = terminosBusqueda.some((t) =>
      catalog.name?.toLowerCase().includes(t) ||
      catalog.slug?.toLowerCase().includes(t) ||
      catalog.hero?.subheadline?.toLowerCase().includes(t) ||
      catalog.services?.some((s) => s.title?.toLowerCase().includes(t) || s.description?.toLowerCase().includes(t))
    );

    if (coincide) {
      resultados.push({
        tipo: 'servicio',
        titulo: catalog.name,
        resumen: catalog.hero?.subheadline || 'Organización integral para tu evento.',
        url: `/public/${catalog.slug}`,
        etiqueta: 'Catálogo',
      });
    }
  }

  return resultados;
}
