'use server';

import { readData, writeData } from '@/lib/data-service';
import { PERMISOS } from '@/lib/auth/perfiles';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import type { BlogPost } from '@/types/blog';
import { blogPosts as defaultBlogPosts } from '@/data/blog-posts';
import { corregirPromesasDelBlog } from '@/lib/blog/sin-promesas';

const BLOG_FILE = 'blog-posts.json';

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const raw = await readData<BlogPost[]>(BLOG_FILE, []);
    return corregirPromesasDelBlog(raw);
  } catch (error) {
    console.error('[blog-actions] Error reading blog posts:', error);
    return [];
  }
}
export async function saveBlogPost(
  post: BlogPost
): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.CRM);
  try {
    const posts = await getBlogPosts();
    const idx = posts.findIndex(p => p.slug === post.slug);

    if (idx >= 0) {
      posts[idx] = {
        ...post,
        publishedAt: post.publishedAt || new Date().toISOString().split('T')[0]
      };
    } else {
      posts.unshift({
        ...post,
        publishedAt: post.publishedAt || new Date().toISOString().split('T')[0]
      });
    }

    await writeData(BLOG_FILE, posts);
    return { success: true };
  } catch (error: any) {
    console.error('[blog-actions] Error saving blog post:', error);
    return { success: false, error: error.message || 'Error al guardar el artículo.' };
  }
}

export async function deleteBlogPost(
  slug: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION, PERMISOS.CRM);
  try {
    const posts = await getBlogPosts();
    const filtered = posts.filter(p => p.slug !== slug);
    await writeData(BLOG_FILE, filtered);
    return { success: true };
  } catch (error: any) {
    console.error('[blog-actions] Error deleting blog post:', error);
    return { success: false, error: error.message || 'Error al eliminar el artículo.' };
  }
}

/**
 * Una nota concreta, por su direccion.
 *
 * **Busca en las dos fuentes, y ese es el punto.** Las notas que escribe la
 * inteligencia artificial se guardan en la base; las seis escritas a mano viven en
 * el codigo. La pantalla del listado ya mostraba las dos, pero abrir una nota solo
 * miraba la base: las escritas a mano daban "no encontrada" en cuanto la base
 * tenia una sola nota adentro. Las direcciones estaban publicadas y en el mapa que
 * lee Google, asi que eran seis paginas rotas.
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  const deLaBase = posts.find(p => p.slug === slug);
  if (deLaBase) return deLaBase;

  const deMemoria = defaultBlogPosts.find(p => p.slug === slug);
  if (!deMemoria) return null;
  return corregirPromesasDelBlog([deMemoria])[0] || null;
}

export async function getRelatedPosts(post: BlogPost): Promise<BlogPost[]> {
  const posts = await getBlogPosts();
  const related = (post.relatedSlugs || [])
    .map(slug => posts.find(p => p.slug === slug))
    .filter((item): item is BlogPost => Boolean(item));

  if (related.length > 0) return related;
  return posts.filter(item => item.slug !== post.slug && item.category === post.category).slice(0, 2);
}

export interface EstadoBlogAdmin {
  ultimaNota?: { fecha: string; titulo: string; slug: string } | null;
  proximaFecha?: string | null;
  ultimoFallo?: { fecha: string; motivo: string } | null;
  diasSinNota?: number;
}

export async function getEstadoBlogAdmin(): Promise<EstadoBlogAdmin> {
  const posts = await getBlogPosts();
  let ultimaNota: EstadoBlogAdmin['ultimaNota'] = null;
  let diasSinNota = 0;
  let proximaFecha: string | null = null;

  if (posts.length > 0) {
    const ordenados = [...posts].sort((a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return db - da;
    });
    const masReciente = ordenados[0];
    if (masReciente) {
      ultimaNota = {
        fecha: masReciente.publishedAt || '',
        titulo: masReciente.title,
        slug: masReciente.slug,
      };
      if (masReciente.publishedAt) {
        const fechaMs = new Date(masReciente.publishedAt).getTime();
        if (!Number.isNaN(fechaMs)) {
          diasSinNota = Math.floor((Date.now() - fechaMs) / (24 * 60 * 60 * 1000));
          const proxMs = fechaMs + 48 * 60 * 60 * 1000;
          proximaFecha = new Date(proxMs).toISOString().split('T')[0];
        }
      }
    }
  }

  if (diasSinNota > 4) {
    try {
      const { createNotification } = await import('@/lib/notifications/create-notification');
      await createNotification({
        titulo: 'Blog sin publicaciones recientes',
        mensaje: `Hace ${diasSinNota} días que no se publica una nueva nota en el blog.`,
        tipo: 'aviso',
        rolDestino: 'admin',
        href: '/settings/contenido-publico',
        icono: 'FileText',
      }).catch(() => null);
    } catch {
      // no pasa nada si falla la notificación
    }
  }

  let ultimoFallo: EstadoBlogAdmin['ultimoFallo'] = null;
  try {
    const estado = await readData<any>('tareas-al-entrar-estado.json', {});
    const fallo = estado?.ultimoFallo?.blog;
    if (fallo && fallo.error) {
      let motivoCriollo = fallo.error;
      const errLower = fallo.error.toLowerCase();
      if (errLower.includes('falta la clave') || errLower.includes('falta una clave') || errLower.includes('gemini')) {
        motivoCriollo = 'falta la clave de la IA';
      } else if (errLower.includes('tope de gasto') || errLower.includes('presupuesto')) {
        motivoCriollo = 'se llegó al tope de gasto del mes';
      } else if (errLower.includes('promesa') || errLower.includes('palabra prohibida')) {
        motivoCriollo = 'la IA escribió una promesa prohibida';
      }
      ultimoFallo = {
        fecha: fallo.fecha ? fallo.fecha.split('T')[0] : '',
        motivo: motivoCriollo,
      };
    }
  } catch (err) {
    console.warn('[blog-actions] Error al leer estado de tareas:', err);
  }

  return {
    ultimaNota,
    proximaFecha: proximaFecha || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
    ultimoFallo,
    diasSinNota,
  };
}
