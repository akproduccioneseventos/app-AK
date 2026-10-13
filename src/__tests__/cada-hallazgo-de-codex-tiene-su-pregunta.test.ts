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
const DESDE = 149;

const ordenes = fs
  .readdirSync(path.join(raiz, 'docs/ordenes'))
  .map((f) => /^(\d+)-.*\.md$/.exec(f))
  .filter((m): m is RegExpExecArray => Boolean(m))
  .map((m) => Number(m[1]))
  .filter((n) => n >= DESDE);

const loQueNoVi = fs.readFileSync(path.join(raiz, 'docs/LO-QUE-NO-VI.md'), 'utf8');
const metodo = fs.readFileSync(path.join(raiz, 'docs/COMO-AUDITAR.md'), 'utf8');

const mapa = new Map<number, string>();
for (const m of loQueNoVi.matchAll(/^- Orden (\d+) → (pregunta (\d+)|propia de Claude|no es un defecto)\s*$/gm)) {
  mapa.set(Number(m[1]), m[3] ?? m[2]);
}

it('hay órdenes para mirar (si no, el control no mira nada)', () => {
  expect(ordenes.length).toBeGreaterThan(10);
});

it('cada orden de Codex desde la 149 tiene su pregunta del método', () => {
  const sinPregunta = [...new Set(ordenes)].filter((n) => !mapa.has(n)).sort((a, b) => a - b);
  expect(sinPregunta).toEqual([]);
});

it('la pregunta que se nombra existe en COMO-AUDITAR.md', () => {
  const inexistentes = [...mapa.entries()]
    .filter(([, p]) => /^\d+$/.test(p) && !new RegExp(`^### ${p}\\. `, 'm').test(metodo))
    .map(([n, p]) => `orden ${n} → pregunta ${p}`);
  expect(inexistentes).toEqual([]);
});
