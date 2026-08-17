import 'server-only';

import { readData } from '@/lib/data-service';
import type { SocialPlatform, SocialPost } from '@/types/social-media';
import { getPublicRecoveredHistory } from '@/lib/social-media/public-recovered-history';

const POSTS_FILE = 'social-posts.json';
const MAX_EXAMPLES = 12;
const MAX_TEXT_LENGTH = 220;

const CATEGORY_RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: 'XV años', pattern: /\b(xv|15 años|quince|quinceañ)/i },
  { label: 'Bodas', pattern: /\b(boda|casamiento|novia|novio|matrimonio)\b/i },
  { label: 'Cumpleaños', pattern: /\b(cumple|cumpleaños|aniversario)\b/i },
  { label: 'Empresariales', pattern: /\b(empresa|empresarial|corporativ|antel|correo|anda)\b/i },
  { label: 'Promociones', pattern: /\b(promo|promoción|descuento|desde \$|oferta|seña)\b/i },
  { label: 'Salones', pattern: /\b(salón|club uruguay|adeom|paseo alemán|isla bonita|villa españa|clivias)\b/i },
];

function normalizePlatform(platform?: string): SocialPlatform | undefined {
  if (!platform) return undefined;
  const value = platform.toLowerCase();
  if (value.includes('instagram')) return 'Instagram';
  if (value.includes('facebook')) return 'Facebook';
  if (value.includes('tiktok')) return 'TikTok';
  if (value.includes('youtube')) return 'YouTube';
  if (value.includes('thread')) return 'Threads';
  if (value === 'x' || value.includes('twitter')) return 'X';
  if (value.includes('whatsapp')) return 'WhatsApp';
  return undefined;
}

function clip(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length <= MAX_TEXT_LENGTH ? compact : `${compact.slice(0, MAX_TEXT_LENGTH - 1)}…`;
}

function matchesEventType(post: SocialPost, eventType?: string): boolean {
  if (!eventType) return true;
  const needle = eventType.toLowerCase();
  const haystack = `${post.eventName || ''} ${post.text}`.toLowerCase();
  if (haystack.includes(needle)) return true;
  if (/xv|15|quince/.test(needle)) return /xv|15 años|quince/i.test(haystack);
  if (/boda|casamiento/.test(needle)) return /boda|casamiento|novia|novio/i.test(haystack);
  if (/cumple/.test(needle)) return /cumple|aniversario/i.test(haystack);
  if (/empresa|corpor/.test(needle)) return /empresa|empresarial|corporativ/i.test(haystack);
  return false;
}

function dedupePosts(posts: SocialPost[]): SocialPost[] {
  const seen = new Set<string>();
  return posts.filter((post) => {
    const key = post.sourceUrl || `${post.platform}|${post.publishDate}|${post.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function buildSocialHistoryMarketingContext(input?: {
  platform?: string;
  eventType?: string;
}): Promise<string> {
  try {
    const storedPosts = await readData<SocialPost[]>(POSTS_FILE, []);
    const recoveredPosts = getPublicRecoveredHistory();
    const posts = dedupePosts([...storedPosts, ...recoveredPosts]);
    const usable = posts
      .filter((post) => post.status === 'Publicado' || post.status === 'Importado de IG' || post.status === 'Importado historial')
      .filter((post) => Boolean(post.text?.trim()))
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    if (!usable.length) return 'HISTORIAL DIGITAL: todavía no hay publicaciones históricas cargadas.';

    const platform = normalizePlatform(input?.platform);
    const filtered = usable.filter((post) => (!platform || post.platform === platform) && matchesEventType(post, input?.eventType));
    const examples = (filtered.length ? filtered : usable).slice(0, MAX_EXAMPLES);

    const byPlatform = usable.reduce<Partial<Record<SocialPlatform, number>>>((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {});

    const categoryCounts = CATEGORY_RULES.map(({ label, pattern }) => ({
      label,
      count: usable.filter((post) => pattern.test(`${post.eventName || ''} ${post.text}`)).length,
    }));

    const groupedCopies = new Map<string, SocialPost[]>();
    for (const post of usable) {
      if (!post.crossPlatformGroupId) continue;
      const group = groupedCopies.get(post.crossPlatformGroupId) || [];
      group.push(post);
      groupedCopies.set(post.crossPlatformGroupId, group);
    }
    const repeatedAcrossNetworks = [...groupedCopies.values()].filter((group) => new Set(group.map((post) => post.platform)).size > 1).length;

    const dates = usable.map((post) => post.publishDate).filter(Boolean).sort();
    const platformSummary = Object.entries(byPlatform).map(([name, count]) => `${name}: ${count}`).join(', ');
    const categorySummary = categoryCounts.map(({ label, count }) => `${label}: ${count}`).join(', ');
    const exampleLines = examples.map((post) => `- ${post.publishDate.slice(0, 10)} · ${post.platform}: ${clip(post.text)}`).join('\n');

    return [
      '## MEMORIA HISTÓRICA REAL DE REDES DE AK PRODUCCIONES EVENTOS',
      `Publicaciones disponibles: ${usable.length}. Período: ${dates[0]?.slice(0, 10) || 'sin fecha'} a ${dates[dates.length - 1]?.slice(0, 10) || 'sin fecha'}.`,
      `Por red: ${platformSummary || 'sin desglose'}.`,
      `Temas detectados: ${categorySummary}.`,
      `Piezas detectadas como la misma publicación distribuida en varias redes: ${repeatedAcrossNetworks}.`,
      'Esta memoria mezcla publicaciones importadas de las cuentas con publicaciones públicas recuperadas manualmente del archivo indexado.',
      'AK Producciones Estudio y contenido musical/estudio quedan excluidos.',
      'Usá esta memoria para NO repetir copys recientes, detectar temas sobrepublicados y recuperar ideas que hace tiempo no se trabajan.',
      'No inventes métricas ni resultados que no estén en estos datos.',
      input?.platform || input?.eventType ? `Muestra más relevante para esta solicitud (${input?.platform || 'todas las redes'} / ${input?.eventType || 'todos los eventos'}):` : 'Publicaciones recientes:',
      exampleLines,
    ].join('\n');
  } catch {
    return 'HISTORIAL DIGITAL: no se pudo leer la memoria histórica en este momento.';
  }
}
