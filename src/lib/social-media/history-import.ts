import crypto from 'crypto';
import JSZip from 'jszip';
import type { SocialPlatform, SocialPost } from '@/types/social-media';

const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_ARCHIVE_ENTRIES = 5000;
const MAX_RECORDS = 15000;

export const ALLOWED_HISTORY_PLATFORMS: SocialPlatform[] = [
  'Facebook',
  'Instagram',
  'Threads',
  'TikTok',
  'YouTube',
  'X',
];

const POST_FILE_HINTS = [
  'post', 'posts', 'media', 'content', 'tweet', 'tweets', 'video', 'videos',
  'thread', 'threads', 'publication', 'publicaciones', 'your_posts', 'profile_posts',
];

export interface HistoricalImportResult {
  platform: SocialPlatform;
  batchId: string;
  posts: SocialPost[];
  scannedFiles: number;
  ignoredFiles: number;
  warnings: string[];
}

type UnknownRecord = Record<string, unknown>;

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();
}

function firstText(record: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    const text = cleanText(value);
    if (text) return text;
  }
  return '';
}

function getNestedMetaText(record: UnknownRecord): string {
  const data = record.data;
  if (Array.isArray(data)) {
    for (const item of data) {
      if (!item || typeof item !== 'object') continue;
      const itemRecord = item as UnknownRecord;
      const direct = firstText(itemRecord, ['post', 'text', 'caption', 'title', 'description']);
      if (direct) return direct;
    }
  }

  const stringMap = record.string_map_data;
  if (stringMap && typeof stringMap === 'object' && !Array.isArray(stringMap)) {
    const parts: string[] = [];
    for (const value of Object.values(stringMap as UnknownRecord)) {
      if (!value || typeof value !== 'object') continue;
      const v = value as UnknownRecord;
      const text = firstText(v, ['value', 'text', 'title']);
      if (text) parts.push(text);
    }
    if (parts.length) return parts.join(' — ');
  }

  // Check attachments (Facebook format)
  const attachments = record.attachments;
  if (Array.isArray(attachments)) {
    for (const att of attachments) {
      if (!att || typeof att !== 'object') continue;
      const attRecord = att as UnknownRecord;
      if (Array.isArray(attRecord.data)) {
        for (const item of attRecord.data) {
          if (!item || typeof item !== 'object') continue;
          const mediaObj = (item as UnknownRecord).media as UnknownRecord | undefined;
          if (mediaObj) {
            const title = firstText(mediaObj, ['title', 'description']);
            if (title) return title;
          }
        }
      }
    }
  }

  return '';
}

function extractText(record: UnknownRecord): string {
  return firstText(record, [
    'text', 'caption', 'message', 'description', 'title', 'post', 'content',
    'tweet', 'full_text', 'shareComment', 'desc', 'video_description',
  ]) || getNestedMetaText(record);
}

function toIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    // Unix timestamp in seconds vs milliseconds
    const millis = value < 10_000_000_000 ? value * 1000 : value;
    const parsed = new Date(millis);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{10,13}$/.test(trimmed)) return toIsoDate(Number(trimmed));
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  return null;
}

function extractDate(record: UnknownRecord): string | null {
  const keys = [
    'timestamp', 'timestamp_ms', 'creation_timestamp', 'created_at', 'createdAt',
    'create_time', 'createTime', 'published_at', 'publishedAt', 'publication_date',
    'date', 'time', 'uploadDate',
  ];
  for (const key of keys) {
    const iso = toIsoDate(record[key]);
    if (iso) return iso;
  }

  const stringMap = record.string_map_data;
  if (stringMap && typeof stringMap === 'object' && !Array.isArray(stringMap)) {
    for (const value of Object.values(stringMap as UnknownRecord)) {
      if (!value || typeof value !== 'object') continue;
      const v = value as UnknownRecord;
      const iso = toIsoDate(v.timestamp) || toIsoDate(v.value);
      if (iso) return iso;
    }
  }

  return null;
}

function looksLikeUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function extractUrl(record: UnknownRecord): string | undefined {
  for (const key of ['permalink', 'url', 'link', 'share_url', 'shareUrl', 'webpage_url']) {
    const value = record[key];
    if (looksLikeUrl(value)) return value.trim();
  }

  const stringMap = record.string_map_data;
  if (stringMap && typeof stringMap === 'object' && !Array.isArray(stringMap)) {
    for (const value of Object.values(stringMap as UnknownRecord)) {
      if (!value || typeof value !== 'object') continue;
      const href = (value as UnknownRecord).href;
      if (looksLikeUrl(href)) return href.trim();
    }
  }

  return undefined;
}

function extractId(record: UnknownRecord): string | undefined {
  for (const key of ['id', 'post_id', 'postId', 'media_id', 'mediaId', 'tweetId', 'tweet_id', 'itemId', 'video_id', 'videoId']) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') {
      const clean = String(value).trim();
      if (clean) return clean;
    }
  }
  return undefined;
}

function extractMetric(record: UnknownRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim());
  }
  return undefined;
}

function extractMedia(record: UnknownRecord): { mediaUrl?: string; mediaType?: 'image' | 'video'; archiveMediaPath?: string } {
  const directCandidates = ['media_url', 'mediaUrl', 'thumbnail_url', 'thumbnailUrl', 'uri', 'path', 'file', 'filename'];
  let found: string | undefined;

  for (const key of directCandidates) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      found = value.trim();
      break;
    }
  }

  if (!found && Array.isArray(record.media) && record.media.length) {
    const mediaItem = record.media[0];
    if (mediaItem && typeof mediaItem === 'object') {
      const mediaRecord = mediaItem as UnknownRecord;
      found = firstText(mediaRecord, ['uri', 'media_url', 'url', 'path']);
    }
  }

  // Check attachments for media uri (Facebook export)
  if (!found && Array.isArray(record.attachments)) {
    for (const att of record.attachments) {
      if (!att || typeof att !== 'object') continue;
      const attRecord = att as UnknownRecord;
      if (Array.isArray(attRecord.data)) {
        for (const item of attRecord.data) {
          if (!item || typeof item !== 'object') continue;
          const mediaObj = (item as UnknownRecord).media as UnknownRecord | undefined;
          if (mediaObj) {
            found = firstText(mediaObj, ['uri', 'url', 'media_url']);
            if (found) break;
          }
        }
      }
      if (found) break;
    }
  }

  if (!found) return {};

  const extensionSource = found.split('?')[0].toLowerCase();
  const mediaType: 'image' | 'video' = /\.(mp4|mov|m4v|webm|avi)$/i.test(extensionSource)
    || String(record.media_type || record.type || '').toLowerCase().includes('video')
    ? 'video'
    : 'image';

  if (looksLikeUrl(found)) return { mediaUrl: found, mediaType };
  return { archiveMediaPath: found, mediaType };
}

function normalizedCopyKey(text: string, publishDate: string): string {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/#[\p{L}\p{N}_]+/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  const day = publishDate.slice(0, 10);
  return crypto.createHash('sha256').update(`${day}|${normalized}`).digest('hex').slice(0, 24);
}

