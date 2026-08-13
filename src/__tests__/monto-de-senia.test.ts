import { montoDeSenia, PORCENTAJE_DE_SENIA } from '@/lib/budget/monto-de-senia';

/**
 * La seña es la plata que sostiene la reserva. Si se cobra de menos, el problema
 * aparece meses después, cuando ya no se puede reclamar cómodo.
 */

describe('cuánta seña se le cobra al cliente', () => {
  it('manda la seña acordada con ese cliente', () => {
    expect(montoDeSenia({ seniaAcordada: 80000, totalConAjuste: 500000, porDefecto: 5000 }))
      .toBe(80000);
  });

  it('sin seña acordada, cobra el 20% del total', () => {
    expect(montoDeSenia({ totalConAjuste: 500000, porDefecto: 5000 }))
      .toBe(500000 * PORCENTAJE_DE_SENIA);
  });

  it('la seña sigue al tamaño del evento, no queda fija', () => {
    const chica = montoDeSenia({ totalConAjuste: 100000, porDefecto: 5000 });
    const grande = montoDeSenia({ totalConAjuste: 900000, porDefecto: 5000 });

    expect(grande).toBeGreaterThan(chica);
  });

  it('NO cobra el valor de último recurso cuando hay total: ese era el error', () => {
    const cobrado = montoDeSenia({ totalConAjuste: 500000, porDefecto: 5000 });

    expect(cobrado).not.toBe(5000);
    expect(cobrado).toBe(100000);
  });

  it('sólo cae al último recurso si no hay ni seña ni total', () => {
    expect(montoDeSenia({ porDefecto: 5000 })).toBe(5000);
    expect(montoDeSenia({ seniaAcordada: 0, totalConAjuste: 0, porDefecto: 5000 })).toBe(5000);
  });

  it('ignora números rotos en vez de cobrar cualquier cosa', () => {
    expect(montoDeSenia({ seniaAcordada: Number.NaN, totalConAjuste: 500000, porDefecto: 5000 }))
      .toBe(100000);
    expect(montoDeSenia({ seniaAcordada: -50, totalConAjuste: 500000, porDefecto: 5000 }))
      .toBe(100000);
    expect(montoDeSenia({ porDefecto: Number.NaN })).toBe(0);
  });

  it('devuelve pesos enteros, sin centavos', () => {
    expect(Number.isInteger(montoDeSenia({ totalConAjuste: 123457, porDefecto: 5000 }))).toBe(true);
  });
});
