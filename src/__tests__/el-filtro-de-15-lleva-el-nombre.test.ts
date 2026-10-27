/** @jest-environment node */

import { dibujarFiltroDeCara, CaraDetectada } from '@/lib/entretenimiento/filtros-cara';

function crearMockContext() {
  const llamadasFillText: string[] = [];
  const ctx: any = {
    canvas: { width: 1000, height: 800 },
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    arc: jest.fn(),
    fillText: jest.fn((texto: string) => {
      llamadasFillText.push(texto);
    }),
    llamadasFillText,
  };
  return ctx;
}

function crearCara(): CaraDetectada {
  const puntos: any[] = [];
  for (let i = 0; i < 300; i++) {
    puntos.push({ x: 500, y: 400 });
  }
  puntos[10] = { x: 500, y: 340 };
  puntos[33] = { x: 450, y: 400 };
  puntos[263] = { x: 550, y: 400 };
  puntos[152] = { x: 500, y: 460 };
  return { puntos };
}

describe('El filtro de 15 lleva el nombre', () => {
  it('escribe el nombreAgasajado de la fiesta', () => {
    const ctx = crearMockContext();
    const cara = crearCara();

    dibujarFiltroDeCara(ctx, null as any, 'mis15', [cara], {
      nombreAgasajado: 'Martina',
    });

    const textoDibujado = ctx.llamadasFillText.find((t: string) => t.includes('Martina'));
    expect(textoDibujado).toBeDefined();
    expect(textoDibujado).toContain('Martina • XV');
  });

  it('sin nombre no escribe "undefined" ni deja la cinta vacía', () => {
    const ctx = crearMockContext();
    const cara = crearCara();

    dibujarFiltroDeCara(ctx, null as any, 'mis15', [cara], {
      nombreAgasajado: undefined,
    });

    // Verificamos que se haya escrito algo en la cinta
    expect(ctx.llamadasFillText.length).toBeGreaterThan(0);
    const textoCinta = ctx.llamadasFillText[0];

    expect(textoCinta).not.toContain('undefined');
    expect(textoCinta.trim().length).toBeGreaterThan(0);
    expect(textoCinta).toMatch(/15|XV/i);
  });
});
