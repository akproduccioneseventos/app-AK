'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { SUAVE } from '@/lib/motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  Star,
  ShieldCheck,
  Sparkles,
  Clock,
  Camera,
  HeartHandshake,
  UtensilsCrossed,
  Music,
  GlassWater,
  PartyPopper,
  AlertCircle,
  ExternalLink,
  X,
} from 'lucide-react';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { AkDifferenceSection } from '@/components/landing/AkDifferenceSection';
import TechnologyExperienceSection from '@/components/landing/TechnologyExperienceSection';
import { SalonDestacadoSection } from '@/components/landing/SalonDestacadoSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { LeadCaptureForm } from '@/components/landing/LeadCaptureForm';
import { PublicFooter } from '@/components/public-footer';
import { AK_SOCIAL_LINKS, AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import type { LandingLeadData } from '@/app/actions/crm';
import { getTestimonials } from '@/app/actions/feedback';
import { getGaleriaFotosByTipoFiesta } from '@/app/actions/galeria';
import { getSalonesPublicos } from '@/app/actions/salones';
import { CURATED_CLUB_URUGUAY_PHOTOS, dedupeSalonPhotos, type SalonPhoto } from '@/lib/salon-helper';
import { BotonComoFunciona } from '@/components/tutorial/BotonComoFunciona';
import type { GaleriaFoto } from '@/types/galeria';
import type { Testimonial } from '@/types/feedback';
import fallbackTestimonials from '@/data/testimonials.json';

export type TipoFiestaLanding = 'Bodas' | '15 Años' | 'Cumpleaños' | 'Empresariales' | 'Infantiles';

export interface LandingService {
  title: string;
  description: string;
  icon?: LucideIcon;
  iconName?: string;
}

export interface LandingFaqInput {
  pregunta: string;
  respuesta: string;
}

export interface GaleriaIlustrativaItem {
  id: string;
  url: string;
  titulo: string;
  alt: string;
  esIlustrativa?: boolean;
}

function resolveServiceIcon(title: string, iconName?: string, icon?: LucideIcon): LucideIcon {
  if (icon) return icon;
  const t = `${title} ${iconName ?? ''}`.toLowerCase();
  if (t.includes('cater') || t.includes('comida') || t.includes('menú') || t.includes('parrilla') || t.includes('food') || t.includes('plato')) {
    return UtensilsCrossed;
  }
  if (t.includes('ambient') || t.includes('decor') || t.includes('estilo') || t.includes('diseño floral')) {
    return HeartHandshake;
  }
  if (t.includes('disco') || t.includes('sonido') || t.includes('músic') || t.includes('music') || t.includes('dj') || t.includes('muro') || t.includes('baile')) {
    return Music;
  }
  if (t.includes('foto') || t.includes('vogue') || t.includes('360') || t.includes('cámar') || t.includes('camera') || t.includes('recuerdo')) {
    return Camera;
  }
  if (t.includes('barra') || t.includes('trago') || t.includes('glass') || t.includes('coctel') || t.includes('cóctel') || t.includes('bebida')) {
    return GlassWater;
  }
  if (t.includes('recuerdos') || t.includes('cumple') || t.includes('popp') || t.includes('fiesta')) {
    return PartyPopper;
  }
  return Sparkles;
}

export interface EventLandingPageProps {
  eventType: string;
  galeriaTipo: TipoFiestaLanding;
  source: LandingLeadData['fuente'];
  heroHeadline?: string;
  heroImage: string;
  heroImageAlt: string;
  heroIsIllustrative?: boolean;
  intro: string;
  detailTitle: string;
  detailDescription: string;
  detailImage: string;
  detailImageAlt: string;
  detailIsIllustrative?: boolean;
  differenceImage?: string;
  differenceImageAlt?: string;
  differenceIsIllustrative?: boolean;
  simulatorHref: string;
  services: LandingService[];
  faqs: LandingFaqInput[];
  galeria?: GaleriaIlustrativaItem[];
  tipoEventoInicial?: string;
  accent?: 'gold' | 'red' | 'cheerful' | 'slate';
  plansNote?: string;
  salonDescription?: string;
  techImageIsIllustrative?: boolean;
}

const ACCENT_THEMES = {
  gold: {
    heroGlow: 'bg-amber-500/20',
    badgeText: 'text-amber-700',
    cardHover: 'hover:border-amber-300',
    iconColor: 'text-amber-700',
    primaryBtn: 'bg-amber-600 hover:bg-amber-700',
  },
  red: {
    heroGlow: 'bg-red-600/20',
    badgeText: 'text-red-700',
    cardHover: 'hover:border-red-200',
    iconColor: 'text-red-700',
    primaryBtn: 'bg-red-700 hover:bg-red-800',
  },
  cheerful: {
    heroGlow: 'bg-amber-400/25',
    badgeText: 'text-amber-700',
    cardHover: 'hover:border-amber-300',
    iconColor: 'text-amber-600',
    primaryBtn: 'bg-amber-600 hover:bg-amber-700',
  },
  slate: {
    heroGlow: 'bg-sky-500/20',
    badgeText: 'text-slate-700',
    cardHover: 'hover:border-slate-400',
    iconColor: 'text-slate-800',
    primaryBtn: 'bg-slate-900 hover:bg-slate-800',
  },
} as const;

const PASOS_TRABAJO = [
  {
    numero: '01',
    titulo: 'Consulta',
    texto: 'Nos contás el tipo de celebración, la fecha tentativa y cuántas personas estimás invitar.',
  },
  {
    numero: '02',
    titulo: 'Propuesta a medida',
    texto: 'Armamos un presupuesto claro por escrito con los servicios reales que necesitás, en pesos uruguayos.',
  },
  {
    numero: '03',
    titulo: 'Coordinación',
    texto: 'Definimos salón, menú, ambientación, música y tiempos en una sola reunión con un único contacto.',
  },
  {
    numero: '04',
    titulo: 'La noche de la fiesta',
    texto: 'Llegás a disfrutar con tu gente mientras nuestro equipo coordina cada momento en el salón.',
  },
] as const;

const TECH_HIGHLIGHTS = [
  {
    title: 'Fotocabina impresa y QR',
    description: 'Tus invitados posan, se llevan su foto impresa en el momento y también la descargan al celular.',
  },
  {
    title: 'Vogue en la fiesta',
    description: 'Espacio preparado para fotos y clips con estilo editorial para que todos pasen a sacarse su recuerdo.',
  },
  {
    title: 'Plataforma 360°',
    description: 'Videos dinámicos en cámara lenta con música listos para compartir al instante desde el celular.',
  },
] as const;

const REVIEW_MATCHERS: Record<TipoFiestaLanding, RegExp> = {
  Bodas: /\b(boda|bodas|casamiento|casamientos)\b/i,
  '15 Años': /\b(15|xv|quince|quincea[ñn]era)\b/i,
  Cumpleaños: /\b(cumplea[ñn]os|evento social|cumple)\b/i,
  Empresariales: /\b(empresa|empresarial|corporativ[oa]|fin de a[ñn]o)\b/i,
  Infantiles: /\b(infantil|infantiles|ni[ñn]os|ni[ñn]as)\b/i,
};

function filtrarResenasPorTipo(items: Testimonial[], tipo: TipoFiestaLanding) {
  const regex = REVIEW_MATCHERS[tipo];
  return items
    .filter((t) => {
      if (!t.isApproved) return false;
      const tipoExplicito = (t as Testimonial & { tipoFiesta?: string }).tipoFiesta?.trim();
      const referencia = tipoExplicito || t.fiestaNombre || '';
      if (!referencia) return false;
      if (tipo === 'Bodas' && /\b(15|xv|quince)\b/i.test(referencia)) return false;
      return regex.test(referencia);
    })
    .slice(0, 3)
    .map((t) => ({
      quote: t.testimonialText,
      author: t.clientName,
      role: t.fiestaNombre,
      stars: 5,
    }));
}

function esFotoDeQuince(texto: string) {
  return /(^|[^a-z0-9])(xv|15|quince)([^a-z0-9]|$)/i.test(texto);
}

const containerVariants = {
  oculto: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardItemVariants = {
  oculto: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: SUAVE,
    },
  },
};

