import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galería de Pantallas LED y Efectos | AK Producciones Eventos',
  description:
    'Mirá la tecnología visual, robóticas, pistas iluminadas y pantallas LED de AK Producciones para fiestas y eventos en Salto.',
  alternates: {
    canonical: 'https://akproducciones.uy/galeria-led',
  },
  openGraph: {
    title: 'Galería de Pantallas LED y Efectos | AK Producciones Eventos',
    description:
      'Mirá la tecnología visual, robóticas, pistas iluminadas y pantallas LED de AK Producciones para fiestas y eventos en Salto.',
    url: 'https://akproducciones.uy/galeria-led',
    siteName: 'AK Producciones Eventos',
    locale: 'es_UY',
    images: [{ url: '/media/catalogo-servicios/tecnologia_fiesta.png', width: 1200, height: 630, alt: 'Pantallas LED y Efectos' }],
  },
};

export default function GaleriaLedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
