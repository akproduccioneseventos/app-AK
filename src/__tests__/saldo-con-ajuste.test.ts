import { calcularEstadoDeCuenta } from '@/lib/budget/saldo-con-ajuste';
import type { Presupuesto } from '@/types/presupuesto';

/**
 * Defecto real que motivó estas pruebas: el mismo saldo se calculaba de tres
 * formas distintas. La pantalla de estado de cuenta sumaba el ajuste anual por
 * inflación; el recibo de pago no lo sumaba. Con un evento agendado para el año
 * siguiente, el cliente veía un número en el papel y otro en la pantalla.
 */

function presupuestoDePrueba(extra: Partial<Presupuesto> = {}): Presupuesto {
  return {
    id: 'pres_prueba',
    timestamp: new Date('2026-03-10T12:00:00').toISOString(),
    eventoFecha: '2027-04-20',
    estado: 'Aceptado',
    ajusteAnualActivo: true,
    ajusteAnualPorcentaje: 15,
    costoTotalEstimado: 100_000,
    totalConDescuento: 100_000,
    pagosCliente: [],
    ...extra,
  } as unknown as Presupuesto;
}

describe('estado de cuenta del cliente', () => {
  it('suma el ajuste anual cuando la fiesta cae en un año posterior', () => {
    const cuenta = calcularEstadoDeCuenta(presupuestoDePrueba());
    expect(cuenta.totalBase).toBe(100_000);
    expect(cuenta.total).toBe(115_000);
    expect(cuenta.ajusteAnual).toBe(15_000);
    expect(cuenta.aniosDeAjuste).toBe(1);
    expect(cuenta.saldo).toBe(115_000);
  });

  it('no ajusta lo que se cobra en el mismo año', () => {
    const cuenta = calcularEstadoDeCuenta(presupuestoDePrueba({ eventoFecha: '2026-11-05' }));
    expect(cuenta.total).toBe(100_000);
    expect(cuenta.ajusteAnual).toBe(0);
  });

  it('respeta el ajuste apagado a mano en ese presupuesto', () => {
    const cuenta = calcularEstadoDeCuenta(presupuestoDePrueba({ ajusteAnualActivo: false }));
    expect(cuenta.total).toBe(100_000);
    expect(cuenta.ajusteAnual).toBe(0);
  });

  it('no ajusta un presupuesto que todavía no es contrato', () => {
    const cuenta = calcularEstadoDeCuenta(presupuestoDePrueba({ estado: 'Enviado' } as Partial<Presupuesto>));
    expect(cuenta.total).toBe(100_000);
  });

  it('resta los pagos confirmados y nunca deja el saldo en negativo', () => {
    const cuenta = calcularEstadoDeCuenta(
      presupuestoDePrueba({
        pagosCliente: [
          { id: 'p1', monto: 50_000, estado: 'confirmado', fecha: '2026-04-01' },
          { id: 'p2', monto: 200_000, estado: 'confirmado', fecha: '2026-05-01' },
        ],
      } as unknown as Partial<Presupuesto>),
    );
    expect(cuenta.pagado).toBe(250_000);
    expect(cuenta.saldo).toBe(0);
  });

  it('usa el porcentaje configurado cuando el presupuesto no trae uno propio', () => {
    // El porcentaje del ajuste se puede cambiar en ajustes. Si una pantalla no
    // lo pasa, se queda clavada en 15% y el cliente ve un saldo distinto al
    // que ve AK. Por eso el recibo y el portal ahora lo pasan siempre.
    const sinPropio = presupuestoDePrueba({ ajusteAnualPorcentaje: undefined } as Partial<Presupuesto>);
    expect(calcularEstadoDeCuenta(sinPropio, 20).total).toBe(120_000);
    expect(calcularEstadoDeCuenta(sinPropio).total).toBe(115_000);
  });

  it('el porcentaje propio del presupuesto le gana al configurado', () => {
    const cuenta = calcularEstadoDeCuenta(presupuestoDePrueba({ ajusteAnualPorcentaje: 10 }), 25);
    expect(cuenta.total).toBe(110_000);
  });

  it('no se rompe sin presupuesto', () => {
    const cuenta = calcularEstadoDeCuenta(null);
    expect(cuenta.total).toBe(0);
    expect(cuenta.saldo).toBe(0);
  });
});
