import 'server-only';

import type { SocialPost } from '@/types/social-media';
import type { SocialConnection } from '@/types/settings';
import { readData, writeData } from '@/lib/data-service';

const POSTS_FILE = 'social-posts.json';
const CONNECTIONS_FILE = 'social-connections.json';
const STATE_FILE = 'meta-public-history-backfill.json';
/**
 * Fecha desde donde AK Producciones comenzó a publicar en redes sociales (septiembre de 2019).
 * Centralizada para evitar omitir publicaciones del inicio de la cuenta.
 */
export const DEFAULT_EARLIEST_DATE = '2019-09-01T00:00:00.000Z';
const FULL_PAGE_LIMIT = 100;
const INCREMENTAL_PAGE_LIMIT = 2;
const PAGE_SIZE = 100;

type MetaHistoryPlatform = 'Facebook' | 'Instagram';

interface PlatformBackfillState {
  accountId?: string;
  lastAttemptAt?: string;
  lastFullSyncAt?: string;
  lastIncrementalSyncAt?: string;
  fetched?: number;
  imported?: number;
  updated?: number;
  error?: string;
}

interface MetaHistoryBackfillState {
  version: 1;
  earliestDate: string;
  platforms: Partial<Record<MetaHistoryPlatform, PlatformBackfillState>>;
}

export interface MetaHistoryPlatformResult {
  platform: MetaHistoryPlatform;
  mode: 'full' | 'incremental' | 'skipped';
  accountId?: string;
  fetched: number;
  imported: number;
  updated: number;
  oldestDate?: string;
  newestDate?: string;
  complete: boolean;
  error?: string;
}

export interface MetaHistoryBackfillResult {
  success: boolean;
  earliestDate: string;
  imported: number;
  updated: number;
  fetched: number;
  platforms: MetaHistoryPlatformResult[];
}

interface RawMetaPage<T> {
  data?: T[];
  paging?: {
    next?: string;
  };
  error?: {
    message?: string;
    code?: number;
  };
}

interface RawInstagramPost {
  id?: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
}

interface RawFacebookPost {
  id?: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
  attachments?: {
    data?: Array<{
      media_type?: string;
      url?: string;
    }>;
  };
}

interface FetchPagesResult<T> {
  items: T[];
  exhausted: boolean;
}

function graphVersion(): string {
  return process.env.META_GRAPH_API_VERSION
    || process.env.INSTAGRAM_GRAPH_API_VERSION
    || 'v25.0';
}

function normalizeIso(value?: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function afterEarliestDate(value: string | undefined, earliestDate: string): boolean {
  const normalized = normalizeIso(value);
  if (!normalized) return false;
  return new Date(normalized).getTime() >= new Date(earliestDate).getTime();
}

function mediaTypeFromMeta(value?: string): 'image' | 'video' | undefined {
  const type = String(value || '').toUpperCase();
  if (!type) return undefined;
  if (type.includes('VIDEO') || type.includes('REEL')) return 'video';
  if (type.includes('IMAGE') || type.includes('PHOTO') || type.includes('CAROUSEL')) return 'image';
  return undefined;
}

async function fetchGraphPages<T>(initialUrl: string, maxPages: number): Promise<FetchPagesResult<T>> {
  const items: T[] = [];
  let nextUrl: string | undefined = initialUrl;
  let pages = 0;

  while (nextUrl && pages < maxPages) {
    const response = await fetch(nextUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });

    const payload = await response.json().catch(() => ({})) as RawMetaPage<T>;
    if (!response.ok || payload.error) {
      const code = payload.error?.code ? ` (código ${payload.error.code})` : '';
      throw new Error(payload.error?.message ? `${payload.error.message}${code}` : `Meta Graph respondió HTTP ${response.status}.`);
    }

    if (Array.isArray(payload.data)) items.push(...payload.data);
    nextUrl = payload.paging?.next;
    pages += 1;
  }

  return { items, exhausted: !nextUrl };
}

function resolveInstagramConnection(connections: SocialConnection[]) {
  const connection = connections.find((item) => item.platform === 'Instagram' && item.isConnected);
  const accountId = connection?.instagramAccountId
    || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
    || process.env.INSTAGRAM_USER_ID;
  const token = connection?.pageAccessToken
    || process.env.INSTAGRAM_ACCESS_TOKEN
    || process.env.META_INSTAGRAM_ACCESS_TOKEN;

  return { connection, accountId, token };
}

