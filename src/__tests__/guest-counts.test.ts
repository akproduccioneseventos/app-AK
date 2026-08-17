import {
  getGuestAdultsCount,
  getGuestKidsCount,
  getGuestPartySize,
} from '@/lib/fiesta/guest-counts';

describe('guest group counts', () => {
  it('splits a mixed family without assigning the whole group to one category', () => {
    const family = { partySize: 5, kidsCount: 3, categoria: 'Adulto' };

    expect(getGuestPartySize(family)).toBe(5);
    expect(getGuestAdultsCount(family)).toBe(2);
    expect(getGuestKidsCount(family)).toBe(3);
  });

  it('keeps compatibility with guests saved before kidsCount existed', () => {
    expect(getGuestAdultsCount({ partySize: 2, categoria: 'Adulto' })).toBe(2);
    expect(getGuestKidsCount({ partySize: 2, categoria: 'Niño' })).toBe(2);
  });

  it('clamps an old kids count when the group becomes smaller', () => {
    expect(getGuestKidsCount({ partySize: 2, kidsCount: 4 })).toBe(2);
  });
});
