'use server';

import { requireFiestaWriteAccess, getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { createNotification } from '@/app/actions/notifications';

export interface ChoqueParaAviso {
  platoNombre: string;
  restriccion: string;
  personasAfectadas: number;
}

const limpiar = (t: unknown, max = 60) => String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * Crea un aviso real para el equipo (cocina) con los platos que chocan con alergias.
 * Devuelve éxito sólo si el aviso se guardó.
 */
export async function avisarChoquesDeAlergiasACocina(
  fiestaId: string,
  choques: ChoqueParaAviso[],
): Promise<{ success: boolean; error?: string }> {
  await requireFiestaWriteAccess(fiestaId);

  const lista = (Array.isArray(choques) ? choques : []).slice(0, 20);
  if (lista.length === 0) return { success: false, error: 'No hay choques para avisar.' };

  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'No se encontró la fiesta.' };

  const nombre = limpiar(fiesta.configuracion?.nombreEvento || 'la fiesta', 80);
  const detalle = lista
    .map((c) => `${limpiar(c.platoNombre)} (${limpiar(c.restriccion)}, ${Math.max(0, Number(c.personasAfectadas) || 0)} pax)`)
    .join('; ');

  try {
    const res = await createNotification({
      titulo: 'Alergias: platos que chocan',
      mensaje: `${nombre}: ${detalle}`,
      href: `/fiestas/nueva/alergias?fiestaId=${encodeURIComponent(fiestaId)}`,
      icono: 'AlertTriangle',
    });
    if (!res?.success) return { success: false, error: res?.error || 'No se pudo crear el aviso.' };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'No se pudo crear el aviso.' };
  }
}
