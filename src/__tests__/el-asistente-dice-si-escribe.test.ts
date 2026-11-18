/** @jest-environment node */
/**
 * Auditoría integral 17/11/2026 (N1): la pantalla decía "Modo operativo: desactivado" mientras el asistente creaba
 * prospectos. El estado que se muestra sale de la misma regla que usa el asistente para escribir.
 */
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => ({ ok: true })) }));
jest.mock('@/lib/assistant/tool-registry', () => ({ TOOL_REGISTRY: [] }));

import { getAssistantOperationalStatus } from '@/app/actions/assistant-operational-status';

describe('El estado del asistente dice lo mismo que hace', () => {
  const antes = process.env.ASSISTANT_WRITE_ACTIONS_ENABLED;
  afterAll(() => {
    if (antes === undefined) delete process.env.ASSISTANT_WRITE_ACTIONS_ENABLED;
    else process.env.ASSISTANT_WRITE_ACTIONS_ENABLED = antes;
  });

  it('sin configurar: escribe, y la pantalla dice activo', async () => {
    delete process.env.ASSISTANT_WRITE_ACTIONS_ENABLED;
    expect((await getAssistantOperationalStatus()).writeActionsEnabled).toBe(true);
  });

  it('apagado a propósito: la pantalla dice desactivado', async () => {
    process.env.ASSISTANT_WRITE_ACTIONS_ENABLED = 'false';
    expect((await getAssistantOperationalStatus()).writeActionsEnabled).toBe(false);
  });
});
