import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

export const metadata: Metadata = {
  metadataBase: new URL('https://akproducciones.uy'),
  title: 'Catálogo de fiestas y servicios en Salto | AK Producciones Eventos',
  description:
    'Mirá todo lo que incluye tu fiesta en Salto: comida, discoteca, iluminación, fotografía, decoración y salones, con precios claros y opciones a medida.',
  alternates: {
    canonical: '/catalogo',
  },
  openGraph: {
    title: 'Catálogo de fiestas y servicios en Salto | AK Producciones Eventos',
    description:
      'Mirá todo lo que incluye tu fiesta en Salto: comida, discoteca, iluminación, fotografía, decoración y salones.',
    type: 'website',
    url: 'https://akproducciones.uy/catalogo',
    siteName: 'AK Producciones Eventos',
    locale: 'es_UY',
    images: [{ url: '/media/catalogo-servicios/quinceanera_hero.png', width: 1200, height: 630, alt: 'Catálogo de fiestas AK Producciones' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo de fiestas y servicios en Salto | AK Producciones Eventos',
    description: 'Comida, discoteca, iluminación, fotografía, decoración y salones en Salto.',
    images: ['/media/catalogo-servicios/quinceanera_hero.png'],
  },
};

export default function CatalogoLayout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface>{children}</AkRedPremiumSurface>;
}
