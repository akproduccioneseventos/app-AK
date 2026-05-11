'use server';

import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { buildAk100Readiness } from '@/lib/ak-100/ak-100-readiness';

export async function getAk100Readiness(fiestaId: string) {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return null;
  return buildAk100Readiness(fiesta);
}
