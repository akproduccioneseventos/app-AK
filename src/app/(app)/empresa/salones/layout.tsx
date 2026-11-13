import React from 'react';
import { BarraDeLaCasa } from '@/components/navegacion/barra-de-la-casa';

export default function SalonesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <BarraDeLaCasa casaId="recursos" />
      {children}
    </div>
  );
}
