import { metadata } from '@/app/layout';

describe('Google SEO & Structured Data', () => {
  it('defines structured metadata with Salto, Uruguay localization', () => {
    expect(metadata.metadataBase?.toString()).toBe('https://akproducciones.uy/');
    expect(typeof metadata.title === 'object' && metadata.title !== null).toBe(true);
    expect(metadata.openGraph?.locale).toBe('es_UY');
    expect(metadata.openGraph?.siteName).toBe('AK Producciones');
    expect(metadata.twitter?.card).toBe('summary_large_image');
  });
});
