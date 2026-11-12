/**
 * Orden del dueño, 12/11/2026: "todos los errores tienen que crear preguntas nuevas y automáticas, y escaneos
 * automáticos". Desde la pregunta 117, cada pregunta de docs/COMO-AUDITAR.md tiene que tener su escaneo en
 * scripts/las-formas-que-mienten.mjs (que corre en cada publicación y frena lo que cambió), o figurar en
 * PREGUNTAS_QUE_NO_SE_PUEDEN_ESCANEAR con el control que la cubre.
 */
import fs from 'fs';
import path from 'path';

const PRIMERA = 117;

export function preguntasSinEscaneo(metodo: string, script: string): number[] {
  const preguntas = [...metodo.matchAll(/^###\s+(\d+)\./gm)].map((m) => Number(m[1])).filter((n) => n >= PRIMERA);
  const escaneadas = new Set([...script.matchAll(/^\s*pregunta:\s*(\d+),/gm)].map((m) => Number(m[1])));
  const bloque = script.slice(script.indexOf('PREGUNTAS_QUE_NO_SE_PUEDEN_ESCANEAR'));
  const declaradas = new Set([...bloque.matchAll(/^\s*(\d+):\s*'[^']{20,}'/gm)].map((m) => Number(m[1])));
  return preguntas.filter((n) => !escaneadas.has(n) && !declaradas.has(n));
}

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

describe('Cada pregunta nueva del método tiene su escaneo automático', () => {
  it('ninguna pregunta desde la 117 queda sin escaneo ni control declarado', () => {
    expect(preguntasSinEscaneo(leer('docs/COMO-AUDITAR.md'), leer('scripts/las-formas-que-mienten.mjs'))).toEqual([]);
  });

  it('una pregunta nueva sin escaneo se detecta (el control frena de verdad)', () => {
    const metodo = leer('docs/COMO-AUDITAR.md') + '\n### 999. Pregunta de prueba sin escaneo\n';
    expect(preguntasSinEscaneo(metodo, leer('scripts/las-formas-que-mienten.mjs'))).toEqual([999]);
  });

  it('las expresiones de los escaneos nuevos encuentran el caso real del que salieron', () => {
    const script = leer('scripts/las-formas-que-mienten.mjs');
    const casos: Record<number, string> = {
      88: "const v = new Date().toISOString().substring(0, 16);",
      121: "'Hola [NOMBRE], tu fiesta'",
      124: "const r = await withTimeout(repairVerifiedBudgetDates(), 30000, 'x');",
      128: "isCeliac: submission.dietaryRestriction === 'Celiaco' || inv.isCeliac,",
    };
    for (const [n, ejemplo] of Object.entries(casos)) {
      const trozo = script.slice(script.indexOf(`pregunta: ${n},`));
      const fuente = /buscar:\s*\/(.+)\/g,/.exec(trozo)![1];
      expect(new RegExp(fuente).test(ejemplo)).toBe(true);
    }
  });
});
