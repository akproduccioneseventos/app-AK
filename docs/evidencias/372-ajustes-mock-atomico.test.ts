let mockAtomicAvailable = false;
const mockPermiso = jest.fn();
const mockMutarDocumento = jest.fn(async (_file: string, empty: any, callback: (value: any) => any) => callback(empty));
jest.mock('@/lib/auth/require-session', () => ({ requirePermiso: (...args: any[]) => mockPermiso(...args) }));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn() }));
jest.mock('@/lib/asistente/propuestas-service', () => ({}));
jest.mock('@/lib/generic-json-store', () => ({
  get mutarDocumento() { return mockAtomicAvailable ? mockMutarDocumento : undefined; },
}));
jest.mock('@/lib/data-service', () => ({ readData: jest.fn(async (_file: string, value: any) => value), writeData: jest.fn() }));
jest.mock('@/lib/firebase/server-messaging', () => ({ sendPushNotificationToAll: jest.fn() }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: jest.fn() }));
import { saveSettingsAsistenteAction } from '@/app/actions/asistente-proactivo.actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockAtomicAvailable = false;
  mockPermiso.mockResolvedValue({ ok: true, user: { perfil: 'dueno' } });
});
test('372 diagnostico: export atomico ausente reproduce false sin culpar permisos', async () => {
  const result = await saveSettingsAsistenteAction({ horaResumenDiario: '08:30' });
  expect(result.success).toBe(false);
  expect(result.error).toMatch(/mutarDocumento|function/i);
  expect(mockPermiso).toHaveBeenCalledTimes(1);
  expect(mockMutarDocumento).not.toHaveBeenCalled();
});
test('372 diagnostico: consumidor real guarda con contrato atomico disponible', async () => {
  mockAtomicAvailable = true;
  const result = await saveSettingsAsistenteAction({ horaResumenDiario: '08:30' });
  expect(result.success).toBe(true);
  expect(result.settings?.horaResumenDiario).toBe('08:30');
  expect(mockMutarDocumento).toHaveBeenCalledTimes(1);
});
test('372 control: guard denegado no toca almacenamiento', async () => {
  mockAtomicAvailable = true;
  mockPermiso.mockResolvedValue({ ok: false, error: 'QA372_NO_PERMISSION' });
  const result = await saveSettingsAsistenteAction({ horaResumenDiario: '08:30' });
  expect(result).toEqual({ success: false, error: 'QA372_NO_PERMISSION' });
  expect(mockMutarDocumento).not.toHaveBeenCalled();
});
