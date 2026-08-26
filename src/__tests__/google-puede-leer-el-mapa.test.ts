import { ARCHIVOS_QUE_GOOGLE_LEE, PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';
import robots from '@/app/robots';

/**
 * Google tiene que poder leer el mapa del sitio y el archivo de verificacion.
 *
 * **Paso de verdad:** el permiso para robots esta cerrado por defecto y se abre pagina por
 * pagina. El mapa nunca estuvo en esa lista, asi que Google lo tenia prohibido. El dueno
 * intento dar de alta el sitio en Search Console y le dio error, sin entender por que.
 *
 * Sin el mapa, Google tiene que encontrar las paginas de casualidad. Sin la verificacion,
 * el dueno no puede ni saber si Google lo tiene indexado.
 */
describe('Google puede leer lo que necesita', () => {
  const reglas = robots();
  const permitido = (reglas.rules as any[])[0].allow as string[];

  it('el mapa del sitio esta permitido', () => {
    expect(permitido).toContain('/sitemap.xml');
  });

  it('el archivo de verificacion de Search Console esta permitido', () => {
    const verificacion = ARCHIVOS_QUE_GOOGLE_LEE.filter((a) => a.startsWith('/google'));
    expect(verificacion.length).toBeGreaterThan(0);
    for (const archivo of verificacion) {
      expect(permitido).toContain(archivo);
    }
  });

  it('esos archivos NO entran en el mapa del sitio', () => {
    // El mapa sale de PAGINAS_PARA_GOOGLE. Si el mapa se ofreciera a si mismo, o al
    // archivo de verificacion, le estariamos ofreciendo a Google paginas que no existen.
    for (const archivo of ARCHIVOS_QUE_GOOGLE_LEE) {
      expect(PAGINAS_PARA_GOOGLE as readonly string[]).not.toContain(archivo);
    }
  });
});
