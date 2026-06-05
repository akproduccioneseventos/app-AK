import { isMultiAgentSessionScopeCompatible } from '@/lib/multiagent/chat-store';

describe('multiagent chat session scope', () => {
  it('keeps sessions isolated by specialist', () => {
    expect(isMultiAgentSessionScopeCompatible(
      { agentType: 'contable' },
      { agentType: 'comercial' },
    )).toBe(false);
  });

  it('keeps each fiesta conversation isolated', () => {
    expect(isMultiAgentSessionScopeCompatible(
      { agentType: 'fiesta', fiestaId: 'fiesta_1' },
      { agentType: 'fiesta', fiestaId: 'fiesta_2' },
    )).toBe(false);
  });

  it('reuses a session only inside the same scope', () => {
    expect(isMultiAgentSessionScopeCompatible(
      { agentType: 'fiesta', fiestaId: 'fiesta_1' },
      { agentType: 'fiesta', fiestaId: 'fiesta_1' },
    )).toBe(true);
  });
});
