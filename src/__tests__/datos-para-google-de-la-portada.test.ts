import fs from 'node:fs';
import path from 'node:path';

describe('Orden 177 / SEO: Datos estructurados para Google (JSON-LD) en la portada', () => {
  const root = process.cwd();
  const pageSource = fs.readFileSync(path.join(root, 'src/app/page.tsx'), 'utf8');

  it('la portada define un @graph con dos nodos: negocio y salón Club Uruguay', () => {
    expect(pageSource).toContain('"@graph"');
    expect(pageSource).toContain('areaServed');
    expect(pageSource).toContain('Salto');
    expect(pageSource).toContain('Litoral de Uruguay');
    expect(pageSource).toContain('"Salón Club Uruguay"');
    expect(pageSource).toContain('"EventVenue"');
    expect(pageSource).toContain('hasOfferCatalog');
  });

  it('no expone datos sensibles, calificaciones inventadas ni la palabra congelar', () => {
    expect(pageSource).not.toMatch(/aggregateRating/i);
    expect(pageSource).not.toMatch(/\+250/);
    expect(pageSource).not.toMatch(/\+10/);
    expect(pageSource).not.toMatch(/100%/);
    expect(pageSource).not.toMatch(/congel/i);
  });
});
