import {
  formatEventDate,
  getDaysUntilEvent,
  parseEventDate,
} from './event-date';

describe('public event date helpers', () => {
  it('parses a date-only value in local time without shifting the day', () => {
    const parsed = parseEventDate('2026-08-08');

    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(7);
    expect(parsed?.getDate()).toBe(8);
  });

  it('calculates the countdown using calendar days', () => {
    expect(getDaysUntilEvent('2026-08-08', new Date(2026, 7, 1, 23, 30))).toBe(7);
  });

  it('returns null for invalid dates', () => {
    expect(parseEventDate('not-a-date')).toBeNull();
    expect(formatEventDate('not-a-date')).toBeNull();
  });
});
