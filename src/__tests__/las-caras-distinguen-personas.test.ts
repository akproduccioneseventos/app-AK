import fs from 'node:fs';
import path from 'node:path';
import { distancia, DISTANCIA_SEGURA, DISTANCIA_DUDOSA } from '@/lib/caras/agrupar-caras';

/**
 * Que los numeros de una cara distingan personas, y no midan la luz.
 *
 * **ESTA PRUEBA EXISTE POR UNA ENTREGA QUE SE FRENO EL 3 DE SEPTIEMBRE DE 2026.**
 * El preparador guardaba, como "la cara de una persona", el **brillo promedio
 * de 128 franjas de la foto**. Eso describe como esta iluminada la foto, no
 * quien sale en ella. En una fiesta significaba que **dos personas distintas
 * sacadas con la misma luz daban casi el mismo numero**, y a un invitado le
 * podian aparecer -y bajar- las fotos de otro. Con caras de menores, eso no se
 * entrega.
 *
 * Se comprueban dos cosas, y las dos son necesarias:
 *
 * 1. **Que el metodo sea el correcto.** Que se usen los 128 numeros de
 *    `faceRecognitionNet` y no una cuenta de brillo. Se mira el codigo porque
 *    el modelo no corre en estas pruebas -necesita un navegador-.
 * 2. **Que la cuenta que decide sea la correcta.** Con numeros de la misma
 *    persona la distancia queda por debajo del corte, y con los de otra persona
 *    por encima.
 */

const PREPARADOR = path.join(
  process.cwd(),
  'src/components/social-gallery/PrepararGrillaDeCara.tsx',
);

describe('los numeros de la cara identifican a la persona', () => {
  const codigo = fs.readFileSync(PREPARADOR, 'utf8');

  it('usa el modelo que reconoce personas, no uno que solo encuentra caras', () => {
    // `faceRecognitionNet` es el que devuelve los 128 numeros que identifican.
    // Un detector a secas solo dice DONDE hay una cara, no de quien es.
    expect(codigo).toContain('faceRecognitionNet');
    expect(codigo).toContain('withFaceDescriptor');
  });

  it('NO vuelve a medir el brillo de la foto', () => {
    // La cuenta vieja: 0.299*R + 0.587*G + 0.114*B, el brillo de un pixel.
    expect(codigo).not.toMatch(/0\.299\s*\*/);
    expect(codigo).not.toMatch(/getImageData\s*\(/);
  });

  it('no depende del detector del navegador, que no existe en iPhone ni Firefox', () => {
    expect(codigo).not.toContain("'FaceDetector' in window");
  });

  it('los modelos salen de nuestro servidor: no se paga por foto ni salen las caras', () => {
    expect(codigo).toContain('/models/caras');
    // Si alguien apunta a un servicio de afuera, esto se pone en rojo.
    expect(codigo).not.toMatch(/loadFromUri\(\s*['"`]https?:/);
  });

  it('si no encuentra una cara saltea la foto, en vez de guardar cualquier cosa', () => {
    expect(codigo).toMatch(/if\s*\(!deteccion\?\.descriptor\)\s*return null/);
  });
});

describe('la cuenta que decide de quien es cada foto', () => {
  /** Dos tomas de la misma persona: parecidas, no identicas. */
  const ana1 = Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.7) * 0.1);
  const ana2 = ana1.map((v, i) => v + Math.sin(i * 13) * 0.008);
  /** Otra persona. */
  const beto = Array.from({ length: 128 }, (_, i) => Math.cos(i * 1.9) * 0.1);

  it('dos tomas de la misma persona quedan del lado seguro', () => {
    expect(distancia(ana1, ana2)).toBeLessThan(DISTANCIA_SEGURA);
  });

  it('la foto de otra persona queda afuera, ni siquiera entre las dudosas', () => {
    expect(distancia(ana1, beto)).toBeGreaterThan(DISTANCIA_DUDOSA);
  });
});
