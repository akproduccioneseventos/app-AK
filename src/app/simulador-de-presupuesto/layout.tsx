import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

/**
 * La tarjeta que aparece al compartir el simulador por WhatsApp.
 *
 * El simulador se comparte todo el tiempo con prospectos. Sin estos datos, el
 * chat mostraba el titulo generico de toda la app y ninguna imagen: el enlace
 * llegaba pelado. Va en el layout porque la pantalla es de cliente y ahi no se
 * puede definir.
 */
export const metadata: Metadata = {
  title: 'Cotizá tu fiesta en 2 minutos | AK Producciones',
  description:
    'Armá tu presupuesto con gastronomía, salón, tecnología y servicios reales de AK Producciones. Vas a ver el precio vigente y el valor por persona, sin compromiso.',
  openGraph: {
    title: 'Cotizá tu fiesta en 2 minutos',
    description:
      'Armá tu presupuesto con gastronomía, salón, tecnología y servicios reales de AK Producciones, con el precio vigente y el valor por persona.',
    type: 'website',
    siteName: 'AK Producciones Eventos',
    locale: 'es_UY',
    images: [{ url: '/media/catalogo-servicios/quinceanera_hero.png', width: 1200, height: 630, alt: 'Fiesta producida por AK Producciones' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cotizá tu fiesta en 2 minutos',
    description: 'Armá tu presupuesto con servicios reales de AK Producciones.',
    images: ['/media/catalogo-servicios/quinceanera_hero.png'],
  },
};

export default function SimuladorPresupuestoLayout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface>{children}</AkRedPremiumSurface>;
}
