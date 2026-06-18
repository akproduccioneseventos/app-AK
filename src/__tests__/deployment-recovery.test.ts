import { isDeploymentMismatchError } from '@/lib/deployment-recovery';

describe('deployment recovery', () => {
  it('detects stale Server Action errors after a deployment', () => {
    expect(isDeploymentMismatchError(
      new Error('Failed to find Server Action "abc". This request might be from an older or newer deployment.')
    )).toBe(true);
  });

  it('detects stale JavaScript chunks', () => {
    expect(isDeploymentMismatchError(new Error('ChunkLoadError: Loading chunk 123 failed.'))).toBe(true);
  });

  it('does not reload for ordinary data errors', () => {
    expect(isDeploymentMismatchError(new Error('Firestore permission denied'))).toBe(false);
  });
});
