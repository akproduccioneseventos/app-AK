'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Facebook, Instagram, Music, MessageSquare } from 'lucide-react';
import { getSocialConnections } from '@/app/actions/social-connections';
import { cn } from '@/lib/utils';

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

interface PublicFooterProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function PublicFooter({ className, variant = 'light' }: PublicFooterProps) {
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
            return conn ? { ...fallback, profileUrl: conn.profileUrl! } : fallback;
          });
          setSocialLinks(merged);
        }
      })
      .catch(() => {});
  }, []);

  const isDark = variant === 'dark';

  return (
    <footer
      className={cn(
        'py-8 px-6 flex flex-col items-center gap-5',
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700'
          : 'bg-gradient-to-br from-purple-50 via-white to-pink-50 border-t border-purple-100',
        className
      )}
    >
      {/* Logo + brand */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-14 h-14 drop-shadow-lg">
          <Image
            src="/logo_ak_producciones.png"
            alt="AK Producciones"
            fill
            className="object-contain"
            sizes="56px"
          />
        </div>
        <span
          className={cn(
            'text-xs font-black uppercase tracking-[0.25em]',
            isDark ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          AK Producciones
        </span>
      </div>

      {/* Call to action */}
      <p
        className={cn(
          'text-sm font-black uppercase tracking-[0.2em]',
          isDark ? 'text-purple-300' : 'text-purple-600'
        )}
      >
        ¡Seguinos en redes!
      </p>

      {/* Social Icons */}
      <div className="flex items-center gap-4">
        {socialLinks.map(({ platform, profileUrl, icon: Icon, bgClass, shadowClass }) => (
          <a
            key={platform}
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={platform}
            className={cn(
              'w-10 h-10 rounded-2xl flex items-center justify-center text-white',
              'transition-all duration-300 hover:scale-125 hover:shadow-lg',
              bgClass,
              shadowClass
            )}
          >
            <Icon className="w-5 h-5" />
          </a>
        ))}
      </div>

      {/* Copyright */}
      <p
        className={cn(
          'text-[10px] font-bold uppercase tracking-[0.2em]',
          isDark ? 'text-slate-600' : 'text-slate-400'
        )}
      >
        © {new Date().getFullYear()} AK Producciones Eventos
      </p>
    </footer>
  );
}
