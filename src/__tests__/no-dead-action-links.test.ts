import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('action link integrity', () => {
  const guardedActionFiles = [
    'src/app/(app)/contabilidad/crm/ciclo-comercial/page.tsx',
    'src/app/(app)/empresa/galeria/page.tsx',
    'src/app/(app)/fiestas/[id]/centro-experiencia/page.tsx',
    'src/app/(app)/fiestas/[id]/cierre-mundial/page.tsx',
    'src/app/(app)/fiestas/nueva/centro-total/page.tsx',
    'src/app/(app)/fiestas/nueva/entretenimiento/page.tsx',
    'src/app/(app)/fiestas/nueva/pagina-web/page.tsx',
    'src/components/invitacion/templates/AllegriaTemplate.tsx',
    'src/components/invitacion/templates/GraziaTemplate.tsx',
  ];

  it('does not turn missing actions into page-top links', () => {
    for (const relativePath of guardedActionFiles) {
      const source = read(relativePath);
      expect(source).not.toMatch(/href=\{[^}]+(?:\|\||\?\?)\s*['"]#['"]/);
    }
  });

  it('only exposes public map links with an http or https URL', () => {
    for (const template of [
      'src/components/invitacion/templates/AllegriaTemplate.tsx',
      'src/components/invitacion/templates/GraziaTemplate.tsx',
    ]) {
      const source = read(template);
      expect(source).toContain("/^https?:\\/\\//i.test(detalle.mapaUrl)");
      expect(source).not.toContain("detalle.mapaUrl || '#'");
    }
  });

  it('labels the center score as configuration state, not a production test', () => {
    const source = read('src/app/(app)/fiestas/nueva/centro-total/page.tsx');
    expect(source).toContain('Estado de configuración');
    expect(source).toContain('No reemplaza una prueba real de producción.');
    expect(source).not.toContain('Salud real de la app');
  });
});
