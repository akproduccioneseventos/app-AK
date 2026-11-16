import { getBlogCategoryLabel, getBlogTipoNotaLabel } from './blog-display';

describe('blog display labels', () => {
  it('formats internal category keys as professional Spanish labels', () => {
    expect(getBlogCategoryLabel('Organizacion')).toBe('Organización');
    expect(getBlogCategoryLabel('XV anos')).toBe('XV años');
    expect(getBlogCategoryLabel('Checklists')).toBe('Listas prácticas');
  });

  it('identifies and labels tendencia posts', () => {
    expect(getBlogTipoNotaLabel('tendencia')).toBe('Tendencias');
    expect(getBlogTipoNotaLabel('consejo')).toBeNull();
    expect(getBlogTipoNotaLabel(undefined)).toBeNull();
  });
});
