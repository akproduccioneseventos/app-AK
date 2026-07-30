'use server';

export interface AssistantOperationalStatus {
  writeActionsEnabled: boolean;
  toolCount: number;
  geminiKeyConfigured: boolean;
}

export async function getAssistantOperationalStatus(): Promise<AssistantOperationalStatus> {
  const { TOOL_REGISTRY } = await import('@/lib/assistant/tool-registry');

  return {
    writeActionsEnabled: process.env.ASSISTANT_WRITE_ACTIONS_ENABLED === 'true',
    toolCount: TOOL_REGISTRY.length,
    geminiKeyConfigured: Boolean(
      process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    ),
  };
}
