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

  // 3. Páginas de venta y vidriera de tecnología
  const paginasYServicios: Array<ResultadoBusqueda & { keywords: string[] }> = [
    {
      tipo: 'servicio',
      titulo: 'Bodas en Salto — AK Producciones',
      resumen: 'Organización integral de bodas: salón, catering, discoteca, fotografía, video y tecnología interactiva.',
      url: '/bodas',
      etiqueta: 'Bodas',
      keywords: ['boda', 'bodas', 'casamiento', 'matrimonio', 'catering'],
    },
    {
      tipo: 'servicio',
      titulo: 'Fiestas de 15 años — AK Producciones',
      resumen: 'Tu fiesta de 15 años con ambientación, música, catering, fotocabina, plataforma 360 y pantalla gigante.',
      url: '/quinceaneras',
      etiqueta: '15 años',
      keywords: ['15', '15 años', 'quince', 'quinceañera', 'quinceaneras', 'catering'],
    },
    {
      tipo: 'servicio',
      titulo: 'Cumpleaños y Celebraciones — AK Producciones',
      resumen: 'Festejá tu cumpleaños con producción completa, barra, catering, DJ y entretenimiento.',
      url: '/cumpleanos',
      etiqueta: 'Cumpleaños',
      keywords: ['cumple', 'cumpleaños', 'cumpleanos', 'catering'],
    },
    {
      tipo: 'servicio',
      titulo: 'Fotocabina Interactiva',
      resumen: 'Cabina de fotos con impresión instantánea, accesorios y galería digital para tus invitados.',
      url: '/tecnologia',
      etiqueta: 'Tecnología',
      keywords: ['fotocabina', 'fotos', 'cabina', 'entretenimiento'],
    },
    {
      tipo: 'servicio',
      titulo: 'Plataforma 360°',
      resumen: 'Videos en cámara lenta 360° editados al instante para compartir en redes.',
      url: '/tecnologia',
      etiqueta: 'Tecnología',
      keywords: ['plataforma 360', '360', 'video'],
    },
    {
      tipo: 'servicio',
      titulo: 'Espejo Mágico y Cámara Bogue',
      resumen: 'Estaciones interactivas de fotografía y video con estética editorial para tu evento.',
      url: '/tecnologia',
      etiqueta: 'Tecnología',
      keywords: ['espejo', 'bogue', 'fotocabina', 'fotos'],
    },
    {
      tipo: 'servicio',
      titulo: 'Catering y Barra de Tragos',
      resumen: 'Gastronomía propia, menú adulto y adolescente, y barra de tragos con bartenders.',
      url: '/tecnologia',
      etiqueta: 'Servicios',
      keywords: ['catering', 'menu', 'menú', 'barra', 'tragos', 'comida'],
    },
  ];

  for (const item of paginasYServicios) {
    const coincide = terminosBusqueda.some(
      (t) =>
        item.titulo.toLowerCase().includes(t) ||
        item.resumen.toLowerCase().includes(t) ||
        item.keywords.some((k) => k.includes(t) || t.includes(k)),
    );
    if (coincide) {
      resultados.push({
        tipo: item.tipo,
        titulo: item.titulo,
        resumen: item.resumen,
        url: item.url,
        etiqueta: item.etiqueta,
      });
    }
  }

  return resultados;
}
