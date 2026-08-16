import type { Metadata } from 'next';
import { ConversionClosingLayer } from './conversion-closing-layer';

export const metadata: Metadata = {
  title: 'Portafolio LED | AK Producciones Eventos',
  description: 'Conocé nuestro catálogo de visuales para pantallas LED.',
};
import { PortafolioLedClient } from './portafolio-led-client';

export default function PortafolioLedPage() {
  return (
    <>
      <PortafolioLedClient />
      <ConversionClosingLayer />
    </>
  );
}
