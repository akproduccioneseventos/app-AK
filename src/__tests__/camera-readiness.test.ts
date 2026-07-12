import { isVideoFrameReady } from '@/lib/entertainment/camera-readiness';

describe('entertainment camera readiness', () => {
  it('rejects video elements before a real frame exists', () => {
    expect(isVideoFrameReady({ readyState: 1, videoWidth: 1080, videoHeight: 1920 })).toBe(false);
    expect(isVideoFrameReady({ readyState: 4, videoWidth: 0, videoHeight: 0 })).toBe(false);
  });

  it('accepts a decoded frame with non-zero dimensions', () => {
    expect(isVideoFrameReady({ readyState: 2, videoWidth: 1080, videoHeight: 1920 })).toBe(true);
  });
});
