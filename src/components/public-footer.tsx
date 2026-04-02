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
    colorClass: 'hover:text-pink-500',
  },
  {
    platform: 'Facebook',
    profileUrl: 'https://facebook.com/akproduccioneseventos',
    icon: Facebook,
    colorClass: 'hover:text-blue-500',
  },
  {
    platform: 'WhatsApp',
    profileUrl: 'https://wa.me/59899123456',
    icon: MessageSquare,
    colorClass: 'hover:text-green-500',
  },
  {
    platform: 'TikTok',
    profileUrl: 'https://tiktok.com/@akproduccioneseventos',
    icon: Music,
    colorClass: 'hover:text-slate-900',
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
        'py-6 px-6 flex flex-col sm:flex-row items-center justify-between gap-4',
        isDark
          ? 'bg-slate-900 border-t border-slate-800 text-slate-500'
          : 'bg-white/60 backdrop-blur-sm border-t border-slate-100 text-slate-400',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className={cn('relative w-7 h-7', isDark ? 'opacity-50' : 'opacity-40')}>
          <Image
            src="/logo_ak_producciones.png"
            alt="AK Producciones"
            fill
            className="object-contain"
            sizes="28px"
          />
        </div>
        <span
          className={cn(
            'text-[10px] font-black uppercase tracking-[0.2em]',
            isDark ? 'text-slate-600' : 'text-slate-300'
          )}
        >
          AK Producciones
        </span>
      </div>

      {/* Copyright */}
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] order-last sm:order-none">
        © {new Date().getFullYear()} AK Producciones Eventos
      </p>

      {/* Social Icons */}
      <div className="flex items-center gap-4">
        {socialLinks.map(({ platform, profileUrl, icon: Icon, colorClass }) => (
          <a
            key={platform}
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={platform}
            className={cn(
              'transition-all duration-300 hover:scale-125',
              isDark ? 'text-slate-600' : 'text-slate-300',
              colorClass
            )}
          >
            <Icon className="w-4 h-4" />
          </a>
        ))}
      </div>
    </footer>
  );
}
