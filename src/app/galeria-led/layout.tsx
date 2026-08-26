import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

export const metadata: Metadata = {
  metadataBase: new URL('https://akproducciones.uy'),
  title: 'Galería y Pantallas LED en Salto | AK Producciones Eventos',
  description:
    'Mirá las pantallas LED, iluminación interactiva y montajes visuales de fiestas producidas por AK Producciones en Salto, Uruguay.',
  alternates: {
    canonical: '/galeria-led',
  },
  openGraph: {
    title: 'Galería y Pantallas LED en Salto | AK Producciones Eventos',
    description:
      'Mirá las pantallas LED, iluminación interactiva y montajes visuales de fiestas producidas por AK Producciones en Salto.',
    type: 'website',
    url: 'https://akproducciones.uy/galeria-led',
    siteName: 'AK Producciones Eventos',
    locale: 'es_UY',
    images: [{ url: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg', width: 1200, height: 630, alt: 'Pantalla LED en fiesta de AK Producciones' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galería y Pantallas LED en Salto | AK Producciones Eventos',
    description: 'Pantallas LED e iluminación interactiva para fiestas en Salto.',
    images: ['/media/catalogo-servicios/discoteca-salon-ak-02.jpeg'],
  },
};

export default function GaleriaLedLayout({ children }: { children: ReactNode }) {
  return <AkRedPremiumSurface mode="live">{children}</AkRedPremiumSurface>;
}
