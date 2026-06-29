'use client';

import { MessageSquare, Phone, Instagram, Facebook, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CTASectionProps {
  whatsappNumber?: string;
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
  whatsappMessage?: string;
  instagramUrl?: string;
}

export function CTASection({
  whatsappNumber = '59898355530',
  headline = '¿Listo para tu\nEvento Soñado?',
  subheadline = 'Escribinos hoy y recibí una cotización personalizada sin costo. Estamos listos para hacer realidad tu celebración.',
  ctaLabel = '¡Cotizá tu evento!',
  whatsappMessage = 'Hola AK Producciones, me gustaria cotizar mi evento.',
  instagramUrl = 'https://instagram.com/akproduccioneseventos',
}: CTASectionProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const socialLinks = [
    {
      platform: 'Instagram',
      href: instagramUrl,
      icon: Instagram,
      bgClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    },
    {
      platform: 'Facebook',
      href: 'https://facebook.com/akproduccioneseventos',
      icon: Facebook,
      bgClass: 'bg-[#1877F2]',
    },
    {
      platform: 'TikTok',
      href: 'https://tiktok.com/@akproduccioneseventos',
      icon: Music,
      bgClass: 'bg-black',
    },
  ];

  return (
    <section
      id="contacto"
      className="ak-deferred-section relative overflow-hidden bg-zinc-950 py-24"
    >
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 border-l-2 border-indigo-500 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          Disponible ahora
        </div>

        {/* Headline */}
        <h2 className="mb-6 text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl font-headline">
          {headline.split('\n').map((line, i) => (
            <span
              key={i}
              className={cn(
                'block',
                i === 1 && 'text-indigo-300'
              )}
            >
              {line}
            </span>
          ))}
        </h2>

        {/* Subheadline */}
        <p className="text-white/70 text-lg sm:text-xl max-w-xl mx-auto mb-12 leading-relaxed">
          {subheadline}
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-3 px-8 py-5 rounded-lg',
              'bg-[#25D366] hover:bg-[#1eb356]',
              'text-white font-black text-base uppercase tracking-widest',
              'shadow-2xl shadow-green-900/40',
              'transition-all duration-200',
              'min-w-[250px] justify-center text-lg'
            )}
          >
            <MessageSquare className="w-6 h-6 shrink-0" />
            {ctaLabel}
          </a>
          <a
            href={`tel:+${whatsappNumber}`}
            className={cn(
              'flex items-center gap-3 px-8 py-5 rounded-lg',
              'bg-white/10 backdrop-blur-sm hover:bg-white/20',
              'text-white font-black text-base uppercase tracking-widest',
              'border border-white/30',
              'transition-all duration-200',
              'min-w-[200px] justify-center'
            )}
          >
            <Phone className="w-5 h-5 shrink-0" />
            Llamanos
          </a>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px flex-1 max-w-[80px] bg-white/20" />
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest">O seguinos en</p>
          <div className="h-px flex-1 max-w-[80px] bg-white/20" />
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
              <Icon className="w-6 h-6" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
