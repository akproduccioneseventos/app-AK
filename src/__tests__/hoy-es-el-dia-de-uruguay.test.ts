/**
 * MATAFUEGO — "Hoy" es el día de Uruguay, no el de Greenwich (pregunta 13, orden 67).
 *
 * A las 23:30 de Uruguay ya son las 02:30 del día siguiente en Greenwich. Con
 * `toISOString().slice(0, 10)` la factura que arma el asistente salía con fecha de mañana, y la
 * fiesta de esta noche quedaba afuera de "las próximas" de un empleado.
 * Se probó rompiéndolo: devolviendo el día de Greenwich, la primera se pone en rojo.
 */
import { hoyEnUruguay } from '@/lib/utils';

describe('Hoy es el día de Uruguay', () => {
  it('a las 23:30 de Uruguay sigue siendo hoy', () => {
    expect(hoyEnUruguay(new Date('2026-09-26T02:30:00Z'))).toBe('2026-09-25');
  });
  it('al mediodía coincide con Greenwich', () => {
    expect(hoyEnUruguay(new Date('2026-09-25T15:00:00Z'))).toBe('2026-09-25');
  });
});
