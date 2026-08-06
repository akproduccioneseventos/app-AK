import { getInvitados } from '@/app/actions/fiesta/invitados.actions';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import RecepcionClient from './RecepcionClient';
import { notFound } from 'next/navigation';

export default async function RecepcionPage({ params }: { params: { fiestaId: string } }) {
  const fiesta = await getFiestaById(params.fiestaId);
  if (!fiesta) notFound();
  
  const invitados = await getInvitados(params.fiestaId);
  
  return (
    <main className="min-h-screen bg-gray-50 flex justify-center w-full">
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg">
        <RecepcionClient 
          fiestaId={params.fiestaId} 
          initialInvitados={invitados} 
          fiestaName={fiesta.configuracion?.nombreEvento || 'Evento'} 
        />
      </div>
    </main>
  );
}
