/**
 * MATAFUEGO — Un regalo ya elegido por otro invitado no se puede volver a reservar,
 * y la pantalla no puede decir que salio bien.
 *
 * Esta comprobacion vivia dentro de una prueba de navegador
 * (`tests/e2e/la-lista-de-regalos-queda-como-la-dejaron.spec.ts`), llamando a la accion
 * del servidor desde el proceso de Playwright. Eso no se puede: la accion arrastra
 * `server-only` y el archivo entero no cargaba, asi que se llevaba puesta la tanda
 * completa de pruebas de navegador sin registrar ni una. Vive aca, que es donde corre.
 *
 * Se probo rompiendola a proposito: sacando el `if (targetGift.isClaimed)` de
 * `claimGift`, esta prueba se pone en rojo.
 */

const getFiestaById = jest.fn();
const saveFiesta = jest.fn();

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: (...args: any[]) => getFiestaById(...args),
  saveFiesta: (...args: any[]) => saveFiesta(...args),
}));

import { claimGift } from '@/app/actions/fiesta/regalos.actions';

function fiestaConRegalo(isClaimed: boolean, claimedBy?: string) {
  return {
    id: 'fiesta_regalos',
    invitacionDigital: {
      regalos: {
        visible: true,
        titulo: { text: 'Regalos' },
        texto: { text: '' },
        datosBancarios: '',
        items: [
          {
            id: 'regalo_1',
            name: 'Cafetera Espresso',
            description: 'Para el desayuno',
            isClaimed,
            claimedBy,
          },
        ],
      },
    },
  } as any;
}

describe('Un regalo no se reserva dos veces', () => {
  beforeEach(() => {
    getFiestaById.mockReset();
    saveFiesta.mockReset();
    saveFiesta.mockResolvedValue({ success: true });
  });

  it('si otro invitado ya lo eligio, avisa y no guarda nada', async () => {
    getFiestaById.mockResolvedValue(fiestaConRegalo(true, 'Tia Marta'));

    const res = await claimGift('fiesta_regalos', 'regalo_1', 'Juan Perez');

    expect(res.success).toBe(false);
    expect(res.error).toBe('Justo lo eligió otro invitado; elegí otro de la lista.');
    expect(saveFiesta).not.toHaveBeenCalled();
  });

  it('si esta libre, lo reserva y lo deja a nombre del invitado', async () => {
    getFiestaById.mockResolvedValue(fiestaConRegalo(false));

    const res = await claimGift('fiesta_regalos', 'regalo_1', 'Juan Perez');

    expect(res.success).toBe(true);
    const guardado = saveFiesta.mock.calls[0][0];
    expect(guardado.invitacionDigital.regalos.items[0]).toMatchObject({
      isClaimed: true,
      claimedBy: 'Juan Perez',
    });
  });

  it('si el guardado falla, no dice que salio bien', async () => {
    getFiestaById.mockResolvedValue(fiestaConRegalo(false));
    saveFiesta.mockResolvedValue({ success: false, error: 'La base no contesta.' });

    const res = await claimGift('fiesta_regalos', 'regalo_1', 'Juan Perez');

    expect(res.success).toBe(false);
    expect(res.error).toBe('La base no contesta.');
  });
});
