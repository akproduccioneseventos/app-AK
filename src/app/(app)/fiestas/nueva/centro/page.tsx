import { redirect } from 'next/navigation';
import { getFiestaActual } from '@/app/actions/fiesta-actual';

/**
 * Atajo al Centro de Fiesta de la fiesta en curso.
 *
 * El Centro vive en `/fiestas/<id>/centro`, pero desde el panel de la fiesta que
 * se está armando no se conoce el id en el enlace. Esta pantalla lo resuelve y
 * lleva directo, para que el botón no dé un rodeo.
 */
export default async function AtajoAlCentro() {
  const fiesta = await getFiestaActual().catch(() => null);
  if (!fiesta?.id) redirect('/eventos');
  redirect(`/fiestas/${encodeURIComponent(fiesta.id)}/centro`);
}
