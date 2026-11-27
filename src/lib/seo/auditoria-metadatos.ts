import { defaultLandingSettings } from '@/types/landing-editor';
import { getLandingSettings } from '@/app/actions/landing-editor';
import { tituloQueSirve } from '@/lib/seo/titulo-de-la-portada';
import { metadata as bodasMetadata } from '@/app/bodas/page';
import { metadata as quinceMetadata } from '@/app/quinceaneras/page';
import { metadata as cumpleMetadata } from '@/app/cumpleanos/page';
import { metadata as fiestasMetadata } from '@/app/fiestas/page';
import { metadata as empresarialesMetadata } from '@/app/fiestas-empresariales/page';
import { metadata as infantilesMetadata } from '@/app/fiestas-infantiles/page';
import { metadata as clubMetadata } from '@/app/club-uruguay/page';
import { metadata as catalogoMetadata } from '@/app/catalogo/layout';
import { metadata as expMetadata } from '@/app/experiencia-ak/page';
import { metadata as privacidadMetadata } from '@/app/privacidad/page';
import { metadata as simMetadata } from '@/app/simulador-de-presupuesto/layout';
import { metadata as simAkMetadata } from '@/app/simulador-ak/layout';
import { metadata as blogListMetadata } from '@/app/blog/page';
import { metadata as enlacesMetadata } from '@/app/enlaces/page';
import { getCatalogBySlug } from '@/data/event-catalogs';
import { blogPosts } from '@/data/blog-posts';
import { CAMPAIGN_LANDING_MAP } from '@/lib/marketing/campaign-landings';
import { PROMO_PAGES } from '@/lib/marketing/promo-pages';

function extraerTituloMetadata(title: unknown): string {
  if (!title) return '';
  if (typeof title === 'string') return title;
  if (typeof title === 'object') {
    const t = title as { absolute?: unknown; default?: unknown };
    if (typeof t.absolute === 'string') return t.absolute;
    if (typeof t.default === 'string') return t.default;
  }
  return '';
}

/**
 * Lee los títulos y descripciones de las páginas públicas donde viven de verdad,
 * directamente desde sus definiciones originales y archivos de página/layout.
 */
export async function getMetadataRealDeRuta(ruta: string): Promise<{ title: string; description: string }> {
  if (ruta === '/' || ruta === '/public') {
    try {
      const settings = await Promise.race([
        getLandingSettings(),
        new Promise<typeof defaultLandingSettings>((resolve) =>
          setTimeout(() => resolve(defaultLandingSettings), 300)
        ),
      ]).catch(() => defaultLandingSettings);
      return {
        title: `${tituloQueSirve(settings.seo.title)} | Organización Integral de Eventos en Salto`,
        description: settings.seo.description || defaultLandingSettings.seo.description || '',
      };
    } catch {
      return {
        title: `${tituloQueSirve(defaultLandingSettings.seo.title)} | Organización Integral de Eventos en Salto`,
        description: defaultLandingSettings.seo.description || '',
      };
    }
  }

  if (ruta === '/bodas') {
    return {
      title: extraerTituloMetadata(bodasMetadata.title),
      description: String(bodasMetadata.description || ''),
    };
  }

  if (ruta === '/quinceaneras') {
    return {
      title: extraerTituloMetadata(quinceMetadata.title),
      description: String(quinceMetadata.description || ''),
    };
  }

  if (ruta === '/cumpleanos') {
    return {
      title: extraerTituloMetadata(cumpleMetadata.title),
      description: String(cumpleMetadata.description || ''),
    };
  }

  if (ruta === '/fiestas') {
    return {
      title: extraerTituloMetadata(fiestasMetadata.title),
      description: String(fiestasMetadata.description || ''),
    };
  }

  if (ruta === '/fiestas-empresariales') {
    return {
      title: extraerTituloMetadata(empresarialesMetadata.title),
      description: String(empresarialesMetadata.description || ''),
    };
  }

  if (ruta === '/fiestas-infantiles') {
    return {
      title: extraerTituloMetadata(infantilesMetadata.title),
      description: String(infantilesMetadata.description || ''),
    };
  }

  if (ruta === '/club-uruguay') {
    return {
      title: extraerTituloMetadata(clubMetadata.title),
      description: String(clubMetadata.description || ''),
    };
  }

  if (ruta === '/catalogo') {
    return {
      title: extraerTituloMetadata(catalogoMetadata.title),
      description: String(catalogoMetadata.description || ''),
    };
  }

  if (ruta === '/experiencia-ak') {
    return {
      title: extraerTituloMetadata(expMetadata.title),
      description: String(expMetadata.description || ''),
    };
  }

  if (ruta === '/privacidad') {
    return {
      title: extraerTituloMetadata(privacidadMetadata.title),
      description: String(privacidadMetadata.description || ''),
    };
  }

  if (ruta === '/simulador-de-presupuesto') {
    return {
      title: extraerTituloMetadata(simMetadata.title),
      description: String(simMetadata.description || ''),
    };
  }

  if (ruta === '/simulador-ak') {
    return {
      title: extraerTituloMetadata(simAkMetadata.title),
      description: String(simAkMetadata.description || ''),
    };
  }

  if (ruta === '/blog') {
    return {
      title: extraerTituloMetadata(blogListMetadata.title),
      description: String(blogListMetadata.description || ''),
    };
  }

  if (ruta === '/enlaces') {
    return {
      title: extraerTituloMetadata(enlacesMetadata.title),
      description: String(enlacesMetadata.description || ''),
    };
  }

  if (ruta.startsWith('/blog/')) {
    const slug = ruta.replace('/blog/', '');
    const post = blogPosts.find((p) => p.slug === slug);
    return {
      title: post?.title ? `${post.title} | Blog AK Producciones` : '',
      description: post?.excerpt || '',
    };
  }

  if (ruta.startsWith('/public/')) {
    const slug = ruta.replace('/public/', '');
    const catalog = getCatalogBySlug(slug);
    return {
      title: catalog?.name ? `${catalog.name} | AK Producciones Eventos` : '',
      description: catalog?.hero?.subheadline || '',
    };
  }

  if (ruta.startsWith('/landing/')) {
    const slug = ruta.replace('/landing/', '');
    const promo = PROMO_PAGES[slug];
    if (promo) {
      return {
        title: promo.metadata?.title || '',
        description: promo.metadata?.description || '',
      };
    }
    const campaign = CAMPAIGN_LANDING_MAP[slug];
    if (campaign) {
      return {
        title: campaign.title || '',
        description: campaign.description || '',
      };
    }
  }

  return { title: '', description: '' };
}
