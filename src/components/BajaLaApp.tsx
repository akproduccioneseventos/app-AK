'use client';

import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { AK_PLAY_STORE_URL } from '@/lib/public-contact';
import { PwaInstallButton } from '@/components/pwa-install-button';
import { cn } from '@/lib/utils';

interface BajaLaAppProps {
  compact?: boolean;
  label?: string;
  className?: string;
}

export function BajaLaApp({ compact = false, label, className }: BajaLaAppProps) {
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = window.navigator.userAgent.toLowerCase();
    setIsAndroid(/android/.test(ua));
  }, []);

  if (isAndroid) {
    return (
      <div className={cn('inline-flex flex-col items-center gap-1.5', className)}>
        {label ? <span className="text-xs font-semibold text-slate-300">{label}</span> : null}
        <a
          href={AK_PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="baja-la-app-play-store"
          className={cn(
            'inline-flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-400/30 bg-emerald-600 text-white font-bold shadow-lg transition hover:bg-emerald-500',
            compact ? 'px-4 py-2 text-xs' : 'w-full px-5 py-3.5 text-sm',
          )}
        >
          <Smartphone className="h-4 w-4 shrink-0" />
          <span>Disponible en Google Play</span>
        </a>
      </div>
    );
  }

  return (
    <div className={cn(compact ? 'inline-block max-w-md text-left' : 'w-full', className)}>
      {label ? <p className="mb-1.5 text-xs font-semibold text-slate-300 text-center">{label}</p> : null}
      <PwaInstallButton />
    </div>
  );
}
