import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plataforma 360° | AK Producciones',
  description: 'Sube tu video 360° al muro del evento.',
};

export default function Plataforma360Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
