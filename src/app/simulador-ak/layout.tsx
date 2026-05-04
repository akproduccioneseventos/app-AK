import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

export default function SimuladorAkLayout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface>{children}</AkRedPremiumSurface>;
}
