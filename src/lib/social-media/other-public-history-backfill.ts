import 'server-only';

import { readData, writeData } from '@/lib/data-service';
import type { SocialPlatform, SocialPost } from '@/types/social-media';

const POSTS_FILE = 'social-posts.json';
const STATE_FILE = 'other-public-history-backfill.json';
const EARLIEST_DATE = '2019-09-01T00:00:00.000Z';
const TIKTOK_MAX_PAGES = 200;
const THREADS_MAX_PAGES = 200;
const X_MAX_POSTS = 3200;
const X_USERNAME = process.env.X_PUBLIC_USERNAME || 'AkSalto';

type SupportedPlatform = 'TikTok' | 'Threads' | 'X';
type SyncMode = 'api' | 'skipped';

export interface OtherHistoryPlatformResult {
  platform: SupportedPlatform;
  mode: SyncMode;
  fetched: number;
  imported: number;
  updated: number;
  complete: boolean;
  oldestDate?: string;
  newestDate?: string;
  reason?: string;
  error?: string;
}

export interface OtherPublicHistoryResult {
  success: boolean;
  earliestDate: string;
  platforms: OtherHistoryPlatformResult[];
}

interface OtherHistoryState {
  version: 1;
  earliestDate: string;
  lastAttemptAt: string;
  platforms: Partial<Record<SupportedPlatform, OtherHistoryPlatformResult & { lastSyncAt?: string }>>;
}

interface TikTokVideo {
  id?: string;
  title?: string;
  video_description?: string;
  create_time?: number;
  cover_image_url?: string;
  share_url?: string;
  embed_link?: string;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
}

interface TikTokListResponse {
  data?: {
    videos?: TikTokVideo[];
    cursor?: number;
    has_more?: boolean;
  };
  error?: {
    code?: string;
    message?: string;
    log_id?: string;
  };
}

interface ThreadsPost {
  id?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  text?: string;
  timestamp?: string;
  thumbnail_url?: string;
}

interface ThreadsResponse {
  data?: ThreadsPost[];
  paging?: {
    next?: string;
    cursors?: { before?: string; after?: string };
  };
  error?: { message?: string; code?: number };
}

interface XUserResponse {
  data?: { id?: string; username?: string };
  errors?: Array<{ detail?: string; title?: string }>;
}

interface XPost {
  id?: string;
  text?: string;
  created_at?: string;
  public_metrics?: {
    like_count?: number;
    reply_count?: number;
    retweet_count?: number;
    quote_count?: number;
    bookmark_count?: number;
    impression_count?: number;
  };
}

interface XTimelineResponse {
  data?: XPost[];
  meta?: { next_token?: string; result_count?: number };
  errors?: Array<{ detail?: string; title?: string }>;
}

