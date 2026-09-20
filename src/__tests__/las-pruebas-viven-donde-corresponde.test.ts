/**
 * MATAFUEGO — Una prueba de Jest guardada entre las de navegador no la corre nadie,
 * y encima tumba a las demas.
 *
 * Paso el 4 de septiembre de 2026: `la-fotocabina-imprime-lo-que-se-pide.spec.ts`
 * estaba en tests/e2e/ escrita con Jest (`beforeAll`, `jest.fn()`). Jest ignora esa
 * carpeta a proposito, asi que la prueba **nunca corrio**. Y Playwright, al cargarla,
 * se caia antes de empezar y **se llevaba puesta la tanda entera de cuatro archivos**
 * sin registrar ni una prueba: la puerta decia "fallo" sin decir por que.
 *
 * Este control lee las pruebas de navegador y marca en rojo cualquiera que este
 * escrita con Jest.
 */
import fs from 'fs';
import path from 'path';

const CARPETA_E2E = path.join(process.cwd(), 'tests', 'e2e');

/** Cosas que solo existen en Jest. Playwright escribe test.beforeAll, no beforeAll. */
const SENALES_DE_JEST: Array<{ patron: RegExp; que: string }> = [
  { patron: /(^|[^.\w])jest\s*\./m, que: 'jest.fn / jest.mock / jest.spyOn' },
  { patron: /^\s*beforeAll\s*\(/m, que: 'beforeAll suelto (en Playwright es test.beforeAll)' },
  { patron: /^\s*afterAll\s*\(/m, que: 'afterAll suelto (en Playwright es test.afterAll)' },
  { patron: /^\s*beforeEach\s*\(/m, que: 'beforeEach suelto (en Playwright es test.beforeEach)' },
  { patron: /^\s*describe\s*\(/m, que: 'describe suelto (en Playwright es test.describe)' },
  { patron: /^\s*it\s*\(/m, que: 'it( suelto (en Playwright se usa test()' },
];

function archivosDePruebaDeNavegador(carpeta: string): string[] {
  if (!fs.existsSync(carpeta)) return [];
  return fs
    .readdirSync(carpeta, { withFileTypes: true })
    .flatMap((entrada) => {
      const completo = path.join(carpeta, entrada.name);
      if (entrada.isDirectory()) return archivosDePruebaDeNavegador(completo);
      return entrada.name.endsWith('.spec.ts') ? [completo] : [];
    });
}

describe('Las pruebas viven donde corresponde', () => {
  it('ninguna prueba de tests/e2e esta escrita con Jest', () => {
    const problemas: string[] = [];

    for (const archivo of archivosDePruebaDeNavegador(CARPETA_E2E)) {
      const contenido = fs.readFileSync(archivo, 'utf-8');
      for (const { patron, que } of SENALES_DE_JEST) {
        if (patron.test(contenido)) {
          problemas.push(`${path.relative(process.cwd(), archivo)} usa ${que}`);
        }
      }
    }

    if (problemas.length > 0) {
      throw new Error(
        'Estas pruebas estan en tests/e2e pero escritas con Jest: no las corre nadie y ' +
          'ademas tumban la tanda de Playwright entera. Moverlas a src/__tests__/ con ' +
          'extension .test.ts.\n  ' + problemas.join('\n  ')
      );
    }
    expect(problemas).toEqual([]);
  });

  /**
   * Segunda forma del mismo desastre, y paso el 20 de septiembre de 2026:
   * `la-lista-de-regalos-queda-como-la-dejaron.spec.ts` importaba una accion del
   * servidor (`src/app/actions/fiesta/regalos.actions.ts`) para llamarla directo.
   * Toda accion del servidor arrastra `server-only`, que revienta al cargarse fuera
   * de Next. El archivo no cargaba y la tanda entera de ocho archivos termino
   * "sin registrar ninguna prueba". Se veia igual que un fallo del codigo y no lo era.
   *
   * Las pruebas de navegador entran por la pantalla. Lo que hay que probar llamando
   * a una accion del servidor va a una prueba de Jest, en src/__tests__/.
   */
  it('ninguna prueba de navegador importa una accion del servidor', () => {
    const problemas: string[] = [];
    // import ... from '.../app/actions/...' (el `import type` no trae codigo y no molesta)
    const IMPORTA_UNA_ACCION = /^\s*import\s+(?!type\b)[^;]*?from\s+['"][^'"]*app\/actions\/[^'"]*['"]/gm;

    for (const archivo of archivosDePruebaDeNavegador(CARPETA_E2E)) {
      const contenido = fs.readFileSync(archivo, 'utf-8');
      const encontrados = contenido.match(IMPORTA_UNA_ACCION);
      if (encontrados) {
        problemas.push(`${path.relative(process.cwd(), archivo)}: ${encontrados[0].trim()}`);
      }
    }

    if (problemas.length > 0) {
      throw new Error(
        'Estas pruebas de navegador importan una accion del servidor. La accion trae ' +
          '"server-only", el archivo no carga y se lleva puesta la tanda entera sin ' +
          'registrar ninguna prueba. Moverlo a una prueba de Jest en src/__tests__/.\n  ' +
          problemas.join('\n  ')
      );
    }
    expect(problemas).toEqual([]);
  });

  it('la carpeta de pruebas de navegador no quedo vacia (si no, este control no mira nada)', () => {
    expect(archivosDePruebaDeNavegador(CARPETA_E2E).length).toBeGreaterThan(10);
  });
});