export function EventLandingPage({
  eventType,
  galeriaTipo,
  source,
  heroHeadline,
  heroImage,
  heroImageAlt,
  heroIsIllustrative = false,
  intro,
  detailTitle,
  detailDescription,
  detailImage,
  detailImageAlt,
  detailIsIllustrative = false,
  differenceImage,
  differenceImageAlt,
  differenceIsIllustrative,
  simulatorHref,
  services,
  faqs,
  galeria = [],
  tipoEventoInicial,
  accent = 'red',
  plansNote,
  salonDescription,
  techImageIsIllustrative = false,
}: EventLandingPageProps) {
  const reduceMotion = useReducedMotion();
  const theme = ACCENT_THEMES[accent];
  const whatsappMessage = `Hola AK Producciones, quiero consultar por ${eventType.toLowerCase()} en Salto.`;
  const whatsappHref = `https://wa.me/${AK_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  const [testimonials, setTestimonials] = useState<Array<{ quote: string; author: string; role: string; stars: number }>>(() =>
    filtrarResenasPorTipo(fallbackTestimonials as Testimonial[], galeriaTipo)
  );
  const [fotosReales, setFotosReales] = useState<GaleriaFoto[] | null>(null);
  const [salonPhotos, setSalonPhotos] = useState<SalonPhoto[]>(() =>
    galeriaTipo === '15 Años'
      ? CURATED_CLUB_URUGUAY_PHOTOS
      : CURATED_CLUB_URUGUAY_PHOTOS.filter((p) => !esFotoDeQuince(`${p.src} ${p.alt}`))
  );
  const [salonCapacity, setSalonCapacity] = useState<number | undefined>(undefined);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; titulo: string; alt: string; esIlustrativa: boolean } | null>(null);

  useEffect(() => {
    getTestimonials()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setTestimonials(filtrarResenasPorTipo(items, galeriaTipo));
        }
      })
      // no pasa nada si falla: quedan las reseñas filtradas locales de la página.
      .catch(() => {});
  }, [galeriaTipo]);

  useEffect(() => {
    getGaleriaFotosByTipoFiesta(galeriaTipo)
      .then((items) => {
        if (Array.isArray(items)) {
          const filtradas = items
            .filter((f) => {
              if (!f?.url) return false;
              if (galeriaTipo === 'Bodas' && esFotoDeQuince(`${f.url} ${f.titulo || ''} ${f.categoria || ''}`)) {
                return false;
              }
              return true;
            })
            .sort((a, b) => {
              const destDiff = Number(Boolean(b.destacada)) - Number(Boolean(a.destacada));
              return destDiff !== 0 ? destDiff : (a.orden ?? 0) - (b.orden ?? 0);
            });
          setFotosReales(filtradas);
        }
      })
      // no pasa nada si falla: quedan las imágenes ilustrativas del tipo de fiesta.
      .catch(() => {});
  }, [galeriaTipo]);

  useEffect(() => {
    getSalonesPublicos()
      .then((salones) => {
        const club = salones.find((s) => s.esClubUruguay || /club\s+uruguay/i.test(s.nombre || ''));
        if (!club) return;
        if (club.capacidad) setSalonCapacity(club.capacidad);
        const base = galeriaTipo === '15 Años'
          ? CURATED_CLUB_URUGUAY_PHOTOS
          : CURATED_CLUB_URUGUAY_PHOTOS.filter((p) => !esFotoDeQuince(`${p.src} ${p.alt}`));
        const deBase: SalonPhoto[] = (club.fotos || [])
          .filter((src) => galeriaTipo === '15 Años' || !esFotoDeQuince(src))
          .map((src, idx) => ({
            src,
            alt: `Salón Club Uruguay, vista ${idx + 1}`,
            title: idx === 0 ? 'El lugar' : `Vista ${idx + 1}`,
          }));
        setSalonPhotos(dedupeSalonPhotos([...deBase, ...base]));
      })
      // no pasa nada si falla: quedan las fotos curadas del salón sin XV si no corresponde.
      .catch(() => {});
  }, [galeriaTipo]);

  const galleryDisplayItems = useMemo(() => {
    if (fotosReales && fotosReales.length > 0) {
      return fotosReales.slice(0, 8).map((f) => ({
        id: f.id,
        url: f.url,
        titulo: f.titulo || eventType,
        alt: f.titulo || `${eventType} en Salto`,
        esIlustrativa: false,
      }));
    }
    return galeria.map((item) => ({
      id: item.id,
      url: item.url,
      titulo: item.titulo,
      alt: item.alt,
      esIlustrativa: item.esIlustrativa ?? true,
    }));
  }, [eventType, fotosReales, galeria]);

  const faqItemsForSection = useMemo(
    () =>
      faqs.map((f, idx) => ({
        id: `faq-${idx + 1}`,
        question: f.pregunta,
        answer: f.respuesta,
      })),
    [faqs],
  );

  const faqJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.pregunta,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.respuesta,
        },
      })),
    }),
    [faqs],
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-zinc-900 pb-20 lg:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingNav />
      <main>
        <HeroSection
          headline={heroHeadline || `${eventType} en Salto`}
          subheadline={intro}
          backgroundImageUrl={heroImage}
          backgroundImageAlt={heroImageAlt}
          isIllustrativeImage={heroIsIllustrative}
          whatsappMessage={whatsappMessage}
          ctaLabel="Hablar por WhatsApp"
          simulatorHref={simulatorHref}
          simulatorLabel="Armar mi presupuesto"
          showEventTypes={false}
          tipoEventoInicial={tipoEventoInicial}
          useWhatsappSecondaryCta={true}
          accentGlowClass={theme.heroGlow}
        />

        {/* Compromiso y Transparencia */}
        <div className="border-b border-zinc-200 bg-zinc-900 py-3 text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 px-4 text-xs font-semibold sm:gap-12">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="h-4 w-4 shrink-0" /> Un solo contacto, una sola seña
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <Clock className="h-4 w-4 shrink-0" /> Presupuesto detallado en pesos uruguayos
            </span>
            <BotonComoFunciona clave="paginas-por-tipo" variant="dark" />
          </div>
        </div>

        {/* El problema y la solución */}
        <section id="problema-solucion" className="py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease: SUAVE }}
              className="relative min-h-72 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 shadow-lg sm:min-h-96"
            >
              <Image
                src={detailImage}
                alt={detailImageAlt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              {detailIsIllustrative && (
                <span className="absolute right-3 top-3 rounded-full bg-black/75 px-3 py-1 text-[11px] font-semibold text-white">
                  Imagen ilustrativa
                </span>
              )}
            </motion.div>

            <div className="space-y-6">
              <div>
                <p className={`text-xs font-black uppercase tracking-widest ${theme.badgeText}`}>
                  El problema y la solución
                </p>
                <h2 className="mt-2 font-headline text-3xl font-black text-zinc-950 sm:text-4xl">
                  {detailTitle}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-zinc-600">{detailDescription}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-600">
                    <AlertCircle className="h-4 w-4 text-zinc-500" /> Por separado
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                    <li>• Varias reuniones con distintos proveedores.</li>
                    <li>• Una seña separada por cada servicio.</li>
                    <li>• Coordinar todo vos la noche de la fiesta.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Con AK
                  </p>
                  <ul className="mt-3 space-y-2 text-sm font-medium text-emerald-950">
                    <li>• Un solo contacto y una sola reunión.</li>
                    <li>• Una sola seña para toda la fiesta.</li>
                    <li>• Una persona responsable de principio a fin.</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={simulatorHref}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-colors ${theme.primaryBtn}`}
                >
                  Armar mi presupuesto <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-bold text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" /> Hablar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Cifras reales de AK */}
        <StatsSection />

        {/* Servicios */}
        <motion.section
          id="landing-services"
          initial={reduceMotion ? false : { opacity: 1, y: 24 }}
          animate={reduceMotion ? false : { opacity: 1, y: 0 }}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: SUAVE }}
          variants={{
            oculto: { opacity: 1, y: 24 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: SUAVE } },
          }}
          className="ak-section-slide bg-zinc-50 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className={`text-sm font-bold uppercase tracking-widest ${theme.badgeText}`}>
                Todos los servicios en un solo lugar
              </p>
              <h2 className="mt-3 text-3xl font-black text-zinc-950 sm:text-4xl">
                Una propuesta hecha para tu evento en Salto
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600">
                Armamos cada servicio alrededor de la fecha, las personas invitadas y el estilo que querés lograr.
              </p>
              {plansNote && (
                <p className="mt-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700">
                  {plansNote}
                </p>
              )}
            </div>
            <motion.div
              variants={containerVariants}
              initial={reduceMotion ? false : 'oculto'}
              whileInView={reduceMotion ? undefined : 'visible'}
              viewport={{ once: true, margin: '-50px' }}
              className="mt-10 grid gap-4 md:grid-cols-3"
            >
              {services.map((srv) => {
                const Icon = resolveServiceIcon(srv.title, srv.iconName, srv.icon);
                return (
                  <motion.article
                    key={srv.title}
                    variants={cardItemVariants}
                    className={`rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${theme.cardHover}`}
                  >
                    <Icon className={`h-6 w-6 ${theme.iconColor}`} aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-bold text-zinc-950">{srv.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">{srv.description}</p>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </motion.section>

        {/* Cómo trabajamos en 4 pasos */}
        <section id="como-trabajamos" className="border-y border-zinc-200 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className={`text-xs font-black uppercase tracking-widest ${theme.badgeText}`}>
                Paso a paso
              </p>
              <h2 className="mt-2 font-headline text-3xl font-black text-zinc-950 sm:text-4xl">
                Cómo trabajamos
              </h2>
              <p className="mt-3 text-base text-zinc-600">
                Un proceso ordenado en cuatro pasos para que llegues a la fiesta sin correr atrás de nada.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PASOS_TRABAJO.map((paso) => (
                <article
                  key={paso.numero}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm"
                >
                  <span className={`text-2xl font-black ${theme.iconColor}`}>{paso.numero}</span>
                  <h3 className="mt-3 text-lg font-black text-zinc-950">{paso.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{paso.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Diferencial AK (misma sección de la portada) */}
        <AkDifferenceSection
          imageSrc={differenceImage || detailImage}
          imageAlt={differenceImageAlt || detailImageAlt}
          isIllustrativeImage={differenceIsIllustrative ?? detailIsIllustrative}
        />

        {/* Tecnología interactiva (fotocabina, Vogue, plataforma 360) */}
        <TechnologyExperienceSection
          simulatorHref={simulatorHref}
          whatsappMessage={whatsappMessage}
          featureCards={TECH_HIGHLIGHTS}
          isIllustrativeImage={techImageIsIllustrative}
        />

        {/* Salón destacado Club Uruguay */}
        <SalonDestacadoSection
          photos={salonPhotos}
          capacity={salonCapacity}
          simulatorHref={`${simulatorHref}${simulatorHref.includes('?') ? '&' : '?'}salon=club`}
          description={salonDescription}
        />

        {/* Galería del tipo de fiesta */}
        {galleryDisplayItems.length > 0 && (
          <section id="galeria-tipo" className="border-y border-zinc-200 bg-zinc-50 py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <p className={`text-xs font-black uppercase tracking-widest ${theme.badgeText}`}>
                  Galería
                </p>
                <h2 className="mt-2 font-headline text-3xl font-black text-zinc-950 sm:text-4xl">
                  Ideas y referencias para {eventType.toLowerCase()}
                </h2>
                <p className="mt-3 text-base text-zinc-600">
                  Recorré ejemplos visuales pensados para este tipo de celebración.
                </p>
              </div>
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {galleryDisplayItems.map((foto) => (
                  <button
                    key={foto.id}
                    type="button"
                    onClick={() => setLightboxPhoto(foto)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 text-left shadow-sm transition hover:shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.url}
                      alt={foto.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    {foto.esIlustrativa && (
                      <span className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-white">
                        Imagen ilustrativa
                      </span>
                    )}
                    <span className="absolute bottom-3 left-3 right-3 text-xs font-bold text-white">
                      {foto.titulo}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Prueba Social / Reseñas filtradas por tipo (si no hay ninguna confiable, no se muestra) */}
        {testimonials.length > 0 && (
          <motion.section
            variants={containerVariants}
            initial={reduceMotion ? false : 'oculto'}
            whileInView={reduceMotion ? undefined : 'visible'}
            viewport={{ once: true, margin: '-50px' }}
            className="bg-zinc-900 py-16 text-white sm:py-20"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-2xl font-black sm:text-3xl">Lo que dicen nuestros clientes</h2>
              </div>
              <motion.div
                variants={containerVariants}
                className="mt-10 grid gap-6 md:grid-cols-3"
              >
                {testimonials.map((t, idx) => (
                  <motion.div
                    key={idx}
                    variants={cardItemVariants}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-xl backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(t.stars)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm italic leading-relaxed text-zinc-300">&ldquo;{t.quote}&rdquo;</p>
                    <div className="mt-5 border-t border-zinc-800/80 pt-3">
                      <p className="text-sm font-bold text-white">{t.author}</p>
                      <p className="text-xs text-zinc-400">{t.role}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              <div className="mt-8 text-center">
                <a
                  href={AK_SOCIAL_LINKS.googleReviews}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-white/15"
                >
                  Dejá tu reseña en Google <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </motion.section>
        )}

        {/* Preguntas frecuentes */}
        {faqItemsForSection.length > 0 && (
          <FAQSection faqs={faqItemsForSection} includeJsonLd={false} />
        )}

        {/* Contacto & Formulario */}
        <motion.section
          id="contacto"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: SUAVE }}
          className="border-y border-zinc-200 bg-zinc-50 py-16 sm:py-24"
        >
          <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, ease: SUAVE }}
              className="lg:pt-8"
            >
              <CalendarDays className={`h-7 w-7 ${theme.iconColor}`} aria-hidden="true" />
              <h2 className="mt-5 text-3xl font-black text-zinc-950 sm:text-4xl">Empecemos a planificar</h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600">
                Contanos la fecha aproximada y las personas invitadas. Recibimos tu consulta y te respondemos por WhatsApp.
              </p>
              <div className="mt-6 space-y-3 rounded-lg border border-zinc-200 bg-white p-4 text-xs font-medium text-zinc-700 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Te contestamos por WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Presupuestos detallados por escrito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Un solo contacto para toda la fiesta</span>
                </div>
              </div>
            </motion.div>
            {/* LeadCaptureForm usa useSearchParams para saber de qué campaña
                viene el prospecto. Sin este Suspense, Next no puede generar la
                landing y la compilación de toda la app falla. */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.1, ease: SUAVE }}
            >
              <Suspense fallback={null}>
                <LeadCaptureForm
                  fuente={source}
                  tipoEventoDefault={eventType}
                  title={`Cotizá ${eventType}`}
                  subtitle="Dejanos tus datos y te contactamos con una propuesta para tu evento."
                />
              </Suspense>
            </motion.div>
          </div>
        </motion.section>
      </main>
      <PublicFooter variant="dark" />

      {/* Visor simple de galería */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxPhoto.titulo}
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              aria-label="Cerrar imagen"
              className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.alt}
              className="max-h-[75vh] w-full rounded-xl object-contain bg-zinc-950"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-white">
              <span className="font-bold">{lightboxPhoto.titulo}</span>
              {lightboxPhoto.esIlustrativa && (
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px]">
                  Imagen ilustrativa
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Mobile CTA para Tráfico de Anuncios (360 px sin desborde) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 px-2.5 py-2.5 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Link
            href={simulatorHref}
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 rounded-lg bg-red-700 px-2.5 py-2.5 text-[11px] font-bold text-white shadow-md active:bg-red-800 truncate"
          >
            Armar mi presupuesto
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-2.5 text-[11px] font-bold text-white shadow-md active:bg-emerald-700 truncate"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" /> Hablar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
