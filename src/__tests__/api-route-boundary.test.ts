import fs from 'node:fs';
import path from 'node:path';

const API_ROOT = path.join(process.cwd(), 'src', 'app', 'api');
const PUBLIC_ROUTES = new Set([
  'health/route.ts',
  'imports/confirmed-events-29/route.ts',
  'public-page-assets/[...parts]/route.ts',
  'social-gallery/[fiestaId]/[filename]/route.ts',
  'social-media-assets/[filename]/route.ts',
  'whatsapp/webhook/route.ts',
]);

function listRoutes(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory()
      ? listRoutes(absolute)
      : entry.name === 'route.ts'
        ? [path.relative(API_ROOT, absolute).replaceAll('\\', '/')]
        : [];
  });
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(API_ROOT, relativePath), 'utf8');
}

describe('API route authentication boundary', () => {
  it('classifies every API route as protected or deliberately public', () => {
    const unclassified = listRoutes(API_ROOT).filter((route) => {
      if (PUBLIC_ROUTES.has(route)) return false;
      return !/requireAppSession|hasAppSession|verifySession|CRON_SECRET/.test(read(route));
    });

    expect(unclassified).toEqual([]);
  });

  it('keeps the historic import endpoint permanently disabled', () => {
    const source = read('imports/confirmed-events-29/route.ts');
    expect(source).toContain('{ status: 410 }');
    expect(source).not.toContain('writeData(');
    expect(source).not.toContain('saveFiesta(');
  });

  it('sanitizes all public file-serving path segments', () => {
    for (const route of [
      'public-page-assets/[...parts]/route.ts',
      'social-gallery/[fiestaId]/[filename]/route.ts',
      'social-media-assets/[filename]/route.ts',
    ]) {
      expect(read(route)).toContain('path.basename(');
    }
  });

  it('cryptographically verifies both production WhatsApp providers', () => {
    const source = read('whatsapp/webhook/route.ts');
    expect(source).toContain('verifyMetaWebhookSignature(');
    expect(source).toContain('verifyTwilioWebhookSignature({');
    expect(source).toContain("contentType.includes('application/x-www-form-urlencoded')");
  });
});
