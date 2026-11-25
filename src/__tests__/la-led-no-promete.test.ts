import fs from 'node:fs';
import path from 'node:path';

describe('Orden 344 - Las láminas de la presentación LED no hacen promesas ni usan cifras viejas', () => {
  const slidesDir = path.join(process.cwd(), 'src/app/presentacion-led/slides');
  const slideFiles = fs
    .readdirSync(slidesDir)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));

  it('encuentra las láminas de la presentación LED', () => {
    expect(slideFiles.length).toBeGreaterThan(0);
  });

  it.each(slideFiles)('%s no contiene "500 familias", "Absoluta", "inmediata" ni /garant/i', (file) => {
    const source = fs.readFileSync(path.join(slidesDir, file), 'utf8');

    expect(source).not.toContain('500 familias');
    expect(source).not.toContain('Absoluta');
    expect(source).not.toContain('inmediata');
    expect(source).not.toMatch(/garant/i);
  });
});
