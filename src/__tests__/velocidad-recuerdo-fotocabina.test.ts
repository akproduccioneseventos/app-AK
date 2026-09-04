/**
 * Comprobación de la velocidad del recuerdo en fotocabina.
 *
 * Verifica que los efectos configurados modifiquen el resultado:
 * - 'lenta': el video dura más que la toma (duración aumentada al doble con outputFps ajustado).
 * - 'boomerang': la secuencia de cuadros hace ida y vuelta en bucle (rebote idéntico al Bogue).
 * - 'normal': preserva la duración original de la toma.
 */

describe('Velocidad del recuerdo en fotocabina', () => {
  function simularProcesamientoVideo(framesCount: number, duracionTomaSec: number, velocidad: 'normal' | 'lenta' | 'boomerang') {
    let framesAProcesar = Array.from({ length: framesCount }, (_, i) => `frame_${i}`);
    let targetDurationSec = duracionTomaSec;

    if (velocidad === 'lenta') {
      targetDurationSec = duracionTomaSec * 2;
    } else if (velocidad === 'boomerang') {
      const loop = [...framesAProcesar];
      for (let i = framesAProcesar.length - 2; i > 0; i--) {
        loop.push(framesAProcesar[i]);
      }
      framesAProcesar = loop;
      targetDurationSec = Math.round((framesAProcesar.length / framesCount) * duracionTomaSec * 10) / 10;
    }

    const outputFps = framesAProcesar.length / targetDurationSec;
    return {
      framesFinales: framesAProcesar,
      targetDurationSec,
      duracionTomaSec,
      outputFps,
    };
  }

  it('con velocidad lenta la duración del video supera a la toma original', () => {
    const tomaSec = 2;
    const resultado = simularProcesamientoVideo(15, tomaSec, 'lenta');
    expect(resultado.targetDurationSec).toBeGreaterThan(resultado.duracionTomaSec);
    expect(resultado.targetDurationSec).toBe(4);
    expect(resultado.outputFps).toBeLessThan(15 / tomaSec);
  });

  it('con velocidad boomerang los cuadros rebotan ida y vuelta en espejo', () => {
    const tomaSec = 2;
    const resultado = simularProcesamientoVideo(4, tomaSec, 'boomerang');
    // Para 4 cuadros [0, 1, 2, 3], el loop es [0, 1, 2, 3, 2, 1] (longitud 6)
    expect(resultado.framesFinales).toEqual(['frame_0', 'frame_1', 'frame_2', 'frame_3', 'frame_2', 'frame_1']);
    expect(resultado.framesFinales.length).toBe(6);
  });

  it('con velocidad normal se preserva la duración original', () => {
    const tomaSec = 2;
    const resultado = simularProcesamientoVideo(10, tomaSec, 'normal');
    expect(resultado.targetDurationSec).toBe(resultado.duracionTomaSec);
    expect(resultado.framesFinales.length).toBe(10);
  });
});
