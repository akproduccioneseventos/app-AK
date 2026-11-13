import React from 'react';
import { BarraDeLaCasa } from '@/components/navegacion/barra-de-la-casa';

export default function InvoicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <BarraDeLaCasa casaId="plata" />
      {children}
    </div>
  );
}
