'use server';

import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import { readData } from '@/lib/data-service';
import type { InformeFiestaAutomatico } from '@/lib/fiesta/informe-automatico';

export async function leerInformePosfiesta(fiestaId: string): Promise<InformeFiestaAutomatico | null> {
  if (!fiestaId?.trim()) throw new Error('Falta identificar la fiesta.');
  await requireEventPermission(fiestaId, PERMISOS.ADMINISTRACION);
  const informes = await readData<InformeFiestaAutomatico[]>('informes-posfiesta.json', []);
  return informes.find((informe) => informe.fiestaId === fiestaId) || null;
}
