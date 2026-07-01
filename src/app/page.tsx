import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import TechnologyExperienceSection from '@/components/landing/TechnologyExperienceSection';
import { AkDifferenceSection } from '@/components/landing/AkDifferenceSection';
import { AkTeamStorySection } from '@/components/landing/AkTeamStorySection';
import { GallerySection } from '@/components/landing/GallerySection';
import { VideoSection } from '@/components/landing/VideoSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CTASection } from '@/components/landing/CTASection';
import { FAQSection } from '@/components/landing/FAQSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { ProcessSection } from '@/components/landing/ProcessSection';
import { PublicFooter } from '@/components/public-footer';
import defaultTestimonials from '@/data/testimonials.json';
import defaultGaleriaPublica from '@/data/galeria-publica.json';
import defaultCatalogoFotos from '@/data/catalogo-fotos.json';
import { BlogSection } from '@/components/landing/BlogSection';
import { FloatingActions } from '@/components/public/FloatingActions';
import { SalonDestacadoSection } from '@/components/landing/SalonDestacadoSection';
import { getPromoActiva } from '@/app/actions/promos';
import { getGaleriaItems } from '@/app/actions/galeria';
import { getLandingSettings } from '@/app/actions/landing-editor';
import { getCatalogoFotos } from '@/app/actions/catalogo-fotos';
import { getTestimonials } from '@/app/actions/feedback';
import type { GaleriaFoto } from '@/types/galeria';
import type { ServiceItem } from '@/components/landing/ServicesSection';
import { getAkYoutubeVideos, AK_YOUTUBE_CHANNEL_URL } from '@/lib/youtube/ak-channel';
import { PromoWidget } from '@/components/promo/PromoWidget';
import { LandingSpaContainer } from '@/components/landing/LandingSpaContainer';
import { WinSechWidgets } from '@/components/landing/WinSechWidgets';
import { InstagramSyncStrip, type InstagramSyncItem } from '@/components/landing/InstagramSyncStrip';
import { getSocialConnections } from '@/app/actions/social-connections';

export const revalidate = 300;

const DEFAULT_DYNAMIC_SERVICE_SUBTITLE = 'Servicio AK';
const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/akproduccioneseventos/';

function getInstagramHandle(profileUrl?: string, username?: string) {
  const raw = username || profileUrl || '@akproduccioneseventos';
  const cleaned = raw
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/[/?#].*$/g, '')
    .replace(/^@/, '')
    .trim();
  return `@${cleaned || 'akproduccioneseventos'}`;
}

function getDefaultServiceImage(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('boda') || lower.includes('casamiento')) {
    return '/media/catalogo-servicios/boda_persuasiva.png';
  }
  if (lower.includes('15') || lower.includes('quince')) {
    return '/media/catalogo-servicios/quinceanera_persuasiva.png';
  }
  if (lower.includes('corporat') || lower.includes('empres')) {
    return '/media/catalogo-servicios/corporativo_persuasivo.png';
  }
  if (lower.includes('cumple') || lower.includes('social')) {
    return '/media/catalogo-servicios/social_persuasivo.png';
  }
  if (lower.includes('tecnolog') || lower.includes('interact') || lower.includes('web') || lower.includes('digital') || lower.includes('portal') || lower.includes('muro')) {
    return '/media/catalogo-servicios/tecnologia_fiesta.png';
  }
  if (lower.includes('salon') || lower.includes('salÃ³n') || lower.includes('club') || lower.includes('uruguay') || lower.includes('decor') || lower.includes('ambient')) {
    return '/media/catalogo-servicios/blog_salon.png';
  }
  if (lower.includes('disco') || lower.includes('mÃºsica') || lower.includes('dj') || lower.includes('sonido') || lower.includes('iluminac')) {
    return '/media/catalogo-servicios/blog_iluminacion.png';
  }
  if (lower.includes('bar') || lower.includes('trago') || lower.includes('bebida')) {
    return '/media/catalogo-servicios/blog_bebidas.png';
  }
  if (lower.includes('catering') || lower.includes('comida') || lower.includes('menÃº') || lower.includes('menus')) {
    return '/media/catalogo-servicios/blog_comida.png';
  }
  return '/media/catalogo-servicios/blog_presupuesto.png';
}

