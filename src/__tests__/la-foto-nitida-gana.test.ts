import { calcularNitidez, evaluarFoto, calcularOjosAbiertos } from '@/lib/album/elegir-las-mejores';

describe('la foto nitida gana contra la movida (Orden 40)', () => {
  it('una foto nitida con bordes marcados saca mas nota que una borrosa', () => {
    // Foto nitida: patron alternado de alto contraste (blanco y negro)
    const nitida = new Uint8ClampedArray(10 * 10 * 4);
    for (let i = 0; i < nitida.length; i += 8) {
      nitida[i] = 255; nitida[i + 1] = 255; nitida[i + 2] = 255; nitida[i + 3] = 255;
      nitida[i + 4] = 0; nitida[i + 5] = 0; nitida[i + 6] = 0; nitida[i + 7] = 255;
    }
    const nitidezNitida = calcularNitidez(nitida, 10, 10);

    // Foto borrosa / movida: valores planos sin gradiente
    const borrosa = new Uint8ClampedArray(10 * 10 * 4);
    for (let i = 0; i < borrosa.length; i += 4) {
      borrosa[i] = 128; borrosa[i + 1] = 128; borrosa[i + 2] = 128; borrosa[i + 3] = 255;
    }
    const nitidezBorrosa = calcularNitidez(borrosa, 10, 10);

    expect(nitidezNitida).toBeGreaterThan(nitidezBorrosa);
    const evaluacionNitida = evaluarFoto({ nitidez: nitidezNitida, ojosAbiertos: true });
    const evaluacionBorrosa = evaluarFoto({ nitidez: nitidezBorrosa, ojosAbiertos: true });
    expect(evaluacionNitida.nota).toBeGreaterThan(evaluacionBorrosa.nota);
  });

  it('ojos abiertos suma mas puntaje que ojos cerrados', () => {
    const conOjosAbiertos = evaluarFoto({ nitidez: 80, ojosAbiertos: true });
    const conOjosCerrados = evaluarFoto({ nitidez: 80, ojosAbiertos: false });
    expect(conOjosAbiertos.nota).toBeGreaterThan(conOjosCerrados.nota);
  });
});


