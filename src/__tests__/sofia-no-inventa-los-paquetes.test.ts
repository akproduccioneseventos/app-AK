jest.mock('genkit', () => {
  const { z } = require('zod');
  return {
    z,
    genkit: jest.fn(() => ({
      generate: jest.fn(),
      defineFlow: jest.fn(),
      definePrompt: jest.fn(() => jest.fn()),
    })),
  };
});

const mockEjecutarPromptConFallback = jest.fn();

jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(),
    definePrompt: jest.fn(() => jest.fn()),
  },
  generateWithGeminiFallback: jest.fn(),
  getGeminiModelForAgent: jest.fn().mockReturnValue('mock-model'),
  getGeminiGenerationConfigForAgent: jest.fn().mockReturnValue({}),
  geminiFastModel: 'mock-fast-model',
  geminiProModel: 'mock-pro-model',
  geminiModel: 'mock-model',
  getEffectiveGeminiModelForAgent: jest.fn().mockResolvedValue('mock-pro-model'),
  ejecutarPromptConFallback: (...args: any[]) => mockEjecutarPromptConFallback(...args),
}));

jest.mock('@/app/actions/armado-rapido', () => ({
  getArmadoRapidoConfig: jest.fn().mockResolvedValue({
    paquetes: [
      {
        id: 'pkg_basico',
        nombre: 'Básico',
        descripcion: 'Paquete básico inicial',
        serviciosIncluidos: [
          { id: 'srv_decoracion', esRegalo: false },
          { id: 'srv_iluminacion', esRegalo: false },
        ],
      },
      {
        id: 'pkg_premium',
        nombre: 'Premium',
        descripcion: 'Paquete full',
        serviciosIncluidos: [
          { id: 'srv_discoteca', esRegalo: false },
          { id: 'srv_pantalla', esRegalo: false },
        ],
      },
    ],
    menus: [],
  }),
}));

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresaPublicos: jest.fn().mockResolvedValue([
    { id: 'srv_decoracion', nombre: 'Decoración', precioVenta: 5000 },
    { id: 'srv_iluminacion', nombre: 'Iluminación', precioVenta: 8000 },
    { id: 'srv_discoteca', nombre: 'Discoteca', precioVenta: 15000 },
    { id: 'srv_pantalla', nombre: 'Pantalla LED', precioVenta: 12000 },
  ]),
}));

jest.mock('@/app/actions/menus-catering', () => ({
  getMenusPublicos: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue({}),
  readDataConDetalle: jest.fn().mockResolvedValue({ ok: true, data: {} }),
  writeData: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
  registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
  anotarFalloIA: jest.fn().mockResolvedValue(undefined),
}));

import { detalleDePaquetes } from '@/lib/simulador/detalle-de-paquetes';
import { chatWithBudgetCopilot } from '@/app/actions/simulador-copilot';

describe('Orden 291 — Bloque 1: Sofía no inventa paquetes', () => {
  const originalKey = process.env.GOOGLE_API_KEY;

  beforeAll(() => {
    process.env.GOOGLE_API_KEY = 'test-key';
  });

  afterAll(() => {
    process.env.GOOGLE_API_KEY = originalKey;
  });

  it('con un catálogo donde Básico trae sólo Decoración e Iluminación, detalleDePaquetes no menciona discoteca en Básico', () => {
    const catalogo = [
      {
        nombre: 'Básico',
        serviciosIncluidos: [
          { nombre: 'Decoración', esRegalo: false },
          { nombre: 'Iluminación', esRegalo: false },
        ],
      },
      {
        nombre: 'Premium',
        serviciosIncluidos: [
          { nombre: 'Discoteca', esRegalo: false },
          { nombre: 'Pantalla LED', esRegalo: false },
        ],
      },
    ];

    const texto = detalleDePaquetes(catalogo);
    const partes = texto.split('·').map(p => p.trim());
    const parteBasico = partes.find(p => p.startsWith('Básico:'));

    expect(parteBasico).toBeDefined();
    expect(parteBasico).toContain('Decoración');
    expect(parteBasico).toContain('Iluminación');
    expect(parteBasico?.toLowerCase()).not.toContain('discoteca');
  });

  it('una pregunta "¿qué incluye cada paquete?" con el modelo diciendo "todos traen discoteca" devuelve también el detalle armado con los datos reales', async () => {
    mockEjecutarPromptConFallback.mockResolvedValueOnce({
      output: {
        response: '¡Hola! Te cuento que todos traen discoteca y luces.',
        action: { type: 'none' },
      },
    });

    const res = await chatWithBudgetCopilot({
      message: '¿qué incluye cada paquete?',
      history: [],
      currentState: {},
    });

    expect(res.response).toContain('todos traen discoteca y luces');
    // Debe incluir el detalle armado por debajo con los datos reales del catálogo:
    expect(res.response).toContain('Básico: Decoración, Iluminación');
    expect(res.response).toContain('Premium: Discoteca, Pantalla LED');
  });
});
