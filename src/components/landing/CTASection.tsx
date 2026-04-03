'use client';

import { MessageSquare, Phone, Instagram, Facebook, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CTASectionProps {
  whatsappNumber?: string;
  headline?: string;
  subheadline?: string;
}

export function CTASection({
  whatsappNumber = '59899123456',
  headline = '¿Listo para tu\nEvento Soñado?',
  subheadline = 'Escribinos hoy y recibí una cotización personalizada sin costo. Estamos listos para hacer realidad tu celebración.',
}: CTASectionProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    '¡Hola AK Producciones! Me gustaría cotizar mi evento.'
  )}`;

  const socialLinks = [
    {
      platform: 'Instagram',
      href: 'https://instagram.com/akproduccioneseventos',
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
      className="relative py-28 overflow-hidden bg-gradient-to-br from-purple-700 via-purple-800 to-fuchsia-900"
    >
      {/* Decorative blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-black uppercase tracking-widest mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Disponible ahora
        </div>

        {/* Headline */}
        <h2 className="font-headline text-5xl sm:text-6xl md:text-7xl font-black text-white leading-[0.95] mb-6">
          {headline.split('\n').map((line, i) => (
            <span
              key={i}
              className={cn(
                'block',
                i === 1 && 'text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-yellow-200'
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
              'flex items-center gap-3 px-8 py-5 rounded-2xl',
              'bg-[#25D366] hover:bg-[#1eb356]',
              'text-white font-black text-base uppercase tracking-widest',
              'shadow-2xl shadow-green-900/40',
              'transition-all duration-300 hover:scale-105 active:scale-95',
              'min-w-[250px] justify-center text-lg',
              'animate-pulse hover:animate-none'
            )}
          >
            <MessageSquare className="w-6 h-6 shrink-0" />
            ¡Cotizá tu evento!
          </a>
          <a
            href={`tel:+${whatsappNumber}`}
            className={cn(
              'flex items-center gap-3 px-8 py-5 rounded-2xl',
              'bg-white/10 backdrop-blur-sm hover:bg-white/20',
              'text-white font-black text-base uppercase tracking-widest',
              'border border-white/30',
              'transition-all duration-300 hover:scale-105 active:scale-95',
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
