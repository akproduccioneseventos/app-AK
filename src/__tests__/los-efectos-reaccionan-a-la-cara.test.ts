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
  const eventos: any[] = [];
  const ctx: any = {
    canvas: { width: 1000, height: 800 },
    eventos,
    save: jest.fn(() => eventos.push(['save'])),
    restore: jest.fn(() => eventos.push(['restore'])),
    translate: jest.fn((x: number, y: number) => eventos.push(['translate', x, y])),
    rotate: jest.fn((a: number) => eventos.push(['rotate', a])),
    scale: jest.fn((sx: number, sy: number) => eventos.push(['scale', sx, sy])),
    beginPath: jest.fn(() => eventos.push(['beginPath'])),
    closePath: jest.fn(() => eventos.push(['closePath'])),
    moveTo: jest.fn((x: number, y: number) => eventos.push(['moveTo', x, y])),
    lineTo: jest.fn((x: number, y: number) => eventos.push(['lineTo', x, y])),
    arc: jest.fn((...args: any[]) => eventos.push(['arc', ...args])),
    ellipse: jest.fn((...args: any[]) => eventos.push(['ellipse', ...args])),
    fill: jest.fn(() => eventos.push(['fill'])),
    stroke: jest.fn(() => eventos.push(['stroke'])),
    fillRect: jest.fn((...args: any[]) => eventos.push(['fillRect', ...args])),
    strokeRect: jest.fn((...args: any[]) => eventos.push(['strokeRect', ...args])),
    fillText: jest.fn((...args: any[]) => eventos.push(['fillText', ...args])),
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

  it('la ruleta termina en una opción de la lista y queda fija después de los 3 segundos', () => {
    const opcionFinal = obtenerOpcionRuleta(3500, 'Sofía'); // > 3000ms
    const opcionesValidas = [...OPCIONES_RULETA_INVITADO, 'El favorito de Sofía'];

    expect(opcionesValidas).toContain(opcionFinal);

    const resultadosFijos = [3100, 6100, 9100].map((t) => obtenerOpcionRuleta(t, 'QA'));
    expect(new Set(resultadosFijos).size).toBe(1);
  });

  it('el guiño y las cejas levantadas modifican el dibujo activo del lienzo', () => {
    const puntos = [
      { x: 0.5, y: 0.2 },
      { x: 0.4, y: 0.4 },
      { x: 0.6, y: 0.4 },
      { x: 0.5, y: 0.8 },
    ];

    const ctxNeutral = crearMockContext();
    dibujarFiltroDeCara(ctxNeutral, {} as any, 'mis15', [{ puntos, blendshapes: {} }], {
      nombreAgasajado: 'QA',
      timestampMs: 4000,
    });

    const ctxGuino = crearMockContext();
    dibujarFiltroDeCara(
      ctxGuino,
      {} as any,
      'mis15',
      [{ puntos, blendshapes: { eyeBlinkLeft: 0.8, eyeBlinkRight: 0.1 } }],
      { nombreAgasajado: 'QA', timestampMs: 4000 }
    );

    const ctxCejas1 = crearMockContext();
    dibujarFiltroDeCara(
      ctxCejas1,
      {} as any,
      'mis15',
      [{ puntos, blendshapes: { browInnerUp: 0.8 } }],
      { nombreAgasajado: 'QA', timestampMs: 4000 }
    );

    const ctxCejas2 = crearMockContext();
    dibujarFiltroDeCara(
      ctxCejas2,
      {} as any,
      'mis15',
      [{ puntos, blendshapes: { browInnerUp: 0.8 } }],
      { nombreAgasajado: 'QA', timestampMs: 4016 }
    );

    expect(JSON.stringify(ctxGuino.eventos)).not.toBe(JSON.stringify(ctxNeutral.eventos));
    expect(JSON.stringify(ctxCejas1.eventos)).not.toBe(JSON.stringify(ctxNeutral.eventos));
    // Mantener las cejas levantadas no cambia de nuevo el filtro en el siguiente cuadro
    expect(JSON.stringify(ctxCejas2.eventos)).toBe(JSON.stringify(ctxCejas1.eventos));
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
