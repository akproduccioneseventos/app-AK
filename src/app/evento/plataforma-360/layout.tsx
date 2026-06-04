import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fotocabina | AK Producciones',
  description: 'Sacate fotos con marcos interactivos y subilas al muro.',
};

export default function FotocabinaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
