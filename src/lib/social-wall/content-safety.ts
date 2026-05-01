const DEFAULT_MAX_MESSAGE_LENGTH = 280;
const DEFAULT_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const DEFAULT_ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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
};

export function validateSocialPost(
  input: SocialPostInput,
  options: SocialPostValidationOptions = {},
): SocialPostValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const maxMessageLength = options.maxMessageLength ?? DEFAULT_MAX_MESSAGE_LENGTH;
  const maxImageBytes = options.maxImageBytes ?? DEFAULT_MAX_IMAGE_BYTES;
  const allowedImageTypes = options.allowedImageTypes ?? DEFAULT_ALLOWED_IMAGE_TYPES;
  const message = input.message?.trim() ?? '';

  if (!message && !input.imageType) {
    errors.push('La publicacion necesita un mensaje o una imagen.');
  }

  if (message.length > maxMessageLength) {
    errors.push(`El mensaje supera ${maxMessageLength} caracteres.`);
  }

  if (message.length > 0 && message.length < 3) {
    warnings.push('El mensaje es muy corto.');
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
  };
}
