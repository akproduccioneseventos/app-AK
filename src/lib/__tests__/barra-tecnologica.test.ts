import {
  buildInstagramUrl,
  getDrinkDescription,
  getDrinkTags,
  isTruthyFollowConfirmation,
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
});
