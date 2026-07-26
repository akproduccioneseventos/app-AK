import fs from 'fs';
import path from 'path';

const sourceRoot = path.resolve(__dirname, '..');

describe('global premium style scope', () => {
  it('styles only the internal app header and leaves public sticky headers independent', () => {
    const styles = fs.readFileSync(path.join(sourceRoot, 'app', 'ak-global-premium.css'), 'utf8');
    const appShell = fs.readFileSync(path.join(sourceRoot, 'components', 'app-shell.tsx'), 'utf8');

    expect(styles).toContain('[data-app-shell-header]');
    expect(styles).not.toMatch(/(^|\n)header\.sticky\s*\{/);
    expect(appShell).toContain('data-app-shell-header');
  });
});
