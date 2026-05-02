import type { FiestaSocialRole, FiestaSocialStage } from './social-fiesta-base';
import { canRolePublish } from './social-fiesta-base';
import { reviewSocialContent, type SocialContentReviewStatus } from './content-review';

export type FiestaSocialReactionType = 'me_gusta' | 'me_encanta' | 'me_divierte' | 'me_emociona' | 'vamos';

export type FiestaSocialPostKind =
  | 'publicacion'
  | 'aviso_ak'
  | 'cuenta_regresiva'
  | 'encuesta'
  | 'desafio'
  | 'recuerdo'
  | 'venta_invisible';

export type FiestaSocialComment = {
  id: string;
  authorName: string;
  role: FiestaSocialRole;
  text: string;
  createdAt: string;
  reviewStatus: SocialContentReviewStatus;
};

export type FiestaSocialPost = {
  id: string;
  fiestaId: string;
  kind: FiestaSocialPostKind;
  authorName: string;
  role: FiestaSocialRole;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
  stage: FiestaSocialStage;
  pinned?: boolean;
  reviewStatus: SocialContentReviewStatus;
  showOnBigScreen: boolean;
  comments: FiestaSocialComment[];
  reactions: Record<FiestaSocialReactionType, number>;
  cta?: {
    label: string;
    href: string;
    style: 'ak_soft' | 'ak_direct' | 'event_info';
  };
};

export type FiestaSocialPostInput = {
  fiestaId: string;
  kind?: FiestaSocialPostKind;
  authorName: string;
  role: FiestaSocialRole;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  stage: FiestaSocialStage;
  moderationMode?: 'seguro' | 'automatico' | 'privado';
  now?: string;
};

export const EMPTY_REACTIONS: Record<FiestaSocialReactionType, number> = {
  me_gusta: 0,
  me_encanta: 0,
  me_divierte: 0,
  me_emociona: 0,
  vamos: 0,
};

function createId(prefix: string, now: string): string {
  return `${prefix}_${now.replace(/[^0-9]/g, '').slice(0, 14)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildFiestaSocialPost(input: FiestaSocialPostInput): FiestaSocialPost {
  const now = input.now ?? new Date().toISOString();
  const canPublish = canRolePublish(input.role, input.stage);
  const review = reviewSocialContent({
    type: input.imageUrl ? 'image' : input.videoUrl ? 'video' : 'text',
    text: input.text,
    authorName: input.authorName,
    moderationMode: canPublish ? input.moderationMode ?? 'seguro' : 'privado',
    imageAiSafe: true,
  });

  return {
    id: createId('fiesta_post', now),
    fiestaId: input.fiestaId,
    kind: input.kind ?? 'publicacion',
    authorName: input.authorName.trim() || 'Invitado',
    role: input.role,
    text: review.sanitizedText ?? input.text.trim(),
    imageUrl: input.imageUrl,
    videoUrl: input.videoUrl,
    createdAt: now,
    stage: input.stage,
    pinned: input.kind === 'aviso_ak' || input.kind === 'cuenta_regresiva',
    reviewStatus: review.status,
    showOnBigScreen: review.shouldShowOnBigScreen,
    comments: [],
    reactions: { ...EMPTY_REACTIONS },
    cta: getDefaultPostCta(input.kind ?? 'publicacion'),
  };
}

export function getDefaultPostCta(kind: FiestaSocialPostKind): FiestaSocialPost['cta'] | undefined {
  if (kind === 'venta_invisible') {
    return {
      label: 'Conocer como AK organiza eventos completos',
      href: '/simulador-de-presupuesto',
      style: 'ak_soft',
    };
  }

  if (kind === 'aviso_ak') {
    return {
      label: 'Ver informacion de la fiesta',
      href: '#info-evento',
      style: 'event_info',
    };
  }

  return undefined;
}

export function addReactionToPost(post: FiestaSocialPost, reaction: FiestaSocialReactionType): FiestaSocialPost {
  return {
    ...post,
    reactions: {
      ...post.reactions,
      [reaction]: (post.reactions[reaction] ?? 0) + 1,
    },
  };
}

export function addCommentToPost(input: {
  post: FiestaSocialPost;
  authorName: string;
  role: FiestaSocialRole;
  text: string;
  moderationMode?: 'seguro' | 'automatico' | 'privado';
  now?: string;
}): FiestaSocialPost {
  const now = input.now ?? new Date().toISOString();
  const review = reviewSocialContent({
    type: 'text',
    text: input.text,
    authorName: input.authorName,
    moderationMode: input.moderationMode ?? 'seguro',
  });

  const comment: FiestaSocialComment = {
    id: createId('fiesta_comment', now),
    authorName: input.authorName.trim() || 'Invitado',
    role: input.role,
    text: review.sanitizedText ?? input.text.trim(),
    createdAt: now,
    reviewStatus: review.status,
  };

  return {
    ...input.post,
    comments: [...input.post.comments, comment],
  };
}

export function sortFiestaFeed(posts: FiestaSocialPost[]): FiestaSocialPost[] {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function buildAkSoftSellingPosts(input: {
  fiestaId: string;
  stage: FiestaSocialStage;
  eventName?: string;
  daysToEvent?: number;
  now?: string;
}): FiestaSocialPost[] {
  const now = input.now ?? new Date().toISOString();
  const eventName = input.eventName || 'tu fiesta';
  const days = typeof input.daysToEvent === 'number' ? input.daysToEvent : undefined;

  const texts = [
    days !== undefined
      ? `Faltan ${days} dias para ${eventName}. En AK ya estamos coordinando cada detalle para que el dia de la fiesta disfruten como invitados.`
      : `La organizacion de ${eventName} ya esta en marcha. Cada detalle queda conectado en un solo lugar.`,
    'Tip AK: una fiesta no se trata solo de contratar servicios. Se trata de coordinar tiempos, personas, comida, musica, invitados y emociones.',
    'Esta experiencia digital forma parte del servicio integral de AK Producciones: previa, fiesta en vivo y recuerdos despues del evento.',
  ];

  return texts.map((text, index) => buildFiestaSocialPost({
    fiestaId: input.fiestaId,
    kind: index === 0 ? 'cuenta_regresiva' : 'venta_invisible',
    authorName: 'AK Producciones',
    role: 'organizador',
    text,
    stage: input.stage,
    moderationMode: 'automatico',
    now: new Date(new Date(now).getTime() + index * 1000).toISOString(),
  }));
}
