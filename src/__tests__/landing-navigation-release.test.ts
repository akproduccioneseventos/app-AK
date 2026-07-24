import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('public landing navigation release contract', () => {
  it('does not pass removed props to LandingNav', () => {
    const callSites = [
      'src/app/page.tsx',
      'src/app/club-uruguay/page.tsx',
      'src/app/landing/[slug]/page.tsx',
      'src/components/landing/EventLandingPage.tsx',
    ];

    for (const callSite of callSites) {
      const source = read(callSite);
      expect(source).not.toMatch(/<LandingNav[^>]*whatsappNumber=/);
    }
  });

  it('returns secondary pages to the matching home section', () => {
    const navigation = read('src/components/landing/LandingNav.tsx');
    const footer = read('src/components/public-footer.tsx');

    expect(navigation).toContain('window.location.assign(`/${href}`)');
    expect(footer).toContain('window.location.assign(`/${href}`)');
  });

  it('opens the public blog without crossing the protected /blog route', () => {
    const navigation = read('src/components/landing/LandingNav.tsx');

    expect(navigation).toContain("href: '/public/blog'");
    expect(navigation).not.toContain("href: '/blog'");
  });
});
