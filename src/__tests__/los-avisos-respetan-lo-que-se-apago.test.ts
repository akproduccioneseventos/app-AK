const mockRequireAppSession = jest.fn();
const mockHasAppSession = jest.fn().mockResolvedValue(true);
const mockVerifySession = jest.fn();
const mockReadData = jest.fn();
const mockWriteData = jest.fn();
const mockSendGoogleGmailMessage = jest.fn();
const mockCreateDocument = jest.fn();
const mockGetAllDocuments = jest.fn();

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: () => mockRequireAppSession(),
  hasAppSession: () => mockHasAppSession(),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: () => mockVerifySession(),
}));

jest.mock('@/lib/data-service', () => ({
  readData: (...args: unknown[]) => mockReadData(...args),
  writeData: (...args: unknown[]) => mockWriteData(...args),
}));

jest.mock('@/lib/firebase/firestore', () => ({
  createDocument: (...args: unknown[]) => mockCreateDocument(...args),
  getAllDocuments: (...args: unknown[]) => mockGetAllDocuments(...args),
  updateDocument: jest.fn().mockResolvedValue({ success: true }),
  deleteDocument: jest.fn().mockResolvedValue({ success: true }),
  batchWrite: jest.fn().mockResolvedValue({ success: true }),
  COLLECTIONS: {
    NOTIFICACIONES: 'notificaciones',
  },
}));

jest.mock('@/lib/firebase/server-messaging', () => ({
  sendPushNotificationToAll: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/google-workspace', () => ({
  sendGoogleGmailMessage: (...args: unknown[]) => mockSendGoogleGmailMessage(...args),
  ensureFreshGoogleAccount: jest.fn(async (acc: any) => acc),
}));

import { createNotification } from '@/app/actions/notifications';
import {
  leerPreferenciasDeAvisos,
  guardarPreferenciasDeAvisos,
  debeEnviarAviso,
  enviarAviso,
  enviarAvisoConPreferencia,
} from '@/app/actions/preferencias-avisos';
import {
  initialNotificationPreferences,
  type NotificationPreferences,
} from '@/types/preferencias-avisos';

