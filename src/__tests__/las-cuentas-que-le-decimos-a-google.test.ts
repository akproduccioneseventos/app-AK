import fs from 'fs';
import path from 'path';
import { AK_SAME_AS_URLS } from '@/lib/public-contact';

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
  const publicContact = leer('src/lib/public-contact.ts');

  it.each(CUENTAS)('la lista oficial centralizada declara %s', (cuenta) => {
    expect(publicContact).toContain(cuenta);
    const matchEnArray = AK_SAME_AS_URLS.some((url) => url.includes(cuenta));
    expect(matchEnArray).toBe(true);
  });

  it('las dos fichas usan la lista oficial centralizada AK_SAME_AS_URLS', () => {
    expect(principal).toContain('AK_SAME_AS_URLS');
    expect(landings).toContain('AK_SAME_AS_URLS');
  });

  it('ninguna de las fichas ni la lista oficial nombra la cuenta vieja de Instagram', () => {
    expect(principal).not.toContain('ak_producciones_eventos');
    expect(landings).not.toContain('ak_producciones_eventos');
    expect(publicContact).not.toContain('ak_producciones_eventos');
  });
});

describe('los botones de Instagram apuntan todos a la misma cuenta', () => {
  // Habia tres direcciones distintas dando vueltas. Un boton que lleva a una
  // cuenta vieja es una venta que se pierde sin que nadie se entere.
  const ARCHIVOS = [
    'src/components/public/GallerySection.tsx',
    'src/components/landing/WinSechWidgets.tsx',
    'src/components/landing/CTASection.tsx',
    'src/components/public-footer.tsx',
    'src/app/page.tsx',
    'src/app/actions/social-connections.ts',
    'src/app/actions/experience-total.ts',
    'src/lib/experience-ak/demo-fiesta-factory.ts',
  ];

  it.each(ARCHIVOS)('%s no nombra ninguna cuenta vieja', (archivo) => {
    const fuente = leer(archivo);

    expect(fuente).not.toContain('akproduccioneseventos');
    expect(fuente).not.toContain('ak_producciones_eventos');
  });
});
