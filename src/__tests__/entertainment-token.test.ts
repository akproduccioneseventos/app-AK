import {
  createEntertainmentAccessToken,
  verifyEntertainmentAccessToken,
} from '@/lib/auth/entertainment-token';

describe('entertainment access tokens', () => {
  const originalSecret = process.env.AK_ENTERTAINMENT_SECRET;

  beforeAll(() => {
    process.env.AK_ENTERTAINMENT_SECRET = 'entertainment-test-secret-with-enough-entropy';
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.AK_ENTERTAINMENT_SECRET;
    else process.env.AK_ENTERTAINMENT_SECRET = originalSecret;
  });

  it('does not allow a guest token to control the operator station', () => {
    const token = createEntertainmentAccessToken('fiesta_123', 'fotocabina', 'guest');

    expect(verifyEntertainmentAccessToken(token, 'fiesta_123', 'fotocabina', 'guest')).toBe(true);
    expect(verifyEntertainmentAccessToken(token, 'fiesta_123', 'fotocabina', 'operator')).toBe(false);
  });

  it('allows the operator token to complete station-side guest operations', () => {
    const token = createEntertainmentAccessToken('fiesta_123', 'fotocabina', 'operator');

    expect(verifyEntertainmentAccessToken(token, 'fiesta_123', 'fotocabina', 'operator')).toBe(true);
    expect(verifyEntertainmentAccessToken(token, 'fiesta_123', 'fotocabina', 'guest')).toBe(true);
  });

  it('binds a token to its event and module', () => {
    const token = createEntertainmentAccessToken('fiesta_123', 'fotocabina', 'guest');

    expect(verifyEntertainmentAccessToken(token, 'fiesta_999', 'fotocabina', 'guest')).toBe(false);
    expect(verifyEntertainmentAccessToken(token, 'fiesta_123', 'bogue', 'guest')).toBe(false);
  });
});
