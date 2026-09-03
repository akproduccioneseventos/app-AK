import fs from 'node:fs';
import path from 'node:path';
import { AK_WHATSAPP_NUMBER, buildAkWhatsAppUrl } from '@/lib/public-contact';

describe('public commercial contact integrity', () => {
  const read = (relativePath: string) =>
    fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

  it('uses the verified AK WhatsApp number and encodes messages', () => {
    expect(AK_WHATSAPP_NUMBER).toBe('59898355530');
    expect(buildAkWhatsAppUrl('Hola, quiero cotizar')).toBe(
      'https://wa.me/59898355530?text=Hola%2C%20quiero%20cotizar'
    );
  });

  it.each([
    'src/components/landing/HeroSection.tsx',
    'src/components/landing/LeadCaptureForm.tsx',
    'src/components/promo/PromoWidget.tsx',
    'src/components/public/HeroSection.tsx',
    'src/components/public/PublicNavbar.tsx',
    'src/components/public/CallToActionBanner.tsx',
    'src/components/public/ServiceMenu.tsx',
    'src/app/landing/xv-anos/page.tsx',
    'src/app/landing/bodas/page.tsx',
    'src/app/landing/eventos/page.tsx',
    'src/app/landing/[slug]/page.tsx',
    'src/app/catalogo/[tipo]/page.tsx',
  ])('does not send prospects to the old sample number in %s', (file) => {
    expect(read(file)).not.toContain('59899123456');
  });

  it('sends the active promo badge to a valid CTA instead of a missing anchor', () => {
    const source = read('src/components/landing/HeroSection.tsx');

    expect(source).not.toContain('href="#promo"');
    expect(source).toContain('href={promoHref}');
  });
});
