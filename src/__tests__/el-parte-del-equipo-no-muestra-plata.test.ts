/** @jest-environment node */

let mockSessionUser: {
  userId: string;
  email: string;
  role: string;
  perfil: string;
} | null = {
  userId: 'u-op',
  email: 'operador@ak.uy',
  role: 'user',
  perfil: 'operador',
};

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () =>
    mockSessionUser
      ? { success: true, user: mockSessionUser }
      : { success: false, error: 'No autorizado' },
  ),
}));

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

const mockFiestas = [
  {
    id: 'fiesta-1',
    configuracion: {
      nombreEvento: 'Cumple 15 Sofía',
      fechaEvento: '2026-12-20',
    },
    tareas: [{ id: 't1', texto: 'Confirmar sonido', completada: false }],
    planDePagos: {
      cuotas: [
        { id: 'c1', estado: 'pendiente', fechaVencimiento: '2020-01-01', monto: 10000 },
      ],
    },
    clientPaymentNotifications: [
      { id: 'cp1', estado: 'pendiente', monto: 5000 },
    ],
  },
];

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn(async () => mockFiestas),
  getFiestaById: jest.fn(async () => mockFiestas[0]),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn(async () => []),
}));

jest.mock('@/app/actions/crm', () => ({
  getCrmLeads: jest.fn(async () => []),
}));

jest.mock('@/app/actions/notifications', () => ({
  getNotifications: jest.fn(async () => []),
}));

jest.mock('@/app/actions/commercial-intelligence', () => ({
  getCommercialFollowups: jest.fn(async () => ({ success: true, data: [] })),
}));

jest.mock('@/app/actions/post-event-intelligence', () => ({
  getPostEventOpportunities: jest.fn(async () => ({ success: true, data: [] })),
}));

jest.mock('@/lib/multiagent/memory-store', () => ({
  saveAgentLearning: jest.fn(async () => ({ id: 'm1' })),
  listAgentMemoryProfiles: jest.fn(async () => []),
}));

jest.mock('@/lib/multiagent/chat-store', () => ({
  appendMultiAgentChatTurn: jest.fn(async () => ({ id: 's1' })),
  getMultiAgentChatSession: jest.fn(async () => null),
  listMultiAgentChatSessions: jest.fn(async () => []),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async () => ({ success: true })),
}));

import {
  getMultiAgentTeamBriefing,
  runMultiAgentTeamReview,
  getChatsMultiagente,
  getMemoriasMultiagente,
  guardarAprendizajeAgente,
  enviarAprendizajeAFiestasGeneral,
  cerrarFiestaConRetroalimentacion,
} from '@/app/actions/multiagent';
import { clearSessionCache } from '@/lib/auth/require-session';

describe('Orden 367 B3.1 — el parte del equipo no muestra plata a quien no tiene CONTABILIDAD', () => {
  beforeEach(() => {
    clearSessionCache();
  });

  it('un perfil personal (sin permisos del módulo multiagente) es rechazado en las acciones del equipo', async () => {
    mockSessionUser = { userId: 'u-pers', email: 'personal@ak.uy', role: 'user', perfil: 'personal' };

    await expect(getMultiAgentTeamBriefing()).rejects.toThrow(/no tiene acceso/i);
    await expect(runMultiAgentTeamReview()).rejects.toThrow(/no tiene acceso/i);
    await expect(getChatsMultiagente()).rejects.toThrow(/no tiene acceso/i);
    await expect(getMemoriasMultiagente()).rejects.toThrow(/no tiene acceso/i);
    await expect(
      guardarAprendizajeAgente({ agentType: 'fiesta', title: 'T', content: 'C' }),
    ).rejects.toThrow(/no tiene acceso/i);
    await expect(
      enviarAprendizajeAFiestasGeneral({ title: 'T', content: 'C' }),
    ).rejects.toThrow(/no tiene acceso/i);
    await expect(
      cerrarFiestaConRetroalimentacion({ fiestaId: 'fiesta-1' }),
    ).rejects.toThrow(/no tiene acceso/i);
  });

  it('un perfil operador (con NOCHE, sin CONTABILIDAD) no recibe cuotas vencidas ni comprobantes en el parte', async () => {
    mockSessionUser = { userId: 'u-op', email: 'operador@ak.uy', role: 'user', perfil: 'operador' };

    const res = await getMultiAgentTeamBriefing();
    expect(res.success).toBe(true);
    const items = res.data.items;

    expect(items.some((i) => i.agentType === 'contable')).toBe(false);
    expect(items.some((i) => i.id.startsWith('contable_overdue_'))).toBe(false);
    expect(items.some((i) => i.id.startsWith('contable_payment_notice_'))).toBe(false);
    expect(res.data.byAgent.contable).toHaveLength(0);
    expect(items.some((i) => i.agentType === 'fiesta' || i.agentType === 'secretaria')).toBe(true);
  });

  it('un perfil secretaria (con CONTABILIDAD) sí recibe las alertas de cuotas vencidas y comprobantes', async () => {
    mockSessionUser = { userId: 'u-sec', email: 'sec@ak.uy', role: 'user', perfil: 'secretaria' };

    const res = await getMultiAgentTeamBriefing();
    expect(res.success).toBe(true);
    const items = res.data.items;

    expect(items.some((i) => i.id === 'contable_overdue_fiesta-1')).toBe(true);
    expect(items.some((i) => i.id === 'contable_payment_notice_fiesta-1')).toBe(true);
    expect(res.data.byAgent.contable.length).toBeGreaterThanOrEqual(2);
  });
});
