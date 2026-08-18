import 'server-only';

import { XMLParser } from 'fast-xml-parser';
import { readData, writeData } from '@/lib/data-service';
import type { SocialPost } from '@/types/social-media';
import { AK_YOUTUBE_CHANNEL_ID } from '@/lib/youtube/ak-channel';

const POSTS_FILE = 'social-posts.json';
const STATE_FILE = 'youtube-public-history-backfill.json';
const EARLIEST_DATE = '2019-09-01T00:00:00.000Z';
const PAGE_SIZE = 50;
const MAX_PAGES = 100;

interface YouTubeState {
  version: 1;
  channelId: string;
  lastAttemptAt?: string;
  lastFullSyncAt?: string;
  mode?: 'data_api' | 'rss';
  fetched?: number;
  imported?: number;
  updated?: number;
  complete?: boolean;
  error?: string;
}

export interface YouTubeHistoryResult {
  success: boolean;
  mode: 'data_api' | 'rss';
  channelId: string;
  fetched: number;
  imported: number;
  updated: number;
  complete: boolean;
  oldestDate?: string;
  newestDate?: string;
  error?: string;
}

interface ChannelsResponse {
  items?: Array<{
    contentDetails?: {
      relatedPlaylists?: { uploads?: string };
    };
  }>;
  error?: { message?: string };
}

interface PlaylistSnippet {
  publishedAt?: string;
  title?: string;
  description?: string;
  resourceId?: { videoId?: string };
  thumbnails?: Record<string, { url?: string }>;
}

interface PlaylistItemsResponse {
  nextPageToken?: string;
  items?: Array<{
    snippet?: PlaylistSnippet;
    contentDetails?: { videoId?: string; videoPublishedAt?: string };
  }>;
  error?: { message?: string };
}

interface FeedEntry {
  'yt:videoId'?: string;
  title?: string;
  published?: string;
}

interface FeedDocument {
  feed?: { entry?: FeedEntry | FeedEntry[] };
}

function normalizeIso(value?: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function isInScope(date?: string): boolean {
  const normalized = normalizeIso(date);
  return Boolean(normalized && normalized >= EARLIEST_DATE);
}

function dateRange(posts: SocialPost[]): { oldestDate?: string; newestDate?: string } {
  const dates = posts.map((post) => normalizeIso(post.publishDate)).filter((value): value is string => Boolean(value)).sort();
  return { oldestDate: dates[0], newestDate: dates[dates.length - 1] };
}

function thumbnailFromSnippet(snippet?: PlaylistSnippet): string | undefined {
  const thumbs = snippet?.thumbnails;
  return thumbs?.maxres?.url || thumbs?.standard?.url || thumbs?.high?.url || thumbs?.medium?.url || thumbs?.default?.url;
}

async function youtubeJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15_000) });
  const body = await response.json().catch(() => ({})) as T & { error?: { message?: string } };
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || `YouTube respondió HTTP ${response.status}.`);
  }
  return body;
}

async function fetchWithDataApi(apiKey: string): Promise<SocialPost[]> {
  const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
  channelUrl.searchParams.set('part', 'contentDetails');
  channelUrl.searchParams.set('id', AK_YOUTUBE_CHANNEL_ID);
  channelUrl.searchParams.set('key', apiKey);
  const channel = await youtubeJson<ChannelsResponse>(channelUrl.toString());
  const uploads = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error('YouTube no devolvió la lista pública de subidas del canal oficial.');

  const all: SocialPost[] = [];
  let pageToken: string | undefined;
  let pages = 0;
  const importedAt = new Date().toISOString();
  const batchId = `youtube_data_api_${importedAt.slice(0, 10)}`;

  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', uploads);
    url.searchParams.set('maxResults', String(PAGE_SIZE));
    url.searchParams.set('key', apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const page = await youtubeJson<PlaylistItemsResponse>(url.toString());
    for (const item of page.items || []) {
      const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      const publishDate = normalizeIso(item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt);
      if (!videoId || !publishDate || !isInScope(publishDate)) continue;
      const link = `https://www.youtube.com/watch?v=${videoId}`;
      const title = String(item.snippet?.title || '').trim();
      const description = String(item.snippet?.description || '').trim();
      all.push({
        id: `youtube_history_${videoId}`,
        platform: 'YouTube',
        isGeneralCampaign: true,
        publishDate,
        text: [title, description].filter(Boolean).join('\n\n'),
        link,
        mediaUrl: thumbnailFromSnippet(item.snippet),
        mediaType: 'video',
        status: 'Importado historial',
        createdAt: importedAt,
        updatedAt: importedAt,
        sourceId: videoId,
        sourceUrl: link,
        importBatchId: batchId,
        importedAt,
      });
    }

    pageToken = page.nextPageToken;
    pages += 1;
  } while (pageToken && pages < MAX_PAGES);

  if (pageToken) throw new Error('El canal supera el límite de seguridad del barrido de YouTube.');
  return all;
}

