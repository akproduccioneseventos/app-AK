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

// El asistente del cliente lee la fiesta con la sesión del portal (orden 108): sin sesión de ESA
// fiesta no hay contexto. Antes la prueba pasaba por un atajo que se salteaba la sesión.
let mockSesionPortalDe: string | null = null;
jest.mock('@/app/actions/fiesta/portal.actions', () => ({
  getFiestaForPortalSession: jest.fn(async (id: string) => {
    if (mockSesionPortalDe !== id) throw new Error('Sin sesión del portal.');
    return mockFiestaData;
  }),
}));

jest.mock('@/lib/data-service', () => ({
  createDataItem: jest.fn(async () => ({ success: true })),
  readData: jest.fn(async (_f: string, vacio: any) => vacio),
  writeData: jest.fn(async () => true),
}));
jest.mock('@/app/actions/notifications', () => ({ createNotification: jest.fn(async () => ({})) }));
jest.mock('@/lib/asistente/avisar-al-duenio', () => ({ avisarAlDuenio: jest.fn(async () => ({})) }));

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
    mockSesionPortalDe = null;
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

    mockSesionPortalDe = 'fiesta-123';
    const res = await chatConAsistenteCliente('fiesta-123', [], '¿Dónde es la fiesta?');

    expect(res.success).toBe(true);
    expect(mockGenerate).toHaveBeenCalled();
    const systemPrompt = mockGenerate.mock.calls[0][0].system || '';
    expect(systemPrompt).toContain('15 de Valentina');
    expect(systemPrompt).toContain('Club Uruguay');
  });

  it('sin la sesión del portal de ESA fiesta, el asistente no carga nada', async () => {
    mockFiestaData = { id: 'fiesta-123', configuracion: { nombreEvento: '15 de Valentina' } };
    mockSesionPortalDe = 'otra-fiesta';
    const res = await chatConAsistenteCliente('fiesta-123', [], '¿Dónde es la fiesta?');
    expect(res.success).toBe(false);
    expect(mockGenerate).not.toHaveBeenCalled();
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
