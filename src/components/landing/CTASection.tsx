'use client';

import { MessageSquare, Phone, Instagram, Facebook, Music, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AK_WHATSAPP_NUMBER, AK_SOCIAL_LINKS } from '@/lib/public-contact';

interface CTASectionProps {
  whatsappNumber?: string;
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
  whatsappMessage?: string;
  instagramUrl?: string;
}

export function CTASection({
  whatsappNumber = AK_WHATSAPP_NUMBER,
  headline = '¿Listo para tu\nEvento Soñado?',
  subheadline = 'Escribinos hoy y recibí una propuesta personalizada sin costo. Estamos listos para hacer realidad tu celebración.',
  ctaLabel = '¡Cotizá tu evento!',
  whatsappMessage = 'Hola AK Producciones, me gustaría cotizar mi evento.',
  instagramUrl = AK_SOCIAL_LINKS.instagram,
}: CTASectionProps) {
  const reduceMotion = useReducedMotion();
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  const socialLinks = [
    {
      platform: 'Instagram',
      href: instagramUrl,
      icon: Instagram,
      bgClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:shadow-pink-400/60',
    },
    {
      platform: 'Facebook',
      href: AK_SOCIAL_LINKS.facebook,
      icon: Facebook,
      bgClass: 'bg-[#1877F2] hover:shadow-blue-500/60',
    },
    {
      platform: 'TikTok',
      href: AK_SOCIAL_LINKS.tiktok,
      icon: Music,
      bgClass: 'bg-black hover:shadow-slate-700/60',
    },
  ];

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.25 },
        transition: { duration: 0.55, ease: 'easeOut' as const },
      };

  return (
    <section
      id="contacto"
      className="relative overflow-hidden bg-zinc-950 py-24 border-t border-white/5"
    >
      {/* Resplandores ambientales de fiesta animados */}
      {!reduceMotion && (
        <>
          <motion.div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-red-600/10 blur-[150px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute top-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-amber-500/10 blur-[130px]"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
        
        {/* Status Badge con pulso de luz */}
        <motion.div {...reveal} className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-400 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Calendario 2026/2027 Abierto
        </motion.div>

        {/* Headline */}
        <motion.h2
          {...reveal}
          className="text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl font-headline tracking-tight"
        >
          {headline.split('\n').map((line, i) => (
            <span
              key={i}
              className={cn(
                'block',
                i === 1 && 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(244,63,94,0.3)]'
              )}
            >
              {line}
            </span>
          ))}
        </motion.h2>

        {/* Subheadline */}
        <motion.p {...reveal} className="text-zinc-300 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed font-medium">
          {subheadline}
        </motion.p>

        {/* Reciprocity Gift Box (Neuroventas: regalo incentivo con efecto hover) */}
        <motion.div
          {...reveal}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          className="max-w-2xl mx-auto p-5 rounded-3xl border border-dashed border-red-500/30 bg-red-950/15 backdrop-blur-sm flex flex-col sm:flex-row items-center gap-4 text-left transition-all hover:border-red-500/50 hover:bg-red-950/25 shadow-lg shadow-red-950/20"
        >
          <div className="h-11 w-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">🎁 Regalo de Reserva Inmediata</h4>
            <p className="text-xs font-semibold text-zinc-300 mt-1 leading-relaxed">
              Confirmando tu propuesta durante esta semana, te obsequiamos la <strong className="text-white">Plataforma de Video 360°</strong> de regalo para sorprender a todos tus invitados.
            </p>
          </div>
        </motion.div>

        {/* Pain of Payment Reduction Banner */}
        <motion.div {...reveal} className="max-w-xl mx-auto text-xs font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
          🔒 Reserva flexible: Seña tu fecha y congelá precios en cuotas fijas a tu medida.
        </motion.div>

        {/* CTAs con micro-interacciones */}
        <motion.div {...reveal} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Cotizar evento por WhatsApp"
            whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className={cn(
              'flex items-center gap-3 px-8 py-5 rounded-2xl',
              'bg-[#25D366] hover:bg-[#1eb356] text-white',
              'font-black text-xs uppercase tracking-widest',
              'shadow-2xl shadow-green-950/50',
              'transition-colors',
              'min-w-[250px] justify-center'
            )}
          >
            <MessageSquare className="w-5 h-5 shrink-0" />
            {ctaLabel}
          </motion.a>
          <motion.a
            href={`tel:${whatsappNumber.replace(/[\s-]/g, '').replace(/^([^+])/, '+$1')}`}
            aria-label="Llamar por teléfono a AK Producciones"
            whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className={cn(
              'flex items-center gap-3 px-8 py-5 rounded-2xl',
              'bg-white/10 backdrop-blur-md hover:bg-white/15 text-white',
              'font-black text-xs uppercase tracking-widest',
              'border border-white/15',
              'transition-colors',
              'min-w-[200px] justify-center'
            )}
          >
            <Phone className="w-4 h-4 shrink-0" />
            Llamar Directo
          </motion.a>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="h-px w-16 bg-white/10" />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">O visitanos en redes</p>
          <div className="h-px w-16 bg-white/10" />
        </div>

        {/* Social links */}
        <div className="flex justify-center gap-4">
          {socialLinks.map(({ platform, href, icon: Icon, bgClass }) => (
            <motion.a
              key={platform}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={platform}
              aria-label={`Visitar ${platform} de AK Producciones`}
              whileHover={reduceMotion ? undefined : { scale: 1.15, y: -3 }}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center text-white',
                'transition-all duration-300 shadow-md',
                bgClass
              )}
            >
              <Icon className="w-5 h-5" />
            </motion.a>
          ))}
        </div>

      </div>
    </section>
  );
}
