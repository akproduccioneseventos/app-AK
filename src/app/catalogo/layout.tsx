import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

/**
 * El título y la descripción van en la envoltura y no en la pantalla porque la
 * pantalla del catálogo se dibuja del lado del navegador, y esas pantallas no
 * pueden declararlos. Sin esto, Google mostraba el catálogo sin título propio.
 */
export const metadata: Metadata = {
  title: 'Catálogo de fiestas y servicios en Salto | AK Producciones',
  description:
    'Mirá todo lo que incluye una fiesta con AK Producciones en Salto: comida, discoteca, iluminación, fotografía, decoración y salones, con precios claros.',
};

export default function CatalogoLayout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface>{children}</AkRedPremiumSurface>;
}
