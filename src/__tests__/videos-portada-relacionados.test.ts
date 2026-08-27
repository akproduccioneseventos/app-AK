import fs from 'node:fs';
import path from 'node:path';

describe('Videos de fondo relacionados para las portadas', () => {
  const root = process.cwd();

  const requiredVideos = [
    'public/videos/hero_portada.mp4',
    'public/videos/hero_bodas.mp4',
    'public/videos/hero_quince.mp4',
    'public/videos/hero_cumpleanos.mp4',
  ];

  it('todos los archivos de video de stock existen y no están vacíos', () => {
    for (const v of requiredVideos) {
      const fullPath = path.join(root, v);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(1000);
    }
  });

  it('la portada principal incluye su video de fondo', () => {
    const pageContent = fs.readFileSync(path.join(root, 'src/app/page.tsx'), 'utf8');
    expect(pageContent).toContain('backgroundVideoUrl="/videos/hero_portada.mp4"');
  });

  it('la landing de bodas pasa el video de casamientos', () => {
    const pageContent = fs.readFileSync(path.join(root, 'src/app/bodas/page.tsx'), 'utf8');
    expect(pageContent).toContain('heroVideo="/videos/hero_bodas.mp4"');
  });

  it('la landing de quinceañeras pasa el video de 15 años', () => {
    const pageContent = fs.readFileSync(path.join(root, 'src/app/quinceaneras/page.tsx'), 'utf8');
    expect(pageContent).toContain('heroVideo="/videos/hero_quince.mp4"');
  });

  it('la landing de cumpleaños pasa el video de cumpleaños', () => {
    const pageContent = fs.readFileSync(path.join(root, 'src/app/cumpleanos/page.tsx'), 'utf8');
    expect(pageContent).toContain('heroVideo="/videos/hero_cumpleanos.mp4"');
  });

  it('EventLandingPage conecta heroVideo con HeroSection', () => {
    const compContent = fs.readFileSync(
      path.join(root, 'src/components/landing/EventLandingPage.tsx'),
      'utf8'
    );
    expect(compContent).toContain('backgroundVideoUrl={heroVideo}');
  });
});