describe('Orden 56 — Los avisos respetan lo que se apagó', () => {
  let memoryStore: Record<string, any> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    memoryStore = {};

    mockRequireAppSession.mockResolvedValue({ user: { id: 'admin', role: 'admin' } });
    mockHasAppSession.mockResolvedValue(true);
    mockVerifySession.mockResolvedValue({
      user: { userId: 'admin', role: 'admin' },
      role: 'admin',
    });

    mockReadData.mockImplementation(async (file: string, fallback: unknown) => {
      return memoryStore[file] !== undefined ? memoryStore[file] : fallback;
    });

    mockWriteData.mockImplementation(async (file: string, data: unknown) => {
      memoryStore[file] = data;
    });

    mockCreateDocument.mockResolvedValue({
      success: true,
      id: 'notif-123',
    });

    mockGetAllDocuments.mockResolvedValue({
      success: true,
      data: [],
    });

    mockSendGoogleGmailMessage.mockResolvedValue({ success: true, messageId: 'msg-456' });
    memoryStore['google-accounts.json'] = [
      { id: 'company-1', kind: 'company', status: 'connected', accessToken: 'mock-valid-token' },
    ];
  });

  it('exige sesión al leer y al guardar preferencias', async () => {
    await leerPreferenciasDeAvisos();
    expect(mockRequireAppSession).toHaveBeenCalled();

    await guardarPreferenciasDeAvisos(initialNotificationPreferences);
    expect(mockRequireAppSession).toHaveBeenCalledTimes(2);
  });

  it('devuelve las preferencias iniciales si el usuario aún no guardó ninguna', async () => {
    const res = await leerPreferenciasDeAvisos();
    expect(res.success).toBe(true);
    expect(res.preferences).toEqual(initialNotificationPreferences);
  });

  it('persiste y lee las preferencias del usuario en el servidor', async () => {
    const customPrefs: NotificationPreferences = {
      ...initialNotificationPreferences,
      crmUpdates: { email: false, app: false },
      eventReminders: { email: false, app: true },
    };

    const saveRes = await guardarPreferenciasDeAvisos(customPrefs);
    expect(saveRes.success).toBe(true);

    const readRes = await leerPreferenciasDeAvisos();
    expect(readRes.success).toBe(true);
    expect(readRes.preferences?.crmUpdates.email).toBe(false);
    expect(readRes.preferences?.crmUpdates.app).toBe(false);
    expect(readRes.preferences?.eventReminders.email).toBe(false);
  });

  it('NO manda un aviso por email si la persona apagó esa categoría', async () => {
    await guardarPreferenciasDeAvisos({
      ...initialNotificationPreferences,
      crmUpdates: { email: false, app: true },
    });

    const envio = await enviarAviso({
      categoria: 'crmUpdates',
      canal: 'email',
      mensaje: 'Nuevo prospecto asignado',
      titulo: 'Nuevo Lead',
      destinatarioEmail: 'cliente@example.com',
    });

    expect(envio.enviado).toBe(false);
    expect(envio.motivo).toMatch(/desactivados|desactivado/i);
    expect(mockSendGoogleGmailMessage).not.toHaveBeenCalled();
  });

  it('SÍ manda el aviso por email cuando la categoría está encendida', async () => {
    await guardarPreferenciasDeAvisos({
      ...initialNotificationPreferences,
      eventReminders: { email: true, app: true },
    });

    const envio = await enviarAviso({
      categoria: 'eventReminders',
      canal: 'email',
      mensaje: 'Recordatorio de tu fiesta',
      titulo: 'Recordatorio',
      destinatarioEmail: 'organizador@example.com',
    });

    expect(envio.enviado).toBe(true);
    expect(mockSendGoogleGmailMessage).toHaveBeenCalled();
  });

  it('createNotification (punto único central de los 29 lugares) NO persiste ni despacha si la categoría está apagada', async () => {
    // Apagamos los avisos de la app para tareas
    await guardarPreferenciasDeAvisos({
      ...initialNotificationPreferences,
      taskUpdates: { email: true, app: false },
    });

    // Llamamos a createNotification directamente
    const res = await createNotification({
      titulo: 'Tarea pendiente',
      mensaje: 'Falta confirmar catering de la fiesta',
    });

    expect(res.success).toBe(true);
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  it('createNotification SÍ persiste y despacha si la categoría está encendida', async () => {
    await guardarPreferenciasDeAvisos({
      ...initialNotificationPreferences,
      systemAlerts: { email: false, app: true },
    });

    const res = await createNotification({
      titulo: 'Alerta del sistema',
      mensaje: 'Mantenimiento del servidor',
    });

    expect(res.success).toBe(true);
    expect(mockCreateDocument).toHaveBeenCalled();
  });

  it('createNotification respeta la categoría explícita pasada en los datos', async () => {
    await guardarPreferenciasDeAvisos({
      ...initialNotificationPreferences,
      crmUpdates: { email: false, app: false },
    });

    const res = await createNotification({
      titulo: 'Aviso especial',
      mensaje: 'Mensaje especial',
      categoria: 'crmUpdates',
    } as any);

    expect(res.success).toBe(true);
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  it('informa fallo de forma transparente si no hay cuenta de Google conectada para enviar correos', async () => {
    memoryStore['google-accounts.json'] = [];
    await guardarPreferenciasDeAvisos({
      ...initialNotificationPreferences,
      eventReminders: { email: true, app: true },
    });

    const envio = await enviarAviso({
      categoria: 'eventReminders',
      canal: 'email',
      mensaje: 'Recordatorio sin cuenta conectada',
      destinatarioEmail: 'organizador@example.com',
    });

    expect(envio.enviado).toBe(false);
    expect(envio.success).toBe(false);
    expect(envio.error || envio.motivo).toMatch(/no hay ninguna cuenta|no conectada/i);
    expect(mockSendGoogleGmailMessage).not.toHaveBeenCalled();
  });
});
