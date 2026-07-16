'use client';

import { MessageSquare, Phone, Instagram, Facebook, Music, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

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
  instagramUrl = 'https://instagram.com/akproduccioneseventos',
}: CTASectionProps) {
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
      href: 'https://facebook.com/akproduccioneseventos',
      icon: Facebook,
      bgClass: 'bg-[#1877F2] hover:shadow-blue-500/60',
    },
    {
      platform: 'TikTok',
      href: 'https://tiktok.com/@akproduccioneseventos',
      icon: Music,
      bgClass: 'bg-black hover:shadow-slate-700/60',
    },
  ];

  return (
    <section
      id="contacto"
      className="relative overflow-hidden bg-zinc-950 py-24 border-t border-white/5"
    >
      {/* Glow elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-red-600/5 blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-400 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Calendario 2026/2027 Abierto
        </div>

        {/* Headline */}
        <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl font-headline">
          {headline.split('\n').map((line, i) => (
            <span
              key={i}
              className={cn(
                'block',
                i === 1 && 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 bg-clip-text text-transparent'
              )}
            >
              {line}
            </span>
          ))}
        </h2>

        {/* Subheadline */}
        <p className="text-zinc-400 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed font-medium">
          {subheadline}
        </p>

        {/* Reciprocity Gift Box (Neuroventas: regalo incentivo) */}
        <div className="max-w-2xl mx-auto p-5 rounded-3xl border border-dashed border-red-500/30 bg-red-950/10 backdrop-blur-sm flex flex-col sm:flex-row items-center gap-4 text-left">
          <div className="h-11 w-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">🎁 Regalo de Reserva Inmediata</h4>
            <p className="text-xs font-semibold text-zinc-400 mt-1 leading-relaxed">
              Confirmando tu propuesta durante esta semana, te obsequiamos la **Plataforma de Video 360°** de regalo para sorprender a todos tus invitados.
            </p>
          </div>
        </div>

        {/* Pain of Payment Reduction Banner (Neuroventas) */}
        <div className="max-w-xl mx-auto text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
          🔒 Reserva flexible: Seña tu fecha y congela precios en cuotas fijas a tu medida.
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-3 px-8 py-5 rounded-2xl',
              'bg-[#25D366] hover:bg-[#1eb356] text-white',
              'font-black text-xs uppercase tracking-widest',
              'shadow-2xl shadow-green-950/40',
              'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
              'min-w-[250px] justify-center'
            )}
          >
            <MessageSquare className="w-5 h-5 shrink-0" />
            {ctaLabel}
          </a>
          <a
            href={`tel:+${whatsappNumber}`}
            className={cn(
              'flex items-center gap-3 px-8 py-5 rounded-2xl',
              'bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white',
              'font-black text-xs uppercase tracking-widest',
              'border border-white/10',
              'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
              'min-w-[200px] justify-center'
            )}
          >
            <Phone className="w-4 h-4 shrink-0" />
            Llamar Directo
          </a>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="h-px w-16 bg-white/10" />
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">O visitanos en redes</p>
          <div className="h-px w-16 bg-white/10" />
        </div>

        {/* Social links */}
        <div className="flex justify-center gap-4">
          {socialLinks.map(({ platform, href, icon: Icon, bgClass }) => (
            <a
              key={platform}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={platform}
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center text-white',
                'transition-all duration-300 hover:scale-125 hover:shadow-lg',
                bgClass
              )}
            >
              <Icon className="w-5 h-5" />
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
