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
    // La validacion vivia dentro de cada plantilla de invitacion; al agregarse el
    // mapa de Google se mudo a un componente comun. Se sigue el dato hasta donde
    // esta ahora, en vez de dar por perdida la proteccion.
    const mapa = read('src/components/invitacion/EventLocationMap.tsx');
    expect(mapa).toContain("url.protocol === 'https:' || url.protocol === 'http:'");
    expect(mapa).toContain('safeExternalUrl(input.mapsUrl)');

    // Y las plantillas tienen que pasar el enlace por ese componente, no
    // escribirlo directo en un `href`.
    for (const template of [
      'src/components/invitacion/templates/AllegriaTemplate.tsx',
      'src/components/invitacion/templates/GraziaTemplate.tsx',
    ]) {
      const source = read(template);
      expect(source).toContain('mapsUrl={detalle.mapaUrl}');
      expect(source).not.toContain("href={detalle.mapaUrl");
      expect(source).not.toContain("detalle.mapaUrl || '#'");
    }
  });

  // La pantalla "Centro Total AK" que esta prueba vigilaba ya no existe: se
  // unificó en el Centro de Fiesta, que no muestra ningún puntaje de salud. Sin
  // pantalla que vigilar, la regla quedó sin objeto.
});