async function fetchWithRss(): Promise<SocialPost[]> {
  const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${AK_YOUTUBE_CHANNEL_ID}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`El feed público de YouTube respondió HTTP ${response.status}.`);
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(await response.text()) as FeedDocument;
  const raw = parsed.feed?.entry;
  const entries = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
  const importedAt = new Date().toISOString();
  const batchId = `youtube_rss_${importedAt.slice(0, 10)}`;

  return entries.flatMap((entry): SocialPost[] => {
    const videoId = String(entry['yt:videoId'] || '').trim();
    const publishDate = normalizeIso(entry.published);
    if (!videoId || !publishDate || !isInScope(publishDate)) return [];
    const link = `https://www.youtube.com/watch?v=${videoId}`;
    return [{
      id: `youtube_history_${videoId}`,
      platform: 'YouTube',
      isGeneralCampaign: true,
      publishDate,
      text: String(entry.title || '').trim(),
      link,
      mediaUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      mediaType: 'video',
      status: 'Importado historial',
      createdAt: importedAt,
      updatedAt: importedAt,
      sourceId: videoId,
      sourceUrl: link,
      importBatchId: batchId,
      importedAt,
    }];
  });
}

function existingIndex(posts: SocialPost[], candidate: SocialPost): number {
  return posts.findIndex((post) => post.platform === 'YouTube' && (
    (candidate.sourceId && post.sourceId === candidate.sourceId)
    || (candidate.sourceUrl && (post.sourceUrl === candidate.sourceUrl || post.link === candidate.sourceUrl))
    || (candidate.link && (post.link === candidate.link || post.sourceUrl === candidate.link))
  ));
}

async function persist(postsToImport: SocialPost[]): Promise<{ imported: number; updated: number }> {
  const posts = await readData<SocialPost[]>(POSTS_FILE, []);
  let imported = 0;
  let updated = 0;
  for (const candidate of postsToImport) {
    const index = existingIndex(posts, candidate);
    if (index < 0) {
      posts.push(candidate);
      imported += 1;
      continue;
    }
    posts[index] = {
      ...posts[index],
      publishDate: candidate.publishDate,
      text: candidate.text || posts[index].text,
      link: candidate.link || posts[index].link,
      mediaUrl: candidate.mediaUrl || posts[index].mediaUrl,
      mediaType: 'video',
      sourceId: candidate.sourceId || posts[index].sourceId,
      sourceUrl: candidate.sourceUrl || posts[index].sourceUrl,
      importBatchId: candidate.importBatchId || posts[index].importBatchId,
      importedAt: posts[index].importedAt || candidate.importedAt,
      updatedAt: candidate.updatedAt,
    };
    updated += 1;
  }
  await writeData(POSTS_FILE, posts, (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  return { imported, updated };
}

export async function syncYouTubePublicHistory(): Promise<YouTubeHistoryResult> {
  const attemptAt = new Date().toISOString();
  const apiKey = process.env.YOUTUBE_API_KEY;
  const mode: 'data_api' | 'rss' = apiKey ? 'data_api' : 'rss';

  try {
    let candidates: SocialPost[];
    let complete = false;
    if (apiKey) {
      try {
        candidates = await fetchWithDataApi(apiKey);
        complete = true;
      } catch {
        candidates = await fetchWithRss();
      }
    } else {
      candidates = await fetchWithRss();
    }

    const actualMode: 'data_api' | 'rss' = complete ? 'data_api' : 'rss';
    const saved = await persist(candidates);
    const range = dateRange(candidates);
    const state: YouTubeState = {
      version: 1,
      channelId: AK_YOUTUBE_CHANNEL_ID,
      lastAttemptAt: attemptAt,
      lastFullSyncAt: complete ? attemptAt : undefined,
      mode: actualMode,
      fetched: candidates.length,
      imported: saved.imported,
      updated: saved.updated,
      complete,
    };
    await writeData(STATE_FILE, state);
    return {
      success: true,
      mode: actualMode,
      channelId: AK_YOUTUBE_CHANNEL_ID,
      fetched: candidates.length,
      imported: saved.imported,
      updated: saved.updated,
      complete,
      ...range,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo leer el canal público de YouTube.';
    await writeData<YouTubeState>(STATE_FILE, {
      version: 1,
      channelId: AK_YOUTUBE_CHANNEL_ID,
      lastAttemptAt: attemptAt,
      mode,
      fetched: 0,
      imported: 0,
      updated: 0,
      complete: false,
      error: message,
    });
    return {
      success: false,
      mode,
      channelId: AK_YOUTUBE_CHANNEL_ID,
      fetched: 0,
      imported: 0,
      updated: 0,
      complete: false,
      error: message,
    };
  }
}
