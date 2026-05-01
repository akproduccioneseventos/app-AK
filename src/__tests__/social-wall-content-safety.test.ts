import { validateSocialPost } from '@/lib/social-wall/content-safety';

describe('validateSocialPost', () => {
  it('accepts a normal message', () => {
    const result = validateSocialPost({ message: 'Hermosa noche en AK!' });
    expect(result.ok).toBe(true);
  });

  it('rejects empty posts', () => {
    const result = validateSocialPost({});
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('mensaje o una imagen');
  });

  it('rejects unsupported image formats', () => {
    const result = validateSocialPost({
      imageType: 'application/pdf',
      imageSizeBytes: 100,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('El formato de imagen no esta permitido.');
  });

  it('rejects oversized images', () => {
    const result = validateSocialPost({
      imageType: 'image/jpeg',
      imageSizeBytes: 9 * 1024 * 1024,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('La imagen es demasiado pesada.');
  });
});
