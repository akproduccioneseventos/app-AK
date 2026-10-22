/** @jest-environment node */

let mockRecorto = false;

jest.mock('@/lib/entretenimiento/segmentacion-fondo', () => ({
  recortarPersonaSinTela: jest.fn(() => mockRecorto),
}));

import {
  evaluarEfectoReactivo,
  obtenerOpcionRuleta,
  puedeHacerFaceSwap,
  dibujarFiltroDeCara,
  OPCIONES_RULETA_INVITADO,
} from '@/lib/entretenimiento/filtros-cara';

function crearMockContext() {
  const ctx: any = {
    canvas: { width: 1000, height: 800 },
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    globalCompositeOperation: 'source-over',
  };
  return ctx;
}

describe('Los efectos reaccionan a la cara', () => {
  beforeEach(() => {
    mockRecorto = false;
  });

  it('con jawOpen en 0.8 sale confeti, y con 0.2 no sale', () => {
    const t0 = 100_000;
    // jawOpen = 0.8 -> sale confeti
    const conConfeti = evaluarEfectoReactivo({ jawOpen: 0.8 }, t0);
    expect(conConfeti.confetiBoca).toBe(true);

    // Pasamos 2 segundos y probamos con 0.2 -> NO sale confeti
    const sinConfeti = evaluarEfectoReactivo({ jawOpen: 0.2 }, t0 + 2000);
    expect(sinConfeti.confetiBoca).toBe(false);
  });

  it('dos bocas abiertas seguidas en menos de 1 segundo disparan un solo efecto', () => {
    const tBase = 200_000;

    // Primer disparo
    const primerDisparo = evaluarEfectoReactivo({ jawOpen: 0.9 }, tBase);
    expect(primerDisparo.confetiBoca).toBe(true);

    // Segundo disparo a los 400ms (menos de 1000ms)
    const segundoDisparo = evaluarEfectoReactivo({ jawOpen: 0.9 }, tBase + 400);
    expect(segundoDisparo.confetiBoca).toBe(false);

    // Tercer disparo a los 1200ms del primer disparo (más de 1000ms)
    const tercerDisparo = evaluarEfectoReactivo({ jawOpen: 0.9 }, tBase + 1200);
    expect(tercerDisparo.confetiBoca).toBe(true);
  });

  it('la ruleta termina en una opción de la lista', () => {
    const opcionFinal = obtenerOpcionRuleta(3500, 'Sofía'); // > 3000ms
    const opcionesValidas = [...OPCIONES_RULETA_INVITADO, 'El favorito de Sofía'];

    expect(opcionesValidas).toContain(opcionFinal);
  });

  it('el cambio de caras no se ofrece con una sola cara', () => {
    expect(puedeHacerFaceSwap(1)).toBe(false);
    expect(puedeHacerFaceSwap(3)).toBe(false);
    expect(puedeHacerFaceSwap(0)).toBe(false);
    expect(puedeHacerFaceSwap(2)).toBe(true);
  });

  it('con el recorte apagado, el efecto de atrás va encima y la imagen no se corta', () => {
    mockRecorto = false;

    const ctx = crearMockContext();
    const carasDummy: any = [{ puntos: [{ x: 500, y: 400 }] }];

    const resultado = dibujarFiltroDeCara(ctx, null as any, 'fondo_efecto', carasDummy);

    expect(resultado).toBe(true);
    // Con recorte apagado, NO se usa 'destination-over' (el efecto va encima, normal)
    expect(ctx.globalCompositeOperation).toBe('source-over');
    expect(ctx.fill).toHaveBeenCalled();
  });
});
