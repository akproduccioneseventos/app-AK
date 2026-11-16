import fs from 'fs';
import path from 'path';

describe('Orden 297: La web no inventa testimonios', () => {
  const catalogsDir = path.join(process.cwd(), 'src/data/event-catalogs');
  const catalogFiles = [
    'xv-anos.ts',
    'bodas.ts',
    'cumpleanos.ts',
    'aniversarios.ts',
    'corporativos.ts',
    'fiestas.ts',
  ];

  it('ningún catálogo de eventos tiene testimonios inventados escritos a mano', () => {
    catalogFiles.forEach((file) => {
      const content = fs.readFileSync(path.join(catalogsDir, file), 'utf-8');
      expect(content).not.toContain('Familia Rodríguez');
      expect(content).not.toContain('Empresa Tech S.A.');
      expect(content).not.toContain('Roberto y Marta');
      expect(content).toMatch(/testimonials:\s*\[\s*\]/);
    });
  });

  it('no nombra "Elite" como paquete con mayúscula en shared.ts ni en los catálogos', () => {
    const sharedContent = fs.readFileSync(path.join(catalogsDir, 'shared.ts'), 'utf-8');
    expect(sharedContent).not.toContain('Premium y Elite');
    expect(sharedContent).not.toMatch(/paquete\s+Elite/i);
  });
});
