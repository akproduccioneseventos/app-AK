import { calcularEstadoDeCuenta } from '@/lib/budget/saldo-con-ajuste';
import { parseEventDate } from '@/lib/public-experience/event-date';
import type { Presupuesto } from '@/types/presupuesto';

describe('Recibo de contrato - Ajuste Anual y Fecha', () => {
  it('aplica el ajuste anual en el calculo de estado de cuenta cuando el evento es en anio posterior', () => {
    const presupuesto: Partial<Presupuesto> = {
      id: 'p-123',
      estado: 'Aceptado',
      timestamp: '2025-05-10T10:00:00.000Z',
      eventoFecha: '2026-12-15',
      ajusteAnualActivo: true,
      ajusteAnualPorcentaje: 15,
      itemsPresupuestados: [
        {
          id: 'item-1',
          nombreServicio: 'DJ y Luces',
          categoriaServicio: 'Discoteca',
          precioCalculado: 100000,
          tipoCalculo: 'fijo',
          cantidad: 1,
        },
      ],
      pagosCliente: [],
      costoTotalEstimado: 100000,
    };

    const cuenta = calcularEstadoDeCuenta(presupuesto as Presupuesto);

    expect(cuenta.totalBase).toBe(100000);
    expect(cuenta.ajusteAnual).toBe(15000);
    expect(cuenta.total).toBe(115000);
    expect(cuenta.saldo).toBe(115000);
  });

  it('no desplaza la fecha del evento por huso horario al usar parseEventDate', () => {
    const dateStr = '2026-12-15';
    const parsed = parseEventDate(dateStr);

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(11); // Diciembre (0-indexed)
    expect(parsed?.getDate()).toBe(15);
  });
});
