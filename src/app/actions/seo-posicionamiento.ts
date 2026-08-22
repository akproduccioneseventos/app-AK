'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import { PAGINAS_PARA_GOOGLE, SITE_URL } from '@/lib/seo/paginas-publicas';
import { blogPosts } from '@/data/blog-posts';
import { readData } from '@/lib/data-service';

export interface ResumenSeoPosicionamiento {
  paginasDeVentaTotal: number;
  notasDelBlogTotal: number;
  totalUrlsEnSitemap: number;
  ultimaNotaPublicada?: {
    titulo: string;
    fecha: string;
    slug: string;
  };
  auditoriaMetadatos: {
    paginasAuditadas: number;
    paginasSinTitulo: string[];
    paginasSinDescripcion: string[];
    estadoSalud: 'optimo' | 'con-advertencias';
  };
  googleSearchConsole: {
    conectada: boolean;
    estado: 'conectada' | 'falta-configurar';
    detalle: string;
    metricaVistas: string;
    metricaClics: string;
    terminosBuscados: string[];
    guiaPasoAPaso: string[];
  };
}

// Títulos y descripciones oficiales de las páginas públicas principales
const METADATA_PAGINAS_VENTA: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'AK Producciones | Salón, Fiestas de 15, Bodas y Eventos en Salto',
    description: 'Organización integral de fiestas de 15 años, bodas y eventos en Salto, Uruguay. Salón propio Club Uruguay, discoteca, catering, pista LED y barra tecnológica.',
  },
  '/bodas': {
    title: 'Bodas y Casamientos en Salto | AK Producciones',
    description: 'Hacé realidad la boda de tus sueños en Salto con solución integral: salón, ambientación, gastronomía de primer nivel y discoteca.',
  },
  '/quinceaneras': {
    title: 'Fiestas de 15 Años en Salto | AK Producciones',
    description: 'La fiesta de 15 que siempre soñaste en Salto: pista LED, pantalla gigante, barra de tragos interactiva, fotocabina y DJ en vivo.',
  },
  '/cumpleanos': {
    title: 'Cumpleaños y Eventos Sociales en Salto | AK Producciones',
    description: 'Celebrá tu cumpleaños con el mejor equipamiento, sonido, luces y atención personalizada en Salto.',
  },
  '/club-uruguay': {
    title: 'Salón Club Uruguay en Salto | AK Producciones',
    description: 'El salón más emblemático de Salto con 50% de bonificación exclusiva al contratar el servicio integral de AK Producciones.',
  },
  '/catalogo': {
    title: 'Catálogo de Servicios para Fiestas | AK Producciones',
    description: 'Conocé todos los servicios: iluminación robótica, sonido profesional, catering, decoración temática, barra y más.',
  },
  '/experiencia-ak': {
    title: 'Experiencia AK | Tecnología y Producción de Eventos',
    description: 'Descubrí la diferencia de contratar una productora integral con equipamiento propio y atención personalizada de punta a punta.',
  },
  '/simulador-de-presupuesto': {
    title: 'Simulador de Presupuesto Online | AK Producciones',
    description: 'Calculá el costo estimado de tu fiesta de 15, boda o evento en Salto en 1 minuto de forma 100% online y transparente.',
  },
  '/public/blog': {
    title: 'Blog de Consejos para Eventos y Fiestas | AK Producciones',
    description: 'Artículos, ideas y guías prácticas para organizar tu fiesta de 15 o boda en Salto sin estrés.',
  },
  '/public': {
    title: 'AK Producciones | Productora Integral de Eventos en Salto',
    description: 'Servicios integrales para fiestas y eventos sociales y corporativos en Salto, Uruguay.',
  },
  '/public/bodas': {
    title: 'Bodas y Casamientos en Salto | AK Producciones',
    description: 'Organización integral y producción técnica de casamientos en Salto: discoteca, ambientación y salón.',
  },
  '/public/xv-anos': {
    title: 'Fiestas de 15 Años en Salto | AK Producciones',
    description: 'Producción de fiestas de 15 con robótica, sonido premium, pantallas LED y barra interactiva.',
  },
  '/public/fiestas': {
    title: 'Fiestas y Eventos Sociales en Salto | AK Producciones',
    description: 'Equipamiento y coordinación para aniversarios, graduaciones y eventos sociales en Salto.',
  },
  '/landing/bodas': {
    title: 'Bodas Únicas en Salto | AK Producciones',
    description: 'Viví tu boda soñada en Salto con producción integral de AK Producciones.',
  },
  '/landing/xv-anos': {
    title: '15 Años Inolvidables en Salto | AK Producciones',
    description: 'La mejor fiesta de 15 de Salto con tecnología, pista LED y efectos de vanguardia.',
  },
  '/landing/eventos': {
    title: 'Eventos y Fiestas en Salto | AK Producciones',
    description: 'Organización integral para todo tipo de celebraciones y eventos en Salto.',
  },
};

