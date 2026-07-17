const mockReadData = jest.fn();
const mockWriteData = jest.fn();
const mockSendGoogleGmailMessage = jest.fn();
const mockGetFiestaById = jest.fn();

jest.mock('@/lib/data-service', () => ({
  readData: (...args: unknown[]) => mockReadData(...args),
  writeData: (...args: unknown[]) => mockWriteData(...args),
}));

jest.mock('@/lib/google-workspace', () => ({
  buildGoogleCalendarTemplateUrl: jest.fn(() => 'https://calendar.example/event'),
  ensureFreshGoogleAccount: jest.fn(async (account) => account),
  getFiestaTimes: jest.fn(() => ({ safeStart: new Date(), end: new Date() })),
  getFiestaTitle: jest.fn(() => 'Fiesta de prueba'),
  sendGoogleGmailMessage: (...args: unknown[]) => mockSendGoogleGmailMessage(...args),
  upsertGoogleCalendarEvent: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: (...args: unknown[]) => mockGetFiestaById(...args),
  getFiestas: jest.fn(async () => []),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(async () => null),
}));

import { notifyGuestsWithCalendarLinks } from '@/app/actions/google-workspace-extended';

describe('Google Workspace email delivery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadData.mockImplementation(async (filename: string, fallback: unknown) => {
      if (filename.includes('accounts')) {
        return [{
          id: 'company-1',
          kind: 'company',
          email: 'akproduccionessalto@gmail.com',
          status: 'connected',
          accessToken: 'fresh-token',
        }];
      }
      return fallback;
    });
    mockWriteData.mockResolvedValue(undefined);
    mockGetFiestaById.mockResolvedValue({
      id: 'fiesta-1',
      configuracion: { nombreEvento: 'Fiesta de prueba', fechaEvento: '2026-12-20' },
      invitados: [{ id: 'guest-1', nombre: 'Invitado', contacto: 'invitado@example.com' }],
    });
  });

  it('does not count or persist a failed Gmail send as delivered', async () => {
    mockSendGoogleGmailMessage.mockRejectedValue(new Error('Gmail API unavailable'));

    const result = await notifyGuestsWithCalendarLinks('fiesta-1');
    const syncWrite = mockWriteData.mock.calls.find(([filename]) => String(filename).includes('sync'));
    const writtenRecords = syncWrite?.[1] as Array<{ lastEmailAtByGuest?: Record<string, string> }>;

    expect(result.sent).toBe(0);
    expect(result.warnings).toContain('Gmail API unavailable');
    expect(writtenRecords[0]?.lastEmailAtByGuest?.['guest-1']).toBeUndefined();
  });
});
