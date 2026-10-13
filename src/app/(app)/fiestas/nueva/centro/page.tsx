import { redirect } from 'next/navigation';
import { getFiestaActual, getFiestaById } from '@/app/actions/fiesta-actual';

/**
 * Atajo al Centro de Fiesta de la fiesta en curso.
 *
 * El Centro vive en `/fiestas/<id>/centro`, pero desde el panel de la fiesta que
 * se está armando no se conoce el id en el enlace. Esta pantalla lo resuelve y
 * lleva directo, para que el botón no dé un rodeo.
 */
export default async function AtajoAlCentro({ searchParams }: { searchParams?: Promise<{ fiestaId?: string }> }) {
  // Si el enlace trae ?fiestaId= se va a ESA fiesta; la "actual" puede ser otra.
  const { fiestaId } = (await searchParams) ?? {};
  const fiesta = await (fiestaId ? getFiestaById(fiestaId) : getFiestaActual()).catch(() => null);
  if (!fiesta?.id) redirect('/eventos');
  redirect(`/fiestas/${encodeURIComponent(fiesta.id)}/centro`);
}
