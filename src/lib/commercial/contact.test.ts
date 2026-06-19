import { isValidUruguayMobile, normalizeUruguayPhone, toWhatsAppNumber } from './contact';

describe('commercial contact helpers', () => {
  it('normalizes and converts a Uruguayan mobile for WhatsApp', () => {
    expect(normalizeUruguayPhone('+598 099 123 456')).toBe('099123456');
    expect(isValidUruguayMobile('099 123 456')).toBe(true);
    expect(toWhatsAppNumber('099123456')).toBe('59899123456');
  });
});
