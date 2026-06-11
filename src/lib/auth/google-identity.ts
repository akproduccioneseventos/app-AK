export const DEFAULT_ALLOWED_GOOGLE_EMAIL = 'akproduccionessalto@gmail.com';

type GoogleIdentityClaims = {
  email?: string;
  email_verified?: boolean;
  auth_time?: number;
  firebase?: {
    sign_in_provider?: string;
  };
};

type GoogleIdentityValidationOptions = {
  maxAuthAgeSeconds?: number;
  nowSeconds?: number;
};

export type GoogleIdentityValidation =
  | { success: true; email: string }
  | { success: false; error: string };

export function parseAllowedGoogleEmails(value?: string): Set<string> {
  const emails = (value || DEFAULT_ALLOWED_GOOGLE_EMAIL)
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return new Set(emails.length > 0 ? emails : [DEFAULT_ALLOWED_GOOGLE_EMAIL]);
}

export function validateGoogleIdentityClaims(
  claims: GoogleIdentityClaims | null,
  allowedEmails: Set<string>,
  options: GoogleIdentityValidationOptions = {}
): GoogleIdentityValidation {
  const email = claims?.email?.trim().toLowerCase();
  if (!email || claims?.email_verified !== true) {
    return { success: false, error: 'Google no pudo confirmar un correo verificado.' };
  }

  if (claims.firebase?.sign_in_provider !== 'google.com') {
    return { success: false, error: 'La identidad debe verificarse directamente con Google.' };
  }

  if (!allowedEmails.has(email)) {
    return { success: false, error: 'Este correo no esta habilitado para ingresar.' };
  }

  if (options.maxAuthAgeSeconds) {
    const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
    const authTime = claims.auth_time;
    if (!authTime || nowSeconds - authTime > options.maxAuthAgeSeconds) {
      return { success: false, error: 'La verificacion de Google vencio. Volve a identificarte.' };
    }
  }

  return { success: true, email };
}
