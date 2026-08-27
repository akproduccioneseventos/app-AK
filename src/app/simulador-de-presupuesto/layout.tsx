import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Simulador de Presupuesto para Fiestas y Eventos | AK Producciones',
  description:
    'Calculá el costo estimado de tu fiesta de 15 años, boda o evento en Salto. Elegí comida, discoteca, tecnología y recibí una propuesta clara.',
  alternates: {
    canonical: 'https://akproducciones.uy/simulador-de-presupuesto',
  },
  openGraph: {
    title: 'Simulador de Presupuesto para Fiestas y Eventos | AK Producciones',
    description:
      'Calculá el costo estimado de tu fiesta de 15 años, boda o evento en Salto. Elegí comida, discoteca, tecnología y recibí una propuesta clara.',
    url: 'https://akproducciones.uy/simulador-de-presupuesto',
    siteName: 'AK Producciones Eventos',
    locale: 'es_UY',
    images: [{ url: '/media/catalogo-servicios/quinceanera_hero.png', width: 1200, height: 630, alt: 'Simulador de Presupuesto AK Producciones' }],
  },
};

export default function SimuladorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
