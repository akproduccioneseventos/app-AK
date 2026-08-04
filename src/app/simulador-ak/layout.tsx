import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AkRedPremiumSurface } from '@/components/brand/ak-red-premium-surface';

/**
 * La tarjeta que aparece al compartir Sofia por WhatsApp.
 *
 * El simulador publico ya la tenia; este no, asi que el enlace llegaba pelado:
 * titulo generico de toda la app y ninguna imagen. Va en el layout porque la
 * pantalla es de cliente y ahi no se puede definir.
 */
export const metadata: Metadata = {
  title: 'Sofía, tu asistente para cotizar la fiesta | AK Producciones',
  description:
    'Contale a Sofía cómo imaginás tu fiesta y armá el presupuesto con servicios reales de AK Producciones, con el precio vigente y el valor por persona.',
  openGraph: {
    title: 'Sofía, tu asistente para cotizar la fiesta',
    description:
      'Contale cómo imaginás tu fiesta y armá el presupuesto con servicios reales de AK Producciones, con el precio vigente y el valor por persona.',
    type: 'website',
    siteName: 'AK Producciones Eventos',
    locale: 'es_UY',
    images: [{ url: '/media/catalogo-servicios/quinceanera_hero.png', width: 1200, height: 630, alt: 'Fiesta producida por AK Producciones' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sofía, tu asistente para cotizar la fiesta',
    description: 'Armá tu presupuesto con servicios reales de AK Producciones.',
    images: ['/media/catalogo-servicios/quinceanera_hero.png'],
  },
};

export default function SimuladorAkLayout({ children }: { children: ReactNode }) {
  return (
    <AkRedPremiumSurface mode="client" className="ak-simulator-experience">
      {children}
    </AkRedPremiumSurface>
  );
}
