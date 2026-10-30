'use server';

import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import { readDataConDetalle } from '@/lib/data-service';
import type { InformeFiestaAutomatico } from '@/lib/fiesta/informe-automatico';

export async function leerInformePosfiesta(fiestaId: string): Promise<InformeFiestaAutomatico | null> {
  if (typeof fiestaId !== 'string' || !fiestaId.trim()) throw new Error('Falta identificar la fiesta.');
  await requireEventPermission(fiestaId, PERMISOS.ADMINISTRACION);
  const { valor: informes, huboFalla } = await readDataConDetalle<InformeFiestaAutomatico[]>('informes-posfiesta.json', []);
  if (huboFalla) throw new Error('No se pudo leer el informe posfiesta. Volvé a intentar.');
  return informes.find((informe) => informe.fiestaId === fiestaId) || null;
}
