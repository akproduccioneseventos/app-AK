import type { FiestaSocialPost } from './private-feed';

export type LiveWallPremiumMode =
  | 'mosaico_premium'
  | 'carrusel_elegante'
  | 'foto_destacada'
  | 'mensajes_en_vivo'
  | 'ranking'
  | 'sorteo'
  | 'dj_pedidos'
  | 'ak_branding';

export type LiveWallPremiumTheme = {
  eventName: string;
  protagonistName?: string;
  logoUrl?: string;
  backgroundUrl?: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  showAkBranding: boolean;
  akBrandingText: string;
};

export type LiveWallPremiumSlide = {
  id: string;
  mode: LiveWallPremiumMode;
  title: string;
  subtitle?: string;
  mediaUrl?: string;
  authorName?: string;
  text?: string;
  durationMs: number;
  showQr: boolean;
  showAkBranding: boolean;
  priority: number;
};

export type LiveWallPremiumRotationConfig = {
  includeModes: LiveWallPremiumMode[];
  defaultDurationMs: number;
  brandingEveryNSlides: number;
  maxSlides: number;
};

export const DEFAULT_LIVE_WALL_ROTATION: LiveWallPremiumRotationConfig = {
  includeModes: ['mosaico_premium', 'carrusel_elegante', 'foto_destacada', 'mensajes_en_vivo', 'ak_branding'],
  defaultDurationMs: 8000,
  brandingEveryNSlides: 6,
  maxSlides: 40,
};

function safeText(value: string | undefined, fallback: string): string {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : fallback;
}

function hasMedia(post: FiestaSocialPost): boolean {
  return Boolean(post.imageUrl || post.videoUrl);
}

function canShowPost(post: FiestaSocialPost): boolean {
  return post.reviewStatus === 'approved' && post.showOnBigScreen;
}

export function filterLiveWallApprovedPosts(posts: FiestaSocialPost[]): FiestaSocialPost[] {
  return posts.filter(canShowPost);
}

export function buildLiveWallPremiumSlides(input: {
  posts: FiestaSocialPost[];
  theme: LiveWallPremiumTheme;
  config?: Partial<LiveWallPremiumRotationConfig>;
}): LiveWallPremiumSlide[] {
  const config = { ...DEFAULT_LIVE_WALL_ROTATION, ...(input.config ?? {}) };
  const approved = filterLiveWallApprovedPosts(input.posts);
  const mediaPosts = approved.filter(hasMedia);
  const messagePosts = approved.filter(post => !hasMedia(post) && post.text.trim().length > 0);
  const slides: LiveWallPremiumSlide[] = [];

  if (config.includeModes.includes('mosaico_premium') && mediaPosts.length >= 4) {
    slides.push({
      id: 'live_mosaic_main',
      mode: 'mosaico_premium',
      title: input.theme.eventName,
      subtitle: 'Momentos compartidos por los invitados',
      durationMs: config.defaultDurationMs,
      showQr: true,
      showAkBranding: input.theme.showAkBranding,
      priority: 10,
    });
  }

  if (config.includeModes.includes('carrusel_elegante')) {
    mediaPosts.forEach((post, index) => {
      slides.push({
        id: `live_carousel_${post.id}`,
        mode: index === 0 ? 'foto_destacada' : 'carrusel_elegante',
        title: safeText(post.authorName, 'Invitado'),
        subtitle: post.text,
        mediaUrl: post.imageUrl ?? post.videoUrl,
        authorName: post.authorName,
        text: post.text,
        durationMs: config.defaultDurationMs,
        showQr: index % 3 === 0,
        showAkBranding: input.theme.showAkBranding,
        priority: 20 + index,
      });
    });
  }

  if (config.includeModes.includes('mensajes_en_vivo')) {
    messagePosts.forEach((post, index) => {
      slides.push({
        id: `live_message_${post.id}`,
        mode: 'mensajes_en_vivo',
        title: safeText(post.authorName, 'Invitado'),
        subtitle: 'Mensaje para la fiesta',
        authorName: post.authorName,
        text: post.text,
        durationMs: Math.max(6000, config.defaultDurationMs - 1000),
        showQr: index % 2 === 0,
        showAkBranding: input.theme.showAkBranding,
        priority: 30 + index,
      });
    });
  }

  const limited = slides
    .sort((a, b) => a.priority - b.priority)
    .slice(0, config.maxSlides);

  return injectAkBrandingSlides({
    slides: limited,
    theme: input.theme,
    every: config.brandingEveryNSlides,
    durationMs: config.defaultDurationMs,
  });
}

export function injectAkBrandingSlides(input: {
  slides: LiveWallPremiumSlide[];
  theme: LiveWallPremiumTheme;
  every: number;
  durationMs: number;
}): LiveWallPremiumSlide[] {
  if (!input.theme.showAkBranding || input.every <= 0) return input.slides;

  const result: LiveWallPremiumSlide[] = [];
  input.slides.forEach((slide, index) => {
    result.push(slide);
    if ((index + 1) % input.every === 0) {
      result.push({
        id: `ak_branding_${index}`,
        mode: 'ak_branding',
        title: input.theme.akBrandingText,
        subtitle: 'Vos disfrutás, nosotros coordinamos cada detalle.',
        durationMs: Math.min(5000, input.durationMs),
        showQr: true,
        showAkBranding: true,
        priority: slide.priority + 0.5,
      });
    }
  });
  return result;
}

export function buildLiveWallQrPrompt(theme: LiveWallPremiumTheme): string {
  return `Escaneá el QR y compartí tu foto para aparecer en la pantalla de ${theme.eventName}.`;
}

export function buildLiveWallEmptyState(theme: LiveWallPremiumTheme): LiveWallPremiumSlide {
  return {
    id: 'live_empty_state',
    mode: 'ak_branding',
    title: theme.eventName,
    subtitle: 'Escaneá el QR para subir fotos, mensajes y participar de la fiesta.',
    durationMs: 8000,
    showQr: true,
    showAkBranding: theme.showAkBranding,
    priority: 0,
  };
}
