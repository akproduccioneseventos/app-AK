/** @jest-environment node */

let mockHayPresupuesto = true;
const mockRegistrarConsumoIA = jest.fn(async () => {});

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => mockHayPresupuesto),
  registrarConsumoIA: (...args: any[]) => mockRegistrarConsumoIA(...args),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_file: string, fallback: any) => fallback),
  writeData: jest.fn(async () => {}),
}));

let mockConfiguraciones: any[] = [
  {
    id: 'cobrador',
    nombre: 'Contador',
    apodo: 'Contador AK',
    activo: true,
    objetivos: ['que cada fiesta tenga todo cobrado 10 días antes'],
  },
];

jest.mock('@/lib/agentes/motor-agentes', () => {
  const actual = jest.requireActual('@/lib/agentes/motor-agentes');
  return {
    ...actual,
    getConfiguracionAgentes: jest.fn(async () => mockConfiguraciones),
  };
});

import { consultarAsistenteAK, ejecutarAccionDeAgenteConReglas } from '@/lib/agentes/motor-agentes';

describe('Los dots de AK respetan las cuatro reglas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHayPresupuesto = true;
    mockConfiguraciones = [
      {
        id: 'cobrador',
        nombre: 'Contador',
        apodo: 'Contador AK',
        activo: true,
        objetivos: ['que cada fiesta tenga todo cobrado 10 días antes'],
      },
    ];
  });

  it('un agente con el interruptor en "solo" igual NO cobra, no factura ni manda a un cliente', async () => {
    const accionesProhibidas = ['cobrar', 'facturar', 'mandar_mensaje_directo'];

    for (const accion of accionesProhibidas) {
      const res = await ejecutarAccionDeAgenteConReglas({
        agenteId: 'cobrador',
        accion,
        interruptorSolo: true,
        usuario: { role: 'dueno' },
      });

      expect(res.success).toBe(false);
      expect(res.estado).toBe('rechazado');
      expect(res.mensaje).toMatch(/prohibida|vos desde su pantalla/i);
    }
  });

  it('lo que toca plata espera el OK del dueño', async () => {
    // Si un operador o secretaria intenta ejecutar algo que toca plata
    const resOperador = await ejecutarAccionDeAgenteConReglas({
      agenteId: 'cobrador',
      accion: 'cambiar_precio',
      interruptorSolo: true,
      usuario: { role: 'operador' },
    });

    expect(resOperador.estado).toBe('esperando_ok');
    expect(resOperador.mensaje).toMatch(/dueño/i);
  });

  it('el objetivo escrito llega a lo que se le pasa a la IA y se refleja en la respuesta', async () => {
    const res = await consultarAsistenteAK({
      pregunta: '¿cómo vino lo contable este mes?',
      usuario: { role: 'dueno' },
    });

    expect(res.success).toBe(true);
    expect(res.respuesta).toContain('que cada fiesta tenga todo cobrado 10 días antes');
  });

  it('con el tope de IA agotado, el agente no llama a la IA', async () => {
    mockHayPresupuesto = false;

    const res = await consultarAsistenteAK({
      pregunta: '¿cómo vino lo contable este mes?',
      usuario: { role: 'dueno' },
    });

    expect(res.success).toBe(true);
    expect(mockRegistrarConsumoIA).not.toHaveBeenCalled();
  });

  it('con el perfil dueño, "¿cómo vino lo contable este mes?" contesta con montos; con operador contesta "eso no lo tengo para tu perfil" y no aparece ningún monto', async () => {
    // 1. Dueño: ve montos
    const resDueno = await consultarAsistenteAK({
      pregunta: '¿cómo vino lo contable este mes?',
      usuario: { role: 'dueno' },
    });
    expect(resDueno.success).toBe(true);
    expect(resDueno.respuesta).toMatch(/\$|240\.000/);

    // 2. Operador: no tiene contabilidad -> "eso no lo tengo para tu perfil"
    const resOperador = await consultarAsistenteAK({
      pregunta: '¿cómo vino lo contable este mes?',
      usuario: { role: 'operador' },
    });
    expect(resOperador.success).toBe(true);
    expect(resOperador.respuesta).toContain('eso no lo tengo para tu perfil');
    expect(resOperador.respuesta).not.toMatch(/\$|\d+/);
  });
});
