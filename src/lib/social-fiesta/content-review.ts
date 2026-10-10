import { containsBlockedSocialLanguage, sanitizeSocialWallText } from '@/lib/social-wall/content-safety';

export type SocialContentType = 'text' | 'image' | 'video' | 'audio';

export type SocialContentReviewStatus = 'approved' | 'pending_review' | 'blocked';

export type SocialContentReviewReason =
  | 'clean'
  | 'empty'
  | 'blocked_word'
  | 'adult_content_risk'
  | 'manual_review_required'
  | 'private_mode';

/**
 * Lo que dijo la revision AUTOMATICA de una imagen. Son tres cosas, no dos:
 * - `segura`: el analisis corrio y no vio riesgo.
 * - `riesgosa`: el analisis corrio y vio riesgo real (adulto, violento): se rechaza.
 * - `sin_revisar`: el analisis NO pudo correr (proveedor caido, sin clave, un video). No es seguro
 *   ni es riesgoso: la publicacion queda esperando el visto bueno de una persona.
 */
export type ResultadoRevisionImagen = 'segura' | 'riesgosa' | 'sin_revisar';

/** Traduce los tres estados a lo que espera `reviewSocialContent` (`undefined` = no revisada). */
export function imageAiSafeDesde(revision: ResultadoRevisionImagen | undefined): boolean | undefined {
  if (revision === 'segura') return true;
  if (revision === 'riesgosa') return false;
  return undefined;
}

export type SocialContentReviewInput = {
  type: SocialContentType;
  text?: string;
  authorName?: string;
  moderationMode?: 'seguro' | 'automatico' | 'privado';
  imageAiSafe?: boolean;
};

export type SocialContentReviewResult = {
  status: SocialContentReviewStatus;
  reason: SocialContentReviewReason;
  shouldShowOnBigScreen: boolean;
  sanitizedText?: string;
  message: string;
};

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function hasBlockedText(value?: string): boolean {
  return containsBlockedSocialLanguage(value);
}

export function sanitizeSocialText(value?: string): string {
  return sanitizeSocialWallText(value);
}

export function reviewSocialContent(input: SocialContentReviewInput): SocialContentReviewResult {
  const mode = input.moderationMode ?? 'seguro';
  const text = normalizeSpaces(input.text ?? '');

  if (input.type === 'text' && !text) {
    return {
      status: 'blocked',
      reason: 'empty',
      shouldShowOnBigScreen: false,
      message: 'Contenido vacio.',
    };
  }

  if (hasBlockedText(text) || hasBlockedText(input.authorName)) {
    return {
      status: 'blocked',
      reason: 'blocked_word',
      shouldShowOnBigScreen: false,
      sanitizedText: sanitizeSocialText(text),
      message: 'Contenido bloqueado por lenguaje no permitido.',
    };
  }

  if ((input.type === 'image' || input.type === 'video') && input.imageAiSafe === false) {
    return {
      status: 'blocked',
      reason: 'adult_content_risk',
      shouldShowOnBigScreen: false,
      message: 'Archivo bloqueado por riesgo de contenido adulto o inapropiado.',
    };
  }

  if ((input.type === 'image' || input.type === 'video') && input.imageAiSafe !== true) {
    return {
      status: 'pending_review',
      reason: 'manual_review_required',
      shouldShowOnBigScreen: false,
      sanitizedText: sanitizeSocialText(text),
      message: 'Archivo pendiente de aprobacion antes de pantalla gigante.',
    };
  }

  if (mode === 'privado') {
    return {
      status: 'pending_review',
      reason: 'private_mode',
      shouldShowOnBigScreen: false,
      sanitizedText: sanitizeSocialText(text),
      message: 'Contenido guardado en modo privado, no se muestra en pantalla.',
    };
  }

  if (mode === 'seguro') {
    return {
      status: 'pending_review',
      reason: 'manual_review_required',
      shouldShowOnBigScreen: false,
      sanitizedText: sanitizeSocialText(text),
      message: 'Contenido pendiente de aprobacion antes de pantalla gigante.',
    };
  }

  return {
    status: 'approved',
    reason: 'clean',
    shouldShowOnBigScreen: true,
    sanitizedText: sanitizeSocialText(text),
    message: 'Contenido aprobado.',
  };
}

export const SOCIAL_CONTENT_REVIEW_DEFAULTS = {
  textReviewEnabled: true,
  mediaReviewEnabled: true,
  bigScreenRequiresApproval: true,
  defaultModerationMode: 'seguro' as const,
};
