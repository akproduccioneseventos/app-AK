import fs from 'fs';
import path from 'path';

describe('Orden 86 Bloque 2: Vidriera pública sin karaoke', () => {
  it('el archivo de la vidriera no contiene karaoke', () => {
    const showcasePath = path.join(process.cwd(), 'src/components/public/InteractiveTechShowcase.tsx');
    const showcaseContent = fs.readFileSync(showcasePath, 'utf8');

    expect(showcaseContent.toLowerCase()).not.toContain('karaoke');
  });

  it('el archivo de tipos de galería no ofrece karaoke', () => {
    const galeriaPath = path.join(process.cwd(), 'src/types/galeria.ts');
    const galeriaContent = fs.readFileSync(galeriaPath, 'utf8');

    expect(galeriaContent.toLowerCase()).not.toContain('karaoke');
  });
});