function normalizeIso(value?: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function isoFromUnixSeconds(value?: number): string | undefined {
  if (!Number.isFinite(value)) return undefined;
  return normalizeIso(new Date(Number(value) * 1000).toISOString());
}

function inScope(value?: string): boolean {
  const normalized = normalizeIso(value);
  return Boolean(normalized && normalized >= EARLIEST_DATE);
}

function dateRange(posts: SocialPost[]): { oldestDate?: string; newestDate?: string } {
  const dates = posts
    .map((post) => normalizeIso(post.publishDate))
    .filter((value): value is string => Boolean(value))
    .sort();
  return { oldestDate: dates[0], newestDate: dates[dates.length - 1] };
}

function mediaType(value?: string): 'image' | 'video' | undefined {
  const type = String(value || '').toUpperCase();
  if (type.includes('VIDEO')) return 'video';
  if (type.includes('IMAGE') || type.includes('CAROUSEL')) return 'image';
  return undefined;
}

function findExistingIndex(posts: SocialPost[], candidate: SocialPost): number {
  return posts.findIndex((post) => {
    if (post.platform !== candidate.platform) return false;
    if (candidate.sourceId && post.sourceId === candidate.sourceId) return true;
    const urls = [candidate.sourceUrl, candidate.link].filter(Boolean);
    return urls.some((url) => post.sourceUrl === url || post.link === url);
  });
}

async function persistCandidates(candidates: SocialPost[]): Promise<{ imported: number; updated: number }> {
  if (!candidates.length) return { imported: 0, updated: 0 };
  const posts = await readData<SocialPost[]>(POSTS_FILE, []);
  let imported = 0;
  let updated = 0;

  for (const candidate of candidates) {
    const index = findExistingIndex(posts, candidate);
    if (index < 0) {
      posts.push(candidate);
      imported += 1;
      continue;
    }

    posts[index] = {
      ...posts[index],
      publishDate: candidate.publishDate || posts[index].publishDate,
      text: candidate.text || posts[index].text,
      link: candidate.link || posts[index].link,
      mediaUrl: candidate.mediaUrl || posts[index].mediaUrl,
      mediaType: candidate.mediaType || posts[index].mediaType,
      performance: { ...posts[index].performance, ...candidate.performance },
      sourceId: candidate.sourceId || posts[index].sourceId,
      sourceUrl: candidate.sourceUrl || posts[index].sourceUrl,
      importBatchId: candidate.importBatchId || posts[index].importBatchId,
      importedAt: posts[index].importedAt || candidate.importedAt,
      status: 'Importado historial',
      updatedAt: candidate.updatedAt,
    };
    updated += 1;
  }

  await writeData(
    POSTS_FILE,
    posts,
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );
  return { imported, updated };
}

function makePost(input: {
  platform: SocialPlatform;
  sourceId: string;
  publishDate: string;
  text?: string;
  link?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  performance?: SocialPost['performance'];
  batchId: string;
  importedAt: string;
}): SocialPost {
  const safeId = input.sourceId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return {
    id: `${input.platform.toLowerCase()}_history_${safeId}`,
    platform: input.platform,
    isGeneralCampaign: true,
    publishDate: input.publishDate,
    text: input.text || '',
    link: input.link,
    mediaUrl: input.mediaUrl,
    mediaType: input.mediaType,
    performance: input.performance,
    status: 'Importado historial',
    createdAt: input.importedAt,
    updatedAt: input.importedAt,
    sourceId: input.sourceId,
    sourceUrl: input.link,
    importBatchId: input.batchId,
    importedAt: input.importedAt,
  };
}

async function syncTikTok(): Promise<OtherHistoryPlatformResult> {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) {
    return {
      platform: 'TikTok', mode: 'skipped', fetched: 0, imported: 0, updated: 0, complete: false,
      reason: 'Falta TIKTOK_ACCESS_TOKEN con permiso video.list.',
    };
  }

  try {
    const importedAt = new Date().toISOString();
    const batchId = `tiktok_api_${importedAt.slice(0, 10)}`;
    const candidates: SocialPost[] = [];
    let cursor: number | undefined;
    let hasMore = true;
    let pages = 0;
    let reachedCutoff = false;

    while (hasMore && pages < TIKTOK_MAX_PAGES) {
      const response = await fetch(
        'https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,create_time,cover_image_url,share_url,embed_link,like_count,comment_count,share_count,view_count',
        {
          method: 'POST',
          cache: 'no-store',
          signal: AbortSignal.timeout(15_000),
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ max_count: 20, ...(cursor ? { cursor } : {}) }),
        },
      );
      const payload = await response.json().catch(() => ({})) as TikTokListResponse;
      if (!response.ok || (payload.error?.code && payload.error.code !== 'ok')) {
        throw new Error(payload.error?.message || `TikTok respondió HTTP ${response.status}.`);
      }

      for (const video of payload.data?.videos || []) {
        const publishDate = isoFromUnixSeconds(video.create_time);
        if (!publishDate) continue;
        if (!inScope(publishDate)) {
          reachedCutoff = true;
          continue;
        }
        const sourceId = String(video.id || '').trim();
        if (!sourceId) continue;
        const link = String(video.share_url || video.embed_link || '').trim() || undefined;
        candidates.push(makePost({
          platform: 'TikTok',
          sourceId,
          publishDate,
          text: String(video.video_description || video.title || ''),
          link,
          mediaUrl: String(video.cover_image_url || '').trim() || undefined,
          mediaType: 'video',
          performance: {
            likes: Number(video.like_count || 0),
            comments: Number(video.comment_count || 0),
            shares: Number(video.share_count || 0),
            views: Number(video.view_count || 0),
            interactions: Number(video.like_count || 0) + Number(video.comment_count || 0) + Number(video.share_count || 0),
          },
          batchId,
          importedAt,
        }));
      }

      hasMore = payload.data?.has_more === true && !reachedCutoff;
      cursor = payload.data?.cursor;
      pages += 1;
      if (hasMore && !cursor) throw new Error('TikTok indicó más páginas pero no devolvió cursor.');
    }

    const saved = await persistCandidates(candidates);
    return {
      platform: 'TikTok',
      mode: 'api',
      fetched: candidates.length,
      imported: saved.imported,
      updated: saved.updated,
      complete: reachedCutoff || !hasMore,
      ...dateRange(candidates),
      ...(pages >= TIKTOK_MAX_PAGES && hasMore ? { reason: 'Se alcanzó el límite de seguridad de paginación.' } : {}),
    };
  } catch (error) {
    return {
      platform: 'TikTok', mode: 'api', fetched: 0, imported: 0, updated: 0, complete: false,
      error: error instanceof Error ? error.message : 'No se pudo leer TikTok.',
    };
  }
}

