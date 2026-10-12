/**
 * Pregunta 50 (12/10/2026): si el calendario no se pudo leer, el simulador público NO dice que la
 * fecha está libre. Antes `checkDateAvailability` devolvía `isOccupied: false` en el catch y el
 * prospecto veía disponible una fecha que podía estar tomada.
 */
jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => { throw new Error('base caída'); }),
}));

import { checkDateAvailability } from '@/app/actions/simulador-v2';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';

describe('el simulador no dice "libre" si no pudo leer el calendario', () => {
  it('lanza cuando falla la lectura, en vez de dar la fecha por libre', async () => {
    await expect(checkDateAvailability('2027-08-08')).rejects.toThrow('base caída');
  });

  it('con el calendario leído, una fecha ocupada sigue saliendo ocupada', async () => {
    (leerFiestasCrudas as jest.Mock).mockResolvedValueOnce([{ configuracion: { fechaEvento: '2027-08-08' } }]);
    const r = await checkDateAvailability('2027-08-08');
    expect(r.isOccupied).toBe(true);
  });
});
