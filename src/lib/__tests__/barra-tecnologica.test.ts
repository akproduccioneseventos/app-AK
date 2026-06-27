import {
  buildInstagramUrl,
  getBarScheduleError,
  getDrinkDescription,
  getDrinkTags,
  isTruthyFollowConfirmation,
  normalizeBarTime,
  normalizeSocialHandle,
} from '@/lib/barra-tecnologica';

describe('barra tecnologica helpers', () => {
  it('uses custom drink descriptions when available', () => {
    expect(getDrinkDescription({
      nombre: 'Atomic Green',
      descripcion: 'Verde intenso para fotos de fiesta.',
      ingredientes: ['Licor de melon', 'Vodka', 'Sprite'],
    })).toBe('Verde intenso para fotos de fiesta.');
  });

  it('builds a fallback description from ingredients', () => {
    expect(getDrinkDescription({
      nombre: 'Caipirinha',
      ingredientes: ['Lima', 'Azucar'],
    })).toContain('Lima, Azucar');
  });

  it('normalizes Instagram handles and URLs', () => {
    expect(normalizeSocialHandle('@akproducciones')).toBe('akproducciones');
    expect(normalizeSocialHandle('https://www.instagram.com/akproducciones/?hl=es')).toBe('akproducciones');
    expect(buildInstagramUrl('@akproducciones')).toBe('https://www.instagram.com/akproducciones/');
  });

  it('detects social follow confirmation values', () => {
    expect(isTruthyFollowConfirmation('true')).toBe(true);
    expect(isTruthyFollowConfirmation('on')).toBe(true);
    expect(isTruthyFollowConfirmation(null)).toBe(false);
  });

  it('tags drinks for touchscreen filtering and display', () => {
    expect(getDrinkTags({ nombre: 'Daiquiri de Frutilla', ingredientes: ['Ron', 'Frutilla'] })).toEqual(
      expect.arrayContaining(['Frutal', 'Con alcohol'])
    );
  });

  it('normalizes bar schedule times', () => {
    expect(normalizeBarTime('22:00')).toBe('22:00');
    expect(normalizeBarTime(' 03:30 ')).toBe('03:30');
    expect(normalizeBarTime('25:00')).toBeUndefined();
    expect(normalizeBarTime('9:00')).toBeUndefined();
  });

  it('allows bar schedules that pass midnight', () => {
    const settings = { openingTime: '22:00', closingTime: '03:00' };

    expect(getBarScheduleError(settings, 23 * 60)).toBeNull();
    expect(getBarScheduleError(settings, 2 * 60 + 30)).toBeNull();
    expect(getBarScheduleError(settings, 15 * 60)).toBe('La barra abre a las 22:00 hs.');
    expect(getBarScheduleError(settings, 4 * 60)).toBe('La barra abre a las 22:00 hs.');
  });

  it('keeps normal same-day schedules closed outside the window', () => {
    const settings = { openingTime: '18:00', closingTime: '23:00' };

    expect(getBarScheduleError(settings, 17 * 60 + 30)).toBe('La barra abre a las 18:00 hs.');
    expect(getBarScheduleError(settings, 20 * 60)).toBeNull();
    expect(getBarScheduleError(settings, 23 * 60 + 30)).toBe('La barra esta cerrada por hoy.');
  });
});
