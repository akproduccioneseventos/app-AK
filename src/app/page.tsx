import type { Metadata } from "next";
import { tituloQueSirve } from '@/lib/seo/titulo-de-la-portada';
import { cache, Suspense } from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { LaAppDeTuFiestaSection } from "@/components/landing/LaAppDeTuFiestaSection";
import TechnologyExperienceSection from "@/components/landing/TechnologyExperienceSection";
import { InteractiveTechShowcase } from "@/components/public/InteractiveTechShowcase";
import { AkTeamStorySection } from "@/components/landing/AkTeamStorySection";
import { AkDifferenceSection } from "@/components/landing/AkDifferenceSection";
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
import { StatsSection } from "@/components/landing/StatsSection";
import { defaultLandingSettings } from "@/types/landing-editor";
import { getPromoActiva } from "@/app/actions/promos";
import { getLandingSettings } from "@/app/actions/landing-editor";
import { getCatalogoFotos } from "@/app/actions/catalogo-fotos";
import { getGaleriaItems } from "@/app/actions/galeria";
import { getSalonesPublicos } from "@/app/actions/salones";
import { getTestimonials } from "@/app/actions/feedback";
import type { GaleriaFoto } from "@/types/galeria";
import type { GaleriaVideo } from "@/types/galeria";
import type { ServiceItem } from "@/components/landing/ServicesSection";
import {
  getAkYoutubeVideos,
  AK_YOUTUBE_CHANNEL_URL,
} from "@/lib/youtube/ak-channel";
import {
  Building2,
  MapPin,
  Users,
  Play,
  HeartHandshake,
  BookOpen,
} from "lucide-react";
import { PromoWidget } from "@/components/promo/PromoWidget";
import { AK_WHATSAPP_NUMBER } from "@/lib/public-contact";
import { LandingSpaContainer } from "@/components/landing/LandingSpaContainer";
import { getPublicEventTypeImage } from "@/components/landing/event-type-images";
import { getSocialConnectionsPublicas } from "@/app/actions/social-connections";
import { getPublicInstagramFeed } from "@/lib/instagram/public-feed";
import { isClubUruguay } from "@/lib/club-uruguay";
import { getDynamicSalonPhotos, type SalonPhoto } from "@/lib/salon-helper";
import { getBlogPosts } from "@/app/actions/blog";
import { ponerAlDiaAlEntrar } from "@/lib/automatico/al-entrar-a-la-app";
export const revalidate = 300;
const DEFAULT_DYNAMIC_SERVICE_SUBTITLE = "Servicio AK";
const DEFAULT_INSTAGRAM_URL =
  "https://www.instagram.com/akproduccionesfiestasyeventos/";
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
  return "/media/catalogo-servicios/organizador_equipo.png";
}

function getSemanticServiceImage(title: string, configuredImage?: string): string {
  // Public event cards use a verified, semantic image instead of arbitrary editor data.
  return getPublicEventTypeImage(title) || configuredImage || getDefaultServiceImage(title);
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
  const title = `${tituloQueSirve(settings.seo.title)} | Organización Integral de Eventos en Salto`;
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
function SalonSkeleton() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-20 text-slate-950 sm:py-24" aria-busy="true">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-700">
            <Building2 className="h-4 w-4" aria-hidden="true" /> Salón destacado
          </p>
          <h2 className="mt-4 font-headline text-4xl font-black leading-tight sm:text-5xl lg:text-6xl tracking-tight text-slate-950">
            Club Uruguay
          </h2>
          <p className="mt-5 text-base sm:text-lg font-medium leading-relaxed text-slate-600">
            Un espacio emblemático en el centro de Salto, preparado por AK Producciones con catering, música, ambientación, personal y tecnología coordinados en una sola propuesta.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <MapPin className="h-5 w-5 text-red-700" aria-hidden="true" />
              <p className="mt-3 font-black text-slate-950">Centro de Salto</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">Club Uruguay, un salón conocido para celebrar.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Users className="h-5 w-5 text-red-700" aria-hidden="true" />
              <p className="mt-3 font-black text-slate-950">Salón para eventos</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">Espacio preparado para grandes celebraciones.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-12">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-900 shadow-xl sm:col-span-8 sm:row-span-2 sm:aspect-auto sm:min-h-[500px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <div className="h-8 w-8 rounded-full border-2 border-red-600/40 border-t-red-600 animate-spin" />
              <span className="text-xs font-semibold tracking-wider text-slate-300">Cargando vistas del salón...</span>
            </div>
          </div>
          <div className="hidden sm:block sm:col-span-4 rounded-3xl bg-slate-200/60 border border-slate-200/80 min-h-[240px]" />
          <div className="hidden sm:block sm:col-span-4 rounded-3xl bg-slate-200/60 border border-slate-200/80 min-h-[240px]" />
        </div>
      </div>
    </section>
  );
}

