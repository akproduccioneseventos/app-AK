export function normalizeUruguayPhone(value?: string | null): string {
  return (value || '').replace(/\D/g, '').slice(-9);
}

export function isValidUruguayMobile(value?: string | null): boolean {
  return /^09\d{7}$/.test(normalizeUruguayPhone(value));
}

export function toWhatsAppNumber(value?: string | null): string {
  const phone = normalizeUruguayPhone(value);
  if (!/^09\d{7}$/.test(phone)) return '';
  return `598${phone.slice(1)}`;
}
