jest.mock('server-only', () => ({}));

jest.mock('next/server', () => ({
  NextResponse: class MockNextResponse {
    _body: any;
    status: number;

    constructor(body: any, init?: { status?: number }) {
      this._body = body;
      this.status = init?.status ?? 200;
    }

    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
    }

    static json(data: any, init?: { status?: number }) {
      return new MockNextResponse(data, { status: init?.status ?? 200 });
    }
  },
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: { userId: 'usuario-equipo-1', role: 'admin' },
  }),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/multiagent', () => ({
  sendPersistentMultiAgentMessage: jest.fn(),
}));

jest.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: jest.fn().mockImplementation((config) => config),
    defineFlow: jest.fn().mockImplementation((config, fn) => fn),
  },
  ejecutarPromptConFallback: jest.fn(),
  geminiModel: 'gemini-1.5-flash',
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(),
  registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
}));

import { POST } from '@/app/api/multiagent/message/route';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { sendPersistentMultiAgentMessage } from '@/app/actions/multiagent';
import { ejecutarPromptConFallback } from '@/ai/genkit';

const mockHayPresupuestoParaIA = hayPresupuestoParaIA as jest.MockedFunction<typeof hayPresupuestoParaIA>;
const mockSendPersistentMultiAgentMessage = sendPersistentMultiAgentMessage as jest.MockedFunction<typeof sendPersistentMultiAgentMessage>;
const mockEjecutarPromptConFallback = ejecutarPromptConFallback as jest.MockedFunction<typeof ejecutarPromptConFallback>;
const mockRegistrarConsumoIA = registrarConsumoIA as jest.MockedFunction<typeof registrarConsumoIA>;

function mockRequest(body: Record<string, unknown> = { message: 'Hola asistente' }) {
  const headers = new Map<string, string>();
  headers.set('content-length', '100');
  return {
    headers: {
      get: (key: string) => headers.get(key.toLowerCase()) || null,
    },
    json: jest.fn().mockResolvedValue(body),
  } as any;
}

describe('Orden 294 — El asistente frena antes de gastar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Endpoint de multiagente (/api/multiagent/message)', () => {
    it('devuelve el aviso y no llama a la IA si se superó el tope mensual', async () => {
      mockHayPresupuestoParaIA.mockResolvedValue(false);

      const req = mockRequest({ message: 'Organizar la fiesta de fin de año' });
      const res = await POST(req);
      const data = await res.json();

      expect(data).toEqual({
        success: false,
        response: 'Se llegó al tope de gasto de inteligencia artificial de este mes',
        message: 'Se llegó al tope de gasto de inteligencia artificial de este mes',
        error: 'Se llegó al tope de gasto de inteligencia artificial de este mes',
      });

      expect(mockSendPersistentMultiAgentMessage).not.toHaveBeenCalled();
      expect(mockRegistrarConsumoIA).not.toHaveBeenCalled();
    });
  });

  describe('Lectura de comprobantes (extractReceiptData)', () => {
    it('lanza el error de tope de gasto y no ejecuta la IA si no hay presupuesto', async () => {
      mockHayPresupuestoParaIA.mockResolvedValue(false);

      await expect(
        extractReceiptData({
          receiptDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        })
      ).rejects.toThrow('Se llegó al tope de gasto de inteligencia artificial de este mes');

      expect(mockEjecutarPromptConFallback).not.toHaveBeenCalled();
      expect(mockRegistrarConsumoIA).not.toHaveBeenCalled();
    });
  });
});
