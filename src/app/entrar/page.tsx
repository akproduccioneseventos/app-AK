import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/session-token';
import { EntrarClient } from './EntrarClient';

export const metadata = {
  title: 'Entrar',
  description: 'Elegí cómo querés entrar a tu fiesta o plataforma de AK Producciones.',
};

export default async function EntrarPage() {
  const session = await verifySession().catch(() => ({ success: false as const, user: undefined }));
  if (session.success && session.user) {
    redirect('/mi-dia');
  }

  return <EntrarClient />;
}
