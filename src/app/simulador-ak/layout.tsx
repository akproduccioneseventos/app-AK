import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

export default function SimuladorAkLayout({ children }: { children: ReactNode }) {
  return (
    <AkRedPremiumSurface mode="client" className="ak-simulator-experience">
      {children}
    </AkRedPremiumSurface>
  );
}
