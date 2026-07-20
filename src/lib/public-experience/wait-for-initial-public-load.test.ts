import { waitForInitialPublicLoad } from './wait-for-initial-public-load';

describe('waitForInitialPublicLoad', () => {
  it('reports a completed public load', async () => {
    await expect(waitForInitialPublicLoad(Promise.resolve())).resolves.toBe('settled');
  });

  it('stops the initial wait when the public request stalls', async () => {
    const stalledTask = new Promise<void>(() => undefined);

    await expect(waitForInitialPublicLoad(stalledTask, 5)).resolves.toBe('timeout');
  });

  it('treats a rejected load as settled so callers can render their error state', async () => {
    await expect(waitForInitialPublicLoad(Promise.reject(new Error('offline')))).resolves.toBe('settled');
  });
});