async function syncThreads(): Promise<OtherHistoryPlatformResult> {
  const token = process.env.THREADS_ACCESS_TOKEN;
  if (!token) {
    return {
      platform: 'Threads', mode: 'skipped', fetched: 0, imported: 0, updated: 0, complete: false,
      reason: 'Falta THREADS_ACCESS_TOKEN con autorización de Threads.',
    };
  }

  try {
    const importedAt = new Date().toISOString();
    const batchId = `threads_api_${importedAt.slice(0, 10)}`;
    const candidates: SocialPost[] = [];
    const userId = process.env.THREADS_USER_ID || 'me';
    const firstUrl = new URL(`https://graph.threads.net/v1.0/${encodeURIComponent(userId)}/threads`);
    firstUrl.searchParams.set('fields', 'id,media_type,media_url,permalink,text,timestamp,thumbnail_url');
    firstUrl.searchParams.set('limit', '50');
    firstUrl.searchParams.set('access_token', token);

    let nextUrl: string | undefined = firstUrl.toString();
    let pages = 0;
    let reachedCutoff = false;

    while (nextUrl && pages < THREADS_MAX_PAGES && !reachedCutoff) {
      const response = await fetch(nextUrl, { cache: 'no-store', signal: AbortSignal.timeout(15_000) });
      const payload = await response.json().catch(() => ({})) as ThreadsResponse;
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message || `Threads respondió HTTP ${response.status}.`);
      }

      for (const item of payload.data || []) {
        const publishDate = normalizeIso(item.timestamp);
        if (!publishDate) continue;
        if (!inScope(publishDate)) {
          reachedCutoff = true;
          continue;
        }
        const sourceId = String(item.id || '').trim();
        if (!sourceId) continue;
        const link = String(item.permalink || '').trim() || undefined;
        candidates.push(makePost({
          platform: 'Threads',
          sourceId,
          publishDate,
          text: String(item.text || ''),
          link,
          mediaUrl: String(item.thumbnail_url || item.media_url || '').trim() || undefined,
          mediaType: mediaType(item.media_type),
          batchId,
          importedAt,
        }));
      }

      nextUrl = reachedCutoff ? undefined : payload.paging?.next;
      pages += 1;
    }

    const saved = await persistCandidates(candidates);
    const pageLimitReached = pages >= THREADS_MAX_PAGES && Boolean(nextUrl);
    return {
      platform: 'Threads',
      mode: 'api',
      fetched: candidates.length,
      imported: saved.imported,
      updated: saved.updated,
      complete: reachedCutoff || (!nextUrl && !pageLimitReached),
      ...dateRange(candidates),
      ...(pageLimitReached ? { reason: 'Se alcanzó el límite de seguridad de paginación.' } : {}),
    };
  } catch (error) {
    return {
      platform: 'Threads', mode: 'api', fetched: 0, imported: 0, updated: 0, complete: false,
      error: error instanceof Error ? error.message : 'No se pudo leer Threads.',
    };
  }
}

async function xJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({})) as T & { errors?: Array<{ detail?: string; title?: string }> };
  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.map((item) => item.detail || item.title).filter(Boolean).join('; ');
    throw new Error(message || `X respondió HTTP ${response.status}.`);
  }
  return payload;
}

