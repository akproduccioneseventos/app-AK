import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogo de Servicios y Presentaciones | AK Producciones Eventos',
  description:
    'Conocé los paquetes, servicios de discoteca, comida gourmet, tecnología interactiva y decoración para fiestas en Salto, Uruguay.',
  alternates: {
    canonical: 'https://akproducciones.uy/catalogo',
  },
  openGraph: {
    title: 'Catálogo de Servicios y Presentaciones | AK Producciones Eventos',
    description:
      'Conocé los paquetes, servicios de discoteca, comida gourmet, tecnología interactiva y decoración para fiestas en Salto, Uruguay.',
    url: 'https://akproducciones.uy/catalogo',
    siteName: 'AK Producciones Eventos',
    locale: 'es_UY',
    images: [{ url: '/media/catalogo-servicios/quinceanera_hero.png', width: 1200, height: 630, alt: 'Catálogo AK Producciones' }],
  },
};

export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
