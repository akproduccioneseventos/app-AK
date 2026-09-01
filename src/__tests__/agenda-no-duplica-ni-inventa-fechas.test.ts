import { getFiestaTimes } from '@/lib/google-workspace';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

/**
 * La agenda del dueno no se ensucia.
 *
 * Paso de verdad: al sincronizar, la app **duplico eventos y agrego fechas que no
 * eran** en el calendario personal del dueno. Las dos causas, encontradas en el
 * codigo:
 *
 * 1. **Una fecha que no se entiende se convertia en la de HOY.** Se creaba un
 *    evento fantasma con el nombre de la fiesta en un dia cualquiera.
 * 2. **El evento ya existente se buscaba SOLO en el dia de la fecha nueva.** Si a
 *    una fiesta se le cambiaba la fecha, el evento viejo quedaba clavado en la
 *    fecha vieja y ademas se creaba otro: duplicado, y una fecha que no era.
 *
 * Esta prueba cuida la primera, que es la que se puede comprobar sin hablar con
 * Google. La segunda quedo arreglada buscando por el numero de la fiesta en toda
 * la agenda, no solo en el dia.
 */

function fiestaCon(fecha: unknown): FiestaEnPlanificacion {
  return { configuracion: { fechaEvento: fecha } } as unknown as FiestaEnPlanificacion;
}

describe('la agenda no inventa fechas', () => {
  it('una fecha que no se entiende NO se sincroniza', () => {
    expect(getFiestaTimes(fiestaCon('no es una fecha')).fechaValida).toBe(false);
    expect(getFiestaTimes(fiestaCon('')).fechaValida).toBe(false);
    expect(getFiestaTimes(fiestaCon(undefined)).fechaValida).toBe(false);
  });

  it('una fecha sin hora se agenda a las 21 de Uruguay, no a la madrugada', () => {
    const { safeStart, fechaValida } = getFiestaTimes(fiestaCon('2026-10-14'));
    expect(fechaValida).toBe(true);
    // 21:00 en Uruguay (GMT-3) es medianoche del dia siguiente en hora universal.
    expect(safeStart.toISOString()).toBe('2026-10-15T00:00:00.000Z');
  });

  it('una fiesta que termina pasada la medianoche sigue siendo del dia que se contrato', () => {
    const { safeStart, fechaValida } = getFiestaTimes(fiestaCon('2026-10-14T22:30:00-03:00'));
    expect(fechaValida).toBe(true);
    expect(safeStart.getTime()).toBe(new Date('2026-10-14T22:30:00-03:00').getTime());
  });
});
