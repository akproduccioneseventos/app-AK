import fs from 'fs';
import path from 'path';

/**
 * Lo que la pantalla de conexiones informa tiene que existir en la app.
 *
 * Por que existe esta prueba: se reporto que el pixel de Meta estaba "conectado e
 * inyectado en toda la web". **No habia pixel en ningun lado**: la unica mencion
 * en todo el codigo era la pantalla que informa el estado de las conexiones. La
 * pantalla decia que andaba y no existia.
 *
 * Lo mismo pasaba con Google Analytics: decia "conectada" con solo cargar el
 * identificador en Ajustes, y la etiqueta se carga de otro lado. El dueno veia
 * "midiendo" y no se media nada.
 *
 * Regla: **el estado se decide por el mismo dato que hace funcionar la cosa**, no
 * por cualquier campo parecido.
 */
function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

describe('el pixel de Meta', () => {
  it('existe como componente y se monta en la portada', () => {
    const pixel = leer('src/components/meta-pixel.tsx');
    const layout = leer('src/app/layout.tsx');

    expect(pixel).toContain('fbevents.js');
    expect(pixel).toContain("fbq('init'");
    expect(layout).toContain('<MetaPixel />');
  });

  it('sin identificador no carga nada', () => {
    const pixel = leer('src/components/meta-pixel.tsx');

    expect(pixel).toContain('if (!META_PIXEL_ID) return null;');
  });
});

describe('la pantalla de conexiones', () => {
  const fuente = leer('src/app/actions/conexiones-estado.actions.ts');

  it('juzga el pixel por el mismo dato que lo carga', () => {
    expect(fuente).toContain('NEXT_PUBLIC_META_PIXEL_ID');
    expect(fuente).not.toContain('FACEBOOK_PIXEL_ID');
  });

  it('juzga la medicion de visitas por el mismo dato que carga la etiqueta', () => {
    const componente = leer('src/lib/analytics-ga.ts');

    expect(componente).toContain('NEXT_PUBLIC_GA_MEASUREMENT_ID');
    expect(fuente).toContain('NEXT_PUBLIC_GA_MEASUREMENT_ID');
    expect(fuente).not.toContain('NEXT_PUBLIC_GA_ID');
  });
});
