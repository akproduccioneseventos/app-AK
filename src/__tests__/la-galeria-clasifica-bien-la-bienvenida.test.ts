/**
 * La foto de bienvenida con flores no va a Catering (Codex, 2/10/2026): "recepción" en el título
 * la mandaba ahí aunque su categoría original fuera Decoración.
 */
import { classifyGalleryCategories } from '@/components/landing/gallery-media-utils';

describe('La galería clasifica bien la bienvenida', () => {
  it('una recepción con flores respeta su categoría de origen', () => {
    expect(classifyGalleryCategories('Recepción de bienvenida', 'Flores y velas', 'Decoración')).toEqual(['Decoración']);
  });

  it('un plato sigue yendo a Catering', () => {
    expect(classifyGalleryCategories('Finger food de recepción', '', 'Decoración')).toEqual(['Catering']);
  });
});
