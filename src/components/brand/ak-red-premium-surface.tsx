import type { ReactNode } from 'react';

export function AkRedPremiumSurface({ children, mode = 'public' }: { children: ReactNode; mode?: 'public' | 'live' | 'client' }) {
  const modeClass = mode === 'live'
    ? 'ak-red-premium-live'
    : mode === 'client'
      ? 'ak-red-premium-client'
      : 'ak-red-premium-public';

  return <div className={`ak-red-premium-surface ${modeClass}`}>{children}</div>;
}
