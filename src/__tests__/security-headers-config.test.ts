jest.mock('@ducanh2912/next-pwa', () => ({
  default: () => (config: unknown) => config,
}));

const nextConfig = require('../../next.config.js');

describe('HTTP security headers', () => {
  it('keeps same-origin media workflows available without covering subdomains', async () => {
    const rules = await nextConfig.headers();
    const catchAllRule = rules.find((rule: { source: string }) => rule.source === '/(.*)');
    const headers = Object.fromEntries(
      catchAllRule.headers.map(({ key, value }: { key: string; value: string }) => [key, value])
    );

    expect(headers['Strict-Transport-Security']).toBe('max-age=31536000');
    expect(headers['Permissions-Policy']).toBe(
      'camera=(self), microphone=(self), geolocation=()'
    );
    expect(headers['X-XSS-Protection']).toBe('0');
  });
});