function resolveFacebookConnection(connections: SocialConnection[]) {
  const connection = connections.find((item) => item.platform === 'Facebook' && item.isConnected);
  const accountId = connection?.pageId || process.env.FACEBOOK_PAGE_ID;
  const token = connection?.pageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  return { connection, accountId, token };
}

function shouldRunFullSync(
  previous: PlatformBackfillState | undefined,
  accountId: string,
  connectedAt?: string,
  force = false,
): boolean {
  if (force || !previous?.lastFullSyncAt) return true;
  if (previous.accountId !== accountId) return true;
  const connected = normalizeIso(connectedAt);
  const completed = normalizeIso(previous.lastFullSyncAt);
  return Boolean(connected && completed && connected > completed);
}

function findExistingIndex(posts: SocialPost[], candidate: SocialPost): number {
  return posts.findIndex((post) => {
    if (post.platform !== candidate.platform) return false;
    if (candidate.sourceId && post.sourceId && candidate.sourceId === post.sourceId) return true;
    if (candidate.sourceUrl) {
      if (post.sourceUrl === candidate.sourceUrl) return true;
      if (post.link === candidate.sourceUrl) return true;
    }
    if (candidate.link) {
      if (post.sourceUrl === candidate.link) return true;
      if (post.link === candidate.link) return true;
    }
    return false;
  });
}

function sameDate(a?: string, b?: string): boolean {
  const left = normalizeIso(a);
  const right = normalizeIso(b);
  return Boolean(left && right && left === right);
}

function mergeHistoricalPost(existing: SocialPost, candidate: SocialPost, importedAt: string): SocialPost {
  const candidateText = candidate.text.trim();
  const existingLooksLikeLiveInstagramSync = existing.status === 'Importado de IG';
  const accuratePublishDate = candidate.publishDate && !sameDate(existing.publishDate, candidate.publishDate)
    ? candidate.publishDate
    : existing.publishDate;

  return {
    ...existing,
    publishDate: accuratePublishDate,
    text: candidateText || existing.text,
    link: candidate.link || existing.link,
    mediaUrl: candidate.mediaUrl || existing.mediaUrl,
    mediaType: candidate.mediaType || existing.mediaType,
    status: existingLooksLikeLiveInstagramSync ? 'Importado historial' : existing.status,
    performance: {
      ...existing.performance,
      ...candidate.performance,
    },
    sourceId: candidate.sourceId || existing.sourceId,
    sourceUrl: candidate.sourceUrl || existing.sourceUrl,
    importBatchId: candidate.importBatchId || existing.importBatchId,
    importedAt: existing.importedAt || importedAt,
    updatedAt: importedAt,
  };
}

async function persistCandidates(candidates: SocialPost[]): Promise<{ imported: number; updated: number }> {
  if (!candidates.length) return { imported: 0, updated: 0 };

  const posts = await readData<SocialPost[]>(POSTS_FILE, []);
  const importedAt = new Date().toISOString();
  let imported = 0;
  let updated = 0;

  for (const candidate of candidates) {
    const existingIndex = findExistingIndex(posts, candidate);
    if (existingIndex >= 0) {
      posts[existingIndex] = mergeHistoricalPost(posts[existingIndex], candidate, importedAt);
      updated += 1;
      continue;
    }
    posts.push(candidate);
    imported += 1;
  }

  await writeData(
    POSTS_FILE,
    posts,
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );

  return { imported, updated };
}

function datesFromPosts(posts: SocialPost[]): { oldestDate?: string; newestDate?: string } {
  const dates = posts.map((post) => normalizeIso(post.publishDate)).filter((value): value is string => Boolean(value)).sort();
  return { oldestDate: dates[0], newestDate: dates[dates.length - 1] };
}

