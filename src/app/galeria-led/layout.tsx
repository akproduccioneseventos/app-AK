import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Galería LED | AK Producciones Eventos',
  description: 'Explora nuestra galería de eventos y visuales para pantallas LED.',
};
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

export default function GaleriaLedLayout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface mode="live">{children}</AkRedPremiumSurface>;
}
