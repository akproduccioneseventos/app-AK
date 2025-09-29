
'use server';

import type { ReposteriaData, BebidasData } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';

// These are temporary actions to get data from the "fiesta-actual" for the planner.
// In the future, these might fetch from a more generic or configurable source if the planner
// needs to work with different event types or templates.

export async function getReposteriaDataForPlanner(): Promise<ReposteriaData> {
  const fiesta = await getFiestaActual();
  return fiesta.reposteria || { categorias: [], notasGenerales: '' };
}

export async function getBebidasDataForPlanner(): Promise<BebidasData> {
  const fiesta = await getFiestaActual();
  return fiesta.bebidas || { categorias: [], notasGenerales: '' };
}