async function fetchInstagramHistory(
  accountId: string,
  token: string,
  earliestDate: string,
  full: boolean,
): Promise<{ posts: SocialPost[]; exhausted: boolean }> {
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
  const url = `https://graph.facebook.com/${graphVersion()}/${encodeURIComponent(accountId)}/media?fields=${encodeURIComponent(fields)}&limit=${PAGE_SIZE}&access_token=${encodeURIComponent(token)}`;
  const result = await fetchGraphPages<RawInstagramPost>(url, full ? FULL_PAGE_LIMIT : INCREMENTAL_PAGE_LIMIT);
  const importedAt = new Date().toISOString();
  const batchId = `meta_graph_instagram_${importedAt.slice(0, 10)}`;

  const posts = result.items.flatMap((item): SocialPost[] => {
    const publishDate = normalizeIso(item.timestamp);
    const sourceId = String(item.id || '').trim();
    if (!sourceId || !publishDate || !afterEarliestDate(publishDate, earliestDate)) return [];
    const permalink = String(item.permalink || '').trim() || undefined;
    const mediaUrl = String(item.thumbnail_url || item.media_url || '').trim() || undefined;

    return [{
      id: `ig_history_${sourceId}`,
      platform: 'Instagram',
      isGeneralCampaign: true,
      publishDate,
      text: String(item.caption || ''),
      link: permalink,
      mediaUrl,
      mediaType: mediaTypeFromMeta(item.media_type),
      status: 'Importado historial',
      performance: {
        likes: Number.isFinite(Number(item.like_count)) ? Number(item.like_count) : undefined,
        comments: Number.isFinite(Number(item.comments_count)) ? Number(item.comments_count) : undefined,
        interactions: Number.isFinite(Number(item.like_count)) || Number.isFinite(Number(item.comments_count))
          ? Number(item.like_count || 0) + Number(item.comments_count || 0)
          : undefined,
      },
      createdAt: importedAt,
      updatedAt: importedAt,
      sourceId,
      sourceUrl: permalink,
      importBatchId: batchId,
      importedAt,
    }];
  });

  return { posts, exhausted: result.exhausted };
}

