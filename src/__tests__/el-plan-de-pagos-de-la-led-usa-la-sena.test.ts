import { calcularCuotasPlanPagosLed } from '@/app/presentacion-led/slides/plan-pagos-slide';

describe('Orden 344 - El plan de pagos de la presentación LED usa la seña real de Ajustes', () => {
  it('con seña por omisión ($5.000) y total $300.000, la reserva es $5.000 (no $90.000) y el saldo se reparte 40/60', () => {
    const cuotas = calcularCuotasPlanPagosLed(300000, 5000);

    expect(cuotas).toHaveLength(3);
    expect(cuotas[0].monto).toBe(5000);
    expect(cuotas[0].monto).not.toBe(90000);

    const restante = 300000 - 5000;
    const segundoEsperado = Math.round(restante * 0.4);
    const saldoEsperado = restante - segundoEsperado;

    expect(cuotas[1].monto).toBe(segundoEsperado);
    expect(cuotas[2].monto).toBe(saldoEsperado);
    expect(cuotas[0].monto + cuotas[1].monto + cuotas[2].monto).toBe(300000);
  });

  it('cuando la seña cambia en Ajustes a $8.000, la reserva es $8.000 y las cuotas se recalculan sobre el resto', () => {
    const cuotas = calcularCuotasPlanPagosLed(300000, 8000);

    expect(cuotas[0].monto).toBe(8000);
    expect(cuotas[1].monto).toBe(116800);
    expect(cuotas[2].monto).toBe(175200);
    expect(cuotas[0].monto + cuotas[1].monto + cuotas[2].monto).toBe(300000);
  });

  it('si todavía no hay servicios elegidos (total <= 0), muestra la seña para reservar la fecha y no inventa cuotas', () => {
    const cuotas = calcularCuotasPlanPagosLed(0, 5000);

    expect(cuotas[0].label).toContain('Seña para reservar la fecha: $5.000');
    expect(cuotas[0].descripcion).toBe('El resto, en cuotas antes de la fiesta');
    expect(cuotas[0].monto).toBe(5000);
    expect(cuotas[1].monto).toBe(0);
    expect(cuotas[2].monto).toBe(0);
  });
});
