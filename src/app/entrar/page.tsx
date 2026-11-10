import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { entrarAlPortalPorTelefono } from '@/app/actions/fiesta/portal.actions';
import { EntrarClient } from './EntrarClient';

export const metadata = {
  title: 'Entrar | AK Producciones',
  description: 'Elegí cómo querés entrar a tu fiesta o plataforma de AK Producciones.',
};

export default async function EntrarPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ak_session');
  if (sessionCookie && sessionCookie.value) {
    redirect('/dashboard');
  }

  // Referencia a entrarAlPortalPorTelefono ejecutada en cliente via EntrarClient
  void entrarAlPortalPorTelefono;

  return <EntrarClient />;
}
