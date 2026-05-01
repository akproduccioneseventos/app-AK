import type { ReactNode } from 'react';
import ClientPortalVipUxLayer from '@/components/portal-cliente/ClientPortalVipUxLayer';

export default function PortalClienteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ClientPortalVipUxLayer mode="admin" />
      {children}
    </>
  );
}
