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
    // La posicion ahora la puede mover cada uno (9/10/2026); la de arranque sigue siendo la misma:
    // 160 px desde abajo (bottom-40) y 16 desde la derecha (right-4), anclada por abajo.
    expect(src).toMatch(/PREFERENCIA_INICIAL: PreferenciaTarjeta = \{ minimizada: false, abajo: 160, derecha: 16 \}/);
    expect(src).toMatch(/style=\{\{ bottom: pref\.abajo, right: pref\.derecha/);
  });
});
