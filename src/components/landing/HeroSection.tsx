"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
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
  simulatorHref = "/simulador-de-presupuesto",
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
        initial: { opacity: 0, y: 22 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section
      data-testid="hero-section"
      id="landing-hero"
      className="relative flex min-h-[85svh] items-end overflow-hidden bg-stone-950 text-white sm:min-h-[92svh]"
    >
      {/* Fondo con imagen y zoom suave continuo */}
      <motion.div
        className="absolute inset-0"
        animate={reduceMotion ? undefined : { scale: [1, 1.045, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
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

      {/* Degradado oscuro envolvente para contraste perfecto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/35" />

      {/* Luces y resplandores ambientales de fiesta sutiles */}
      {!reduceMotion && (
        <>
          <motion.div
            className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-red-600/15 blur-[120px]"
            animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-1/3 right-10 h-80 w-80 rounded-full bg-amber-500/15 blur-[110px]"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:px-8">
        <div className="max-w-3xl">
          {promoActiva && (
            <motion.div
              {...reveal}
              transition={reduceMotion ? undefined : { duration: 0.5, delay: 0.05 }}
            >
              <a
                href={promoHref}
                target={promoHref.startsWith("http") ? "_blank" : undefined}
                rel={promoHref.startsWith("http") ? "noopener noreferrer" : undefined}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-black/40 px-4 py-1.5 text-xs font-bold text-amber-200 backdrop-blur-md transition-all hover:bg-black/60 hover:border-amber-400/60"
              >
                <ShieldCheck className="h-4 w-4 text-amber-400" aria-hidden="true" />
                {promoActiva.titulo}
              </a>
            </motion.div>
          )}

          <motion.p
            {...reveal}
            transition={reduceMotion ? undefined : { duration: 0.5, delay: 0.08 }}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AK Producciones Eventos · Salto, Uruguay
          </motion.p>

          <motion.h1
            {...reveal}
            transition={reduceMotion ? undefined : { duration: 0.65, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 font-headline text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl drop-shadow-sm"
          >
            {headline}
          </motion.h1>

          <motion.p
            {...reveal}
            transition={reduceMotion ? undefined : { duration: 0.65, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-200 sm:text-xl font-medium"
          >
            {subheadline}
          </motion.p>

          <motion.div
            {...reveal}
            transition={reduceMotion ? undefined : { duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-200"
          >
            {details.map((detail) => (
              <span key={detail} className="flex items-center gap-2 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" aria-hidden="true" />
                {detail}
              </span>
            ))}
          </motion.div>

          <motion.div
            {...reveal}
            transition={reduceMotion ? undefined : { duration: 0.6, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col gap-3.5 sm:flex-row"
          >
            <motion.div
              whileHover={reduceMotion ? undefined : { scale: 1.025, y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="inline-flex"
            >
              <Link
                href={simulatorHref}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-red-950/40 transition-all hover:bg-red-800"
              >
                {simulatorLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={reduceMotion ? undefined : { scale: 1.025, y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="inline-flex"
            >
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="hero-cta-button"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-black/35 px-6 py-3.5 text-sm font-black text-white backdrop-blur-md transition-all hover:border-white/50 hover:bg-black/55"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                {ctaLabel}
              </a>
            </motion.div>
          </motion.div>

          {/* Respaldo debajo del boton principal */}
          <motion.dl
            {...reveal}
            transition={reduceMotion ? undefined : { duration: 0.6, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-white/20 pt-6"
          >
            {[
              { valor: 'Salto', detalle: 'y toda la zona' },
              { valor: 'Un equipo', detalle: 'para toda la fiesta' },
              { valor: 'Sin costo', detalle: 'presupuesto al toque' },
            ].map((dato) => (
              <div key={dato.detalle}>
                <dt className="text-2xl font-black leading-none text-white sm:text-3xl">{dato.valor}</dt>
                <dd className="mt-1 text-xs leading-snug text-stone-300 sm:text-sm font-medium">{dato.detalle}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>

      <motion.a
        href="#landing-services"
        className="absolute bottom-5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 text-xs font-bold text-stone-300 transition-colors hover:text-white"
        animate={reduceMotion ? undefined : { y: [0, 4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        Conocé las propuestas
        <ArrowDown className="h-4 w-4 text-red-400" aria-hidden="true" />
      </motion.a>
    </section>
  );
}
