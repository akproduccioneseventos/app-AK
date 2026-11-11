import type { BlogPost } from '@/types/blog';

/**
 * Las notas que ve el público en el blog, todas juntas y de la más nueva a la más vieja.
 *
 * Antes, apenas la base tenía una nota, la página dejaba de mostrar las seis escritas a mano, y las mostraba en el
 * orden en que estaban guardadas (pedido del dueño, 11/11/2026: "no se ven todas y deberían estar ordenadas por fecha").
 * Si una nota de la base tiene el mismo enlace que una escrita a mano, manda la de la base. Los borradores y las
 * programadas para más adelante no se muestran.
 */
export function notasDelBlogParaMostrar(deLaBase: BlogPost[], escritasAMano: BlogPost[], hoy: string): BlogPost[] {
  const porEnlace = new Map<string, BlogPost>();
  for (const nota of escritasAMano) if (nota?.slug) porEnlace.set(nota.slug, nota);
  for (const nota of deLaBase) if (nota?.slug) porEnlace.set(nota.slug, nota);
  return [...porEnlace.values()]
    .filter((nota) => {
      const estado = String(nota.status || 'published');
      if (estado === 'draft') return false;
      const fecha = String(nota.publishedAt || '').slice(0, 10);
      return !fecha || fecha <= hoy;
    })
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
}
