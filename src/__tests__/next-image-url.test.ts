import { canUseNextImage } from '@/lib/next-image-url';

describe('canUseNextImage', () => {
  it('accepts local and configured public image URLs', () => {
    expect(canUseNextImage('/logo.png')).toBe(true);
    expect(canUseNextImage('https://storage.googleapis.com/ak-bucket/event/photo.jpg')).toBe(true);
    expect(canUseNextImage('https://images.unsplash.com/photo-1')).toBe(true);
  });

  it('keeps runtime and unknown URLs outside the Next optimizer', () => {
    expect(canUseNextImage('data:image/png;base64,abc')).toBe(false);
    expect(canUseNextImage('blob:https://akproducciones.uy/123')).toBe(false);
    expect(canUseNextImage('https://temporary-instagram-cdn.example/photo.jpg')).toBe(false);
    expect(canUseNextImage('')).toBe(false);
  });
});
