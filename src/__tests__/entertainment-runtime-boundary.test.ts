import fs from 'node:fs';
import path from 'node:path';

describe('entertainment runtime boundaries', () => {
  const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

  it.each([
    'src/app/evento/fotocabina/[fiestaId]/page.tsx',
    'src/app/evento/plataforma-360/[fiestaId]/page.tsx',
    'src/app/evento/bogue/[fiestaId]/page.tsx',
    'src/app/evento/espejo-magico/[fiestaId]/page.tsx',
  ])('stops the current camera stream instead of a stale React render in %s', (file) => {
    const source = read(file);
    expect(source).toContain('const streamRef = useRef<MediaStream | null>(null)');
    expect(source).toContain('streamRef.current = mediaStream');
    expect(source).toContain('streamRef.current.getTracks().forEach');
  });

  it('requires an app session for internal entertainment configuration and uploads', () => {
    const source = read('src/app/actions/fiesta/entretenimiento.actions.ts');
    const protectedCalls = source.match(/await requireAppSession\(\);/g) ?? [];

    expect(protectedCalls.length).toBeGreaterThanOrEqual(4);
  });
});
