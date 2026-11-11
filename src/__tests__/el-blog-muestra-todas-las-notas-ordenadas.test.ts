/**
 * MATAFUEGO — El blog muestra todas las notas, de la más nueva a la más vieja (pedido del dueño, 11/11/2026).
 * Antes, con una sola nota en la base desaparecían las seis escritas a mano, y el orden era el de guardado.
 * La última prueba exige que la página pública use esta función, y no la regla vieja de "si la base tiene notas, sólo esas".
 */
import { notasDelBlogParaMostrar } from '@/lib/blog/notas-para-mostrar';
import type { BlogPost } from '@/types/blog';
import fs from 'fs';
import path from 'path';

const nota = (slug: string, publishedAt: string, extra: Partial<BlogPost> = {}) =>
  ({ slug, title: slug, publishedAt, ...extra }) as BlogPost;

describe('El blog muestra todas las notas ordenadas', () => {
  const aMano = [nota('mano-1', '2026-06-01'), nota('mano-2', '2026-06-01')];

  it('junta las de la base con las escritas a mano y ordena de la más nueva a la más vieja', () => {
    const base = [nota('ia-vieja', '2026-07-10'), nota('ia-nueva', '2026-11-09'), nota('ia-medio', '2026-09-01')];
    const slugs = notasDelBlogParaMostrar(base, aMano, '2026-11-11').map((n) => n.slug);
    expect(slugs.slice(0, 3)).toEqual(['ia-nueva', 'ia-medio', 'ia-vieja']);
    expect(slugs).toEqual(expect.arrayContaining(['mano-1', 'mano-2']));
    expect(slugs).toHaveLength(5);
  });

  it('si una nota de la base tiene el mismo enlace que una escrita a mano, aparece una sola vez', () => {
    const r = notasDelBlogParaMostrar([nota('mano-1', '2026-10-01', { title: 'corregida' })], aMano, '2026-11-11');
    expect(r.filter((n) => n.slug === 'mano-1')).toEqual([expect.objectContaining({ title: 'corregida' })]);
  });

  it('no muestra borradores ni notas con fecha futura', () => {
    const base = [nota('borrador', '2026-11-01', { status: 'draft' }), nota('futura', '2026-12-01')];
    const slugs = notasDelBlogParaMostrar(base, [], '2026-11-11').map((n) => n.slug);
    expect(slugs).toEqual([]);
  });

  it('la página pública del blog usa esta función', () => {
    const pagina = fs.readFileSync(path.join(process.cwd(), 'src/app/public/blog/page.tsx'), 'utf8');
    expect(pagina).toContain('notasDelBlogParaMostrar(');
    expect(pagina).not.toMatch(/postsFromDb\.length > 0 \? postsFromDb/);
  });
});
