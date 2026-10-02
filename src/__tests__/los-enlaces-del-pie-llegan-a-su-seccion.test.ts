/**
 * Los enlaces del pie de página apuntan a una sección que existe (2/10/2026).
 * Ojo: las secciones de la portada se nombran armando el texto (`landing-${key}` en
 * `LandingSpaContainer`), así que buscarlas como texto fijo da falsas faltas. Ya pasó.
 */
import fs from 'fs';
import path from 'path';

const leer = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8');

function idsDeLaPortada(): Set<string> {
  const archivos = ['src/app/page.tsx', ...fs.readdirSync(path.join(process.cwd(), 'src/components/landing'))
    .filter((f) => f.endsWith('.tsx')).map((f) => `src/components/landing/${f}`)];
  const ids = new Set<string>();
  for (const f of archivos) {
    const texto = leer(f);
    for (const m of texto.matchAll(/\bid="([\w-]+)"/g)) ids.add(m[1]);
    // `dashboardSection("gallery", …)` arma `id={`landing-gallery`}`.
    for (const m of texto.matchAll(/dashboardSection\(\s*"([\w-]+)"/g)) ids.add(`landing-${m[1]}`);
  }
  return ids;
}

describe('Los enlaces del pie de página llegan a su sección', () => {
  it('cada ancla del pie existe en la portada', () => {
    const ids = idsDeLaPortada();
    const anclas = [...leer('src/components/public-footer.tsx').matchAll(/handleAnchorClick\(e, '#([\w-]+)'\)/g)].map((m) => m[1]);
    expect(anclas.length).toBeGreaterThan(0);
    expect(anclas.filter((a) => !ids.has(a))).toEqual([]);
  });

  it('el control frena un ancla que no existe (se prueba rompiéndolo)', () => {
    expect(idsDeLaPortada().has('landing-gallery')).toBe(true);
    expect(idsDeLaPortada().has('landing-galeria-inventada')).toBe(false);
  });
});
