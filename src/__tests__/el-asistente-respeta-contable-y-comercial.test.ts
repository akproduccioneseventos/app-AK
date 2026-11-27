/** @jest-environment node */

describe('El asistente respeta contable y comercial (Orden 376 B2)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('una sesión con perfil personal o sin CONTABILIDAD recibe error sin llegar a runMultiAgent', async () => {
    const runMultiAgentMock = jest.fn(async () => ({ success: true, response: 'respuesta secreta' }));

    jest.doMock('@/lib/auth/session-token', () => ({
      verifySession: jest.fn(async () => ({
        success: true,
        user: { userId: 'u-personal', email: 'mozo@ak.uy', perfil: 'personal', role: 'personal' },
      })),
    }));
    jest.doMock('@/ai/flows/multiagent-flow', () => ({
      runMultiAgent: runMultiAgentMock,
    }));

    const { sendMultiAgentMessage } = await import('@/app/actions/multiagent');
    const resPersonal = await sendMultiAgentMessage('¿qué cuotas están vencidas?', [], {
      agentType: 'contable',
    });

    expect(resPersonal.success).toBe(false);
    expect(resPersonal.error).toBe('Tu perfil no tiene acceso a ese asistente.');
    expect(runMultiAgentMock).not.toHaveBeenCalled();

    // Operador sin permiso de CONTABILIDAD pidiendo agente contable tampoco llega a runMultiAgent
    jest.resetModules();
    const runMultiAgentOrgMock = jest.fn(async () => ({ success: true }));
    jest.doMock('@/lib/auth/session-token', () => ({
      verifySession: jest.fn(async () => ({
        success: true,
        user: { userId: 'u-op', email: 'op@ak.uy', perfil: 'operador', role: 'operador' },
      })),
    }));
    jest.doMock('@/ai/flows/multiagent-flow', () => ({
      runMultiAgent: runMultiAgentOrgMock,
    }));

    const { sendMultiAgentMessage: sendAsOrg } = await import('@/app/actions/multiagent');
    const resOrg = await sendAsOrg('¿qué cuotas están vencidas?', [], {
      agentType: 'contable',
    });
    expect(resOrg.success).toBe(false);
    expect(resOrg.error).toBe('Tu perfil no tiene acceso a ese asistente.');
    expect(runMultiAgentOrgMock).not.toHaveBeenCalled();
  });
});
