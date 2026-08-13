import { montoDeSenia, SENIA_POR_DEFECTO } from '@/lib/budget/monto-de-senia';

/**
 * La seña es la plata que sostiene la reserva. Si se cobra de menos, el problema
 * aparece meses después, cuando ya no se puede reclamar cómodo.
 *
 * **Decisión del dueño del 12 de agosto de 2026:** la seña es un monto fijo, hoy
 * $5.000, no un porcentaje del evento. Se cambia desde Ajustes.
 */

describe('cuánta seña se le cobra al cliente', () => {
  it('manda la seña acordada con ese cliente', () => {
    expect(montoDeSenia({ seniaAcordada: 80000, porDefecto: 5000 })).toBe(80000);
  });

  it('sin seña acordada, cobra el monto general configurado', () => {
    expect(montoDeSenia({ porDefecto: 5000 })).toBe(5000);
  });

  it('NO calcula un porcentaje del evento: el monto no depende del tamaño', () => {
    const chica = montoDeSenia({ porDefecto: 5000 });
    const grande = montoDeSenia({ porDefecto: 5000 });

    expect(chica).toBe(grande);
    expect(grande).toBe(5000);
  });

  it('si el dueño sube el monto en Ajustes, se cobra el nuevo', () => {
    expect(montoDeSenia({ porDefecto: 12000 })).toBe(12000);
  });

  it('la seña acordada le gana al monto general', () => {
    expect(montoDeSenia({ seniaAcordada: 30000, porDefecto: 5000 })).toBe(30000);
  });

  it('sin nada configurado cae en los $5.000 de siempre', () => {
    expect(montoDeSenia({})).toBe(SENIA_POR_DEFECTO);
    expect(montoDeSenia({ porDefecto: 0 })).toBe(SENIA_POR_DEFECTO);
  });

  it('ignora números rotos en vez de cobrar cualquier cosa', () => {
    expect(montoDeSenia({ seniaAcordada: Number.NaN, porDefecto: 5000 })).toBe(5000);
    expect(montoDeSenia({ seniaAcordada: -50, porDefecto: 5000 })).toBe(5000);
    expect(montoDeSenia({ porDefecto: Number.NaN })).toBe(SENIA_POR_DEFECTO);
  });

  it('devuelve pesos enteros, sin centavos', () => {
    expect(montoDeSenia({ seniaAcordada: 7500.4, porDefecto: 5000 })).toBe(7500);
  });
});
