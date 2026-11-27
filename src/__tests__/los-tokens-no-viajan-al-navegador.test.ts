import { saveSocialCredentials } from '@/app/actions/social-connections';

jest.mock('@/lib/auth/require-session', () => ({
  requirePermisoAlguno: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue([]),
  writeData: jest.fn().mockResolvedValue(undefined),
}));

describe('Tokens do not travel to browser', () => {
  it('sanitizes public social connections and removes sensitive tokens', async () => {
    const res = await saveSocialCredentials('Instagram', {
      accessToken: 'secret_token_123',
      pageAccessToken: 'secret_page_token_456',
      apiKey: 'secret_api_key_789',
      refreshToken: 'secret_refresh_token',
      pageId: 'page_id_123',
      instagramAccountId: 'ig_acc_456',
      webhookUrl: 'https://webhook.com',
    });
    expect(res.success).toBe(true);
    if (res.connection) {
      expect(res.connection.accessToken).toBeUndefined();
      expect(res.connection.pageAccessToken).toBeUndefined();
      expect(res.connection.apiKey).toBeUndefined();
      expect(res.connection.refreshToken).toBeUndefined();
      expect(res.connection.pageId).toBeUndefined();
      expect(res.connection.instagramAccountId).toBeUndefined();
      expect(res.connection.webhookUrl).toBeUndefined();
    }
  }, 10000);
});
