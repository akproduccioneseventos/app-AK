'use server'

import { getFiestaById } from '@/app/actions/fiesta-actual';
import { answerConciergeQuestion } from '@/lib/concierge/concierge-engine';
import { buildPublicGuestPortalData } from '@/lib/guest-portal-public-data';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';

export async function askConcierge(
  fiestaId: string,
  guestId: string,
  guestAccessToken: string,
  question: string,
) {
  const normalizedQuestion = question.trim().slice(0, 300);
  if (!normalizedQuestion) throw new Error('Escribí una consulta.');

  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) {
    throw new Error('Fiesta no encontrada');
  }
  const publicPortal = buildPublicGuestPortalData(fiesta, guestId, guestAccessToken);
  if (!publicPortal) throw new Error('Acceso no autorizado.');

  await enforcePublicRateLimit({
    scope: 'guest-concierge',
    identity: `${fiestaId}|${guestId}`,
    limit: 20,
    windowMs: 60_000,
  });

  return answerConciergeQuestion(publicPortal.fiesta, normalizedQuestion);
}
