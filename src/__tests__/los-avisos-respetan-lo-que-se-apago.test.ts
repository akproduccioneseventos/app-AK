const mockRequireAppSession = jest.fn();
const mockVerifySession = jest.fn();
const mockReadData = jest.fn();
const mockWriteData = jest.fn();
const mockCreateNotification = jest.fn();
const mockSendGoogleGmailMessage = jest.fn();

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: () => mockRequireAppSession(),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: () => mockVerifySession(),
}));

jest.mock('@/lib/data-service', () => ({
  readData: (...args: unknown[]) => mockReadData(...args),
  writeData: (...args: unknown[]) => mockWriteData(...args),
}));

jest.mock('@/app/actions/notifications', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}));

jest.mock('@/lib/google-workspace', () => ({
  sendGoogleGmailMessage: (...args: unknown[]) => mockSendGoogleGmailMessage(...args),
}));

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

    mockCreateNotification.mockResolvedValue({
      success: true,
      notification: { id: 'notif-123', mensaje: 'Prueba', fecha: new Date().toISOString(), leida: false },
    });

    mockSendGoogleGmailMessage.mockResolvedValue({ success: true, messageId: 'msg-456' });
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

  it('NO crea notificación en app si el usuario apagó los avisos de la app', async () => {
    await guardarPreferenciasDeAvisos({
      ...initialNotificationPreferences,
      taskUpdates: { email: true, app: false },
    });

    const res = await enviarAvisoConPreferencia({
      categoria: 'taskUpdates',
      canal: 'app',
      notificacion: {
        mensaje: 'Tarea completada',
      },
    });

    expect(res.enviado).toBe(false);
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it('SÍ crea notificación en app si el usuario tiene encendida la categoría', async () => {
    await guardarPreferenciasDeAvisos({
      ...initialNotificationPreferences,
      systemAlerts: { email: false, app: true },
    });

    const res = await enviarAvisoConPreferencia({
      categoria: 'systemAlerts',
      canal: 'app',
      notificacion: {
        mensaje: 'Alerta de mantenimiento',
      },
    });

    expect(res.enviado).toBe(true);
    expect(mockCreateNotification).toHaveBeenCalled();
  });
});
