import { Page, BrowserContext } from '@playwright/test';

/**
 * Authentication helpers for AK Producciones E2E tests.
 *
 * The app uses sessionStorage-based auth (not Firebase Auth for the UI).
 * Session key: ak_producciones_auth_session
 * Valid token must start with: YWtfYXV0aF8 (base64 of 'ak_auth_')
 */

export const SESSION_KEY = 'ak_producciones_auth_session';

/**
 * Generates a valid session token for the app.
 * Token is btoa('ak_auth_<timestamp>_<random>') so it starts with YWtfYXV0aF8.
 */
export function generateSessionToken(): string {
  return Buffer.from(`ak_auth_${Date.now()}_e2etest`).toString('base64');
}

/**
 * Inject a valid auth session via addInitScript so it runs before every page load.
 * This avoids the login redirect without going through the login UI.
 *
 * Usage: call this right after creating a browser context, before any page.goto().
 */
export async function injectAuthSession(context: BrowserContext): Promise<void> {
  const token = generateSessionToken();
  const session = {
    token,
    userId: 'e2e',
    email: 'e2e@test.local',
    role: 'admin',
    modules: ['all'],
    mustChangePassword: false,
    createdAt: Date.now(),
  };
  await context.addInitScript(
    ({ key, sessionJson }: { key: string; sessionJson: string }) => {
      window.localStorage.setItem(key, sessionJson);
      window.sessionStorage.setItem(key, sessionJson);
    },
    { key: SESSION_KEY, sessionJson: JSON.stringify(session) },
  );
}

/**
 * Log in through the actual login UI.
 * Use this when you want to test the login flow itself.
 *
 * Reads credentials from environment variables:
 *   E2E_DEMO_EMAIL    (optional, defaults to akproduccionessalto@gmail.com)
 *   E2E_DEMO_PASSWORD (required)
 */
export async function loginAsDemo(page: Page): Promise<void> {
  const password = process.env.E2E_DEMO_PASSWORD;
  if (!password) {
    throw new Error(
      'E2E_DEMO_PASSWORD environment variable is not set. ' +
        'Set it before running login tests (e.g. E2E_DEMO_PASSWORD=your_password npm run test:e2e).'
    );
  }

  const email = process.env.E2E_DEMO_EMAIL || 'akproduccionessalto@gmail.com';

  await page.goto('/login');
  await page.waitForSelector('[data-testid="login-email"]');
  await page.fill('[data-testid="login-email"]', email);
  await page.fill('[data-testid="login-password"]', password);
  await page.click('[data-testid="login-submit"]');

  // Wait for redirect to home after successful login
  await page.waitForURL('/', { timeout: 10_000 });
}

/**
 * Set the auth session directly in sessionStorage on an already-loaded page.
 * Useful after navigation when addInitScript wasn't set up.
 */
export async function setAuthSession(page: Page): Promise<void> {
  const token = generateSessionToken();
  const session = {
    token,
    userId: 'e2e',
    email: 'e2e@test.local',
    role: 'admin',
    modules: ['all'],
    mustChangePassword: false,
    createdAt: Date.now(),
  };
  await page.evaluate(
    ({ key, sessionJson }: { key: string; sessionJson: string }) => {
      window.localStorage.setItem(key, sessionJson);
      window.sessionStorage.setItem(key, sessionJson);
    },
    { key: SESSION_KEY, sessionJson: JSON.stringify(session) },
  );
}