function getDefaultServiceFeatures(title: string): string[] {
  const lower = title.toLowerCase();
  if (lower.includes('boda') || lower.includes('casamiento')) {
    return ['CoordinaciÃ³n del gran dÃ­a', 'DecoraciÃ³n y flores premium', 'Comida y discoteca a medida'];
  }
  if (lower.includes('15') || lower.includes('quince')) {
    return ['Show de luces y pistas LED', 'Torta y mesa dulce personalizada', 'Cabinas y recuerdos en vivo'];
  }
  if (lower.includes('club uruguay')) {
    return ['UbicaciÃ³n cÃ©ntrica tradicional', 'Estructura clÃ¡sica elegante', 'Servicios y personal incluidos'];
  }
  if (lower.includes('tecnologÃ­a') || lower.includes('interact')) {
    return ['InvitaciÃ³n web digital con QR', 'Muro Social interactivo en pantalla', 'Acceso al Portal del Cliente'];
  }
  if (lower.includes('cumple') || lower.includes('social')) {
    return ['MÃºsica para todas las edades', 'AnimaciÃ³n y juegos integrados', 'DecoraciÃ³n temÃ¡tica adaptada'];
  }
  if (lower.includes('corporat') || lower.includes('empres')) {
    return ['Conferencias y lanzamientos', 'Proyectores y micrÃ³fonos pro', 'Livings y recepciÃ³n formal'];
  }
  if (lower.includes('disco') || lower.includes('mÃºsica') || lower.includes('dj') || lower.includes('sonido')) {
    return ['Sonido HD para pistas exigentes', 'RobÃ³ticas y efectos especiales', 'Discoteca profesional en vivo'];
  }
  if (lower.includes('decor') || lower.includes('ambient')) {
    return ['Centros de mesa Ãºnicos', 'Fondos para fotos e ingresos', 'IluminaciÃ³n ambiental decorativa'];
  }
  if (lower.includes('comida') || lower.includes('catering')) {
    return ['Platos principales servidos', 'Bocados para la recepciÃ³n', 'Opciones vegetarianas y celÃ­acas'];
  }
  return ['ProducciÃ³n profesional', 'Todo en un solo lugar', 'AtenciÃ³n cercana en Salto'];
}


export async function generateMetadata(): Promise<Metadata> {
  const settings = await getLandingSettings();
  return {
    title: `${settings.seo.title || 'AK Producciones'} | OrganizaciÃ³n Integral de Eventos en Salto`,
    description: settings.seo.description || 'OrganizaciÃ³n completa de bodas, fiestas de 15 aÃ±os y eventos empresariales en Salto, Uruguay. Discoteca, comida premium, fotografÃ­a, decoraciÃ³n y salones de fiesta en un solo lugar con tecnologÃ­a interactiva.',
    openGraph: {
      title: settings.seo.title,
      description: settings.seo.description,
      type: 'website',
      images: settings.seo.ogImageUrl
        ? [{ url: settings.seo.ogImageUrl, width: 1200, height: 630, alt: 'AK Producciones Eventos' }]
        : [],
    },
  };
}

interface LandingPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: LandingPageProps) {
  const resolvedSearchParams = await searchParams;
  const [promo, galeriaData, landingSettings, catalogoFotos, youtubeVideos, testimonialData, socialConnections] = await Promise.all([
    getPromoActiva(),
    getGaleriaItems(),
    getLandingSettings(),
    getCatalogoFotos().catch(() => []),
    getAkYoutubeVideos(),
    getTestimonials().catch(() => []),
    getSocialConnections().catch(() => []),
  ]);

