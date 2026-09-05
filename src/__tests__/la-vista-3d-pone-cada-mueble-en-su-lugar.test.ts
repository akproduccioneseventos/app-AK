/**
 * MATAFUEGO — En la vista 3D, cada mueble tiene que ir a SU lugar.
 *
 * El 4 de septiembre de 2026 la vista 3D dibujaba todos los muebles en la posicion
 * cero y ademas adentro de un bloque oculto: el salon se veia vacio y el control
 * decia que la funcion estaba. Este control agarra las dos formas de esa trampa.
 */
import {
  ubicarMuebleEnLaEscena,
  ubicarMueblesEnLaEscena,
} from '@/lib/decoracion/plano-a-escena-3d';

const SALON = { salonWidth: 20, salonHeight: 15, pixelsPerMeter: 40 };

describe('La vista 3D pone cada mueble en su lugar', () => {
  it('dos muebles en lugares distintos del plano NO caen en el mismo punto', () => {
    const [uno, otro] = ubicarMueblesEnLaEscena(
      [
        { id: 'mesa', x: 150, y: 120, width: 100, height: 100 },
        { id: 'arco', x: 550, y: 420, width: 80, height: 80 },
      ],
      SALON
    );

    expect(`${uno.x},${uno.z}`).not.toBe(`${otro.x},${otro.z}`);
  });

  it('ninguno queda en el cero, que es como se veia el salon vacio', () => {
    const puestos = ubicarMueblesEnLaEscena(
      [
        { id: 'mesa', x: 150, y: 120 },
        { id: 'arco', x: 550, y: 420 },
      ],
      SALON
    );

    for (const p of puestos) {
      expect(`${p.x},${p.z}`).not.toBe('0,0');
    }
  });

  it('un mueble en el centro del plano cae en el centro del salon', () => {
    // Centro del plano: 20 m de ancho x 15 m de largo, a 40 pixeles el metro.
    const centro = ubicarMuebleEnLaEscena(
      { id: 'centro', x: (20 / 2) * 40, y: (15 / 2) * 40, width: 0, height: 0 },
      SALON
    );

    expect(centro.x).toBe(0);
    expect(centro.z).toBe(0);
  });

  it('mover el mueble hacia la derecha en el plano lo mueve hacia la derecha en la escena', () => {
    const izquierda = ubicarMuebleEnLaEscena({ id: 'a', x: 100, y: 200 }, SALON);
    const derecha = ubicarMuebleEnLaEscena({ id: 'b', x: 500, y: 200 }, SALON);

    expect(derecha.x).toBeGreaterThan(izquierda.x);
    expect(derecha.z).toBe(izquierda.z);
  });
});