function makeContentHash(platform: SocialPlatform, sourceId: string | undefined, sourceUrl: string | undefined, text: string, publishDate: string): string {
  const base = sourceId
    ? `${platform}|id|${sourceId}`
    : sourceUrl
      ? `${platform}|url|${sourceUrl}`
      : `${platform}|${publishDate}|${text}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

function normalizeRecord(record: UnknownRecord, platform: SocialPlatform, sourceFile: string, batchId: string): SocialPost | null {
  const text = extractText(record);
  const publishDate = extractDate(record);
  const sourceUrl = extractUrl(record);
  const media = extractMedia(record);

  if (!publishDate || (!text && !sourceUrl && !media.mediaUrl && !media.archiveMediaPath)) return null;

  const sourceId = extractId(record);
  const contentHash = makeContentHash(platform, sourceId, sourceUrl, text, publishDate);
  const now = new Date().toISOString();

  return {
    id: `history_${platform.toLowerCase().replace(/[^a-z]/g, '')}_${contentHash.slice(0, 24)}`,
    platform,
    isGeneralCampaign: true,
    publishDate,
    text: text || '(Publicación sin texto en el archivo original)',
    link: sourceUrl,
    mediaUrl: media.mediaUrl,
    mediaType: media.mediaType,
    archiveMediaPath: media.archiveMediaPath,
    status: 'Importado historial',
    performance: {
      likes: extractMetric(record, ['like_count', 'likes', 'favorite_count', 'favoriteCount', 'diggCount']),
      views: extractMetric(record, ['view_count', 'views', 'play_count', 'playCount', 'video_views']),
      interactions: extractMetric(record, ['interaction_count', 'interactions', 'engagement']),
      comments: extractMetric(record, ['comment_count', 'comments', 'commentCount']),
      shares: extractMetric(record, ['share_count', 'shares', 'retweet_count', 'retweetCount', 'shareCount']),
      saves: extractMetric(record, ['save_count', 'saves', 'collectCount']),
    },
    sourceId,
    sourceUrl,
    sourceFile,
    importBatchId: batchId,
    contentHash,
    crossPlatformGroupId: normalizedCopyKey(text, publishDate),
    importedAt: now,
    createdAt: publishDate,
    updatedAt: now,
  };
}

/**
 * Recorre el archivo buscando publicaciones.
 *
 * `visit` devuelve true cuando ese registro ya es una publicacion. En ese caso
 * **no se sigue bajando adentro de el**: lo que cuelga de una publicacion —la
 * foto adjunta, su titulo— es parte de esa publicacion, no otra distinta.
 * Bajando igual, una foto con titulo se contaba como un posteo aparte y la
 * importacion duplicaba todo.
 */
function walkRecords(value: unknown, visit: (record: UnknownRecord) => boolean): void {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) walkRecords(item, visit);
    return;
  }
  if (typeof value !== 'object') return;

  const record = value as UnknownRecord;
  if (visit(record)) return;

  for (const child of Object.values(record)) {
    if (child && (Array.isArray(child) || typeof child === 'object')) walkRecords(child, visit);
  }
}

export function stripJavascriptAssignment(raw: string): string {
  const trimmed = raw.trim().replace(/^\uFEFF/, '');
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const arrayIndex = trimmed.indexOf('[');
  const objectIndex = trimmed.indexOf('{');
  const indexes = [arrayIndex, objectIndex].filter((n) => n >= 0);
  if (!indexes.length) return trimmed;
  const start = Math.min(...indexes);
  return trimmed.slice(start).replace(/;\s*$/, '');
}

function shouldInspectFile(name: string): boolean {
  const lower = name.toLowerCase();
  if (!(/\.(json|js)$/i.test(lower))) return false;
  return POST_FILE_HINTS.some((hint) => lower.includes(hint));
}

function parseStructuredFile(raw: string): unknown {
  const cleaned = stripJavascriptAssignment(raw);
  return JSON.parse(cleaned);
}

function collectFromStructuredData(parsed: unknown, platform: SocialPlatform, sourceFile: string, batchId: string): SocialPost[] {
  const posts: SocialPost[] = [];
  const seen = new Set<string>();

  walkRecords(parsed, (record) => {
    if (posts.length >= MAX_RECORDS) return true;
    const normalized = normalizeRecord(record, platform, sourceFile, batchId);
    if (!normalized || !normalized.contentHash) return false;
    // Ya vista: igual se corta, porque lo de adentro tambien es de ella.
    if (seen.has(normalized.contentHash)) return true;
    seen.add(normalized.contentHash);
    posts.push(normalized);
    return true;
  });

  return posts;
}

export function assertHistoryPlatform(platform: string): asserts platform is SocialPlatform {
  if (!ALLOWED_HISTORY_PLATFORMS.includes(platform as SocialPlatform)) {
    throw new Error('Elegí Facebook, Instagram, Threads, TikTok, YouTube o X.');
  }
}

/**
 * Lee de forma segura el contenido de un File en cualquier entorno (Navegador, Node.js, Jest).
 */
async function readFileTextSafe(file: File | Blob): Promise<string> {
  if (typeof (file as any).text === 'function') {
    try {
      const txt = await file.text();
      if (typeof txt === 'string' && txt.length > 0) return txt;
    } catch {
      // Continuar al fallback de arrayBuffer
    }
  }

  if (typeof (file as any).arrayBuffer === 'function') {
    try {
      const buffer = await file.arrayBuffer();
      return Buffer.from(buffer).toString('utf-8');
    } catch {
      // Continuar al fallback
    }
  }

  // Fallback para FileReader si existe
  if (typeof FileReader !== 'undefined') {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      reader.readAsText(file);
    });
  }

  throw new Error('No se pudo leer el contenido del archivo.');
}

async function readFileArrayBufferSafe(file: File | Blob): Promise<ArrayBuffer> {
  if (typeof (file as any).arrayBuffer === 'function') {
    return file.arrayBuffer();
  }
  const text = await readFileTextSafe(file);
  return Buffer.from(text, 'utf-8').buffer as ArrayBuffer;
}

export async function parseHistoricalSocialArchive(file: File, platform: SocialPlatform): Promise<HistoricalImportResult> {
  assertHistoryPlatform(platform);
  if (!file || file.size <= 0) throw new Error('Seleccioná el archivo oficial descargado de la red social.');
  if (file.size > MAX_ARCHIVE_BYTES) throw new Error('El archivo supera 100 MB. Dividí la exportación en partes y cargalas de a una.');

  const batchId = `social_history_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const warnings: string[] = [];
  let scannedFiles = 0;
  let ignoredFiles = 0;
  const collected: SocialPost[] = [];
  const extension = (file.name || '').toLowerCase();

  const addParsedFile = (parsed: unknown, sourceFile: string) => {
    scannedFiles += 1;
    collected.push(...collectFromStructuredData(parsed, platform, sourceFile, batchId));
  };

  if (extension.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(await readFileArrayBufferSafe(file));
    const entries = Object.values(zip.files);
    if (entries.length > MAX_ARCHIVE_ENTRIES) throw new Error('La exportación tiene demasiados archivos. Cargala dividida en partes.');

    for (const entry of entries) {
      if (entry.dir) continue;
      if (!shouldInspectFile(entry.name)) {
        ignoredFiles += 1;
        continue;
      }
      try {
        const raw = await entry.async('string');
        addParsedFile(parseStructuredFile(raw), entry.name);
      } catch {
        warnings.push(`No se pudo leer ${entry.name}.`);
      }
    }
  } else if (extension.endsWith('.json') || extension.endsWith('.js') || !extension.includes('.')) {
    try {
      const rawText = await readFileTextSafe(file);
      addParsedFile(parseStructuredFile(rawText), file.name);
    } catch {
      throw new Error(`Este archivo no parece una exportación válida de ${platform}. Fijate que sea el archivo oficial (.zip, .json o .js) que te envía ${platform} al solicitar tu información.`);
    }
  } else {
    throw new Error('Usá el ZIP, JSON o JS oficial descargado de la red social.');
  }

  const byHash = new Map<string, SocialPost>();
  for (const post of collected) {
    if (!post.contentHash) continue;
    if (!byHash.has(post.contentHash)) byHash.set(post.contentHash, post);
  }

  return {
    platform,
    batchId,
    posts: [...byHash.values()].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()),
    scannedFiles,
    ignoredFiles,
    warnings: warnings.slice(0, 20),
  };
}
