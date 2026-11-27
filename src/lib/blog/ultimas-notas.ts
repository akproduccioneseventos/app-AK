export interface NotaExternaBlog {
  id: string;
  titulo: string;
  url: string;
  imagen: string | null;
  fecha: string;
  fuente: 'Blogger' | 'WordPress';
}

export const BLOGGER_FEED_URL = 'https://akproduccionessalto.blogspot.com/feeds/posts/default';
export const WORDPRESS_FEED_URL = 'https://akproduccionessalto.wordpress.com/feed/';

const CACHE_TTL_MS = 3_600_000;
const FETCH_TIMEOUT_MS = 4_000;

let cacheNotas: { notas: NotaExternaBlog[]; timestamp: number } | null = null;

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  aacute: 'á',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  uuml: 'ü',
  ntilde: 'ñ',
  Aacute: 'Á',
  Eacute: 'É',
  Iacute: 'Í',
  Oacute: 'Ó',
  Uacute: 'Ú',
  Uuml: 'Ü',
  Ntilde: 'Ñ',
  iquest: '¿',
  iexcl: '¡',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  hellip: '…',
  laquo: '«',
  raquo: '»',
};

function unwrapCdata(raw: string): string {
  return raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function decodeHtmlEntities(raw: string): string {
  const withoutCdata = unwrapCdata(raw);
  return withoutCdata.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (full, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    if (entity.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    return NAMED_HTML_ENTITIES[entity] ?? full;
  });
}

function stripTags(raw: string): string {
  return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTagContent(block: string, tagNames: string[]): string {
  for (const tag of tagNames) {
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`<${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTag}>`, 'i');
    const match = block.match(regex);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return '';
}

function getAttr(tag: string, attrName: string): string | null {
  const regex = new RegExp(`\\b${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
  const match = tag.match(regex);
  if (!match) return null;
  const val = (match[1] ?? match[2] ?? '').trim();
  return val ? decodeHtmlEntities(val) : null;
}

function isHttpUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  return /^https?:\/\//i.test(url.trim());
}

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

function extractImageFromBlock(block: string): string | null {
  const mediaTags = block.match(/<(?:media:thumbnail|media:content|enclosure)\b[^>]*>/gi) || [];

  // 1. Prioridad a media:thumbnail
  for (const tag of mediaTags) {
    if (/^<media:thumbnail\b/i.test(tag)) {
      const url = normalizeImageUrl(getAttr(tag, 'url'));
      if (url) return url;
    }
  }

  // 2. media:content (evitando avatares gravatar si hay otra opción)
  for (const tag of mediaTags) {
    if (/^<media:content\b/i.test(tag)) {
      const url = normalizeImageUrl(getAttr(tag, 'url'));
      if (url && !url.includes('gravatar.com')) return url;
    }
  }

  // 3. enclosure o link rel="enclosure"
  for (const tag of mediaTags) {
    if (/^<enclosure\b/i.test(tag)) {
      const type = getAttr(tag, 'type') || '';
      const url = normalizeImageUrl(getAttr(tag, 'url'));
      if (url && (!type || type.startsWith('image/'))) return url;
    }
  }

  const linkTags = block.match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    const rel = getAttr(tag, 'rel');
    if (rel === 'enclosure') {
      const type = getAttr(tag, 'type') || '';
      const href = normalizeImageUrl(getAttr(tag, 'href'));
      if (href && (!type || type.startsWith('image/'))) return href;
    }
  }

  // 4. Primer <img src="..."> en content/description/summary
  const htmlCandidates = [
    extractTagContent(block, ['content:encoded', 'content', 'description', 'summary']),
    block,
  ];
  for (const rawHtml of htmlCandidates) {
    if (!rawHtml) continue;
    const decodedHtml = decodeHtmlEntities(rawHtml);
    const imgMatch = decodedHtml.match(/<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
    const imgSrc = normalizeImageUrl(imgMatch?.[1] ?? imgMatch?.[2] ?? null);
    if (imgSrc && !imgSrc.includes('gravatar.com')) return imgSrc;
  }

  return null;
}

function normalizeDateIso(rawDate: string): string {
  const cleaned = decodeHtmlEntities(rawDate).trim();
  if (!cleaned) return '';
  const parsed = Date.parse(cleaned);
  if (!Number.isFinite(parsed)) return '';
  return new Date(parsed).toISOString();
}

export function parseBloggerAtomFeed(xml: string): NotaExternaBlog[] {
  if (!xml || (!/<feed[\s>]/i.test(xml) && !/<entry[\s>]/i.test(xml))) {
    return [];
  }

  const entries = xml.match(/<entry\b[^>]*>[\s\S]*?<\/entry>/gi) || [];
  const notas: NotaExternaBlog[] = [];

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const rawTitle = extractTagContent(entry, ['title']);
    const titulo = stripTags(decodeHtmlEntities(rawTitle));

    const linkTags = entry.match(/<link\b[^>]*>/gi) || [];
    let url: string | null = null;
    for (const tag of linkTags) {
      const rel = getAttr(tag, 'rel');
      const href = getAttr(tag, 'href');
      if (rel === 'alternate' && isHttpUrl(href)) {
        url = href;
        break;
      }
    }
    if (!url) {
      for (const tag of linkTags) {
        const rel = getAttr(tag, 'rel');
        const href = getAttr(tag, 'href');
        if (rel !== 'self' && rel !== 'replies' && rel !== 'edit' && rel !== 'enclosure' && isHttpUrl(href)) {
          url = href;
          break;
        }
      }
    }

    if (!titulo || !url) continue;

    const rawId = stripTags(decodeHtmlEntities(extractTagContent(entry, ['id'])));
    const rawFecha = extractTagContent(entry, ['published', 'updated']);
    const fecha = normalizeDateIso(rawFecha);
    const imagen = extractImageFromBlock(entry);

    notas.push({
      id: rawId || `blogger-${i}-${url}`,
      titulo,
      url,
      imagen,
      fecha,
      fuente: 'Blogger',
    });
  }

  return notas;
}

export function parseWordPressRssFeed(xml: string): NotaExternaBlog[] {
  if (!xml || (!/<rss[\s>]/i.test(xml) && !/<channel[\s>]/i.test(xml) && !/<item[\s>]/i.test(xml))) {
    return [];
  }

  const items = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];
  const notas: NotaExternaBlog[] = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const rawTitle = extractTagContent(item, ['title']);
    const titulo = stripTags(decodeHtmlEntities(rawTitle));
    const rawLink = stripTags(decodeHtmlEntities(extractTagContent(item, ['link'])));
    const url = isHttpUrl(rawLink) ? rawLink : null;

    if (!titulo || !url) continue;

    const rawId = stripTags(decodeHtmlEntities(extractTagContent(item, ['guid'])));
    const rawFecha = extractTagContent(item, ['pubDate', 'dc:date', 'published', 'updated']);
    const fecha = normalizeDateIso(rawFecha);
    const imagen = extractImageFromBlock(item);

    notas.push({
      id: rawId || `wordpress-${i}-${url}`,
      titulo,
      url,
      imagen,
      fecha,
      fuente: 'WordPress',
    });
  }

  return notas;
}

async function fetchFeedXml(url: string, fetchImpl: typeof fetch, esTest: boolean): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const init: RequestInit & { next?: { revalidate: number } } = {
      signal: controller.signal,
      headers: {
        Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    };
    if (!esTest) {
      init.next = { revalidate: 3600 };
    }

    const res = await fetchImpl(url, init);
    if (!res || res.ok === false || (typeof res.status === 'number' && res.status !== 200)) {
      return null;
    }

    const xml = await res.text();
    if (!xml || typeof xml !== 'string') return null;
    return xml;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function getUltimasNotasExternas(
  limite = 3,
  fetchImpl?: typeof fetch,
): Promise<NotaExternaBlog[]> {
  if (limite <= 0) return [];

  const esTest = process.env.NODE_ENV === 'test' || Boolean(fetchImpl);
  const now = Date.now();

  if (!esTest && cacheNotas && now - cacheNotas.timestamp < CACHE_TTL_MS) {
    return cacheNotas.notas.slice(0, limite);
  }

  const fetcher = fetchImpl ?? globalThis.fetch;
  if (typeof fetcher !== 'function') {
    return [];
  }

  try {
    const [bloggerRes, wpRes] = await Promise.allSettled([
      fetchFeedXml(BLOGGER_FEED_URL, fetcher, esTest),
      fetchFeedXml(WORDPRESS_FEED_URL, fetcher, esTest),
    ]);

    const bloggerNotas =
      bloggerRes.status === 'fulfilled' && bloggerRes.value
        ? parseBloggerAtomFeed(bloggerRes.value)
        : [];
    const wpNotas =
      wpRes.status === 'fulfilled' && wpRes.value
        ? parseWordPressRssFeed(wpRes.value)
        : [];

    const todas = [...bloggerNotas, ...wpNotas].sort((a, b) => {
      const timeA = a.fecha ? Date.parse(a.fecha) : 0;
      const timeB = b.fecha ? Date.parse(b.fecha) : 0;
      return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
    });

    if (!esTest) {
      cacheNotas = {
        notas: todas,
        timestamp: Date.now(),
      };
    }

    return todas.slice(0, limite);
  } catch {
    return [];
  }
}
