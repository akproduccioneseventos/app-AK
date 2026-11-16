import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vogue Boomerang',
  description: 'Procesador de videos Boomerang en tiempo real.',
};

export default function BogueLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