async function AsyncSalonSection() {
  const salones = await withPublicFallback(getSalonesPublicos(), []);
  const clubSalon = salones.find((salon) => salon.esClubUruguay || isClubUruguay(salon.nombre));
  const masterClubPhotos: SalonPhoto[] = (clubSalon?.fotos || []).map((src, index) => ({
    src,
    alt: `Club Uruguay, vista ${index + 1}`,
    title: index === 0 ? "Club Uruguay" : `Vista ${index + 1}`,
    description: "Foto cargada desde el módulo maestro de salones.",
  }));
  const clubPhotos = dedupeSalonPhotos([...masterClubPhotos, ...getDynamicSalonPhotos()]);
  return <SalonDestacadoSection photos={clubPhotos} capacity={clubSalon?.capacidad} />;
}

function GallerySkeleton() {
  return (
    <section id="galeria" data-testid="gallery-section" className="border-y border-neutral-200 bg-neutral-100 py-20 text-slate-950 sm:py-24" aria-busy="true">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-bold text-red-700">Eventos reales</p>
          <h2 className="mt-3 font-headline text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
            Galería de eventos
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Momentos reales de nuestras producciones: gastronomía, salones, pista LED, discoteca y ambientación.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 min-h-[384px]">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-neutral-300/80 bg-neutral-200/50 h-44 flex items-center justify-center">
              <span className="text-xs font-medium text-neutral-400">Cargando...</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function AsyncGallerySection() {
  const [catalogoFotos, galeriaData, instagramFeed] = await Promise.all([
    withPublicFallback(getCatalogoFotos(), []),
    withPublicFallback(getGaleriaItems(), { fotos: [], videos: [] }),
    withPublicFallback(getPublicInstagramFeed(), [], 4_500),
  ]);

  const fotos = defaultGaleriaPublica.fotos as GaleriaFoto[];
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

  return <GallerySection galeriaFotos={fotosCombinadas} />;
}

function VideoSkeleton() {
  return (
    <section id="videos" data-testid="video-section" className="border-y border-white/10 bg-zinc-900 py-20 text-white sm:py-24" aria-busy="true">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-red-400">
            <Play className="h-4 w-4" /> Momentos reales
          </p>
          {/* El MISMO titulo que muestra la seccion de verdad (`VideoSection`, "Historias en
              movimiento"). Si el cartel de espera dice otra cosa, el visitante ve el titulo
              cambiar delante suyo, que es justo el salto que este arreglo venia a sacar. */}
          <h2 className="font-headline text-4xl font-black leading-tight text-white sm:text-5xl">
            Historias en movimiento
          </h2>
          <p className="mt-2 text-base text-zinc-400">
            Registros en video de ambientaciones, shows, cabinas y pistas.
          </p>
        </div>
        <div className="aspect-video w-full max-w-4xl mx-auto rounded-3xl border border-white/10 bg-zinc-800/80 flex items-center justify-center shadow-2xl">
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
              <Play className="ml-1 h-7 w-7 fill-current opacity-80" />
            </div>
            <span className="text-xs font-semibold tracking-wider text-zinc-300">Cargando videos de producciones...</span>
          </div>
        </div>
      </div>
    </section>
  );
}

async function AsyncVideoSection() {
  const [youtubeVideos, galeriaData, instagramFeed] = await Promise.all([
    getAkYoutubeVideos(),
    withPublicFallback(getGaleriaItems(), { fotos: [], videos: [] }),
    withPublicFallback(getPublicInstagramFeed(), [], 4_500),
  ]);

  const videos = defaultGaleriaPublica.videos as GaleriaVideo[];
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

  return (
    <VideoSection
      galeriaVideos={videosCombinados}
      channelUrl={AK_YOUTUBE_CHANNEL_URL}
    />
  );
}

function TestimonialsSkeleton() {
  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-slate-50 py-20 sm:py-24" aria-busy="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-black uppercase tracking-widest text-red-400 mb-4">
            <HeartHandshake className="w-3.5 h-3.5" />
            Reseñas de clientes
          </span>
          <h2 className="mb-4 font-headline text-5xl font-black leading-tight text-slate-950 sm:text-6xl">
            Experiencias compartidas
          </h2>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-600">
            Opiniones compartidas por clientes sobre su experiencia con AK Producciones.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex min-h-[220px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div className="h-6 w-24 rounded bg-slate-100 border border-slate-200" />
                <div className="h-4 w-32 rounded bg-amber-100/60" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full rounded bg-slate-100" />
                  <div className="h-3.5 w-4/5 rounded bg-slate-100" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">AK</div>
                <div className="space-y-1">
                  <div className="h-3.5 w-24 rounded bg-slate-100" />
                  <div className="h-3 w-16 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function AsyncTestimonialsSection() {
  const testimonialData = await withPublicFallback(getTestimonials(), []);
  const safeTestimonialData =
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

  return <TestimonialsSection testimonials={approvedTestimonials} />;
}

function BlogSkeleton() {
  return (
    <section id="blog" className="overflow-hidden border-y border-slate-200 bg-white py-24 text-slate-950" aria-busy="true">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-red-700">
              <BookOpen className="h-3.5 w-3.5" />
              Consejos AK
            </span>
            <h2 className="font-headline text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              Contenido para planificar tu evento sin estrés
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Guías simples sobre presupuesto, comida, XV años, bodas y listas de organización.
            </p>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 min-h-[340px]">
              <div className="h-48 bg-slate-100 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-slate-300" />
              </div>
              <div className="p-6 space-y-3">
                <div className="h-5 w-3/4 rounded bg-slate-200/70" />
                <div className="h-3.5 w-full rounded bg-slate-100" />
                <div className="h-3.5 w-2/3 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function AsyncBlogSection() {
  const publishedBlogPosts = await withPublicFallback(getBlogPosts(), []);
  return <BlogSection posts={publishedBlogPosts} />;
}

export default async function HomePage() {
  // Red de seguridad: si el despertador de fondo tuviese alguna demora, la visita de un
  // prospecto pone al día lo que esté vencido de forma diferida en microtarea para no bloquear el primer byte de HTML.
  if (typeof setTimeout === "function") {
    setTimeout(() => {
      ponerAlDiaAlEntrar(new Date(), "visita").catch(() => null);
    }, 2000);
  }

  // SOLO esperamos promo y landingSettings (los 2 que deciden la cabecera y el hero inicial)
  const [promo, landingSettings] = await Promise.all([
    withPublicFallback(getPromoActiva(), null),
    withPublicFallback(getCachedLandingSettings(), defaultLandingSettings),
  ]);

  const whatsapp = AK_WHATSAPP_NUMBER;
  const servicesForLanding: ServiceItem[] | undefined = landingSettings.services
    ?.length
    ? landingSettings.services.map((service) => ({
        id: service.id,
        title: service.title,
        subtitle: DEFAULT_DYNAMIC_SERVICE_SUBTITLE,
        description: service.description,
        features: getDefaultServiceFeatures(service.title),
        imageUrl: getSemanticServiceImage(service.title, service.imageUrl),
        imageHint: "event service",
        accentColor: "bg-primary",
        emoji: service.icon || "AK",
        whatsappMessage: `¡Hola AK Producciones! Me gustaría cotizar el servicio de ${service.title}.`,
      }))
    : undefined;

  /* JSON-LD Structured Data for Local Business SEO */
  const defaultFotos = defaultGaleriaPublica.fotos as GaleriaFoto[];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EventVenue",
    name: "AK Producciones",
    image: defaultFotos.slice(0, 3).map((f) => f.url),
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
      longitude: -57.9592,
    },
    url: "https://akproducciones.uy",
    sameAs: [
      "https://www.facebook.com/akproduccionessalto",
      DEFAULT_INSTAGRAM_URL,
    ],
    description:
      "Organización integral de eventos en Salto, Uruguay. Discoteca, comida premium, fotografía, decoración y salones de fiesta en un solo lugar con tecnología interactiva.",
  };

  return (
    <div className="min-h-screen bg-white text-slate-950 selection:bg-red-700 selection:text-white">
      {/* Inject JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {promo && <PromoWidget promo={promo} />}
      <LandingSpaContainer
        hero={
          <div className="flex w-full flex-col justify-between">
            <LandingNav />
            <HeroSection
              whatsappNumber={whatsapp}
              promoActiva={promo}
              headline={landingSettings.hero.headline}
              subheadline={landingSettings.hero.subheadline}
              backgroundImageUrl="/media/catalogo-servicios/quinceanera_hero.png"
              simulatorHref="/simulador-de-presupuesto"
              simulatorLabel="Proyectar mi fiesta"
            />
          </div>
        }
        stats={<StatsSection stats={landingSettings.stats} />}
        difference={<AkDifferenceSection />}
        services={
          <ServicesSection
            whatsappNumber={whatsapp}
            services={servicesForLanding}
          />
        }
        technology={
          <div className="space-y-6">
            <LaAppDeTuFiestaSection whatsappNumber={whatsapp} />
            <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm font-semibold uppercase tracking-widest text-slate-500">
                Y además, las estaciones que se montan en tu fiesta
              </p>
              <InteractiveTechShowcase />
              <TechnologyExperienceSection whatsappNumber={whatsapp} />
            </div>
          </div>
        }
        salon={
          <Suspense fallback={<SalonSkeleton />}>
            <AsyncSalonSection />
          </Suspense>
        }
        team={<AkTeamStorySection />}
        process={null}
        gallery={
          <Suspense fallback={<GallerySkeleton />}>
            <AsyncGallerySection />
          </Suspense>
        }
        blog={
          <Suspense fallback={<BlogSkeleton />}>
            <AsyncBlogSection />
          </Suspense>
        }
        video={
          <Suspense fallback={<VideoSkeleton />}>
            <AsyncVideoSection />
          </Suspense>
        }
        testimonials={
          <Suspense fallback={<TestimonialsSkeleton />}>
            <AsyncTestimonialsSection />
          </Suspense>
        }
        faq={<FAQSection faqs={landingSettings.faqs} />}
        cta={
          <CTASection
            whatsappNumber={whatsapp}
            headline={landingSettings.cta.headline}
            subheadline={landingSettings.cta.subheadline}
            ctaLabel={landingSettings.cta.ctaLabel}
            instagramUrl={DEFAULT_INSTAGRAM_URL}
          />
        }
        footer={<PublicFooter variant="dark" />}
        floatingActions={<FloatingActions whatsappNumber={whatsapp} />}
        winSech={null}
      />
    </div>
  );
}
