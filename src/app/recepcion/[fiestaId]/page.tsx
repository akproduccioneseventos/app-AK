import { getInvitados } from '@/app/actions/fiesta/invitados.actions';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import RecepcionClient from './RecepcionClient';
import { notFound } from 'next/navigation';

// En esta version de Next los parametros de la direccion llegan como promesa y
// hay que esperarlos. Declarados como objeto plano el proyecto no compila, y por
// eso la aplicacion entera no se podia publicar.
export default async function RecepcionPage({ params }: { params: Promise<{ fiestaId: string }> }) {
  const { fiestaId } = await params;
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) notFound();

  const invitados = await getInvitados(fiestaId);

  return (
    <main className="min-h-screen bg-gray-50 flex justify-center w-full">
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg">
        <RecepcionClient
          fiestaId={fiestaId}
          initialInvitados={invitados}
          fiestaName={fiesta.configuracion?.nombreEvento || 'Evento'}
        />
      </div>
    </main>
  );
}
