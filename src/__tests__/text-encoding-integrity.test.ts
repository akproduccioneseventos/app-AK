import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED_FILES = new Set([
  'src/app/(app)/settings/datos/page.tsx',
]);

function findSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return findSourceFiles(entryPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

describe('text encoding integrity', () => {
  it('does not ship common UTF-8 mojibake sequences', () => {
    const offenders: string[] = [];

    for (const filePath of findSourceFiles(join(process.cwd(), 'src'))) {
      const relativePath = filePath.slice(process.cwd().length + 1).replaceAll('\\', '/');
      if (relativePath.startsWith('src/__tests__/')) continue;
      if (ALLOWED_FILES.has(relativePath)) continue;

      const source = readFileSync(filePath, 'utf8');
      if (/[ÃÂ]|â(?:€|™|œ|ž|€¦)|ðŸ/.test(source)) offenders.push(relativePath);
    }

    expect(offenders).toEqual([]);
  });
});
