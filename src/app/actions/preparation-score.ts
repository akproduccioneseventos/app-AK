'use server';

import { getAllFiestas, getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { calculateFiestaPreparationScore } from '@/lib/fiesta/preparation-score';
import { saveAgentLearning } from '@/lib/multiagent/memory-store';
import { requireAppSession } from '@/lib/auth/require-session';

export async function getFiestaPreparationScore(fiestaId: string) {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'No encontrÃ© la fiesta.' };
  return {
    success: true,
    data: {
      fiestaId,
      nombreEvento: fiesta.configuracion?.nombreEvento || 'Fiesta sin nombre',
      fechaEvento: fiesta.configuracion?.fechaEvento,
      score: calculateFiestaPreparationScore(fiesta),
    },
  };
}

export async function getAllFiestasPreparationScores() {
  await requireAppSession();
  const fiestas = await getAllFiestas().catch(() => []);
  const data = fiestas.map((fiesta: any) => ({
    fiestaId: fiesta.id,
    nombreEvento: fiesta.configuracion?.nombreEvento || 'Fiesta sin nombre',
    fechaEvento: fiesta.configuracion?.fechaEvento,
    score: calculateFiestaPreparationScore(fiesta),
  }));

  return {
    success: true,
    data: data.sort((a, b) => a.score.score - b.score.score),
  };
}

export async function guardarPreparacionComoAprendizaje(fiestaId: string) {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'No encontrÃ© la fiesta.' };

  const score = calculateFiestaPreparationScore(fiesta);
  const nombre = fiesta.configuracion?.nombreEvento || 'Fiesta sin nombre';
  const content = [
    `Nivel de preparaciÃ³n: ${score.score}% (${score.label})`,
    score.summary,
    score.importantPending.length
      ? `A revisar: ${score.importantPending.map(item => item.label).join(', ')}`
      : 'Sin pendientes importantes visibles.',
  ].join('\n');

  await saveAgentLearning({
    agentType: 'fiesta',
    fiestaId,
    title: `PreparaciÃ³n de ${nombre}`,
    content,
    tags: ['preparacion', 'fiesta'],
    source: 'system',
    confidence: 'high',
  });

  await saveAgentLearning({
    agentType: 'fiestas_general',
    module: 'fiestas_general',
    title: `Nivel de preparaciÃ³n revisado: ${nombre}`,
    content,
    tags: ['preparacion', 'retroalimentacion'],
    source: 'system',
    confidence: 'high',
  });

  return { success: true, content };
}
