/**
 * MATAFUEGO — Un informe de afuera no se pasa a una orden sin buscar sus formas en toda la app.
 *
 * Pasó el 12/11/2026 (y antes, con Codex): llegó el informe del auditor externo, se escribió la orden
 * con los once casos y las otras formas se dieron por "conocidas" sin buscarlas. El dueño lo tuvo que
 * pedir; el barrido encontró unas 15 pantallas más con el mismo defecto.
 *
 * Desde la orden 285, toda orden que sale de un informe (auditor, auditoría, Codex, revisión, informe,
 * devolución con hallazgos) tiene que traer:
 *  - una sección "## ... Barrido en toda la app ..." con lo que salió, y
 *  - su entrada `orden-N` en `hallazgos` de docs/barridos.json.
 * Sin las dos, no se publica.
 */
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'docs', 'ordenes');
const DESDE = 285;
const VIENE_DE_UN_INFORME = /auditor|auditor[ií]a|codex|informe|revisi[oó]n externa/i;

export function ordenesSinBarrido(
  ordenes: Array<{ numero: number; texto: string }>,
  hallazgos: Record<string, unknown>,
): string[] {
  const faltan: string[] = [];
  for (const { numero, texto } of ordenes) {
    if (numero < DESDE) continue;
    const titulo = texto.split('\n')[0] || '';
    if (!VIENE_DE_UN_INFORME.test(titulo)) continue;
    const tieneSeccion = /^##\s.*barrido en toda la app/im.test(texto);
    const tieneRegistro = Boolean(hallazgos[`orden-${numero}`]);
    if (!tieneSeccion) faltan.push(`Orden ${numero}: falta la sección "## Barrido en toda la app"`);
    if (!tieneRegistro) faltan.push(`Orden ${numero}: falta "orden-${numero}" en hallazgos de docs/barridos.json`);
  }
  return faltan;
}

describe('Cada informe de afuera trae su barrido en toda la app', () => {
  it('las órdenes que salen de un informe tienen su barrido escrito y registrado', () => {
    const ordenes = fs
      .readdirSync(DIR)
      .filter((f) => /^\d+-.*\.md$/.test(f))
      .map((f) => ({ numero: Number(f.split('-')[0]), texto: fs.readFileSync(path.join(DIR, f), 'utf8') }));
    const barridos = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs', 'barridos.json'), 'utf8'));
    expect(ordenesSinBarrido(ordenes, barridos.hallazgos || {})).toEqual([]);
  });

  it('frena una orden de informe sin barrido (comprobado en rojo)', () => {
    const faltan = ordenesSinBarrido(
      [{ numero: 999, texto: '# Orden 999 — Lo que encontró el auditor\n\n## Bloque 1 — algo\n' }],
      {},
    );
    expect(faltan).toHaveLength(2);
  });

  it('no le pide barrido a una orden que no sale de un informe', () => {
    expect(ordenesSinBarrido([{ numero: 999, texto: '# Orden 999 — La app simple\n' }], {})).toEqual([]);
  });
});
