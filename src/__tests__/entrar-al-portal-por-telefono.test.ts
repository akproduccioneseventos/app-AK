import { entrarAlPortalPorTelefono } from '@/app/actions/fiesta/portal.actions';
import { readData } from '@/lib/data-service';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { getFiestaByIdRaw } from '@/lib/fiesta/get-fiesta-raw';
import { setPortalSessionCookie } from '@/lib/security/portal-session';

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

// Las fiestas se leen con el lector de la app; acá sale de la misma lista de mentira.
jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => require('@/lib/data-service').readData('fiestas.json', [])),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => true),
  setPortalSessionCookie: jest.fn(async () => undefined),
  createPortalSession: jest.fn(() => 'mock-token'),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(),
  preserveFiestaSecrets: jest.fn((_id, data) => data),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
  headers: jest.fn(async () => new Map()),
}));

describe('entrarAlPortalPorTelefono', () => {
  const mockReadData = readData as jest.MockedFunction<typeof readData>;
  const mockEnforceRateLimit = enforcePublicRateLimit as jest.MockedFunction<typeof enforcePublicRateLimit>;
  const mockGetFiestaRaw = getFiestaByIdRaw as jest.MockedFunction<typeof getFiestaByIdRaw>;
  const mockSetCookie = setPortalSessionCookie as jest.MockedFunction<typeof setPortalSessionCookie>;

  const fiestaValida = {
    id: 'fiesta_123',
    estado: 'confirmada',
    status: 'activa',
    configuracion: {
      nombreEvento: 'Mis 15 Sofía',
      clienteId: 'cliente_1',
      telefono: '099123456',
    },
    clientPortalSettings: {
      enabled: true,
      accessKey: 'clave-secreta',
    },
  };

  const clienteValido = {
    id: 'cliente_1',
    name: 'Sofía',
    phone: '099 123 456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnforceRateLimit.mockResolvedValue(undefined);
    mockReadData.mockImplementation(async (file: string) => {
      if (file === 'fiestas.json') return [fiestaValida] as any;
      if (file === 'customers.json') return [clienteValido] as any;
      return [] as any;
    });
    mockGetFiestaRaw.mockResolvedValue(fiestaValida as any);
  });

  it('(a) Celular y clave correctos: entra y llama a initializePortalSession', async () => {
    const res = await entrarAlPortalPorTelefono('099 123 456', 'clave-secreta');

    expect(res.success).toBe(true);
    expect(res.fiestaId).toBe('fiesta_123');
    expect(mockSetCookie).toHaveBeenCalledWith('fiesta_123', 'clave-secreta');
  });

  it('(b) Clave mala: devuelve el mismo mensaje que celular inexistente', async () => {
    const resClaveMala = await entrarAlPortalPorTelefono('099123456', 'clave-erronea');
    const resCelularInexistente = await entrarAlPortalPorTelefono('098765432', 'clave-secreta');

    expect(resClaveMala.success).toBe(false);
    expect(resCelularInexistente.success).toBe(false);
    expect(resClaveMala.error).toBe('No encontramos una fiesta con esos datos');
    expect(resClaveMala.error).toBe(resCelularInexistente.error);
  });

  it('(c) Sexto intento en 15 minutos: rechazado antes de buscar', async () => {
    mockEnforceRateLimit.mockRejectedValueOnce(new Error('Demasiados intentos. Espera unos minutos y vuelve a probar.'));

    const res = await entrarAlPortalPorTelefono('099123456', 'clave-secreta');

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Demasiados intentos/i);
    expect(mockReadData).not.toHaveBeenCalled();
  });

  it('(d) Una fiesta cerrada no entra', async () => {
    const fiestaCerrada = {
      ...fiestaValida,
      id: 'fiesta_cerrada',
      estado: 'cerrada',
    };

    mockReadData.mockImplementation(async (file: string) => {
      if (file === 'fiestas.json') return [fiestaCerrada] as any;
      if (file === 'customers.json') return [clienteValido] as any;
      return [] as any;
    });

    const res = await entrarAlPortalPorTelefono('099123456', 'clave-secreta');

    expect(res.success).toBe(false);
    expect(res.error).toBe('No encontramos una fiesta con esos datos');
  });
});
