"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { canUseNextImage } from "@/lib/next-image-url";
import { AK_WHATSAPP_NUMBER } from "@/lib/public-contact";
import type { PromoActiva } from "@/types/promo";

interface HeroSectionProps {
  whatsappNumber?: string;
  headline?: string;
  subheadline?: string;
  backgroundImageUrl?: string;
  promoActiva?: PromoActiva | null;
  whatsappMessage?: string;
  ctaLabel?: string;
  simulatorHref?: string;
  simulatorLabel?: string;
  showEventTypes?: boolean;
  backgroundImageAlt?: string;
}

const details = [
  "Catering y barra",
  "Ambientación y mobiliario",
  "Música, luces y coordinación",
];

export function HeroSection({
  whatsappNumber = AK_WHATSAPP_NUMBER,
  headline = "Tu fiesta, resuelta por un solo equipo",
  subheadline = "Catering, ambientación, música, tecnología y coordinación para celebrar con tranquilidad en Salto.",
  backgroundImageUrl = "/media/catalogo-servicios/quinceanera_hero.png",
  promoActiva,
  whatsappMessage = "Hola AK Producciones, quisiera cotizar mi evento.",
  ctaLabel = "Hablar con AK",
  simulatorHref = "/simulador",
  simulatorLabel = "Cotizar mi fiesta",
  backgroundImageAlt = "Fiesta de quince años producida por AK Producciones",
}: HeroSectionProps) {
  const reduceMotion = useReducedMotion();
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  const configuredPromoHref = promoActiva?.ctaUrl?.trim() || "";
  const promoHref =
    /^https?:\/\//i.test(configuredPromoHref) || configuredPromoHref.startsWith("/")
      ? configuredPromoHref
      : waHref;

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section
      data-testid="hero-section"
      className="relative flex min-h-[82svh] items-end overflow-hidden bg-stone-950 text-white sm:min-h-[90svh]"
    >
      <motion.div
        className="absolute inset-0"
        animate={reduceMotion ? undefined : { scale: [1, 1.035, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      >
        {canUseNextImage(backgroundImageUrl) ? (
          <Image
            src={backgroundImageUrl}
            alt={backgroundImageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
            role="img"
            aria-label={backgroundImageAlt}
          />
        )}
      </motion.div>
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:px-8">
        <div className="max-w-3xl">
          {promoActiva && (
            <a
              href={promoHref}
              target={promoHref.startsWith("http") ? "_blank" : undefined}
              rel={promoHref.startsWith("http") ? "noopener noreferrer" : undefined}
              className="mb-5 inline-flex items-center gap-2 border border-white/35 bg-black/30 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/50"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {promoActiva.titulo}
            </a>
          )}

          <motion.p {...reveal} className="text-sm font-semibold text-stone-200">
            AK Producciones Eventos · Salto, Uruguay
          </motion.p>
          <motion.h1
            {...reveal}
            transition={reduceMotion ? undefined : { duration: 0.6, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 font-headline text-4xl font-black leading-[1.05] text-white sm:text-6xl lg:text-7xl"
          >
            {headline}
          </motion.h1>
          <motion.p
            {...reveal}
            transition={reduceMotion ? undefined : { duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-100 sm:text-xl"
          >
            {subheadline}
          </motion.p>

          <motion.div
            {...reveal}
            transition={reduceMotion ? undefined : { duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-100"
          >
            {details.map((detail) => (
              <span key={detail} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-red-500" aria-hidden="true" />
                {detail}
              </span>
            ))}
          </motion.div>

          <motion.div
            {...reveal}
            transition={reduceMotion ? undefined : { duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href={simulatorHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-red-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-red-800"
            >
              {simulatorLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="hero-cta-button"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/45 bg-black/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-black/45"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {ctaLabel}
            </a>
          </motion.div>

          {/* Respaldo debajo del boton principal: es el lugar donde el visitante
              decide si sigue leyendo, y las plataformas con las que competimos
              muestran numeros ahi. AK tiene con que llenarlo. */}
          <motion.dl
            {...reveal}
            transition={reduceMotion ? undefined : { duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-white/25 pt-6"
          >
            {/* Sin numeros inventados: los tres datos se leen de lo que la
                empresa ya ofrece. Si algun dia se quieren poner cantidades
                reales de fiestas o años, tienen que salir de la ficha de la
                empresa, no escritos a mano aca. */}
            {[
              { valor: 'Salto', detalle: 'y toda la zona' },
              { valor: 'Un equipo', detalle: 'para toda la fiesta' },
              { valor: 'Sin costo', detalle: 'presupuesto al toque' },
            ].map(dato => (
              <div key={dato.detalle}>
                <dt className="text-2xl font-black leading-none text-white sm:text-3xl">{dato.valor}</dt>
                <dd className="mt-1 text-xs leading-snug text-stone-200 sm:text-sm">{dato.detalle}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>

      <a
        href="#landing-services"
        className="absolute bottom-5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 text-xs font-semibold text-stone-200 transition-colors hover:text-white"
      >
        Conocé las propuestas
        <ArrowDown className="h-4 w-4" aria-hidden="true" />
      </a>
    </section>
  );
}
