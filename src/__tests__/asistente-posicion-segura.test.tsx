import { elegirPosicionAsistente } from '@/lib/assistant/posicion-segura';

describe('elegirPosicionAsistente', () => {
  const viewport = { width: 1280, height: 800 };
  const size = { width: 250, height: 80 };

  it('conserva la preferencia si no tapa controles', () => {
    expect(elegirPosicionAsistente(viewport, size, { bottom: 160, right: 16 }, [])).toEqual({
      bottom: 160,
      right: 16,
    });
  });

  it('elige una posición libre cercana cuando la preferida cubre un control', () => {
    const preferida = { bottom: 160, right: 16 };
    const control = { top: 620, right: 1260, bottom: 660, left: 1100 };
    const elegida = elegirPosicionAsistente(viewport, size, preferida, [control]);

    expect(elegida).not.toEqual(preferida);
    expect(elegida.bottom).toBeGreaterThan(preferida.bottom);
  });

  it('mantiene la preferencia acotada si no existe una alternativa libre', () => {
    const controles = [{ top: 0, right: 1280, bottom: 800, left: 0 }];
    expect(elegirPosicionAsistente(viewport, size, { bottom: 160, right: 16 }, controles))
      .toEqual({ bottom: 160, right: 16 });
  });
});
