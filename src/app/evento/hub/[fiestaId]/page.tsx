import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zona Digital | AK Producciones',
  description: 'Conectate a la fiesta digital de AK Producciones',
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  // Simple pass-through layout without navigation bars
  return <>{children}</>;
}
