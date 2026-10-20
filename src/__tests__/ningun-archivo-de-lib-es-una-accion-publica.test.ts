import fs from 'fs';
import path from 'path';

/**
 * Candado nuevo (Orden 193, Bloque 1 - Pregunta 69).
 * Ningún archivo fuera de src/app/actions puede tener 'use server' al principio,
 * porque eso convierte sus funciones exportadas en endpoints públicos invocables
 * directamente desde el navegador sin pasar por las validaciones de sesión.
 */

function scanDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDir(fullPath, fileList);
      }
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('Ningún archivo de lib o ai es una acción pública', () => {
  it('no contiene "use server" en src/lib ni en src/ai', () => {
    const root = process.cwd();
    const libFiles = scanDir(path.join(root, 'src', 'lib'));
    const aiFiles = scanDir(path.join(root, 'src', 'ai'));
    const allFiles = [...libFiles, ...aiFiles];

    const violations: string[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      // Limpiar comentarios de bloque para detectar sólo directivas de servidor reales
      const codeWithoutComments = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '').trim();
      const firstLines = codeWithoutComments.split('\n').slice(0, 3).join('\n');
      if (/^['"]use server['"]/m.test(firstLines)) {
        violations.push(path.relative(root, file));
      }
    }

    expect(violations).toEqual([]);
  });
});