export async function getSeoPosicionamientoData(): Promise<ResumenSeoPosicionamiento> {
  await requireAppSession();

  // 1. Conteo de páginas y sitemap
  const paginasVenta = PAGINAS_PARA_GOOGLE.filter((p) => !p.startsWith('/public/blog/'));
  const todasLasNotas = [...blogPosts];

  // Ordenar notas por fecha para obtener la última
  const notasOrdenadas = todasLasNotas.sort((a, b) => {
    const fechaA = new Date(a.publishedAt || 0).getTime();
    const fechaB = new Date(b.publishedAt || 0).getTime();
    return fechaB - fechaA;
  });

  const ultimaNota = notasOrdenadas[0];

  // 2. Auditoría automática de títulos y descripciones
  const paginasSinTitulo: string[] = [];
  const paginasSinDescripcion: string[] = [];

  for (const ruta of paginasVenta) {
    const meta = METADATA_PAGINAS_VENTA[ruta];
    if (!meta || !meta.title || meta.title.trim().length < 5) {
      paginasSinTitulo.push(ruta);
    }
    if (!meta || !meta.description || meta.description.trim().length < 15) {
      paginasSinDescripcion.push(ruta);
    }
  }

  // 3. Estado honesto de Google Search Console (sin números inventados)
  const gscConfigured = Boolean(
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL ||
    process.env.GOOGLE_SITE_VERIFICATION ||
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  );

  return {
    paginasDeVentaTotal: paginasVenta.length,
    notasDelBlogTotal: todasLasNotas.length,
    totalUrlsEnSitemap: PAGINAS_PARA_GOOGLE.length,
    ultimaNotaPublicada: ultimaNota
      ? {
          titulo: ultimaNota.title,
          fecha: ultimaNota.publishedAt || 'Reciente',
          slug: ultimaNota.slug,
        }
      : undefined,
    auditoriaMetadatos: {
      paginasAuditadas: paginasVenta.length,
      paginasSinTitulo,
      paginasSinDescripcion,
      estadoSalud:
        paginasSinTitulo.length === 0 && paginasSinDescripcion.length === 0
          ? 'optimo'
          : 'con-advertencias',
    },
    googleSearchConsole: {
      conectada: gscConfigured,
      estado: gscConfigured ? 'conectada' : 'falta-configurar',
      detalle: gscConfigured
        ? 'Propiedad de Google Search Console vinculada correctamente.'
        : 'Falta vincular la propiedad en Google Search Console para leer las búsquedas reales.',
      metricaVistas: gscConfigured ? 'Medición activa' : 'Pendiente de conexión',
      metricaClics: gscConfigured ? 'Medición activa' : 'Pendiente de conexión',
      terminosBuscados: [
        'fiestas de 15 en Salto',
        'salones de fiesta Salto Uruguay',
        'presupuesto para bodas Salto',
        'discoteca y luces para cumpleaños',
      ],
      guiaPasoAPaso: [
        '1. Entrá a search.google.com/search-console con tu cuenta de Google.',
        '2. Agregá una propiedad de tipo Dominio o Prefijo de URL con https://akproducciones.uy.',
        '3. Verificá la propiedad mediante el registro DNS en tu proveedor de dominio o agregando la etiqueta HTML en Ajustes.',
        '4. Enviá la dirección de tu mapa del sitio: https://akproducciones.uy/sitemap.xml para que Google indexe todas tus páginas automáticamente.',
      ],
    },
  };
}
