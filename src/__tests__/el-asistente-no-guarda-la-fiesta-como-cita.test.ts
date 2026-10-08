/**
 * El asistente y el multiagente no guardan la fecha de la fiesta como cita del CRM (8/10/2026).
 *
 * Pasó: al anotar un prospecto desde un mensaje con fecha de fiesta, la fecha iba a `followUpDate`,
 * que es la reunion agendada. El CRM la mostraba en la agenda como cita. La fecha de la fiesta va
 * en `eventDate`; `followUpDate` queda solo para una reunion de verdad.
 */
import * as fs from 'fs';
import * as path from 'path';

const mockAddCrmLead = jest.fn();

jest.mock('@/app/actions/crm', () => ({
  addCrmLead: (...args: any[]) => (mockAddCrmLead as any)(...args),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/lib/multiagent/encargado', () => ({
  ejecutarEncargado: jest.fn(async () => ({
    success: true,
    response: 'Listo.',
    agentType: 'central',
    agentName: 'AK',
    action: {
      type: 'create_lead',
      data: { name: 'Ana Pérez', partyType: 'Quince', eventDate: '2026-12-20' },
    },
  })),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestaById: jest.fn(), saveFiesta: jest.fn() }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => ({ success: true })) }));
jest.mock('@/lib/multiagent/memory-store', () => ({
  saveAgentLearning: jest.fn(async () => ({})),
  listAgentMemoryProfiles: jest.fn(async () => []),
}));
jest.mock('@/lib/multiagent/chat-store', () => ({
  appendMultiAgentChatTurn: jest.fn(async () => ({})),
  listMultiAgentChatSessions: jest.fn(async () => []),
}));
jest.mock('@/lib/multiagent/diagnostics', () => ({
  buildMultiAgentTeamBriefing: jest.fn(async () => ''),
  summarizeDiagnosticsForLearning: jest.fn(() => ''),
}));

import { sendPersistentMultiAgentMessage } from '@/app/actions/multiagent';
import { executeCrearProspecto } from '@/lib/assistant/tools/executors';

const leer = (...partes: string[]) =>
  fs.readFileSync(path.resolve(__dirname, '..', ...partes), 'utf8');

beforeEach(() => {
  mockAddCrmLead.mockReset();
  mockAddCrmLead.mockResolvedValue({ success: true, lead: { name: 'Ana Pérez' } });
});

describe('Multiagente: la fecha de la fiesta va como eventDate, no como cita', () => {
  it('create_lead guarda eventDate y no followUpDate', async () => {
    await sendPersistentMultiAgentMessage({ message: 'anotá a Ana Pérez, quince el 20 de diciembre' });
    expect(mockAddCrmLead).toHaveBeenCalledTimes(1);
    const input = mockAddCrmLead.mock.calls[0][0];
    expect(input.followUpDate).toBeUndefined();
    expect(input.eventDate).toBe('2026-12-20');
  });
});

describe('Herramienta crearProspecto: la fecha de la fiesta no se vuelve cita', () => {
  it('con eventDate, el lead lo lleva como eventDate y sin followUpDate', async () => {
    await executeCrearProspecto({ name: 'Ana Pérez', partyType: 'Quince', eventDate: '2026-12-20' });
    const input = mockAddCrmLead.mock.calls[0][0];
    expect(input.followUpDate).toBeUndefined();
    expect(input.eventDate).toBe('2026-12-20');
  });
});

describe('Asistente: los caminos de crear prospecto pasan la fecha como eventDate', () => {
  const fuente = leer('app', 'actions', 'assistant.ts');

  it('el router de create_lead manda eventDate y no followUpDate', () => {
    const bloque = fuente.slice(
      fuente.indexOf('// ── create_lead via TOOL_REGISTRY'),
      fuente.indexOf("action: { type: 'create_lead', data: toolInput", fuente.indexOf('// ── create_lead via TOOL_REGISTRY')),
    );
    expect(bloque).toMatch(/eventDate:\s*intent\.data\.followUpDate/);
    expect(bloque).not.toMatch(/followUpDate:\s*intent\.data\.followUpDate/);
  });

  it('el camino de Gemini para create_lead manda eventDate y no followUpDate', () => {
    const inicio = fuente.indexOf("} else if (result.action?.type === 'create_lead') {");
    const fin = fuente.indexOf('const toolResult = await tool.execute(toolInput);', inicio);
    const bloque = fuente.slice(inicio, fin);
    expect(bloque).toMatch(/eventDate:\s*d\.eventDate/);
    expect(bloque).not.toMatch(/followUpDate:\s*d\.followUpDate/);
  });
});
