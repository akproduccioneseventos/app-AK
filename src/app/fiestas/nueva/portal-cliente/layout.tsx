import type { ReactNode } from 'react';
import PortalClienteInternalClarifier from './PortalClienteInternalClarifier';

export default function PortalClienteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PortalClienteInternalClarifier />
      {children}
    </>
  );
}