  const fotos = (galeriaData?.fotos && galeriaData.fotos.length > 0) ? (galeriaData.fotos as GaleriaFoto[]) : (defaultGaleriaPublica.fotos as GaleriaFoto[]);
  const videos = (galeriaData?.videos && galeriaData.videos.length > 0) ? (galeriaData.videos as any[]) : (defaultGaleriaPublica.videos as any[]);
  const videoIds = new Set(videos.map((video) => video.youtubeId));
  const videosCombinados = [
    ...videos,
    ...youtubeVideos.filter((video) => !videoIds.has(video.youtubeId)),
  ];

  const galeriaUrls = new Set(fotos.map(f => f.url));
  const safeCatalogoFotos = (catalogoFotos && catalogoFotos.length > 0) ? catalogoFotos : defaultCatalogoFotos;
  const catalogoComoGaleria: GaleriaFoto[] = (safeCatalogoFotos as any)
    .filter((f: any) => !galeriaUrls.has(f.url))
    .map((f: any) => ({
      id: f.id,
      tipo: 'foto' as const,
      url: f.url,
      titulo: f.titulo,
      description: f.descripcion,
      categoria: f.categoriaServicio,
      destacada: f.destacada,
      orden: fotos.length + f.orden,
      createdAt: f.createdAt,
    }));
  const fotosCombinadas = [...fotos, ...catalogoComoGaleria];
  const instagramConnection = (socialConnections as any[]).find((connection) => connection.platform === 'Instagram' && connection.isConnected);
  const instagramProfileUrl = instagramConnection?.profileUrl || DEFAULT_INSTAGRAM_URL;
  const instagramHandle = getInstagramHandle(instagramProfileUrl, instagramConnection?.username);
  const instagramPhotoItems: InstagramSyncItem[] = (safeCatalogoFotos as any[])
    .filter((foto) => foto.source === 'instagram' || String(foto.titulo || '').toLowerCase().startsWith('instagram'))
    .map((foto) => ({
      id: foto.id,
      type: 'photo' as const,
      imageUrl: foto.url,
      title: foto.titulo || 'Foto sincronizada de Instagram',
      category: foto.categoriaServicio,
    }));
  const instagramVideoItems: InstagramSyncItem[] = videosCombinados
    .filter((video: any) => String(video.youtubeUrl || '').includes('instagram.com') || String(video.youtubeId || '').startsWith('ig_'))
    .map((video: any) => ({
      id: video.id || video.youtubeId,
      type: 'video' as const,
      imageUrl: video.thumbnailUrl || '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
      title: video.titulo || 'Reel sincronizado de Instagram',
      category: video.categoria,
      href: video.youtubeUrl,
    }));
  const fallbackInstagramItems: InstagramSyncItem[] = instagramPhotoItems.length + instagramVideoItems.length > 0
    ? []
    : (safeCatalogoFotos as any[]).slice(0, 4).map((foto) => ({
        id: `fallback-${foto.id}`,
        type: 'photo' as const,
        imageUrl: foto.url,
        title: foto.titulo || 'Produccion AK en redes',
        category: foto.categoriaServicio,
      }));
  const instagramItems = [...instagramVideoItems, ...instagramPhotoItems, ...fallbackInstagramItems].slice(0, 8);

