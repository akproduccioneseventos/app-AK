import { getBlogCategoryLabel } from './blog-display';

describe('blog display labels', () => {
  it('formats internal category keys as professional Spanish labels', () => {
    expect(getBlogCategoryLabel('Organizacion')).toBe('Organización');
    expect(getBlogCategoryLabel('XV anos')).toBe('XV años');
    expect(getBlogCategoryLabel('Checklists')).toBe('Listas prácticas');
  });
});
