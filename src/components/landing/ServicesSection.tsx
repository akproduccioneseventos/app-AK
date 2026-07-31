"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  Crown,
  Heart,
  MessageCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { PUBLIC_EVENT_TYPE_IMAGES } from "@/components/landing/event-type-images";
import { canUseNextImage } from "@/lib/next-image-url";
import { AK_WHATSAPP_NUMBER } from "@/lib/public-contact";

export interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  imageUrl: string;
  imageHint: string;
  accentColor: string;
  emoji: string;
  whatsappMessage?: string;
  icon?: LucideIcon;
  badge?: string;
}

const PARTY_TYPES: Array<{
  title: string;
  description: string;
  imageUrl: string;
  href: string;
  icon: LucideIcon;
}> = [
  {
    title: "Bodas",
    description: "Ceremonia, cena y fiesta coordinadas por un mismo equipo.",
    imageUrl: PUBLIC_EVENT_TYPE_IMAGES.boda,
    href: "/simulador-de-presupuesto?tipo=boda",
    icon: Heart,
  },
  {
    title: "Fiestas de 15",
    description: "Una noche personal, con pista, recuerdos y energía para celebrar.",
    imageUrl: PUBLIC_EVENT_TYPE_IMAGES.xv,
    href: "/simulador-de-presupuesto?tipo=15-anos",
    icon: Crown,
  },
  {
    title: "Cumpleaños y sociales",
    description: "Gastronomía, barra y música pensadas según cada grupo.",
    imageUrl: PUBLIC_EVENT_TYPE_IMAGES.social,
    href: "/simulador-de-presupuesto?tipo=social",
    icon: Sparkles,
  },
  {
    title: "Eventos empresariales",
    description: "Recepciones y encuentros con puesta técnica y operativa.",
    imageUrl: PUBLIC_EVENT_TYPE_IMAGES.corporativo,
    href: "/simulador-de-presupuesto?tipo=corporativo",
    icon: Building2,
  },
];

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: "bodas",
    title: "Bodas Inolvidables",
    subtitle: "Producción integral",
    description: "Una propuesta unificada para que la pareja no tenga que coordinar proveedores por separado.",
    features: ["Coordinación del evento", "Catering y barra", "Ambientación, música y luces"],
    imageUrl: PUBLIC_EVENT_TYPE_IMAGES.boda,
    imageHint: "Boda AK Producciones",
    accentColor: "",
    emoji: "AK",
    whatsappMessage: "Hola AK Producciones, quisiera consultar por una boda.",
    icon: Heart,
  },
  {
    id: "xv-anos",
    title: "15 Años de Vanguardia",
    subtitle: "Una experiencia completa",
    description: "Una producción con identidad propia, tecnología y una coordinación que cuida cada momento.",
    features: ["Pista y luces LED", "Muro social y recuerdos", "Catering y coordinación"],
    imageUrl: PUBLIC_EVENT_TYPE_IMAGES.xv,
    imageHint: "Fiesta de quince años AK Producciones",
    accentColor: "",
    emoji: "XV",
    whatsappMessage: "Hola AK Producciones, quisiera consultar por una fiesta de 15 años.",
    icon: Crown,
  },
  {
    id: "cumpleanos",
    title: "Cumpleaños y Aniversarios",
    subtitle: "A medida",
    description: "Una celebración con la escala correcta: comida, barra, música y el equipo necesario para disfrutarla.",
    features: ["Menú según invitados", "Barra y discoteca", "Montaje y logística"],
    imageUrl: PUBLIC_EVENT_TYPE_IMAGES.social,
    imageHint: "Evento social AK Producciones",
    accentColor: "",
    emoji: "AK",
    whatsappMessage: "Hola AK Producciones, quisiera consultar por un evento social.",
    icon: Sparkles,
  },
];

interface ServicesSectionProps {
  whatsappNumber?: string;
  services?: ServiceItem[];
}

const SERVICE_ALREADY_REPRESENTED_PATTERN =
  /\b(bodas?|casamientos?|xv|15 a[nñ]os|cumplea[nñ]os|social(?:es)?|corporativ\w*|empresarial\w*|club uruguay|tecnolog[ií]a)\b/i;

export function isAdditionalLandingService(service: Pick<ServiceItem, "title">): boolean {
  return !SERVICE_ALREADY_REPRESENTED_PATTERN.test(service.title);
}

function ServiceImage({ service }: { service: ServiceItem }) {
  if (canUseNextImage(service.imageUrl)) {
    return (
      <Image
        src={service.imageUrl}
        alt={service.imageHint || service.title}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.035]"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={service.imageUrl}
      alt={service.imageHint || service.title}
      className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.035]"
    />
  );
}

export function ServicesSection({
  whatsappNumber = AK_WHATSAPP_NUMBER,
  services,
}: ServicesSectionProps) {
  const displayServices = services && services.length > 0 ? services : DEFAULT_SERVICES;
  const additionalServices = displayServices.filter(isAdditionalLandingService);
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.16 },
        transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section className="border-y border-neutral-200 bg-white py-20 text-slate-950 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="grid gap-8 border-b border-neutral-200 pb-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-bold text-red-700">Producción integral AK</p>
            <h2 className="mt-3 max-w-3xl font-headline text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              Una sola conversación. Todos los servicios que tu fiesta necesita.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Reunimos catering, barra, ambientación, mobiliario, discoteca, tecnología y coordinación. Cada propuesta se adapta a tu fecha, estilo e invitados.
          </p>
        </motion.div>

        <motion.div {...reveal} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARTY_TYPES.map((party) => {
            const Icon = party.icon;
            return (
              <Link
                key={party.title}
                href={party.href}
                className="group overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm transition-shadow hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-200">
                  <Image
                    src={party.imageUrl}
                    alt={`${party.title} producida por AK Producciones`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.035]"
                  />
                </div>
                <div className="p-5">
                  <Icon className="h-5 w-5 text-red-700" aria-hidden="true" />
                  <h3 className="mt-3 font-headline text-xl font-black text-slate-950">{party.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{party.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-red-700">
                    Ver propuesta <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </motion.div>

        {additionalServices.length > 0 && (
          <>
        <div className="mt-20 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-red-700">Servicios adicionales</p>
            <h2 className="mt-2 font-headline text-3xl font-black text-slate-950 sm:text-4xl">Sumá una experiencia especial.</h2>
          </div>
          <Link href="/simulador-de-presupuesto" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-700 transition-colors hover:text-red-700">
            Cotizar mi fiesta <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <motion.div
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {additionalServices.map((service) => {
            const Icon = service.icon;
            const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
              service.whatsappMessage || `Hola AK Producciones, quisiera consultar por ${service.title}.`,
            )}`;
            return (
              <motion.article
                key={service.id}
                variants={reduceMotion ? undefined : { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}
                className="group flex h-full flex-col overflow-hidden border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-200">
                  <ServiceImage service={service} />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-red-700">{service.subtitle}</p>
                      <h3 className="mt-1 font-headline text-2xl font-black text-slate-950">{service.title}</h3>
                    </div>
                    {Icon && <Icon className="mt-1 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{service.description}</p>
                  <div className="mt-6 border-t border-neutral-200 pt-4">
                    <p className="text-xs font-bold text-slate-700">Incluye</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {service.features.slice(0, 3).map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800 transition-colors hover:border-red-700 hover:text-red-700"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Consultar esta propuesta
                  </a>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
