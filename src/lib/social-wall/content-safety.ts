const DEFAULT_MAX_MESSAGE_LENGTH = 280;
const DEFAULT_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const DEFAULT_ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const BLOCKED_TEXT_PATTERNS = [
  /\bput[ao]s?\b/i,
  /\bconch\w*\b/i,
  /\bpelotud\w*\b/i,
  /\bbolud\w*\b/i,
  /\bidiot\w*\b/i,
  /\bimb[eé]cil\w*\b/i,
  /\bforr[ao]s?\b/i,
  /\bporong\w*\b/i,
  /\bporn\w*\b/i,
  /\bnud[eo]s?\b/i,
  /\bsexo\b/i,
  /\bxxx\b/i,
  /\bdroga\w*\b/i,
  /\bviolaci[oó]n\b/i,
];

export type SocialPostInput = {
  message?: string | null;
  imageType?: string | null;
  imageSizeBytes?: number | null;
};

export type SocialPostValidationOptions = {
  maxMessageLength?: number;
  maxImageBytes?: number;
  allowedImageTypes?: string[];
};

export type SocialPostValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  sanitizedMessage?: string;
  blockedLanguage: boolean;
};

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function containsBlockedSocialLanguage(value?: string | null): boolean {
  const text = normalizeSpaces(String(value ?? ''));
  if (!text) return false;
  return BLOCKED_TEXT_PATTERNS.some((pattern) => pattern.test(text));
}

export function sanitizeSocialWallText(value?: string | null): string {
  let text = normalizeSpaces(String(value ?? ''));
  for (const pattern of BLOCKED_TEXT_PATTERNS) {
    text = text.replace(pattern, '***');
  }
  return text;
}

export function validateSocialPost(
  input: SocialPostInput,
  options: SocialPostValidationOptions = {},
): SocialPostValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const maxMessageLength = options.maxMessageLength ?? DEFAULT_MAX_MESSAGE_LENGTH;
  const maxImageBytes = options.maxImageBytes ?? DEFAULT_MAX_IMAGE_BYTES;
  const allowedImageTypes = options.allowedImageTypes ?? DEFAULT_ALLOWED_IMAGE_TYPES;
  const message = normalizeSpaces(input.message ?? '');
  const blockedLanguage = containsBlockedSocialLanguage(message);

  if (!message && !input.imageType) {
    errors.push('La publicacion necesita un mensaje o una imagen.');
  }

  if (message.length > maxMessageLength) {
    errors.push(`El mensaje supera ${maxMessageLength} caracteres.`);
  }

  if (message.length > 0 && message.length < 3) {
    warnings.push('El mensaje es muy corto.');
  }

  if (blockedLanguage) {
    errors.push('El mensaje contiene lenguaje no permitido para pantalla publica.');
  }

  if (input.imageType && !allowedImageTypes.includes(input.imageType)) {
    errors.push('El formato de imagen no esta permitido.');
  }

  if ((input.imageSizeBytes ?? 0) > maxImageBytes) {
    errors.push('La imagen es demasiado pesada.');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    sanitizedMessage: sanitizeSocialWallText(message),
    blockedLanguage,
  };
}
