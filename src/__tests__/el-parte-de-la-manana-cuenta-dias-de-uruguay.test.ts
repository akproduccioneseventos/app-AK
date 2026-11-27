/**
 * Orden 370 B4.2 — El parte de la mañana cuenta días en hora de Uruguay y usa el día/mes de Uruguay
 * para el aviso del contador.
 */
const base: Record<string, any> = {};
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (base[f] === undefined ? d : JSON.parse(JSON.stringify(base[f])))),
  readDataConDetalle: jest.fn(async (f: string, d: any) => ({
    valor: base[f] === undefined ? d : JSON.parse(JSON.stringify(base[f])),
    huboFalla: false,
  })),
  writeData: jest.fn(async (f: string, v: any) => {
    base[f] = JSON.parse(JSON.stringify(v));
  }),
}));

const fiestasMock = jest.fn();
jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: () => fiestasMock(),
}));

jest.mock('@/lib/invoices/leer-facturas', () => ({
  leerFacturasSinGuardia: jest.fn(async () => []),
}));

jest.mock('@/lib/commercial-flow/cobros-sin-pasar-al-presupuesto', () => ({
  cobrosDeFacturaSinPasarAlPresupuesto: jest.fn(() => []),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: jest.fn(async () => {
    throw new Error('Sesion no autorizada');
  }),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn(async () => {
    throw new Error('No autorizado');
  }),
}));

import { calcularParteDeLaManana } from '@/lib/automatico/parte-manana';

describe('El parte de la mañana cuenta días de Uruguay', () => {
  beforeEach(() => {
    for (const k of Object.keys(base)) delete base[k];
    fiestasMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('a las 22:00 del 14/12 en Uruguay, una fiesta del 15/12 dice "en 1 día"', async () => {
    jest.useFakeTimers();
    // 22:00 del 14/12/2026 en Uruguay = 01:00 UTC del 15/12/2026
    jest.setSystemTime(new Date('2026-12-15T01:00:00.000Z'));

    fiestasMock.mockResolvedValue([
      {
        id: 'f1',
        presupuestoId: 'p1',
        menuAsignadoId: 'm1',
        invitados: [{ id: 'i1' }],
        configuracion: {
          fechaEvento: '2026-12-15',
          nombreEvento: 'Cumple de Sofía',
        },
      },
    ]);
    base['presupuestos.json'] = [
      {
        id: 'p1',
        clienteNombre: 'Sofía',
        totalConDescuento: 80_000,
        pagosCliente: [{ monto: 30_000, estadoPago: 'confirmado' }],
      },
    ];

    const parte = await calcularParteDeLaManana();
    expect(parte.fecha).toBe('2026-12-14');
    const cobranza = parte.items?.find((i) => i.tipo === 'cobranza');
    expect(cobranza).toBeDefined();
    expect(cobranza?.detalle).toContain('en 1 día');
    expect(cobranza?.detalle).not.toContain('en 0 días');
  });

  it('el 31/12 a las 22:00 en Uruguay no muestra el aviso del contador del mes siguiente', async () => {
    jest.useFakeTimers();
    // 22:00 del 31/12/2026 en Uruguay = 01:00 UTC del 01/01/2027
    jest.setSystemTime(new Date('2027-01-01T01:00:00.000Z'));

    fiestasMock.mockResolvedValue([]);
    base['presupuestos.json'] = [];

    const parte = await calcularParteDeLaManana();
    expect(parte.fecha).toBe('2026-12-31');
    expect(parte.items?.some((i) => i.tipo === 'contador')).toBe(false);
  });

  it('el 01/01 a las 22:00 en Uruguay sí muestra el resumen de diciembre para el contador', async () => {
    jest.useFakeTimers();
    // 22:00 del 01/01/2027 en Uruguay = 01:00 UTC del 02/01/2027
    jest.setSystemTime(new Date('2027-01-02T01:00:00.000Z'));

    fiestasMock.mockResolvedValue([]);
    base['presupuestos.json'] = [];

    const parte = await calcularParteDeLaManana();
    expect(parte.fecha).toBe('2027-01-01');
    const contador = parte.items?.find((i) => i.tipo === 'contador');
    expect(contador).toBeDefined();
    expect(contador?.id).toBe('contador_2026-12');
    expect(contador?.titulo).toContain('diciembre de 2026');
  });
});
