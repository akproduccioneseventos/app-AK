import {
  buildInstagramUrl,
  calculateActualStockMovement,
  getBarScheduleError,
  getDrinkDescription,
  getDrinkTags,
  isTruthyFollowConfirmation,
  isValidBarOrderTransition,
  normalizeBarTime,
  normalizeSocialHandle,
  shouldDiscountBarStock,
} from '@/lib/barra-tecnologica';

describe('barra tecnologica helpers', () => {
  it('registra solo la cantidad que realmente pudo descontar', () => {
    expect(calculateActualStockMovement(1, 3)).toBe(1);
    expect(calculateActualStockMovement(10, 3)).toBe(3);
    expect(calculateActualStockMovement(0, 3)).toBe(0);
  });

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

  it('discounts stock only on the first transition to delivered', () => {
    expect(shouldDiscountBarStock('listo', 'entregado')).toBe(true);
    expect(shouldDiscountBarStock('entregado', 'entregado')).toBe(false);
    expect(shouldDiscountBarStock('entregado', 'cancelado')).toBe(false);
  });

  it('only accepts the operational bar order sequence', () => {
    expect(isValidBarOrderTransition('nuevo', 'preparando')).toBe(true);
    expect(isValidBarOrderTransition('preparando', 'listo')).toBe(true);
    expect(isValidBarOrderTransition('listo', 'entregado')).toBe(true);
    expect(isValidBarOrderTransition('nuevo', 'entregado')).toBe(false);
    expect(isValidBarOrderTransition('entregado', 'nuevo')).toBe(false);
    expect(isValidBarOrderTransition('cancelado', 'preparando')).toBe(false);
  });
});
