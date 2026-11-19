import { redirect } from 'next/navigation';
import { getFiestaActual } from '@/app/actions/fiesta-actual';

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
  // Con ?fiestaId= se va directo a su centro, sin leer la fiesta: el centro ya avisa si no existe. Leerla acá colgaba la
  // redirección con la base lenta (la prueba de la tanda 12-10 falló dos veces así el 18/11/2026).
  if (fiestaId && /^[A-Za-z0-9_-]{1,120}$/.test(fiestaId)) redirect(`/fiestas/${encodeURIComponent(fiestaId)}/centro`);
  const fiesta = await getFiestaActual().catch(() => null);
  if (!fiesta?.id) redirect('/eventos');
  redirect(`/fiestas/${encodeURIComponent(fiesta.id)}/centro`);
}
