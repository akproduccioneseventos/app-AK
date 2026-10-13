const preferenceStore: Record<string, unknown> = {};
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, defaultValue: unknown) => preferenceStore[file] ?? defaultValue),
  writeData: jest.fn(async (file: string, value: unknown) => { preferenceStore[file] = value; }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
  hasAppSession: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: { userId: 'smart-automations-test', role: 'admin' },
  }),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn().mockResolvedValue([]),
  getFiestas: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: jest.fn().mockResolvedValue([]) }));
jest.mock('@/app/actions/crm', () => ({ getCrmLeads: jest.fn().mockResolvedValue([]) }));

jest.mock('@/lib/multiagent/memory-store', () => ({
  saveAgentLearning: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/firebase/firestore', () => ({
  COLLECTIONS: { NOTIFICACIONES: 'notificaciones' },
  getAllDocuments: jest.fn().mockResolvedValue({ success: true, data: [] }),
  createDocument: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/firebase/server-messaging', () => ({
  sendPushNotificationToAll: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/notifications', () => {
  const actual = jest.requireActual('@/app/actions/notifications');
  return { ...actual, getNotifications: jest.fn(() => actual.getNotifications()) };
});

import { runSmartAutomations } from '@/app/actions/smart-automations';
import { guardarPreferenciasUsuario } from '@/lib/notifications/preferencias-avisos';
import { getAllDocuments } from '@/lib/firebase/firestore';
import { initialNotificationPreferences } from '@/types/preferencias-avisos';

describe('runSmartAutomations notification creation count', () => {
  const preferences = { ...initialNotificationPreferences };

  beforeEach(async () => {
    jest.clearAllMocks();
    await guardarPreferenciasUsuario('admin', preferences);
    (getAllDocuments as jest.Mock).mockResolvedValue({ success: true, data: [] });
  });

  it('does not count a notification silenced by the real preference check', async () => {
    await guardarPreferenciasUsuario('admin', {
      ...preferences,
      crmUpdates: { email: false, app: false },
    });
    const timestamp = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { getPresupuestos } = require('@/app/actions/presupuestos');
    getPresupuestos.mockResolvedValue([{
      id: 'budget-silenced', estado: 'Enviado', timestamp, clienteNombre: 'Test',
    }]);

    const result = await runSmartAutomations();

    expect(result.results).toHaveLength(1);
    expect(result.results[0].created).toBe(false);
    expect(result.created).toBe(0);
  });

  it('counts only a newly persisted notification, not a duplicate', async () => {
    await guardarPreferenciasUsuario('admin', {
      ...preferences,
      crmUpdates: { email: false, app: true },
    });
    const timestamp = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { getPresupuestos } = require('@/app/actions/presupuestos');
    getPresupuestos.mockResolvedValue([{
      id: 'budget-new', estado: 'Enviado', timestamp, clienteNombre: 'Test',
    }]);

    const created = await runSmartAutomations();
    expect(created.results[0].created).toBe(true);
    expect(created.created).toBe(1);

    expect(getAllDocuments).toHaveBeenCalled();
    expect(require('@/lib/firebase/firestore').createDocument).toHaveBeenCalledTimes(1);
  });

  it('propagates a direct notification-list action rejection instead of treating it as empty', async () => {
    const timestamp = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { getPresupuestos } = require('@/app/actions/presupuestos');
    getPresupuestos.mockResolvedValue([{
      id: 'budget-read-failure', estado: 'Enviado', timestamp, clienteNombre: 'Test',
    }]);
    const { getNotifications } = jest.requireMock('@/app/actions/notifications');
    getNotifications.mockRejectedValueOnce(new Error('transport failure'));

    await expect(runSmartAutomations()).rejects.toThrow('transport failure');
    expect(getNotifications).toHaveBeenCalledTimes(1);
  });
});
