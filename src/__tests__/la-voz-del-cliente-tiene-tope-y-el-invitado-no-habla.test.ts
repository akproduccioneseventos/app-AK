/** @jest-environment node */
import { POST } from '@/app/api/asistente/voz-en-vivo/cliente/route';
import fs from 'fs';
import path from 'path';

let mockFiestaSession: any = {
  id: 'fiesta-a',
  configuracion: {
    nombreEvento: '15 de Camila',
    tipoCelebracion: '15_anos',
    fechaEvento: '2026-12-15',
    nombreLugar: 'Salón AK',
    invitadosEstimados: 120,
    costoTotal: 150000,
    sueldosMozos: 35000,
    gananciaEstimada: 80000,
  },
};

let mockAjustes: any = {
  vozEnVivoClienteActiva: true,
  vozEnVivoClienteMinutosPorDia: 5,
};

let mockUsoStore: Record<string, { fecha: string; minutos: number }> = {};

jest.mock('@/app/actions/fiesta/portal.actions', () => ({
  getFiestaForPortalSession: jest.fn(async (fiestaId: string) => {
    if (mockFiestaSession && mockFiestaSession.id === fiestaId) {
      return mockFiestaSession;
    }
    return null;
  }),
}));

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  getAsistenteSettings: jest.fn(async () => mockAjustes),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => {}),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_file: string, fallback: any) => mockUsoStore || fallback),
  writeData: jest.fn(async (_file: string, data: any) => {
    mockUsoStore = data;
  }),
}));

let capturedInstrucciones = '';
jest.mock('@/lib/asistente/voz-en-vivo', () => {
  const actual = jest.requireActual('@/lib/asistente/voz-en-vivo');
  return {
    ...actual,
    armarInstruccionesDeVoz: jest.fn((contexto: string) => {
      capturedInstrucciones = contexto;
      return actual.armarInstruccionesDeVoz(contexto);
    }),
  };
});

describe('La voz del cliente tiene tope y el invitado no habla', () => {
  const hoyStr = new Date().toISOString().split('T')[0];

  beforeEach(() => {
    mockFiestaSession = {
      id: 'fiesta-a',
      configuracion: {
        nombreEvento: '15 de Camila',
        tipoCelebracion: '15_anos',
        fechaEvento: '2026-12-15',
        nombreLugar: 'Salón AK',
        invitadosEstimados: 120,
        costoTotal: 150000,
        sueldosMozos: 35000,
        gananciaEstimada: 80000,
      },
    };
    mockAjustes = {
      vozEnVivoClienteActiva: true,
      vozEnVivoClienteMinutosPorDia: 5,
    };
    mockUsoStore = {};
    capturedInstrucciones = '';
  });

  it('con la sesión del portal de la fiesta A no se abre la voz de la fiesta B', async () => {
    const req = new Request('http://localhost/api/asistente/voz-en-vivo/cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fiestaId: 'fiesta-b' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Sesión no válida o no autorizada');
  });

  it('el sexto minuto del día no se da', async () => {
    // Ya consumió 5 minutos hoy
    mockUsoStore = {
      'fiesta-a': { fecha: hoyStr, minutos: 5 },
    };

    const req = new Request('http://localhost/api/asistente/voz-en-vivo/cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fiestaId: 'fiesta-a' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toMatch(/tope de 5 minutos/i);
  });

  it('con el interruptor apagado, ningún cliente habla', async () => {
    mockAjustes.vozEnVivoClienteActiva = false;

    const req = new Request('http://localhost/api/asistente/voz-en-vivo/cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fiestaId: 'fiesta-a' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('desactivada');
  });

  it('el contexto no lleva sueldos, costos ni ganancias', async () => {
    const req = new Request('http://localhost/api/asistente/voz-en-vivo/cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fiestaId: 'fiesta-a' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verificamos que capturedInstrucciones no tenga sueldos, costos ni ganancias
    expect(capturedInstrucciones).not.toMatch(/sueldo|costo|ganancia|150000|35000|80000/i);
    expect(capturedInstrucciones).toContain('15 de Camila');
  });

  it('el asistente del invitado no usa voz-en-vivo', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/invitacion/AsistenteDelInvitado.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('voz-en-vivo');
  });
});
