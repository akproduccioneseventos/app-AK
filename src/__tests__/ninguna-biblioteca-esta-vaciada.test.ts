/**
 * MATAFUEGO — Una biblioteca reemplazada por una vacia pasa TODOS los controles.
 *
 * Paso el 4 de septiembre de 2026. Para que le compilara, una entrega cambio
 * `@vladmandic/face-api` -la que reconoce caras- por un archivo propio que
 * devuelve `null` siempre, y lo engancho en `next.config.js` para toda la app,
 * celular del invitado incluido.
 *
 * Resultado: compila, el revisor de tipos pasa, las pruebas dan verde, y la
 * busqueda por cara **no encuentra a nadie nunca**. En pantalla se ve
 * "no encontramos fotos tuyas": ni un error, ni un aviso. Nadie se entera.
 *
 * Este control lee la configuracion y marca en rojo cualquier biblioteca de
 * verdad -de las que estan en package.json- desviada a un archivo del proyecto.
 * Apagar una biblioteca que NO se usa sigue permitido (`'canvg': false`).
 */
import fs from 'fs';
import path from 'path';

const CONFIG = path.join(process.cwd(), 'next.config.js');
const PAQUETE = path.join(process.cwd(), 'package.json');

describe('Ninguna biblioteca instalada esta vaciada', () => {
  it('next.config.js no desvia una dependencia real a un archivo del proyecto', () => {
    const config = fs.readFileSync(CONFIG, 'utf-8');
    const { dependencies = {}, devDependencies = {} } = JSON.parse(fs.readFileSync(PAQUETE, 'utf-8'));
    const instaladas = new Set([...Object.keys(dependencies), ...Object.keys(devDependencies)]);

    // Busca lineas del tipo:  '@lo-que-sea/x': path.resolve(__dirname, 'src/lib/algo.js')
    const desvios = [...config.matchAll(/['"]([^'"]+)['"]\s*:\s*path\.resolve\(__dirname,\s*['"]([^'"]+)['"]\)/g)];

    const vaciadas = desvios
      .filter(([, biblioteca, destino]) => instaladas.has(biblioteca) && !destino.includes('node_modules'))
      .map(([, biblioteca, destino]) => `${biblioteca} -> ${destino}`);

    if (vaciadas.length > 0) {
      throw new Error(
        'Estas bibliotecas estan instaladas de verdad pero la configuracion las manda a un ' +
          'archivo del proyecto. Si ese archivo devuelve vacio, la funcion queda apagada y ' +
          'ningun otro control se entera:\n  ' + vaciadas.join('\n  ')
      );
    }
    expect(vaciadas).toEqual([]);
  });

  it('la que reconoce caras es la de verdad, no una copia hueca', () => {
    // No se importa: la version de servidor pide TensorFlow y no arranca en Jest.
    // Alcanza con mirar el paquete instalado: la de verdad pesa megas y trae las
    // redes entrenadas; una copia hueca son cuarenta lineas.
    const carpeta = path.join(process.cwd(), 'node_modules', '@vladmandic', 'face-api');
    expect(fs.existsSync(carpeta)).toBe(true);

    const bundle = path.join(carpeta, 'dist', 'face-api.esm.js');
    expect(fs.existsSync(bundle)).toBe(true);

    const contenido = fs.readFileSync(bundle, 'utf-8');
    expect(contenido.length).toBeGreaterThan(500_000);
    for (const pieza of ['faceRecognitionNet', 'tinyFaceDetector', 'euclideanDistance']) {
      expect(contenido).toContain(pieza);
    }
  });
});
