import fs from 'fs';
import path from 'path';
import { DEFAULT_STATS } from '@/components/landing/StatsSection';

describe('Orden 176 - Bloque 5: La portada escribe bien', () => {
  it('DEFAULT_STATS mantiene las cifras oficiales del dueño: +200 eventos y +7 años', () => {
    const eventos = DEFAULT_STATS.find((s) => s.label.toLowerCase().includes('evento'));
    const anios = DEFAULT_STATS.find((s) => s.label.toLowerCase().includes('año') || s.label.toLowerCase().includes('ano') || s.label.toLowerCase().includes('experiencia'));
    expect(eventos?.value).toBe('+200');
    expect(anios?.value).toBe('+7');
  });

  it('no contiene errores ortográficos en salon-helper.ts, public-footer.tsx, galeria-publica.json (títulos) y ak-channel.ts', () => {
    const root = process.cwd();

    // 1. salon-helper.ts
    const salonHelper = fs.readFileSync(path.join(root, 'src/lib/salon-helper.ts'), 'utf8');
    expect(salonHelper).not.toContain('Salon principal');
    expect(salonHelper).not.toContain('quince anos');

    // 2. public-footer.tsx
    const footer = fs.readFileSync(path.join(root, 'src/components/public-footer.tsx'), 'utf8');
    expect(footer).not.toContain('Oficina & Atencion');
    expect(footer).toContain('Oficina & Atención');

    // 3. galeria-publica.json (sólo títulos)
    const galeriaRaw = fs.readFileSync(path.join(root, 'src/data/galeria-publica.json'), 'utf8');
    const galeria = JSON.parse(galeriaRaw);
    const titulos: string[] = [
      ...(galeria.fotos || []).map((f: any) => f.titulo),
      ...(galeria.videos || []).map((v: any) => v.titulo),
    ].filter(Boolean);

    for (const t of titulos) {
      expect(t).not.toMatch(/\bSalon\b/);
      expect(t).not.toMatch(/\bDecoracion\b/);
      expect(t).not.toMatch(/\bIluminacion\b/);
    }

    // 4. ak-channel.ts
    const akChannel = fs.readFileSync(path.join(root, 'src/lib/youtube/ak-channel.ts'), 'utf8');
    expect(akChannel).not.toContain('XV anos ');
    expect(akChannel).not.toContain('Belen ');
    expect(akChannel).not.toContain('"XV Anos"');
    expect(akChannel).toContain('XV años');
    expect(akChannel).toContain('Belén');
  });
});
