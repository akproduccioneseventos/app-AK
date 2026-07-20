import { readFileSync } from 'fs';
import { join } from 'path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('company data atomic writes', () => {
  it.each([
    ['providers', 'src/app/actions/proveedores.ts'],
    ['fixed assets', 'src/app/actions/activos-fijos.ts'],
    ['employees', 'src/app/actions/empleados.ts'],
  ])('persists %s as individual Firestore documents', (_label, relativePath) => {
    const source = read(relativePath);

    expect(source).toContain('createDataItem');
    expect(source).toContain('updateDataItem');
    expect(source).toContain('deleteDataItem');
    expect(source).not.toMatch(/\bwriteData\s*\(/);
  });
});
