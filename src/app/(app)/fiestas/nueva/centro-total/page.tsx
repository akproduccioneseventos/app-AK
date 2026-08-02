import { redirect } from 'next/navigation';
import { getFiestaActual } from '@/app/actions/fiesta-actual';

/**
 * Este tablero se unificó en el Centro de Fiesta.
 *
 * Había seis pantallas distintas para conducir la misma fiesta, con la
 * información repartida y ninguna completa. Quedó una sola, que muestra el
 * cronograma real del evento en vez de una segunda lista de etapas paralela.
 *
 * Se deja la redirección en vez de borrar la ruta para no romper enlaces ya
 * guardados. Si no hay ninguna fiesta cargada, lleva al listado de eventos.
 */
export default async function TableroUnificado() {
  const fiesta = await getFiestaActual().catch(() => null);
  if (!fiesta?.id) redirect('/eventos');
  redirect(`/fiestas/${encodeURIComponent(fiesta.id)}/centro`);
}
