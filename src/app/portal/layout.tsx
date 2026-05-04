import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface mode="client">{children}</AkRedPremiumSurface>;
}
