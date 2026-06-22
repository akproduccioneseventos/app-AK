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
