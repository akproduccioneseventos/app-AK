import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

export const metadata: Metadata = {
  title: 'Presentación de Tecnología',
  description: 'Conocé nuestra tecnología y despliegue visual en presentaciones en vivo en Salto.',
  alternates: { canonical: '/presentacion-led' },
};

export default function PresentacionLedLayout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface mode="live">{children}</AkRedPremiumSurface>;
}
