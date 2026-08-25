import 'server-only';

import type { SocialPost } from '@/types/social-media';
import { readData } from '@/lib/data-service';

const POSTS_FILE = 'social-posts.json';

export interface PublicInstagramFeedPost {
  id: string;
  sourceId: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  permalink: string;
  caption: string;
  publishedAt?: string;
  likes: number;
}

/**
 * Obtiene las publicaciones de Instagram para la galería de la web pública.
 *
 * Prioridad:
 * 1. Lee las publicaciones guardadas en el historial local (`social-posts.json`),
 *    que contiene todo el historial sincronizado de Instagram sin hacer esperar
 *    a los visitantes por una consulta externa a Meta.
 * 2. Si el historial guardado está vacío (cuenta recién conectada o primera vez),
 *    consulta directamente a Meta Graph API como respaldo inmediato.
 */
export async function getPublicInstagramFeed(
  profileUrl = 'https://www.instagram.com/akproduccionesfiestasyeventos/',
): Promise<PublicInstagramFeedPost[]> {
  try {
    const savedPosts = await readData<SocialPost[]>(POSTS_FILE, []);
    const instagramSaved = savedPosts.filter(
      (p) => p.platform === 'Instagram' && Boolean(p.mediaUrl),
    );

    if (instagramSaved.length > 0) {
      const sorted = [...instagramSaved].sort((a, b) => {
        const timeA = new Date(a.publishDate || 0).getTime();
        const timeB = new Date(b.publishDate || 0).getTime();
        return timeB - timeA;
      });

      const seen = new Set<string>();
      const result: PublicInstagramFeedPost[] = [];

      for (const post of sorted) {
        const sourceId = String(post.sourceId || post.id).trim();
        const mediaUrl = String(post.mediaUrl || '').trim();
        if (!sourceId || !mediaUrl) continue;

        const dedupeKey = `${sourceId}_${mediaUrl}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const rawType = String(post.mediaType || '').toLowerCase();
        const mediaType: 'image' | 'video' =
          rawType.includes('video') || rawType.includes('reel') ? 'video' : 'image';

        result.push({
          id: `ig_${sourceId}`,
          sourceId,
          mediaType,
          mediaUrl,
          permalink: String(post.sourceUrl || post.link || profileUrl),
          caption: String(post.text || 'Trabajo reciente de AK Producciones.'),
          publishedAt: post.publishDate ? String(post.publishDate) : undefined,
          likes: Number(post.performance?.likes || 0),
        });
      }

      if (result.length > 0) {
        return result;
      }
    }
  } catch {
    // Si falla la lectura local, intenta con la API directa como respaldo
  }

  // Respaldo directo contra Meta Graph API (solo para cuentas recién vinculadas)
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.INSTAGRAM_USER_ID;
  if (!accessToken || !accountId) return [];

  const apiVersion = process.env.INSTAGRAM_GRAPH_API_VERSION || 'v25.0';
  const fields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'thumbnail_url',
    'permalink',
    'timestamp',
    'like_count',
    'comments_count',
  ].join(',');

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${accountId}/media?fields=${encodeURIComponent(fields)}&limit=24&access_token=${encodeURIComponent(accessToken)}`,
      {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(3500),
      },
    );
    if (!response.ok) return [];

    const payload = await response.json();
    const items = Array.isArray(payload?.data) ? payload.data : [];
    return items.flatMap((item: any): PublicInstagramFeedPost[] => {
      const sourceId = String(item?.id || '').trim();
      const mediaUrl = String(item?.thumbnail_url || item?.media_url || '').trim();
      if (!sourceId || !mediaUrl) return [];
      const rawType = String(item?.media_type || '').toUpperCase();
      const mediaType = rawType.includes('VIDEO') || rawType.includes('REEL') ? 'video' : 'image';
      return [{
        id: `ig_${sourceId}`,
        sourceId,
        mediaType,
        mediaUrl,
        permalink: String(item?.permalink || profileUrl),
        caption: String(item?.caption || 'Trabajo reciente de AK Producciones.'),
        publishedAt: item?.timestamp ? String(item.timestamp) : undefined,
        likes: Number(item?.like_count || item?.comments_count || 0),
      }];
    });
  } catch {
    return [];
  }
}
