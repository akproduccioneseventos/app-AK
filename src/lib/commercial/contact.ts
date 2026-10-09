export function normalizeUruguayPhone(value?: string | null): string {
  const digits = (value || '').replace(/\D/g, '');
  let local = digits;
  if (digits.startsWith('598') && digits.length >= 11) {
    local = digits.slice(3);
  }
  if (local.startsWith('9') && local.length === 8) {
    local = '0' + local;
  }
  return local;
}

export function isValidUruguayMobile(value?: string | null): boolean {
  const normalized = normalizeUruguayPhone(value);
  return /^09\d{7}$/.test(normalized);
}

export function toWhatsAppNumber(value?: string | null): string {
  const phone = normalizeUruguayPhone(value);
  if (!/^09\d{7}$/.test(phone)) return '';
  return `598${phone.slice(1)}`;
}

/**
 * Digitos para un enlace wa.me a partir de un telefono guardado tal cual lo escribio
 * el equipo. Un celular uruguayo local (099 000 080 / 99 000 080) lleva el 598;
 * uno que ya trae 598 no se duplica y un numero extranjero no se toca.
 * Solo arma el enlace: el telefono guardado no se modifica.
 */
export function toWhatsAppDigits(value?: string | null): string {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return '';
  const uruguayo = toWhatsAppNumber(value);
  return uruguayo || digits;
}

export function buildWhatsAppLink(phone?: string | null, text?: string): string {
  const base = `https://wa.me/${toWhatsAppDigits(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
