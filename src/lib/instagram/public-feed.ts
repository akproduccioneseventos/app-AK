import 'server-only';

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

export async function getPublicInstagramFeed(
  profileUrl = 'https://www.instagram.com/akproduccioneseventos/',
): Promise<PublicInstagramFeedPost[]> {
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
