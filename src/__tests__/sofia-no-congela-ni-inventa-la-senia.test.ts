jest.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: jest.fn((config) => config),
  },
  geminiModel: 'gemini-1.5-flash',
  geminiProModel: 'gemini-1.5-pro',
  getEffectiveGeminiModelForAgent: jest.fn().mockResolvedValue('gemini-1.5-pro'),
  ejecutarPromptConFallback: jest.fn().mockResolvedValue({
    output: {
      response: 'Hola!',
      action: { type: 'none' },
    },
  }),
}));

jest.mock('@/app/actions/settings', () => ({
  getBudgetDisplaySettings: jest.fn(),
}));

jest.mock('@/app/actions/armado-rapido', () => ({
  getArmadoRapidoConfig: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresaPublicos: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/menus-catering', () => ({
  getMenusPublicos: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
  registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
  anotarFalloIA: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

import { ejecutarPromptConFallback } from '@/ai/genkit';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { chatWithBudgetCopilot } from '@/app/actions/simulador-copilot';
import { readData } from '@/lib/data-service';

const mockEjecutarPromptConFallback = ejecutarPromptConFallback as jest.MockedFunction<typeof ejecutarPromptConFallback>;
const mockGetBudgetDisplaySettings = getBudgetDisplaySettings as jest.MockedFunction<typeof getBudgetDisplaySettings>;
const mockReadData = readData as jest.MockedFunction<typeof readData>;

const CONFIG_VIEJO_CON_PORCENTAJE = {
  promptPersonalidad:
    'Si te preguntan por precios altos, explicá que congelamos el precio tras la seña del 30% y pueden pagar el resto en cuotas.',
  faqs: [
    {
      pregunta: 'Reserva / Seña',
      respuesta:
        'Para reservar la fecha se requiere abonar una seña del 30% del costo total estimado del presupuesto. Además congelamos el precio.',
    },
  ],
};

describe('Sofía no congela precios ni inventa la seña del 30%', () => {
  const prevGoogleApiKey = process.env.GOOGLE_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_API_KEY = 'test-key';
    mockReadData.mockResolvedValue(CONFIG_VIEJO_CON_PORCENTAJE);
    mockEjecutarPromptConFallback.mockResolvedValue({
      output: {
        response: 'Hola!',
        action: { type: 'none' },
      },
    } as any);
  });

  afterEach(() => {
    if (prevGoogleApiKey === undefined) {
      delete process.env.GOOGLE_API_KEY;
    } else {
      process.env.GOOGLE_API_KEY = prevGoogleApiKey;
    }
  });

  it('usa el monto de seña de Ajustes ($5.000) y limpia "congelamos" y "30%" del prompt y FAQs', async () => {
    mockGetBudgetDisplaySettings.mockResolvedValue({ bookingDepositAmount: 5000 } as any);

    await chatWithBudgetCopilot({
      message: '¿Cómo reservo la fecha y cuánto es la seña?',
      history: [],
      currentState: {},
    });

    expect(mockEjecutarPromptConFallback).toHaveBeenCalledTimes(1);
    const promptInput = mockEjecutarPromptConFallback.mock.calls[0]?.[1] as {
      copilotSystemPrompt: string;
      faqsJson: string;
    };

    expect(promptInput.copilotSystemPrompt).not.toMatch(/congelamos/i);
    expect(promptInput.copilotSystemPrompt).not.toContain('30%');
    expect(promptInput.copilotSystemPrompt).toContain('$5.000');

    expect(promptInput.faqsJson).not.toMatch(/congelamos/i);
    expect(promptInput.faqsJson).not.toContain('30%');
    expect(promptInput.faqsJson).toContain('$5.000');
  });

  it('si falla getBudgetDisplaySettings, usa "una seña" sin "congelamos", "30%" ni montos inventados', async () => {
    mockGetBudgetDisplaySettings.mockRejectedValue(new Error('No se pudo leer Ajustes'));

    await chatWithBudgetCopilot({
      message: '¿Cómo reservo la fecha y cuánto es la seña?',
      history: [],
      currentState: {},
    });

    expect(mockEjecutarPromptConFallback).toHaveBeenCalledTimes(1);
    const promptInput = mockEjecutarPromptConFallback.mock.calls[0]?.[1] as {
      copilotSystemPrompt: string;
      faqsJson: string;
    };

    expect(promptInput.copilotSystemPrompt).not.toMatch(/congelamos/i);
    expect(promptInput.copilotSystemPrompt).not.toContain('30%');
    expect(promptInput.copilotSystemPrompt).not.toMatch(/\$\s*\d/);
    expect(promptInput.copilotSystemPrompt).toContain('una seña');

    expect(promptInput.faqsJson).not.toMatch(/congelamos/i);
    expect(promptInput.faqsJson).not.toContain('30%');
    expect(promptInput.faqsJson).not.toMatch(/\$\s*\d/);
    expect(promptInput.faqsJson).toContain('una seña');
  });
});
