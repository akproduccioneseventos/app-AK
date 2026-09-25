import { sendScheduledMessageByEmail } from '@/app/actions/scheduled-messages';
import * as requireSessionModule from '@/lib/auth/require-session';
import * as googleWorkspaceModule from '@/lib/google-workspace';
import * as dataServiceModule from '@/lib/data-service';

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: { email: 'operador@ak.com' } }),
}));

jest.mock('@/lib/google-workspace', () => ({
  sendGoogleGmailMessage: jest.fn(),
  ensureFreshGoogleAccount: jest.fn(),
  hasServiceAccountKey: jest.fn().mockReturnValue(false),
  getServiceAccountAccessToken: jest.fn().mockResolvedValue(null),
  GOOGLE_WORKSPACE_SCOPES: [],
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn().mockResolvedValue(undefined),
  createDataItem: jest.fn(),
  mutateDataItem: jest.fn(),
}));

describe('Orden 86 Bloque 3: Enviar mensajes de outbox por mail', () => {
  const dummyMessage = {
    id: 'msg_123',
    targetName: 'María García',
    targetPhone: '099123456',
    targetEmail: 'maria@gmail.com',
    subject: 'Tu fiesta de 15 años',
    templateType: 'recordatorio_reunion',
    messageText: 'Hola María, te esperamos este viernes para coordinar los detalles.',
    scheduledAt: '2026-09-25T15:00:00.000Z',
    status: 'pendiente',
    createdAt: '2026-09-25T10:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sin sesión del equipo no manda nada y arroja error', async () => {
    (requireSessionModule.requireAppSession as jest.Mock).mockRejectedValueOnce(
      new Error('Sesion no autorizada.')
    );

    await expect(sendScheduledMessageByEmail('msg_123')).rejects.toThrow('Sesion no autorizada.');
    expect(googleWorkspaceModule.sendGoogleGmailMessage).not.toHaveBeenCalled();
  });

  it('con sesión y sin cuenta de Google, devuelve aviso de conectar Google y no manda', async () => {
    (requireSessionModule.requireAppSession as jest.Mock).mockResolvedValueOnce(undefined);
    (dataServiceModule.readData as jest.Mock).mockImplementation((file: string) => {
      if (file.includes('scheduled-messages')) return Promise.resolve([dummyMessage]);
      if (file.includes('google-workspace-accounts')) return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const result = await sendScheduledMessageByEmail('msg_123');

    expect(result.success).toBe(false);
    expect(result.notice).toContain('Conectá Google en Ajustes');
    expect(googleWorkspaceModule.sendGoogleGmailMessage).not.toHaveBeenCalled();
  });

  it('con cuenta de Google conectada, llama a sendGoogleGmailMessage y marca como enviado', async () => {
    (requireSessionModule.requireAppSession as jest.Mock).mockResolvedValueOnce(undefined);

    const connectedAccount = {
      id: 'company',
      kind: 'company',
      email: 'akproduccionessalto@gmail.com',
      accessToken: 'ya29.mock_token',
      status: 'connected',
    };

    (dataServiceModule.readData as jest.Mock).mockImplementation((file: string) => {
      if (file.includes('scheduled-messages')) return Promise.resolve([dummyMessage]);
      if (file.includes('google-workspace-accounts')) return Promise.resolve([connectedAccount]);
      return Promise.resolve([]);
    });

    (googleWorkspaceModule.ensureFreshGoogleAccount as jest.Mock).mockResolvedValueOnce(connectedAccount);
    (googleWorkspaceModule.sendGoogleGmailMessage as jest.Mock).mockResolvedValueOnce({ id: 'gmail_msg_999' });

    const result = await sendScheduledMessageByEmail('msg_123');

    expect(result.success).toBe(true);
    expect(googleWorkspaceModule.sendGoogleGmailMessage).toHaveBeenCalledTimes(1);
    expect(googleWorkspaceModule.sendGoogleGmailMessage).toHaveBeenCalledWith(
      connectedAccount,
      'maria@gmail.com',
      'Tu fiesta de 15 años',
      expect.stringContaining('Hola María, te esperamos este viernes')
    );
  });
});
