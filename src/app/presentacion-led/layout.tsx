import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Presentación de Tecnología | AK Producciones Eventos',
  description: 'Conocé nuestra tecnología y despliegue visual en presentaciones en vivo.',
};
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

export default function PresentacionLedLayout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface mode="live">{children}</AkRedPremiumSurface>;
}
