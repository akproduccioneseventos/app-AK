import fs from 'fs';
import path from 'path';
import { PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';
import { blogPosts } from '@/data/blog-posts';

/**
 * Las paginas que traen clientes tienen que nombrar la ciudad.
 *
 * Por que existe esta prueba: las tres paginas que venden —casamientos, quince y
 * cumpleanos— decian "Uruguay" y no decian "Salto" en ninguna parte del titulo ni
 * de la descripcion. Eso es lo unico que ve la persona en el buscador, y es lo
 * que define si aparecemos cuando alguien busca desde Salto. El negocio trabaja
 * en una sola ciudad: no nombrarla es regalar la busqueda.
 *
 * Y las notas del blog: habia seis escritas y Google conocia tres, **incluida la
 * unica que habla de Salto entre las que faltaban**. La lista se armaba a mano y
 * se desincronizo. Ahora sale de los datos.
 */
function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

const PAGINAS_QUE_VENDEN = [
  'src/app/bodas/page.tsx',
  'src/app/quinceaneras/page.tsx',
  'src/app/cumpleanos/page.tsx',
];

describe('las paginas que venden', () => {
  it.each(PAGINAS_QUE_VENDEN)('%s nombra Salto en el titulo y en la descripcion', (archivo) => {
    const fuente = leer(archivo);
    const titulo = fuente.match(/title: '([^']+)'/)?.[1] || '';
    const descripcion = fuente.match(/description: '([^']+)'/)?.[1] || '';

    expect(titulo).toContain('Salto');
    expect(descripcion).toContain('Salto');
  });

  it('el titulo entra en lo que muestra Google', () => {
    for (const archivo of PAGINAS_QUE_VENDEN) {
      const titulo = leer(archivo).match(/title: '([^']+)'/)?.[1] || '';

      expect(titulo.length).toBeGreaterThan(10);
      expect(titulo.length).toBeLessThanOrEqual(65);
    }
  });
});

describe('las notas del blog', () => {
  it('todas las escritas estan en la lista que ve Google', () => {
    for (const post of blogPosts) {
      expect(PAGINAS_PARA_GOOGLE).toContain(`/public/blog/${post.slug}`);
    }
  });

  it('la nota de Salto esta incluida', () => {
    expect(PAGINAS_PARA_GOOGLE).toContain('/public/blog/ideas-para-fiesta-de-xv-en-salto');
  });
});
