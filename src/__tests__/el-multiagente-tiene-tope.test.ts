jest.mock('next/server', () => ({
  NextResponse: class MockNextResponse {
    _body: any;
    status: number;

    constructor(body: any, init?: { status?: number }) {
      this._body = body;
      this.status = init?.status ?? 200;
    }

    async json() {
      return JSON.parse(typeof this._body === 'string' ? this._body : String(this._body));
    }

    static json(data: any, init?: { status?: number }) {
      return new MockNextResponse(JSON.stringify(data), { status: init?.status ?? 200 });
    }
  },
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  registrarConsumoIA: jest.fn(),
}));

jest.mock('@/app/actions/multiagent', () => ({
  sendPersistentMultiAgentMessage: jest.fn(),
}));

import { POST } from '@/app/api/multiagent/message/route';
import { verifySession } from '@/lib/auth/session-token';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { sendPersistentMultiAgentMessage } from '@/app/actions/multiagent';

const mockVerifySession = verifySession as jest.MockedFunction<typeof verifySession>;
const mockEnforceRateLimit = enforcePublicRateLimit as jest.MockedFunction<typeof enforcePublicRateLimit>;
const mockRegistrarConsumoIA = registrarConsumoIA as jest.MockedFunction<typeof registrarConsumoIA>;
const mockSendPersistentMessage = sendPersistentMultiAgentMessage as jest.MockedFunction<typeof sendPersistentMultiAgentMessage>;

function mockRequest(options: {
  contentLength?: string | number;
  body?: any;
  jsonSpy?: jest.Mock;
}) {
  const jsonSpy = options.jsonSpy || jest.fn().mockResolvedValue(options.body ?? { message: 'Hola' });
  const headers = new Map<string, string>();
  if (options.contentLength !== undefined) {
    headers.set('content-length', String(options.contentLength));
  }
  return {
    headers: {
      get: (key: string) => headers.get(key.toLowerCase()) || null,
    },
    json: jsonSpy,
  } as any;
}

describe('el asistente del equipo (multiagente) con tope por persona', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifySession.mockResolvedValue({
      success: true,
      user: { userId: 'usuario-equipo-42', email: 'equipo@akproducciones.uy', role: 'admin' },
    } as any);
    mockEnforceRateLimit.mockResolvedValue(undefined);
    mockRegistrarConsumoIA.mockResolvedValue(undefined);
    mockSendPersistentMessage.mockResolvedValue({
      success: true,
      response: 'Respuesta del Multiagente',
      sessionId: 'ses_123',
    } as any);
  });

  it('un pedido con content-length de 8 MB devuelve 413 sin llamar a request.json', async () => {
    const jsonSpy = jest.fn();
    const req = mockRequest({
      contentLength: 8 * 1024 * 1024, // 8 MB
      jsonSpy,
    });

    const res = await POST(req);
    expect(res.status).toBe(413);

    const body = await res.json();
    expect(body.error).toBe('La imagen es demasiado grande. Probá con una foto más chica.');
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(mockSendPersistentMessage).not.toHaveBeenCalled();
    expect(mockRegistrarConsumoIA).not.toHaveBeenCalled();
  });

  it('la consulta 61 de la misma persona dentro de la hora devuelve 429 y no llama a la IA', async () => {
    mockEnforceRateLimit.mockRejectedValueOnce(
      new Error('Demasiados intentos. Espera unos minutos y vuelve a probar.')
    );

    const jsonSpy = jest.fn().mockResolvedValue({ message: 'Hola asistente' });
    const req = mockRequest({
      contentLength: '150',
      jsonSpy,
    });

    const res = await POST(req);
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error).toBe('Hiciste muchas consultas seguidas. Esperá unos minutos y probá de nuevo.');
    expect(mockEnforceRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'multiagente',
        identity: 'usuario-equipo-42',
        limit: 60,
        windowMs: 3_600_000,
        ignoreClientAddress: true,
      })
    );
    expect(mockSendPersistentMessage).not.toHaveBeenCalled();
    expect(mockRegistrarConsumoIA).not.toHaveBeenCalled();
  });

  it('una consulta que sale bien llama registrarConsumoIA(\'multiagente\') una vez', async () => {
    const req = mockRequest({
      contentLength: '120',
      body: { message: 'Consulta válida' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockSendPersistentMessage).toHaveBeenCalledTimes(1);
    expect(mockRegistrarConsumoIA).toHaveBeenCalledTimes(1);
    expect(mockRegistrarConsumoIA).toHaveBeenCalledWith('multiagente');
  });
});
