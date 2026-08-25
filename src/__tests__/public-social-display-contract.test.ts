import fs from 'node:fs';
import path from 'node:path';

const readRoute = (route: string) => fs.readFileSync(path.join(process.cwd(), route), 'utf8');

describe('public social display contract', () => {
  const socialPage = readRoute('src/app/evento/social/[fiestaId]/page.tsx');
  const liveWallPage = readRoute('src/app/evento/muro-en-vivo/[fiestaId]/page.tsx');

  it('keeps the guest feed on public data and skips only background polling', () => {
    expect(socialPage).toContain('getPublicSocialEvent');
    expect(socialPage).toContain('getPublicSocialPosts');
    expect(socialPage).toContain("(!isInitialLoad && document.visibilityState !== 'visible')");
    expect(socialPage).toContain('pollingRef.current');
    expect(socialPage).toContain('waitForInitialPublicLoad(loadTask)');
    expect(socialPage).toContain('withPublicRequestTimeout');
    expect(socialPage).toContain('void requestTask.finally(() => {');
    expect(socialPage).toContain('const loadTask = withPublicRequestTimeout(requestTask)');
    expect(socialPage).not.toContain('getSocialAdminAccess');
  });

  it('keeps the live wall public, projection-safe, and free of kiosk controls', () => {
    expect(liveWallPage).toContain('getPublicSocialEvent');
    expect(liveWallPage).toContain('getPublicSocialPosts');
    expect(liveWallPage).toContain("document.visibilityState !== 'visible'");
    expect(liveWallPage).toContain('pollingRef.current');
    expect(liveWallPage).toContain('waitForInitialPublicLoad(fetchData(true))');
    expect(liveWallPage).toContain('withPublicRequestTimeout(requestTask)');
    expect(liveWallPage).toContain('void requestTask.finally(() => {');
    expect(liveWallPage).toContain('prefers-reduced-motion');
    expect(liveWallPage).toContain('data-testid="live-wall-empty"');
    expect(liveWallPage).toContain('Muro social en vivo');
    expect(liveWallPage).toContain('Escaneá para participar');
    expect(liveWallPage).toContain('posts.length > 0 && settings.marketingTickerEnabled');
    expect(liveWallPage).not.toContain('KioskUnlockButton');
    expect(liveWallPage).not.toContain('ak-bg-particle');
  });
});