async function fetchFacebookHistory(
  pageId: string,
  token: string,
  earliestDate: string,
  full: boolean,
): Promise<{ posts: SocialPost[]; exhausted: boolean }> {
  const fields = [
    'id',
    'message',
    'created_time',
    'permalink_url',
    'full_picture',
    'attachments{media_type,url}',
  ].join(',');
  const url = `https://graph.facebook.com/${graphVersion()}/${encodeURIComponent(pageId)}/published_posts?fields=${encodeURIComponent(fields)}&limit=${PAGE_SIZE}&access_token=${encodeURIComponent(token)}`;
  const result = await fetchGraphPages<RawFacebookPost>(url, full ? FULL_PAGE_LIMIT : INCREMENTAL_PAGE_LIMIT);
  const importedAt = new Date().toISOString();
  const batchId = `meta_graph_facebook_${importedAt.slice(0, 10)}`;

  const posts = result.items.flatMap((item): SocialPost[] => {
    const publishDate = normalizeIso(item.created_time);
    const sourceId = String(item.id || '').trim();
    if (!sourceId || !publishDate || !afterEarliestDate(publishDate, earliestDate)) return [];
    const permalink = String(item.permalink_url || '').trim() || undefined;
    const attachmentType = item.attachments?.data?.[0]?.media_type;
    const attachmentUrl = item.attachments?.data?.[0]?.url;
    const mediaUrl = String(item.full_picture || attachmentUrl || '').trim() || undefined;

    return [{
      id: `fb_history_${sourceId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      platform: 'Facebook',
      isGeneralCampaign: true,
      publishDate,
      text: String(item.message || ''),
      link: permalink,
      mediaUrl,
      mediaType: mediaTypeFromMeta(attachmentType),
      status: 'Importado historial',
      createdAt: importedAt,
      updatedAt: importedAt,
      sourceId,
      sourceUrl: permalink,
      importBatchId: batchId,
      importedAt,
    }];
  });

  return { posts, exhausted: result.exhausted };
}

export async function syncMetaPublicHistory(options?: {
  forceFull?: boolean;
  earliestDate?: string;
}): Promise<MetaHistoryBackfillResult> {
  const earliestDate = normalizeIso(options?.earliestDate) || DEFAULT_EARLIEST_DATE;
  const forceFull = options?.forceFull === true;
  const attemptAt = new Date().toISOString();
  const connections = await readData<SocialConnection[]>(CONNECTIONS_FILE, []);
  const previousState = await readData<MetaHistoryBackfillState>(STATE_FILE, {
    version: 1,
    earliestDate,
    platforms: {},
  });
  const nextState: MetaHistoryBackfillState = {
    version: 1,
    earliestDate,
    platforms: { ...previousState.platforms },
  };
  const platformResults: MetaHistoryPlatformResult[] = [];

  const instagram = resolveInstagramConnection(connections);
  if (!instagram.accountId || !instagram.token) {
    platformResults.push({
      platform: 'Instagram',
      mode: 'skipped',
      fetched: 0,
      imported: 0,
      updated: 0,
      complete: false,
      error: 'Instagram no tiene Account ID y token disponibles en la conexión de la app.',
    });
  } else {
    const previous = previousState.platforms.Instagram;
    const full = shouldRunFullSync(previous, instagram.accountId, instagram.connection?.connectedAt, forceFull);
    try {
      const history = await fetchInstagramHistory(instagram.accountId, instagram.token, earliestDate, full);
      const persisted = await persistCandidates(history.posts);
      const range = datesFromPosts(history.posts);
      const complete = full ? history.exhausted : Boolean(previous?.lastFullSyncAt);
      platformResults.push({
        platform: 'Instagram',
        mode: full ? 'full' : 'incremental',
        accountId: instagram.accountId,
        fetched: history.posts.length,
        imported: persisted.imported,
        updated: persisted.updated,
        ...range,
        complete,
      });
      nextState.platforms.Instagram = {
        accountId: instagram.accountId,
        lastAttemptAt: attemptAt,
        lastFullSyncAt: full && history.exhausted ? attemptAt : previous?.lastFullSyncAt,
        lastIncrementalSyncAt: full ? previous?.lastIncrementalSyncAt : attemptAt,
        fetched: history.posts.length,
        imported: persisted.imported,
        updated: persisted.updated,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo leer Instagram desde Meta Graph.';
      platformResults.push({
        platform: 'Instagram',
        mode: full ? 'full' : 'incremental',
        accountId: instagram.accountId,
        fetched: 0,
        imported: 0,
        updated: 0,
        complete: false,
        error: message,
      });
      nextState.platforms.Instagram = {
        ...previous,
        accountId: instagram.accountId,
        lastAttemptAt: attemptAt,
        error: message,
      };
    }
  }

  const facebook = resolveFacebookConnection(connections);
  if (!facebook.accountId || !facebook.token) {
    platformResults.push({
      platform: 'Facebook',
      mode: 'skipped',
      fetched: 0,
      imported: 0,
      updated: 0,
      complete: false,
      error: 'Facebook no tiene Page ID y token disponibles en la conexión de la app.',
    });
  } else {
    const previous = previousState.platforms.Facebook;
    const full = shouldRunFullSync(previous, facebook.accountId, facebook.connection?.connectedAt, forceFull);
    try {
      const history = await fetchFacebookHistory(facebook.accountId, facebook.token, earliestDate, full);
      const persisted = await persistCandidates(history.posts);
      const range = datesFromPosts(history.posts);
      const complete = full ? history.exhausted : Boolean(previous?.lastFullSyncAt);
      platformResults.push({
        platform: 'Facebook',
        mode: full ? 'full' : 'incremental',
        accountId: facebook.accountId,
        fetched: history.posts.length,
        imported: persisted.imported,
        updated: persisted.updated,
        ...range,
        complete,
      });
      nextState.platforms.Facebook = {
        accountId: facebook.accountId,
        lastAttemptAt: attemptAt,
        lastFullSyncAt: full && history.exhausted ? attemptAt : previous?.lastFullSyncAt,
        lastIncrementalSyncAt: full ? previous?.lastIncrementalSyncAt : attemptAt,
        fetched: history.posts.length,
        imported: persisted.imported,
        updated: persisted.updated,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo leer Facebook desde Meta Graph.';
      platformResults.push({
        platform: 'Facebook',
        mode: full ? 'full' : 'incremental',
        accountId: facebook.accountId,
        fetched: 0,
        imported: 0,
        updated: 0,
        complete: false,
        error: message,
      });
      nextState.platforms.Facebook = {
        ...previous,
        accountId: facebook.accountId,
        lastAttemptAt: attemptAt,
        error: message,
      };
    }
  }

  await writeData(STATE_FILE, nextState);

  const fetched = platformResults.reduce((sum, item) => sum + item.fetched, 0);
  const imported = platformResults.reduce((sum, item) => sum + item.imported, 0);
  const updated = platformResults.reduce((sum, item) => sum + item.updated, 0);
  const attempted = platformResults.filter((item) => item.mode !== 'skipped');

  return {
    success: attempted.length > 0 && attempted.every((item) => !item.error),
    earliestDate,
    fetched,
    imported,
    updated,
    platforms: platformResults,
  };
}
