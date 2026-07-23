import type { Metadata } from "next";
import { cache } from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import TechnologyExperienceSection from "@/components/landing/TechnologyExperienceSection";
import { AkTeamStorySection } from "@/components/landing/AkTeamStorySection";
import { VideoSection } from "@/components/landing/VideoSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { FAQSection } from "@/components/landing/FAQSection";
import { PublicFooter } from "@/components/public-footer";
import defaultTestimonials from "@/data/testimonials.json";
import defaultGaleriaPublica from "@/data/galeria-publica.json";
import defaultCatalogoFotos from "@/data/catalogo-fotos.json";
import { BlogSection } from "@/components/landing/BlogSection";
import { FloatingActions } from "@/components/public/FloatingActions";
import { SalonDestacadoSection } from "@/components/landing/SalonDestacadoSection";
import { defaultLandingSettings } from "@/types/landing-editor";
import { getPromoActiva } from "@/app/actions/promos";
import { getLandingSettings } from "@/app/actions/landing-editor";
import { getCatalogoFotos } from "@/app/actions/catalogo-fotos";
import { getGaleriaItems } from "@/app/actions/galeria";
import { getSalones } from "@/app/actions/salones";
import { getTestimonials } from "@/app/actions/feedback";
import type { GaleriaFoto } from "@/types/galeria";
import type { GaleriaVideo } from "@/types/galeria";
import type { ServiceItem } from "@/components/landing/ServicesSection";
import {
  getAkYoutubeVideos,
  AK_YOUTUBE_CHANNEL_URL,
} from "@/lib/youtube/ak-channel";
import { PromoWidget } from "@/components/promo/PromoWidget";
import { AK_WHATSAPP_NUMBER } from "@/lib/public-contact";
import { LandingSpaContainer } from "@/components/landing/LandingSpaContainer";
import { getSocialConnections } from "@/app/actions/social-connections";
import {
  InstagramSyncStrip,
  type InstagramSyncItem,
} from "@/components/landing/InstagramSyncStrip";
import { getPublicInstagramFeed } from "@/lib/instagram/public-feed";
import { isClubUruguay } from "@/lib/club-uruguay";
import { getDynamicSalonPhotos, type SalonPhoto } from "@/lib/salon-helper";
export const revalidate = 300;
const DEFAULT_DYNAMIC_SERVICE_SUBTITLE = "Servicio AK";
const DEFAULT_INSTAGRAM_URL =
  "https://www.instagram.com/akproduccioneseventos/";
const SITE_URL = "https://akproducciones.uy";
const DEFAULT_SEO_TITLE = "AK Producciones Eventos";
const DEFAULT_SEO_DESCRIPTION =
  "Organización completa de bodas, fiestas de 15 años y eventos empresariales en Salto, Uruguay. Discoteca, comida premium, fotografía, decoración y salones de fiesta en un solo lugar con tecnología interactiva.";
const DEFAULT_OG_IMAGE = "/media/catalogo-servicios/quinceanera_hero.png";
const getCachedLandingSettings = cache(getLandingSettings);

async function withPublicFallback<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 3_500,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
function getInstagramHandle(profileUrl?: string, username?: string) {
  const raw = username || profileUrl || "@akproduccioneseventos";
  const cleaned = raw
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/g, "")
    .replace(/^@/, "")
    .trim();
  return `@${cleaned || "akproduccioneseventos"}`;
}

