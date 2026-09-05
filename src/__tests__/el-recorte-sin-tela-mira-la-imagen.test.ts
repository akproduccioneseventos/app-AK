/**
 * MATAFUEGO — El recorte sin tela verde tiene que MIRAR la imagen.
 *
 * El 4 de septiembre de 2026 llegó una versión que no miraba nada: dibujaba un
 * óvalo en el centro del cuadro y borraba todo lo de afuera. Con una persona sola
 * y centrada parecía andar; **con alguien corrido a un lado o de a dos, cortaba
 * gente por la mitad**, y eso llega a la foto que se lleva el invitado.
 *
 * Este control agarra esa forma exacta de trampa: sin modelo cargado, el recorte
 * **no debe tocar la imagen** y debe avisar que no recortó, para que el que llama
 * se caiga a la tela verde de siempre.
 */
import { recortarPersonaSinTela } from '@/lib/entretenimiento/segmentacion-fondo';

function lienzoFalso(ancho: number, alto: number) {
  const pixeles = new Uint8ClampedArray(ancho * alto * 4).fill(200);
  const imageData = { data: pixeles, width: ancho, height: alto };
  let escrituras = 0;
  const ctx = {
    getImageData: () => imageData,
    putImageData: () => { escrituras += 1; },
  } as unknown as CanvasRenderingContext2D;
  return { ctx, pixeles, escrituras: () => escrituras };
}

describe('El recorte sin tela mira la imagen, no dibuja un ovalo', () => {
  it('sin el modelo cargado NO recorta nada y avisa que no pudo', () => {
    const { ctx, pixeles, escrituras } = lienzoFalso(40, 40);

    const recorto = recortarPersonaSinTela(ctx, 40, 40, undefined);

    expect(recorto).toBe(false);
    expect(escrituras()).toBe(0);
    // Ni un pixel transparente: la imagen queda intacta.
    const transparentes = [...pixeles].filter((_, i) => i % 4 === 3 && pixeles[i] === 0).length;
    expect(transparentes).toBe(0);
  });

  it('no borra por posicion: sin modelo, un pixel del borde vale lo mismo que uno del centro', () => {
    const ancho = 40;
    const alto = 40;
    const { ctx, pixeles } = lienzoFalso(ancho, alto);

    recortarPersonaSinTela(ctx, ancho, alto, undefined);

    const alfaDe = (x: number, y: number) => pixeles[(y * ancho + x) * 4 + 3];
    // Con el ovalo, la esquina quedaba en 0 y el centro en 255. Eso ya no puede pasar.
    expect(alfaDe(0, 0)).toBe(alfaDe(ancho / 2, alto / 2));
  });
});