  const whatsapp = '59898355530'; // Usar el nÃºmero real de contacto de la empresa
  const safeTestimonialData = (testimonialData && testimonialData.length > 0) ? testimonialData : defaultTestimonials;
  const approvedTestimonials = (safeTestimonialData as any)
    .filter((testimonial: any) => testimonial.isApproved)
    .map((testimonial: any, index: number) => {
      const initials = testimonial.clientName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part: any) => part.charAt(0).toUpperCase())
        .join('');
      const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-blue-600', 'bg-amber-600'];
      return {
        id: testimonial.id,
        name: testimonial.clientName,
        role: 'Cliente AK',
        eventType: testimonial.fiestaNombre,
        text: testimonial.testimonialText,
        avatarInitials: initials || 'AK',
        avatarColor: colors[index % colors.length],
        rating: 5,
      };
    });

  const servicesForLanding: ServiceItem[] | undefined = landingSettings.services?.length
    ? landingSettings.services.map((service) => ({
      id: service.id,
      title: service.title,
      subtitle: DEFAULT_DYNAMIC_SERVICE_SUBTITLE,
      description: service.description,
      features: getDefaultServiceFeatures(service.title),
      imageUrl: service.imageUrl || getDefaultServiceImage(service.title),
      imageHint: 'event service',
      accentColor: 'bg-primary',
      emoji: service.icon || 'âœ¨',
      whatsappMessage: `Â¡Hola AK Producciones! Me gustarÃ­a cotizar el servicio de ${service.title}.`,
    }))
    : undefined;

  // JSON-LD Structured Data for Local Business SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EventVenue',
    'name': 'AK Producciones',
    'image': fotosCombinadas.slice(0, 3).map(f => f.url),
    'telephone': '+598 98 355 530',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Gaboto 3390',
      'addressLocality': 'Salto',
      'addressCountry': 'UY',
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': -31.3893,  // Coordenadas de Salto, Uruguay
      'longitude': -57.9592,
    },
    'url': 'https://akproducciones.uy',
    'sameAs': [
      'https://www.facebook.com/akproduccionessalto',
      instagramProfileUrl,
    ],
    'description': 'OrganizaciÃ³n integral de eventos en Salto, Uruguay. Discoteca, comida premium, fotografÃ­a, decoraciÃ³n y salones de fiesta en un solo lugar con tecnologÃ­a interactiva.',
  };

  return (
    <div className="bg-zinc-950 min-h-screen text-white selection:bg-indigo-600 selection:text-white">
      {/* Inject JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {promo && <PromoWidget promo={promo} />}

      <LandingSpaContainer
        hero={
          <div className="w-full flex flex-col justify-between min-h-screen">
            <LandingNav whatsappNumber={whatsapp} />
            <HeroSection
              whatsappNumber={whatsapp}
              promoActiva={promo}
              headline={landingSettings.hero.headline}
              subheadline={landingSettings.hero.subheadline}
              backgroundImageUrl="/media/catalogo-servicios/quinceanera_hero.png"
              simulatorHref="/simulador-de-presupuesto"
              simulatorLabel="CotizÃ¡ tu Fiesta"
            />
          </div>
        }
        stats={<StatsSection stats={landingSettings.stats.length > 0 ? landingSettings.stats : undefined} />}
        difference={<AkDifferenceSection />}
        services={<ServicesSection whatsappNumber={whatsapp} services={servicesForLanding} />}
        technology={<TechnologyExperienceSection whatsappNumber={whatsapp} />}
        salon={<SalonDestacadoSection />}
        team={<AkTeamStorySection />}
        process={<ProcessSection />}
        gallery={<GallerySection galeriaFotos={fotosCombinadas} />}
        instagram={<InstagramSyncStrip handle={instagramHandle} profileUrl={instagramProfileUrl} items={instagramItems} />}
        blog={<BlogSection />}
        video={<VideoSection galeriaVideos={videosCombinados} channelUrl={AK_YOUTUBE_CHANNEL_URL} />}
        testimonials={<TestimonialsSection testimonials={approvedTestimonials} />}
        faq={<FAQSection faqs={landingSettings.faqs} />}
        cta={
          <CTASection
            whatsappNumber={whatsapp}
            headline={landingSettings.cta.headline}
            subheadline={landingSettings.cta.subheadline}
            ctaLabel={landingSettings.cta.ctaLabel}
            instagramUrl={instagramProfileUrl}
          />
        }
        footer={<PublicFooter variant="dark" />}
        floatingActions={<FloatingActions whatsappNumber={whatsapp} />}
        winSech={<WinSechWidgets instagramUrl={instagramProfileUrl} instagramHandle={instagramHandle} />}
      />
    </div>
  );
}
