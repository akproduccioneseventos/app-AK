'use server';

import type { SocialPost } from '@/types/social-media';
import { readData, writeData } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';
import type { SocialConnection } from '@/types/settings';

const POSTS_FILE = 'social-posts.json';
const CONNECTIONS_FILE = 'social-connections.json';

export async function publishSocialPostToMeta(
  postId: string
): Promise<{ success: boolean; post?: SocialPost; error?: string }> {
  await requireAppSession();
  
  const posts = await readData<SocialPost[]>(POSTS_FILE, []);
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) {
    return { success: false, error: 'Publicación no encontrada.' };
  }

  const post = posts[postIndex];

  // 1. Obtener la conexión configurada para la plataforma
  const connections = await readData<SocialConnection[]>(CONNECTIONS_FILE, []);
  const metaConn = connections.find(c => (c.platform === post.platform || c.platform === 'Facebook' || c.platform === 'Instagram') && c.isConnected);

  if (!metaConn || !metaConn.metaAccessToken) {
    const errorMsg = `Meta API sin configurar para ${post.platform}. Recordá que podés publicar copiando el texto manualmente.`;
    const updatedPost: SocialPost = {
      ...post,
      status: 'Error',
      publishError: errorMsg,
      updatedAt: new Date().toISOString(),
    };
    posts[postIndex] = updatedPost;
    await writeData(POSTS_FILE, posts);
    return { success: false, post: updatedPost, error: errorMsg };
  }

  try {
    let metaPostId: string | undefined;
    let metaPostUrl: string | undefined;

    if (post.platform === 'Instagram') {
      const igAccountId = metaConn.metaInstagramAccountId;
      if (!igAccountId) {
        throw new Error('Falta ID de cuenta comercial de Instagram.');
      }

      // Paso A: Crear el contenedor de media
      const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: post.mediaUrl ? (post.mediaUrl.startsWith('http') ? post.mediaUrl : `${process.env.NEXT_PUBLIC_APP_URL || 'https://akproducciones.com'}${post.mediaUrl}`) : undefined,
          caption: post.text,
          access_token: metaConn.metaAccessToken,
        }),
      });

      const containerData = await containerRes.json();
      if (!containerRes.ok || containerData.error) {
        throw new Error(containerData.error?.message || 'Error al crear contenedor en Meta');
      }

      // Paso B: Publicar el contenedor
      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: metaConn.metaAccessToken,
        }),
      });

      const publishData = await publishRes.json();
      if (!publishRes.ok || publishData.error) {
        throw new Error(publishData.error?.message || 'Error al publicar contenedor en Meta');
      }

      metaPostId = publishData.id;
      metaPostUrl = `https://www.instagram.com/p/${publishData.id}/`;

    } else if (post.platform === 'Facebook') {
      const pageId = metaConn.metaPageId;
      if (!pageId) {
        throw new Error('Falta ID de Página de Facebook.');
      }

      const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: post.text,
          link: post.link,
          access_token: metaConn.metaAccessToken,
        }),
      });

      const fbData = await fbRes.json();
      if (!fbRes.ok || fbData.error) {
        throw new Error(fbData.error?.message || 'Error al publicar en Facebook');
      }

      metaPostId = fbData.id;
      metaPostUrl = `https://facebook.com/${fbData.id}`;
    } else {
      throw new Error(`Publicación automática no soportada para ${post.platform}`);
    }

    const updatedPost: SocialPost = {
      ...post,
      status: 'Publicado',
      metaPostId,
      metaPostUrl,
      publishError: undefined,
      updatedAt: new Date().toISOString(),
    };

    posts[postIndex] = updatedPost;
    await writeData(POSTS_FILE, posts);

    return { success: true, post: updatedPost };

  } catch (err: any) {
    const errorMsg = err.message || 'Error inesperado al conectar con la API de Meta';
    const updatedPost: SocialPost = {
      ...post,
      status: 'Error',
      publishError: errorMsg,
      updatedAt: new Date().toISOString(),
    };

    posts[postIndex] = updatedPost;
    await writeData(POSTS_FILE, posts);

    return { success: false, post: updatedPost, error: errorMsg };
  }
}
