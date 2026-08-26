import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

export const metadata: Metadata = {
  metadataBase: new URL('https://akproducciones.uy'),
  title: 'Simulador de Presupuesto en Salto | AK Producciones Eventos',
  description:
    'Armá tu presupuesto con comida, salón, discoteca y servicios reales de AK Producciones en Salto. Conocé el precio vigente y el valor por persona al instante.',
  alternates: {
    canonical: '/simulador-de-presupuesto',
  },
  openGraph: {
    title: 'Simulador de Presupuesto en Salto | AK Producciones Eventos',
    description:
      'Armá tu presupuesto con comida, salón, discoteca y servicios reales de AK Producciones en Salto, con precio vigente y valor por persona.',
    type: 'website',
    url: 'https://akproducciones.uy/simulador-de-presupuesto',
    siteName: 'AK Producciones Eventos',
    locale: 'es_UY',
    images: [{ url: '/media/catalogo-servicios/quinceanera_hero.png', width: 1200, height: 630, alt: 'Simulador de presupuesto AK Producciones' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simulador de Presupuesto en Salto | AK Producciones Eventos',
    description: 'Armá tu presupuesto con servicios reales de AK Producciones en Salto.',
    images: ['/media/catalogo-servicios/quinceanera_hero.png'],
  },
};

export default function SimuladorPresupuestoLayout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface>{children}</AkRedPremiumSurface>;
}
