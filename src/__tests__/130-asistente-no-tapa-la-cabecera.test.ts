import { readFileSync } from 'fs';
import { join } from 'path';

describe('130 HIT80: el indicador del asistente no vive en la cabecera', () => {
  const src = readFileSync(
    join(process.cwd(), 'src/components/assistant/contextual-assistant-indicator.tsx'),
    'utf8',
  );
  it('no esta anclado arriba a la derecha (donde van los botones de las pantallas)', () => {
    expect(src).not.toMatch(/fixed[^"']*\btop-\d+/);
  });
  it('va abajo a la derecha, por encima del boton flotante del multiagente (bottom-24)', () => {
    expect(src).toMatch(/fixed bottom-40 right-4/);
  });
});
