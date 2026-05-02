export type SocialContentType = 'text' | 'image' | 'video' | 'audio';

export type SocialContentReviewStatus = 'approved' | 'pending_review' | 'blocked';

export type SocialContentReviewReason =
  | 'clean'
  | 'empty'
  | 'blocked_word'
  | 'adult_content_risk'
  | 'manual_review_required'
  | 'private_mode';

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

const BLOCKED_TEXT_PATTERNS = [
  /\bput[ao]s?\b/i,
  /\bconch\w*\b/i,
  /\bpelotud\w*\b/i,
  /\bbolud\w*\b/i,
  /\bidiot\w*\b/i,
  /\bimbecil\w*\b/i,
  /\bporn\w*\b/i,
  /\bnud\w*\b/i,
  /\bsexo\b/i,
];

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function hasBlockedText(value?: string): boolean {
  const text = normalizeSpaces(String(value ?? ''));
  if (!text) return false;
  return BLOCKED_TEXT_PATTERNS.some(pattern => pattern.test(text));
}

export function sanitizeSocialText(value?: string): string {
  let text = normalizeSpaces(String(value ?? ''));
  for (const pattern of BLOCKED_TEXT_PATTERNS) {
    text = text.replace(pattern, '***');
  }
  return text;
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
