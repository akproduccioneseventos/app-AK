/**
 * EL MÉTODO SE CORRIGE SOLO (pedido del dueño, 13 de octubre de 2026: "eso lo debes hacer automático
 * sin que te tenga que decir").
 *
 * Cada orden que escribe Codex (desde la 149) nace de algo que se me escapó. Si no queda la pregunta
 * del método que lo agarra, el mismo error vuelve en otro lado. Este control exige, para cada orden,
 * una línea "- Orden N → pregunta M" en docs/LO-QUE-NO-VI.md, y que la pregunta M exista en
 * docs/COMO-AUDITAR.md. Corre en la puerta: una orden nueva sin su pregunta no deja publicar.
 */
import fs from 'fs';
import path from 'path';

const raiz = process.cwd();
// Desde la 149 todas; antes, las que nombran a Codex (repaso completo del 13/10/2026).
const DESDE = 149;
const carpeta = path.join(raiz, 'docs/ordenes');

const ordenes = fs
  .readdirSync(carpeta)
  .map((f) => ({ f, m: /^(\d+)-.*\.md$/.exec(f) }))
  .filter((x): x is { f: string; m: RegExpExecArray } => Boolean(x.m))
  .filter(({ f, m }) => Number(m[1]) >= DESDE || /codex/i.test(fs.readFileSync(path.join(carpeta, f), 'utf8')))
  .map(({ m }) => Number(m[1]));

const loQueNoVi = fs.readFileSync(path.join(raiz, 'docs/LO-QUE-NO-VI.md'), 'utf8');
const metodo = fs.readFileSync(path.join(raiz, 'docs/COMO-AUDITAR.md'), 'utf8');

const mapa = new Map<number, string>();
for (const m of loQueNoVi.matchAll(/^- Orden (\d+) → (pregunta (\d+)|propia de Claude|no es un defecto)\s*$/gm)) {
  mapa.set(Number(m[1]), m[3] ?? m[2]);
}

it('hay órdenes para mirar (si no, el control no mira nada)', () => {
  expect(ordenes.length).toBeGreaterThan(60);
});

it('cada orden de Codex desde la 149 tiene su pregunta del método', () => {
  const sinPregunta = [...new Set(ordenes)].filter((n) => !mapa.has(n)).sort((a, b) => a - b);
  expect(sinPregunta).toEqual([]);
});

it('la pregunta que se nombra existe en COMO-AUDITAR.md', () => {
  // Las 1 a 16 están escritas como secciones con nombre ("La sexta pregunta…"); desde la 17, "### N.".
  const inexistentes = [...mapa.entries()]
    .filter(([, p]) => /^\d+$/.test(p) && Number(p) >= 17 && !new RegExp(`^### ${p}\\. `, 'm').test(metodo))
    .map(([n, p]) => `orden ${n} → pregunta ${p}`);
  expect(inexistentes).toEqual([]);
});
