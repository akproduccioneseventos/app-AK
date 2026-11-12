import fs from 'node:fs';
import path from 'node:path';
import { AK_INSTAGRAM_HANDLE, AK_SOCIAL_LINKS } from '@/lib/public-contact';
import { normalizeSocialHandle, buildInstagramUrl } from '@/lib/barra-tecnologica';

describe('Las estaciones muestran el Instagram de AK (Orden 277 — Bloque 11)', () => {
  it('AK_INSTAGRAM_HANDLE es @akproduccionesfiestasyeventos y coincide con la URL oficial', () => {
    expect(AK_INSTAGRAM_HANDLE).toBe('@akproduccionesfiestasyeventos');
    expect(AK_SOCIAL_LINKS.instagram).toBe('https://www.instagram.com/akproduccionesfiestasyeventos/');
  });

  it('sin instagramHandle en la fiesta, la barra y el muro muestran @akproduccionesfiestasyeventos', () => {
    expect(normalizeSocialHandle(undefined)).toBe('akproduccionesfiestasyeventos');
    expect(normalizeSocialHandle('')).toBe('akproduccionesfiestasyeventos');
    expect(buildInstagramUrl(undefined)).toBe('https://www.instagram.com/akproduccionesfiestasyeventos/');
    expect(buildInstagramUrl('')).toBe('https://www.instagram.com/akproduccionesfiestasyeventos/');
  });

  it('con un instagramHandle cargado, las funciones respetan ese handle', () => {
    expect(normalizeSocialHandle('@mis15valen')).toBe('mis15valen');
    expect(normalizeSocialHandle('https://www.instagram.com/mis15valen/')).toBe('mis15valen');
    expect(buildInstagramUrl('@mis15valen')).toBe('https://www.instagram.com/mis15valen/');
  });

  it('en src/app y src/lib no queda @akproduccioneseventos ni \'@akproducciones\' como respaldo', () => {
    const rootDir = process.cwd();
    const directoriesToCheck = [
      path.join(rootDir, 'src', 'app'),
      path.join(rootDir, 'src', 'lib'),
    ];

    function collectSourceFiles(dir: string): string[] {
      const results: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
            results.push(...collectSourceFiles(fullPath));
          }
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const files = directoriesToCheck.flatMap(collectSourceFiles);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toContain('@akproduccioneseventos');
      expect(content).not.toContain("'@akproducciones'");
      expect(content).not.toContain('"@akproducciones"');
    }
  });

  it('la barra tecnológica y el muro en vivo usan AK_INSTAGRAM_HANDLE en su código fuente', () => {
    const rootDir = process.cwd();
    const barraPage = fs.readFileSync(path.join(rootDir, 'src/app/evento/barra/[fiestaId]/page.tsx'), 'utf8');
    const muroPage = fs.readFileSync(path.join(rootDir, 'src/app/evento/muro-en-vivo/[fiestaId]/page.tsx'), 'utf8');
    const barraActions = fs.readFileSync(path.join(rootDir, 'src/app/actions/fiesta/barra-tecnologica.actions.ts'), 'utf8');
    const barraLib = fs.readFileSync(path.join(rootDir, 'src/lib/barra-tecnologica.ts'), 'utf8');

    expect(barraPage).toContain('AK_INSTAGRAM_HANDLE');
    expect(muroPage).toContain('AK_INSTAGRAM_HANDLE');
    expect(barraActions).toContain('AK_INSTAGRAM_HANDLE');
    expect(barraLib).toContain('AK_INSTAGRAM_HANDLE');
  });
});
