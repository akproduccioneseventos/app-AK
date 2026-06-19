import { daysUntilBirthday, normalizeBirthdayMonthDay } from './birthday';

describe('birthday commercial helpers', () => {
  it('normalizes full dates without storing the birth year', () => {
    expect(normalizeBirthdayMonthDay('1990-08-15')).toBe('08-15');
    expect(normalizeBirthdayMonthDay('08-15')).toBe('08-15');
  });

  it('calculates the next birthday across year boundaries', () => {
    expect(daysUntilBirthday('01-05', new Date(2026, 11, 30))).toBe(6);
  });
});
