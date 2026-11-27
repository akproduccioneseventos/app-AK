import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Espejo Mágico',
  description: 'Tomate fotos con filtros y stickers divertidos.',
};

export default function EspejoMagicoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
