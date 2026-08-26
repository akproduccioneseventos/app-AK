'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import { PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';
import { blogPosts } from '@/data/blog-posts';
import { getMetadataRealDeRuta } from '@/lib/seo/auditoria-metadatos';

import { readData, writeData } from '@/lib/data-service';
import type { SocialPost } from '@/types/social-media';

export interface ResumenSeoPosicionamiento {
  paginasDeVentaTotal: number;
  notasDelBlogTotal: number;
  totalUrlsEnSitemap: number;
  ultimaNotaPublicada?: {
    titulo: string;
    fecha: string;
    slug: string;
  };
  ultimaPublicacionGoogle?: {
    fecha: string;
    texto: string;
    estado: string;
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

  // 2. Auditoría automática de títulos y descripciones directamente contra las fuentes de verdad
  const paginasSinTitulo: string[] = [];
  const paginasSinDescripcion: string[] = [];

  for (const ruta of paginasVenta) {
    const meta = await getMetadataRealDeRuta(ruta);
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

  // 4. Última publicación en Google Business
  const posts = await readData<SocialPost[]>('social-posts.json', []).catch(() => []);
  const googlePosts = posts.filter(p => p.platform === 'Google');
  const ultimoPostGoogle = googlePosts.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())[0];

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
    ultimaPublicacionGoogle: ultimoPostGoogle
      ? {
          fecha: ultimoPostGoogle.publishDate,
          texto: ultimoPostGoogle.text,
          estado: ultimoPostGoogle.status,
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

export async function guardarGoogleSiteVerificationAction(codigo: string): Promise<{ success: boolean; mensaje: string }> {
  await requireAppSession();
  try {
    const SETTINGS_FILE = 'settings.json';
    const settings: any = await readData<any>(SETTINGS_FILE, {}).catch(() => ({}));
    settings.googleSiteVerification = codigo.trim();
    await writeData(SETTINGS_FILE, settings);
    return {
      success: true,
      mensaje: 'Código de verificación de Google Search Console guardado correctamente.',
    };
  } catch (error: any) {
    return {
      success: false,
      mensaje: error?.message || 'No se pudo guardar la configuración.',
    };
  }
}
