/** @jest-environment node */

import { dibujarFiltroDeCara, CaraDetectada } from '@/lib/entretenimiento/filtros-cara';

function crearMockContext() {
  const llamadas: { metodo: string; args: any[] }[] = [];
  const ctx: any = {
    canvas: { width: 1000, height: 800 },
    save: jest.fn(() => llamadas.push({ metodo: 'save', args: [] })),
    restore: jest.fn(() => llamadas.push({ metodo: 'restore', args: [] })),
    translate: jest.fn((x: number, y: number) => llamadas.push({ metodo: 'translate', args: [x, y] })),
    rotate: jest.fn((angle: number) => llamadas.push({ metodo: 'rotate', args: [angle] })),
    scale: jest.fn((sx: number, sy: number) => llamadas.push({ metodo: 'scale', args: [sx, sy] })),
    beginPath: jest.fn(() => llamadas.push({ metodo: 'beginPath', args: [] })),
    moveTo: jest.fn((x: number, y: number) => llamadas.push({ metodo: 'moveTo', args: [x, y] })),
    lineTo: jest.fn((x: number, y: number) => llamadas.push({ metodo: 'lineTo', args: [x, y] })),
    closePath: jest.fn(() => llamadas.push({ metodo: 'closePath', args: [] })),
    fill: jest.fn(() => llamadas.push({ metodo: 'fill', args: [] })),
    stroke: jest.fn(() => llamadas.push({ metodo: 'stroke', args: [] })),
    fillRect: jest.fn((...args: any[]) => llamadas.push({ metodo: 'fillRect', args })),
    strokeRect: jest.fn((...args: any[]) => llamadas.push({ metodo: 'strokeRect', args })),
    fillText: jest.fn((...args: any[]) => llamadas.push({ metodo: 'fillText', args })),
    arc: jest.fn((...args: any[]) => llamadas.push({ metodo: 'arc', args })),
    llamadas,
  };
  return ctx;
}

function crearCara(centroX: number, centroY: number, inclinacionRadianes = 0): CaraDetectada {
  const radioOjos = 50;
  const ojoIzqX = centroX - Math.cos(inclinacionRadianes) * radioOjos;
  const ojoIzqY = centroY - Math.sin(inclinacionRadianes) * radioOjos;
  const ojoDerX = centroX + Math.cos(inclinacionRadianes) * radioOjos;
  const ojoDerY = centroY + Math.sin(inclinacionRadianes) * radioOjos;

  // 10: frente, 33: ojoIzq, 263: ojoDer, 152: barbilla
  const puntos: any[] = [];
  for (let i = 0; i < 300; i++) {
    puntos.push({ x: centroX, y: centroY });
  }
  puntos[10] = { x: centroX, y: centroY - 60 };
  puntos[33] = { x: ojoIzqX, y: ojoIzqY };
  puntos[263] = { x: ojoDerX, y: ojoDerY };
  puntos[152] = { x: centroX, y: centroY + 60 };

  return { puntos };
}

describe('Los filtros siguen la cara', () => {
  it('con la cara a la izquierda, la corona se dibuja a la izquierda; corrida a la derecha, la corona va a la derecha', () => {
    // 1. Cara a la izquierda (x = 250)
    const ctxIzq = crearMockContext();
    const caraIzq = crearCara(250, 400);
    dibujarFiltroDeCara(ctxIzq, null as any, 'mis15', [caraIzq]);

    const translateIzq = ctxIzq.llamadas.find(ll => ll.metodo === 'translate');
    expect(translateIzq).toBeDefined();
    expect(translateIzq?.args[0]).toBeCloseTo(250, -1);

    // 2. Cara a la derecha (x = 750)
    const ctxDer = crearMockContext();
    const caraDer = crearCara(750, 400);
    dibujarFiltroDeCara(ctxDer, null as any, 'mis15', [caraDer]);

    const translateDer = ctxDer.llamadas.find(ll => ll.metodo === 'translate');
    expect(translateDer).toBeDefined();
    expect(translateDer?.args[0]).toBeCloseTo(750, -1);

    expect(translateDer!.args[0]).toBeGreaterThan(translateIzq!.args[0]);
  });

  it('con la cabeza inclinada 20°, el dibujo sale inclinado', () => {
    const ctx = crearMockContext();
    const angulo20Grados = (20 * Math.PI) / 180; // ~0.349 rad
    const caraInclinada = crearCara(500, 400, angulo20Grados);

    dibujarFiltroDeCara(ctx, null as any, 'mis15', [caraInclinada]);

    const llamadaRotate = ctx.llamadas.find(ll => ll.metodo === 'rotate');
    expect(llamadaRotate).toBeDefined();
    expect(llamadaRotate?.args[0]).toBeCloseTo(angulo20Grados, 2);
  });

  it('con dos caras, dos coronas', () => {
    const ctx = crearMockContext();
    const cara1 = crearCara(300, 400);
    const cara2 = crearCara(700, 400);

    dibujarFiltroDeCara(ctx, null as any, 'mis15', [cara1, cara2]);

    const saves = ctx.llamadas.filter(ll => ll.metodo === 'save');
    const translates = ctx.llamadas.filter(ll => ll.metodo === 'translate');

    // Se procesan las 2 caras
    expect(translates.length).toBeGreaterThanOrEqual(2);
    expect(saves.length).toBeGreaterThanOrEqual(2);
  });

  it('sin caras, el lienzo queda idéntico al original', () => {
    const ctx = crearMockContext();

    const resultado = dibujarFiltroDeCara(ctx, null as any, 'mis15', []);

    expect(resultado).toBe(false);
    // Ningún dibujo fue realizado en el contexto
    expect(ctx.llamadas.length).toBe(0);
  });
});
