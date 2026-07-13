import fs from 'node:fs';
import path from 'node:path';

function findPageFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findPageFiles(entryPath);
    return entry.name === 'page.tsx' ? [entryPath] : [];
  });
}

describe('dynamic route parameters', () => {
  it('does not pass plain route params to React use()', () => {
    const appRoot = path.join(process.cwd(), 'src', 'app');
    const offenders = findPageFiles(appRoot)
      .filter((file) => /\[[^\]]+\]/.test(file))
      .filter((file) => /\buse\((?:props\.)?params\)/.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(process.cwd(), file));

    expect(offenders).toEqual([]);
  });
});
