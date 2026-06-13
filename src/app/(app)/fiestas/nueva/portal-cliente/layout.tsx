import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';
import ClientPortalVipUxLayer from '@/components/portal-cliente/ClientPortalVipUxLayer';

export default function PortalClienteLayout({ children }: { children: ReactNode }) {
  return (
    <AkRedPremiumSurface mode="client">
      <ClientPortalVipUxLayer mode="admin" />
      {children}
    </AkRedPremiumSurface>
  );
}
