import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AkRedPremiumSurface({
  children,
  mode = 'public',
  className,
}: {
  children: ReactNode;
  mode?: 'public' | 'live' | 'client';
  className?: string;
}) {
  const modeClass = mode === 'live'
    ? 'ak-red-premium-live'
    : mode === 'client'
      ? 'ak-red-premium-client'
      : 'ak-red-premium-public';

  return (
    <div
      className={cn('ak-red-premium-surface', modeClass, className)}
      data-ak-experience={mode}
    >
      {children}
    </div>
  );
}
