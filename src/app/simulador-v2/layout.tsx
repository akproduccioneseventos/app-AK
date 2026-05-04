import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

export default function SimuladorV2Layout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface>{children}</AkRedPremiumSurface>;
}
