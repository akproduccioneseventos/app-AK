"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Crown,
  Heart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { canUseNextImage } from "@/lib/next-image-url";
import { AK_WHATSAPP_NUMBER } from "@/lib/public-contact";
import { cn } from "@/lib/utils";
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

const EVENT_TYPES = [
  {
    label: "Boda / Casamiento",
    icon: Heart,
    href: "/simulador-de-presupuesto?tipo=boda",
  },
  {
    label: "Fiesta de 15 Años",
    icon: Crown,
    href: "/simulador-de-presupuesto?tipo=15-anos",
  },
  {
    label: "Cumpleaños / Social",
    icon: Sparkles,
    href: "/simulador-de-presupuesto?tipo=social",
  },
] as const;

export function HeroSection({
  whatsappNumber = AK_WHATSAPP_NUMBER,
  headline = "Tu fiesta de ensueño,\norganizada sin estrés",
  subheadline = "Disfrutá la tranquilidad de tener catering, discoteca, ambientación y coordinación en un solo equipo.",
  backgroundImageUrl = "/media/catalogo-servicios/quinceanera_hero.png",
  promoActiva,
  whatsappMessage = "Hola AK Producciones, vi su página y me gustaría cotizar mi evento.",
  ctaLabel = "Conversar con un asesor",
  simulatorHref = "/simulador-de-presupuesto",
  simulatorLabel = "Simular mi fiesta",
  showEventTypes = true,
  backgroundImageAlt = "Celebracion producida por AK Producciones",
}: HeroSectionProps) {
  const reduceMotion = useReducedMotion();
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  const configuredPromoHref = promoActiva?.ctaUrl?.trim() || "";
  const promoHref =
    /^https?:\/\//i.test(configuredPromoHref) ||
    configuredPromoHref.startsWith("/")
      ? configuredPromoHref
      : waHref;

  const containerVariants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
  const itemVariants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: "easeOut" as const },
        },
      };

  return (
    <section
      data-testid="hero-section"
      className="relative flex min-h-[86svh] items-center overflow-hidden bg-zinc-950"
    >
      <motion.div
        className="absolute inset-0 scale-105 opacity-60"
        animate={reduceMotion ? undefined : { scale: [1.02, 1.055, 1.02] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      >
        {canUseNextImage(backgroundImageUrl) ? (
          <Image
            src={backgroundImageUrl}
              alt={backgroundImageAlt}
            fill
            priority
            sizes="100vw"
            quality={85}
            className="object-cover object-center"
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
          />
        )}
      </motion.div>

      <div className="absolute inset-0 bg-black/58" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-14 pt-24 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl space-y-6 text-left"
        >
          {promoActiva && (
            <motion.a
              variants={itemVariants}
              href={promoHref}
              target={promoHref.startsWith("http") ? "_blank" : undefined}
              rel={
                promoHref.startsWith("http") ? "noopener noreferrer" : undefined
              }
              className="inline-flex items-center gap-2 rounded-md border border-red-400/30 bg-black/35 px-3 py-2 text-xs font-black uppercase tracking-widest text-red-300 backdrop-blur-sm transition-colors hover:bg-black/55"
            >
              <Zap className="h-3.5 w-3.5" />
              {promoActiva.titulo}
            </motion.a>
          )}

          <motion.h1
            variants={itemVariants}
            className="max-w-4xl font-headline text-4xl font-black leading-[1.06] text-white drop-shadow-lg sm:text-5xl md:text-6xl"
          >
            {headline.split("\n").map((line, index) => (
              <span
                key={`${line}-${index}`}
                className={cn("block", index === 1 && "text-red-400")}
              >
                {line}
              </span>
            ))}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="max-w-2xl text-base font-medium leading-relaxed text-white/80 sm:text-lg md:text-xl"
          >
            {subheadline}
          </motion.p>

          {showEventTypes && <motion.div variants={itemVariants} className="space-y-3 pt-1">
            <p className="text-xs font-black uppercase tracking-widest text-white/60">
              Elegí tu celebración
            </p>
            <div className="flex flex-wrap gap-2.5">
              {EVENT_TYPES.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 rounded-md border border-white/15 bg-black/25 px-4 py-3 text-xs font-bold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300/50 hover:bg-black/45"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-red-300" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>}

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center"
          >
            <Button
              asChild
              className="min-w-[220px] justify-center rounded-md bg-red-700 px-8 py-5 font-bold text-white shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-800 active:scale-95"
            >
              <Link href={simulatorHref}>
                {simulatorLabel}
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </Link>
            </Button>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="hero-cta-button"
              aria-label="Conversar con un asesor por WhatsApp"
              className="flex min-w-[220px] items-center justify-center gap-3 rounded-md border border-white/20 bg-black/20 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-black/40 active:scale-95"
            >
              <MessageSquare className="h-5 w-5 shrink-0 text-emerald-300" />
              {ctaLabel}
            </a>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="flex items-center gap-2 text-xs font-semibold text-white/60"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Presupuesto claro, precios vigentes y acompañamiento humano.
          </motion.p>
        </motion.div>
      </div>

      <motion.a
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.55,
          delay: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        href="#servicios"
        className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 text-white/65 transition-colors hover:text-white"
        aria-label="Ver servicios"
      >
        <ChevronDown className="h-7 w-7" />
      </motion.a>
    </section>
  );
}
