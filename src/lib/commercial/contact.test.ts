import { isValidUruguayMobile, normalizeUruguayPhone, toWhatsAppNumber } from './contact';

describe('commercial contact helpers', () => {
  it('normalizes and converts a Uruguayan mobile for WhatsApp', () => {
    expect(normalizeUruguayPhone('+598 099 123 456')).toBe('099123456');
    expect(normalizeUruguayPhone('99123456')).toBe('099123456');
    expect(normalizeUruguayPhone('59899123456')).toBe('099123456');
    
    expect(isValidUruguayMobile('099 123 456')).toBe(true);
    expect(isValidUruguayMobile('99 123 456')).toBe(true);
    expect(isValidUruguayMobile('+59899123456')).toBe(true);
    expect(isValidUruguayMobile('12345')).toBe(false);
    
    expect(toWhatsAppNumber('099123456')).toBe('59899123456');
    expect(toWhatsAppNumber('+598 99 123 456')).toBe('59899123456');
  });
});
