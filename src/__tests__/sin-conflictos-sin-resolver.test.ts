import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const RAIZ = process.cwd();

/**
 * Ningún archivo puede quedar con las marcas de un conflicto sin resolver.
 *
 * Pasó de verdad, tres veces en un mismo día. La peor: `apphosting.yaml`, que es la
 * configuración del servidor, quedó con las tres marcas adentro. Ese archivo lo lee
 * el servidor al publicar, así que con las marcas puestas **el próximo despliegue no
 * arrancaba**, y nada lo avisaba: compilaba, los tipos daban cero y las 2053 pruebas
 * pasaban en verde.
 *
 * También se coló en la lista de resueltos y en el archivo de puertas pendientes, que
 * es un JSON: ahí sí rompió una prueba, pero recién al abrirla.
 *
 * Por qué pasa: cuando dos ramas agregan cosas en el mismo lugar, uno resuelve el
 * choque a mano y es fácil borrar el contenido y olvidarse de las tres líneas de
 * marca, sobre todo si quedan vacías entre sí.
 *
 * Esta prueba mira **todo lo versionado**, no una lista elegida a dedo.
 */
describe('No queda ningún conflicto sin resolver', () => {
  it('ningún archivo del repositorio tiene marcas de conflicto', () => {
    const archivos = execFileSync('git', ['ls-files'], { cwd: RAIZ, encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean)
      // Este archivo habla de las marcas a propósito para explicar el problema.
      .filter((ruta) => ruta !== 'src/__tests__/sin-conflictos-sin-resolver.test.ts');

    const marcas = /^(<{7} |={7}$|>{7} )/m;
    const sucios: string[] = [];

    for (const ruta of archivos) {
      let contenido: string;
      try {
        contenido = readFileSync(join(RAIZ, ruta), 'utf-8');
      } catch {
        continue; // binarios o archivos que no se pueden leer como texto
      }
      if (marcas.test(contenido)) sucios.push(ruta);
    }

    expect(sucios).toEqual([]);
  });

  it('la configuración del servidor se puede leer entera', () => {
    // Es el archivo que más caro sale roto: si no se puede leer, no hay despliegue.
    const texto = readFileSync(join(RAIZ, 'apphosting.yaml'), 'utf-8');
    expect(texto).toMatch(/^runConfig:/m);
    expect(texto).toMatch(/^env:/m);
    expect(texto).not.toMatch(/^(<{7}|={7}$|>{7})/m);
  });
});
