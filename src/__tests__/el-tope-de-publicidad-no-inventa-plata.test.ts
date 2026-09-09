/**
 * MATAFUEGO del tope de gasto de publicidad.
 *
 * Pasó dos veces, en direcciones opuestas y las dos mal:
 *
 * 1. Se dividía el gasto de los últimos treinta días y, si daba cero, se **inventaba
 *    $500** de presupuesto diario. Un número inventado decidiendo cuánta plata queda.
 * 2. La corrección puso todo en cero y sin verificar, y eso dejaba el panel **apagado
 *    para siempre**: nunca había saldo y nunca se podía tocar una campaña.
 *
 * Lo correcto es lo de ahora: con el dato de Meta, se trabaja; sin el dato, se avisa.
 */
import { getEstadoDelTope, puedeComprometer } from '@/lib/marketing/tope-de-gasto-publicidad';

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => ({ topeMensualUYU: 30000 })),
  writeData: jest.fn(async () => undefined),
}));

const AHORA = new Date('2026-09-10T12:00:00.000Z');

describe('El tope de publicidad no inventa plata ni se apaga solo', () => {
  it('con presupuestos verificados, calcula el saldo y deja trabajar', async () => {
    const estado = await getEstadoDelTope(
      [{ nombre: 'Quince', presupuestoDiarioUYU: 300, activa: true, verificado: true }],
      AHORA,
    );
    expect(estado.compromisoVerificado).toBe(true);
    expect(estado.disponibleUYU).toBeGreaterThan(0);
  });

  it('si Meta no dio el presupuesto, avisa y NO asume saldo libre', async () => {
    const estado = await getEstadoDelTope(
      [{ nombre: 'Quince', presupuestoDiarioUYU: 0, activa: false, verificado: false }],
      AHORA,
    );
    expect(estado.compromisoVerificado).toBe(false);
    expect(estado.disponibleUYU).toBe(0);
    expect(estado.motivoNoVerificado).toBeTruthy();
  });

  it('sin presupuesto verificado no se compromete plata', async () => {
    const r = await puedeComprometer(
      {
        campanas: [{ nombre: 'Quince', presupuestoDiarioUYU: 0, activa: false, verificado: false }],
        presupuestoDiarioActualUYU: 0,
        nuevoPresupuestoDiarioUYU: 200,
        tipo: 'ajustar',
      },
      AHORA,
    );
    expect(r.permitido).toBe(false);
  });

  it('encender o crear una campaña se niega siempre: eso lo decide el dueño', async () => {
    for (const tipo of ['encender', 'crear'] as const) {
      const r = await puedeComprometer(
        {
          campanas: [{ nombre: 'Quince', presupuestoDiarioUYU: 300, activa: true, verificado: true }],
          presupuestoDiarioActualUYU: 300,
          nuevoPresupuestoDiarioUYU: 310,
          tipo,
        },
        AHORA,
      );
      expect(r.permitido).toBe(false);
    }
  });
});
