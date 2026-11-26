/**
 * @jest-environment node
 */
jest.mock('server-only', () => ({}), { virtual: true });

const mockHayPresupuestoParaIA = jest.fn();
const mockReservarConsumoIA = jest.fn();

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: (...args: any[]) => mockHayPresupuestoParaIA(...args),
  reservarConsumoIA: (...args: any[]) => mockReservarConsumoIA(...args),
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

import { checkImageSafety } from '@/lib/social-fiesta/content-safety-ai';

describe('Orden 371 B2: la revisión automática de fotos pasa por el tope de IA', () => {
  const prevLocal = process.env.AK_USE_LOCAL_JSON_ONLY;
  const prevKey = process.env.GOOGLE_VISION_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    process.env.GOOGLE_VISION_API_KEY = 'vision-test-key';
  });

  afterAll(() => {
    if (prevLocal === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = prevLocal;
    if (prevKey === undefined) delete process.env.GOOGLE_VISION_API_KEY;
    else process.env.GOOGLE_VISION_API_KEY = prevKey;
    global.fetch = originalFetch;
  });

  it('con el tope agotado, no llama a Google Vision y deja la foto pendiente (reason: error)', async () => {
    mockHayPresupuestoParaIA.mockResolvedValue(true);
    mockReservarConsumoIA.mockResolvedValue(null);
    const fetchMock = jest.fn();
    global.fetch = fetchMock as any;

    const res = await checkImageSafety(Buffer.from('fake-jpg'));

    expect(mockReservarConsumoIA).toHaveBeenCalledWith('revision-fotos');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(res).toEqual({ safe: true, reason: 'error' });
  });

  it('si hayPresupuestoParaIA devuelve false, tampoco llama a Google Vision', async () => {
    mockHayPresupuestoParaIA.mockResolvedValue(false);
    const fetchMock = jest.fn();
    global.fetch = fetchMock as any;

    const res = await checkImageSafety(Buffer.from('fake-jpg'));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(res).toEqual({ safe: true, reason: 'error' });
  });

  it('si Vision devuelve 429 libera la reserva y si responde limpia devuelve reason: clean', async () => {
    const liberar = jest.fn(async () => undefined);
    mockHayPresupuestoParaIA.mockResolvedValue(true);
    mockReservarConsumoIA.mockResolvedValue({ liberar });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'quota exceeded',
    }) as any;

    const res429 = await checkImageSafety(Buffer.from('fake-jpg'));
    expect(res429).toEqual({ safe: true, reason: 'error' });
    expect(liberar).toHaveBeenCalledTimes(1);

    mockReservarConsumoIA.mockResolvedValue({ liberar: jest.fn(async () => undefined) });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        responses: [
          {
            safeSearchAnnotation: {
              adult: 'VERY_UNLIKELY',
              violence: 'VERY_UNLIKELY',
              racy: 'UNLIKELY',
              spoof: 'VERY_UNLIKELY',
              medical: 'VERY_UNLIKELY',
            },
          },
        ],
      }),
    }) as any;

    const resClean = await checkImageSafety(Buffer.from('fake-jpg'));
    expect(resClean).toEqual({ safe: true, reason: 'clean' });
  });
});
