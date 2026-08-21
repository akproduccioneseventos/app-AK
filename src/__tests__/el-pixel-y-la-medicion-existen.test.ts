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
    expect(fuente).toContain('idDelPixelMeta()');
    expect(fuente).not.toContain('FACEBOOK_PIXEL_ID');
  });

  it('juzga la medicion de visitas por el mismo dato que carga la etiqueta', () => {
    const componente = leer('src/lib/analytics-ga.ts');

    expect(componente).toContain('idDeMedicionGoogle()');
    expect(fuente).toContain('idDeMedicionGoogle()');
    expect(fuente).not.toContain('NEXT_PUBLIC_GA_ID');
  });
});

describe('los identificadores de medicion', () => {
  const fuente = leer('src/lib/medicion/identificadores.ts');

  it('estan cargados, asi la medicion anda sin tocar ninguna consola', () => {
    // Estaban solo como variable del servidor y por eso no se midio nunca: el
    // dueno no programa y no podia cargarlas.
    expect(fuente).toMatch(/ID_DE_MEDICION_GOOGLE = 'G-[A-Z0-9]+'/);
    expect(fuente).toMatch(/ID_DEL_PIXEL_META = '\d{10,}'/);
  });

  it('la variable del servidor sigue mandando si esta puesta', () => {
    expect(fuente).toContain('process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID');
    expect(fuente).toContain('process.env.NEXT_PUBLIC_META_PIXEL_ID');
  });

  it('no guarda nada que de acceso a algo', () => {
    // Son identificadores publicos, no llaves. Una llave ya se colo una vez.
    expect(fuente).not.toMatch(/APP_USR-|BEGIN PRIVATE KEY|access_?token/i);
  });
});
