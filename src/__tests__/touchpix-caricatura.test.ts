import fs from 'fs';
import path from 'path';

describe('Orden 86 Bloque 6: Caricatura IA en Fotocabina Touchpix', () => {
  it('caricatura existe en THEME_DEFINITIONS en touchpix-ai.ts con prompt amable y respetuoso', () => {
    const filePath = path.join(process.cwd(), 'src/app/actions/touchpix-ai.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toContain('"caricatura"');
    expect(content).toContain('caricatura: {');
    expect(content).toContain('label: "Caricatura"');
    // Verificar que nunca sea burlona y sea amable como pidió el dueño
    expect(content).toMatch(/never mean-spirited or mocking/i);
    expect(content).toMatch(/party background/i);
  });

  it('caricatura existe en TOUCHPIX_THEMES en la pantalla de touchpix', () => {
    const filePath = path.join(process.cwd(), 'src/app/evento/touchpix/[fiestaId]/page.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toMatch(/id:\s*'caricatura'/);
    expect(content).toMatch(/label:\s*'Caricatura'/);
    expect(content).toMatch(/emoji:\s*'🎨'/);
  });
});
