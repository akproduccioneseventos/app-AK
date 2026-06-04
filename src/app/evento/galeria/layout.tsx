import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galería de la Fiesta | AK Producciones',
  description: 'Reviví los mejores momentos de la fiesta.',
};

export default function GaleriaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
