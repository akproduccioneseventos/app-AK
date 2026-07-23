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
  Star,
  Flame,
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
    badge: "Elegante",
  },
  {
    label: "Fiesta de 15 Años",
    icon: Crown,
    href: "/simulador-de-presupuesto?tipo=15-anos",
    badge: "Tendencia",
  },
  {
    label: "Cumpleaños / Social",
    icon: Sparkles,
    href: "/simulador-de-presupuesto?tipo=social",
    badge: "Divertido",
  },
] as const;

export function HeroSection({
  whatsappNumber = AK_WHATSAPP_NUMBER,
  headline = "Tu fiesta de ensueño,\norganizada sin estrés",
  subheadline = "Disfrutá la tranquilidad de tener catering gourmet, discoteca, ambientación y coordinación en un solo equipo.",
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
    : { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
  const itemVariants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
        },
      };

  return (
    <section
      data-testid="hero-section"
      className="relative flex min-h-[92svh] items-center overflow-hidden bg-zinc-950 text-white"
    >
      {/* Background Animated Image & Zoom */}
      <motion.div
        className="absolute inset-0 scale-105 opacity-50"
        animate={reduceMotion ? undefined : { scale: [1, 1.05, 1], filter: ["brightness(0.9)", "brightness(1.05)", "brightness(0.9)"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      >
        {canUseNextImage(backgroundImageUrl) ? (
          <Image
            src={backgroundImageUrl}
            alt={backgroundImageAlt}
            fill
            priority
            sizes="100vw"
            quality={90}
            className="object-cover object-center"
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
          />
        )}
      </motion.div>

      {/* Floating Animated Light Blobs (Dinamismo 2026) */}
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -40, 30, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-red-600/20 blur-[130px] pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, -50, 40, 0],
          y: [0, 50, -40, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-10 h-[30rem] w-[30rem] rounded-full bg-purple-600/15 blur-[150px] pointer-events-none"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/40" />

      {/* Hero Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-8 space-y-6 text-left"
          >
            {promoActiva && (
              <motion.a
                variants={itemVariants}
                href={promoHref}
                target={promoHref.startsWith("http") ? "_blank" : undefined}
                rel={
                  promoHref.startsWith("http") ? "noopener noreferrer" : undefined
                }
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/60 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-300 backdrop-blur-md transition-all hover:scale-105 hover:bg-red-900/80 shadow-lg shadow-red-950/50"
              >
                <Zap className="h-3.5 w-3.5 text-amber-300 animate-bounce" />
                <span>{promoActiva.titulo}</span>
              </motion.a>
            )}

            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-zinc-300 backdrop-blur-md">
              <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>Eventos Exclusivos en Salto, Uruguay</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="max-w-4xl font-headline text-4xl sm:text-6xl md:text-7xl font-black leading-[1.05] text-white drop-shadow-2xl tracking-tight"
            >
              {headline.split("\n").map((line, index) => (
                <span
                  key={`${line}-${index}`}
                  className={cn(
                    "block",
                    index === 1 && "bg-gradient-to-r from-red-400 via-rose-400 to-amber-300 bg-clip-text text-transparent"
                  )}
                >
                  {line}
                </span>
              ))}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-2xl text-lg font-medium leading-relaxed text-zinc-300 sm:text-xl"
            >
              {subheadline}
            </motion.p>

            {showEventTypes && (
              <motion.div variants={itemVariants} className="space-y-3 pt-2">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  ¿Qué tipo de evento estás planificando?
                </p>
                <div className="flex flex-wrap gap-3">
                  {EVENT_TYPES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="group flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.1] px-4 py-3 text-xs font-bold text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:border-red-500/40 shadow-lg"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-red-400 group-hover:scale-125 transition-transform" />
                        <span>{item.label}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md group-hover:text-red-300">
                          {item.badge}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Main CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-stretch gap-4 pt-4 sm:flex-row sm:items-center"
            >
              <Button
                asChild
                className="relative overflow-hidden min-w-[240px] justify-center rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 px-8 py-6 font-black text-xs uppercase tracking-widest text-white shadow-2xl shadow-red-950/60 transition-all duration-300 hover:scale-[1.03] active:scale-95 border border-red-400/30"
              >
                <Link href={simulatorHref} className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                  <span>{simulatorLabel}</span>
                  <ArrowRight className="ml-1 h-4 w-4 shrink-0" />
                </Link>
              </Button>

              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="hero-cta-button"
                aria-label="Conversar con un asesor por WhatsApp"
                className="flex min-w-[220px] items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-xs font-black uppercase tracking-widest text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 active:scale-95"
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{ctaLabel}</span>
              </a>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-4 text-xs font-semibold text-zinc-400 pt-2"
            >
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Garantía de Servicio AK
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                5.0 en Reseñas Reales
              </span>
            </motion.div>

          </motion.div>

          {/* Floating Live Tech Card (Dinamismo Visual) */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block lg:col-span-4"
          >
            <div className="relative rounded-3xl border border-white/15 bg-zinc-950/70 p-6 backdrop-blur-xl shadow-2xl space-y-4 text-left hover:border-red-500/40 transition-all duration-500 group">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/80 px-3 py-1 rounded-full border border-red-500/30">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  Experiencia Interactiva
                </span>
                <span className="text-xs font-bold text-zinc-400">Salto, UY</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-headline font-black text-xl text-white group-hover:text-red-400 transition-colors">
                  Producción Integral 360°
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Catering gourmet, discoteca profesional con robóticas LED, muro interactivo por QR y coordinación en vivo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-center">
                  <span className="block text-xl font-black text-white">+500</span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Fiestas Realizadas</span>
                </div>
                <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-center">
                  <span className="block text-xl font-black text-red-400">100%</span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Coordinación Humana</span>
                </div>
              </div>

              <Link 
                href="/simulador-de-presupuesto" 
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 group-hover:bg-red-600"
              >
                <span>Cotizar Mi Fiesta</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Down Chevron Indicator */}
      <motion.a
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        href="#landing-services"
        className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-zinc-400 hover:text-white transition-colors"
        aria-label="Ver servicios"
      >
        <ChevronDown className="h-7 w-7" />
      </motion.a>
    </section>
  );
}
