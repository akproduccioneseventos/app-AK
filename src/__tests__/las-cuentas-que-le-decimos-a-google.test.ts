import fs from 'fs';
import path from 'path';

/**
 * Las dos fichas de negocio le tienen que declarar a Google LAS MISMAS cuentas.
 *
 * Por que existe esta prueba: la web publica declara dos veces quien es la
 * empresa, en dos archivos distintos. Una de las dos nombraba una cuenta de
 * Instagram que no coincidia con la del resto del sitio. Cuando Google recibe
 * dos identidades distintas para el mismo negocio no puede confirmar ninguna, y
 * el resultado de busqueda sale mas chico y sin las cuentas al costado.
 *
 * No se ve en pantalla: solo se agarra aca.
 */
function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

const CUENTAS = [
  'facebook.com/akproduccionessalto',
  'instagram.com/akproduccionesfiestasyeventos',
  'tiktok.com/@akproduccioneseve',
  'youtube.com/channel/UClq6YnypA9PFuBgunzk306A',
  'threads.com/@akproduccionesfiestasyeventos',
  'x.com/AkSalto',
  'pinterest.com/akproduccionessalto',
];

describe('las cuentas oficiales que ve Google', () => {
  const principal = leer('src/components/public/LocalBusinessSchema.tsx');
  const landings = leer('src/components/seo/LocalBusinessJsonLd.tsx');

  it.each(CUENTAS)('la ficha principal declara %s', (cuenta) => {
    expect(principal).toContain(cuenta);
  });

  it.each(CUENTAS)('la ficha de las paginas de venta declara %s', (cuenta) => {
    expect(landings).toContain(cuenta);
  });

  it('ninguna de las dos nombra la cuenta vieja de Instagram', () => {
    expect(principal).not.toContain('ak_producciones_eventos');
    expect(landings).not.toContain('ak_producciones_eventos');
  });
});
