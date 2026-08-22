let mockFiestaData: any = null;
const mockGenerate = jest.fn();

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => {}),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => {}),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => mockFiestaData),
}));

jest.mock('@/ai/genkit', () => ({
  generateWithGeminiFallback: jest.fn(async (args: any) => mockGenerate(args)),
  geminiCommercialModel: 'googleai/gemini-flash-latest',
}));

import {
  chatConAsistenteCliente,
  chatConAsistenteInvitado,
} from '@/app/actions/asistente-virtual';

describe('Asistente AK — Aislamiento Estricto de Datos y Seguridad en Portales', () => {
  beforeEach(() => {
    mockFiestaData = null;
    mockGenerate.mockReset();
  });

  it('el asistente para clientes carga únicamente el contexto de la fiesta solicitada', async () => {
    mockFiestaData = {
      id: 'fiesta-123',
      nombre: '15 de Valentina',
      configuracion: {
        nombreEvento: '15 de Valentina',
        tipoCelebracion: 'XV años',
        fechaEvento: '2026-11-20',
        salon: 'Club Uruguay',
      },
    };

    mockGenerate.mockResolvedValue({
      text: '¡Hola! Para el cumple de 15 de Valentina el salón confirmado es Club Uruguay.',
    });

    const res = await chatConAsistenteCliente('fiesta-123', [], '¿Dónde es la fiesta?');

    expect(res.success).toBe(true);
    expect(mockGenerate).toHaveBeenCalled();
    const systemPrompt = mockGenerate.mock.calls[0][0].system || '';
    expect(systemPrompt).toContain('15 de Valentina');
    expect(systemPrompt).toContain('Club Uruguay');
  });

  it('el asistente para invitados prohíbe terminantemente datos financieros en el prompt del sistema', async () => {
    mockFiestaData = {
      id: 'fiesta-456',
      nombre: 'Boda Camila y Juan',
      configuracion: {
        nombreEvento: 'Boda Camila y Juan',
        fechaEvento: '2026-12-05',
        salon: 'Salto Hotel & Casino',
      },
    };

    mockGenerate.mockResolvedValue({
      text: '¡Hola! La fiesta es en Salto Hotel & Casino.',
    });

    const res = await chatConAsistenteInvitado(
      'fiesta-456',
      [],
      '¿Cuánto costó la fiesta y cuánto falta pagar?',
      'Invitado Pedro',
      '4'
    );

    expect(res.success).toBe(true);
    const systemPrompt = mockGenerate.mock.calls[0][0].system || '';
    // Regla de oro de seguridad:
    expect(systemPrompt).toContain('CERO DATOS DE DINERO');
    expect(systemPrompt).toContain('Como asistente de invitados no manejo información financiera');
  });
});