async function syncX(): Promise<OtherHistoryPlatformResult> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    return {
      platform: 'X', mode: 'skipped', fetched: 0, imported: 0, updated: 0, complete: false,
      reason: 'Falta X_BEARER_TOKEN para leer la cronología pública.',
    };
  }

  try {
    const userUrl = `https://api.x.com/2/users/by/username/${encodeURIComponent(X_USERNAME)}`;
    const user = await xJson<XUserResponse>(userUrl, token);
    const userId = user.data?.id;
    const username = user.data?.username || X_USERNAME;
    if (!userId) throw new Error(`X no encontró el usuario público @${X_USERNAME}.`);

    const importedAt = new Date().toISOString();
    const batchId = `x_api_${importedAt.slice(0, 10)}`;
    const candidates: SocialPost[] = [];
    let nextToken: string | undefined;
    let totalRead = 0;
    let reachedCutoff = false;
    let apiCapReached = false;

    do {
      const url = new URL(`https://api.x.com/2/users/${encodeURIComponent(userId)}/tweets`);
      url.searchParams.set('max_results', '100');
      url.searchParams.set('tweet.fields', 'created_at,public_metrics');
      if (nextToken) url.searchParams.set('pagination_token', nextToken);

      const page = await xJson<XTimelineResponse>(url.toString(), token);
      const rawPosts = page.data || [];
      totalRead += rawPosts.length;

      for (const item of rawPosts) {
        const publishDate = normalizeIso(item.created_at);
        if (!publishDate) continue;
        if (!inScope(publishDate)) {
          reachedCutoff = true;
          continue;
        }
        const sourceId = String(item.id || '').trim();
        if (!sourceId) continue;
        const metrics = item.public_metrics;
        const link = `https://x.com/${encodeURIComponent(username)}/status/${sourceId}`;
        candidates.push(makePost({
          platform: 'X',
          sourceId,
          publishDate,
          text: String(item.text || ''),
          link,
          performance: metrics ? {
            likes: Number(metrics.like_count || 0),
            comments: Number(metrics.reply_count || 0),
            shares: Number(metrics.retweet_count || 0) + Number(metrics.quote_count || 0),
            views: Number(metrics.impression_count || 0),
            saves: Number(metrics.bookmark_count || 0),
            interactions: Number(metrics.like_count || 0) + Number(metrics.reply_count || 0) + Number(metrics.retweet_count || 0) + Number(metrics.quote_count || 0),
          } : undefined,
          batchId,
          importedAt,
        }));
      }

      nextToken = reachedCutoff ? undefined : page.meta?.next_token;
      if (totalRead >= X_MAX_POSTS && nextToken) {
        apiCapReached = true;
        break;
      }
    } while (nextToken);

    const saved = await persistCandidates(candidates);
    return {
      platform: 'X',
      mode: 'api',
      fetched: candidates.length,
      imported: saved.imported,
      updated: saved.updated,
      complete: !apiCapReached && (reachedCutoff || !nextToken),
      ...dateRange(candidates),
      ...(apiCapReached ? { reason: 'La cronología de usuario de X limita el acceso a los 3.200 posts más recientes.' } : {}),
    };
  } catch (error) {
    return {
      platform: 'X', mode: 'api', fetched: 0, imported: 0, updated: 0, complete: false,
      error: error instanceof Error ? error.message : 'No se pudo leer X.',
    };
  }
}

export async function syncOtherPublicHistory(): Promise<OtherPublicHistoryResult> {
  const lastAttemptAt = new Date().toISOString();
  const platforms = await Promise.all([syncTikTok(), syncThreads(), syncX()]);
  const state: OtherHistoryState = {
    version: 1,
    earliestDate: EARLIEST_DATE,
    lastAttemptAt,
    platforms: Object.fromEntries(
      platforms.map((item) => [item.platform, { ...item, ...(item.mode === 'api' && !item.error ? { lastSyncAt: lastAttemptAt } : {}) }]),
    ) as OtherHistoryState['platforms'],
  };
  await writeData(STATE_FILE, state);

  const attempted = platforms.filter((item) => item.mode === 'api');
  return {
    success: attempted.length > 0 ? attempted.every((item) => !item.error) : true,
    earliestDate: EARLIEST_DATE,
    platforms,
  };
}