function withoutUrlQuery(value: string) {
  return value.split(/[?#]/, 1)[0].replace(/\/$/, "").toLowerCase();
}

function dedupeGalleryPhotos(items: GaleriaFoto[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.url) return false;
    const key = item.sourceId
      ? `${item.source || "source"}:${item.sourceId}`
      : `url:${withoutUrlQuery(item.url)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeGalleryVideos(items: GaleriaVideo[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.sourceId
      ? `${item.source || "source"}:${item.sourceId}`
      : item.youtubeId
        ? `video:${item.youtubeId}`
        : `url:${withoutUrlQuery(item.youtubeUrl || item.embedUrl || item.id)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeSalonPhotos(items: SalonPhoto[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.src || seen.has(item.src)) return false;
    seen.add(item.src);
    return true;
  });
}
function getDefaultServiceImage(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("boda") || lower.includes("casamiento")) {
    return "/media/catalogo-servicios/boda_persuasiva.png";
  }
  if (lower.includes("15") || lower.includes("quince")) {
    return "/media/catalogo-servicios/quinceanera_persuasiva.png";
  }
  if (lower.includes("corporat") || lower.includes("empres")) {
    return "/media/catalogo-servicios/corporativo_persuasivo.png";
  }
  if (lower.includes("cumple") || lower.includes("social")) {
    return "/media/catalogo-servicios/social_persuasivo.png";
  }
  if (
    lower.includes("tecnolog") ||
    lower.includes("interact") ||
    lower.includes("web") ||
    lower.includes("digital") ||
    lower.includes("portal") ||
    lower.includes("muro")
  ) {
    return "/media/catalogo-servicios/tecnologia_fiesta.png";
  }
  if (
    lower.includes("salon") ||
    lower.includes("salón") ||
    lower.includes("club") ||
    lower.includes("uruguay") ||
    lower.includes("decor") ||
    lower.includes("ambient")
  ) {
    return "/media/catalogo-servicios/blog_salon.png";
  }
  if (
    lower.includes("disco") ||
    lower.includes("música") ||
    lower.includes("dj") ||
    lower.includes("sonido") ||
    lower.includes("iluminac")
  ) {
    return "/media/catalogo-servicios/blog_iluminacion.png";
  }
  if (
    lower.includes("bar") ||
    lower.includes("trago") ||
    lower.includes("bebida")
  ) {
    return "/media/catalogo-servicios/blog_bebidas.png";
  }
  if (
    lower.includes("catering") ||
    lower.includes("comida") ||
    lower.includes("menú") ||
    lower.includes("menus")
  ) {
    return "/media/catalogo-servicios/blog_comida.png";
  }
  return "/media/catalogo-servicios/blog_presupuesto.png";
}
function getDefaultServiceFeatures(title: string): string[] {
  const lower = title.toLowerCase();
  if (lower.includes("boda") || lower.includes("casamiento")) {
    return [
      "Coordinación del gran día",
      "Decoración y flores premium",
      "Comida y discoteca a medida",
    ];
  }
  if (lower.includes("15") || lower.includes("quince")) {
    return [
      "Show de luces y pistas LED",
      "Torta y mesa dulce personalizada",
      "Cabinas y recuerdos en vivo",
    ];
  }
  if (lower.includes("club uruguay")) {
    return [
      "Ubicación céntrica tradicional",
      "Estructura clásica elegante",
      "Servicios y personal incluidos",
    ];
  }
  if (lower.includes("tecnología") || lower.includes("interact")) {
    return [
      "Invitación web digital con QR",
      "Muro Social interactivo en pantalla",
      "Acceso al Portal del Cliente",
    ];
  }
  if (lower.includes("cumple") || lower.includes("social")) {
    return [
      "Música para todas las edades",
      "Animación y juegos integrados",
      "Decoración temática adaptada",
    ];
  }
  if (lower.includes("corporat") || lower.includes("empres")) {
    return [
      "Conferencias y lanzamientos",
      "Proyectores y micrófonos pro",
      "Livings y recepción formal",
    ];
  }
  if (
    lower.includes("disco") ||
    lower.includes("música") ||
    lower.includes("dj") ||
    lower.includes("sonido")
  ) {
    return [
      "Sonido HD para pistas exigentes",
      "Robóticas y efectos especiales",
      "Discoteca profesional en vivo",
    ];
  }
  if (lower.includes("decor") || lower.includes("ambient")) {
    return [
      "Centros de mesa únicos",
      "Fondos para fotos e ingresos",
      "Iluminación ambiental decorativa",
    ];
  }
  if (lower.includes("comida") || lower.includes("catering")) {
    return [
      "Platos principales servidos",
      "Bocados para la recepción",
      "Opciones vegetarianas y celíacas",
    ];
  }
  return [
    "Producción profesional",
    "Todo en un solo lugar",
    "Atención cercana en Salto",
  ];
}
export async function generateMetadata(): Promise<Metadata> {
  const settings = await withPublicFallback(
    getCachedLandingSettings(),
    defaultLandingSettings,
    2_500,
  );
  const title = `${settings.seo.title || DEFAULT_SEO_TITLE} | Organización Integral de Eventos en Salto`;
  const description = settings.seo.description || DEFAULT_SEO_DESCRIPTION;
  const ogImage = settings.seo.ogImageUrl || DEFAULT_OG_IMAGE;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      type: "website",
      url: SITE_URL,
      siteName: "AK Producciones Eventos",
      locale: "es_UY",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "AK Producciones Eventos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  };
}
interface LandingPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}
export default async function HomePage({ searchParams }: LandingPageProps) {
  const resolvedSearchParams = await searchParams;
  const [
    promo,
    landingSettings,
    catalogoFotos,
    youtubeVideos,
    testimonialData,
    socialConnections,
    galeriaData,
    instagramFeed,
    salones,
  ] = await Promise.all([
    withPublicFallback(getPromoActiva(), null),
    withPublicFallback(getCachedLandingSettings(), defaultLandingSettings),
    withPublicFallback(getCatalogoFotos(), []),
    getAkYoutubeVideos(),
    withPublicFallback(getTestimonials(), []),
    withPublicFallback(getSocialConnections(), []),
    withPublicFallback(getGaleriaItems(), { fotos: [], videos: [] }),
    withPublicFallback(getPublicInstagramFeed(), [], 4_500),
    withPublicFallback(getSalones(), []),
  ]);
  const fotos = defaultGaleriaPublica.fotos as GaleriaFoto[];
  const videos = defaultGaleriaPublica.videos as GaleriaVideo[];
  const safeCatalogoFotos =
    catalogoFotos && catalogoFotos.length > 0
      ? catalogoFotos
      : defaultCatalogoFotos;
  const catalogoComoGaleria: GaleriaFoto[] = (safeCatalogoFotos as any)
    .map((f: any) => ({
      id: f.id,
      tipo: "foto" as const,
      url: f.url,
      titulo: f.titulo,
      descripcion: f.descripcion,
      categoria: f.categoriaServicio,
      destacada: f.destacada,
      orden: fotos.length + f.orden,
      createdAt: f.createdAt,
      source: f.source || "catalogo",
      sourceId: f.sourceId,
      sourceUrl: f.sourceUrl,
    }));
  const instagramFotos: GaleriaFoto[] = instagramFeed
    .filter((post) => post.mediaType === "image")
    .map((post, index) => ({
      id: post.id,
      tipo: "foto",
      url: post.mediaUrl,
      titulo: "Trabajo reciente de AK Producciones",
      descripcion: post.caption,
      categoria: "Instagram",
      destacada: true,
      orden: index,
      createdAt: post.publishedAt || new Date(0).toISOString(),
      source: "instagram",
      sourceId: post.sourceId,
      sourceUrl: post.permalink,
    }));
  const fotosCombinadas = dedupeGalleryPhotos([
    ...instagramFotos,
    ...(galeriaData.fotos || []),
    ...fotos,
    ...catalogoComoGaleria,
  ]);

  const instagramVideos: GaleriaVideo[] = instagramFeed
    .filter((post) => post.mediaType === "video")
    .map((post, index) => ({
      id: post.id,
      tipo: "video",
      youtubeUrl: post.permalink,
      youtubeId: post.id,
      plataforma: "archivo",
      thumbnailUrl: post.mediaUrl,
      titulo: "Video reciente de AK Producciones",
      descripcion: post.caption,
      categoria: "Instagram",
      destacada: true,
      orden: index,
      createdAt: post.publishedAt || new Date(0).toISOString(),
      source: "instagram",
      sourceId: post.sourceId,
      sourceUrl: post.permalink,
    }));
  const videosCombinados = dedupeGalleryVideos([
    ...instagramVideos,
    ...(galeriaData.videos || []),
    ...videos,
    ...youtubeVideos,
  ]);
  const instagramConnection = (socialConnections as any[]).find(
    (connection) =>
      connection.platform === "Instagram" && connection.isConnected,
  );
  const instagramProfileUrl =
    instagramConnection?.profileUrl || DEFAULT_INSTAGRAM_URL;
  const instagramHandle = getInstagramHandle(
    instagramProfileUrl,
    instagramConnection?.username,
  );
  const instagramApiConnected = instagramFeed.length > 0;
  const instagramItems: InstagramSyncItem[] = instagramFeed.map((post) => ({
    id: post.id,
    type: post.mediaType === "video" ? "video" : "photo",
    imageUrl: post.mediaUrl,
    title: post.caption || "Evento AK Producciones",
    category: post.mediaType === "video" ? "Reel" : "Instagram",
    href: post.permalink,
  }));
  const clubSalon = salones.find((salon) => salon.esClubUruguay || isClubUruguay(salon.nombre));
  const masterClubPhotos: SalonPhoto[] = (clubSalon?.fotos || []).map((src, index) => ({
    src,
    alt: `Club Uruguay, vista ${index + 1}`,
    title: index === 0 ? "Club Uruguay" : `Vista ${index + 1}`,
    description: "Foto cargada desde el módulo maestro de salones.",
  }));
  const clubPhotos = dedupeSalonPhotos([...masterClubPhotos, ...getDynamicSalonPhotos()]);
  const whatsapp = AK_WHATSAPP_NUMBER;
  /* Usar el número real de contacto de la empresa */ const safeTestimonialData =
    testimonialData && testimonialData.length > 0
      ? testimonialData
      : defaultTestimonials;
  const approvedTestimonials = (safeTestimonialData as any)
    .filter((testimonial: any) => testimonial.isApproved)
    .map((testimonial: any, index: number) => {
      const initials = testimonial.clientName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part: any) => part.charAt(0).toUpperCase())
        .join("");
      const colors = [
        "bg-indigo-600",
        "bg-emerald-600",
        "bg-blue-600",
        "bg-amber-600",
      ];
      return {
        id: testimonial.id,
        name: testimonial.clientName,
        role: "Cliente AK",
        eventType: testimonial.fiestaNombre,
        text: testimonial.testimonialText,
        avatarInitials: initials || "AK",
        avatarColor: colors[index % colors.length],
        rating: 5,
      };
    });
  const servicesForLanding: ServiceItem[] | undefined = landingSettings.services
    ?.length
    ? landingSettings.services.map((service) => ({
        id: service.id,
        title: service.title,
        subtitle: DEFAULT_DYNAMIC_SERVICE_SUBTITLE,
        description: service.description,
        features: getDefaultServiceFeatures(service.title),
        imageUrl: service.imageUrl || getDefaultServiceImage(service.title),
        imageHint: "event service",
        accentColor: "bg-primary",
        emoji: service.icon || "AK",
        whatsappMessage: `¡Hola AK Producciones! Me gustaría cotizar el servicio de ${service.title}.`,
      }))
    : undefined;
  /* JSON-LD Structured Data for Local Business SEO */ const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EventVenue",
    name: "AK Producciones",
    image: fotosCombinadas.slice(0, 3).map((f) => f.url),
    telephone: "+598 98 355 530",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Gaboto 3390",
      addressLocality: "Salto",
      addressCountry: "UY",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -31.3893,
      /* Coordenadas de Salto, Uruguay */ longitude: -57.9592,
    },
    url: "https://akproducciones.uy",
    sameAs: [
      "https://www.facebook.com/akproduccionessalto",
      instagramProfileUrl,
    ],
    description:
      "Organización integral de eventos en Salto, Uruguay. Discoteca, comida premium, fotografía, decoración y salones de fiesta en un solo lugar con tecnología interactiva.",
  };
  return (
    <div className="bg-zinc-950 min-h-screen text-white selection:bg-red-700 selection:text-white">
      {" "}
      {/* Inject JSON-LD Schema for SEO */}{" "}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />{" "}
      {promo && <PromoWidget promo={promo} />}{" "}
      <LandingSpaContainer
        hero={
          <div className="flex w-full flex-col justify-between">
            {" "}
            <LandingNav />{" "}
            <HeroSection
              whatsappNumber={whatsapp}
              promoActiva={promo}
              headline={landingSettings.hero.headline}
              subheadline={landingSettings.hero.subheadline}
              backgroundImageUrl="/media/catalogo-servicios/quinceanera_hero.png"
              simulatorHref="/simulador-de-presupuesto"
              simulatorLabel="Cotizá tu Fiesta"
            />{" "}
          </div>
        }
        stats={null}
        difference={null}
        services={
          <ServicesSection
            whatsappNumber={whatsapp}
            services={servicesForLanding}
          />
        }
        technology={<TechnologyExperienceSection whatsappNumber={whatsapp} />}
        salon={<SalonDestacadoSection photos={clubPhotos} capacity={clubSalon?.capacidad} />}
        team={<AkTeamStorySection />}
        process={null}
        gallery={<GallerySection galeriaFotos={fotosCombinadas} />}
        instagram={null}
        blog={<BlogSection />}
        video={
          <VideoSection
            galeriaVideos={videosCombinados}
            channelUrl={AK_YOUTUBE_CHANNEL_URL}
          />
        }
        testimonials={
          <TestimonialsSection testimonials={approvedTestimonials} />
        }
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
        winSech={null}
      />{" "}
    </div>
  );
}
