import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Orden 319 N29: /multiagente/acciones dice Generar balance de cierre', () => {
  it('la pantalla /multiagente/acciones muestra Generar balance de cierre y no Cerrar fiesta con retroalimentación', () => {
    const src = readFileSync(
      path.join(process.cwd(), 'src/components/asistente/panels/acciones.tsx'),
      'utf8',
    );
    expect(src).toContain('Generar balance de cierre');
    expect(src).not.toContain('Cerrar fiesta con retroalimentación');
  });
});
