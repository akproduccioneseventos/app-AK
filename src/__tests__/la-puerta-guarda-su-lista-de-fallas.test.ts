/**
 * 25/11/2026: correr una prueba suelta para arreglarla pisaba la lista de fallas del corredor,
 * y la puerta siguiente volvia a correr las 203 pruebas (85 minutos). La puerta guarda su
 * propia lista en el avance y repite solo esos archivos.
 */
import { readFileSync } from 'node:fs';

const puerta = readFileSync('scripts/se-puede-publicar.mjs', 'utf8');

describe('la puerta guarda su propia lista de lo que fallo', () => {
  it('al fallar anota los archivos en su avance', () => {
    expect(puerta).toMatch(/fallo: true, archivosQueFallaron: leerFallasAnotadas\(\)/);
  });
  it('para repetir usa primero su lista y corre solo esos archivos', () => {
    expect(puerta).toMatch(/anterior\?\.archivosQueFallaron/);
    expect(puerta).toMatch(/run-playwright-production\.mjs \$\{fallasDeLaPuerta\(anterior\)/);
    expect(puerta).not.toMatch(/soloLoQueFallo \? 'npm run otravez'/);
  });
});
