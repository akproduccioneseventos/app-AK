import type { ReactNode } from 'react';
import ClientPortalVipUxLayer from '@/components/portal-cliente/ClientPortalVipUxLayer';

export default function PublicClientPortalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ClientPortalVipUxLayer mode="public" />
      {children}
    </>
  );
}
