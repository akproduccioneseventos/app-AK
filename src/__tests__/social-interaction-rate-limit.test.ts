jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));

import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { enforceSocialInteractionRateLimit } from '@/lib/commercial/social-interaction-rate-limit';

const mockedEnforcePublicRateLimit = enforcePublicRateLimit as jest.MockedFunction<typeof enforcePublicRateLimit>;

describe('social interaction rate limits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('always applies an event-wide key before the guest-controlled identity', async () => {
    await enforceSocialInteractionRateLimit({
      scope: 'social-dedication-audio',
      fiestaId: 'fiesta-1',
      participantIdentity: 'Nombre que puede cambiar',
      participantLimit: 8,
      eventLimit: 24,
      windowMs: 60_000,
    });

    expect(mockedEnforcePublicRateLimit).toHaveBeenNthCalledWith(1, {
      scope: 'social-dedication-audio-event',
      identity: 'fiesta-1',
      limit: 24,
      windowMs: 60_000,
    });
    expect(mockedEnforcePublicRateLimit).toHaveBeenNthCalledWith(2, {
      scope: 'social-dedication-audio',
      identity: 'fiesta-1|nombre que puede cambiar',
      limit: 8,
      windowMs: 60_000,
    });
  });
});
