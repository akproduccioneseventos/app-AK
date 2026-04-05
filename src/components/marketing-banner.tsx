'use client';

import { useState, useEffect } from 'react';
import { Facebook, Instagram, Music, MessageSquare } from 'lucide-react';
import { getSocialConnections } from '@/app/actions/social-connections';
import { cn } from '@/lib/utils';
import { CompanyLogo } from '@/components/company-logo';

const FALLBACK_SOCIAL = [
  {
    platform: 'Instagram',
    profileUrl: 'https://instagram.com/akproduccioneseventos',
    icon: Instagram,
    bgClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    shadowClass: 'hover:shadow-pink-400/60',
  },
  {
    platform: 'Facebook',
    profileUrl: 'https://facebook.com/akproduccioneseventos',
    icon: Facebook,
    bgClass: 'bg-[#1877F2]',
    shadowClass: 'hover:shadow-blue-500/60',
  },
  {
    platform: 'WhatsApp',
    profileUrl: 'https://wa.me/59899123456',
    icon: MessageSquare,
    bgClass: 'bg-[#25D366]',
    shadowClass: 'hover:shadow-green-400/60',
  },
  {
    platform: 'TikTok',
    profileUrl: 'https://tiktok.com/@akproduccioneseventos',
    icon: Music,
    bgClass: 'bg-black',
    shadowClass: 'hover:shadow-slate-700/60',
  },
];

interface MarketingBannerProps {
  /** 'full' shows headline + CTA button; 'compact' shows only logo + social icons */
  variant?: 'full' | 'compact';
  /** Phone number for WhatsApp CTA (digits only, e.g. "59899123456") */
  whatsappNumber?: string;
  /** Whether to show the "¡Consultanos!" WhatsApp CTA button */
  showCTA?: boolean;
  className?: string;
}

export function MarketingBanner({
  variant = 'full',
  whatsappNumber = '59899123456',
  showCTA = true,
  className,
}: MarketingBannerProps) {
  const [socialLinks, setSocialLinks] =
    useState<typeof FALLBACK_SOCIAL>(FALLBACK_SOCIAL);

  useEffect(() => {
    getSocialConnections()
      .then((connections) => {
        if (connections.length > 0) {
          const merged = FALLBACK_SOCIAL.map((fallback) => {
            const conn = connections.find(
              (c) =>
                c.platform === fallback.platform &&
                c.isConnected &&
                c.profileUrl
            );
            if (conn) {
              return { ...fallback, profileUrl: conn.profileUrl! };
            }
            return fallback;
          });
          setSocialLinks(merged);
        }
      })
      .catch(() => {
        // Non-blocking: fallback social links remain in place
      });
  }, []);

  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    '¡Hola AK Producciones! Vi su página y me gustaría consultar sobre mis eventos.'
  )}`;

  return (
    <div
      className={cn(
        'rounded-3xl overflow-hidden',
        'bg-gradient-to-br from-purple-700 via-purple-600 to-fuchsia-700',
        'shadow-2xl shadow-purple-900/30',
        'p-8 flex flex-col items-center gap-6 text-center',
        'animate-in fade-in slide-in-from-bottom-4 duration-700',
        className
      )}
    >
      {/* Logo */}
      <CompanyLogo size="lg" className="drop-shadow-[0_4px_24px_rgba(255,255,255,0.25)]" />

      {variant === 'full' && (
        <>
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-200">
              Organizado por
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              AK Producciones 🎉
            </h3>
            <p className="text-sm font-bold text-purple-200 max-w-xs mx-auto leading-relaxed">
              Hacemos tu sueño realidad —{' '}
              <span className="text-white">XV años, Bodas, Cumpleaños</span>
            </p>
          </div>

          {showCTA && (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-full max-w-xs">
              <button
                className={cn(
                  'w-full h-14 rounded-2xl',
                  'bg-[#25D366] hover:bg-[#1eb356]',
                  'text-white font-black text-base uppercase tracking-widest',
                  'shadow-xl shadow-green-900/40',
                  'flex items-center justify-center gap-3',
                  'transition-all duration-300 hover:scale-105 active:scale-95',
                  'animate-pulse hover:animate-none'
                )}
              >
                <MessageSquare className="w-5 h-5 shrink-0" />
                ¡Consúltanos!
              </button>
            </a>
          )}
        </>
      )}

      {/* Social Icons */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-200">
          ¡Seguinos en redes!
        </p>
        <div className="flex items-center gap-3">
          {socialLinks.map(({ platform, profileUrl, icon: Icon, bgClass, shadowClass }) => (
            <a
              key={platform}
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={platform}
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center text-white',
                'transition-all duration-300 hover:scale-125 hover:shadow-lg',
                bgClass,
                shadowClass
              )}
            >
              <Icon className="w-6 h-6" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
