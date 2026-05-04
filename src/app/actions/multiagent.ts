'use server';

import { runMultiAgent } from '@/ai/flows/multiagent-flow';
import { saveAgentLearning, listAgentMemoryProfiles } from '@/lib/multiagent/memory-store';
import type { AkAgentType, AkMultiAgentMessage, AkMultiAgentOutput } from '@/types/multiagent';

export async function sendMultiAgentMessage(
  message: string,
  history: AkMultiAgentMessage[] = [],
  options?: {
    pathname?: string;
    fiestaId?: string;
    agentType?: AkAgentType;
    imageDataUri?: string;
  }
): Promise<AkMultiAgentOutput> {
  try {
    return await runMultiAgent({
      message,
      history,
      pathname: options?.pathname,
      fiestaId: options?.fiestaId,
      agentType: options?.agentType,
      imageDataUri: options?.imageDataUri,
    });
  } catch (error: any) {
    return {
      success: false,
      response: 'No pude responder con el Multiagente AK. Revisá si la API de Gemini está configurada y probá de nuevo.',
      agentType: options?.agentType ?? 'central',
      agentName: 'Multiagente AK',
      action: { type: 'none' },
      error: error?.message || 'Error desconocido',
    };
  }
}

export async function guardarAprendizajeAgente(input: {
  agentType: AkAgentType;
  title: string;
  content: string;
  fiestaId?: string;
  module?: string;
  tags?: string[];
}) {
  return saveAgentLearning({
    agentType: input.agentType,
    title: input.title,
    content: input.content,
    fiestaId: input.fiestaId,
    module: input.module,
    tags: input.tags,
    source: 'manual',
    confidence: 'high',
  });
}

export async function getMemoriasMultiagente() {
  return listAgentMemoryProfiles();
}
