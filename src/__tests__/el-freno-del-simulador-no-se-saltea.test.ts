/** @jest-environment node */

let mockClientIp = '203.0.113.50';

jest.mock('next/headers', () => ({
  headers: jest.fn(async () => ({
    get: (name: string) => {
      if (name === 'x-forwarded-for') return mockClientIp;
      return null;
    },
  })),
}));

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'armado-rapido-config.json') {
      return {
        descuentoGeneral: 15,
        paquetes: [{ id: 'pkg-int', nombre: 'Intermedio', serviciosIncluidos: [] }],
        menus: [],
        platosVisibles: [],
        serviceDependencies: [],
        mostrarPrecios: true,
        clubUruguayConfig: { activo: false, precio: 0, prestaciones: [] },
      };
    }
    return fallback;
  }),
  writeData: jest.fn(),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => []),
}));

jest.mock('@/lib/budget/public-simulator-persistence', () => ({
  persistPublicSimulatorBudget: jest.fn(async (data: any) => ({
    reused: false,
    leadId: 'lead-1',
    presupuesto: {
      id: 'pres-1',
      clienteNombre: data.clienteNombre || 'Visitante',
      eventoTipo: 'Cumpleaños',
    },
  })),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/auth/session-token', () => ({
  generateBudgetToken: jest.fn(async () => 'tok-pres-1'),
  verifySession: jest.fn(async () => ({ success: false })),
}));

import { saveSimuladorV2Lead } from '@/app/actions/simulador-v2';
import { generateBudgetAndLeadFromSimulator } from '@/app/actions/armado-rapido';

describe('Orden 369 B3 — el freno del simulador no se saltea cambiando o quitando el teléfono', () => {
  it('cinco altas en saveSimuladorV2Lead desde la misma conexión con cinco teléfonos distintos frenan la quinta', async () => {
    mockClientIp = '198.51.100.10';
    const telefonos = ['099111001', '099111002', '099111003', '099111004', ''];

    const resultados = [];
    for (let i = 0; i < telefonos.length; i++) {
      const r = await saveSimuladorV2Lead({
        nombre: 'Test',
        apellido: `User${i}`,
        telefono: telefonos[i],
        tipoEvento: 'Cumpleaños',
        paquete: 'Intermedio',
        fechaEvento: '2026-12-20',
        adultos: 80,
        adolescentes: 0,
        tieneSalon: false,
        incluirClubUruguay: false,
        duracion: 'hasta4',
        serviciosActivados: [],
      } as any);
      resultados.push(r);
    }

    expect(resultados.slice(0, 4).every((r) => r.success)).toBe(true);
    expect(resultados[4].success).toBe(false);
    expect(resultados[4].error).toMatch(/demasiados intentos/i);
  });

  it('generateBudgetAndLeadFromSimulator frena por conexión aunque cambie clienteContacto en cada pedido', async () => {
    mockClientIp = '198.51.100.20';

    for (let i = 0; i < 20; i++) {
      const res = await generateBudgetAndLeadFromSimulator({
        clienteNombre: `Visitante ${i}`,
        clienteContacto: `09999${String(i).padStart(4, '0')}`,
        adultos: 50,
        adolescentes: 0,
        ninos: 0,
        subtotal: 1000,
        costoEstimado: 1000,
        serviciosIncluidos: [],
      } as any);
      expect(res.success).toBe(true);
    }

    const bloqueada = await generateBudgetAndLeadFromSimulator({
      clienteNombre: 'Visitante 21',
      clienteContacto: '099888777',
      adultos: 50,
      adolescentes: 0,
      ninos: 0,
      subtotal: 1000,
      costoEstimado: 1000,
      serviciosIncluidos: [],
    } as any);

    expect(bloqueada.success).toBe(false);
    expect(bloqueada.error).toMatch(/demasiadas solicitudes/i);
  });
});
