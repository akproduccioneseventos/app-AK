'use server'

import { getFiestaById } from '@/app/actions/fiesta-actual';
import { answerConciergeQuestion } from '@/lib/concierge/concierge-engine';

export async function askConcierge(fiestaId: string, question: string) {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) {
    throw new Error('Fiesta no encontrada');
  }
  return answerConciergeQuestion(fiesta, question);
}
