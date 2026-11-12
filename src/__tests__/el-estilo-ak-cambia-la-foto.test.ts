import { aplicarEstiloAK, esTonoPiel, puntoEnPoligono } from '@/lib/entretenimiento/estilo-ak';

function crearLienzo(ancho: number, alto: number, colorInicial = [128, 128, 128, 255]) {
  const pixeles = new Uint8ClampedArray(ancho * alto * 4);
  for (let i = 0; i < ancho * alto; i++) {
    pixeles[i * 4] = colorInicial[0];
    pixeles[i * 4 + 1] = colorInicial[1];
    pixeles[i * 4 + 2] = colorInicial[2];
    pixeles[i * 4 + 3] = colorInicial[3];
  }
  const ctx = {
    getImageData: () => ({
      data: new Uint8ClampedArray(pixeles),
      width: ancho,
      height: alto,
    }),
    putImageData: (imgData: { data: Uint8ClampedArray }) => {
      pixeles.set(imgData.data);
    },
    canvas: { width: ancho, height: alto },
  } as unknown as CanvasRenderingContext2D;

  return { ctx, pixeles };
}

describe('Orden 280 — El Estilo AK cambia la foto de los invitados', () => {
  test('con estilo que lleva los medios a cálido, imagen gris sale más cálida', () => {
    const ancho = 10;
    const alto = 10;
    const { ctx, pixeles } = crearLienzo(ancho, alto, [128, 128, 128, 255]);

    // Estilo con medios tonos cálidos (+R, -B)
    const estiloCalido = {
      intensidad: 1.0,
      medios: { r: 16, g: 4, b: -12 },
    };

    aplicarEstiloAK(ctx, ancho, alto, estiloCalido);

    // El píxel gris (128, 128, 128) ahora tiene más rojo y menos azul: viró a cálido
    const r = pixeles[0];
    const g = pixeles[1];
    const b = pixeles[2];

    expect(r).toBeGreaterThan(128);
    expect(b).toBeLessThan(128);
    expect(r).toBeGreaterThan(b);
  });

  test('con intensidad 0, sale igual (no altera ningún píxel)', () => {
    const ancho = 10;
    const alto = 10;
    const { ctx, pixeles } = crearLienzo(ancho, alto, [128, 128, 128, 255]);
    const original = new Uint8ClampedArray(pixeles);

    const estiloCero = {
      intensidad: 0,
      temperatura: 25,
      medios: { r: 20, g: 10, b: -15 },
      sombras: { r: 10, g: 5, b: -5 },
    };

    aplicarEstiloAK(ctx, ancho, alto, estiloCero);

    expect(Array.from(pixeles)).toEqual(Array.from(original));
  });

  test('la piel solo se toca dentro del contorno de la cara (un píxel de piel fuera no cambia)', () => {
    const ancho = 30;
    const alto = 30;
    // Imagen con tono base de piel
    const tonoPiel = [210, 150, 120, 255];
    const { ctx, pixeles } = crearLienzo(ancho, alto, tonoPiel);

    // Verificamos que el tono inicial es reconocido como piel
    expect(esTonoPiel(tonoPiel[0], tonoPiel[1], tonoPiel[2])).toBe(true);

    // Colocamos una mancha/irregularidad en la piel fuera del contorno (en x=2, y=2)
    const idxFuera = (2 * ancho + 2) * 4;
    pixeles[idxFuera] = 200;
    pixeles[idxFuera + 1] = 142;
    pixeles[idxFuera + 2] = 112;

    // Colocamos la misma irregularidad adentro del contorno de la cara (en x=15, y=15)
    const idxDentro = (15 * ancho + 15) * 4;
    pixeles[idxDentro] = 200;
    pixeles[idxDentro + 1] = 142;
    pixeles[idxDentro + 2] = 112;

    // Definimos el contorno de una cara centrada entre x: 10..20, y: 10..20
    const cara = {
      puntos: [
        { x: 10, y: 10 },
        { x: 20, y: 10 },
        { x: 20, y: 20 },
        { x: 10, y: 20 },
      ],
    };

    // Estilo con suavizado de piel pero sin alteración cromática global
    const estiloPiel = {
      intensidad: 1.0,
      suavizadoPiel: 1.0,
      sombras: { r: 0, g: 0, b: 0 },
      medios: { r: 0, g: 0, b: 0 },
      altas: { r: 0, g: 0, b: 0 },
    };

    aplicarEstiloAK(ctx, ancho, alto, estiloPiel, [cara]);

    // 1. El píxel de piel FUERA del contorno NO se modifica (permanece exactamente igual)
    expect(pixeles[idxFuera]).toBe(200);
    expect(pixeles[idxFuera + 1]).toBe(142);
    expect(pixeles[idxFuera + 2]).toBe(112);

    // 2. El píxel de piel DENTRO del contorno SÍ fue suavizado y promediado con su entorno
    expect(pixeles[idxDentro]).not.toBe(200);
  });
});
