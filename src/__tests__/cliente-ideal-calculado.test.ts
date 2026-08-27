jest.mock('@/lib/data-service', () => {
  let memoryStore: Record<string, any> = {};
  return {
    readData: jest.fn(async (file: string, fallback: any) => {
      return memoryStore[file] !== undefined ? memoryStore[file] : fallback;
    }),
    writeData: jest.fn(async (file: string, data: any) => {
      memoryStore[file] = data;
      return true;
    }),
    __setMemory: (file: string, data: any) => {
      memoryStore[file] = data;
    },
    __clearMemory: () => {
      memoryStore = {};
    },
  };
});

import { calcularClienteIdeal } from '@/lib/marketing/cliente-ideal';

describe('Cliente Ideal Calculado (no inventado)', () => {
  beforeEach(() => {
    (require('@/lib/data-service') as any).__clearMemory();
  });

  it('informa que faltan datos si hay menos de 3 contratos cerrados', async () => {
    (require('@/lib/data-service') as any).__setMemory('presupuestos.json', [
      { id: 'p1', estado: 'Aceptado', eventoTipo: 'Boda', totalConDescuento: 50000 },
    ]);

    const res = await calcularClienteIdeal();
    expect(res.hayDatosSuficientes).toBe(false);
    expect(res.mensajeInsuficiente).toContain('Todavía no hay contratos cerrados suficientes');
    expect(res.consejos).toHaveLength(0);
  });

  it('calcula métricas y 3 consejos reales cuando hay contratos suficientes', async () => {
    (require('@/lib/data-service') as any).__setMemory('presupuestos.json', [
      { id: 'p1', estado: 'Aceptado', eventoTipo: '15 años', invitadosCantidad: 120, totalConDescuento: 60000, salonFiestas: 'Club Uruguay' },
      { id: 'p2', estado: 'Aceptado', eventoTipo: '15 años', invitadosCantidad: 130, totalConDescuento: 70000, salonFiestas: 'Club Uruguay' },
      { id: 'p3', estado: 'Facturado', eventoTipo: 'Boda', invitadosCantidad: 90, totalConDescuento: 80000, salonFiestas: 'Salón Privado' },
      { id: 'p4', estado: 'Rechazado', eventoTipo: '15 años', totalConDescuento: 150000 },
    ]);

    const res = await calcularClienteIdeal();
    expect(res.hayDatosSuficientes).toBe(true);
    expect(res.totalContratosAnalizados).toBe(3);
    expect(res.totalPerdidosAnalizados).toBe(1);

    expect(res.datos?.tipoEventoTop.nombre).toBe('15 años');
    expect(res.datos?.ticketPromedioUYU).toBe(70000);
    expect(res.datos?.rangoInvitadosTop.rango).toBe('80 a 130');
    expect(res.datos?.salonPreferido.nombre).toBe('Club Uruguay');

    expect(res.fichaResumen).toContain('15 años');
    expect(res.fichaResumen).toContain('Club Uruguay');
    expect(res.consejos).toHaveLength(3);

    for (const c of res.consejos) {
      expect(c.datoRespaldo).toBeTruthy();
    }
  });
});
