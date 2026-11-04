/** @jest-environment node */

/**
 * Orden 265 — El marco dinámico se anima.
 *
 * Prueba que `dibujarMarcoDinamico` utiliza `progresoAnimacion` para variar las
 * coordenadas y elementos dinámicos (confeti/brillos) en cada cuadro, garantizando
 * que la animación se reproduzca en la 360 y la fotocabina.
 */

import { dibujarMarcoDinamico } from '@/lib/entretenimiento/marcos-dinamicos';

describe('El marco se anima (Orden 265)', () => {
  function crearMockContext() {
    const arcCalls: Array<{ x: number; y: number; r: number }> = [];
    const llamadas: string[] = [];

    const ctx = {
      save: jest.fn(() => llamadas.push('save')),
      restore: jest.fn(() => llamadas.push('restore')),
      strokeRect: jest.fn((x, y, w, h) => llamadas.push(`strokeRect(${x},${y},${w},${h})`)),
      fillRect: jest.fn((x, y, w, h) => llamadas.push(`fillRect(${x},${y},${w},${h})`)),
      fillText: jest.fn((t, x, y) => llamadas.push(`fillText(${t},${x},${y})`)),
      beginPath: jest.fn(() => llamadas.push('beginPath')),
      fill: jest.fn(() => llamadas.push('fill')),
      stroke: jest.fn(() => llamadas.push('stroke')),
      arc: jest.fn((x: number, y: number, r: number) => {
        arcCalls.push({ x, y, r });
        llamadas.push(`arc(${x},${y},${r})`);
      }),
      createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: '',
      textBaseline: '',
      arcCalls,
      llamadas,
    };
    return ctx;
  }

  it('dos cuadros con distinto progresoAnimacion generan coordenadas distintas demostrando que el marco se anima', () => {
    const ctx1 = crearMockContext();
    const ctx2 = crearMockContext();

    // Invocar con progresoAnimacion: 0.1
    dibujarMarcoDinamico(ctx1 as any, 800, 600, {
      estilo: 'quince',
      nombreAgasajado: 'Martina',
      progresoAnimacion: 0.1,
    });

    // Invocar con progresoAnimacion: 0.8
    dibujarMarcoDinamico(ctx2 as any, 800, 600, {
      estilo: 'quince',
      nombreAgasajado: 'Martina',
      progresoAnimacion: 0.8,
    });

    // Se dibujó confeti animado con arc()
    expect(ctx1.arc).toHaveBeenCalled();
    expect(ctx2.arc).toHaveBeenCalled();

    // Verificamos que se hayan llamado para los 15 elementos de confeti
    expect(ctx1.arcCalls.length).toBe(15);
    expect(ctx2.arcCalls.length).toBe(15);

    // Las coordenadas generadas en ctx1 y ctx2 DEBEN ser distintas
    expect(ctx1.arcCalls).not.toEqual(ctx2.arcCalls);

    // Comprobar que las coordenadas difieren debido al factor de animación
    const difieren = ctx1.arcCalls.some(
      (c1, idx) => c1.x !== ctx2.arcCalls[idx].x || c1.y !== ctx2.arcCalls[idx].y
    );
    expect(difieren).toBe(true);

    // Y el historial de llamadas en el canvas es diferente entre cuadros
    expect(ctx1.llamadas).not.toEqual(ctx2.llamadas);
  });
});
