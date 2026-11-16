import fs from 'fs';
import path from 'path';

/**
 * Incidentes, aprobaciones y guias de armado estaban terminadas y funcionando,
 * pero ningun boton llevaba a ellas: habia que escribir la direccion a mano.
 * Trabajo pago que nadie podia usar.
 *
 * Esta prueba controla que sigan enlazadas. Si alguien reordena el menu y se las
 * lleva puestas, salta aca y no seis meses despues.
 */
const navegacion =
  fs.readFileSync(path.join(process.cwd(), 'src/components/main-nav.tsx'), 'utf-8') +
  fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/mas/page.tsx'), 'utf-8');

describe('el menu lateral enlaza las pantallas que existen', () => {
  it.each([
    ['/incidentes', 'Incidentes'],
    ['/playbooks', 'Guias de Armado'],
    ['/aprobaciones', 'Cambios a Aprobar'],
  ])('enlaza %s con el nombre %s', (href, titulo) => {
    const tieneHref = navegacion.includes(`href: "${href}"`) || navegacion.includes(`href: '${href}'`);
    const tieneTitulo = navegacion.includes(`title: "${titulo}"`) || navegacion.includes(`title: '${titulo}'`);
    expect(tieneHref).toBe(true);
    expect(tieneTitulo).toBe(true);
  });

  it('las tres pantallas existen de verdad', () => {
    for (const ruta of ['incidentes', 'playbooks', 'aprobaciones']) {
      expect(fs.existsSync(path.join(process.cwd(), `src/app/(app)/${ruta}/page.tsx`))).toBe(true);
    }
  });
});
