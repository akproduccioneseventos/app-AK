const mockChatSessions: any[] = [];
const fetchMock = jest.fn();

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { id: 'u1', email: 'duenio@ak.uy', perfil: 'dueno' } }),
}));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'u1', perfil: 'dueno' } }),
  requirePermisoAlguno: jest.fn().mockResolvedValue(undefined),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true }),
}));
jest.mock('@/lib/auth/solo-lectura', () => ({
  exigirQueNoSalgaAfuera: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/multiagent/encargado', () => ({
  ejecutarEncargado: jest.fn().mockResolvedValue({
    success: true,
    response: 'Entendido el pedido de reunión.',
    agentType: 'central',
    agentName: 'Secretario AK',
    action: {
      type: 'agendar_reunion',
      data: {
        titulo: 'Reunión con Ana',
        fecha: '2026-12-01T13:00:00.000Z',
        email: 'ana@cliente.uy',
        confirmado: true, // aunque el modelo mande confirmado: true, el chat igual pide confirmación
      },
    },
  }),
}));
jest.mock('@/lib/multiagent/chat-store', () => ({
  getMultiAgentChatSession: jest.fn(async (id: string) => mockChatSessions.find((s) => s.id === id) ?? null),
  appendMultiAgentChatTurn: jest.fn(async (input: any) => {
    const idx = input.sessionId ? mockChatSessions.findIndex((s) => s.id === input.sessionId) : -1;
    const prev = idx >= 0 ? mockChatSessions[idx] : { id: 'chat_362', messages: [] };
    const updated = {
      ...prev,
      id: prev.id || 'chat_362',
      ...(input.pendingAction !== undefined ? { pendingAction: input.pendingAction } : {}),
    };
    if (idx >= 0) mockChatSessions[idx] = updated;
    else mockChatSessions.push(updated);
    return updated;
  }),
  listMultiAgentChatSessions: jest.fn(async () => mockChatSessions),
}));
jest.mock('@/lib/multiagent/memory-store', () => ({
  saveAgentLearning: jest.fn(),
  listAgentMemoryProfiles: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, def: any) => {
    if (file === '_google-workspace-accounts.json') {
      return [{ id: 'acc_1', kind: 'company', accessToken: 'tok_cal', calendarId: 'primary' }];
    }
    return def;
  }),
  writeData: jest.fn(),
}));

import { sendPersistentMultiAgentMessage } from '@/app/actions/multiagent';
import { upsertGoogleCalendarEvent } from '@/lib/google-workspace';

describe('Orden 362: el asistente pide un sí de verdad antes de agendar y no duplica el evento', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChatSessions.length = 0;
    global.fetch = fetchMock as any;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'akreunion123' }),
      text: async () => '',
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('el "si" dentro de una oración NO agenda; un "sí" solo en el turno siguiente SÍ agenda una vez', async () => {
    const r1 = await sendPersistentMultiAgentMessage({
      message: 'agendame con Ana el martes, si puede ser a las 10',
      sessionId: 'chat_362',
    });

    expect(r1.success).toBe(true);
    expect(r1.response).toContain('¿Confirmo?');
    expect(fetchMock).not.toHaveBeenCalled();

    const r2 = await sendPersistentMultiAgentMessage({
      message: 'sí',
      sessionId: 'chat_362',
    });

    expect(r2.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(r2.response).toContain('Reunión agendada en Google Calendar');
  });

  it('repetir la llamada en google-workspace con 409 conflict hace PATCH al mismo ID en vez de duplicar', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 409, text: async () => 'Already exists' })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'akreunion_mismo' }), text: async () => '' });

    const res = await upsertGoogleCalendarEvent(
      { id: 'acc_1', kind: 'company', accessToken: 'tok', email: 'a@b.uy', calendarId: 'primary' } as any,
      { summary: 'Reunión con Ana', description: 'Desc', startIso: '2026-12-01T13:00:00.000Z', endIso: '2026-12-01T14:00:00.000Z' }
    );

    expect(res.id).toBe('akreunion_mismo');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].method).toBe('PATCH');
  });
});
