

'use server';

import type { ReposteriaData, BebidasData } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';

// These are now general actions to get data from ANY event for the planner.
export async function getReposteriaDataForPlanner(fiestaId: string): Promise<ReposteriaData> {
  if (!fiestaId) throw new Error("Fiesta ID is required");
  const fiesta = await getFiestaById(fiestaId);
  return fiesta?.reposteria || { categorias: [], notasGenerales: '' };
}

export async function getBebidasDataForPlanner(fiestaId: string): Promise<BebidasData> {
  if (!fiestaId) throw new Error("Fiesta ID is required");
  const fiesta = await getFiestaById(fiestaId);
  return fiesta?.bebidas || { categorias: [], notasGenerales: '' };
}
