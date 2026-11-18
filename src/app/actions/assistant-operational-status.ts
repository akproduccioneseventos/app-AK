'use server';


import { requireAppSession } from '@/lib/auth/require-session';
export interface AssistantOperationalStatus {
  writeActionsEnabled: boolean;
  toolCount: number;
  geminiKeyConfigured: boolean;
}

export async function getAssistantOperationalStatus(): Promise<AssistantOperationalStatus> {
  await requireAppSession();
  const { TOOL_REGISTRY } = await import('@/lib/assistant/tool-registry');

  return {
    // La misma regla que aplica el asistente al escribir (`isWriteActionsEnabled` en lib/assistant/tools/executors.ts):
    // activo salvo que se apague a propósito. La pantalla decía "desactivado" mientras el asistente creaba prospectos
    // (auditoría integral 17/11/2026, N1).
    writeActionsEnabled: process.env.ASSISTANT_WRITE_ACTIONS_ENABLED !== 'false',
    toolCount: TOOL_REGISTRY.length,
    geminiKeyConfigured: Boolean(
      process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    ),
  };
}
