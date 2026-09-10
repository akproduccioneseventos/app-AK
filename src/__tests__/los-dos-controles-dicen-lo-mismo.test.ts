/**
 * MATAFUEGO: DOS CONTROLES NO PUEDEN DECIR NUMEROS DISTINTOS DE LO MISMO.
 *
 * El 10 de septiembre de 2026 `npm run "falta?"` decia "Fotocabina: 26 de 26
 * (completo)" y `npm run ordenes?` decia "Fotocabina: 25 de 26, falta elegir la
 * impresora". Los dos leen el MISMO archivo. La diferencia: uno entendia la marca
 * `NO SE COPIA` -lo que el dueno decidio que no va- y el otro la contaba como
 * pendiente.
 *
 * Nadie lo habia notado porque cada uno se mira por separado. Y es peor que un
 * numero mal: **dos controles que se contradicen hacen dudar de los dos**, y un
 * control en el que no se confia es un control que se termina ignorando.
 *
 * Esta prueba corre los dos y compara lo que dicen. Se probo rompiendolo: sacando
 * el entendimiento de `NO SE COPIA` de cualquiera de los dos, se pone en rojo.
 */
import { execFileSync } from 'child_process';

function tallies(salida: string): Record<string, string> {
  const cuenta: Record<string, string> = {};
  for (const linea of salida.split('\n')) {
    const m = linea.match(/^\s{2,}([A-Za-zÀ-ÿ0-9 ]+?):\s+(\d+)\s+de\s+(\d+)/);
    if (m) cuenta[m[1].trim()] = `${m[2]}/${m[3]}`;
  }
  return cuenta;
}

function correr(script: string): string {
  return execFileSync('node', [script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

describe('los dos controles dicen lo mismo', () => {
  it('el rubro cuenta igual en "falta?" y en "ordenes?"', () => {
    const falta = tallies(correr('scripts/que-falta.mjs'));
    const ordenes = tallies(correr('scripts/ordenes-cumplidas.mjs'));

    const modulos = Object.keys(ordenes).filter((m) => m in falta);
    // Si esto queda vacio la prueba no probaria nada: se exige que haya modulos.
    expect(modulos.length).toBeGreaterThan(5);

    const distintos = modulos.filter((m) => falta[m] !== ordenes[m]);
    expect(distintos).toEqual([]);
  });
});
