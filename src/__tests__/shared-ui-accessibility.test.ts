import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('shared UI accessibility foundation', () => {
  it('keeps primary and icon controls large enough for touch use', () => {
    const button = read('src/components/ui/button.tsx');
    const input = read('src/components/ui/input.tsx');
    const select = read('src/components/ui/select.tsx');

    expect(button).toContain('default: "h-11 px-4 py-2"');
    expect(button).toContain('icon: "h-11 w-11"');
    expect(input).toContain('h-11 w-full');
    expect(input).toContain('text-base');
    expect(select).toContain('flex h-11 w-full');
    expect(select).toContain('min-h-11');
  });

  it('honors reduced-motion preferences in shared controls and loading states', () => {
    const sources = [
      read('src/components/ui/button.tsx'),
      read('src/components/ui/input.tsx'),
      read('src/components/ui/select.tsx'),
      read('src/components/ui/textarea.tsx'),
      read('src/components/ui/skeleton.tsx'),
    ];

    expect(sources.every(source => source.includes('motion-reduce:'))).toBe(true);
    expect(sources.at(-1)).toContain('aria-hidden="true"');
  });
});
