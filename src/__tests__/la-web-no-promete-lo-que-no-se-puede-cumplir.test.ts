import fs from 'node:fs';
import path from 'node:path';

function scanDirectory(dir: string, excludeDirs: string[] = []): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    if (excludeDirs.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanDirectory(fullPath, excludeDirs));
    } else if (/\.(tsx?|jsx?|json|md)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('Bloque 5 (Orden 96) — La web no promete lo que no se puede cumplir', () => {
  const rootDir = process.cwd();

  const publicFiles: string[] = [
    ...scanDirectory(path.join(rootDir, 'src', 'components', 'public')),
    ...scanDirectory(path.join(rootDir, 'src', 'components', 'landing')),
    ...scanDirectory(path.join(rootDir, 'src', 'data')),
    ...scanDirectory(path.join(rootDir, 'src', 'app'), ['(app)', 'api', 'actions']),
    path.join(rootDir, 'data', 'blog-posts.json'),
  ].filter((f) => fs.existsSync(f));

  test('encuentra archivos públicos para auditar', () => {
    expect(publicFiles.length).toBeGreaterThan(10);
  });

  test('no contiene garantías, 24/7, 24 hs, cero fallas ni cifras infladas en páginas públicas', () => {
    const forbiddenRegex = /garant|24\/7|24\s?hs|24\s?horas|cero fallas|\+10\s*años|\+12\s*años|\+500|100%\s*(?:de\s*)?clientes\s*satisfechos/i;

    const hallazgos: string[] = [];

    for (const filePath of publicFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Ignorar comentarios de código si los hubiera
        const trimmed = line.trim();
        if (forbiddenRegex.test(trimmed)) {
          hallazgos.push(`${path.relative(rootDir, filePath)}:${index + 1} -> ${trimmed}`);
        }
      });
    }

    expect(hallazgos).toEqual([]);
  });

  test('se pone en rojo si aparece "garantía absoluta"', () => {
    const forbiddenRegex = /garantía absoluta/i;
    expect(forbiddenRegex.test('Ofrecemos garantía absoluta')).toBe(true);

    for (const filePath of publicFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).not.toMatch(/garantía absoluta/i);
    }
  });
});
