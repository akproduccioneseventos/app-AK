import {
  extraerDescriptorFacial,
  calcularSimilitudFacial,
} from '@/lib/reconocimiento/buscador-selfie';

describe('Buscador de fotos por selfie (Orden 31)', () => {
  it('extrae un descriptor normalizado de 64 dimensiones desde un canvas', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffccaa';
      ctx.fillRect(0, 0, 100, 100);
    }

    const descriptor = extraerDescriptorFacial(canvas);
    expect(descriptor).toHaveLength(64);
    expect(descriptor.every((v) => typeof v === 'number' && !isNaN(v))).toBe(true);
  });

  it('calcula la similitud de coseno correctamente entre descriptores', () => {
    const vecA = [0.5, 0.5, 0.5, 0.5];
    const vecB = [0.5, 0.5, 0.5, 0.5];
    const vecC = [1, 0, 0, 0];
    const vecD = [0, 1, 0, 0];

    // Mismo vector -> similitud 1.0
    expect(calcularSimilitudFacial(vecA, vecB)).toBeCloseTo(1.0, 4);

    // Vectores ortogonales -> similitud 0
    expect(calcularSimilitudFacial(vecC, vecD)).toBe(0);
  });
});
