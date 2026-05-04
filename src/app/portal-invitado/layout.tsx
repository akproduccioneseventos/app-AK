import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

export default function PortalInvitadoLayout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface mode="client">{children}</AkRedPremiumSurface>;
}
