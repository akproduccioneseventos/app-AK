import 'server-only';

import crypto from 'crypto';
import type { SocialPost } from '@/types/social-media';

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const MAX_PAGES = 200;

type YouTubePage<T> = {
  items?: T[];
  nextPageToken?: string;
};

type ChannelItem = {
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
};

type PlaylistItem = {
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
  snippet?: { publishedAt?: string; title?: string; description?: string };
};

type VideoItem = {
  id?: string;
  snippet?: {
    publishedAt?: string;
    title?: string;
    description?: string;
    thumbnails?: Record<string, { url?: string }>;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
};

function numeric(value?: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function youtubeGet<T>(path: string, params: URLSearchParams, apiKey: string): Promise<T> {
  params.set('key', apiKey);
  const response = await fetch(`${YOUTUBE_API}/${path}?${params.toString()}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`YouTube respondió ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}.`);
  }
  return response.json() as Promise<T>;
}

function contentHash(videoId: string): string {
  return crypto.createHash('sha256').update(`YouTube|id|${videoId}`).digest('hex');
}

function thumbnail(snippet?: VideoItem['snippet']): string | undefined {
  const thumbs = snippet?.thumbnails;
  return thumbs?.maxres?.url || thumbs?.standard?.url || thumbs?.high?.url || thumbs?.medium?.url || thumbs?.default?.url;
}

export async function fetchAllYouTubeHistory(): Promise<SocialPost[]> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const channelId = process.env.YOUTUBE_CHANNEL_ID?.trim();
  if (!apiKey || !channelId) {
    throw new Error('Faltan YOUTUBE_API_KEY y YOUTUBE_CHANNEL_ID en la configuración del servidor.');
  }

  const channel = await youtubeGet<YouTubePage<ChannelItem>>(
    'channels',
    new URLSearchParams({ part: 'contentDetails', id: channelId, maxResults: '1' }),
    apiKey,
  );
  const uploadsPlaylistId = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error('No pude encontrar la lista de videos subidos de ese canal.');

  const playlistItems: PlaylistItem[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: '50',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const result = await youtubeGet<YouTubePage<PlaylistItem>>('playlistItems', params, apiKey);
    playlistItems.push(...(result.items || []));
    pageToken = result.nextPageToken;
    if (!pageToken) break;
  }

  const videoIds = [...new Set(playlistItems.map((item) => item.contentDetails?.videoId).filter((id): id is string => Boolean(id)))];
  const details = new Map<string, VideoItem>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const result = await youtubeGet<YouTubePage<VideoItem>>(
      'videos',
      new URLSearchParams({ part: 'snippet,statistics', id: chunk.join(','), maxResults: '50' }),
      apiKey,
    );
    for (const item of result.items || []) if (item.id) details.set(item.id, item);
  }

  const now = new Date().toISOString();
  return videoIds.map((videoId) => {
    const detail = details.get(videoId);
    const fallback = playlistItems.find((item) => item.contentDetails?.videoId === videoId);
    const publishedAt = detail?.snippet?.publishedAt || fallback?.contentDetails?.videoPublishedAt || fallback?.snippet?.publishedAt || now;
    const title = detail?.snippet?.title || fallback?.snippet?.title || 'Video de YouTube';
    const description = detail?.snippet?.description || fallback?.snippet?.description || '';
    const hash = contentHash(videoId);

    return {
      id: `history_youtube_${hash.slice(0, 24)}`,
      platform: 'YouTube',
      isGeneralCampaign: true,
      publishDate: publishedAt,
      text: description ? `${title}\n\n${description}` : title,
      link: `https://www.youtube.com/watch?v=${videoId}`,
      mediaUrl: thumbnail(detail?.snippet),
      mediaType: 'video',
      status: 'Importado historial',
      performance: {
        views: numeric(detail?.statistics?.viewCount),
        likes: numeric(detail?.statistics?.likeCount),
        comments: numeric(detail?.statistics?.commentCount),
      },
      sourceId: videoId,
      sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      sourceFile: 'YouTube Data API',
      importBatchId: `youtube_api_${now.slice(0, 10)}`,
      contentHash: hash,
      crossPlatformGroupId: crypto.createHash('sha256').update(`${publishedAt.slice(0, 10)}|${title.toLowerCase()}`).digest('hex').slice(0, 24),
      importedAt: now,
      createdAt: publishedAt,
      updatedAt: now,
    } satisfies SocialPost;
  }).sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
}
