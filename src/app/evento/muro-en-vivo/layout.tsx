import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

export default function EventoMuroEnVivoLayout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface mode="live">{children}</AkRedPremiumSurface>;
}
